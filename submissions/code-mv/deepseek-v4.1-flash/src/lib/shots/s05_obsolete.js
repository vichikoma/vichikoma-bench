// src/lib/shots/s05_obsolete.js — Shot 5 · Obsolete (73.0–95.4) · parchment museum, ochre road
//   73.0 a dance class where the Clawds ARE an MLP: a pulse flows forward / backward, the
//        Researcher conducts and the layers lunge in the direction of the pulse
//   77.5 dusty museum: a guide-Clawd wheels in a sleek new model, the vacuum-tube machine
//        sputters out, a sheet is thrown over it and a spider drops down
//   81.4 go-kart hairpin on an ochre desert road; the Researcher is flung off and lands upright
//   85.0 the sky full of puffy cloud security guards, every one asleep, while the kart does
//        donuts underneath
//   89.4 the cliff: cat-eared Gato-Clawd holds the dangling Researcher over the chasm, a laser
//        dot appears, the grip loosens each beat — then pounce, and let go
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeOut, easeOut3, easeInOut, easeBack, mix, css,
    beatEnv, beatPos, beatIndex, beatPhase, beatsIn, envAt, rnd, vnoise, shake, hump
  } = MV;
  const TAU = Math.PI * 2;

  // ================================================================ shared helpers
  const feetY = (feet, h) => feet - h * 0.62;              // clawd y = body CENTRE
  const camOn = (px, py, zoom, extra) => Object.assign({ x: -px * (zoom - 1), y: -py * (zoom - 1), zoom }, extra || {});
  const camAt = (px, py, zoom, extra) => Object.assign({ x: -px * zoom, y: -py * zoom, zoom }, extra || {});
  const poly = (pts, col, a) => { MV.flat(col, a === undefined ? 252 : a); brush.polygon(pts); };
  const inkPoly = (pts, col, w) => { MV.ink(col, w, 'pen'); brush.polygon(pts); };
  const rr = (cx, cy, w, h, r, seed, amp) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp === undefined ? 1.8 : amp);
  const ell = (cx, cy, rx, ry, seed, n = 24, amp = 0.05) => MV.wobbleEllipse(cx, cy, rx, ry, seed, n, amp);
  const line2 = (x1, y1, x2, y2, col, w) => { MV.ink(col, w, 'pen'); brush.line(x1, y1, x2, y2); };
  const dot = (x, y, r, col, a) => { MV.flat(col, a === undefined ? 250 : a); brush.circle(x, y, r); };

  const BAND = { fx: 0, cy: 0, hw: 1700, hh: 700, zoom: 1 };
  function setBand(z, foc) { BAND.zoom = z; BAND.fx = foc[0]; BAND.cy = foc[1]; BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 90; }
  function setBandCam(c) { const z = c.zoom || 1; BAND.zoom = z; BAND.fx = -(c.x || 0) / z; BAND.cy = -(c.y || 0) / z; BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 90; }
  const onScreenX = (x, ext) => Math.abs(x - BAND.fx) - (ext || 0) < BAND.hw + 80;
  const onScreenY = (y, ext) => Math.abs(y - BAND.cy) - (ext || 0) < BAND.hh + 80;
  const onCanvas = (x, y, ext) => onScreenX(x, ext) && onScreenY(y, ext);

  // ================================================================ segA · the MLP dance class
  // three columns = input / hidden / output; each column is a row of three units receding in
  // depth. a pulse runs along the ink connections (drawn on top) and the column it lands in
  // steps sideways in the direction of the flow — forward is to the right, backward to the left.
  const COLX = [-660, 0, 660];
  const UNIT = [{ feet: 96, h: 126 }, { feet: 268, h: 162 }, { feet: 452, h: 200 }];  // back -> front
  const STEP = 58;

  // which column lunges on which beat, and which way
  function lunge(t, li) {
    const b = beatPos(t);
    const k = Math.floor(b), ph = b - Math.floor(b);
    const mod = ((k % 4) + 4) % 4;
    const trig = (li === 0 && mod === 0) ? -1 : (li === 1 && mod === 1) ? 1 : (li === 1 && mod === 3) ? -1 : (li === 2 && mod === 2) ? 1 : 0;
    if (!trig) return { off: 0, dir: 0, e: 0 };
    const e = Math.pow(Math.sin(Math.PI * clamp(ph / 0.72)), 0.72);
    return { off: STEP * trig * e, dir: trig, e };
  }
  // the travelling pulse: which gap, how far (0..1)
  function pulse(t) {
    const b = beatPos(t);
    const k = Math.floor(b), ph = b - Math.floor(b);
    const mod = ((k % 4) + 4) % 4;
    if (mod === 0) return { g: 0, u: ph, fwd: true };
    if (mod === 1) return { g: 1, u: ph, fwd: true };
    if (mod === 2) return { g: 1, u: 1 - ph, fwd: false };
    return { g: 0, u: 1 - ph, fwd: false };
  }
  const unitPos = (li, ui, off) => ({
    x: COLX[li] + off,
    y: feetY(UNIT[ui].feet, UNIT[ui].h),
    h: UNIT[ui].h
  });

  function studio() {
    MV.flat([228, 208, 176], 255); brush.polygon([[-2000, -700], [2000, -700], [2000, 150], [-2000, 150]]);
    MV.flat([188, 170, 142], 255); brush.polygon([[-2000, 150], [2000, 150], [2000, 900], [-2000, 900]]);
    const mW = 1480, mH = 230, mY = -280;
    poly(rr(0, mY, mW, mH, 12, 5101, 2.4), [208, 224, 226], 252);
    poly(rr(0, mY, mW * 0.972, mH * 0.9, 10, 5102, 2.4), [176, 202, 210], 175);
    inkPoly(rr(0, mY, mW, mH, 12, 5101, 2.4), [128, 110, 86], 5);
    for (const sx of [-470, 210]) {
      MV.flat([242, 250, 250], 95);
      brush.polygon([[sx, mY - mH * 0.42], [sx + 80, mY - mH * 0.46], [sx + 268, mY + mH * 0.44], [sx + 186, mY + mH * 0.46]]);
    }
    line2(-mW / 2 - 80, 152, mW / 2 + 80, 152, [152, 134, 110], 6);
    // barre along the left wall
    line2(-1880, -70, -1180, -70, [146, 126, 100], 10);
    line2(-1810, -66, -1810, 150, [146, 126, 100], 8);
    line2(-1250, -66, -1250, 150, [146, 126, 100], 8);
    // floor
    for (let i = -4; i <= 4; i++) {
      MV.ink([170, 150, 122], 3.2, 'pen');
      brush.line(i * 300, 156, i * 620, 900);
    }
    for (let i = 0; i < 4; i++) line2(-2000, 214 + i * 168, 2000, 214 + i * 168, [170, 150, 122], 3);
    // wall clock + the flip sign on the right
    poly(ell(870, -440, 56, 56, 5201, 18, 0.05), [246, 240, 228], 252);
    inkPoly(ell(870, -440, 56, 56, 5201, 18, 0.05), [128, 110, 86], 5);
    line2(870, -440, 870, -468, [96, 82, 70], 5);
    line2(870, -440, 892, -426, [96, 82, 70], 5);
  }

  function segA(t) {
    MV.__stage = 'A';
    const push = smoother(span(t, 73.0, 77.5));
    const zoom = lerp(0.84, 0.94, push);
    const foc = [lerp(-40, 0, push), 52];
    const sh = shake(t, 4, 8, 31);
    const c = camAt(foc[0], foc[1], zoom, { shakeX: Math.round(sh[0]), shakeY: Math.round(sh[1]) });
    setBandCam(c);
    MV.cam(c);
    studio();

    const pl = pulse(t);
    const php = beatPhase(t);
    // ---- the dancers, back column first
    const bob = 7 * beatEnv(t, 9);
    for (let li = 0; li < 3; li++) {
      const lg = lunge(t, li);
      for (let ui = 0; ui < 3; ui++) {
        const u = unitPos(li, ui, lg.off);
        u.y -= bob * (1 - ui * 0.18);
        if (!onCanvas(u.x, u.y, u.h)) continue;
        poly(ell(u.x, UNIT[ui].feet + 6, u.h * 0.40, u.h * 0.065, 5200 + li * 7 + ui, 14, 0.10), [152, 134, 110], 76);
        MV.clawd({
          x: u.x, y: u.y, h: u.h, seed: 41 + li * 5 + ui,
          rot: lg.dir * 0.10 * lg.e + 0.04 * Math.sin(t * 1.6 + li + ui * 0.7),
          sx: 1 + 0.05 * Math.abs(lg.e), sy: 1 - 0.06 * Math.abs(lg.e),
          face: { eyes: (li === 2 && ui === 1) ? 'happy' : 'open', look: [lg.dir * 0.5, -0.05], blush: true,
                  mouth: lg.e > 0.4 ? 'oh' : 'smile' },
          arms: { l: -1.9 + 1.0 * lg.dir * lg.e + 0.3 * lg.e, r: Math.PI + 1.9 - 1.0 * lg.dir * lg.e - 0.3 * lg.e },
          legs: { l: 0.30 + 0.22 * lg.dir * lg.e, r: -0.30 + 0.22 * lg.dir * lg.e } });
      }
    }
    // ---- the connections on TOP, so the net reads over the bodies
    for (let g = 0; g < 2; g++) {
      const lit = g === pl.g;
      const offA = lunge(t, g).off, offB = lunge(t, g + 1).off;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        const A = unitPos(g, i, offA), B = unitPos(g + 1, j, offB);
        if (!onCanvas((A.x + B.x) / 2, (A.y + B.y) / 2, 420)) continue;
        // the wire is always there — it never disappears, only lights up
        MV.ink(lit ? [86, 128, 150] : [150, 150, 148], 2.4, 'pen');
        brush.line(A.x, A.y, B.x, B.y);
        if (!lit) continue;
        // the pulse: a bright stretch that runs along the wire, forward then backward
        const u = pl.u;
        const seg = (u0, u1, a) => {
          const x0 = lerp(A.x, B.x, u0), y0 = lerp(A.y, B.y, u0), x1 = lerp(A.x, B.x, u1), y1 = lerp(A.y, B.y, u1);
          const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, px = -dy / n * 5, py = dx / n * 5;
          MV.flat([255, 226, 138], a);
          brush.polygon([[x0 + px, y0 + py], [x1 + px, y1 + py], [x1 - px, y1 - py], [x0 - px, y0 - py]]);
        };
        // the trail sits behind the head, whichever way it is going
        seg(pl.fwd ? Math.max(0, u - 0.34) : u, pl.fwd ? u : Math.min(1, u + 0.34), 150);
        const px2 = lerp(A.x, B.x, u), py2 = lerp(A.y, B.y, u);
        dot(px2, py2, 11 + 7 * (1 - php), [255, 242, 196], 240);
        MV.glow(px2, py2, 44, [255, 228, 152], 0.32, 4);
      }
    }
    // ---- the conductor, front left
    const cs = 190, cxp = -880, cyp = feetY(178, cs);
    const cond = beatEnv(t, 9);
    MV.researcher({
      x: cxp, y: cyp, s: cs, seed: 7, pose: 'stand',
      face: { look: [0.6, -0.28], mouth: cond > 0.45 ? 'oh' : 'smile', glasses: 'plain' },
      arms: { l: -0.9 - 1.4 * cond, r: 0.6 }
    });
    {
      const a = -0.9 - 1.4 * cond, s = cs;
      const hx = cxp + s * 0.184 + Math.cos(a) * s * 0.27, hy = cyp - s * 0.634 + Math.sin(a) * s * 0.27 * 0.9;
      MV.ink([248, 246, 238], 6, 'pen');
      brush.line(hx, hy, hx + 72, hy - 64);
      dot(hx + 77, hy - 69, 8, [216, 74, 62], 250);
    }
    // ---- painted flip sign on the right wall: which way the pulse is running
    {
      const bw = 330, bh = 138, bx = -920, by = -440;
      poly(rr(bx, by, bw, bh, 16, 6101, 2.5), [246, 238, 216], 250);
      inkPoly(rr(bx, by, bw, bh, 16, 6101, 2.5), [130, 112, 88], 5);
      const dir = pl.fwd ? 1 : -1;
      MV.ink([180, 96, 62], 10, 'pen');
      brush.line(bx - 84, by, bx + 84, by);
      brush.line(bx + 84 * dir, by, bx + 84 * dir - 56 * dir, by - 32);
      brush.line(bx + 84 * dir, by, bx + 84 * dir - 56 * dir, by + 32);
    }
    MV.camPop();
  }


