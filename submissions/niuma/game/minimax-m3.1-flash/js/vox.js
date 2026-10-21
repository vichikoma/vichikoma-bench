/* ============================================================
 *  vox.js —— 体素建模工具 + 全部单位 / 敌人 / 场景模型
 *  所有几何体均由代码生成（无任何贴图 / 模型文件），
 *  每个模型把若干立方体合并为 1 个带顶点色的 BufferGeometry，
 *  以此把 draw call 压到最低（一个单位 = 1 次绘制）。
 * ============================================================ */
'use strict';

/* ---------- 体素累加器 ---------- */
function VB() { this.p = []; this.n = []; this.c = []; this.i = []; this.v = 0; }

/* 盒体，(x,y,z) 为中心，w/h/d 为尺寸。6 个面各 4 顶点，共 24 顶点/盒。 */
VB.prototype.b = function (x, y, z, w, h, d, col) {
  var hw = w / 2, hh = h / 2, hd = d / 2;
  var c = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
    [-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]
  ];
  var faces = [
    [0, 0, 1, [4, 5, 6, 7]],  /* +Z */
    [0, 0, -1, [1, 0, 3, 2]],  /* -Z */
    [1, 0, 0, [5, 1, 2, 6]],  /* +X */
    [-1, 0, 0, [0, 4, 7, 3]],  /* -X */
    [0, 1, 0, [7, 6, 2, 3]],  /* +Y */
    [0, -1, 0, [0, 1, 5, 4]]   /* -Y */
  ];
  var r = new THREE.Color(col);
  for (var f = 0; f < 6; f++) {
    var nr = faces[f], q = nr[3], base = this.v;
    for (var k = 0; k < 4; k++) {
      var v = c[q[k]];
      this.p.push(x + v[0], y + v[1], z + v[2]);
      this.n.push(nr[0], nr[1], nr[2]);
      this.c.push(r.r, r.g, r.b);
    }
    this.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
    this.v += 4;
  }
  return this;
};

VB.prototype.build = function () {
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
  g.setIndex(this.i);
  g.computeBoundingSphere();
  return g;
};

/* ---------- 像素文字（体素字） ---------- */
var FONT = {
  '辞': ['..#...#', '.#.#..#', '.#.#..#', '###..#', '.#...#', '###..#', '.#...#'],
  '会': ['..###..', '.#####.', '###.###', '..###..', '..#.#..', '.#####.', '.#...#.'],
  '忙': ['.#..###', '#.#.#..', '.#.#...', '.#.###.', '.#....#', '.#....#', '.#.####'],
  'D': ['###', '#.#', '#.#', '#.#', '###'],
  'L': ['#..', '#..', '#..', '#..', '###'],
  'C': ['.##', '#..', '#..', '#..', '.##'],
  'O': ['###', '#.#', '#.#', '#.#', '###'],
  'E': ['###', '#..', '###', '#..', '###'],
  '!': ['#', '#', '#', '.', '#'],
  '?': ['##.', '..#', '.#.', '...', '.#.']
};
/* 把字画到 builder 上。plane: 'front'(+Z) 'back'(-Z) 'top'(+Y) 'side'(+X) */
VB.prototype.text = function (str, cx, cy, cz, px, col, plane, depth) {
  depth = depth || 0.03;
  var total = 0, i, k;
  for (i = 0; i < str.length; i++) {
    var g = FONT[str[i]];
    if (!g) continue;
    total += (g[0].length + 1) * px;
  }
  total -= px;
  var x0 = cx - total / 2;
  for (i = 0; i < str.length; i++) {
    var gl = FONT[str[i]];
    if (!gl) continue;
    var rows = gl.length, cols = gl[0].length;
    for (k = 0; k < rows; k++) {
      for (var j = 0; j < cols; j++) {
        if (gl[k][j] !== '#') continue;
        var u = x0 + j * px + px / 2;
        var v = cy + ((rows - 1) / 2 - k) * px + px / 2;
        if (plane === 'front') this.b(u, v, cz + depth / 2, px, px, depth, col);
        else if (plane === 'back') this.b(u, v, cz - depth / 2, px, px, depth, col);
        else if (plane === 'top') this.b(u, cy + depth / 2, v, px, depth, px, col);
        else this.b(cx + depth / 2, v, -u, depth, px, px, col);
      }
    }
    x0 += (cols + 1) * px;
  }
  return this;
};

/* ---------- 材质 ---------- */
var VOX_MAT = null, VOX_GLOW = null;
function initMats() {
  VOX_MAT = new THREE.MeshLambertMaterial({ vertexColors: true });
  VOX_GLOW = new THREE.MeshBasicMaterial({ vertexColors: true });
}
function voxMesh(vb, glow) {
  var m = new THREE.Mesh(vb.build(), glow ? VOX_GLOW : VOX_MAT);
  m.castShadow = !glow;
  m.receiveShadow = !glow;
  return m;
}
function partMesh(vb, glow) { return voxMesh(vb, glow); }

