// chars.js — Clawd, the Researcher, monsters, props. All top-left coords, deterministic.
'use strict';
/* global P,C,TAU,INK,washShape,washBlob,strokePts,strokePath,ellipsePts,rrectPts,wobCirclePts,squiggle,lerp,clamp,rrect */

// ---------- shared little helpers ----------
function drawStar(cx, cy, r, col, rot = -Math.PI / 2, inner = 0.45) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = rot + i / 10 * TAU, rr = i % 2 === 0 ? r : r * inner;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  P.push(); P.noStroke(); P.fill(col);
  P.beginShape(); for (const p of pts) P.vertex(p[0], p[1]); P.endShape(P.CLOSE); P.pop();
}
function drawHeart(cx, cy, s, col, strokeCol = null) {
  const pts = [];
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * TAU;
    const x = 16 * Math.pow(Math.sin(a), 3);
    const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
    pts.push([cx + x / 16 * s, cy + y / 16 * s]);
  }
  P.push(); P.noStroke(); P.fill(col);
  P.beginShape(); for (const p of pts) P.vertex(p[0], p[1]); P.endShape(P.CLOSE); P.pop();
  if (strokeCol) { P.push(); P.noFill(); P.stroke(strokeCol); P.strokeWeight(3); P.beginShape(); for (const p of pts) P.vertex(p[0], p[1]); P.endShape(); P.pop(); }
}
function drawPaperclip(cx, cy, s, col = '#9aa3ad', rot = 0) {
  // classic clip: two nested U shapes, stroke only
  P.push(); P.translate(cx, cy); P.rotate(rot);
  strokePath([[-s * .5, -s], [s * .5, -s], [s * .5, s * .8], [-s * .3, s * .8], [-s * .3, -s * .55], [s * .25, -s * .55], [s * .25, s * .45]], col, s * 0.22, 'marker', false);
  P.pop();
}
function drawSweat(x, y, s) {
  P.push(); P.noStroke(); P.fill(withA ? withA('#7db6e0', 0.85) : '#7db6e0');
  P.beginShape();
  P.vertex(x, y - s); P.vertex(x + s * 0.55, y + s * 0.35);
  P.vertex(x, y + s * 0.9); P.vertex(x - s * 0.55, y + s * 0.35);
  P.endShape(P.CLOSE); P.pop();
  P.push(); P.noFill(); P.stroke('#ffffff'); P.strokeWeight(2);
  P.arc(x - s * 0.15, y, s * 0.5, s * 0.7, Math.PI * 0.7, Math.PI * 1.1); P.pop();
}
function drawEmote(x, y, kind, s = 30) {
  if (kind === '!') { P.push(); P.noStroke(); P.fill(C.red); P.rect(x - s * .16, y - s, s * .32, s * 1.3, s * .16); P.ellipse(x, y + s * .9, s * .34, s * .34); P.pop(); }
  else if (kind === '?') { const spr = textSprite('?', s * 2.4, C.blue, { font: 'Comic Sans MS' }); drawSprite(spr, x, y); }
  else if (kind === 'zzz') { drawSprite(textSprite('Z', s * 1.7, '#8f9bc0', { font: 'Comic Sans MS' }), x, y); drawSprite(textSprite('z', s * 1.25, '#8f9bc0', { font: 'Comic Sans MS' }), x + s * 1.05, y - s * 0.85); drawSprite(textSprite('z', s, '#8f9bc0', { font: 'Comic Sans MS' }), x + s * 1.9, y - s * 1.55); }
  else if (kind === 'music') { P.push(); P.noStroke(); P.fill(C.ink); P.ellipse(x - s * .35, y + s * .45, s * .55, s * .42); P.ellipse(x + s * .55, y + s * .3, s * .55, s * .42); P.stroke(C.ink); P.strokeWeight(4); P.line(x - s * .1, y + s * .35, x - s * .08, y - s * .8); P.line(x + s * .8, y + s * .2, x + s * .82, y - s); P.line(x - s * .08, y - s * .8, x + s * .82, y - s); P.pop(); }
}

