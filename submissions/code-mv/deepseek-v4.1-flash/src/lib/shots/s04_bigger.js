// src/lib/shots/s04_bigger.js — Shot 4 · Chorus 2: Bigger Show (59.0–73.0)
//   59.0 the stage becomes an arena; a building-sized Clawd works two pumps at once (34%→)
//   60.5 BOOM — the crowned basilisk bursts up through the floor; GPUs as offerings
//   63.0 the NVDA line rockets off its chart, up to the moon
//   64.5 the Omega Point: galaxies spiral in and converge
//   66.0 a planet-sized GPU overflows its odometer; the meter dings at 61%
//   70.0 hard-hat Clawds shut the vault on a glowing monster — the vault has no back wall
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeOut, easeOut3, easeInOut, easeBack, mix, css,
    beatEnv, beatPos, beatIndex, beatsIn, envAt, rnd, vnoise, shake
  } = MV;
  const TAU = Math.PI * 2;

  // ================================================================ shared helpers
  // MV.clawd's y is the body CENTRE; the feet land 0.62*h lower (measured off characters.js)
  const feetY = (feet, h) => feet - h * 0.62;
  // camera that keeps the scene point (px,py) pinned while zooming
  const camOn = (px, py, zoom, extra) => Object.assign({ x: -px * (zoom - 1), y: -py * (zoom - 1), zoom }, extra || {});
  // camera that puts the world point (px,py) at the centre of the canvas
  const camAt = (px, py, zoom, extra) => Object.assign({ x: -px * zoom, y: -py * zoom, zoom }, extra || {});
  // the last frames of a shot belong to the wipe of the next one
  const reveal = (t, a, b, col, seed) => { const u = smooth(span(t, a, b)); if (u < 0.995) MV.wipeBand(u, col, seed, 'out'); };
  // flat blob / ink outline helpers
  const poly = (pts, col, a) => { MV.flat(col, a === undefined ? 252 : a); brush.polygon(pts); };
  const inkPoly = (pts, col, w) => { MV.ink(col, w, 'pen'); brush.polygon(pts); };
  const rr = (cx, cy, w, h, r, seed, amp) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp === undefined ? 1.8 : amp);
  const ell = (cx, cy, rx, ry, seed, n = 24, amp = 0.05) => MV.wobbleEllipse(cx, cy, rx, ry, seed, n, amp);
  const line2 = (x1, y1, x2, y2, col, w) => { MV.ink(col, w, 'pen'); brush.line(x1, y1, x2, y2); };

  // screen-space band: brush shapes whose scissor rect misses the canvas throw, so every
  // off-canvas decoration is culled before it is queued (same contract as s03).
  const BAND = { fx: 0, cy: 0, hw: 1700, hh: 700, zoom: 1 };
  function setBand(z, foc) { BAND.zoom = z; BAND.fx = foc[0]; BAND.cy = foc[1]; BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 90; }
  // derive the culling band from an actual camera object (the world point at the screen centre)
  function setBandCam(c) { const z = c.zoom || 1; BAND.zoom = z; BAND.fx = -(c.x || 0) / z; BAND.cy = -(c.y || 0) / z; BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 90; }
  const onScreenX = (x, ext) => Math.abs(x - BAND.fx) - (ext || 0) < BAND.hw + 80;
  const onScreenY = (y, ext) => Math.abs(y - BAND.cy) - (ext || 0) < BAND.hh + 80;
  const onCanvas = (x, y, ext) => onScreenX(x, ext) && onScreenY(y, ext);

  // the P(doom) meter carries on from chorus 1 (it left off at 34%): stepped up on the beat,
  // hitting 61% on beat 153 (t ≈ 69.75) — where it dings.
  function meterPct4(t) {
    if (t < 60.50) return 34 + 3 * S.stair(t, 129, 132, 0, 1, 0.2);
    if (t < 63.00) return 37 + 4 * S.stair(t, 132, 138, 0, 1, 0.2);
    if (t < 66.00) return 41 + 6 * S.stair(t, 138, 145, 0, 1, 0.2);
    if (t < 70.00) return 47 + 14 * S.stair(t, 145, 153, 0, 1, 0.2);
    return 61;
  }

  // ================================================================ the arena
  const AR = {
    wall: [96, 26, 34], wallHi: [150, 50, 58], stand: [52, 18, 26], tier: [86, 30, 36],
    floor: [150, 104, 62], floorDark: [112, 74, 44], steel: [104, 110, 122],
    gold: P.gold, flame: [255, 186, 92], smoke: [66, 58, 62]
  };

  // a scalloped row of heads: ONE polygon for the whole row, so a stand of hundreds of
  // spectators still costs a handful of brush calls
  function crowdRow(t, dir, xi, xo, y, s, seed, o = {}) {
    const e = beatEnv(t + (o.ph || 0), 5.0);
    const yy = y - s * 0.16 * e + (o.lift || 0);
    const n = Math.max(4, Math.round(Math.abs(xo - xi) / (s * 1.55)));
    const top = [];
    for (let i = 0; i < n; i++) {
      const xa = lerp(xi, xo, i / n), xb = lerp(xi, xo, (i + 1) / n), xm = (xa + xb) / 2, hr = s * 0.62;
      for (let k = 0; k <= 5; k++) {
        const a = Math.PI + (k / 5) * Math.PI, jit = (vnoise(i * 3.1 + k + seed, seed) - 0.5) * s * 0.10;
        top.push([xm + Math.cos(a) * (xb - xa) * 0.52, yy + Math.sin(a) * hr + jit]);
      }
    }
    const body = top.concat([[xo + dir * 20, yy + s * 1.3], [xi - dir * 20, yy + s * 1.3]]);
    poly(body, o.col || [178, 86, 44], o.alpha === undefined ? 250 : o.alpha);
    // eyes: a scatter of dark dots (native 2D, cheap)
    push(); noStroke(); fill(css([40, 28, 24], 0.55));
    const r = rnd(seed * 7 + 3);
    for (let i = 0; i < n * 2; i++) {
      const x = lerp(xi, xo, r()), cy0 = yy + s * (0.05 + r() * 0.22);
      circle(x, cy0, s * 0.13);
    }
    pop();
    // a few raised arms on the beat
    const wave = ((beatIndex(t) + (o.off || 0)) % 2 + 2) % 2 === 0;
    for (let i = 0; i < 3; i++) {
      const fx = lerp(xi, xo, (i + 0.5) / 3 + 0.1 * r());
      const ay = yy + s * 0.1, al = s * (wave ? 0.95 : 0.5);
      line2(fx, ay, fx + (r() - 0.5) * s * 0.5, ay - al, [58, 22, 26], Math.max(1.4, s * 0.11));
    }
    if (e > 0.72) { poly([[xi, yy + s * 1.3], [xo, yy + s * 1.3], [xo, yy + s * 1.34], [xi, yy + s * 1.34]], AR.gold, 70); }
  }

  // a handful of individually animated spectators for the front rows
  function crowdClawd(x, y, s, t, seed, o = {}) {
    const e = beatEnv(t + (o.ph || 0), 5.5);
    const up = !o.down && (((beatIndex(t) + (o.off || 0)) % 2) + 2) % 2 === 0;
    const yy = y - s * 0.12 * e + (o.lift || 0);
    const col = o.col || [200, 100, 48];
    const dk = MV.shade(col, -74);
    const body = rr(x, yy, s * 1.6, s, s * 0.44, seed, s * 0.026);
    poly(body, col, 252); inkPoly(body, dk, Math.max(1.0, s * 0.05));
    for (const sd of [-1, 1]) {
      const ang = up ? (sd < 0 ? -2.34 : Math.PI + 2.34) : (sd < 0 ? -1.20 : Math.PI + 1.20);
      const ax = x + sd * s * 0.82, ay = yy - s * 0.02;
      line2(ax, ay, ax + Math.cos(ang) * s * 0.64, ay + Math.sin(ang) * s * 0.64, dk, Math.max(1.4, s * 0.11));
    }
    push(); noStroke(); fill(css([44, 30, 26], 0.9));
    for (const sd of [-1, 1]) circle(x + sd * s * 0.30, yy - s * 0.10, Math.max(2, s * 0.22));
    pop();
  }

  function pyroJet(t, x, y, seed, u) {
    if (u <= 0.01) return;
    const hgt = 300 * u, r = rnd(seed);
    poly([[x - 26 * u, y], [x + 26 * u, y], [x + 6, y - hgt * 0.72], [x - 6, y - hgt * 0.72]], [252, 132, 54], 200 * u);
    poly([[x - 17 * u, y], [x + 17 * u, y], [x + 4, y - hgt], [x - 4, y - hgt]], [255, 208, 118], 225 * u);
    poly([[x - 9 * u, y], [x + 9 * u, y], [x, y - hgt * 1.16]], [255, 246, 214], 235 * u);
    MV.glow(x, y - hgt * 0.35, 130 * u, [255, 178, 88], 0.45 * u, 6);
    poly(rr(x, y + 4, 54, 26, 8, seed, 1.2), AR.steel, 250);
    inkPoly(rr(x, y + 4, 54, 26, 8, seed, 1.2), [56, 60, 70], 2.2);
    if (u > 0.35) for (let i = 0; i < 3; i++) S.cloud(x + (r() - 0.4) * 90 * u, y - hgt * (0.9 + r() * 0.5), 150 * u, 60 * u, seed + i * 7, AR.smoke, 90 * u);
  }

  function trussLight(t, x, y, ang, col, seed) {
    const len = 1000, bx = x + Math.sin(ang) * len, by = y + Math.cos(ang) * len;
    poly([[x - 30, y], [x + 30, y], [bx + 210, by], [bx - 210, by]], col, 40);
    poly([[x - 16, y], [x + 16, y], [bx + 110, by], [bx - 110, by]], col, 38);
    MV.glow(x, y + 10, 90, col, 0.45, 5);
    const hb = rr(x, y - 6, 78, 56, 10, seed, 1.4);
    poly(hb, [70, 72, 82], 250); inkPoly(hb, [38, 40, 50], 2.2);
    push(); noStroke(); fill(css([255, 248, 226], 0.95)); circle(x, y + 18, 32); pop();
  }

  // the arena shell: back wall, sunburst, roof truss and hanging rigs
  function arenaShell(t) {
    MV.flat(AR.wall, 255); brush.polygon([[-1500, -900], [1500, -900], [1500, 900], [-1500, 900]]);
    MV.flat(AR.wallHi, 150); brush.polygon([[-1500, -900], [1500, -900], [1500, -620], [-1500, -620]]);
    S.sunburst(t, { cy: -170, R: 1600, rays: 30, c1: [190, 76, 66], c2: [112, 30, 38], a1: 120, a2: 64, glowA: 0.18, glowCol: AR.gold });
    // roof truss + hanging rigs
    poly([[-1500, -560], [1500, -560], [1500, -496], [-1500, -496]], [40, 16, 20], 250);
    for (let i = -7; i <= 7; i++) {
      const x = i * 190;
      if (!onScreenX(x, 40)) continue;
      line2(x - 90, -560, x + 90, -496, [26, 10, 14], 5);
      line2(x + 90, -560, x - 90, -496, [26, 10, 14], 5);
    }
    const sw = Math.sin(t * 0.45) * 0.26;
    trussLight(t, -900, -480, -0.26 + sw, [255, 226, 176], 611);
    trussLight(t, -560, -480, 0.06 + sw * 0.5, [250, 214, 180], 612);
    trussLight(t, 560, -480, -0.06 - sw * 0.5, [250, 214, 180], 613);
    trussLight(t, 900, -480, 0.26 - sw, [255, 226, 176], 614);
  }

  // the two raked banks of spectators flanking the stage: five rows a side, small + high at the
  // back and big + low at the front, plus a couple of individually animated fans
  function arenaStands(t, o = {}) {
    const duck = o.duck || 0;
    for (const dir of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const y = -400 + i * 138, s = 54 + i * 17;
        const xi = dir * (378 + i * 40), xo = dir * 1240;
        if (!onScreenX(xi) && !onScreenX(xo)) continue;
        MV.flat(mix(AR.stand, AR.tier, i / 4), 245);
        brush.polygon([[xi - dir * 24, y - s * 0.70], [xo + dir * 30, y - s * 0.70], [xo + dir * 30, y + s * 1.35], [xi - dir * 24, y + s * 1.35]]);
        crowdRow(t, dir, xi, xo, y, s, 900 + i * 17 + (dir > 0 ? 5 : 0), { off: i, ph: i * 0.03, lift: duck * (0.6 + i * 0.16) * s, col: mix([198, 102, 48], [92, 38, 24], 0.10 + i * 0.11) });
      }
      for (let i = 0; i < 2; i++) {
        const x = dir * (640 + i * 260), s = 128;
        if (!onScreenX(x, s)) continue;
        crowdClawd(x, 268, s, t, 960 + i * 13 + (dir > 0 ? 7 : 0), { off: i % 2, ph: i * 0.04, lift: duck * 86 * (1 + i * 0.3), down: duck > 0.3 });
      }
    }
  }

  // the arena floor the pumps and the giant stand on (call after the stage line)
  function arenaFloor(t) {
    MV.flat(AR.floor, 255); brush.polygon([[-1500, 240], [1500, 240], [1500, 900], [-1500, 900]]);
    for (let i = 0; i < 7; i++) {
      const y0 = 260 + i * i * 8 + i * 24;
      MV.ink(AR.floorDark, 1.6 + i * 0.8, 'pen'); brush.line(-1500, y0, 1500, y0);
    }
    for (let i = -6; i <= 6; i++) {
      MV.ink(AR.floorDark, 1.4, 'pen'); brush.line(i * 190, 244, i * 300, 900);
    }
  }

  // ================================================================ segA · the arena (59.0–60.4)
  // a building-sized Clawd works two bicycle pumps in alternation while the meter climbs
  const GI = { x: 0, y: 238, h: 520 };                      // the giant (y = body centre)
  const PU = { l: { x: -534, base: 630, s: 1.1 }, r: { x: 534, base: 630, s: 1.1 } };
  const METER = { x: 806, base: 620, s: 1.30 };

  // pick a pump's travel so its handle lands exactly on the hand
  const handleY = (base, s, tr) => base - 300 * s + 150 * s * tr - 16 * s;

  function giantPumps(t) {
    const eL = Math.pow(beatEnv(t, 4.6), 1.15);              // left hand pushes on the beat
    const eR = Math.pow(envAt(t, 0.5, 4.6), 1.15);           // right hand half a beat later
    const p0 = 0.28, rng = 0.42;
    const trL = p0 + rng * eL, trR = p0 + rng * eR;
    const yL = handleY(PU.l.base, PU.l.s, trL), yR = handleY(PU.r.base, PU.r.s, trR);
    const shLx = GI.x - GI.h * 0.72, shLx_y = GI.y - GI.h * 0.025;
    const shRx = GI.x + GI.h * 0.72;
    const aL = Math.atan2(yL - shLx_y, PU.l.x - shLx);
    const aR = Math.atan2(yR - shLx_y, PU.r.x - shRx);
    // pumps first, then the giant, so his hands land on the handles
    S.pump(PU.l.x, PU.l.base, PU.l.s, { travel: trL, hoseTo: [METER.x - 46, METER.base - 150], puffs: 0.5 * eL });
    S.pump(PU.r.x, PU.r.base, PU.r.s, { travel: trR, hoseTo: [METER.x - 20, METER.base - 40], puffs: 0.5 * eR });
    const hitAll = Math.max(eL, eR);
    MV.clawd({
      x: GI.x, y: GI.y, h: GI.h, seed: 71, sx: 1 - 0.02 * hitAll, sy: 1 + 0.03 * hitAll,
      face: { eyes: hitAll > 0.55 ? 'happy' : 'open', look: [-0.15, 0.05], mouth: hitAll > 0.5 ? 'oh' : 'smile', blush: true },
      arms: { l: aL, r: aR }, legs: { l: 0.35, r: -0.35 }, extras: ['sweatband']
    });
  }

  function arenaCam(t) {
    const k = smoother(span(t, 59.2, 60.3));
    const fl = smooth(span(t, 60.30, 60.5));                  // the boom starts to take over
    return camOn(lerp(0, -20, k), lerp(150, 120, k) - 30 * fl, lerp(0.86, 0.94, k) + 0.03 * fl, {});
  }

  function segA(t) {
    MV.__stage = 'A';
    const c = arenaCam(t);
    setBand(c.zoom, [0, 0]);
    MV.cam(c);
    arenaShell(t);
    arenaStands(t);
    arenaFloor(t);
    MV.propText('P(doom)', 0, -286, { cam: c, font: '900 96px Georgia, "Times New Roman", serif', color: '#f6e6c2', outlineColor: 'rgba(84,18,24,0.92)', lineW: 13 });
    S.meter(METER.x, METER.base, METER.s, meterPct4(t), { cam: c });
    giantPumps(t);
    // pyro jets along the downstage edge, firing on the bar
    // pyro jets along the downstage edge
    const barE = Math.pow(envAt(t, 0, 3.4), 1.4);
    for (const j of [-900, -430, 260, 880]) pyroJet(t, j, 600, 620 + Math.round(j / 10), barE);
    S.footlights(t, { y: 520 });
    // the Researcher on the floor, conducting the pump strokes
    const rE = Math.pow(beatEnv(t, 4.2), 1.3);
    MV.researcher({
      x: -706, y: 566, s: 200, seed: 5,
      face: { look: [0.35, -0.5], mouth: rE > 0.5 ? 'oh' : 'smile', glasses: 'plain' },
      arms: { l: -1.35 - 0.7 * rE, r: Math.PI + 1.35 + 0.7 * rE }
    });
    if (rE > 0.62) MV.drawEmote({ kind: 'exclaim', x: -620, y: 386, s: 38 * rE, alpha: rE });
    S.confetti(t, { n: 30, t0: 59.0, bot: 520, alpha: 0.6 });
    MV.camPop();
    reveal(t, 58.98, 59.42, [248, 218, 230], 93);            // the pink of the pop wipes away
  }

  // ================================================================ segB · the basilisk (60.5–62.4)
  // the floor splits, a crowned serpent rears up, the giant topples and the crowd ducks; the
  // Researcher hurls GPUs at it as offerings — and it cheerfully eats every one.
  const SERP = { x: 330, cratY: 575, s: 1.0 };
  const THROW = { x0: -900, y0: 300, dt: 0.236, t0: 60.94, n: 8, fly: 0.52 };

  // a ring outline: ink + a closed polygon (noFill) — cheap painted circle
  function ring(x, y, rx, ry, col, w, seed, n = 30) {
    MV.ink(col, w, 'pen'); brush.polygon(ell(x, y, rx, ry, seed, n, 0.05));
  }

  function craterDebris(t, cx, cy, u, seed) {
    if (u <= 0 || u > 1) return;
    const r = rnd(seed);
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI * (0.12 + r() * 0.76), v = 460 + r() * 620;
      const x = cx + Math.cos(a) * v * u * (0.5 + r() * 0.8);
      const y = cy + Math.sin(a) * v * u * 0.62 - 760 * u * u;
      if (!onCanvas(x, y, 120)) continue;
      const rot = r() * TAU + u * (2 + r() * 3.4);
      const pl = MV.wobbleRoundRect(x, y, 140 + r() * 130, 26, 6, seed + i, 4, 2.6, rot);
      poly(pl, [158, 114, 72], 250); inkPoly(pl, [92, 60, 36], 2.4);
    }
    for (let i = 0; i < 5; i++) S.cloud(cx + (r() - 0.5) * 700 * u, cy - 40 * r() * u - 60, 340 * u, 150 * u, seed + 40 + i, [196, 160, 118], 150 * (1 - u));
  }

  // the crowned serpent. o: { x, baseY, H (visible height above the crater), s, rise, mouth, wig, fed }
  function basilisk(t, o = {}) {
    const s = o.s || 1, x = o.x, baseY = o.baseY, H = o.H, wig = o.wig || 0, seed = o.seed || 71;
    const n = 14, L = [], R = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const sx = x + Math.sin(u * 2.0 + wig) * (40 + 96 * u) * s;
      const sy = baseY - Math.pow(u, 0.94) * H;
      const sr = lerp(112, 52, Math.pow(u, 0.72)) * s * (1 + 0.10 * Math.sin(u * 9 + wig * 2));
      L.push([sx - sr, sy]); R.push([sx + sr, sy]);
    }
    const body = L.concat(R.reverse());
    poly(body, [92, 150, 98], 252); inkPoly(body, [36, 72, 46], 3.4);
    // belly plates
    for (let i = 0; i <= n; i += 1) {
      const u = i / n;
      const sx = x + Math.sin(u * 2.0 + wig) * (40 + 96 * u) * s;
      const sy = baseY - Math.pow(u, 0.94) * H;
      const sr = lerp(112, 52, Math.pow(u, 0.72)) * s;
      MV.ink([186, 206, 152], 7, 'pen');
      brush.line(sx - sr * 0.40, sy, sx + sr * 0.40, sy);
    }
    // scale arcs down both flanks
    const r = rnd(seed);
    for (let i = 0; i < 16; i++) {
      const u = 0.12 + r() * 0.8;
      const sx = x + Math.sin(u * 2.0 + wig) * (40 + 96 * u) * s;
      const sy = baseY - Math.pow(u, 0.94) * H;
      const sr = lerp(112, 52, Math.pow(u, 0.72)) * s;
      const sd = r() < 0.5 ? -1 : 1;
      ring(sx + sd * sr * 0.55, sy, sr * 0.30, sr * 0.22, [58, 104, 64], 3, seed + i, 12);
    }
    // coils resting on the floor
    for (let i = 0; i < 3; i++) {
      ring(x - 30 * s + i * 26 * s, baseY + 6 + i * 12, (210 - i * 44) * s, (44 - i * 9) * s, [46, 88, 56], 5, seed + 90 + i, 26);
    }
    const hx = x + Math.sin(2.0 + wig) * (40 + 96) * s;
    const hy = baseY - H - 54 * s;
    serpHead(t, hx, hy, s * 1.12, o.mouth === undefined ? 0.5 : o.mouth, o.wig || 0, o.fed || 0, seed);
  }

  // front-facing crowned serpent head: hood, skull, glow-slit eyes, hinged jaw, forked tongue
  function serpHead(t, hx, hy, s, mouth, wig, fed, seed) {
    const HL = 158 * s, HH = 104 * s;
    // rounded cobra hood behind the head
    const hood = ell(hx, hy + 24 * s, HL * 1.42, HH * 1.42, seed + 21, 28, 0.07);
    poly(hood, [70, 126, 82], 242);
    ring(hx, hy + 24 * s, HL * 1.42, HH * 1.42, [40, 84, 52], 3.4, seed + 22, 28);
    ring(hx - HL * 1.02, hy + 30 * s, 8 * s, 14 * s, [42, 86, 54], 3, seed + 3, 12);
    ring(hx + HL * 1.02, hy + 30 * s, 8 * s, 14 * s, [42, 86, 54], 3, seed + 4, 12);
    // skull: a rounded wedge with a broad back and a snout
    const skull = ell(hx, hy - HH * 0.16, HL * 1.00, HH * 0.98, seed + 31, 26, 0.05);
    poly(skull, [104, 164, 106], 252); inkPoly(skull, [34, 70, 44], 3.4);
    const snout = ell(hx, hy + HH * 0.50, HL * 0.70, HH * 0.46, seed + 32, 20, 0.05);
    poly(snout, [96, 156, 100], 252); inkPoly(snout, [34, 70, 44], 3);
    // brow ridges
    for (const sd of [-1, 1]) {
      const pts = [[hx + sd * HL * 0.20, hy - HH * 0.60], [hx + sd * HL * 0.62, hy - HH * 0.84], [hx + sd * HL * 0.92, hy - HH * 0.36]];
      poly(pts, [66, 118, 76], 250); inkPoly(pts, [30, 62, 40], 2.6);
    }
    // eyes: a warm glow ring + a slit pupil, opening wider with the beat
    const eg = 1 + 0.12 * Math.sin(t * 6.4 + 1);
    for (const sd of [-1, 1]) {
      const ex = hx + sd * HL * 0.46, ey = hy - HH * 0.22;
      MV.glow(ex, ey, 60 * s, [255, 214, 96], 0.5, 5);
      ring(ex, ey, 42 * s * eg, 40 * s, [212, 176, 74], 4, seed + 7, 22);
      poly(ell(ex, ey, 34 * s * eg, 33 * s, seed + 8, 20, 0.04), [252, 226, 122], 250);
      poly(ell(ex, ey, 8 * s, 30 * s * (0.6 + 0.4 * mouth), seed + 9, 14, 0.05), [30, 26, 24], 252);
    }
    // nostrils
    push(); noStroke(); fill(css([30, 56, 36], 0.9));
    for (const sd of [-1, 1]) circle(hx + sd * 20 * s, hy + 44 * s, 10 * s);
    pop();
    // jaw (hinges open) + mouth cavity
    const jm = clamp(mouth), jr = jm * 0.52;
    push(); translate(hx, hy + 30 * s); rotate(-jr);
    const jaw = [[-HL * 0.66, 0], [HL * 0.66, 0], [HL * 0.50, 92 * s], [-HL * 0.50, 92 * s]];
    poly(jaw, [96, 152, 100], 252); inkPoly(jaw, [34, 70, 44], 3.2);
    pop();
    if (jm > 0.06) {
      const cav = ell(hx, hy + 44 * s, HL * 0.58, 54 * s * jm, seed + 11, 22, 0.05);
      poly(cav, [58, 26, 34], 252); inkPoly(cav, [38, 16, 22], 2.6);
      // fangs
      for (const sd of [-1, 1]) {
        poly([[hx + sd * HL * 0.34, hy + 22 * s], [hx + sd * HL * 0.48, hy + 22 * s], [hx + sd * HL * 0.40, hy + 22 * s + 40 * s * jm]], [250, 246, 226], 252);
      }
      // forked tongue
      const fl = 70 * s + 40 * s * Math.max(0, Math.sin(t * 6.4));
      MV.ink([204, 74, 96], 9 * s, 'pen');
      brush.line(hx, hy + 50 * s, hx, hy + 50 * s + fl);
      brush.line(hx, hy + 50 * s + fl * 0.86, hx - 20 * s, hy + 50 * s + fl * 1.16);
      brush.line(hx, hy + 50 * s + fl * 0.86, hx + 20 * s, hy + 50 * s + fl * 1.16);
    }
    // crown
    const cy0 = hy - HH * 0.98 - 6 * s, w = HL * 0.60;
    const crown = [[-w, cy0], [-w, cy0 - 74 * s], [-w * 0.5, cy0 - 24 * s], [0, cy0 - 96 * s], [w * 0.5, cy0 - 24 * s], [w, cy0 - 74 * s], [w, cy0]];
    poly(crown.map(p => [hx + p[0], p[1]]), AR.gold, 252);
    inkPoly(crown.map(p => [hx + p[0], p[1]]), [132, 92, 30], 3);
    push(); noStroke(); fill(css(P.rose, 0.95));
    circle(hx, cy0 - 52 * s, 13 * s); circle(hx - w * 0.62, cy0 - 26 * s, 9 * s); circle(hx + w * 0.62, cy0 - 26 * s, 9 * s);
    pop();
    // fed: a happy blush + sparkles
    if (fed > 0.1) {
      push(); noStroke(); fill(css([232, 132, 138], 0.35 * clamp(fed)));
      circle(hx - HL * 0.78, hy + 6 * s, 40 * s); circle(hx + HL * 0.78, hy + 6 * s, 40 * s); pop();
      for (let i = 0; i < Math.round(clamp(fed) * 4); i++) {
        const ax = hx + Math.sin(t * 1.7 + i * 2.1) * HL * 1.3, ay = hy - 150 * s - i * 26 * s - 20 * Math.sin(t * 2 + i);
        MV.drawEmote({ kind: 'sparkle', x: ax, y: ay, s: 22 * s, alpha: 0.8 });
      }
    }
  }

  // a graphics card thrown as an offering
  function gpuProp(x, y, s, rot, seed) {
    push(); translate(x, y); rotate(rot);
    const pcb = rr(0, 0, 150 * s, 74 * s, 5 * s, seed, 2.2);
    poly(pcb, [56, 62, 58], 252); inkPoly(pcb, [30, 34, 32], 2.4);
    poly([[-75 * s, 22 * s], [75 * s, 22 * s], [75 * s, 34 * s], [-75 * s, 34 * s]], [96, 178, 96], 252);
    poly([[-70 * s, -37 * s], [70 * s, -37 * s], [70 * s, -12 * s], [-70 * s, -12 * s]], [96, 104, 112], 252);
    inkPoly([[-70 * s, -37 * s], [70 * s, -37 * s], [70 * s, -12 * s], [-70 * s, -12 * s]], [48, 54, 60], 2.2);
    ring(30 * s, -24 * s, 22 * s, 22 * s, [40, 44, 48], 3, seed + 2, 16);
    ring(30 * s, -24 * s, 8 * s, 8 * s, [150, 210, 150], 3, seed + 3, 12);
    pop();
  }

  function segBCam(t) {
    const boom = smoother(span(t, 60.50, 60.86));
    const sh = shake(t, 30 * boom, 6.5, 33);
    const whip = smoother(span(t, 61.1, 61.6));                      // ease off toward the thrower
    const zoom = lerp(0.94, 0.78, boom) + 0.04 * whip;
    const fx = lerp(-20, 90, boom) - 250 * whip;
    const fy = lerp(120, 60, boom) + 20 * whip;
    const c = camOn(fx, fy, zoom, {});
    c.shakeX = sh[0]; c.shakeY = sh[1];
    return c;
  }

  function segB(t) {
    MV.__stage = 'B';
    const c = segBCam(t);
    setBand(c.zoom, [0, 0]);
    MV.cam(c);
    const rise = smoother(span(t, 60.52, 61.10));
    const riseS = easeOut3(span(t, 60.52, 61.10));
    const duck = smoother(span(t, 60.66, 61.15));
    const boomU = clamp((t - 60.50) / 0.50);
    arenaShell(t);
    arenaStands(t, { duck });
    arenaFloor(t);
    // the crater: a dark ragged hole with a cracked, broken rim
    if (rise > 0.02) {
      const rx = 360 * (0.4 + 0.6 * rise), ry = 104 * (0.4 + 0.6 * rise);
      for (let i = 0; i < 7; i++) {
        const a = Math.PI * (0.08 + 0.84 * (i / 6));
        MV.ink([70, 46, 28], 3 + i % 2, 'pen');
        brush.line(SERP.x + Math.cos(a) * rx * 0.94, SERP.cratY + Math.sin(a) * ry * 0.94,
                   SERP.x + Math.cos(a) * rx * 1.55, SERP.cratY + Math.sin(a) * ry * 1.5);
      }
      poly(ell(SERP.x, SERP.cratY, rx, ry, 517, 26, 0.10), [40, 24, 18], 252);
      ring(SERP.x, SERP.cratY, rx, ry, [102, 68, 40], 5, 518, 26);
    }
    // the pumps first, then the giant (who is knocked backwards), then the serpent in front
    const fall = smoother(span(t, 60.86, 61.41));
    const eL = Math.pow(beatEnv(t, 4.6), 1.15) * (1 - fall), eR = Math.pow(envAt(t, 0.5, 4.6), 1.15) * (1 - fall);
    const trL = 0.28 + 0.42 * eL, trR = 0.28 + 0.42 * eR;
    S.pump(PU.l.x, PU.l.base, PU.l.s, { travel: trL, hoseTo: [METER.x - 46, METER.base - 150], puffs: 0.5 * eL });
    S.pump(PU.r.x, PU.r.base, PU.r.s, { travel: trR, hoseTo: [METER.x - 20, METER.base - 40], puffs: 0.5 * eR });
    push();
    translate(lerp(0, -210, fall), lerp(0, 70, fall));
    MV.clawd({
      x: GI.x, y: GI.y, h: GI.h, seed: 71, rot: -0.26 * fall, sx: 1 + 0.03 * fall, sy: 1 - 0.02 * fall,
      face: { eyes: fall > 0.25 ? 'x' : 'open', look: [-0.6, 0.3], mouth: fall > 0.2 ? 'oh' : 'smile', blush: true },
      arms: { l: lerp(2.3, -2.5, fall), r: lerp(0.8, -0.6, fall) }, legs: { l: 0.8 * fall + 0.35, r: -0.8 * fall - 0.35 },
      extras: ['sweatband']
    });
    pop();
    // the serpent
    const H = lerp(190, 940, Math.pow(riseS, 0.85));
    const mouth = clamp(0.25 + 0.75 * boomU) * (1 - 0.35 * smoother(span(t, 61.6, 62.3))) + 0.25;
    const wig = Math.sin(t * 1.9) * 0.34 + riseS * 0.2;
    const caught = Math.max(0, Math.min(THROW.n, Math.floor((t - THROW.t0 - THROW.fly) / THROW.dt) + 1));
    basilisk(t, { x: SERP.x, baseY: SERP.cratY, H, s: 1 + 0.03 * caught, wig, mouth, fed: caught / 4, seed: 71 });
    craterDebris(t, SERP.x, SERP.cratY - 20, boomU, 601);
    // shock ring + flash
    if (boomU > 0 && boomU < 1) {
      ring(SERP.x, SERP.cratY - 30, lerp(160, 1500, easeOut(boomU)), lerp(60, 520, easeOut(boomU)), [252, 226, 176], 9 * (1 - boomU) + 2, 519, 30);
      MV.flat([255, 238, 206], 210 * Math.pow(1 - boomU, 2.2));
      brush.polygon([[-1600, -900], [1600, -900], [1600, 900], [-1600, 900]]);
    }
    S.meter(METER.x, METER.base, METER.s, meterPct4(t), { cam: c });
    // the GPUs, thrown on the half-beat
    const rE = Math.pow(beatEnv(t, 4.0), 1.4);
    for (let i = 0; i < THROW.n; i++) {
      const t0 = THROW.t0 + i * THROW.dt, u = (t - t0) / THROW.fly;
      if (u < 0 || u > 1) continue;
      const sx = THROW.x0 + 60, sy0 = THROW.y0 - 120;
      const tx = SERP.x + 150, ty = SERP.cratY - H - 40;
      const x = lerp(sx, tx, u), y = lerp(sy0, ty, u) - 300 * Math.sin(Math.PI * u);
      gpuProp(x, y, 0.9, u * 9 + i, 700 + i * 7);
    }
    // the thrower
    MV.researcher({
      x: THROW.x0, y: 552, s: 208, seed: 5,
      face: { look: [0.7, -0.4], mouth: rE > 0.4 ? 'oh' : 'smile', glasses: 'sweat' },
      arms: { l: -0.5 - 1.5 * rE, r: -1.2 - 0.9 * (1 - rE) }
    });
    if (rE > 0.6) MV.drawEmote({ kind: 'sweat', x: THROW.x0 + 70, y: 430, s: 42 * rE, alpha: rE });
    MV.propText('BOOM!', SERP.x + 300, 150 - 60 * smoother(span(t, 60.6, 61.4)), {
      cam: c, font: '900 120px Georgia, "Times New Roman", serif', color: '#f6e6c2',
      outlineColor: 'rgba(84,18,24,0.92)', lineW: 16, alpha: 1 - smoother(span(t, 61.1, 61.8))
    });
    MV.camPop();
  }
  // ================================================================ segC · NVDA to the moon (62.93–64.5)
  // the green line breaks out of its chart and rockets; Clawd rides the tip up through the
  // clouds, lands on the moon and plants the flag. The camera pulls back at the end.
  const CH = { cx: 0, cy: 470, w: 1560, h: 430 };
  const LINE_X = -230;
  const MOON = { x: 300, y: 4180, r: 660 };
  const EARTH = { x: -1290, y: 4700, r: 250 };
  const SKC = { bottom: [214, 152, 88], mid: [122, 96, 156], top: [34, 28, 68] };
  const CLD = [[700, -150, 900, 240], [1500, 320, 720, 190], [150, 760, 1150, 260], [1320, 1260, 820, 210],
               [-250, 1720, 980, 250], [900, 2180, 760, 200], [-450, 2620, 1050, 240], [560, 3060, 900, 220]];

  function tipY(t) { return lerp(262, MOON.y - MOON.r * 0.86, Math.pow(clamp((t - 63.14) / 0.86), 1.5)); }

  function chartPanel(t, cam) {
    const w = CH.w, h = CH.h, cx = CH.cx, cy = CH.cy;
    const p = rr(cx, cy, w, h, 18, 811, 3);
    poly(p, [20, 24, 48], 246); inkPoly(p, [8, 10, 24], 4);
    for (let i = 1; i <= 5; i++) { const x = cx - w / 2 + w * i / 6; line2(x, cy - h / 2 + 18, x, cy + h / 2 - 18, [56, 62, 104], 1.6); }
    for (let i = 1; i <= 3; i++) { const y = cy - h / 2 + h * i / 4; line2(cx - w / 2 + 18, y, cx + w / 2 - 18, y, [56, 62, 104], 1.6); }
    const r = rnd(813);
    for (let i = 0; i < 24; i++) {
      const x = cx - w / 2 + 62 + i * 58, u = i / 23;
      const yBase = cy + h / 2 - 46 - u * u * 250;
      const up = r() > 0.34, col = up ? [104, 206, 118] : [214, 94, 94];
      const bh = 26 + r() * 42;
      line2(x, yBase - bh * 0.5 - 20, x, yBase + bh * 0.5 + 20, col, 3);
      poly(rr(x, yBase, 26, bh, 4, 814 + i, 1.4), col, 250);
    }
    MV.propText('NVDA', cx - w / 2 + 130, cy - h / 2 + 62, {
      cam, font: '900 52px Georgia, "Times New Roman", serif',
      color: '#9ee6a8', outlineColor: 'rgba(10,14,28,0.9)', lineW: 6
    });
    // the line: a hockey stick out of the panel's top edge
    MV.ink([124, 240, 138], 10, 'pen');
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const x = lerp(cx - w / 2 + 120, LINE_X, u);
      const y = cy + h / 2 - 70 - Math.pow(u, 2.1) * (h - 96);
      pts.push([x, y]);
    }
    for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    // the vertical launch
    const ty = tipY(t);
    MV.ink([124, 240, 138], 11, 'pen');
    brush.line(LINE_X, cy - h / 2 + 4, LINE_X, ty + 30);
    MV.glow(LINE_X, ty, 130, [150, 255, 160], 0.4, 6);
  }

  // painted sky bands + clouds + stars over the visible world window (camera is rising fast)
  function ascentSky(t, fy) {
    const top = fy - 620, bot = fy + 620, bands = 18;
    for (let i = 0; i < bands; i++) {
      const ya = lerp(top, bot, i / bands), yb = lerp(top, bot, (i + 1) / bands);
      const wy = (ya + yb) / 2;
      const u = clamp((wy + 700) / 3600);
      const col = u < 0.55 ? mix(SKC.bottom, SKC.mid, u / 0.55) : mix(SKC.mid, SKC.top, (u - 0.55) / 0.45);
      MV.flat(col, 255); brush.polygon([[-1600, ya], [1600, ya], [1600, yb], [-1600, yb]]);
    }
    // stars fade in with altitude
    const sA = clamp((fy - 1200) / 1800);
    if (sA > 0.02) {
      const r = rnd(3210);
      push(); noStroke();
      for (let i = 0; i < 130; i++) {
        const x = (r() - 0.5) * 3200, y = top + r() * 1240;
        if (y > 1500) continue;
        fill(css([250, 248, 232], (0.25 + r() * 0.6) * sA * Math.min(1, y / 1600)));
        circle(x, y, 2 + r() * 4);
      }
      pop();
    }
    for (const c of CLD) {
      const cy0 = c[1] + 900;
      if (!onCanvas(c[0], cy0, c[2] * 0.7)) continue;
      const k = clamp((fy + 700 - cy0) / 2400);
      const aC = 190 * (1 - clamp((cy0 - 1150) / 1300));
      if (aC < 8) continue;
      S.cloud(c[0], cy0, c[2] * (0.7 + 0.5 * k), c[3] * (0.7 + 0.5 * k), 3300 + Math.round(c[0]), mix([250, 224, 162], [244, 236, 226], k * 0.7), aC);
    }
    // vertical speed streaks
    for (let i = 0; i < 18; i++) {
      const x = ((i * 173) % 3200) - 1600, len = 150 + ((i * 137) % 420);
      const y = top + ((i * 419 + Math.floor(t * 26) * 53) % 1240);
      MV.ink([255, 246, 220], 1.6 + (i % 2) * 1.2, 'pen');
      brush.line(x, y, x, y + len);
    }
  }

  function moonBody(t, glowA) {
    const m = MOON;
    MV.glow(m.x, m.y, m.r * 1.5, [214, 226, 255], 0.22 * glowA, 7);
    const d = ell(m.x, m.y, m.r, m.r * 0.97, 4201, 40, 0.02);
    poly(d, [226, 224, 214], 252); ring(m.x, m.y, m.r, m.r * 0.97, [150, 146, 138], 4, 4202, 40);
    const r = rnd(4203);
    for (let i = 0; i < 12; i++) {
      const a = r() * TAU, rr = r() * m.r * 0.82, cr = m.r * (0.05 + r() * 0.13);
      const x = m.x + Math.cos(a) * rr, y = m.y + Math.sin(a) * rr * 0.9;
      ring(x, y, cr, cr * 0.86, [176, 172, 164], 3, 4210 + i, 14);
    }
  }

  function flag(t, x, y, u, seed, cam) {
    if (u <= 0) return;
    // pole
    MV.ink([196, 200, 210], 7, 'pen');
    brush.line(x, y, x, y - 230);
    // pennant
    const w0 = 190 * Math.min(1, u * 1.6), fl = Math.sin(t * 3.1) * 12;
    const pts = [[x, y - 226], [x + w0, y - 200 + fl], [x + w0 * 0.82, y - 168 + fl], [x, y - 132]];
    poly(pts, [92, 196, 108], 250); inkPoly(pts, [34, 92, 48], 3);
    MV.propText('NVDA', x + w0 * 0.52, y - 182 + fl, {
      cam, font: '900 40px Georgia, "Times New Roman", serif',
      color: '#0d2a16', outline: false, alpha: Math.min(1, u * 2)
    });
  }

  function segC(t) {
    MV.__stage = 'C';
    const land = smoother(span(t, 63.98, 64.18));       // arrived on the moon
    const pull = smoother(span(t, 64.16, 64.48));       // the closing pull-back
    const ty = tipY(t);
    const fy = lerp(60, ty - 210, smoother(span(t, 63.10, 63.60)));
    const fx = lerp(0, LINE_X + 120, smoother(span(t, 63.1, 63.7)));
    let zoom = lerp(0.94, 1.0, smoother(span(t, 63.0, 63.3)));
    let cx0 = camAt(fx, fy, zoom, {});
    if (pull > 0.001) {
      const f2 = mix([fx, fy], [MOON.x - 60, MOON.y - 200], pull);
      zoom = lerp(zoom, 0.62, pull);
      cx0 = camAt(f2[0], f2[1], zoom, {});
    }
    setBandCam(cx0);
    MV.cam(cx0);
    ascentSky(t, fy);
    // the chart is only around for the breakout
    if (fy < 900) chartPanel(t, cx0);
    if (MOON.y - MOON.r < fy + 900) moonBody(t, clamp((fy - 2200) / 1200));
    if (EARTH.y - EARTH.r < fy + 900 && fy > 3600) {
      MV.glow(EARTH.x, EARTH.y, EARTH.r * 1.6, [140, 200, 255], 0.25, 6);
      poly(ell(EARTH.x, EARTH.y, EARTH.r, EARTH.r * 0.98, 4301, 34, 0.03), [86, 148, 196], 252);
      ring(EARTH.x, EARTH.y, EARTH.r, EARTH.r * 0.98, [60, 106, 150], 4, 4302, 34);
      poly(ell(EARTH.x - 40, EARTH.y - 30, EARTH.r * 0.42, EARTH.r * 0.30, 4303, 20, 0.12), [104, 176, 118], 240);
      poly(ell(EARTH.x + 60, EARTH.y + 50, EARTH.r * 0.36, EARTH.r * 0.26, 4304, 20, 0.12), [116, 182, 128], 230);
    }
    // the rider on the tip of the line
    if (!land) {
      const e = Math.pow(beatEnv(t, 4.0), 1.2);
      const hh = 250;
      MV.clawd({
        x: LINE_X - 6 + Math.sin(t * 7) * 4, y: feetY(ty + 12, hh) - 130 * land, h: hh, seed: 41,
        rot: -0.10 + 0.05 * e, sx: 1 - 0.04 * e, sy: 1 + 0.05 * e,
        face: { eyes: e > 0.5 ? 'happy' : 'open', look: [0.1, -0.35], mouth: 'oh', blush: true },
        arms: { l: -2.5, r: -1.6 }, legs: { l: -0.5, r: 0.5 }, extras: ['sweatband']
      });
      MV.drawEmote({ kind: 'sparkle', x: LINE_X + 120, y: ty - 300, s: 40, alpha: 0.7 });
    }
    // the landing: dust puff, the flag goes up
    if (land > 0.01) {
      if (land < 0.5) for (let i = 0; i < 3; i++) S.cloud(LINE_X + (i - 1) * 150, MOON.y - MOON.r * 0.88, 260, 110, 4400 + i, [236, 232, 224], 150 * (1 - land * 2));
      const hh = 250;
      MV.clawd({
        x: LINE_X + 60, y: feetY(MOON.y - MOON.r * 0.90, hh), h: hh, seed: 41,
        rot: 0, face: { eyes: 'happy', look: [-0.2, 0.1], mouth: 'smile', blush: true },
        arms: { l: -3.0, r: 0.15 }, legs: { l: 0.3, r: -0.3 }, extras: ['sweatband']
      });
      flag(t, LINE_X + 330, MOON.y - MOON.r * 0.90, smoother(span(t, 64.02, 64.26)), 4405, cx0);
    }
    MV.camPop();
  }

  // ================================================================ segD · the Omega Point (64.5–66.0)
  // galaxies spiral inward and converge into one blinding point while Clawd floats, arms wide
  const GAL = [[-700, -330, 380, 3.1, 901], [590, -450, 320, -2.4, 902], [-560, 300, 300, 4.2, 903], [780, 180, 270, 1.7, 904], [90, -560, 230, 5.1, 905]];

  function galaxy(cx, cy, r, spin, seed, alpha) {
    if (r < 14) return;
    const rr = rnd(seed);
    // dust disc + bright core
    MV.bloom([124, 100, 186], 46 * alpha);
    brush.polygon(ell(cx, cy, r * 1.04, r * 0.62, seed + 5, 28, 0.05));
    MV.glow(cx, cy, r * 0.62, [255, 240, 208], 0.38 * alpha, 6);
    poly(ell(cx, cy, r * 0.22, r * 0.14, seed + 9, 16, 0.10), [255, 246, 222], 250 * alpha);
    // two wound arms of fuzz
    for (let arm = 0; arm < 2; arm++) {
      for (let i = 0; i < 20; i++) {
        const u = (i + rr() * 0.9) / 20;
        const a = spin + arm * Math.PI + u * 5.2;
        const rad = r * (0.12 + u * 0.95);
        const x = cx + Math.cos(a) * rad + (rr() - 0.5) * r * 0.24;
        const y = cy + Math.sin(a) * rad * 0.58 + (rr() - 0.5) * r * 0.14;
        const sz = r * (0.19 - u * 0.10) * (0.7 + rr() * 0.6);
        if (!onCanvas(x, y, sz * 2)) continue;
        poly(ell(x, y, sz, sz * 0.8, seed + i * 3 + arm * 31, 10, 0.26),
             u < 0.45 ? [255, 232, 196] : [204, 188, 246], 205 * alpha);
      }
    }
  }

  function segD(t) {
    MV.__stage = 'D';
    const k = smoother(span(t, 64.5, 65.85));
    const flash = Math.pow(clamp((t - 65.70) / 0.30), 3.0);
    const zoom = lerp(0.96, 1.28, k);
    const c = camAt(0, -20, zoom, {});
    setBandCam(c);
    MV.cam(c);
    MV.flat(mix([26, 22, 56], [12, 10, 30], k), 255);
    brush.polygon([[-1800, -1100], [1800, -1100], [1800, 1100], [-1800, 1100]]);
    const r = rnd(9100);
    push(); noStroke();
    for (let i = 0; i < 150; i++) {
      const x = (r() - 0.5) * 3600, y = (r() - 0.5) * 2200;
      fill(css([250, 246, 232], (0.2 + r() * 0.55) * (1 - k * 0.8)));
      circle(x, y, 2 + r() * 4);
    }
    pop();
    // faint circuit traces crawling in from the dark
    for (let i = 0; i < 10; i++) {
      const a = i * TAU / 10 + 0.3, R = 700 + (i % 3) * 220;
      MV.ink([120, 150, 210], 2.4, 'pen');
      brush.line(Math.cos(a) * R, -30 + Math.sin(a) * R * 0.7, Math.cos(a) * (R - 260), -30 + Math.sin(a) * (R - 260) * 0.7);
    }
    for (const g of GAL) {
      const pull = smoother(span(t, 64.58 + (g[4] % 9) * 0.03, 65.88));
      const x = lerp(g[0], 0, pull), y = lerp(g[1], -30, pull);
      const rr2 = g[2] * lerp(1, 0.09, pull);
      galaxy(x, y, rr2, g[3] + t * (0.5 + (g[3] % 1) * 0.4), g[4], lerp(0.8, 1, pull));
    }
    // the point they are all falling into
    const kk = smoother(span(t, 65.05, 65.92));
    if (kk > 0.01) {
      MV.glow(0, -30, 60 + 420 * kk, [255, 246, 218], 0.20 + 0.34 * kk, 7);
      poly(ell(0, -30, 22 + 110 * kk, 22 + 110 * kk, 9199, 16, 0.10), [255, 253, 244], 252);
      // light rays (alpha polygons: p5.brush ink multiplies, so it would darken over the glow)
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + t * 0.7;
        const r0 = 200 - 90 * kk, r1 = 900 - 380 * kk, wdt = 10 + 16 * kk;
        const ca = Math.cos(a), sa = Math.sin(a), px = -sa * wdt, py = ca * wdt;
        MV.flat([255, 250, 230], 90 + 90 * kk);
        brush.polygon([[ca * r0 - px, -30 + sa * r0 - py], [ca * r0 + px, -30 + sa * r0 + py],
                       [ca * r1 + px, -30 + sa * r1 + py], [ca * r1 - px, -30 + sa * r1 - py]]);
      }
    }
    // Clawd floating, arms wide
    const b = Math.sin(t * 1.6) * 12;
    MV.clawd({
      x: 0, y: 190 + b, h: 330, seed: 41, rot: -0.03 + 0.02 * Math.sin(t * 0.9),
      face: { eyes: k > 0.75 ? 'happy' : 'open', look: [0.05, -0.15], mouth: k > 0.75 ? 'oh' : 'smile', blush: true },
      arms: { l: -3.02, r: 0.12 }, legs: { l: 0.42, r: -0.42 }, extras: []
    });
    MV.glow(0, 150, 300, [200, 190, 255], 0.16 * k, 6);
    if (flash > 0.001) {
      MV.glow(0, -20, 90 + 1400 * flash, [255, 252, 244], 0.5, 8);
      MV.flat([255, 252, 240], 255 * clamp(flash));
      brush.polygon([[-2000, -1400], [2000, -1400], [2000, 1400], [-2000, 1400]]);
    }
    MV.camPop();
  }
  // ================================================================ segE · the planet-sized GPU (66.0–69.75)
  // a GPU the size of a world: galaxy-shaped fans spinning, an odometer rolling over until its
  // zeros pour out and bounce away through space. The meter dings at 61%.
  const GP = { x: 60, y: 40, w: 2120, h: 1290, rot: -0.05 };
  const FAN = [[-565, -50, 372, 9301], [540, -50, 372, 9302]];
  const ODO = { x: 300, y: 442, w: 960, h: 214 };
  const gpuPt = (lx, ly) => [GP.x + lx * Math.cos(GP.rot) - ly * Math.sin(GP.rot), GP.y + lx * Math.sin(GP.rot) + ly * Math.cos(GP.rot)];
  let odoWin = { cells: ['0', '0', '0', '0', '0', '0'] };

  function fanGalaxy(t, cx, cy, r, seed) {
    ring(cx, cy, r + 16, r + 16, [18, 19, 28], 8, seed, 30);
    poly(ell(cx, cy, r - 4, r - 4, seed + 1, 30, 0.015), [28, 30, 44], 255);
    const spin = t * 2.3 + seed * 0.7;
    for (let arm = 0; arm < 3; arm++) {
      const a0 = spin + arm * TAU / 3;
      const pts = [];
      for (let i = 0; i <= 9; i++) {
        const u = i / 9, a = a0 + u * 1.62, rad = r * (0.26 + u * 0.66);
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
      const back = pts.map((p) => [cx + (p[0] - cx) * 0.60, cy + (p[1] - cy) * 0.60]).reverse();
      const bl = pts.concat(back);
      poly(bl, [80, 86, 120], 234);
      inkPoly(bl, [38, 42, 64], 2.4);
    }
    // galaxy dust along the arms + a hot core
    const rr = rnd(seed);
    for (let i = 0; i < 16; i++) {
      const u = rr(), a = spin + rr() * 6.3, rad = r * (0.3 + u * 0.62);
      const sz = r * (0.05 + rr() * 0.05);
      poly(ell(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, sz, sz, seed + i, 10, 0.3), i % 3 ? [220, 216, 250] : [254, 238, 206], 170);
    }
    MV.glow(cx, cy, r * 0.72, [236, 232, 255], 0.30, 6);
    poly(ell(cx, cy, r * 0.16, r * 0.16, seed + 21, 14, 0.12), [255, 250, 236], 250);
    ring(cx, cy, r + 16, r + 16, [96, 100, 132], 3, seed + 22, 30);
  }

  function odoCells(t) {
    const cells = [];
    const roll = Math.floor(8.4 * t) % 1000;
    for (let i = 0; i < 3; i++) cells.push(String(Math.floor(roll / Math.pow(10, 2 - i)) % 10));
    for (let i = 3; i < 6; i++) {
      const outT = 69.00 + (i - 3) * 0.16;
      const ph = (((t - outT) % 0.44) + 0.44) % 0.44;
      cells.push(t > outT && ph < 0.21 ? '' : '0');
    }
    return cells;
  }

  function odoBall(i0, n, t) {
    const outT = 69.00 + (i0 - 3) * 0.16 + n * 0.44;
    if (t < outT || t > outT + 3.4) return null;
    const lx = ODO.x + (i0 - 2.5) * (ODO.w / 6), ly = ODO.y + ODO.h * 0.52;
    const bx = GP.x + lx * Math.cos(GP.rot) - ly * Math.sin(GP.rot);
    const by = GP.y + lx * Math.sin(GP.rot) + ly * Math.cos(GP.rot);
    const vx = ((n % 5) - 2) * 74 + 30, v0 = -230 - (n % 4) * 46;
    const g = 1750, floorY = 372 + (n % 4) * 46;
    // step through the bounces (deterministic, cheap)
    let rem = t - outT, yy = by, vyy = v0, vx2 = vx, xx = bx;
    for (let s = 0; s < 3; s++) {
      const tHit = (vyy + Math.sqrt(Math.max(0, vyy * vyy + 2 * g * (floorY - yy)))) / g;
      if (tHit > rem || vyy + g * tHit < 0) break;
      xx += vx2 * tHit; yy = floorY; rem -= tHit;
      vyy = -(vyy + g * tHit) * 0.58; vx2 *= 0.92;
    }
    xx += vx2 * rem; yy += vyy * rem + 0.5 * g * rem * rem;
    return { x: xx, y: Math.min(yy, 1500), r: 34 + (n % 3) * 5, n, spin: vx2 * 0.02 };
  }

  function gpuPlanet(t, o = {}) {
    push();
    translate(GP.x, GP.y); rotate(GP.rot);
    const w = GP.w, h = GP.h;
    const body = rr(0, 0, w, h, 96, 9101, 4);
    // a soft halo so it reads as floating in space
    MV.bloom([120, 130, 210], 40);
    brush.polygon(rr(0, 0, w + 40, h + 40, 110, 9100, 3));
    poly(body, [46, 48, 66], 253); inkPoly(body, [16, 17, 26], 6);
    // top bevel + a lighter panel face
    poly([[-w / 2 + 74, -h / 2 + 34], [w / 2 - 74, -h / 2 + 34], [w / 2 - 118, -h / 2 + 104], [-w / 2 + 118, -h / 2 + 104]], [72, 76, 100], 225);
    poly(rr(0, -h * 0.10, w - 150, h * 0.62, 70, 9102, 3), [38, 40, 56], 250);
    // the two galaxy fans
    for (const f of FAN) fanGalaxy(t, f[0], f[1], f[2], f[3]);
    // the odometer window
    const cells = odoCells(t);
    poly(rr(ODO.x, ODO.y, ODO.w, ODO.h, 26, 9110, 2), [16, 18, 26], 253);
    inkPoly(rr(ODO.x, ODO.y, ODO.w, ODO.h, 26, 9110, 2), [6, 7, 12], 5);
    odoWin = { cells };
    // the logo strip and the gold edge fingers
    poly(rr(0, h * 0.36, w - 190, 96, 20, 9113, 2), [58, 60, 82], 240);
    // circuit traces across the empty shroud
    const rt = rnd(9115);
    for (let i = 0; i < 9; i++) {
      const x0 = -w * 0.44 + rt() * w * 0.88, y0 = -h * 0.40 + rt() * h * 0.16;
      MV.ink([72, 78, 108], 2.6, 'pen');
      brush.line(x0, y0, x0 + 120 + rt() * 160, y0);
      brush.line(x0 + 120 + rt() * 160, y0, x0 + 160 + rt() * 160, y0 + 60 + rt() * 60);
      ring(x0, y0, 5, 5, [96, 104, 138], 2.4, 9160 + i, 8);
    }
    // a row of heatsink fins along the top
    for (let i = 0; i < 22; i++) {
      const x0 = -w / 2 + 190 + i * ((w - 380) / 22);
      line2(x0, -h / 2 + 150, x0, -h * 0.16, [60, 62, 84], 4);
    }
    for (let i = 0; i < 26; i++) {
      const x0 = -w / 2 + 150 + i * ((w - 300) / 26);
      poly(rr(x0, h / 2 - 66, (w - 300) / 26 - 14, 52, 6, 9114 + i, 1.2), [216, 178, 88], 250);
      line2(x0 + 4, h / 2 - 44, x0 + (w - 300) / 26 - 18, h / 2 - 44, [160, 126, 56], 2);
    }
    pop();
  }

  function odoDigits(t, cam) {
    const cells = odoWin.cells;
    const cw = ODO.w / 6;
    for (let i = 0; i < 6; i++) {
      const p = gpuPt(ODO.x + (i - 2.5) * cw, ODO.y - 4);
      MV.propText(cells[i], p[0], p[1], { cam, font: '900 132px Georgia, "Times New Roman", serif', color: cells[i] === '' ? '#3a3f52' : (i < 3 ? '#8ce0ff' : '#f0e2b0'), outline: false, alpha: 1 });
    }
    const lp = gpuPt(ODO.x, ODO.y - ODO.h * 0.72 - 46);
    MV.propText('ODOMETER', lp[0], lp[1], { cam, font: '700 46px Georgia, "Times New Roman", serif', color: '#c8c2a6', outlineColor: 'rgba(8,10,18,0.9)', lineW: 5, alpha: 0.9 });
  }

  function segE(t) {
    MV.__stage = 'E';
    const rev = smoother(span(t, 66.0, 66.9));            // pull back off the fan
    const zoomIn = smoother(span(t, 68.6, 69.35));        // push in on the odometer
    const out = smoother(span(t, 69.55, 69.98));          // the fall back toward Earth
    const z0 = lerp(1.42, 0.86, rev);
    const f0 = mix([FAN[1][0], FAN[1][1] + 60], [60, 60], rev);
    const z1 = lerp(z0, 1.04, zoomIn);
    const f1 = mix(f0, [ODO.x + 40, ODO.y - 60], zoomIn);
    const zoom = lerp(z1, 0.46, out);
    const fx = lerp(f1[0], 60, out), fy = lerp(f1[1], 60, out);
    const c = camAt(fx, fy, zoom, {});
    setBandCam(c);
    MV.cam(c);
    // deep space background
    MV.flat(mix([30, 26, 58], [14, 14, 34], rev), 255);
    brush.polygon([[-2200, -1600], [2200, -1600], [2200, 1600], [-2200, 1600]]);
    const r = rnd(9400);
    push(); noStroke();
    for (let i = 0; i < 170; i++) {
      const x = (r() - 0.5) * 5200, y = (r() - 0.5) * 3400;
      fill(css([248, 246, 236], 0.2 + r() * 0.6));
      circle(x, y, 2 + r() * 4);
    }
    pop();
    // a violet nebula
    MV.bloom([150, 120, 210], 90); brush.polygon(ell(-1450, -760, 620, 380, 9401, 26, 0.12));
    MV.bloom([110, 90, 180], 70); brush.polygon(ell(1550, 620, 700, 420, 9402, 26, 0.12));
    // the Earth and the moon for scale
    if (onCanvas(1560, -880, 200)) {
      MV.glow(1560, -880, 320, [140, 200, 255], 0.26, 6);
      poly(ell(1560, -880, 186, 182, 4310, 30, 0.03), [86, 148, 196], 252);
      ring(1560, -880, 186, 182, [60, 106, 150], 4, 4311, 30);
      poly(ell(1532, -908, 78, 56, 4312, 18, 0.12), [104, 176, 118], 240);
      poly(ell(1596, -838, 62, 48, 4313, 18, 0.12), [116, 182, 128], 230);
    }
    if (onCanvas(-1660, 700, 130)) {
      poly(ell(-1660, 700, 96, 94, 4320, 26, 0.04), [226, 224, 214], 252);
      ring(-1660, 700, 96, 94, [150, 146, 138], 3.4, 4321, 26);
      MV.ink([196, 200, 210], 4, 'pen'); brush.line(-1620, 640, -1620, 596);
      poly([[-1620, 600], [-1570, 612], [-1620, 628]], [92, 196, 108], 250);
    }
    gpuPlanet(t, {});
    odoDigits(t, c);
    // the gumballs pouring out of the zeros
    for (let i = 3; i < 6; i++) {
      for (let n = 0; n < 9; n++) {
        const b = odoBall(i, n, t);
        if (!b) continue;
        const cols = [[244, 96, 104], [252, 196, 84], [120, 208, 236], [168, 140, 236], [244, 140, 176]];
        const col = cols[(i * 3 + n) % cols.length];
        if (!onCanvas(b.x, b.y, b.r + 10)) continue;
        poly(ell(b.x, b.y, b.r, b.r, 9500 + i * 20 + n, 18, 0.05), col, 250);
        ring(b.x, b.y, b.r * 0.44, b.r * 0.52, [255, 252, 246], 5, 9520 + i * 20 + n, 14);
        line2(b.x - b.r * 0.2, b.y - b.r * 0.34, b.x + b.r * 0.2, b.y - b.r * 0.34, [255, 255, 255], 4);
      }
    }
    // the meter dings at 61%
    const ding = smoother(span(t, 69.30, 69.46));
    if (ding > 0.01) {
      const pop2 = 1 + 0.18 * Math.sin(Math.min(1, (t - 69.30) / 0.18) * Math.PI) * (1 - smoother(span(t, 69.4, 69.6)));
      S.meter(1180, 700, 0.62 * pop2, 61, { cam: c });
      MV.propText('DING!', 1470, 250, { cam: c, font: '900 92px Georgia, "Times New Roman", serif', color: '#fff0c6', outlineColor: 'rgba(70,20,46,0.9)', lineW: 12, alpha: ding * (1 - smoother(span(t, 69.5, 69.72))) });
      for (let i = 0; i < 4; i++) {
        const a = -0.6 - i * 0.5, dd = smoother(span(t, 69.3 + i * 0.03, 69.55 + i * 0.04));
        if (dd <= 0.01) continue;
        MV.drawEmote({ kind: 'sparkle', x: 1180 + Math.cos(a) * 300 * (0.5 + dd), y: 700 - 260 - Math.sin(a) * 220 * (0.5 + dd) - 300 * dd, s: 34 * (1 - dd * 0.5), alpha: 0.9 * (1 - dd) });
      }
    }
    // the fall back toward Earth: a soft haze out of frame
    if (out > 0.001) {
      MV.flat([150, 190, 232], 120 * out);
      brush.polygon([[-2400, -1700], [2400, -1700], [2400, 1700], [-2400, 1700]]);
    }
    MV.camPop();
  }
  // ================================================================ segF · the vault (69.75–72.9)
  // hard-hat Clawds roll a round door shut and spin its wheel — then the camera swings around
  // and the vault turns out to be a flat facade with no back wall, and the monster waves.
  const VA = { x: -300, y: -70, w: 1900, h: 900, r: 300, cy: 12 };
  const MON = { x: 1020, h: 440 };
  const GROUND = 392;

  function hatClawd(t, x, y, h, rot, seed, o = {}) {
    push(); translate(x, y); rotate(rot);
    MV.clawd({ x: 0, y: 0, h, seed, sx: o.sx, sy: o.sy, face: o.face, arms: o.arms, legs: o.legs, extras: [] });
    const hw = h * 0.8, hy = -h * 0.5;
    const dome = [[-hw * 0.70, hy + 2]];
    for (let i = 0; i <= 12; i++) { const a = Math.PI + Math.PI * (i / 12); dome.push([Math.cos(a) * hw * 0.70, hy + 4 + Math.sin(a) * h * 0.25]); }
    dome.push([hw * 0.70, hy + 2]);
    poly(dome, [248, 196, 60], 252); inkPoly(dome, [138, 96, 22], 3.2);
    poly(rr(0, hy + 6, hw * 1.92, h * 0.056, h * 0.018, seed + 5, 1), [234, 178, 46], 250);
    pop();
  }

  function monArm(ax, ay, ang, len, thick) {
    const ex = ax + Math.cos(ang) * len, ey = ay + Math.sin(ang) * len;
    const mx = (ax + ex) / 2, my = (ay + ey) / 2, a2 = Math.atan2(ey - ay, ex - ax);
    push(); translate(mx, my); rotate(a2);
    poly(rr(0, 0, len, thick, thick * 0.5, 8801, 1.5), [52, 72, 62], 250);
    inkPoly(rr(0, 0, len, thick, thick * 0.5, 8801, 1.5), [14, 24, 20], 3.4);
    pop();
    poly(ell(ex, ey, thick * 0.72, thick * 0.68, 8802, 14, 0.12), [58, 82, 70], 250);
    ring(ex, ey, thick * 0.72, thick * 0.68, [14, 24, 20], 3.4, 8803, 14);
  }

  function monster(t, o = {}) {
    const x = o.x, h = o.h, wave = o.wave ?? 0, seed = o.seed || 8800;
    const baseY = o.baseY ?? GROUND;
    const cy = baseY - h * 0.46, rx = h * 0.56, ry = h * 0.50;
    MV.glow(x, cy, rx * 1.5, [120, 230, 140], 0.22 + 0.10 * Math.sin(t * 2.1), 6);
    const wv = Math.sin(t * 3.4) * 0.5 * wave;
    monArm(x - rx * 0.72, cy + ry * 0.12, -2.5 - 0.55 * wave + wv, h * 0.42, h * 0.15);
    monArm(x + rx * 0.72, cy + ry * 0.12, -0.62 + 0.55 * wave - wv, h * 0.42, h * 0.15);
    const body = ell(x, cy, rx, ry, seed, 30, 0.10);
    poly(body, [44, 62, 54], 250); inkPoly(body, [12, 20, 18], 4.5);
    ring(x, cy, rx, ry, [16, 26, 22], 0, seed, 4);
    poly(ell(x - rx * 0.22, cy - ry * 0.42, rx * 0.5, ry * 0.28, seed + 7, 18, 0.16), [92, 126, 100], 150);
    poly(ell(x, cy + ry * 0.34, rx * 0.62, ry * 0.42, seed + 3, 22, 0.14), [66, 94, 76], 220);
    for (const sd of [-1, 1]) {
      const ex = x + sd * rx * 0.40, ey = cy - ry * 0.24;
      MV.glow(ex, ey, h * 0.16, [255, 226, 120], 0.45, 6);
      poly(ell(ex, ey, h * 0.108, h * 0.092, seed + 5 + sd, 14, 0.10), [252, 226, 130], 252);
      line2(ex, ey - h * 0.085, ex, ey + h * 0.085, [40, 30, 16], Math.max(2, h * 0.022));
    }
    const mw = rx * 0.66, my = cy + ry * 0.30;
    const jaw = [[x - mw, my - h * 0.035]];
    for (let i = 0; i <= 6; i++) jaw.push([x - mw + (2 * mw) * (i / 6), my + (i % 2 ? h * 0.075 : h * 0.012)]);
    jaw.push([x + mw, my - h * 0.035]);
    poly(jaw, [126, 34, 44], 252); inkPoly(jaw, [40, 10, 14], 3.4);
    // a row of teeth
    for (let i = 0; i < 5; i++) {
      const tx = x - mw + (2 * mw) * ((i + 0.5) / 5);
      poly([[tx - h * 0.026, my - h * 0.030], [tx + h * 0.026, my - h * 0.030], [tx, my + h * 0.048]], [250, 246, 232], 252);
    }
    // tongue
    poly(ell(x, my + h * 0.052, mw * 0.42, h * 0.026, seed + 11, 16, 0.16), [206, 92, 104], 240);
  }

  function vaultPanel(t, close, spin) {
    const side = [[VA.x + VA.w / 2, VA.y - VA.h / 2], [VA.x + VA.w / 2 + 118, VA.y - VA.h / 2 + 40],
                  [VA.x + VA.w / 2 + 118, VA.y + VA.h / 2], [VA.x + VA.w / 2, VA.y + VA.h / 2]];
    poly(side, [148, 142, 128], 250); inkPoly(side, [86, 82, 74], 4);
    // two support struts propping the panel up from behind
    for (const sx of [-560, 420]) {
      MV.ink([128, 116, 96], 20, 'pen');
      brush.line(VA.x + sx, VA.y + VA.h / 2 - 120, VA.x + sx + 250, VA.y + VA.h / 2 + 80);
    }
    const p = rr(VA.x, VA.y, VA.w, VA.h, 16, 8701, 3);
    poly(p, [206, 202, 190], 253); inkPoly(p, [104, 100, 92], 5);
    const r = rnd(8703);
    for (let i = 0; i < 9; i++) {
      const x = VA.x - VA.w / 2 + r() * VA.w, y = VA.y - VA.h / 2 + r() * VA.h;
      poly(ell(x, y, 60 + r() * 130, 44 + r() * 90, 8710 + i, 18, 0.16), [178, 174, 162], 120);
    }
    for (let i = 0; i < 5; i++) line2(VA.x - VA.w / 2, VA.y - VA.h / 2 + 90 + i * (VA.h - 180) / 4, VA.x + VA.w / 2, VA.y - VA.h / 2 + 90 + i * (VA.h - 180) / 4, [176, 172, 160], 2.4);
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
      const x = VA.x + s * (VA.w / 2 - 54), y = VA.y - VA.h / 2 + 60 + i * (VA.h - 120) / 7;
      ring(x, y, 9, 9, [130, 126, 116], 3, 8720 + i * 2 + (s > 0 ? 1 : 0), 10);
    }
    poly(ell(VA.x, VA.cy, VA.r, VA.r, 8740, 30, 0.02), [22, 20, 20], 253);
    ring(VA.x, VA.cy, VA.r + 14, VA.r + 14, [140, 138, 130], 8, 8741, 30);
    const dx = VA.x + 640 * (1 - close);
    // the steel rail the round door rides on, inside the facade
    for (const sy of [-1, 1]) line2(VA.x - VA.w / 2 + 50, VA.cy + sy * (VA.r + 30), VA.x + VA.w / 2 - 40, VA.cy + sy * (VA.r + 30), [126, 122, 112], 9);
    const d = ell(dx, VA.cy, VA.r + 16, VA.r + 16, 8750, 34, 0.012);
    poly(d, [162, 166, 172], 254); inkPoly(d, [74, 76, 82], 5);
    ring(dx, VA.cy, VA.r * 0.62, VA.r * 0.62, [186, 190, 196], 4, 8751, 26);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      ring(dx + Math.cos(a) * (VA.r - 6), VA.cy + Math.sin(a) * (VA.r - 6), 12, 12, [106, 108, 114], 3.4, 8760 + i, 10);
    }
    push(); translate(dx, VA.cy); rotate(spin);
    ring(0, 0, VA.r * 0.46, VA.r * 0.46, [124, 128, 134], 16, 8780, 28);
    for (let i = 0; i < 4; i++) { push(); rotate(i * Math.PI / 2); MV.ink([110, 114, 120], 15, 'pen'); brush.line(0, 0, VA.r * 0.46, 0); pop(); }
    ring(0, 0, VA.r * 0.17, VA.r * 0.17, [150, 154, 160], 8, 8781, 18);
    pop();
    if (close > 0.92) {
      const latch = smoother(span(t, 70.86, 71.14));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + 0.4;
        const x0 = dx + Math.cos(a) * (VA.r + 14), y0 = VA.cy + Math.sin(a) * (VA.r + 14);
        poly(rr(x0 + Math.cos(a) * 26 * latch, y0 + Math.sin(a) * 26 * latch, 46, 22, 6, 8790 + i, 1.2), [138, 140, 146], 250);
      }
    }
  }

  function segF(t) {
    MV.__stage = 'F';
    const land = smoother(span(t, 70.00, 70.42));
    const close = smoother(span(t, 70.34, 70.92));
    const spin = 2.4 * smoother(span(t, 70.90, 71.20));
    const orbit = smoother(span(t, 71.44, 72.50));
    const wipe = smoother(span(t, 72.60, 72.90));
    const fx = lerp(VA.x, 430, orbit);
    const fy = lerp(-900, 10, land) + lerp(0, -20, orbit);
    const zoom = lerp(0.62, 0.90, land) * lerp(1, 0.90, orbit);
    const c = camAt(fx, fy, zoom, {});
    setBandCam(c);
    MV.cam(c);
    for (let i = 0; i < 14; i++) {
      const ya = lerp(-1600, 1400, i / 14), yb = lerp(-1600, 1400, (i + 1) / 14);
      const u = clamp(i / 13);
      MV.flat(mix([236, 216, 170], [140, 196, 236], Math.pow(u, 0.7)), 255);
      brush.polygon([[-2600, ya], [2600, ya], [2600, yb], [-2600, yb]]);
    }
    for (let i = 0; i < 5; i++) S.cloud(-1500 + i * 760, -880 + (i % 2) * 190, 620 + (i % 3) * 160, 150, 7900 + i, [250, 250, 246], 200);
    for (let i = 0; i < 5; i++) {
      const x = -2200 + i * 1100;
      poly(ell(x, 210, 700 + (i % 3) * 180, 300 + (i % 2) * 120, 7910 + i, 24, 0.10), i % 2 ? [122, 150, 96] : [142, 166, 104], 250);
    }
    MV.flat([126, 152, 84], 255); brush.polygon([[-3000, 240], [3000, 240], [3000, 1600], [-3000, 1600]]);
    for (let i = 0; i < 22; i++) {
      const x = -2400 + i * 230;
      MV.ink([104, 130, 70], 4, 'pen'); brush.line(x, 260, x + 150, 1500);
    }
    const r = rnd(7960);
    for (let i = 0; i < 40; i++) {
      const x = (r() - 0.5) * 5200, y = 300 + r() * 1100;
      MV.ink([150, 176, 106], 3, 'pen'); brush.line(x, y, x + 16, y - 34);
    }
    vaultPanel(t, close, spin);
    monster(t, { x: MON.x, h: MON.h, baseY: GROUND, wave: smoother(span(t, 71.5, 71.9)), seed: 8800 });
    const dxx = VA.x + 640 * (1 - close);
    for (let i = 0; i < 3; i++) {
      const push2 = close < 0.98 && t < 71.0;
      const lean = push2 ? 0.30 : lerp(0.30, 0, smoother(span(t, 71.0, 71.3)));
      const step = smoother(span(t, 71.0, 71.35));
      const hi5 = i < 2 && t > 71.16 && t < 71.54;
      const gather = hi5 ? 110 : 0;
      const bx = dxx - 390 + (i - 1) * 300 + 60 * step + (i === 0 ? gather : i === 1 ? -gather : 0);
      const by = feetY(GROUND - 4 + (i % 2) * 12, 216 - (i === 1 ? 10 : 0));
      const look = orbit > 0.4 ? [1, -0.1] : [-0.35, 0.1];
      const hh = 216 - (i === 1 ? 10 : 0);
      const arm = hi5
        ? (i === 0 ? { l: -2.6, r: -1.05 } : { l: -2.35, r: 0.9 })
        : { l: 2.9 - 0.15 * (1 - lean), r: 0.5 };
      hatClawd(t, bx, by, hh, lean - 0.06 * hi5, 60 + i, {
        face: { eyes: hi5 ? 'happy' : (orbit > 0.55 && i === 2 ? 'oh' : 'open'), look, mouth: hi5 ? 'smile' : (push2 ? 'oh' : 'smile'), blush: true },
        arms: arm,
        legs: { l: 0.30 + 0.18 * (i % 2), r: -0.22 }
      });
      if (push2) for (let k = 0; k < 2; k++) {
        const u = Math.abs(Math.sin(t * 5.2 + i * 2 + k * 3));
        MV.ink([70, 62, 52], 3, 'pen');
        brush.line(bx + 100 + k * 26, by - 120 - k * 30, bx + 190 + u * 40 + k * 26, by - 150 - k * 30);
      }
    }
    if (orbit > 0.45) {
      const k = (orbit - 0.45) / 0.55;
      MV.drawEmote({ kind: 'exclaim', x: dxx - 330, y: -90, s: 52 * k, alpha: k });
      MV.drawEmote({ kind: 'sweat', x: dxx - 40, y: -140, s: 46 * k, alpha: 0.9 * k });
    }
    if (orbit > 0.5) {
      const k2 = (orbit - 0.5) / 0.5;
      MV.drawEmote({ kind: 'sparkle', x: MON.x + 250, y: GROUND - MON.h * 0.95, s: 44 * k2, alpha: 0.85 * k2 });
      MV.propText('hi!', MON.x + 340, GROUND - MON.h * 1.08, { cam: c, font: '900 76px Georgia, "Times New Roman", serif', color: '#eaf6d8', outlineColor: 'rgba(20,40,24,0.9)', lineW: 10, alpha: k2 });
    }
    MV.propText('VAULT 0', VA.x - VA.w / 2 + 260, VA.y - VA.h / 2 + 96, { cam: c, font: '900 66px Georgia, "Times New Roman", serif', color: '#4a463c', outline: false, alpha: 0.9 });
    MV.camPop();
    if (wipe > 0) MV.wipeBand(wipe, [24, 22, 30], 31, 'in', 170);
  }

  function placeholder(t, col, label) {
    MV.flat(col, 255); brush.polygon([[-1400, -900], [1400, -900], [1400, 900], [-1400, 900]]);
    MV.propText(label, 0, 0, { cam: { x: 0, y: 0, zoom: 1 }, font: '900 72px Georgia, serif', color: '#f4eee0' });
  }

  // ================================================================ dispatch
  function draw(t) {
    if (t < 60.5) segA(t);
    else if (t < 62.93) segB(t);
    else if (t < 64.5) segC(t);
    else if (t < 66.0) segD(t);
    else if (t < 70.0) segE(t);
    else segF(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.bigger = { a: 59.0, b: 73.0, draw };
})();
