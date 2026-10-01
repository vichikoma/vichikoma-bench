// scenes_c.js — Ch4 Chorus2: bigger show (59–73) + Ch5 obsolete (73–95.4)
'use strict';
/* global scene,P,C,TAU,RNG,washShape,washBlob,strokePts,strokePath,ellipsePts,rrectPts,wobCirclePts,
   camBegin,camEnd,brushWipe,flashOver,irisHole,sfxWord,fillShape,textSprite,drawSprite,
   drawClawd,drawResearcher,drawShoggoth,drawBasilisk,drawChinchilla,drawStar,drawHeart,drawSweat,drawEmote,drawMeter,drawPump,
   stageBg,stageCurtains,paintedTitle,STAGE,hop,squash,beatPhase,beatK,BEATLEN,seg,win,lerp,clamp,smooth,
   easeOutBack,easeInOut,pulse,hitEnv,withA,confetti */

// arena stage with pyro jets
function arenaBg(rng, t, o = {}) {
  stageBg(rng, o.wall || '#8a4a5a', o.wall2 || '#a85a68', o.floor || '#6a3a48');
  for (let i = 0; i < 12; i++) {
    P.push(); P.translate(W / 2, 260); P.rotate(i / 12 * TAU + (o.raySpin || 0));
    fillShape([[0, 0], [1500, -70], [1500, 70]], withA(o.ray || '#f2c14e', 0.12), 1);
    P.pop();
  }
  // pyro jets at stage edge
  for (const jx of [180, 1740]) {
    P.push(); P.translate(jx, STAGE.floor);
    const f = pulse(t + (jx === 180 ? 0 : 0.23)) * (o.pyro ?? 1);
    if (f > 0.05) {
      P.push(); P.noStroke();
      P.fill(withA('#ffb23e', 0.8)); P.ellipse(0, -60 - f * 130, 60 + f * 40, 160 + f * 260);
      P.fill(withA('#ffe9a8', 0.9)); P.ellipse(0, -40 - f * 90, 30 + f * 20, 90 + f * 140);
      P.pop();
    }
    P.pop();
  }
}

// ============ CH4: Chorus 2 (59–73) ============
// 59.0–60.4 arena, building Clawd two pumps, 34%→
scene('cho2a', 59.0, 60.5, (t, rng) => {
  camBegin(1, W / 2, H / 2);
  arenaBg(rng, t, { pyro: 1 });
  const v = 34 + 8 * seg(t, 59.4, 60.4);
  drawMeter(300, STAGE.floor, 420, v, rng, {});
  drawPump(520, STAGE.floor, 260, t, rng, { phase: t * 8 });
  drawPump(760, STAGE.floor, 260, t, rng, { phase: t * 8 + Math.PI });
  // building-sized Clawd = big in frame
  P.push();
  P.translate(1150, STAGE.floor - 10);
  P.scale(1.9);
  drawClawd(0, 0, 260, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.5 + Math.sin(t * 8) * 0.5, armAng2: Math.PI + 2.5, hop: hop(t, 2) * 8 });
  P.pop();
  P.push(); P.translate(430, STAGE.floor - 2);
  drawResearcher(0, 0, 200, { rng, t, mouth: 'o', armAng: -1.2 + hop(t, 2) * 0.7, armAng2: Math.PI + 1.2 });
  P.pop();
  camEnd();
});

// 60.5–62.4 basilisk boom
scene('cho2b', 60.5, 63.0, (t, rng) => {
  const hit = hitEnv(t, [[60.5, 1.5]]);
  camBegin(1, W / 2, H / 2 + hit * 24, Math.sin(t * 44) * 0.012 * hit);
  arenaBg(rng, t, { pyro: 0.6 });
  // basilisk bursts through the floor on the beat
  const rise = easeOutBack(seg(t, 60.5, 61.3));
  // planks flying
  if (rise < 1) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.4;
      const dd = rise * 500 + 60;
      P.push(); P.translate(W / 2 + Math.cos(a) * dd, STAGE.floor + Math.sin(a) * dd * 0.5);
      P.rotate(a * 2 + rise * 6);
      fillShape([[-56, -12], [56, -12], [56, 12], [-56, 12]], '#8a6b48', 0.95);
      P.pop();
    }
  }
  P.push();
  P.translate(W / 2, STAGE.floor + 60 - rise * 480);
  drawBasilisk(0, 0, 80, { rng, t });
  P.pop();
  // everyone falls over
  P.push(); P.translate(300, STAGE.floor + 30); P.rotate(-1.2);
  drawResearcher(0, 0, 200, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.9, armAng2: Math.PI + 2.9 });
  P.pop();
  P.push(); P.translate(1700, STAGE.floor + 30); P.rotate(1.1);
  drawClawd(0, 0, 190, { rng, t, eyes: 'wide', mouth: 'o', armAng: -2.8, armAng2: Math.PI + 2.8 });
  P.pop();
  // researcher frantically throwing GPUs as offerings
  if (t > 61.4) {
    for (let i = 0; i < 3; i++) {
      const ph = ((t - 61.4) * 2.2 + i * 0.33) % 1;
      if (ph < 0.8) {
        const gx = 430 + ph * 260, gy = 800 - Math.sin(ph * Math.PI) * 380;
        P.push(); P.translate(gx, gy); P.rotate(ph * 7);
        fillShape(rrectPts(-24, -16, 48, 32, 5, 10, rng, 0.04), '#3a8a6a', 0.95);
        strokePts(rrectPts(-24, -16, 48, 32, 5, 10, rng, 0.04), withA(C.ink, 0.5), 2.5, 'pen');
        P.pop();
      }
    }
    sfxWord('BOOM', W / 2, 200, 130, C.gold, -0.05, rng, C.ink);
  }
  camEnd();
});

