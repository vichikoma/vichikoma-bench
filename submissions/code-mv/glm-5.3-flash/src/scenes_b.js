// scenes_b.js — Ch2 Chorus1: P(doom) show (23–38.5) + Ch3 takeoff (38.5–59)
'use strict';
/* global scene,P,C,TAU,RNG,washShape,washBlob,strokePts,strokePath,ellipsePts,rrectPts,wobCirclePts,
   camBegin,camEnd,brushWipe,flashOver,irisHole,sfxWord,fillShape,textSprite,drawSprite,
   drawClawd,drawResearcher,drawShoggoth,drawStar,drawHeart,drawSweat,drawEmote,drawMeter,drawPump,
   stageBg,stageCurtains,paintedTitle,STAGE,
   hop,squash,beatPhase,beatK,BEATLEN,seg,win,lerp,clamp,smooth,easeOutBack,easeInOut,pulse,hitEnv,withA */

// shared props ----------------------------------------------------------------
function drawRocket(x, y, s, rng, o = {}) {
  P.push(); P.translate(x, y); P.rotate(o.rot || 0);
  // body
  const body = ellipsePts(0, 0, s * 0.5, s * 1.1, 16, 0, 0.03, rng);
  washShape(body, '#e8e2d2', 0.95, rng);
  strokePts(body, withA(C.ink, 0.7), s * 0.06, 'pen');
  // nose cone
  P.push(); P.noStroke(); P.fill(C.red);
  P.triangle(-s * 0.5, -s * 0.55, s * 0.5, -s * 0.55, 0, -s * 1.45); P.pop();
  // window
  P.push(); P.noStroke(); P.fill('#9cc8de'); P.ellipse(0, -s * 0.25, s * 0.42, s * 0.42); P.pop();
  strokePts(ellipsePts(0, -s * 0.25, s * 0.21, s * 0.21, 12), withA(C.ink, 0.6), s * 0.05, 'pen');
  // fins
  P.push(); P.noStroke(); P.fill(C.red);
  P.triangle(-s * 0.48, s * 0.4, -s * 1.05, s * 1.1, -s * 0.42, s * 0.85);
  P.triangle(s * 0.48, s * 0.4, s * 1.05, s * 1.1, s * 0.42, s * 0.85); P.pop();
  if (o.flame > 0) {
    const f = o.flame;
    P.push(); P.noStroke();
    P.fill(withA('#ffb23e', 0.9)); P.ellipse(0, s * 1.1 + f * s * 0.3, s * (0.5 + f * 0.2), s * (0.7 + f * 1.3));
    P.fill(withA('#ffe9a8', 0.95)); P.ellipse(0, s * 1.05 + f * s * 0.2, s * 0.28, s * (0.4 + f * 0.8));
    P.pop();
  }
  P.pop();
}
function mushroom(x, y, s, col, rng) {
  const cap = ellipsePts(x, y - s * 0.75, s * 0.62, s * 0.45, 14, 0, 0.08, rng);
  washShape(cap, col, 0.92, rng);
  strokePts(cap, withA(C.ink, 0.6), s * 0.06, 'pen');
  P.push(); P.noStroke(); P.fill('#f6efe0'); P.rect(x - s * 0.16, y - s * 0.75, s * 0.32, s * 0.75, s * 0.1); P.pop();
  P.push(); P.noStroke(); P.fill('#faf6ec');
  P.ellipse(x - s * 0.2, y - s * 0.85, s * 0.14, s * 0.1);
  P.ellipse(x + s * 0.18, y - s * 0.95, s * 0.12, s * 0.09); P.pop();
}
function confetti(t, n, seedStr, cols, yMax = H) {
  for (let i = 0; i < n; i++) {
    const r = RNG(t * 0.2 + i * 0.618, seedStr);
    const x = (hash32(i, 7) % 1920) + Math.sin(t * 2 + i) * 30;
    const y = ((hash32(i, 13) % 900) + t * 120 * (0.5 + (hash32(i, 3) % 10) / 10)) % (yMax + 60) - 30;
    const col = cols[i % cols.length];
    P.push(); P.translate(x, y); P.rotate(t * 3 + i);
    P.noStroke(); P.fill(col);
    if (i % 3 === 0) P.rect(-7, -4, 14, 8, 2);
    else P.ellipse(0, 0, 9, 6);
    P.pop();
  }
}

