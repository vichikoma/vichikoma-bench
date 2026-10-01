// scenes_a.js — Ch0 curtain (0–1.5) + Ch1 the lab (1.5–23)
'use strict';
/* global scene,P,C,TAU,INK,RNG,washShape,washBlob,strokePts,strokePath,ellipsePts,rrectPts,wobCirclePts,
   camBegin,camEnd,brushWipe,flashOver,irisHole,sfxWord,bgWash,hop,squash,beatPhase,seg,lerp,clamp,smooth,
   drawClawd,drawResearcher,drawStar,drawHeart,drawSweat,drawEmote,pulse,loudAt */

// shared stage helpers -------------------------------------------------------
const STAGE = { floor: 830 }; // stage floor line y
function stageBg(rng, wallA, wallB, floorCol) {
  // wall
  const pts = [[-40, -40], [W + 40, -40], [W + 40, STAGE.floor], [-40, STAGE.floor]];
  washShape(pts, wallA, 0.9, rng);
  washShape([[ -40, 300], [W + 40, 260], [W + 40, STAGE.floor], [-40, STAGE.floor]], wallB, 0.35, rng);
  // floor
  washShape([[-40, STAGE.floor - 10], [W + 40, STAGE.floor - 20], [W + 40, H + 40], [-40, H + 40]], floorCol, 0.92, rng);
  strokePath([[-40, STAGE.floor], [W + 40, STAGE.floor - 10]], withA(C.ink, 0.5), 4, 'marker', false);
  // floor boards
  for (let i = 1; i < 7; i++) {
    const x = i * W / 7 + Math.sin(i * 5) * 20;
    strokePath([[x, STAGE.floor + 8], [x + 60, H]], withA(C.ink, 0.14), 3, 'marker', false);
  }
}
function stageCurtains(rng, openFrac, col = '#a02232', colD = '#6d1522') {
  // top valance
  for (const x0 of [0, W]) {
    const wSide = (W * 0.5) * openFrac;
    const pts = [];
    if (x0 === 0) {
      for (let i = 0; i <= 10; i++) pts.push([lerp(-30, wSide - 90, i / 10) + Math.sin(i * 2.2) * 26, -30 + i * 0]);
      for (let i = 10; i >= 0; i--) pts.push([lerp(-30, wSide - 60, i / 10) + Math.sin(i * 2.2) * 30, 250 + Math.sin(i * 1.4) * 40]);
    } else {
      for (let i = 0; i <= 10; i++) pts.push([lerp(W + 30, W - wSide + 90, i / 10) + Math.sin(i * 2.2) * 26, -30]);
      for (let i = 10; i >= 0; i--) pts.push([lerp(W + 30, W - wSide + 60, i / 10) + Math.sin(i * 2.2) * 30, 250 + Math.sin(i * 1.4) * 40]);
    }
    washShape(pts, col, 0.97, rng);
    // folds
    for (let i = 0; i < 5; i++) {
      const fx = x0 === 0 ? lerp(20, wSide - 80, i / 4) : lerp(W - 20, W - wSide + 80, i / 4);
      strokePath([[fx, -20], [fx + (x0 === 0 ? 24 : -24), 240]], withA(colD, 0.5), 8, 'marker', false);
    }
  }
  // valance across top
  const vpts = [[-30, -30], [W + 30, -30], [W + 30, 90]];
  for (let i = 14; i >= 0; i--) vpts.push([lerp(W + 30, -30, i / 14), 130 + Math.sin(i * 1.1) * 26]);
  washShape(vpts, colD, 0.97, rng);
  for (let i = 0; i < 8; i++) {
    const fx = i * W / 7;
    strokePath([[fx, 40], [fx + 14, 120]], withA('#3f0b13', 0.4), 7, 'marker', false);
  }
}
function paintedTitle(txt, cx, cy, size, col, rot = 0) {
  const spr = textSprite(txt, size, col, { font: 'Comic Sans MS', outline: 'rgba(0,0,0,0)' });
  // shadow pass + main pass for painted depth
  drawSprite(textSprite(txt, size, 'rgba(0,0,0,0.25)', { font: 'Comic Sans MS' }), cx + 6, cy + 8, { rot });
  drawSprite(spr, cx, cy, { rot });
}
// P(doom) meter: painted thermometer + pump
function drawMeter(x, y, h, val, rng, o = {}) {
  // y = ground of meter; val 0..100
  P.push(); P.translate(x, y);
  // stand post
  washShape(rrectPts(-14, -h * 0.55, 28, h * 0.55, 8, 12, rng, 0.04), '#8a6b48', 0.95, rng);
  // thermometer: tube + bulb
  const tw = 54, th = h * 0.62, tx = 0, ty = -h * 0.58 - th;
  washShape(rrectPts(tx - tw / 2, ty, tw, th + 26, 22, 12, rng, 0.03), '#f6efe0', 0.97, rng);
  strokePts(rrectPts(tx - tw / 2, ty, tw, th + 26, 22, 12, rng, 0.03), withA(C.ink, 0.7), 3.5, 'marker');
  // red fill from bulb
  const frac = clamp(val / 100, 0, 1);
  const fillH = (th - 20) * frac;
  if (fillH > 2) {
    const fpts = rrectPts(tx - tw / 2 + 10, ty + th - fillH, tw - 20, fillH + 8, 16, 10, rng, 0.02);
    washShape(fpts, C.red, 0.92, rng);
  }
  P.push(); P.noStroke(); P.fill(C.red);
  P.ellipse(tx, ty + th + 6, 40, 40); P.pop();
  strokePts(ellipsePts(tx, ty + th + 6, 20, 20, 12), withA(C.ink, 0.7), 3.5, 'marker');
  // ticks
  strokePath([[tx + tw / 2 + 6, ty + 14], [tx + tw / 2 + 20, ty + 14]], withA(C.ink, 0.6), 3, 'marker', false);
  strokePath([[tx + tw / 2 + 6, ty + th / 2], [tx + tw / 2 + 26, ty + th / 2]], withA(C.ink, 0.6), 3, 'marker', false);
  strokePath([[tx + tw / 2 + 6, ty + th - 12], [tx + tw / 2 + 20, ty + th - 12]], withA(C.ink, 0.6), 3, 'marker', false);
  // value number painted on a little plate
  P.push(); P.noStroke(); P.fill('#f6efe0');
  P.rect(tx - 44, ty + th * 0.42 - 20, 88, 40, 8);
  P.pop();
  const vspr = textSprite(val.toFixed(0) + '%', 30, C.ink, { font: 'Trebuchet MS' });
  drawSprite(vspr, tx, ty + th * 0.42);
  strokePts([[tx - 44, ty + th * 0.42 - 20], [tx + 44, ty + th * 0.42 - 20], [tx + 44, ty + th * 0.42 + 20], [tx - 44, ty + th * 0.42 + 20]], withA(C.ink, 0.6), 3, 'marker');
  if (o.crack) {
    strokePath([[tx - 8, ty + 10], [tx + 4, ty + 40], [tx - 10, ty + 66], [tx + 8, ty + 96]], '#ffffff', 4, 'pen', false);
  }
  P.pop();
}
function drawPump(x, y, h, t, rng, o = {}) {
  // bicycle pump, handle bobs; y = ground
  P.push(); P.translate(x, y);
  const ph = (o.phase || 0);
  const handleY = -h * (0.62 + 0.18 * Math.sin(ph));
  washShape(rrectPts(-16, -h * 0.5, 32, h * 0.5, 8, 10, rng, 0.03), C.steel, 0.95, rng);
  strokePts(rrectPts(-16, -h * 0.5, 32, h * 0.5, 8, 10, rng, 0.03), withA(C.ink, 0.6), 3, 'marker');
  strokePath([[0, -h * 0.5], [0, handleY]], C.steelD, 10, 'marker', false);
  strokePath([[-h * 0.16, handleY], [h * 0.16, handleY]], C.red, 12, 'marker', false);
  strokePath([[-h * 0.16, handleY], [h * 0.16, handleY]], withA(C.ink, 0.3), 3, 'marker', false);
  // hose
  strokePath([[14, -h * 0.42], [h * 0.5, -h * 0.75], [h * 0.9, -h * 0.6]], '#3a3a42', 6, 'marker', false);
  strokePath([[-14, -h * 0.42], [-h * 0.5, -h * 0.75], [-h * 0.9, -h * 0.6]], '#3a3a42', 6, 'marker', false);
  P.pop();
}

