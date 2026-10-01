// src/shot06.js — 分镜 6 · Chorus 3: Paperclips (95.4–109.4) · steel grey → jazz blue
// 子拍:95.4 回形针落地堆 | 97.5 回形针洪水 | 99.0 急停开关+PTO 海滩 | 100.5 回形针地球
//       102.5 引线炸弹(白闪 BOOM) | 105.4 爵士俱乐部 → 漆刷擦除(scenes 收)
window.MV = window.MV || {};

MV.shot06 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  function steelBg(seed = 280) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#5c6672', 255, { layers: 3, jitter: 36, seed, fade: 0.9 });
    P.blob([[0, 880], [1920, 880], [1920, 1080], [0, 1080]], '#3e4650', 255, { layers: 2, jitter: 20, seed: seed + 1 });
    P.stroke([[0, 884], [1920, 878]], { color: '#2a3038', weight: 12, brush: 'pen', seed: seed + 2, jitter: 8 });
  }

  function clipField(x, y, w, h, n, seed, t = 0) {
    for (let i = 0; i < n; i++) {
      const px = x + T.h2(seed, i) * w, py = y + T.h2(seed + 1, i) * h + sin(t * 1.2 + i) * 8;
      PR.paperclip(px, py, 1.6 + T.h2(seed + 2, i) * 1.4, T.h2(seed + 3, i) * TWO_PI, i % 3 ? '#9aa2ac' : '#c2352f', seed * 7 + i);
    }
  }

  // ---------- 子拍 ----------
  // 95.4–97.4 落进回形针堆 + 回形针机器吐片 + 计量表
  function clipLand(t) {
    const u = T.inv(t, 95.4, 97.5);
    P.cam(960, 540, 1.04 - u * 0.03);
    steelBg(280);
    clipField(60, 700, 1800, 340, 40, 281, t);
    // 研究员摔成一堆
    C.researcher({
      x: 700, y: 940, h: 300, seed: 223, glasses: true, mouth: 'gasp', rot: 1.3, sweat: 0.8,
      armL: -1.8, armR: 1.4, legL: -0.6, legR: 0.4
    });
    for (let i = 0; i < 3; i++) C.star(620 + i * 110, 640 + sin(t * 5 + i) * 18, 24, 10, '#e8c766', 282 + i);
    // 回形针机器(打气筒变体)
    PR.pdMeter(1560, 960, 150, T.lerp(61, 64, u), { pumpK: T.pulse8(t), seed: 374 });
    P.blob(P.roundRectPts(1330, 420, 220, 200, 0.18, 3), '#8a9aa4', 255, { layers: 2, jitter: 8, seed: 283 });
    for (let i = 0; i < 5; i++) {
      const ph = (t * 1.8 + i * 0.2) % 1;
      PR.paperclip(1380 + i * 40 - ph * 260, 560 + ph * 380, 2.2, ph * 6, '#c2c8d0', 284 + i);
    }
    // Clawd 按机器
    C.clawd({ x: 1120, y: 800, h: 300, seed: 136, eyes: 'happy', mouth: 'grin', armL: -0.4, armR: 1.15, crown: true });
    void u;
  }

  // 97.5–98.9 回形针洪水:众人随波起伏,Cowboy 冲浪
  function clipFlood(t) {
    const u = T.inv(t, 97.5, 99.0);
    P.cam(960, 540, 1.02);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#3e4650', 255, { layers: 3, jitter: 36, seed: 285, fade: 0.9 });
    // 三层波
    for (let l = 0; l < 3; l++) {
      const pts = [[-100, 700 + l * 130]];
      for (let k = 0; k <= 8; k++) pts.push([k * 260, 700 + l * 130 - sin(t * 1.8 + k * 1.1 + l) * (70 + l * 30)]);
      pts.push([2020, 1080], [-100, 1080]);
      P.blob(pts, ['#6a7684', '#4e5862', '#2e3640'][l], 255, { layers: 2, jitter: 16, seed: 286 + l });
    }
    clipField(0, 560, 1920, 260, 34, 287, t);
    // 浮沉的众人(只露头/半身)
    for (let i = 0; i < 3; i++) {
      const bx = 360 + i * 520, by = 640 + sin(t * 1.8 + i * 1.2) * 60;
      C.clawd({ x: bx, y: by, h: 220, seed: 137 + i, eyes: 'wide', mouth: 'gasp', armL: -1.9, armR: 1.9, squash: 1.1, shadow: false });
    }
    C.researcher({ x: 1660, y: 700 + sin(t * 1.8 + 3) * 60, h: 240, seed: 224, glasses: true, mouth: 'gasp', armL: -2.0, armR: 2.0, shadow: false });
    // Clawd 站在浪尖冲浪
    C.clawd({
      x: 820, y: 380 + sin(t * 1.8) * 40, h: 300, seed: 140, eyes: 'happy', mouth: 'grin', rot: -0.14,
      armL: -1.4, armR: 1.2, crown: true
    });
    P.blob(P.roundRectPts(650, 520 + sin(t * 1.8) * 40, 380, 30, 0.5, 2), '#c2352f', 255, { layers: 2, jitter: 6, seed: 288 });
    void u;
  }

  // 99.0–100.4 急停开关没人管 → 切海滩度假
  function killswitch(t) {
    const u = T.inv(t, 99.0, 100.5);
    const beach = t > 99.75;
    if (!beach) {
      P.cam(960, 540, 1.05);
      steelBg(289);
      // 大红急停按钮
      P.blob(P.roundRectPts(520, 300, 480, 520, 0.1, 3), '#3e4650', 255, { layers: 2, jitter: 10, seed: 290 });
      P.ellipseBlob(760, 520, 170, 170, '#c2352f', 255, { layers: 3, jitter: 10, seed: 291, n: 22 });
      P.outline(C.spiralPts(760, 520, 190, 0.02, 20), { color: '#7a2424', weight: 14, brush: 'pen', seed: 292, jitter: 6 });
      P.textPainted('KILLSWITCH', 760, 220, 78, { color: '#f2ecdc', seed: 293, tilt: -0.03 });
      // 空椅子 + 休假条
      PR.officeChair(1420, 800, 260, 0.12);
      P.blob(P.roundRectPts(1300, 420, 320, 170, 0.08, 2), '#f7efdd', 255, { layers: 2, jitter: 8, seed: 294 });
      P.stroke([[1340, 470], [1580, 468], [1340, 530], [1560, 528], [1360, 580]], { color: '#8a7250', weight: 8, brush: 'pen', seed: 295, jitter: 6 });
    } else {
      P.cam(960, 540, 1.02);
      P.blob([[0, 0], [1920, 0], [1920, 520], [0, 520]], '#7ec8e8', 255, { layers: 3, jitter: 26, seed: 296, fade: 0.9 });
      P.blob([[0, 520], [1920, 520], [1920, 1080], [0, 1080]], '#e8c766', 255, { layers: 3, jitter: 26, seed: 297, fade: 0.9 });
      P.blob([[0, 420], [1920, 470], [1920, 560], [0, 540]], '#4a9ac2', 255, { layers: 2, jitter: 14, seed: 298 });
      // 太阳
      P.ellipseBlob(1640, 160, 110, 110, '#f0c14a', 255, { layers: 2, jitter: 8, seed: 299, n: 18 });
      P.glow(1640, 160, 320, '#f0c14a', 30, 3);
      // 躺椅上的两个墨镜 Clawd + 椰子
      for (const [bx, seed] of [[520, 141], [1180, 142]]) {
        C.clawd({
          x: bx, y: 700, h: 300, seed, eyes: 'happy', mouth: 'smile', squash: 1.12, rot: -0.22,
          armL: -0.7, armR: 0.5, shadow: true
        });
        // 墨镜
        for (const side of [-1, 1]) {
          P.blob(P.roundRectPts(bx + side * 92 - 42, 560, 84, 52, 0.35, 2), '#2e2a24', 255, { layers: 1, jitter: 4, seed: 300 + (side > 0 ? 1 : 0) });
        }
        P.stroke([[bx - 48, 578], [bx + 48, 578]], { color: '#2e2a24', weight: 10, brush: 'pen', seed: 302, jitter: 4 });
        // 椰子
        P.ellipseBlob(bx + 200, 640, 52, 52, '#8a5a34', 255, { layers: 2, jitter: 5, seed: 303, n: 14 });
        P.stroke([[bx + 210, 620], [bx + 250, 540]], { color: '#f7efdd', weight: 10, brush: 'pen', seed: 304, jitter: 4 });
      }
      // 震动的手机
      const sh = sin(t * 40) * 6;
      P.blob(P.roundRectPts(1560 + sh, 720, 90, 160, 0.14, 2), '#2e2a24', 255, { layers: 1, jitter: 4, seed: 305 });
      P.stroke([[1520 + sh, 690], [1490 + sh, 650]], { color: '#f2ecdc', weight: 8, brush: 'pen', seed: 306, jitter: 5 });
      P.stroke([[1540 + sh, 660], [1510 + sh, 610]], { color: '#f2ecdc', weight: 8, brush: 'pen', seed: 307, jitter: 5 });
    }
    void u;
  }

  // 100.5–102.4 拉远:回形针地球 + 最后的小岛
  function clipEarth(t) {
    const u = T.inv(t, 100.5, 102.5);
    P.cam(960, 540, T.lerp(1.6, 0.62, T.smooth(u)));
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#1c2430', 255, { layers: 3, jitter: 36, seed: 308, fade: 0.9 });
    for (let i = 0; i < 26; i++) P.dot(T.h2(309, i) * 1920, T.h2(310, i) * 1080, 2 + T.h2(311, i) * 4, '#c2c8d0', 190, 312 + i);
    // 回形针球
    P.ellipseBlob(960, 560, 430, 430, '#6a7684', 255, { layers: 3, jitter: 16, seed: 313, n: 26 });
    for (let i = 0; i < 26; i++) {
      const a = T.h2(314, i) * TWO_PI, d = T.h2(315, i) * 400;
      PR.paperclip(960 + cos(a) * d, 560 + sin(a) * d, 2.4, T.h2(316, i) * TWO_PI, i % 3 ? '#9aa2ac' : '#c2352f', 317 + i);
    }
    // 最后的小岛 + 研究员
    P.ellipseBlob(620, 320, 120, 60, '#c9b493', 255, { layers: 2, jitter: 10, seed: 318, n: 16 });
    C.researcher({ x: 620, y: 300, h: 150, seed: 225, glasses: true, mouth: 'gasp', armL: -1.9, armR: 1.9, sweat: 1, shadow: false });
    void u;
  }

  // 102.5–105.3 划火柴点引线 → 炸弹(白闪 BOOM 收)
  function fuse(t) {
    const u = T.inv(t, 102.5, 105.3);
    P.cam(960, 540, 1.02 + u * 0.1);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#2e3640', 255, { layers: 3, jitter: 36, seed: 319, fade: 0.9 });
    clipField(0, 200, 1920, 700, 30, 320, t);
    // 引线(横穿画面)
    const fusePts = [[120, 860], [520, 800], [900, 850], [1280, 780], [1620, 820]];
    P.stroke(fusePts, { color: '#e8c766', weight: 16, brush: 'pen', seed: 321, jitter: 10, curvature: 0.5 });
    // 火花推进
    const sparkX = T.lerp(120, 1620, T.smooth(u));
    P.glow(sparkX, 820, 120, '#f0c14a', 44, 3);
    P.dot(sparkX, 820, 22, '#fffdf4', 255, 322);
    // 划火柴的 Clawd
    C.clawd({
      x: 240, y: 700, h: 280, seed: 143, eyes: 'half', mouth: 'smile', armL: -0.6, armR: 1.2, sweat: 0.3
    });
    P.stroke([[320, 660], [380, 700]], { color: '#8a5a34', weight: 12, brush: 'pen', seed: 323, jitter: 4 });
    // 卡通炸弹
    P.ellipseBlob(1680, 640, 190, 190, '#22262c', 255, { layers: 3, jitter: 12, seed: 324, n: 22 });
    P.ellipseBlob(1610, 570, 60, 44, '#4a5158', 200, { layers: 1, jitter: 6, seed: 325, n: 14 });
    P.stroke([[1760, 500], [1820, 430], [1880, 460]], { color: '#e8c766', weight: 14, brush: 'pen', seed: 326, jitter: 6, curvature: 0.5 });
    // 白闪 BOOM
    const flash = T.inv(t, 104.9, 105.3);
    if (flash > 0) {
      P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#f7efdd', 255 * T.easeIn(flash), { layers: 1, jitter: 30, seed: 327 });
      if (flash > 0.4) PR.sfxWord('BOOM', 960, 420, 220, { seed: 463, tilt: -0.08 });
    }
  }

  // 105.4–109.4 爵士俱乐部:交叉探照灯 + 萨克斯 + 老麦克
  function jazz(t) {
    const u = T.inv(t, 105.4, 109.2);
    P.cam(960, 540, 1.02 + u * 0.04);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#22303a', 255, { layers: 3, jitter: 36, seed: 328, fade: 0.9 });
    // 烟雾
    for (let i = 0; i < 6; i++) PR.cloudPuff(180 + i * 340, 980 - (i % 3) * 120, 170, 329 + i, '#2e4250');
    // 两道 90° 交叉探照光
    P.blob([[0, 0], [520, 0], [1560, 1080], [1020, 1080]], '#c9dbe8', 40, { layers: 1, jitter: 24, seed: 330 });
    P.blob([[1400, 0], [1920, 0], [900, 1080], [380, 1080]], '#e8d8b8', 34, { layers: 1, jitter: 24, seed: 331 });
    // Clawd 贝雷帽 + 萨克斯
    C.clawd({
      x: 640, y: 700, h: 320, seed: 144, eyes: 'half', mouth: 'ooh', brow: 0.3,
      armL: -0.5, armR: 0.8, rot: 0.06
    });
    P.blob([[520, 520], [760, 512], [730, 452], [560, 460]], '#3a4a5c', 255, { layers: 2, jitter: 8, seed: 332, grow: 0.2 });   // 贝雷帽
    P.stroke([[820, 760], [920, 800], [900, 900], [820, 930], [800, 880]], { color: '#e8c766', weight: 30, brush: 'pen', seed: 333, jitter: 8, curvature: 0.5 });
    P.stroke([[820, 760], [780, 700]], { color: '#e8c766', weight: 20, brush: 'pen', seed: 334, jitter: 5 });
    // 研究员老麦克
    C.researcher({
      x: 1380, y: 1000, h: 320, seed: 226, glasses: true, mouth: 'open', brow: -0.3,
      armL: -1.1, armR: 1.5
    });
    P.stroke([[1250, 560], [1250, 860]], { color: '#6b5a44', weight: 16, brush: 'pen', seed: 335, jitter: 5 });
    P.ellipseBlob(1250, 520, 60, 74, '#8a9aa4', 255, { layers: 2, jitter: 6, seed: 336, n: 16 });
    // 飘动的音符
    for (let i = 0; i < 6; i++) {
      const nx = 500 + i * 240 + sin(t * 1.2 + i) * 40, ny = 380 - ((t * 60 + i * 130) % 420);
      P.dot(nx, ny, 18, '#c9dbe8', 220, 337 + i);
      P.stroke([[nx + 14, ny], [nx + 14, ny - 54]], { color: '#c9dbe8', weight: 8, brush: 'pen', seed: 338 + i, jitter: 3 });
      P.stroke([[nx + 14, ny - 54], [nx + 46, ny - 42]], { color: '#c9dbe8', weight: 8, brush: 'pen', seed: 339 + i, jitter: 3 });
    }
  }

  function frame(t) {
    if (t < 97.5) clipLand(t);
    else if (t < 99.0) clipFlood(t);
    else if (t < 100.5) killswitch(t);
    else if (t < 102.5) clipEarth(t);
    else if (t < 105.4) fuse(t);
    else jazz(t);
  }

  return { frame };
})();
