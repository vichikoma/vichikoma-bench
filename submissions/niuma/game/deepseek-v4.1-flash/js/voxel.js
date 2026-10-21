/* =============================================================================
 * voxel.js — 体素几何构建器
 * 把一堆立方体（box）合并成一个 BufferGeometry（顶点色 + 逐面烘焙明暗）。
 * 这样每个单位只需 1~4 个 draw call，是保证 30+ 单位同屏 60fps 的关键手段之一。
 * ===========================================================================*/
(function (global) {
  'use strict';

  // 6 个面的顶点（单位立方体，坐标取 ±1），顺序保证逆时针（外法线朝外）
  // shade = 烘焙的面明暗系数，让体素块面在没有强光时也有立体感（Crossy Road 风格）
  var FACES = [
    { n: [0, 1, 0],  v: [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]], shade: 1.00 }, // +Y 顶
    { n: [0, -1, 0], v: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], shade: 0.58 }, // -Y 底
    { n: [1, 0, 0],  v: [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]], shade: 0.86 }, // +X
    { n: [-1, 0, 0], v: [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]], shade: 0.74 }, // -X
    { n: [0, 0, 1],  v: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], shade: 0.94 }, // +Z
    { n: [0, 0, -1], v: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], shade: 0.70 }  // -Z
  ];

  // 临时向量，避免每帧分配
  var _v = null;
  function V(x, y, z) { if (!_v) _v = new THREE.Vector3(); return _v.set(x, y, z); }

  function Builder() {
    this.pos = [];
    this.nor = [];
    this.col = [];
    this.idx = [];
    this.count = 0;
  }

  /** 以 (cx,cy,cz) 为中心、尺寸 (sx,sy,sz) 的立方体 */
  Builder.prototype.box = function (cx, cy, cz, sx, sy, sz, color, opt) {
    opt = opt || {};
    var shadeOn = opt.shade !== false;
    var m = opt.mat || null;
    var hx = sx / 2, hy = sy / 2, hz = sz / 2;
    var r = ((color >> 16) & 255) / 255, g = ((color >> 8) & 255) / 255, b = (color & 255) / 255;
    var dark = opt.dark || 0;   // 额外压暗系数（做阴影面、缝隙）
    var lighten = opt.lighten || 0;
    for (var fi = 0; fi < 6; fi++) {
      var f = FACES[fi];
      var s = shadeOn ? f.shade : 1;
      s *= (1 - dark);
      if (opt.topLight && fi === 0) s *= 1.06;
      if (lighten) s = Math.min(1.35, s * (1 + lighten));
      var base = this.count;
      for (var k = 0; k < 4; k++) {
        var x = f.v[k][0] * hx + cx, y = f.v[k][1] * hy + cy, z = f.v[k][2] * hz + cz;
        var nx = f.n[0], ny = f.n[1], nz = f.n[2];
        if (m) {
          var p = V(x, y, z).applyMatrix4(m);
          x = p.x; y = p.y; z = p.z;
          var nn = V(nx, ny, nz).transformDirection(m);
          nx = nn.x; ny = nn.y; nz = nn.z;
        }
        this.pos.push(x, y, z);
        this.nor.push(nx, ny, nz);
        this.col.push(r * s, g * s, b * s);
      }
      this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      this.count += 4;
    }
    return this;
  };

  /** 用最小/最大角点定义立方体 */
  Builder.prototype.boxAB = function (x0, y0, z0, x1, y1, z1, color, opt) {
    return this.box((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2,
      Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), color, opt);
  };

  /** 沿 Z 轴复制一排小方块（做栅格、齿、栏杆等） */
  Builder.prototype.row = function (cx, cy, cz, sx, sy, sz, color, dz, n, opt) {
    for (var i = 0; i < n; i++) this.box(cx, cy, cz + i * dz, sx, sy, sz, color, opt);
    return this;
  };

  /** 沿 X 轴复制 */
  Builder.prototype.line = function (cx, cy, cz, sx, sy, sz, color, dx, n, opt) {
    for (var i = 0; i < n; i++) this.box(cx + i * dx, cy, cz, sx, sy, sz, color, opt);
    return this;
  };

  Builder.prototype.geo = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeBoundingSphere();
    return g;
  };

  // ---------------------------------------------------------------- 调色板
  // 办公室主题：温暖的木色 + 冷色地毯 + 高饱和的道具配色
  var PAL = {
    // 人
    skin: 0xf6c99a, skinD: 0xdda172, hairB: 0x2c2a33, hairN: 0x6b4b30, hairY: 0xe0b64d,
    // 衣服
    shirtBlue: 0x4a90d9, shirtRed: 0xe0574a, shirtGreen: 0x54b06b, shirtYellow: 0xf0c14b,
    shirtPurple: 0x9a6bd6, shirtWhite: 0xf2f2ee, shirtCyan: 0x49c0c9,
    suit: 0x39445c, suitD: 0x2a3346, tie: 0xd9483f, pants: 0x3d4450,
    // 纸 / 文档
    paper: 0xf7f4e6, paperD: 0xe2dbc2, ink: 0x3a3a44, inkD: 0x8c8c96,
    // 办公
    wood: 0x9c6134, woodD: 0x6f4322, woodL: 0xba7a45,
    steel: 0xa9b1ba, steelD: 0x717a84, dark: 0x33383f, darker: 0x22262c,
    screen: 0x53c6e8, screenD: 0x2b7f9e, green: 0x59b866, greenD: 0x3d8a48,
    red: 0xe04a3a, redD: 0xa93226, orange: 0xf18a2b, orangeD: 0xc9671a,
    yellow: 0xf4c542, yellowD: 0xc79a22, blue: 0x3f7fd0, blueD: 0x2a5c9e,
    purple: 0x9a6bd6, cyan: 0x4ec9d8, pink: 0xef7fa8,
    coffee: 0x5a3620, coffeeL: 0x8a5a34, cream: 0xf1e6cf,
    water: 0x49b6e0, glass: 0xbfe6f2,
    white: 0xf5f5f0, gray: 0x9aa3ad, grayD: 0x6d757e,
    // 场景
    carpetA: 0x77b492, carpetB: 0x6aa987, carpetLine: 0x4e8a6c,
    wall: 0xe8e2d6, wallD: 0xd2cabb, ceiling: 0xf3efe6,
    plant: 0x57ab52, plantD: 0x3f8a3d, pot: 0xc07a4e, potD: 0x9a5c36,
    rug: 0xc9a06b, rugD: 0xa87f4f
  };

  // ------------------------------------------------------------------ 材质
  // 全模型共用少量材质，减少状态切换
  var MATS = {};
  function initMaterials() {
    MATS.solid = new THREE.MeshLambertMaterial({ vertexColors: true });
    MATS.glass = new THREE.MeshLambertMaterial({
      vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide
    });
    MATS.flat = new THREE.MeshBasicMaterial({ vertexColors: true });
    // 拖拽幽灵 / 半透明预览
    MATS.ghost = new THREE.MeshLambertMaterial({
      vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false
    });
    MATS.ghostBad = new THREE.MeshLambertMaterial({
      vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false
    });
    MATS.decal = new THREE.MeshLambertMaterial({
      vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false
    });
  }

  // ------------------------------------------------------------- Y 轴旋转阵
  var _m4 = null;
  function rotY(deg) {
    if (!_m4) _m4 = new THREE.Matrix4();
    return _m4.makeRotationY(deg * Math.PI / 180);
  }
  var _m4b = null;
  function rotZ(deg) {
    if (!_m4b) _m4b = new THREE.Matrix4();
    return _m4b.makeRotationZ(deg * Math.PI / 180);
  }
  var _m4c = null;
  function rotX(deg) {
    if (!_m4c) _m4c = new THREE.Matrix4();
    return _m4c.makeRotationX(deg * Math.PI / 180);
  }

  global.Vox = {
    Builder: Builder, PAL: PAL, FACES: FACES,
    initMaterials: initMaterials, MATS: MATS,
    rotY: rotY, rotZ: rotZ, rotX: rotX
  };
})(window);