// ============ CH0: curtain up (0–1.5) ============
scene('curtain', 0, 1.5, (t, rng) => {
  const open = 0.12 + 0.88 * smooth(0, 1, seg(t, 0, 1.35));
  // backdrop
  washShape([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], '#8c1f2d', 0.95, rng);
  washShape([[-40, 400], [W + 40, 360], [W + 40, H + 40], [-40, H + 40]], '#5f1420', 0.5, rng);
  paintedTitle("I'M UPPING MY P(DOOM)", W / 2, 330, 92, C.gold);
  // floor
  washShape([[-40, STAGE.floor - 10], [W + 40, STAGE.floor - 20], [W + 40, H + 40], [-40, H + 40]], '#7a1a26', 0.95, rng);
  stageCurtains(rng, open);
  // Clawd pops up through trapdoor
  const pop = easeOutBack(seg(t, 0.55, 1.15));
  if (pop > 0.01) {
    const y = STAGE.floor + 40 - pop * 150;
    // trapdoor
    P.push(); P.noStroke(); P.fill(withA('#3f0b13', 0.9)); P.ellipse(W / 2, STAGE.floor + 30, 260 * pop, 50 * pop); P.pop();
    drawClawd(W / 2, y + 150 * (1 - pop) * 0 + 150 - 150 * pop + 0, 130, {
      rng, hop: 0, eyes: 'happy', mouth: 'grin', armAng: -1.9 + Math.sin(t * 14) * 0.3, armAng2: Math.PI + 1.9 - Math.sin(t * 14) * 0.3, noBlink: true,
    });
    // hide legs below floor with floor-colored cover
    P.push(); P.noStroke(); P.fill('#7a1a26'); P.rect(W / 2 - 140, STAGE.floor + 24, 280, 200); P.pop();
    P.push(); P.noFill(); P.stroke(withA(C.ink, .5)); P.strokeWeight(4); P.ellipse(W / 2, STAGE.floor + 24, 280, 48); P.pop();
  }
});

