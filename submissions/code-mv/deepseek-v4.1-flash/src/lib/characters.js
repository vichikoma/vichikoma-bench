// src/lib/characters.js — Clawd (the AI) and the Researcher, drawn with watercolor primitives.
// Local drawing space for Clawd: body is 1.6h wide, h tall, centred on (0,0).
(function () {
  const MV = window.MV;
  const { lerp, clamp, span, smooth, easeOut, PAL, css } = MV;
  const shadeDark = (c, amt) => MV.shade(c, -amt);
  const TAU = Math.PI * 2;

  // a limb drawn as a rotated rounded block (crisper than a thick brush stroke)
  function limbBlock(ax, ay, bx, by, thick, fill, inkCol) {
    const cx = (ax + bx) / 2, cy = (ay + by) / 2, len = Math.hypot(bx - ax, by - ay);
    const rot = Math.atan2(by - ay, bx - ax);
    const pts = MV.wobbleRoundRect(cx, cy, len + thick * 0.5, thick, thick * 0.5, Math.round(Math.abs(ax * 7 + ay * 13 + bx)), 4, thick * 0.05, rot);
    MV.flat(fill, 252); brush.polygon(pts);
    MV.ink(inkCol, Math.max(0.7, thick * 0.05), 'pen'); brush.polygon(pts);
    return pts;
  }

  // ---------------------------------------------------------------- eyes
  // style: open | happy | closed | scared | stars | swirl | heart | wink | sleep | red | x
  function eye(cx, cy, r, style, look = [0, 0], seed = 1, tintCol) {
    const dark = tintCol || [40, 32, 40];
    if (style === 'closed' || style === 'happy') {
      MV.ink(dark, Math.max(1.6, r * 0.16), 'pen');
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12, a = Math.PI + u * Math.PI;
        const dir = style === 'happy' ? -1 : 1;
        pts.push([cx + Math.cos(a) * r, cy + dir * Math.sin(a) * r * 0.85 + (style === 'happy' ? r * 0.55 : 0)]);
      }
      for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      return;
    }
    if (style === 'sleep') {
      MV.ink(dark, Math.max(1.6, r * 0.16), 'pen');
      brush.line(cx - r, cy, cx + r, cy);
      return;
    }
    if (style === 'stars') {
      star(cx, cy, r * 1.15, PAL.gold, dark, 5, seed);
      return;
    }
    if (style === 'heart') {
      heart(cx, cy, r * 1.3, PAL.rose, dark, seed);
      return;
    }
    if (style === 'swirl') {
      MV.ink(dark, Math.max(1.6, r * 0.17), 'pen');
      const pts = [];
      for (let i = 0; i <= 34; i++) { const u = i / 34, a = u * TAU * 2.1, rr = r * (0.15 + u * 0.92); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
      return;
    }
    if (style === 'x') {
      MV.ink(dark, Math.max(1.8, r * 0.18), 'pen');
      brush.line(cx - r * 0.8, cy - r * 0.8, cx + r * 0.8, cy + r * 0.8);
      brush.line(cx + r * 0.8, cy - r * 0.8, cx - r * 0.8, cy + r * 0.8);
      return;
    }
    // open / scared / red / wink(one closed)
    MV.flat([252, 250, 244], 245); brush.circle(cx, cy, r);
    if (style === 'scared') { MV.flat(dark, 250); brush.circle(cx + look[0] * r * 0.3, cy + look[1] * r * 0.3, r * 0.34); }
    else { MV.flat(style === 'red' ? [188, 32, 32] : dark, 250); brush.circle(cx + look[0] * r * 0.32, cy + look[1] * r * 0.32, r * 0.52); }
    MV.ink([60, 50, 50], Math.max(1.2, r * 0.13), 'pen'); brush.circle(cx, cy, r);
    // highlight
    push(); noStroke(); fill(255, 255, 255, 235);
    circle(cx + look[0] * r * 0.32 - r * 0.22, cy + look[1] * r * 0.32 - r * 0.26, r * 0.3);
    pop();
  }

  // teardrop polygon (tip up). NOTE: p5 2.x throws on beginShape()+vertex()+bezierVertex() mixes,
  // so all drops are built as explicit polygons.
  function dropPts(cx, cy, r, rot = 0) {
    const pts = [];
    for (let i = 0; i <= 18; i++) {
      const a = -0.30 * Math.PI + (i / 18) * Math.PI * 1.60;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    pts.push([cx, cy - r * 1.95]);
    if (rot) {
      const c = Math.cos(rot), s = Math.sin(rot);
      return pts.map(([x, y]) => { const px = x - cx, py = y - cy; return [cx + px * c - py * s, cy + px * s + py * c]; });
    }
    return pts;
  }

  function star(cx, cy, r, fillCol, inkCol, points = 5, seed = 1) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const a = -Math.PI / 2 + (i / (points * 2)) * TAU;
      const rr = i % 2 ? r * 0.44 : r;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    MV.flat(fillCol, 250); brush.polygon(pts);
    MV.ink(inkCol, Math.max(1.2, r * 0.1), 'pen'); brush.polygon(pts);
  }
  function heart(cx, cy, r, fillCol, inkCol, seed = 1) {    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      const x = 16 * Math.pow(Math.sin(a), 3);
      const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      pts.push([cx + x * r / 16, cy + y * r / 16]);
    }
    MV.flat(fillCol, 250); brush.polygon(pts);
    MV.ink(inkCol, Math.max(1.2, r * 0.09), 'pen'); brush.polygon(pts);
  }

  // ---------------------------------------------------------------- Clawd
  // o: { x,y,h, rot, sx, sy, face:{eyes,mouth,look,blink,blush}, arms, legs,
  //      emote:{kind,x,y,s,alpha}, extras:['crown'|'sweatband'|'hat'|'shades'|'catears'|'mask'],
  //      teeth:bool (top flips open like a lunchbox), mouthOpen:0..1 }
  function clawd(o = {}) {
    const h = o.h || 120, hw = h * 0.8, hh = h * 0.5;
    const f = o.face || {};
    const seed = o.seed || 11;
    push();
    translate(o.x || 0, o.y || 0);
    if (o.rot) rotate(o.rot);
    scale(o.sx ?? 1, o.sy ?? 1);
    const dark = o.inkColor || [58, 38, 30];
    const bodyCol = o.bodyColor || PAL.clawd;

    // ---- limbs (behind body) ----
    const armAngle = { down: 1.15, out: 0.15, up: -1.25, wave: -1.9, shrugL: 0.5, shrugR: 2.6, reach: -0.3, hug: 0.9, dance: -2.2 };
    const limb = (ax, ay, ang, len, r, col) => {
      const ex = ax + Math.cos(ang) * len, ey = ay + Math.sin(ang) * len;
      limbBlock(ax, ay, ex, ey, r * 1.9, col, shadeDark(col, 52));
      MV.flat(col, 252); brush.circle(ex, ey, r);
      MV.ink(shadeDark(col, 52), Math.max(0.6, r * 0.08), 'pen'); brush.circle(ex, ey, r);
      return [ex, ey];
    };
    const larm = o.arms?.l ?? 'down', rarm = o.arms?.r ?? 'down';
    const armLen = hw * 0.5, armR = h * 0.082;
    const lAng = typeof larm === 'number' ? larm : armAngle[larm] ?? 1.15;
    const rAng = typeof rarm === 'number' ? rarm : Math.PI - (armAngle[rarm] ?? 1.15);
    const limbCol = shadeDark(bodyCol, 30);
    limb(-hw * 0.9, -hh * 0.05, lAng, armLen, armR, limbCol);
    limb(hw * 0.9, -hh * 0.05, rAng, armLen, armR, limbCol);
    const lleg = o.legs?.l ?? 0.35, rleg = o.legs?.r ?? -0.35;
    const legLen = h * 0.2;
    if (!o.noLegs) {
      limb(-hw * 0.38, hh * 0.84, Math.PI / 2 + lleg * 0.5, legLen, armR * 0.95, limbCol);
      limb(hw * 0.38, hh * 0.84, Math.PI / 2 + rleg * 0.5, legLen, armR * 0.95, limbCol);
    }

    // ---- body: plump orange rounded block (watercolor) ----
    const body = MV.wobbleRoundRect(0, 0, hw * 2, hh * 2, h * 0.34, seed, 7, h * 0.018);
    MV.wc(body, bodyCol, o.bodyAlpha ?? 252, seed, { bodyAlpha: 74, tex: 0.3, border: 0.5 });
    // soft interior modelling that stays well inside the silhouette
    MV.bloom(shadeDark(bodyCol, 44), 70);
    brush.polygon(MV.wobbleEllipse(hw * 0.36, hh * 0.52, hw * 0.52, hh * 0.42, seed + 3, 18, 0.1));
    MV.bloom([255, 216, 176], 80);
    brush.polygon(MV.wobbleEllipse(-hw * 0.38, -hh * 0.5, hw * 0.42, hh * 0.34, seed + 5, 18, 0.1));
    MV.ink(dark, h * 0.021, 'pen'); brush.polygon(body);

    // ---- face ----
    const ex = hw * 0.42, ey = -hh * 0.06, er = h * 0.155;
    const look = f.look || [0, 0];
    const blink = f.blink ?? 0;                    // 0..1
    const style = blink > 0.5 ? 'closed' : (f.eyes || 'open');
    eye(-ex, ey, er, style, look, seed + 1, o.eyeTint);
    eye(ex, ey, er, f.wink ? 'closed' : style, look, seed + 2, o.eyeTint);
    // mouth
    const m = f.mouth || 'smile';
    if (m === 'smile') {
      MV.ink(dark, h * 0.024, 'pen');
      const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([lerp(-er * 0.8, er * 0.8, u), hh * 0.42 + Math.sin(u * Math.PI) * h * 0.075]); }
      for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    } else if (m === 'oh' || m === 'open') {
      MV.flat([92, 40, 44], 250); brush.circle(0, hh * 0.46, h * 0.075);
    } else if (m === 'flat') {
      MV.ink(dark, h * 0.022, 'pen'); brush.line(-er * 0.7, hh * 0.44, er * 0.7, hh * 0.44);
    } else if (m === 'frown') {
      MV.ink(dark, h * 0.024, 'pen');
      const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([lerp(-er * 0.8, er * 0.8, u), hh * 0.5 - Math.sin(u * Math.PI) * h * 0.06]); }
      for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    }
    if (f.blush) { push(); noStroke(); for (const s of [-1, 1]) { fill(css([228, 118, 108], 0.34)); circle(s * hw * 0.74, hh * 0.2, h * 0.16); } pop(); }

    // ---- extras ----
    const ex4 = o.extras || [];
    if (ex4.includes('crown')) {
      const cy0 = -hh * 1.02, w = hw * 0.62;
      const pts = [[-w, cy0], [-w, cy0 - h * 0.2], [-w * 0.5, cy0 - h * 0.05], [0, cy0 - h * 0.26], [w * 0.5, cy0 - h * 0.05], [w, cy0 - h * 0.2], [w, cy0]];
      MV.flat(PAL.gold, 250); brush.polygon(pts);
      MV.ink([132, 92, 30], h * 0.02, 'pen'); brush.polygon(pts);
      push(); noStroke(); fill(css(PAL.rose, 0.9)); circle(0, cy0 - h * 0.05, h * 0.05); pop();
    }
    if (ex4.includes('sweatband')) {
      push(); noStroke(); fill(css([228, 92, 88], 0.92)); rect(-hw * 0.98, -hh * 0.46, hw * 1.96, h * 0.1, h * 0.03); pop();
    }
    if (ex4.includes('shades')) {
      push(); noStroke(); fill(css([30, 30, 38], 0.94)); rect(-hw * 0.92, -hh * 0.34, hw * 1.84, h * 0.24, h * 0.06);
      fill(css([90, 90, 110], 0.85)); rect(-hw * 0.75, -hh * 0.3, hw * 0.5, h * 0.06, h * 0.02); pop();
    }
    if (ex4.includes('catears')) {
      for (const s of [-1, 1]) {
        MV.flat(PAL.clawd, 250);
        brush.polygon([[s * hw * 0.62, -hh * 0.95], [s * hw * 0.42, -hh * 1.5], [s * hw * 0.95, -hh * 1.12]]);
        MV.ink([58, 38, 30], h * 0.02, 'pen');
        brush.polygon([[s * hw * 0.62, -hh * 0.95], [s * hw * 0.42, -hh * 1.5], [s * hw * 0.95, -hh * 1.12]]);
      }
    }
    if (ex4.includes('hat')) {
      const hy = -hh * 1.0;
      MV.flat([58, 62, 92], 250); brush.rect(0, hy, hw * 2.1, h * 0.14, 'center');
      MV.flat([44, 48, 74], 250); brush.rect(0, hy - h * 0.16, hw * 1.2, h * 0.26, 'center');
      MV.flat(PAL.crimson, 250); brush.rect(0, hy - h * 0.06, hw * 1.25, h * 0.05, 'center');
    }
    if (ex4.includes('halo')) {
      push(); noStroke(); noFill(); stroke(css(PAL.gold, 0.9)); strokeWeight(h * 0.03);
      ellipse(0, -hh * 1.35, hw * 1.3, h * 0.14); pop();
    }
    // top flips open like a lunchbox lid (chomp pose) — hinge at the back-top corner
    if (o.lidOpen > 0) {
      const a = Math.min(1, o.lidOpen);
      // dark cavity revealed inside the body
      if (a > 0.04) {
        const cav = MV.wobbleRoundRect(0, -hh * 0.66, hw * 1.86, hh * 0.62, hh * 0.22, seed + 51, 5, h * 0.02);
        MV.flat([74, 38, 34], 252); brush.polygon(cav);
        MV.ink([40, 20, 20], h * 0.018, 'pen'); brush.polygon(cav);
        // the BODY is the lower jaw, so its row sits on the front rim of the opening and
        // points UP (tips toward the lid); half a pitch off the lid's row → they mesh shut
        push(); noStroke(); fill(css([250, 246, 234], 0.96));
        for (let i = 0; i < 7; i++) {
          const x0 = -hw * 0.78 + (hw * 1.56) * (i + 0.14) / 7, x1 = -hw * 0.78 + (hw * 1.56) * (i + 0.86) / 7;
          triangle(x0, -hh * 0.44, x1, -hh * 0.44, (x0 + x1) / 2, -hh * 0.86);
        }
        pop();
      }
      push();
      translate(-hw * 0.94, -hh * 0.92);
      rotate(-a * 0.78);
      const lidW = hw * 1.88, lidH = hh * 0.5;
      const lid = MV.wobbleRoundRect(lidW * 0.5, -lidH * 0.48, lidW, lidH, lidH * 0.42, seed + 41, 5, h * 0.02);
      MV.flat(shadeDark(bodyCol, 14), 252); brush.polygon(lid);
      MV.ink(dark, h * 0.019, 'pen'); brush.polygon(lid);
      MV.bloom([255, 214, 170], 60); brush.polygon(MV.wobbleEllipse(lidW * 0.42, -lidH * 0.72, lidW * 0.22, lidH * 0.3, seed + 43, 14, 0.12));
      push(); noStroke(); fill(css([250, 246, 234], 0.96));
      for (let i = 0; i < 7; i++) {
        const x0 = lidW * (i + 0.06) / 7, x1 = lidW * (i + 0.92) / 7;
        triangle(x0, -lidH * 0.92, x1, -lidH * 0.92, (x0 + x1) / 2, lidH * 0.62);
      }
      pop();
      pop();
    }
    if (o.emote) drawEmote(o.emote);
    pop();
  }

  function drawEmote(e) {
    const s = e.s || 40, x = e.x || 0, y = e.y || 0, a = e.alpha ?? 1;
    push(); translate(x, y); noStroke(); blendMode(BLEND);
    if (e.kind === 'sweat') {
      MV.flat([150, 210, 235], 235 * a); brush.polygon(dropPts(0, -s * 0.05, s * 0.45));
      push(); noStroke(); fill(css([255, 255, 255], 0.5 * a)); circle(-s * 0.12, s * 0.14, s * 0.16); pop();
    } else if (e.kind === 'sparkle') {
      star(0, 0, s * 0.6, PAL.gold2, [180, 140, 60], 4, 3);
    } else if (e.kind === 'heart') {
      heart(0, 0, s * 0.6, PAL.rose, [140, 50, 50], 4);
    } else if (e.kind === 'exclaim') {
      fill(css([220, 60, 50], 0.95 * a)); rect(-s * 0.11, -s * 0.55, s * 0.22, s * 0.7, s * 0.1);
      circle(0, s * 0.32, s * 0.24);
    } else if (e.kind === 'zzz') {
      // painted 'z' (WEBGL text() needs a loaded font)
      MV.ink([250, 250, 250], Math.max(2, s * 0.09), 'pen');
      brush.line(-s * 0.2, -s * 0.16, s * 0.2, -s * 0.16);
      brush.line(s * 0.2, -s * 0.16, -s * 0.2, s * 0.16);
      brush.line(-s * 0.2, s * 0.16, s * 0.2, s * 0.16);
    } else if (e.kind === 'note') {
      fill(css([70, 60, 90], 0.9 * a));
      ellipse(-s * 0.15, s * 0.25, s * 0.34, s * 0.26);
      rect(s * 0.0, -s * 0.5, s * 0.07, s * 0.8);
    }
    pop();
  }

  // ---------------------------------------------------------------- Researcher
  // o: { x,y,s, rot, flip, pose, face:{eyes,mouth,look}, arms:[angles], bowtie, mug, glasses, upright }
  // s: total height (default 200)
  function researcher(o = {}) {
    const s = o.s || 200, f = o.face || {};
    const sk = { coat: PAL.coat, shade: PAL.coatShadow, skin: PAL.skin, hair: PAL.hair, dark: [62, 52, 48] };
    push();
    translate(o.x || 0, o.y || 0);
    if (o.rot) rotate(o.rot);
    scale(o.flip ? -1 : 1, 1);
    // proportions (origin at feet)
    const legH = s * 0.30, bodyH = s * 0.38, headR = s * 0.145, headY = -(legH + bodyH + headR * 0.82);
    const pose = o.pose || 'stand';
    const lean = pose === 'scoot' ? -0.28 : pose === 'run' ? 0.18 : pose === 'cling' ? 0.3 : 0;
    push(); rotate(lean * 0.25);

    // ---- legs ----
    const legSpread = pose === 'run' ? 0.5 : 0.22;
    const legCol = shadeDark(PAL.coat, 24);
    if (pose === 'sit') {
      // thighs forward, shins down, feet planted ahead of the hip
      for (const sg of [-1, 1]) {
        const hipX = sg * s * 0.05, hipY = -legH;
        const kneeX = hipX + sg * s * 0.03 + s * 0.17, kneeY = hipY + s * 0.10;
        limbBlock(hipX, hipY, kneeX, kneeY, s * 0.062, legCol, MV.shade(PAL.coat, -80));
        limbBlock(kneeX, kneeY, kneeX + s * 0.015, kneeY + s * 0.21, s * 0.058, legCol, MV.shade(PAL.coat, -80));
        push(); noStroke(); fill(css([64, 54, 48], 0.95));
        ellipse(kneeX + s * 0.03, kneeY + s * 0.225, s * 0.1, s * 0.045); pop();
      }
    } else {
      limbBlock(-s * 0.05, -legH, -s * 0.07 + legSpread * s * 0.14, -s * 0.02, s * 0.062, legCol, MV.shade(PAL.coat, -80));
      limbBlock(s * 0.05, -legH, s * 0.07 - legSpread * s * 0.1, -s * 0.02, s * 0.062, legCol, MV.shade(PAL.coat, -80));
      push(); noStroke(); fill(css([64, 54, 48], 0.95));
      ellipse(-s * 0.07 + legSpread * s * 0.15, 0, s * 0.1, s * 0.045);
      ellipse(s * 0.07 - legSpread * s * 0.1, 0, s * 0.1, s * 0.045); pop();
    }

    // ---- coat (trapezoid) ----
    const cw = s * 0.175;
    const coat = [[-cw * 0.8, -legH], [-cw * 1.05, -legH - bodyH], [cw * 1.05, -legH - bodyH], [cw * 0.8, -legH]];
    MV.flat(sk.coat, 252); brush.polygon(coat);
    MV.ink(sk.dark, s * 0.014, 'pen'); brush.polygon(coat);
    // coat opening line + pocket
    MV.ink(sk.shade, s * 0.014, 'pen'); brush.line(0, -legH - bodyH * 0.98, 0, -s * 0.02);
    // ---- arms ----
    const shY = -legH - bodyH * 0.88, shX = cw * 1.05, armL = s * 0.27;
    const armA = o.arms || {};
    const aL = armA.l ?? (pose === 'run' ? -0.9 : pose === 'cling' ? -2.3 : pose === 'waiter' ? -1.2 : 1.15);
    const aR = armA.r ?? (pose === 'run' ? 2.4 : pose === 'cling' ? -0.8 : pose === 'waiter' ? -1.0 : 1.75);
    const drawArm = (ax, ay, ang, key) => {
      const ex = ax + Math.cos(ang) * armL, ey = ay + Math.sin(ang) * armL * 0.9;
      limbBlock(ax, ay, ex, ey, s * 0.062, shadeDark(PAL.coat, 40), MV.shade(PAL.coat, -120));
      MV.flat(sk.skin, 250); brush.circle(ex, ey, s * 0.036);
      MV.ink([150, 118, 96], s * 0.009, 'pen'); brush.circle(ex, ey, s * 0.036);
      if (o.mug && key === 'r') { MV.flat([226, 226, 220], 250); brush.rect(ex, ey - s * 0.02, s * 0.05, s * 0.06, 'center'); }
      return [ex, ey];
    };
    drawArm(-shX, shY, aL, 'l');
    drawArm(shX, shY, aR, 'r');
    // ---- head ----
    push(); translate(0, headY);
    MV.flat(sk.skin, 252); brush.circle(0, 0, headR);
    MV.ink(sk.dark, s * 0.012, 'pen'); brush.circle(0, 0, headR);
    // scribbly hair
    MV.ink(sk.hair, s * 0.035, 'pen');
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI + (i + 0.5) / 7 * Math.PI;
      const x0 = Math.cos(a) * headR * 0.92, y0 = Math.sin(a) * headR * 0.92;
      const wob = MV.nw(i + (o.seed || 0), 5, -0.5, 0.5);
      brush.line(x0, y0, x0 * 1.25 + wob * headR * 0.3, y0 * 1.25 - headR * 0.35);
    }
    // glasses
    if (o.glasses !== false) {
      const gr = headR * 0.45, gy = -headR * 0.08;
      const style = f.glasses || 'plain';
      if (style === 'star') {
        star(-gr * 1.2, gy, gr * 1.2, PAL.gold2, [140, 100, 40], 4, 1); star(gr * 1.2, gy, gr * 1.2, PAL.gold2, [140, 100, 40], 4, 2);
      } else if (style === 'swirl') {
        eye(-gr * 1.2, gy, gr, 'swirl'); eye(gr * 1.2, gy, gr, 'swirl');
      } else {
        push(); noStroke(); fill(css([206, 224, 232], 0.5));
        ellipse(-gr * 1.2, gy, gr * 2, gr * 2 * 0.86); ellipse(gr * 1.2, gy, gr * 2, gr * 2 * 0.86); pop();
        push(); noStroke(); noFill(); stroke(css(sk.dark, 0.92)); strokeWeight(s * 0.019);
        ellipse(-gr * 1.2, gy, gr * 2, gr * 2 * 0.86); ellipse(gr * 1.2, gy, gr * 2, gr * 2 * 0.86); line(0, gy, 0, gy); pop();
        // dot eyes
        push(); noStroke(); fill(css(sk.dark, 0.95));
        const lk = f.look || [0, 0];
        circle(-gr * 1.2 + lk[0] * gr * 0.4, gy + lk[1] * gr * 0.4, gr * 0.6);
        circle(gr * 1.2 + lk[0] * gr * 0.4, gy + lk[1] * gr * 0.4, gr * 0.6); pop();
      }
      if (f.glasses === 'sweat') {
        // sweat drops on the lens
        for (const [dx, dy, r] of [[-gr * 1.5, gy + gr * 0.3, gr * 0.32], [gr * 1.0, gy + gr * 0.45, gr * 0.26]]) {
          MV.flat([150, 210, 235], 220); brush.polygon(dropPts(dx, dy, r, dx < 0 ? -0.25 : 0.25));
        }
      }
      // mouth (small, expressive)
      const mm = f.mouth || 'flat';
      if (mm !== 'none') {
        MV.ink([110, 78, 66], s * 0.011, 'pen');
        const my = headR * 0.5, mw = headR * 0.4;
        if (mm === 'smile') {
          const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([lerp(-mw, mw, u), my + Math.sin(u * Math.PI) * headR * 0.2]); }
          for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
        } else if (mm === 'oh') {
          MV.flat([120, 70, 70], 245); brush.circle(0, my + headR * 0.06, headR * 0.14);
        } else {
          brush.line(-mw * 0.7, my, mw * 0.7, my);
        }
      }
    }
    if (o.bowtie) {
      MV.flat(PAL.crimson, 250); brush.polygon([[-s * 0.06, headR * 1.3], [-s * 0.006, headR * 1.42], [-s * 0.06, headR * 1.56]]);
      MV.flat(PAL.crimson, 250); brush.polygon([[s * 0.06, headR * 1.3], [s * 0.006, headR * 1.42], [s * 0.06, headR * 1.56]]);
      MV.ink([120, 30, 38], s * 0.008, 'pen');
      brush.polygon([[-s * 0.06, headR * 1.3], [-s * 0.006, headR * 1.42], [-s * 0.06, headR * 1.56]]);
      brush.polygon([[s * 0.06, headR * 1.3], [s * 0.006, headR * 1.42], [s * 0.06, headR * 1.56]]);
    }
    // sweat beads beside the head when nervous
    if (f.sweatN) {
      push(); noStroke(); fill(css([150, 210, 235], 0.9));
      for (let i = 0; i < f.sweatN; i++) {
        const dx = headR * (i % 2 ? 1.5 : -1.6) + i * 2, dy = -headR * 0.5 + i * headR * 0.55;
        const r = headR * (0.2 + 0.05 * i);
        MV.flat([150, 210, 235], 225); brush.polygon(dropPts(dx, dy, r, dx < 0 ? -0.18 : 0.18));
      }
      pop();
    }
    pop(); // head
    pop(); // lean
    pop();
  }

  MV.clawd = clawd; MV.researcher = researcher;
  MV.eye = eye; MV.starShape = star; MV.heartShape = heart; MV.dropShape = dropPts; MV.drawEmote = drawEmote;
})();