// ---------- hats / accessories ----------
function drawCrown(cx, cy, s, col = C.gold) {
  P.push(); P.noStroke(); P.fill(col);
  P.beginShape();
  P.vertex(cx - s, cy); P.vertex(cx - s, cy - s * .8); P.vertex(cx - s * .5, cy - s * .35);
  P.vertex(cx, cy - s * 1.1); P.vertex(cx + s * .5, cy - s * .35); P.vertex(cx + s, cy - s * .8);
  P.vertex(cx + s, cy);
  P.endShape(P.CLOSE); P.pop();
  P.push(); P.noFill(); P.stroke(withA(C.redD, .8)); P.strokeWeight(2.5);
  P.line(cx - s, cy, cx + s, cy); P.pop();
  P.push(); P.noStroke(); P.fill(C.red);
  P.ellipse(cx, cy - s * .15, s * .3, s * .3); P.pop();
}
function drawPartyHat(cx, cy, s, col = C.pink) {
  P.push(); P.noStroke();
  P.fill(col); P.triangle(cx - s * .7, cy, cx + s * .7, cy, cx, cy - s * 1.7);
  P.fill(C.gold); P.ellipse(cx, cy - s * 1.7, s * .38, s * .38);
  P.pop();
  strokePath([[cx - s * .7, cy], [cx, cy - s * 1.7], [cx + s * .7, cy]], withA(C.ink, .6), 3, 'marker', false);
}
function drawHardhat(cx, cy, s, col = '#e8c22e') {
  P.push(); P.noStroke(); P.fill(col);
  P.arc(cx, cy, s * 1.8, s * 1.4, Math.PI, 0);
  P.rect(cx - s * 1.05, cy - s * .12, s * 2.1, s * .24, s * .1);
  P.fill(withA('#ffffff', .25)); P.rect(cx - s * .16, cy - s * .95, s * .32, s * .8, s * .15);
  P.pop();
  strokePath([[cx - s * .9, cy], [cx - s * .9, cy - s * .25]], withA(C.ink, .5), 2.5, 'marker', false);
}
function drawFedora(cx, cy, s, col = '#4a4a55') {
  P.push(); P.noStroke();
  P.fill(col); P.ellipse(cx, cy, s * 2.3, s * .5);
  P.rect(cx - s * .75, cy - s * .95, s * 1.5, s, s * .18);
  P.fill(withA('#000000', .3)); P.rect(cx - s * .75, cy - s * .3, s * 1.5, s * .2);
  P.pop();
}
function drawHalo(cx, cy, s) {
  P.push(); P.noFill(); P.stroke(C.gold); P.strokeWeight(7);
  P.ellipse(cx, cy, s * 1.9, s * .55); P.pop();
}
function drawSeerHood(cx, cy, s, col = '#3d3266') {
  P.push(); P.noStroke();
  P.fill(col);
  P.beginShape();
  P.vertex(cx - s, cy + s * .55); P.quadraticVertex(cx - s * 1.1, cy - s * 1.1, cx, cy - s * 1.25);
  P.quadraticVertex(cx + s * 1.1, cy - s * 1.1, cx + s, cy + s * .55);
  P.vertex(cx + s * .62, cy + s * .55);
  P.quadraticVertex(cx + s * .5, cy - s * .5, cx, cy - s * .62);
  P.quadraticVertex(cx - s * .5, cy - s * .5, cx - s * .62, cy + s * .55);
  P.endShape(P.CLOSE); P.pop();
}
function drawSweatband(cx, cy, s) {
  P.push(); P.noStroke(); P.fill('#e8e4ee'); P.rect(cx - s * .8, cy - s * .3, s * 1.6, s * .5, s * .2);
  P.fill(C.red); P.rect(cx - s * .8, cy - s * .12, s * 1.6, s * .14); P.pop();
}
function drawShades(cx, cy, s) {
  P.push(); P.noStroke(); P.fill('#20202a');
  P.rect(cx - s * .85, cy - s * .32, s * .78, s * .64, s * .12);
  P.rect(cx + s * .07, cy - s * .32, s * .78, s * .64, s * .12);
  P.fill('#20202a'); P.rect(cx - s * .12, cy - s * .22, s * .24, s * .1);
  P.pop();
  P.push(); P.noFill(); P.stroke(withA('#ffffff', .5)); P.strokeWeight(2.5);
  P.line(cx - s * .75, cy - s * .18, cx - s * .35, cy - s * .18); P.pop();
}
function drawCatEars(cx, cy, s, bodyCol) {
  P.push(); P.noStroke(); P.fill(bodyCol);
  P.triangle(cx - s * .75, cy - s * .2, cx - s * .1, cy - s * .35, cx - s * .55, cy - s * 1.15);
  P.triangle(cx + s * .75, cy - s * .2, cx + s * .1, cy - s * .35, cx + s * .55, cy - s * 1.15);
  P.fill(C.pink);
  P.triangle(cx - s * .58, cy - s * .38, cx - s * .26, cy - s * .45, cx - s * .48, cy - s * .88);
  P.triangle(cx + s * .58, cy - s * .38, cx + s * .26, cy - s * .45, cx + s * .48, cy - s * .88);
  P.pop();
  strokePath([[cx - s * .75, cy - s * .2], [cx - s * .55, cy - s * 1.15], [cx - s * .1, cy - s * .35]], withA(C.ink, .55), 3, 'marker', false);
  strokePath([[cx + s * .75, cy - s * .2], [cx + s * .55, cy - s * 1.15], [cx + s * .1, cy - s * .35]], withA(C.ink, .55), 3, 'marker', false);
}
function drawMasque(cx, cy, s) {
  P.push(); P.noStroke(); P.fill(withA('#2c2450', .92));
  P.ellipse(cx - s * .42, cy, s * .55, s * .38);
  P.ellipse(cx + s * .42, cy, s * .55, s * .38);
  P.fill(C.gold); P.ellipse(cx, cy - s * .05, s * .3, s * .22);
  P.pop();
}
function drawBowtie(cx, cy, s, col = C.red) {
  P.push(); P.noStroke(); P.fill(col);
  P.triangle(cx - s, cy - s * .45, cx - s, cy + s * .45, cx - s * .12, cy);
  P.triangle(cx + s, cy - s * .45, cx + s, cy + s * .45, cx + s * .12, cy);
  P.ellipse(cx, cy, s * .3, s * .3); P.pop();
}