// ============ CH1: the lab (1.5–23) ============
function labBg(rng, t, o = {}) {
  // night indigo wall, lamp ochre pool
  washShape([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], '#252347', 0.96, rng);
  washShape([[-40, 520], [W + 40, 470], [W + 40, H + 40], [-40, H + 40]], '#1a1836', 0.5, rng);
  // floor
  washShape([[-40, 860], [W + 40, 830], [W + 40, H + 40], [-40, H + 40]], '#3a3157', 0.95, rng);
  strokePath([[-40, 855], [W + 40, 826]], withA('#15132b', 0.7), 4, 'marker', false);
  // lamp glow (if lamp on)
  if (!o.noLamp) {
    const lx = 300, ly = 210;
    P.push(); P.noStroke();
    for (let i = 3; i >= 1; i--) { P.fill(withA('#e8b73a', 0.05 * i)); P.ellipse(lx, ly + 160, 480 * i * 0.5 + 200, 380 * i * 0.5 + 160); }
    P.pop();
    // hanging lamp
    strokePath([[lx, 0], [lx, 120]], '#15132b', 5, 'marker', false);
    washShape([[lx - 70, 190], [lx + 70, 190], [lx + 40, 120], [lx - 40, 120]], '#b5893a', 0.95, rng);
    strokePts([[lx - 70, 190], [lx + 70, 190], [lx + 40, 120], [lx - 40, 120]], withA(C.ink, 0.6), 3, 'marker');
    P.push(); P.noStroke(); P.fill(withA('#ffe9a8', 0.85)); P.ellipse(lx, ly + 160, 120, 90); P.pop();
  }
  // shelves with books/mugs silhouette
  strokePath([[1330, 320], [1740, 320]], '#15132b', 8, 'marker', false);
  for (let i = 0; i < 6; i++) {
    const bx = 1360 + i * 62, bh = 60 + (i % 3) * 18;
    washShape(rrectPts(bx, 320 - bh, 34, bh, 4, 10, rng, 0.05), i % 2 ? '#4a4472' : '#5d5690', 0.9, rng);
  }
}
function drawMonitor(x, y, w, h, rng, screenFn) {
  // chunky monitor; screenFn draws inside screen rect
  washShape(rrectPts(x, y, w, h, 26, 22, rng, 0.02), '#d8d2c2', 0.97, rng);
  strokePts(rrectPts(x, y, w, h, 26, 22, rng, 0.02), withA('#6b6353', 0.8), 4, 'marker');
  // stand
  washShape(rrectPts(x + w * 0.38, y + h, w * 0.24, h * 0.16, 6, 10, rng, 0.03), '#b8b2a2', 0.95, rng);
  washShape(rrectPts(x + w * 0.28, y + h * 1.14, w * 0.44, 16, 6, 8, rng, 0.03), '#b8b2a2', 0.95, rng);
  // screen (teal glow)
  const sx = x + w * 0.07, sy = y + h * 0.08, sw = w * 0.86, sh = h * 0.76;
  P.push(); P.noStroke(); P.fill('#0f3a3f'); P.rect(sx, sy, sw, sh, 10); P.pop();
  screenFn(sx, sy, sw, sh, rng);
  // scanlines
  P.push(); P.noStroke();
  for (let i = 0; i < 10; i++) { P.fill(withA('#ffffff', 0.03)); P.rect(sx, sy + sh * i / 10, sw, 2); }
  P.pop();
  strokePts([[sx, sy], [sx + sw, sy], [sx + sw, sy + sh], [sx, sy + sh]], withA('#0c2a2e', 0.8), 3, 'marker');
  // little power led
  P.push(); P.noStroke(); P.fill(withA('#7fe08f', 0.9)); P.ellipse(x + w - 26, y + h - 16, 8, 8); P.pop();
}