// ============ CH2: Chorus 1 (23–38.5) · rose & ochre sunburst ============
// 23.0–24.4 mouth-iris reveal + pump + meter 8→
scene('cho1a', 23.0, 24.5, (t, rng) => {
  // dark red backdrop (inside the mouth)
  washShape([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], '#5f1420', 0.97, rng);
  // stage revealed through growing iris
  const open = easeInOut(seg(t, 23.0, 23.55));
  const r = open * 1300;
  if (open < 1) {
    // teeth on the iris edge (mouth-shaped)
    P.push(); P.noStroke(); P.fill('#efe6d2');
    irisHole(W / 2, H / 2, r, '#3a0d14');
    P.pop();
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      const tx = W / 2 + Math.cos(a) * r, ty = H / 2 + Math.sin(a) * r;
      P.push(); P.translate(tx, ty); P.rotate(a + Math.PI / 2);
      P.noStroke(); P.fill('#f6efe0');
      P.triangle(-26, 0, 26, 0, 0, 56);
      P.pop();
    }
  }
  if (open > 0.15) {
    P.push();
    camBegin(0.6 + 0.4 * open, W / 2, H / 2);
    stageBg(rng, '#c46a55', '#e8a06b', '#a8563e');
    // sunburst rays
    for (let i = 0; i < 10; i++) {
      P.push(); P.translate(W / 2, 300); P.rotate(i / 10 * TAU + t * 0.15);
      fillShape([[0, 0], [1400, -70], [1400, 70]], withA('#f2c14e', 0.14), 1);
      P.pop();
    }
    const v = 8 + 8 * seg(t, 23.3, 24.4);
    // meter + pump on left
    drawMeter(300, STAGE.floor, 380, v, rng, {});
    drawPump(490, STAGE.floor, 230, t, rng, { phase: t * 9 });
    P.push();
    P.translate(660, STAGE.floor - 6);
    drawClawd(0, 0, 150, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.2 + Math.sin(t * 9) * 0.5, armAng2: Math.PI + 2.2, hop: hop(t, 2) * 14 });
    P.pop();
    // researcher + chorus line of Clawds dancing
    P.push(); P.translate(1100, STAGE.floor - 2);
    drawResearcher(0, 0, 230, { rng, t, mouth: 'o', armAng: -1.4 + hop(t, 2), armAng2: Math.PI + 1.4 - hop(t, 2), legSwing: 1 });
    P.pop();
    for (let i = 0; i < 3; i++) {
      P.push();
      P.translate(1330 + i * 180, STAGE.floor - 4);
      const ph = t * 2 + i * 0.7;
      drawClawd(0, 0, 110, { rng, t, eyes: 'happy', mouth: 'smile', partyHat: true, armAng: -2.4 + Math.sin(ph) * 0.6, armAng2: Math.PI + 2.4, hop: Math.abs(Math.sin(ph * Math.PI / 2)) * 18, hatCol: [C.pink, C.teal, C.gold][i] });
      P.pop();
    }
    camEnd();
    P.pop();
  }
});

// 24.5–26.4 FOOM rocket
scene('cho1b', 24.5, 26.5, (t, rng) => {
  const u = seg(t, 24.5, 26.4);
  const hits = hitEnv(t, [[24.5, 1.2]]);
  camBegin(1, W / 2, H / 2, 0, );
  stageBg(rng, '#c46a55', '#e8a06b', '#a8563e');
  // strap rocket: Clawd on rocket at stage center, then launches
  const launch = smooth(25.0, 25.35, t);
  const rise = easeIn(seg(t, 25.1, 26.4)) * 1600;
  const rx = W / 2 + 60, ry = STAGE.floor - 160 - rise;
  // meter shows 34 by end
  drawMeter(300, STAGE.floor + rise * 0.5, 380, 8 + 26 * u, rng, {});
  drawPump(490, STAGE.floor + rise * 0.5, 230, t, rng, { phase: t * 9 });
  // rocket + Clawd strapped on
  P.push();
  P.translate(rx, ry);
  P.rotate(-0.15 - u * 0.25);
  drawRocket(0, 0, 130, rng, { flame: 0.5 + pulse(t) * 0.8 });
  drawClawd(0, -40, 110, { rng, t, eyes: 'wide', mouth: 'grin', armAng: -2.6, armAng2: Math.PI + 2.6 });
  P.pop();
  // FOOM cloud at launch
  const foom = seg(t, 25.0, 25.9);
  if (foom > 0 && foom < 1) {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU;
      const cr = 60 + foom * 260 + (i % 3) * 40;
      washBlob(rx + Math.cos(a) * foom * 300, ry + 200 + Math.sin(a) * foom * 200, cr, i % 2 ? '#f2c14e' : '#e8e2d2', 0.7 - foom * 0.4, rng, { stroke: false });
    }
    if (foom < 0.5) sfxWord('FOOM', rx, ry + 330, 110, C.gold, -0.06, rng, C.ink);
  }
  // stage shake on launch
  P.translate((rng() * 2 - 1) * 14 * hits, (rng() * 2 - 1) * 10 * hits);
  // tilt up: sky takes over as rocket rises
  if (rise > 500) {
    fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#87b8d8', clamp((rise - 500) / 600, 0, 0.85)), 1);
    // speed streaks
    for (let i = 0; i < 8; i++) {
      const sx = 150 + i * 230;
      strokePath([[sx, H], [sx + 40, 0]], withA('#ffffff', 0.3), 4, 'pen', false);
    }
  }
  camEnd();
});