/* 调色板 */
var C = {
  white: '#f4f1e8', paper: '#fbfaf5', paper2: '#e6e2d6', ink: '#5a6270',
  gray: '#8b93a0', gray2: '#5d6673', dark: '#3a414c', darker: '#262b33',
  red: '#e8503a', red2: '#b8331f', orange: '#f2913a', amber: '#ffcf5a',
  green: '#5cb85c', green2: '#3d8f3d', teal: '#37b3b8', cyan: '#8fe6ef',
  wood: '#c78f52', wood2: '#a06f3c', skin: '#f0c39a', skin2: '#d9a377',
  blue: '#4a7fd0', navy: '#2f4f8a', yellow: '#ffd54a', purple: '#9a6bd6'
};

/* ============================================================
 *  我方单位模型
 *  每个函数返回 THREE.Group，group.userData.parts 为可动部件
 * ============================================================ */

function M_coffee() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.06, 0, 0.62, 0.12, 0.54, C.dark);
  b.b(0, 0.35, 0, 0.60, 0.46, 0.52, '#5f6a78');
  b.b(0, 0.62, 0.04, 0.44, 0.22, 0.40, C.cyan);           // 水箱
  b.b(0, 0.75, 0.04, 0.30, 0.06, 0.28, '#ffffff');        // 水箱盖
  b.b(-0.14, 0.20, 0.28, 0.16, 0.14, 0.06, C.red);        // 出水口
  b.b(0.16, 0.18, 0.30, 0.10, 0.05, 0.04, C.yellow);      // 面板灯
  b.b(0.10, 0.30, 0.29, 0.16, 0.10, 0.03, C.darker);      // 面板
  b.b(-0.20, 0.14, -0.02, 0.18, 0.16, 0.18, '#e8e3d8');   // 咖啡壶
  b.b(-0.20, 0.30, -0.02, 0.10, 0.04, 0.10, C.dark);
  b.b(-0.02, 0.10, 0.26, 0.14, 0.10, 0.12, C.paper);      // 杯子
  b.b(-0.02, 0.16, 0.26, 0.11, 0.03, 0.09, '#6b4423');
  g.add(voxMesh(b));
  /* 蒸汽（动） */
  var s = new THREE.Group(), sb = new VB();
  for (var i = 0; i < 3; i++) {
    sb.b(-0.02, 0.28 + i * 0.16, 0.26, 0.09, 0.09, 0.09, '#ffffff');
  }
  s.add(voxMesh(sb, true)); s.position.set(0, 0, 0);
  s.userData.anim = 'steam';
  g.add(s); g.userData.parts = { steam: s };
  return g;
}

function M_ddl() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.09, 0, 0.58, 0.18, 0.52, C.dark);
  b.b(-0.22, 0.09, 0.26, 0.14, 0.20, 0.10, C.darker);
  b.b(-0.22, 0.09, -0.26, 0.14, 0.20, 0.10, C.darker);
  b.b(0.02, 0.30, 0, 0.42, 0.26, 0.44, C.gray2);
  b.b(0.30, 0.44, 0, 0.42, 0.20, 0.20, C.gray);          // 炮管
  b.b(0.52, 0.44, 0, 0.10, 0.24, 0.24, C.dark);          // 炮口
  b.b(0.02, 0.44, 0, 0.30, 0.16, 0.30, C.red2);          // 炮身红漆
  b.b(-0.06, 0.44, -0.10, 0.16, 0.10, 0.10, C.yellow);   // 配重
  /* DDL 倒计时牌 */
  b.b(-0.10, 0.66, -0.12, 0.08, 0.34, 0.08, C.dark);
  b.b(-0.10, 0.94, -0.12, 0.52, 0.30, 0.07, C.paper);
  b.text('DDL', -0.10, 0.94, -0.12, 0.045, C.red, 'front');
  b.text('DDL', -0.10, 0.94, -0.12, 0.045, C.red, 'back');
  g.add(voxMesh(b));
  return g;
}

function M_scapegoat() {
  var g = new THREE.Group(), b = new VB();
  b.b(-0.11, 0.17, 0.02, 0.16, 0.34, 0.18, C.navy);      // 腿
  b.b(0.11, 0.17, 0.02, 0.16, 0.34, 0.18, C.navy);
  b.b(0, 0.56, 0, 0.44, 0.44, 0.28, C.blue);             // 衬衫
  b.b(0, 0.60, 0.15, 0.08, 0.24, 0.03, C.red);            // 领带
  b.b(-0.28, 0.58, 0.04, 0.12, 0.34, 0.14, C.blue);      // 手臂
  b.b(0.28, 0.58, 0.04, 0.12, 0.34, 0.14, C.blue);
  b.b(0, 0.92, 0, 0.30, 0.28, 0.28, C.skin);             // 头
  b.b(0, 1.06, -0.01, 0.32, 0.10, 0.30, '#2b2b2b');      // 头发
  b.b(0.07, 0.94, 0.15, 0.05, 0.05, 0.02, C.darker);     // 眼
  b.b(-0.07, 0.94, 0.15, 0.05, 0.05, 0.02, C.darker);
  /* 背上的大锅（比身体宽，从正面两侧露出） */
  b.b(0, 0.60, -0.24, 0.68, 0.56, 0.18, '#4a4f58');
  b.b(0, 0.88, -0.24, 0.72, 0.10, 0.22, '#6a7078');
  b.b(-0.30, 0.66, -0.24, 0.10, 0.24, 0.20, '#33383f');
  g.add(voxMesh(b));
  return g;
}