// ================================================================ segB · the von Neumann museum
  // 77.5 a guide-Clawd wheels a sleek new model past the exhibit; 78.4 the vacuum-tube machine
  // sputters and dies tube by tube; 80.0 a sheet is thrown over it; 80.9 a spider drops down.
  const TUBES = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) TUBES.push({ x: -480 + c * 160, y: -390 + r * 80, i: r * 5 + c });

  function museumRoom() {
    MV.flat([238, 228, 206], 255); brush.polygon([[-2400, -1100], [2400, -1100], [2400, 190], [-2400, 190]]);
    MV.flat([214, 200, 176], 255); brush.polygon([[-2400, 190], [2400, 190], [2400, 244], [-2400, 244]]);
    MV.flat([206, 200, 190], 255); brush.polygon([[-2400, 244], [2400, 244], [2400, 1000], [-2400, 1000]]);
    for (let i = 0; i < 5; i++) line2(-2400, 276 + i * 150, 2400, 276 + i * 150, [190, 184, 174], 3);
    for (let i = -6; i <= 6; i++) {
      MV.ink([190, 184, 174], 3, 'pen');
      brush.line(i * 300, 244, i * 520, 1000);
    }
    // an arched window on the left with light spilling in
    const wx = -940, wy = -270, ww = 230, wh = 520;
    poly(rr(wx, wy, ww, wh, 104, 7201, 3), [226, 236, 240], 252);
    inkPoly(rr(wx, wy, ww, wh, 104, 7201, 3), [150, 132, 108], 6);
    line2(wx, wy - wh / 2 + 60, wx, wy + wh / 2, [150, 132, 108], 5);
    line2(wx - ww / 2, wy - wh / 2 + 130, wx + ww / 2, wy - wh / 2 + 130, [150, 132, 108], 5);
    for (let i = 0; i < 3; i++) {
      MV.flat([250, 244, 216], 34);
      brush.polygon([[wx - 80 + i * 36, wy + wh / 2 - 20], [wx + 80 + i * 36, wy + wh / 2 - 20], [wx + 700 + i * 36, 1000], [wx - 300 + i * 36, 1000]]);
    }
  }

  // the vacuum-tube machine. life 0..1; each tube carries its own flicker; spin drives the reels
  function computer(t, x0, y0, life, tubeOn, spin) {
    const W = 1300, H = 620;
    poly(rr(x0, y0 - H / 2, W, H, 20, 7301, 3), [102, 112, 102], 252);
    inkPoly(rr(x0, y0 - H / 2, W, H, 20, 7301, 3), [56, 60, 56], 6);
    poly(rr(x0 - 30, y0 - H * 0.5 - 6, W - 60, H - 30, 14, 7302, 2.6), [92, 102, 94], 250);
    // tube bay
    poly(rr(x0 - 160, y0 - 260, 840, 380, 12, 7303, 2.4), [50, 56, 54], 252);
    inkPoly(rr(x0 - 160, y0 - 260, 840, 380, 12, 7303, 2.4), [38, 42, 40], 5);
    for (const T of TUBES) {
      const cx = x0 + T.x, cy = y0 + T.y;
      const on = tubeOn(T.i);
      if (on > 0.02) { MV.flat([250, 188, 92], 46 * on); brush.circle(cx, cy, 40); }
      poly(rr(cx, cy, 38, 46, 12, 7400 + T.i, 1.4), on > 0.02 ? [238, 172, 80] : [84, 90, 90], 250);
      inkPoly(rr(cx, cy, 38, 46, 12, 7400 + T.i, 1.4), [58, 50, 42], 3);
      if (on > 0.02) dot(cx, cy + 8, 6, [255, 234, 176], 250 * on);
    }
    // tape reels in the top band
    for (const rx of [x0 - 440, x0 - 240]) {
      poly(ell(rx, y0 - 500, 74, 74, 7501, 20, 0.04), [62, 70, 66], 252);
      for (let k = 0; k < 4; k++) {
        const a = spin + k * Math.PI / 2;
        line2(rx, y0 - 500, rx + Math.cos(a) * 54, y0 - 500 + Math.sin(a) * 54, [178, 174, 162], 8);
      }
      dot(rx, y0 - 500, 15, [146, 142, 132], 250);
    }
    poly(rr(x0 + 120, y0 - 540, 300, 80, 10, 7502, 2), [66, 74, 70], 250);
    for (let i = 0; i < 3; i++) {
      const lx = x0 + 170 + i * 90;
      const bl = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.5 + i * 1.7)) * life;
      dot(lx, y0 - 500, 16, life > 0.1 ? [220, 84, 62] : [90, 84, 80], 250);
      dot(lx, y0 - 500 + 30, 10, life > 0.1 ? [236, 176, 78] : [90, 84, 80], 250 * (0.4 + 0.6 * bl));
    }
    // dials
    for (let i = 0; i < 4; i++) {
      const dx = x0 + 400 + (i % 2) * 150, dy = y0 - 400 + Math.floor(i / 2) * 130;
      poly(ell(dx, dy, 34, 34, 7520 + i, 16, 0.05), [234, 228, 212], 250);
      inkPoly(ell(dx, dy, 34, 34, 7520 + i, 16, 0.05), [56, 60, 56], 4);
      const a = -2.3 + (0.5 + 1.1 * life) * i;
      line2(dx, dy, dx + Math.cos(a) * 26, dy + Math.sin(a) * 26, [186, 82, 60], 4);
    }
    // card reader
    poly(rr(x0 + 400, y0 - 140, 300, 52, 8, 7540, 2), [198, 192, 174], 250);
    inkPoly(rr(x0 + 400, y0 - 140, 300, 52, 8, 7540, 2), [92, 88, 76], 4);
    MV.flat([236, 232, 218], 250);
    brush.polygon([[x0 + 430, y0 - 128], [x0 + 580, y0 - 118], [x0 + 580, y0 - 152], [x0 + 430, y0 - 142]]);
    // name plate
    poly(rr(x0, y0 - 40, 360, 66, 8, 7560, 2), [202, 168, 98], 250);
    inkPoly(rr(x0, y0 - 40, 360, 66, 8, 7560, 2), [112, 88, 48], 4);
    MV.propText('VON NEUMANN', x0, y0 - 40, { size: 32, color: '#463a22', outlineColor: 'rgba(0,0,0,0)', lineW: 0, alpha: 0.95 });
  }

  function segB(t) {
    MV.__stage = 'B';
    const u = span(t, 77.5, 81.4);
    const zoom = lerp(0.90, 1.00, smoother(u));
    const foc = [lerp(0, 40, smoother(u)), 20];
    const c = camAt(foc[0], foc[1], zoom);
    setBandCam(c);
    MV.cam(c);
    museumRoom();

    const MX = 240, MY = 430;
    const die = span(t, 78.45, 79.95);
    const life = 1 - smoother(die);
    const tubeOn = (i) => {
      const d0 = 78.5 + (i % 5) * 0.035 + Math.floor(i / 5) * 0.14;
      const dead = span(t, d0, d0 + 0.26);
      const flick = t > 78.3 ? (0.5 + 0.5 * Math.sin(t * 27 + i * 2.1)) : 1;
      return clamp((1 - dead) * (0.3 + 0.7 * flick) * (1 - smooth(span(t, 79.5, 79.95)) * 0.98));
    };
    const spin = t * 2.8 * (1 - 0.94 * smoother(span(t, 78.4, 79.9)));
    poly(ell(MX, MY + 18, 760, 74, 7600, 18, 0.06), [166, 160, 150], 90);
    computer(t, MX, MY, life, tubeOn, spin);
    // smoke + sparks while it dies
    if (t > 78.35 && t < 80.1) {
      const k = hump(t, 78.35, 78.9, 79.7);
      S.cloud(MX - 320, MY - 660, 240 * (0.4 + k), 170 * (0.4 + k), 7650, [178, 174, 166], 130 * k);
      if (t < 79.0) {
        const r = rnd(7700 + Math.floor(t * 24));
        for (let i = 0; i < 7; i++) {
          const a = r() * TAU, len = (40 + r() * 130) * k;
          line2(MX - 320 + Math.cos(a) * len * 0.35, MY - 660 + Math.sin(a) * len * 0.35, MX - 320 + Math.cos(a) * len, MY - 660 + Math.sin(a) * len, [234, 180, 96], 4);
        }
      }
    }
    // ---- the guide wheels the new model in (77.6 → 78.7) and stays
    {
      const w = smoother(span(t, 77.6, 78.7));
      const gx = lerp(-1700, -760, w);
      const gy = 380, hg = 250;
      const tx = gx + 300, ty = gy + 70;
      const off = t > 80.7 ? smoother(span(t, 80.75, 81.2)) : 0;
      const armA = 0.6 - 2.0 * off;
      // the guide, pushing (a step behind the trolley)
      MV.clawd({
        x: gx - 30, y: feetY(gy - 36, hg * 0.94), h: hg * 0.94, seed: 62, rot: -0.05,
        face: { eyes: 'open', look: [0.7, -0.05 - 0.3 * off], mouth: off > 0.4 ? 'frown' : 'smile' },
        extras: off > 0.35 ? [] : ['hat'],
        arms: { l: armA, r: 2.45 }, legs: { l: 0.42, r: -0.62 }
      });
      // the hat, held out at arm's length once it is off
      if (off > 0.35) {
        const s = hg * 0.94, ax = gx - 30 - s * 0.4 + Math.cos(armA) * s * 0.46, ay = feetY(gy - 36, s) + Math.sin(armA) * s * 0.42;
        poly(rr(ax - 20, ay + 22 * off, 132, 38, 12, 7730, 2), [78, 50, 36], 250);
        poly(rr(ax - 6, ay - 4 * off, 100, 42, 14, 7731, 2), [92, 60, 42], 250);
      }
      // the trolley + the sleek new model, a step nearer the camera
      poly(rr(tx, ty, 340, 36, 8, 7710, 2), [152, 140, 120], 250);
      inkPoly(rr(tx, ty, 340, 36, 8, 7710, 2), [92, 80, 64], 4);
      for (const wx of [-120, 122]) {
        poly(ell(tx + wx, ty + 32, 28, 28, 7720 + wx, 14, 0.05), [76, 72, 68], 250);
        dot(tx + wx, ty + 32, 10, [180, 174, 162], 250);
      }
      MV.clawd({
        x: tx, y: ty - 148, h: 236, seed: 61, rot: 0.03 * Math.sin(t * 3.2),
        bodyColor: [242, 244, 246], inkColor: [96, 100, 108],
        face: { eyes: 'open', look: [0.2, 0], mouth: 'smile' },
        extras: ['catears', 'shades'],
        arms: { l: 0.7, r: 2.5 }, legs: { l: 0.5, r: -0.4 }
      });
    }
    // ---- the sheet drops over it (79.95 → 80.8)
    {
      const k = smoother(span(t, 79.95, 80.8));
      if (k > 0.001) {
        const top = MY - 620, bot = lerp(top - 150, MY + 44, easeOut(k));
        const wob = (x) => Math.sin(x * 0.011 + t * 3.4) * 28 + Math.sin(x * 0.032 - t * 5) * 13;
        const x0 = MX - 700, x1 = MX + 700, N = 24, pts = [];
        for (let i = 0; i <= N; i++) { const x = lerp(x0, x1, i / N); pts.push([x, bot + wob(x) * (0.35 + 0.65 * (1 - k))]); }
        for (let i = N; i >= 0; i--) pts.push([lerp(x0, x1, i / N), top]);
        MV.flat([249, 246, 238], 252); brush.polygon(pts);
        inkPoly(pts, [180, 174, 160], 4);
        MV.ink([202, 196, 182], 3.5, 'pen');
        for (const fx of [MX - 150, MX + 240]) {
          const pts = MV.wobbleLine(fx, top, fx - 26, bot - 30, 7810 + fx, 16, 6);
          for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
        }
        const d = hump(t, 80.45, 80.9, 81.4);
        if (d > 0.01) S.cloud(MX - 560, MY - 40, 300 * d, 150 * d, 7740, [198, 192, 180], 120 * d);
      }
    }
    // ---- the spider drops (80.7 →)
    if (t > 80.7) {
      const k = smoother(span(t, 80.72, 81.35));
      const sxx = MX + 380, syy = lerp(-1000, -210, easeOut(k));
      const sw = Math.sin(t * 5.2) * 8 * k;
      line2(sxx, -1020, sxx + sw, syy - 20, [86, 80, 74], 2.4);
      for (const sg of [-1, 1]) for (let i = 0; i < 4; i++) {
        line2(sxx + sw + sg * 20, syy + i * 4 - 8, sxx + sw + sg * (54 + 10 * Math.sin(t * 4 + i)), syy + i * 13 - 26, [52, 46, 44], 3);
      }
      poly(ell(sxx + sw, syy, 30, 27, 7750, 14, 0.08), [54, 48, 46], 252);
      poly(ell(sxx + sw, syy + 27, 20, 19, 7751, 12, 0.09), [40, 36, 36], 252);
      dot(sxx + sw - 9, syy - 7, 4.5, [246, 240, 226], 250);
      dot(sxx + sw + 9, syy - 7, 4.5, [246, 240, 226], 250);
    }
    // ---- velvet rope in the foreground
    {
      const ry = 430;
      for (const px2 of [-1000, 1060]) {
        line2(px2, ry - 12, px2, ry + 210, [190, 154, 86], 13);
        dot(px2, ry - 26, 24, [214, 178, 98], 250);
      }
      for (let i = 0; i < 16; i++) {
        const u2 = i / 16, u3 = (i + 1) / 16, sag = (v) => ry + Math.sin(v * Math.PI) * 62;
        if (i === 0) MV.ink([170, 46, 52], 15, 'pen');
        brush.line(lerp(-1000, 1060, u2), sag(u2), lerp(-1000, 1060, u3), sag(u3));
      }
    }
    MV.camPop();
  }

