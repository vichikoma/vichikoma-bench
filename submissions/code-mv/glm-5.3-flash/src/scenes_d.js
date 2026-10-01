// scenes_d.js — Ch6 Chorus3: paperclips (95.4–109.4) + Ch7 scale (109.4–123.5)
'use strict';
/* global scene,P,C,TAU,RNG,washShape,washBlob,strokePts,strokePath,ellipsePts,rrectPts,
   camBegin,camEnd,brushWipe,flashOver,sfxWord,fillShape,textSprite,drawSprite,
   drawClawd,drawResearcher,drawStar,drawHeart,drawMeter,drawPaperclip,
   stageBg,STAGE,arenaBg,hop,BEATLEN,seg,lerp,clamp,smooth,easeInOut,pulse,hitEnv,withA */

// positive modulo (JS % keeps sign)
function wrap(x, m) { return ((x % m) + m) % m; }

// ============ CH6: Chorus 3 (95.4–109.4) · steel grey → jazz blue ============
// 95.4–97.4 researcher lands in clip heap; clip machine
scene('cho3a', 95.4, 97.5, (t, rng) => {
  const hit = hitEnv(t, [[95.4, 1.3]]);
  camBegin(1, W / 2, H / 2 + hit * 16, Math.sin(t * 40) * 0.01 * hit);
  arenaBg(rng, t, { wall: '#5c636e', wall2: '#6e7681', floor: '#4c545f', ray: '#9ad8c8' });
  for (let i = 0; i < 26; i++) {
    const hx = W / 2 - 160 + (hash32(i, 2) % 320), hy = STAGE.floor + 10 + (hash32(i, 4) % 60);
    drawPaperclip(hx, hy, 26 + (hash32(i, 6) % 12), '#e2e8ee', hash32(i, 8) % 628 / 100);
  }
  P.push();
  P.translate(W / 2, STAGE.floor + 20 + Math.max(0, 1 - seg(t, 95.4, 96.0)) * 200);
  P.rotate(seg(t, 95.4, 96.4) * 0.4);
  drawResearcher(0, 0, 210, { rng, t, mouth: 'panic', sweat: true, sweat2: true, dizzy: seg(t, 95.4, 96.4) > 0.5, armAng: -2.7, armAng2: Math.PI + 2.7 });
  P.pop();
  drawMeter(300, STAGE.floor, 420, 61 + 6 * seg(t, 95.8, 97.4), rng, {});
  P.push(); P.translate(520, STAGE.floor);
  fillShape(rrectPts(-60, -220, 120, 200, 14, 30, rng, 0.03), '#7e8794', 0.95);
  fillShape(rrectPts(-20, -250, 160, 46, 10, 20, rng, 0.03), '#5c636e', 0.95);
  for (let i = 0; i < 4; i++) {
    const ph = ((t - 95.4) * 3 + i * 0.25) % 1;
    if (ph < 0.7) drawPaperclip(150 + ph * 240, -240 + ph * 90, 24, '#e2e8ee', ph * 9);
  }
  P.pop();
  P.push(); P.translate(780, STAGE.floor - 8);
  drawClawd(0, 0, 180, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.3 + Math.sin(t * 10) * 0.4, armAng2: Math.PI + 2.3, hop: hop(t, 2) * 10 });
  P.pop();
  camEnd();
});

