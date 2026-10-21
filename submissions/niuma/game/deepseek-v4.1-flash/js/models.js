/* =============================================================================
 * models.js — 全部体素模型（单位 / 敌人 / 场景陈设）
 * 约定：所有模型「正面朝 +X」，几何体原点在模型脚下 (0,0,0)。
 *       敌人实例只需 group.rotation.y = Math.PI 即可转向左边（朝工位）。
 * 每个模型拆成 1~4 个可独立转动的部件（腿 / 手臂 / 炮管…），
 * 部件几何体全局共享，实例化时不复制顶点数据。
 * ===========================================================================*/
(function (global) {
  'use strict';
  var P = Vox.PAL;
  var B = Vox.Builder;
  var rotY = Vox.rotY, rotZ = Vox.rotZ, rotX = Vox.rotX;

  var MODELS = {}, inited = false;
  function def(name, factory) { MODELS[name] = { factory: factory, geo: null, pos: null, mat: null }; }

  // ------------------------------------------------------------------ 通用零件
  /** 一沓纸（堆叠层数 n），返回在 b 里 */
  function paperStack(b, cx, cy, cz, w, d, n, colA, colB, step) {
    step = step || 0.09;
    for (var i = 0; i < n; i++) {
      var off = (i % 2 ? 1 : -1) * 0.012 * (i + 1);
      b.box(cx + off, cy + i * step, cz - off, w - i * 0.012, step * 0.86, d - i * 0.012, i % 2 ? colB : colA,
        { topLight: true });
    }
  }
  /** 文档顶面的“文字行” */
  function textLines(b, cx, cy, cz, w, d, rows, col) {
    for (var i = 0; i < rows; i++) {
      var t = rows === 1 ? 0 : (i / (rows - 1) - 0.5);
      b.box(cx, cy, cz + t * d * 0.75, w, 0.016, d * 0.13, col, { shade: false });
    }
  }
  /* =======================================================================
   *  敌 方
   * =====================================================================*/

  // 普通需求 —— 一沓需求文档，会走路
  def('enemy_normal', function () {
    var body = new B(), legL = new B(), legR = new B(), armL = new B(), armR = new B();
    paperStack(body, 0, 0.12, 0, 0.56, 0.46, 4, P.paper, P.paperD, 0.1);
    textLines(body, 0, 0.435, 0, 0.34, 0.3, 3, P.inkD);
    // 正面一张“有表情”的纸
    body.box(0.295, 0.3, 0, 0.03, 0.24, 0.34, P.paper, { topLight: true });
    body.box(0.315, 0.34, -0.09, 0.02, 0.07, 0.06, P.ink, { shade: false });
    body.box(0.315, 0.34, 0.09, 0.02, 0.07, 0.06, P.ink, { shade: false });
    body.box(0.315, 0.255, 0, 0.02, 0.03, 0.12, P.redD, { shade: false });
    // 红头文件条
    body.box(0, 0.42, 0, 0.5, 0.035, 0.42, P.red, { topLight: true });
    // 腿
    legL.box(0, 0.06, -0.12, 0.12, 0.12, 0.12, P.ink);
    legR.box(0, 0.06, 0.12, 0.12, 0.12, 0.12, P.ink);
    // 手：两片飞起来的纸
    armL.box(0.06, 0, 0, 0.22, 0.03, 0.3, P.paper);
    armR.box(0.06, 0, 0, 0.22, 0.03, 0.3, P.paperD);
    return {
      parts: { body: body, legL: legL, legR: legR, armL: armL, armR: armR },
      pos: { legL: [0, 0, -0.12], legR: [0, 0, 0.12], armL: [0, 0.2, -0.3], armR: [0, 0.2, 0.3] }
    };
  });

  // 加急需求 —— 冒火的需求文档
  def('enemy_urgent', function () {
    var body = new B(), legL = new B(), legR = new B(), armL = new B(), armR = new B();
    paperStack(body, 0, 0.14, 0, 0.62, 0.52, 4, P.paper, P.paperD, 0.11);
    textLines(body, 0, 0.49, 0, 0.38, 0.32, 3, P.inkD);
    // 火焰
    body.box(0, 0.62, 0, 0.42, 0.1, 0.36, P.orange);
    body.box(0.02, 0.7, 0, 0.28, 0.1, 0.24, P.yellow, { topLight: true });
    body.box(-0.12, 0.74, 0.1, 0.1, 0.1, 0.1, P.orange);
    body.box(0.1, 0.76, -0.1, 0.09, 0.1, 0.09, P.yellow);
    // 表情
    body.box(0.325, 0.32, 0, 0.03, 0.26, 0.38, P.paper, { topLight: true });
    body.box(0.345, 0.37, -0.1, 0.02, 0.08, 0.07, P.ink, { shade: false });
    body.box(0.345, 0.37, 0.1, 0.02, 0.08, 0.07, P.ink, { shade: false });
    body.box(0.345, 0.26, 0, 0.02, 0.04, 0.16, P.inkD, { shade: false });
    // “急”字牌
    body.box(0, 0.5, 0.315, 0.2, 0.18, 0.03, P.red, { shade: false });
    legL.box(0, 0.07, -0.14, 0.13, 0.14, 0.13, P.ink);
    legR.box(0, 0.07, 0.14, 0.13, 0.14, 0.13, P.ink);
    armL.box(0.06, 0, 0, 0.24, 0.035, 0.34, P.paper);
    armR.box(0.06, 0, 0, 0.24, 0.035, 0.34, P.paperD);
    return {
      parts: { body: body, legL: legL, legR: legR, armL: armL, armR: armR },
      pos: { legL: [0, 0, -0.14], legR: [0, 0, 0.14], armL: [0, 0.24, -0.34], armR: [0, 0.24, 0.34] }
    };
  });

  // 老板 —— 唯一的人形敌人，背着手 / 拎公文包
  def('enemy_boss', function () {
    var body = new B(), legL = new B(), legR = new B(), armL = new B(), armR = new B(), s = 1.35;
    // 腿
    legL.box(0, 0.16, -0.14, 0.15, 0.32, 0.14, P.suitD);
    legR.box(0, 0.16, 0.14, 0.15, 0.32, 0.14, P.suitD);
    legL.box(0.03, 0.03, -0.14, 0.2, 0.07, 0.15, P.ink);
    legR.box(0.03, 0.03, 0.14, 0.2, 0.07, 0.15, P.ink);
    // 西服躯干
    body.box(0, 0.6, 0, 0.42, 0.56, 0.36, P.suit, { topLight: true });
    body.box(0, 0.44, 0, 0.44, 0.16, 0.38, P.suitD);
    // 衬衫 + 领带
    body.box(0.2, 0.72, 0, 0.04, 0.3, 0.2, P.white);
    body.box(0.22, 0.62, 0, 0.04, 0.24, 0.09, P.tie);
    body.box(0.19, 0.79, 0, 0.05, 0.1, 0.19, P.suit);
    // 头
    body.box(0.01, 0.98, 0, 0.28, 0.28, 0.28, P.skin, { topLight: true });
    body.box(-0.02, 1.09, 0, 0.3, 0.06, 0.3, P.hairB);          // 头发
    body.box(-0.13, 1.0, 0, 0.06, 0.14, 0.28, P.hairB);
    // 眼镜（对老板来说是标配）
    body.box(0.145, 0.99, -0.08, 0.02, 0.08, 0.09, P.white, { shade: false });
    body.box(0.145, 0.99, 0.08, 0.02, 0.08, 0.09, P.white, { shade: false });
    body.box(0.15, 0.99, -0.08, 0.015, 0.035, 0.04, P.ink, { shade: false });
    body.box(0.15, 0.99, 0.08, 0.015, 0.035, 0.04, P.ink, { shade: false });
    // 皱眉
    body.box(0.14, 1.055, -0.085, 0.02, 0.03, 0.1, P.hairB, { shade: false, mat: rotZ(-14) });
    body.box(0.14, 1.055, 0.085, 0.02, 0.03, 0.1, P.hairB, { shade: false, mat: rotZ(14) });
    body.box(0.15, 0.92, 0, 0.02, 0.03, 0.1, P.inkD, { shade: false });
    // 手背在身后
    armL.box(-0.02, 0, 0, 0.34, 0.11, 0.11, P.suit);
    armR.box(-0.02, 0, 0, 0.34, 0.11, 0.11, P.suit);
    body.box(-0.2, 0.56, 0, 0.14, 0.16, 0.36, P.skin);
    // 公文包
    body.box(-0.16, 0.42, 0.34, 0.34, 0.26, 0.12, P.coffee);
    body.box(-0.16, 0.42, 0.34, 0.36, 0.05, 0.14, P.coffeeL);
    body.box(-0.16, 0.62, 0.34, 0.06, 0.06, 0.06, P.yellow);
    return {
      parts: { body: body, legL: legL, legR: legR, armL: armL, armR: armR },
      pos: { legL: [0, 0, -0.14], legR: [0, 0, 0.14], armL: [0, 0.78, -0.22], armR: [0, 0.72, 0.22] },
      size: { w: 0.62, h: 1.2 }
    };
  });

  // 临时会议 —— 一张会走路的会议邀请 / 日历
  def('enemy_meeting', function () {
    var body = new B(), legL = new B(), legR = new B();
    body.box(0, 0.32, 0, 0.5, 0.52, 0.5, P.white, { topLight: true, mat: rotY(6) });
    body.box(0, 0.55, 0, 0.52, 0.09, 0.52, P.red);
    body.box(0.26, 0.36, 0, 0.03, 0.3, 0.34, P.cream, { topLight: true });
    // 时钟脸
    body.box(0.28, 0.34, 0, 0.02, 0.2, 0.2, P.steel);
    body.box(0.295, 0.38, 0, 0.015, 0.02, 0.1, P.ink, { shade: false, mat: rotX(0) });
    body.box(0.295, 0.34, 0.045, 0.015, 0.08, 0.02, P.ink, { shade: false });
    body.box(0.3, 0.36, -0.12, 0.02, 0.05, 0.05, P.ink, { shade: false });
    body.box(0.3, 0.36, 0.12, 0.02, 0.05, 0.05, P.ink, { shade: false });
    // “会议”标签
    body.box(-0.01, 0.06, 0.26, 0.24, 0.14, 0.03, P.blue, { shade: false });
    // 顶上的小旗
    body.box(-0.1, 0.68, 0, 0.04, 0.24, 0.04, P.steelD);
    body.box(-0.02, 0.76, 0, 0.16, 0.12, 0.02, P.orange, { shade: false });
    legL.box(0, 0.06, -0.14, 0.13, 0.12, 0.13, P.ink);
    legR.box(0, 0.06, 0.14, 0.13, 0.12, 0.13, P.ink);
    return { parts: { body: body, legL: legL, legR: legR }, pos: { legL: [0, 0, -0.14], legR: [0, 0, 0.14] } };
  });

  // 例会 —— 一个会走路的小会议室（每 10s 吐出一个新需求）
  def('enemy_standup', function () {
    var body = new B(), legL = new B(), legR = new B(), flag = new B();
    // 房体（前面敞开，能看见里面的会）
    body.box(0, 0.42, 0.31, 0.7, 0.72, 0.06, P.wall);
    body.box(0, 0.42, -0.31, 0.7, 0.72, 0.06, P.wallD);
    body.box(-0.32, 0.42, 0, 0.06, 0.72, 0.68, P.wallD);
    body.box(0, 0.04, 0, 0.7, 0.08, 0.68, P.dark);
    body.box(0, 0.81, 0, 0.74, 0.1, 0.72, P.wall, { topLight: true });
    body.box(0, 0.62, -0.31, 0.6, 0.24, 0.04, P.screen, { shade: false }); // 白板
    // 会议桌
    body.box(-0.06, 0.3, 0, 0.34, 0.05, 0.5, P.wood, { topLight: true });
    body.box(-0.06, 0.17, 0, 0.3, 0.22, 0.44, P.woodD);
    body.box(0.05, 0.34, 0.06, 0.16, 0.03, 0.2, P.paper);
    // 三个开会的人（小方块人）
    body.box(-0.13, 0.42, -0.19, 0.13, 0.2, 0.13, P.shirtRed);
    body.box(-0.13, 0.56, -0.19, 0.14, 0.13, 0.14, P.skin);
    body.box(-0.13, 0.42, 0.19, 0.13, 0.2, 0.13, P.shirtBlue);
    body.box(-0.13, 0.56, 0.19, 0.14, 0.13, 0.14, P.skin);
    body.box(0.09, 0.42, 0, 0.13, 0.2, 0.13, P.shirtYellow);
    body.box(0.09, 0.56, 0, 0.14, 0.13, 0.14, P.skin);
    // 腿
    legL.box(0, 0.09, -0.2, 0.15, 0.18, 0.15, P.ink);
    legR.box(0, 0.09, 0.2, 0.15, 0.18, 0.15, P.ink);
    // 举着的“例会”旗
    flag.box(0, 0, 0, 0.04, 0.5, 0.04, P.steelD);
    flag.box(0.14, 0.16, 0, 0.26, 0.18, 0.03, P.purple, { shade: false });
    return {
      parts: { body: body, legL: legL, legR: legR, flag: flag },
      pos: { legL: [0, 0, -0.2], legR: [0, 0, 0.2], flag: [-0.34, 0.62, 0] },
      size: { w: 0.7, h: 1.0 }
    };
  });

  /* =======================================================================
   *  我 方
   * =====================================================================*/

  // 咖啡机 —— 经济核心
  def('u_coffee', function () {
    var body = new B(), cup = new B();
    body.box(0, 0.36, 0, 0.46, 0.72, 0.46, P.darker, { topLight: true });
    body.box(0, 0.74, 0, 0.5, 0.08, 0.5, P.steel);
    body.box(0, 0.16, 0, 0.52, 0.06, 0.52, P.dark);
    body.box(0, 0.5, 0.24, 0.34, 0.2, 0.03, P.screen, { shade: false });   // 屏幕
    body.box(0, 0.5, 0.24, 0.2, 0.06, 0.035, P.green, { shade: false });
    body.box(0.245, 0.6, 0, 0.03, 0.3, 0.34, P.steel);                     // 侧面
    body.box(0.245, 0.42, 0, 0.05, 0.09, 0.09, P.red);                     // 按钮
    body.box(0, 0.28, 0.22, 0.26, 0.16, 0.1, P.dark);                      // 出水口
    body.box(0, 0.12, 0.1, 0.3, 0.1, 0.3, P.steelD);                       // 底座
    body.box(-0.2, 0.66, 0, 0.08, 0.16, 0.4, P.dark);
    // 旁边的杯子
    cup.box(0, 0, 0, 0.15, 0.16, 0.15, P.white);
    cup.box(0, 0.08, 0, 0.13, 0.02, 0.13, P.coffee);
    return { parts: { body: body, cup: cup }, pos: { cup: [-0.32, 0.09, 0.12] } };
  });

  // DDL 加农炮 —— 本行基础直线输出
  def('u_cannon', function () {
    var body = new B(), barrel = new B(), sign = new B(), wheels = new B();
    // 底盘
    body.box(-0.05, 0.22, 0, 0.5, 0.2, 0.46, P.steelD, { topLight: true });
    body.box(-0.05, 0.36, 0, 0.34, 0.14, 0.34, P.steel);
    body.box(-0.05, 0.06, 0, 0.46, 0.1, 0.44, P.dark);
    // 炮身
    body.box(-0.06, 0.52, 0, 0.4, 0.26, 0.32, P.blue);
    body.box(-0.14, 0.52, 0, 0.1, 0.28, 0.34, P.blueD);
    // 炮管（可后坐的独立部件，朝 +X）
    barrel.box(0.24, 0, 0, 0.5, 0.17, 0.17, P.steel);
    barrel.box(0.47, 0, 0, 0.09, 0.22, 0.22, P.dark);
    barrel.box(0.1, 0, 0, 0.14, 0.21, 0.21, P.steelD);
    // 大红倒计时牌（DDL 是第一生产力）
    sign.box(0, 0, 0, 0.34, 0.26, 0.05, P.red, { topLight: true });
    sign.box(0, 0.02, 0.03, 0.22, 0.14, 0.02, P.white, { shade: false });
    sign.box(0, 0.02, 0.042, 0.12, 0.05, 0.01, P.ink, { shade: false });
    // 轮子
    wheels.box(0, 0, 0, 0.16, 0.16, 0.16, P.ink);
    return {
      parts: { body: body, barrel: barrel, sign: sign, wheels: wheels },
      pos: { barrel: [0.08, 0.52, 0], sign: [-0.08, 0.82, 0], wheels: [-0.05, 0.1, 0] }
    };
  });

  // 背锅侠 —— 纯肉盾
  def('u_scapegoat', function () {
    var body = new B(), legL = new B(), legR = new B(), pot = new B();
    // 人
    body.box(0, 0.2, -0.1, 0.13, 0.4, 0.13, P.pants);
    body.box(0, 0.2, 0.1, 0.13, 0.4, 0.13, P.pants);
    body.box(0.01, 0.04, -0.1, 0.17, 0.08, 0.14, P.ink);
    body.box(0.01, 0.04, 0.1, 0.17, 0.08, 0.14, P.ink);
    body.box(0, 0.52, 0, 0.34, 0.34, 0.28, P.shirtGreen, { topLight: true });
    body.box(0, 0.94, 0.01, 0.3, 0.28, 0.28, P.skin, { topLight: true });
    body.box(-0.02, 1.04, 0.01, 0.32, 0.1, 0.3, P.hairN);
    body.box(0.145, 0.94, -0.07, 0.025, 0.06, 0.05, P.ink, { shade: false });
    body.box(0.145, 0.94, 0.07, 0.025, 0.06, 0.05, P.ink, { shade: false });
    body.box(0.15, 0.86, 0, 0.02, 0.03, 0.08, P.inkD, { shade: false });
    // 抬手托锅
    body.box(0.03, 0.66, -0.2, 0.12, 0.28, 0.11, P.shirtGreen, { mat: rotZ(18) });
    body.box(0.03, 0.66, 0.2, 0.12, 0.28, 0.11, P.shirtGreen, { mat: rotZ(18) });
    // 汗滴
    body.box(0.16, 1.06, -0.14, 0.05, 0.06, 0.05, P.cyan, { shade: false });
    // 大锅（背在背上）
    pot.box(-0.2, 0, 0, 0.24, 0.62, 0.62, P.darker, { topLight: true });
    pot.box(-0.3, 0, 0, 0.06, 0.68, 0.68, P.dark);
    pot.box(-0.14, 0.3, 0, 0.14, 0.06, 0.5, P.steelD);
    pot.box(-0.14, -0.3, 0, 0.14, 0.06, 0.5, P.steelD);
    pot.box(-0.34, 0.16, 0.26, 0.06, 0.3, 0.06, P.steel);
    return {
      parts: { body: body, legL: legL, legR: legR, pot: pot },
      pos: { legL: [0, 0, -0.1], legR: [0, 0, 0.1], pot: [0, 0.66, 0] },
      size: { w: 0.62, h: 1.1 }
    };
  });

  // 摸鱼鱼缸 —— 输出 + 减速
  def('u_fishtank', function () {
    var body = new B(), water = new B(), fish = new B();
    body.box(0, 0.3, 0, 0.5, 0.06, 0.5, P.woodD, { topLight: true });   // 架
    body.box(0, 0.15, 0, 0.42, 0.24, 0.42, P.wood);
    // 玻璃缸（glass 材质）
    body.box(0, 0.66, 0, 0.5, 0.52, 0.5, P.glass);
    // 缸里
    water.box(0, 0.6, 0, 0.44, 0.36, 0.44, P.water, { shade: false });
    water.box(-0.16, 0.48, -0.14, 0.1, 0.22, 0.1, P.plant);
    water.box(0.14, 0.52, 0.16, 0.14, 0.3, 0.12, P.plantD);
    water.box(0.0, 0.5, 0.1, 0.16, 0.1, 0.16, P.coffeeL);
    // 小鱼
    fish.box(0, 0, 0, 0.2, 0.12, 0.1, P.orange, { topLight: true });
    fish.box(-0.13, 0, 0, 0.1, 0.1, 0.03, P.orangeD);
    fish.box(-0.16, 0.05, 0, 0.06, 0.06, 0.02, P.orange);
    fish.box(0.1, 0.03, -0.03, 0.02, 0.03, 0.03, P.ink, { shade: false });
    return { parts: { body: body, water: water, fish: fish }, pos: { fish: [0.04, 0.62, -0.04] } };
  });

  // 辞职信 —— 全场清场（但可能真的被批准）
  def('u_resign', function () {
    var body = new B(), letter = new B();
    body.box(0, 0.04, 0, 0.5, 0.08, 0.5, P.woodD, { topLight: true });
    body.box(-0.2, 0.3, 0, 0.04, 0.5, 0.04, P.steelD);
    body.box(0.2, 0.3, 0, 0.04, 0.5, 0.04, P.steelD);
    body.box(0, 0.55, 0, 0.5, 0.04, 0.04, P.steelD);
    // 信纸（会飘起来 / 闪红）
    letter.box(0, 0, 0, 0.44, 0.36, 0.5, P.white, { topLight: true });
    letter.box(0, 0, 0, 0.4, 0.37, 0.03, P.cream);
    letter.box(0, 0.1, 0.255, 0.3, 0.05, 0.02, P.ink, { shade: false });
    letter.box(0, 0.0, 0.255, 0.3, 0.05, 0.02, P.ink, { shade: false });
    letter.box(0, -0.1, 0.255, 0.2, 0.05, 0.02, P.red, { shade: false });
    letter.box(0, 0, -0.26, 0.44, 0.36, 0.03, P.paperD);
    return { parts: { body: body, letter: letter }, pos: { letter: [0, 0.72, 0] } };
  });

  // 假装在忙 —— 低价秒杀（需要 15s 武装时间）
  def('u_fakebusy', function () {
    var body = new B(), screen = new B(), armed = new B();
    // 桌子
    body.box(0, 0.36, 0, 0.56, 0.06, 0.5, P.wood, { topLight: true });
    body.box(0, 0.18, -0.2, 0.5, 0.36, 0.05, P.woodD);
    body.box(0, 0.18, 0.2, 0.5, 0.36, 0.05, P.woodD);
    // 显示器
    body.box(-0.06, 0.5, 0, 0.12, 0.22, 0.3, P.dark);
    body.box(-0.02, 0.58, 0, 0.04, 0.28, 0.36, P.darker);
    // 屏幕（常亮 = 障眼法）
    screen.box(-0.02, 0, 0, 0.02, 0.24, 0.3, P.screen, { shade: false });
    screen.box(-0.02, 0.06, 0, 0.025, 0.03, 0.2, P.white, { shade: false });
    screen.box(-0.02, -0.02, -0.05, 0.025, 0.03, 0.1, P.green, { shade: false });
    // 椅子 + 搭在椅背上的外套
    body.box(0.2, 0.22, 0, 0.3, 0.06, 0.3, P.dark);
    body.box(0.31, 0.4, 0, 0.06, 0.3, 0.3, P.dark);
    body.box(0.34, 0.46, 0, 0.08, 0.28, 0.34, P.shirtBlue, { topLight: true });
    body.box(0.2, 0.04, 0, 0.06, 0.12, 0.06, P.steelD);
    // 武装完成后的红警示（初始隐藏）
    armed.box(0, 0, 0, 0.42, 0.06, 0.42, P.red, { shade: false });
    armed.box(0, 0.72, 0, 0.2, 0.2, 0.04, P.red, { shade: false });
    armed.box(0, 0.78, 0, 0.05, 0.12, 0.05, P.white, { shade: false });
    armed.box(0, 0.68, 0, 0.05, 0.05, 0.05, P.white, { shade: false });
    return { parts: { body: body, screen: screen, armed: armed }, pos: { screen: [-0.09, 0.58, 0], armed: [0, 0.12, 0] } };
  });

  // 【自创 1】全员邮件 —— 跨行打击，向每一行的最左敌人各投递一封
  def('u_massmail', function () {
    var body = new B(), plane = new B(), lights = new B();
    // 机柜
    body.box(0, 0.42, 0, 0.5, 0.84, 0.44, P.dark, { topLight: true });
    body.box(0, 0.06, 0, 0.54, 0.12, 0.48, P.darker);
    body.box(0, 0.85, 0, 0.54, 0.06, 0.48, P.steelD);
    // 散热栅格
    for (var i = 0; i < 5; i++) body.box(0.26, 0.3 + i * 0.09, 0, 0.02, 0.04, 0.3, P.darker);
    // 正面的 @ 标志（用方块拼）
    var at = 0.255;
    body.box(at, 0.62, 0, 0.02, 0.02, 0.3, P.cyan, { shade: false });
    body.box(at, 0.62, -0.15, 0.02, 0.28, 0.02, P.cyan, { shade: false });
    body.box(at, 0.62, 0.15, 0.02, 0.28, 0.02, P.cyan, { shade: false });
    body.box(at, 0.76, 0, 0.02, 0.02, 0.3, P.cyan, { shade: false });
    body.box(at, 0.55, 0.09, 0.02, 0.14, 0.02, P.cyan, { shade: false });
    // 指示灯
    lights.box(0, 0, 0, 0.06, 0.06, 0.06, P.green, { shade: false });
    lights.box(0.1, 0, 0, 0.06, 0.06, 0.06, P.yellow, { shade: false });
    lights.box(0.2, 0, 0, 0.06, 0.06, 0.06, P.redD, { shade: false });
    // 纸飞机（会绕着机柜飞）
    plane.box(0, 0, 0, 0.3, 0.03, 0.24, P.white, { topLight: true });
    plane.box(-0.1, 0, 0, 0.12, 0.03, 0.12, P.cream);
    plane.box(0.08, 0.04, 0, 0.14, 0.06, 0.16, P.white);
    return { parts: { body: body, plane: plane, lights: lights }, pos: { plane: [0, 1.1, 0], lights: [-0.12, 0.28, 0.24] } };
  });

  // 【自创 2】老板画的饼 —— 光环：附近友军攻速提升（不叠加）
  def('u_pie', function () {
    var body = new B(), pie = new B(), halo = new B(), bubble = new B();
    // 小讲台
    body.box(0, 0.3, 0, 0.14, 0.6, 0.14, P.woodD, { topLight: true });
    body.box(0, 0.06, 0, 0.34, 0.12, 0.34, P.wood);
    // 悬浮的饼
    pie.box(0, 0, 0, 0.44, 0.1, 0.44, P.orange, { topLight: true });
    pie.box(0, 0.06, 0, 0.38, 0.06, 0.38, P.yellow);
    pie.box(0, 0.1, 0, 0.3, 0.03, 0.3, P.orangeD);
    pie.box(0.2, 0.02, 0.2, 0.1, 0.09, 0.1, P.cream);   // 缺角
    // 头顶的思考气泡（“画”出来的）
    bubble.box(0, 0, 0, 0.34, 0.22, 0.34, P.white);
    bubble.box(-0.1, -0.14, 0.08, 0.1, 0.1, 0.1, P.white);
    bubble.box(0.02, -0.22, 0.06, 0.06, 0.06, 0.06, P.white);
    bubble.box(0.02, 0, 0, 0.06, 0.16, 0.06, P.yellow, { shade: false });
    bubble.box(0.02, 0.07, 0, 0.2, 0.06, 0.06, P.yellow, { shade: false });
    // 光环
    halo.box(0, 0, 0, 0.6, 0.03, 0.6, P.yellow, { shade: false });
    halo.box(0, 0, 0, 0.68, 0.02, 0.68, P.yellowD, { shade: false });
    return {
      parts: { body: body, pie: pie, halo: halo, bubble: bubble },
      pos: { pie: [0, 0.78, 0], halo: [0, 0.66, 0], bubble: [0, 1.18, 0] }
    };
  });

  /* =======================================================================
   *  场 景 陈 设
   * =====================================================================*/

  // 工位（长桌 + 显示器 + 键盘 + 杂物），x 区间 [-5.9,-4.55]
  def('prop_desk', function () {
    var b = new B();
    b.box(-5.22, 0.72, 0, 1.4, 0.09, 5.5, P.woodL, { topLight: true });
    b.box(-5.22, 0.66, 0, 1.32, 0.06, 5.42, P.woodD);
    b.box(-5.22, 0.34, 0, 1.16, 0.62, 0.14, P.woodD);
    for (var r = 0; r < 5; r++) {
      var z = -2 + r;
      b.box(-5.85, 0.33, z, 0.3, 0.66, 0.12, P.woodD);   // 桌腿
      b.box(-5.85, 0.6, z, 0.34, 0.08, 0.34, P.woodD);   // 桌下走线盒
    }
    return { parts: { all: b } };
  });

  // 单个工位的桌面装备（每行一件，颜色可定制）
  def('prop_gear', function () {
    var b = new B();
    b.box(-5.1, 0.9, 0, 0.1, 0.5, 0.66, P.dark);          // 显示器立柱
    b.box(-5.16, 1.12, 0, 0.06, 0.5, 0.72, P.darker);
    b.box(-5.22, 1.14, 0, 0.03, 0.42, 0.62, P.screen, { shade: false });
    b.box(-5.23, 1.24, 0, 0.02, 0.06, 0.4, P.white, { shade: false });
    b.box(-5.23, 1.1, -0.14, 0.02, 0.06, 0.24, P.green, { shade: false });
    b.box(-5.1, 0.79, 0, 0.34, 0.04, 0.3, P.darker);      // 键盘
    b.box(-5.16, 0.79, 0.36, 0.1, 0.05, 0.14, P.steel);   // 鼠标
    b.box(-4.8, 0.82, -0.38, 0.14, 0.16, 0.14, P.white);  // 马克杯
    b.box(-4.8, 0.9, -0.38, 0.12, 0.02, 0.12, P.coffee);
    b.box(-4.75, 0.78, 0.42, 0.24, 0.05, 0.3, P.paper);   // 便签
    b.box(-4.75, 0.81, 0.42, 0.22, 0.02, 0.26, P.yellow);
    return { parts: { all: b } };
  });

  // 组员（坐在工位上，颜色可变）
  def('prop_worker_0', function () { return workerDef(P.shirtBlue); });
  def('prop_worker_1', function () { return workerDef(P.shirtRed); });
  def('prop_worker_2', function () { return workerDef(P.shirtYellow); });
  def('prop_worker_3', function () { return workerDef(P.shirtPurple); });
  def('prop_worker_4', function () { return workerDef(P.shirtCyan); });
  function workerDef(shirt) {
    var body = new B(), armL = new B(), armR = new B(), chair = new B();
    // 椅子
    chair.box(0, 0.34, 0, 0.36, 0.08, 0.36, P.dark);
    chair.box(-0.24, 0.6, 0, 0.1, 0.5, 0.36, P.darker);
    chair.box(0, 0.15, 0, 0.08, 0.36, 0.08, P.steelD);
    chair.box(0, 0.04, 0, 0.34, 0.06, 0.34, P.darker);
    // 坐姿的人：大腿平放 + 小腿下垂
    body.box(0.1, 0.42, -0.11, 0.34, 0.13, 0.13, P.pants);
    body.box(0.1, 0.42, 0.11, 0.34, 0.13, 0.13, P.pants);
    body.box(0.25, 0.26, -0.11, 0.13, 0.32, 0.12, P.pants);
    body.box(0.25, 0.26, 0.11, 0.13, 0.32, 0.12, P.pants);
    body.box(0.28, 0.08, -0.11, 0.18, 0.08, 0.13, P.ink);
    body.box(0.28, 0.08, 0.11, 0.18, 0.08, 0.13, P.ink);
    body.box(0, 0.62, 0, 0.3, 0.34, 0.28, shirt, { topLight: true });
    body.box(0.0, 0.98, 0, 0.3, 0.28, 0.28, P.skin, { topLight: true });
    body.box(-0.03, 1.08, 0, 0.32, 0.1, 0.3, P.hairB);
    body.box(0.12, 1.0, 0, 0.08, 0.08, 0.29, P.hairB);
    body.box(0.145, 0.98, -0.07, 0.025, 0.06, 0.05, P.ink, { shade: false });
    body.box(0.145, 0.98, 0.07, 0.025, 0.06, 0.05, P.ink, { shade: false });
    // 手臂（敲键盘 / 抱头，可动画）
    armL.box(0.22, 0, 0, 0.12, 0.34, 0.1, shirt);
    armR.box(0.22, 0, 0, 0.12, 0.34, 0.1, shirt);
    return {
      parts: { body: body, armL: armL, armR: armR, chair: chair },
      pos: { armL: [0.14, 0.78, -0.17], armR: [0.14, 0.78, 0.17] },
      size: { w: 0.5, h: 1.2 }
    };
  }

  // 槽位托盘（4 个/工位）：空盘 + 已堆积的文件
  def('prop_tray', function () {
    var empty = new B(), full = new B();
    empty.box(0, 0, 0, 0.42, 0.03, 0.44, P.steel);
    empty.box(0, 0.09, 0.2, 0.42, 0.16, 0.03, P.steelD);
    empty.box(0, 0.09, -0.2, 0.42, 0.16, 0.03, P.steelD);
    empty.box(-0.2, 0.09, 0, 0.03, 0.16, 0.44, P.steelD);
    full.box(0, 0.06, 0.01, 0.38, 0.06, 0.38, P.paper, { topLight: true });
    full.box(0, 0.12, -0.01, 0.36, 0.06, 0.36, P.paperD);
    full.box(0, 0.18, 0.01, 0.34, 0.06, 0.34, P.paper, { topLight: true });
    full.box(0, 0.24, 0, 0.32, 0.06, 0.32, P.paperD);
    full.box(0.05, 0.29, 0, 0.24, 0.03, 0.24, P.red, { shade: false });
    return { parts: { empty: empty, full: full } };
  });

  // 老板办公室（玻璃隔间 + 办公桌 + 老板剪影）
  def('prop_bossroom', function () {
    var b = new B(), glass = new B();
    var x0 = 5.7, x1 = 9.2, z0 = -3.6, z1 = 3.0, h = 3.0;
    // 地台
    b.box((x0 + x1) / 2, 0.06, (z0 + z1) / 2, x1 - x0, 0.12, z1 - z0, P.wood);
    // 后墙 & 侧墙
    b.box((x0 + x1) / 2, h / 2, z0, x1 - x0, h, 0.16, P.wallD);
    b.box(x1, h / 2, (z0 + z1) / 2, 0.16, h, z1 - z0, P.wallD);
    // 玻璃隔断（面向战场）
    glass.box(x0, h / 2, (z0 + z1) / 2 - 0.05, 0.08, h, z1 - z0, P.glass);
    // 老板的大办公桌
    b.box(8.2, 0.72, 0.4, 1.5, 0.1, 2.4, P.woodD, { topLight: true });
    b.box(8.2, 0.4, 0.4, 1.3, 0.6, 0.2, P.wood);
    b.box(8.6, 0.9, -0.6, 0.5, 0.36, 0.7, P.dark);      // 显示器背面
    b.box(8.2, 0.78, 1.3, 0.3, 0.05, 0.5, P.paper);
    b.box(8.5, 0.8, -1.6, 0.16, 0.2, 0.16, P.white);    // 咖啡杯
    // 老板椅
    b.box(8.9, 0.6, 0.4, 0.5, 0.14, 0.5, P.darker);
    b.box(9.05, 1.0, 0.4, 0.14, 0.8, 0.5, P.darker);
    // 墙上的“最佳老板”奖状
    b.box(7.4, 1.9, z0 + 0.12, 0.7, 0.5, 0.04, P.woodL);
    b.box(7.4, 1.9, z0 + 0.16, 0.56, 0.36, 0.02, P.cream);
    return { parts: { all: b, glass: glass }, mat: { glass: 'glass' } };
  });

  // 大绿植
  def('prop_plant', function () {
    var b = new B();
    b.box(0, 0.24, 0, 0.46, 0.48, 0.46, P.pot, { topLight: true });
    b.box(0, 0.5, 0, 0.52, 0.06, 0.52, P.potD);
    b.box(0, 0.72, 0, 0.12, 0.44, 0.12, P.plantD);
    for (var i = 0; i < 6; i++) {
      var a = i * 60 * Math.PI / 180;
      b.box(Math.cos(a) * 0.26, 0.98 + (i % 2) * 0.16, Math.sin(a) * 0.26, 0.4, 0.42, 0.12, i % 2 ? P.plant : P.plantD,
        { topLight: true, mat: rotY(i * 60) });
    }
    b.box(0, 1.34, 0, 0.34, 0.3, 0.34, P.plant, { topLight: true });
    return { parts: { all: b } };
  });

  // 饮水机
  def('prop_cooler', function () {
    var b = new B();
    b.box(0, 0.5, 0, 0.5, 1.0, 0.46, P.white, { topLight: true });
    b.box(0, 1.14, 0, 0.28, 0.5, 0.28, P.water);
    b.box(0, 1.42, 0, 0.12, 0.1, 0.12, P.steel);
    b.box(0.26, 0.7, 0, 0.04, 0.14, 0.3, P.blue);
    b.box(0, 1.0, 0.24, 0.3, 0.24, 0.04, P.screen, { shade: false });
    return { parts: { all: b } };
  });

  // 白板
  def('prop_whiteboard', function () {
    var b = new B();
    b.box(0, 1.3, 0, 2.6, 1.5, 0.12, P.white, { topLight: true });
    b.box(0, 1.3, 0, 2.72, 1.62, 0.06, P.steelD);
    b.box(-0.8, 1.6, 0.1, 0.7, 0.5, 0.03, P.pink);
    b.box(0.1, 1.5, 0.1, 0.5, 0.4, 0.03, P.cyan);
    b.box(0.8, 1.7, 0.1, 0.5, 0.3, 0.03, P.yellow);
    b.box(0, 0.5, 0, 0.16, 1.0, 0.16, P.steelD);
    b.box(0, 0.06, 0, 1.0, 0.12, 0.6, P.steelD);
    return { parts: { all: b } };
  });

  // 文件柜
  def('prop_cabinet', function () {
    var b = new B();
    b.box(0, 0.62, 0, 0.9, 1.24, 0.5, P.steel, { topLight: true });
    for (var i = 0; i < 3; i++) {
      b.box(0.46, 0.28 + i * 0.4, 0, 0.04, 0.34, 0.42, P.steelD);
      b.box(0.49, 0.44 + i * 0.4, 0, 0.03, 0.05, 0.16, P.dark);
    }
    b.box(0.3, 1.28, 0.1, 0.3, 0.12, 0.28, P.paper);
    return { parts: { all: b } };
  });

  // 会议室隔板（通透的，不会挡视线）
  def('prop_partition', function () {
    var b = new B();
    b.box(0, 0.9, 0, 1.0, 1.0, 0.1, P.shirtCyan, { topLight: true });
    b.box(0, 1.42, 0, 1.08, 0.1, 0.14, P.steelD);
    b.box(0, 0.4, 0, 0.14, 0.8, 0.14, P.steelD);
    b.box(0, 0.06, 0, 0.7, 0.12, 0.5, P.steelD);
    return { parts: { all: b } };
  });

  // 天花板灯
  def('prop_lamp', function () {
    var b = new B();
    b.box(0, 0.9, 0, 0.9, 0.16, 0.3, P.white, { topLight: true });
    b.box(0, 0.78, 0, 0.86, 0.08, 0.26, P.cream, { shade: false });
    b.box(0, 1.1, 0, 0.05, 0.4, 0.05, P.steelD);
    return { parts: { all: b } };
  });

  // 地上的箱子
  def('prop_box', function () {
    var b = new B();
    b.box(0, 0.2, 0, 0.6, 0.4, 0.5, P.coffeeL, { topLight: true });
    b.box(0, 0.41, 0, 0.62, 0.04, 0.52, P.woodD);
    b.box(0, 0.2, 0.26, 0.3, 0.2, 0.03, P.paper);
    return { parts: { all: b } };
  });

  /* =======================================================================
   *  效果 / 标记物
   * =====================================================================*/

  // 格子高亮框（可缩放）
  def('fx_cellframe', function () {
    var b = new B(), o = 0.47, t = 0.075;
    b.box(0, 0, -o, o * 2 + t, 0.03, t, P.white, { shade: false });
    b.box(0, 0, o, o * 2 + t, 0.03, t, P.white, { shade: false });
    b.box(-o, 0, 0, t, 0.03, o * 2 + t, P.white, { shade: false });
    b.box(o, 0, 0, t, 0.03, o * 2 + t, P.white, { shade: false });
    return { parts: { all: b } };
  });

  // 年假审批单
  def('fx_leave', function () {
    var b = new B();
    b.box(0, 0, 0, 0.92, 0.06, 0.62, P.white, { topLight: true });
    b.box(0, 0.04, 0, 0.86, 0.03, 0.18, P.green, { shade: false });
    b.box(-0.22, 0.04, 0, 0.3, 0.03, 0.12, P.inkD, { shade: false });
    b.box(0.22, 0.04, 0, 0.3, 0.03, 0.12, P.red, { shade: false });
    b.box(0, 0.04, 0.2, 0.4, 0.03, 0.1, P.inkD, { shade: false });
    return { parts: { all: b } };
  });

  // 待发出的“工作”小纸片（掉落咖啡因 / 提示用）
  def('fx_coffee_cup', function () {
    var b = new B();
    b.box(0, 0, 0, 0.28, 0.32, 0.28, P.white, { topLight: true });
    b.box(0, 0.14, 0, 0.3, 0.06, 0.3, P.coffee);
    b.box(0, 0.19, 0, 0.3, 0.02, 0.3, P.coffeeL);
    b.box(0.14, 0.16, 0, 0.05, 0.14, 0.04, P.white);
    b.box(0, 0.0, 0, 0.26, 0.06, 0.26, P.cream);
    return { parts: { all: b } };
  });

  // ---------------------------------------------------------------- 实例化
  function init() {
    if (inited) return;
    inited = true;
    for (var k in MODELS) {
      var m = MODELS[k];
      var r = m.factory();
      var geo = {}, pos = {}, mat = {};
      for (var p in r.parts) {
        geo[p] = r.parts[p].geo();
        pos[p] = r.pos && r.pos[p] ? r.pos[p] : [0, 0, 0];
      }
      m.geo = geo; m.pos = pos; m.mat = r.mat || {}; m.size = r.size || null;
    }
  }

  function get(name) { return MODELS[name]; }

  /**
   * 实例化
   * @param name 模型名
   * @param opt  { mat: 'ghost'|'solid'|null, tint: 0xrrggbb }
   */
  function instantiate(name, opt) {
    opt = opt || {};
    var m = MODELS[name];
    var g = new THREE.Group();
    var parts = {};
    for (var p in m.geo) {
      var matKey = opt.mat || (m.mat[p] || 'solid');
      var mat = Vox.MATS[matKey];
      var mesh = new THREE.Mesh(m.geo[p], mat);
      mesh.castShadow = !opt.noShadow && matKey === 'solid';
      mesh.receiveShadow = false;
      mesh.position.set(m.pos[p][0], m.pos[p][1], m.pos[p][2]);
      g.add(mesh);
      parts[p] = mesh;
    }
    g.userData.parts = parts;
    g.userData.model = name;
    return g;
  }

  global.VoxModel = { MODELS: MODELS, init: init, def: def, get: get, instantiate: instantiate, paperStack: paperStack };
})(window);