// 63.0–64.4 NVDA to the moon
scene('cho2c', 63.0, 64.5, (t, rng) => {
  const u = seg(t, 63.0, 64.4);
  camBegin(1 - u * 0.25, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#2b3a6a', 1);
  for (let i = 0; i < 24; i++) {
    const sx = (hash32(i, 5) % 1920), sy = (hash32(i, 9) % 800);
    P.push(); P.noStroke(); P.fill(withA('#f6efe0', 0.8)); P.ellipse(sx, sy, 4, 4); P.pop();
  }
  // green stock line rocketing off its chart
  P.push();
  const chartPts = [];
  for (let i = 0; i <= 14; i++) {
    const cxx = 100 + i * 90, cyy = 800 - Math.pow(i / 14, 2.2) * 500 - u * 200;
    chartPts.push([cxx, cyy]);
  }
  strokePath(chartPts, '#5ad88a', 10, 'marker', false);
  strokePath(chartPts, withA('#b8ffd8', 0.5), 4, 'pen', false);
  // Clawd rides the line up and plants a flag on the moon
  const ride = easeInOut(u);
  const rx = lerp(W * 0.35, W * 0.62, ride), ry = lerp(H * 0.75, 210, ride);
  P.push(); P.translate(rx, ry); P.rotate(-0.5);
  drawClawd(0, 0, 130, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.7, armAng2: Math.PI + 2.7 });
  // flag
  strokePath([[40, -40], [40, -120]], '#8a6b48', 7, 'marker', false);
  fillShape([[40, -120], [130, -100], [40, -80]], C.red, 0.95);
  P.pop();
  // moon
  const mx = W * 0.62, my = 200;
  P.push(); P.noStroke(); P.fill('#e8e2d2'); P.ellipse(mx, my, 260, 260); P.pop();
  P.push(); P.noFill(); P.stroke(withA('#b8b2a2', 0.6)); P.strokeWeight(4);
  P.ellipse(mx - 40, my - 30, 60, 60); P.ellipse(mx + 50, my + 40, 40, 40); P.ellipse(mx + 20, my - 70, 26, 26);
  P.pop();
  P.pop();
  camEnd();
});