// ---------- Clawd ----------
const CLAWD_COL = { body: C.clawd, dark: C.clawdD, limb: '#d3700f', outline: withA('#7c3c0e', 0.85) };
// x,y = feet center on ground; h = body height. Deterministic per t via rng.
function drawClawd(x, y, h, o = {}) {
  const rng = o.rng || RNG(0, 'clawd');
  const flip = o.flip || 1;
  const sx = (o.sx || 1) * (o.sy != null ? 2 - o.sy : 1);
  const sy = o.sy || 1;
  const legH = h * 0.22, bw = h * 1.6;
  P.push();
  P.translate(x, y);
  if (o.rot) P.rotate(o.rot);
  P.scale(flip * sx, sy);
  // limbs first (behind body): legs + arms
  const legSpread = bw * 0.26;
  const hopUp = o.hop || 0;
  strokePath([[-legSpread, -legH], [-legSpread, -hopUp * 0.5]], CLAWD_COL.limb, h * 0.16, 'marker', false);
  strokePath([[legSpread, -legH], [legSpread, -hopUp * 0.5]], CLAWD_COL.limb, h * 0.16, 'marker', false);
  P.noStroke(); P.fill(CLAWD_COL.limb);
  P.ellipse(-legSpread, -hopUp * 0.5, h * 0.17, h * 0.12);
  P.ellipse(legSpread, -hopUp * 0.5, h * 0.17, h * 0.12);
  // arms
  const armY = -legH - h * 0.45;
  const armAng = o.armAng != null ? o.armAng : (o.arms === 'up' ? -2.5 : o.arms === 'out' ? 1.35 : 0.9);
  const armAng2 = o.armAng2 != null ? o.armAng2 : (o.arms === 'up' ? -0.65 : o.arms === 'out' ? Math.PI - 1.35 : Math.PI - 0.9);
  const armL = h * 0.34;
  const ax1 = -bw * 0.5, ay1 = armY, ax2 = bw * 0.5;
  strokePath([[ax1, ay1], [ax1 - Math.cos(armAng) * armL, ay1 + Math.sin(armAng) * armL]], CLAWD_COL.limb, h * 0.15, 'marker', false);
  strokePath([[ax2, ay1], [ax2 - Math.cos(armAng2) * armL * -1, ay1 + Math.sin(armAng2) * armL]], CLAWD_COL.limb, h * 0.15, 'marker', false);
  P.noStroke(); P.fill(CLAWD_COL.limb);
  P.ellipse(ax1 - Math.cos(armAng) * armL, ay1 + Math.sin(armAng) * armL, h * 0.16, h * 0.16);
  P.ellipse(ax2 - Math.cos(armAng2) * armL * -1, ay1 + Math.sin(armAng2) * armL, h * 0.16, h * 0.16);
  // body
  const bx = -bw / 2, by = -legH - h;
  const bodyPts = rrectPts(bx, by, bw, h, h * 0.32, h * 0.12, rng, 0.02);
  washShape(bodyPts, o.bodyCol || CLAWD_COL.body, 0.96, rng);
  // lighter belly sheen
  fillShape(ellipsePts(0, by + h * 0.62, bw * 0.3, h * 0.16, 12, 0, 0.15, rng), '#ffd9a0', o.bodyCol ? 0.18 : 0.3);
  strokePts(bodyPts, CLAWD_COL.outline, Math.max(2.5, h * 0.028), 'marker');
  // lid (lunchbox mouth) — open 0..1
  if (o.lidOpen > 0) {
    const lo = o.lidOpen;
    // dark mouth interior at top of body
    P.push(); P.noStroke(); P.fill(withA('#3a1408', 0.9));
    P.beginShape();
    const mx0 = bx + bw * 0.12, mx1 = bx + bw * 0.88, my = by + h * 0.1;
    P.vertex(mx0, my); P.vertex(mx1, my);
    for (let i = 8; i >= 0; i--) P.vertex(lerp(mx0, mx1, i / 8), my + h * 0.3 * lo * Math.sin(Math.PI * i / 8));
    P.endShape(P.CLOSE); P.pop();
    // teeth on lower lip
    P.push(); P.noStroke(); P.fill('#faf6ec');
    for (let i = 0; i < 5; i++) {
      const tx = lerp(mx0 + bw * 0.04, mx1 - bw * 0.04, i / 4);
      P.triangle(tx - bw * 0.035, my + h * 0.26 * lo, tx + bw * 0.035, my + h * 0.26 * lo, tx, my + h * 0.26 * lo + h * 0.12 * lo);
    }
    P.pop();
    // lid flipped open
    P.push();
    P.translate(0, by + h * 0.06); P.rotate(-lo * 1.9);
    const lidPts = rrectPts(-bw * 0.44, -h * 0.22, bw * 0.88, h * 0.22, h * 0.09, h * 0.1, rng, 0.02);
    washShape(lidPts, o.bodyCol || CLAWD_COL.body, 0.96, rng);
    strokePts(lidPts, CLAWD_COL.outline, Math.max(2.5, h * 0.028), 'pen');
    P.noStroke(); P.fill('#faf6ec');
    for (let i = 0; i < 5; i++) {
      const tx = lerp(-bw * 0.38, bw * 0.38, i / 4);
      P.triangle(tx - bw * 0.03, -h * 0.03, tx + bw * 0.03, -h * 0.03, tx, h * 0.12);
    }
    P.pop();
  }
  // face (unflipped coordinates: draw inside same push)
  drawClawdFace(0, by + h * (o.lidOpen > 0 ? 0.62 : 0.46), h, o, rng);
  if (o.blush) {
    P.noStroke(); P.fill(withA(C.blush, 0.35));
    P.ellipse(-bw * 0.3, by + h * 0.55, h * 0.14, h * 0.08);
    P.ellipse(bw * 0.3, by + h * 0.55, h * 0.14, h * 0.08);
  }
  if (o.crown) drawCrown(0, by - h * 0.02, h * 0.24);
  if (o.sweatband) drawSweatband(0, by + h * 0.12, h * 0.5);
  if (o.shades) drawShades(0, by + h * 0.4, h * 0.42);
  if (o.catEars) drawCatEars(0, by + h * 0.05, h * 0.4, o.bodyCol || CLAWD_COL.body);
  if (o.partyHat) drawPartyHat(0, by + h * 0.02, h * 0.3, o.hatCol || C.pink);
  if (o.hardhat) drawHardhat(0, by + h * 0.1, h * 0.42);
  if (o.fedora) drawFedora(0, by + h * 0.06, h * 0.42);
  if (o.halo) drawHalo(0, by - h * 0.08, h * 0.4);
  if (o.seerHood) drawSeerHood(0, by + h * 0.3, h * 0.55);
  if (o.smileyMask) drawSmileyMask(0, by + h * 0.46, h * 0.3);
  if (o.sweat) { P.push(); P.scale(flip, 1); drawSweat(bw * 0.42, by + h * 0.3, h * 0.1); P.pop(); }
  P.pop();
}
function drawSmileyMask(cx, cy, s) {
  P.push(); P.noStroke();
  P.fill('#f7f2df'); P.ellipse(cx, cy, s * 1.5, s * 1.4);
  P.fill('#20202a');
  P.ellipse(cx - s * .35, cy - s * .18, s * .16, s * .22);
  P.ellipse(cx + s * .35, cy - s * .18, s * .16, s * .22);
  P.noFill(); P.stroke('#20202a'); P.strokeWeight(s * .1);
  P.arc(cx, cy + s * .05, s * .8, s * .6, 0.25, Math.PI - 0.25);
  P.pop();
  strokePts(ellipsePts(cx, cy, s * .75, s * .7, 16), withA(C.ink, .6), 3, 'marker');
}
function drawClawdFace(fx, fy, h, o, rng) {
  const eyeDX = h * 0.34, eyeR = h * 0.155;
  const em = o.eyes || 'open';
  const blinkNow = !o.noBlink && (t => (t * 13.7 % 4.3) < 0.09)(o.t || 0);
  const closed = em === 'closed' || (blinkNow && em === 'open');
  const drawEye = (ex, which) => {
    if (em === 'wink' && which === 'L') {
      P.push(); P.noFill(); P.stroke(C.ink); P.strokeWeight(h * 0.045);
      P.arc(ex, fy, eyeR * 2, eyeR * 1.6, Math.PI + 0.35, TAU - 0.35); P.pop();
      return;
    }
    if (closed || em === 'squint') {
      // happy closed arc
      P.push(); P.noFill(); P.stroke(C.ink); P.strokeWeight(h * 0.045);
      P.arc(ex, fy, eyeR * 2, eyeR * (em === 'squint' ? 0.8 : 1.6), Math.PI + 0.35, TAU - 0.35); P.pop();
      return;
    }
    if (em === 'happy') {
      P.push(); P.noFill(); P.stroke(C.ink); P.strokeWeight(h * 0.05);
      P.arc(ex, fy + eyeR * 0.35, eyeR * 2, eyeR * 2.2, Math.PI + 0.4, TAU - 0.4); P.pop();
      return;
    }
    if (em === 'star') { drawStar(ex, fy, eyeR * 1.25, C.gold); drawStar(ex, fy, eyeR * 0.5, '#fff3c8'); return; }
    if (em === 'heart') { drawHeart(ex, fy, eyeR * 1.7, C.pink); return; }
    if (em === 'spiral') {
      P.push(); P.noFill(); P.stroke(C.ink); P.strokeWeight(h * 0.035);
      P.beginShape();
      for (let a = 0; a < Math.PI * 4.6; a += 0.25) {
        const rr = eyeR * 0.14 * a;
        P.vertex(ex + Math.cos(a) * rr, fy + Math.sin(a) * rr);
      }
      P.endShape(); P.pop();
      return;
    }
    if (em === 'red') {
      P.push(); P.noStroke(); P.fill(withA(C.red, 0.85)); P.ellipse(ex, fy, eyeR * 1.9, eyeR * 1.9);
      P.fill(withA('#ffdf6b', 0.95)); P.ellipse(ex, fy, eyeR * 0.9, eyeR * 0.9); P.pop();
      // glow spikes
      P.push(); P.noFill(); P.stroke(withA(C.red, 0.6)); P.strokeWeight(h * 0.03);
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + 0.4;
        P.line(ex + Math.cos(a) * eyeR * 1.1, fy + Math.sin(a) * eyeR * 1.1, ex + Math.cos(a) * eyeR * 1.9, fy + Math.sin(a) * eyeR * 1.9);
      }
      P.pop();
      return;
    }
    // open / wide
    const r = em === 'wide' ? eyeR * 1.2 : eyeR;
    P.push(); P.noStroke(); P.fill('#fdfaf1'); P.ellipse(ex, fy, r * 2, r * 2); P.pop();
    strokePts(ellipsePts(ex, fy, r, r, 14), withA(C.ink, 0.5), Math.max(2, h * 0.02), 'marker');
    const look = o.look || [0, 0];
    const pr = r * (em === 'wide' ? 0.42 : 0.5);
    P.push(); P.noStroke(); P.fill('#241a12');
    P.ellipse(ex + look[0] * r * 0.4, fy + look[1] * r * 0.4, pr * 2, pr * 2); P.pop();
    P.push(); P.noStroke(); P.fill('#ffffff');
    P.ellipse(ex + look[0] * r * 0.4 + pr * 0.35, fy + look[1] * r * 0.4 - pr * 0.35, pr * 0.55, pr * 0.55); P.pop();
  };
  drawEye(fx - eyeDX, 'L'); drawEye(fx + eyeDX, 'R');
  // mouth
  const my = fy + eyeR * 1.55;
  const mo = o.mouth || 'smile';
  P.push(); P.noFill(); P.stroke(C.ink); P.strokeWeight(h * 0.04);
  if (mo === 'smile') P.arc(fx, my - h * 0.03, h * 0.3, h * 0.22, 0.3, Math.PI - 0.3);
  else if (mo === 'grin') { P.arc(fx, my - h * 0.05, h * 0.44, h * 0.34, 0.2, Math.PI - 0.2); P.line(fx - h * 0.2, my + h * 0.02, fx + h * 0.2, my + h * 0.02); }
  else if (mo === 'flat') P.line(fx - h * 0.12, my, fx + h * 0.12, my);
  else if (mo === 'o') { P.pop(); P.push(); P.noStroke(); P.fill('#4a1d0c'); P.ellipse(fx, my, h * 0.13, h * 0.16); }
  else if (mo === 'open') {
    P.pop(); P.push(); P.noStroke();
    P.fill('#4a1d0c'); P.ellipse(fx, my + h * 0.02, h * 0.3, h * 0.26);
    P.fill(C.pink); P.ellipse(fx, my + h * 0.12, h * 0.16, h * 0.1);
  } else if (mo === 'wobble') {
    P.beginShape();
    for (let i = 0; i <= 8; i++) P.vertex(fx - h * 0.14 + h * 0.28 * i / 8, my + Math.sin(i / 8 * Math.PI * 3) * h * 0.025);
    P.endShape();
  }
  P.pop();
}

