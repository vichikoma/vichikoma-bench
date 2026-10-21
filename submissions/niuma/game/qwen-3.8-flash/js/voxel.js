/* ============================================================
 * voxel.js —— 体素几何底层
 * 手写顶点色立方体合并器：每个模型 → 极少量 BufferGeometry
 * 面着色自带明暗（顶亮/底暗），配合 Lambert 光照得到 Crossy 式块面
 * ============================================================ */
'use strict';

/* ---------- 调色板：暖调办公室 + 糖果撞色（自创风格方向） ---------- */
const PAL = {
  ink:      0x2e3440, paper:   0xf6f8fa, paperEdge:0xdde3ea,
  wood:     0xe0a86e, woodDk:  0xb07f4d, woodDeep: 0x8a5f38,
  metal:    0xb8c2cc, metalDk: 0x8d99a6,
  coral:    0xff7a59, coralDk: 0xd95b3d,
  cyan:     0x3ec6dd, cyanDk:  0x2a9ab2, water:   0x69d7ef,
  yellow:   0xffd23f, yellowDk:0xe0a90f,
  green:    0x6fd06f, greenDk: 0x4ba84b, leaf:    0x58b967,
  purple:   0x9b7ede, pink:    0xff9fb2,
  red:      0xe4443c, redDk:   0xb02d27,
  skin:     0xf2c299, skinDk:  0xd9a06f,
  navy:     0x3a4a6b, navyDk:  0x2b3852,
  glass:    0xbfe8ef, screen:  0x35e0c8, screenDk: 0x1fb8a4,
  carpetA:  0xeef2f7, carpetB: 0xccd9e6,
  flame:    0xffa63f, flameHot:0xffe066,
  frost:    0xbdeeff,
};

/* ---------- 顶点色几何合并器 ---------- */
class Vox {
  constructor() { this.p = []; this.n = []; this.c = []; }
  // 面法线 + 4角点 + 明暗系数（烘焙方向光感）
  static FACES = [
    { n: [0, 1, 0],  v: [[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]],  s: 1.00 },   // top
    { n: [0,-1, 0],  v: [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]], s: 0.60 },// bottom
    { n: [0, 0, 1],  v: [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],  s: 0.92 },   // front(+z 朝相机)
    { n: [0, 0,-1],  v: [[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]], s: 0.72 },// back
    { n: [1, 0, 0],  v: [[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]],  s: 0.84 },   // right(+x)
    { n: [-1,0, 0],  v: [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]], s: 0.80 },// left(-x)
  ];
  /**
   * 追加一个立方体（中心坐标 x,y,z，尺寸 w,h,d，颜色 hex，可选亮度微调 mul）
   */
  box(x, y, z, w, h, d, color, mul = 1) {
    const hx = w / 2, hy = h / 2, hz = d / 2;
    const col = new THREE.Color(color);
    col.multiplyScalar(mul);
    const r = col.r, g = col.g, b = col.b;
    for (const f of Vox.FACES) {
      const vs = [f.v[0], f.v[1], f.v[2], f.v[0], f.v[2], f.v[3]]; // 两个三角形
      for (const c of vs) {
        this.p.push(x + c[0] * hx, y + c[1] * hy, z + c[2] * hz);
        this.n.push(f.n[0], f.n[1], f.n[2]);
        const s = f.s;
        this.c.push(r * s, g * s, b * s);
      }
    }
    return this;
  }
  get count() { return this.p.length / 3; }
  geom() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    return g;
  }
}

const VOX = {
  /** 由 [x,y,z,w,h,d,color] 列表生成几何 */
  geom(boxes) { const v = new Vox(); for (const b of boxes) v.box(...b); return v.geom(); },
  /** 生成一个网格（共享 Lambert 材质，逐实例克隆以支持受击闪色/幽灵透明） */
  mesh(boxes, opts = {}) {
    const m = new THREE.MeshLambertMaterial({ vertexColors: true });
    if (opts.trans) { m.transparent = true; m.opacity = opts.opacity ?? 0.5; m.depthWrite = false; }
    const mesh = new THREE.Mesh(VOX.geom(boxes), m);
    if (opts.name) mesh.name = opts.name;
    return mesh;
  },
};

/**
 * 模型规格 => THREE.Group
 * spec = { parts:[ { name?, pivot?[x,y,z], trans?, boxes:[[x,y,z,w,h,d,color]...] } ] }
 * 返回 { group, parts:{name:mesh} }
 */
function buildModel(spec) {
  const group = new THREE.Group();
  const parts = {};
  for (const pt of spec.parts) {
    const mesh = VOX.mesh(pt.boxes, { trans: pt.trans, opacity: pt.opacity, name: pt.name });
    if (pt.pivot) mesh.position.set(...pt.pivot);
    if (pt.name) parts[pt.name] = mesh;
    group.add(mesh);
  }
  return { group, parts };
}

/** 幽灵预览：整套模型半透明化（拖拽用） */
function ghostify(group) {
  group.traverse(o => {
    if (o.isMesh) {
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = 0.55;
      o.material.depthWrite = false;
    }
  });
  return group;
}

/* ---------- 简易工具：整组建阴影 ---------- */
function enableShadow(obj, cast = true, receive = false) {
  obj.traverse(o => { if (o.isMesh) { o.castShadow = cast; o.receiveShadow = receive; } });
  return obj;
}