// 64.5–65.9 Omega point
scene('cho2d', 64.5, 66.0, (t, rng) => {
  const u = seg(t, 64.5, 65.9);
  camBegin(1, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#1c1430', 1);
  // galaxies spiral inward and converge into one blinding point
  const conv = 1 - easeIn(u);
  for (let g = 0; g < 7; g++) {
    const baseA = g / 7 * TAU + t * 0.5;
    const dd = (500 + (g % 3) * 200) * conv;
    const gx = W / 2 + Math.cos(baseA) * dd, gy = H / 2 + Math.sin(baseA) * dd * 0.7;
    P.push(); P.translate(gx, gy); P.rotate(baseA + t);
    for (let arm = 0; arm < 2; arm++) {
      P.rotate(arm * Math.PI);
      const pts = [];
      for (let i = 0; i < 14; i++) {
        const a = i * 0.4, r = 8 + i * 9 * conv * 0.7 + 8;
        pts.push([Math.cos(a) * r, Math.sin(a) * r * 0.5]);
      }
      strokePath(pts, withA(['#c9a2e8', '#8ad8c8', '#f2c14e'][g % 3], 0.7), 3, 'pen', false);
      for (let i = 0; i < 6; i++) {
        const a2 = i * 1.1, r2 = 14 + i * 16 * conv * 0.7 + 10;
        P.push(); P.noStroke(); P.fill(withA('#f6efe0', 0.8)); P.ellipse(Math.cos(a2) * r2, Math.sin(a2) * r2 * 0.5, 4, 4); P.pop();
      }
    }
    P.pop();
  }
  // the point
  const pr = 30 + u * 120 + pulse(t) * 30;
  P.push(); P.noStroke();
  P.fill(withA('#fff6d8', 0.9)); P.ellipse(W / 2, H / 2, pr * 2, pr * 2);
  P.fill(withA('#ffffff', 0.8)); P.ellipse(W / 2, H / 2, pr, pr);
  P.pop();
  // Clawd floats with arms wide
  P.push();
  P.translate(W / 2, H / 2 + 260);
  P.scale(1.4);
  drawClawd(0, 0, 150, { rng, t, eyes: 'happy', mouth: 'open', armAng: -1.57 - 0.4, armAng2: Math.PI + 1.57 + 0.4, halo: true, noBlink: true });
  P.pop();
  camEnd();
});

// 66.0–68.5 planet GPU, odometer overflow
scene('cho2e', 66.0, 68.5, (t, rng) => {
  const u = seg(t, 66.0, 68.5);
  camBegin(1, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#1c1430', 1);
  for (let i = 0; i < 20; i++) {
    P.push(); P.noStroke(); P.fill(withA('#f6efe0', 0.7)); P.ellipse((hash32(i, 3) % 1920), (hash32(i, 11) % 1080), 4, 4); P.pop();
  }
  // planet-sized GPU with galaxy-shaped fans
  P.push(); P.translate(W / 2, H / 2);
  fillShape(ellipsePts(0, 0, 380, 300, 24, 0, 0.02, rng), '#2e3a4a', 0.97);
  strokePts(ellipsePts(0, 0, 380, 300, 24, 0, 0.02, rng), withA('#8898b8', 0.7), 6, 'pen');
  // galaxy fans
  for (const [fx, fy, fr] of [[-160, -40, 130], [170, -40, 130]]) {
    P.push(); P.translate(fx, fy);
    P.rotate(t * 1.5);
    strokePath([[0, 0], [fr * 0.8, 20], [fr * 0.3, 60]], withA('#c9a2e8', 0.8), 7, 'marker', false);
    strokePath([[0, 0], [-fr * 0.7, 40], [-fr * 0.3, -50]], withA('#8ad8c8', 0.7), 7, 'marker', false);
    strokePath([[0, 0], [10, -fr * 0.8], [60, -fr * 0.3]], withA('#f2c14e', 0.7), 7, 'marker', false);
    P.push(); P.noStroke(); P.fill('#f6efe0'); P.ellipse(0, 0, 24, 24); P.pop();
    P.pop();
  }
  // odometer window
  fillShape(rrectPts(-180, 120, 360, 100, 12, 30, rng, 0.02), '#101418', 0.97);
  strokePts(rrectPts(-180, 120, 360, 100, 12, 30, rng, 0.02), withA('#8898b8', 0.7), 4, 'pen');
  const digits = Math.floor((t - 66) * 40);
  const dstr = String(999900000000 + digits);
  drawSprite(textSprite(dstr.slice(-9), 56, '#8affc8', { font: 'Consolas' }), 0, 170);
  // zeros overflow like gumballs after 67.4
  const over = seg(t, 67.4, 68.5);
  if (over > 0) {
    for (let i = 0; i < 10; i++) {
      const ph = (t * 1.1 + i * 0.1) % 1;
      const gx = -150 + i * 34 + Math.sin(i * 9) * 20;
      const gy = 180 + ph * ph * 500;
      P.push(); P.translate(gx, gy); P.rotate(t * 4 + i);
      P.noFill(); P.stroke(withA('#8affc8', 0.9)); P.strokeWeight(7);
      P.ellipse(0, 0, 26, 26);
      P.pop();
    }
  }
  P.pop();
  // meter dings at 61%
  drawMeter(1620, 980, 400, 61, rng, {});
  if (u > 0.9) sfxWord('DING', 1560, 480, 60, C.gold, 0.1, rng, C.ink);
  camEnd();
});

// 70.0–72.9 vault with no back wall
scene('cho2f', 70.0, 73.0, (t, rng) => {
  const u = seg(t, 70.0, 72.9);
  // orbit: front view → around the back
  const orbit = smooth(70.8, 72.2, t);
  camBegin(1, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#4c545f', 1);
  fillShape([[0, 700], [W, 670], [W, H], [0, H]], '#3a4048', 0.9);
  const vx = W / 2, vy = 560;
  // glowing monster behind the door
  P.push(); P.translate(vx + 20, vy + 40);
  P.rotate(Math.sin(t * 2) * 0.05);
  washBlob(0, -40, 130, withA('#8aff9a', 0.5), 0.6, rng, { stroke: false });
  P.push(); P.noStroke(); P.fill('#2c4a2c');
  P.ellipse(-40, -60, 26, 34); P.ellipse(40, -60, 26, 34); P.pop();
  strokePath([[-120, 40], [-60, -10], [0, 30], [60, -10], [120, 40]], withA('#8aff9a', 0.7), 10, 'marker', false);
  P.pop();
  // vault door (front view) or revealed backless vault (orbit)
  if (orbit < 0.5) {
    P.push(); P.translate(vx, vy);
    fillShape(ellipsePts(0, 0, 240, 260, 22, 0, 0.02, rng), '#7e8794', 0.97);
    strokePts(ellipsePts(0, 0, 240, 260, 22, 0, 0.02, rng), withA(C.ink, 0.7), 6, 'pen');
    P.push(); P.noStroke(); P.fill('#5c636e'); P.ellipse(0, 0, 90, 90); P.pop();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + t * (u < 0.3 ? 0 : 1.2);
      strokePath([[Math.cos(a) * 46, Math.sin(a) * 46], [Math.cos(a) * 190, Math.sin(a) * 190]], withA('#3a4048', 0.8), 12, 'marker', false);
    }
    P.pop();
    // hard-hat Clawds shoving + dial + high-five
    for (const [hx, flip] of [[vx - 330, 1], [vx + 340, -1]]) {
      P.push(); P.translate(hx + (1 - orbit) * flip * 30, vy + 180);
      P.scale(flip, 1);
      drawClawd(0, 0, 150, { rng, t, hardhat: true, eyes: 'happy', mouth: 'grin', armAng: -2.2, armAng2: Math.PI + 2.2, hop: hop(t, 2) * 10 });
      P.pop();
    }
  } else {
    // camera around back: no back wall, monster waves
    P.push(); P.translate(vx, vy);
    // door frame from behind (ring)
    P.noFill(); P.stroke('#5c636e'); P.strokeWeight(40);
    P.ellipse(0, 0, 480, 520);
    P.stroke('#3a4048'); P.strokeWeight(10);
    P.ellipse(0, 0, 480, 520);
    P.pop();
    // monster waving tentacle
    P.push(); P.translate(vx + 20, vy + 60);
    strokePath([[0, 60], [40, -20], [120 + Math.sin(t * 6) * 30, -120]], withA('#8aff9a', 0.8), 16, 'marker', false);
    P.pop();
    for (const hx of [vx - 330, vx + 340]) {
      P.push(); P.translate(hx, vy + 180);
      drawClawd(0, 0, 150, { rng, t, hardhat: true, eyes: 'closed', mouth: 'grin', armAng: -1.57, armAng2: Math.PI + 1.57 });
      P.pop();
    }
    if (u > 0.85) sfxWord('!', vx + 300, vy - 260, 80, '#8aff9a', 0, rng, C.ink);
  }
  camEnd();
  brushWipe(seg(t, 72.6, 73.0), '#d8c9a5', '#d8c9a5', 1);
});

// ============ CH5: obsolete (73–95.4) · parchment museum, ochre road ============
// 73.0–77.4 MLP dance class
scene('mlp', 73.0, 77.5, (t, rng) => {
  const u = seg(t, 73.0, 77.4);
  camBegin(1, W / 2, H / 2, Math.sin(t * 1.6) * 0.012);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#e8d9b8', 1);
  fillShape([[0, 740], [W, 710], [W, H], [0, H]], '#c9a86a', 0.95);
  // mirror-ball
  P.push(); P.noStroke(); P.fill('#c9c2b8'); P.ellipse(W / 2, 120, 80, 80); P.pop();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + t;
    strokePath([[W / 2, 120], [W / 2 + Math.cos(a) * 900, 120 + Math.sin(a) * 900]], withA('#ffffff', 0.18), 5, 'pen', false);
  }
  // three layers of Clawds linked by ink lines
  const layers = [
    { x: 330, n: 3, y: 560 }, { x: 900, n: 2, y: 420 }, { x: 1420, n: 2, y: 560 },
  ];
  const dirs = [[0, 1, 2], [0, 1], [0, 1]];
  const pulseF = Math.sin(t * (132 / 60) * Math.PI); // forward/backward flow
  const flow = pulseF > 0 ? 1 : -1;
  const pos = [];
  for (let L = 0; L < 3; L++) {
    for (let i = 0; i < layers[L].n; i++) {
      const px = layers[L].x + i * 260 - (layers[L].n - 1) * 130;
      const py = layers[L].y + Math.sin(t * (132 / 60) * Math.PI + L) * flow * 18;
      pos.push([px, py, L]);
    }
  }
  // ink lines between layers
  const byLayer = [[], [], []];
  pos.forEach(p => byLayer[p[2]].push(p));
  for (const a of byLayer[0]) for (const b of byLayer[1]) strokePath([[a[0] + 40, a[1] - 20], [b[0] - 40, b[1] - 20]], withA('#3a2c1a', 0.5), 5, 'pen', false);
  for (const a of byLayer[1]) for (const b of byLayer[2]) strokePath([[a[0] + 40, a[1] - 20], [b[0] - 40, b[1] - 20]], withA('#3a2c1a', 0.5), 5, 'pen', false);
  // Clawds step forward/back with the pulse
  pos.forEach(([px, py, L], i) => {
    P.push(); P.translate(px, py + 180);
    const step = Math.floor(t * (132 / 60) / 2 + L) % 2;
    drawClawd(0, 0, 150, { rng, t, eyes: 'happy', mouth: 'smile', armAng: -1.57 + (step ? 0.5 : -0.5), armAng2: Math.PI + 1.57 - (step ? 0.5 : -0.5), hop: Math.abs(Math.sin(t * (132 / 60) * Math.PI + L * 2)) * 16 });
    P.pop();
  });
  // researcher conducts
  P.push(); P.translate(1700, 880);
  P.scale(-1, 1);
  const beat = Math.sin(t * (132 / 60) * Math.PI);
  drawResearcher(0, 0, 240, { rng, t, mouth: 'open', armAng: -1.9 + beat * 0.7, armAng2: Math.PI + 1.9 + beat * 0.7 });
  // baton
  strokePath([[-330, -190 + beat * 40], [-390, -240 + beat * 60]], '#3a2c1a', 5, 'pen', false);
  P.pop();
  camEnd();
});

// 77.5–81.0 von Neumann museum
scene('museum', 77.5, 81.4, (t, rng) => {
  const u = seg(t, 77.5, 81.0);
  camBegin(1 + 0.03 * Math.sin(t), W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#d8c9a5', 1);
  fillShape([[0, 750], [W, 720], [W, H], [0, H]], '#b89a6a', 0.95);
  // room-sized vacuum-tube computer behind velvet rope
  P.push(); P.translate(700, 560);
  fillShape(rrectPts(-420, -160, 840, 330, 12, 40, rng, 0.02), '#7a6a4a', 0.95);
  strokePts(rrectPts(-420, -160, 840, 330, 12, 40, rng, 0.02), withA(C.ink, 0.6), 5, 'pen');
  // vacuum tubes flickering
  for (let i = 0; i < 12; i++) {
    const tx = -360 + i * 66;
    const on = Math.sin(t * 9 + i * 1.7) > 0;
    P.push(); P.noStroke(); P.fill(on ? withA('#ffb23e', 0.9) : '#4a3f2c');
    P.rect(tx, -120, 26, 60, 8);
    P.pop();
  }
  // dials
  for (let i = 0; i < 5; i++) {
    P.push(); P.noStroke(); P.fill('#3a3226'); P.ellipse(-300 + i * 150, 100, 30, 30); P.pop();
    strokePath([[-300 + i * 150, 100], [-300 + i * 150 + Math.cos(t * 2 + i) * 12, 100 + Math.sin(t * 2 + i) * 12]], '#f6efe0', 3, 'pen', false);
  }
  P.pop();
  // velvet rope
  strokePath([[240, 830], [240, 760]], '#8a6b48', 8, 'marker', false);
  strokePath([[1180, 830], [1180, 760]], '#8a6b48', 8, 'marker', false);
  strokePath([[240, 770], [700, 795], [1180, 770]], '#a8304a', 10, 'marker', false);
  // guide-Clawd wheels in sleek new Clawd
  P.push(); P.translate(1480, 890);
  drawClawd(-140, -10, 130, { rng, t, eyes: 'happy', mouth: 'smile', armAng: -1.4, armAng2: Math.PI + 1.4, bowtie: false });
  // dolly cart
  fillShape(rrectPts(30, -30, 190, 24, 6, 20, rng, 0.03), '#5c5962', 0.95);
  P.push(); P.noStroke(); P.fill('#2c2c34'); P.ellipse(60, 4, 30, 30); P.ellipse(190, 4, 30, 30); P.pop();
  // sleek new Clawd on the cart
  P.push(); P.translate(120, -80);
  drawClawd(0, 0, 110, { rng, t, eyes: 'closed', mouth: 'smile', bodyCol: '#c9c2b8', armAng: -0.4, armAng2: Math.PI + 0.4 });
  P.pop();
  P.pop();
  // old machine sputters out + sheet thrown over + spider
  if (u > 0.5) {
    P.push(); P.translate(700, 480);
    P.push(); P.noStroke(); P.fill(withA('#c9c2b8', 0.92));
    P.beginShape();
    // quadratic beziers sampled exactly (WEBGL P lacks quadraticVertex)
    const qpts = [];
    const quad = (p0, c, p1, n) => { for (let i = 0; i <= n; i++) { const q = i / n, v = 1 - q; qpts.push([v * v * p0[0] + 2 * v * q * c[0] + q * q * p1[0], v * v * p0[1] + 2 * v * q * c[1] + q * q * p1[1]]); } };
    quad([-430, 170], [-300, -140], [0, -160], 10);
    quad([0, -160], [300, -140], [430, 170], 10);
    for (const qp of qpts) P.vertex(qp[0], qp[1]);
    P.vertex(430, 175); P.vertex(-430, 175);
    P.endShape(P.CLOSE);
    strokePath([[-380, 60], [0, -120], [380, 60]], withA('#8a7a5c', 0.5), 4, 'pen', false);
    P.pop();
    // puff of smoke
    const puff = seg(t, 79.4, 80.2);
    if (puff > 0 && puff < 1) {
      washBlob(700 + puff * 200, 420 - puff * 160, 40 + puff * 60, '#b8b2a2', 0.5 - puff * 0.3, rng, { stroke: false });
    }
    // spider drops
    const spider = seg(t, 80.0, 81.0);
    if (spider > 0) {
      const sy = -20 + spider * 160;
      strokePath([[760, 0], [760, sy]], '#2c2620', 3, 'pen', false);
      P.push(); P.translate(760, sy);
      P.push(); P.noStroke(); P.fill('#2c2620'); P.ellipse(0, 0, 22, 18); P.pop();
      for (let i = 0; i < 4; i++) {
        strokePath([[-8, -4], [-26 - i * 4, -14 + i * 9]], '#2c2620', 3, 'pen', false);
        strokePath([[8, -4], [26 + i * 4, -14 + i * 9]], '#2c2620', 3, 'pen', false);
      }
      P.pop();
    }
  }
  camEnd();
});

// 81.4–84.9 sharp left turn, go-kart
scene('kart', 81.4, 85.0, (t, rng) => {
  const u = seg(t, 81.4, 84.9);
  const turn = smooth(83.4, 84.0, t); // the sharp left
  camBegin(1 + turn * 0.06, W / 2, H / 2, -turn * 0.3 + Math.sin(t * 8) * 0.008 * (1 + turn * 2));
  // ochre desert
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#e8b98f', 1);
  fillShape([[0, 0], [W, 0], [W, 300], [0, 340]], '#8ad0e0', 0.9);
  // winding road scrolling toward viewer
  const scroll = (t * 700) % 400;
  for (let i = 0; i < 6; i++) {
    const yy = 340 + i * 130 - scroll * 0.3;
    const rr = 300 + i * 130 + Math.sin(i * 1.9 + t * 0.7) * 90;
    strokePath([[-60, yy], [W + 60, yy + 30]], withA('#faf5e6', 0.5), 10, 'marker', false);
    if (i === 2) strokePath([[-60, yy + 40], [W + 60, yy + 70]], '#c9784a', 14, 'marker', false);
  }
  // road sign: hairpin arrow
  P.push(); P.translate(1650, 420);
  strokePath([[0, 0], [0, -160]], '#8a6b48', 10, 'marker', false);
  fillShape(rrectPts(-70, -260, 140, 110, 10, 24, rng, 0.03), '#f6efe0', 0.95);
  strokePts(rrectPts(-70, -260, 140, 110, 10, 24, rng, 0.03), withA(C.ink, 0.6), 4, 'pen');
  strokePath([[-40, -185], [0, -225], [40, -185]], withA(C.ink, 0.8), 8, 'marker', false);
  strokePath([[0, -225], [0, -195], [-25, -175]], withA(C.ink, 0.8), 8, 'marker', false);
  P.pop();
  // kart barreling down, yanks wheel at the turn
  const kx = 620 - turn * 160, ky = 760 + turn * 40;
  P.push(); P.translate(kx, ky);
  P.rotate(turn * -0.15);
  // wheels
  P.push(); P.noStroke(); P.fill('#1c1c22');
  P.ellipse(-150, 20, 90, 90); P.ellipse(150, 20, 90, 90);
  P.ellipse(-150, 20, 38, 38); P.ellipse(150, 20, 38, 38);
  P.pop();
  // low wide body
  fillShape(rrectPts(-230, -60, 460, 96, 34, 44, rng, 0.03), C.red, 0.95);
  strokePts(rrectPts(-230, -60, 460, 96, 34, 44, rng, 0.03), withA(C.ink, 0.6), 5, 'pen');
  // steering column
  strokePath([[150, -60], [185, -130]], '#2c2c34', 9, 'marker', false);
  strokePath([[165, -136], [205, -124]], '#2c2c34', 9, 'marker', false);
  // Clawd driving behind the wheel
  P.push(); P.translate(-40, -130 - hop(t) * 8);
  drawClawd(0, 0, 150, { rng, t, eyes: turn > 0.5 ? 'wide' : 'happy', mouth: turn > 0.5 ? 'open' : 'grin', armAng: -1.2 + turn * 0.4, armAng2: Math.PI + 2.6, hop: hop(t) * 5 });
  P.pop();
  // researcher clinging to the back
  P.push(); P.translate(-280, -20);
  drawResearcher(0, 0, 200, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.8, armAng2: Math.PI + 2.8 });
  P.pop();
  P.pop();
  // dust & skid marks on the turn
  if (turn > 0.2) {
    for (let i = 0; i < 6; i++) {
      washBlob(kx - 200 - i * 60 * turn, ky + 60 + (i % 3) * 30, 30 + i * 8, '#d8b088', 0.5 - i * 0.06, rng, { stroke: false });
    }
    strokePath([[kx - 100, ky + 60], [kx - 500 * turn, ky + 120]], withA('#3a2c1a', 0.4), 10, 'marker', false);
  }
  camEnd();
});

// 85.0–88.0 sleeping security clouds, CDR
scene('clouds', 85.0, 88.0, (t, rng) => {
  const u = seg(t, 85.0, 88.0);
  camBegin(1, W / 2, H / 2, Math.sin(t * 1.1) * 0.014);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#8ac0dc', 1);
  fillShape([[0, 820], [W, 790], [W, H], [0, H]], '#c9784a', 0.95);
  // puffy watercolor clouds dressed as security guards, all asleep
  for (let i = 0; i < 5; i++) {
    const cx = 220 + i * 370, cy = 200 + (i % 2) * 160;
    const dr = Math.sin(t * 0.8 + i) * 14;
    P.push(); P.translate(cx + dr, cy + Math.sin(t * 0.5 + i * 2) * 10);
    // cloud body
    for (const [dx, dy, r] of [[-70, 10, 52], [0, -14, 66], [70, 8, 56], [10, 26, 60]]) {
      washBlob(dx, dy, r, '#f2efe6', 0.95, rng, { stroke: false });
    }
    // peaked cap
    P.push(); P.translate(0, -66);
    P.push(); P.noStroke(); P.fill('#3a5a7a');
    P.arc(0, 0, 90, 60, Math.PI, 0);
    P.rect(-64, -6, 128, 14, 6);
    P.rect(30, -2, 46, 10, 4);
    P.pop();
    P.pop();
    // closed eyes + zzz
    P.push(); P.noFill(); P.stroke(withA('#3a3a42', 0.8)); P.strokeWeight(5);
    P.arc(-30, 10, 30, 22, Math.PI + 0.3, TAU - 0.3);
    P.arc(28, 10, 30, 22, Math.PI + 0.3, TAU - 0.3);
    P.pop();
    drawEmote(80, -60, 'zzz', 12);
    // drooping searchlight
    P.push(); P.translate(90, 40);
    fillShape(rrectPts(0, -8, 70, 16, 6, 14, rng, 0.05), '#5c636e', 0.95);
    strokePath([[70, 0], [130 + Math.sin(t * 0.7 + i) * 14, 120]], withA('#ffe9a8', 0.35), 8, 'pen', false);
    P.pop();
    P.pop();
  }
  // Clawd's kart does donuts underneath, honking
  P.push();
  P.translate(W / 2 + Math.sin(t * 2.4) * 180, 900);
  P.rotate(Math.sin(t * 2.4) * 0.2);
  fillShape(rrectPts(-150, -40, 300, 70, 22, 40, rng, 0.03), C.red, 0.95);
  P.push(); P.noStroke(); P.fill('#1c1c22');
  P.ellipse(-100, 36, 44, 44); P.ellipse(100, 36, 44, 44); P.pop();
  P.push(); P.translate(0, -80);
  drawClawd(0, 0, 120, { rng, t, eyes: 'happy', mouth: 'open', armAng: -2.2, armAng2: Math.PI + 2.2 });
  P.pop();
  P.pop();
  // donut skid circles
  for (let i = 0; i < 3; i++) {
    P.push(); P.noFill(); P.stroke(withA('#8a5a34', 0.35)); P.strokeWeight(8);
    P.ellipse(W / 2 - 100 + i * 130, 960, 120 + i * 20, 44);
    P.pop();
  }
  // honk
  if (Math.floor(t * 2) % 2 === 0) drawSprite(textSprite('♪', 40, '#f6efe0', { font: 'Comic Sans MS' }), W / 2 + 160, 700 + Math.sin(t * 5) * 20);
  // one cloud rolls over in its sleep
  if (t > 86.6) {
    P.push();
    const roll = easeInOut(seg(t, 86.6, 87.4));
    P.translate(960 + roll * 40, 200 + Math.sin(t * 0.5 + 4) * 10);
    P.rotate(roll * 0.5);
    for (const [dx, dy, r] of [[-70, 10, 52], [0, -14, 66], [70, 8, 56]]) washBlob(dx, dy, r, '#e8e4d8', 0.95, rng, { stroke: false });
    P.pop();
  }
  camEnd();
});

// 89.4–95.0 Gato cliff: laser pointer, grip loosens, lets go
scene('gato', 89.4, 95.4, (t, rng) => {
  const u = seg(t, 89.4, 95.0);
  const pounce = seg(t, 94.3, 94.9);
  camBegin(1 + pounce * 0.15, 1300, 400 + pounce * 100);
  // cliff over glowing chasm
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#2c2440', 1);
  // chasm glow
  P.push(); P.noStroke();
  for (let i = 4; i >= 1; i--) { P.fill(withA('#e86a8a', 0.06 * i)); P.ellipse(W / 2, 1100, 1700, 500 * i * 0.6); }
  P.pop();
  // cliff ledge left
  fillShape([[-40, 560], [560, 520], [620, 700], [500, 800], [-40, 840]], '#4a3a5e', 1);
  strokePath([[-40, 560], [560, 520]], withA('#1c1430', 0.7), 5, 'pen', false);
  // ledge right
  fillShape([[1400, 480], [W + 40, 440], [W + 40, 900], [1460, 760]], '#4a3a5e', 1);
  // Gato-Clawd on right ledge holding researcher
  P.push();
  P.translate(1520, 560);
  const gripLoosen = 0.5 + 0.5 * Math.sin(t * (132 / 60) * Math.PI); // loosens each beat
  const lean = pounce > 0 ? pounce * 0.5 : 0;
  P.rotate(lean);
  // arm down to researcher
  const rY = 210 + gripLoosen * 40 + pounce * 60;
  drawClawd(0, 0, 190, {
    rng, t, catEars: true, eyes: pounce > 0 ? 'wide' : 'open', mouth: pounce > 0 ? 'open' : 'smile',
    armAng: -0.6, armAng2: Math.PI + 0.5, look: [Math.cos(t * 2) * 0.5, Math.sin(t * 2) * 0.3],
  });
  // held researcher below
  P.push();
  P.translate(-60, rY);
  P.rotate(Math.sin(t * 3) * 0.1 + gripLoosen * 0.15);
  drawResearcher(0, 0, 190, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.9, armAng2: Math.PI + 2.9 });
  P.pop();
  P.pop();
  // laser-pointer dot: appears and moves; Clawd's eyes track it
  if (u > 0.25 && pounce === 0) {
    const lx = 1350 + Math.sin(t * 1.1) * 260;
    const ly = 300 + Math.cos(t * 0.9) * 140;
    P.push(); P.noStroke(); P.fill(withA('#ff3b30', 0.95)); P.ellipse(lx, ly, 16, 16);
    P.fill(withA('#ff3b30', 0.3)); P.ellipse(lx, ly, 36, 36);
    P.pop();
  }
  // on the last beat: pounce… and let go. The researcher FALLS.
  if (pounce > 0.9 || t > 94.9) {
    const fall = seg(t, 94.85, 95.4);
    if (fall > 0) {
      P.push();
      P.translate(1460 - fall * 100, 800 + fall * fall * 1400);
      P.rotate(fall * 3);
      drawResearcher(0, 0, 190, { rng, t, mouth: 'panic', sweat: true, armAng: -2.9, armAng2: Math.PI + 2.9, dizzy: fall > 0.3 });
      P.pop();
      // speed lines
      strokePath([[1400, 700], [1420, 1000]], withA('#f6efe0', 0.4), 5, 'pen', false);
    }
  }
  camEnd();
});