function M_tank() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.06, 0, 0.66, 0.12, 0.58, C.dark);
  b.b(0, 0.18, 0, 0.62, 0.40, 0.54, '#bfeef5');          // 玻璃缸
  b.b(0, 0.24, 0, 0.54, 0.26, 0.46, '#6ccfe0');          // 水
  b.b(0, 0.39, 0, 0.66, 0.06, 0.58, '#4c5a63');          // 顶框
  b.b(0, 0.16, 0, 0.66, 0.06, 0.58, '#4c5a63');
  b.b(-0.33, 0.28, 0, 0.05, 0.40, 0.58, '#4c5a63');
  b.b(0.33, 0.28, 0, 0.05, 0.40, 0.58, '#4c5a63');
  b.b(0, 0.42, 0.30, 0.26, 0.05, 0.05, C.green);         // 水草
  b.b(0.20, 0.42, -0.18, 0.05, 0.06, 0.05, C.green);
  b.b(-0.24, 0.06, 0.22, 0.14, 0.14, 0.12, C.paper);     // 摸鱼手册
  g.add(voxMesh(b));
  /* 两条小鱼 + 气泡（动） */
  var f = new THREE.Group(), fb = new VB();
  fb.b(0, 0, 0, 0.16, 0.08, 0.06, C.orange);
  fb.b(-0.10, 0, 0, 0.06, 0.06, 0.04, C.red);
  f.add(voxMesh(fb));
  f.userData.anim = 'fish'; f.position.set(0.12, 0.28, 0.14);
  var f2 = f.clone(); f2.position.set(-0.14, 0.20, -0.12); f2.scale.setScalar(0.8);
  var bub = new THREE.Group(), bb = new VB();
  bb.b(0, 0, 0, 0.05, 0.05, 0.05, '#ffffff'); bb.b(0, 0.09, 0, 0.04, 0.04, 0.04, '#ffffff');
  bub.add(voxMesh(bb, true)); bub.userData.anim = 'bubble'; bub.position.set(0.22, 0.28, -0.16);
  g.add(f); g.add(f2); g.add(bub);
  g.userData.parts = { fish: f, fish2: f2, bubble: bub };
  return g;
}

function M_resign() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.09, 0, 0.66, 0.18, 0.20, C.paper);            // 信封
  b.b(0, 0.19, 0.06, 0.66, 0.06, 0.10, '#dcd6c6');
  b.b(0, 0.18, -0.06, 0.34, 0.10, 0.10, C.red);           // 封口
  b.b(0, 0.10, 0.11, 0.60, 0.03, 0.02, C.paper2);         // 信纸边
  b.b(-0.24, 0.06, 0.02, 0.10, 0.06, 0.14, C.red2);       // 邮票
  b.text('辞', 0, 0.13, 0.11, 0.028, C.red, 'front');
  g.add(voxMesh(b));
  var f = new THREE.Group(), fb = new VB();
  fb.b(0, 0, 0, 0.08, 0.20, 0.08, C.orange);
  fb.b(0, 0.14, 0, 0.06, 0.06, 0.06, C.yellow);
  f.add(voxMesh(fb, true)); f.userData.anim = 'fuse'; f.position.set(0.20, 0.20, 0);
  g.add(f); g.userData.parts = { fuse: f };
  return g;
}

function M_busy() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.03, 0, 0.44, 0.06, 0.44, C.gray2);            // 椅座
  b.b(0, 0.32, -0.20, 0.44, 0.56, 0.08, C.gray2);        // 椅背
  b.b(0, 0.06, 0, 0.10, 0.06, 0.10, C.dark);
  b.b(0, 0.46, -0.14, 0.40, 0.34, 0.12, C.red2);         // 椅背上的外套
  b.b(0.10, 0.40, -0.20, 0.10, 0.20, 0.06, '#e07a5f');
  b.b(-0.20, 0.16, 0.16, 0.34, 0.06, 0.20, C.darker);    // 桌板
  b.b(-0.20, 0.06, 0.16, 0.06, 0.10, 0.06, C.dark);
  b.b(-0.20, 0.24, -0.02, 0.30, 0.26, 0.05, C.dark);    // 显示器
  b.text('忙', -0.20, 0.24, -0.02, 0.02, C.amber, 'back');
  g.add(voxMesh(b));
  /* 亮着的屏幕（发光材质 + 滚动代码条） */
  var s = new THREE.Group(), sb = new VB();
  sb.b(0, 0, 0, 0.26, 0.22, 0.02, '#39e0d0');
  sb.b(-0.05, 0.05, 0.02, 0.12, 0.03, 0.01, '#0f5f63');
  sb.b(0.03, -0.01, 0.02, 0.16, 0.03, 0.01, '#0f5f63');
  sb.b(-0.02, -0.07, 0.02, 0.10, 0.03, 0.01, '#0f5f63');
  s.add(voxMesh(sb, true));
  s.position.set(-0.20, 0.24, 0.01);
  s.userData.anim = 'screen';
  g.add(s); g.userData.parts = { screen: s };
  return g;
}

