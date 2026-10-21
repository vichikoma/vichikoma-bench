/* ============================================================================
 * voxel.js —— 体素建模：单位 / 敌人 / 场景全部由代码生成的立方体拼搭
 *  - 共享 1×1×1 几何体，按盒子合并（顶点色）→ 每个模型仅 1~2 个网格，draw call 极低
 *  - 无任何贴图文件，颜色全部为代码生成的顶点色 / 材质色
 *  - 风格基准：Crossy Road 体素风（方块拼搭 / 高饱和 / 干净块面）
 *     在此基础上做了自己的方向：暖木色办公室 + 青绿地毯 + 撞色道具
 * ==========================================================================*/
(function (global) {
  'use strict';

  var baseGeo = new THREE.BoxGeometry(1, 1, 1).toNonIndexed();

  /* ---------- 颜色工具 ---------- */
  function hex(c) { return new THREE.Color(c); }
  function shade(c, f) {
    var col = hex(c);
    col.r = Math.min(1, col.r * f); col.g = Math.min(1, col.g * f); col.b = Math.min(1, col.b * f);
    return col;
  }

  /* ---------- 盒子合并器 ---------- */
  function Builder() {
    if (!(this instanceof Builder)) return new Builder();   // 允许不写 new
    this.pos = []; this.nor = []; this.col = []; this.alphaParts = []; this.alpha = [];
  }
  Builder.prototype.add = function (o) {
    // o: {w,h,d, x,y,z, c, ry, rz, rx, a(透明度, 可选)}
    var target = (o.a != null && o.a < 1) ? { pos: [], nor: [], col: [], a: o.a } : null;
    var pos = target ? target.pos : this.pos;
    var nor = target ? target.nor : this.nor;
    var col = target ? target.col : this.col;

    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();
    var e = new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0), q, new THREE.Vector3(o.w, o.h, o.d));
    var nm = new THREE.Matrix3().setFromMatrix4(m);

    var bp = baseGeo.attributes.position, bn = baseGeo.attributes.normal;
    var c = hex(o.c != null ? o.c : 0xffffff);
    if (o.shade) c = shade(o.c, o.shade);
    for (var i = 0; i < bp.count; i++) {
      var v = new THREE.Vector3().fromBufferAttribute(bp, i).applyMatrix4(m);
      pos.push(v.x, v.y, v.z);
      var n = new THREE.Vector3().fromBufferAttribute(bn, i).applyMatrix3(nm).normalize();
      nor.push(n.x, n.y, n.z);
      col.push(c.r, c.g, c.b);
    }
    if (target) this.alphaParts.push(target);
    return this;
  };
  Builder.prototype.build = function () {
    var g = new THREE.Group();
    if (this.pos.length) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
      var mesh = new THREE.Mesh(geo, opaqueMat);
      mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
    }
    // 半透明部分按透明度分组合并
    var buckets = {};
    for (var k = 0; k < this.alphaParts.length; k++) {
      var p = this.alphaParts[k];
      var key = p.a;
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(p);
    }
    for (var a in buckets) {
      var parts = buckets[a], P = [], N = [], C = [];
      for (var j = 0; j < parts.length; j++) {
        P = P.concat(parts[j].pos); N = N.concat(parts[j].nor); C = C.concat(parts[j].col);
      }
      var tgeo = new THREE.BufferGeometry();
      tgeo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      tgeo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      tgeo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      var tmat = new THREE.MeshLambertMaterial({
        vertexColors: true, transparent: true, opacity: parseFloat(a),
        depthWrite: false
      });
      var tmesh = new THREE.Mesh(tgeo, tmat);
      tmesh.receiveShadow = true;
      tmesh.renderOrder = 2;
      g.add(tmesh);
    }
    return g;
  };

  var opaqueMat = new THREE.MeshLambertMaterial({ vertexColors: true });

  /* ========================================================================
   *  我方单位
   * ======================================================================*/

  /* 咖啡机：红色机身 + 银色面板 + 白杯 + 热气 */
  function coffeeMachine() {
    var b = new Builder();
    b.add({ w: 1.05, h: 1.15, d: 0.9, x: 0, y: 0.575, z: 0, c: 0xc0392b });         // 机身
    b.add({ w: 1.15, h: 0.16, d: 1.0, x: 0, y: 1.22, z: 0, c: 0x8e2a20 });          // 顶盖
    b.add({ w: 0.95, h: 0.42, d: 0.1, x: 0, y: 0.86, z: 0.47, c: 0xd8dee6 });       // 面板
    b.add({ w: 0.62, h: 0.2, d: 0.1, x: 0, y: 1.0, z: 0.53, c: 0x2b3140 });         // 显示屏
    b.add({ w: 0.16, h: 0.16, d: 0.12, x: -0.26, y: 0.62, z: 0.52, c: 0xffd34d });  // 按钮
    b.add({ w: 0.16, h: 0.16, d: 0.12, x: 0.06, y: 0.62, z: 0.52, c: 0xffd34d });
    b.add({ w: 0.42, h: 0.1, d: 0.36, x: 0, y: 0.32, z: 0.55, c: 0x9aa4b0 });       // 接水盘
    b.add({ w: 0.12, h: 0.22, d: 0.12, x: 0, y: 0.52, z: 0.52, c: 0x5b6472 });      // 出水口
    // 咖啡杯
    b.add({ w: 0.3, h: 0.3, d: 0.3, x: 0, y: 0.22, z: 0.62, c: 0xf7f7f2 });
    b.add({ w: 0.24, h: 0.05, d: 0.24, x: 0, y: 0.38, z: 0.62, c: 0x6b3b17 });
    // 热气
    b.add({ w: 0.14, h: 0.14, d: 0.14, x: -0.12, y: 1.5, z: 0.3, c: 0xffffff, a: 0.30 });
    b.add({ w: 0.12, h: 0.12, d: 0.12, x: 0.16, y: 1.72, z: 0.15, c: 0xffffff, a: 0.22 });
    b.add({ w: 0.1, h: 0.1, d: 0.1, x: -0.02, y: 1.92, z: 0.42, c: 0xffffff, a: 0.16 });
    return b.build();
  }

  /* DDL 加农炮：深蓝炮身 + 大红倒计时牌 + 金轮 */
  function ddlCannon() {
    var b = new Builder();
    b.add({ w: 1.15, h: 0.5, d: 1.05, x: 0, y: 0.25, z: 0, c: 0x2c3e63 });          // 底座
    b.add({ w: 0.95, h: 0.12, d: 0.85, x: 0, y: 0.56, z: 0, c: 0x22304d });
    // 炮管（朝 -x = 敌人来向的反方向，即朝右）
    b.add({ w: 1.25, h: 0.42, d: 0.42, x: 0.42, y: 0.86, z: 0, c: 0x39527f, rz: -0.12 });
    b.add({ w: 0.34, h: 0.56, d: 0.56, x: 1.06, y: 1.0, z: 0, c: 0x2b3c5e });       // 炮口
    b.add({ w: 0.18, h: 0.62, d: 0.62, x: 1.22, y: 1.02, z: 0, c: 0x1e2a42 });
    // 倒计时牌
    b.add({ w: 0.14, h: 0.92, d: 0.14, x: -0.42, y: 1.0, z: -0.34, c: 0x8b3a2b }); // 立杆
    b.add({ w: 0.9, h: 0.72, d: 0.12, x: -0.42, y: 1.62, z: -0.34, c: 0xd63b2f }); // 红牌
    b.add({ w: 0.66, h: 0.5, d: 0.06, x: -0.42, y: 1.62, z: -0.27, c: 0xf5f0e6 }); // 白底
    b.add({ w: 0.16, h: 0.34, d: 0.06, x: -0.62, y: 1.66, z: -0.23, c: 0x2b3140 }); // 数字块
    b.add({ w: 0.16, h: 0.34, d: 0.06, x: -0.36, y: 1.66, z: -0.23, c: 0x2b3140 });
    b.add({ w: 0.28, h: 0.1, d: 0.06, x: -0.42, y: 1.44, z: -0.23, c: 0xd63b2f });
    // 轮子
    b.add({ w: 0.26, h: 0.5, d: 0.5, x: -0.38, y: 0.26, z: 0.62, c: 0xe0a63c });
    b.add({ w: 0.26, h: 0.5, d: 0.5, x: -0.38, y: 0.26, z: -0.62, c: 0xe0a63c });
    b.add({ w: 0.32, h: 0.16, d: 0.16, x: -0.38, y: 0.26, z: 0.76, c: 0x7a5a22 });
    b.add({ w: 0.32, h: 0.16, d: 0.16, x: -0.38, y: 0.26, z: -0.76, c: 0x7a5a22 });
    return b.build();
  }

  /* 背锅侠：实习同事 + 一口大黑锅 */
  function scapegoat() {
    var b = new Builder();
    // 腿
    b.add({ w: 0.22, h: 0.5, d: 0.24, x: -0.16, y: 0.25, z: 0, c: 0x2f3b52 });
    b.add({ w: 0.22, h: 0.5, d: 0.24, x: 0.16, y: 0.25, z: 0, c: 0x2f3b52 });
    b.add({ w: 0.26, h: 0.12, d: 0.34, x: -0.16, y: 0.06, z: 0.06, c: 0x222a3c });
    b.add({ w: 0.26, h: 0.12, d: 0.34, x: 0.16, y: 0.06, z: 0.06, c: 0x222a3c });
    // 身体（蓝衬衫）
    b.add({ w: 0.72, h: 0.66, d: 0.46, x: 0, y: 0.83, z: 0, c: 0x4a90d9 });
    b.add({ w: 0.2, h: 0.52, d: 0.22, x: -0.46, y: 0.86, z: 0, c: 0x4a90d9, rz: 0.12 });
    b.add({ w: 0.2, h: 0.52, d: 0.22, x: 0.46, y: 0.86, z: 0, c: 0x4a90d9, rz: -0.12 });
    b.add({ w: 0.2, h: 0.18, d: 0.24, x: -0.5, y: 0.6, z: 0, c: 0xf2c49b });
    b.add({ w: 0.2, h: 0.18, d: 0.24, x: 0.5, y: 0.6, z: 0, c: 0xf2c49b });
    // 头
    b.add({ w: 0.56, h: 0.52, d: 0.52, x: 0, y: 1.45, z: 0, c: 0xf2c49b });
    b.add({ w: 0.6, h: 0.2, d: 0.56, x: 0, y: 1.72, z: 0, c: 0x3b2b20 });   // 头发
    b.add({ w: 0.12, h: 0.12, d: 0.06, x: -0.14, y: 1.46, z: 0.27, c: 0x2b2b2b });
    b.add({ w: 0.12, h: 0.12, d: 0.06, x: 0.14, y: 1.46, z: 0.27, c: 0x2b2b2b });
    b.add({ w: 0.22, h: 0.07, d: 0.06, x: 0, y: 1.27, z: 0.27, c: 0x2b2b2b }); // 委屈嘴
    // 大黑锅（背在背上）
    b.add({ w: 0.2, h: 1.05, d: 1.15, x: -0.5, y: 1.02, z: 0, c: 0x2c2c34 });   // 锅体
    b.add({ w: 0.16, h: 1.2, d: 1.32, x: -0.62, y: 1.02, z: 0, c: 0x1e1e24 });  // 锅沿
    b.add({ w: 0.12, h: 0.22, d: 0.22, x: -0.76, y: 1.62, z: 0, c: 0x35353d }); // 锅柄
    return b.build();
  }

  /* 摸鱼鱼缸：玻璃缸 + 水 + 小鱼 + 水草 */
  function fishTank() {
    var b = new Builder();
    b.add({ w: 1.2, h: 0.18, d: 1.0, x: 0, y: 0.09, z: 0, c: 0x8a6a44 });           // 木底座
    b.add({ w: 1.12, h: 0.95, d: 0.92, x: 0, y: 0.66, z: 0, c: 0x77cdf2, a: 0.30 }); // 玻璃
    b.add({ w: 1.0, h: 0.62, d: 0.8, x: 0, y: 0.5, z: 0, c: 0x2f9fd8, a: 0.55 });   // 水
    b.add({ w: 1.2, h: 0.12, d: 1.0, x: 0, y: 1.17, z: 0, c: 0x5a4630 });           // 缸口
    // 沙与石
    b.add({ w: 0.98, h: 0.12, d: 0.78, x: 0, y: 0.26, z: 0, c: 0xe6cf94 });
    b.add({ w: 0.2, h: 0.16, d: 0.18, x: -0.32, y: 0.36, z: 0.14, c: 0x8c8c96 });
    b.add({ w: 0.16, h: 0.12, d: 0.16, x: 0.34, y: 0.34, z: -0.16, c: 0x7a7a84 });
    // 水草
    b.add({ w: 0.1, h: 0.5, d: 0.1, x: -0.4, y: 0.55, z: -0.18, c: 0x2f9e4f });
    b.add({ w: 0.1, h: 0.36, d: 0.1, x: -0.26, y: 0.48, z: -0.22, c: 0x3fb95f });
    b.add({ w: 0.1, h: 0.42, d: 0.1, x: 0.42, y: 0.51, z: 0.18, c: 0x2f9e4f });
    // 摸鱼的鱼
    b.add({ w: 0.4, h: 0.24, d: 0.2, x: 0.02, y: 0.66, z: 0.1, c: 0xff9138 });
    b.add({ w: 0.16, h: 0.2, d: 0.1, x: 0.28, y: 0.66, z: 0.1, c: 0xff7020 });
    b.add({ w: 0.08, h: 0.08, d: 0.06, x: -0.14, y: 0.72, z: 0.2, c: 0x222222 });
    b.add({ w: 0.18, h: 0.12, d: 0.12, x: -0.22, y: 0.5, z: -0.12, c: 0xffd23f }); // 第二条小鱼
    b.add({ w: 0.07, h: 0.07, d: 0.05, x: -0.3, y: 0.53, z: -0.06, c: 0x222222 });
    // 气泡
    b.add({ w: 0.09, h: 0.09, d: 0.09, x: 0.16, y: 0.92, z: -0.02, c: 0xffffff, a: 0.45 });
    b.add({ w: 0.07, h: 0.07, d: 0.07, x: 0.26, y: 1.02, z: 0.04, c: 0xffffff, a: 0.35 });
    return b.build();
  }

  /* 辞职信：立起的大信封 + 红章 */
  function resignLetter() {
    var b = new Builder();
    b.add({ w: 1.05, h: 1.25, d: 0.16, x: 0, y: 0.72, z: 0, c: 0xf7f3e8 });       // 信封
    b.add({ w: 1.12, h: 0.12, d: 0.22, x: 0, y: 1.36, z: 0, c: 0xe6dfcd });       // 顶封
    // 信封口盖（三角感：两块斜板）
    b.add({ w: 0.62, h: 0.5, d: 0.1, x: -0.26, y: 1.06, z: 0.06, c: 0xece5d3, rz: 0.62 });
    b.add({ w: 0.62, h: 0.5, d: 0.1, x: 0.26, y: 1.06, z: 0.06, c: 0xece5d3, rz: -0.62 });
    // 红色印章
    b.add({ w: 0.42, h: 0.42, d: 0.08, x: 0.22, y: 0.62, z: 0.12, c: 0xd63b2f });
    b.add({ w: 0.26, h: 0.26, d: 0.06, x: 0.22, y: 0.62, z: 0.17, c: 0xf7f3e8 });
    // 「辞」字笔画块
    b.add({ w: 0.36, h: 0.08, d: 0.06, x: -0.3, y: 0.78, z: 0.12, c: 0x2b3140 });
    b.add({ w: 0.08, h: 0.38, d: 0.06, x: -0.3, y: 0.6, z: 0.12, c: 0x2b3140 });
    b.add({ w: 0.22, h: 0.08, d: 0.06, x: -0.24, y: 0.5, z: 0.12, c: 0x2b3140 });
    // 底座纸堆
    b.add({ w: 1.2, h: 0.1, d: 0.5, x: 0, y: 0.05, z: 0, c: 0xd9d2c0 });
    return b.build();
  }

  /* 假装在忙：椅子 + 搭着的外套 + 常亮屏幕（不在场的加班现场） */
  function fakeBusy() {
    var b = new Builder();
    // 办公椅
    b.add({ w: 0.72, h: 0.14, d: 0.68, x: -0.22, y: 0.44, z: 0, c: 0x3a4152 });   // 坐垫
    b.add({ w: 0.68, h: 0.78, d: 0.16, x: -0.5, y: 0.86, z: 0, c: 0x3a4152, rz: 0.1 }); // 靠背
    b.add({ w: 0.12, h: 0.36, d: 0.12, x: -0.22, y: 0.2, z: 0, c: 0x545c70 });
    b.add({ w: 0.66, h: 0.1, d: 0.12, x: -0.22, y: 0.08, z: 0, c: 0x545c70 });
    b.add({ w: 0.12, h: 0.1, d: 0.62, x: -0.22, y: 0.08, z: 0, c: 0x545c70 });
    // 搭在椅背上的外套
    b.add({ w: 0.2, h: 0.86, d: 0.72, x: -0.56, y: 0.98, z: 0, c: 0x7a4b2d });
    b.add({ w: 0.16, h: 0.5, d: 0.2, x: -0.62, y: 0.62, z: 0.34, c: 0x694024 });
    b.add({ w: 0.16, h: 0.5, d: 0.2, x: -0.62, y: 0.62, z: -0.34, c: 0x694024 });
    // 桌面与屏幕（人不在，屏幕常亮）
    b.add({ w: 0.62, h: 0.1, d: 1.0, x: 0.42, y: 0.72, z: 0, c: 0xc9995c });
    b.add({ w: 0.12, h: 0.66, d: 0.12, x: 0.42, y: 0.36, z: 0, c: 0x8d6a3f });
    var screen = new Builder();
    screen.add({ w: 0.16, h: 0.62, d: 0.72, x: 0.42, y: 1.14, z: 0, c: 0x2b3140 });
    screen.add({ w: 0.08, h: 0.5, d: 0.6, x: 0.51, y: 1.14, z: 0, c: 0x39d6c6 });
    // 键盘（须在 build 之前加入）
    b.add({ w: 0.3, h: 0.06, d: 0.5, x: 0.24, y: 0.8, z: 0, c: 0xe8e8e2 });
    var g = b.build();
    var sg = screen.build();
    sg.userData.isScreen = true;
    g.add(sg);
    return g;
  }

  /* ★团建烧烤架：烤炉 + 烤串 + 炭火 + 烟气 */
  function bbqGrill() {
    var b = new Builder();
    b.add({ w: 1.15, h: 0.42, d: 0.95, x: 0, y: 0.62, z: 0, c: 0x3c4450 });       // 炉体
    b.add({ w: 1.05, h: 0.12, d: 0.85, x: 0, y: 0.88, z: 0, c: 0xff7a2f });       // 炭火
    b.add({ w: 1.15, h: 0.1, d: 0.95, x: 0, y: 0.95, z: 0, c: 0x2c323c });        // 烤网
    // 支脚
    b.add({ w: 0.14, h: 0.6, d: 0.14, x: -0.44, y: 0.3, z: 0.32, c: 0x2c323c });
    b.add({ w: 0.14, h: 0.6, d: 0.14, x: 0.44, y: 0.3, z: 0.32, c: 0x2c323c });
    b.add({ w: 0.14, h: 0.6, d: 0.14, x: -0.44, y: 0.3, z: -0.32, c: 0x2c323c });
    b.add({ w: 0.14, h: 0.6, d: 0.14, x: 0.44, y: 0.3, z: -0.32, c: 0x2c323c });
    // 烤串（彩色方块串）
    var cols = [0xffd23f, 0xe8552f, 0x7ec850, 0xff9138, 0xf7f7f2, 0xd94f8a];
    for (var i = 0; i < 5; i++) {
      var z = -0.36 + i * 0.18;
      b.add({ w: 1.0, h: 0.05, d: 0.05, x: 0, y: 1.06, z: z, c: 0xd9b98a });      // 签子
      for (var j = 0; j < 3; j++) {
        b.add({ w: 0.17, h: 0.15, d: 0.15, x: -0.3 + j * 0.3, y: 1.1, z: z, c: cols[(i + j) % cols.length] });
      }
    }
    // 烟气
    b.add({ w: 0.18, h: 0.18, d: 0.18, x: -0.2, y: 1.55, z: 0.1, c: 0xffffff, a: 0.28 });
    b.add({ w: 0.15, h: 0.15, d: 0.15, x: 0.16, y: 1.78, z: -0.12, c: 0xffffff, a: 0.22 });
    b.add({ w: 0.12, h: 0.12, d: 0.12, x: -0.02, y: 2.0, z: 0.08, c: 0xffffff, a: 0.16 });
    // 小桌牌「团建」
    b.add({ w: 0.1, h: 0.55, d: 0.1, x: 0.72, y: 0.5, z: -0.3, c: 0x8d6a3f });
    b.add({ w: 0.52, h: 0.4, d: 0.1, x: 0.72, y: 0.92, z: -0.3, c: 0xd63b2f });
    b.add({ w: 0.34, h: 0.08, d: 0.06, x: 0.72, y: 1.0, z: -0.24, c: 0xf7f3e8 });
    b.add({ w: 0.34, h: 0.08, d: 0.06, x: 0.72, y: 0.86, z: -0.24, c: 0xf7f3e8 });
    return b.build();
  }

  /* ★HR 的约谈：西装 HR + 写字板 + 「!」谈话气泡 */
  function hrTalk() {
    var b = new Builder();
    // 腿
    b.add({ w: 0.2, h: 0.52, d: 0.22, x: -0.15, y: 0.26, z: 0, c: 0x2b2b33 });
    b.add({ w: 0.2, h: 0.52, d: 0.22, x: 0.15, y: 0.26, z: 0, c: 0x2b2b33 });
    // 西装
    b.add({ w: 0.7, h: 0.68, d: 0.44, x: 0, y: 0.86, z: 0, c: 0x33384a });
    b.add({ w: 0.2, h: 0.5, d: 0.2, x: -0.45, y: 0.88, z: 0, c: 0x33384a, rz: 0.16 });
    b.add({ w: 0.2, h: 0.5, d: 0.2, x: 0.45, y: 0.88, z: 0, c: 0x33384a, rz: -0.16 });
    b.add({ w: 0.18, h: 0.5, d: 0.1, x: 0, y: 0.92, z: 0.24, c: 0xf2f2f2 });     // 衬衫
    b.add({ w: 0.1, h: 0.34, d: 0.08, x: 0, y: 1.02, z: 0.3, c: 0xd63b2f });     // 领带
    // 头
    b.add({ w: 0.52, h: 0.5, d: 0.5, x: 0, y: 1.46, z: 0, c: 0xf2c49b });
    b.add({ w: 0.56, h: 0.18, d: 0.54, x: 0, y: 1.72, z: 0, c: 0x2b2b33 });
    b.add({ w: 0.1, h: 0.1, d: 0.05, x: -0.13, y: 1.5, z: 0.26, c: 0x2b2b2b });
    b.add({ w: 0.1, h: 0.1, d: 0.05, x: 0.13, y: 1.5, z: 0.26, c: 0x2b2b2b });
    b.add({ w: 0.18, h: 0.05, d: 0.05, x: 0, y: 1.3, z: 0.26, c: 0x2b2b2b });
    // 写字板
    b.add({ w: 0.42, h: 0.56, d: 0.07, x: -0.52, y: 1.0, z: 0.16, c: 0xb98d55, rz: 0.12 });
    b.add({ w: 0.32, h: 0.44, d: 0.05, x: -0.52, y: 1.0, z: 0.21, c: 0xf7f3e8, rz: 0.12 });
    b.add({ w: 0.2, h: 0.05, d: 0.04, x: -0.52, y: 1.12, z: 0.25, c: 0x5b6472, rz: 0.12 });
    b.add({ w: 0.2, h: 0.05, d: 0.04, x: -0.52, y: 1.0, z: 0.25, c: 0x5b6472, rz: 0.12 });
    // 谈话气泡 + 感叹号
    b.add({ w: 0.62, h: 0.46, d: 0.14, x: 0.55, y: 1.98, z: 0, c: 0xf7f3e8 });
    b.add({ w: 0.18, h: 0.14, d: 0.12, x: 0.34, y: 1.72, z: 0, c: 0xf7f3e8 });
    b.add({ w: 0.1, h: 0.22, d: 0.06, x: 0.55, y: 2.04, z: 0.1, c: 0xd63b2f });
    b.add({ w: 0.1, h: 0.08, d: 0.06, x: 0.55, y: 1.85, z: 0.1, c: 0xd63b2f });
    return b.build();
  }

  /* ========================================================================
   *  敌人（工作）
   * ======================================================================*/

  /* 普通需求：一沓需求文档（走路的文档） */
  function enemyDoc() {
    var b = new Builder();
    // 纸沓
    b.add({ w: 0.95, h: 1.15, d: 0.42, x: 0, y: 0.98, z: 0, c: 0xf5f2e8 });
    b.add({ w: 1.02, h: 0.1, d: 0.48, x: 0, y: 1.58, z: 0, c: 0xe4dfcd });
    // 标题条 + 文字行
    b.add({ w: 0.78, h: 0.2, d: 0.05, x: 0, y: 1.38, z: 0.23, c: 0x3a6fd8 });
    for (var i = 0; i < 4; i++) {
      b.add({ w: 0.66, h: 0.07, d: 0.05, x: 0, y: 1.16 - i * 0.16, z: 0.23, c: 0x8c8c96 });
    }
    // 眼睛（文档上的表情）
    b.add({ w: 0.14, h: 0.14, d: 0.06, x: -0.18, y: 1.38, z: 0.26, c: 0x2b2b2b });
    b.add({ w: 0.14, h: 0.14, d: 0.06, x: 0.18, y: 1.38, z: 0.26, c: 0x2b2b2b });
    // 小短腿
    b.add({ w: 0.2, h: 0.42, d: 0.22, x: -0.24, y: 0.21, z: 0, c: 0x4a5568 });
    b.add({ w: 0.2, h: 0.42, d: 0.22, x: 0.24, y: 0.21, z: 0, c: 0x4a5568 });
    b.add({ w: 0.26, h: 0.12, d: 0.3, x: -0.24, y: 0.06, z: 0.05, c: 0x2f3b52 });
    b.add({ w: 0.26, h: 0.12, d: 0.3, x: 0.24, y: 0.06, z: 0.05, c: 0x2f3b52 });
    // 侧边纸张
    b.add({ w: 0.1, h: 0.9, d: 0.34, x: -0.52, y: 1.02, z: 0, c: 0xece8da });
    b.add({ w: 0.1, h: 0.9, d: 0.34, x: 0.52, y: 1.02, z: 0, c: 0xece8da });
    return b.build();
  }

  /* 加急需求：冒火的红色需求文档 */
  function enemyUrgent() {
    var b = new Builder();
    b.add({ w: 0.98, h: 1.2, d: 0.44, x: 0, y: 1.0, z: 0, c: 0xf5f2e8 });
    b.add({ w: 1.05, h: 0.1, d: 0.5, x: 0, y: 1.62, z: 0, c: 0xe4dfcd });
    b.add({ w: 0.8, h: 0.22, d: 0.05, x: 0, y: 1.42, z: 0.24, c: 0xd63b2f });   // 红标题
    for (var i = 0; i < 4; i++) {
      b.add({ w: 0.68, h: 0.07, d: 0.05, x: 0, y: 1.18 - i * 0.16, z: 0.24, c: 0xb0563f });
    }
    b.add({ w: 0.16, h: 0.16, d: 0.06, x: -0.2, y: 1.42, z: 0.28, c: 0x2b2b2b });
    b.add({ w: 0.16, h: 0.16, d: 0.06, x: 0.2, y: 1.42, z: 0.28, c: 0x2b2b2b });
    b.add({ w: 0.24, h: 0.08, d: 0.06, x: 0, y: 1.22, z: 0.28, c: 0x2b2b2b });  // 怒嘴
    // 火焰
    b.add({ w: 0.4, h: 0.32, d: 0.3, x: -0.12, y: 1.86, z: 0, c: 0xff8a2b });
    b.add({ w: 0.3, h: 0.3, d: 0.24, x: 0.16, y: 1.92, z: 0, c: 0xffc93c });
    b.add({ w: 0.18, h: 0.34, d: 0.16, x: 0.0, y: 2.12, z: 0, c: 0xffe89a });
    b.add({ w: 0.22, h: 0.22, d: 0.18, x: -0.3, y: 1.78, z: 0, c: 0xff6a1e });
    // 腿
    b.add({ w: 0.22, h: 0.42, d: 0.24, x: -0.24, y: 0.21, z: 0, c: 0x8c3b2f });
    b.add({ w: 0.22, h: 0.42, d: 0.24, x: 0.24, y: 0.21, z: 0, c: 0x8c3b2f });
    b.add({ w: 0.28, h: 0.12, d: 0.32, x: -0.24, y: 0.06, z: 0.05, c: 0x5c2418 });
    b.add({ w: 0.28, h: 0.12, d: 0.32, x: 0.24, y: 0.06, z: 0.05, c: 0x5c2418 });
    return b.build();
  }

  /* 老板：人形 + 西装 + 公文包（全场唯一人形敌人） */
  function enemyBoss() {
    var b = new Builder();
    // 腿
    b.add({ w: 0.3, h: 0.72, d: 0.32, x: -0.22, y: 0.36, z: 0, c: 0x242b3c });
    b.add({ w: 0.3, h: 0.72, d: 0.32, x: 0.22, y: 0.36, z: 0, c: 0x242b3c });
    b.add({ w: 0.36, h: 0.16, d: 0.46, x: -0.22, y: 0.08, z: 0.08, c: 0x161b28 });
    b.add({ w: 0.36, h: 0.16, d: 0.46, x: 0.22, y: 0.08, z: 0.08, c: 0x161b28 });
    // 西装（宽肩）
    b.add({ w: 1.12, h: 1.02, d: 0.62, x: 0, y: 1.25, z: 0, c: 0x2c3550 });
    b.add({ w: 0.32, h: 0.86, d: 0.34, x: -0.68, y: 1.26, z: 0, c: 0x2c3550, rz: 0.12 });
    b.add({ w: 0.32, h: 0.86, d: 0.34, x: 0.68, y: 1.26, z: 0, c: 0x2c3550, rz: -0.12 });
    b.add({ w: 0.3, h: 0.6, d: 0.12, x: 0, y: 1.42, z: 0.33, c: 0xf2f2f2 });    // 衬衫
    b.add({ w: 0.15, h: 0.5, d: 0.1, x: 0, y: 1.52, z: 0.4, c: 0xd63b2f });     // 领带
    b.add({ w: 0.2, h: 0.2, d: 0.12, x: -0.4, y: 1.6, z: 0.32, c: 0xe8b84b });  // 徽章
    // 头（表情严肃）
    b.add({ w: 0.68, h: 0.62, d: 0.62, x: 0, y: 2.1, z: 0, c: 0xf2c49b });
    b.add({ w: 0.74, h: 0.22, d: 0.68, x: 0, y: 2.42, z: 0, c: 0x2b2b33 });
    b.add({ w: 0.14, h: 0.14, d: 0.06, x: -0.18, y: 2.14, z: 0.32, c: 0x2b2b2b });
    b.add({ w: 0.14, h: 0.14, d: 0.06, x: 0.18, y: 2.14, z: 0.32, c: 0x2b2b2b });
    b.add({ w: 0.3, h: 0.07, d: 0.06, x: 0, y: 1.9, z: 0.32, c: 0x2b2b2b });    // 板着的脸
    b.add({ w: 0.26, h: 0.08, d: 0.06, x: -0.2, y: 2.28, z: 0.32, c: 0x2b2b2b }); // 皱眉
    b.add({ w: 0.26, h: 0.08, d: 0.06, x: 0.2, y: 2.28, z: 0.32, c: 0x2b2b2b });
    // 公文包
    b.add({ w: 0.24, h: 0.62, d: 0.72, x: -0.86, y: 0.98, z: 0, c: 0x6b4423 });
    b.add({ w: 0.1, h: 0.16, d: 0.3, x: -0.86, y: 1.38, z: 0, c: 0x4a2e17 });
    b.add({ w: 0.26, h: 0.1, d: 0.16, x: -0.86, y: 1.02, z: 0.3, c: 0xd8b25a });
    return b.build();
  }

  /* 临时会议：日历 + 会议邀请（会跳） */
  function enemyMeeting() {
    var b = new Builder();
    b.add({ w: 1.05, h: 1.1, d: 0.34, x: 0, y: 1.05, z: 0, c: 0xf2f4f8 });      // 日历板
    b.add({ w: 1.12, h: 0.3, d: 0.4, x: 0, y: 1.72, z: 0, c: 0xd63b2f });       // 红色日历头
    b.add({ w: 0.86, h: 0.16, d: 0.05, x: 0, y: 1.72, z: 0.22, c: 0xf7f3e8 });  // 头部白条
    // 顶部装订环
    b.add({ w: 0.12, h: 0.22, d: 0.12, x: -0.32, y: 1.98, z: 0, c: 0x9aa4b0 });
    b.add({ w: 0.12, h: 0.22, d: 0.12, x: 0.32, y: 1.98, z: 0, c: 0x9aa4b0 });
    // 日期格子
    for (var r = 0; r < 3; r++) {
      for (var c2 = 0; c2 < 3; c2++) {
        b.add({ w: 0.22, h: 0.18, d: 0.05, x: -0.32 + c2 * 0.32, y: 1.36 - r * 0.28, z: 0.2, c: 0xc9d2e0 });
      }
    }
    b.add({ w: 0.3, h: 0.28, d: 0.06, x: 0.0, y: 1.08, z: 0.22, c: 0xffc93c }); // 高亮会议日
    b.add({ w: 0.16, h: 0.16, d: 0.06, x: -0.22, y: 1.58, z: 0.22, c: 0x2b2b2b }); // 眼
    b.add({ w: 0.16, h: 0.16, d: 0.06, x: 0.22, y: 1.58, z: 0.22, c: 0x2b2b2b });
    // 腿
    b.add({ w: 0.2, h: 0.5, d: 0.22, x: -0.26, y: 0.25, z: 0, c: 0x5b6472 });
    b.add({ w: 0.2, h: 0.5, d: 0.22, x: 0.26, y: 0.25, z: 0, c: 0x5b6472 });
    b.add({ w: 0.26, h: 0.12, d: 0.3, x: -0.26, y: 0.06, z: 0.05, c: 0x39404e });
    b.add({ w: 0.26, h: 0.12, d: 0.3, x: 0.26, y: 0.06, z: 0.05, c: 0x39404e });
    return b.build();
  }

  /* 例会：会议室造型 + 循环箭头 + 时钟（会不断产出普通需求） */
  function enemyStandup() {
    var b = new Builder();
    // 会议室主体
    b.add({ w: 1.5, h: 1.35, d: 0.95, x: 0, y: 1.12, z: 0, c: 0x5b6fd8 });       // 墙体
    b.add({ w: 1.58, h: 0.16, d: 1.02, x: 0, y: 1.86, z: 0, c: 0x3f4fb0 });      // 顶
    b.add({ w: 1.32, h: 0.86, d: 0.08, x: 0, y: 1.16, z: 0.5, c: 0x9fd6ff, a: 0.5 }); // 玻璃窗
    // 会议桌与小人影（窗内）
    b.add({ w: 0.86, h: 0.12, d: 0.34, x: 0, y: 0.86, z: 0.28, c: 0xb98d55 });
    b.add({ w: 0.16, h: 0.3, d: 0.16, x: -0.3, y: 1.06, z: 0.28, c: 0x2b3140 });
    b.add({ w: 0.16, h: 0.3, d: 0.16, x: 0.3, y: 1.06, z: 0.28, c: 0x2b3140 });
    // 循环箭头（黄环片段）
    var ring = [[-0.42, 1.98], [-0.14, 2.12], [0.14, 2.12], [0.42, 1.98], [0.5, 1.7], [-0.5, 1.7]];
    for (var i = 0; i < ring.length; i++) {
      b.add({ w: 0.22, h: 0.2, d: 0.2, x: ring[i][0], y: ring[i][1], z: 0, c: 0xffc93c });
    }
    b.add({ w: 0.26, h: 0.16, d: 0.2, x: 0.52, y: 2.12, z: 0, c: 0xffa62b });   // 箭头尖
    // 时钟
    b.add({ w: 0.44, h: 0.44, d: 0.1, x: -0.42, y: 1.28, z: 0.52, c: 0xf2f4f8 });
    b.add({ w: 0.06, h: 0.18, d: 0.05, x: -0.42, y: 1.34, z: 0.58, c: 0x2b2b2b });
    b.add({ w: 0.14, h: 0.06, d: 0.05, x: -0.36, y: 1.28, z: 0.58, c: 0x2b2b2b });
    // 眼睛
    b.add({ w: 0.16, h: 0.16, d: 0.06, x: 0.18, y: 1.44, z: 0.56, c: 0x2b2b2b });
    b.add({ w: 0.16, h: 0.16, d: 0.06, x: 0.5, y: 1.44, z: 0.56, c: 0x2b2b2b });
    // 腿
    b.add({ w: 0.26, h: 0.46, d: 0.28, x: -0.42, y: 0.23, z: 0, c: 0x3f4fb0 });
    b.add({ w: 0.26, h: 0.46, d: 0.28, x: 0.42, y: 0.23, z: 0, c: 0x3f4fb0 });
    b.add({ w: 0.32, h: 0.12, d: 0.38, x: -0.42, y: 0.06, z: 0.05, c: 0x2b3572 });
    b.add({ w: 0.32, h: 0.12, d: 0.38, x: 0.42, y: 0.06, z: 0.05, c: 0x2b3572 });
    return b.build();
  }

  /* ========================================================================
   *  小道具
   * ======================================================================*/
  function projectile() {   // 交付物
    var b = new Builder();
    b.add({ w: 0.34, h: 0.34, d: 0.34, x: 0, y: 0, z: 0, c: 0xf7f3e8 });
    b.add({ w: 0.36, h: 0.1, d: 0.36, x: 0, y: 0.08, z: 0, c: 0xd63b2f });
    b.add({ w: 0.2, h: 0.06, d: 0.06, x: 0, y: -0.08, z: 0.18, c: 0x8c8c96 });
    return b.build();
  }
  function waterBall() {    // 水花
    var b = new Builder();
    b.add({ w: 0.36, h: 0.3, d: 0.32, x: 0, y: 0, z: 0, c: 0x59c2f0, a: 0.85 });
    b.add({ w: 0.2, h: 0.2, d: 0.2, x: 0.16, y: 0.16, z: 0.1, c: 0x9fe0ff, a: 0.8 });
    b.add({ w: 0.14, h: 0.14, d: 0.14, x: -0.18, y: 0.12, z: -0.1, c: 0x9fe0ff, a: 0.7 });
    return b.build();
  }
  function hrWave() {       // 约谈话术波
    var b = new Builder();
    b.add({ w: 0.16, h: 0.42, d: 0.42, x: 0, y: 0, z: 0, c: 0xffd23f, a: 0.9 });
    b.add({ w: 0.1, h: 0.26, d: 0.26, x: 0.16, y: 0, z: 0, c: 0xffe89a, a: 0.8 });
    return b.build();
  }
  function coffeeCup() {    // 天降咖啡
    var b = new Builder();
    b.add({ w: 0.46, h: 0.44, d: 0.46, x: 0, y: 0.22, z: 0, c: 0xf7f3e8 });
    b.add({ w: 0.38, h: 0.06, d: 0.38, x: 0, y: 0.46, z: 0, c: 0x6b3b17 });
    b.add({ w: 0.12, h: 0.2, d: 0.12, x: 0.3, y: 0.26, z: 0, c: 0xf7f3e8 });
    b.add({ w: 0.56, h: 0.08, d: 0.56, x: 0, y: 0.04, z: 0, c: 0xd9d2c0 });
    return b.build();
  }
  function leavePaper() {   // 年假审批单
    var b = new Builder();
    b.add({ w: 0.86, h: 1.1, d: 0.08, x: 0, y: 0, z: 0, c: 0xf7f3e8 });
    b.add({ w: 0.62, h: 0.1, d: 0.05, x: 0, y: 0.38, z: 0.06, c: 0xd63b2f });
    b.add({ w: 0.62, h: 0.07, d: 0.05, x: 0, y: 0.16, z: 0.06, c: 0x8c8c96 });
    b.add({ w: 0.62, h: 0.07, d: 0.05, x: 0, y: 0.0, z: 0.06, c: 0x8c8c96 });
    b.add({ w: 0.34, h: 0.34, d: 0.05, x: 0.18, y: -0.32, z: 0.06, c: 0xd63b2f });
    b.add({ w: 0.2, h: 0.2, d: 0.04, x: 0.18, y: -0.32, z: 0.1, c: 0xf7f3e8 });
    return b.build();
  }
  function debris() {       // 通用小碎片
    var b = new Builder();
    b.add({ w: 0.22, h: 0.22, d: 0.22, x: 0, y: 0, z: 0, c: 0xffffff });
    return b.build();
  }

  /* ========================================================================
   *  场景
   * ======================================================================*/
  function buildScene(opt) {
    var g = new THREE.Group();
    var b = new Builder();
    var COLS = opt.cols, ROWS = opt.rows, CELL = opt.cell;
    var halfW = COLS * CELL / 2, halfD = ROWS * CELL / 2;
    var deskX = -halfW - 3.2;             // 大长桌中心
    var officeX = halfW + 2.9;            // 老板办公室中心

    // ---- 地面：整块 + 5×9 格子地毯 + 格线 ----
    b.add({ w: 64, h: 0.5, d: 26, x: 0, y: -0.3, z: 0, c: 0x8a8f9c });           // 大地板
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = (c - (COLS - 1) / 2) * CELL;
        var z = (r - (ROWS - 1) / 2) * CELL;
        var col = ((r + c) % 2 === 0) ? 0x4fa8a0 : 0x479990;                     // 青绿地毯
        b.add({ w: CELL - 0.12, h: 0.16, d: CELL - 0.12, x: x, y: 0.06, z: z, c: col });
        // 格子边框亮线
        b.add({ w: CELL - 0.02, h: 0.02, d: 0.06, x: x, y: 0.15, z: z - CELL / 2 + 0.06, c: 0x6fc4bb });
        b.add({ w: CELL - 0.02, h: 0.02, d: 0.06, x: x, y: 0.15, z: z + CELL / 2 - 0.06, c: 0x6fc4bb });
        b.add({ w: 0.06, h: 0.02, d: CELL - 0.02, x: x - CELL / 2 + 0.06, y: 0.15, z: z, c: 0x6fc4bb });
        b.add({ w: 0.06, h: 0.02, d: CELL - 0.02, x: x + CELL / 2 - 0.06, y: 0.15, z: z, c: 0x6fc4bb });
      }
    }

    // ---- 左侧大长桌 + 5 工位 ----
    var deskW = 5.6;
    b.add({ w: deskW, h: 0.26, d: halfD * 2 + 2.6, x: deskX, y: 1.32, z: 0, c: 0xc9995c }); // 桌面
    b.add({ w: deskW - 0.5, h: 0.22, d: halfD * 2 + 2.2, x: deskX, y: 1.1, z: 0, c: 0x8d6a3f });
    b.add({ w: 0.3, h: 1.1, d: 0.3, x: deskX - deskW / 2 + 0.35, y: 0.55, z: -halfD - 1.0, c: 0x7a5a36 });
    b.add({ w: 0.3, h: 1.1, d: 0.3, x: deskX - deskW / 2 + 0.35, y: 0.55, z: halfD + 1.0, c: 0x7a5a36 });
    b.add({ w: 0.3, h: 1.1, d: 0.3, x: deskX + deskW / 2 - 0.35, y: 0.55, z: -halfD - 1.0, c: 0x7a5a36 });
    b.add({ w: 0.3, h: 1.1, d: 0.3, x: deskX + deskW / 2 - 0.35, y: 0.55, z: halfD + 1.0, c: 0x7a5a36 });

    for (var rr = 0; rr < ROWS; rr++) {
      var z2 = (rr - (ROWS - 1) / 2) * CELL;
      // 显示器
      b.add({ w: 0.5, h: 0.5, d: 0.12, x: deskX - 1.15, y: 1.72, z: z2, c: 0x39404e });
      b.add({ w: 0.16, h: 0.26, d: 0.16, x: deskX - 1.15, y: 1.5, z: z2, c: 0x2b3140 });
      b.add({ w: 0.42, h: 0.38, d: 0.04, x: deskX - 1.15, y: 1.74, z: z2 + 0.09, c: 0x7fe0ff });
      // 键盘 + 鼠标 + 水杯
      b.add({ w: 0.66, h: 0.07, d: 0.3, x: deskX - 1.15, y: 1.49, z: z2 + 0.55, c: 0xe8e8e2 });
      b.add({ w: 0.16, h: 0.1, d: 0.22, x: deskX - 0.72, y: 1.5, z: z2 + 0.55, c: 0xd8d8d2 });
      b.add({ w: 0.16, h: 0.24, d: 0.16, x: deskX - 1.75, y: 1.57, z: z2 + 0.42, c: 0xf2f2ec });
      // 组员（坐在桌后的小人）
      b.add({ w: 0.62, h: 0.6, d: 0.4, x: deskX - 2.05, y: 1.75, z: z2, c: [0x4a90d9, 0x7ec850, 0xe8552f, 0x9b59b6, 0xe0a63c][rr] });
      b.add({ w: 0.5, h: 0.46, d: 0.46, x: deskX - 2.05, y: 2.28, z: z2, c: 0xf2c49b });
      b.add({ w: 0.54, h: 0.16, d: 0.5, x: deskX - 2.05, y: 2.5, z: z2, c: 0x2b2b2b });
      b.add({ w: 0.1, h: 0.1, d: 0.05, x: deskX - 1.9, y: 2.3, z: z2 + 0.24, c: 0x2b2b2b });
      b.add({ w: 0.1, h: 0.1, d: 0.05, x: deskX - 2.2, y: 2.3, z: z2 + 0.24, c: 0x2b2b2b });
      // 椅子
      b.add({ w: 0.66, h: 0.14, d: 0.62, x: deskX - 2.75, y: 1.0, z: z2, c: 0x3a4152 });
      b.add({ w: 0.18, h: 0.86, d: 0.62, x: deskX - 3.06, y: 1.42, z: z2, c: 0x3a4152 });
      b.add({ w: 0.14, h: 0.86, d: 0.14, x: deskX - 2.75, y: 0.5, z: z2, c: 0x545c70 });

      // 工位上方 4 个文件盘槽位（放在桌面右侧、靠近战场一侧）
      for (var s = 0; s < 4; s++) {
        var sx = deskX + 0.62 + s * 0.72;
        b.add({ w: 0.62, h: 0.12, d: 0.86, x: sx, y: 1.52, z: z2, c: 0xd8d8d2 });   // 盘底
        b.add({ w: 0.62, h: 0.3, d: 0.1, x: sx, y: 1.66, z: z2 - 0.4, c: 0xb8bcc6 }); // 后挡板
        b.add({ w: 0.1, h: 0.3, d: 0.86, x: sx - 0.28, y: 1.66, z: z2, c: 0xb8bcc6 });
        b.add({ w: 0.1, h: 0.3, d: 0.86, x: sx + 0.28, y: 1.66, z: z2, c: 0xb8bcc6 });
      }
    }

    // ---- 右侧老板办公室（玻璃隔间，高度压低保证能看清内部） ----
    var officeW = 4.6, officeD = halfD * 2 + 2.4;
    b.add({ w: officeW, h: 0.22, d: officeD, x: officeX, y: 0.1, z: 0, c: 0xb0b6c2 });  // 地台
    // 玻璃幕墙（前后两片 + 右片）
    b.add({ w: officeW, h: 2.7, d: 0.16, x: officeX, y: 1.55, z: -officeD / 2, c: 0x9fd6ff, a: 0.22 });
    b.add({ w: officeW, h: 2.7, d: 0.16, x: officeX, y: 1.55, z: officeD / 2, c: 0x9fd6ff, a: 0.22 });
    b.add({ w: 0.16, h: 2.7, d: officeD, x: officeX + officeW / 2, y: 1.55, z: 0, c: 0x9fd6ff, a: 0.22 });
    for (var p = 0; p <= 5; p++) {
      var pz = -officeD / 2 + p * (officeD / 5);
      b.add({ w: 0.24, h: 2.85, d: 0.24, x: officeX - officeW / 2, y: 1.52, z: pz, c: 0x5b6472 });
      b.add({ w: 0.24, h: 2.85, d: 0.24, x: officeX + officeW / 2, y: 1.52, z: pz, c: 0x5b6472 });
    }
    b.add({ w: officeW, h: 0.22, d: 0.34, x: officeX, y: 2.92, z: -officeD / 2, c: 0x6b7382 });
    b.add({ w: officeW, h: 0.22, d: 0.34, x: officeX, y: 2.92, z: officeD / 2, c: 0x6b7382 });
    b.add({ w: 0.34, h: 0.22, d: officeD, x: officeX + officeW / 2, y: 2.92, z: 0, c: 0x6b7382 });
    // 门框（敌人从这里出来）
    b.add({ w: 0.3, h: 3.1, d: 0.3, x: officeX - officeW / 2, y: 1.65, z: -1.6, c: 0x444c5c });
    b.add({ w: 0.3, h: 3.1, d: 0.3, x: officeX - officeW / 2, y: 1.65, z: 1.6, c: 0x444c5c });
    b.add({ w: 0.3, h: 0.34, d: 3.5, x: officeX - officeW / 2, y: 3.12, z: 0, c: 0x444c5c });
    // 办公室里的大班台 + 显示器 + 书柜 + 盆栽（靠内摆放，保证可见）
    b.add({ w: 2.3, h: 0.22, d: 1.15, x: officeX + 0.55, y: 1.24, z: 0, c: 0x8d5a2b });
    b.add({ w: 2.1, h: 1.0, d: 0.95, x: officeX + 0.55, y: 0.7, z: 0, c: 0x6b4423 });
    b.add({ w: 0.18, h: 0.2, d: 1.0, x: officeX + 1.55, y: 1.1, z: 0, c: 0x5c3a1c });
    b.add({ w: 0.8, h: 0.5, d: 0.5, x: officeX + 0.15, y: 1.6, z: 0, c: 0x2b3140 });   // 显示器
    b.add({ w: 0.62, h: 0.38, d: 0.05, x: officeX + 0.15, y: 1.62, z: -0.28, c: 0x7fe0ff });
    b.add({ w: 0.55, h: 0.95, d: 0.55, x: officeX + 1.35, y: 1.85, z: 0, c: 0x2c3550 }); // 老板椅背
    b.add({ w: 0.62, h: 0.16, d: 0.58, x: officeX + 1.55, y: 1.12, z: 0, c: 0x39445e });
    b.add({ w: 1.5, h: 2.1, d: 0.45, x: officeX + 1.35, y: 1.3, z: -3.6, c: 0x6b4423 }); // 书柜
    b.add({ w: 1.25, h: 0.12, d: 0.4, x: officeX + 1.35, y: 1.0, z: -3.6, c: 0x8d5a2b });
    b.add({ w: 1.25, h: 0.12, d: 0.4, x: officeX + 1.35, y: 1.75, z: -3.6, c: 0x8d5a2b });
    b.add({ w: 0.26, h: 0.5, d: 0.28, x: officeX + 0.95, y: 1.2, z: -3.55, c: 0xd63b2f });
    b.add({ w: 0.26, h: 0.5, d: 0.28, x: officeX + 1.35, y: 1.2, z: -3.55, c: 0x3a6fd8 });
    b.add({ w: 0.26, h: 0.5, d: 0.28, x: officeX + 1.75, y: 1.2, z: -3.55, c: 0x7ec850 });
    b.add({ w: 0.55, h: 0.45, d: 0.55, x: officeX + 1.5, y: 0.35, z: 3.6, c: 0xc96f4a });  // 盆栽
    b.add({ w: 0.75, h: 0.65, d: 0.75, x: officeX + 1.5, y: 1.0, z: 3.6, c: 0x3fa94f });
    b.add({ w: 0.5, h: 0.5, d: 0.5, x: officeX + 1.75, y: 1.5, z: 3.5, c: 0x54c466 });
    // 门牌（金色大牌，暗示“老板办公室”）
    b.add({ w: 0.14, h: 0.9, d: 1.7, x: officeX - officeW / 2 - 0.06, y: 2.35, z: 0, c: 0xd8b25a });
    b.add({ w: 0.08, h: 0.58, d: 1.3, x: officeX - officeW / 2 - 0.15, y: 2.35, z: 0, c: 0x2b3140 });
    b.add({ w: 0.06, h: 0.16, d: 0.9, x: officeX - officeW / 2 - 0.2, y: 2.5, z: 0, c: 0xd8b25a });
    b.add({ w: 0.06, h: 0.16, d: 0.6, x: officeX - officeW / 2 - 0.2, y: 2.25, z: 0, c: 0xd8b25a });

    // ---- 办公室氛围陈设 ----
    // 隔断（战场上下两侧低隔板）
    for (var q = 0; q < COLS; q++) {
      var qx = (q - (COLS - 1) / 2) * CELL;
      b.add({ w: CELL - 0.28, h: 0.9, d: 0.12, x: qx, y: 0.45, z: -halfD - 0.85, c: 0xd8dee6 });
      b.add({ w: CELL - 0.28, h: 0.9, d: 0.12, x: qx, y: 0.45, z: halfD + 0.85, c: 0xd8dee6 });
      b.add({ w: CELL - 0.28, h: 0.1, d: 0.16, x: qx, y: 0.92, z: -halfD - 0.85, c: 0x8f97a8 });
      b.add({ w: CELL - 0.28, h: 0.1, d: 0.16, x: qx, y: 0.92, z: halfD + 0.85, c: 0x8f97a8 });
    }
    // 绿植
    function plant(px, pz, s) {
      b.add({ w: 0.62 * s, h: 0.5 * s, d: 0.62 * s, x: px, y: 0.25 * s, z: pz, c: 0xc96f4a });
      b.add({ w: 0.5 * s, h: 0.16 * s, d: 0.5 * s, x: px, y: 0.54 * s, z: pz, c: 0xb25c3a });
      b.add({ w: 0.18 * s, h: 1.1 * s, d: 0.18 * s, x: px, y: 1.1 * s, z: pz, c: 0x2f7a3d });
      b.add({ w: 0.72 * s, h: 0.5 * s, d: 0.72 * s, x: px, y: 1.35 * s, z: pz, c: 0x3fa94f });
      b.add({ w: 0.56 * s, h: 0.42 * s, d: 0.56 * s, x: px + 0.2 * s, y: 1.72 * s, z: pz - 0.1 * s, c: 0x54c466 });
      b.add({ w: 0.4 * s, h: 0.36 * s, d: 0.4 * s, x: px - 0.22 * s, y: 1.66 * s, z: pz + 0.16 * s, c: 0x2f9e4f });
    }
    plant(-halfW - 6.4, -halfD - 2.2, 1.2);
    plant(-halfW - 6.4, halfD + 2.2, 1.2);
    plant(halfW + 6.6, -halfD - 2.6, 1.1);
    plant(halfW + 6.6, halfD + 2.6, 1.1);
    plant(halfW - 1.2, -halfD - 2.0, 0.9);
    plant(-halfW + 1.2, halfD + 2.0, 0.9);

    // 饮水机
    b.add({ w: 0.8, h: 1.15, d: 0.72, x: -halfW - 6.2, y: 0.58, z: 3.4, c: 0xe8e8e2 });
    b.add({ w: 0.62, h: 0.85, d: 0.6, x: -halfW - 6.2, y: 1.6, z: 3.4, c: 0x59c2f0, a: 0.72 });
    b.add({ w: 0.3, h: 0.16, d: 0.2, x: -halfW - 5.78, y: 0.86, z: 3.4, c: 0x39404e });

    // 白板（战场后方）
    b.add({ w: 4.2, h: 2.3, d: 0.18, x: halfW - 3.0, y: 1.9, z: -halfD - 3.2, c: 0xf2f4f8 });
    b.add({ w: 4.5, h: 0.16, d: 0.3, x: halfW - 3.0, y: 3.1, z: -halfD - 3.2, c: 0x9aa4b0 });
    b.add({ w: 4.5, h: 0.16, d: 0.3, x: halfW - 3.0, y: 0.72, z: -halfD - 3.2, c: 0x9aa4b0 });
    b.add({ w: 1.5, h: 0.12, d: 0.06, x: halfW - 4.0, y: 2.35, z: -halfD - 3.1, c: 0xd63b2f });
    b.add({ w: 2.2, h: 0.12, d: 0.06, x: halfW - 3.2, y: 1.95, z: -halfD - 3.1, c: 0x3a6fd8 });
    b.add({ w: 1.8, h: 0.12, d: 0.06, x: halfW - 3.4, y: 1.55, z: -halfD - 3.1, c: 0x7ec850 });

    // 地面装饰条（浅色地面不会显得空）
    b.add({ w: 62, h: 0.06, d: 1.2, x: 0, y: -0.02, z: -halfD - 4.2, c: 0x767c8a });
    b.add({ w: 62, h: 0.06, d: 1.2, x: 0, y: -0.02, z: halfD + 4.2, c: 0x767c8a });

    var mesh = b.build();
    mesh.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    g.add(mesh);
    return { group: g, deskX: deskX, officeX: officeX };
  }

  global.VOX = {
    Builder: Builder,
    coffeeMachine: coffeeMachine,
    ddlCannon: ddlCannon,
    scapegoat: scapegoat,
    fishTank: fishTank,
    resignLetter: resignLetter,
    fakeBusy: fakeBusy,
    bbqGrill: bbqGrill,
    hrTalk: hrTalk,
    enemyDoc: enemyDoc,
    enemyUrgent: enemyUrgent,
    enemyBoss: enemyBoss,
    enemyMeeting: enemyMeeting,
    enemyStandup: enemyStandup,
    projectile: projectile,
    waterBall: waterBall,
    hrWave: hrWave,
    coffeeCup: coffeeCup,
    leavePaper: leavePaper,
    debris: debris,
    buildScene: buildScene
  };
})(window);