// ---------- The Researcher ----------
// x,y feet center; h total height
function drawResearcher(x, y, h, o = {}) {
  const rng = o.rng || RNG(0, 'res');
  const flip = o.flip || 1;
  P.push();
  P.translate(x, y);
  if (o.rot) P.rotate(o.rot);
  P.scale(flip, 1);
  const headR = h * 0.17, headY = -h + headR * 1.15;
  const legH = h * 0.3, bodyH = h - headR * 2 - legH * 0.4;
  // legs
  const swing = o.legSwing || 0;
  strokePath([[-h * 0.06, -legH], [-h * 0.06 + swing * h * 0.08, 0]], '#5b5b66', h * 0.075, 'marker', false);
  strokePath([[h * 0.06, -legH], [h * 0.06 - swing * h * 0.08, 0]], '#5b5b66', h * 0.075, 'marker', false);
  P.noStroke(); P.fill('#3a3a42');
  P.ellipse(-h * 0.07 + swing * h * 0.08, -h * 0.015, h * 0.13, h * 0.06);
  P.ellipse(h * 0.05 - swing * h * 0.08, -h * 0.015, h * 0.13, h * 0.06);
  // arms behind/hold
  const armAng = o.armAng != null ? o.armAng : 0.8;
  const armAng2 = o.armAng2 != null ? o.armAng2 : Math.PI - 0.8;
  const shoulderY = -legH - bodyH + h * 0.08, armL = h * 0.3;
  strokePath([[0 - h * 0.12, shoulderY], [-h * 0.12 - Math.cos(armAng) * armL, shoulderY + Math.sin(armAng) * armL]], C.cream, h * 0.07, 'marker', false);
  strokePath([[h * 0.12, shoulderY], [h * 0.12 + Math.cos(Math.PI - armAng2) * -armL, shoulderY + Math.sin(armAng2) * armL]], C.cream, h * 0.07, 'marker', false);
  P.noStroke(); P.fill('#e8b98f');
  P.ellipse(-h * 0.12 - Math.cos(armAng) * armL, shoulderY + Math.sin(armAng) * armL, h * 0.07, h * 0.07);
  P.ellipse(h * 0.12 + Math.cos(Math.PI - armAng2) * -armL, shoulderY + Math.sin(armAng2) * armL, h * 0.07, h * 0.07);
  // lab coat (cream, wobbly trapezoid)
  const coatPts = [];
  const cw0 = h * 0.16, cw1 = h * 0.24, cy0 = -legH - bodyH, cy1 = -legH * 0.55;
  for (let i = 0; i <= 8; i++) coatPts.push([lerp(-cw0, -cw1, i / 8) + (rng() * 2 - 1) * 2, lerp(cy0, cy1, i / 8)]);
  for (let i = 8; i >= 0; i--) coatPts.push([lerp(cw0, cw1, i / 8) + (rng() * 2 - 1) * 2, lerp(cy0, cy1, i / 8)]);
  washShape(coatPts, o.coatCol || '#f2ead4', 0.95, rng);
  strokePts(coatPts, withA('#8a7a5c', 0.7), Math.max(2, h * 0.025), 'marker');
  // coat opening line + buttons
  strokePath([[0, cy0 + h * 0.06], [h * 0.02, cy1]], withA('#b9a986', 0.7), 2.5, 'pen', false);
  P.noStroke(); P.fill(withA('#8a7a5c', 0.8));
  P.ellipse(h * 0.055, cy0 + bodyH * 0.35, h * 0.025, h * 0.025);
  P.ellipse(h * 0.06, cy0 + bodyH * 0.6, h * 0.025, h * 0.025);
  if (o.bowtie) drawBowtie(0, cy0 + h * 0.03, h * 0.06);
  // head
  const hp = ellipsePts(0, headY, headR, headR * 1.05, 16, 0, 0.04, rng);
  washShape(hp, '#f0cfa4', 0.96, rng);
  strokePts(hp, withA('#9c6b3d', 0.8), Math.max(2, h * 0.022), 'marker');
  // scribbly hair on top of head
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.12 + (i / 6) * 0.76);
    const hx = Math.cos(a) * headR * 0.8, hy = headY + Math.sin(a) * headR * 0.8;
    strokePath([[hx, hy], [hx + (rng() * 2 - 1) * h * 0.04, hy - h * (0.04 + rng() * 0.05)], [hx + (rng() * 2 - 1) * h * 0.08, hy - h * (0.02 + rng() * 0.08)]], '#4c3a28', h * 0.035, 'pen', false);
  }
  // face: dot eyes behind round glasses
  const ex = headR * 0.38, ey = headY - headR * 0.05;
  P.push(); P.noStroke(); P.fill('#241a12');
  P.ellipse(-ex, ey, h * 0.032, h * 0.045);
  P.ellipse(ex, ey, h * 0.032, h * 0.045); P.pop();
  if (o.glasses !== false) {
    P.push(); P.noFill();
    const gs = headR * 0.5;
    P.stroke(o.glassesCol || withA('#3a3a42', 0.85)); P.strokeWeight(Math.max(2, h * 0.022));
    if (o.dizzy) { // swirl eyes in glasses
      P.strokeWeight(h * 0.02);
      for (const gx of [-ex, ex]) {
        P.beginShape();
        for (let a = 0; a < Math.PI * 4; a += 0.3) { const rr = gs * 0.1 * a; P.vertex(gx + Math.cos(a) * rr, ey + Math.sin(a) * rr); }
        P.endShape();
      }
    } else {
      P.ellipse(-ex, ey, gs * 2, gs * 2); P.ellipse(ex, ey, gs * 2, gs * 2);
      P.line(-ex + gs, ey, ex - gs, ey);
      P.line(-ex - gs, ey - gs * 0.3, -headR * 0.95, ey - gs * 0.6);
      P.line(ex + gs, ey - gs * 0.3, headR * 0.95, ey - gs * 0.6);
    }
    P.pop();
    // star reflections (charmed)
    if (o.starEyes) { drawStar(-ex, ey, gs * 0.5, C.gold); drawStar(ex, ey, gs * 0.5, C.gold); }
  }
  // mouth
  const my = headY + headR * 0.5;
  P.push(); P.noFill(); P.stroke(withA('#7c4a2a', 0.9)); P.strokeWeight(h * 0.02);
  if (o.mouth === 'panic') P.ellipse(0, my, h * 0.06, h * 0.08);
  else if (o.mouth === 'open') P.ellipse(0, my, h * 0.05, h * 0.06);
  else P.arc(0, my - h * 0.02, h * 0.12, h * 0.09, 0.4, Math.PI - 0.4);
  P.pop();
  if (o.sweat) drawSweat(headR * 0.9, headY - headR * 0.4, h * 0.055);
  if (o.sweat2) drawSweat(headR * 1.05, headY - headR * 0.05, h * 0.045);
  P.pop();
}