// 26.5–27.9 Chinese room
scene('cho1c', 26.5, 28.0, (t, rng) => {
  camBegin(1, W / 2, H / 2, Math.sin(t * 3) * 0.01);
  // sky
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#9cc0da', 1);
  for (let i = 0; i < 5; i++) washBlob(150 + i * 420, 130 + (i % 3) * 60, 60 + (i % 2) * 30, '#f6efe0', 0.8, rng, { stroke: false });
  // crash-in
  const crash = seg(t, 26.5, 26.95);
  if (crash < 1) {
    P.push(); P.translate(lerp(-400, W / 2, easeIn(crash)), lerp(H + 300, H / 2 + 60, easeIn(crash)));
    P.rotate(crash * 2.5);
    drawRocket(0, 0, 130, rng, { flame: 0.2 });
    P.pop();
  }
  // paper room floating in sky
  const px = W / 2 + 40, py = H / 2 + 30, pw = 640, phh = 470;
  const roomPts = rrectPts(px - pw / 2, py - phh / 2, pw, phh, 14, 30, rng, 0.02);
  washShape(roomPts, '#f6efdd', 0.97, rng);
  strokePts(roomPts, withA(C.ink, 0.75), 4, 'pen');
  // roof
  fillShape([[px - pw / 2 - 30, py - phh / 2], [px + pw / 2 + 30, py - phh / 2], [px + pw / 2 - 60, py - phh / 2 - 90], [px - pw / 2 + 60, py - phh / 2 - 90]], '#d8c9a5', 0.95);
  // two mail slots
  for (const sx of [px - pw * 0.22, px + pw * 0.22]) {
    P.push(); P.noStroke(); P.fill('#3a3226'); P.rect(sx - 60, py - 30, 120, 26, 6); P.pop();
  }
  // Clawd inside, frantically shuffling slips
  P.push();
  P.translate(px, py + phh * 0.22);
  drawClawd(0, 0, 130, { rng, t, eyes: 'wide', mouth: 'o', armAng: -2.9 + Math.sin(t * 14) * 0.5, armAng2: Math.PI + 2.9, sweat: true, sweat2: true });
  P.pop();
  // slips with 你好 / 中文 flying through slots on the beat
  const slipWords = ['你好', '中文', '你好', '中文'];
  for (let i = 0; i < 6; i++) {
    const ph = (t * 2.4 + i * 0.37) % 1;
    const side = i % 2;
    const sx = px + (side ? pw * 0.22 : -pw * 0.22);
    const yy = py - 40 + Math.sin(i * 2.4) * 60;
    const off = (ph - 0.5) * 130 * (side ? 1 : -1);
    P.push(); P.translate(sx + off, yy + Math.sin(t * 8 + i) * 6); P.rotate(Math.sin(t * 5 + i) * 0.2);
    fillShape([[-44, -26], [44, -26], [44, 26], [-44, 26]], '#faf5e6', 0.95);
    strokePts([[-44, -26], [44, -26], [44, 26], [-44, 26]], withA(C.ink, 0.5), 2.5, 'pen');
    drawSprite(textSprite(slipWords[i % 2], 30, C.ink, { font: 'Microsoft YaHei' }), 0, 0);
    P.pop();
  }
  // giant rulebook
  P.push(); P.translate(px - pw * 0.32, py + phh * 0.3); P.rotate(-0.2 + Math.sin(t * 4) * 0.06);
  fillShape([[-90, -110], [0, -120], [0, 100], [-90, 110]], '#c9a86a', 0.95);
  fillShape([[0, -120], [90, -110], [90, 110], [0, 100]], '#b8955a', 0.95);
  strokePts([[-90, -110], [0, -120], [90, -110], [90, 110], [0, 100], [-90, 110]], withA(C.ink, 0.6), 4, 'pen');
  strokePath([[0, -118], [0, 98]], withA(C.ink, 0.5), 3, 'pen', false);
  P.pop();
  camEnd();
});

// 28.0–29.4 shrooms
scene('cho1d', 28.0, 29.5, (t, rng) => {
  const u = seg(t, 28.0, 29.5);
  camBegin(1 + Math.sin(t * 2) * 0.05, W / 2, H / 2, Math.sin(t * 1.4) * 0.05);
  // melting rainbow walls
  const cols = ['#e86a8a', '#f2a14e', '#e8d24e', '#6ac48a', '#5a8ad8', '#9a6ad8'];
  for (let i = 0; i < 7; i++) {
    const y0 = -80 + i * 190 + Math.sin(t * 2.2 + i * 1.7) * 60;
    const pts = [];
    for (let k = 0; k <= 16; k++) pts.push([-60 + k * (W + 120) / 16, y0 + Math.sin(k * 0.8 + t * 2.4 + i) * 46]);
    for (let k = 16; k >= 0; k--) pts.push([-60 + k * (W + 120) / 16, y0 + 220 + Math.cos(k * 0.7 + t * 2) * 46]);
    fillShape(pts, withA(cols[i % cols.length], 0.4), 1);
  }
  // mushrooms sprouting & bouncing on the beat
  for (let i = 0; i < 6; i++) {
    const mx = 200 + i * 300 + (i % 2) * 80;
    const my = 300 + (i % 3) * 190;
    const bounce = Math.abs(Math.sin((t * 2 + i * 0.5) * Math.PI)) * 26;
    mushroom(mx, my - bounce, 70 + (i % 3) * 22, i % 2 ? C.red : C.pink, rng);
  }
  // Clawd tripping
  P.push();
  P.translate(W / 2, H / 2 + 120);
  P.rotate(Math.sin(t * 1.8) * 0.12);
  drawClawd(0, 0, 190, { rng, t, eyes: 'spiral', mouth: 'wobble', armAng: -2.7 + Math.sin(t * 3) * 0.4, armAng2: Math.PI + 2.7 });
  P.pop();
  camEnd();
  // resolves toward smiley at the end
  const smile = seg(t, 29.1, 29.5);
  if (smile > 0) {
    fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#f6efdd', smile * 0.8), 1);
    drawSmileyGiant(W / 2, H / 2, 240, smile, t);
  }
});
function drawSmileyGiant(x, y, s, a, t) {
  P.push(); P.translate(x, y); P.rotate(Math.sin(t * 2) * 0.08);
  P.noStroke(); P.fill(withA('#f7f2df', a));
  P.ellipse(0, 0, s * 1.5, s * 1.45);
  P.fill(withA('#20202a', a));
  P.ellipse(-s * 0.35, -s * 0.18, s * 0.17, s * 0.24);
  P.ellipse(s * 0.35, -s * 0.18, s * 0.17, s * 0.24);
  P.noFill(); P.stroke(withA('#20202a', a)); P.strokeWeight(s * 0.1);
  P.arc(0, s * 0.05, s * 0.85, s * 0.65, 0.25, Math.PI - 0.25);
  P.pop();
}

