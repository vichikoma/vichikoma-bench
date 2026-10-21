/* models.js — 体素模型工厂
 * 所有几何体由代码生成（BoxGeometry 式手写顶点），顶点色着色，无任何贴图。
 * 每个模型是一个 Group，userData.parts 里保存可动画的子部件（按名索引）。
 * 约定：模型原点在格子中心、底面 y=0，朝向 +z（镜头方向）。
 */

// 顶点收集器：把若干立方体合并进一个 BufferGeometry（一个模型 = 一次 draw call）
class VB {
  constructor() { this.p = []; this.n = []; this.c = []; this.i = []; this.count = 0; }
  // (cx, cy, cz) = 底面中心；w/h/d = 尺寸
  box(cx, cy, cz, w, h, d, color) {
    const col = new THREE.Color(color);
    const cen = [cx, cy + h / 2, cz];
    const half = [w / 2, h / 2, d / 2];
    for (let a = 0; a < 3; a++) {
      for (const s of [-1, 1]) {
        const u0 = (a + 1) % 3, v0 = (a + 2) % 3;
        // 保证 U×V 指向法线方向 → 三角形逆时针朝外
        const U = s > 0 ? u0 : v0, V = s > 0 ? v0 : u0;
        const base = cen.slice();
        base[a] += s * half[a];
        const start = this.count;
        for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          const pt = base.slice();
          pt[U] += su * half[U];
          pt[V] += sv * half[V];
          this.p.push(pt[0], pt[1], pt[2]);
          this.n.push(a === 0 ? s : 0, a === 1 ? s : 0, a === 2 ? s : 0);
          this.c.push(col.r, col.g, col.b);
        }
        this.i.push(start, start + 1, start + 2, start, start + 2, start + 3);
        this.count += 4;
      }
    }
    return this;
  }
  build(opts = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.i);
    const m = new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: !!opts.transparent,
      opacity: opts.opacity === undefined ? 1 : opts.opacity,
      depthWrite: opts.depthWrite !== false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = opts.shadow !== false;
    mesh.receiveShadow = true;
    return mesh;
  }
}

// 组装多部件模型。spec: { 部件名: (vb)=>{...} }；名字以 $ 开头的部件为半透明（玻璃/水）。
function assemble(spec, opts = {}) {
  const g = new THREE.Group();
  g.userData.parts = {};
  for (const key in spec) {
    const glass = key[0] === '$';
    const name = glass ? key.slice(1) : key;
    const vb = new VB();
    spec[key](vb);
    const mo = Object.assign({}, opts);
    if (glass) { mo.transparent = true; mo.opacity = 0.35; mo.depthWrite = false; }
    if (opts.ghost) { mo.transparent = true; mo.opacity = 0.5; mo.shadow = false; }
    const mesh = vb.build(mo);
    mesh.name = name;
    g.add(mesh);
    g.userData.parts[name] = mesh;
  }
  return g;
}