// 1.5–3.6 sparks of AGI: over researcher's shoulder, tiny Clawd asleep → eyes open
scene('lab1', 1.5, 3.6, (t, rng) => {
  camBegin(1 + 0.06 * seg(t, 1.5, 3.6), W * 0.42, H * 0.5);
  labBg(rng, t);
  // desk
  washShape(rrectPts(560, 640, 900, 30, 8, 20, rng, 0.02), '#6b5236', 0.95, rng);
  washShape(rrectPts(600, 668, 26, 190, 6, 10, rng, 0.03), '#5a442c', 0.95, rng);
  washShape(rrectPts(1390, 668, 26, 190, 6, 10, rng, 0.03), '#5a442c', 0.95, rng);
  // monitor with sleeping Clawd
  const asleep = t < 2.6;
  const woke = seg(t, 2.6, 2.9);
  drawMonitor(680, 330, 620, 420, rng, (sx, sy, sw, sh) => {
    // loss line quiet
    strokePath([[sx + 40, sy + sh - 60], [sx + sw - 40, sy + sh - 66]], withA('#7fd8c8', 0.4), 3, 'pen', false);
    P.push();
    drawClawd(sx + sw / 2, sy + sh * 0.82, 120, {
      rng, t, eyes: asleep ? 'closed' : (woke > 0.5 ? 'wide' : 'open'), mouth: asleep ? 'flat' : 'o',
      armAng: -0.4, armAng2: Math.PI + 0.4, hop: 0, noBlink: true, bodyCol: withA('#f28f2e', 0.9),
    });
    P.pop();
    if (!asleep && woke > 0.3) { // sparkle above head
      drawStar(sx + sw / 2 + 70, sy + sh * 0.28, 14 * woke, C.gold);
    }
    // zzz while asleep
    if (asleep) drawEmote(sx + sw * 0.72, sy + sh * 0.3, 'zzz', 16);
  });
  // researcher from behind (back + hair), left side
  P.push();
  P.translate(430, 880);
  const bob = Math.sin(t * 1.8) * 3;
  P.translate(0, bob);
  washShape(rrectPts(-90, -330, 180, 260, 40, 20, rng, 0.04), '#f2ead4', 0.95, rng); // coat back
  strokePts(rrectPts(-90, -330, 180, 260, 40, 20, rng, 0.04), withA('#8a7a5c', 0.7), 4, 'marker');
  // head back
  const hp = ellipsePts(0, -380, 58, 60, 14, 0, 0.05, rng);
  washShape(hp, '#f0cfa4', 0.96, rng);
  strokePts(hp, withA('#9c6b3d', 0.8), 3.5, 'marker');
  // scribbly hair
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1 + i / 8);
    const hx = Math.cos(a) * 52, hy = -380 + Math.sin(a) * 54;
    strokePath([[hx, hy], [hx + (rng() * 2 - 1) * 16, hy - 14 - rng() * 12]], '#4c3a28', 4.5, 'pen', false);
  }
  P.pop();
  // glasses glint
  P.push(); P.noStroke(); P.fill(withA('#ffffff', 0.0)); P.pop();
  camEnd();
  brushWipe(0, '#000', '#000');
});

