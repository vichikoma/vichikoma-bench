// src/lib/shots/s01_lab.js — Shot 1 · The Lab (1.5–23.0s)
// Sub-shots (per STORYBOARD):
//   1.5–6.0  over-the-shoulder → push into Clawd's face, eyes morph to stars, sparks fill the room
//   6.0–8.0  reverse shot: starry glasses → sweat, circuit vines crawl the walls, chair scoots back
//   8.0–9.0  Clawd shrugs and winks, loss chart pops up
//   9.0–13.0 Clawd rides the loss curve off a cliff, splashes down, bursts out of the monitor
//  13.0–17.9 villain chair-spin: crowned Clawd, bow-tied Researcher serves coffee, lid creaks open
//  17.9–23.0 Scooby-Doo door chase, Clawd bigger each time, CHOMP → black
(function () {
  const MV = window.MV;
  const { PAL, css, hex, lerp, clamp, span, smooth, smoother, easeIn, easeOut, easeOut3, easeInOut, easeBack, easeElastic,
    hump, beatEnv, beatIndex, beatPhase, beatTime, beatsIn, barPhase, shake } = MV;
  const shadeDark = (c, amt) => MV.shade(c, -amt);
  const P = PAL;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- the lab set
  const MON = { x: 0, y: 10, w: 720, h: 470, sx: 566, sy: 330 };
  const SCR = { x0: MON.x - MON.sx / 2, x1: MON.x + MON.sx / 2, y0: MON.y - MON.sy / 2, y1: MON.y + MON.sy / 2 };
  const DESK_Y = 300;

  function wall(t) {
    MV.__stage = 'wall';
    // night lab wall
    MV.flat(P.indigo, 255);
    brush.polygon([[-1000, -560], [1000, -560], [1000, DESK_Y + 40], [-1000, DESK_Y + 40]]);
    // lamp pool of light (ochre) upper-left
    MV.glow(-560, -300, 700, P.lamp, 0.5, 9);
    MV.flat([62, 70, 118], 150);
    brush.polygon([[-1000, -560], [1000, -560], [1000, -430], [-1000, -430]]);
    // floor
    MV.flat([22, 26, 46], 255);
    brush.polygon([[-1000, DESK_Y + 30], [1000, DESK_Y + 30], [1000, 560], [-1000, 560]]);
    MV.ink([46, 54, 86], 2, 'pen');
    brush.line(-1000, DESK_Y + 60, 1000, DESK_Y + 60);
  }

  function lamp(t) {
    MV.__stage = 'lamp';
    // clip-style desk lamp, upper left
    const lx = -700, ly = -300;
    MV.flat([186, 124, 54], 250);
    brush.polygon([[lx - 60, ly], [lx + 90, ly - 40], [lx + 110, ly + 40], [lx - 40, ly + 70]]);
    MV.ink([96, 62, 26], 2, 'pen');
    brush.polygon([[lx - 60, ly], [lx + 90, ly - 40], [lx + 110, ly + 40], [lx - 40, ly + 70]]);
    MV.ink([120, 86, 40], 6, 'pen');
    brush.line(lx - 40, ly + 60, lx - 240, ly + 210);
    MV.glow(lx + 130, ly + 10, 190, [255, 226, 150], 0.55, 7);
  }

  // wall dressing: shelf with jars, corkboard with notes, hanging cables
  function props(t) {
    // shelf (left)
    MV.flat([86, 58, 44], 250);
    brush.polygon([[-960, -170], [-420, -170], [-420, -138], [-960, -138]]);
    MV.ink([52, 34, 26], 2, 'pen');
    brush.polygon([[-960, -170], [-420, -170], [-420, -138], [-960, -138]]);
    const r = MV.rnd(1207);
    for (let i = 0; i < 5; i++) {
      const jx = -900 + i * 104, jh = 54 + r() * 44, jc = [[196, 150, 84], [120, 170, 168], [188, 96, 84], [206, 196, 160], [140, 140, 190]][i % 5];
      MV.flat(jc, 245);
      brush.polygon(MV.rrect(jx, -170 - jh / 2, 74, jh, 12, 300 + i * 7));
      MV.ink(shadeDark(jc, 60), 1.8, 'pen');
      brush.polygon(MV.rrect(jx, -170 - jh / 2, 74, jh, 12, 300 + i * 7));
      MV.flat([220, 214, 190], 120); brush.rect(jx, -170 - jh * 0.62, 60, 10, 'center');
    }
    // corkboard (right) with pinned notes + a tiny loss sketch
    MV.flat([158, 116, 78], 250);
    brush.polygon(MV.rrect(430, -250, 420, 300, 10, 91, 4));
    MV.ink([92, 62, 40], 2.4, 'pen'); brush.polygon(MV.rrect(430, -250, 420, 300, 10, 91, 4));
    const r2 = MV.rnd(515);
    for (let i = 0; i < 4; i++) {
      const nx = 330 + (i % 2) * 200 + r2() * 30, ny = -350 + Math.floor(i / 2) * 160 + r2() * 20;
      MV.flat([246, 240, 220], 250); brush.polygon(MV.rrect(nx, ny, 150, 120, 6, 600 + i, 3, r2() * 0.2 - 0.1));
      MV.flat([200, 60, 54], 250); brush.circle(nx + (r2() - 0.5) * 60, ny - 56, 12);
    }
    // hanging cables from the desk into the dark
    MV.ink([40, 44, 66], 3.2, 'pen');
    for (const [x0, sag] of [[-330, 130], [-300, 90], [640, 150]]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) { const u = i / 12; pts.push([x0 + u * 40 + Math.sin(u * 3) * 14, DESK_Y + 46 + u * sag]); }
      MV.polyline(pts, [40, 44, 66], 3.2, 'pen');
    }
  }

  function desk(t) {
    MV.__stage = 'desk';
    // desk slab + front edge
    MV.flat([92, 62, 44], 255);
    brush.polygon([[-1000, DESK_Y], [1000, DESK_Y], [1000, DESK_Y + 46], [-1000, DESK_Y + 46]]);
    MV.flat([132, 92, 62], 250);
    brush.polygon([[-1000, DESK_Y - 10], [1000, DESK_Y - 10], [1000, DESK_Y + 12], [-1000, DESK_Y + 12]]);
    MV.ink([58, 38, 28], 2.4, 'pen');
    brush.line(-1000, DESK_Y + 46, 1000, DESK_Y + 46);
    // mouse, mug, sticky notes
    MV.flat([206, 206, 198], 250); brush.polygon(MV.blob(520, DESK_Y - 16, 46, 30, 31, 18, 0.1));
    MV.flat([226, 226, 220], 250); brush.polygon(MV.rrect(300, DESK_Y - 26, 60, 62, 12, 32));
    MV.flat(P.lamp, 250); brush.polygon(MV.blob(300, DESK_Y - 60, 34, 34, 33, 16, 0.1));
    MV.ink([96, 62, 26], 1.6, 'pen'); brush.polygon(MV.blob(300, DESK_Y - 60, 34, 34, 33, 16, 0.1));
  }

  // the painted monitor body + screen; content is drawn between monitorBody() and bezel()
  function monitorBody(t, glowStrength = 0.45) {
    MV.__stage = 'monitorBody';
    const b = MV.wobbleRoundRect(MON.x, MON.y + 6, MON.w, MON.h, 36, 11, 6, 3);
    MV.wc(b, [64, 70, 104], 252, 11, { bodyAlpha: 70, tex: 0.32, border: 0.5 });
    MV.ink([26, 30, 52], 2.2, 'pen'); brush.polygon(b);
    // stand
    MV.flat([52, 58, 88], 250);
    brush.polygon([[MON.x - 120, MON.y + MON.h / 2 + 10], [MON.x + 120, MON.y + MON.h / 2 + 10], [MON.x + 160, DESK_Y], [MON.x - 160, DESK_Y]]);
    MV.ink([26, 30, 52], 2, 'pen');
    brush.polygon([[MON.x - 120, MON.y + MON.h / 2 + 10], [MON.x + 120, MON.y + MON.h / 2 + 10], [MON.x + 160, DESK_Y], [MON.x - 160, DESK_Y]]);
    MV.flat([40, 46, 74], 250);
    brush.polygon([[MON.x - 190, DESK_Y - 6], [MON.x + 190, DESK_Y - 6], [MON.x + 190, DESK_Y + 8], [MON.x - 190, DESK_Y + 8]]);
    if (glowStrength > 0) MV.glow(MON.x, MON.y, 480, P.tealGlow, glowStrength, 8);
  }
  function screenBase(alpha = 255) {
    MV.__stage = 'screenBase';
    MV.flat([12, 30, 40], alpha);
    brush.polygon([[SCR.x0, SCR.y0], [SCR.x1, SCR.y0], [SCR.x1, SCR.y1], [SCR.x0, SCR.y1]]);
    // scanline-ish shading
    MV.flat([26, 62, 70], 90);
    brush.polygon([[SCR.x0, SCR.y1 - 40], [SCR.x1, SCR.y1 - 40], [SCR.x1, SCR.y1], [SCR.x0, SCR.y1]]);
  }
  // bezel frame drawn over the screen content (4 quads => crops the content)
  function bezel(t) {
    MV.__stage = 'bezel';
    const bez = 42, col = [70, 76, 112];
    MV.flat(col, 252);
    brush.polygon([[SCR.x0 - bez, SCR.y0 - bez], [SCR.x1 + bez, SCR.y0 - bez], [SCR.x1 + bez, SCR.y0], [SCR.x0 - bez, SCR.y0]]);
    brush.polygon([[SCR.x0 - bez, SCR.y1], [SCR.x1 + bez, SCR.y1], [SCR.x1 + bez, SCR.y1 + bez], [SCR.x0 - bez, SCR.y1 + bez]]);
    brush.polygon([[SCR.x0 - bez, SCR.y0 - bez], [SCR.x0, SCR.y0 - bez], [SCR.x0, SCR.y1 + bez], [SCR.x0 - bez, SCR.y1 + bez]]);
    brush.polygon([[SCR.x1, SCR.y0 - bez], [SCR.x1 + bez, SCR.y0 - bez], [SCR.x1 + bez, SCR.y1 + bez], [SCR.x1, SCR.y1 + bez]]);
    MV.ink([24, 28, 48], 1.6, 'pen');
    brush.polygon([[SCR.x0 - 2, SCR.y0 - 2], [SCR.x1 + 2, SCR.y0 - 2], [SCR.x1 + 2, SCR.y1 + 2], [SCR.x0 - 2, SCR.y1 + 2]]);
  }
  function screenGlare() {
    MV.__stage = 'screenGlare';
    MV.flat([210, 240, 240], 26);
    brush.polygon([[SCR.x0, SCR.y0 + 90], [SCR.x1 - 120, SCR.y0], [SCR.x1, SCR.y0], [SCR.x0 + 120, SCR.y1], [SCR.x0, SCR.y1]]);
  }

  // Clawd as shown on the monitor: world size scales with h
  function screenClawd(t, o = {}) {
    MV.__stage = 'screenClawd';
    const h = o.h ?? 190;
    MV.clawd(Object.assign({
      x: MON.x, y: MON.y + 10, h, seed: 21,
      face: { eyes: 'closed', mouth: 'flat', look: [0, 0] }, arms: { l: 'down', r: 'down' }
    }, o));
  }

  // rolling office chair (seen from behind / side)
  function chair(t, x, y, s = 1, spin = 0, dark = false) {
    MV.__stage = 'chair';
    push(); translate(x, y); scale(s); rotate(spin * 0.18);
    const col = dark ? [122, 128, 156] : [138, 144, 170];
    // post + base
    MV.__stage = 'chair:post';
    MV.flat([70, 76, 108], 250); brush.rect(0, 46, 16, 74, 'center');
    MV.ink([30, 34, 56], 2, 'pen'); brush.rect(0, 46, 16, 74, 'center');
    MV.flat([60, 66, 98], 250); brush.polygon([[-70, 86], [70, 86], [52, 96], [-52, 96]]);
    MV.__stage = 'chair:casters';
    push(); noStroke(); fill(css([40, 44, 70], 0.95));
    for (const cx of [-64, 64, 0]) circle(cx, 100, 18); pop();
    // seat
    MV.__stage = 'chair:seat';
    MV.flat(col, 252); brush.polygon(MV.rrect(0, -6, 210, 26, 12, 71, 2));
    MV.ink([26, 30, 52], 2, 'pen'); brush.polygon(MV.rrect(0, -6, 210, 26, 12, 71, 2));
    // back rest
    MV.__stage = 'chair:back';
    MV.flat(col, 252); brush.polygon(MV.rrect(0, -104, 176, 150, 26, 72, 2));
    MV.ink([26, 30, 52], 2.2, 'pen'); brush.polygon(MV.rrect(0, -104, 176, 150, 26, 72, 2));
    MV.flat([92, 98, 132], 120); brush.polygon(MV.rrect(-30, -118, 92, 96, 22, 73, 2));
    MV.__stage = 'chair:end';
    pop();
  }

  // the Researcher seen from behind (over-the-shoulder foreground)
  function backOfResearcher(t, x, y, s) {
    MV.__stage = 'backOfResearcher';
    push(); translate(x, y); scale(s);
    // shoulders / torso
    MV.flat(shadeDark(P.coat, 46), 252);
    brush.polygon(MV.wobbleRoundRect(0, 150, 300, 300, 60, 81, 5, 3));
    MV.ink([96, 90, 78], 2.6, 'pen');
    brush.polygon(MV.wobbleRoundRect(0, 150, 300, 300, 60, 81, 5, 3));
    // head (back of skull + hair)
    MV.flat(shadeDark(P.skin, 78), 252); brush.circle(0, -40, 108);
    MV.flat(shadeDark(P.hair, 34), 252); brush.circle(0, -56, 112);
    MV.ink([40, 32, 28], 2.6, 'pen'); brush.circle(0, -56, 112);
    MV.ink(shadeDark(P.hair, 20), 5, 'pen');
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI - 0.3 + (i / 8) * (Math.PI + 0.6);
      const x0 = Math.cos(a) * 104, y0 = -56 + Math.sin(a) * 104;
      brush.line(x0, y0, x0 * 1.22, y0 * 1.2 - 30);
    }
    // ear + neck
    MV.flat(shadeDark(P.skin, 78), 252); brush.circle(-104, -20, 24);
    MV.flat(shadeDark(P.skin, 78), 250); brush.polygon(MV.rrect(0, 72, 78, 60, 20, 82));
    // rim light: the monitor is in front of him, so its glow catches his right edge
    MV.ink([160, 226, 224], 7, 'pen');
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, a = -Math.PI * 0.98 + u * Math.PI * 0.96;
      brush.line(Math.cos(a) * 108, -56 + Math.sin(a) * 108, Math.cos(a) * 118, -56 + Math.sin(a) * 118);
    }
    MV.ink([150, 216, 214], 6, 'pen');
    brush.line(150, 40, 152, 250);
    MV.ink([120, 180, 180], 4, 'pen');
    brush.line(-150, 60, -148, 250);
    pop();
  }

  // ---------------------------------------------------------------- camera per beat
  // micro push on every beat (gives the whole shot a heartbeat)
  const beatPush = (t, amt = 0.012) => 1 + amt * beatEnv(t, 7);

  function camSeg1(t) {
    MV.__stage = 'camSeg1';
    const zA = 1.16 + 0.07 * smooth(span(t, 1.5, 3.7));
    const zB = easeInOut(span(t, 3.75, 5.45));
    const back = easeInOut(span(t, 5.55, 6.0));           // recoil out of the screen
    let zoom = lerp(zA, 3.30, zB);
    zoom = lerp(zoom, 1.22, back);
    const x = lerp(-30, 0, zB) * (1 - back);
    const y = lerp(30, 6, zB) * (1 - back);
    const sh = shake(t, 4, 10, 3);
    return { x: x + sh[0], y: y + sh[1], zoom: zoom * beatPush(t) };
  }

  function seg1(t) {
    MV.__stage = 'seg1';
    const cam = camSeg1(t);
    MV.cam(cam);
    wall(t); props(t); lamp(t); desk(t);
    // faint UI on the wall (poster-ish) - keeps the room from being empty
    MV.flat([86, 96, 140], 90);
    brush.polygon(MV.rrect(-820, -140, 240, 300, 12, 61, 3));
    monitorBody(t, 0.5);
    screenBase(255);
    // screen content: sleeping Clawd + tiny interface
    const wake = smooth(span(t, 3.05, 3.45));
    const star = smooth(span(t, 4.35, 4.75));
    const onScreen = [
      // little status bars
      (() => { MV.flat([62, 150, 150], 120); brush.rect(MON.x - 210, SCR.y0 + 40, 150, 12, 'center'); })(),
      (() => { MV.flat([62, 150, 150], 90); brush.rect(MON.x - 210, SCR.y0 + 62, 100, 12, 'center'); })()
    ];
    const bob = Math.sin(t * 2.2) * 4 + beatEnv(t, 9) * 6;
    if (!star) {
      screenClawd(t, {
        y: MON.y + 16 + bob, h: 200, sx: 1, sy: 1,
        face: { eyes: wake > 0.5 ? 'open' : 'closed', mouth: wake > 0.5 ? 'smile' : 'flat', look: [0.1, 0.1] },
        arms: { l: 'down', r: 'down' }
      });
      if (wake < 0.6) MV.drawEmote({ kind: 'zzz', x: MON.x + 120, y: MON.y - 110 + Math.sin(t * 1.7) * 10, s: 60, alpha: 0.7 });
    } else {
      const pop = easeElastic(span(t, 4.35, 4.9));
      screenClawd(t, {
        y: MON.y + 16 + bob, h: 200 * (1 + 0.14 * pop),
        face: { eyes: 'stars', mouth: 'open', look: [0, 0] },
        arms: { l: -2.1, r: Math.PI + 2.1 }
      });
    }
    bezel(t);
    screenGlare();
    // --- sparks bursting out of the screen (in front of everything) ---
    if (t > 4.55) {
      const r = MV.rnd(909);
      const n = 26;
      for (let i = 0; i < n; i++) {
        const born = 4.55 + (i % 13) * 0.11;
        const age = t - born;
        if (age < 0) continue;
        const a = r() * TAU, spd = 190 + r() * 620;
        const px = MON.x + Math.cos(a) * spd * age * 1.1;
        const py = MON.y + Math.sin(a) * spd * age * 0.75 - 40 * age;
        const sz = clamp(46 - age * 24, 12, 52) * (0.6 + r() * 0.8) * (1 + 0.3 * beatEnv(t, 8));
        MV.starShape(px, py, sz, r() > 0.4 ? P.gold2 : P.tealGlow, [120, 90, 40], 4, i);
      }
    }
    // foreground: over-the-shoulder figure (slides out as we dive into the screen)
    const ots = 1 - smooth(span(t, 3.3, 4.0));
    if (ots > 0.01) {
      push(); if (ots < 1) { /* keep silhouette readable while fading */ }
      backOfResearcher(t, -760, 430, 1.75 + 0.06 * Math.sin(t * 1.5));
      pop();
    }
    MV.camPop();
    // star reflections in the glasses during the recoil
    if (t > 5.45) {
      const a = smooth(span(t, 5.45, 5.8));
      MV.cam(cam);
      push(); translate(-600, 330); rotate(-0.12);
      for (const [gx, sc] of [[-165, 1], [185, 1.05]]) {
        MV.flat([64, 118, 138], 215 * a); brush.polygon(MV.wobbleEllipse(gx, 0, 210 * sc, 185 * sc, 31 + gx, 22, 0.05));
        MV.flat([16, 20, 40], 200 * a); brush.polygon(MV.wobbleEllipse(gx, 0, 168 * sc, 145 * sc, 33 + gx, 22, 0.05));
        MV.ink([246, 240, 224], 9 * a, 'pen'); brush.circle(gx, 0, 205 * sc);
        MV.flat([150, 226, 226], 70 * a); brush.polygon(MV.wobbleEllipse(gx - 60 * sc, -56 * sc, 90 * sc, 66 * sc, 33 + gx, 18, 0.12));
        for (const [sx, sy, sz] of [[gx - 60, -24, 52], [gx + 44, 34, 34], [gx + 22, -66, 26]]) {
          MV.starShape(sx, sy, sz * sc * (0.85 + 0.4 * beatEnv(t, 6)) * a, P.gold2, [120, 80, 30], 4, sx);
        }
      }
      MV.ink([246, 240, 224], 9 * a, 'pen'); brush.line(-70, -14, 70, -14);
      pop();
      MV.camPop();
    }
  }

  // ---------------------------------------------------------------- seg 2: reverse shot (6.0–8.0)
  // circuit traces crawling out of the monitor across the walls like vines
  function circuits(t, t0, t1, seed = 7) {
    MV.__stage = 'circuits';
    const p = smooth(span(t, t0, t1));
    if (p <= 0) return;
    const vines = 6;
    for (let v = 0; v < vines; v++) {
      const r = MV.rnd(seed * 97 + v * 13);
      const a0 = -0.9 + (v / (vines - 1)) * 3.0;              // angle spreading up-left..up-right
      const full = 420 + r() * 560;
      const len = full * clamp(p * (0.7 + r() * 0.6));
      const pts = [[MON.x, MON.y + (r() - 0.5) * 300]];
      let x = pts[0][0], y = pts[0][1], ang = a0;
      const seg = 90;
      for (let i = 0; i < Math.ceil(len / seg); i++) {
        ang += (MV.vnoise(i * 0.8 + v * 3, seed + v) - 0.5) * 0.9;
        x += Math.cos(ang) * seg; y += Math.sin(ang) * seg;
        pts.push([x, y]);
      }
      MV.polyline(pts, P.tealGlow, 1.5 + r() * 1.2, 'pen');
      MV.polyline(pts, P.teal, 0.9, 'pen');
      // nodes
      push(); noStroke(); fill(css(P.tealGlow, 0.85));
      for (let i = 2; i < pts.length; i += 2) circle(pts[i][0], pts[i][1], 9 + 5 * MV.vnoise(i, v));
      pop();
      // small leaves/pads at the tips
      if (pts.length > 3) {
        const tip = pts[pts.length - 1];
        MV.flat([70, 170, 168], 200); brush.circle(tip[0], tip[1], 16 + 8 * r());
      }
    }
  }

  function seg2(t) {
    MV.__stage = 'seg2';
    const dolly = smooth(span(t, 6.0, 7.9));
    const sh = shake(t, 3, 9, 5);
    const cam = { x: -30 + sh[0], y: -70 - 26 * dolly + sh[1], zoom: 1.44 * beatPush(t, 0.016) };
    MV.cam(cam);
    wall(t); props(t); lamp(t);
    circuits(t, 6.15, 7.95, 7);
    // researcher on a rolling chair, scooting back
    const scoot = easeOut(span(t, 6.35, 7.9));
    const s = 520, rx = 20 - 190 * scoot, ry = 250 + 24 * scoot;
    chair(t, rx + 34, ry - 0.30 * s + 8, 1.3, scoot, false);
    MV.researcher({
      x: rx, y: ry, s: s, pose: 'sit', seed: 3, flip: false,
      face: {
        glasses: t < 6.5 ? 'star' : t < 6.95 ? 'plain' : 'sweat',
        look: [-0.3 + 0.5 * scoot, 0.15], mouth: t < 6.5 ? 'oh' : 'flat',
        sweatN: t > 7.0 ? 3 : 0
      },
      arms: { l: -2.1 + 0.5 * scoot, r: -1.9 + 0.4 * scoot }
    });
    // monitor back in the foreground, silhouetted across the bottom-left
    MV.flat([14, 18, 34], 255);
    brush.polygon([[-1000, 470], [1000, 470], [1000, 570], [-1000, 570]]);
    MV.flat([30, 36, 60], 255);
    brush.polygon([[-1000, 420], [-420, 420], [-330, 470], [-1000, 470]]);
    MV.flat([18, 22, 40], 255);
    brush.polygon([[-1000, 300], [-760, 300], [-700, 470], [-1000, 470]]);
    MV.camPop();
    // a trace crawls over the lens at the very end
    if (t > 7.8) {
      const q = smooth(span(t, 7.8, 8.0));
      MV.ink(P.tealGlow, 3.4, 'pen');
      const pts = [];
      for (let i = 0; i <= 22; i++) {
        const u = i / 22;
        const x = lerp(-1000, -1000 + 2400 * q, u);
        const y = -420 + Math.sin(u * 2.4 + 1) * 120 + MV.vnoise(u * 4, 3) * 160 - 80;
        pts.push([x, y]);
      }
      MV.polyline(pts, P.tealGlow, 3.4, 'pen');
      MV.polyline(pts, P.teal, 1.6, 'pen');
      push(); noStroke(); fill(css(P.tealGlow, 0.9));
      for (let i = 0; i < pts.length; i += 3) circle(pts[i][0], pts[i][1], 12);
      pop();
    }
  }

  // ---------------------------------------------------------------- seg 3: shrug + wink + loss chart (8.0–9.0)
  function lossChart(x, y, s, grow, t, mini = false) {
    MV.__stage = 'lossChart';
    push(); translate(x, y); scale(s * grow);
    const w = 400, h = 260;
    MV.flat([18, 40, 48], 250); brush.polygon(MV.rrect(0, 0, w, h, 16, 91, 3));
    MV.ink(P.tealGlow, 2, 'pen'); brush.polygon(MV.rrect(0, 0, w, h, 16, 91, 3));
    MV.ink([70, 170, 168], 1.2, 'pen');
    brush.line(-w / 2 + 20, h / 2 - 30, w / 2 - 20, h / 2 - 30);
    brush.line(-w / 2 + 30, -h / 2 + 20, -w / 2 + 30, h / 2 - 20);
    if (!mini) {
      MV.propText('training loss', 0, -h / 2 + 34, { font: '700 30px "Segoe UI", sans-serif', color: '#bfe8e0', outline: false, cam: MV.curCam, size: 30 });
    }
    // flat-ish curve then the drop
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const yy = -h * 0.18 + Math.sin(u * 9) * 8 + MV.vnoise(u * 5, 2) * 14 + Math.pow(clamp((u - 0.55) / 0.45), 3) * h * 0.7;
      pts.push([lerp(-w / 2 + 40, w / 2 - 24, u), yy]);
    }
    MV.polyline(pts, P.tealGlow, 1.8, 'pen');
    pop();
  }

  function seg3(t) {
    MV.__stage = 'seg3';
    const cam = { x: 0, y: 0 - 10 * smooth(span(t, 8.0, 8.95)), zoom: 1.55 * beatPush(t, 0.02) };
    MV.curCam = cam;
    MV.cam(cam);
    wall(t); props(t); desk(t);
    monitorBody(t, 0.55);
    screenBase(255);
    const wink = t > 8.5;
    const shrug = smooth(span(t, 8.12, 8.4));
    const hop = beatEnv(t, 8) * 12;
    screenClawd(t, {
      y: MON.y + 20 - hop, h: 200,
      face: { eyes: 'open', mouth: shrug > 0.6 ? 'oh' : 'smile', look: [0.25, 0], wink },
      arms: { l: lerp('down', 'shrugL', shrug), r: lerp('down', 'shrugR', shrug) },
      sx: 1 + 0.04 * shrug, sy: 1 - 0.05 * shrug
    });
    bezel(t);
    screenGlare();
    MV.camPop();
    // loss chart pops up beside the monitor (in world space, riding the camera)
    const p = easeBack(span(t, 8.18, 8.5));
    if (p > 0.01) lossChart(560, -60, 0.9, p, t);
  }

  // ---------------------------------------------------------------- seg 4: the loss-curve ride (9.0–13.0)
  // the loss curve steps down on every beat while Clawd sleds it
  function curveY(x, t) {
    MV.__stage = 'curveY';
    const u = clamp((x + 1150) / 1500);
    const base = -300 + Math.pow(u, 2.6) * 560 + u * 90;
    const k = Math.max(0, beatIndex(t) - beatIndex(9.0));
    return base - k * 16 + MV.vnoise(u * 6, 4) * 16;
  }
  function chart(t) {
    MV.__stage = 'chart';
    // inside-the-screen world: dark teal field + glowing grid
    MV.flat([10, 34, 44], 255);
    brush.polygon([[-1600, -900], [1600, -900], [1600, 900], [-1600, 900]]);
    push(); noStroke();
    for (let i = -8; i <= 8; i++) {
      fill(css([64, 150, 152], 0.16)); rect(-1600, i * 120 - 2, 3200, 4);
      fill(css([64, 150, 152], 0.13)); rect(i * 150 - 2, -900, 4, 1800);
    }
    pop();
    // axis hint
    MV.ink([80, 176, 172], 1.6, 'pen');
    brush.line(-1300, 330, 700, 330);
    MV.propText('training loss', -150, -470, { cam: MV.curCam, font: '700 54px "Segoe UI", sans-serif', color: '#a8e2dc', outline: false, size: 54, alpha: 0.85 });
    MV.propText('steps →', 560, 380, { cam: MV.curCam, font: '700 40px "Segoe UI", sans-serif', color: '#88ccc6', outline: false, size: 40, alpha: 0.8 });
    // the curve (+ glow underlay)
    const pts = [];
    for (let i = 0; i <= 90; i++) { const x = lerp(-1200, 420, i / 90); pts.push([x, curveY(x, t)]); }
    MV.polyline(pts, [30, 60, 70], 4.5, 'pen');
    MV.polyline(pts, P.tealGlow, 2.4, 'pen');
    push(); noStroke(); fill(css(P.tealGlow, 0.5));
    for (let i = 0; i < pts.length; i += 6) circle(pts[i][0], pts[i][1], 8);
    pop();
    // the cliff the curve plunges off
    MV.flat([6, 20, 28], 255);
    brush.polygon([[420, -900], [1600, -900], [1600, 900], [520, 900]]);
    MV.ink([120, 200, 196], 3, 'pen');
    brush.line(420, -700, 420, 900);
    MV.flat([16, 44, 54], 255);
    brush.polygon([[520, 330], [1600, 330], [1600, 900], [520, 900]]);
    return pts;
  }
  function seg4(t) {
    MV.__stage = 'seg4';
    if (t >= 12.3) { burstOut(t); return; }
    // ---- ride ----
    const phase = t < 11.3 ? 'ride' : t < 11.85 ? 'fly' : 'splash';
    const u = easeIn(span(t, 9.35, 11.3)) * 0.82;
    let cx, cy, rot = 0;
    if (phase === 'ride') {
      cx = lerp(-880, 400, u);
      cy = curveY(cx, t) - 46;
      const dy = curveY(cx + 30, t) - curveY(cx - 30, t);
      rot = Math.atan2(dy, 60) * 0.5;
    } else if (phase === 'fly') {
      const a = span(t, 11.3, 11.85);
      cx = 400 + 420 * a;
      cy = curveY(400, t) - 46 + a * a * 620 - a * 120;
      rot = 0.6 + a * 2.2;
    } else {
      const a = span(t, 11.85, 12.3);
      cx = 820; cy = 300 + 10 * (1 - smooth(a));
      rot = 3.4;
    }
    const aFly = smooth(span(t, 11.25, 12.0));
    const cam = {
      x: lerp(-cx * 0.34, -cx * 0.74, aFly),
      y: lerp(-34 - (phase === 'ride' ? clamp(curveY(cx, t) * 0.18, -120, 160) : 0), -cy * 0.42 - 40, aFly),
      zoom: lerp(1.0, 1.22, smooth(span(t, 11.5, 12.3))) * beatPush(t, 0.016),
      rot: phase === 'ride' ? rot * 0.22 : rot * 0.14
    };
    MV.curCam = cam;
    MV.cam(cam);
    chart(t);
    // splash puddle at the bottom of the cliff
    if (t > 11.7) {
      const a = smooth(span(t, 11.7, 12.28));
      // cliff face receding
      MV.flat([6, 18, 26], 255);
      brush.polygon([[420, -900], [1600, -900], [1600, 900], [520, 900]]);
      MV.ink([110, 190, 186], 2.6, 'pen');
      brush.line(420, -900, 500, 900);
      // pool of paint
      MV.wc(MV.blob(820, 330, 110 + 190 * a, 40 + 54 * a, 41, 26, 0.1), P.teal, 220, 41, { bodyAlpha: 70 });
      MV.flat([120, 216, 214], 200);
      brush.polygon(MV.blob(820, 336, 90 + 150 * a, 26 + 34 * a, 42, 22, 0.1));
      const r = MV.rnd(555);
      push(); noStroke();
      for (let i = 0; i < 22; i++) {
        const ang = -Math.PI * (0.08 + r() * 0.84), spd = (200 + r() * 460) * a;
        const px = 820 + Math.cos(ang) * spd * a * 0.9;
        const py = 330 - Math.abs(Math.sin(ang)) * spd * a;
        fill(css(P.tealGlow, 0.9 * (1 - a * 0.25)));
        circle(px, py, (18 + r() * 26) * (1 - a * 0.3));
      }
      pop();
    }
    // Clawd sledding
    if (t > 9.1) {
      if (phase === 'fly') {
        const af = span(t, 11.3, 11.85);
        const trail = [];
        for (let i = 0; i <= 16; i++) {
          const uu = Math.max(0, af - i * 0.038);
          trail.push([400 + 420 * uu, curveY(400, t) - 46 + uu * uu * 620 - uu * 120]);
        }
        MV.polyline(trail, [110, 196, 196], 5, 'pen');
        MV.polyline(trail, [206, 246, 244], 2, 'pen');
      }
      const hop = phase === 'ride' ? Math.abs(Math.sin(t * 9)) * 8 + beatEnv(t, 8) * 10 : 0;
      MV.clawd({
        x: cx, y: cy - hop, h: phase === 'fly' ? 180 : 150, seed: 21, rot: phase === 'ride' ? -rot * 0.5 : rot,
        face: { eyes: phase === 'fly' ? 'scared' : 'happy', mouth: phase === 'fly' ? 'oh' : 'smile', look: [0.2, 0.2] },
        arms: { l: -2.3, r: Math.PI + 2.2 },
        extras: phase === 'fly' ? [] : ['sweatband'],
        sx: phase === 'fly' ? 1.1 : 1, sy: phase === 'fly' ? 0.9 : 1
      });
      if (phase === 'ride') MV.drawEmote({ kind: 'sparkle', x: cx + 90, y: cy - 90, s: 26 + 20 * beatEnv(t, 8), alpha: 0.8 });
    }
    // wake of paint behind the sled
    if (phase === 'ride' && t > 9.5) {
      const r = MV.rnd(77);
      push(); noStroke(); fill(css(P.tealGlow, 0.55));
      for (let i = 0; i < 10; i++) {
        const back = -40 - i * 34 - r() * 20;
        const px = cx + back, py = curveY(px, t) - 20 - r() * 26;
        circle(px, py, 8 + r() * 16);
      }
      pop();
    }
    MV.camPop();
  }

  // Clawd bursts out of the monitor at full size
  function burstOut(t) {
    MV.__stage = 'burstOut';
    const a = easeOut3(span(t, 12.4, 12.95));
    const cam = { x: 0, y: -20, zoom: 1.12 + 0.1 * a + 0.03 * beatEnv(t, 7), rot: 0 };
    MV.curCam = cam;
    MV.cam(cam);
    wall(t); props(t); lamp(t); desk(t);
    monitorBody(t, 0.6);
    screenBase(255);
    // cracked screen
    MV.ink([190, 240, 235], 2.2, 'pen');
    for (const [ax, ay, bx, by] of [[-200, -60, 240, 120], [-160, 120, 210, -30], [0, -160, 60, 150]]) brush.line(ax, ay, bx, by);
    screenClawd(t, { y: MON.y + 40, h: 120, face: { eyes: 'scared', mouth: 'oh' }, arms: { l: 'up', r: 'up' } });
    bezel(t);
    MV.camPop();
    // giant Clawd leaping toward the camera, out of the frame
    const lean = lerp(0.2, -0.25, a);
    const px = lerp(MON.x, 60, a);
    const py = lerp(MON.y + 60, 470, a) + Math.sin(a * Math.PI) * -180;
    MV.clawd({
      x: px, y: py, h: lerp(160, 620, a), seed: 31, rot: lean,
      face: { eyes: a < 0.8 ? 'open' : 'happy', mouth: 'open', look: [0, 0.2] },
      arms: { l: -2.4, r: Math.PI + 2.3 },
      extras: [],
      sx: 1 + 0.1 * a, sy: 1 - 0.08 * a
    });
    // splash of sparks
    const r = MV.rnd(818);
    push(); noStroke(); fill(css(P.tealGlow, 0.8 * (1 - a)));
    for (let i = 0; i < 20; i++) circle(MON.x + (r() - 0.5) * 700 * (0.4 + a), MON.y + (r() - 0.5) * 560 * (0.4 + a), 10 + r() * 26 * (1 - a * 0.5));
    pop();
  }

  // ---------------------------------------------------------------- seg 5: villain chair spin (13.0–17.9)
  function mug(x, y, s, rot = 0, t = 0) {
    MV.__stage = 'mug';
    push(); translate(x, y); rotate(rot); scale(s);
    MV.flat([232, 230, 222], 250);
    brush.polygon(MV.rrect(0, 0, 74, 84, 12, 61, 2));
    MV.ink([120, 116, 108], 1.6, 'pen'); brush.polygon(MV.rrect(0, 0, 74, 84, 12, 61, 2));
    MV.flat([232, 230, 222], 250); brush.polygon(MV.rrect(46, 0, 24, 34, 12, 62, 2));
    MV.ink([120, 116, 108], 1.4, 'pen'); brush.polygon(MV.rrect(46, 0, 24, 34, 12, 62, 2));
    MV.flat([96, 64, 46], 250); brush.polygon(MV.blob(0, -28, 32, 13, 63, 16, 0.12));
    push(); noStroke(); noFill(); stroke(css([242, 240, 234], 0.5)); strokeWeight(Math.max(3, 7));
    for (const dx of [-16, 0, 16]) {
      const pts = [];
      for (let i = 0; i <= 7; i++) pts.push([dx + Math.sin(i * 0.8 + dx * 0.3 + t * 1.6) * 9, -56 - i * 15]);
      for (let i = 1; i < pts.length; i++) line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    }
    pop();
    pop();
  }

  // ---- swivel-chair reveal: painted three-view (front / side / back) driven by yaw ----
  // a limb as a capsule (limbBlock is private to characters.js)
  function limbCap(ax, ay, bx, by, th, col) {
    const rot = Math.atan2(by - ay, bx - ax);
    const seed = Math.round(Math.abs(ax * 7 + ay * 13 + bx * 3)) % 97;
    const pts = MV.wobbleRoundRect((ax + bx) / 2, (ay + by) / 2, Math.hypot(bx - ax, by - ay) + th * 0.5, th, th * 0.5, seed, 4, th * 0.06, rot);
    MV.flat(col, 250); brush.polygon(pts);
    MV.ink(shadeDark(col, 52), Math.max(0.6, th * 0.06), 'pen'); brush.polygon(pts);
    MV.flat(col, 252); brush.circle(bx, by, th * 0.52);
    MV.ink(shadeDark(col, 52), Math.max(0.6, th * 0.06), 'pen'); brush.circle(bx, by, th * 0.52);
  }
  function crownBand(cy, w, h) {
    const pts = [[-w, cy], [-w, cy - h * 0.2], [-w * 0.5, cy - h * 0.05], [0, cy - h * 0.26], [w * 0.5, cy - h * 0.05], [w, cy - h * 0.2], [w, cy]];
    MV.flat(PAL.gold, 250); brush.polygon(pts);
    MV.ink([132, 92, 30], h * 0.02, 'pen'); brush.polygon(pts);
    push(); noStroke(); fill(css(PAL.rose, 0.9)); circle(0, cy - h * 0.05, h * 0.05); pop();
  }
  // chair parts: `plate` = backrest (pass 'behind' or 'front' of Clawd)
  function chairSpin(t, x, y, theta, s = 1.25) {
    MV.__stage = 'chairSpin';
    const absC = Math.abs(Math.cos(theta));
    const seatW = lerp(210, 290, absC);
    push(); translate(x, y); scale(s);
    MV.flat([70, 76, 108], 250); brush.rect(0, 46, 20, 74, 'center');
    MV.ink([30, 34, 56], 2, 'pen'); brush.rect(0, 46, 20, 74, 'center');
    MV.flat([60, 66, 98], 250); brush.polygon([[-86, 86], [86, 86], [64, 98], [-64, 98]]);
    push(); noStroke(); fill(css([40, 44, 70], 0.95));
    for (const cx of [-86, 86, 0]) circle(cx * (0.55 + 0.45 * absC), 102, 22); pop();
    // armrests (they keep the yaw readable even when the backrest is edge-on)
    for (const sg of [-1, 1]) {
      const armW = lerp(120, 44, absC);
      const pts = MV.rrect(sg * (seatW * 0.5 - armW * 0.5), -56, armW, 22, 9, 91 + sg, 2);
      MV.flat([122, 128, 156], 250); brush.polygon(pts);
      MV.ink([30, 34, 56], 1.8, 'pen'); brush.polygon(pts);
    }
    const seat = MV.rrect(0, -6, seatW, 34 + 8 * absC, 13, 71, 2);
    MV.flat([134, 140, 168], 252); brush.polygon(seat);
    MV.ink([26, 30, 52], 2, 'pen'); brush.polygon(seat);
    pop();
  }
  function chairBackrest(t, x, y, theta, s = 1.25, alpha = 252) {
    const absC = Math.abs(Math.cos(theta));
    const w = lerp(30, 300, absC);
    push(); translate(x, y); scale(s);
    const pts = MV.rrect(0, -76, w, 150, 28, 72, 2);
    MV.flat([140, 146, 172], alpha); brush.polygon(pts);
    MV.ink([26, 30, 52], 2.2, 'pen'); brush.polygon(pts);
    if (w > 150) { MV.flat([92, 98, 132], 110); brush.polygon(MV.rrect(-40, -86, w * 0.46, 96, 24, 73, 2)); }
    pop();
  }
  // Clawd: back view (lunchbox hinge side) and profile view
  function clawdBackView(t, x, y, h, sx, crown) {
    const hw = h * 0.8, hh = h * 0.5, col = PAL.clawd, limb = shadeDark(col, 30);
    push(); translate(x, y); scale(sx, 1);
    for (const s of [-1, 1]) limbCap(s * hw * 0.86, -hh * 0.06, s * hw * 1.5, hh * 0.32, h * 0.16, limb);
    const body = MV.wobbleRoundRect(0, 0, hw * 2, hh * 2, h * 0.34, 41, 7, h * 0.018);
    MV.wc(body, col, 252, 41, { bodyAlpha: 74, tex: 0.3, border: 0.5 });
    MV.ink([58, 38, 30], h * 0.021, 'pen'); brush.polygon(body);
    MV.ink([150, 88, 44], h * 0.022, 'pen');
    brush.line(-hw * 0.82, -hh * 0.26, hw * 0.82, -hh * 0.26);
    brush.line(-hw * 0.62, hh * 0.52, hw * 0.62, hh * 0.52);
    MV.flat([192, 120, 54], 245); brush.circle(0, -hh * 0.78, h * 0.1);
    MV.ink([122, 68, 30], h * 0.02, 'pen'); brush.circle(0, -hh * 0.78, h * 0.1);
    MV.flat(limb, 250);
    brush.polygon(MV.rrect(-hw * 0.34, hh * 1.0, h * 0.15, h * 0.3, h * 0.07, 51));
    brush.polygon(MV.rrect(hw * 0.34, hh * 1.0, h * 0.15, h * 0.3, h * 0.07, 52));
    if (crown) crownBand(-hh * 1.02, hw * 0.62, h);
    pop();
  }
  function clawdSideView(t, x, y, h, dir, crown) {
    const bh = h * 0.5, bw = h * 0.36, col = PAL.clawd, limb = shadeDark(col, 30);
    push(); translate(x, y); scale(dir, 1);
    limbCap(bw * 0.2, -bh * 0.14, bw * 1.45, bh * 0.42, h * 0.15, limb);
    const body = MV.wobbleRoundRect(0, 0, bw * 2, bh * 2, h * 0.32, 43, 7, h * 0.02);
    MV.wc(body, col, 252, 43, { bodyAlpha: 74, tex: 0.3, border: 0.5 });
    MV.bloom(shadeDark(col, 44), 70);
    brush.polygon(MV.wobbleEllipse(bw * 0.34, bh * 0.5, bw * 0.5, bh * 0.42, 46, 18, 0.1));
    MV.ink([58, 38, 30], h * 0.021, 'pen'); brush.polygon(body);
    // single eye on the leading edge
    MV.flat([252, 250, 244], 245); brush.circle(bw * 0.42, -bh * 0.1, h * 0.145);
    MV.ink([60, 50, 50], h * 0.019, 'pen'); brush.circle(bw * 0.42, -bh * 0.1, h * 0.145);
    MV.flat([58, 38, 30], 250); brush.circle(bw * 0.55, -bh * 0.1, h * 0.075);
    MV.ink([58, 38, 30], h * 0.022, 'pen');
    brush.line(bw * 0.2, bh * 0.4, bw * 0.95, bh * 0.34);
    if (crown) crownBand(-bh * 1.02, bw * 0.72, h);
    pop();
  }

  function fan(x, y, s, rot) {
    MV.__stage = 'fan';
    push(); translate(x, y); rotate(rot); scale(s);
    MV.flat([214, 168, 96], 250); brush.polygon(MV.blob(0, -60, 70, 78, 71, 20, 0.1));
    MV.ink([120, 86, 40], 1.8, 'pen'); brush.polygon(MV.blob(0, -60, 70, 78, 71, 20, 0.1));
    MV.flat([176, 122, 60], 250); brush.rect(0, 14, 16, 60, 'center');
    for (let i = 0; i < 4; i++) { MV.ink([150, 108, 52], 1.4, 'pen'); brush.line(-46 + i * 30, -20, -60 + i * 30, -120); }
    pop();
  }

  function seg5(t) {
    MV.__stage = 'seg5';
    // villain chair-spin: the chair swivels a half turn and lands facing us
    const spinU = span(t, 12.86, 14.0);
    const wob = Math.sin(Math.PI * span(t, 14.0, 14.58)) * 0.17;   // settle wobble after landing
    const theta = Math.PI * easeInOut(spinU) + Math.PI * wob;
    const c0 = Math.cos(theta), absC = Math.abs(c0);
    // theta = 0 → his back to us, theta = π → facing us (cos<0 == front)
    const view = absC < 0.42 ? 'side' : (c0 < 0 ? 'front' : 'back');
    const sxBody = 0.62 + 0.38 * absC;                              // continuous width across the switch
    const crownPop = smooth(span(t, 14.12, 14.45));
    const spinSmear = clamp((Math.abs(easeInOut(Math.min(1, spinU + 0.05)) - easeInOut(Math.max(0, spinU - 0.05))) * Math.PI / 0.1 - 3) / 7, 0, 1);
    const beatPop = 1 + 0.06 * beatEnv(t, 8);
    const sh = shake(t, 7, 8, 9);
    const cam = { x: 40 + sh[0], y: -50 + sh[1], zoom: 1.02 * beatPop };
    MV.curCam = cam;
    MV.cam(cam);
    wall(t); props(t); lamp(t); desk(t);
    // villain spotlight
    MV.glow(-40, -60, 620, P.gold, 0.32 + 0.1 * beatEnv(t, 6), 8);
    const chairX = -40, chairY = 210;
    const bounce = beatEnv(t, 9) * 16;
    const cy = chairY - 150 - bounce;
    chairSpin(t, chairX, chairY, theta, 1.5);
    if (view !== 'back') chairBackrest(t, chairX, chairY, theta, 1.5);   // the backrest sits behind him
    if (spinSmear > 0.05) {
      // motion smear: ghost plates + speed arcs while the chair whips around
      for (let i = 1; i <= 3; i++) {
        const gTh = theta - Math.sign(Math.sin(theta) || 1) * i * 0.34;
        const gW = lerp(30, 300, Math.abs(Math.cos(gTh))) * 1.5;
        push(); MV.flat([126, 132, 160], (70 / i) * spinSmear);
        brush.polygon(MV.rrect(chairX + (i % 2 ? 50 : -50) * i, chairY - 118, gW, 225, 42, 72 + i, 2)); pop();
      }
      MV.ink([236, 236, 244], 3, 'pen');
      for (let i = 0; i < 3; i++) {
        const r = 96 + i * 34;
        for (let k = 0; k < 7; k++) {
          const a0 = -0.5 + k * 0.16, a1 = a0 + 0.09;
          brush.line(chairX + Math.cos(a0) * r, chairY - 120 + Math.sin(a0) * r * 0.9,
                     chairX + Math.cos(a1) * r, chairY - 120 + Math.sin(a1) * r * 0.9);
        }
      }
    }
    // ---- Clawd on the chair ----
    if (t > 12.98) {
      if (view === 'front') {
        MV.clawd({
          x: chairX, y: cy, h: 240, seed: 41, sx: sxBody,
          face: crownPop > 0.4
            ? { eyes: 'open', mouth: 'open', look: [-0.2, 0.1], blush: false }
            : { eyes: 'open', mouth: 'smile', look: [-0.2, 0.1] },
          arms: { l: -2.3, r: Math.PI + 2.35 },
          extras: crownPop > 0.05 ? ['crown'] : [],
          rot: -0.06
        });
      } else if (view === 'back') {
        clawdBackView(t, chairX, cy, 240, sxBody, crownPop > 0.05);
      } else {
        clawdSideView(t, chairX, cy, 240, Math.sign(Math.sin(theta)) || 1, crownPop > 0.05);
      }
    }
    if (view === 'back') chairBackrest(t, chairX, chairY, theta, 1.5);    // his back to us: the plate covers his torso
    if (t > 14.25) MV.drawEmote({ kind: 'note', x: chairX + 210, y: chairY - 380, s: 60 + 20 * beatEnv(t, 8), alpha: 0.9 });
    // ---- the Researcher, bow-tied, serving ----
    const enter = smooth(span(t, 14.3, 14.95));
    const runX = lerp(-980, -560, easeOut3(span(t, 14.3, 14.9)));
    const settled = t > 14.95;
    const rx = settled ? -600 + Math.sin(t * 3.1) * 6 : runX;
    const ry = settled ? 330 : 330 - Math.abs(Math.sin(t * 9)) * 8;
    MV.researcher({
      x: rx, y: ry, s: 400, seed: 5,
      pose: settled ? 'waiter' : 'run',
      bowtie: true, mug: !settled,
      face: { look: [0.4, 0], mouth: settled ? 'smile' : 'oh', sweatN: settled ? 2 : 1 },
      arms: settled ? { l: -1.85, r: -0.55 } : { l: -0.9, r: 2.4 }
    });
    if (settled) fan(rx + 210, ry - 300, 0.85, -0.5 + Math.sin(t * 7) * 0.35);
    if (t > 14.5 && !settled) { mug(rx + 120, ry - 380, 0.7, -0.2, t); mug(rx + 168, ry - 350, 0.62, 0.3, t); }
    // ---- mug pile that grows on the beat ----
    const k0 = beatIndex(14.4), kNow = beatIndex(t);
    const pile = clamp(kNow - k0, 0, 9);
    const r = MV.rnd(404);
    for (let i = 0; i < pile; i++) {
      const row = Math.floor(i / 3), c = i % 3;
      const born = beatTime(k0 + Math.floor(i / 2) + 1);
      const popA = easeBack(clamp((t - born) / 0.35));
      if (popA <= 0.01) continue;
      mug(-360 + c * 78 + r() * 10, 320 - row * 62 - (1 - popA) * 120, 0.62, (r() - 0.5) * 0.5, t);
    }
    MV.camPop();
    // lid creaks open at the end
    if (t > 16.15) {
      const o = smooth(span(t, 16.15, 16.6)) * 0.34;
      const cl = { x: chairX, y: chairY - 150 - bounce, zoom: 1.35 };
      MV.curCam = cam;
      MV.cam(cam);
      MV.clawd({ x: chairX, y: chairY - 150, h: 240, seed: 41, face: { eyes: 'open', mouth: 'open', look: [0, 0] }, arms: { l: -2.3, r: Math.PI + 2.35 }, extras: ['crown'], lidOpen: o });
      MV.camPop();
      // creak lines
      const q = smooth(span(t, 16.15, 16.5));
      MV.ink([250, 244, 226], 1.6, 'pen');
      for (let i = 0; i < 4; i++) {
        const a = -1.9 - i * 0.34;
        const x0 = chairX + Math.cos(a) * 200 * (0.7 + q * 0.5), y0 = chairY - 150 + Math.sin(a) * 200;
        brush.line(x0, y0, x0 + Math.cos(a) * 70 * q, y0 + Math.sin(a) * 70 * q);
      }
    }
  }

  // ---------------------------------------------------------------- seg 6: door chase (17.9–23.0)
  const DOORS = [-520, 0, 520];
  function hallway(t) {
    MV.__stage = 'hallway';
    MV.flat([30, 36, 62], 255);
    brush.polygon([[-1000, -560], [1000, -560], [1000, 560], [-1000, 560]]);
    // corridor perspective floor
    MV.flat([64, 54, 60], 255);
    brush.polygon([[-1000, 400], [1000, 400], [640, 250], [-640, 250]]);
    for (let i = 0; i < 5; i++) { MV.ink([46, 38, 46], 1.8, 'pen'); const y = lerp(250, 400, (i / 5) ** 0.8); brush.line(-1000, y, 1000, y); }
    MV.flat([48, 44, 70], 255);
    brush.polygon([[-1000, 250], [1000, 250], [1000, 400], [-1000, 400]]);
    // baseboard
    MV.flat([86, 78, 96], 220);
    brush.polygon([[-1000, 244], [1000, 244], [1000, 262], [-1000, 262]]);
    for (const dx of DOORS) doors(dx);
    // sconces
    for (const sx of [-760, 760]) {
      MV.glow(sx, -220, 200, P.lamp, 0.4, 6);
      MV.flat(P.lamp, 240); brush.polygon(MV.blob(sx, -220, 34, 46, sx, 16, 0.12));
      MV.ink([120, 86, 40], 1.6, 'pen'); brush.polygon(MV.blob(sx, -220, 34, 46, sx + 1, 16, 0.12));
    }
  }
  function doors(dx) {
    MV.__stage = 'doors';
    MV.flat([128, 78, 60], 250);
    brush.polygon([[dx - 220, -60], [dx + 220, -60], [dx + 220, 252], [dx - 220, 252]]);
    MV.flat([74, 44, 38], 250);
    brush.polygon([[dx - 186, -30], [dx + 186, -30], [dx + 186, 240], [dx - 186, 240]]);
    MV.ink([38, 22, 20], 2.2, 'pen');
    brush.polygon([[dx - 186, -30], [dx + 186, -30], [dx + 186, 240], [dx - 186, 240]]);
    MV.glow(dx + 132, 100, 46, [255, 226, 150], 0.5, 4);
    MV.flat([255, 232, 160], 250); brush.circle(dx + 132, 100, 15);
  }

  function seg6(t) {
    MV.__stage = 'seg6';
    const k0 = beatIndex(17.9);
    const k = beatIndex(t);
    const ph = beatPhase(t);
    const grow = 1 + 0.17 * clamp(k - k0, 0, 12);
    const chomp = t > 21.35;
    if (!chomp) {
      const cam = { x: 0, y: -20, zoom: (1.0 + 0.05 * (k - k0)) * beatPush(t, 0.02), rot: 0 };
      MV.curCam = cam;
      MV.cam(cam);
      hallway(t);
      // the pair swaps doors on every beat (Scooby-Doo), sliding across
      const idxA = k % 3, idxB = (k + 2) % 3;
      const slide = smooth(ph * 2.4);
      const prev = (k - 1) % 3;
      const rx = lerp(DOORS[prev], DOORS[idxA], slide);
      const cx = lerp(DOORS[(prev + 1) % 3], DOORS[idxB], slide);
      const bobR = Math.abs(Math.sin(t * 11)) * 14;
      const bobC = Math.abs(Math.sin(t * 8)) * 10;
      MV.researcher({
        x: rx, y: 240 - bobR, s: 360, seed: 6, pose: 'run', flip: rx > 0,
        face: { look: [0.3, 0], mouth: 'oh', sweatN: 2 }
      });
      MV.clawd({
        x: cx, y: 210 - bobC, h: 230 * grow, seed: 51, lidOpen: 1,
        face: { eyes: 'open', mouth: 'none', look: [0, 0] },
        arms: { l: -1.9, r: Math.PI + 1.9 }, sx: 1, sy: 1
      });
      // dust puffs on the beat
      if (beatEnv(t, 9) > 0.45) {
        push(); noStroke(); fill(css([200, 196, 186], 0.35 * beatEnv(t, 9)));
        for (let i = 0; i < 5; i++) circle(rx + (i - 2) * 40, 240 + 20, 26);
        pop();
      }
      MV.camPop();
      // speed lines
      MV.ink([250, 244, 226], 1.2, 'pen');
      for (let i = 0; i < 7; i++) {
        const y = -400 + i * 110 + MV.vnoise(i, 3) * 40;
        const len = 120 + MV.vnoise(i, 7) * 160;
        brush.line(-980, y, -980 + len, y);
      }
      return;
    }
    // ---- CHOMP: we are inside the mouth; the jaws close and the frame goes black ----
    // LAYERED + RIGID (no vertical squashing): each jaw is a rigid plate that TRANSLATES,
    // so the teeth keep their shape; the opening closes because they travel, the throat is
    // merely occluded, and the fade-to-black is painted by the gum masses themselves —
    // p5.brush flushes the LAST wash batch of the frame on top of everything else (measured).
    //   layer 1: throat + tongue (deep, fixed)
    //   layer 2: lower jaw (teeth up + gum below)
    //   layer 3: upper jaw (teeth down + gum above) → wraps on top, so it ends up front
    const bite = easeInOut(span(t, 21.42, 22.02));       // jaws travel (teeth clash at 1)
    const cover = easeInOut(span(t, 22.0, 22.42));       // the gums then slide over the whole frame
    const darken = smooth(span(t, 22.02, 22.42));        // …and lerp to black
    const gap = lerp(272, -44, bite);                    // tooth-tip lines (negative = rows interlocked)
    const toothLen = 176, pitch = 258;
    const mixC = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
    const gumCol = mixC([152, 52, 56], [0, 0, 0], darken);
    const throatCol = mixC([44, 14, 20], [0, 0, 0], darken);
    const toothCol = mixC([250, 246, 232], [0, 0, 0], darken);
    const sh = shake(t, 5, 11, 13);
    MV.cam({ x: sh[0], y: sh[1], zoom: 1 + 0.06 * smooth(span(t, 21.3, 21.7)), rot: 0 });
    MV.curCam = { x: 0, y: 0, zoom: 1, rot: 0 };
    // 1) throat + tongue (fixed in place; only occluded as the jaws come together)
    MV.flat(throatCol, 255);
    brush.polygon([[-1500, -800], [1500, -800], [1500, 800], [-1500, 800]]);
    MV.flat(mixC([186, 86, 92], [0, 0, 0], darken), 190);
    brush.polygon(MV.blob(0, 272, 470, 150, 78, 20, 0.12));
    // 2) lower jaw: rigid teeth pointing up, gum plate below (half-pitch offset → interlocking bite)
    const yL = gap, gL = yL + toothLen;
    for (let i = 0; i < 9; i++) {
      const x0 = -1142 + i * pitch;
      MV.flat(toothCol, 254);
      brush.polygon([[x0, gL + 6], [x0 + 152, gL + 6], [x0 + 76, yL]]);
    }
    MV.flat(gumCol, 255);
    brush.polygon([[-1500, 820], [1500, 820], [1500, lerp(gL, -760, cover)], [-1500, lerp(gL, -760, cover)]]);
    // 3) upper jaw: rigid teeth pointing down, gum plate above — drawn last so it sits in front
    const yU = -gap, gU = yU - toothLen;
    for (let i = 0; i < 9; i++) {
      const x0 = -1013 + i * pitch;
      MV.flat(toothCol, 254);
      brush.polygon([[x0, gU - 6], [x0 + 152, gU - 6], [x0 + 76, yU]]);
    }
    MV.flat(gumCol, 255);
    brush.polygon([[-1500, -820], [1500, -820], [1500, lerp(gU, 760, cover)], [-1500, lerp(gU, 760, cover)]]);
    MV.camPop();
    if (t > 21.86) MV.subtitles.sfx('CHOMP!', 960, 500, { s: 240, color: P.crimson, rot: -0.06, alpha: smooth(span(t, 21.86, 22.06)) * (1 - smooth(span(t, 22.1, 22.3))) });
  }

  // ---------------------------------------------------------------- dispatch
  function draw(t) {
    MV.__stage = 'draw';
    if (t < 6.0) seg1(t);            // 1.5–6.0  OTS → push into the face
    else if (t < 8.0) seg2(t);       // 6.0–8.0  reverse shot
    else if (t < 9.0) seg3(t);       // 8.0–9.0  shrug, wink, loss chart
    else if (t < 13.0) seg4(t);      // 9.0–13.0 ride the loss curve, burst out
    else if (t < 17.9) seg5(t);      // 13.0–17.9 villain chair spin
    else seg6(t);                    // 17.9–23.0 chase → chomp → black
    if (t > 22.45) MV.hideCaptions = true;
  }

  MV.shots = MV.shots || {};
  MV.shots.lab = { a: 1.5, b: 23.0, draw };
})();