/* 【自创】已读不回塔 */
function M_read() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.05, 0, 0.56, 0.10, 0.56, C.dark);
  b.b(0, 0.30, 0, 0.14, 0.40, 0.14, C.gray);
  b.b(0, 0.72, 0, 0.50, 0.64, 0.10, C.darker);          // 手机机身
  b.b(0, 0.72, 0.06, 0.42, 0.56, 0.02, '#1b3a52');
  b.b(0, 1.00, 0.06, 0.42, 0.05, 0.02, '#2f6f9a');
  b.b(-0.14, 0.86, 0.06, 0.16, 0.03, 0.02, '#7fd8ff');
  b.b(0.06, 0.76, 0.06, 0.24, 0.03, 0.02, '#7fd8ff');
  g.add(voxMesh(b));
  /* 悬浮聊天气泡（动）：消息进来了，但没人回 */
  var bg = new THREE.Group(), bb = new VB();
  bb.b(0, 0, 0, 0.30, 0.20, 0.20, C.paper);
  bb.b(-0.20, -0.02, 0, 0.10, 0.08, 0.08, C.paper);
  bg.add(voxMesh(bb, true));
  bg.position.set(0.10, 1.22, 0); bg.userData.anim = 'bubble1';
  var bg2 = bb.build(); /* 复用几何 */
  var b2 = new THREE.Group(); var m2 = new THREE.Mesh(bg2, VOX_GLOW); b2.add(m2);
  b2.scale.setScalar(0.7); b2.position.set(-0.18, 1.44, 0); b2.userData.anim = 'bubble2';
  g.add(bg); g.add(b2);
  g.userData.parts = { bubble1: bg, bubble2: b2 };
  return g;
}

/* 【自创】对齐会投影仪 */
function M_align() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.05, 0, 0.20, 0.10, 0.20, C.gray2);
  b.b(0, 0.22, 0.14, 0.10, 0.34, 0.10, C.gray);
  b.b(0, 0.22, -0.14, 0.10, 0.34, 0.10, C.gray);
  b.b(0.16, 0.22, 0, 0.10, 0.34, 0.10, C.gray);
  b.b(0, 0.42, 0, 0.60, 0.30, 0.46, C.paper);            // 机身
  b.b(0, 0.57, 0.24, 0.22, 0.20, 0.10, C.dark);           // 镜头
  b.b(0, 0.43, 0.20, 0.30, 0.05, 0.06, C.red2);
  b.text('会', 0, 0.58, 0, 0.035, C.red, 'top');
  g.add(voxMesh(b));
  var head = new THREE.Group(), hb = new VB();
  hb.b(0, 0, 0.26, 0.12, 0.12, 0.04, '#7fd8ff');
  head.add(voxMesh(hb, true)); head.position.set(0, 0.57, 0);
  head.userData.anim = 'spin';
  g.add(head); g.userData.parts = { spin: head };
  return g;
}

/* ============================================================
 *  敌人模型
 * ============================================================ */
function M_doc() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.03, 0, 0.58, 0.06, 0.66, C.paper2);
  b.b(0.03, 0.09, 0.02, 0.56, 0.06, 0.62, C.paper);
  b.b(-0.02, 0.15, -0.01, 0.54, 0.06, 0.60, C.paper);
  for (var i = 0; i < 4; i++) b.b(0, 0.183, -0.18 + i * 0.10, 0.38, 0.012, 0.03, '#9aa2ad');
  b.b(0.16, 0.20, 0.22, 0.14, 0.04, 0.06, C.red);        // 回形针
  g.add(voxMesh(b));
  return g;
}

function M_urgent() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.03, 0, 0.60, 0.06, 0.68, '#f0b48a');
  b.b(0.03, 0.09, 0.02, 0.58, 0.06, 0.64, '#ffd9b0');
  b.b(-0.02, 0.15, -0.01, 0.56, 0.06, 0.62, C.paper);
  b.b(0, 0.10, 0.33, 0.60, 0.10, 0.03, C.red2);
  b.text('!', 0, 0.16, 0.33, 0.02, C.red, 'front');
  g.add(voxMesh(b));
  var f = new THREE.Group(), fb = new VB();
  fb.b(0, 0, 0, 0.16, 0.16, 0.16, C.orange);
  fb.b(0.05, 0.12, 0.03, 0.10, 0.10, 0.10, C.yellow);
  f.add(voxMesh(fb, true)); f.position.set(0.06, 0.34, 0.02); f.userData.anim = 'flame';
  var f2 = new THREE.Mesh(fb.build(), VOX_GLOW); f2.scale.setScalar(0.7);
  var g2 = new THREE.Group(); g2.add(f2); g2.position.set(-0.14, 0.28, -0.12); g2.userData.anim = 'flame2';
  g.add(f); g.add(g2); g.userData.parts = { flame: f, flame2: g2 };
  return g;
}