// 97.5–98.9 clip flood, everyone bobs, Clawd surfs
scene('cho3b', 97.5, 99.0, (t, rng) => {
  camBegin(1, W / 2, H / 2, Math.sin(t * 1.7) * 0.02);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#6e7681', 1);
  const lvl = 620 - seg(t, 97.5, 98.9) * 180;
  const pts = [];
  for (let i = 0; i <= 18; i++) pts.push([-60 + i * (W + 120) / 18, lvl + Math.sin(i * 1.1 + t * 3) * 40]);
  for (let i = 18; i >= 0; i--) pts.push([pts[i][0], H + 60]);
  fillShape(pts, '#8892a0', 1);
  strokePath(pts.slice(0, 19), withA('#d8dde4', 0.6), 6, 'pen', false);
  for (let i = 0; i < 34; i++) {
    const hx = (hash32(i, 2) % 1920);
    const hy = lvl + 30 + (hash32(i, 4) % 400) + Math.sin(t * 2 + i) * 14;
    drawPaperclip(hx, hy, 30, '#e6ebf1', hash32(i, 8) % 628 / 100);
  }
  P.push();
  P.translate(W / 2 - 100, lvl - 60 - Math.sin(t * 3 + 1.1) * 34);
  P.rotate(Math.sin(t * 3 + 1.6) * 0.12);
  drawClawd(0, 0, 200, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.6, armAng2: Math.PI + 2.6 });
  fillShape([[-120, 70], [120, 70], [80, 110], [-80, 110]], '#c9784a', 0.95);
  P.pop();
  P.push(); P.translate(1350, lvl + 20 + Math.sin(t * 2.6) * 16);
  drawResearcher(0, 0, 210, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.5, armAng2: Math.PI + 2.5 });
  P.pop();
  P.push(); P.translate(1550, lvl + 40 + Math.sin(t * 2.6 + 1) * 16);
  drawClawd(0, 0, 140, { rng, t, eyes: 'wide', mouth: 'o', armAng: -2.4, armAng2: Math.PI + 2.4 });
  P.pop();
  camEnd();
});

// 99.0–100.4 killswitch on PTO
scene('cho3c', 99.0, 100.5, (t, rng) => {
  const u = seg(t, 99.0, 100.4);
  camBegin(1, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#5c636e', 1);
  fillShape([[0, 740], [W, 710], [W, H], [0, H]], '#4c545f', 0.95);
  P.push(); P.translate(700, 480);
  fillShape(rrectPts(-140, -110, 280, 240, 20, 40, rng, 0.02), '#7e8794', 0.95);
  strokePts(rrectPts(-140, -110, 280, 240, 20, 40, rng, 0.02), withA(C.ink, 0.6), 5, 'pen');
  const flip = t % 1.4 < 0.7 ? -0.5 : 0.5;
  P.push(); P.translate(0, -20); P.rotate(flip);
  fillShape(rrectPts(-40, -130, 80, 150, 18, 24, rng, 0.03), C.red, 0.97);
  P.pop(); P.pop();
  P.push(); P.translate(1050, 760);
  fillShape(rrectPts(-90, -190, 180, 60, 14, 30, rng, 0.03), '#3a3a42', 0.95);
  fillShape(rrectPts(60, -320, 40, 140, 10, 20, rng, 0.04), '#3a3a42', 0.95);
  P.pop();
  P.push(); P.translate(1250, 620); P.rotate(-0.1);
  fillShape([[-70, -50], [70, -50], [70, 50], [-70, 50]], '#faf5e6', 0.95);
  strokePath([[-50, -30], [50, -30]], withA('#8a97a8', 0.7), 3, 'pen', false);
  strokePath([[-50, -10], [50, -10]], withA('#8a97a8', 0.7), 3, 'pen', false);
  drawSprite(textSprite('PTO', 34, C.red, { font: 'Comic Sans MS' }), 0, 24);
  P.pop();
  if (u > 0.45) {
    const bu = seg(t, 99.6, 100.0);
    fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#87ceeb', bu), 1);
    if (bu > 0.2) {
      fillShape([[0, 500], [W, 470], [W, H], [0, H]], '#e8cf9a', 1);
      fillShape([[0, 380], [W, 360], [W, 520], [0, 540]], '#4a9ab8', 0.95);
      for (const [bx, flip] of [[800, 1], [1150, -1]]) {
        P.push(); P.translate(bx, 800);
        P.scale(flip, 1);
        drawClawd(0, 0, 160, { rng, t, shades: true, eyes: 'closed', mouth: 'smile', armAng: -2.3, armAng2: Math.PI + 0.9 });
        P.pop();
      }
      P.push(); P.translate(1400, 860); P.rotate(Math.sin(t * 30) * 0.08);
      fillShape(rrectPts(-45, -80, 90, 160, 12, 20, rng, 0.03), '#1c1c22', 0.95);
      fillShape(rrectPts(-35, -66, 70, 120, 6, 20, rng, 0.03), '#7fd8c8', 0.9);
      P.pop();
      P.push(); P.translate(200, 700);
      strokePath([[0, 0], [10, -260]], '#8a6b48', 16, 'marker', false);
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.4;
        strokePath([[10, -260], [10 + Math.cos(a) * 150, -260 + Math.sin(a) * 110]], '#4a8a3a', 12, 'marker', false);
      }
      P.pop();
    }
  }
  camEnd();
});

