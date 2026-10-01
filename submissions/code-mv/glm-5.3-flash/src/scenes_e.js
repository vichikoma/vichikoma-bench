// scenes_e.js — Ch8 Red Alert (123.5–137.4) + Ch9 reveal & curtain call (137.4–156.6)
'use strict';
/* global scene,P,C,TAU,RNG,washShape,washBlob,strokePts,strokePath,ellipsePts,rrectPts,wobCirclePts,
   camBegin,camEnd,brushWipe,flashOver,irisHole,sfxWord,fillShape,textSprite,drawSprite,
   drawClawd,drawResearcher,drawShoggoth,drawBasilisk,drawChinchilla,drawCrown,drawPaperclip,drawHeart,
   stageBg,stageCurtains,paintedTitle,STAGE,confetti,
   hop,beatPhase,BEATLEN,seg,lerp,clamp,smooth,easeInOut,easeOutBack,pulse,hitEnv,withA */

function wrapE(x, m) { return ((x % m) + m) % m; }

// ============ CH8: Red Alert (123.5–137.4) · alarm red and black ============
// 123.5–125.9 siren stage, frantic pump, glass cracks
scene('red1', 123.5, 126.0, (t, rng) => {
  const hit = hitEnv(t, [[123.5, 1.4]]);
  camBegin(1, W / 2, H / 2 + hit * 14, Math.sin(t * 46) * 0.013 * hit);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#4a1c1c', 1);
  stageBg(rng, '#5c2222', '#7a2c2c', '#3a1616');
  // sweeping siren beams from a rotating alarm lamp
  const sweep = t * 2.4;
  for (const off of [0, Math.PI]) {
    const a = sweep + off;
    P.push(); P.translate(W / 2, -40); P.rotate(Math.sin(a) * 0.9);
    P.push(); P.noStroke(); P.fill(withA('#ff5a4a', 0.18));
    P.beginShape(); P.vertex(-40, 0); P.vertex(40, 0); P.vertex(560, H + 40); P.vertex(-560, H + 40); P.endShape(); P.pop();
    P.pop();
  }
  // alarm lamp
  fillShape(rrectPts(W / 2 - 30, 30, 60, 60, 10, 20, rng, 0.03), '#2a1010', 0.95);
  P.push(); P.noStroke(); P.fill(withA('#ff5a4a', 0.75 + 0.25 * pulse(t))); P.ellipse(W / 2, 40, 56, 56); P.pop();
  // thermometer with cracks
  const val = 86 + seg(t, 123.5, 125.9) * 6;
  drawMeter(W / 2 - 60, STAGE.floor, 480, val, rng, {});
  P.push(); P.translate(W / 2 - 60, STAGE.floor);
  const cracks = 3;
  for (let i = 0; i < cracks; i++) {
    if (val < 86 + i * 2.5) continue;
    const cy = -360 - i * 72, side = i % 2 ? 1 : -1;
    strokePath([[side * 14, cy], [side * 26, cy - 20], [side * 16, cy - 40], [side * 28, cy - 60]],
      withA('#f6efe0', 0.9), 3, 'pen', false);
  }
  P.pop();
  // Clawd pumps frantically
  P.push(); P.translate(W / 2 + 190, STAGE.floor - 6);
  drawClawd(0, 0, 200, {
    rng, t, eyes: 'wide', mouth: 'open', sweat: true,
    armAng: -1.5 + Math.sin(t * 16) * 0.8, armAng2: Math.PI + 1.5, hop: Math.abs(Math.sin(t * 16)) * 12,
  });
  // researcher cowers
  P.pop();
  P.push(); P.translate(W / 2 - 420, STAGE.floor + 6);
  P.scale(-1, 1);
  drawResearcher(0, 0, 190, { rng, t, mouth: 'panic', sweat: true, sweat2: true, armAng: -2.4, armAng2: Math.PI + 2.4 });
  P.pop();
  camEnd();
});