// ================================================================ segC · the ochre road
  // 81.4 the kart barrels in and yanks into a hairpin; the Researcher is flung off, lands
  // upright and dazed; then the camera tilts up to the sky (the out of the shot).
  const roadY = (x) => 150 + 104 * Math.sin(x / 760 + 0.6) + 44 * Math.sin(x / 330 + 2.1);

  function desertBG(x0, x1, hz) {
    MV.flat([186, 218, 234], 255); brush.polygon([[x0, -1400], [x1, -1400], [x1, hz - 320], [x0, hz - 320]]);
    MV.flat([216, 228, 228], 255); brush.polygon([[x0, hz - 320], [x1, hz - 320], [x1, hz], [x0, hz]]);
    MV.glow(-620, -430, 300, [255, 246, 210], 0.3, 8);
    poly(ell(-620, -430, 96, 96, 8101, 22, 0.03), [255, 250, 224], 250);
    for (let i = Math.floor(x0 / 1100) - 1; i <= Math.floor(x1 / 1100) + 1; i++) {
      const mx = i * 1100 + 180 * vnoise(i * 0.7, 11), mw = 300 + 300 * vnoise(i * 1.3, 12), mh = 62 + 92 * vnoise(i * 0.9, 13);
      poly([[mx - mw / 2, hz], [mx - mw * 0.36, hz - mh * 0.86], [mx - mw * 0.2, hz - mh], [mx + mw * 0.26, hz - mh * 0.96], [mx + mw * 0.46, hz - mh * 0.7], [mx + mw / 2, hz]],
        [178, 152, 120], 232);
    }
    for (let i = Math.floor(x0 / 980) - 1; i <= Math.floor(x1 / 980) + 1; i++) {
      const mx = i * 980 - 300, mw = 260 + 200 * vnoise(i * 1.7, 21), mh = 54 + 92 * vnoise(i * 1.1, 22);
      poly([[mx - mw / 2, hz + 34], [mx - mw * 0.34, hz + 34 - mh * 0.8], [mx - mw * 0.18, hz + 34 - mh], [mx + mw * 0.3, hz + 34 - mh * 0.94], [mx + mw * 0.48, hz + 34 - mh * 0.6], [mx + mw / 2, hz + 34]],
        [178, 140, 98], 245);
    }
  }
  function desertGround(x0, x1, hz) {
    // NOTE: p5.brush spreads a mark per polygon vertex, so big areas need FEW vertices —
    // a 40-point curve fill turns into a dark plaid from the accumulated ink.
    const N = 16, pts = [];
    for (let i = 0; i <= N; i++) { const x = lerp(x0, x1, i / N); pts.push([x, hz]); }
    pts.push([x1, 1600], [x0, 1600]);
    MV.flat([216, 184, 136], 255); brush.polygon(pts);
    const rp = [], rq = [];
    for (let i = 0; i <= N; i++) {
      const x = lerp(x0, x1, i / N), y = roadY(x);
      rp.push([x, y - 128]); rq.unshift([x, y + 128]);
    }
    MV.flat([184, 140, 94], 255); brush.polygon(rp.concat(rq));
    MV.ink([152, 112, 74], 5, 'pen');
    for (let i = 1; i < rp.length; i++) brush.line(rp[i - 1][0], rp[i - 1][1], rp[i][0], rp[i][1]);
    MV.ink([152, 112, 74], 5, 'pen');
    for (let i = 1; i < rq.length; i++) brush.line(rq[i - 1][0], rq[i - 1][1], rq[i][0], rq[i][1]);
    for (let i = Math.floor(x0 / 240); i <= Math.ceil(x1 / 240); i++) {
      const x = i * 240, y = roadY(x);
      MV.flat([236, 214, 168], 210);
      brush.polygon([[x, y - 7], [x + 130, y - 7], [x + 130, y + 7], [x, y + 7]]);
    }
    for (let i = Math.floor(x0 / 420) - 1; i <= Math.floor(x1 / 420) + 1; i++) {
      const cx = i * 420 + 90 * vnoise(i * 2.1, 31), cy = roadY(cx) + (vnoise(i * 3.3, 32) > 0.32 ? 250 : -260);
      if (!onCanvas(cx, cy, 220)) continue;
      const h = 130 + 90 * vnoise(i * 1.7, 33);
      poly(rr(cx, cy - h / 2, 46, h, 22, 8200 + i, 2), [96, 138, 104], 250);
      poly(rr(cx - 40, cy - h * 0.62, 62, 30, 15, 8210 + i, 2), [96, 138, 104], 250);
      poly(rr(cx - 44, cy - h * 1.02, 30, h * 0.5, 14, 8220 + i, 2), [96, 138, 104], 250);
      poly(rr(cx + 42, cy - h * 0.5, 58, 28, 14, 8230 + i, 2), [96, 138, 104], 250);
      poly(rr(cx + 44, cy - h * 0.86, 28, h * 0.44, 13, 8240 + i, 2), [96, 138, 104], 250);
    }
    for (let i = Math.floor(x0 / 300) - 1; i <= Math.floor(x1 / 300) + 1; i++) {
      const cx = i * 300 + 120 * vnoise(i * 1.9, 41);
      if (vnoise(i * 4.1, 42) < 0.45) continue;
      const cy = roadY(cx) + (vnoise(i * 2.6, 43) > 0.5 ? 320 : -300);
      if (!onCanvas(cx, cy, 140)) continue;
      poly(ell(cx, cy, 50 + 30 * vnoise(i * 1.1, 44), 34, 8300 + i, 14, 0.14), [152, 126, 96], 245);
      poly(ell(cx + 30, cy + 14, 26, 20, 8310 + i, 12, 0.16), [142, 116, 88], 245);
    }
  }

  function kart(t, K) {
    push();
    translate(K.x, K.y);
    rotate(K.rot);
    scale(K.sx === undefined ? 1 : K.sx, 1);
    const dd = clamp(Math.abs(K.speed) / 1500, 0, 1);
    for (let i = 0; i < 3; i++) {
      const u = (t * 1.6 + i * 0.33) % 1;
      S.cloud(-150 - u * 190, 20 + u * 60, 190 * (0.5 + u), 120 * (0.5 + u), 8400 + i, [214, 188, 150], 120 * (1 - u) * (0.35 + dd));
    }
    poly([[-118, 14], [104, 14], [126, -30], [86, -54], [-96, -54], [-124, -22]], [176, 62, 58], 250);
    inkPoly([[-118, 14], [104, 14], [126, -30], [86, -54], [-96, -54], [-124, -22]], [92, 32, 32], 5);
    poly([[-70, -54], [30, -54], [18, -96], [-58, -96]], [214, 206, 186], 250);
    inkPoly([[-70, -54], [30, -54], [18, -96], [-58, -96]], [92, 32, 32], 4);
    if (dd > 0.2) for (let i = 0; i < 3; i++) {
      const u = ((t * 2.4 + i * 0.33) % 1);
      S.cloud(-160 - u * 150, -78 - u * 40, 90 * (0.4 + u), 62 * (0.4 + u), 8420 + i, [206, 200, 190], 120 * (1 - u) * dd);
    }
    for (const wx of [78, -86]) {
      poly(ell(wx, 24, 46, 46, 8440 + wx, 18, 0.05), [58, 52, 50], 250);
      poly(ell(wx, 24, 26, 26, 8450 + wx, 16, 0.06), [196, 190, 176], 250);
      for (let k = 0; k < 4; k++) {
        const a = K.spin + k * Math.PI / 2;
        line2(wx, 24, wx + Math.cos(a) * 22, 24 + Math.sin(a) * 22, [70, 62, 58], 4);
      }
    }
    MV.clawd({
      x: 4, y: -118, h: 168, seed: 71, rot: 0.04 * Math.sin(t * 6),
      face: { eyes: 'open', look: [0.5, -0.1], mouth: 'oh' },
      extras: ['shades'],
      arms: { l: 2.5, r: 2.45 }, legs: { l: 0.9, r: -0.8 }
    });
    if (K.ride) {
      MV.researcher({
        x: -128, y: -96, s: 150, seed: 72, pose: 'cling', flip: true,
        face: { look: [0.4, -0.2], mouth: 'oh' }
      });
      MV.ink([204, 70, 66], 9, 'pen');
      for (let i = 0; i < 3; i++) brush.line(-66, -60 + i * 16, -66 + 88 + 40 * Math.sin(t * 7 + i), -60 + i * 16 + 30 * Math.sin(t * 5 + i));
    }
    pop();
  }

  function segC(t) {
    MV.__stage = 'C';
    const MXA = -2150, MXB = 300, MXC = -2400, LAND = 800;
    let kx, krot = 0, ksx = 1, kspeed = 0;
    if (t < 82.78) { kx = lerp(MXA, MXB, smoother(span(t, 81.4, 82.78))); kspeed = 1400 * (1 - 0.6 * span(t, 82.3, 82.78)); }
    else if (t < 83.26) {
      const u = smoother(span(t, 82.8, 83.24));
      kx = MXB - 30 * u;
      ksx = u < 0.5 ? 1 - 1.9 * u : -(0.05 + 1.9 * (u - 0.5));       // spins about the vertical axis
      krot = -0.22 * Math.sin(Math.PI * u) * (u < 0.5 ? 1 : -1);
      kspeed = 240;
    }
    else { const u = smoother(span(t, 83.26, 84.7)); kx = MXB + (MXC - MXB) * u; krot = 0; ksx = -1; kspeed = 1700 * u; }
    const ky = roadY(kx);
    const camX = t < 83.25 ? kx + 120 : lerp(kx + 120, LAND, smoother(span(t, 83.25, 84.2)));
    const tilt = smoother(span(t, 84.4, 85.0));
    const camY = lerp(roadY(camX) - 205, -265, tilt);
    const sh = shake(t, 5, 6, 51);
    const whip = (t > 82.8 && t < 83.3) ? 14 * Math.sin(t * 46) : 0;
    const c = camAt(camX, camY, lerp(0.95, 1.04, smoother(span(t, 81.4, 85.0))), { shakeX: Math.round(sh[0] + whip), shakeY: Math.round(sh[1]) });
    setBandCam(c);
    MV.cam(c);
    const hz = -190;
    desertBG(camX - 2000, camX + 2000, hz);
    desertGround(camX - 2400, camX + 2400, hz);
    // skid marks at the corner + the hairpin sign
    const sk = smoother(span(t, 82.86, 83.3));
    if (sk > 0.01) {
      MV.ink([122, 88, 58], 9, 'pen');
      for (const off of [-72, -32, 32, 72]) {
        let px = MXB - 60 + Math.cos(Math.PI * 0.16) * 150, py = roadY(MXB) + off + Math.sin(Math.PI * 0.16) * 60 * 0;
        for (let i = 1; i <= 10; i++) {
          const u = i / 10 * sk, a = Math.PI * (0.16 + 0.62 * u);
          const nx2 = MXB - 60 + Math.cos(a) * 150, ny2 = roadY(MXB) + off + Math.sin(a) * 74 * u;
          brush.line(px, py, nx2, ny2);
          px = nx2; py = ny2;
        }
      }
    }
    const sx = MXB + 470, sy = roadY(sx);
    if (onCanvas(sx, sy, 340)) {
      line2(sx, sy + 10, sx, sy - 200, [142, 122, 96], 12);
      poly(rr(sx, sy - 250, 190, 190, 16, 8500, 2.4), [236, 196, 74], 252);
      inkPoly(rr(sx, sy - 250, 190, 190, 16, 8500, 2.4), [110, 84, 40], 5);
      MV.ink([92, 70, 34], 11, 'pen');
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI * 0.5 - (i / 8) * Math.PI * 0.95, a2 = -Math.PI * 0.5 - ((i + 1) / 8) * Math.PI * 0.95;
        brush.line(sx + Math.cos(a) * 52, sy - 250 + Math.sin(a) * 52, sx + Math.cos(a2) * 52, sy - 250 + Math.sin(a2) * 52);
      }
      brush.line(sx - 52, sy - 250, sx - 52, sy - 186);
      brush.line(sx - 52, sy - 186, sx - 52 + 40, sy - 186);
    }
    // the kart, then the researcher flying off
    const off1 = 82.98;
    kart(t, { x: kx, y: ky, rot: krot, sx: ksx, spin: -t * 7 - kx / 40, speed: kspeed, ride: t < off1 });
    if (t >= off1) {
      const u = span(t, 82.98, 83.8);
      const done = u >= 1;
      const ex = lerp(MXB - 150, LAND, easeOut(clamp(u)));
      const ey = done ? roadY(LAND) : roadY(ex) - Math.sin(Math.PI * clamp(u)) * 340;
      if (done) poly(ell(LAND, roadY(LAND) + 8, 96, 22, 8600, 16, 0.1), [152, 126, 94], 80);
      push();
      translate(ex, ey);
      rotate(done ? 0 : u * 9.0);
      MV.researcher({
        x: 0, y: 0, s: 150, seed: 73,
        pose: done ? 'stand' : 'run', flip: !done,
        face: done
          ? { look: [0.15 + 0.15 * Math.sin(t * 2.4), -0.05], mouth: 'oh', glasses: t < 84.4 ? 'swirl' : 'plain', sweatN: t < 84.6 ? 2 : 0 }
          : { look: [0, 0], mouth: 'oh', glasses: 'sweat' }
      });
      pop();
      const im = hump(t, 83.76, 83.94, 84.34);
      if (im > 0.01) S.cloud(LAND - 40, roadY(LAND) + 12, 320 * im, 140 * im, 8620, [208, 178, 138], 140 * im);
      if (t > 83.85 && t < 84.1) {
        MV.glow(LAND + 150, roadY(LAND) - 250, 90, [255, 246, 200], 0.4, 5);
        const ey2 = roadY(LAND) - 300;
        MV.flat([236, 82, 68], 252);
        brush.polygon([[LAND + 138, ey2], [LAND + 162, ey2], [LAND + 156, ey2 + 86], [LAND + 144, ey2 + 86]]);
        dot(LAND + 150, ey2 + 112, 15, [236, 82, 68], 252);
      }
    }
    // whip-pan streaks through the turn
    if (t > 82.78 && t < 83.36) {
      const k = hump(t, 82.78, 82.96, 83.36);
      for (let i = 0; i < 14; i++) {
        const r = rnd(8700 + i), yy = -460 + r() * 920;
        MV.flat([250, 244, 226], 90 * k);
        brush.polygon([[-1400, yy], [1400, yy], [1400, yy + 9 + r() * 14], [-1400, yy + 9 + r() * 14]]);
      }
    }
    // "There you are." card over the researcher
    if (t > 83.95 && t < 84.95) {
      const a = smooth(span(t, 83.95, 84.15)) * (1 - smooth(span(t, 84.75, 84.95)));
      MV.propText('There you are.', LAND, roadY(LAND) - 430, {
        cam: c, font: '900 46px Georgia, "Times New Roman", serif', color: '#3a2f28', alpha: a,
        outlineColor: 'rgba(252,246,232,0.95)', lineW: 8
      });
    }
    // high clouds drifting in as we tilt up
    if (t > 84.45) {
      const k = smooth(span(t, 84.45, 85.0));
      for (let i = 0; i < 2; i++) S.cloud(camX - 760 + i * 1240, camY - 300 - i * 240, 760 * (0.6 + k * 0.4), 400, 8800 + i, [250, 248, 244], 150 + 90 * k);
    }
    MV.camPop();
  }

