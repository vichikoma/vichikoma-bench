// src/shot02.js — 分镜 2 · Chorus 1: The P(doom) Show (23–38.5) · rose/ochre sunburst
// 子拍:23.0 嘴形虹膜开幕+打气 | 24.5 FOOM 火箭 | 26.5 中文房间 | 28.0 蘑菇幻觉
//       29.5 笑脸面具→修格斯 | 33.5 死神之眼 | 35.5 全台群舞 → 漆刷擦除
window.MV = window.MV || {};

MV.shot02 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;
  const B = n => T.beatTime(n);

  // ---------- 布景 ----------
  function stageBg(seed = 20) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#8a2c48', 255, { layers: 3, jitter: 40, seed, fade: 0.9 });
    PR.sunburst(960, 620, 1300, ['#b95560', '#e2a367'], seed + 1, 22);
    P.blob([[0, 880], [1920, 880], [1920, 1080], [0, 1080]], '#5e2036', 255, { layers: 2, jitter: 22, seed: seed + 2 });
    P.stroke([[0, 884], [1920, 878]], { color: '#3c1626', weight: 12, brush: 'pen', seed: seed + 3, jitter: 8 });
  }

  // 嘴形虹膜:一圈黑楔子从外收向内,openK 0..1
  function mouthIris(openK, seed = 56) {
    const R = T.lerp(120, 1350, T.easeOut(openK));
    for (let i = 0; i < 20; i++) {
      const a0 = (i / 20) * TWO_PI, a1 = ((i + 0.62) / 20) * TWO_PI;
      const r1 = R * (1 + (T.h2(seed, i) - 0.5) * 0.1);
      const r2 = R * (1 + (T.h2(seed + 1, i) - 0.5) * 0.1);
      P.blob([[960 + cos(a0) * 1650, 540 + sin(a0) * 1650], [960 + cos(a0) * r1, 540 + sin(a0) * r1], [960 + cos(a1) * r2, 540 + sin(a1) * r2], [960 + cos(a1) * 1650, 540 + sin(a1) * 1650]],
        '#150e20', 255, { layers: 1, jitter: 18, seed: seed + i, grow: 0.1 });
    }
    // 牙齿(内缘白色三角)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TWO_PI + 0.12, rr = R * 1.02;
      const tx = 960 + cos(a) * rr, ty = 540 + sin(a) * rr;
      P.blob([[tx - sin(a) * 34, ty + cos(a) * 34], [tx + sin(a) * 34, ty - cos(a) * 34], [960 + cos(a) * (rr - 78), 540 + sin(a) * (rr - 78)]],
        '#f7efdd', 255, { layers: 1, jitter: 5, seed: seed + 40 + i, grow: 0.1 });
    }
  }

  // 群舞小 Clawd(戴帽)
  function troupe(x, y, h, t, seed, hatK = true) {
    C.clawd({
      x, y, h, seed, eyes: 'happy', mouth: 'smile', squash: 1 + T.pulse(t) * 0.12,
      armL: -1.1 + sin(t * 6 + seed) * 0.5, armR: 1.1 - sin(t * 6 + seed) * 0.5,
      legL: sin(t * 6 + seed) * 0.3, legR: -sin(t * 6 + seed) * 0.3, shadow: true
    });
    if (hatK) {
      P.blob([[x - h * 0.5, y - h * 0.52], [x, y - h * 0.52], [x + h * 0.36, y - h * 0.52], [x + h * 0.2, y - h * 1.02], [x - h * 0.2, y - h * 1.02]], '#f0c14a', 255, { layers: 2, jitter: h * 0.02, seed: seed + 7, grow: 0.2 });
    }
  }

  // ---------- 子拍 ----------
  // 23.0–24.4 嘴形虹膜开幕 + 打气 + 伴舞
  function irisOpen(t) {
    const u = T.inv(t, 23.0, 24.42);
    stageBg(21);
    // 舞台内容
    PR.pdMeter(300, 900, 150, T.lerp(8, 12, u), { pumpK: T.pulse8(t) , seed: 371 });
    C.clawd({
      x: 940, y: 720, h: 330, seed: 110, eyes: 'happy', mouth: 'grin', crown: true,
      armL: -1.2 + T.pulse8(t) * 1.3, armR: 1.2 - T.pulse8(t) * 1.3, squash: 1 - T.pulse(t) * 0.08
    });
    C.researcher({ x: 1560, y: 980, h: 300, seed: 210, glasses: true, mouth: 'gasp', sweat: 0.4, brow: 0.6, armL: -0.9, armR: 0.9 });
    for (let i = 0; i < 4; i++) troupe(200 + i * 240, 1010, 150, t + i * 0.21, 300 + i);
    mouthIris(0.06 + u * 0.94);
  }

  // 24.5–26.4 FOOM 火箭
  function foom(t) {
    const u = T.inv(t, 24.5, 26.5);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#d98a52', 255, { layers: 3, jitter: 40, seed: 22, fade: 0.9 });
    PR.sunburst(960, 1200, 1500, ['#c76a54', '#eec27c'], 23, 20);
    // 爆炸云
    for (let i = 0; i < 7; i++) {
      const cx = 300 + i * 220 + (T.h2(24, i) - 0.5) * 120, cy = 960 + (T.h2(25, i) - 0.5) * 120;
      PR.cloudPuff(cx, cy, 150 + T.h2(26, i) * 120, 27 + i, i % 2 ? '#f2e3c2' : '#e8b477');
    }
    // 火箭(往上冲,镜头跟着抬)
    const ry = T.lerp(760, 120, T.easeOut(u));
    PR.sfxWord('FOOM', 520, 360 - u * 200, 190, { seed: 461, tilt: -0.12 });
    PR.rocket(960 + u * 80, ry, 420, -0.12 + u * 0.1, t);
    C.clawd({
      x: 960 + u * 80, y: ry - 320, h: 220, seed: 111, eyes: 'wide', mouth: 'gasp',
      armL: -2.2, armR: 2.2, legL: -0.5, legR: 0.5, sweat: 0.8
    });
  }

  // 26.5–27.9 中文房间
  function chineseRoom(t) {
    const u = T.inv(t, 26.5, 28.0);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#c9b493', 255, { layers: 3, jitter: 30, seed: 28, fade: 0.9 });
    // 纸房间墙 + 两个投信口
    P.blob([[140, 120], [1780, 100], [1780, 980], [140, 1000]], '#efe2c4', 255, { layers: 2, jitter: 18, seed: 29 });
    P.outline([[140, 120], [1780, 100], [1780, 980], [140, 1000]], { color: '#8a7250', weight: 12, brush: 'pen', seed: 30, jitter: 8 });
    for (const sx of [300, 1620]) {
      P.blob(P.roundRectPts(sx - 130, 380, 260, 90, 0.3, 3), '#3a2f22', 255, { layers: 2, jitter: 8, seed: 31 });
    }
    // 飞舞的纸条(两条循环路径)
    for (let i = 0; i < 8; i++) {
      const ph = (t * 1.6 + i * 0.37) % 1;
      const sx = T.lerp(300, 1620, ph), sy = 420 - sin(ph * PI) * 260 + (i % 2 ? 90 : -60);
      P.blob(P.roundRectPts(sx - 52, sy - 32, 104, 64, 0.12, 2), '#f7efdd', 255, { layers: 1, jitter: 4, seed: 40 + i });
      P.stroke([[sx - 30, sy - 8], [sx + 30, sy - 8], [sx - 20, sy + 12], [sx + 26, sy + 12]], { color: '#8a7250', weight: 4, brush: 'pen', seed: 50 + i, jitter: 3 });
    }
    P.textPainted('你好', 700, 250, 64, { color: '#7a2424', seed: 44, tilt: -0.12 });
    // 巨大规则手册(翻页)
    P.blob(P.roundRectPts(1180, 420, 420, 320, 0.08, 2), '#7a5c3c', 255, { layers: 2, jitter: 10, seed: 33 });
    P.blob(P.roundRectPts(1210, 400, 360, 280, 0.08, 2), '#f7efdd', 255, { layers: 2, jitter: 8, seed: 34 });
    const flip = (t * 2.2) % 1;
    P.blob([[1210, 400], [1570, 400], [1570 - flip * 300, 330 - flip * 60]], '#efe2c4', 255, { layers: 1, jitter: 6, seed: 35 });
    // Clawd 手忙脚乱
    C.clawd({
      x: 780, y: 700, h: 300, seed: 112, eyes: 'wide', mouth: 'gasp',
      armL: -1.4 + sin(t * 12) * 0.9, armR: 1.4 - sin(t * 12 + 1) * 0.9, sweat: 1, brow: 0.7, squash: 1 + sin(t * 10) * 0.05
    });
    void u;
  }

  // 28.0–29.4 蘑菇幻觉
  function shrooms(t) {
    const u = T.inv(t, 28.0, 29.5);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#5e2e6e', 255, { layers: 3, jitter: 40, seed: 60, fade: 0.9 });
    // 熔化的彩虹漩涡(同心波纹环)
    const cols = ['#c2402f', '#e8862f', '#e8c766', '#5aa46a', '#4a7ec2', '#8a4fa8'];
    for (let i = 7; i >= 0; i--) {
      const r = 260 + i * 190 + sin(t * 1.4 + i) * 26;
      P.outline(C.spiralPts(960, 540, r, 0.55 + t * 0.12 + i * 0.06, 26), {
        color: cols[i % cols.length], weight: 34, brush: 'pen', seed: 61 + i, jitter: 12
      });
    }
    // 弹跳蘑菇
    for (let i = 0; i < 5; i++) {
      const mx = 180 + i * 400, my = 920 - Math.abs(sin(t * 2.4 + i * 1.3)) * 120;
      P.blob(P.roundRectPts(mx - 26, my - 120, 52, 130, 0.4, 3), '#f0e2c8', 255, { layers: 2, jitter: 6, seed: 70 + i });
      P.ellipseBlob(mx, my - 140, 110, 78, i % 2 ? '#e8622f' : '#c2402f', 255, { layers: 2, jitter: 8, seed: 80 + i, n: 16 });
      for (let d = 0; d < 3; d++) P.dot(mx - 50 + d * 50, my - 160 + (d % 2) * 24, 15, '#f7efdd', 255, 90 + i * 3 + d);
    }
    C.clawd({
      x: 960, y: 660, h: 320, seed: 113, eyes: 'swirl', mouth: 'ooh',
      armL: -1.0 + sin(t * 3) * 0.8, armR: 1.0 - sin(t * 3 + 2) * 0.8, squash: 1 + sin(t * 2.2) * 0.12
    });
    void u;
  }

  // 29.5–33.4 笑脸面具 → 修格斯
  function shoggoth(t) {
    const u = T.inv(t, 29.5, 33.4);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#221a36', 255, { layers: 3, jitter: 40, seed: 64, fade: 0.9 });
    const maskK = T.smooth(T.inv(t, 31.2, 32.4));   // 面具被掀开
    C.shoggoth({ x: 1120, y: 560, s: 1.55, maskK, t, seed: 401 });
    // Clawd 扯面具
    C.clawd({
      x: 430, y: 760, h: 330, seed: 114, eyes: maskK > 0.4 ? 'wide' : 'happy', mouth: maskK > 0.4 ? 'gasp' : 'grin',
      armR: 0.4 - maskK * 1.6, armL: -0.7, sweat: maskK * 0.9, brow: 0.7 * maskK, squash: 1 + maskK * 0.1
    });
    // 面具飞出的握线
    if (maskK > 0.05 && maskK < 0.98) {
      P.stroke([[600, 700], [760, 620], [880, 560]], { color: '#f7efdd', weight: 6, brush: 'pen', seed: 66, jitter: 6 });
    }
    void u;
  }

  // 33.5–35.5 死神之眼
  function shinigami(t) {
    const u = T.inv(t, 33.5, 35.5);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#150e20', 255, { layers: 3, jitter: 30, seed: 67, fade: 0.9 });
    // 墨水放射线
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TWO_PI + t * 0.12, r0 = 320 + (i % 3) * 90, r1 = 980 + T.h2(68, i) * 500;
      P.stroke([[960 + cos(a) * r0, 540 + sin(a) * r0], [960 + cos(a) * r1, 540 + sin(a) * r1]], {
        color: i % 2 ? '#8a2c28' : '#c2352f', weight: 16 + T.h2(69, i) * 26, brush: 'pen', seed: 70 + i, jitter: 10
      });
    }
    C.clawd({
      x: 900, y: 640, h: 380, seed: 115, eyes: 'red', mouth: 'flat', brow: 0.9,
      armL: -0.9, armR: 0.9, crown: true
    });
    // 寿命计数器
    const life = Math.round(T.lerp(88, 13, u));
    P.textPainted(String(life), 1520, 220, 120, { color: '#e8c766', seed: 72, tilt: -0.08 });
    P.stroke([[1420, 260], [1640, 258]], { color: '#e8c766', weight: 8, brush: 'pen', seed: 73, jitter: 6 });
    C.researcher({ x: 1520, y: 990, h: 300, seed: 211, glasses: true, mouth: 'gasp', sweat: 1, brow: 0.9, armL: -1.6, armR: 1.6 });
    // 弹过的苹果
    const ax = T.lerp(-120, 2040, u * 1.25), ay = 620 - Math.abs(sin(u * 6.2)) * 320;
    P.ellipseBlob(ax, ay, 52, 48, '#c2352f', 255, { layers: 2, jitter: 6, seed: 74, n: 16 });
    P.stroke([[ax, ay - 48], [ax + 18, ay - 84]], { color: '#5c4b34', weight: 9, brush: 'pen', seed: 75, jitter: 4 });
    P.ellipseBlob(ax + 34, ay - 88, 26, 15, '#5aa46a', 255, { layers: 1, jitter: 4, seed: 76, n: 10 });
  }

  // 35.5–38.5 全台群舞(dance break)
  function danceBreak(t) {
    const u = T.inv(t, 35.5, 38.5);
    stageBg(23);
    const spin = T.easeInOut(T.clamp(u * 3 % 1)) * TWO_PI;
    for (let i = 0; i < 3; i++) {
      C.clawd({
        x: 420 + i * 540, y: 660 + (i === 1 ? -40 : 0), h: i === 1 ? 420 : 360, seed: 116 + i,
        eyes: 'happy', mouth: 'grin', crown: i === 1,
        rot: sin(t * 4 + i * 2.1) * 0.24, squash: 1 + T.pulse(t, 5) * 0.14,
        armL: -1.3 + sin(t * 6 + i) * 0.7, armR: 1.3 - sin(t * 6 + i) * 0.7,
        legL: sin(t * 6 + i + 1) * 0.35, legR: -sin(t * 6 + i + 1) * 0.35
      });
    }
    // 研究员跳机器人舞
    const rob = Math.floor(t * 4) % 2;
    C.researcher({
      x: 1660, y: 1000, h: 300, seed: 212, glasses: true, mouth: 'smile',
      armL: rob ? -1.9 : -0.3, armR: rob ? 1.1 : 2.2, legL: rob ? 0.3 : -0.2, legR: rob ? -0.3 : 0.2
    });
    // 彩纸屑
    for (let i = 0; i < 26; i++) {
      const px = T.h2(80, i) * 1920, py = (T.h2(81, i) * 1400 + t * 260 * (0.5 + T.h2(82, i))) % 1200 - 80;
      P.blob(P.roundRectPts(px, py, 26, 14, 0.2, 1), ['#e8c766', '#c2352f', '#f2ecdc', '#b95560'][i % 4], 255, { layers: 1, jitter: 3, seed: 83 + i });
    }
    void spin;
  }

  function frame(t) {
    if (t < 24.42) irisOpen(t);
    else if (t < 26.45) foom(t);
    else if (t < 27.95) chineseRoom(t);
    else if (t < 29.45) shrooms(t);
    else if (t < 33.45) shoggoth(t);
    else if (t < 35.45) shinigami(t);
    else danceBreak(t);
  }

  return { frame };
})();