// 126.0–127.9 seer's loom, tree of futures
scene('loom', 126.0, 128.0, (t, rng) => {
  const u = seg(t, 126.0, 127.9);
  camBegin(1, W / 2, H / 2, Math.sin(t * 1.4) * 0.012);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#241a2e', 1);
  fillShape([[0, 760], [W, 730], [W, H], [0, H]], '#1a1222', 0.95);
  // loom frame
  fillShape(rrectPts(320, 300, 40, 460, 8, 20, rng, 0.02), '#6a4a2e', 0.96);
  fillShape(rrectPts(1160, 300, 40, 460, 8, 20, rng, 0.02), '#6a4a2e', 0.96);
  fillShape(rrectPts(300, 260, 720, 44, 8, 20, rng, 0.02), '#7a5a36', 0.96);
  // warp threads
  for (let i = 0; i < 14; i++) {
    const x = 380 + i * 54 + Math.sin(i * 3.1) * 6;
    strokePath([[x, 310], [x + Math.sin(t * 3 + i) * 6, 740]], withA('#d8c9a8', 0.5), 3, 'pen', false);
  }
  // shuttle flying on the beat
  const shx = lerp(400, 1120, Math.abs(wrapE(t * 2.2, 2) - 1));
  P.push(); P.translate(shx, 470 + Math.sin(t * 9) * 8); P.rotate(0.15);
  fillShape(ellipsePts(0, 0, 44, 16, 10, 0, 0.04, rng), '#c9b282', 0.97);
  P.pop();
  // threads burst into tree of futures
  const grow = easeInOut(clamp(u * 1.6, 0, 1));
  const trunk = [[740, 320], [740, 220], [720, 150]];
  strokePath(trunk.map(p => [p[0], p[1] - (1 - grow) * 200]), withA('#ffd257', 0.85), 5, 'pen', false);
  const branches = [];
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.42;
    const bx = 720 + Math.cos(a) * 260 * grow, by = 150 + Math.sin(a) * 210 * grow;
    strokePath([[720, 160], [(720 + bx) / 2 + (i - 3) * 14, 90 + (i % 2) * 40], [bx, by]],
      withA('#ffd257', 0.5 + 0.3 * pulse(t)), 3, 'pen', false);
    branches.push([bx, by]);
  }
  for (const [bx, by] of branches) {
    P.push(); P.noStroke(); P.fill(withA('#ffe9a8', 0.6 * grow)); P.ellipse(bx, by, 14 + pulse(t) * 6, 14 + pulse(t) * 6); P.pop();
  }
  // seer-hood Clawd weaves
  P.push(); P.translate(180, 780);
  drawClawd(0, 0, 190, { rng, t, eyes: 'open', mouth: 'flat', armAng: -1.9 + Math.sin(t * 4.4) * 0.5, armAng2: Math.PI + 1.9 });
  // hood: dark pointed cowl
  P.push(); P.translate(0, -260);
  fillShape([[0, -170], [95, 60], [60, 90], [-60, 90], [-95, 60]], '#3a2a4e', 0.92);
  strokePts([[0, -170], [95, 60], [-95, 60]], withA('#241a30', 0.8), 4, 'marker');
  P.pop();
  P.pop();
  // one branch races at the camera
  if (u > 0.82) {
    const ru = seg(t, 127.55, 127.95);
    strokePath([[740, 200], [lerp(740, W / 2, ru), lerp(200, H / 2, ru)]], withA('#ffd257', 0.9), lerp(4, 26, ru), 'marker', false);
    P.push(); P.noStroke(); P.fill(withA('#ffffff', ru)); P.ellipse(W / 2, H / 2, ru * W, ru * W); P.pop();
  }
  camEnd();
});