// ================================================================ segD · the sleeping cloud guards
  // 85.0 the sky is full of puffy cloud security guards — peaked caps, binoculars, drooping
  // searchlights — and every one is asleep. The kart does donuts below; nothing wakes up.
  // one cloud rolls over in its sleep on the way out.
  function zzz(x, y, t, seed) {
    for (let i = 0; i < 3; i++) {
      const u = (t * 0.42 + i * 0.33 + seed * 0.07) % 1;
      const a = Math.sin(u * Math.PI) * 0.85;
      if (a < 0.02) continue;
      const sz = (14 + 16 * u) * (1 + 0.1 * seed);
      const px = x + u * 96 + Math.sin(u * 6.2 + seed) * 18, py = y - u * 150;
      MV.ink([86, 96, 118], 4.2, 'pen');
      brush.line(px - sz * 0.5, py - sz * 0.4, px + sz * 0.5, py - sz * 0.4);
      brush.line(px + sz * 0.5, py - sz * 0.4, px - sz * 0.5, py + sz * 0.4);
      brush.line(px - sz * 0.5, py + sz * 0.4, px + sz * 0.5, py + sz * 0.4);
    }
  }
  // a cloud that is a sleeping security guard
  function cloudGuard(x, y, w, h, seed, t, roll) {
    const rr2 = rnd(seed * 13 + 5);
    push();
    translate(x, y);
    rotate(roll);
    // body
    MV.flat([250, 250, 248], 255);
    brush.polygon(MV.wobbleEllipse(-w * 0.3, h * 0.1, w * 0.3, h * 0.44, seed + 1, 18, 0.1));
    MV.flat([247, 248, 248], 255);
    brush.polygon(MV.wobbleEllipse(0, -h * 0.06, w * 0.34, h * 0.5, seed + 2, 18, 0.1));
    MV.flat([252, 252, 250], 255);
    brush.polygon(MV.wobbleEllipse(w * 0.32, h * 0.08, w * 0.3, h * 0.42, seed + 3, 18, 0.1));
    MV.flat([236, 238, 242], 90);
    brush.polygon(MV.wobbleEllipse(0, h * 0.34, w * 0.52, h * 0.2, seed + 4, 16, 0.12));
    MV.ink([178, 196, 214], 5, 'pen');
    brush.polygon(MV.wobbleEllipse(-w * 0.3, h * 0.1, w * 0.3, h * 0.44, seed + 1, 18, 0.1));
    MV.ink([178, 196, 214], 5, 'pen');
    brush.polygon(MV.wobbleEllipse(w * 0.32, h * 0.08, w * 0.3, h * 0.42, seed + 3, 18, 0.1));
    // face: closed eyes + a snore
    const fx = w * 0.02, fy = h * 0.02, er = h * 0.1;
    MV.ink([92, 98, 116], h * 0.028, 'pen');
    for (const sg of [-1, 1]) {
      const cx = fx + sg * er * 3.1;
      for (let i = 0; i < 7; i++) {
        const u0 = i / 7, u1 = (i + 1) / 7;
        brush.line(cx - er + er * 2 * u0, fy + Math.sin(u0 * Math.PI) * er * 0.72, cx - er + er * 2 * u1, fy + Math.sin(u1 * Math.PI) * er * 0.72);
      }
    }
    const sn = (Math.sin(t * 1.5 + seed) + 1) * 0.5;
    dot(fx, fy + er * 2.4, er * (0.5 + 0.5 * sn), [104, 76, 84], 240);
    // peaked cap
    const capY = fy - er * 2.6;
    MV.flat([58, 76, 116], 252);
    brush.polygon(MV.wobbleRoundRect(fx, capY, er * 5.0, er * 1.7, er * 0.8, seed + 11, 5, h * 0.012));
    MV.flat([70, 90, 132], 252);
    brush.polygon(MV.wobbleRoundRect(fx, capY + er * 1.1, er * 5.8, er * 0.7, er * 0.35, seed + 12, 5, h * 0.012));
    poly(ell(fx, capY - er * 2.0, er * 0.5, er * 0.5, seed + 13, 14, 0.08), [206, 176, 96], 250);
    MV.ink([32, 44, 72], h * 0.018, 'pen');
    brush.polygon(MV.wobbleRoundRect(fx, capY, er * 5.0, er * 1.7, er * 0.8, seed + 11, 5, h * 0.012));
    // binoculars hanging on a strap
    MV.ink([40, 44, 56], h * 0.014, 'pen');
    brush.line(fx, capY + er * 1.6, fx + er * 3.2, fy + er * 3.4);
    MV.flat([48, 52, 66], 252);
    brush.circle(fx + er * 3.2, fy + er * 4.0, er * 0.72);
    brush.circle(fx + er * 4.2, fy + er * 4.4, er * 0.66);
    // drooping searchlight
    const lx = -w * 0.42, ly = h * 0.26, a = 1.15 + 0.1 * Math.sin(t * 0.9 + seed);
    const flick = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.7 + seed * 2));
    MV.flat([255, 244, 196], 46 * flick);
    brush.polygon([[lx, ly], [lx + Math.cos(a - 0.22) * 560, ly + Math.sin(a - 0.22) * 560], [lx + Math.cos(a + 0.22) * 560, ly + Math.sin(a + 0.22) * 560]]);
    MV.flat([255, 238, 172], 52 * flick);
    brush.polygon([[lx, ly], [lx + Math.cos(a - 0.13) * 330, ly + Math.sin(a - 0.13) * 330], [lx + Math.cos(a + 0.13) * 330, ly + Math.sin(a + 0.13) * 330]]);
    poly(ell(lx, ly - 4, er * 1.5, er * 1.2, seed + 21, 12, 0.1), [60, 66, 82], 252);
    pop();
    zzz(x + w * 0.34, y - h * 0.42, t, seed);
  }
  function segD(t) {
    MV.__stage = 'D';
    const u = span(t, 85.0, 89.4);
    const zoom = lerp(1.00, 1.06, smoother(u));
    const camX = lerp(0, 260, smoother(u)) + shake(t, 3, 5, 61)[0];
    const camY = lerp(-280, -190, smoother(u));
    const c = camAt(camX, camY, zoom);
    setBandCam(c);
    MV.cam(c);
    // the sky
    MV.flat([172, 208, 232], 255); brush.polygon([[-40, -1600], [40, -1600], [40, 40], [-40, 40]]);
    MV.flat([172, 208, 232], 255); brush.polygon([[-4000, -1600], [4000, -1600], [4000, -900], [-4000, -900]]);
    MV.flat([198, 222, 236], 255); brush.polygon([[-4000, -900], [4000, -900], [4000, 60], [-4000, 60]]);
    // the ground, far below: desert band + tiny mesas
    MV.flat([206, 176, 130], 255); brush.polygon([[-4000, -40], [4000, -40], [4000, 1500], [-4000, 1500]]);
    MV.flat([190, 158, 112], 255); brush.polygon([[-4000, -40], [4000, -40], [4000, -6], [-4000, -6]]);
    for (let i = -6; i <= 6; i++) {
      const mx = i * 620 + 120 * vnoise(i * 1.3, 71), mw = 190, mh = 40 + 26 * vnoise(i * 2.1, 72);
      poly([[mx - mw / 2, -32], [mx - mw * 0.3, -32 - mh], [mx + mw * 0.3, -32 - mh], [mx + mw / 2, -32]], [172, 138, 96], 245);
    }
    // the kart doing donuts
    {
      const dd = beatPos(t);
      const a = (t - 85.0) * 4.2;
      const kx = 340 + Math.cos(a) * 96, ky = 36 + Math.sin(a) * 30;
      // tyre ring
      MV.ink([150, 118, 78], 7, 'pen');
      for (let i = 0; i < 22; i++) {
        const a0 = i / 22 * TAU, a1 = (i + 1) / 22 * TAU;
        brush.line(340 + Math.cos(a0) * 104, 40 + Math.sin(a0) * 33, 340 + Math.cos(a1) * 104, 40 + Math.sin(a1) * 33);
      }
      for (let i = 0; i < 3; i++) {
        const u2 = (t * 1.1 + i * 0.33) % 1;
        S.cloud(340 - Math.cos(a) * 60, 48 - Math.sin(a) * 24, 150 * (0.5 + u2), 74 * (0.5 + u2), 8900 + i, [216, 190, 150], 110 * (1 - u2));
      }
      push();
      translate(kx, ky);
      rotate(a + Math.PI / 2 + (Math.cos(a) > 0 ? 0 : Math.PI));
      scale(0.28 * (Math.cos(a) > 0 ? 1 : -1), 0.28);
      poly([[-118, 14], [104, 14], [126, -30], [86, -54], [-96, -54], [-124, -22]], [176, 62, 58], 250);
      for (const wx of [78, -86]) {
        poly(ell(wx, 24, 46, 46, 8950 + wx, 18, 0.05), [58, 52, 50], 250);
        dot(wx, 24, 16, [196, 190, 176], 250);
      }
      MV.clawd({
        x: 4, y: -118, h: 168, seed: 71, rot: 0.04 * Math.sin(t * 6),
        face: { eyes: 'happy', look: [0.4, -0.1], mouth: 'oh' },
        extras: ['shades'], arms: { l: 2.5, r: 2.45 }, legs: { l: 0.9, r: -0.8 }
      });
      pop();
      // honk waves
      const hk = (t * 1.4) % 1;
      for (let i = 0; i < 3; i++) {
        const u3 = (hk + i * 0.33) % 1;
        MV.ink([214, 96, 84], 5 * (1 - u3) + 2, 'pen');
        const rd = 30 + u3 * 74;
        for (let k = 0; k < 7; k++) {
          const a0 = -1.15 + k * 0.3, a1 = -1.15 + (k + 1) * 0.3;
          brush.line(kx + 96 + Math.cos(a0) * rd * 0.8, ky - 34 + Math.sin(a0) * rd, kx + 96 + Math.cos(a1) * rd * 0.8, ky - 34 + Math.sin(a1) * rd);
        }
      }
    }
    // the guards, all asleep (drawn near-to-far so they overlap naturally)
    const GUARD = [
      { x: -1060, y: -470, w: 540, h: 230, seed: 3 },
      { x: -180, y: -660, w: 620, h: 260, seed: 5 },
      { x: 640, y: -500, w: 500, h: 215, seed: 7 },
      { x: 1180, y: -700, w: 480, h: 205, seed: 9 },
      { x: 320, y: -850, w: 460, h: 195, seed: 11 }
    ];
    for (const G of GUARD) {
      const isRoller = G.seed === 7;
      const rk = isRoller ? smoother(span(t, 88.0, 88.9)) : 0;
      push();
      if (isRoller) translate(140 * rk, -26 * rk);
      cloudGuard(G.x, G.y, G.w, G.h, G.seed, t, isRoller ? 0.4 * rk : 0);
      pop();
    }
    MV.camPop();
  }

