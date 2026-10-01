// src/shot01.js — 分镜 1 · The Lab (1.5–23s)
// 节拍网格 132BPM(T.beatTime(n) = 0.212 + n*0.45455):
//   3.848 星星眼迸发 | 6.121 反打研究员 | 8.394 耸肩眨眼 + 损失图弹出
//   9.303 跳上损失曲线 | 12.485 冲出显示器 | 13.394 转椅亮相(王冠)
//   17.939 盖子吱呀裂开 | 18.394 起三门穿梭每拍一换 | 22.42 CHOMP(黑场由 scenes.js 收)
window.MV = window.MV || {};

MV.shot01 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;
  const B = n => T.beatTime(n);

  // ---------- 布景件 ----------
  function labWall(seed = 101) {
    P.blob([[0, 0], [1920, 0], [1920, 664], [0, 664]], '#2a3352', 255, { layers: 3, jitter: 30, seed, fade: 0.85 });
    P.blob([[0, 664], [1920, 664], [1920, 1080], [0, 1080]], '#3a2f3f', 255, { layers: 3, jitter: 24, seed: seed + 1, fade: 0.85 });
    P.stroke([[0, 666], [1920, 660]], { color: '#221b2e', weight: 12, brush: 'pen', seed: seed + 2, jitter: 10 });
  }

  function windowMoon(x, y, w, h, seed = 120) {
    const fr = P.roundRectPts(x, y, w, h, 0.06, 3);
    P.blob(fr, '#2f4a6e', 255, { layers: 2, jitter: 10, seed });
    P.blob(fr, '#4a6a94', 90, { layers: 1, jitter: 16, seed: seed + 1 });
    P.ellipseBlob(x + w * 0.64, y + h * 0.3, w * 0.15, w * 0.15, '#f2ead0', 255, { layers: 2, jitter: 6, seed: seed + 2, n: 20 });
    P.glow(x + w * 0.64, y + h * 0.3, w * 0.5, '#cfe0f2', 24, 4);
    for (let i = 0; i < 6; i++) {
      P.dot(x + w * (0.1 + T.h1(seed + i) * 0.8), y + h * (0.1 + T.h1(seed + i * 3) * 0.55), 2.6 + T.h1(seed + i * 7) * 3, '#e8f0f7', 220, seed + 30 + i);
    }
    P.stroke([[x + w / 2, y], [x + w / 2, y + h]], { color: '#223047', weight: 13, brush: 'pen', seed: seed + 3, jitter: 5 });
    P.stroke([[x, y + h / 2], [x + w, y + h / 2]], { color: '#223047', weight: 13, brush: 'pen', seed: seed + 4, jitter: 5 });
    P.outline(fr, { color: '#223047', weight: 15, brush: 'pen', seed: seed + 5, jitter: 6 });
  }

  // 器材架(暗部剪影,补右侧构图)
  function shelf(x, y, s, seed = 130) {
    for (let i = 0; i < 3; i++) {
      P.blob(P.roundRectPts(x, y + i * s * 0.42, s * 1.15, s * 0.06, 0.2, 2), '#241d33', 255, { layers: 2, jitter: s * 0.02, seed: seed + i });
    }
    for (let i = 0; i < 7; i++) {
      const bx = x + s * 0.06 + i * s * 0.15, by = y + (i % 3) * s * 0.42;
      P.blob(P.roundRectPts(bx, by - s * (0.16 + T.h1(seed + i) * 0.14), s * 0.1, s * (0.16 + T.h1(seed + i) * 0.14), 0.15, 2),
        i % 2 ? '#4a3a5c' : '#5c4a3a', 255, { layers: 2, jitter: s * 0.015, seed: seed + 10 + i });
    }
  }

  // 电路藤蔓:k=0..1 爬出进度;front=true 时爬向镜头(覆盖满屏)
  function partial(pts, k) {
    if (k >= 1) return pts.slice();
    const out = [pts[0]];
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    let want = total * k, acc = 0;
    for (let i = 1; i < pts.length && out.length < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d < want) { out.push(pts[i]); acc += d; }
      else {
        const f = (want - acc) / d;
        out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]);
        break;
      }
    }
    return out;
  }

  function circuits(t, k, front) {
    const vines = [
      [[1980, 300], [1700, 260], [1430, 300], [1180, 240], [930, 270], [660, 210], [380, 250], [60, 190]],
      [[1980, 470], [1720, 520], [1470, 470], [1210, 540], [950, 500], [680, 570], [420, 520], [120, 580]],
      [[1980, 640], [1730, 610], [1500, 660], [1260, 620], [1010, 680], [760, 640], [520, 700], [240, 660]],
      [[1860, 860], [1600, 820], [1330, 880], [1060, 830], [800, 890], [540, 840], [280, 900], [40, 850]]
    ];
    for (let i = 0; i < vines.length; i++) {
      const kk = T.clamp(k * 1.35 - i * 0.14);
      const cut = partial(vines[i], kk);
      if (cut.length > 1) {
        P.stroke(cut, { color: '#3fd0b8', weight: front ? 16 : 10, brush: 'pen', seed: 140 + i * 7, jitter: 7 });
        // 走线上的节点灯(拍点闪)
        for (let j = 1; j < cut.length; j += 2) {
          const blink = T.pulse(t - j * 0.13 - i * 0.2) > 0.5 ? 255 : 120;
          P.dot(cut[j][0], cut[j][1], front ? 12 : 8, '#7ef2dc', blink, 150 + i * 11 + j);
        }
      }
    }
  }

  // ---------- 0–3.6:过肩看黑实验室,屏里 Clawd 睡着 → 睁眼 ----------
  function segA(t) {
    const zoom = 1.0 + T.inv(t, 1.5, 3.6) * 0.15;
    const sh = T.hit(t, B(4), 8) * 6 + T.hit(t, B(6), 8) * 5;
    P.cam(940 + sin(t * 33) * sh, 520 + cos(t * 27) * sh * 0.7, zoom);
    labWall();
    windowMoon(90, 120, 360, 300);
    shelf(1640, 210, 300);
    // 桌面
    P.blob([[0, 760], [1920, 760], [1920, 1080], [0, 1080]], '#4a3a2e', 255, { layers: 3, jitter: 22, seed: 160, fade: 0.85 });
    P.stroke([[0, 762], [1920, 756]], { color: '#2c2118', weight: 14, brush: 'pen', seed: 161, jitter: 9 });

    // 显示器(屏里 Clawd 睡着 → 2.94 睁眼)
    const glowK = 0.7 + T.pulse(t) * 0.5;
    PR.monitor(880, 300, 560, 400, {
      seed: 170,
      inner: (sx, sy, sw, sh2) => {
        for (let y = sy + 14; y < sy + sh2 - 8; y += 24) {
          P.stroke([[sx + 10, y], [sx + sw - 10, y]], { color: '#0d2b33', weight: 3, brush: 'pen', seed: 180 + y, jitter: 2 });
        }
        const awake = t >= 2.94;
        const eyes = !awake ? 'closed' : t < 3.06 ? 'half' : 'open';
        C.clawd({
          x: sx + sw / 2, y: sy + sh2 * 0.6, h: 132, eyes, mouth: awake ? 'smile' : 'flat',
          look: [0.1, 0], seed: 181, shadow: false,
          squash: 1 + 0.3 * T.hit(t, 2.94, 9)   // 睁眼一记小弹
        });
        // 呼吸小 "z"
        if (!awake) {
          for (let i = 0; i < 2; i++) {
            const zk = (t * 0.5 + i * 0.5) % 1;
            P.textPainted('z', sx + sw * 0.68 + zk * 40, sy + sh2 * 0.3 - zk * 60, 34, {
              color: '#7fd8d8', seed: 190 + i, rot: 0.2, jitter: 4
            });
          }
        }
      }
    });
    P.glow(1160, 460, 420 * glowK, '#57c6c9', 26, 4);

    // 前景:研究员背影(过肩)
    C.researcher({ x: 480, y: 1560, h: 980, back: true, shadow: false, seed: 200 });
  }

  // ---------- 3.6–6.0:推进 Clawd 脸,眼睛变星星,火花迸出填满房间 ----------
  function segB(t) {
    const k = T.inv(t, 3.6, 5.9);
    const zoom = 1.12 + k * 0.5;
    const sh = T.hit(t, B(8), 8) * 9;
    P.cam(960 + sin(t * 37) * sh, 500, zoom);
    // 屏幕铺满
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#123a44', 255, { layers: 3, jitter: 30, seed: 210 });
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#1d6a74', 90, { layers: 2, jitter: 40, seed: 211, fade: 0.8 });
    for (let y = 30; y < 1080; y += 46) {
      P.stroke([[0, y], [1920, y + sin(y) * 6]], { color: '#0c2a32', weight: 4, brush: 'pen', seed: 212 + y, jitter: 3 });
    }

    // 星星眼 Clawd 特写
    const morph = T.seg(t, 3.78, 3.9, T.easeBack);       // 挤眼 → 星星
    const eyes = morph > 0.5 ? 'star' : morph > 0.15 ? 'half' : 'open';
    C.clawd({
      x: 960, y: 620, h: 660, eyes, mouth: 'open', look: [0.15, -0.1],
      squash: 1 + 0.16 * T.hit(t, B(8), 7), brow: -0.25, blush: 0.5, seed: 220, shadow: false
    });

    // 火花从屏幕里喷出来(烟花)
    const tk = T.seg(t, 3.85, 5.3, T.easeOut);
    PR.sparkBurst(960, 520, 620 * (0.4 + tk), 24, '#ffd66b', 230, 0.4 + tk);
    PR.sparkBurst(960, 520, 420 * (0.4 + tk), 16, '#f2913b', 233, 0.5 + tk);
    // 满屋星星
    for (let i = 0; i < 16; i++) {
      const a = T.h1(i * 3.1) * TWO_PI, d = (240 + T.h1(i * 7.7) * 780) * (0.35 + tk * 0.8);
      const sx = 960 + cos(a) * d, sy = 520 + sin(a) * d * 0.72;
      const r = 16 + T.h1(i * 5.3) * 30 + sin(t * 3 + i) * 4;
      C.star(sx, sy, r, r * 0.42, i % 3 ? '#ffd66b' : '#fff3c4', 240 + i);
    }
    // 研究员眼镜里的星星反光(右下角小个子)
    C.researcher({ x: 1660, y: 1130, h: 420, starGlare: true, mouth: 'gasp', seed: 250, shadow: false, armL: -0.9, armR: 0.9 });
  }

  // ---------- 6.0–8.0:反打研究员,电路藤蔓爬墙,连人带椅后退 ----------
  function segC(t) {
    const sh = T.hit(t, B(13), 8) * 7;
    P.cam(820 + sin(t * 29) * sh, 560, 1.14 - T.inv(t, 6, 7.9) * 0.18);
    labWall(260);
    windowMoon(1420, 110, 380, 300, 270);
    shelf(120, 190, 260, 280);
    P.blob([[0, 780], [1920, 780], [1920, 1080], [0, 1080]], '#4a3a2e', 255, { layers: 3, jitter: 22, seed: 281, fade: 0.85 });

    // 电路藤蔓从右侧屏幕爬出来
    circuits(t, T.inv(t, 6.05, 7.9), false);

    // 研究员:星星眼 → 汗珠,连人带椅往后滑
    const scoot = T.seg(t, 6.12, 7.9, T.easeOut) * 300 + sin(T.beatF(t) * TWO_PI) * 9;
    const px = 880 - scoot;
    PR.officeChair(px + 10, 1000, 330, sin(t * 2.2) * 0.05);
    const scare = T.inv(t, 6.5, 7.0);
    C.researcher({
      x: px, y: 968, h: 520, starGlare: t < 6.62, sweat: scare * 0.9,
      mouth: t < 6.6 ? 'ooh' : 'gasp', armL: -1.2 - sin(t * 5) * 0.25, armR: 1.2 + sin(t * 5 + 1) * 0.25,
      seed: 290
    });

    // 7.6 后电路扑向镜头
    if (t > 7.55) {
      circuits(t, 1, true);
      const vk = T.inv(t, 7.55, 7.95);
      P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#0c1c26', 70 * vk, { layers: 2, jitter: 30, seed: 295 });
    }
  }

  // ---------- 8.0–9.0:屏里 Clawd 耸肩眨眼,损失图表弹出 ----------
  function segD(t) {
    const sh = T.hit(t, B(18), 9) * 8;
    P.cam(960 + sin(t * 31) * sh, 520, 1.06);
    labWall(300);
    P.blob([[0, 780], [1920, 780], [1920, 1080], [0, 1080]], '#4a3a2e', 255, { layers: 3, jitter: 22, seed: 301, fade: 0.85 });

    // 损失图表弹出(elastic)
    const popK = T.seg(t, 8.25, 8.75, T.easeElastic);
    if (popK > 0.01) {
      push();
      translate(430, 420); scale(popK); translate(-430, -420);
      PR.lossChart(130, 190, 600, 430, 0.32, { seed: 310 });
      pop();
    }

    PR.monitor(980, 300, 560, 400, {
      seed: 320,
      inner: (sx, sy, sw, sh2) => {
        const shrug = T.seg(t, 8.15, 8.45, T.easeBack);
        C.clawd({
          x: sx + sw / 2, y: sy + sh2 * 0.6, h: 140,
          eyes: t > 8.5 ? 'wink' : 'open', mouth: 'smile',
          armL: -0.4 - shrug * 1.5, armR: 0.4 + shrug * 1.5,
          squash: 1 + 0.12 * shrug * sin(t * 16), seed: 321, shadow: false
        });
      }
    });
    P.glow(1260, 460, 420, '#57c6c9', 26, 4);
  }

  // ---------- 9.0–13.0:跳上损失曲线滑雪 → 冲出显示器 ----------
  function segE(t) {
    if (t >= 12.42) return segBurst(t);
    const k = T.inv(t, 9.0, 12.3);
    const sh = T.hit(t, B(20), 8) * 10 + T.hit(t, B(22), 8) * 8;
    P.cam(960 + sin(t * 41) * sh, 420 + k * 320, 1.0 + k * 0.42);

    // 巨型损失图纸
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#f7efdd', 255, { layers: 3, jitter: 34, seed: 330, fade: 0.9 });
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#e8d8b8', 70, { layers: 2, jitter: 44, seed: 331, fade: 0.8 });
    // 坐标轴
    P.stroke([[180, 120], [180, 900], [1760, 900]], { color: '#6b5a44', weight: 16, brush: 'pen', seed: 332, jitter: 8 });

    // 曲线(随时间从高原跳水),Clawd 骑着同一条曲线
    const curveK = T.seg(t, 9.25, 11.6, T.easeInOut);
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      const drop = T.smooth(T.inv(u, 0.42, 0.78)) * curveK;
      const wob = sin(u * 9 + 3.5) * 0.05 + T.h2(340, i) * 0.03;
      const v = 0.24 + wob * (1 - drop) + drop * 0.66;
      pts.push([180 + u * 1580, 140 + v * 760]);
    }
    P.stroke(pts, { color: '#c2402f', weight: 26, brush: 'pen', seed: 341, jitter: 7, curvature: 0.5 });

    // Clawd 沿曲线滑下
    const ride = T.clamp(T.inv(t, 9.35, 12.15));
    const idx = ride * (pts.length - 1);
    const i0 = Math.floor(idx), i1 = Math.min(pts.length - 1, i0 + 1), f = idx - i0;
    const cx = T.lerp(pts[i0][0], pts[i1][0], f), cy = T.lerp(pts[i0][1], pts[i1][1], f);
    const tilt = Math.atan2(pts[i1][1] - pts[i0][1], pts[i1][0] - pts[i0][0]);
    // 起跳(9.35 前在纸边助跑)
    const startX = 120, startY = 640;
    const onCurve = t > 9.35;
    C.clawd({
      x: onCurve ? cx : startX + T.inv(t, 9.0, 9.35) * 240,
      y: onCurve ? cy - 70 : startY - sin(T.inv(t, 9.0, 9.35) * PI) * 130,
      h: 230, rot: onCurve ? tilt * 0.8 : -0.3,
      eyes: t < 9.35 ? 'shock' : t > 11.9 ? 'happy' : 'open',
      mouth: t < 9.35 ? 'o' : 'open',
      armL: -1.9, armR: 1.9, legL: -0.5, legR: 0.5,
      squash: 1 + 0.1 * sin(t * 22), sweat: t > 11 ? 0.5 : 0, seed: 350
    });
    // 速度线
    for (let i = 0; i < 8; i++) {
      const ly = 180 + T.h1(i * 4.4) * 700;
      P.stroke([[120 + T.h1(i * 2.2) * 1500, ly], [120 + T.h1(i * 2.2) * 1500 - 160 - ride * 260, ly + 26]], {
        color: '#c98d4e', weight: 6, brush: 'pen', seed: 360 + i, jitter: 5
      });
    }
    // 底部颜料飞溅(坠落)
    if (t > 11.9) {
      const sk = T.inv(t, 11.9, 12.42);
      P.splat(960, 960, 130 + sk * 260, 14, '#c2402f', 370, 210);
      P.splat(960, 960, 90 + sk * 200, 10, '#8e2620', 373, 190);
      PR.sparkBurst(960, 950, 300 + sk * 320, 18, '#c2402f', 375, sk);
    }
  }

  // 12.42–13.0:Clawd 冲破显示器玻璃,长成真人大小
  function segBurst(t) {
    const k = T.inv(t, 12.42, 13.0);
    const sh = T.hit(t, 12.42, 6) * 16;
    P.cam(960 + sin(t * 53) * sh, 500 + cos(t * 47) * sh * 0.6, 1.1 + k * 0.1);
    labWall(380);
    P.blob([[0, 780], [1920, 780], [1920, 1080], [0, 1080]], '#4a3a2e', 255, { layers: 3, jitter: 22, seed: 381, fade: 0.85 });

    // 被撑破的显示器
    PR.monitor(760, 330, 480, 340, {
      seed: 382,
      inner: (sx, sy, sw, sh2) => {
        P.blob([[sx, sy], [sx + sw, sy], [sx + sw, sy + sh2], [sx, sy + sh2]], '#0c222a', 255, { layers: 2, jitter: 10, seed: 383 });
        // 裂纹
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TWO_PI;
          P.stroke([[sx + sw / 2, sy + sh2 / 2], [sx + sw / 2 + cos(a) * sw * 0.5, sy + sh2 / 2 + sin(a) * sh2 * 0.5]], {
            color: '#7fd8d8', weight: 5, brush: 'pen', seed: 384 + i, jitter: 6
          });
        }
      }
    });
    // 玻璃碎片
    for (let i = 0; i < 10; i++) {
      const a = T.h1(i * 3.3) * TWO_PI, d = 260 + T.h1(i * 6.1) * 420 * (0.3 + k);
      const fx = 1000 + cos(a) * d, fy = 520 + sin(a) * d * 0.8;
      P.blob([[fx, fy - 16], [fx + 22, fy + 12], [fx - 18, fy + 14]], '#bfe8e8', 220, { layers: 2, jitter: 5, seed: 390 + i, grow: 0.1 });
    }

    // 大 Clawd 弹出
    const popK = T.seg(t, 12.42, 12.85, T.easeBack);
    C.clawd({
      x: 1000, y: T.lerp(560, 660, popK), h: T.lerp(220, 420, popK),
      eyes: 'star', mouth: 'open', armL: -2.2, armR: 2.2, legL: -0.35, legR: 0.35,
      squash: 1 + 0.22 * T.hit(t, 12.62, 8), brow: -0.3, blush: 0.4, seed: 395
    });
    PR.sparkBurst(1000, 520, 620, 20, '#ffd66b', 396, 0.5 + k);
  }

  // ---------- 13.0–17.9:转椅亮相(王冠)+ 侍者上咖啡 + 盖子吱呀 ----------
  function segF(t) {
    const zoom = 1.0 + T.inv(t, 13.0, 17.9) * 0.13;
    const sh = T.hit(t, B(29), 8) * 10 + T.hit(t, B(39), 6) * 8;
    P.cam(960 + sin(t * 35) * sh, 520 + cos(t * 30) * sh * 0.5, zoom);
    labWall(400);
    windowMoon(110, 130, 340, 280, 410);
    shelf(1600, 200, 300, 420);
    P.blob([[0, 790], [1920, 790], [1920, 1080], [0, 1080]], '#4a3a2e', 255, { layers: 3, jitter: 22, seed: 430, fade: 0.85 });

    // 转椅亮相:13.0-13.7 从背对转正
    const spin = 1 - T.seg(t, 13.05, 13.75, T.easeOut);
    PR.officeChair(1050, 1010, 420, -spin * 2.6 + sin(t * 1.6) * 0.03);

    // 王冠 Clawd(坐在椅上),盖子 17.5 起吱呀裂开
    const lid = T.inv(t, 17.49, 17.9) * 0.34 + (t > 17.9 ? 0.34 + (t - 17.9) * 0.2 : 0);
    C.clawd({
      x: 1050, y: 690, h: 360, crown: true, lid,
      eyes: t < 13.8 ? 'half' : 'happy', mouth: t > 17.4 ? 'grin' : 'smile',
      armL: -0.75 + sin(t * 2.6) * 0.16, armR: 0.75 - sin(t * 2.6) * 0.16,
      legL: -0.25, legR: 0.25, brow: -0.2, blush: 0.25, seed: 440
    });

    // 侍者研究员:端咖啡小跑,拍点上杯
    const runT = t * 5.2;
    const px = 430 + sin((t - 13.2) * 1.7) * 120 + (t > 15.6 ? (t - 15.6) * 40 : 0);
    C.researcher({
      x: px, y: 1040, h: 540, runT, bowtie: true,
      mouth: t < 15 ? 'ooh' : 'gasp', sweat: T.inv(t, 14.4, 16.4) * 0.8,
      armL: -2.2, armR: -2.05, seed: 450
    });
    // 手上的托盘 + 杯
    PR.mug(px + 20, 1040 - 540 * 0.62, 74, 451);

    // 桌上的杯堆:每拍多一只(13.39 起)
    const pile = Math.min(6, Math.floor((t - B(29)) / T.BEAT) + 1);
    for (let i = 0; i < Math.max(0, pile); i++) {
      const row = Math.floor(i / 2), col = i % 2;
      PR.mug(1450 + col * 130, 860 - row * 128, 116, 460 + i * 7, i % 2 ? '#e8e0cf' : '#e8c98e');
    }

    // 扇风(15.6 后研究员挥动菜单)
    if (t > 15.6) {
      const fan = sin(t * 9);
      P.blob(P.roundRectPts(px + 90, 560 + fan * 26, 130, 170, 0.12, 3), '#f7efdd', 255, { layers: 2, jitter: 8, seed: 470 });
      P.outline(P.roundRectPts(px + 90, 560 + fan * 26, 130, 170, 0.12, 3), { color: '#6b5a44', weight: 7, brush: 'pen', seed: 471, jitter: 5 });
    }
  }

  // ---------- 17.9–22.42:三门穿梭追击(每拍一换,Clawd 越来越大)→ CHOMP ----------
  function segG(t) {
    if (t >= 22.06) return segChomp(t);
    const beatN = T.beatN(t);
    const phase = T.beatPhase(t);
    const sh = T.hit(t, B(40), 10) * 8 + T.hit(t, B(44), 10) * 8;
    P.cam(960 + sin(t * 47) * sh, 540, 1.02 + T.inv(t, 17.9, 22.06) * 0.2);

    // 走廊
    P.blob([[0, 0], [1920, 0], [1920, 640], [0, 640]], '#3a3452', 255, { layers: 3, jitter: 30, seed: 480, fade: 0.85 });
    P.blob([[0, 640], [1920, 640], [1920, 1080], [0, 1080]], '#54425c', 255, { layers: 3, jitter: 26, seed: 481, fade: 0.85 });
    P.stroke([[0, 642], [1920, 638]], { color: '#2c2440', weight: 14, brush: 'pen', seed: 482, jitter: 10 });

    // 三扇门
    const doors = [[220, 250], [840, 250], [1460, 250]];
    const dk = T.inv(t, 17.9, 22.06);
    for (let i = 0; i < 3; i++) {
      PR.door(doors[i][0], doors[i][1], 240, 390, 0.15 + 0.3 * Math.max(0, sin(t * 7 + i * 2.1)) * dk, 490 + i * 11);
    }

    // 每拍:Clawd 从一扇门窜出,研究员从另一扇逃出;Clawd 每拍变大
    const inBeat = phase < 0.46;
    const nShow = inBeat ? beatN : beatN - 0.0;
    const doorIdx = ((nShow % 3) + 3) % 3;
    const ch = 300 + Math.max(0, (nShow - 40)) * 66;
    if (inBeat) {
      const popK = T.seg(phase / 0.46, 0, 1, T.easeBack);
      const cx = doors[doorIdx][0] + 120;
      C.clawd({
        x: cx, y: 700 - (1 - popK) * 120, h: ch * (0.7 + popK * 0.3),
        eyes: 'wide', mouth: 'chomp', armL: -1.7, armR: 1.7, legL: -0.7, legR: 0.7,
        lid: 0.5 + 0.2 * sin(t * 12), squash: 1 + 0.12 * sin(t * 18), seed: 500 + nShow * 3
      });
      // 研究员窜向对门
      const rx = doors[(doorIdx + 2) % 3][0] + 120;
      C.researcher({
        x: rx + (1 - popK) * 240, y: 1010, h: 470, runT: t * 9,
        mouth: 'gasp', sweat: 1, armL: -2.3, armR: 2.3, seed: 510 + nShow * 3
      });
    } else {
      // 半拍空镜:速度线 + 尘土
      for (let i = 0; i < 6; i++) {
        const y = 260 + T.h1(i * 3.7) * 520;
        P.stroke([[T.h1(i * 5.1) * 1920, y], [T.h1(i * 5.1) * 1920 + 300, y + 16]], { color: '#c9b493', weight: 7, brush: 'pen', seed: 520 + i, jitter: 6 });
      }
    }
  }

  // 22.06–22.55:巨脸怼镜头,嘴合拢(CHOMP)
  function segChomp(t) {
    const zoom = 1.35 + T.inv(t, 22.06, 22.55) * 0.75;
    P.cam(960, 520, zoom);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#3a3452', 255, { layers: 3, jitter: 30, seed: 530, fade: 0.85 });
    // 巨型 Clawd 脸(嘴张大)
    const open = 1 - T.seg(t, 22.3, 22.52, T.easeIn);
    C.clawd({
      x: 960, y: 560, h: 1150, eyes: 'wide', mouth: 'chomp',
      lid: 0.62, armL: -1.9, armR: 1.9, seed: 531, shadow: false,
      squash: 1 + (1 - open) * 0.16
    });
    // 上下颌合拢(黑色口腔盖过来)
    const close = 1 - open;
    const gap = (1 - close) * 420;
    P.blob([[-200, -200], [2120, -200], [2120, 470 - gap], [-200, 470 - gap]], '#241a12', 255, { layers: 2, jitter: 26, seed: 532 });
    P.blob([[-200, 610 + gap], [2120, 610 + gap], [2120, 1280], [-200, 1280]], '#241a12', 255, { layers: 2, jitter: 26, seed: 533 });
    // 牙齿
    for (let i = 0; i < 8; i++) {
      const x = 120 + i * 230;
      P.blob([[x, 470 - gap], [x + 130, 470 - gap], [x + 65, 585 - gap]], '#fbf6ec', 255, { layers: 2, jitter: 8, seed: 540 + i, grow: 0.1 });
      P.blob([[x, 610 + gap], [x + 130, 610 + gap], [x + 65, 495 + gap]], '#fbf6ec', 255, { layers: 2, jitter: 8, seed: 550 + i, grow: 0.1 });
    }
    P.splat(960, 540, 220 * open + 40, 10, '#c96a6a', 560, 200);
  }

  function frame(t) {
    if (t < 3.6) segA(t);
    else if (t < 6.0) segB(t);
    else if (t < 8.0) segC(t);
    else if (t < 9.0) segD(t);
    else if (t < 13.0) segE(t);
    else if (t < 17.9) segF(t);
    else segG(t);
  }

  return { frame };
})();