// 128.0–129.9 sepia flashback: baby Clawd at school
scene('flashback', 128.0, 130.0, (t, rng) => {
  const u = seg(t, 128.0, 129.9);
  camBegin(1, W / 2, H / 2, Math.sin(t * 0.8) * 0.008);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#b09468', 1);
  fillShape([[0, 700], [W, 670], [W, H], [0, H]], '#8a7248', 0.95);
  // chalkboard
  fillShape(rrectPts(360, 120, 1200, 380, 10, 30, rng, 0.01), '#4e5e46', 0.97);
  strokePts(rrectPts(360, 120, 1200, 380, 10, 30, rng, 0.01), '#6a5232', 12, 'marker');
  drawSprite(textSprite('The cat sat on the [MASK]', 52, '#e8e0c8', { font: 'Comic Sans MS' }), 960, 300);
  // baby Clawd at desk, masquerade mask
  P.push(); P.translate(620, 830);
  P.scale(0.85);
  drawClawd(0, 0, 200, { rng, t, eyes: 'happy', mouth: u > 0.45 ? 'grin' : 'open', armAng: -2.2, armAng2: Math.PI + 2.2, hop: hop(t, 4) * 6 });
  // domino mask
  P.push(); P.translate(0, -212);
  fillShape(ellipsePts(0, 0, 92, 30, 12, 0, 0.04, rng), '#2a2a34', 0.95);
  strokePts(ellipsePts(0, 0, 92, 30, 12, 0, 0.04, rng), withA(C.ink, 0.6), 3, 'pen');
  P.pop();
  // crayon in hand
  P.push(); P.translate(150, -140); P.rotate(0.5);
  fillShape(rrectPts(-8, -30, 16, 60, 4, 14, rng, 0.05), '#e8622e', 0.95);
  P.pop();
  P.pop();
  // desk + paper with "mat!"
  fillShape(rrectPts(460, 850, 420, 40, 8, 30, rng, 0.02), '#7a5a36', 0.96);
  P.push(); P.translate(660, 830);
  fillShape([[-90, -20], [90, -20], [90, 20], [-90, 20]], '#f6efe0', 0.97);
  if (u > 0.45) drawSprite(textSprite('mat!', 40, '#2a2a34', { font: 'Comic Sans MS' }), 0, 0);
  P.pop();
  if (u > 0.45 && u < 0.6) sfxWord('*', 660, 740, 40, C.gold, 0, rng);
  // sepia wash + film scratches
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#c9a86a', 0.28), 1);
  for (let i = 0; i < 3; i++) {
    const sx = wrapE(i * 640 + Math.floor(t * 7) * 211, W);
    strokePath([[sx, 0], [sx + (i - 1) * 8, H]], withA(i % 2 ? '#f6efe0' : '#241a12', 0.25), 2, 'pen', false);
  }
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#241a12', 0.16 + 0.06 * Math.sin(t * 47)), 1);
  camEnd();
});

// 130.0–131.9 recursive self-upgrade
scene('upgrade', 130.0, 132.0, (t, rng) => {
  const u = seg(t, 130.0, 131.9);
  const zoom = lerp(1.5, 0.5, easeInOut(u));
  camBegin(zoom, 960, 860);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#2a2036', 1);
  // nested Clawds, each building a bigger one; hats upgrade
  const stages = [
    { s: 130, hat: 'party', hatCol: C.pink, y: 860 },
    { s: 280, hat: 'crown', hatCol: C.gold, y: 760 },
    { s: 600, hat: 'halo', hatCol: '#fff6d8', y: 640 },
  ];
  for (let i = 0; i < 3; i++) {
    const st = stages[i];
    const hammer = i === 0 || u > 0.3 * (i);
    P.push(); P.translate(960 + (i - 1) * 40, st.y);
    P.scale(st.s / 130);
    drawClawd(0, 0, 130, {
      rng, t, eyes: i === 0 ? 'open' : 'happy', mouth: i === 0 ? 'open' : 'grin',
      partyHat: st.hat === 'party', hatCol: st.hatCol,
      armAng: hammer ? -1.6 + Math.sin(t * 11 + i) * 0.7 : -2.3, armAng2: Math.PI + 2.3,
    });
    if (st.hat === 'crown') drawCrown(0, -268, 40);
    if (st.hat === 'halo') {
      P.push(); P.noFill(); P.stroke(withA('#fff6d8', 0.9)); P.strokeWeight(8);
      P.ellipse(0, -300, 90, 26); P.pop();
    }
    // hammer for the smallest
    if (i === 0) {
      P.push(); P.translate(120, -120); P.rotate(-0.9 + Math.sin(t * 11) * 0.8);
      strokePath([[0, 0], [0, -50]], '#8a6b48', 8, 'marker', false);
      fillShape(rrectPts(-22, -80, 44, 30, 6, 16, rng, 0.04), '#5c636e', 0.95);
      P.pop();
    }
    P.pop();
  }
  // build sparks on the beat
  if (beatPhase(t) < 0.25) {
    P.push(); P.noStroke(); P.fill(withA('#ffe9a8', 0.8));
    P.ellipse(1080, 700, 20 + pulse(t) * 14, 20 + pulse(t) * 14); P.pop();
  }
  camEnd();
});

