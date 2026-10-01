// src/chars.js — 角色绘制(Clawd / The Researcher),全片形象一致性的唯一来源
// 所有随机都用稳定 seed:同一元素在不同帧的笔触纹理一致,运动时不会"沸腾"。
window.MV = window.MV || {};

MV.chars = (function () {
  const T = MV.tl, P = MV.paint;

  // ============ 调色 ============
  const C = {
    orange: '#f2913b', orangeDeep: '#e0762b', orangeLite: '#f9b771', orangeInk: '#7a4419',
    hand: '#d9722b',
    skin: '#f6cfa4', skinShade: '#e3ac7c',
    coat: '#f4ebd8', coatShade: '#dfd2b6', coatInk: '#6b5a44',
    hair: '#3a2a22',
    white: '#fbf6ec', pupil: '#2a2320', gold: '#ffd66b'
  };

  // ---- 眼睛 ----
  function drawEye(cx, cy, r, expr, look, seed, isRight, blinkK) {
    const T2 = T;
    const sq = blinkK === undefined ? 1 : blinkK; // 1=睁开,0=闭上
    // 眼白
    if (expr === 'happy' || expr === 'closed' || (expr === 'wink' && isRight) || sq < 0.25) {
      // 弯眼 / 闭眼:画弧线
      const dir = expr === 'closed' ? 1 : -1;
      P.stroke([[cx - r, cy + (expr === 'closed' ? -r * 0.1 : r * 0.15)], [cx, cy + (expr === 'closed' ? r * 0.5 * dir * -1 : -r * 0.45)], [cx + r, cy + (expr === 'closed' ? -r * 0.1 : r * 0.15)]], {
        color: C.pupil, weight: r * 0.34, brush: 'pen', seed: seed + 2, jitter: r * 0.016, curvature: 0.6
      });
      return;
    }
    P.ellipseBlob(cx, cy, r, r * (expr === 'wide' ? 1.18 : 1) * Math.max(0.15, sq), C.white, 255, { layers: 2, jitter: r * 0.05, seed: seed + 1, n: 18, wobble: 0.07 });
    P.ellipseBlob(cx, cy, r, r * (expr === 'wide' ? 1.18 : 1) * Math.max(0.15, sq), C.white, 160, { layers: 1, jitter: r * 0.03, seed: seed + 9, n: 18, wobble: 0.05 });
    const lx = (look[0] || 0) * r * 0.34, ly = (look[1] || 0) * r * 0.34;
    const pr = r * (expr === 'wide' ? 0.34 : expr === 'half' ? 0.5 : 0.52);
    if (expr === 'star') {
      star(cx + lx, cy + ly, r * 0.62, r * 0.27, C.pupil, seed);
      star(cx + lx, cy + ly, r * 0.4, r * 0.17, C.gold, seed + 5);
    } else if (expr === 'heart') {
      heart(cx + lx, cy + ly, r * 0.72, '#e8455f', seed);
    } else if (expr === 'swirl') {
      P.stroke(spiralPts(cx + lx, cy + ly, r * 0.62, 2.4, 22), { color: C.pupil, weight: r * 0.16, brush: 'pen', seed: seed + 3, jitter: r * 0.03 });
    } else if (expr === 'red') {
      P.ellipseBlob(cx + lx, cy + ly, pr * 1.15, pr * 1.15, '#d92b2b', 255, { layers: 2, jitter: r * 0.05, seed: seed + 4, n: 14, wobble: 0.12 });
      P.glow(cx + lx, cy + ly, r * 1.25, '#ff5a3c', 34, 3);
    } else {
      P.ellipseBlob(cx + lx, cy + ly, pr, pr * (expr === 'half' ? 0.92 : 1), C.pupil, 255, { layers: 2, jitter: r * 0.05, seed: seed + 4, n: 14, wobble: 0.1 });
    }
    // 高光
    P.ellipseBlob(cx + lx - pr * 0.38, cy + ly - pr * 0.42, pr * 0.36, pr * 0.3, C.white, 255, { layers: 1, jitter: r * 0.02, seed: seed + 6, n: 10, wobble: 0.1 });
    P.ellipseBlob(cx + lx + pr * 0.3, cy + ly + pr * 0.34, pr * 0.17, pr * 0.15, C.white, 210, { layers: 1, jitter: r * 0.015, seed: seed + 7, n: 8, wobble: 0.1 });
    // 半眯眼的眼皮
    if (expr === 'half') {
      P.blob(P.roundRectPts(cx - r * 1.06, cy - r * 1.2, r * 2.12, r * 0.72, 0.5, 4), C.orange, 255, { layers: 2, jitter: r * 0.04, seed: seed + 8 });
    }
  }

  function star(cx, cy, rOut, rIn, color, seed) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = -HALF_PI + (i / 10) * TWO_PI, r = i % 2 === 0 ? rOut : rIn;
      pts.push([cx + cos(a) * r, cy + sin(a) * r]);
    }
    P.blob(pts, color, 255, { layers: 2, jitter: rIn * 0.12, seed, grow: 0.2 });
  }

  function heart(cx, cy, r, color, seed) {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TWO_PI;
      const x = 16 * Math.pow(sin(a), 3);
      const y = -(13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
      pts.push([cx + x * r / 17, cy + y * r / 17]);
    }
    P.blob(pts, color, 255, { layers: 2, jitter: r * 0.05, seed, grow: 0.15 });
  }

  function spiralPts(cx, cy, r, turns, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, a = k * TWO_PI * turns, rr = r * k;
      pts.push([cx + cos(a) * rr, cy + sin(a) * rr]);
    }
    return pts;
  }

  // ---- 嘴 ----
  function drawMouth(cx, cy, w, m, seed) {
    if (m === 'flat') {
      P.stroke([[cx - w / 2, cy], [cx + w / 2, cy]], { color: C.pupil, weight: w * 0.09, brush: 'pen', seed, jitter: w * 0.03 });
    } else if (m === 'smile') {
      P.stroke([[cx - w / 2, cy - w * 0.12], [cx, cy + w * 0.22], [cx + w / 2, cy - w * 0.12]], { color: C.pupil, weight: w * 0.11, brush: 'pen', seed, jitter: w * 0.03, curvature: 0.7 });
    } else if (m === 'grin') {
      P.stroke([[cx - w / 2, cy - w * 0.16], [cx, cy + w * 0.3], [cx + w / 2, cy - w * 0.16]], { color: C.pupil, weight: w * 0.1, brush: 'pen', seed, jitter: w * 0.03, curvature: 0.7 });
      P.blob([[cx - w * 0.42, cy - w * 0.1], [cx + w * 0.42, cy - w * 0.1], [cx, cy + w * 0.26]], '#7c2b2b', 220, { layers: 2, jitter: w * 0.04, seed: seed + 1 });
    } else if (m === 'gasp' || m === 'ooh') {
      P.ellipseBlob(cx, cy, w * 0.22, w * 0.3, '#8c3030', 255, { layers: 2, jitter: w * 0.02, seed, n: 14 });
      P.ellipseBlob(cx, cy + w * 0.1, w * 0.13, w * 0.12, '#c96a6a', 255, { layers: 1, jitter: w * 0.015, seed: seed + 2, n: 10 });
    } else if (m === 'open' || m === 'chomp') {
      const h = m === 'chomp' ? w * 0.72 : w * 0.42;
      P.ellipseBlob(cx, cy + h * 0.1, w * 0.5, h, '#7c2b2b', 255, { layers: 2, jitter: w * 0.03, seed, n: 18 });
      P.ellipseBlob(cx, cy + h * 0.52, w * 0.3, h * 0.36, '#c96a6a', 255, { layers: 1, jitter: w * 0.02, seed: seed + 3, n: 12 });
    }
  }

  // ============ Clawd ============
  // opts: x,y(身体中心) h(身体高) rot squash eyes look mouth armL armR legL legR
  //       crown lid sweat blush brow tilt blink
  function clawd(o) {
    const h = o.h, w = h * 1.6;
    const seed = o.seed === undefined ? 101 : o.seed;
    const sq = o.squash === undefined ? 1 : o.squash;   // >1 压扁
    const sy = 1 / sq, sx = sq;
    push();
    translate(o.x, o.y);
    if (o.rot) rotate(o.rot);
    scale(sx, sy);

    // 影子
    if (o.shadow !== false) {
      P.ellipseBlob(0, h * 0.62, w * 0.42, h * 0.09, '#2a2320', 26, { layers: 2, jitter: h * 0.02, seed: seed + 60, n: 14 });
    }

    // 腿
    for (const side of [-1, 1]) {
      const a = side < 0 ? (o.legL || 0) : (o.legR || 0);
      push();
      translate(side * w * 0.22, h * 0.48);
      rotate(a);
      P.blob(P.roundRectPts(-h * 0.055, -h * 0.02, h * 0.11, h * 0.3, 0.5, 3), C.orangeDeep, 235, { layers: 2, jitter: h * 0.012, seed: seed + (side < 0 ? 10 : 11) });
      P.ellipseBlob(h * 0.02, h * 0.3, h * 0.105, h * 0.075, C.hand, 255, { layers: 2, jitter: h * 0.012, seed: seed + (side < 0 ? 12 : 13), n: 12 });
      pop();
    }

    // 手臂(细短,末端圆手)
    for (const side of [-1, 1]) {
      const a = side < 0 ? (o.armL === undefined ? -0.5 : o.armL) : (o.armR === undefined ? 0.5 : o.armR);
      push();
      translate(side * w * 0.5, -h * 0.06);
      rotate(a * side >= 0 ? a : a);
      rotate(side < 0 ? PI : 0);
      P.blob(P.roundRectPts(0, -h * 0.05, h * 0.44, h * 0.1, 0.5, 3), C.orangeDeep, 235, { layers: 2, jitter: h * 0.012, seed: seed + (side < 0 ? 20 : 21) });
      P.ellipseBlob(h * 0.47, 0, h * 0.095, h * 0.088, C.hand, 255, { layers: 2, jitter: h * 0.012, seed: seed + (side < 0 ? 22 : 23), n: 12 });
      pop();
    }

    // 身体:圆角方块(宽 1.6×高)
    const pts = P.roundRectPts(-w / 2, -h / 2, w, h, 0.3, 7);
    P.blob(pts, C.orange, 255, { layers: 2, jitter: h * 0.02, seed: seed + 30, grow: 0.4 });
    P.blob(pts, C.orangeDeep, 46, { layers: 2, jitter: h * 0.03, seed: seed + 31, grow: 0.5 });     // 下缘暗部
    P.ellipseBlob(-w * 0.16, -h * 0.22, w * 0.26, h * 0.2, C.orangeLite, 70, { layers: 2, jitter: h * 0.02, seed: seed + 32, n: 16 }); // 高光
    P.outline(pts, { color: C.orangeInk, weight: h * 0.022, brush: 'pen', seed: seed + 33, jitter: h * 0.012 });

    // 顶盖(午餐盒盖):lid 0..1
    if (o.lid && o.lid > 0.01) {
      push();
      translate(-w * 0.5, -h * 0.5);
      rotate(-o.lid * 1.15);
      const lidPts = P.roundRectPts(-h * 0.03, -h * 0.16, w * 1.02, h * 0.34, 0.42, 5);
      P.blob(lidPts, C.orange, 255, { layers: 2, jitter: h * 0.02, seed: seed + 34 });
      P.outline(lidPts, { color: C.orangeInk, weight: h * 0.02, brush: 'pen', seed: seed + 35, jitter: h * 0.012 });
      // 盖内牙齿
      for (let i = 0; i < 6; i++) {
        const tx = w * 0.08 + i * w * 0.16;
        P.blob([[tx, h * 0.12], [tx + w * 0.075, h * 0.12], [tx + w * 0.037, h * 0.26]], C.white, 255, { layers: 2, jitter: h * 0.01, seed: seed + 40 + i, grow: 0.1 });
      }
      pop();
    }

    // 脸
    const ey = -h * 0.12, ex = w * 0.215, er = h * 0.175;
    const blinkK = o.blink === undefined ? 1 : o.blink;
    const expr = o.eyes || 'open';
    drawEye(-ex, ey, er, expr, o.look || [0, 0], seed + 50, false, blinkK);
    drawEye(ex, ey, er, expr === 'wink' ? 'wink' : expr, o.look || [0, 0], seed + 55, true, blinkK);
    // 眉
    if (o.brow) {
      for (const side of [-1, 1]) {
        P.stroke([[side * ex - er * 0.9, ey - er * 1.35 + side * o.brow * er * 0.3], [side * ex + er * 0.9, ey - er * 1.5 - side * o.brow * er * 0.3]], {
          color: C.orangeInk, weight: er * 0.16, brush: 'pen', seed: seed + 60 + (side < 0 ? 0 : 1), jitter: er * 0.05
        });
      }
    }
    drawMouth(0, h * 0.17, w * 0.26, o.mouth || 'smile', seed + 70);
    // 腮红
    if (o.blush) {
      for (const side of [-1, 1]) P.ellipseBlob(side * w * 0.34, h * 0.1, w * 0.1, h * 0.07, '#f0724a', 60 * o.blush, { layers: 2, jitter: h * 0.02, seed: seed + 71 + (side < 0 ? 0 : 1), n: 12 });
    }
    // 汗滴
    if (o.sweat) {
      for (let i = 0; i < Math.min(3, Math.ceil(o.sweat * 3)); i++) {
        const a = -0.7 + i * 0.55, d = w * 0.52 + i * h * 0.12;
        const sx2 = cos(a) * d, sy2 = -h * 0.42 + sin(a) * h * 0.28 + o.sweat * h * 0.2;
        P.blob([[sx2, sy2 - h * 0.09], [sx2 + h * 0.055, sy2 + h * 0.02], [sx2, sy2 + h * 0.075], [sx2 - h * 0.055, sy2 + h * 0.02]], '#8fd4e8', 240, { layers: 2, jitter: h * 0.01, seed: seed + 80 + i, grow: 0.1 });
      }
    }

    // 皇冠
    if (o.crown) {
      const cy = -h * 0.52, cw = w * 0.5;
      const cpts = [[-cw / 2, cy + h * 0.14], [-cw / 2, cy - h * 0.02], [-cw * 0.28, cy + h * 0.07], [-cw * 0.08, cy - h * 0.12], [cw * 0.12, cy + h * 0.07], [cw * 0.34, cy - h * 0.04], [cw / 2, cy + h * 0.14]];
      P.blob(cpts.concat([[cw / 2, cy + h * 0.2], [-cw / 2, cy + h * 0.2]]), '#f0c14a', 255, { layers: 2, jitter: h * 0.015, seed: seed + 90 });
      P.outline(cpts.concat([[cw / 2, cy + h * 0.2], [-cw / 2, cy + h * 0.2]]), { color: '#8a5a1c', weight: h * 0.016, brush: 'pen', seed: seed + 91, jitter: h * 0.01 });
      P.dot(0, cy + h * 0.06, h * 0.045, '#d94f4f', 255, seed + 92);
    }
    pop();
  }

  // ============ The Researcher ============
  // opts: x,y(脚底中心) h(全身高) rot back sweat bowtie mouth armL armR legL legR
  //       glasses starGlare runT fan mug handUp hairBlow
  function researcher(o) {
    const h = o.h;
    const seed = o.seed === undefined ? 202 : o.seed;
    push();
    translate(o.x, o.y);
    if (o.rot) rotate(o.rot);

    const headR = h * 0.155;
    const headY = -h * 0.86;
    const run = o.runT || 0;

    // 影子
    if (o.shadow !== false) P.ellipseBlob(0, h * 0.03, h * 0.16, h * 0.035, '#2a2320', 26, { layers: 2, jitter: h * 0.01, seed: seed + 1, n: 12 });

    // 腿
    for (const side of [-1, 1]) {
      const a = side < 0 ? (o.legL === undefined ? (run ? sin(run * TWO_PI) * 0.7 : -0.12) : o.legL) : (o.legR === undefined ? (run ? -sin(run * TWO_PI) * 0.7 : 0.12) : o.legR);
      push();
      translate(side * h * 0.055, -h * 0.3);
      rotate(a);
      P.stroke([[0, 0], [side * h * 0.012, h * 0.16], [side * h * 0.02, h * 0.28]], { color: '#4a4258', weight: h * 0.045, brush: 'pen', seed: seed + 2 + (side < 0 ? 0 : 1), jitter: h * 0.006, pressure: () => 0.8 });
      P.ellipseBlob(side * h * 0.045, h * 0.3, h * 0.055, h * 0.028, '#2f2a3a', 255, { layers: 2, jitter: h * 0.006, seed: seed + 4 + (side < 0 ? 0 : 1), n: 10 });
      pop();
    }

    // 白大褂(身体)
    const coatPts = [
      [-h * 0.145, -h * 0.62], [h * 0.145, -h * 0.62],
      [h * 0.185, -h * 0.2], [h * 0.155, -h * 0.02], [-h * 0.155, -h * 0.02], [-h * 0.185, -h * 0.2]
    ];
    P.blob(coatPts, C.coat, 255, { layers: 2, jitter: h * 0.012, seed: seed + 10 });
    P.blob(coatPts, C.coatShade, 60, { layers: 2, jitter: h * 0.02, seed: seed + 11, fade: 0.8 });
    P.outline(coatPts, { color: C.coatInk, weight: h * 0.011, brush: 'pen', seed: seed + 12, jitter: h * 0.008 });
    // 领口 + 门襟
    P.stroke([[0, -h * 0.62], [-h * 0.055, -h * 0.45], [0, -h * 0.38], [h * 0.055, -h * 0.45], [0, -h * 0.62]], { color: C.coatInk, weight: h * 0.011, brush: 'pen', seed: seed + 13, jitter: h * 0.005 });
    P.stroke([[0, -h * 0.38], [0, -h * 0.06]], { color: C.coatInk, weight: h * 0.009, brush: 'pen', seed: seed + 14, jitter: h * 0.005 });
    // 领结(服务生)
    if (o.bowtie) {
      P.blob([[-h * 0.05, -h * 0.5], [0, -h * 0.465], [h * 0.05, -h * 0.5], [0, -h * 0.535]], '#c2402f', 255, { layers: 2, jitter: h * 0.006, seed: seed + 15 });
    }

    // 手臂
    for (const side of [-1, 1]) {
      const a = side < 0 ? (o.armL === undefined ? 0.5 : o.armL) : (o.armR === undefined ? -0.5 : o.armR);
      push();
      translate(side * h * 0.15, -h * 0.58);
      rotate(a);
      P.stroke([[0, 0], [side * h * 0.02, h * 0.14], [side * h * 0.03, h * 0.26]], { color: C.coat, weight: h * 0.052, brush: 'pen', seed: seed + 20 + (side < 0 ? 0 : 1), jitter: h * 0.007, pressure: () => 0.85 });
      P.stroke([[0, 0], [side * h * 0.02, h * 0.14], [side * h * 0.03, h * 0.26]], { color: C.coatInk, weight: h * 0.012, brush: 'pen', seed: seed + 24 + (side < 0 ? 0 : 1), jitter: h * 0.008, pressure: () => 0.7 });
      P.ellipseBlob(side * h * 0.035, h * 0.285, h * 0.032, h * 0.03, C.skin, 255, { layers: 2, jitter: h * 0.006, seed: seed + 22 + (side < 0 ? 0 : 1), n: 10 });
      pop();
    }

    // 头
    P.ellipseBlob(0, headY, headR * 0.92, headR, C.skin, 255, { layers: 2, jitter: h * 0.008, seed: seed + 30, n: 18 });
    P.ellipseBlob(0, headY, headR * 0.92, headR, C.skinShade, 46, { layers: 1, jitter: h * 0.01, seed: seed + 31, n: 18 });

    if (!o.back) {
      // 乱翘头发
      P.scribble(0, headY - headR * 0.62, headR * 1.12, headR * 0.62, 9, { color: C.hair, weight: h * 0.012, brush: 'pen', seed: seed + 40 });
      P.blob([[-headR * 1.02, headY - headR * 0.2], [-headR * 0.75, headY - headR * 1.18], [0, headY - headR * 1.3], [headR * 0.8, headY - headR * 1.1], [headR * 1.02, headY - headR * 0.15], [headR * 0.6, headY - headR * 0.72], [-headR * 0.6, headY - headR * 0.72]], C.hair, 225, { layers: 2, jitter: h * 0.012, seed: seed + 41 });
      // 圆眼镜
      const gr = headR * 0.42;
      for (const side of [-1, 1]) {
        const gx = side * headR * 0.42;
        P.ellipseBlob(gx, headY - headR * 0.02, gr, gr * 0.92, '#cfe8f2', 120, { layers: 1, jitter: h * 0.005, seed: seed + 42 + (side < 0 ? 0 : 1), n: 16 });
        P.stroke(spiralPts(gx, headY - headR * 0.02, gr, 1, 20), { color: '#4a4258', weight: h * 0.011, brush: 'pen', seed: seed + 44 + (side < 0 ? 0 : 1), jitter: h * 0.004 });
        if (o.starGlare) {
          star(gx - gr * 0.3, headY - headR * 0.25, gr * 0.34, gr * 0.15, '#fff8e0', seed + 46 + (side < 0 ? 0 : 1));
          star(gx + gr * 0.35, headY + gr * 0.15, gr * 0.2, gr * 0.09, '#fff8e0', seed + 47 + (side < 0 ? 0 : 1));
        }
        // 点状眼
        P.dot(gx + (o.look ? o.look[0] * gr * 0.16 : 0), headY - headR * 0.02 + (o.look ? o.look[1] * gr * 0.16 : 0), gr * 0.13, C.pupil, 255, seed + 48 + (side < 0 ? 0 : 1));
      }
      P.stroke([[-headR * 0.05, headY - headR * 0.06], [headR * 0.05, headY - headR * 0.06]], { color: '#4a4258', weight: h * 0.009, brush: 'pen', seed: seed + 49, jitter: h * 0.003 });
      drawMouth(0, headY + headR * 0.52, headR * 0.72, o.mouth || 'flat', seed + 50);
    } else {
      // 背面:头发后脑 + 白大褂肩
      P.blob([[-headR * 1.05, headY + headR * 0.5], [-headR * 1.0, headY - headR * 0.9], [0, headY - headR * 1.3], [headR * 1.0, headY - headR * 0.9], [headR * 1.05, headY + headR * 0.5]], C.hair, 245, { layers: 2, jitter: h * 0.012, seed: seed + 60 });
      P.scribble(0, headY - headR * 0.35, headR * 1.0, headR * 0.75, 10, { color: '#543c30', weight: h * 0.011, brush: 'pen', seed: seed + 61 });
    }

    // 汗滴
    if (o.sweat) {
      const n = Math.min(3, Math.ceil(o.sweat * 3));
      for (let i = 0; i < n; i++) {
        const a = -1.9 + i * 0.5, d = headR * (1.35 + i * 0.3) + o.sweat * h * 0.12;
        const dx = cos(a) * d, dy = headY + sin(a) * d * 0.8;
        P.blob([[dx, dy - h * 0.022], [dx + h * 0.016, dy + h * 0.008], [dx, dy + h * 0.022], [dx - h * 0.016, dy + h * 0.008]], '#8fd4e8', 240, { layers: 2, jitter: h * 0.004, seed: seed + 70 + i, grow: 0.1 });
      }
    }
    pop();
  }

  // ============ 客串怪兽(分镜 2–9 / 谢幕) ============
  // 修格斯:深色黏液团 + 满身眼睛 + 触手;笑脸面具 maskK 0..1 逐步掀开
  function shoggoth(o) {
    const s = o.s || 1, seed = o.seed || 401, t = o.t || 0;
    push(); translate(o.x, o.y); if (o.rot) rotate(o.rot); scale(s);
    for (let i = 0; i < 9; i++) {
      const a = -PI * 0.92 + i * (PI * 1.84 / 8), L = 150 + T.h1(seed + i) * 120 + sin(t * 2 + i * 1.4) * 16;
      P.stroke([[0, 40], [cos(a) * L * 0.5, 40 + sin(a) * L * 0.55], [cos(a) * L, 40 + sin(a) * L]], {
        color: '#2d2440', weight: 26, brush: 'pen', seed: seed + i, jitter: 8, curvature: 0.6
      });
    }
    P.ellipseBlob(0, 20, 190, 165, '#3a2c52', 255, { layers: 3, jitter: 16, seed, n: 20 });
    for (let i = 0; i < 11; i++) {
      const a = T.h2(seed, i) * TWO_PI, d = 40 + T.h2(seed + 1, i) * 110;
      drawEye(cos(a) * d, 20 + sin(a) * d * 0.85, 16 + T.h2(seed + 2, i) * 9, 'open', [0, 0], seed + 10 + i, i % 2 === 0, 1);
    }
    const mk = o.maskK || 0;
    push(); translate(-mk * 250, -mk * 50); rotate(mk * 0.7);
    P.ellipseBlob(0, -20, 118, 118, '#f7efdd', 255, { layers: 2, jitter: 6, seed: seed + 30, n: 22 });
    P.dot(-38, -52, 13, '#2a2320', 255, seed + 31); P.dot(38, -52, 13, '#2a2320', 255, seed + 32);
    P.stroke([[-50, 6], [0, 50], [50, 6]], { color: '#2a2320', weight: 11, brush: 'pen', seed: seed + 33, jitter: 4, curvature: 0.7 });
    pop(); pop();
  }

  // 巴西利斯克:戴冠巨蛇(从舞台下破出)
  function basilisk(o) {
    const s = o.s || 1, seed = o.seed || 411;
    push(); translate(o.x, o.y); scale(s);
    const body = [[-320, 380], [-180, 260], [-60, 120], [20, -40], [60, -220], [40, -360]];
    P.stroke(body, { color: '#2f5d4a', weight: 120, brush: 'pen', seed, jitter: 10, curvature: 0.55 });
    P.stroke(body, { color: '#4e8a6a', weight: 52, brush: 'pen', seed: seed + 1, jitter: 8, curvature: 0.55 });
    const hx = 40, hy = -430;
    P.ellipseBlob(hx, hy, 122, 90, '#2f5d4a', 255, { layers: 2, jitter: 8, seed: seed + 2, n: 18 });
    drawEye(hx - 46, hy - 18, 24, 'red', [0.4, 0.2], seed + 3, false, 1);
    drawEye(hx + 46, hy - 18, 24, 'red', [0.4, 0.2], seed + 4, true, 1);
    P.blob([[hx - 72, hy + 28], [hx + 72, hy + 28], [hx, hy + 98]], '#7c2b2b', 255, { layers: 2, jitter: 5, seed: seed + 5 });
    for (let i = 0; i < 5; i++) {
      P.blob([[hx - 58 + i * 29, hy + 32], [hx - 44 + i * 29, hy + 32], [hx - 51 + i * 29, hy + 64]], '#fff', 255, { layers: 1, jitter: 2, seed: seed + 6 + i, grow: 0.1 });
    }
    const cw = 130, cy2 = hy - 110;
    const cpts = [[-cw / 2, cy2 + 30], [-cw / 2, cy2], [-cw * 0.28, cy2 + 16], [-cw * 0.08, cy2 - 18], [cw * 0.12, cy2 + 16], [cw * 0.34, cy2 - 4], [cw / 2, cy2 + 30]];
    P.blob(cpts.concat([[cw / 2, cy2 + 44], [-cw / 2, cy2 + 44]]), '#f0c14a', 255, { layers: 2, jitter: 5, seed: seed + 8 });
    P.outline(cpts.concat([[cw / 2, cy2 + 44], [-cw / 2, cy2 + 44]]), { color: '#8a5a1c', weight: 6, brush: 'pen', seed: seed + 9, jitter: 3 });
    pop();
  }

  // 龙猫(chinchilla):蓬松团子 + 颊囊塞 tokens
  function chinchilla(o) {
    const s = o.s || 1, seed = o.seed || 421, t = o.t || 0;
    push(); translate(o.x, o.y); if (o.rot) rotate(o.rot); scale(s);
    P.ellipseBlob(-140, 130, 80, 46, '#8d8098', 255, { layers: 2, jitter: 10, seed: seed + 4, n: 14 });   // 尾巴
    P.ellipseBlob(0, 40, 170, 150, '#9a8fae', 255, { layers: 3, jitter: 14, seed, n: 20 });
    P.ellipseBlob(0, 90, 120, 95, '#c3b8d2', 255, { layers: 2, jitter: 10, seed: seed + 1, n: 16 });   // 肚皮
    for (const side of [-1, 1]) {
      P.ellipseBlob(side * 92, -110, 42, 62, '#9a8fae', 255, { layers: 2, jitter: 8, seed: seed + 2 + (side > 0 ? 1 : 0), n: 14 });  // 耳
      P.ellipseBlob(side * 108, 44 + sin(t * 3 + side) * 5, 58, 52, '#b3a7c4', 255, { layers: 2, jitter: 8, seed: seed + 5 + (side > 0 ? 1 : 0), n: 14 }); // 颊囊
    }
    drawEye(-62, -20, 22, 'happy', [0, 0], seed + 7, false, 1);
    drawEye(62, -20, 22, 'happy', [0, 0], seed + 8, true, 1);
    P.dot(0, 18, 11, '#4a3a44', 255, seed + 9);
    // 塞进颊囊的 token 小方片
    for (let i = 0; i < 4; i++) {
      const a = t * 2 + i * 1.7, d = 150 + i * 34;
      P.blob(P.roundRectPts(140 + cos(a) * 30, -60 + sin(a) * d * 0.3 + i * 26, 34, 22, 0.3, 2), '#f0e2c8', 255, { layers: 1, jitter: 3, seed: seed + 10 + i });
    }
    pop();
  }

  // 猫耳(给 Clawd 戴上;在 clawd() 之后调用,同 x/y/h)
  function catEars(o) {
    const h = o.h, w = h * 1.6, seed = o.seed || 431;
    push(); translate(o.x, o.y); if (o.rot) rotate(o.rot);
    for (const side of [-1, 1]) {
      P.blob([[side * w * 0.3, -h * 0.5], [side * w * 0.58, -h * 0.86], [side * w * 0.56, -h * 0.36]], C.orange, 255, { layers: 2, jitter: h * 0.015, seed: seed + (side > 0 ? 1 : 0), grow: 0.2 });
    }
    pop();
  }

  return { clawd, researcher, drawEye, drawMouth, star, heart, spiralPts, shoggoth, basilisk, chinchilla, catEars, C };
})();