// ================================================================ segE · Gato at the cliff
  // 89.4 cat-eared Gato-Clawd holds the Researcher by one hand over a glowing chasm. A
  // laser dot appears, his eyes track it, and the grip slips a notch on every beat. On the
  // last beat he pounces at the dot — and lets go. She falls.
  const CH = { edge: 250, top: 140, glowTop: 400 };

  function chasm(t) {
    // sky
    MV.flat([86, 96, 132], 255); brush.polygon([[-2600, -1600], [2600, -1600], [2600, -220], [-2600, -220]]);
    MV.flat([120, 122, 152], 255); brush.polygon([[-2600, -220], [2600, -220], [2600, -60], [-2600, -60]]);
    MV.flat([86, 78, 104], 255); brush.polygon([[-2600, -60], [2600, -60], [2600, 200], [-2600, 200]]);
    // far cliff wall on the left
    MV.flat([74, 70, 96], 255);
    brush.polygon([[-2600, -60], [-1080, -30], [-960, 300], [-1150, 900], [-2600, 1200]]);
    for (let i = 0; i < 4; i++) {
      const sx2 = -1900 + i * 260, sh2 = 150 + 90 * vnoise(i * 1.7, 81);
      poly([[-2600 + i * 40, 40], [sx2, 40 - sh2], [sx2 + 120, 40 - sh2 * 0.7], [sx2 + 220, 40]], [66, 62, 88], 250);
    }
    // the chasm glow: stacked bands getting hotter downward
    const band = (y0, y1, col, a) => { MV.flat(col, a); brush.polygon([[-2600, y0], [2600, y0], [2600, y1], [-2600, y1]]); };
    band(200, 300, [150, 96, 130], 255);
    band(300, 400, [196, 96, 118], 255);
    band(400, 560, [228, 108, 96], 255);
    band(560, 820, [248, 156, 92], 255);
    band(820, 1600, [252, 208, 138], 255);
    MV.glow(-300, 500, 900, [255, 186, 120], 0.34, 8);
    MV.glow(-300, 640, 560, [255, 232, 178], 0.3, 6);
    // spires rising out of the glow
    for (let i = -3; i <= 3; i++) {
      const sx3 = i * 420 - 180 + 90 * vnoise(i * 2.3, 82), hh = 130 + 170 * vnoise(i * 1.5, 83);
      poly([[sx3 - 70, 430], [sx3 - 26, 430 - hh], [sx3 + 34, 430 - hh * 0.8], [sx3 + 74, 430]], [88, 66, 84], 220);
    }
    // a distant ledge far below, for depth
    poly([[-1500, 400], [-560, 360], [-260, 430], [-300, 560], [-1500, 620]], [96, 72, 84], 235);
    // drifting mist over the glow
    for (let i = 0; i < 5; i++) {
      const mx = -2200 + i * 900 + 240 * Math.sin(t * 0.24 + i);
      S.cloud(mx, 380 + 40 * Math.sin(t * 0.4 + i * 2), 900, 200, 9200 + i, [246, 196, 178], 90);
    }
  }

  function segE(t) {
    MV.__stage = 'E';
    const u = span(t, 89.4, 95.4);
    const zoom = lerp(1.00, 1.04, smoother(span(t, 89.4, 92.6)));
    const foc = [500, 150];
    const sh = shake(t, 3, 6, 71);
    const c = camAt(foc[0], foc[1], zoom, { shakeX: Math.round(sh[0]), shakeY: Math.round(sh[1]) });
    setBandCam(c);
    MV.cam(c);
    chasm(t);
    // the cliff on the right
    {
      const E = CH.edge, T = CH.top;
      poly([[E, T], [E + 40, T - 26], [2600, T - 30], [2600, 1400], [E + 60, 1400], [E - 30, T + 320], [E - 40, T + 40]], [128, 106, 118], 252);
      inkPoly([[E, T], [E + 40, T - 26], [2600, T - 30], [2600, 1400], [E + 60, 1400], [E - 30, T + 320], [E - 40, T + 40]], [66, 50, 64], 6);
      // light spilling up the rock face from the glow
      MV.flat([255, 168, 120], 60);
      brush.polygon([[E - 40, T + 40], [E - 30, T + 320], [E + 60, 1400], [E + 420, 1400], [E + 240, T + 40]]);
      // a few cracks along the plateau
      for (let i = 0; i < 4; i++) {
        line2(E + 120 + i * 190, T - 14, E + 150 + i * 190, T + 34, [92, 74, 88], 4);
        line2(E + 130 + i * 190, T + 26, E + 186 + i * 190, T + 52, [92, 74, 88], 3);
      }
      for (const gx of [E - 10, E + 90, E + 210]) {
        MV.ink([74, 96, 72], 5, 'pen');
        for (let i = 0; i < 4; i++) brush.line(gx + i * 7 - 10, T - 24, gx + i * 9 - 12 + 16 * (i % 2 ? 1 : -1), T - 60 - 16 * (i % 3));
      }
    }
    // ---- the beat-driven grip slip
    const b0 = beatPos(t);
    const slips = [];
    for (const bs of [91.5, 93.2, 94.35]) slips.push(hump(t, bs, bs + 0.16, bs + 0.5));
    const slipAmt = slips.reduce((a, b, i) => a + b * (30 + i * 16), 0);
    const slipCum = slips.reduce((a, b, i) => a + (i >= 0 ? b * (30 + i * 16) : 0), 0);
    const rel = smoother(span(t, 94.52, 94.66));                 // the moment he lets go
    const pounce = smoother(span(t, 94.28, 94.58));
    // ---- the laser dot
    const dotApp = smooth(span(t, 90.3, 90.7));
    const dx0 = -620 + 420 * Math.sin(t * 0.7 + 0.4) + 140 * Math.sin(t * 1.9);
    const dy0 = -300 + 220 * Math.sin(t * 0.55 + 1.9) + 90 * Math.sin(t * 2.4);
    const showDot = dotApp * (1 - smooth(span(t, 94.62, 94.78)));
    if (showDot > 0.02) {
      MV.glow(dx0, dy0, 60, [255, 90, 84], 0.5 * showDot, 4);
      dot(dx0, dy0, 9, [242, 62, 62], 250 * showDot);
      dot(dx0, dy0, 4, [255, 226, 214], 250 * showDot);
      MV.flat([246, 70, 64], 90 * showDot);
      brush.polygon([[dx0 - 6, dy0], [dx0 + 6, dy0], [dx0 + 6 - dx0 * 0.0, -1400], [dx0 - 6, -1400]]);
    }
    // the clawd, holding her over the edge with one long arm
    const gx = 900, gh = 260, gy = CH.top;
    const bodyY = feetY(gy, gh), hw = gh * 0.8, hh = gh * 0.5;
    const crouch = 0.0;
    // the hand: held out over the void, dropping a notch on every slip
    const hand = [CH.edge - 22 - 34 * pounce, CH.top + 62 + slipCum + 120 * rel];
    // the reaching arm leaves his real arm root (characters.js puts arms at (±hw*0.9, -hh*0.05)),
    // never his eye — and the stub arm is turned to point straight down the long limb
    const bobY = 10 * Math.sin(t * 1.4) - 26 * pounce;
    const armRoot = [gx - hw * 0.9, bodyY + bobY - hh * 0.05];
    const lAng = Math.atan2(hand[1] - armRoot[1], hand[0] - armRoot[0]);
    const grip = [armRoot[0] + Math.cos(lAng) * hw * 0.45, armRoot[1] + Math.sin(lAng) * hw * 0.45];
    // contact shadow under him
    MV.flat([56, 44, 56], 46);
    brush.polygon([[gx - hw * 0.8, gy - 6], [gx + hw * 0.8, gy - 6], [gx + hw * 0.62, gy + 22], [gx - hw * 0.62, gy + 22]]);
    push();
    translate(gx, bodyY + 10 * Math.sin(t * 1.4) - 26 * pounce);
    rotate(-0.07 * pounce + 0.02 * Math.sin(t * 1.3) - 0.03 * slips[1]);
    const look = [clamp((dx0 - gx) / 900, -1, 1), clamp((dy0 - bodyY) / 900, -1, 1)];
    const downEye = rel > 0.02 ? 1 - smooth(span(t, 95.0, 95.16)) : 0;
    const lookF = [lerp(look[0], -0.5, downEye), lerp(look[1], 0.95, downEye)];
    MV.clawd({
      x: 0, y: 0, h: gh, seed: 81,
      face: { eyes: 'open', look: lookF, mouth: rel > 0.4 ? (downEye > 0.5 ? 'oh' : 'smile') : (pounce > 0.25 ? 'oh' : 'smile') },
      extras: ['catears'],
      arms: { l: lAng, r: 1.05 },
      legs: { l: 0.55, r: -0.35 }
    });
    pop();
    // the reaching arm itself: a long painted limb from his paw out to the hand over the void
    {
      const inkC = [58, 38, 30], col = [206, 132, 74];
      const n = 6;
      const halfW = (u) => gh * lerp(0.056, 0.036, u);        // a little taper: thicker at the shoulder
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n;
        const p0 = [lerp(grip[0], hand[0], u0), lerp(grip[1], hand[1], u0) + Math.sin(u0 * Math.PI) * 7];
        const p1 = [lerp(grip[0], hand[0], u1), lerp(grip[1], hand[1], u1) + Math.sin(u1 * Math.PI) * 7];
        const dx1 = p1[0] - p0[0], dy1 = p1[1] - p0[1], nl = Math.hypot(dx1, dy1) || 1;
        const hw2 = halfW((u0 + u1) / 2), px = -dy1 / nl * hw2, py = dx1 / nl * hw2;
        MV.flat(col, 252);
        brush.polygon([[p0[0] + px, p0[1] + py], [p1[0] + px, p1[1] + py], [p1[0] - px, p1[1] - py], [p0[0] - px, p0[1] - py]]);
      }
      dot(hand[0], hand[1], gh * 0.052, col, 252);
      inkPoly(ell(hand[0], hand[1], gh * 0.052, gh * 0.052, 9500, 12, 0.1), inkC, 3);
    }
    // the researcher, dangling from that hand — then she falls
    if (rel < 1) {
      const rx = hand[0] - 16, ry = hand[1] + 150;
      const fy = rel * rel * 900, spin = 0.1 * Math.sin(t * 2.2) + 0.05 * (slips[0] + slips[1]) + 2.2 * rel;
      // motion streaks so the drop reads
      for (let gi = 0; gi < 3; gi++) {
        const fg = fy * (0.45 + gi * 0.2);
        line2(rx - 30 + gi * 34, ry + fg - 150, rx - 34 + gi * 34, ry + fg + 40, [236, 220, 214], 5 - gi);
      }
      push();
      translate(rx, ry + fy);
      rotate(spin);
      const fs = 1 - 0.25 * rel;
      MV.researcher({
        x: 0, y: 0, s: 190 * fs, seed: 91, pose: 'run',
        face: { look: [0.1, -0.35 - 0.5 * rel], mouth: 'oh', glasses: rel > 0.02 ? 'sweat' : null, sweatN: 3 },
        arms: { l: -1.55, r: 1.5 }
      });
      pop();
      // her gripping hand, under his
      dot(rx + 8, ry - 118 + fy, 13 * fs, [236, 214, 196], 250);
      if (rel > 0.02) {
        for (let i = 0; i < 3; i++) {
          const g2 = (t * 1.2 + i * 0.33) % 1;
          dot(hand[0] + 34 * g2, hand[1] + 24 * g2, 7 * (1 - g2), [230, 226, 220], 200 * (1 - g2) * Math.min(1, rel * 6));
        }
      }
    }
    // dirt crumbling off the edge on each slip
    for (const sl of slips) if (sl > 0.01) {
      for (let i = 0; i < 5; i++) {
        const rr3 = rnd(9300 + i * 7);
        const px2 = CH.edge - 20 - rr3() * 60, py2 = CH.top + 40 + sl * (180 + rr3() * 260);
        dot(px2, py2, 6 + rr3() * 7, [128, 104, 108], 220 * (1 - sl));
      }
    }
    // his hand closes on nothing
    if (rel > 0.02) {
      dot(hand[0] + 4, hand[1] + 6, 15 * (0.7 + 0.3 * rel), [206, 132, 74], 250);
      MV.ink([58, 38, 30], 4, 'pen');
      brush.circle(hand[0] + 4, hand[1] + 6, 12 * (0.6 + 0.4 * downEye));
    }
    // embers drifting up out of the chasm
    for (let i = 0; i < 10; i++) {
      const rr3 = rnd(9400 + i), uu = (t * 0.22 + rr3()) % 1;
      const ex = -2000 + rr3() * 3600, ey = CH.glowTop + 300 - uu * 700;
      MV.glow(ex + Math.sin(t + i) * 40, ey, 22, [255, 210, 150], 0.3 * (1 - uu), 3);
    }
    MV.camPop();
  }

  // ================================================================ dispatch
  function draw(t) {
    if (t < 77.5) segA(t);
    else if (t < 81.4) segB(t);
    else if (t < 85.0) segC(t);
    else if (t < 89.4) segD(t);
    else segE(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.obsolete = { a: 73.0, b: 95.4, draw };
})();