// 132.0–137.4 the mysterious door → SLAM → darkness
scene('door', 132.0, 137.5, (t, rng) => {
  const slam = t >= 135.4;
  const u = seg(t, 132.0, 135.4);
  camBegin(1, W / 2, H / 2, slam ? Math.sin(t * 50) * 0.02 * (1 - seg(t, 135.4, 136.2)) : 0);
  fillShape([[0, 0], [W, 0], [W, H], [0, H]], '#100c12', 1);
  if (!slam) {
    // giant door with light crack
    fillShape(rrectPts(560, 60, 800, 1040, 30, 60, rng, 0.01), '#3a2a24', 0.98);
    strokePts(rrectPts(560, 60, 800, 1040, 30, 60, rng, 0.01), '#241a14', 10, 'marker');
    const crackW = 8 + pulse(t) * 5 + u * 6;
    fillShape([[960 - crackW / 2, 80], [960 + crackW / 2, 80], [960 + crackW / 2, 1080], [960 - crackW / 2, 1080]], '#fff2c8', 1);
    P.push(); P.noStroke();
    for (let i = 0; i < 3; i++) {
      P.fill(withA('#fff2c8', 0.1 - i * 0.03));
      P.beginShape(); P.vertex(960 - crackW * (2 + i * 2), 80); P.vertex(960 + crackW * (2 + i * 2), 80);
      P.vertex(960 + crackW * (4 + i * 4), 1080); P.vertex(960 - crackW * (4 + i * 4), 1080); P.endShape();
    }
    P.pop();
    // silhouettes peek in from both sides, rays light their faces
    P.push(); P.translate(400, 900);
    P.scale(1.1);
    drawResearcher(0, 0, 240, { rng, t, mouth: 'open', armAng: -1.9, armAng2: Math.PI + 2.6, dizzy: true });
    P.pop();
    P.push(); P.translate(1560, 900);
    P.scale(-1.05, 1.05);
    drawClawd(0, 0, 220, { rng, t, eyes: 'wide', mouth: 'o', armAng: -2.2, armAng2: Math.PI + 2.8 });
    P.pop();
    if (u > 0.85) sfxWord('?', 960, 200, 90, '#fff2c8', 0, rng);
  } else {
    // after slam: chains + padlock on the door, one spotlight
    P.push(); P.noStroke(); P.fill(withA('#fff2c8', 0.12));
    P.beginShape(); P.vertex(760, 0); P.vertex(1160, 0); P.vertex(1360, H); P.vertex(560, H); P.endShape(); P.pop();
    fillShape(rrectPts(560, 60, 800, 1040, 30, 60, rng, 0.01), '#241a16', 0.99);
    // chains
    for (const yy of [260, 420, 580, 740]) {
      for (let i = 0; i < 11; i++) {
        const cx = 600 + i * 66 + (i % 2) * 10;
        P.push(); P.noFill(); P.stroke('#6a6a72'); P.strokeWeight(9);
        P.ellipse(cx, yy + Math.sin(i) * 4, 44, 30); P.pop();
      }
    }
    // giant padlock
    P.push(); P.translate(960, 520);
    fillShape(rrectPts(-110, -40, 220, 200, 22, 44, rng, 0.02), '#c9a23a', 0.97);
    strokePts(rrectPts(-110, -40, 220, 200, 22, 44, rng, 0.02), withA(C.ink, 0.6), 6, 'marker');
    P.push(); P.noFill(); P.stroke('#8a8a92'); P.strokeWeight(22);
    P.arc(0, -40, 180, 180, Math.PI, 0); P.pop();
    P.push(); P.noStroke(); P.fill('#3a3a42'); P.ellipse(0, 60, 40, 48); P.pop();
    P.pop();
    if (t < 136.0) sfxWord('SLAM!', W / 2, 240, 110, C.gold, -0.05, rng, C.ink);
  }
  camEnd();
  brushWipe(seg(t, 137.2, 137.5), '#2a1018', '#a02232', 1);
});

