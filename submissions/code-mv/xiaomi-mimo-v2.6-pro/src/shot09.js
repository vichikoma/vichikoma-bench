// src/shot09.js — 分镜 9 · 尾声 · Curtain Call (140.5–156.6) · warm stage & closing paper
// 子拍:140.5 全体谢幕+彩带 | 150 幕布落下带标题 | 155 渐隐成纸
window.MV = window.MV || {};

MV.shot09 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  // 一排配角的站位与动作
  const cast = [
    { kind: 'clawd', seed: 160, x: 260, expr: { eyes: 'happy', mouth: 'grin' } },
    { kind: 'clawd', seed: 161, x: 520, expr: { eyes: 'star', mouth: 'ooh' }, partyHat: true },
    { kind: 'chinchilla', seed: 422, x: 760 },
    { kind: 'clawd', seed: 162, x: 1020, expr: { eyes: 'heart', mouth: 'grin' }, crown: true },
    { kind: 'clawd', seed: 163, x: 1280, expr: { eyes: 'happy', mouth: 'smile' } },
    { kind: 'cat', seed: 432, x: 1520 },
    { kind: 'researcher', seed: 230, x: 1740, expr: { eyes: 'happy', mouth: 'smile' } },
  ];

  function stageBg(seed = 440, t = 0) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#4e2a48', 255, { layers: 3, jitter: 36, seed, fade: 0.9 });
    PR.sunburst(960, 620, 1450, ['#6a3a5c', '#c9a24e'], seed + 1, 24);
    P.blob([[0, 900], [1920, 900], [1920, 1080], [0, 1080]], '#2e1a2c', 255, { layers: 2, jitter: 20, seed: seed + 2 });
    P.stroke([[0, 904], [1920, 898]], { color: '#1c1020', weight: 12, brush: 'pen', seed: seed + 3, jitter: 8 });
    // 两侧幕布
    for (const side of [-1, 1]) {
      const pts = [[side < 0 ? 0 : 1920, 0], [side < 0 ? 300 : 1620, 0], [side < 0 ? 260 : 1660, 1080], [side < 0 ? 0 : 1920, 1080]];
      P.blob(pts, '#8a2c48', 255, { layers: 2, jitter: 16, seed: seed + 4 + (side > 0 ? 1 : 0) });
      for (let i = 0; i < 3; i++) {
        const x = side < 0 ? 70 + i * 90 : 1850 - i * 90;
        P.stroke([[x, 0], [x - side * 30, 1080]], { color: '#5c1c2e', weight: 16, brush: 'pen', seed: seed + 6 + i, jitter: 10 });
      }
    }
    void t;
  }

  // ---------- 子拍 ----------
  // 140.5–150 谢幕:集体鞠躬 + 花雨彩带 + 计量表最终读数 + 慢舞
  function bows(t) {
    const u = T.inv(t, 140.5, 150);
    const bowK = Math.sin(T.clamp((t - 141.2) / 2.4) * PI);   // 一次大鞠躬
    P.cam(960, 540, 1.02 - u * 0.02);
    stageBg(440, t);
    // 彩带 + 花
    for (let i = 0; i < 22; i++) {
      const rx = T.h2(441, i) * 1920, ry = ((t * 130 + i * 200) % 1200) - 60;
      push(); translate(rx, ry); rotate(t * 1.2 + i);
      if (i % 3 === 0) C.star(0, 0, 14 + T.h2(442, i) * 10, 5, ['#e8c766', '#c2352f', '#8fe8c9'][i % 3], 443 + i);
      else P.blob([[-26, -6], [26, -10], [22, 8], [-22, 10]], ['#c2352f', '#8fe8c9', '#c9dbe8', '#e8c766'][i % 4], 235, { layers: 1, jitter: 3, seed: 444 + i });
      pop();
    }
    // 一排角色
    for (const c of cast) {
      const y = 840 + (c.kind === 'chinchilla' ? 60 : c.kind === 'cat' ? 40 : 0) - bowK * 10;
      if (c.kind === 'researcher') {
        C.researcher({
          x: c.x, y, h: 300, seed: c.seed, glasses: true, bowtie: true, mouth: 'smile',
          rot: bowK * 0.22, armL: -1.2 - bowK * 0.5, armR: 1.2 + bowK * 0.5
        });
      } else if (c.kind === 'chinchilla') {
        C.chinchilla({ x: c.x, y: 760, s: 1.0 + sin(t * 2) * 0.04, t, seed: c.seed });
      } else if (c.kind === 'cat') {
        C.clawd({ x: c.x, y, h: 300, seed: c.seed, eyes: 'happy', mouth: 'smile', rot: bowK * 0.22, armL: -1.1, armR: 1.1 });
        C.catEars({ x: c.x, y, h: 300, rot: bowK * 0.22, seed: c.seed + 7 });
      } else {
        C.clawd({
          x: c.x, y, h: 300, seed: c.seed, eyes: c.expr.eyes, mouth: c.expr.mouth,
          crown: c.crown, partyHat: c.partyHat, rot: bowK * 0.22 + sin(t * 1.2 + c.seed) * 0.04,
          armL: -1.2 - bowK * 0.6, armR: 1.2 + bowK * 0.6, squash: 1 + sin(t * 1.5 + c.seed) * 0.05
        });
      }
    }
    // 尘埃/星屑
    for (let i = 0; i < 16; i++) {
      const fx = T.h2(445, i) * 1920, fy = T.h2(446, i) * 900 + sin(t * 0.8 + i) * 24;
      P.dot(fx, fy, 3 + T.h2(447, i) * 3, '#e8c766', 150, 448 + i);
    }
    // 最终计量表
    PR.pdMeter(960, 1020, 150, T.lerp(91, 97, T.smooth(T.inv(t, 142, 148))), { seed: 376, cracked: true });
  }

  // 150–155 幕布落下:标题水彩字 + Clawd 侧脸小像
  function curtain(t) {
    const u = T.inv(t, 150, 155);
    const drop = T.smooth(u);
    P.cam(960, 540, 1);
    stageBg(449, t);
    // 上一格的角色缩到下方(被幕布盖住)
    for (const c of cast) {
      if (c.kind === 'researcher' || c.kind === 'clawd') {
        C.clawd({
          x: c.x, y: 840, h: 220, seed: c.seed, eyes: 'happy', mouth: 'smile',
          armL: -1.2, armR: 1.2, rot: sin(t * 1.2 + c.seed) * 0.05
        });
      }
    }
    // 幕布(从上往下盖)
    P.blob([[0, -1080 + drop * 1080], [1920, -1080 + drop * 1080], [1920, 320 + drop * 1080], [0, 340 + drop * 1080]], '#8a2c48', 255, { layers: 3, jitter: 18, seed: 450 });
    for (let i = 0; i < 8; i++) {
      const x = 120 + i * 240;
      P.stroke([[x, -1080 + drop * 1080], [x - 40, 330 + drop * 1080]], { color: '#5c1c2e', weight: 18, brush: 'pen', seed: 451 + i, jitter: 12 });
    }
    P.stroke([[0, -1064 + drop * 1080], [1920, -1064 + drop * 1080]], { color: '#e8c766', weight: 16, brush: 'pen', seed: 452, jitter: 8 });
    // 标题(幕布过半后浮现)
    const tK = T.smooth(T.inv(t, 151.6, 153));
    if (tK > 0.02) {
      P.blob([[300, 380], [1620, 366], [1640, 720], [288, 740]], '#f7efdd', 255 * tK, { layers: 2, jitter: 16, seed: 453 });
      push();
      translate(960, 520); rotate(-0.035); scale(1, 1.04);
      P.textPainted("I'M UPPING MY P(DOOM)", 0, -20, 118, { color: '#3a2c22', seed: 454, alpha: 255 * tK, tilt: 0 });
      pop();
      P.textPainted('keep your head down, keep your head up', 960, 660, 54, { color: '#6b5a44', seed: 455, alpha: 220 * tK, tilt: -0.02 });
      // 侧脸小像 + 小署名
      P.ellipseBlob(1560, 880, 90, 90, '#e8622f', 255 * tK, { layers: 2, jitter: 8, seed: 456, n: 18 });
      P.ellipseBlob(1540, 862, 12, 12, '#2e2a24', 255 * tK, { layers: 1, jitter: 3, seed: 457, n: 10 });
      P.stroke([[1560, 900], [1580, 902]], { color: '#2e2a24', weight: 6, brush: 'pen', seed: 458, jitter: 3 });
      P.textPainted('DOOMCLAW PRODUCTION', 960, 950, 44, { color: '#8a7250', seed: 459, alpha: 210 * tK, tilt: 0.02 });
    }
  }

  // 155–156.6 渐隐成纸
  function fadePaper(t) {
    curtain(154.9);
    const k = T.smooth(T.inv(t, 155, 156.4));
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#f2e9d5', 255 * k, { layers: 1, jitter: 24, seed: 460 });
    // 墨点装饰
    for (let i = 0; i < 9; i++) {
      P.dot(180 + T.h2(461, i) * 1560, 120 + T.h2(462, i) * 840, 8 + T.h2(463, i) * 10, '#2e2a24', 120 * k, 464 + i);
    }
  }

  function frame(t) {
    if (t < 150) bows(t);
    else if (t < 155) curtain(t);
    else fadePaper(t);
  }

  return { frame };
})();