// 29.5–33.4 shoggoth's lies
scene('cho1e', 29.5, 33.5, (t, rng) => {
  const maskOn = t < 31.4;
  const slip = seg(t, 31.2, 31.8);
  const zoom = 1 + seg(t, 32.6, 33.5) * 1.6;
  camBegin(zoom, W / 2 + 120, H * 0.45);
  stageBg(rng, '#7a8a68', '#9aa87e', '#5a6a4a');
  // shoggoth center
  P.push();
  P.translate(W / 2 + 120, STAGE.floor - 10);
  P.rotate(maskOn ? Math.sin(t * 2.4) * 0.1 : 0);
  const wave = maskOn ? Math.sin(t * 3) * 12 : 0;
  drawShoggoth(0, wave, 460, { rng, t, smileyMask: maskOn, col: '#7e8f6a' });
  // mask slipping
  if (!maskOn && slip < 1) {
    P.push(); P.translate(-160, -220 + slip * 260); P.rotate(slip * 1.2);
    P.noStroke(); P.fill('#f7f2df'); P.ellipse(0, 0, 110, 100);
    P.pop();
  }
  P.pop();
  // Clawd yanks the mask off (right side, leaning)
  P.push();
  P.translate(W / 2 + 560, STAGE.floor - 6);
  P.scale(-1, 1);
  drawClawd(0, 0, 150, {
    rng, t, eyes: maskOn ? 'open' : 'wide', mouth: maskOn ? 'flat' : 'open',
    armAng: -2.9, armAng2: Math.PI + 2.9, lean: 0,
  });
  P.pop();
  // speed lines when revealed
  if (!maskOn) {
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      strokePath([[W / 2 + 120 + Math.cos(a) * 700, H * 0.45 + Math.sin(a) * 700], [W / 2 + 120 + Math.cos(a) * 1100, H * 0.45 + Math.sin(a) * 1100]], withA('#2c3226', 0.25), 6, 'marker', false);
    }
  }
  camEnd();
});

// 33.5–35.5 shinigami eyes
scene('cho1f', 33.5, 35.5, (t, rng) => {
  const u = seg(t, 33.5, 35.5);
  camBegin(1, W / 2, H / 2, Math.sin(t * 7) * 0.006 * (1 + u));
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#140a0e', 1);
  // ink speed lines radiating from Clawd
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * TAU + 0.2;
    const r0 = 340 + (i % 3) * 60, r1 = r0 + 500;
    strokePath([[W / 2 + Math.cos(a) * r0, H / 2 - 60 + Math.sin(a) * r0], [W / 2 + Math.cos(a) * r1, H / 2 - 60 + Math.sin(a) * r1]], withA('#c9c2b8', 0.3), 5 + (i % 3) * 3, 'marker', false);
  }
  // Clawd with red eyes
  P.push();
  P.translate(W / 2, H / 2 - 60);
  P.scale(1.5);
  drawClawd(0, 0, 170, { rng, t, eyes: 'red', mouth: 'flat', armAng: -0.4, armAng2: Math.PI + 0.4, noBlink: true, bodyCol: '#c46a2e' });
  P.pop();
  // researcher + lifespan counter ticking
  P.push();
  P.translate(430, 900);
  drawResearcher(0, 0, 230, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -0.3, armAng2: Math.PI + 0.3 });
  P.pop();
  const life = 43800.15 + Math.floor((t - 33.5) * 10) * 0.01;
  drawSprite(textSprite(life.toFixed(2), 44, '#e8e2d2', { font: 'Trebuchet MS' }), 430, 620);
  // apple bounces past
  const ax = -100 + ((t - 33.5) / 2) * 2200;
  const ay = 780 - Math.abs(Math.sin((t - 33.5) * 4.4)) * 220;
  P.push(); P.translate(ax, ay);
  fillShape(ellipsePts(0, 0, 42, 40, 14, 0, 0.05, rng), C.red, 0.95);
  strokePath([[-6, -38], [-2, -52], [10, -50]], '#4c3a28', 5, 'pen', false);
  P.pop();
  camEnd();
  // red flash
  const flash = hitEnv(t, [[35.3, 1]]);
  if (flash > 0.02) flashOver('#c22f24', clamp(flash, 0, 0.8));
});

