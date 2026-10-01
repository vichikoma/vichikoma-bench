// src/shot08.js — 分镜 8 · Chorus 4: Red Alert (123.5–140.5) · crimson alert & cut-paper spotlight
// 子拍:123.5 红色警报 | 126.0 圣殿先知 | 128.0 面具闪回 | 129.9 递归叠叠乐 | 132.0 Ilya 之门 | 137.4 一切皆舞台
window.MV = window.MV || {};

MV.shot08 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  function redBg(seed = 380) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#8a2020', 255, { layers: 3, jitter: 36, seed, fade: 0.9 });
    P.blob([[0, 880], [1920, 880], [1920, 1080], [0, 1080]], '#5c1414', 255, { layers: 2, jitter: 20, seed: seed + 1 });
    // 旋转警报光
    const a = t2 * 1.6;
    void a;
    P.blob([[0, 100], [700, 160], [620, 420], [0, 380]], '#e8a41c', 60, { layers: 1, jitter: 24, seed: seed + 2 });
    P.blob([[1920, 100], [1220, 160], [1300, 420], [1920, 380]], '#e8a41c', 60, { layers: 1, jitter: 24, seed: seed + 3 });
    // 旋转的警示三角 ×3
    for (let i = 0; i < 3; i++) {
      const cx = 300 + i * 660, cy = 200 + (i % 2) * 90;
      const r = sin(performance.now() / 500 + i) * 0.3;
      push(); translate(cx, cy); rotate(r);
      P.blob([[0, -80], [70, 60], [-70, 60]], '#e8c766', 255, { layers: 2, jitter: 6, seed: 381 + i, grow: 0.2 });
      P.stroke([[-22, -22], [-22, 12]], { color: '#5c1414', weight: 12, brush: 'pen', seed: 382 + i, jitter: 3 });
      P.dot(0, 32, 8, '#5c1414', 255, 383 + i);
      pop();
    }
    void t2;
  }
  let t2 = 0;

  // ---------- 子拍 ----------
  // 123.5–125.9 红色警报:疯狂打气,计量表裂开 86%
  function alert(t) {
    t2 = t;
    const u = T.inv(t, 123.5, 126.0);
    P.cam(960, 540, 1.03 + T.pulse(t) * 0.05);
    redBg(380);
    PR.sfxWord('RED ALERT', 960, 170, 120, { seed: 464, tilt: -0.04 });
    PR.pdMeter(300, 930, 180, T.lerp(78, 86, u), { pumpK: T.pulse8(t), seed: 375, crackK: T.smooth(T.inv(t, 124.2, 125.4)) });
    C.clawd({
      x: 1120, y: 640, h: 520, seed: 125, eyes: 'red', mouth: 'grin', crown: true,
      armL: -1.1 + T.pulse8(t) * 1.6, armR: 1.1 - T.pulse8(t) * 1.6, sweat: 0.6,
      squash: 1 - T.pulse(t) * 0.08
    });
    C.researcher({
      x: 1740, y: 1000, h: 280, seed: 218, glasses: true, mouth: 'gasp', bowtie: true,
      armL: -2.1, armR: 2.1, sweat: 1, brow: 0.8
    });
  }

  // 126.0–127.9 圣殿先知凝视生命之树(上中下三全景)
  function loom(t) {
    t2 = t;
    const u = T.inv(t, 126.0, 128.0);
    const yPan = u < 0.34 ? 0 : u < 0.67 ? 1 : 2;
    P.cam(960, [300, 540, 820][yPan], 1.12);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#241a34', 255, { layers: 3, jitter: 36, seed: 384, fade: 0.92 });
    // 未来之树:主干 + 分叉渐开
    P.stroke([[960, 1160], [960, 520]], { color: '#8a6acc', weight: 34, brush: 'pen', seed: 385, jitter: 10 });
    for (let l = 0; l < 3; l++) {
      for (const side of [-1, 1]) {
        const spread = T.smooth(T.inv(t, 126.0 + l * 0.3, 127.2 + l * 0.3));
        P.stroke([[960, 880 - l * 190], [960 + side * (170 + l * 110) * spread, 760 - l * 190], [960 + side * (300 + l * 160) * spread, 620 - l * 190]], {
          color: l === 2 ? '#e8c766' : '#8a6acc', weight: 30 - l * 4, brush: 'pen', seed: 386 + l * 2 + (side > 0 ? 1 : 0), jitter: 10, curvature: 0.5
        });
        // 分叉末端的命运球
        for (let k = 0; k < 3; k++) {
          const px = 960 + side * (300 + l * 160) * spread + (k - 1) * 90, py = 580 - l * 190 - Math.abs(k - 1) * 70;
          P.ellipseBlob(px, py, 38, 38, k === 1 ? '#e8c766' : '#6a5a9c', 255, { layers: 1, jitter: 5, seed: 387 + l * 6 + k, n: 12 });
          P.glow(px, py, 80, '#c9a24e', 24, 2);
        }
      }
    }
    // 先知(长袍方块 + 眩晕眼)站在树前
    C.clawd({ x: 640, y: 860, h: 320, seed: 149, eyes: 'swirl', mouth: 'ooh', rot: -0.05 });
    P.blob([[520, 660], [760, 652], [820, 1080], [460, 1080]], '#6a5a9c', 255, { layers: 2, jitter: 14, seed: 388 });
    void u;
  }

  // 128.0–129.8 面具闪回:棕褐胶片 + 揭面具 + 强光点
  function flashback(t) {
    t2 = t;
    const u = T.inv(t, 128.0, 129.9);
    P.cam(960, 540, 1.02);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#b49a72', 255, { layers: 3, jitter: 30, seed: 389, fade: 0.94 });
    // 胶片划痕 + 暗角
    for (let i = 0; i < 10; i++) P.stroke([[T.h2(390, i) * 1920, 0], [T.h2(390, i) * 1920 + 40, 1080]], { color: '#8a7250', weight: 3, brush: 'pen', seed: 391 + i, jitter: 20 });
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#5c4b34', 70, { layers: 1, jitter: 60, seed: 392 });
    // 揭开的小面具(引用分镜 2)
    C.basilisk({ x: 960, y: 720, s: 1.0, seed: 412, maskTilt: 0.3 + u * 0.9, maskOff: u });
    // 强光点(面具拉开后的闪光)
    const gl = T.smooth(T.inv(t, 128.8, 129.8));
    P.glow(960, 540, 200 + gl * 900, '#fffdf4', 40, 5);
    if (gl > 0.5) {
      for (let i = 0; i < 4; i++) {
        const a = i * HALF_PI + u * 2, r = 300 + gl * 300;
        P.stroke([[960 + cos(a) * 120, 540 + sin(a) * 120], [960 + cos(a) * r, 540 + sin(a) * r]], { color: '#fffdf4', weight: 16, brush: 'pen', seed: 393 + i, jitter: 8 });
      }
    }
  }

  // 129.9–131.9 递归叠叠乐:加速拉远
  function recursion(t) {
    t2 = t;
    const u = T.inv(t, 129.9, 132.0);
    P.cam(960, 540, T.lerp(1.9, 0.78, T.easeIn(u)));
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#3c2a5c', 255, { layers: 3, jitter: 36, seed: 394, fade: 0.92 });
    // 派对帽 Clawd → 王冠 Clawd → 光环 Clawd(一层套一层)
    C.clawd({ x: 960, y: 620, h: 260, seed: 150, eyes: 'happy', mouth: 'grin', partyHat: true, armL: -1.2, armR: 1.2 });
    C.clawd({ x: 960, y: 620, h: 400, seed: 151, eyes: 'half', mouth: 'smile', crown: true, armL: -1.35, armR: 1.35, shadow: false });
    // 最外:光环
    P.outline(C.spiralPts(960, 520, 330, 0.1, 26), { color: '#e8c766', weight: 18, brush: 'pen', seed: 395, jitter: 10 });
    C.clawd({ x: 960, y: 620, h: 560, seed: 152, eyes: 'swirl', mouth: 'ooh', armL: -1.5, armR: 1.5, shadow: false });
    // 缩放速度线
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TWO_PI, r0 = 500, r1 = 500 + u * 500;
      P.stroke([[960 + cos(a) * r0, 540 + sin(a) * r0], [960 + cos(a) * r1, 540 + sin(a) * r1]], { color: '#c9a24e', weight: 12, brush: 'pen', seed: 396 + i, jitter: 8 });
    }
  }

  // 132.0–135.4 Ilya 之门:偷看一眼 → 心虚关门上锁 → 落链
  function door(t) {
    t2 = t;
    const u = T.inv(t, 132.0, 135.4);
    const peek = T.smooth(T.inv(t, 132.0, 133.2)) * (1 - T.smooth(T.inv(t, 133.6, 134.4)));
    const closeK = T.smooth(T.inv(t, 133.6, 134.6));
    P.cam(960, 540, 1.02 + (1 - peek) * 0.04);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#c2b494', 255, { layers: 3, jitter: 30, seed: 397, fade: 0.94 });
    // 门
    P.blob([[640, 180], [1280, 180], [1280, 960], [640, 960]], '#6b5a44', 255, { layers: 3, jitter: 10, seed: 398 });
    P.outline([[640, 180], [1280, 180], [1280, 960], [640, 960], [640, 180]], { color: '#3e3226', weight: 16, brush: 'pen', seed: 399, jitter: 6 });
    // 门缝里的光(开缝时)
    if (peek > 0.02) P.blob([[640, 180], [640 + 300 * peek, 180], [640 + 300 * peek, 960], [640, 960]], '#f2e3b8', 255 * peek, { layers: 1, jitter: 14, seed: 400 });
    // Clawd 偷看(从门缝探头,眨眼)
    const blink = Math.floor((t - 132) * 1.8) % 2 === 0 && t < 133.6;
    if (peek > 0.05 && closeK < 0.95) {
      C.clawd({
        x: 640 + 200 * peek, y: 560, h: 300, seed: 153,
        eyes: blink ? 'wide' : 'half', mouth: 'ooh', brow: 0.5,
        armL: -0.4, armR: 1.0, squash: 1.12
      });
    }
    // 关门 + 链条
    if (closeK > 0.1) {
      for (let i = 0; i < 8; i++) {
        const lx = 700 + i * 72, ly = 640 + sin(i * 1.2) * 46;
        push(); translate(lx, ly); rotate(0.25 + (i % 2) * HALF_PI + (1 - closeK) * (T.h2(401, i) - 0.5) * 2);
        P.outline(C.spiralPts(0, 0, 30, 0, 12), { color: '#3e4650', weight: 10, brush: 'pen', seed: 402 + i, jitter: 3 });
        pop();
      }
      P.blob(P.roundRectPts(1120, 580, 90, 110, 0.2, 2), '#c9a24e', 255, { layers: 2, jitter: 5, seed: 403 });
      if (closeK > 0.9) PR.sfxWord('SLAM', 1220, 280, 110, { seed: 465, tilt: 0.12 });
    }
    void u;
  }

  // 135.4–140.5 一切皆舞台:聚光 → 拉远:假门/布景/戏服里的三只小 Clawd
  function allStage(t) {
    t2 = t;
    const u = T.inv(t, 135.4, 140.5);
    const wide = T.smooth(T.inv(t, 137.4, 140.2));
    P.cam(960, 540, T.lerp(1.55, 0.72, wide));
    // 聚光下的黑(随拉远显出棚内杂乱)
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#181420', 255, { layers: 3, jitter: 30, seed: 404, fade: 0.94 });
    P.blob([[560, 300], [1360, 300], [1420, 980], [500, 980]], '#f2e3b8', 200 - wide * 60, { layers: 2, jitter: 26, seed: 405 });
    // 那扇门(此刻看只是块漆出来的板)
    if (wide > 0.12) {
      push(); translate(960, 560); rotate(0.06);
      P.blob([[640, 180], [1280, 180], [1280, 960], [640, 960]].map(p => [p[0] - 320, p[1] - 280]), '#6b5a44', 255 * wide, { layers: 2, jitter: 12, seed: 406 });
      // 撑门的凳子 + 看出是平面
      P.stroke([[700, 680], [620, 960]], { color: '#8a7250', weight: 20, brush: 'pen', seed: 407, jitter: 6 });
      pop();
    }
    // 工作人员 Clawd 推走道具
    if (wide > 0.2) {
      C.clawd({
        x: 260 + wide * 200, y: 880, h: 260, seed: 154, eyes: 'half', mouth: 'flat',
        armL: -1.2, armR: 0.9, sweat: 0.4
      });
      P.blob(P.roundRectPts(360 + wide * 200, 800, 300, 200, 0.1, 2), '#3e3226', 255 * wide, { layers: 2, jitter: 8, seed: 408 });
      P.textPainted('TREE', 510 + wide * 200, 830, 64, { color: '#c9b493', seed: 409, tilt: -0.06 });
    }
    // 巨型 Clawd 戏服拉链拉开,里面三只小 Clawd
    if (wide > 0.35) {
      const open = T.smooth(T.inv(t, 138.2, 139.6));
      C.clawd({
        x: 1480, y: 720, h: 520, seed: 155, eyes: 'half', mouth: 'flat', partyHat: true,
        armL: -1.3, armR: 1.3, squash: 1 + open * 0.16
      });
      P.stroke([[1480, 480], [1480, 940]], { color: '#3e3226', weight: 10, brush: 'pen', seed: 410, jitter: 4 });
      if (open > 0.4) {
        for (let i = 0; i < 3; i++) {
          C.clawd({
            x: 1400 + i * 90, y: 700 + (i % 2) * 60, h: 130, seed: 156 + i,
            eyes: 'wide', mouth: 'ooh', shadow: false, armL: -1.6, armR: 1.6
          });
        }
      }
    }
    // 顶部聚光灯具
    P.stroke([[300, 80], [520, 300]], { color: '#2a2432', weight: 26, brush: 'pen', seed: 411, jitter: 6 });
    P.stroke([[1620, 80], [1400, 300]], { color: '#2a2432', weight: 26, brush: 'pen', seed: 412, jitter: 6 });
    void u;
  }

  function frame(t) {
    if (t < 126.0) alert(t);
    else if (t < 128.0) loom(t);
    else if (t < 129.9) flashback(t);
    else if (t < 132.0) recursion(t);
    else if (t < 135.4) door(t);
    else allStage(t);
  }

  return { frame };
})();
