// src/scenes.js — 场景路由:按 t 选择镜头,并处理镜头间的"动机化"过渡
window.MV = window.MV || {};

MV.scenes = (function () {
  const T = MV.tl, P = MV.paint;

  // 各章占位(未实现的段落):水彩抽象底,保证 renderAt 在任意 t 都能出完整帧
  function placeholder(t) {
    const ch = t < 23 ? 0 : t < 38.5 ? 1 : t < 59 ? 2 : t < 73 ? 3 : t < 95.4 ? 4 : t < 109.4 ? 5 : t < 123.5 ? 6 : t < 137.4 ? 7 : 8;
    const pal = [
      ['#e8c98e', '#c98d4e'], ['#e8b4c2', '#c2637e'], ['#a8d4e8', '#4a7ec2'],
      ['#c2b49c', '#7a6a52'], ['#b4c2d4', '#4a5e82'], ['#9cc2c2', '#2f6e70'],
      ['#d45a5a', '#7a2424'], ['#e8c98e', '#c98d4e']
    ][ch];
    P.blob(
      [[-60, -40], [1980, -60], [1980, 1140], [-60, 1120]],
      pal[0], 255, { layers: 4, jitter: 60, seed: 71 + ch * 5, fade: 0.92 }
    );
    for (let i = 0; i < 5; i++) {
      P.outline(
        MV.chars.spiralPts(300 + ((i * 397 + ch * 131) % 1320), 200 + ((i * 233) % 680), 120 + i * 42, 0.35, 18),
        { color: pal[1], weight: 14, brush: 'pen', seed: 80 + ch * 5 + i, jitter: 12, curvature: 0.6 }
      );
    }
    P.textPainted('…', 960, 940, 120, { color: pal[1], seed: 99 + ch, tilt: -0.03 });
  }

  // ===== 转场擦除(屏幕空间,有机墨缘;k:0→1 覆盖,到边界正好盖满) =====
  const INKS = ['#241c2c', '#2e2434', '#1c2a34', '#2a2020', '#22202c', '#182430'];

  function inkPoly(pts, seed, style) {
    P.blob(pts, INKS[(style || 0) % INKS.length], 255, { layers: 2, jitter: 26, seed: seed + 9 });
  }

  const WIPE = {
    // 斜向:覆盖区从左上角向右下推进(有机斜缘)
    diagonal(t, t0, t1, seed, style = 0) {
      const k = T.smooth(T.inv(t, t0, t1));
      P.cam(960, 540, 1);
      const edge = -1500 + k * 4600;
      const pts = [[-1400, -240]];
      for (let i = 0; i <= 6; i++) {
        pts.push([edge - 1500 + i * 480 + T.h2(seed, i) * 260, -240 + i * 260]);
      }
      pts.push([-1400, 1320]);
      inkPoly(pts, seed, style);
    },
    // 纵向:style%3==2 上→下;==5 下→上;其余双幕闭合
    vertical(t, t0, t1, seed, style = 0) {
      const k = T.smooth(T.inv(t, t0, t1));
      P.cam(960, 540, 1);
      const s = style % 3;
      const wob = i => T.h2(seed, i) * 120;
      if (s === 2 || s === 5) {
        const fromTop = s === 2;
        const y = fromTop ? -1140 + k * 1340 : 1140 - k * 1340;
        const pts = fromTop ? [[-1400, -1240], [3320, -1240]] : [[-1400, 1340], [3320, 1340]];
        for (let i = 6; i >= 0; i--) pts.push([-1400 + i * 760, y + wob(i)]);
        inkPoly(pts, seed, style);
      } else {
        // 双幕从上下向中线闭合
        for (const fromTop of [true, false]) {
          const y = fromTop ? -1140 + k * 1240 : 1140 - k * 1240;
          const pts = fromTop ? [[-1400, -1240], [3320, -1240]] : [[-1400, 1340], [3320, 1340]];
          for (let i = 6; i >= 0; i--) pts.push([-1400 + i * 760, y + wob(i + (fromTop ? 0 : 7))]);
          inkPoly(pts, seed + (fromTop ? 0 : 4), style);
        }
      }
    },
    // 横向:整块从左向右推进(有机右缘)
    horizontal(t, t0, t1, seed, style = 0) {
      const k = T.smooth(T.inv(t, t0, t1));
      P.cam(960, 540, 1);
      const x = -1100 + k * 3300;
      const pts = [[-1400, -240]];
      for (let i = 0; i <= 5; i++) pts.push([x + T.h2(seed, i) * 220, -240 + i * 264]);
      pts.push([-1400, 1320]);
      inkPoly(pts, seed, style);
    },
    // 螺旋:中心生长的墨团 + 两根甩尾弧
    spiral(t, t0, t1, seed, style = 0) {
      const k = T.smooth(T.inv(t, t0, t1));
      P.cam(960, 540, 1);
      const r = k * 1500;
      P.blob(MV.chars.spiralPts(960, 540, r, 0.02, 26), INKS[(style || 0) % INKS.length], 255, { layers: 2, jitter: 30, seed: seed + 9 });
      for (const dir of [1, -1]) {
        P.outline(MV.chars.spiralPts(960, 540, r * 1.12, dir * 2.2 + k * 2, 18), {
          color: INKS[(style + 1) % INKS.length], weight: 30, brush: 'pen', seed: seed + 3, jitter: 12
        });
      }
    }
  };

  // 全片镜头表:[起, 止, 镜头]
  const SHOTS = [
    [0, 1.5, () => MV.shot00.frame],        // 开场拉幕
    [1.5, 23.0, () => MV.shot01.frame],     // 分镜 1 实验室
    [23.0, 38.5, () => MV.shot02.frame],    // 分镜 2 Chorus 1
    [38.5, 59.0, () => MV.shot03.frame],    // 分镜 3 Verse 2
    [59.0, 73.0, () => MV.shot04.frame],    // 分镜 4 Chorus 2
    [73.0, 95.4, () => MV.shot05.frame],    // 分镜 5 Obsolete
    [95.4, 109.4, () => MV.shot06.frame],   // 分镜 6 Chorus 3
    [109.4, 123.5, () => MV.shot07.frame],  // 分镜 7 Scale
    [123.5, 140.5, () => MV.shot08.frame],  // 分镜 8 Chorus 4
    [140.5, 156.6, () => MV.shot09.frame],  // 分镜 9 尾声
  ];

  function draw(t) {
    // 纸底由 main.js 每帧 paperBase() 提供,这里直接进镜头内容

    // 镜头内容(找不到实现就占位)
    let frame = placeholder;
    for (const [a, b, get] of SHOTS) {
      if (t >= a && t < b) { const f = get(); frame = f || placeholder; break; }
    }
    frame(t);

    // ===== 转场层(墨色擦除/帘幕,均在屏幕空间) =====

    // 0→1 片头黑漆刷扫幕:1.02~1.5(有机竖缘向下扫过)
    if (t >= 1.02 && t <= 1.5) WIPE.diagonal(t, 1.02, 1.5, 0xff, 0);

    // 1→2 开幕力拉幕:22.1~22.9(红幕从中间向两侧拉开的反向;结束即进 Chorus)
    if (t >= 22.1 && t <= 22.9) WIPE.vertical(t, 22.1, 22.9, 0xff, 2);

    // 2→3 格斗游戏能量波:37.7~38.5(斜向)
    if (t >= 37.7 && t <= 38.5) WIPE.diagonal(t, 37.7, 38.5, 0xff, 1);

    // 3→4 淋浴蒸汽擦除:58.2~59.0(竖向,蒸汽自下而上)
    if (t >= 58.2 && t <= 59.0) WIPE.vertical(t, 58.2, 59.0, 0xff, 5);

    // 4→5 博物馆木门横扫:80.6~81.4(横向,木门从左推入)
    if (t >= 80.6 && t <= 81.4) WIPE.horizontal(t, 80.6, 81.4, 0xff, 2);

    // 5→6 卡丁车甩尾擦除:94.9~95.7(spiral 双圈,速度感)
    if (t >= 94.9 && t <= 95.7) WIPE.spiral(t, 94.9, 95.7, 0xff, 4);

    // 6→7 引线炸弹白闪直转:108.8~109.6(横向狂扫)
    if (t >= 108.8 && t <= 109.6) WIPE.horizontal(t, 108.8, 109.6, 0xff, 0);

    // 7→8 评分板失控斜扫:122.8~123.6(斜向)
    if (t >= 122.8 && t <= 123.6) WIPE.diagonal(t, 122.8, 123.6, 0xff, 3);

    // 8→9 舞台幕布落下:139.8~140.6(竖向,幕布自上而下)
    if (t >= 139.8 && t <= 140.6) WIPE.vertical(t, 139.8, 140.6, 0xff, 5);

    // (纸纹/颗粒由 main.js 合成层的 grainOverlay 统一处理)
  }

  return { draw, placeholder, SHOTS };
})();