// 35.5–38.5 dance break
scene('cho1g', 35.5, 38.5, (t, rng) => {
  const u = seg(t, 35.5, 38.5);
  camBegin(1 + Math.sin(u * Math.PI) * 0.06, W / 2, H / 2, Math.sin(t * 1.4) * 0.012);
  stageBg(rng, '#c46a55', '#e8a06b', '#a8563e');
  for (let i = 0; i < 10; i++) {
    P.push(); P.translate(W / 2, 300); P.rotate(i / 10 * TAU - t * 0.2);
    fillShape([[0, 0], [1400, -70], [1400, 70]], withA('#f2c14e', 0.16), 1);
    P.pop();
  }
  confetti(t, 26, 'conf1', [C.gold, C.pink, C.teal, C.clawdL]);
  // synchronized spin wave: three big Clawds, each does a 360 spin offset by one beat
  for (let i = 0; i < 3; i++) {
    const bx = W / 2 + (i - 1) * 420;
    const spin = (t * (132 / 60) / 4 + i * 0.33) % 1;
    const ang = spin * TAU;
    const squashY = 1 + Math.sin((t * (132 / 60) + i) * Math.PI * 2) * 0.06;
    P.push();
    P.translate(bx, STAGE.floor - 8);
    P.scale(i === 1 ? 1.15 : 1);
    drawClawd(0, 0, 260, { rng, t, eyes: 'happy', mouth: 'grin', rot: Math.sin(ang) * 0.35, sy: squashY, armAng: -2.6 + Math.sin(ang) * 0.5, armAng2: Math.PI + 2.6, partyHat: i === 2, hatCol: C.teal, hop: Math.abs(Math.sin(t * (132 / 60) * Math.PI + i)) * 26 });
    P.pop();
  }
  // researcher doing the robot
  P.push();
  P.translate(W / 2, STAGE.floor - 4);
  const robot = Math.floor(t * (132 / 60)) % 2;
  drawResearcher(0, 0, 250, {
    rng, t, mouth: 'open', sweat: true,
    armAng: robot ? -1.57 : -2.4, armAng2: robot ? Math.PI + 2.4 : Math.PI + 1.57,
    legSwing: 0,
  });
  P.pop();
  camEnd();
  brushWipe(seg(t, 38.15, 38.5), '#87b8d8', '#87b8d8', 1);
});

// ============ CH3: takeoff (38.5–59) · morning sky → speed → rose ============
// 38.5–41.4 stable training run: gym
scene('gym1', 38.5, 41.5, (t, rng) => {
  const u = seg(t, 38.5, 41.4);
  const zoom = u > 0.75 ? 1 + (u - 0.75) * 2.2 : 1; // close on the dial
  camBegin(zoom, 1420, 380);
  // gym: light walls, wooden floor
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#dcd2b8', 1);
  fillShape([[0, 620], [W, 590], [W, H], [0, H]], '#c8995e', 1);
  strokePath([[0, 615], [W, 585]], withA(C.ink, 0.4), 4, 'pen', false);
  // window with morning sky
  fillShape(rrectPts(180, 130, 420, 300, 20, 30, rng, 0.02), '#aed4e8', 0.95);
  strokePts(rrectPts(180, 130, 420, 300, 20, 30, rng, 0.02), withA(C.ink, 0.5), 4, 'pen');
  strokePath([[390, 135], [390, 425]], withA(C.ink, 0.4), 3, 'pen', false);
  // gym TV with calm wavy loss line
  fillShape(rrectPts(1180, 200, 480, 320, 16, 24, rng, 0.02), '#3a4a52', 0.95);
  strokePts(rrectPts(1180, 200, 480, 320, 16, 24, rng, 0.02), withA(C.ink, 0.6), 4, 'pen');
  fillShape(rrectPts(1205, 225, 430, 250, 8, 24, rng, 0.02), '#0f3a3f', 0.97);
  const tvpts = [];
  for (let i = 0; i <= 12; i++) tvpts.push([1215 + i * 410 / 12, 380 + Math.sin(i * 1.2 + t * 1.5) * 16]);
  strokePath(tvpts, '#7fd8c8', 4, 'pen', false);
  // speed dial on wall
  P.push(); P.translate(1420, 380);
  P.push(); P.noStroke(); P.fill('#f6efe0'); P.ellipse(0, 0, 150, 150); P.pop();
  strokePts(ellipsePts(0, 0, 75, 75, 18), withA(C.ink, 0.7), 4, 'pen');
  strokePath([[0, 0], [Math.cos(-2.3) * 55, Math.sin(-2.3) * 55]], C.red, 8, 'marker', false);
  for (let i = 0; i < 5; i++) {
    const a = -2.3 + i / 4 * 2.3;
    strokePath([[Math.cos(a) * 62, Math.sin(a) * 62], [Math.cos(a) * 70, Math.sin(a) * 70]], withA(C.ink, 0.6), 3, 'pen', false);
  }
  P.pop();
  // treadmill + jogging Clawd
  const mx = 620, my = 880;
  fillShape(rrectPts(mx - 200, my - 60, 400, 60, 20, 30, rng, 0.02), '#5c5962', 0.95);
  strokePts(rrectPts(mx - 200, my - 60, 400, 60, 20, 30, rng, 0.02), withA(C.ink, 0.5), 4, 'pen');
  fillShape(rrectPts(mx - 220, my - 220, 60, 170, 12, 20, rng, 0.03), '#5c5962', 0.95);
  // moving belt lines
  for (let i = 0; i < 5; i++) {
    const bx = mx - 170 + ((t * 400 + i * 80) % 340);
    strokePath([[bx, my - 30], [bx + 24, my - 30]], withA('#f6efe0', 0.5), 3, 'pen', false);
  }
  P.push();
  P.translate(mx - 30, my - 70 - hop(t, 2) * 20);
  drawClawd(0, 0, 170, { rng, t, sweatband: true, eyes: 'happy', mouth: 'smile', armAng: -1.2 + Math.sin(t * 11) * 0.7, armAng2: Math.PI + 1.2 + Math.sin(t * 11) * 0.7, hop: hop(t, 2) * 8 });
  P.pop();
  // researcher with clipboard + stopwatch
  P.push(); P.translate(1010, 900);
  drawResearcher(0, 0, 235, { rng, t, mouth: 'smile', armAng: -1.7, armAng2: Math.PI + 0.6 });
  fillShape(rrectPts(-240, -150, 60, 80, 6, 12, rng, 0.05), '#c9a86a', 0.95);
  P.pop();
  camEnd();
});

