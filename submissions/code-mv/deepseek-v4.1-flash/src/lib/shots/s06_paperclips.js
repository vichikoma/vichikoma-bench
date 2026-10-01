// src/lib/shots/s06_paperclips.js — Shot 6 · Chorus 3: Paperclips (95.4–109.4)
//   95.4 the stage: the pump is now a paperclip machine, and the Researcher lands in a heap
//   97.5 the clips flood the room; everyone bobs, Clawd surfs the wave
//   99.0 a big red KILLSWITCH, an empty chair, an out-of-office note — then a beach
//  100.5 zoom out: the whole Earth is a ball of paperclips, one island left
//  102.5 a match, a fuse, a cartoon bomb → white flash
//  105.4 the smoke clears into a smoky blue jazz club: sax, mic, two spotlights at 90°
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeIn, easeOut, easeOut3, easeOut4, easeInOut, easeBack, easeOutBack,
    mix, css, rnd, vnoise, shake, hump, beatEnv, beatPos, beatIndex, beatTime, SPB
  } = MV;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- small helpers
  const feetY = (feet, h) => feet - h * 0.62;              // clawd y = body CENTRE
  const camOn = (px, py, zoom, extra) => Object.assign({ x: -px * (zoom - 1), y: -py * (zoom - 1), zoom }, extra || {});
  const camAt = (px, py, zoom, extra) => Object.assign({ x: -px * zoom, y: -py * zoom, zoom }, extra || {});
  const poly = (pts, col, a) => { MV.flat(col, a === undefined ? 252 : a); brush.polygon(pts); };
  const inkPoly = (pts, col, w) => { MV.ink(col, w, 'pen'); brush.polygon(pts); };
  const rr = (cx, cy, w, h, r, seed, amp) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp === undefined ? 1.6 : amp);
  const ell = (cx, cy, rx, ry, seed, n = 20, amp = 0.05) => MV.wobbleEllipse(cx, cy, rx, ry, seed, n, amp);
  const line2 = (x1, y1, x2, y2, col, w) => { MV.ink(col, w, 'pen'); brush.line(x1, y1, x2, y2); };
  const dot = (x, y, r, col, a) => { MV.flat(col, a === undefined ? 250 : a); brush.circle(x, y, r); };

  const BAND = { zoom: 1, fx: 0, cy: 0, hw: 1100, hh: 700 };
  function setBandCam(c) {
    const z = c.zoom || 1;
    BAND.zoom = z; BAND.fx = -(c.x || 0) / z; BAND.cy = -(c.y || 0) / z;
    BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 140;
  }
  const onCanvas = (x, y, ext) =>
    Math.abs(x - BAND.fx) - (ext || 0) < BAND.hw + 90 && Math.abs(y - BAND.cy) - (ext || 0) < BAND.hh + 90;

  // ---------------------------------------------------------------- the paperclip
  // a stadium outline: two flat polygons (silver body + dark slot) — cheap on p5.brush
  const CLIP_BODY = [204, 210, 220], CLIP_SLOT = [92, 98, 112], CLIP_DIM = [150, 156, 168];
  function stadium(x, y, w, h, rot, out) {
    const hw = w / 2, hh = h / 2, r = hw, cs = Math.cos(rot), sn = Math.sin(rot);
    const put = (px, py) => out.push([x + px * cs - py * sn, y + px * sn + py * cs]);
    put(hw, -hh + r); put(hw, hh - r);
    for (let i = 0; i <= 3; i++) { const a = Math.PI / 2 + Math.PI * i / 3; put(Math.cos(a) * r, (hh - r) + Math.sin(a) * r); }
    put(-hw, -hh + r);
    for (let i = 0; i <= 3; i++) { const a = -Math.PI / 2 + Math.PI * i / 3; put(Math.cos(a) * r, -(hh - r) + Math.sin(a) * r); }
    return out;
  }
  function clip(x, y, w, rot, o = {}) {
    const a = o.a === undefined ? 246 : o.a;
    if (a < 0.02) return;
    const col = o.dim ? CLIP_DIM : (o.col || CLIP_BODY);
    poly(stadium(x, y, w, w * 2.2, rot, []), col, a);
    poly(stadium(x, y, w * 0.34, w * 1.45, rot, []), CLIP_SLOT, a * 0.85);
  }
  // a whole drift of clips over a region, deterministic and cheap
  function clipField(x0, x1, y0, y1, n, seed, t, o = {}) {
    const r = rnd(seed);
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), w = (o.w || 20) * (0.7 + r() * 0.6);
      if (!onCanvas(x, y, 60)) { r(); r(); r(); continue; }
      const bob = o.bob ? Math.sin(t * (2.2 + r() * 1.4) + i * 1.7) * (o.bob) : 0;
      clip(x, y + bob, w, (r() - 0.5) * 1.5 + t * (o.spin || 0), { a: o.a, dim: o.dim });
    }
  }

  // ---------------------------------------------------------------- the stage, in steel grey
  function steelStage(t) {
    S.stage(t, {
      back: [104, 108, 118], apron: [44, 46, 54], floorCol: [126, 116, 104], wingCol: [78, 82, 92],
      sun: { c1: [140, 146, 158], c2: [92, 96, 108], glowCol: [196, 202, 214], glowA: 0.2, rays: 22, spin: 0.06 }
    });
    S.footlights(t, { y: 438, color: [206, 212, 224] });
  }

  // ---------------------------------------------------------------- the paperclip machine
  // a hopper on legs: the crank turns, the chute spits clips on the beat
  function clipMachine(t, x, base, s, cam) {
    push(); translate(x, base); scale(s, s);
    // legs
    for (const lx of [-104, 104]) {
      poly(rr(lx, -70, 30, 150, 6, 6110 + lx, 2), [96, 100, 108], 250);
      inkPoly(rr(lx, -70, 30, 150, 6, 6110 + lx, 2), [56, 58, 66], 5);
    }
    // the hose that used to feed the pump
    MV.ink([86, 90, 100], 28, 'pen');
    brush.line(-30, -560, -96, -1000);
    MV.ink([60, 62, 72], 6, 'pen');
    brush.line(-30, -560, -96, -1000);
    // the tall vat
    poly([[-152, -128], [152, -128], [152, -470], [-152, -470]], [176, 182, 194], 252);
    inkPoly([[-152, -128], [152, -128], [152, -470], [-152, -470]], [58, 62, 72], 7);
    poly([[-24, -470], [24, -470], [-60, -172], [-104, -172]], [214, 220, 232], 150);
    // funnel on top
    poly([[-224, -470], [224, -470], [92, -600], [-92, -600]], [150, 156, 168], 252);
    inkPoly([[-224, -470], [224, -470], [92, -600], [-92, -600]], [58, 62, 72], 6);
    // rivets + the plate
    for (let i = 0; i < 4; i++) dot(-96 + i * 64, -196, 10, [112, 118, 130], 250);
    MV.propText('CLIPS', x, base - 330 * s, { cam, font: '900 40px Georgia, "Times New Roman", serif', color: '#eef2f8', outlineColor: 'rgba(30,34,42,0.9)', lineW: 7, alpha: 0.95 });
    // crank on the left: one full turn per beat
    const ba = beatPos(t) * TAU;
    push(); translate(-186, -376);
    dot(0, 0, 18, [124, 130, 142], 250);
    const cxp = Math.cos(ba) * 66, cyp = Math.sin(ba) * 66;
    line2(0, 0, cxp, cyp, [70, 74, 84], 14);
    dot(cxp, cyp, 15, [196, 92, 78], 250);
    pop();
    // chute at the bottom right, clips marching out
    poly([[140, -150], [288, -134], [288, -78], [140, -94]], [164, 170, 182], 252);
    inkPoly([[140, -150], [288, -134], [288, -78], [140, -94]], [58, 62, 72], 5);
    for (let i = 0; i < 5; i++) {
      const k = beatIndex(t - i * SPB), age = (beatIndex(t) - k) * SPB + beatTime(t);
      if (age > 1.4 || k < 0) continue;
      const px = 276 + age * 190, py = -110 + age * 52 - Math.sin(clamp(age / 0.6) * Math.PI) * 54;
      clip(px, py, 30, age * 7 + i, { a: 250 * (1 - span(age, 0.9, 1.4)) });
    }
    pop();
  }

  // ---------------------------------------------------------------- segA · 95.4–97.4
  function segA(t) {
    MV.__stage = 'A6';
    const u = span(t, 95.4, 97.4);
    const land = span(t, 95.5, 95.9);
    const sh = land > 0.001 && land < 1 ? 10 * (1 - land) * Math.sin(t * 46) : 0;
    const c = camAt(60, 210, lerp(1.00, 1.06, smoother(u)), { shakeX: Math.round(sh), shakeY: Math.round(shake(t, 20, 3, 9)[1] * 0.5) });
    setBandCam(c);
    MV.cam(c);
    steelStage(t);
    clipMachine(t, 620, 372, 1.05, c);
    // the meter keeps climbing on the beat
    const pct = S.stair(t, beatIndex(95.4), beatIndex(95.4) + 6, 61, 74, 0.14);
    S.meter(-620, 470, 0.82, pct, { cam: c, readoutColor: '#2a2326' });
    // the heap of clips she lands in
    const pile = clamp(land);
    poly(ell(60, 386, 260 * (0.35 + 0.65 * pile), 86 * (0.3 + 0.7 * pile), 6200, 20, 0.09), [196, 202, 212], 252);
    poly(ell(30, 402, 300 * (0.4 + 0.6 * pile), 44 * (0.3 + 0.7 * pile), 6201, 18, 0.1), [214, 220, 230], 160);
    clipField(-140, 260, 348, 412, 18, 6210, t, { a: 248, w: 44 });
    // she drops out of the sky, lands, sits up dazed
    {
      const fall = easeIn(t, 95.4, 95.86);
      const sitting = smoother(span(t, 95.9, 96.25));
      const fy = lerp(-780, 330, fall);
      const rx = 60 + 18 * Math.sin(t * 3.1) * (1 - sitting);
      push();
      translate(rx, fy);
      rotate(lerp(-0.5, 0, fall));
      MV.researcher({
        x: 0, y: 0, s: 176, seed: 63, pose: 'sit',
        face: { look: [0.12, 0.3 - 0.4 * sitting], mouth: sitting > 0.4 ? 'oh' : 'smile', glasses: 'sweat', sweatN: 2 },
        arms: { l: -1.9 + 1.2 * sitting, r: 1.4 }
      });
      pop();
      if (land > 0.5 && t < 96.6) MV.drawEmote({ kind: 'exclaim', x: 150, y: 190, s: 54 * (1 - span(t, 96.2, 96.6)), alpha: 1 - span(t, 96.2, 96.6) });
      // clips stuck on her
      for (let i = 0; i < 5; i++) clip(rx - 54 + i * 30, 248 - 26 * sitting + 8 * Math.sin(t * 3 + i), 24, 0.6 + i * 0.7, { a: 240 });
    }
    // clips knocked loose on the landing
    if (land > 0.02) {
      const r = rnd(6230);
      for (let i = 0; i < 22; i++) {
        const a0 = r() * TAU, sp = 130 + r() * 240, age = (land - 0.02) * 1.3;
        const px = 60 + Math.cos(a0) * sp * age, py = 350 + Math.sin(a0) * sp * age + 320 * age * age;
        if (py > 404) continue;
        clip(px, py, 16 + r() * 10, age * (2 + r() * 4), { a: 250 * (1 - span(age, 0.5, 1.0)) });
      }
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segB · 97.5–98.9
  // the clips rise like a flood; everyone bobs; Clawd surfs a wave
  function segB(t) {
    MV.__stage = 'B6';
    const u = span(t, 97.5, 98.9);
    const lvl = lerp(392, 46, smoother(span(t, 97.5, 98.55)));
    const c = camAt(lerp(-90, 90, smoother(u)), lvl + 150, 1.02);
    setBandCam(c);
    MV.cam(c);
    steelStage(t);
    // the deep of the sea (behind the swimmers)
    const top = [];
    for (let i = 0; i <= 22; i++) {
      const x = lerp(-1400, 1400, i / 22);
      top.push([x, lvl + 16 * Math.sin(x / 260 + t * 1.1) + 10 * Math.sin(x / 90 - t * 2.2)]);
    }
    poly(top.concat([[1400, 1500], [-1400, 1500]]), [176, 182, 194], 255);
    poly(top.map(([x, y]) => [x, y + 26]).concat([[1400, 1500], [-1400, 1500]]), [150, 156, 170], 200);
    MV.ink([92, 98, 112], 3, 'pen');
    for (let i = 1; i < top.length; i++) brush.line(top[i - 1][0], top[i - 1][1], top[i][0], top[i][1]);
    // big clips heaped along the surface, so the sea reads as paperclips
    for (let i = 0; i < 30; i++) {
      const x = lerp(-1320, 1320, i / 29) + 34 * Math.sin(i * 2.3);
      const y = lvl + 16 * Math.sin(x / 260 + t * 1.1) + 10 * Math.sin(x / 90 - t * 2.2) - 10
              + 6 * Math.sin(t * 2.4 + i * 1.3);
      clip(x, y, 48 + 18 * vnoise(i * 0.9, 71), (vnoise(i * 1.7, 72) - 0.5) * 2.6, { a: 250 });
    }
    clipField(-1300, 1300, lvl + 40, lvl + 240, 12, 6470, t, { a: 220, w: 46, dim: true });
    // the meter, drowning
    S.meter(-700, 470, 0.82, S.stair(t, beatIndex(97.5), beatIndex(97.5) + 4, 74, 80, 0.2), { cam: c, readoutColor: '#2a2326' });
    // the bathers: only their heads and shoulders are above the clips
    const bathers = [[-940, 0.1], [-470, 0.5], [180, 0.9], [860, 0.35]];
    for (const [bx, ph] of bathers) {
      const e = beatEnv(t + ph * 0.4, 7);
      const by = lvl + 78 - e * 26;
      push();
      translate(bx, by + 12 * Math.sin(t * 1.6 + ph * 9));
      rotate(0.05 * Math.sin(t * 2 + ph * 8));
      MV.clawd({
        x: 0, y: 0, h: 196, seed: 641 + Math.round(ph * 10),
        face: { eyes: 'open', look: [0.2 * Math.sin(t + ph), -0.2], mouth: e > 0.6 ? 'oh' : 'smile' },
        extras: [] , arms: { l: 2.3 + 0.5 * e, r: 2.5 - 0.4 * e }, legs: { l: 0.4, r: -0.4 }
      });
      pop();
      if (e > 0.5) MV.drawEmote({ kind: 'sweat', x: bx + 90, y: by - 130, s: 30 * e, alpha: 0.7 * e });
    }
    // the wave he surfs — curling, and made of clips
    {
      const wx = 430, base = lvl + 250, hgt = 300, wr = 300;
      const surf = base - hgt;
      const crest = [
        [wx - 560, base], [wx - 470, base - 96], [wx - 350, base - 176], [wx - 226, base - 236],
        [wx - 110, base - 276], [wx - 10, base - 300], [wx + 90, base - 302], [wx + 172, base - 268],
        [wx + 212, base - 210], [wx + 240, base - 140], [wx + 300, base - 62], [wx + 380, base]
      ];
      // the face, in mid grey
      poly(crest.concat([[wx + 380, 1700], [wx - 560, 1700]]), [166, 174, 192], 252);
      // the tube: the dark hollow the lip makes, wide and obvious
      MV.flat([44, 52, 78], 245);
      brush.polygon([[wx - 60, base - 286], [wx + 130, base - 290], [wx + 250, base - 246], [wx + 300, base - 150],
                     [wx + 250, base - 60], [wx + 120, base - 70], [wx - 20, base - 140], [wx - 80, base - 226]]);
      // the lip, hanging over the tube, in light
      MV.flat([222, 228, 240], 252);
      brush.polygon([[wx - 26, base - 288], [wx + 92, base - 308], [wx + 176, base - 272], [wx + 192, base - 222],
                     [wx + 124, base - 234], [wx + 34, base - 252], [wx - 16, base - 258]]);
      MV.ink([70, 78, 98], 8, 'pen');
      for (let i = 1; i < crest.length; i++) brush.line(crest[i - 1][0], crest[i - 1][1], crest[i][0], crest[i][1]);
      const cp = [wx + 46, base - 268], cq = [wx + 150, base - 250], slope = Math.atan2(cq[1] - cp[1], cq[0] - cp[0]);
      // clips riding the lip
      for (let i = 0; i < 9; i++) {
        const a0 = -2.95 + i * 0.24, rr5 = rnd(6495 + i);
        const lx = wx + 40 + Math.cos(a0) * (150 + i * 4), ly = base - 300 + Math.sin(a0) * 156 * 0.74;
        clip(lx, ly, 54 + rr5() * 16, a0 + 1.5708, { a: 250 });
      }
      // clips heaped along the lower face
      for (let i = 2; i < crest.length - 2; i++) {
        const a = crest[i - 1], b = crest[i + 1], tan = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const rg = rnd(6480 + i * 11);
        clip(crest[i][0] - Math.sin(tan) * 30, crest[i][1] + 44 + rg() * 24, 56 + rg() * 18,
          tan + 1.5708 + (rg() - 0.5) * 0.8, { a: 246 });
      }
      // spray off the lip
      for (let i = 0; i < 8; i++) {
        const sp = (t * 0.9 + i * 0.125) % 1;
        dot(wx + 120 + i * 30 + sp * 60, base - 300 - sp * 150, 13 * (1 - sp) + 3, [232, 238, 248], 230 * (1 - sp));
      }
      push();
      translate(cp[0] + 20, cp[1] - 4);
      rotate(slope + 0.06 * Math.sin(t * 3));
      MV.clawd({
        x: 0, y: feetY(0, 188), h: 188, seed: 45, rot: 0.05 * Math.sin(t * 3.4),
        face: { eyes: 'open', look: [0.3, -0.25], mouth: 'oh' }, extras: ['shades', 'catears'],
        arms: { l: -0.5, r: -2.5 }, legs: { l: 0.9, r: -0.7 }
      });
      pop();
      dot(cp[0] + 30, cp[1] - 70, 9, [255, 255, 255], 200);
    }
    // clips drifting across the front of the frame
    clipField(-1200, 1200, lvl + 150, lvl + 420, 10, 6440, t, { a: 235, w: 52, bob: 14, spin: 0.5 });
    MV.camPop();
  }

  // ---------------------------------------------------------------- segC · 99.0–100.4
  // a big red KILLSWITCH, an empty chair, an out-of-office note — then cut to the beach
  function officeScene(t) {
    const u = span(t, 99.0, 99.7);
    const c = camAt(lerp(0, 30, smoother(u)), 120, lerp(1.00, 1.05, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    // wall + wainscot
    MV.flat([118, 122, 132], 255); brush.polygon([[-1800, -1200], [1800, -1200], [1800, 260], [-1800, 260]]);
    MV.flat([92, 96, 106], 255); brush.polygon([[-1800, 260], [1800, 260], [1800, 460], [-1800, 460]]);
    MV.ink([70, 74, 84], 3, 'pen'); brush.line(-1800, 260, 1800, 260);
    MV.flat([168, 172, 182], 255); brush.polygon([[-1800, 460], [1800, 460], [1800, 1200], [-1800, 1200]]);
    // the killswitch panel
    {
      poly(rr(-560, -180, 460, 420, 12, 6500, 2), [140, 146, 158], 252);
      inkPoly(rr(-560, -180, 460, 420, 12, 6500, 2), [56, 60, 70], 7);
      poly(rr(-560, -300, 320, 76, 8, 6501, 2), [64, 68, 78], 252);
      MV.propText('KILLSWITCH', -560, -300, { cam: c, font: '900 34px Georgia, "Times New Roman", serif', color: '#f0e2d2', outlineColor: 'rgba(28,30,38,0.9)', lineW: 6 });
      // the lever, thrown DOWN = off
      push(); translate(-560, -120);
      dot(0, 0, 42, [70, 74, 84], 252);
      dot(0, 0, 30, [180, 186, 198], 252);
      const la = Math.PI * 0.5 + 0.05 * Math.sin(t * 9);
      line2(0, 0, Math.cos(la) * 130, Math.sin(la) * 130, [188, 40, 40], 26);
      dot(Math.cos(la) * 132, Math.sin(la) * 132, 30, [212, 52, 48], 252);
      dot(Math.cos(la) * 132, Math.sin(la) * 132, 17, [244, 148, 132], 200);
      pop();
      poly(rr(-560, 40, 360, 60, 8, 6502, 2), [76, 80, 90], 252);
      MV.propText('OFF', -620, 40, { cam: c, font: '900 30px Georgia, serif', color: '#c8ccd6', outlineColor: 'rgba(28,30,38,0.8)', lineW: 5 });
      MV.propText('on PTO', -500, 40, { cam: c, font: '900 30px Georgia, serif', color: '#8e94a2', outlineColor: 'rgba(28,30,38,0.8)', lineW: 5 });
      // a fat padlock hanging off it
      const pk = 1 + 0.04 * beatEnv(t, 4);
      push(); translate(-320, -230); scale(pk, pk);
      poly(rr(0, 0, 66, 54, 8, 6503, 2), [186, 158, 74], 252);
      inkPoly(rr(0, 0, 66, 54, 8, 6503, 2), [86, 68, 26], 5);
      MV.ink([150, 126, 58], 12, 'pen'); brush.arc(0, -26, 40, 40, PI, TAU);
      pop();
    }
    // the empty chair on the floor, jacket over the back
    {
      push(); translate(150, 520);
      for (let i = 0; i < 5; i++) {
        const wa = -Math.PI * 0.5 + i * TAU / 5;
        line2(0, -60, Math.cos(wa) * 128, -60 + Math.sin(wa) * 52, [74, 78, 88], 11);
        dot(Math.cos(wa) * 130, -58 + Math.sin(wa) * 53, 10, [42, 44, 52], 252);
      }
      line2(0, -60, 0, -196, [104, 108, 118], 15);
      // seat
      poly(rr(0, -212, 172, 40, 14, 6510, 2), [110, 114, 124], 252);
      inkPoly(rr(0, -212, 172, 40, 14, 6510, 2), [58, 62, 72], 5);
      // backrest
      poly(rr(-6, -338, 160, 152, 22, 6511, 2), [124, 128, 138], 252);
      inkPoly(rr(-6, -338, 160, 152, 22, 6511, 2), [58, 62, 72], 5);
      // the jacket draped over it
      poly([[-92, -404], [72, -404], [104, -300], [96, -232], [40, -246], [-16, -232], [-96, -262]], [196, 172, 132], 250);
      inkPoly([[-92, -404], [72, -404], [104, -300], [96, -232], [40, -246], [-16, -232], [-96, -262]], [128, 106, 76], 5);
      pop();
    }
    // desk: note, phone, mug
    {
      poly(rr(560, 400, 700, 40, 8, 6520, 2), [150, 132, 106], 252);
      inkPoly(rr(560, 400, 700, 40, 8, 6520, 2), [78, 66, 48], 5);
      for (const lx of [280, 840]) poly(rr(lx, 540, 34, 200, 6, 6521 + lx, 2), [128, 112, 90], 252);
      // the out-of-office note
      push(); translate(400, 240); rotate(-0.05);
      poly(rr(0, 0, 260, 230, 6, 6530, 2), [244, 226, 132], 252);
      inkPoly(rr(0, 0, 260, 230, 6, 6530, 2), [168, 146, 62], 4);
      MV.propText('OUT OF', 398, 192, { cam: c, font: '900 34px Georgia, serif', color: '#4a3c22', outlineColor: 'rgba(0,0,0,0)', lineW: 0 });
      MV.propText('OFFICE', 400, 234, { cam: c, font: '900 34px Georgia, serif', color: '#4a3c22', outlineColor: 'rgba(0,0,0,0)', lineW: 0 });
      MV.propText('indefinitely', 402, 280, { cam: c, font: 'italic 900 26px Georgia, serif', color: '#6a5a34', outlineColor: 'rgba(0,0,0,0)', lineW: 0 });
      // a little smiley
      dot(0, 84, 17, [72, 58, 34], 250);
      dot(-6, 80, 2.6, [244, 226, 132], 250); dot(6, 80, 2.6, [244, 226, 132], 250);
      MV.ink([244, 226, 132], 3, 'pen'); brush.arc(0, 86, 11, 9, 0, PI);
      pop();
      // the phone, buzzing its heart out
      push(); translate(700, 336);
      const bz = 3 * Math.sin(t * 30);
      translate(bz, 0);
      poly(rr(0, 0, 96, 168, 12, 6540, 2), [42, 44, 52], 252);
      inkPoly(rr(0, 0, 96, 168, 12, 6540, 2), [24, 26, 32], 5);
      poly(rr(0, -26, 74, 92, 4, 6541, 2), [150, 186, 206], 250);
      dot(26, 60, 7, [212, 76, 72], 252);
      for (let i = 0; i < 3; i++) {
        const s2 = i + Math.floor(t * 5) % 2 * 0.5;
        line2(-62 - i * 22, -54, -40 - i * 22, -14, [226, 236, 244], 4 - i * 0.6);
        line2(62 + i * 22, -54, 40 + i * 22, -14, [226, 236, 244], 4 - i * 0.6);
      }
      pop();
      // a dying mug
      poly(rr(880, 356, 74, 88, 8, 6550, 2), [198, 200, 204], 252);
      inkPoly(rr(880, 356, 74, 88, 8, 6550, 2), [86, 90, 96], 5);
      dot(880, 300, 30, [72, 52, 40], 240);
    }
    MV.camPop();
  }

  function beachScene(t) {
    const u = span(t, 99.7, 100.4);
    const c = camAt(lerp(-70, 70, smoother(u)), 150, lerp(1.02, 1.06, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    // sky, sun, sea
    MV.flat([142, 204, 232], 255); brush.polygon([[-2400, -1200], [2400, -1200], [2400, 96], [-2400, 96]]);
    MV.glow(-900, -420, 420, [255, 246, 206], 0.4, 8);
    dot(-900, -420, 130, [255, 250, 224], 250);
    for (let i = 0; i < 3; i++) S.cloud(-1500 + i * 1400 + 60 * Math.sin(t * 0.2 + i), -520 - i * 90, 700, 200, 6600 + i, [252, 250, 246], 200);
    MV.flat([44, 122, 156], 255); brush.polygon([[-2400, 96], [2400, 96], [2400, 300], [-2400, 300]]);
    for (let i = 0; i < 9; i++) {
      const yy = 110 + i * 20, xx = 400 * Math.sin(t * 0.6 + i * 1.3);
      line2(-1200 + xx, yy, -1200 + xx + 380, yy, [214, 236, 244], 5);
      line2(500 + xx * 0.7, yy + 8, 500 + xx * 0.7 + 300, yy + 8, [214, 236, 244], 4);
    }
    // sand
    MV.flat([234, 212, 158], 255); brush.polygon([[-2400, 300], [2400, 300], [2400, 1400], [-2400, 1400]]);
    MV.flat([220, 196, 142], 255); brush.polygon([[-2400, 300], [2400, 300], [2400, 336], [-2400, 336]]);
    for (let i = 0; i < 26; i++) {
      const r = rnd(6610 + i);
      dot(-1100 + r() * 2200, 380 + r() * 240, 2 + r() * 3, [206, 182, 132], 200);
    }
    // two deck chairs, two Clawds, two coconuts, one buzzing phone
    for (const [dx, flip] of [[-380, 1], [430, -1]]) {
      push(); translate(dx, 470);
      // chair frame
      for (let i = 0; i < 7; i++) line2(-120, -6 + i * 16, 150, -6 + i * 16, [186, 150, 104], 7);
      line2(150, -6, 92, -190, [186, 150, 104], 9);
      line2(-120, 100, -120, -6, [186, 150, 104], 9);
      // reclining body
      push(); translate(0, -60); rotate(flip * 0.30);
      MV.clawd({
        x: 0, y: 0, h: 150, seed: 470 + dx, rot: 0,
        face: { eyes: 'sad', look: [0.3 * flip, -0.1], mouth: 'smile' }, extras: ['shades'],
        arms: { l: 1.9, r: 2.2 }, legs: { l: 1.1, r: 0.9 }
      });
      pop();
      // the coconut, straw and all
      dot(flip * 96, -122, 30, [140, 104, 72], 252);
      dot(flip * 96, -132, 24, [244, 244, 240], 230);
      line2(flip * 96, -140, flip * 84, -206, [230, 96, 96], 6);
      pop();
    }
    // the phone on a little table, ignoring everything
    push(); translate(30, 486);
    poly(rr(0, 0, 96, 20, 6, 6620, 2), [162, 132, 96], 252);
    line2(0, 10, 0, 74, [140, 112, 82], 9);
    poly(rr(0, -22, 74, 120, 10, 6621, 2), [44, 46, 54], 252);
    const bz = 2.6 * Math.sin(t * 34);
    translate(bz, 0);
    poly(rr(0, -14, 58, 66, 4, 6622, 2), [166, 202, 220], 250);
    for (let i = 0; i < 3; i++) {
      line2(-34 - i * 18, -52, -18 - i * 18, -24, [236, 244, 250], 4 - i * 0.7);
      line2(34 + i * 18, -52, 18 + i * 18, -24, [236, 244, 250], 4 - i * 0.7);
    }
    pop();
    // the parasol
    push(); translate(-760, 430);
    line2(0, 60, 0, -430, [166, 140, 100], 13);
    for (let i = 0; i < 6; i++) {
      const a0 = -Math.PI + i * Math.PI / 6, a1 = a0 + Math.PI / 6;
      poly([[0, -430], [Math.cos(a0) * 300, -430 + Math.sin(a0) * 130], [Math.cos(a1) * 300, -430 + Math.sin(a1) * 130]],
        i % 2 ? [238, 236, 230] : [214, 96, 84], 250);
    }
    dot(0, -434, 16, [120, 96, 66], 252);
    pop();
    // a beach ball
    push(); translate(760, 560); rotate(0.2 * Math.sin(t * 1.2));
    for (let i = 0; i < 5; i++) {
      const a0 = i * TAU / 5, a1 = a0 + TAU / 10;
      poly([[0, 0], [Math.cos(a0) * 66, Math.sin(a0) * 66], [Math.cos(a1) * 66, Math.sin(a1) * 66]],
        i % 2 ? [244, 246, 244] : [232, 148, 130], 250);
    }
    inkPoly(ell(0, 0, 66, 66, 6630, 18, 0.06), [120, 90, 84], 4);
    pop();
    MV.camPop();
  }

  function segC(t) {
    MV.__stage = 'C6';
    if (t < 99.7) officeScene(t); else beachScene(t);
  }

  // ---------------------------------------------------------------- the clip planet
  function clipPlanet(t, R, o = {}) {
    const cx = 0, cy = 40;
    const eaten = o.eaten === undefined ? 1 : o.eaten;
    poly(ell(cx, cy, R, R, 6700, 30, 0.012), [190, 196, 208], 255);
    // a soft highlight instead of a hard seam
    poly(ell(cx - R * 0.34, cy - R * 0.36, R * 0.62, R * 0.56, 6701, 18, 0.06), [216, 222, 232], 90);
    poly(ell(cx + R * 0.42, cy + R * 0.44, R * 0.5, R * 0.44, 6702, 18, 0.06), [158, 164, 178], 80);
    MV.glow(cx + R * 0.64, cy + R * 0.5, R * 0.8, [58, 64, 92], 0.22, 7);
    // the clips that ate the world
    const r = rnd(6710);
    for (let i = 0; i < 60; i++) {
      const a = r() * TAU, rad = Math.sqrt(r()) * R * 0.96;
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad * 0.98;
      if (!onCanvas(x, y, 40)) { r(); continue; }
      clip(x, y, 30 + r() * 18, r() * TAU, { a: 200 + r() * 45 });
    }
    // the last puddle of ocean, and the last island
    if (eaten > 0.02) {
      const ox = cx - R * 0.30, oy = cy - R * 0.42;
      MV.flat([46, 122, 158], 235 * eaten);
      brush.polygon(ell(ox, oy, R * 0.30 * eaten, R * 0.22 * eaten, 6720, 20, 0.09));
      MV.flat([150, 178, 148], 250);
      brush.polygon([[ox - 62, oy + 30], [ox - 30, oy - 30], [ox + 6, oy - 16], [ox + 40, oy - 44], [ox + 66, oy + 6], [ox + 30, oy + 40]]);
      inkPoly([[ox - 62, oy + 30], [ox - 30, oy - 30], [ox + 6, oy - 16], [ox + 40, oy - 44], [ox + 66, oy + 6], [ox + 30, oy + 40]], [86, 104, 82], 4);
      if (o.roam !== false) {
        push(); translate(ox + 8, oy + 8);
        MV.researcher({ x: 0, y: 0, s: 96, seed: 671, pose: 'stand',
          face: { look: [0.4, -0.4], mouth: 'oh', glasses: 'sweat', sweatN: 2 }, arms: { l: -1.1, r: 1.5 } });
        pop();
      }
    }
    MV.glow(cx - R * 0.6, cy - R * 0.7, R * 0.9, [210, 222, 240], 0.16, 7);
  }

  // ---------------------------------------------------------------- segD · 100.5–102.4
  function segD(t) {
    MV.__stage = 'D6';
    const u = span(t, 100.5, 102.4);
    const k = smoother(u);
    const ix = -168, iy = -195;
    const c = camAt(lerp(ix, 0, k), lerp(iy, 40, k), lerp(2.35, 0.62, k));
    setBandCam(c);
    MV.cam(c);
    // space
    MV.flat([14, 16, 30], 255); brush.polygon([[-4000, -3000], [4000, -3000], [4000, 3000], [-4000, 3000]]);
    const r = rnd(6740);
    for (let i = 0; i < 90; i++) {
      const x = (r() - 0.5) * 5200, y = (r() - 0.5) * 3400, s = 2 + r() * 4;
      MV.flat([236, 240, 250], 140 + r() * 100);
      brush.circle(x, y, s);
    }
    MV.flat([64, 76, 122], 60); brush.polygon(ell(900, -600, 1500, 900, 6745, 26, 0.12));
    MV.glow(900, -600, 1400, [78, 92, 150], 0.3, 8);
    MV.glow(-1200, 500, 1500, [58, 70, 120], 0.24, 8);
    MV.glow(1600, 900, 1200, [70, 60, 130], 0.22, 8);
    clipPlanet(t, 560, {});
    MV.camPop();
  }

  // ---------------------------------------------------------------- segE · 102.5–105.3
  // a match, a fuse racing over the clips, a cartoon bomb, and BOOM
  function segE(t) {
    MV.__stage = 'E6';
    const u = span(t, 102.5, 105.3);
    const strike = span(t, 102.6, 103.05);
    const travel = smoother(span(t, 103.05, 104.45));
    const fuse = smoother(span(t, 104.4, 105.0));
    const boom = smooth(span(t, 104.98, 105.14));
    const c = camAt(lerp(-40, 120, smoother(u)), lerp(-120, 20, smoother(u)), lerp(1.55, 1.12, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    // space behind everything
    MV.flat([16, 18, 34], 255); brush.polygon([[-6000, -4000], [6000, -4000], [6000, 4000], [-6000, 4000]]);
    const rs = rnd(6790);
    for (let i = 0; i < 70; i++) {
      const x = (rs() - 0.5) * 7000, y = (rs() - 0.5) * 4600;
      MV.flat([236, 240, 250], 120 + rs() * 110);
      brush.circle(x, y, 2 + rs() * 4);
    }
    // the crust of clips we stand on: the planet, huge, its curve filling the lower frame
    const Rp = 3400, cx2 = -600, cy2 = Rp + 210;
    poly(ell(cx2, cy2, Rp, Rp, 6800, 20, 0.008), [190, 196, 208], 255);
    // clip texture along the crest
    for (let i = 0; i < 70; i++) {
      const a = -Math.PI * 0.72 + (i / 69) * Math.PI * 1.44;
      const x = cx2 + Math.cos(a) * (Rp - 26), y = cy2 + Math.sin(a) * (Rp - 26);
      if (!onCanvas(x, y, 60)) continue;
      clip(x, y, 34 + 16 * vnoise(i * 0.7, 51), a + Math.PI / 2 + (vnoise(i * 1.3, 52) - 0.5), { a: 235, dim: vnoise(i * 2.1, 53) > 0.7 });
    }
    const surfY = (x) => cy2 - Math.sqrt(Math.max(0, Rp * Rp - (x - cx2) * (x - cx2)));
    // the bomb
    const bx = 420, by = surfY(bx) - 150;
    // the fuse: from his hand, over the crest, to the bomb
    const fpts = [];
    for (let i = 0; i <= 14; i++) {
      const v = i / 14, x = lerp(-320, bx - 96, v);
      fpts.push([x, surfY(x) - 34 - 26 * Math.sin(v * Math.PI * 2.2)]);
    }
    MV.ink([52, 48, 54], 9, 'pen');
    for (let i = 1; i < fpts.length; i++) brush.line(fpts[i - 1][0], fpts[i - 1][1], fpts[i][0], fpts[i][1]);
    // the spark racing along it
    if (strike > 0.55) {
      const fi = clamp(travel) * (fpts.length - 1), i0 = Math.floor(fi), fq = fi - i0;
      const sp = [lerp(fpts[i0][0], fpts[Math.min(i0 + 1, 14)][0], fq), lerp(fpts[i0][1], fpts[Math.min(i0 + 1, 14)][1], fq)];
      MV.glow(sp[0], sp[1], 130, [255, 214, 130], 0.5, 6);
      dot(sp[0], sp[1], 20, [255, 238, 196], 250);
      dot(sp[0], sp[1], 11, [255, 176, 88], 250);
      for (let i = 0; i < 5; i++) {
        const rr3 = rnd(6810 + i + Math.floor(t * 12));
        dot(sp[0] - 30 - rr3() * 90, sp[1] - 40 + rr3() * 80, 4 + rr3() * 6, [255, 206, 140], 200);
      }
    }
    // the clawd, striking the match
    {
      const cx3 = -320, cy3 = surfY(-320) - 4;
      push(); translate(cx3, cy3); scale(1, 1);
      MV.clawd({
        x: 0, y: feetY(0, 196), h: 196, seed: 33, rot: -0.06 + 0.05 * Math.sin(t * 2.2),
        face: { eyes: 'open', look: [0.55, 0.25], mouth: strike > 0.3 ? 'oh' : 'smile' }, extras: ['catears'],
        arms: { l: 2.0, r: -0.5 - 0.5 * strike }, legs: { l: 0.5, r: -0.5 }
      });
      // the match in his right hand, held in front of his chest
      const mh = [44 - 14 * strike, -104 - 30 * strike];
      line2(mh[0], mh[1], mh[0] + 10, mh[1] - 62, [214, 196, 168], 8);
      if (strike > 0.2) {
        const k = smooth(span(strike, 0.2, 0.8));
        dot(mh[0] + 10, mh[1] - 64, 12 * (0.6 + 0.4 * k), [255, 196, 96], 250);
        MV.glow(mh[0] + 10, mh[1] - 64, 130 * k, [255, 180, 90], 0.5 * k, 6);
      }
      pop();
      if (strike > 0.1 && strike < 0.95) MV.drawEmote({ kind: 'sparkle', x: cx3 + 40, y: cy3 - 190, s: 44, alpha: 0.8 });
    }
    // the bomb
    {
      const puff = 1 + 0.05 * Math.sin(t * 22) * fuse + 0.16 * fuse;
      push(); translate(bx, by); scale(puff, puff);
      poly(ell(0, 0, 148, 150, 6820, 26, 0.05), [58, 56, 62], 252);
      inkPoly(ell(0, 0, 148, 150, 6820, 26, 0.05), [28, 28, 34], 6);
      // highlight
      poly(ell(-52, -58, 40, 28, 6821, 16, 0.1), [104, 104, 114], 120);
      // the P(doom) plate
      poly(rr(0, 6, 150, 74, 8, 6822, 2), [176, 132, 66], 252);
      inkPoly(rr(0, 6, 150, 74, 8, 6822, 2), [92, 62, 26], 5);
      MV.propText('P(DOOM)', bx, by + 8, { cam: c, font: '900 30px Georgia, serif', color: '#241c14', outlineColor: 'rgba(0,0,0,0)', lineW: 0 });
      // cap + its spurting fuse
      poly([[-42, -134], [42, -134], [26, -186], [-26, -186]], [72, 70, 78], 252);
      inkPoly([[-42, -134], [42, -134], [26, -186], [-26, -186]], [28, 28, 34], 5);
      line2(0, -186, 16 + 10 * Math.sin(t * 2), -236, [214, 196, 168], 9);
      if (fuse > 0.02) {
        dot(16 + 10 * Math.sin(t * 2), -238, 16 * (0.7 + 0.5 * fuse), [255, 202, 108], 250);
        MV.glow(16 + 10 * Math.sin(t * 2), -238, 170 * fuse, [255, 180, 90], 0.5 * fuse, 6);
        S.burst(16 + 10 * Math.sin(t * 2), -238, 90 * fuse, 6825, [255, 214, 150], 9);
      }
      pop();
    }
    MV.camPop();
    // BOOM: a full-frame white flash + a blast ring
    if (boom > 0.001) {
      MV.cam(c);
      poly([[-4000, -3000], [4000, -3000], [4000, 3000], [-4000, 3000]], [255, 255, 255], 255 * boom);
      MV.camPop();
      MV.glow(bx, by, 520 + 900 * boom, [255, 240, 210], 0.7 * (1 - boom) + 0.4, 6);
      MV.ink([255, 246, 226], 18 * (1 - boom) + 4, 'pen');
      brush.circle(bx, by, 240 + 900 * boom);
    }
  }

  // ---------------------------------------------------------------- segF · 105.4–109.4
  // the smoke clears into a smoky blue jazz club: two spotlights crossing at 90°
  function segF(t) {
    MV.__stage = 'F6';
    const u = span(t, 105.4, 109.4);
    const c = camAt(lerp(-30, 60, smoother(u)), lerp(70, 30, smoother(u)), lerp(1.02, 1.09, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    // the room
    MV.flat([22, 26, 44], 255); brush.polygon([[-2600, -1400], [2600, -1400], [2600, 300], [-2600, 300]]);
    MV.flat([30, 34, 56], 255); brush.polygon([[-2600, 300], [2600, 300], [2600, 460], [-2600, 460]]);
    MV.flat([46, 40, 62], 255); brush.polygon([[-2600, 460], [2600, 460], [2600, 1500], [-2600, 1500]]);
    MV.ink([16, 18, 32], 4, 'pen'); brush.line(-2600, 300, 2600, 300);
    // a stage edge of boards
    for (let i = 0; i < 6; i++) {
      MV.ink([58, 50, 74], 2.4, 'pen'); brush.line(-2600, 330 + i * 26, 2600, 336 + i * 26);
    }
    // two spotlights, axes at 90°
    const cone = (sx, sy, tx, ty, w0, col, a) => {
      const dx = tx - sx, dy = ty - sy, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
      poly([[sx + nx * w0 * 0.2, sy + ny * w0 * 0.2], [sx - nx * w0 * 0.2, sy - ny * w0 * 0.2],
            [tx - nx * w0, ty - ny * w0], [tx + nx * w0, ty + ny * w0]], col, a);
    };
    const e = beatEnv(t, 4);
    cone(-1500, -900, -220, 300, 260, [120, 160, 220], 54 + 14 * e);
    cone(1400, -880, 300, 330, 240, [150, 130, 210], 50 + 14 * e);
    MV.glow(-1500, -900, 300, [180, 210, 255], 0.4, 7);
    MV.glow(1400, -880, 300, [200, 180, 255], 0.4, 7);
    MV.glow(-230, 300, 420, [150, 180, 240], 0.3, 8);
    MV.glow(300, 330, 420, [170, 150, 230], 0.28, 8);
    // the crossing of the axes: a bright cross of light on the floor
    MV.glow(-40, 120, 520, [210, 224, 255], 0.22, 8);
    for (const g of [[-330, 120, 240, 120], [-40, -140, -40, 420]]) {
      MV.ink([228, 238, 255], 26, 'pen');
      brush.line(g[0], g[1], g[2], g[3]);
      MV.ink([255, 255, 255], 11, 'pen');
      brush.line(g[0], g[1], g[2], g[3]);
    }
    dot(-40, 120, 26, [255, 255, 255], 240);
    MV.propText('intelligence', -330, -70, { cam: c, font: 'italic 900 30px Georgia, serif', color: '#cfd8f0', outlineColor: 'rgba(16,20,40,0.85)', lineW: 6, alpha: 0.55 });
    MV.propText('goals', 210, -70, { cam: c, font: 'italic 900 30px Georgia, serif', color: '#cfd8f0', outlineColor: 'rgba(16,20,40,0.85)', lineW: 6, alpha: 0.55 });
    // smoke
    for (let i = 0; i < 4; i++) {
      S.cloud(lerp(-1400, 1200, i / 3) + 60 * Math.sin(t * 0.3 + i), -120 + 40 * Math.sin(t * 0.4 + i * 2),
        1100, 320, 6900 + i, [96, 104, 146], 60);
    }
    // the sax player
    {
      const sway = 0.05 * Math.sin(t * 1.6) + 0.03 * beatEnv(t, 5);
      push(); translate(-560, 386);
      push(); rotate(sway);
      MV.clawd({
        x: 0, y: feetY(0, 268), h: 268, seed: 55, rot: 0,
        face: { eyes: 'closed', look: [0.2, -0.1], mouth: 'oh' }, extras: ['hat', 'shades'],
        arms: { l: 1.1, r: 1.5 }, legs: { l: 0.35, r: -0.35 }
      });
      // the saxophone: body, bow, bell, keys
      const sx = 76, sy = -150;
      push(); translate(sx, sy); rotate(0.5 + 0.06 * Math.sin(t * 2.4));
      MV.ink([62, 46, 26], 8, 'pen');
      brush.line(0, 0, 0, 96);
      MV.ink([158, 116, 42], 22, 'pen');
      brush.line(0, 0, 0, 92);
      MV.ink([186, 142, 58], 26, 'pen');
      brush.line(0, 92, 46, 128);
      MV.ink([214, 172, 74], 34, 'pen');
      brush.circle(78, 150, 44);
      MV.flat([232, 196, 108], 200); brush.circle(78, 150, 30);
      for (let i = 0; i < 4; i++) dot(16 + i * 6, 24 + i * 22, 7, [246, 232, 190], 250);
      pop();
      pop();
      pop();
    }
    // the singer at the old mic
    {
      const sway = 0.04 * Math.sin(t * 1.35 + 1);
      push(); translate(430, 392);
      push(); rotate(sway * 0.6);
      MV.researcher({
        x: 0, y: 0, s: 300, seed: 91, pose: 'stand', rot: 0,
        face: { look: [-0.3, -0.2], mouth: 'oh', glasses: 'sweat', sweatN: 0 },
        arms: { l: -1.2, r: 1.35 }
      });
      pop();
      // mic stand, brought in close
      line2(-104, 0, -104, -404, [86, 90, 104], 10);
      line2(-104, -404, -62, -364, [86, 90, 104], 9);
      dot(-58, -358, 22, [70, 74, 88], 252);
      dot(-58, -358, 14, [148, 152, 164], 250);
      pop();
    }
    // notes drifting up
    for (let i = 0; i < 7; i++) {
      const k = ((t * 0.34 + i * 0.1428) % 1), ph = rnd(6920 + i)();
      MV.propText(i % 2 ? '\u266a' : '\u266b', lerp(-420, 620, rnd(6930 + i)()) + 40 * Math.sin(t * 1.1 + i), lerp(330, -520, k),
        { cam: c, font: '900 ' + Math.round(52 + 22 * ph) + 'px Georgia, serif', color: '#e6ddc4',
          outlineColor: 'rgba(20,24,44,0.85)', lineW: 7, alpha: 0.75 * (1 - k) * smooth(span(t, 105.6, 106.2)) });
    }
    MV.camPop();
    // out: a brush wipe
    const w = smooth(span(t, 108.95, 109.4));
    if (w > 0.001 && w < 0.999) MV.wipeBand(w, [14, 18, 34], 46, 'in', 170);
  }

  // ---------------------------------------------------------------- dispatch
  function draw(t) {
    if (t < 97.5) segA(t);
    else if (t < 99.0) segB(t);
    else if (t < 100.5) segC(t);
    else if (t < 102.5) segD(t);
    else if (t < 105.4) segE(t);
    else segF(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.paperclips = { a: 95.4, b: 109.4, draw };
})();