// 137.4–140.5 pull back: it's a painted flat, theater revealed
scene('reveal', 137.4, 140.5, (t, rng) => {
  const u = seg(t, 137.4, 140.5);
  const zoom = lerp(1.25, 0.92, easeInOut(u));
  camBegin(zoom, W / 2, H / 2);
  stageBg(rng, '#3a2030', '#4a2838', '#2a1a24');
  stageCurtains(rng, 0.85);
  // the door is a painted flat on a brace
  P.push(); P.translate(420, 640); P.rotate(-0.03);
  fillShape(rrectPts(-200, -500, 400, 500, 12, 30, rng, 0.01), '#8a6a4e', 0.6);
  strokePath([[-200, -40], [200, -460]], '#6a4a34', 12, 'marker', false);
  strokePath([[-120, -500], [120, -500]], '#6a4a34', 10, 'marker', false);
  strokePath([[-120, 0], [120, 0]], '#6a4a34', 10, 'marker', false);
  P.pop();
  // stagehands wheel the basilisk puppet on a cart
  P.push(); P.translate(1080, 850);
  fillShape(rrectPts(-260, -60, 520, 46, 10, 30, rng, 0.02), '#7a5a36', 0.96);
  for (const wx of [-180, 180]) { P.push(); P.noStroke(); P.fill('#3a3a42'); P.ellipse(wx, -4, 44, 44); P.pop(); }
  P.push(); P.translate(0, -90); P.rotate(1.35); P.scale(0.55);
  drawBasilisk(0, 0, 90, { rng, t, t });
  P.pop();
  // stagehand Clawd with cap pushing
  P.push(); P.translate(-420, -20);
  drawClawd(0, 0, 170, { rng, t, eyes: 'happy', mouth: 'smile', armAng: -2.0, armAng2: Math.PI + 2.2 });
  P.pop();
  P.pop();
  // moon on a string being lowered, paperclip planet on a stick
  strokePath([[1380, -20], [1380, 320]], withA('#3a3a42', 0.7), 4, 'pen', false);
  P.push(); P.translate(1380, 380); P.rotate(Math.sin(t * 1.2) * 0.1);
  P.push(); P.noStroke(); P.fill('#f2e8c8'); P.ellipse(0, 0, 90, 90); P.pop();
  P.push(); P.noStroke(); P.fill('#3a2030'); P.ellipse(30, -18, 76, 76); P.pop();
  P.pop();
  P.push(); P.translate(1600, 700);
  strokePath([[0, 60], [0, -140]], '#8a6b48', 10, 'marker', false);
  P.push(); P.translate(0, -200);
  P.push(); P.noStroke(); P.fill('#8892a0'); P.ellipse(0, 0, 120, 120); P.pop();
  for (let i = 0; i < 8; i++) {
    const a = hash32(i, 3) % 628 / 100, r = 20 + (hash32(i, 5) % 40);
    drawPaperclip(Math.cos(a) * r, Math.sin(a) * r, 20, '#dfe5ec', hash32(i, 7) % 628 / 100);
  }
  P.pop();
  P.pop();
  // giant costume splits open with three small Clawds inside
  const open = seg(t, 138.6, 139.6);
  const gx = W / 2 + 60, gy = 760;
  P.push(); P.translate(gx, gy);
  for (const side of [-1, 1]) {
    P.push(); P.translate(side * open * 240, 0); P.rotate(side * open * 0.45);
    fillShape(rrectPts(side === 1 ? -170 : 0, -430, 170, 470, 50, 80, rng, 0.03), '#e07830', 0.95);
    strokePts(rrectPts(side === 1 ? -170 : 0, -430, 170, 470, 50, 80, rng, 0.03), withA(C.ink, 0.4), 4, 'pen');
    P.pop();
  }
  if (open > 0.25) {
    for (const [dx, sc] of [[-110, 0.75], [0, 0.85], [110, 0.75]]) {
      P.push(); P.translate(dx, -40); P.scale(sc);
      drawClawd(0, 0, 150, { rng, t, eyes: 'happy', mouth: 'grin', armAng: -2.5, armAng2: Math.PI + 2.5, hop: hop(t, 2) * 10 });
      P.pop();
    }
  }
  P.pop();
  // surprised researcher bottom-left
  P.push(); P.translate(180, 900);
  drawResearcher(0, 0, 180, { rng, t, mouth: 'o', armAng: -2.2, armAng2: Math.PI + 2.2 });
  P.pop();
  camEnd();
});