// 3.6–5.9 push into face, star eyes, sparks burst
scene('lab2', 3.6, 5.9, (t, rng) => {
  const u = seg(t, 3.6, 5.9);
  const zoom = 1.1 + u * 1.6;
  camBegin(zoom, W / 2, H * 0.45);
  labBg(rng, t, { noLamp: false });
  // screen fills view as we zoom
  const sh = 700, sw = 980;
  P.push(); P.noStroke(); P.fill('#0f3a3f'); P.rect(W / 2 - sw / 2 + 60, 120, sw, sh, 24); P.pop();
  strokePts(rrectPts(W / 2 - sw / 2 + 60, 120, sw, sh, 24, 26, rng, 0.02), withA('#0c2a2e', 0.8), 5, 'marker');
  // Clawd face big, eyes → stars, sparks
  const starU = smooth(3.9, 4.5, t);
  const burst = smooth(4.5, 5.2, t);
  const hoppy = hop(t) * 12;
  P.push();
  P.translate(W / 2 + 60, 120 + sh * 0.78 - hoppy);
  P.scale(1.6);
  drawClawd(0, 0, 150, { rng, t, eyes: starU > 0.5 ? 'star' : 'open', mouth: starU > 0.5 ? 'open' : 'smile', hop: hoppy, armAng: -2.2 - starU, armAng2: Math.PI + 2.2 + starU, noBlink: false });
  P.pop();
  // fireworks burst out of screen
  if (burst > 0) {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU + 0.3;
      const dd = (seg(t, 4.4, 5.9)) * 900 + (i % 3) * 60;
      const fx = W / 2 + 60 + Math.cos(a) * dd, fy = 120 + sh * 0.4 + Math.sin(a) * dd * 0.8;
      const col = [C.gold, C.clawd, '#7fd8c8', C.pink][i % 4];
      P.push(); P.noStroke(); P.fill(withA(col, 0.85)); P.ellipse(fx, fy, 10 + (i % 3) * 6, 10 + (i % 3) * 6); P.pop();
      strokePath([[fx - 12, fy], [fx + 12, fy]], withA(col, 0.3), 3, 'pen', false);
    }
  }
  // stars reflected in researcher's glasses (bottom-left corner, back of head)
  P.push();
  P.translate(-80, H - 160);
  P.scale(2.4);
  P.push(); P.noStroke(); P.fill(withA('#f0cfa4', 0.95)); P.ellipse(60, -40, 50, 52); P.pop();
  P.push(); P.noFill(); P.stroke(withA('#3a3a42', 0.85)); P.strokeWeight(4);
  P.ellipse(40, -45, 34, 34); P.ellipse(80, -45, 34, 34); P.pop();
  drawStar(40, -45, 8, C.gold); drawStar(80, -45, 8, C.gold);
  for (let i = 0; i < 5; i++) strokePath([[20 + i * 16, -80], [24 + i * 16, -96]], '#4c3a28', 4, 'pen', false);
  P.pop();
  camEnd();
});

// 6.0–7.9 circuits crawl out; researcher scoots back
scene('lab3', 6.0, 8.0, (t, rng) => {
  camBegin(1.0 + 0.05 * Math.sin(t * 0.9), W / 2, H / 2, Math.sin(t * 2.1) * 0.006);
  labBg(rng, t);
  // monitor
  drawMonitor(640, 300, 660, 430, rng, (sx, sy, sw, sh) => {
    P.push();
    drawClawd(sx + sw / 2, sy + sh * 0.85, 120, { rng, t, eyes: 'happy', mouth: 'flat', armAng: -0.5, armAng2: Math.PI + 0.5, noBlink: true });
    P.pop();
  });
  // circuit vines crawling out across walls
  const grow = seg(t, 6.0, 7.6);
  const paths = [
    [[740, 470], [620, 560], [440, 540], [300, 640], [180, 620]],
    [[1260, 470], [1400, 560], [1560, 520], [1700, 640], [1800, 600]],
    [[820, 720], [760, 800], [600, 820]],
    [[1140, 720], [1220, 800], [1400, 830]],
  ];
  for (const path of paths) {
    const n = Math.max(2, Math.floor(path.length * grow));
    const pts = path.slice(0, n);
    strokePath(pts, '#3aa88f', 7, 'marker', false);
    // nodes
    for (let i = 1; i < pts.length; i += 2) {
      P.push(); P.noStroke(); P.fill(withA('#7fd8c8', 0.8)); P.ellipse(pts[i][0], pts[i][1], 10, 10); P.pop();
      strokePath([[pts[i][0], pts[i][1]], [pts[i][0] + 26, pts[i][1] + 14]], withA('#3aa88f', 0.7), 4, 'marker', false);
    }
  }
  // researcher scooting back on rolling chair, sweat
  const scoot = seg(t, 6.2, 7.8) * 130;
  const px = 420 + scoot;
  P.push();
  P.translate(px, 880);
  // rolling chair
  washShape(rrectPts(-110, -150, 220, 60, 18, 20, rng, 0.03), '#5d5690', 0.95, rng);
  washShape(rrectPts(-130, -260, 50, 130, 14, 14, rng, 0.05), '#5d5690', 0.95, rng);
  strokePath([[-90, -90], [-90, -20]], '#3a3a42', 8, 'marker', false);
  strokePath([[90, -90], [90, -20]], '#3a3a42', 8, 'marker', false);
  P.push(); P.noStroke(); P.fill('#22222c');
  P.ellipse(-90, -12, 26, 26); P.ellipse(90, -12, 26, 26); P.pop();
  P.push();
  P.translate(0, -160);
  drawResearcher(0, 100, 220, { rng, t, sweat: true, sweat2: grow > 0.5, mouth: 'panic', armAng: -1.6 + Math.sin(t * 12) * 0.2, armAng2: Math.PI + 1.6, flip: 1 });
  P.pop();
  P.pop();
  camEnd();
});

