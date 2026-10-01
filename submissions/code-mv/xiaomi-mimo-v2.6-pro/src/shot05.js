// src/shot05.js — 分镜 5 · Obsolete (73–95.4) · parchment museum, ochre road
// 子拍:73.0 神经网舞团 | 77.5 博物馆真空管 | 81.4 卡丁车急左转 | 85.0 云保安全睡着 | 89.4 Gato 悬崖
window.MV = window.MV || {};

MV.shot05 = (function () {
  const T = MV.tl, P = MV.paint, C = MV.chars, PR = MV.props;

  function parchBg(seed = 220) {
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#d9c29a', 255, { layers: 3, jitter: 36, seed, fade: 0.9 });
    P.blob([[0, 880], [1920, 880], [1920, 1080], [0, 1080]], '#c2a878', 255, { layers: 2, jitter: 22, seed: seed + 1 });
    P.stroke([[0, 884], [1920, 878]], { color: '#8a7250', weight: 12, brush: 'pen', seed: seed + 2, jitter: 8 });
  }

  // ---------- 子拍 ----------
  // 73.0–77.4 神经网舞团:三层 Clawd 连墨线,脉冲前向/反向流动
  function netDance(t) {
    const u = T.inv(t, 73.0, 77.5);
    const fwd = Math.floor(t * 2.2) % 2 === 0;   // 每拍换流向
    const dir = fwd ? 1 : -1;
    P.cam(960, 540 + dir * 20, 1.02);
    parchBg(220);
    const layersX = [380, 960, 1540], rows = [3, 2, 3];
    const nodes = [];
    for (let l = 0; l < 3; l++) {
      nodes[l] = [];
      for (let r = 0; r < rows[l]; r++) {
        nodes[l].push([layersX[l] + dir * 26 * Math.sin(t * 4 + r), 330 + r * (rows[l] === 2 ? 380 : 260)]);
      }
    }
    // 连线
    for (let l = 0; l < 2; l++) for (const a of nodes[l]) for (const b of nodes[l + 1]) {
      P.stroke([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 30], b], { color: '#6b5a44', weight: 6, brush: 'pen', seed: 221 + l, jitter: 8, curvature: 0.4 });
    }
    // 流动脉冲
    for (let l = 0; l < 2; l++) for (let i = 0; i < nodes[l].length; i++) {
      const a = nodes[l][i], b = nodes[l + 1][i % nodes[l + 1].length];
      const ph = (t * 1.4 + i * 0.33 + l * 0.5) % 1;
      const k = fwd ? ph : 1 - ph;
      P.glow(T.lerp(a[0], b[0], k), T.lerp(a[1], b[1], k), 46, '#e8c766', 40, 2);
    }
    // Clawd 节点(踏步)
    for (let l = 0; l < 3; l++) for (let r = 0; r < rows[l]; r++) {
      const [nx, ny] = nodes[l][r];
      C.clawd({
        x: nx, y: ny, h: 220, seed: 230 + l * 5 + r, eyes: 'happy', mouth: 'smile',
        legL: dir * 0.4, legR: -dir * 0.4, armL: -0.9, armR: 0.9, squash: 1 + T.pulse(t) * 0.1
      });
    }
    // 研究员指挥
    C.researcher({
      x: 960, y: 1010, h: 300, seed: 220, glasses: true, mouth: 'ooh',
      armL: -1.2 + sin(t * 5) * 0.8, armR: 1.6 + sin(t * 5 + 1) * 0.5
    });
    void u;
  }

  // 77.5–81.0 博物馆:真空管古董 + 新款 Clawd 推入 + 盖布 + 蜘蛛
  function museum(t) {
    const u = T.inv(t, 77.5, 81.0);
    P.cam(960, 540, 1.05 - u * 0.04);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#b4a284', 255, { layers: 3, jitter: 36, seed: 222, fade: 0.9 });
    P.blob([[0, 900], [1920, 900], [1920, 1080], [0, 1080]], '#8a7250', 255, { layers: 2, jitter: 20, seed: 223 });
    // 古董真空管计算机
    const box = [[300, 260], [1060, 260], [1060, 900], [300, 900]];
    P.blob(box, '#7a6a52', 255, { layers: 3, jitter: 14, seed: 224 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
      const tx = 380 + c * 180, ty = 360 + r * 260;
      P.ellipseBlob(tx, ty, 56, 96, '#e8c766', 255, { layers: 2, jitter: 6, seed: 225 + r * 4 + c, n: 16 });
      P.ellipseBlob(tx, ty, 30, 62, '#f7efdd', 160, { layers: 1, jitter: 5, seed: 226 + r * 4 + c, n: 12 });
    }
    // 灭掉的火花
    if (u > 0.18) {
      for (let i = 0; i < 6; i++) P.dot(360 + T.h2(227, i) * 640, 320 + T.h2(228, i) * 480, 6, '#5c4b34', 200, 229 + i);
    }
    // 天鹅绒围栏
    for (const px of [180, 1220]) P.stroke([[px, 640], [px, 940]], { color: '#6b5a44', weight: 22, brush: 'pen', seed: 230, jitter: 5 });
    P.stroke([[180, 660], [700, 720], [1220, 660]], { color: '#8a2c48', weight: 26, brush: 'pen', seed: 231, jitter: 10, curvature: 0.5 });
    // 导览 Clawd 推新款(流线型小 Clawd 上推车)
    C.clawd({ x: 1500, y: 830, h: 260, seed: 131, eyes: 'happy', mouth: 'smile', armL: -1.3, armR: 0.5 });
    P.blob(P.roundRectPts(1320, 860, 340, 40, 0.3, 2), '#4a4258', 255, { layers: 2, jitter: 6, seed: 232 });
    C.clawd({ x: 1420, y: 800, h: 180, seed: 132, eyes: 'wide', mouth: 'smile', squash: 1.35, shadow: false });
    P.ellipseBlob(1340, 910, 30, 30, '#2e2a24', 255, { layers: 1, jitter: 4, seed: 233, n: 12 });
    P.ellipseBlob(1580, 910, 30, 30, '#2e2a24', 255, { layers: 1, jitter: 4, seed: 234, n: 12 });
    // 盖布(0.35 后抛下)
    const sheetK = T.smooth(T.inv(t, 79.6, 80.4));
    if (sheetK > 0) {
      P.blob([[280, 260 + sheetK * 40], [1080, 250 + sheetK * 30], [1120, 900], [260, 910]], '#f2ecdc', 255 * sheetK, { layers: 3, jitter: 22, seed: 235 });
      for (let i = 0; i < 4; i++) P.stroke([[320 + i * 220, 300], [330 + i * 220, 880]], { color: '#d8ceb8', weight: 12, brush: 'pen', seed: 236 + i, jitter: 10 });
    }
    // 蜘蛛坠下
    if (t > 80.2) {
      const d = (t - 80.2) * 420;
      P.stroke([[520, 0], [520, d]], { color: '#6b5a44', weight: 4, brush: 'pen', seed: 237, jitter: 3 });
      P.ellipseBlob(520, d + 20, 26, 22, '#2e2a24', 255, { layers: 1, jitter: 4, seed: 238, n: 12 });
      for (let i = 0; i < 4; i++) {
        P.stroke([[520, d + 20], [520 - 44 + i * 30, d + 46 + (i % 2) * 14]], { color: '#2e2a24', weight: 5, brush: 'pen', seed: 239 + i, jitter: 3 });
      }
    }
  }

  // 81.4–84.9 卡丁车急左转
  function goKart(t) {
    const u = T.inv(t, 81.4, 85.0);
    const whip = T.smooth(T.inv(t, 83.2, 84.2));    // 急转甩尾
    P.cam(960 + whip * 260, 540, 1.02 + whip * 0.12);
    push();
    if (whip > 0) rotate(-whip * 0.12);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#e2a367', 255, { layers: 3, jitter: 36, seed: 240, fade: 0.9 });
    // 蜿蜒赭色公路
    const road = [[-100, 820], [500, 700], [1000, 780], [1500, 620], [2020, 700]];
    P.stroke(road, { color: '#c98d4e', weight: 190, brush: 'pen', seed: 241, jitter: 20, curvature: 0.5 });
    P.stroke(road, { color: '#8a7250', weight: 8, brush: 'pen', seed: 242, jitter: 26, curvature: 0.5 });
    // 路牌:发夹弯
    P.stroke([[1420, 260], [1420, 620]], { color: '#6b5a44', weight: 18, brush: 'pen', seed: 243, jitter: 5 });
    P.blob(P.roundRectPts(1300, 180, 260, 180, 0.12, 2), '#f0e2c8', 255, { layers: 2, jitter: 8, seed: 244 });
    P.stroke([[1360, 320], [1420, 240], [1500, 300], [1420, 360]], { color: '#c2352f', weight: 16, brush: 'pen', seed: 245, jitter: 6, curvature: 0.5 });
    // 卡丁车
    const kx = 760 - whip * 120, ky = 720;
    push(); translate(kx, ky); rotate(-0.16 - whip * 0.5);
    P.blob(P.roundRectPts(-220, -60, 440, 130, 0.3, 3), '#c2352f', 255, { layers: 2, jitter: 10, seed: 246 });
    P.ellipseBlob(-150, 90, 60, 60, '#2e2a24', 255, { layers: 2, jitter: 5, seed: 247, n: 14 });
    P.ellipseBlob(150, 90, 60, 60, '#2e2a24', 255, { layers: 2, jitter: 5, seed: 248, n: 14 });
    pop();
    C.clawd({
      x: kx - 40, y: ky - 180, h: 280, seed: 133, eyes: 'wide', mouth: 'grin',
      armL: -1.2 - whip * 0.6, armR: 0.9 - whip * 0.8, rot: -0.1
    });
    // 研究员被甩飞(后段直立落地发懵)
    const flyK = T.smooth(T.inv(t, 83.6, 84.6));
    C.researcher({
      x: T.lerp(kx + 220, 1420, flyK), y: T.lerp(ky - 40, 980, flyK) - sin(flyK * PI) * 300,
      h: 300, seed: 221, glasses: true, mouth: 'gasp', sweat: 1,
      rot: T.lerp(0.9, 0, flyK) + sin(t * 7) * (1 - flyK) * 0.2, armL: -2.1, armR: 2.1
    });
    if (flyK > 0.85) {
      for (let i = 0; i < 3; i++) C.star(1340 + i * 80, 640 + sin(t * 4 + i) * 16, 22, 9, '#e8c766', 249 + i);
    }
    // 尘土 + 刹车痕
    for (let i = 0; i < 5; i++) PR.cloudPuff(kx - 300 - i * 130, ky + 80 + (i % 2) * 40, 60 + i * 18, 250 + i, '#e8c766');
    P.stroke([[kx - 200, ky + 110], [kx + 400, ky + 130]], { color: '#6b5a44', weight: 18, brush: 'pen', seed: 251, jitter: 12 });
    pop();
  }

  // 85.0–88.0 云保安全睡着,卡丁车在下面画甜甜圈
  function cloudGuards(t) {
    const u = T.inv(t, 85.0, 89.4);
    P.cam(960, 540, 1.02);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#a8c8e0', 255, { layers: 3, jitter: 36, seed: 252, fade: 0.9 });
    P.blob([[0, 860], [1920, 860], [1920, 1080], [0, 1080]], '#c98d4e', 255, { layers: 2, jitter: 20, seed: 253 });
    // 睡觉的云保安 ×4(帽 + 闭眼 + 垂下的探照灯 + zzz)
    for (let i = 0; i < 4; i++) {
      const cx = 240 + i * 500, cy = 220 + (i % 2) * 180;
      PR.cloudPuff(cx, cy, 190, 254 + i);
      // 大檐帽
      P.blob([[cx - 130, cy - 110], [cx + 130, cy - 110], [cx + 70, cy - 180], [cx - 70, cy - 180]], '#4a5e82', 255, { layers: 2, jitter: 8, seed: 255 + i, grow: 0.2 });
      P.stroke([[cx - 150, cy - 108], [cx + 150, cy - 106]], { color: '#2e3a56', weight: 16, brush: 'pen', seed: 256 + i, jitter: 5 });
      // 闭眼弧线
      for (const side of [-1, 1]) {
        P.stroke([[cx + side * 60 - 26, cy - 10], [cx + side * 60, cy + 8], [cx + side * 60 + 26, cy - 10]], { color: '#2e2a24', weight: 8, brush: 'pen', seed: 257 + i + (side > 0 ? 8 : 0), jitter: 3, curvature: 0.7 });
      }
      // 垂下的探照灯光
      P.blob([[cx + 120, cy + 60], [cx + 300, cy + 320], [cx + 180, cy + 340], [cx + 90, cy + 90]], '#f2e3b8', 90, { layers: 1, jitter: 14, seed: 258 + i });
      // zzz
      for (let z = 0; z < 3; z++) {
        const zx = cx + 90 + z * 52, zy = cy - 210 - z * 58 - sin(t * 2 + z) * 10;
        P.stroke([[zx - 22, zy - 20], [zx + 22, zy - 20], [zx - 22, zy + 20], [zx + 22, zy + 20]], { color: '#4a5e82', weight: 10, brush: 'pen', seed: 259 + i * 3 + z, jitter: 3, spline: false });
      }
    }
    // 一个翻身的云
    const roll = sin(t * 1.6) * 0.22;
    push(); translate(1720, 620); rotate(roll);
    PR.cloudPuff(0, 0, 130, 268);
    pop();
    // 卡丁车画甜甜圈 + 喇叭
    const a = t * 3.2;
    const kx = 760 + cos(a) * 260, ky = 960 + sin(a) * 90;
    P.outline(C.spiralPts(760, 960, 300, 2.4, 30), { color: '#8a7250', weight: 8, brush: 'pen', seed: 260, jitter: 4 });
    push(); translate(kx, ky); rotate(a + HALF_PI);
    P.blob(P.roundRectPts(-130, -40, 260, 80, 0.3, 3), '#c2352f', 255, { layers: 2, jitter: 8, seed: 261 });
    C.clawd({ x: -20, y: -130, h: 170, seed: 134, eyes: 'happy', mouth: 'grin', armL: -1.1, armR: 0.9, shadow: false });
    pop();
    for (let i = 0; i < 3; i++) {
      const r = 90 + i * 70 + ((t * 300) % 70);
      P.outline([[kx - r, ky - 180 - i * 40], [kx, ky - 230 - i * 40], [kx + r, ky - 180 - i * 40]], { color: '#4a5e82', weight: 10, brush: 'pen', seed: 262 + i, jitter: 8, curvature: 0.5 });
    }
    void u;
  }

  // 89.4–95.0 Gato 悬崖:激光点逗弄,每拍松手,最后一拍扑空坠落
  function gatoCliff(t) {
    const u = T.inv(t, 89.4, 95.4);
    const drop = T.easeIn(T.inv(t, 94.6, 95.4));     // 最后一拍松手
    P.cam(960, T.lerp(540, 640, drop), 1.02 + drop * 0.1);
    P.blob([[0, 0], [1920, 0], [1920, 1080], [0, 1080]], '#2e2450', 255, { layers: 3, jitter: 36, seed: 263, fade: 0.9 });
    // 发光深渊
    P.blob([[0, 700], [1920, 700], [1920, 1080], [0, 1080]], '#1c1430', 255, { layers: 2, jitter: 20, seed: 264 });
    P.glow(960, 1080, 700, '#e8622f', 30, 4);
    // 悬崖
    P.blob([[0, 200], [700, 220], [760, 700], [0, 720]], '#4a3a5c', 255, { layers: 3, jitter: 18, seed: 265 });
    // Gato-Clawd(猫耳)趴在崖边
    C.clawd({
      x: 520, y: 420, h: 300, seed: 135, eyes: 'half', mouth: 'flat', brow: 0.5,
      armL: -0.2, armR: 1.45 + drop * 0.5, rot: -0.24, squash: 1.15
    });
    C.catEars({ x: 520, y: 420, h: 300, rot: -0.24, seed: 431 });
    // 悬垂的研究员(抓手腕,每拍下滑一点)
    const slip = Math.floor(T.clamp((t - 89.4) / 0.4545)) * 14;
    const ry = 640 + slip + drop * 900;
    C.researcher({
      x: 740, y: ry, h: 300, seed: 222, glasses: true, mouth: 'gasp', sweat: 1,
      armL: -2.8, armR: -2.2 + drop * 1.2, rot: drop * 0.5
    });
    if (drop > 0.1) {
      // 坠落速度线
      for (let i = 0; i < 8; i++) {
        P.stroke([[700 + T.h2(266, i) * 220, ry - 300 + T.h2(267, i) * 200], [700 + T.h2(266, i) * 220, ry - 80 + T.h2(267, i) * 200]], {
          color: '#8a6acc', weight: 10, brush: 'pen', seed: 268 + i, jitter: 8
        });
      }
    }
    // 激光点(Gato 视线跟着,松手)
    const lk = (t * 0.7) % 1;
    const lx = 980 + Math.sin(t * 1.7) * 420, ly = 300 + Math.sin(t * 2.3) * 160;
    P.glow(lx, ly, 80, '#ff5a3c', 44, 3);
    P.dot(lx, ly, 16, '#ff5a3c', 255, 269);
    // 扑击(最后一拍爪子前伸)
    if (drop > 0.05 && drop < 0.6) {
      P.stroke([[660, 460], [860, 520], [920, 560]], { color: '#f7efdd', weight: 22, brush: 'pen', seed: 270, jitter: 8 });
    }
    void lk; void u;
  }

  function frame(t) {
    if (t < 77.5) netDance(t);
    else if (t < 81.4) museum(t);
    else if (t < 85.0) goKart(t);
    else if (t < 89.4) cloudGuards(t);
    else gatoCliff(t);
  }

  return { frame };
})();