function M_boss() {
  var g = new THREE.Group(), b = new VB();
  b.b(-0.13, 0.22, 0, 0.20, 0.44, 0.24, C.darker);      // 裤腿
  b.b(0.13, 0.22, 0, 0.20, 0.44, 0.24, C.darker);
  b.b(0, 0.66, 0, 0.56, 0.46, 0.32, '#2b3350');          // 西装
  b.b(0, 0.70, 0.17, 0.22, 0.34, 0.03, C.white);         // 衬衫
  b.b(0, 0.66, 0.18, 0.07, 0.28, 0.02, C.red);            // 领带
  b.b(-0.36, 0.66, 0.02, 0.14, 0.40, 0.16, '#2b3350');   // 手臂
  b.b(0.36, 0.60, 0.02, 0.14, 0.40, 0.16, '#2b3350');
  b.b(0, 1.02, 0, 0.34, 0.32, 0.32, C.skin);             // 头
  b.b(0, 1.18, -0.01, 0.36, 0.12, 0.34, '#4a4a4a');      // 头发
  b.b(0, 1.10, 0.16, 0.34, 0.06, 0.03, '#1a1a1a');       // 眼镜
  b.b(0, 0.98, 0.17, 0.10, 0.04, 0.02, '#6b4a3a');       // 胡子
  b.b(0.46, 0.36, 0.10, 0.22, 0.26, 0.10, C.wood2);      // 公文包
  b.b(0.46, 0.50, 0.10, 0.08, 0.06, 0.06, C.yellow);
  g.add(voxMesh(b));
  return g;
}

function M_meeting() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, 0.06, 0.04, 0.10, 0.12, 0.10, C.gray2);
  b.b(0, 0.06, -0.04, 0.10, 0.12, 0.10, C.gray2);
  b.b(0, 0.34, 0, 0.62, 0.44, 0.18, C.white);            // 日历本体
  b.b(0, 0.55, 0, 0.62, 0.10, 0.18, C.red);               // 顶部红条
  b.b(-0.18, 0.64, 0, 0.08, 0.08, 0.08, C.gray);
  b.b(0.18, 0.64, 0, 0.08, 0.08, 0.08, C.gray);
  b.text('会', 0, 0.34, 0.10, 0.028, C.red2, 'front');
  g.add(voxMesh(b));
  return g;
}

function M_regular() {
  var g = new THREE.Group(), b = new VB();
  b.b(-0.28, 0.20, 0.22, 0.08, 0.40, 0.08, C.gray2);
  b.b(0.28, 0.20, 0.22, 0.08, 0.40, 0.08, C.gray2);
  b.b(-0.28, 0.20, -0.22, 0.08, 0.40, 0.08, C.gray2);
  b.b(0.28, 0.20, -0.22, 0.08, 0.40, 0.08, C.gray2);
  b.b(0, 0.44, 0, 0.76, 0.08, 0.62, C.white);            // 会议桌
  b.b(0.12, 0.50, 0.04, 0.40, 0.06, 0.42, C.paper);      // 桌上文件堆
  b.b(0.12, 0.56, 0.00, 0.38, 0.06, 0.40, C.paper2);
  b.b(-0.20, 0.48, -0.10, 0.16, 0.16, 0.16, C.red);      // 茶杯
  b.b(0, 0.62, 0, 0.52, 0.30, 0.10, C.paper2);           // 立在桌上的大日历
  b.b(0, 0.76, 0, 0.52, 0.08, 0.10, C.red);
  b.text('会', 0, 0.62, 0.06, 0.03, C.red2, 'front');
  g.add(voxMesh(b));
  var ck = new THREE.Group(), kb = new VB();
  kb.b(0, 0, 0, 0.22, 0.22, 0.08, C.white);
  kb.b(0, 0, 0.05, 0.18, 0.18, 0.02, C.darker);
  kb.b(0.13, 0.13, 0.05, 0.03, 0.03, 0.02, C.red);
  ck.add(voxMesh(kb, true)); ck.position.set(0.30, 0.86, 0); ck.userData.anim = 'clock';
  g.add(ck); g.userData.parts = { clock: ck };
  return g;
}

/* ============================================================
 *  道具：咖啡 / 子弹 / 水花 / 年假单
 * ============================================================ */
