// src/shot00.js — 分镜 0 · Curtain up (0–1.5s)
// 画出来的红色幕布拉开,背景上手绘标题 "I'M UPPING MY P(DOOM)",Clawd 从活板门里冒出来挥手。
window.MV = window.MV || {};

MV.shot00 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  function frame(t) {
    // ---- 相机:缓慢推近 + 冒头一记轻震 ----
    const zoom = 1.0 + 0.055 * T.inv(t, 0, 1.5);
    const shake = T.hit(t, 0.667, 9) * 10 + T.hit(t, 1.121, 12) * 4;
    P.cam(960 + sin(t * 41) * shake, 540 + cos(t * 37) * shake * 0.7, zoom);

    // ---- 背景墙 ----
    P.blob([[0, 0], [1920, 0], [1920, 800], [0, 800]], '#e8c98e', 130, { layers: 3, jitter: 26, seed: 11, fade: 0.85 });
    P.blob([[0, 0], [1920, 0], [1920, 420], [0, 420]], '#d9a862', 70, { layers: 2, jitter: 30, seed: 12, fade: 0.8 });
    // 舞台拱门金边
    P.stroke([[60, 0], [120, 180], [180, 60]], { color: '#e8b44a', weight: 16, brush: 'pen', seed: 13, jitter: 8 });
    P.stroke([[1860, 0], [1800, 180], [1740, 60]], { color: '#e8b44a', weight: 16, brush: 'pen', seed: 14, jitter: 8 });

    // ---- 背景手绘标题(2D 烘焙纹理 → 贴进场景) ----
    P.textPainted("I'M UPPING MY", 960, 250, 132, { color: '#b23a2e', shadow: '#e8b44a', shadowOff: 7, seed: 21, jitter: 11, rot: 0.05 });
    P.textPainted("P(DOOM)", 960, 460, 210, { color: '#8e2620', shadow: '#e8b44a', shadowOff: 10, seed: 22, jitter: 13, rot: 0.045 });
    // 标题下的手绘波浪线
    P.stroke([[560, 540], [760, 556], [960, 540], [1160, 556], [1360, 540]], { color: '#b23a2e', weight: 11, brush: 'pen', seed: 23, jitter: 6 });
    for (const s of [[420, 150], [1500, 150], [300, 430], [1620, 430]]) {
      C.star(s[0], s[1], 34, 15, '#e8b44a', 30 + s[0]);
    }

    // ---- 舞台前墙上的门洞(活板门):Clawd 从这里升起 ----
    const HOLE = { x0: 700, x1: 1020, y0: 752, y1: 930 };
    P.blob([[HOLE.x0, HOLE.y0], [HOLE.x1, HOLE.y0], [HOLE.x1, HOLE.y1], [HOLE.x0, HOLE.y1]], '#241a12', 255, { layers: 2, jitter: 10, seed: 50 });
    // 翻开靠在墙上的门盖(画在 Clawd 之前,不挡他)
    const doorOpen = T.seg(t, 0.5, 0.82, T.easeOut);
    push();
    translate(HOLE.x0 + 4, HOLE.y0 + 8);
    rotate(-0.32 * doorOpen);
    const lidPts = P.roundRectPts(-92, -6, 86, HOLE.y1 - HOLE.y0 - 4, 0.2, 3);
    P.blob(lidPts, '#a8763e', 255, { layers: 2, jitter: 8, seed: 53 });
    P.outline(lidPts, { color: '#5c3413', weight: 8, brush: 'pen', seed: 54, jitter: 5 });
    pop();

    // ---- Clawd(下半身被门洞下沿遮住,看起来站在门洞里) ----
    const popK = T.seg(t, 0.52, 0.88, T.easeBack);
    const cy = T.lerp(1096, 664, popK);
    const squash = t < 0.72 ? 1.26 - 0.48 * popK : 1 + 0.18 * Math.exp(-(t - 0.72) * 7) * cos((t - 0.72) * 18);
    const wave = t > 0.88 ? -2.15 + sin((t - 0.88) * 9.2) * 0.42 : -0.45;
    C.clawd({
      x: 860, y: cy, h: 300, squash,
      eyes: t < 0.55 ? 'closed' : 'happy', mouth: t < 0.55 ? 'flat' : 'open',
      armL: -0.5 + sin(t * 2.2) * 0.12, armR: wave, legL: -0.12, legR: 0.12,
      brow: t > 0.88 ? -0.2 : 0, blush: 0.35, seed: 61
    });

    // ---- 舞台前墙(地板面):左右两块 + 门洞下沿,遮住 Clawd 下半身 ----
    const plank = (x0, y0, x1, y1, seed) => {
      P.blob([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], '#c98d4e', 220, { layers: 3, jitter: 16, seed, fade: 0.85 });
      for (let i = 0; y0 + 34 + i * 52 < y1; i++) {
        const y = y0 + 34 + i * 52;
        P.stroke([[x0, y + sin(i) * 8], [x1, y + cos(i * 2) * 10]], { color: '#8a5a2c', weight: 7, brush: 'pen', seed: seed + 10 + i, jitter: 7 });
      }
    };
    plank(0, 752, 700, 1080, 41);
    plank(1020, 752, 1920, 1080, 46);
    plank(700, 930, 1020, 1080, 48);
    P.blob([[0, 1008], [1920, 1008], [1920, 1080], [0, 1080]], '#7a4a22', 130, { layers: 2, jitter: 18, seed: 45, fade: 0.8 });
    // 门洞边框
    P.stroke([[700, 752], [700, 930]], { color: '#5c3413', weight: 12, brush: 'pen', seed: 52, jitter: 5 });
    P.stroke([[1020, 752], [1020, 930]], { color: '#5c3413', weight: 12, brush: 'pen', seed: 55, jitter: 5 });
    P.stroke([[700, 930], [1020, 930]], { color: '#5c3413', weight: 12, brush: 'pen', seed: 56, jitter: 5 });

    // 拉开时的金色纸屑
    for (let i = 0; i < 14; i++) {
      const k = T.h1(i * 3.7);
      const fx = 260 + k * 1400, fy = 120 + T.h1(i * 9.1) * 520 + t * 60;
      P.dot(fx, fy, 6 + T.h1(i * 5.5) * 9, i % 2 ? '#e8b44a' : '#f2d98c', 200, 90 + i);
    }

    // ---- 红幕布(拉开):帷幔全幅,侧幕滑向两边 ----
    const open = T.seg(t, 0.05, 1.18, T.easeInOut);
    PR.curtainPanel(-1, open, 71);
    PR.curtainPanel(1, open, 83);
    PR.curtainValance(77);
  }

  return { frame };
})();