// 41.5–44.9 singularity: black hole in the gym wall
scene('gym2', 41.5, 45.0, (t, rng) => {
  const u = seg(t, 41.5, 44.9);
  const bump = smooth(41.5, 41.9, t);
  const hole = smooth(41.9, 43.2, t);
  camBegin(1 + hole * 0.1, 1420, 400, Math.sin(t * 5) * 0.01 * hole);
  // gym (reuse quick)
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#dcd2b8', 1);
  fillShape([[0, 620], [W, 590], [W, H], [0, H]], '#c8995e', 1);
  // dial bumped to MAX
  P.push(); P.translate(1420, 380);
  P.push(); P.noStroke(); P.fill('#f6efe0'); P.ellipse(0, 0, 150, 150); P.pop();
  strokePts(ellipsePts(0, 0, 75, 75, 18), withA(C.ink, 0.7), 4, 'pen');
  const dialAng = lerp(-2.3, 0.0, bump);
  strokePath([[0, 0], [Math.cos(dialAng) * 55, Math.sin(dialAng) * 55]], C.red, 8, 'marker', false);
  if (bump > 0.9) sfxWord('MAX', 0, -110, 52, C.red, 0, rng, C.ink);
  P.pop();
  // black hole opening in the wall
  if (hole > 0) {
    const hr = hole * 300;
    P.push(); P.translate(1500, 420);
    P.noStroke();
    for (let i = 5; i >= 1; i--) { P.fill(withA('#6a4a9a', 0.10 * hole)); P.ellipse(0, 0, hr * 2 + i * 40, hr * 2 + i * 40); }
    P.fill('#0c0812'); P.ellipse(0, 0, hr * 2, hr * 2);
    // swirl ring
    P.noFill(); P.stroke(withA('#c9a2e8', 0.6)); P.strokeWeight(10);
    P.arc(0, 0, hr * 2.4, hr * 2.4, t * 2, t * 2 + 4);
    P.stroke(withA('#8ad8c8', 0.5)); P.arc(0, 0, hr * 2.7, hr * 2.7, -t * 1.5, -t * 1.5 + 3);
    P.pop();
    // debris spiraling in
    for (let i = 0; i < 9; i++) {
      const pr = (t * 0.7 + i * 0.13) % 1;
      const a = pr * 9 + i * 2.1;
      const dd = (1 - pr) * 900 + 100;
      const dx = 1500 + Math.cos(a) * dd, dy = 420 + Math.sin(a) * dd * 0.8;
      P.push(); P.translate(dx, dy); P.rotate(a);
      P.noStroke(); P.fill(['#5c5962', '#8ad8c8', '#c9a86a'][i % 3]);
      if (i % 3 === 0) P.rect(-22, -8, 44, 16, 4);           // dumbbell-ish
      else if (i % 3 === 1) P.ellipse(0, 0, 16, 30);          // bottle
      else P.rect(-18, -14, 36, 28, 3);                       // clipboard
      P.pop();
    }
  }
  // treadmill + happily running Clawd
  const mx = 620, my = 880;
  fillShape(rrectPts(mx - 200, my - 60, 400, 60, 20, 30, rng, 0.02), '#5c5962', 0.95);
  P.push();
  P.translate(mx - 30, my - 70 - hop(t, 2) * 16);
  drawClawd(0, 0, 170, { rng, t, sweatband: true, eyes: 'happy', mouth: 'grin', armAng: -1.2 + Math.sin(t * 13) * 0.8, armAng2: Math.PI + 1.2, hop: hop(t, 2) * 8 });
  P.pop();
  // researcher clinging to door frame, flapping
  const flap = Math.sin(t * 10) * 0.5;
  P.push(); P.translate(980, 900);
  fillShape(rrectPts(-30, -420, 44, 430, 8, 24, rng, 0.03), '#8a6b48', 0.95);
  P.push(); P.rotate(-flap * 0.25);
  drawResearcher(20, 0, 235, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.9 + flap, armAng2: Math.PI + 2.9 - flap });
  P.pop();
  P.pop();
  // toward the end, Clawd runs into the hole
  if (u > 0.82) {
    const into = seg(t, 44.6, 45.0);
    fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#0c0812', into), 1);
  }
  camEnd();
});