function M_cup() {
  var b = new VB();
  b.b(0, 0.09, 0, 0.24, 0.18, 0.24, C.paper);
  b.b(0, 0.19, 0, 0.20, 0.03, 0.20, '#6b4423');
  b.b(0.14, 0.10, 0, 0.06, 0.10, 0.06, C.paper);
  b.b(0, 0.02, 0, 0.26, 0.04, 0.26, C.paper2);
  return voxMesh(b);
}
function M_bullet() {
  var b = new VB();
  b.b(0, 0, 0, 0.22, 0.22, 0.22, C.gray);
  b.b(0.11, 0, 0, 0.06, 0.14, 0.14, C.red);
  b.b(-0.11, 0, 0, 0.06, 0.10, 0.10, C.dark);
  return voxMesh(b);
}
function M_splash() {
  var b = new VB();
  b.b(0, 0, 0, 0.20, 0.20, 0.20, '#8fe6ef');
  b.b(0.14, 0.10, 0.06, 0.12, 0.12, 0.12, '#c9f6fb');
  b.b(-0.12, 0.08, -0.08, 0.10, 0.10, 0.10, '#c9f6fb');
  b.b(0.02, -0.12, 0.12, 0.10, 0.10, 0.10, '#c9f6fb');
  return voxMesh(b, true);
}
function M_leave() {
  var b = new VB();
  b.b(0, 0, 0, 0.42, 0.60, 0.04, C.paper);
  for (var i = 0; i < 4; i++) b.b(-0.02, 0.18 - i * 0.10, 0.03, 0.30, 0.02, 0.01, '#9aa2ad');
  b.b(0.12, 0.24, 0.03, 0.10, 0.10, 0.01, C.red);
  return voxMesh(b);
}
function M_paperDrop() {
  var b = new VB();
  b.b(0, 0, 0, 0.30, 0.04, 0.38, C.paper);
  b.b(0, 0.04, 0, 0.28, 0.03, 0.34, C.paper2);
  return voxMesh(b);
}

/* ============================================================
 *  场景（静态，全部合并为少数几个 mesh）
 * ============================================================ */