/* ============ 我方单位（打工人武器库） ============ */
const UNIT_MODELS = {

  // 咖啡机：经济单位，蒸汽会飘
  coffee(o) {
    return assemble({
      base: vb => vb.box(0, 0, 0, 0.95, 0.12, 0.72, 0x4b5563),
      body: vb => vb.box(0, 0.12, 0, 0.8, 0.6, 0.6, 0xeae6dd).box(0, 0.7, 0, 0.84, 0.08, 0.64, 0xc8473d),
      spout: vb => vb.box(0, 0.22, 0.34, 0.5, 0.08, 0.1, 0x2b2f36).box(-0.2, 0.1, 0.36, 0.06, 0.04, 0.06, 0x2b2f36),
      cup: vb => vb.box(0, 0.12, 0.4, 0.26, 0.16, 0.22, 0xffffff).box(0, 0.26, 0.4, 0.22, 0.02, 0.18, 0x6b3e1f),
      light: vb => vb.box(0.28, 0.45, 0.31, 0.12, 0.08, 0.02, 0x67e8f9),
      steam: vb => vb.box(-0.12, 0.85, 0, 0.14, 0.14, 0.14, 0xffffff).box(0.08, 0.98, 0.04, 0.12, 0.12, 0.12, 0xf5f5f5),
    }, o);
  },

  // DDL 加农炮：基础直线输出，炮身挂大红倒计时牌
  cannon(o) {
    return assemble({
      base: vb => vb.box(0, 0, 0, 0.9, 0.22, 0.8, 0x4b5563).box(-0.45, 0, -0.42, 0.1, 0.1, 0.1, 0x111111).box(0.4, 0, 0.36, 0.1, 0.1, 0.1, 0x111111),
      carriage: vb => vb.box(0, 0.22, 0, 0.7, 0.2, 0.7, 0x8a6d3b),
      barrel: vb => vb.box(0.25, 0.5, 0, 0.7, 0.22, 0.22, 0x2b2f36).box(0.6, 0.5, 0, 0.08, 0.28, 0.28, 0xf59e0b),
      post: vb => vb.box(-0.3, 0.42, 0, 0.1, 0.5, 0.1, 0x555555),
      sign: vb => vb.box(-0.3, 0.85, 0, 0.46, 0.34, 0.06, 0xdc2626).box(-0.3, 1.0, 0.035, 0.3, 0.07, 0.01, 0xfde047).box(-0.3, 0.88, 0.035, 0.2, 0.06, 0.01, 0xfde047),
    }, o);
  },

  // 背锅侠：纯肉盾，背着一口大锅（锅在身前挡枪）
  wall(o) {
    return assemble({
      legs: vb => vb.box(-0.1, 0, 0, 0.13, 0.25, 0.16, 0x1e3a8a).box(0.1, 0, 0, 0.13, 0.25, 0.16, 0x1e3a8a),
      torso: vb => vb.box(0, 0.25, 0, 0.4, 0.4, 0.3, 0x3b82f6),
      head: vb => vb.box(0, 0.65, 0, 0.34, 0.34, 0.34, 0xf2c9a0).box(0, 0.92, -0.02, 0.36, 0.08, 0.36, 0x3f2a1a),
      eyes: vb => vb.box(0.04, 0.7, 0.175, 0.05, 0.05, 0.02, 0x111111).box(-0.1, 0.7, 0.175, 0.05, 0.05, 0.02, 0x111111),
      pot: vb => vb.box(0.2, 0.25, 0, 0.1, 0.7, 0.7, 0x2d2d2d).box(0.2, 0.25, 0, 0.13, 0.06, 0.74, 0x9ca3af),
      sweat: vb => vb.box(-0.2, 0.8, 0.18, 0.04, 0.08, 0.02, 0x7dd3fc),
    }, o);
  },

  // 摸鱼鱼缸：输出 + 减速。鱼会游，水会晃
  fishbowl(o) {
    return assemble({
      desk: vb => vb.box(0, 0, 0, 0.9, 0.25, 0.7, 0x8b5e3c),
      $bowl: vb => vb.box(0, 0.25, 0, 0.62, 0.55, 0.62, 0xbae6fd),
      water: vb => vb.box(0, 0.25, 0, 0.56, 0.32, 0.56, 0x38bdf8),
      fish: vb => vb.box(0.08, 0.42, 0.04, 0.2, 0.12, 0.14, 0xfb923c).box(-0.02, 0.45, 0.04, 0.06, 0.06, 0.06, 0xfb923c),
      sign: vb => vb.box(-0.3, 0.25, 0.34, 0.26, 0.14, 0.02, 0xfef08a),
    }, o);
  },

  // 辞职信：放置后 1 秒引爆清场；纸张会抖（引信倒计时）
  resign(o) {
    return assemble({
      stand: vb => vb.box(0, 0, 0, 0.6, 0.1, 0.5, 0x6b7280).box(0, 0.1, 0, 0.1, 0.2, 0.1, 0x6b7280),
      paper: vb => vb.box(0, 0.3, 0, 0.56, 0.8, 0.05, 0xfffbeb).box(0, 0.22, 0.03, 0.4, 0.04, 0.01, 0x94a3b8).box(0, 0.35, 0.03, 0.4, 0.04, 0.01, 0x94a3b8).box(0, 0.48, 0.03, 0.4, 0.04, 0.01, 0x94a3b8),
      stamp: vb => vb.box(0.12, 0.7, 0.03, 0.22, 0.2, 0.02, 0xdc2626),
    }, o);
  },

  // 假装在忙：椅子 + 披着的外套 + 常亮屏幕；武装后屏幕发蓝光
  fakebusy(o) {
    return assemble({
      chair: vb => vb.box(0, 0.3, 0, 0.5, 0.1, 0.5, 0x111827).box(-0.22, 0.4, 0, 0.08, 0.5, 0.5, 0x111827).box(0, 0, 0, 0.12, 0.3, 0.12, 0x374151),
      jacket: vb => vb.box(-0.2, 0.42, 0, 0.12, 0.3, 0.52, 0xf97316),
      monitor: vb => vb.box(0.3, 0.1, 0, 0.1, 0.2, 0.1, 0x333333).box(0.3, 0.25, 0, 0.06, 0.45, 0.6, 0x1f2937),
      screen: vb => vb.box(0.34, 0.27, 0, 0.02, 0.4, 0.54, 0x64748b),
    }, o);
  },

  // 碎纸机（自创）：咬住它的敌人会被反咬；纸条一直在吐
  shredder(o) {
    return assemble({
      body: vb => vb.box(0, 0, 0, 0.8, 0.6, 0.7, 0x4b5563).box(0, 0.6, 0, 0.6, 0.05, 0.12, 0x111111),
      strips: vb => vb.box(-0.12, 0.66, 0.02, 0.1, 0.3, 0.02, 0xffffff).box(0.02, 0.66, 0.02, 0.1, 0.36, 0.02, 0xf8fafc).box(0.16, 0.66, 0.02, 0.1, 0.26, 0.02, 0xffffff),
      led: vb => vb.box(0.28, 0.3, 0.36, 0.1, 0.1, 0.02, 0x22c55e),
    }, o);
  },

  // 凌晨三点的抄送（自创）：笔记本屏幕上的月亮 + 红色邮件角标，会一闪一闪
  email(o) {
    return assemble({
      base: vb => vb.box(0, 0, 0, 0.92, 0.08, 0.6, 0x334155),
      screen: vb => vb.box(0, 0.08, 0.28, 0.9, 0.7, 0.06, 0x0f172a),
      moon: vb => vb.box(-0.16, 0.42, 0.32, 0.2, 0.2, 0.02, 0xfde68a).box(-0.1, 0.48, 0.33, 0.12, 0.2, 0.02, 0x0f172a),
      mail: vb => vb.box(0.2, 0.28, 0.32, 0.3, 0.2, 0.02, 0xef4444),
    }, o);
  },
};