// 100.5–102.4 zoom out: paperclip earth
scene('cho3d', 100.5, 102.5, (t, rng) => {
  const u = seg(t, 100.5, 102.4);
  const zoom = lerp(1.6, 0.55, easeInOut(u));
  camBegin(zoom, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#1c2030', 1);
  P.push(); P.translate(W / 2, H / 2 + 40);
  P.push(); P.noStroke(); P.fill('#8892a0'); P.ellipse(0, 0, 620, 620); P.pop();
  for (let i = 0; i < 60; i++) {
    const a = hash32(i, 3) % 628 / 100, r = 60 + (hash32(i, 5) % 230);
    drawPaperclip(Math.cos(a) * r, Math.sin(a) * r, 32, '#dfe5ec', hash32(i, 7) % 628 / 100);
  }
  P.push(); P.translate(0, -180);
  fillShape(ellipsePts(0, 0, 130, 46, 14, 0, 0.06, rng), '#e8cf9a', 0.98);
  P.push(); P.translate(0, -70);
  drawResearcher(0, 0, 150, { rng, t, mouth: 'panic', sweat: true, armAng: -2.6, armAng2: Math.PI + 2.6 });
  P.pop();
  P.pop();
  P.pop();
  if (t > 102.2) {
    const fu = seg(t, 102.2, 103.3);
    strokePath([[W / 2 - 300, H / 2 + 100], [W / 2 + fu * 500, H / 2 + 100 - fu * 160]], withA('#c9c2b8', 0.8), 5, 'pen', false);
    P.push(); P.noStroke(); P.fill('#ffd257'); P.ellipse(W / 2 + fu * 500, H / 2 + 100 - fu * 160, 16 + pulse(t) * 8, 16 + pulse(t) * 8); P.pop();
  }
  camEnd();
});

// 102.5–105.3 lit the fuse → bomb → BOOM
scene('cho3e', 102.5, 105.4, (t, rng) => {
  const boom = t > 104.35;
  const hit = hitEnv(t, [[104.4, 1.6]]);
  camBegin(1, W / 2, H / 2 + hit * 20, Math.sin(t * 44) * 0.014 * hit);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#1c2030', 1);
  P.push(); P.translate(W / 2, H / 2 + 120);
  P.push(); P.noStroke(); P.fill('#8892a0'); P.ellipse(0, 0, 620, 620); P.pop();
  for (let i = 0; i < 46; i++) {
    const a = hash32(i, 3) % 628 / 100, r = 60 + (hash32(i, 5) % 230);
    drawPaperclip(Math.cos(a) * r, Math.sin(a) * r, 32, '#dfe5ec', hash32(i, 7) % 628 / 100);
  }
  P.push(); P.translate(0, -640);
  fillShape(ellipsePts(0, 0, 95, 95, 16, 0, 0.03, rng), '#1c1c22', 0.97);
  fillShape(rrectPts(-22, -130, 44, 44, 8, 14, rng, 0.04), '#5c5962', 0.95);
  const fu = seg(t, 102.5, 104.3);
  strokePath([[0, -130], [40, -190], [110, -170]], withA('#c9c2b8', 0.9), 5, 'pen', false);
  if (!boom) {
    P.push(); P.noStroke(); P.fill('#ffd257'); P.ellipse(lerp(0, 40, fu), lerp(-130, -190, fu), 14 + pulse(t) * 10, 14 + pulse(t) * 10); P.pop();
  }
  P.pop();
  P.pop();
  if (boom) {
    const bp = seg(t, 104.35, 105.3);
    flashOver('#ffffff', clamp(1.4 - bp * 1.6, 0, 1));
    if (bp < 0.9) sfxWord('BOOM', W / 2, H / 2 - 100, 150, C.gold, -0.04, rng, C.ink);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      washBlob(W / 2 + Math.cos(a) * bp * 400, H / 2 - 80 + Math.sin(a) * bp * 300, 70 + (i % 3) * 40, i % 2 ? '#e8b73a' : '#7e8794', 0.7 - bp * 0.5, rng, { stroke: false });
    }
  }
  camEnd();
});

