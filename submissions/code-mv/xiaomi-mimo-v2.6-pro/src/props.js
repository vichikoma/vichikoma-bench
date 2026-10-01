// src/props.js — 舞台/场景道具(水彩绘制,全部确定性)
window.MV = window.MV || {};

MV.props = (function () {
  const T = MV.tl, P = MV.paint;

  // ---- 桌面显示器(厚重 CRT) ----
  // inner(x,y,w,h) 在屏幕区域内绘制内容(世界坐标已变换好)
  function monitor(x, y, w, h, opts = {}) {
    const seed = opts.seed || 301;
    // 屏幕辉光
    P.glow(x + w / 2, y + h / 2, w * 0.95, opts.glowColor || '#57c6c9', 30, 4);
    // 机身
    const body = P.roundRectPts(x, y, w, h, 0.12, 5);
    P.blob(body, opts.case || '#c9b493', 255, { layers: 2, jitter: w * 0.012, seed });
    P.blob(body, '#8d7a5c', 40, { layers: 2, jitter: w * 0.02, seed: seed + 1, fade: 0.75 });
    P.outline(body, { color: '#5c4b34', weight: w * 0.011, brush: 'pen', seed: seed + 2, jitter: w * 0.008 });
    // 屏幕
    const sx = x + w * 0.09, sy = y + h * 0.1, sw = w * 0.82, sh = h * 0.62;
    const scr = P.roundRectPts(sx, sy, sw, sh, 0.16, 5);
    P.blob(scr, opts.screen || '#123a44', 255, { layers: 2, jitter: sw * 0.012, seed: seed + 3 });
    P.blob(scr, opts.screen2 || '#1d6a74', 120, { layers: 2, jitter: sw * 0.03, seed: seed + 4, fade: 0.7 });
    // 屏幕内容
    if (opts.inner) {
      push();
      opts.inner(sx, sy, sw, sh);
      pop();
    }
    P.outline(scr, { color: '#5c4b34', weight: w * 0.008, brush: 'pen', seed: seed + 5, jitter: sw * 0.008 });
    // 旋钮 + 底座
    P.dot(x + w * 0.22, y + h * 0.82, w * 0.028, '#6b5a44', 255, seed + 6);
    P.dot(x + w * 0.3, y + h * 0.82, w * 0.028, '#6b5a44', 255, seed + 7);
    P.blob(P.roundRectPts(x + w * 0.3, y + h, w * 0.4, h * 0.12, 0.3, 3), '#b09a77', 255, { layers: 2, jitter: w * 0.01, seed: seed + 8 });
  }

  // ---- 办公椅 ----
  function officeChair(x, y, s, rot = 0, backK = 1) {
    push();
    translate(x, y); rotate(rot);
    P.stroke([[0, 0], [0, s * 0.5]], { color: '#4a4258', weight: s * 0.09, brush: 'pen', seed: 321, jitter: s * 0.01 });
    for (const a of [-1.1, -0.4, 0.4, 1.1]) {
      P.stroke([[0, s * 0.48], [cos(a) * s * 0.34, s * 0.62]], { color: '#4a4258', weight: s * 0.055, brush: 'pen', seed: 322 + a * 10, jitter: s * 0.01 });
      P.dot(cos(a) * s * 0.36, s * 0.64, s * 0.045, '#2f2a3a', 255, 323 + a * 10);
    }
    // 坐垫
    P.blob(P.roundRectPts(-s * 0.42, -s * 0.12, s * 0.84, s * 0.22, 0.45, 4), '#7a4419', 255, { layers: 2, jitter: s * 0.02, seed: 324 });
    // 椅背(backK: 1=正面看到背板,0=转开)
    push();
    translate(-s * 0.42, -s * 0.1);
    rotate(-backK * 1.5);
    const back = P.roundRectPts(-s * 0.06, -s * 0.98, s * 0.12, s * 0.95, 0.5, 4);
    P.blob(back, '#8a5222', 255, { layers: 2, jitter: s * 0.02, seed: 325 });
    P.outline(back, { color: '#5c3413', weight: s * 0.016, brush: 'pen', seed: 326, jitter: s * 0.012 });
    pop();
    pop();
  }

  // ---- 咖啡杯 ----
  function mug(x, y, s, seed = 330, color = '#e8e0cf') {
    P.blob(P.roundRectPts(x - s * 0.42, y - s * 0.5, s * 0.84, s, 0.18, 4), color, 255, { layers: 2, jitter: s * 0.03, seed });
    P.blob(P.roundRectPts(x - s * 0.42, y - s * 0.5, s * 0.84, s, 0.18, 4), '#b98d5c', 46, { layers: 1, jitter: s * 0.05, seed: seed + 1 });
    P.outline(P.roundRectPts(x - s * 0.42, y - s * 0.5, s * 0.84, s, 0.18, 4), { color: '#6b5a44', weight: s * 0.035, brush: 'pen', seed: seed + 2, jitter: s * 0.02 });
    P.stroke(spiralArc(x + s * 0.44, y - s * 0.16, s * 0.26), { color: '#6b5a44', weight: s * 0.055, brush: 'pen', seed: seed + 3, jitter: s * 0.02 });
    // 咖啡面 + 热气
    P.ellipseBlob(x, y - s * 0.48, s * 0.36, s * 0.1, '#5c3413', 255, { layers: 2, jitter: s * 0.02, seed: seed + 4, n: 12 });
    P.stroke([[x - s * 0.1, y - s * 0.62], [x + s * 0.02, y - s * 0.82], [x - s * 0.06, y - s * 1.02]], { color: '#c9b493', weight: s * 0.05, brush: 'pen', seed: seed + 5, jitter: s * 0.03 });
    P.stroke([[x + s * 0.16, y - s * 0.6], [x + s * 0.26, y - s * 0.78], [x + s * 0.18, y - s * 0.96]], { color: '#c9b493', weight: s * 0.05, brush: 'pen', seed: seed + 6, jitter: s * 0.03 });
  }
  function spiralArc(x, y, r) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = -1.2 + (i / 10) * 3.6; pts.push([x + cos(a) * r, y + sin(a) * r * 1.15]); }
    return pts;
  }

  // ---- 门(走廊门) ----
  function door(x, y, w, h, openK = 0, seed = 340) {
    // 门框
    const frame = P.roundRectPts(x - w * 0.08, y - h * 0.05, w * 1.16, h * 1.05, 0.06, 3);
    P.blob(frame, '#e8dcc2', 255, { layers: 2, jitter: w * 0.02, seed });
    P.outline(frame, { color: '#6b5a44', weight: w * 0.028, brush: 'pen', seed: seed + 1, jitter: w * 0.012 });
    // 门洞(黑)
    P.blob(P.roundRectPts(x, y, w, h, 0.05, 3), '#241a2c', 255, { layers: 2, jitter: w * 0.015, seed: seed + 2 });
    if (openK > 0.02) {
      // 门板转开(透视压缩)
      const dw = w * (1 - openK) + w * 0.06;
      const panel = P.roundRectPts(x, y, dw, h, 0.05, 3);
      P.blob(panel, '#a8522c', 255, { layers: 2, jitter: w * 0.015, seed: seed + 3 });
      P.outline(panel, { color: '#5c3413', weight: w * 0.022, brush: 'pen', seed: seed + 4, jitter: w * 0.012 });
      P.dot(x + dw * 0.86, y + h * 0.52, w * 0.045, '#e8b44a', 255, seed + 5);
    } else {
      const panel = P.roundRectPts(x, y, w, h, 0.05, 3);
      P.blob(panel, '#a8522c', 255, { layers: 2, jitter: w * 0.015, seed: seed + 3 });
      P.outline(panel, { color: '#5c3413', weight: w * 0.022, brush: 'pen', seed: seed + 4, jitter: w * 0.012 });
      P.blob(P.roundRectPts(x + w * 0.16, y + h * 0.1, w * 0.68, h * 0.32, 0.08, 3), '#8a3f22', 90, { layers: 2, jitter: w * 0.02, seed: seed + 6 });
      P.blob(P.roundRectPts(x + w * 0.16, y + h * 0.52, w * 0.68, h * 0.36, 0.08, 3), '#8a3f22', 90, { layers: 2, jitter: w * 0.02, seed: seed + 7 });
      P.dot(x + w * 0.86, y + h * 0.52, w * 0.045, '#e8b44a', 255, seed + 5);
    }
  }

  // ---- 损失曲线图(纸) ----
  // curveK: 0=平缓 1=跳水后
  function lossChart(x, y, w, h, curveK = 0, opts = {}) {
    const seed = opts.seed || 350;
    const paper = P.roundRectPts(x, y, w, h, 0.02, 2);
    P.blob(paper, '#f7efdd', 255, { layers: 2, jitter: w * 0.01, seed });
    P.outline(paper, { color: '#6b5a44', weight: w * 0.006, brush: 'pen', seed: seed + 1, jitter: w * 0.005 });
    // 坐标轴
    P.stroke([[x + w * 0.1, y + h * 0.12], [x + w * 0.1, y + h * 0.86], [x + w * 0.92, y + h * 0.86]], { color: '#6b5a44', weight: w * 0.008, brush: 'pen', seed: seed + 2, jitter: w * 0.004 });
    // 曲线:高原 → 跳水
    const pts = [];
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const drop = T.smooth(T.inv(k, 0.42, 0.78)) * curveK;
      const wob = sin(k * 9 + seed) * 0.045 + T.h2(seed, i) * 0.03;
      const v = 0.3 + wob * (1 - drop) + drop * 0.62;
      pts.push([x + w * (0.12 + k * 0.78), y + h * (0.14 + v * 0.68)]);
    }
    P.stroke(pts, { color: '#c2402f', weight: w * 0.016, brush: 'pen', seed: seed + 3, jitter: w * 0.006, curvature: 0.5 });
    // 跳水后的水花
    if (curveK > 0.55) {
      P.splat(x + w * 0.9, y + h * 0.82, w * 0.09, 9, '#c2402f', seed + 4, 180);
    }
  }

  // ---- 红色幕布 ----
  // 顶部帷幔:全幅横幔(不随开合移动)
  function curtainValance(seed = 360) {
    const W = T.W, H = T.H;
    const valance = [[-60, -H * 0.12], [W + 60, -H * 0.12]];
    const scal = 7;
    for (let i = scal; i >= 0; i--) {
      const k = i / scal;
      valance.push([-60 + (W + 120) * k, H * 0.13 + Math.abs(sin(k * Math.PI * scal * 0.5)) * H * 0.085]);
    }
    P.blob(valance, '#a83232', 255, { layers: 3, jitter: 16, seed, grow: 0.3 });
    // 幔布褶皱
    for (let i = 0; i < 9; i++) {
      const x = 120 + i * 210;
      P.stroke([[x, -H * 0.05], [x + sin(i * 1.7) * 16, H * 0.06], [x + sin(i * 2.3) * 10, H * 0.15]], {
        color: '#7e2424', weight: 22, brush: 'pen', seed: seed + 10 + i, jitter: 10
      });
    }
    P.outline(valance, { color: '#6e1c1c', weight: 14, brush: 'pen', seed: seed + 30, jitter: 9 });
    // 金边
    P.stroke([[-60, H * 0.145], [W + 60, H * 0.145]], { color: '#e8b44a', weight: 15, brush: 'pen', seed: seed + 31, jitter: 9 });
  }

  // 侧幕:side -1 左 +1 右;open 0 关 → 1 全开
  function curtainPanel(side, open, seed = 360) {
    const W = T.W, H = T.H;
    const full = W * 0.64;
    const w = full * (1 - open * 0.72);
    const x = side < 0 ? -W * 0.08 : W - w + W * 0.08;
    // 幕布主体(竖向褶皱,深浅交替)
    const folds = 5;
    for (let i = 0; i < folds; i++) {
      const fx = x + (w / folds) * i, fw = w / folds + 2;
      const shade = 0.5 + 0.5 * sin(i * 2.1 + 1.2);
      const col = shade > 0.6 ? '#b83c3c' : shade > 0.3 ? '#9c2c2c' : '#722020';
      const pts = [
        [fx, -H * 0.08], [fx + fw, -H * 0.08],
        [fx + fw + sin(i * 1.7) * 14, H * 0.98], [fx + sin(i * 1.3 + 2) * 18, H * 1.02]
      ];
      P.blob(pts, col, 255, { layers: 3, jitter: 10, seed: seed + i * 7, grow: 0.3 });
      // 褶皱暗线(近直,只轻微起伏)
      P.stroke([[fx + fw * 0.5, -H * 0.05], [fx + fw * 0.55 + sin(i) * 4, H * 0.5], [fx + fw * 0.5 + sin(i * 2.3) * 6, H * 1.0]], {
        color: '#6e1c1c', weight: 15, brush: 'pen', seed: seed + 40 + i, jitter: 3
      });
      // 褶皱亮部
      P.stroke([[fx + fw * 0.72, -H * 0.05], [fx + fw * 0.76 + sin(i * 1.3) * 5, H * 0.55], [fx + fw * 0.72 + sin(i * 1.9) * 7, H * 1.0]], {
        color: '#d4534a', weight: 10, brush: 'pen', seed: seed + 50 + i, jitter: 3
      });
    }
    // 内缘高光 + 暗缘
    const innerX = side < 0 ? x + w : x;
    P.stroke([[innerX, -H * 0.05], [innerX + side * 26, H * 0.35], [innerX + side * 10, H * 0.72], [innerX + side * 30, H * 1.02]], {
      color: '#d4534a', weight: 30, brush: 'pen', seed: seed + 60, jitter: 12
    });
    P.stroke([[innerX + side * 8, -H * 0.05], [innerX + side * 34, H * 0.5], [innerX + side * 22, H * 1.02]], {
      color: '#6e1c1c', weight: 12, brush: 'pen', seed: seed + 61, jitter: 10
    });
    // 底部金色流苏边
    P.stroke([[x + 20, H * 1.0], [x + w - 20, H * 1.0]], { color: '#e8b44a', weight: 12, brush: 'pen', seed: seed + 62, jitter: 6 });
  }

  // ---- 引线/火花 ----
  function sparkBurst(cx, cy, r, n, color, seed, tK = 1) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TWO_PI + T.h2(seed, i) * 0.5;
      const len = r * (0.5 + T.h2(seed + 1, i) * 0.8) * tK;
      P.stroke([[cx + cos(a) * r * 0.12, cy + sin(a) * r * 0.12], [cx + cos(a) * len, cy + sin(a) * len]], {
        color, weight: 3 + T.h2(seed + 2, i) * 6, brush: 'pen', seed: seed * 3 + i, jitter: 5
      });
    }
  }

  // ============ 共享道具(分镜 2–9) ============
  // P(doom) 舞台温度计 + 自行车打气筒:value 0..100,crack 0..1 玻璃裂纹
  function pdMeter(x, y, s, value, opts = {}) {
    const seed = opts.seed || 370, gw = s * 0.52, gh = s * 2.1;
    // 玻璃管
    P.blob(P.roundRectPts(x - gw / 2, y - gh, gw, gh, 0.5, 4), '#f7efdd', 255, { layers: 2, jitter: s * 0.02, seed });
    // 红色液柱
    const fh = gh * T.clamp(value / 100) * 0.94;
    if (fh > 2) P.blob(P.roundRectPts(x - gw * 0.34, y - fh - s * 0.06, gw * 0.68, fh, 0.5, 4), '#c2352f', 255, { layers: 2, jitter: s * 0.015, seed: seed + 1 });
    P.ellipseBlob(x, y + s * 0.16, gw * 0.72, gw * 0.72, '#c2352f', 255, { layers: 2, jitter: s * 0.02, seed: seed + 2, n: 16 });
    P.outline(P.roundRectPts(x - gw / 2, y - gh, gw, gh, 0.5, 4), { color: '#5c4b34', weight: s * 0.035, brush: 'pen', seed: seed + 3, jitter: s * 0.012 });
    // 刻度
    for (let i = 1; i <= 4; i++) {
      P.stroke([[x + gw * 0.5, y - gh * i / 5], [x + gw * 0.72, y - gh * i / 5]], { color: '#5c4b34', weight: s * 0.03, brush: 'pen', seed: seed + 4 + i, jitter: s * 0.008 });
    }
    if (opts.crack) {
      for (let i = 0; i < 4; i++) {
        const cy2 = y - gh * (0.3 + T.h2(seed, i) * 0.55);
        P.stroke([[x - gw * 0.4 + gw * 0.2 * i, cy2], [x - gw * 0.1 + gw * 0.15 * i, cy2 + gh * 0.08], [x + gw * 0.25 + gw * 0.1 * i, cy2 - gh * 0.05]], {
          color: '#8a2c28', weight: s * 0.022, brush: 'pen', seed: seed + 10 + i, jitter: s * 0.01
        });
      }
    }
    // 数字读数
    P.textPainted(String(Math.round(value * 10) / 10) + '%', x, y - gh - s * 0.32, s * 0.42, { color: '#7a2424', seed: seed + 6, tilt: -0.04 });
    // 打气筒(右侧)
    const px = x + s * 1.28;
    P.blob(P.roundRectPts(px - s * 0.16, y - gh * 0.52, s * 0.32, gh * 0.52, 0.3, 3), '#b09a77', 255, { layers: 2, jitter: s * 0.012, seed: seed + 7 });
    const hk = (opts.pumpK || 0) * s * 0.34;
    P.stroke([[px, y - gh * 0.52 - hk], [px, y - gh * 0.78 - hk]], { color: '#6b5a44', weight: s * 0.09, brush: 'pen', seed: seed + 8, jitter: s * 0.01 });
    P.stroke([[px - s * 0.22, y - gh * 0.8 - hk], [px + s * 0.22, y - gh * 0.8 - hk]], { color: '#6b5a44', weight: s * 0.1, brush: 'pen', seed: seed + 9, jitter: s * 0.01 });
    P.stroke([[px - s * 0.14, y - gh * 0.3], [x + gw * 0.6, y - gh * 0.14], [x, y - gh * 0.1]], { color: '#6b5a44', weight: s * 0.05, brush: 'pen', seed: seed + 10, jitter: s * 0.012, curvature: 0.4 });
  }

  // 回形针(单个)
  function paperclip(x, y, s, rot = 0, color = '#9aa2ac', seed = 380) {
    push(); translate(x, y); rotate(rot); scale(s);
    P.stroke([[-12, -34], [12, -36], [16, -20], [15, 28], [-2, 34], [-15, 28], [-16, -20], [-8, -24], [8, -25], [11, -6], [10, 18], [-2, 22], [-9, 17]], {
      color, weight: 6, brush: 'pen', seed, jitter: 1.6, curvature: 0.42
    });
    pop();
  }

  // 舞台太阳光放射(rose/ochre sunburst)
  function sunburst(x, y, r, cols, seed = 390, n = 18) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * TWO_PI, a1 = ((i + 0.52) / n) * TWO_PI;
      P.blob([[x, y], [x + cos(a0) * r * 1.25, y + sin(a0) * r * 1.25], [x + cos(a1) * r * 1.25, y + sin(a1) * r * 1.25]],
        cols[i % cols.length], 255, { layers: 1, jitter: r * 0.02, seed: seed + i, grow: 0.1 });
    }
  }

  // 烟花火箭:tK 为火焰抖动时间
  function rocket(x, y, s, rot = 0, tK = 0) {
    push(); translate(x, y); rotate(rot);
    P.blob([[-s * 0.22, -s * 0.2], [0, -s * 0.62], [s * 0.22, -s * 0.2], [s * 0.22, s * 0.42], [-s * 0.22, s * 0.42]], '#c2352f', 255, { layers: 2, jitter: s * 0.012, seed: 441 });
    P.blob([[-s * 0.22, -s * 0.2], [0, -s * 0.62], [s * 0.22, -s * 0.2]], '#e8622f', 255, { layers: 2, jitter: s * 0.01, seed: 442, grow: 0.1 });
    P.blob([[-s * 0.22, s * 0.06], [-s * 0.52, s * 0.5], [-s * 0.22, s * 0.36]], '#f0c14a', 255, { layers: 2, jitter: s * 0.01, seed: 443, grow: 0.1 });
    P.blob([[s * 0.22, s * 0.06], [s * 0.52, s * 0.5], [s * 0.22, s * 0.36]], '#f0c14a', 255, { layers: 2, jitter: s * 0.01, seed: 444, grow: 0.1 });
    P.ellipseBlob(0, -s * 0.12, s * 0.1, s * 0.1, '#f7efdd', 255, { layers: 1, jitter: s * 0.006, seed: 445, n: 12 });
    // 尾焰
    for (let i = 0; i < 3; i++) {
      const L = s * (0.4 + 0.14 * sin(tK * 9 + i * 2.1));
      P.blob([[-s * 0.16, s * 0.42], [0, s * 0.42 + L + s * 0.1 * sin(tK * 7 + i)], [s * 0.16, s * 0.42]],
        i === 0 ? '#f0c14a' : '#e8622f', 255, { layers: 1, jitter: s * 0.02, seed: 446 + i, grow: 0.1 });
    }
    pop();
  }

  // 云朵蓬蓬
  function cloudPuff(x, y, s, seed = 450, color = '#f2ecdc') {
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TWO_PI;
      P.ellipseBlob(x + cos(a) * s * 0.55, y + sin(a) * s * 0.28, s * (0.5 + T.h1(seed + i) * 0.25), s * 0.42, color, 255, { layers: 2, jitter: s * 0.05, seed: seed + i, n: 16 });
    }
    P.ellipseBlob(x, y, s * 0.72, s * 0.5, color, 255, { layers: 2, jitter: s * 0.05, seed: seed + 9, n: 18 });
  }

  // SFX 大字(FOOM/BOOM/CHOMP/SLAM…,全片仅少数几处)
  function sfxWord(str, x, y, size, opts = {}) {
    P.glow(x, y, size * 1.5, opts.glow || '#f0c14a', 30, 3);
    P.textPainted(str, x, y, size, {
      color: opts.color || '#f7efdd', shadow: opts.shadow || '#7a2424', shadowOff: size * 0.055,
      seed: opts.seed || 460, tilt: opts.tilt === undefined ? -0.06 : opts.tilt, scale: opts.scale || 1
    });
  }

  return { monitor, officeChair, mug, door, lossChart, curtainValance, curtainPanel, sparkBurst, pdMeter, paperclip, sunburst, rocket, cloudPuff, sfxWord };
})();