/* ============ 敌方（工作） ============ */
const ENEMY_MODELS = {

  // 普通需求：一沓需求文档
  normal() {
    return assemble({
      stack: vb => vb.box(0, 0, 0, 0.7, 0.35, 0.5, 0xf1f5f9),
      top: vb => vb.box(0, 0.35, 0, 0.72, 0.04, 0.52, 0xffffff),
      lines: vb => vb.box(-0.1, 0.4, 0.1, 0.4, 0.02, 0.04, 0x94a3b8).box(-0.1, 0.4, -0.02, 0.4, 0.02, 0.04, 0x94a3b8).box(-0.1, 0.4, -0.14, 0.3, 0.02, 0.04, 0x94a3b8),
      clip: vb => vb.box(0.28, 0.3, 0, 0.04, 0.2, 0.3, 0x3b82f6),
    });
  },

  // 加急需求：冒火的需求文档（火苗会抖）
  rush() {
    return assemble({
      stack: vb => vb.box(0, 0, 0, 0.7, 0.35, 0.5, 0xfb923c),
      top: vb => vb.box(0, 0.35, 0, 0.66, 0.04, 0.46, 0xfff7ed),
      flame: vb => vb.box(-0.2, 0.39, 0, 0.18, 0.14, 0.3, 0xef4444).box(0.1, 0.39, 0.02, 0.2, 0.2, 0.26, 0xef4444).box(0.1, 0.55, 0.02, 0.1, 0.12, 0.12, 0xfacc15),
      stamp: vb => vb.box(0, 0.12, 0.26, 0.4, 0.12, 0.02, 0xffffff),
    });
  },

  // 老板：唯一的人形敌人，公文包在手，慢吞吞走
  boss() {
    return assemble({
      legs: vb => vb.box(-0.12, 0, 0, 0.18, 0.5, 0.22, 0x1f2937).box(0.12, 0, 0, 0.18, 0.5, 0.22, 0x1f2937),
      torso: vb => vb.box(0, 0.5, 0, 0.5, 0.6, 0.34, 0x111827),
      shirt: vb => vb.box(0, 0.56, 0.17, 0.14, 0.4, 0.02, 0xffffff).box(0, 0.5, 0.19, 0.07, 0.32, 0.02, 0xdc2626),
      head: vb => vb.box(0, 1.1, 0, 0.36, 0.36, 0.36, 0xf2c9a0).box(0, 1.3, -0.02, 0.38, 0.08, 0.36, 0xd1d5db),
      eyes: vb => vb.box(0.08, 1.14, 0.185, 0.05, 0.04, 0.02, 0x111111).box(-0.08, 1.14, 0.185, 0.05, 0.04, 0.02, 0x111111),
      briefcase: vb => vb.box(0.36, 0.3, 0, 0.16, 0.3, 0.22, 0x78350f).box(0.36, 0.56, 0, 0.06, 0.06, 0.06, 0x451a03),
      arm: vb => vb.box(0.34, 0.5, 0, 0.12, 0.5, 0.14, 0x111827),
    });
  },

  // 临时会议：日历邀请（会跳过第一个挡路的单位）
  meeting() {
    return assemble({
      stand: vb => vb.box(0, 0, 0, 0.3, 0.06, 0.2, 0x6b7280).box(0, 0.06, 0, 0.1, 0.16, 0.1, 0x6b7280),
      cal: vb => vb.box(0, 0.22, 0, 0.74, 0.8, 0.12, 0xffffff),
      header: vb => vb.box(0, 0.8, 0.0, 0.74, 0.16, 0.13, 0xef4444).box(-0.22, 0.92, 0.02, 0.06, 0.14, 0.06, 0x555555).box(0.22, 0.92, 0.02, 0.06, 0.14, 0.06, 0x555555),
      grid: vb => vb.box(-0.2, 0.35, 0.07, 0.14, 0.1, 0.02, 0x3b82f6).box(0.05, 0.35, 0.07, 0.14, 0.1, 0.02, 0x94a3b8).box(0.2, 0.2, 0.07, 0.14, 0.1, 0.02, 0x94a3b8),
    });
  },

  // 例会：行走的会议白板（每 10 秒在本行空格生成一个普通需求）
  sync() {
    return assemble({
      legs: vb => vb.box(-0.35, 0, 0, 0.07, 0.4, 0.07, 0x555555).box(0.35, 0, 0, 0.07, 0.4, 0.07, 0x555555),
      frame: vb => vb.box(0, 0.4, 0, 0.92, 0.72, 0.08, 0x7c3aed),
      board: vb => vb.box(0, 0.42, 0.05, 0.8, 0.6, 0.02, 0xf8fafc),
      marks: vb => vb.box(-0.2, 0.7, 0.07, 0.3, 0.05, 0.02, 0x3b82f6).box(-0.2, 0.58, 0.07, 0.5, 0.05, 0.02, 0xef4444).box(-0.2, 0.46, 0.07, 0.38, 0.05, 0.02, 0x22c55e),
      tag: vb => vb.box(0.3, 0.9, 0.05, 0.3, 0.12, 0.04, 0xfde047),
    });
  },
};

/* 掉落的咖啡杯（天上掉下的咖啡因） */
function makeCoffeeCupModel() {
  return assemble({
    cup: vb => vb.box(0, 0, 0, 0.42, 0.42, 0.42, 0xffffff).box(0, 0.4, 0, 0.44, 0.06, 0.44, 0x6b3e1f),
    band: vb => vb.box(0, 0.18, 0, 0.44, 0.08, 0.44, 0xc8473d),
    $halo: vb => vb.box(0, -0.12, 0, 0.9, 0.02, 0.9, 0xfde047),
  });
}