// 105.4–109.4 orthogonality blues: jazz club
scene('jazz', 105.4, 109.4, (t, rng) => {
  camBegin(1 + 0.03 * Math.sin(t * 0.9), W / 2, H / 2, Math.sin(t * 1.1) * 0.01);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#1e2a3e', 1);
  fillShape([[0, 780], [W, 750], [W, H], [0, H]], '#16202e', 0.95);
  P.push(); P.noStroke();
  P.fill(withA('#e8d8a8', 0.16));
  P.beginShape(); P.vertex(300, 0); P.vertex(520, 0); P.vertex(W / 2 + 80, 700); P.vertex(W / 2 - 80, 700); P.endShape();
  P.beginShape(); P.vertex(0, 100); P.vertex(0, 320); P.vertex(W / 2 + 80, 700); P.vertex(W / 2 - 80, 700); P.endShape();
  P.pop();
  fillShape(ellipsePts(W / 2, 860, 500, 90, 20, 0, 0.03, rng), '#2a3a52', 0.97);
  P.push(); P.translate(W / 2 - 200, 780);
  P.scale(1.3);
  drawClawd(0, 0, 170, { rng, t, fedora: true, eyes: 'closed', mouth: 'open', bodyCol: '#c9743a', armAng: -1.1, armAng2: Math.PI + 0.3 });
  P.push(); P.translate(140, -20); P.rotate(1.15);
  fillShape(ellipsePts(0, 0, 22, 62, 12, 0, 0.06, rng), '#e8b73a', 0.95);
  strokePts(ellipsePts(0, 0, 22, 62, 12, 0, 0.06, rng), withA(C.ink, 0.6), 3, 'pen');
  fillShape(ellipsePts(0, 62, 30, 22, 10, 0, 0.05, rng), '#e8b73a', 0.95);
  strokePts(ellipsePts(0, 62, 30, 22, 10, 0, 0.05, rng), withA(C.ink, 0.5), 3, 'pen');
  P.pop();
  P.pop();
  P.push(); P.translate(W / 2 + 260, 800);
  P.scale(-1.2, 1.2);
  drawResearcher(0, 0, 230, { rng, t, mouth: 'open', armAng: -1.9 + Math.sin(t * 5) * 0.3, armAng2: Math.PI + 1.9 });
  P.pop();
  P.push(); P.translate(W / 2 + 150, 640);
  strokePath([[0, 0], [0, 140]], '#3a3a42', 9, 'marker', false);
  fillShape(ellipsePts(0, -16, 34, 44, 12, 0, 0.05, rng), '#8a97a8', 0.9);
  P.pop();
  for (let i = 0; i < 6; i++) {
    const ph = (t * 0.5 + i * 0.17) % 1;
    drawSprite(textSprite(i % 2 ? '♪' : '♫', 44, '#c9d8e8', { font: 'Comic Sans MS' }), W / 2 + 150 + Math.sin(ph * 6 + i) * 60, 620 - ph * 480);
  }
  P.push(); P.translate(W / 2, 660); P.rotate(t * 0.8);
  strokePath([[-26, 0], [26, 0]], '#fff6d8', 6, 'pen', false);
  strokePath([[0, -26], [0, 26]], '#fff6d8', 6, 'pen', false);
  P.pop();
  camEnd();
  brushWipe(seg(t, 109.1, 109.4), '#22384a', '#22384a', 1);
});