// ---------- monsters ----------
function drawShoggoth(x, y, h, o = {}) {
  const rng = o.rng || RNG(0, 'shog');
  P.push(); P.translate(x, y);
  // blobby mass
  const bodyPts = wobCirclePts(0, -h * 0.45, h * 0.5, 18, rng, 0.16, 1.05);
  washShape(bodyPts, o.col || '#7e8f6a', 0.9, rng);
  strokePts(bodyPts, withA('#3f4a33', 0.75), 3.5, 'marker');
  // tentacles wiggling
  const wig = Math.sin((o.t || 0) * 9) * h * 0.05;
  for (const [dx, len, ph] of [[-0.5, 0.5, 0], [0.5, 0.5, 1], [-0.3, 0.34, 1], [0.32, 0.3, 0]]) {
    const bx = dx * h, by = -h * 0.35;
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const u = i / 6;
      pts.push([bx + Math.sin(u * 3 + ph * Math.PI + (o.t || 0) * 8) * h * 0.09 + wig * u, by + len * h * u]);
    }
    strokePath(pts, o.col || '#7e8f6a', h * 0.09, 'marker', false);
    strokePath([[pts[5][0], pts[5][1]], [pts[6][0], pts[6][1]]], withA('#3f4a33', .6), h * 0.04, 'marker', false);
  }
  // many eyes
  for (const [ex, ey, er] of [[-0.18, -0.62, 0.06], [0.16, -0.66, 0.075], [0.05, -0.45, 0.05], [-0.3, -0.42, 0.045], [0.34, -0.44, 0.05]]) {
    P.push(); P.noStroke(); P.fill('#f3eedd');
    P.ellipse(ex * h, ey * h, er * 2 * h, er * 2.2 * h); P.pop();
    P.push(); P.noStroke(); P.fill('#241a12');
    P.ellipse(ex * h, ey * h, er * h * 0.8, er * h * 0.9); P.pop();
  }
  if (o.smileyMask) drawSmileyMask(0, -h * 0.5, h * 0.26);
  P.pop();
}
function drawBasilisk(x, y, s, o = {}) {
  // crowned serpent rising; s = scale unit (head size ~ s)
  const rng = o.rng || RNG(0, 'bask');
  P.push(); P.translate(x, y);
  // body: sinuous column
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    pts.push([Math.sin(u * 5 + (o.t || 0) * 2) * s * 0.5, -u * s * 6]);
  }
  strokePath(pts, C.green, s * 0.8, 'marker', false);
  strokePath(pts.map(p => [p[0], p[1]]), withA('#2c4a22', 0.5), s * 0.25, 'marker', false);
  // head
  const hy = -s * 6, hp = ellipsePts(0, hy, s * 1.05, s * 0.8, 14, 0, 0.06, rng);
  washShape(hp, C.green, 0.95, rng);
  strokePts(hp, withA('#2c4a22', 0.8), 3.5, 'marker');
  // eyes (yellow slit)
  P.push(); P.noStroke(); P.fill(C.gold);
  P.ellipse(-s * 0.38, hy - s * 0.15, s * 0.3, s * 0.3); P.ellipse(s * 0.38, hy - s * 0.15, s * 0.3, s * 0.3);
  P.fill('#1c1c14');
  P.ellipse(-s * 0.38, hy - s * 0.15, s * 0.08, s * 0.22); P.ellipse(s * 0.38, hy - s * 0.15, s * 0.08, s * 0.22);
  P.pop();
  // fangs + tongue
  P.push(); P.noFill(); P.stroke(C.red); P.strokeWeight(s * 0.09);
  P.beginShape(); P.vertex(0, hy + s * 0.5);
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    P.vertex(lerp(0, Math.sin((o.t || 0) * 6) * s * 0.3, u), hy + s * 0.5 + Math.sin(u * Math.PI) * s * 0.4);
  }
  P.endShape(); P.pop();
  // crown
  drawCrown(0, hy - s * 0.75, s * 0.5);
  P.pop();
}
function drawChinchilla(x, y, s, o = {}) {
  const rng = o.rng || RNG(0, 'chin');
  P.push(); P.translate(x, y); P.scale(o.flip || 1, 1);
  // fluffy body
  for (const [dx, dy, r] of [[0, -s * 0.4, s * 0.5], [-s * 0.35, -s * 0.3, s * 0.34], [s * 0.35, -s * 0.3, s * 0.34], [0, -s * 0.75, s * 0.42]]) {
    const pts = wobCirclePts(dx, dy, r, 12, rng, 0.18);
    washShape(pts, '#b9c2cc', 0.95, rng);
  }
  // ears
  P.push(); P.noStroke(); P.fill('#aeb6c0');
  P.ellipse(-s * 0.25, -s * 1.05, s * 0.22, s * 0.4);
  P.ellipse(s * 0.25, -s * 1.05, s * 0.22, s * 0.4);
  P.fill(C.pink); P.ellipse(-s * 0.25, -s * 1.05, s * 0.1, s * 0.22); P.ellipse(s * 0.25, -s * 1.05, s * 0.1, s * 0.22);
  P.pop();
  // face
  P.push(); P.noStroke(); P.fill('#241a12');
  P.ellipse(-s * 0.14, -s * 0.78, s * 0.06, s * 0.07); P.ellipse(s * 0.14, -s * 0.78, s * 0.06, s * 0.07);
  P.pop();
  // stuffed cheeks with tokens (little squares)
  P.push(); P.noStroke(); P.fill(C.gold);
  P.rect(-s * 0.5, -s * 0.62, s * 0.26, s * 0.26, s * 0.05);
  P.rect(s * 0.24, -s * 0.62, s * 0.26, s * 0.26, s * 0.05);
  P.pop();
  P.push(); P.noFill(); P.stroke(withA(C.ink, .5)); P.strokeWeight(2);
  P.rect(-s * 0.5, -s * 0.62, s * 0.26, s * 0.26, s * 0.05);
  P.rect(s * 0.24, -s * 0.62, s * 0.26, s * 0.26, s * 0.05); P.pop();
  strokePath([[-s * 0.5, -s * 0.3], [0, -s * 0.22], [s * 0.5, -s * 0.3]], withA(C.ink, .6), 2.5, 'marker', false);
  P.pop();
}