// 8.0–8.95 shrug + wink; loss chart pops up
scene('lab4', 8.0, 9.0, (t, rng) => {
  camBegin(1, W / 2, H * 0.45, Math.sin(t * 9) * 0.004);
  labBg(rng, t);
  const u = seg(t, 8.0, 8.95);
  drawMonitor(560, 240, 760, 500, rng, (sx, sy, sw, sh) => {
    P.push();
    P.translate(sx + sw / 2, sy + sh * 0.8);
    P.scale(1.15 + u * 0.12);
    const shrug = Math.sin(u * Math.PI);
    drawClawd(0, 0, 140, {
      rng, t, eyes: u > 0.55 ? 'wink' : 'open', mouth: 'smile', noBlink: true,
      armAng: -0.5 - shrug * 2.6, armAng2: Math.PI + 0.5 + shrug * 2.6, hop: Math.sin(u * Math.PI) * 10,
    });
    P.pop();
  });
  camEnd();
});

// 9.0–12.4 loss curve sled
scene('lab5', 9.0, 12.4, (t, rng) => {
  const u = seg(t, 9.0, 12.4);
  // camera rides the drop
  const drop = smooth(10.2, 12.0, t);
  camBegin(1 + drop * 0.25, W / 2, H / 2, drop * 0.18 + Math.sin(t * 3) * 0.01);
  // screen-world: big dark teal backdrop
  washShape([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], '#0f3a3f', 0.97, rng);
  // grid
  for (let i = 0; i < 8; i++) strokePath([[i * W / 7, 0], [i * W / 7, H]], withA('#7fd8c8', 0.08), 3, 'marker', false);
  for (let i = 0; i < 5; i++) strokePath([[0, i * H / 4], [W, i * H / 4]], withA('#7fd8c8', 0.08), 3, 'marker', false);
  // loss curve: high plateau then cliff plunge
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const x = -100 + i * (W + 200) / 40;
    let y;
    const xx = x - u * 500; // curve slides left as we "ride"
    if (xx < 500) y = 200 + Math.sin(xx * 0.004) * 30;
    else if (xx < 800) y = lerp(200, 900, smooth(500, 800, xx));
    else y = 900 + Math.sin(xx * 0.01) * 20;
    pts.push([x, y]);
  }
  strokePath(pts, C.gold, 9, 'marker', false);
  strokePath(pts, withA('#fff3c8', 0.4), 4, 'pen', false);
  // clawd sleds on curve: position at curve point near screen center-left
  const cx = W * 0.42;
  let ci = 0; let best = 1e9;
  for (let i = 0; i < pts.length; i++) if (Math.abs(pts[i][0] - cx) < best) { best = Math.abs(pts[i][0] - cx); ci = i; }
  const cy = pts[ci][1];
  const slope = Math.atan2(pts[Math.min(ci + 2, 40)][1] - pts[ci][1], 80);
  P.push();
  P.translate(cx, cy - 30);
  P.rotate(slope * 0.6);
  drawClawd(0, 0, 130, {
    rng, t, eyes: drop > 0.5 ? 'wide' : 'happy', mouth: drop > 0.5 ? 'open' : 'grin',
    armAng: -2.8, armAng2: Math.PI + 2.8, hop: 0, noBlink: false, sweat: drop > 0.3,
  });
  P.pop();
  // speed lines when plunging
  if (drop > 0.2) {
    for (let i = 0; i < 8; i++) {
      const lx = 200 + i * 200 + (i % 2) * 60;
      strokePath([[lx, -50], [lx + 30, H + 50]], withA('#ffffff', 0.18 * drop), 5, 'marker', false);
    }
  }
  // paint splash at the bottom
  if (drop > 0.85) {
    const sv = seg(t, 11.9, 12.4);
    for (let i = 0; i < 12; i++) {
      const bx = 200 + i * 140 + (i % 3) * 50, by = 950 - (i % 4) * 40;
      P.push(); P.noStroke(); P.fill(withA(C.teal, 0.5)); P.ellipse(bx, by + (1 - sv) * 300, 40 + (i % 3) * 20, 24 + (i % 2) * 12); P.pop();
    }
  }
  camEnd();
});