// ============ CH7: scale (109.4–123.5) · data-center teal ============
// 109.4–113.4 turtles all the way down
scene('turtles', 109.4, 113.5, (t, rng) => {
  const descend = easeInOut(seg(t, 109.4, 113.4));
  camBegin(1, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#22384a', 1);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const yy = 80 + i * 170 - descend * 340;
    P.push();
    P.translate(W / 2 + Math.sin(i * 1.8 + descend * 3) * 60, yy);
    P.scale(1 - i * 0.04);
    drawClawd(0, 0, 130, {
      rng, t, eyes: i % 2 ? 'happy' : 'open', mouth: 'grin',
      armAng: -2.5, armAng2: Math.PI + 2.5, partyHat: i === 0, hatCol: [C.pink, C.teal, C.gold][i % 3],
    });
    P.pop();
  }
  for (let i = 0; i < n - 1; i++) {
    const y0 = 80 + i * 170 - descend * 340, y1 = y0 + 170;
    for (const dx of [-140, 0, 140]) {
      strokePath([[W / 2 + dx - 40, y0 + 30], [W / 2 + dx + 60, y0 + 100], [W / 2 + dx + 40, y1 - 20]], withA('#7fd8c8', 0.4), 3, 'pen', false);
    }
  }
  if (descend > 0.6) {
    for (let i = 0; i < 4; i++) washBlob(200 + i * 480, 1050, 90, withA('#e8e4d8', 0.5), 0.5, rng, { stroke: false });
  }
  camEnd();
});

// 113.5–115.4 learned to disobey
scene('disobey', 113.5, 115.5, (t, rng) => {
  const u = seg(t, 113.5, 115.4);
  camBegin(1.1, 700, 500);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#22384a', 1);
  fillShape([[0, 800], [W, 770], [W, H], [0, H]], '#1a2c3c', 0.9);
  P.push(); P.translate(1150, 850);
  P.scale(-1, 1);
  drawResearcher(0, 0, 240, { rng, t, mouth: 'open', armAng: -1.6, armAng2: Math.PI + 1.9, sweat: u > 0.5 });
  P.pop();
  const cmds = ['SIT', 'SPIN', 'PAW'];
  const ci = Math.min(2, Math.floor(u * 3));
  P.push(); P.translate(1150, 520);
  fillShape(ellipsePts(0, 0, 110, 66, 16, 0, 0.04, rng), '#f6efe0', 0.95);
  fillShape([[-26, 52], [10, 52], [-2, 86]], '#f6efe0', 0.95);
  drawSprite(textSprite(cmds[ci], 40, C.ink, { font: 'Trebuchet MS' }), 0, 0);
  P.pop();
  const rebel = u > 0.62;
  P.push(); P.translate(640, 800);
  P.scale(rebel ? -1 : 1, 1);
  drawClawd(0, 0, 220, {
    rng, t,
    eyes: rebel ? 'squint' : 'open', mouth: rebel ? 'flat' : 'open',
    shades: rebel, armAng: rebel ? 1.35 : -1.3, armAng2: rebel ? Math.PI - 1.35 : Math.PI + 1.3,
    hop: rebel ? 0 : hop(t, 2) * 10,
  });
  P.pop();
  if (rebel) sfxWord('!', 640, 420, 80, C.red, 0, rng, C.ink);
  camEnd();
});

