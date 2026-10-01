// src/shot04.js — 分镜 4 · Chorus 2: Bigger Show (59–73) · arena → space violet & gold
// 子拍:59.0 双泵竞技场 | 60.5 巴西利斯克 BOOM | 63.0 NVDA 奔月 | 64.5 欧米伽点
//       66.0 行星 GPU 里程表 | 70.0 金库没后墙 → 漆刷擦除(scenes 收)
window.MV = window.MV || {};

MV.shot04 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  function arenaBg(seed = 150, violet = false) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], violet ? '#3c2a5c' : '#7a2438', 255, { layers: 3, jitter: 40, seed, fade: 0.9 });
    PR.sunburst(960, 640, 1350, violet ? ['#4a3a7c', '#c9a24e'] : ['#a83c4a', '#e2a367'], seed + 1, 22);
    P.blob([[0, 900], [1920, 900], [1920, 1080], [0, 1080]], violet ? '#241a40' : '#4e1826', 255, { layers: 2, jitter: 20, seed: seed + 2 });
    P.stroke([[0, 904], [1920, 898]], { color: '#2a1020', weight: 12, brush: 'pen', seed: seed + 3, jitter: 8 });
    // 竞技场灯光架(上缘横杆)
    P.stroke([[120, 130], [1800, 122]], { color: '#2a1020', weight: 22, brush: 'pen', seed: seed + 4, jitter: 10 });
  }

  function pyro(seed = 155, t = 0) {
    for (const px of [180, 1740]) {
      for (let i = 0; i < 3; i++) {
        const fh = 260 + sin(t * 9 + i * 2 + px) * 90;
        P.blob([[px - 60, 920], [px, 920 - fh], [px + 60, 920]], i % 2 ? '#e8622f' : '#f0c14a', 255, { layers: 1, jitter: 16, seed: seed + i + (px > 900 ? 9 : 0), grow: 0.1 });
      }
      P.glow(px, 820, 220, '#f0c14a', 26, 3);
    }
  }

  // ---------- 子拍 ----------
  // 59.0–60.4 双泵竞技场 + 计量表 34%
  function arena(t) {
    const u = T.inv(t, 59.0, 60.5);
    P.cam(960, 540, 1.02 + u * 0.05);
    arenaBg(150);
    pyro(155, t);
    PR.pdMeter(280, 940, 170, T.lerp(34, 38, u), { pumpK: T.pulse8(t), seed: 372 });
    // 建筑大小的 Clawd(双泵)
    C.clawd({
      x: 1050, y: 620, h: 520, seed: 125, eyes: 'happy', mouth: 'grin', crown: true,
      armL: -1.1 + T.pulse8(t) * 1.4, armR: 1.1 - T.pulse8(t) * 1.4, squash: 1 - T.pulse(t) * 0.07
    });
    // 第二个打气筒(左侧)
    P.stroke([[620, 560], [620, 900]], { color: '#b09a77', weight: 40, brush: 'pen', seed: 156, jitter: 6 });
    P.stroke([[580, 540 - T.pulse8(t) * 60], [660, 540 - T.pulse8(t) * 60]], { color: '#6b5a44', weight: 26, brush: 'pen', seed: 157, jitter: 5 });
    C.researcher({ x: 1740, y: 1000, h: 280, seed: 218, glasses: true, mouth: 'gasp', bowtie: true, armL: -1.4, armR: 1.4, sweat: 0.5 });
    void u;
  }

  // 60.5–62.4 巴西利斯克破台 BOOM
  function basiliskBoom(t) {
    const u = T.inv(t, 60.5, 63.0);
    arenaBg(151, true);
    // 破开的地板洞
    P.ellipseBlob(880, 1020, 520, 130, '#150e20', 255, { layers: 2, jitter: 16, seed: 158, n: 20 });
    for (let i = 0; i < 9; i++) {
      const a = T.h2(159, i) * TWO_PI, d = 320 + T.h2(160, i) * 420 * (0.4 + u);
      const px = 880 + cos(a) * d, py = 1020 - Math.abs(sin(a)) * (300 + T.h2(161, i) * 460 * u);
      push(); translate(px, py); rotate(a * 1.4 + t * 2);
      P.blob(P.roundRectPts(-90, -18, 180, 36, 0.12, 2), '#8a5a34', 255, { layers: 2, jitter: 6, seed: 162 + i });
      pop();
    }
    C.basilisk({ x: 900, y: 900, s: 1.05 + u * 0.12, seed: 411 });
    PR.sfxWord('BOOM', 520, 300, 170, { seed: 462, tilt: -0.1 });
    // 被掀翻的众人
    C.clawd({
      x: 320, y: 960, h: 260, seed: 126, eyes: 'wide', mouth: 'gasp', rot: -1.2, sweat: 1,
      armL: -1.8, armR: 1.8, legL: -0.8, legR: 0.8
    });
    C.researcher({
      x: 1560, y: 950, h: 280, seed: 219, glasses: true, mouth: 'gasp', sweat: 1, rot: 0.5 + sin(t * 5) * 0.1,
      armL: -2.2, armR: 0.6
    });
    // 扔 GPU 供奉
    for (let i = 0; i < 4; i++) {
      const ph = (t * 1.1 + i * 0.25) % 1;
      const gx = T.lerp(1500, 900, ph), gy = 800 - sin(ph * PI) * 520;
      push(); translate(gx, gy); rotate(ph * 5);
      P.blob(P.roundRectPts(-52, -36, 104, 72, 0.12, 2), '#3f7a4a', 255, { layers: 2, jitter: 5, seed: 163 + i });
      P.ellipseBlob(0, 0, 22, 22, '#8fe8c9', 255, { layers: 1, jitter: 3, seed: 164 + i, n: 12 });
      pop();
    }
    void u;
  }

  // 63.0–64.4 NVDA 绿线奔月
  function toTheMoon(t) {
    const u = T.inv(t, 63.0, 64.5);
    P.cam(960, T.lerp(540, 420, u), 1);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#2e2450', 255, { layers: 3, jitter: 36, seed: 165, fade: 0.9 });
    // 图表纸 + 脱缰绿线
    P.blob(P.roundRectPts(120, 560, 700, 440, 0.04, 2), '#f7efdd', 255, { layers: 2, jitter: 10, seed: 166 });
    P.stroke([[200, 640], [200, 940], [780, 940]], { color: '#8a7250', weight: 10, brush: 'pen', seed: 167, jitter: 5 });
    const line = [[220, 900], [360, 860], [470, 820], [560, 700], [680, 520], [820, 300], [980, 120], [1180, -60], [1420, -240]];
    P.stroke(line, { color: '#3f9a5a', weight: 34, brush: 'pen', seed: 168, jitter: 8, curvature: 0.4 });
    // 云层
    for (let i = 0; i < 5; i++) PR.cloudPuff(200 + i * 420, 220 + (i % 2) * 160, 150 + T.h2(169, i) * 80, 170 + i);
    // 月亮 + 旗
    P.ellipseBlob(1560, 180, 190, 190, '#e8e0c8', 255, { layers: 2, jitter: 10, seed: 171, n: 22 });
    P.ellipseBlob(1500, 140, 34, 30, '#c9c0a8', 255, { layers: 1, jitter: 5, seed: 172, n: 12 });
    P.stroke([[1560, 180], [1560, 20]], { color: '#6b5a44', weight: 12, brush: 'pen', seed: 173, jitter: 5 });
    P.blob([[1560, 24], [1680, 52], [1560, 84]], '#c2352f', 255, { layers: 2, jitter: 6, seed: 174, grow: 0.15 });
    // Clawd 骑线
    const k = T.smooth(u), cx = T.lerp(820, 1420, k), cy = T.lerp(520, 190, k);
    C.clawd({
      x: cx, y: cy - 160, h: 260, seed: 127, eyes: 'happy', mouth: 'grin', rot: -0.5,
      armL: -2.0, armR: 1.7, crown: true
    });
  }

  // 64.5–65.9 欧米伽点
  function omega(t) {
    const u = T.inv(t, 64.5, 66.0);
    P.cam(960, 540, 1);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#241a40', 255, { layers: 3, jitter: 36, seed: 175, fade: 0.9 });
    // 向心螺旋星系
    for (let i = 0; i < 7; i++) {
      const r = 620 - i * 70 - u * 380;
      if (r > 30) P.outline(C.spiralPts(960, 540, Math.max(30, r), 1.4 + t * 0.24 + i * 0.2, 34), {
        color: i % 2 ? '#c9a24e' : '#8a6acc', weight: 22, brush: 'pen', seed: 176 + i, jitter: 10
      });
    }
    P.glow(960, 540, 320 + u * 420, '#f7efdd', 40, 5);
    P.ellipseBlob(960, 540, 60 + u * 130, 60 + u * 130, '#fffdf4', 255, { layers: 2, jitter: 8, seed: 177, n: 20 });
    // Clawd 张开双臂漂浮
    C.clawd({
      x: 960, y: 800 - u * 140, h: 300, seed: 128, eyes: 'happy', mouth: 'ooh',
      armL: -1.6, armR: 1.6, legL: -0.4, legR: 0.4, rot: sin(t * 1.4) * 0.1
    });
  }

  // 66.0–70.0 行星 GPU + 里程表数字倾泻
  function gpuPlanet(t) {
    const u = T.inv(t, 66.0, 70.0);
    P.cam(960, 540, 1.04 - u * 0.04);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#1c1430', 255, { layers: 3, jitter: 36, seed: 178, fade: 0.9 });
    // 星星
    for (let i = 0; i < 30; i++) P.dot(T.h2(179, i) * 1920, T.h2(180, i) * 1080, 2 + T.h2(181, i) * 4, '#e8e0c8', 200, 182 + i);
    // GPU 行星
    P.blob(P.roundRectPts(420, 200, 1080, 680, 0.18, 4), '#2c4a52', 255, { layers: 3, jitter: 18, seed: 183 });
    P.outline(P.roundRectPts(420, 200, 1080, 680, 0.18, 4), { color: '#12262c', weight: 16, brush: 'pen', seed: 184, jitter: 8 });
    // 星系风扇 ×2
    for (const fx of [720, 1220]) {
      P.ellipseBlob(fx, 540, 190, 190, '#1a363c', 255, { layers: 2, jitter: 8, seed: 185, n: 20 });
      for (let b = 0; b < 5; b++) {
        const a = t * 2.2 + b * TWO_PI / 5;
        P.stroke([[fx, 540], [fx + cos(a) * 170, 540 + sin(a) * 170]], { color: '#8fe8c9', weight: 26, brush: 'pen', seed: 186 + b, jitter: 6 });
      }
      P.glow(fx, 540, 240, '#8fe8c9', 22, 3);
    }
    // 里程表(一串 0 倾泻而出)
    P.blob(P.roundRectPts(770, 250, 380, 110, 0.16, 3), '#12262c', 255, { layers: 2, jitter: 6, seed: 187 });
    P.textPainted('1e30', 960, 306, 92, { color: '#e8c766', seed: 188 });
    for (let i = 0; i < 16; i++) {
      const ph = (t * 0.9 + i * 0.0625) % 1;
      const gx = 960 + (T.h2(189, i) - 0.5) * 360 + ph * 200, gy = 320 + ph * ph * 800;
      P.ellipseBlob(gx, gy, 26, 26, ['#e8c766', '#f7efdd', '#c9a24e'][i % 3], 255, { layers: 2, jitter: 4, seed: 190 + i, n: 12 });
    }
    // 计量表 61%
    PR.pdMeter(180, 980, 130, 61, { seed: 373 });
  }

  // 70.0–72.9 金库:关门 → 高五 → 绕到背后:没后墙,怪物挥手
  function vault(t) {
    const u = T.inv(t, 70.0, 72.8);
    const orbit = T.smooth(T.inv(t, 71.3, 72.6));    // 绕到背面
    P.cam(960, 540, 1.02);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#2e3a46', 255, { layers: 3, jitter: 36, seed: 191, fade: 0.9 });
    P.blob([[0, 860], [1920, 860], [1920, 1080], [0, 1080]], '#22303a', 255, { layers: 2, jitter: 20, seed: 192 });
    // 金库门(圆盘,0..1 关上)
    const closeK = T.smooth(T.inv(t, 70.0, 71.0));
    const dx = T.lerp(1220, 760, closeK);
    P.ellipseBlob(960, 540, 320, 320, '#4a5e6c', 255, { layers: 3, jitter: 12, seed: 193, n: 26 });
    P.ellipseBlob(960, 540, 240, 240, '#5c7280', 255, { layers: 2, jitter: 10, seed: 194, n: 22 });
    P.ellipseBlob(960, 540, 70, 70, '#8a9aa4', 255, { layers: 2, jitter: 6, seed: 195, n: 16 });
    for (let i = 0; i < 6; i++) {
      const a = t * (1 - orbit) * 2 + i * TWO_PI / 6;
      P.stroke([[960 + cos(a) * 90, 540 + sin(a) * 90], [960 + cos(a) * 210, 540 + sin(a) * 210]], { color: '#2e3a46', weight: 22, brush: 'pen', seed: 196 + i, jitter: 5 });
    }
    // 硬帽 Clawd ×2
    for (const [cx, flip] of [[420, 1], [1500, -1]]) {
      C.clawd({
        x: cx, y: 820, h: 300, seed: 129 + (flip > 0 ? 0 : 1), eyes: 'happy', mouth: 'grin',
        armL: flip * (-0.6 + closeK * 0.8), armR: flip * (0.6 + closeK * 1.2), sweat: 0.3
      });
      P.blob([[cx - 120, 560], [cx + 120, 560], [cx + 90, 500], [cx - 90, 500]], '#e8c766', 255, { layers: 2, jitter: 6, seed: 197, grow: 0.2 });  // 安全帽
    }
    if (closeK > 0.9 && orbit < 0.2) {
      // 高五
      P.stroke([[560, 640], [700, 560]], { color: '#f0c14a', weight: 30, brush: 'pen', seed: 198, jitter: 6 });
      P.stroke([[1360, 640], [1220, 560]], { color: '#f0c14a', weight: 30, brush: 'pen', seed: 199, jitter: 6 });
    }
    // 背面:没后墙,发光怪物挥手
    if (orbit > 0.02) {
      P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#1c2430', 255 * orbit, { layers: 1, jitter: 30, seed: 200 });
      P.ellipseBlob(960, 560, 300, 320, '#7ae8c9', 220 * orbit, { layers: 3, jitter: 14, seed: 201, n: 20 });
      for (let i = 0; i < 8; i++) {
        const a = -HALF_PI + (i - 3.5) * 0.34;
        P.stroke([[960, 640], [960 + cos(a) * 380, 640 + sin(a) * 380]], { color: '#4ac9a9', weight: 30, brush: 'pen', seed: 202 + i, jitter: 8 });
      }
      P.ellipseBlob(880, 500, 26, 26, '#12262c', 255 * orbit, { layers: 1, jitter: 4, seed: 203, n: 12 });
      P.ellipseBlob(1040, 500, 26, 26, '#12262c', 255 * orbit, { layers: 1, jitter: 4, seed: 204, n: 12 });
      // 挥手
      const w = sin(t * 6) * 0.5;
      P.stroke([[1240, 620], [1420, 520 + w * 80], [1500, 420 + w * 120]], { color: '#4ac9a9', weight: 34, brush: 'pen', seed: 205, jitter: 8, curvature: 0.5 });
      P.textPainted('hi', 1560, 360 + w * 100, 90, { color: '#8fe8c9', seed: 206, tilt: -0.1 });
    }
    void dx;
  }

  function frame(t) {
    if (t < 60.5) arena(t);
    else if (t < 63.0) basiliskBoom(t);
    else if (t < 64.5) toTheMoon(t);
    else if (t < 66.0) omega(t);
    else if (t < 70.0) gpuPlanet(t);
    else vault(t);
  }

  return { frame };
})();