// 13.0–16.5 villain chair spin, servant researcher, mug pile
scene('lab6', 13.0, 16.5, (t, rng) => {
  camBegin(1 + 0.04 * Math.sin(t), W / 2, H * 0.5);
  labBg(rng, t);
  // Clawd on office chair, spinning to reveal crown; lid creaks open at the end
  const spin = t < 14.6 ? (1 - seg(t, 13.2, 14.6)) * Math.PI * 2 : 0;
  const lid = smooth(16.0, 16.5, t);
  const cx = 1050, cy = 890;
  // chair
  washShape(rrectPts(cx - 150, cy - 60, 300, 70, 22, 20, rng, 0.03), '#5d5690', 0.95, rng);
  washShape(rrectPts(cx - 170, cy - 190, 60, 150, 16, 14, rng, 0.05), '#5d5690', 0.95, rng);
  strokePath([[cx, cy + 10], [cx, cy + 60]], '#3a3a42', 10, 'marker', false);
  strokePath([[cx - 70, cy + 80], [cx + 70, cy + 80]], '#3a3a42', 10, 'marker', false);
  for (const wx of [-70, 70]) { P.push(); P.noStroke(); P.fill('#22222c'); P.ellipse(cx + wx, cy + 88, 26, 26); P.pop(); }
  P.push();
  P.translate(cx, cy - 70);
  P.rotate(Math.sin(spin) * 0.35); // playful wobble instead of full spin (face must stay visible)
  drawClawd(0, 0, 170, {
    rng, t, crown: true, eyes: 'happy', mouth: 'grin', armAng: -1.2, armAng2: Math.PI + 1.2,
    lidOpen: lid, hop: hop(t) * 6, noBlink: false,
  });
  P.pop();
  // researcher rushes in with mugs, fans Clawd
  const rush = Math.sin(t * 10);
  const rx = 480 + rush * 30, ry = 900;
  P.push();
  P.translate(rx, ry);
  P.scale(-1, 1); // face right toward Clawd
  drawResearcher(0, 0, 240, { rng, t, bowtie: true, armAng: -1.9 - rush * 0.4, armAng2: Math.PI + 1.9, legSwing: Math.sin(t * 10) * 1.2, mouth: 'panic', sweat: true });
  // mug in hand
  washShape(rrectPts(-260, -180, 40, 34, 6, 8, rng, 0.05), '#d8d2c2', 0.95, rng);
  P.pop();
  // mug pyramid grows on the beat
  const mugs = Math.min(9, 3 + Math.floor((t - 13) / BEATLEN_GLOBAL));
  for (let i = 0; i < mugs; i++) {
    const row = Math.floor((mugs - 1 - i) / 3);
    const mx = 720 + (i % 3) * 56 + row * 26, my = 880 - row * 44;
    P.push(); P.translate(mx, my); P.rotate((i % 2 ? 1 : -1) * 0.06);
    washShape(rrectPts(-22, -30, 44, 34, 6, 8, rng, 0.05), '#d8d2c2', 0.95, rng);
    strokePts(rrectPts(-22, -30, 44, 34, 6, 8, rng, 0.05), withA('#6b6353', 0.7), 3, 'marker');
    P.pop();
    // steam
    strokePath([[mx, my - 40], [mx + 6, my - 58], [mx - 4, my - 74]], withA('#ffffff', 0.4), 3, 'pen', false);
  }
  camEnd();
});
const BEATLEN_GLOBAL = 60 / 132;