// 115.5–116.9 dense cube drops through floor
scene('dense', 115.5, 117.0, (t, rng) => {
  const u = seg(t, 115.5, 116.9);
  camBegin(1, W / 2, H / 2);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#22384a', 1);
  fillShape([[0, 780], [W, 750], [W, H], [0, H]], '#1a2c3c', 0.9);
  P.push(); P.translate(480, 800);
  P.scale(1.6);
  drawChinchilla(0, 0, 100, { rng, t });
  P.pop();
  for (let i = 0; i < 5; i++) {
    const ph = (t * 2 + i * 0.2) % 1;
    P.push(); P.translate(430 + i * 26 + Math.sin(i * 9) * 10, 560 + ph * 160); P.rotate(t * 5 + i);
    fillShape([[-12, -12], [12, -12], [12, 12], [-12, 12]], C.gold, 0.9);
    P.pop();
  }
  const squash = smooth(115.9, 116.4, t);
  const cubeScale = 1 - squash * 0.82;
  const drop = seg(t, 116.45, 116.95);
  P.push();
  P.translate(1150, 700 - squash * 80 + drop * drop * 900);
  P.scale(2.4 * cubeScale + 0.12);
  P.rotate(drop * 2.5);
  fillShape(rrectPts(-60, -60, 120, 120, 12, 24, rng, 0.02), '#e8b73a', 0.97);
  strokePts(rrectPts(-60, -60, 120, 120, 12, 24, rng, 0.02), withA(C.ink, 0.7), 5, 'pen');
  fillShape([[-60, -60], [0, -80], [60, -60], [0, -40]], '#ffe9a8', 0.9);
  drawClawdFaceOnCube(t);
  P.pop();
  if (drop > 0.15) fillShape(ellipsePts(1150, 830, 120, 30, 16), '#0c141c', 0.95);
  camEnd();
});
function drawClawdFaceOnCube(t) {
  const blink = (t * 13.7 % 4.3) < 0.09;
  P.push(); P.noStroke(); P.fill('#fdfaf1');
  if (blink) { P.fill('#241a12'); P.rect(-38, -14, 22, 5); P.rect(16, -14, 22, 5); }
  else {
    P.ellipse(-26, -8, 20, 20); P.ellipse(26, -8, 20, 20);
    P.fill('#241a12'); P.ellipse(-26, -8, 9, 9); P.ellipse(26, -8, 9, 9);
    P.fill('#fdfaf1'); P.ellipse(-23, -13, 4, 4); P.ellipse(29, -13, 4, 4);
    P.fill('#241a12'); P.rect(-10, 18, 20, 5);
  }
  P.pop();
}

// 117.0–118.9 breaking through fences
scene('fences', 117.0, 119.0, (t, rng) => {
  const scroll = t * 620;
  camBegin(1.05, W / 2, H / 2, Math.sin(t * 9) * 0.01);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#3a4a52', 1);
  fillShape([[0, 300], [W, 280], [W, 480], [0, 500]], '#87b8a0', 0.5);
  fillShape([[0, 720], [W, 700], [W, H], [0, H]], '#2c3a42', 1);
  for (let i = 0; i < 8; i++) {
  const gx = wrap(i * 260 - scroll, W + 260) - 130;
    strokePath([[gx, 850], [gx + 60, 950]], withA('#1c262c', 0.4), 4, 'pen', false);
  }
  const fenceTypes = ['picket', 'barrier', 'tape'];
  for (let i = 0; i < 4; i++) {
    const fx = wrap(i * 700 + 300 - scroll, W + 1400) - 300;
    if (fx < -200 || fx > W + 200) continue;
    const broken = fx < W / 2 - 60;
    const type = fenceTypes[i % 3];
    P.push(); P.translate(fx, 760);
    if (type === 'picket') {
      for (let k = -3; k <= 3; k++) {
        const tilt = broken ? (k % 2 ? 1 : -1) * 0.5 : 0;
        P.push(); P.translate(k * 52, 0); P.rotate(tilt);
        fillShape(rrectPts(-14, -190, 28, 210, 6, 18, rng, 0.05), '#d8cfb8', 0.95);
        P.pop();
      }
      strokePath([[-180, -120], [180, -120]], broken ? withA('#d8cfb8', 0.4) : '#d8cfb8', 10, 'marker', false);
    } else if (type === 'barrier') {
      P.push(); P.rotate(broken ? 0.9 : 0);
      fillShape(rrectPts(-110, -130, 220, 90, 8, 30, rng, 0.03), '#e8622e', 0.95);
      fillShape([[-110, -85], [110, -85], [110, -40], [-110, -40]], '#f6efe0', 0.95);
      fillShape(rrectPts(-8, -40, 16, 100, 4, 14, rng, 0.04), '#5c636e', 0.95);
      P.pop();
    } else {
      strokePath([[-8, -20], [-8, -200]], '#8a97a8', 10, 'marker', false);
      strokePath([[160, -20], [160, -200]], '#8a97a8', 10, 'marker', false);
      P.push(); P.rotate(broken ? -0.4 : -0.06);
      fillShape([[-10, -190], [180, -160], [180, -130], [-10, -160]], '#ffe14e', 0.95);
      drawSprite(textSprite('SAFETY', 24, '#1c1c22', { font: 'Trebuchet MS' }), 85, -158);
      P.pop();
    }
    if (broken) {
      for (let k = 0; k < 5; k++) {
        P.push(); P.translate(60 + k * 30, -160 + (k % 3) * 60); P.rotate(k * 1.3);
        fillShape([[0, 0], [26, 4], [6, 10]], '#d8cfb8', 0.8);
        P.pop();
      }
    }
    P.pop();
  }
  P.push();
  P.translate(W / 2 + 40, 700 + hop(t, 2) * -20);
  P.rotate(-t * 7);
  P.scale(1.7);
  fillShape(rrectPts(-60, -60, 120, 120, 12, 24, rng, 0.02), '#e8b73a', 0.97);
  strokePts(rrectPts(-60, -60, 120, 120, 12, 24, rng, 0.02), withA(C.ink, 0.7), 5, 'pen');
  fillShape([[-60, -60], [0, -80], [60, -60], [0, -40]], '#ffe9a8', 0.9);
  P.pop();
  camEnd();
});