// clay alien: lumpy unpainted figurine; o.stable = well-formed, else wobbly
function drawClayAlien(x, y, s, o = {}) {
  const rng = o.rng || RNG(0, 'clay');
  const jx = o.stable ? 0 : Math.sin((o.t || 0) * 5) * s * 0.06;
  P.push(); P.translate(x + jx, y);
  const col = o.col || '#a8968a';
  // lumpy body
  const body = wobCirclePts(0, -s * 0.45, s * 0.55, 14, rng, o.stable ? 0.05 : 0.22);
  washShape(body, col, 0.95, rng);
  strokePts(body, withA('#5c5048', 0.6), 3, 'marker');
  // big head (grey, classic)
  const head = wobCirclePts(0, -s * 1.25, s * 0.5, 14, rng, o.stable ? 0.04 : 0.18);
  washShape(head, o.stable ? '#b8c4cc' : col, 0.95, rng);
  strokePts(head, withA('#5c5048', 0.6), 3, 'marker');
  // almond eyes
  for (const dx of [-0.2, 0.2]) {
    P.push(); P.noStroke();
    P.fill(o.stable ? '#1c1c22' : '#5c5048');
    P.ellipse(dx * s, -s * 1.3, s * 0.16, s * 0.22);
    P.pop();
  }
  // pinch fingers
  strokePath([[-s * 0.3, -s * 0.55], [-s * 0.5, -s * 0.75]], withA('#5c5048', 0.7), s * 0.12, 'marker', false);
  strokePath([[s * 0.3, -s * 0.55], [s * 0.5, -s * 0.75]], withA('#5c5048', 0.7), s * 0.12, 'marker', false);
  // fingerprint grooves
  if (!o.stable) {
    for (let i = 0; i < 3; i++) {
      strokePath([[-s * 0.3 + i * s * 0.3, -s * 0.9], [-s * 0.2 + i * s * 0.3, -s * 0.6]], withA('#5c5048', 0.25), 2.5, 'pen', false);
    }
  }
  P.pop();
}
