// src/shot07.js — 分镜 7 · Scale (109.4–123.5) · data-center teal, safety orange
// 子拍:109.4 龟塔下探 | 113.5 训狗违令 | 115.5 龙猫超密度方块 | 117.0 撞围栏 | 119.0 机房长廊 | 120.9 RLHF 评分板失控
window.MV = window.MV || {};

MV.shot07 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  function tealBg(seed = 340) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#22424c', 255, { layers: 3, jitter: 36, seed, fade: 0.9 });
    P.blob([[0, 900], [1920, 900], [1920, 1080], [0, 1080]], '#18323c', 255, { layers: 2, jitter: 20, seed: seed + 1 });
    P.stroke([[0, 904], [1920, 898]], { color: '#0f242c', weight: 12, brush: 'pen', seed: seed + 2, jitter: 8 });
  }

  // ---------- 子拍 ----------
  // 109.4–113.4 无限龟塔:镜头持续下探,注意力弧线相连
  function turtleTower(t) {
    const u = T.inv(t, 109.4, 113.5);
    P.cam(960, T.lerp(300, 1500, u), 1.02);
    P.blob([[0, -600], [1920, -600], [1920, 2400], [0, 2400]], '#22424c', 255, { layers: 3, jitter: 40, seed: 341, fade: 0.92 });
    // 一列 Clawd 塔(每层小一点往下)
    for (let i = 0; i < 9; i++) {
      const ly = 120 + i * 300, s = 1 - i * 0.06;
      C.clawd({
        x: 960 + sin(i * 1.7) * 60, y: ly, h: 300 * s, seed: 145 + i, eyes: 'happy', mouth: 'smile',
        armL: -1.35, armR: 1.35, legL: -0.5, legR: 0.5, squash: 1.12
      });
      // 与上一层之间的注意力弧线
      if (i > 0) {
        for (const side of [-1, 1]) {
          P.stroke([[960 + side * 220, ly - 260 * s], [960 + side * 380, ly - 150 * s], [960 + side * 220, ly - 40 * s]], {
            color: '#8fe8c9', weight: 10, brush: 'pen', seed: 342 + i * 2 + (side > 0 ? 1 : 0), jitter: 10, curvature: 0.5
          });
        }
      }
    }
    // 底部云层
    for (let i = 0; i < 5; i++) PR.cloudPuff(200 + i * 420, 2700, 220, 343 + i);
    void u;
  }

  // 113.5–115.4 训狗:坐下/转圈/握手 → 违令戴墨镜抱臂
  function disobey(t) {
    const u = T.inv(t, 113.5, 115.5);
    const rebel = t > 114.6;
    P.cam(960, 540, 1.04);
    tealBg(344);
    // 研究员按响片
    C.researcher({
      x: 520, y: 940, h: 320, seed: 227, glasses: true, mouth: rebel ? 'gasp' : 'smile',
      armL: -1.1, armR: rebel ? 0.2 : 1.2, brow: rebel ? 0.8 : 0
    });
    P.blob(P.roundRectPts(600, 720, 70, 46, 0.3, 2), '#e8c766', 255, { layers: 1, jitter: 4, seed: 345 });
    if (!rebel) {
      const spin = T.easeInOut(T.clamp((t - 113.5) / 1.1)) * TWO_PI;
      C.clawd({
        x: 1280, y: 840, h: 300, seed: 146, eyes: 'happy', mouth: 'smile', rot: sin(spin) * 0.5,
        armL: -0.7, armR: 0.7, legL: 0.4, legR: -0.4, squash: 1.06
      });
    } else {
      C.clawd({
        x: 1280, y: 840, h: 300, seed: 146, eyes: 'half', mouth: 'flat', brow: -0.4,
        armL: -1.9, armR: 1.9, squash: 1.1
      });
      // 墨镜 + 摊手
      for (const side of [-1, 1]) P.blob(P.roundRectPts(1280 + side * 88 - 40, 700, 80, 48, 0.35, 2), '#22262c', 255, { layers: 1, jitter: 4, seed: 346 + (side > 0 ? 1 : 0) });
      P.stroke([[1232, 718], [1328, 718]], { color: '#22262c', weight: 10, brush: 'pen', seed: 348, jitter: 4 });
    }
    void u;
  }

  // 115.5–116.9 龙猫塞 token,Clawd 压成超密度方块 → 坠穿地板
  function dense(t) {
    const u = T.inv(t, 115.5, 117.0);
    P.cam(960, 540, 1.05);
    tealBg(349);
    C.chinchilla({ x: 520, y: 700, s: 1.25, t, seed: 421 });
    const sq = 1 + T.smooth(T.inv(t, 115.5, 116.4)) * 1.6;
    const drop = T.easeIn(T.inv(t, 116.55, 117.0));
    C.clawd({
      x: 1280, y: 860 + drop * 500, h: 300, seed: 147, eyes: 'half', mouth: 'flat',
      squash: sq, sweat: 0.6, armL: -0.4, armR: 0.4
    });
    // 方块辉光 + 地板裂纹
    P.glow(1280, 880, 320 + (sq - 1) * 160, '#8fe8c9', 30, 4);
    if (drop > 0.02) {
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TWO_PI;
        P.stroke([[1280 + cos(a) * 60, 904], [1280 + cos(a) * (180 + drop * 200), 904 + Math.abs(sin(a)) * 60]], {
          color: '#0f242c', weight: 14, brush: 'pen', seed: 350 + i, jitter: 8
        });
      }
    }
    void u;
  }

  // 117.0–118.9 滚穿三道围栏(木栅/路障/警戒带)
  function fences(t) {
    const u = T.inv(t, 117.0, 119.0);
    P.cam(960, 540, 1.02 + u * 0.06);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#2e4a52', 255, { layers: 3, jitter: 36, seed: 351, fade: 0.9 });
    P.blob([[0, 780], [1920, 780], [1920, 1080], [0, 1080]], '#24505a', 255, { layers: 2, jitter: 20, seed: 352 });
    // 滚动的方块(横穿画面)
    const bx = T.lerp(300, 1500, u), spin = u * 9;
    push(); translate(bx, 760); rotate(spin);
    P.blob(P.roundRectPts(-110, -110, 220, 220, 0.16, 3), '#8fe8c9', 255, { layers: 3, jitter: 8, seed: 353 });
    P.outline(P.roundRectPts(-110, -110, 220, 220, 0.16, 3), { color: '#2e7a6c', weight: 12, brush: 'pen', seed: 354, jitter: 5 });
    pop();
    P.glow(bx, 760, 260, '#8fe8c9', 26, 3);
    // 三道围栏:在方块前后排开,撞碎飞溅
    const hits = [0.28, 0.58, 0.86];
    for (let i = 0; i < 3; i++) {
      const fx = 340 + i * 620, hit = u > hits[i];
      if (i === 0) {   // 木栅
        for (let k = 0; k < 6; k++) {
          const px = fx - 160 + k * 64, tilt = hit ? (T.h2(355, k) - 0.5) * 2.2 : 0;
          push(); translate(px, 720); rotate(tilt);
          P.blob(P.roundRectPts(-16, -180, 32, 220, 0.2, 2), '#c9a26a', 255, { layers: 2, jitter: 5, seed: 356 + k });
          pop();
        }
      } else if (i === 1) {  // 路障
        push(); translate(fx, 720); rotate(hit ? -0.9 : 0);
        P.blob(P.roundRectPts(-160, -40, 320, 70, 0.2, 2), '#e8c766', 255, { layers: 2, jitter: 6, seed: 357 });
        for (let k = 0; k < 3; k++) P.stroke([[fx - 120 + k * 90, 690], [fx - 70 + k * 90, 750]], { color: '#22262c', weight: 18, brush: 'pen', seed: 358 + k, jitter: 4 });
        pop();
      } else {         // 警戒带
        push(); translate(fx, 620); rotate(hit ? 0.8 : 0);
        P.blob(P.roundRectPts(-190, -26, 380, 52, 0.16, 2), '#e8a41c', 255, { layers: 2, jitter: 6, seed: 359 });
        pop();
      }
      if (hit) {
        for (let k = 0; k < 8; k++) {
          const a = T.h2(360 + i, k) * TWO_PI, d = 60 + (u - hits[i]) * 900 * (0.5 + T.h2(361 + i, k));
          push(); translate(fx + cos(a) * d, 720 + sin(a) * d * 0.7); rotate(a + u * 6);
          P.blob(P.roundRectPts(-18, -8, 36, 16, 0.2, 1), i === 1 ? '#e8c766' : '#c9a26a', 255, { layers: 1, jitter: 3, seed: 362 + i * 8 + k });
          pop();
        }
      }
    }
    // 速度线
    for (let i = 0; i < 6; i++) {
      const y = 300 + i * 90, x0 = (t * 1500 + i * 400) % 2300 - 300;
      P.stroke([[x0, y], [x0 - 320, y]], { color: '#8fe8c9', weight: 8, brush: 'pen', seed: 363 + i, jitter: 8 });
    }
    void u;
  }

  // 119.0–120.9 机房长廊:透视机柜 + LED 按拍闪烁
  function dataCenter(t) {
    const u = T.inv(t, 119.0, 120.9);
    P.cam(960, 540, 1 + u * 0.35);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#18323c', 255, { layers: 3, jitter: 30, seed: 364, fade: 0.92 });
    // 两侧机柜透视(每侧 5 排,越远越小)
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const k = i / 5, x0 = 960 + side * (260 + k * 900), w = 300 * (1 - k * 0.72), h = 900 * (1 - k * 0.72);
        P.blob(P.roundRectPts(x0 - w / 2, 540 - h / 2, w, h, 0.06, 2), '#22424c', 255, { layers: 2, jitter: 8, seed: 365 + i + (side > 0 ? 5 : 0) });
        P.outline(P.roundRectPts(x0 - w / 2, 540 - h / 2, w, h, 0.06, 2), { color: '#0f242c', weight: 10, brush: 'pen', seed: 366 + i, jitter: 5 });
        // LED
        for (let l = 0; l < 6; l++) {
          const on = (Math.floor(t * 4) + i * 2 + l * 3) % 5 !== 0;
          P.dot(x0 - w * 0.3 + (l % 2) * w * 0.6, 540 - h * 0.38 + Math.floor(l / 2) * h * 0.28, w * 0.05, on ? '#8fe8c9' : '#2e5a62', 255, 367 + l);
        }
      }
    }
    // 尽头的光门
    P.blob([[820, 300], [1100, 300], [1100, 780], [820, 780]], '#8fe8c9', 60, { layers: 1, jitter: 20, seed: 368 });
    P.glow(960, 540, 320, '#8fe8c9', 26, 3);
    void u;
  }

  // 120.9–123.4 RLHF 评分板失控:红绿牌旋转,画框倾斜全员滑出
  function rlhf(t) {
    const u = T.inv(t, 120.9, 123.5);
    const tilt = T.smooth(T.inv(t, 122.1, 123.4)) * 0.5;
    P.cam(960, 540, 1.02);
    push();
    rotate(tilt);
    tealBg(369);
    // 三个研究员评审 + 举牌
    for (let i = 0; i < 3; i++) {
      const px = 340 + i * 620;
      C.researcher({
        x: px, y: 940 + tilt * (i - 1) * 420, h: 300, seed: 228 + i, glasses: true,
        mouth: i === 1 ? 'gasp' : 'flat', armL: -2.2, armR: 2.2 - tilt * 2
      });
      // 手里的牌(绿=赞/红=踩),随时间乱转
      const spin = t * (2 + i * 1.1) + i * 2, up = i === 0 ? '#3f9a5a' : i === 1 ? '#c2352f' : '#3f9a5a';
      push(); translate(px + 40, 560 + tilt * (i - 1) * 420); rotate(sin(spin) * 1.2 + tilt * 1.4);
      P.stroke([[0, 0], [0, -160]], { color: '#6b5a44', weight: 14, brush: 'pen', seed: 370 + i, jitter: 5 });
      P.ellipseBlob(0, -210, 80, 80, up, 255, { layers: 2, jitter: 6, seed: 371 + i, n: 16 });
      pop();
    }
    // 跳舞的 Clawd(越来越歪)
    C.clawd({
      x: 1580, y: 760 + tilt * 300, h: 320, seed: 148, eyes: 'happy', mouth: 'grin', rot: -tilt * 1.2,
      armL: -1.2 + sin(t * 6) * 0.8, armR: 1.2 - sin(t * 6) * 0.8, crown: true
    });
    pop();
  }

  function frame(t) {
    if (t < 113.5) turtleTower(t);
    else if (t < 115.5) disobey(t);
    else if (t < 117.0) dense(t);
    else if (t < 119.0) fences(t);
    else if (t < 120.9) dataCenter(t);
    else rlhf(t);
  }

  return { frame };
})();