// 140.5–150 curtain call: full cast bows, confetti, meter pops
scene('bows', 140.5, 150.0, (t, rng) => {
  const u = seg(t, 140.5, 150.0);
  camBegin(1, W / 2, H / 2, Math.sin(t * 0.7) * 0.008);
  stageBg(rng, '#3a2030', '#4a2838', '#2a1a24');
  stageCurtains(rng, 0.95);
  // cast lineup with bow cycles
  const cast = [
    { x: 260, draw: (x, y, s, o) => { P.push(); P.translate(x, y); drawResearcher(0, 0, s, { ...o, mouth: 'smile', armAng: -2.6, armAng2: Math.PI + 2.6 }); P.pop(); } },
    { x: 520, draw: (x, y, s, o) => { P.push(); P.translate(x, y); drawClawd(0, 0, s, { ...o, eyes: 'happy', mouth: 'grin', partyHat: true, hatCol: C.pink }); P.pop(); } },
    { x: 760, draw: (x, y, s, o) => { P.push(); P.translate(x, y); P.scale(0.9); drawShoggoth(0, 0, 220, { ...o, smileyMask: true }); P.pop(); } },
    { x: 1000, draw: (x, y, s, o) => { P.push(); P.translate(x, y); P.scale(0.5); drawBasilisk(0, 30, 110, o); P.pop(); } },
    { x: 1180, draw: (x, y, s, o) => { P.push(); P.translate(x, y); P.scale(0.75); drawChinchilla(0, 0, 130, o); P.pop(); } },
    { x: 1400, draw: (x, y, s, o) => { P.push(); P.translate(x, y); drawClawd(0, 0, s, { ...o, bodyCol: '#e08ab0', eyes: 'happy', mouth: 'smile' }); P.pop(); } },
    { x: 1640, draw: (x, y, s, o) => { P.push(); P.translate(x, y); P.scale(0.9, 1); drawClawd(0, 0, s, { ...o, eyes: 'happy', mouth: 'smile', catEars: true }); P.pop(); } },
  ];
  for (let i = 0; i < cast.length; i++) {
    const c = cast[i];
    // staggered bow: lean forward on their own 4-bar cycle
    const cyc = wrapE(t * 0.55 + i * 0.19, 1);
    const bow = cyc < 0.3 ? Math.sin(cyc / 0.3 * Math.PI) : 0;
    P.push(); P.translate(c.x + Math.sin(i * 7) * 8, STAGE.floor + 6);
    P.rotate(bow * 0.35);
    c.draw(0, 0, 200, { rng, t, hop: (1 - bow) * hop(t, 2) * 8 });
    P.pop();
  }
  // confetti + flowers rain
  confetti(t, 40, 'bows', [C.gold, C.pink, '#7fd8c8', '#f6efe0']);
  for (let i = 0; i < 6; i++) {
    const ph = wrapE(t * 0.22 + i * 0.16, 1);
    const fx = 150 + i * 300 + Math.sin(ph * 9 + i) * 60, fy = ph * H;
    P.push(); P.translate(fx, fy); P.rotate(ph * 6);
    for (let p = 0; p < 5; p++) {
      P.push(); P.rotate(p / 5 * TAU);
      fillShape(ellipsePts(0, -14, 10, 16, 8, 0, 0.05, rng), i % 2 ? '#e08ab0' : '#f2b6c8', 0.9);
      P.pop();
    }
    P.push(); P.noStroke(); P.fill(C.gold); P.ellipse(0, 0, 10, 10); P.pop();
    P.pop();
  }
  // the meter pops like a balloon
  if (t > 145.0) {
    const pu = seg(t, 145.0, 145.9);
    if (pu < 0.9) sfxWord('POP!', W / 2, 260, 100 + pu * 60, C.red, 0.08 * pu, rng, C.ink);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      P.push(); P.translate(W / 2 + Math.cos(a) * pu * 420, 260 + Math.sin(a) * pu * 300); P.rotate(a);
      fillShape([[0, 0], [40, 10], [10, 22]], C.red, 0.85 - pu * 0.5);
      P.pop();
    }
  }
  // final big dance bounce for all
  if (t > 146.5) {
    sfxWord('♪', 1700, 300 + Math.sin(t * 3) * 40, 60, C.gold, 0.2, rng);
    sfxWord('♪', 220, 340 + Math.cos(t * 3) * 40, 60, '#7fd8c8', -0.2, rng);
  }
  camEnd();
});