// 17.9–22.5 chase: lunchbox chomp + scooby doors; CHOMP to black
scene('lab7', 17.9, 23.0, (t, rng) => {
  // camera: slight run-bounce, whip between doors
  const u = seg(t, 17.9, 22.5);
  camBegin(1, W / 2, H / 2, Math.sin(t * 9) * 0.008);
  // hallway: perspective doors
  washShape([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], '#2b2850', 0.97, rng);
  washShape([[-40, 820], [W + 40, 790], [W + 40, H + 40], [-40, H + 40]], '#41396a', 0.95, rng);
  strokePath([[-40, 815], [W + 40, 785]], withA('#15132b', 0.7), 4, 'marker', false);
  // three doors along hall
  const doorGaps = [340, 980, 1620];
  const doors = doorGaps.map((dx, i) => {
    // pop in/out on beat: scale up when "active"
    const k = beatK(t);
    const active = (k % 3) === i;
    const s = 1 + (active ? Math.max(0, 0.25 - beatPhase(t)) * 3 : 0);
    return { dx, s, i };
  });
  for (const d of doors) {
    const dw = 300 * d.s, dh = 520 * d.s, dy = 300 - (d.s - 1) * 200;
    washShape(rrectPts(d.dx - dw / 2, dy, dw, dh, 14, 24, rng, 0.03), '#7a5a38', 0.95, rng);
    strokePts(rrectPts(d.dx - dw / 2, dy, dw, dh, 14, 24, rng, 0.03), withA(C.ink, 0.7), 4, 'marker');
    P.push(); P.noStroke(); P.fill(withA(C.gold, 0.9)); P.ellipse(d.dx + dw * 0.32, dy + dh * 0.5, 14, 14); P.pop();
    // little window
    P.push(); P.noStroke(); P.fill(withA('#ffd98f', 0.25)); P.rect(d.dx - dw * 0.18, dy + 40 * d.s, dw * 0.36, 80 * d.s, 8); P.pop();
  }
  // who is where: alternate — researcher runs left, clawd chomps from right, bigger each beat
  const cyc = (t - 17.9) / BEATLEN_GLOBAL;
  const grow = 1 + cyc * 0.22;
  const baseY = 850;
  // clawd chasing with lid open
  const chompCycle = (t * 2.2) % 1;
  const lid = 0.3 + 0.7 * Math.abs(Math.sin(t * 5));
  P.push();
  P.translate(1500 - (t - 17.9) * 60 % 300, baseY - hop(t) * 26);
  drawClawd(0, 0, 190 * grow, { rng, t, lidOpen: lid, eyes: 'wide', mouth: 'grin', armAng: -2.4 + Math.sin(t * 10) * 0.3, armAng2: Math.PI + 2.4, hop: hop(t) * 10 });
  P.pop();
  // researcher running for his life
  P.push();
  P.translate(500 - (t - 17.9) * 40 % 200 + Math.sin(t * 9) * 20, baseY - hop(t) * 20);
  P.scale(1, 1);
  drawResearcher(0, 0, 230, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.2 + Math.sin(t * 11) * 0.5, armAng2: Math.PI + 2.2, legSwing: 1.5 });
  P.pop();
  // dust puffs behind runner
  for (let i = 0; i < 3; i++) {
    const dxx = 560 + i * 70 + Math.sin(t * 9 + i) * 20;
    P.push(); P.noStroke(); P.fill(withA('#b9b3c9', 0.4 - i * 0.1)); P.ellipse(dxx, baseY - 10 - i * 8, 30 + i * 10, 18 + i * 6); P.pop();
  }
  camEnd();
  // CHOMP: clawd mouth closes over camera → black (22.5–23.0)
  const chomp = seg(t, 22.4, 22.85);
  if (chomp > 0) {
    // giant open mouth closing: two jagged jaws from top/bottom
    P.push();
    P.push(); P.translate(-W / 2, -H / 2);
    P.noStroke(); P.fill('#f28f2e');
    P.beginShape();
    P.vertex(-10, -10); P.vertex(W + 10, -10); P.vertex(W + 10, H / 2 - 40 + chomp * 0);
    for (let i = 14; i >= 0; i--) {
      const x = i / 14 * W;
      P.vertex(x, H * 0.5 - 60 + chomp * H * 0.5 + Math.abs(Math.sin(i * 1.9)) * 70);
    }
    P.endShape(P.CLOSE);
    // bottom jaw
    P.beginShape();
    P.vertex(-10, H + 10); P.vertex(W + 10, H + 10); P.vertex(W + 10, H * 0.5 + 60 - chomp * 0);
    for (let i = 14; i >= 0; i--) {
      const x = i / 14 * W;
      P.vertex(x, H * 0.5 + 60 - chomp * H * 0.5 - Math.abs(Math.sin(i * 1.9 + 0.7)) * 70);
    }
    P.endShape(P.CLOSE);
    P.pop();
    if (chomp > 0.96) flashOver('#0c0709', 1);
  }
});