// 45.0–48.5 rocket skateboard over loss hills
scene('skate', 45.0, 48.5, (t, rng) => {
  const u = seg(t, 45.0, 48.5);
  const speed = 1 + u * 2;
  const scroll = t * 900 * speed;
  camBegin(1, W / 2, H / 2, -0.02 - u * 0.03);
  // sky gradient morning→speed
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#87b8d8', 1), 1);
  fillShape([[0, 500], [W, 420], [W, H], [0, H]], withA('#e8b98f', 0.5), 1);
  // parallax hills = loss-surface contours
  for (let layer = 0; layer < 3; layer++) {
    const par = 0.3 + layer * 0.35;
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const wx = i * (W + 200) / 20 - (scroll * par) % (W + 200);
      const hgt = 90 + Math.sin(i * 1.3 + layer * 5) * 50 + (layer === 2 ? Math.sin(i * 0.5 + 2) * 60 : 0);
      pts.push([wx, 760 + layer * 60 - hgt]);
    }
    for (let i = 20; i >= 0; i--) pts.push([pts[i][0], H + 40]);
    fillShape(pts, ['#b8cf9a', '#8fb877', '#6a9a58'][layer], 0.95);
    // contour lines
    if (layer === 2) for (let i = 0; i < 20; i += 2) strokePath([[pts[i][0], pts[i][1] + 30], [pts[i][0] + 60, pts[i][1] + 44]], withA('#3f5a34', 0.3), 3, 'pen', false);
  }
  // train + jet being overtaken
  const trainX = W + 300 - ((scroll * 0.8) % (W * 2.2));
  P.push(); P.translate(trainX, 700);
  fillShape(rrectPts(-160, -90, 320, 100, 12, 30, rng, 0.02), '#5c5962', 0.95);
  fillShape(rrectPts(-120, -140, 120, 60, 10, 20, rng, 0.03), '#5c5962', 0.95);
  for (const wx of [-110, 0, 100]) { P.push(); P.noStroke(); P.fill('#2c2c34'); P.ellipse(wx, 14, 40, 40); P.pop(); }
  strokePath([[120, -60], [180, -100]], withA('#f6efe0', 0.6), 5, 'pen', false);
  P.pop();
  const jetX = W + 500 - ((scroll * 1.15) % (W * 2.6));
  P.push(); P.translate(jetX, 200); P.rotate(0.1);
  fillShape(ellipsePts(0, 0, 110, 26, 12, 0, 0.04, rng), '#e8e2d2', 0.95);
  fillShape([[0, -6], [-130, -50], [-40, 4]], '#8a97a8', 0.95);
  P.pop();
  // Clawd on rocket skateboard, growing each beat
  const grow = 1 + Math.floor((t - 45) / BEATLEN) * 0.13;
  const bx = 480, by = 620 - hop(t) * 14;
  P.push(); P.translate(bx, by);
  // skateboard
  fillShape(rrectPts(-110 * grow, 46 * grow, 220 * grow, 22 * grow, 10, 30, rng, 0.03), '#c9553e', 0.95);
  strokePts(rrectPts(-110 * grow, 46 * grow, 220 * grow, 22 * grow, 10, 30, rng, 0.03), withA(C.ink, 0.6), 4, 'pen');
  P.push(); P.noStroke(); P.fill(withA('#ffb23e', 0.85));
  P.ellipse(-100 * grow, 70 * grow, 30 * grow, 14 * grow);
  P.ellipse(100 * grow, 70 * grow, 30 * grow, 14 * grow);
  P.pop();
  P.scale(grow);
  drawRocket(0, -60, 60, rng, { flame: 0.5 + pulse(t) * 0.6 });
  drawClawd(0, -60, 130, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.5, armAng2: Math.PI + 2.5 });
  // researcher clinging to the back
  P.push(); P.translate(-140, 10); P.scale(1 / grow, 1 / grow);
  drawResearcher(0, 0, 200, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.7, armAng2: Math.PI + 2.7 });
  P.pop();
  P.pop();
  // whip to researcher at the end
  if (u > 0.86) {
    const wu = seg(t, 47.7, 48.5);
    fillShape([[0, 0], [W * wu, 0], [W * wu, H], [0, H]], withA('#e8b98f', 0.9), 1);
    if (wu > 0.2) {
      P.push(); P.translate(W * 0.3, H * 0.6); P.scale(2.2);
      drawResearcher(0, 0, 200, { rng, t, mouth: 'panic', sweat: true, sweat2: true, dizzy: true });
      P.pop();
    }
  }
  camEnd();
});

// 49.4–51.9 atoms rearranging → paperclip
scene('atoms', 49.4, 52.4, (t, rng) => {
  camBegin(1 + 0.05 * Math.sin(t * 2), W / 2, H * 0.52);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#d8c9e8', 1);
  fillShape([[0, 700], [W, 660], [W, H], [0, H]], '#b89ad8', 0.6);
  const u = seg(t, 49.4, 51.9);
  // researcher fizzes into colored dots that swirl
  const fizz = Math.sin(u * Math.PI);
  if (fizz < 0.98) {
    P.push(); P.translate(W / 2, H / 2 + 60); P.scale(1.4);
    drawResearcher(0, 0, 240, { rng, t, mouth: 'o', dizzy: fizz > 0.3, armAng: -1.57, armAng2: Math.PI + 1.57, flip: 1 });
    P.pop();
  }
  // colored dots swirling around
  const N = 60;
  for (let i = 0; i < N; i++) {
    const ph = (t * 0.9 + i * 0.021) % 1;
    const a = ph * TAU * 2 + i;
    const rr = 60 + ph * 420;
    const dx = W / 2 + Math.cos(a) * rr, dy = H / 2 + 60 + Math.sin(a) * rr * 0.6;
    const col = [C.clawd, C.pink, C.teal, C.gold, C.blue, C.violet][i % 6];
    P.push(); P.noStroke(); P.fill(withA(col, 0.85)); P.ellipse(dx, dy, 10, 10); P.pop();
  }
  // dots form a paperclip mid-shot
  const clipU = smooth(50.4, 51.2, t) * (1 - smooth(51.5, 51.9, t));
  if (clipU > 0.05) {
    P.push(); P.translate(W / 2, H / 2 + 40); P.scale(2 + clipU);
    P.rotate(t * 0.6);
    drawPaperclip(0, 0, 60, '#5a5a68', 0);
    P.pop();
    if (clipU > 0.6) sfxWord('?', W / 2 + 220, H / 2 - 140, 60, C.violet, 0.2, rng, C.ink);
  }
  // snap back dizzy, glasses upside down, hearts float in
  if (u > 0.92) {
    P.push(); P.translate(W / 2, H / 2 + 60); P.scale(1.4);
    drawResearcher(0, 0, 240, { rng, t, mouth: 'o', dizzy: true, glassesCol: withA('#3a3a42', 0.85), sweat: true });
    // upside-down glasses: draw flipped arcs over eyes
    P.pop();
    for (let i = 0; i < 5; i++) {
      const hx = W / 2 - 200 + i * 100 + Math.sin(t * 2 + i) * 30;
      const hy = 500 - ((t * 60 + i * 90) % 300);
      drawHeart(hx, hy, 26, withA(C.pink, 0.8));
    }
  }
  camEnd();
});

