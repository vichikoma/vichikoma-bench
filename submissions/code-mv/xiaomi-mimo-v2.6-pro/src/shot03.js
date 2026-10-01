// src/shot03.js — 分镜 3 · Takeoff (38.5–59) · morning sky → speed → rose
// 子拍:38.5 健身房跑步机 | 41.5 黑洞 | 45.0 横版火箭滑板 | 49.4 原子重排(回形针预兆) | 53.4 悉尼心房
window.MV = window.MV || {};

MV.shot03 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  // ---------- 布景 ----------
  function gymBg(seed = 90) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#a8c8e0', 255, { layers: 3, jitter: 36, seed, fade: 0.9 });
    P.blob([[0, 760], [1920, 760], [1920, 1080], [0, 1080]], '#c9b493', 255, { layers: 2, jitter: 22, seed: seed + 1 });
    P.stroke([[0, 764], [1920, 758]], { color: '#8a7250', weight: 12, brush: 'pen', seed: seed + 2, jitter: 8 });
  }

  function treadmill(x, y, s, t) {
    P.blob(P.roundRectPts(x - 320 * s, y - 40 * s, 640 * s, 90 * s, 0.3, 3), '#4a5e82', 255, { layers: 2, jitter: 10 * s, seed: 91 });
    // 履带纹
    for (let i = 0; i < 7; i++) {
      const bx = x - 280 * s + ((i * 96 + t * 320) % 560) * s;
      P.stroke([[bx, y - 12 * s], [bx + 40 * s, y - 12 * s]], { color: '#2e3a56', weight: 10 * s, brush: 'pen', seed: 92 + i, jitter: 3 * s });
    }
    P.stroke([[x + 240 * s, y - 40 * s], [x + 300 * s, y - 320 * s], [x + 120 * s, y - 340 * s]], { color: '#4a5e82', weight: 22 * s, brush: 'pen', seed: 93, jitter: 5 * s });
  }

  function contourHills(seed = 95, off = 0) {
    for (let i = 0; i < 5; i++) {
      const y0 = 620 + i * 120, pts = [];
      for (let k = 0; k <= 10; k++) {
        const x = -200 + ((k * 260 + off * (1 + i * 0.4)) % 2400) - 200;
        pts.push([x, y0 - sin(k * 1.2 + i * 2 + off * 0.01) * (70 + i * 22)]);
      }
      P.stroke(pts, { color: i % 2 ? '#c98d4e' : '#a8763e', weight: 26, brush: 'pen', seed: seed + i, jitter: 12 });
    }
  }

  // ---------- 子拍 ----------
  // 38.5–41.4 健身房:跑步机 + 停表研究员 + 电视损失线
  function gym(t) {
    const u = T.inv(t, 38.5, 41.5);
    const zoom = 1 + T.smooth(T.inv(t, 41.0, 41.5)) * 0.5;   // 末尾推向速度旋钮
    P.cam(T.lerp(960, 620, T.smooth(T.inv(t, 41.0, 41.5))), T.lerp(540, 640, T.smooth(T.inv(t, 41.0, 41.5))), zoom);
    gymBg(90);
    treadmill(760, 860, 1.1, t);
    // Clawd 戴汗带跑步
    const run = sin(t * 9);
    C.clawd({
      x: 760, y: 620, h: 300, seed: 118, eyes: 'happy', mouth: 'smile', sweat: 0.5,
      armL: -0.8 + run * 0.8, armR: 0.8 + run * 0.8, legL: run * 0.55, legR: -run * 0.55, squash: 1 + run * 0.04
    });
    P.stroke([[672, 428], [848, 424]], { color: '#c2352f', weight: 34, brush: 'pen', seed: 119, jitter: 6 });   // 汗带
    // 研究员:写字板 + 停表
    C.researcher({
      x: 1400, y: 980, h: 320, seed: 213, glasses: true, mouth: 'smile', armL: -1.2, armR: 0.5,
    });
    P.blob(P.roundRectPts(1210, 640, 170, 230, 0.1, 2), '#f7efdd', 255, { layers: 2, jitter: 6, seed: 96 });
    P.stroke([[1240, 700], [1350, 698], [1240, 760], [1340, 758], [1250, 818]], { color: '#8a7250', weight: 7, brush: 'pen', seed: 97, jitter: 5 });
    // 健身房电视:平稳损失线
    PR.monitor(1380, 180, 420, 320, {
      seed: 302, inner: (sx, sy, sw, sh) => {
        const pts = []; for (let i = 0; i <= 12; i++) pts.push([sx + sw * i / 12, sy + sh * (0.5 + sin(i * 1.3) * 0.12)]);
        P.stroke(pts, { color: '#8fe8c9', weight: 12, brush: 'pen', seed: 98, jitter: 4 });
      }
    });
    // 速度旋钮(末尾特写目标)
    P.ellipseBlob(700, 830, 66, 66, '#e8c766', 255, { layers: 2, jitter: 5, seed: 99, n: 16 });
    P.stroke([[700, 830], [700 + cos(u * 2) * 46, 830 + sin(u * 2) * 46]], { color: '#5c4b34', weight: 12, brush: 'pen', seed: 100, jitter: 4 });
  }

  // 41.5–44.9 黑洞
  function blackHole(t) {
    const u = T.inv(t, 41.5, 45.0);
    P.cam(960, 540, 1.06 + u * 0.1);
    gymBg(91);
    treadmill(620, 900, 1.1, t);
    // 墙上的黑洞
    const hx = 1320, hy = 460, hr = 180 + u * 120;
    for (let i = 0; i < 6; i++) {
      P.outline(C.spiralPts(hx, hy, hr * (1 + i * 0.22), 1.15 + t * 0.3, 30), {
        color: ['#4a3a5c', '#2e2440', '#6a4a7c'][i % 3], weight: 30, brush: 'pen', seed: 101 + i, jitter: 12
      });
    }
    P.ellipseBlob(hx, hy, hr * 0.72, hr * 0.72, '#150e20', 255, { layers: 3, jitter: 14, seed: 102, n: 22 });
    // 螺旋吸入的杂物:哑铃/瓶子/写字板
    for (let i = 0; i < 6; i++) {
      const ph = (t * 0.7 + i * 0.17) % 1, a = ph * 4.2 + i * 1.1, d = T.lerp(820, 60, ph);
      const ox = hx + cos(a) * d, oy = hy + sin(a) * d * 0.8;
      push(); translate(ox, oy); rotate(a * 1.6);
      if (i % 3 === 0) {
        P.blob(P.roundRectPts(-70, -12, 140, 24, 0.5, 2), '#4a4258', 255, { layers: 1, jitter: 4, seed: 103 + i });
        P.dot(-70, 0, 26, '#4a4258', 255, 104 + i); P.dot(70, 0, 26, '#4a4258', 255, 105 + i);
      } else if (i % 3 === 1) {
        P.blob(P.roundRectPts(-22, -60, 44, 120, 0.3, 2), '#8fe8c9', 255, { layers: 1, jitter: 4, seed: 106 + i });
      } else {
        P.blob(P.roundRectPts(-60, -80, 120, 160, 0.08, 2), '#f7efdd', 255, { layers: 1, jitter: 4, seed: 107 + i });
      }
      pop();
    }
    // 研究员扒门框飘
    C.researcher({
      x: 300, y: 760, h: 320, seed: 214, glasses: true, mouth: 'gasp', sweat: 1, brow: 0.8,
      armL: -2.4 + sin(t * 5) * 0.3, armR: -1.9 + sin(t * 5 + 1) * 0.3, rot: sin(t * 4) * 0.16, hairBlow: 1
    });
    P.stroke([[140, 160], [150, 1080]], { color: '#8a7250', weight: 34, brush: 'pen', seed: 108, jitter: 8 });
    // Clawd 开心地跑向黑洞
    const run = sin(t * 9), k = T.smooth(u);
    C.clawd({
      x: T.lerp(620, 1180, k), y: T.lerp(700, 520, k), h: 300, seed: 120, eyes: 'happy', mouth: 'grin',
      armL: -0.8 + run * 0.8, armR: 0.8 + run * 0.8, legL: run * 0.55, legR: -run * 0.55, squash: 1 - k * 0.2
    });
  }

  // 45.0–48.5 横版:火箭滑板冲等高线山丘
  function skateRun(t) {
    const u = T.inv(t, 45.0, 49.4);
    P.cam(960, 540, 1.02 + u * 0.06);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#e8b477', 255, { layers: 3, jitter: 36, seed: 110, fade: 0.9 });
    contourHills(95, t * 520);
    // 火箭滑板 + Clawd + 研究员
    const k = Math.floor((t - 45.0) * 2.2) * 0.06;   // 每半拍长大一点
    const bx = 760, by = 660 - sin(t * 2.2) * 40;
    push(); translate(bx, by); rotate(-0.1);
    P.blob(P.roundRectPts(-260, -20, 520, 44, 0.4, 3), '#c2352f', 255, { layers: 2, jitter: 8, seed: 111 });
    PR.rocket(-320, -6, 150, -HALF_PI, t);
    pop();
    C.clawd({
      x: bx - 40, y: by - 170, h: 280 * (1 + k), seed: 121, eyes: 'happy', mouth: 'grin',
      armL: -1.7, armR: 1.2, legL: -0.2, legR: 0.2, rot: -0.08
    });
    C.researcher({
      x: bx + 190, y: by + 30, h: 250, seed: 215, glasses: true, mouth: 'gasp', sweat: 0.8,
      armL: -1.2, armR: -0.4, rot: 0.5, hairBlow: 1
    });
    // 对向驶来的火车与飞机
    const tr = 1920 - ((t - 45.0) * 900) % 2600;
    P.blob(P.roundRectPts(tr - 260, 830, 520, 150, 0.16, 2), '#4a5e82', 255, { layers: 2, jitter: 8, seed: 112 });
    for (let i = 0; i < 4; i++) P.blob(P.roundRectPts(tr - 220 + i * 120, 860, 80, 60, 0.2, 2), '#e8c766', 255, { layers: 1, jitter: 4, seed: 113 + i });
    const jt = ((t - 45.0) * 700 + 900) % 3200;
    P.blob(P.roundRectPts(jt - 1500, 210 + sin(t * 3) * 30, 240, 60, 0.5, 3), '#f2ecdc', 255, { layers: 2, jitter: 8, seed: 114 });
    P.blob(P.roundRectPts(jt - 1440, 150 + sin(t * 3) * 30, 100, 90, 0.3, 2), '#f2ecdc', 255, { layers: 1, jitter: 5, seed: 115 });
    // 速度线
    for (let i = 0; i < 8; i++) {
      const y = 200 + i * 110, x0 = (t * 1400 + i * 320) % 2200 - 200;
      P.stroke([[x0, y], [x0 - 260, y]], { color: '#c98d4e', weight: 10, brush: 'pen', seed: 116 + i, jitter: 8 });
    }
  }

  // 49.4–51.9 原子重排:研究员散成色点 → 排成回形针 → 弹回(眼镜戴反)
  function atoms(t) {
    const u = T.inv(t, 49.4, 53.4);
    P.cam(960, 540, 1.1);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#b98db4', 255, { layers: 3, jitter: 36, seed: 117, fade: 0.9 });
    const disp = sin(T.clamp(u * 2) * PI);      // 散开 0→1→0
    // 色点(围绕研究员人形位置)
    for (let i = 0; i < 42; i++) {
      const hx2 = 960 + (T.h2(120, i) - 0.5) * 300, hy2 = 620 + (T.h2(121, i) - 0.5) * 420;
      // 回形针形状目标点
      const clip = i % 2 === 0;
      const cx2 = clip ? 960 + cos(i * 0.8 + t) * 90 : hx2, cy2 = clip ? 560 + sin(i * 1.1 + t) * 130 : hy2;
      const px = T.lerp(hx2, cx2, disp), py = T.lerp(hy2, cy2, disp);
      P.dot(px, py, 16 + T.h2(122, i) * 22, ['#e8c766', '#c2352f', '#5aa46a', '#4a7ec2', '#f2ecdc'][i % 5], 255, 123 + i);
    }
    if (disp > 0.35) PR.paperclip(960, 560, 4.2 + disp, sin(t * 2) * 0.2, '#3a3630', 381);
    // 弹回后的研究员(眼镜戴反)
    if (disp < 0.5) {
      const al = 1 - disp * 2;
      push();
      C.researcher({
        x: 960, y: 1000, h: 340, seed: 216, glasses: true, mouth: 'gasp', brow: 0.6,
        armL: -1.2 + sin(t * 8) * 0.2, armR: 1.2 - sin(t * 8) * 0.2
      });
      // 反戴的眼镜(挪到额头上)
      P.stroke([[890, 640], [1030, 638]], { color: '#2a2320', weight: 10, brush: 'pen', seed: 124, jitter: 4 });
      P.ellipseBlob(916, 616, 34, 34, '#cfe0f2', 120, { layers: 1, jitter: 4, seed: 125, n: 12 });
      P.ellipseBlob(1004, 614, 34, 34, '#cfe0f2', 120, { layers: 1, jitter: 4, seed: 126, n: 12 });
      pop();
      void al;
    }
    // 飘入的心(接下一场)
    for (let i = 0; i < 8; i++) {
      const ph = (t * 0.5 + i * 0.125) % 1;
      C.heart(T.lerp(200 + i * 220, 320 + i * 200, ph), 1080 - ph * 900, 30 + i * 4, '#e8455f', 130 + i);
    }
  }

  // 53.4–58.4 悉尼心房:心形鸟笼 + 求婚 → 挤出 → 心形泡泡铺满并爆开
  function sydney(t) {
    const u = T.inv(t, 53.4, 58.4);
    P.cam(960, 540, 1.04 + T.smooth(T.inv(t, 57.6, 58.4)) * 0.7);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#e8a4b4', 255, { layers: 3, jitter: 36, seed: 130, fade: 0.9 });
    for (let i = 0; i < 16; i++) {
      const hx2 = T.h2(131, i) * 1920, hy2 = (T.h2(132, i) * 1200 + t * 40 * (i % 3 + 1)) % 1300 - 120;
      C.heart(hx2, hy2, 18 + T.h2(133, i) * 26, i % 2 ? '#e8455f' : '#f2b8c2', 134 + i);
    }
    // 心形鸟笼(研究员在笼里)
    const cageX = 620, cageY = 560;
    C.heart(cageX, cageY, 300, '#f2b8c2', 136);
    C.heart(cageX, cageY, 258, '#e8a4b4', 137);
    for (let i = -3; i <= 3; i++) {
      P.stroke([[cageX + i * 74, cageY - 180 + Math.abs(i) * 26], [cageX + i * 74, cageY + 220]], { color: '#8a4f5c', weight: 12, brush: 'pen', seed: 138 + i, jitter: 6 });
    }
    const shake = sin(t * 12) * 6;
    C.researcher({ x: cageX + shake, y: cageY + 210, h: 220, seed: 217, glasses: true, mouth: 'gasp', armL: -1.8, armR: 1.8, sweat: 0.8 });
    // Sydney-Clawd(心形眼)抱笼 + 递戒指
    C.clawd({
      x: 1300, y: 640, h: 360, seed: 122, eyes: 'heart', mouth: 'smile', blush: 1,
      armL: -1.1, armR: 0.9 - T.smooth(T.inv(t, 55.2, 56.0)) * 0.5
    });
    if (t > 55.2) {
      P.ellipseBlob(1520, 620, 34, 34, '#f0c14a', 255, { layers: 1, jitter: 3, seed: 139, n: 14 });
      P.ellipseBlob(1520, 620, 18, 18, '#e8a4b4', 255, { layers: 1, jitter: 2, seed: 140, n: 12 });
      P.glow(1520, 620, 120, '#f0c14a', 30, 3);
    }
    // 57.6 起:心形泡泡铺满屏幕
    const bub = T.inv(t, 57.6, 58.4);
    if (bub > 0) {
      C.heart(960, 540, 260 + T.easeIn(bub) * 1400, '#f2b8c2', 141);
      C.heart(960, 540, 180 + T.easeIn(bub) * 1200, '#e8455f', 142);
      if (bub > 0.94) {
        for (let i = 0; i < 22; i++) {
          const a = i / 22 * TWO_PI, r = (bub - 0.94) * 4200;
          P.stroke([[960 + cos(a) * r * 0.5, 540 + sin(a) * r * 0.5], [960 + cos(a) * r, 540 + sin(a) * r]], {
            color: '#f7efdd', weight: 26, brush: 'pen', seed: 143 + i, jitter: 10
          });
        }
      }
    }
    void u;
  }

  function frame(t) {
    if (t < 41.5) gym(t);
    else if (t < 45.0) blackHole(t);
    else if (t < 49.4) skateRun(t);
    else if (t < 53.4) atoms(t);
    else sydney(t);
  }

  return { frame };
})();