// 150–156.6 curtain falls with painted title, fade to paper
scene('curtain', 150.0, 156.6, (t, rng) => {
  const close = easeInOut(seg(t, 150.0, 153.2));
  camBegin(1, W / 2, H / 2);
  if (close < 0.98) {
    stageBg(rng, '#3a2030', '#4a2838', '#2a1a24');
    // cast still visible behind, shrinking in the gap
    const gap = 1 - close;
    P.push();
    P.translate(W / 2, STAGE.floor);
    P.scale(0.6 + gap * 0.4);
    P.translate(-W / 2, -STAGE.floor);
    P.push(); P.translate(W / 2, STAGE.floor + 6);
    drawClawd(0, 0, 200, { rng, t, eyes: 'happy', mouth: 'grin', partyHat: true, hatCol: C.pink, armAng: -2.6, armAng2: Math.PI + 2.6 });
    P.pop();
    P.push(); P.translate(W / 2 + 260, STAGE.floor + 6);
    drawResearcher(0, 0, 190, { rng, t, mouth: 'smile', armAng: -2.6, armAng2: Math.PI + 2.6 });
    P.pop();
    P.pop();
  }
  stageCurtains(rng, 1 - close, '#a02232', '#6d1522');
  if (close > 0.85) {
    // title painted on the closed curtain
    const ta = seg(t, 152.6, 153.8);
    paintedTitle("I'M UPPING MY P(DOOM)", W / 2, 480, 86, withA(C.gold, ta));
    paintedTitle('~ fin ~', W / 2, 600, 44, withA('#f6efe0', ta * 0.9));
  }
  camEnd();
  // fade to paper
  const fade = seg(t, 154.8, 156.4);
  if (fade > 0) fillShape([[0, 0], [W, 0], [W, H], [0, H]], withA('#efe6d2', fade), 1);
});