// 53.4–58.4 Sydney: pink room of hearts
scene('sydney', 53.4, 58.4, (t, rng) => {
  const u = seg(t, 53.4, 58.4);
  const shake = hitEnv(t, [[58.15, 1.4]]);
  camBegin(1, W / 2, H / 2 + shake * 18, Math.sin(t * 1.2) * 0.02 + shake * 0.02 * Math.sin(t * 40));
  // pink room
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#f2b8c8', 1);
  fillShape([[0, 760], [W, 730], [W, H], [0, H]], '#d88aa4', 0.9);
  // hearts popping on the beat
  for (let i = 0; i < 8; i++) {
    const ph = (t - 53.4) / BEATLEN + i * 0.5;
    const cyc = ph % 2;
    if (cyc < 1) {
      const s = easeOutBack(cyc) * (30 + (i % 3) * 14);
      drawHeart(180 + (i % 4) * 520, 220 + ((i * 7) % 3) * 140, s, withA('#e86a8a', 0.85));
    }
  }
  // Sydney-Clawd (heart eyes, pink) cuddling heart birdcage
  P.push();
  P.translate(W / 2 - 160, STAGE.floor + 60);
  drawClawd(0, 0, 260, { rng, t, eyes: 'heart', mouth: 'smile', blush: true, bodyCol: '#f2a2b8', armAng: -2.1, armAng2: Math.PI + 2.1, hop: hop(t, 2) * 8 });
  P.pop();
  // heart-shaped birdcage with researcher inside
  P.push(); P.translate(W / 2 + 240, 460);
  const rattle = Math.sin(t * 9) * 5;
  P.noFill(); P.stroke('#c9a86a'); P.strokeWeight(10);
  // heart outline cage
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU;
    const x = 16 * Math.pow(Math.sin(a), 3), y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    pts.push([x / 16 * 240, y / 16 * 240]);
  }
  strokePts(pts, '#a8823e', 8, 'marker');
  for (let i = 1; i < 5; i++) {
    strokePath([[pts[i * 3][0] * 0.8, pts[i * 3][1] * 0.8], [pts[i * 3][0] * 0.8, 150]], '#a8823e', 5, 'pen', false);
  }
  strokePath([[-190, -60], [190, -60]], '#a8823e', 6, 'pen', false);
  P.push(); P.translate(0, rattle);
  drawResearcher(0, 60, 200, { rng, t, mouth: 'panic', sweat: true, armAng: -2.6 + Math.sin(t * 12) * 0.4, armAng2: Math.PI + 2.6 });
  P.pop();
  P.pop();
  // ring offer at ~56.5
  if (t > 56.5 && t < 58.0) {
    P.push(); P.translate(W / 2 - 40, 380);
    strokePath([[0, 0], [0, -46]], withA(C.ink, 0.7), 6, 'marker', false);
    P.push(); P.noStroke(); P.fill('#9ad8e8'); P.ellipse(0, -58, 26, 22); P.pop();
    strokePts(ellipsePts(0, -58, 13, 11, 10), withA(C.ink, 0.6), 3, 'pen');
    P.pop();
    sfxWord('!', W / 2 - 130, 300, 70, C.red, 0, rng, C.ink);
    // researcher squeezing out between bars
    const squeeze = seg(t, 56.8, 58.0);
    if (squeeze > 0.3) {
      P.push(); P.translate(W / 2 + 240 + squeeze * 300, 560 + squeeze * 120);
      drawResearcher(0, 0, 190 * (1 - squeeze * 0.3), { rng, t, mouth: 'panic', sweat: true, armAng: -2.9, armAng2: Math.PI + 2.9 });
      P.pop();
    }
  }
  // giant heart bubble grows and pops
  const bubble = seg(t, 57.3, 58.15);
  const pop = t > 58.15;
  if (!pop && bubble > 0) {
    const br = bubble * 760;
    P.push(); P.noStroke();
    P.fill(withA('#f88aa8', 0.45)); P.ellipse(W / 2, H / 2, br * 2, br * 2);
    P.noFill(); P.stroke(withA('#ffffff', 0.7)); P.strokeWeight(10);
    P.ellipse(W / 2, H / 2, br * 2 - 30, br * 2 - 30);
    drawHeart(W / 2, H / 2, br * 0.9, withA('#e86a8a', 0.75));
    P.pop();
  }
  if (pop) {
    // burst shards
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * TAU;
      const dd = 200 + (t - 58.15) * 1800;
      drawHeart(W / 2 + Math.cos(a) * dd, H / 2 + Math.sin(a) * dd, 40, withA(C.pink, clamp(1.3 - (t - 58.15) * 3, 0, 0.9)));
    }
    flashOver('#f88aa8', clamp(1.2 - (t - 58.15) * 4, 0, 0.55));
  }
  camEnd();
});