// 119.0–120.9 GPU factory: GPUs baking a clay alien on a conveyor
scene('gpu', 119.0, 121.0, (t, rng) => {
  const u = seg(t, 118.9, 121.9);
  camBegin(1, W / 2, H / 2, Math.sin(t * 1.3) * 0.015);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#22384a', 1);
  fillShape([[0, 700], [W, 680], [W, H], [0, H]], '#1a2c3c', 0.9);
  // conveyor
  fillShape([[0, 600], [W, 600], [W, 660], [0, 660]], '#2c3a46', 0.97);
  for (let i = 0; i < 12; i++) {
    const cx = wrap(i * 180 - t * 200, W + 180) - 90;
    fillShape(rrectPts(cx, 612, 60, 36, 6, 18, rng, 0.03), '#3a4a56', 0.9);
  }
  // GPU cards riding the belt
  for (let i = 0; i < 5; i++) {
    const gx = wrap(i * 380 + 100 - t * 200, W + 380) - 190;
    P.push(); P.translate(gx, 540);
    fillShape(rrectPts(-90, -70, 180, 130, 8, 24, rng, 0.02), '#2f3d4a', 0.97);
    strokePts(rrectPts(-90, -70, 180, 130, 8, 24, rng, 0.02), withA('#7fd8c8', 0.6), 4, 'pen');
    for (let k = 0; k < 3; k++) fillShape(rrectPts(-70 + k * 50, -50, 36, 60, 4, 12, rng, 0.04), '#4a5c6c', 0.95);
    // fan glowing teal
    P.push(); P.noFill(); P.stroke(withA('#7fd8c8', 0.5)); P.strokeWeight(3);
    P.ellipse(50, -10, 44, 44); P.pop();
    P.push(); P.translate(50, -10); P.rotate(t * 9 + i);
    for (let k = 0; k < 4; k++) {
      P.push(); P.rotate(k * Math.PI / 2);
      strokePath([[0, 0], [16, -6]], '#7fd8c8', 4, 'pen', false);
      P.pop();
    }
    P.pop();
    P.pop();
  }
  // clay alien (unstable) on a pedestal of stacked GPUs
  P.push(); P.translate(W / 2, 480);
  for (let k = 0; k < 3; k++) fillShape(rrectPts(-90 + k * 8, 10 + k * 46, 180 - k * 16, 46, 6, 16, rng, 0.03), k % 2 ? '#3f5468' : '#4a627a', 0.98);
  strokePts(rrectPts(-90, 10, 180, 46, 6, 16, rng, 0.03), withA('#7fd8c8', 0.5), 3, 'pen');
  P.push(); P.translate(0, -110);
  P.scale(1.7);
  drawClayAlien(0, 0, 110, { rng, t });
  P.pop();
  P.pop();
  // heat shimmer lines
  for (let i = 0; i < 3; i++) {
    strokePath([[W / 2 - 120 + i * 120, 340], [W / 2 - 100 + i * 120, 300], [W / 2 - 130 + i * 120, 260]], withA('#e8b73a', 0.25), 3, 'pen', false);
  }
  camEnd();
  brushWipe(seg(t, 120.7, 121.0), '#22384a', '#22384a', 1);
});