function buildScene(scene) {
  var b = new VB();
  var FLOOR = '#ddd6c6', TILE_A = '#b9c3ce', TILE_B = '#a8b4c1', EDGE = '#f4f0e4';

  /* 底板 */
  b.b(1.0, -0.30, 0, 22, 0.5, 12, FLOOR);
  b.b(1.0, -0.06, 0, 22, 0.06, 12, '#cfc7b6');

  /* 后墙：给办公室一个"房间感"，杂物不再像悬在空中 */
  b.b(1.0, 1.70, -5.75, 22, 3.4, 0.24, '#e6e1d6');       // 墙身
  b.b(1.0, 0.10, -5.60, 22, 0.20, 0.10, '#b9b2a4');       // 踢脚线
  b.b(1.0, 3.46, -5.75, 22, 0.12, 0.34, '#cfc8ba');       // 顶部压条
  for (var wi = 0; wi < 4; wi++) {                          // 采光窗
    var wx = -7.0 + wi * 4.6;
    b.b(wx, 2.30, -5.60, 3.0, 1.5, 0.10, '#cfe6f2');
    b.b(wx, 2.30, -5.56, 3.1, 0.09, 0.08, '#9fb0bd');
    b.b(wx, 2.30, -5.56, 0.09, 1.6, 0.08, '#9fb0bd');
  }
  b.b(4.6, 2.86, -5.56, 0.9, 0.9, 0.10, '#f2efe6');       // 挂钟
  b.b(4.6, 2.86, -5.50, 0.7, 0.7, 0.06, '#ffffff');
  b.b(4.6, 3.06, -5.44, 0.05, 0.22, 0.04, '#3a3a3a');
  b.b(4.6, 2.90, -5.44, 0.18, 0.05, 0.04, '#3a3a3a');

  /* 作战网格：逐格地垫 + 亮边框 */
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var x = gx(c), z = gz(r);
      var col = (r + c) % 2 ? TILE_A : TILE_B;
      b.b(x, 0.035, z, CELL - 0.08, 0.07, ROW_GAP - 0.08, col);
      b.b(x, 0.075, z - ROW_GAP / 2 + 0.04, CELL - 0.06, 0.02, 0.05, EDGE);
      b.b(x, 0.075, z + ROW_GAP / 2 - 0.04, CELL - 0.06, 0.02, 0.05, EDGE);
      b.b(x - CELL / 2 + 0.03, 0.075, z, 0.05, 0.02, ROW_GAP - 0.10, EDGE);
      b.b(x + CELL / 2 - 0.03, 0.075, z, 0.05, 0.02, ROW_GAP - 0.10, EDGE);
    }
  }
  /* 战场外沿走道 */
  b.b(FIELD_LEFT - 0.5, 0.02, 0, 0.5, 0.04, ROW_GAP * ROWS + 0.6, '#cfc9bb');
  b.b(6.0, 0.02, 0, 0.9, 0.04, ROW_GAP * ROWS + 0.6, '#cfc9bb');

  /* ---- 左侧大长桌 + 5 个工位 ---- */
  var dz = gz(0), dz4 = gz(4);
  b.b(DESK_X, 0.52, 0, 1.5, 0.14, dz4 - dz + 2.3, '#c69a63');
  b.b(DESK_X, 0.30, 0, 1.4, 0.36, dz4 - dz + 2.2, '#a8794a');
  b.b(DESK_X + 0.72, 0.20, 0, 0.08, 0.20, dz4 - dz + 2.1, '#7d5a33');
  for (var L = 0; L < 5; L++) {
    var lz = -((dz4 - dz) / 2 + 1.0) + 0.25 + L * (((dz4 - dz) / 2 + 1.0) * 2 - 0.5) / 4;
    b.b(DESK_X - 0.3, 0.14, lz, 0.12, 0.30, 0.12, '#7d5a33');
    b.b(DESK_X + 0.4, 0.14, lz, 0.12, 0.30, 0.12, '#7d5a33');
  }
  /* 每个工位：显示器 + 键盘 + 椅子 + 组员 */
  for (var i2 = 0; i2 < ROWS; i2++) {
    var z2 = gz(i2);
    b.b(DESK_X + 0.30, 0.66, z2, 0.10, 0.14, 0.10, C.dark);          // 屏支架
    b.b(DESK_X + 0.34, 0.86, z2, 0.10, 0.30, 0.62, C.dark);           // 显示器
    b.b(DESK_X + 0.40, 0.86, z2, 0.02, 0.24, 0.54, '#5fd0e0');        // 屏幕
    b.b(DESK_X + 0.05, 0.60, z2 - 0.22, 0.16, 0.04, 0.26, C.darker); // 键盘
    b.b(DESK_X + 0.05, 0.60, z2 + 0.30, 0.14, 0.06, 0.14, C.paper);  // 纸堆
    /* 组员（坐姿） */
    var px = DESK_X - 0.95;
    b.b(px, 0.24, z2, 0.46, 0.08, 0.46, C.gray2);                     // 椅子
    b.b(px, 0.46, z2 - 0.20, 0.46, 0.44, 0.08, C.gray2);
    b.b(px, 0.50, z2, 0.34, 0.34, 0.26, i2 % 2 ? '#7f8fd0' : '#d08a6a'); // 身体
    b.b(px, 0.76, z2, 0.26, 0.26, 0.26, C.skin);
    b.b(px, 0.88, z2 - 0.01, 0.28, 0.08, 0.28, '#2f2f2f');
    b.b(px - 0.02, 0.76, z2 + 0.13, 0.05, 0.04, 0.02, C.darker);
    b.b(px + 0.02, 0.76, z2 + 0.13, 0.05, 0.04, 0.02, C.darker);
    /* 头顶的工位名牌 */
    b.b(px - 0.02, 1.02, z2, 0.30, 0.12, 0.06, C.navy);
  }

  /* ---- 右侧：老板办公室（玻璃隔间，敞顶以便看清内部） ---- */
  var ox0 = 6.3, ox1 = 9.2;
  b.b((ox0 + ox1) / 2, 0.05, 0, ox1 - ox0 + 0.2, 0.10, 8.2, '#6d4c34');      // 地台
  b.b((ox0 + ox1) / 2, 0.12, 0, ox1 - ox0, 0.06, 8.0, '#8a5f3d');           // 木地板
  b.b((ox0 + ox1) / 2, 0.16, 0.2, 2.0, 0.03, 4.4, '#a83a34');              // 红地毯
  /* 四角立柱 + 远端横梁 */
  [[ox0 - 0.05, -3.8], [ox1, -3.8], [ox0 - 0.05, 3.8], [ox1, 3.8], [(ox0 + ox1) / 2, -3.8]].forEach(function (p) {
    b.b(p[0], 0.8, p[1], 0.16, 1.6, 0.16, '#4a4038');
  });
  b.b((ox0 + ox1) / 2, 1.58, -3.8, ox1 - ox0 + 0.2, 0.14, 0.16, '#4a4038');
  /* 玻璃（半透明，单独材质） */
  var gb = new VB();
  gb.b((ox0 + ox1) / 2, 0.8, -3.86, ox1 - ox0, 1.5, 0.06, '#bfe6f2');        // 背墙玻璃
  gb.b(ox1 - 0.02, 0.8, 0, 0.06, 1.5, 7.7, '#bfe6f2');                    // 侧墙玻璃
  gb.b(ox0 + 0.02, 0.8, -2.85, 0.06, 1.5, 1.9, '#bfe6f2');                // 面向战场（留门洞）
  gb.b(ox0 + 0.02, 0.8, 2.85, 0.06, 1.5, 1.9, '#bfe6f2');
  /* 门框 */
  b.b(ox0 - 0.05, 0.7, 0, 0.18, 1.5, 0.18, '#4a4038');
  b.b(ox0 - 0.05, 1.45, 0, 0.18, 0.16, 4.0, '#4a4038');
  var glass = new THREE.Mesh(gb.build(), new THREE.MeshLambertMaterial({ vertexColors: true, transparent: true, opacity: 0.28, depthWrite: false }));
  glass.renderOrder = 2;
  scene.add(glass);

  /* 办公室内部：老板大班台 + 老板剪影（站在门口内侧） */
  b.b(8.6, 0.62, -1.4, 1.5, 0.12, 1.9, '#4a3a2a');
  b.b(8.6, 0.30, -1.4, 1.4, 0.36, 1.8, '#3d3024');
  b.b(8.7, 0.76, -2.0, 0.4, 0.28, 0.06, '#2c2c2c');
  b.b(8.7, 0.76, -0.9, 0.3, 0.22, 0.06, C.paper2);
  b.b(8.6, 0.70, -0.4, 0.12, 0.10, 0.12, C.red);                          // 老板桌上的红茶杯
  b.b(7.9, 0.40, 1.6, 0.6, 0.60, 0.6, '#3a3f4a');                          // 老板椅
  b.b(7.9, 0.72, 1.35, 0.6, 0.70, 0.14, '#3a3f4a');
  /* 老板（隔间里的人影，位于门口内侧） */
  b.b(7.0, 0.62, 0.6, 0.44, 0.66, 0.32, '#2b3350');
  b.b(7.0, 1.05, 0.6, 0.30, 0.30, 0.30, C.skin2);
  b.b(7.0, 1.19, 0.6, 0.32, 0.10, 0.32, '#4a4a4a');
  b.b(7.3, 0.48, 0.6, 0.26, 0.26, 0.12, C.wood2);                         // 公文包
  b.b(6.5, 0.42, -2.6, 0.5, 0.84, 0.5, '#c8b090');                         // 文件柜
  b.b(6.5, 0.60, -2.33, 0.44, 0.04, 0.04, C.dark);
  b.b(-7.6, 0.35, -3.6, 0.5, 0.7, 0.5, '#8fbfa0');      // 绿植
  b.b(-7.6, 0.86, -3.6, 0.62, 0.34, 0.62, C.green);
  b.b(-7.6, 1.12, -3.6, 0.44, 0.20, 0.44, C.green2);
  b.b(-3.0, 0.42, -4.8, 0.5, 0.84, 0.5, '#cfe4ee');      // 饮水机
  b.b(-3.0, 0.90, -4.8, 0.44, 0.18, 0.44, '#9fc9dd');
  b.b(-7.8, 1.05, -4.3, 2.4, 1.4, 0.12, C.white);        // 白板
  b.b(-7.8, 1.05, -4.34, 2.1, 1.1, 0.04, '#e9e6dd');
  b.b(-8.6, 1.22, -4.34, 0.9, 0.06, 0.02, '#7fa8d0');
  b.b(-7.8, 1.00, -4.34, 1.2, 0.06, 0.02, '#e08a6a');
  b.b(-8.0, 0.82, -4.34, 0.7, 0.05, 0.02, '#9ac97f');
  b.b(-5.4, 0.60, -4.6, 1.4, 1.2, 0.5, C.gray2);        // 打印机架
  b.b(-5.4, 1.30, -4.6, 1.2, 0.22, 0.44, C.gray);
  b.b(-2.6, 0.55, 5.0, 1.2, 1.1, 0.5, '#cbb79a');      // 文件柜
  b.b(-2.6, 0.75, 4.78, 1.1, 0.06, 0.04, C.dark);
  b.b(-2.6, 1.00, 4.78, 1.1, 0.06, 0.04, C.dark);

  var mesh = voxMesh(b);
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

