/* ============================================================
 * world.js —— 办公室静态场景装配
 * 地板+5×9 网格 / 左侧大长桌+5工位+槽位 / 右侧老板办公室 / 氛围陈设
 * 静态几何尽量合并成 1~2 个 mesh（性能：常驻地只 2 个 draw call）
 * ============================================================ */
'use strict';

const LAYOUT = {
  deskCx: -2.05, deskW: 2.3,      // 大长桌横跨 x [-3.2, -0.9]
  arriveX: -0.78,                 // 敌人抵达线
  officeX0: 9.0,                  // 老板办公室玻璃墙
};

function buildWorld(scene) {
  const solid = new Vox();        // 全部不透明静态体素 → 1 个 mesh
  const R = CFG.GRID_ROWS, C = CFG.GRID_COLS;
  const z0 = -1.6, z1 = 6.4;  // 地板纵向范围（前后留出陈设区）
  const x0 = -3.9, x1 = 11.6;     // 地板横向范围

  /* ---- 地板 ---- */
  solid.box((x0 + x1) / 2, -0.15, (z0 + z1) / 2, x1 - x0, 0.3, z1 - z0, 0xc6d2de); // 基础地面
  // 办公区地毯（网格外缘一圈深色收边）
  solid.box((C - 1) / 2, 0.005, (R - 1) / 2, C + 0.5, 0.012, R + 0.5, 0x9fb4ca);
  // 5×9 地砖：深浅棋盘，格子边界靠留缝可见
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
    const col = ((r + c) % 2 === 0) ? PAL.carpetA : PAL.carpetB;
    solid.box(c, 0.02, r, 0.88, 0.04, 0.88, col);
  }
  // 走道条（每行右侧出怪口前的小地毯）
  for (let r = 0; r < R; r++) solid.box(C - 0.2, 0.021, r, 0.5, 0.038, 0.8, 0x9fb4c9);

  /* ---- 左侧大长桌（横跨 5 行） ---- */
  const dx = LAYOUT.deskCx, dzc = (R - 1) / 2;
  solid.box(dx, 0.36, dzc, 2.1, 0.1, R + 0.6, PAL.wood);              // 桌板
  solid.box(dx - 0.6, 0.17, dzc, 0.16, 0.34, R + 0.5, PAL.woodDk);    // 桌体挡板(靠墙)
  solid.box(dx + 0.95, 0.17, dzc, 0.12, 0.34, R + 0.5, PAL.woodDeep); // 桌沿(战场侧)
  for (let r = 0; r < R; r++) {                                        // 桌腿
    solid.box(dx + 0.7, 0.16, r, 0.1, 0.32, 0.1, PAL.metalDk);
    solid.box(dx - 0.8, 0.16, r, 0.1, 0.32, 0.1, PAL.metalDk);
  }
  // 工位隔断（每行之间的短隔板，突出"5 个工位"感）
  for (let r = 0; r <= R; r++) {
    solid.box(dx, 0.62, r - 0.5, 1.9, 0.42, 0.06, 0x93a7bb);
  }
  // 大长桌背后的墙（画面左缘）+ 公司海报
  solid.box(x0 + 0.25, 1.1, dzc, 0.5, 2.2, R + 1.4, 0xd7cbb8);
  const poster = (z, color) => {
    solid.box(x0 + 0.52, 1.3, z, 0.03, 0.7, 0.9, color);
    solid.box(x0 + 0.54, 1.3, z, 0.01, 0.5, 0.7, PAL.paper);
  };
  poster(0.3, PAL.coral); poster(1.6, PAL.cyan); poster(2.9, PAL.yellow); poster(4.2, PAL.green);
  // 励志标语牌（色块代替文字：打工人的图腾）
  solid.box(x0 + 0.53, 0.55, dzc, 0.02, 0.2, 3.4, PAL.ink);

  /* ---- 右侧老板办公室（玻璃隔间） ---- */
  const ox = LAYOUT.officeX0;
  // 办公室地台（红毯待遇）
  solid.box(ox + 1.5, 0.03, dzc, 3.6, 0.06, R + 0.8, 0xc9a2a8);
  solid.box(ox + 1.5, 0.07, dzc, 2.8, 0.02, R + 0.2, 0xb33b3b);
  // 后墙
  solid.box(11.35, 1.2, dzc, 0.5, 2.4, R + 1, 0xe8ddca);
  // 上下横梁 + 立柱
  solid.box(ox, 1.85, dzc, 0.16, 0.14, R + 0.9, PAL.metalDk);
  solid.box(ox, 0.06, dzc, 0.16, 0.12, R + 0.9, PAL.metalDk);
  for (let r = 0; r <= R; r++) {
    if (r >= 2 && r <= 3) continue;                        // 中间留门
    solid.box(ox, 1.0, r - 0.5, 0.14, 1.8, 0.14, PAL.metalDk);
  }
  // 门楣金框 + "王冠"徽标（老板办公室的排面）
  solid.box(ox, 1.72, 2.5, 0.2, 0.12, 1.15, PAL.metalDk);
  solid.box(ox + 0.12, 1.72, 2.5, 0.02, 0.16, 0.5, PAL.yellow);
  solid.box(ox + 0.12, 1.8, 2.5, 0.02, 0.06, 0.62, PAL.yellow);
  solid.box(ox + 0.12, 1.86, 2.32, 0.02, 0.08, 0.08, PAL.yellow);
  solid.box(ox + 0.12, 1.86, 2.68, 0.02, 0.08, 0.08, PAL.yellow);
  solid.box(ox + 0.12, 1.88, 2.5, 0.02, 0.08, 0.08, PAL.yellow);
  // 门内出怪暗垫（提示"从这出来"）
  solid.box(ox + 0.6, 0.085, 2.5, 0.8, 0.02, 0.9, 0x7c2f2f);
  // 老板办公套装（玻璃后面看得见）
  solid.box(10.5, 0.5, 2.5, 0.7, 0.34, 1.7, PAL.woodDk);          // 大班台
  solid.box(10.5, 0.7, 2.5, 0.75, 0.06, 1.8, PAL.wood);
  solid.box(10.95, 0.95, 2.5, 0.14, 0.24, 0.4, PAL.paper);        // 桌上文件山
  solid.box(10.95, 0.9, 2.1, 0.1, 0.12, 0.16, PAL.coral);         // 马克杯(世界最佳老板)
  // 太师椅 + 老板人影（站班）
  solid.box(10.1, 0.55, 2.5, 0.3, 0.5, 0.4, 0x4a3524);
  solid.box(10.1, 0.95, 2.5, 0.12, 0.5, 0.44, 0x4a3524);
  const silhouette = (z) => {
    solid.box(9.8, 0.34, z, 0.24, 0.44, 0.3, 0x565f6e);           // 人影（半透玻璃后）
    solid.box(9.8, 0.66, z, 0.22, 0.22, 0.22, 0x6b7484);
    solid.box(9.68, 0.5, z, 0.05, 0.4, 0.07, 0x4a525f);
  };
  silhouette(1.7); silhouette(3.3);

  /* ---- 氛围陈设（战场上下沿 + 角落） ---- */
  const deco = new THREE.Group();
  const P = SCENE.plant, W = SCENE.whiteboard, CO = SCENE.cooler, BX = SCENE.boxes3;
  const place = (o, x, z, ry = 0, s = 1) => { o.position.set(x, 0, z); o.rotation.y = ry; o.scale.setScalar(s); deco.add(o); return o; };
  place(P(1.15), -0.2, -1.25);
  place(P(0.85), 8.5, -1.15);
  place(P(1.0), 4.4, 5.6);
  place(P(0.75), -3.55, 5.4);
  place(CO(), -3.4, -1.35);
  place(W(), 6.6, -1.6, Math.PI / 2);
  place(BX(), 1.3, 5.55, 0.6);
  place(BX(), 9.8, 5.35, -0.4, 0.8);
  // 茶水间小吧台（左下角落，咖啡主题呼应）
  const bar = new Vox();
  bar.box(-4.15, 0.45, 5.3, 0.9, 0.9, 1.6, PAL.woodDk);
  bar.box(-4.15, 0.94, 5.3, 1.0, 0.08, 1.7, PAL.wood);
  bar.box(-3.75, 1.15, 5.3, 0.2, 0.3, 1.0, PAL.metalDk);          // 背景墙架
  bar.box(-3.66, 1.05, 5.0, 0.05, 0.12, 0.14, PAL.coral);         // 架子上的杯子
  bar.box(-3.66, 1.05, 5.35, 0.05, 0.12, 0.14, PAL.cyan);
  bar.box(-3.66, 1.05, 5.68, 0.05, 0.12, 0.14, PAL.green);
  solid.p.push(...bar.p); solid.n.push(...bar.n); solid.c.push(...bar.c);

  /* ---- 顶部灯带（放在战场后方高处，不遮挡视线） ---- */
  for (let r = 0; r < 3; r++) solid.box(2 + r * 3, 3.1, -1.5, 2.2, 0.08, 0.3, 0xf2f5f8);
  solid.box(2, 3.4, -1.5, 0.06, 0.6, 0.06, PAL.metalDk);
  solid.box(8, 3.4, -1.5, 0.06, 0.6, 0.06, PAL.metalDk);

  /* ---- 生成网格 ---- */
  const solidMesh = new THREE.Mesh(solid.geom(), new THREE.MeshLambertMaterial({ vertexColors: true }));
  solidMesh.receiveShadow = true;
  scene.add(solidMesh);

  // 玻璃（半透，单独 mesh）
  const glass = new Vox();
  glass.box(LAYOUT.officeX0, 1.0, 0.75, 0.06, 1.5, 1.5, PAL.glass);
  glass.box(LAYOUT.officeX0, 1.0, 1.95, 0.06, 1.5, 0.9, PAL.glass);
  glass.box(LAYOUT.officeX0, 1.0, 4.25, 0.06, 1.5, 1.5, PAL.glass);
  glass.box(LAYOUT.officeX0, 0.5, 2.5, 0.05, 0.9, 0.95, PAL.glass);  // 门半开玻璃
  const gm = new THREE.Mesh(glass.geom(), new THREE.MeshLambertMaterial({
    vertexColors: true, transparent: true, opacity: 0.34, depthWrite: false,
  }));
  scene.add(gm);
  scene.add(deco);

  /* ---- 动态件：5 工位 × (显示器组 + 4 槽位) ---- */
  const stations = [];
  const seatCols = [PAL.purple, PAL.cyan, PAL.green, PAL.yellow, PAL.pink];
  const hairCols = [0x3a2c20, 0x1d1d1f, 0x6b4a2e, 0x8a5f38, 0x2e3440];
  for (let r = 0; r < R; r++) {
    const ws = SCENE.workstation(r, seatCols[r], hairCols[r]);
    ws.position.set(LAYOUT.deskCx - 0.35, 0.42, r);  // 显示器+组员摆在桌面上
    scene.add(ws);
    const trays = [];
    for (let s = 0; s < STATION.SLOTS; s++) {
      const st = SCENE.slotTray();
      st.group.position.set(dx + 0.62, 0.42, r - 0.36 + s * 0.24);
      scene.add(st.group);
      trays.push({ ...st, homeY: 0.42 });
    }
    stations.push({ row: r, trays, used: 0, leave: STATION.LEAVES, ws });
  }
  return { stations, deco };
}