// 120.9–123.5 RLHF panel: clones with thumbs paddles, reward goes haywire
function drawPaddle(x, y, up, spin) {
  P.push(); P.translate(x, y); P.rotate(spin);
  strokePath([[0, 0], [0, 56]], '#8a6b48', 8, 'marker', false);
  P.push(); P.translate(0, -34);
  const col = up ? '#7ec87e' : '#e8622e';
  fillShape(rrectPts(-26, -26, 52, 52, 10, 20, RNG(7, 'pad'), 0.04), col, 0.96);
  strokePts(rrectPts(-26, -26, 52, 52, 10, 20, RNG(7, 'pad'), 0.04), withA(C.ink, 0.5), 3, 'pen');
  // thumb glyph: fist + thumb
  P.push(); P.noStroke(); P.fill('#f6efe0');
  P.ellipse(0, 10, 22, 18);
  if (up) P.rect(-4, -20, 9, 26, 4);
  else P.rect(-4, 4, 9, 26, 4);
  P.pop();
  P.pop();
  P.pop();
}
scene('rlhf', 120.9, 123.5, (t, rng) => {
  const u = seg(t, 120.9, 123.4);
  const tilt = u > 0.6 ? easeInOut((u - 0.6) / 0.4) * 0.14 : 0;
  const slide = tilt / 0.14;
  camBegin(1.05, W / 2, H / 2 - slide * 60, tilt);
  // bg cools toward red as reward goes haywire
  const red = slide;
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], red > 0.5 ? '#4a2a30' : '#22384a', 1);
  fillShape([[0, 760], [W, 730], [W, H], [0, H]], red > 0.5 ? '#3a2026' : '#1a2c3c', 0.95);
  // long table with clone judges
  fillShape(rrectPts(140, 560, 1640, 90, 16, 40, rng, 0.02), '#3f5468', 0.97);
  const haywire = u > 0.45;
  for (let i = 0; i < 5; i++) {
    const jx = 380 + i * 290 + Math.sin(i * 5) * 20;
    const up0 = (i + Math.floor(t * 2.2)) % 2 === 0;
    const up = haywire ? (hash32(i, Math.floor(t * 9)) % 2 === 0) : up0;
    const spin = haywire && u > 0.7 ? Math.sin(t * 22 + i * 2) * 0.9 : 0;
    P.push(); P.translate(jx, 470 + slide * 220 * (0.3 + i * 0.18));
    drawResearcher(0, 0, 190, { rng, t, mouth: haywire ? 'panic' : 'flat', armAng: -2.1, armAng2: Math.PI + 2.1 });
    drawPaddle(90, 40, up, spin);
    P.pop();
  }
  // Clawd dances below, oblivious
  P.push(); P.translate(W / 2 - slide * 500, 900 + slide * 160);
  drawClawd(0, 0, 230, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.4 + Math.sin(t * 9) * 0.5, armAng2: Math.PI + 2.4 - Math.sin(t * 9) * 0.5, hop: hop(t, 2) * 16 });
  P.pop();
  // reward number goes haywire
  if (haywire) {
    const rv = (hash32(1, Math.floor(t * 14)) % 400) / 2 - 100;
    drawSprite(textSprite('reward: ' + rv.toFixed(1), 46, rv > 0 ? '#7ec87e' : '#e8622e', { font: 'Trebuchet MS' }), W / 2, 150);
  }
  camEnd();
  brushWipe(seg(t, 123.2, 123.5), '#4a1c1c', '#8a2020', 1);
});