/* 工位槽位（4 个文件盘，返回 5 组，每组 4 个独立 mesh 以便动态显示） */
function buildSlots(scene) {
  var slots = [];
  for (var r = 0; r < ROWS; r++) {
    var row = [];
    for (var k = 0; k < 4; k++) {
      var b = new VB();
      b.b(0, 0, 0, 0.30, 0.05, 0.34, '#b9c2cc');
      b.b(-0.145, 0.06, 0, 0.04, 0.12, 0.34, '#8e98a4');
      b.b(0.145, 0.06, 0, 0.04, 0.12, 0.34, '#8e98a4');
      b.b(0, 0.06, -0.15, 0.30, 0.12, 0.04, '#8e98a4');
      var m = voxMesh(b);
      /* 2×2 文件盘，架在长桌上、组员与显示器之间 */
      m.position.set(DESK_X - 0.42, k < 2 ? 0.60 : 0.76, gz(r) + (k % 2 ? 0.20 : -0.20));
      m.visible = false;
      scene.add(m);
      row.push(m);
    }
    slots.push(row);
  }
  return slots;
}

/* 空槽底座：始终可见的暗色文件架，让玩家一眼看出"每个工位有 4 个槽位" */
function buildSlotBase(scene) {
  var b = new VB();
  for (var r = 0; r < ROWS; r++) {
    var z = gz(r);
    /* 底板 + 两层隔板侧壁，勾出 2×2 四个格子 */
    b.b(DESK_X - 0.42, 0.575, z, 0.66, 0.03, 0.74, '#7d8794');
    b.b(DESK_X - 0.42 - 0.32, 0.66, z, 0.03, 0.18, 0.74, '#98a2ae');
    b.b(DESK_X - 0.42 + 0.32, 0.66, z, 0.03, 0.18, 0.74, '#98a2ae');
    b.b(DESK_X - 0.42, 0.66, z - 0.36, 0.66, 0.18, 0.03, '#98a2ae');
    b.b(DESK_X - 0.42, 0.66, z + 0.36, 0.66, 0.18, 0.03, '#98a2ae');
    b.b(DESK_X - 0.42, 0.745, z, 0.66, 0.03, 0.74, '#8a94a0');
  }
  var m = voxMesh(b);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}