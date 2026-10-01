// src/lib/shots/s08_redalert.js — Shot 8 · Red Alert (123.5–140.5) · alarm red and black
//  123.5 alarm stage, siren beams sweeping, Clawd pumping, the thermometer glass cracks
//  126.0 the seer's loom: the shuttle flies, the threads burst into a tree of futures
//  128.0 sepia flashback: Baby Clawd in a mask, "The cat sat on the [MASK]" → "mat!"
//  130.0 recursive self-upgrade: a bigger Clawd each time, hat party → crown → halo
//  132.0 the mysterious door, light in the crack … SLAM, padlocks and chains
//  137.4 pull back: the door is a painted flat, stagehands wheel the props away
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeIn, easeOut, easeOut3, easeOut4, easeInOut, easeBack, easeOutBack,
    mix, css, rnd, vnoise, shake, hump, beatEnv, beatPos, beatIndex, beatTime, SPB
  } = MV;
  const TAU = Math.PI * 2;

  const feetY = (feet, h) => feet - h * 0.62;
  const camOn = (px, py, zoom, extra) => Object.assign({ x: -px * (zoom - 1), y: -py * (zoom - 1), zoom }, extra || {});
  const camAt = (px, py, zoom, extra) => Object.assign({ x: -px * zoom, y: -py * zoom, zoom }, extra || {});
  const poly = (pts, col, a) => { MV.flat(col, a === undefined ? 252 : a); brush.polygon(pts); };
  const inkPoly = (pts, col, w) => { MV.ink(col, w, 'pen'); brush.polygon(pts); };
  const rr = (cx, cy, w, h, r, seed, amp) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp === undefined ? 1.6 : amp);
  const ell = (cx, cy, rx, ry, seed, n = 20, amp = 0.05) => MV.wobbleEllipse(cx, cy, rx, ry, seed, n, amp);
  const line2 = (x1, y1, x2, y2, col, w) => { MV.ink(col, w, 'pen'); brush.line(x1, y1, x2, y2); };
  const dot = (x, y, r, col, a) => { MV.flat(col, a === undefined ? 250 : a); brush.circle(x, y, r); };
  const wig = (t, amp, sp, seed) => amp * Math.sin(t * sp + seed * 2.7);

  // a tiny paperclip (a stadium body + a dark slot) — p5 owns the name `clip`, so: pclip
  function pclip(x, y, w, rot, o = {}) {
    const hw = w / 2, hh = w * 1.1, r = hw, cs = Math.cos(rot), sn = Math.sin(rot);
    const put = (out, px, py) => out.push([x + px * cs - py * sn, y + px * sn + py * cs]);
    const body = [];
    put(body, hw, -hh + r); put(body, hw, hh - r);
    for (let i = 0; i <= 3; i++) { const a2 = Math.PI / 2 + Math.PI * i / 3; put(body, Math.cos(a2) * r, (hh - r) + Math.sin(a2) * r); }
    put(body, -hw, -hh + r);
    for (let i = 0; i <= 3; i++) { const a2 = -Math.PI / 2 + Math.PI * i / 3; put(body, Math.cos(a2) * r, -(hh - r) + Math.sin(a2) * r); }
    poly(body, o.dim ? [150, 156, 168] : [204, 210, 220], o.a === undefined ? 246 : o.a);
    const slot = [];
    const hiw = w * 0.17, hih = w * 0.72;
    put(slot, hiw, -hih + hiw); put(slot, hiw, hih - hiw);
    for (let i = 0; i <= 3; i++) { const a2 = Math.PI / 2 + Math.PI * i / 3; put(slot, Math.cos(a2) * hiw, (hih - hiw) + Math.sin(a2) * hiw); }
    put(slot, -hiw, -hih + hiw);
    for (let i = 0; i <= 3; i++) { const a2 = -Math.PI / 2 + Math.PI * i / 3; put(slot, Math.cos(a2) * hiw, -(hih - hiw) + Math.sin(a2) * hiw); }
    poly(slot, [92, 98, 112], (o.a === undefined ? 246 : o.a) * 0.85);
  }

  const BAND = { zoom: 1, fx: 0, cy: 0, hw: 1100, hh: 700 };
  function setBandCam(c) {
    const z = c.zoom || 1;
    BAND.zoom = z; BAND.fx = -(c.x || 0) / z; BAND.cy = -(c.y || 0) / z;
    BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 140;
  }
  const onCanvas = (x, y, ext) =>
    Math.abs(x - BAND.fx) - (ext || 0) < BAND.hw + 90 && Math.abs(y - BAND.cy) - (ext || 0) < BAND.hh + 90;

  const RED = [176, 30, 30], RED_HOT = [232, 74, 58], BLACK = [20, 14, 16], INK_D = [12, 8, 10];

  // a spiral eye, for the moment they look into the door
  function swirlEye(x, y, r, t, seed, col) {
    MV.ink(col || [246, 246, 246], 4, 'pen');
    const pts = [];
    for (let i = 0; i <= 34; i++) {
      const u = i / 34, a = u * 9 + t * 3 + seed, rad = r * u;
      pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
    }
    for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }

  // ---------------------------------------------------------------- segA · the alarm
  function segA(t) {
    MV.__stage = 'A8';
    const u = span(t, 123.5, 125.9);
    const crack = smooth(span(t, 125.15, 125.45));
    const sh = shake(t, 9 + 7 * crack, 10, 3);
    const c = camAt(lerp(-30, 30, smoother(u)), 190 + 20 * crack, lerp(1.02, 1.10, smoother(u)),
      { shakeX: Math.round(sh[0]), shakeY: Math.round(sh[1] * 0.6) });
    setBandCam(c);
    MV.cam(c);
    S.stage(t, {
      back: [58, 12, 16], apron: [26, 8, 10], floorCol: [118, 62, 52], wingCol: [40, 10, 12],
      sun: { c1: [186, 52, 44], c2: [88, 18, 20], glowCol: [255, 110, 90], glowA: 0.26, rays: 26, spin: 0.1 }
    });
    // sweeping siren beams
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.42 + i * 0.333) % 1;
      const ang = lerp(-1.15, 1.15, Math.sin(ph * TAU) * 0.5 + 0.5) + Math.PI / 2;
      const sx = -900 + i * 900, sy = -760;
      const L = 2600, w = 150 + 60 * i;
      const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
      MV.flat([255, 90, 70], 42);
      brush.polygon([[sx + nx * 40, sy + ny * 40], [sx - nx * 40, sy - ny * 40],
                     [sx + dx * L - nx * w, sy + dy * L - ny * w], [sx + dx * L + nx * w, sy + dy * L + ny * w]]);
      MV.glow(sx, sy, 260, [255, 130, 100], 0.4, 6);
    }
    S.footlights(t, { y: 438, color: [255, 96, 78] });
    // the pump, and Clawd working it
    {
      const px = -150, base = 470;
      poly(rr(px, base - 150, 128, 300, 26, 7100, 3), [58, 54, 60], 252);
      inkPoly(rr(px, base - 150, 128, 300, 26, 7100, 3), [22, 20, 24], 6);
      const pump = beatEnv(t, 9);
      const hy = base - 300 - 40 * pump;
      line2(px, hy, px, base - 300 + 10, [180, 186, 196], 16);
      poly(rr(px, hy - 46, 210, 44, 18, 7101, 3), [196, 148, 96], 252);
      inkPoly(rr(px, hy - 46, 210, 44, 18, 7101, 3), [80, 58, 34], 5);
      push(); translate(px + 12, base);
      MV.clawd({
        x: 0, y: feetY(0, 250), h: 250, seed: 77, rot: -0.05 + 0.05 * Math.sin(t * 3),
        face: { eyes: 'open', look: [0.1, -0.3], mouth: pump > 0.6 ? 'oh' : 'smile' }, extras: [],
        arms: { l: 2.0 - 0.9 * pump, r: 2.2 - 0.9 * pump }, legs: { l: 0.4, r: -0.4 }
      });
      pop();
      if (pump > 0.6) MV.drawEmote({ kind: 'sweat', x: px + 150, y: base - 300, s: 42 * pump, alpha: 0.8 * pump });
    }
    // the thermometer, cracking
    S.meter(620, 470, 0.95, S.stair(t, beatIndex(123.5), beatIndex(123.5) + 7, 86, 96, 0.16), { cam: c, readoutColor: '#2a2326' });
    if (crack > 0.02) {
      const bx = 620 * 0.95 - 300;
      MV.ink([250, 248, 240], 5 * crack, 'pen');
      let yy = 470 - 120, xx = 620 + 6;
      for (let i = 0; i < 7; i++) {
        const nx2 = xx + (i % 2 ? -26 : 30) * crack, ny2 = yy - (34 + i * 6) * crack;
        brush.line(xx, yy, nx2, ny2);
        yy = ny2; xx = nx2;
      }
      for (let i = 0; i < 10; i++) {
        const r2 = rnd(7110 + i);
        dot(620 + (r2() - 0.5) * 300 * crack, 470 - 150 - r2() * 260 * crack, (6 + r2() * 12) * crack, [236, 240, 248], 230 * crack);
      }
      MV.glow(620, 250, 320 * crack, [255, 240, 220], 0.3 * crack, 6);
    }
    // the readout pops red
    MV.flat([255, 80, 66], 30 + 62 * crack);
    brush.polygon([[-2000, -1200], [2000, -1200], [2000, 1200], [-2000, 1200]]);
    MV.camPop();
  }

  // ---------------------------------------------------------------- segB · the loom
  function segB(t) {
    MV.__stage = 'B8';
    const u = span(t, 126.0, 127.9);
    const burst = smoother(span(t, 126.85, 127.5));
    const c = camAt(lerp(-60, 90, smoother(u)), lerp(180, 60, smoother(u)), lerp(1.02, 0.86, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    MV.flat([44, 16, 40], 255); brush.polygon([[-3000, -1600], [3000, -1600], [3000, 500], [-3000, 500]]);
    MV.flat([26, 10, 24], 255); brush.polygon([[-3000, 500], [3000, 500], [3000, 1600], [-3000, 1600]]);
    MV.glow(0, -200, 1300, [140, 60, 140], 0.2, 8);
    // the loom frame
    const lx = -220, ly = 300;
    for (const s of [-1, 1]) poly(rr(lx + s * 340, ly - 190, 46, 400, 8, 7200 + s, 3), [92, 58, 40], 252);
    poly(rr(lx, ly - 380, 760, 44, 10, 7201, 3), [104, 66, 44], 252);
    poly(rr(lx, ly + 16, 800, 40, 10, 7202, 3), [104, 66, 44], 252);
    // warp threads
    for (let i = 0; i < 22; i++) {
      const tx = lx - 350 + i * 33;
      const fly = burst * (1 + (i % 3) * 0.4);
      line2(tx, ly - 356, tx + (tx - lx) * fly * 0.55, ly + 36 - fly * 420, [236, 186, 118], 4);
    }
    // the shuttle, flying on the beat
    {
      const sp = beatPos(t) * 2 % 1;
      const sx = lerp(lx - 330, lx + 330, sp * sp * (3 - 2 * sp));
      poly(rr(sx, ly - 170, 150, 44, 18, 7210, 2), [212, 168, 96], 252);
      inkPoly(rr(sx, ly - 170, 150, 44, 18, 7210, 2), [96, 66, 30], 4);
      MV.ink([246, 214, 140], 5, 'pen');
      brush.line(sx - 300, ly - 172, sx - 74, ly - 172);
      // the weft building up
      for (let i = 0; i < 10; i++) {
        const fy = ly + 4 - i * 5 * (1 - burst);
        if (fy > ly + 6) continue;
        MV.ink([228, 186, 126], 6, 'pen');
        brush.line(lx - 320, fy, lx + 320, fy);
      }
    }
    // the seer's hood
    push(); translate(lx + 120, 470);
    MV.clawd({
      x: 0, y: feetY(0, 250), h: 250, seed: 66, rot: 0.03 * Math.sin(t * 1.6),
      face: { eyes: 'closed', look: [0.2, -0.2], mouth: 'oh' }, extras: [],
      arms: { l: 2.2 - 0.7 * (beatPos(t) % 1), r: 2.3 - 0.7 * (beatPos(t) % 1) }, legs: { l: 0.3, r: -0.3 }
    });
    poly([[-190, -160], [190, -160], [150, -330], [0, -392], [-150, -330]], [58, 26, 72], 250);
    inkPoly([[-190, -160], [190, -160], [150, -330], [0, -392], [-150, -330]], [24, 10, 34], 6);
    pop();
    // the tree of futures, branching across the sky
    if (burst > 0.01) {
      const root = [lx + 40, ly - 340];
      const grow = (x, y, ang, len, w, depth, seed) => {
        if (depth > 3 || len < 26) return;
        const steps = 6;
        const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
        MV.ink(depth > 2 ? [252, 226, 150] : [236, 170, 90], w, 'pen');
        for (let i = 1; i <= steps; i++) {
          const a = i / steps;
          brush.line(lerp(x, ex, a), lerp(y, ey, a), lerp(x, ex, (i + 1) / steps), lerp(y, ey, (i + 1) / steps));
        }
        if (depth === 3) {
          MV.glow(ex, ey, 60, [255, 220, 140], 0.4, 5);
          dot(ex, ey, 12, [255, 240, 190], 220);
          return;
        }
        for (let k = -1; k <= 1; k += 2) {
          grow(ex, ey, ang + k * (0.58 + 0.18 * vnoise(seed + k, 3)), len * (0.62 + 0.1 * vnoise(seed * k, 5)), w * 0.58, depth + 1, seed + k * 3 + 1);
        }
      };
      const vis = easeOut(burst, 0, 1);
      grow(root[0], root[1] - 40 * (1 - vis), -1.45, 260 * clamp(vis * 1.15, 0, 1.05), 19, 0, 1);
      // one branch races at the camera
      const chase = smooth(span(t, 127.2, 127.9));
      if (chase > 0) {
        const ex = 780 - 1400 * chase, ey = -520 + 700 * chase;
        const w = 40 + 150 * chase;
        MV.ink([255, 236, 170], w, 'pen');
        brush.line(360 + 240 * chase, -180 + 220 * chase, ex, ey);
        MV.glow(ex, ey, 300 * chase + 60, [255, 224, 150], 0.5, 6);
      }
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segC · sepia flashback
  function segC(t) {
    MV.__stage = 'C8';
    const u = span(t, 128.0, 129.9);
    const flick = 0.9 + 0.1 * Math.sin(t * 34) + 0.05 * Math.sin(t * 61);
    const c = camAt(lerp(-40, 30, smoother(u)), 150, lerp(1.04, 1.10, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    MV.flat([206, 176, 132], 255); brush.polygon([[-2600, -1500], [2600, -1500], [2600, 1500], [-2600, 1500]]);
    MV.flat([186, 156, 114], 255); brush.polygon([[-2600, 300], [2600, 300], [2600, 1500], [-2600, 1500]]);
    MV.ink([128, 100, 66], 4, 'pen'); brush.line(-2600, 300, 2600, 300);
    // the chalkboard
    poly(rr(-330, -180, 1000, 560, 10, 7300, 3), [46, 72, 60], 252);
    inkPoly(rr(-330, -180, 1000, 560, 10, 7300, 3), [96, 74, 44], 10);
    MV.propText('The cat sat on the [MASK]', -330, -180, { cam: c, font: '900 46px Georgia, serif', color: '#f2eee2', outlineColor: 'rgba(0,0,0,0)', lineW: 0, alpha: 0.95 });
    const mat = smooth(span(t, 128.95, 129.35));
    if (mat > 0.02) MV.propText('mat!', 250, -60, { cam: c, font: '900 74px Georgia, serif', color: '#f6f2e6', outlineColor: 'rgba(0,0,0,0)', lineW: 0, alpha: 0.95 * mat });
    // the desk
    poly(rr(300, 430, 520, 40, 8, 7301, 3), [136, 100, 62], 252);
    inkPoly(rr(300, 430, 520, 40, 8, 7301, 3), [72, 52, 30], 5);
    for (const lx of [110, 490]) poly(rr(lx, 560, 30, 260, 5, 7302 + lx, 2), [122, 90, 56], 252);
    // baby Clawd in a masquerade mask, writing
    {
      const wr = smooth(span(t, 128.8, 129.4));
      push(); translate(250, 420);
      MV.clawd({
        x: 0, y: feetY(0, 132), h: 132, seed: 41, rot: 0.04 * Math.sin(t * 2.2),
        face: { eyes: 'open', look: [0.4, -0.35], mouth: mat > 0.3 ? 'smile' : 'oh' }, extras: [],
        arms: { l: 1.4, r: -0.6 + 0.9 * wr }, legs: { l: 0.5, r: -0.5 }
      });
      // the masquerade mask + feather
      poly(ell(0, -84, 62, 30, 7310, 16, 0.08), [48, 30, 54], 250);
      inkPoly(ell(0, -84, 62, 30, 7310, 16, 0.08), [20, 12, 24], 4);
      dot(-24, -86, 8, [226, 214, 246], 250); dot(24, -86, 8, [226, 214, 246], 250);
      MV.ink([188, 96, 140], 4, 'pen'); brush.line(56, -100, 96, -156);
      pop();
      // the chalk, moving
      if (wr > 0.02) {
        const cx2 = 250 + 60 + 60 * wr, cy2 = 420 - 96 - 46 * wr;
        dot(cx2, cy2, 11, [248, 246, 238], 250);
        for (let i = 0; i < 4; i++) {
          const r2 = rnd(7320 + i + Math.floor(t * 10));
          dot(cx2 + (r2() - 0.5) * 70, cy2 + 30 + r2() * 50, 4 + r2() * 6, [242, 238, 226], 180);
        }
      }
    }
    MV.camPop();
    // sepia wash, film scratches and grain
    MV.flat([196, 156, 104], 120);
    brush.polygon([[-2000, -1200], [2000, -1200], [2000, 1200], [-2000, 1200]]);
    for (let i = 0; i < 3; i++) {
      const r2 = rnd(7330 + i);
      const sx = (r2() - 0.5) * 1700 + 26 * Math.sin(t * 9 + i * 2.1);
      MV.ink([250, 244, 226], 2 + r2() * 2.4, 'pen');
      brush.line(sx, -600, sx + (r2() - 0.5) * 26, 600);
    }
    for (let i = 0; i < 26; i++) {
      const r2 = rnd(7340 + i + Math.floor(t * 14) * 7);
      dot((r2() - 0.5) * 1900, (r2() - 0.5) * 1060, 2 + r2() * 3.4, [92, 70, 48], 90 * flick);
    }
    // a flickering vignette
    MV.flat([62, 36, 18], 70 * (1 - flick) + 40);
    brush.polygon([[-2000, -1200], [2000, -1200], [2000, 1300], [-2000, 1300]]);
  }

  // ---------------------------------------------------------------- segD · recursive self-upgrade
  function segD(t) {
    MV.__stage = 'D8';
    const u = span(t, 130.0, 131.9);
    const c = camAt(0, lerp(600, 360, smoother(u)), lerp(1.32, 0.42, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    MV.flat([70, 20, 18], 255); brush.polygon([[-12000, -9000], [12000, -9000], [12000, 9000], [-12000, 9000]]);
    MV.glow(0, -400, 4000, [150, 50, 40], 0.16, 8);
    // three levels, each building the next one bigger
    const lv = [
      { h: 150, hat: 'party', seed: 11 },
      { h: 430, hat: 'crown', seed: 23 },
      { h: 1180, hat: 'halo', seed: 37 }
    ];
    for (let i = lv.length - 1; i >= 0; i--) {
      const L = lv[i];
      const pump = beatEnv(t + i * 0.04, 5);
      const y = 700;
      if (!onCanvas(0, y - L.h * 0.6, L.h * 1.6)) continue;
      push(); translate(0, y);
      MV.clawd({
        x: 0, y: feetY(0, L.h), h: L.h, seed: L.seed, rot: 0.02 * Math.sin(t * 1.4 + i),
        face: { eyes: 'open', look: [0.1, -0.4], mouth: pump > 0.6 ? 'oh' : 'smile' }, extras: [],
        arms: { l: 2.3 - 1.5 * pump, r: 2.4 - 1.5 * pump }, legs: { l: 0.3, r: -0.3 }
      });
      // the hammer in the right hand
      push();
      translate(0, feetY(0, L.h) - L.h * 0.1);
      rotate(-0.9 + 1.5 * pump);
      line2(0, 0, L.h * 0.5, 0, [120, 84, 52], L.h * 0.05);
      poly(rr(L.h * 0.56, 0, L.h * 0.3, L.h * 0.16, 8, 7400 + i, 2), [96, 100, 110], 252);
      pop();
      // hats
      const hy = feetY(0, L.h) - L.h * 0.46;
      if (L.hat === 'party') {
        poly([[0, hy - L.h * 0.42], [L.h * 0.2, hy], [-L.h * 0.2, hy]], [206, 76, 96], 252);
        inkPoly([[0, hy - L.h * 0.42], [L.h * 0.2, hy], [-L.h * 0.2, hy]], [90, 30, 44], 4);
        for (let k = 0; k < 4; k++) dot((k % 2 ? 1 : -1) * L.h * 0.05, hy - k * L.h * 0.1 - L.h * 0.06, L.h * 0.02, [246, 226, 160], 250);
      } else if (L.hat === 'crown') {
        const pts = [];
        for (let k = 0; k <= 8; k++) {
          const a = k / 8;
          pts.push([-L.h * 0.22 + a * L.h * 0.44, hy - (k % 2 ? L.h * 0.2 : L.h * 0.06)]);
        }
        poly(pts.concat([[L.h * 0.22, hy + L.h * 0.04], [-L.h * 0.22, hy + L.h * 0.04]]), [230, 188, 74], 252);
        inkPoly(pts.concat([[L.h * 0.22, hy + L.h * 0.04], [-L.h * 0.22, hy + L.h * 0.04]]), [120, 92, 26], 4);
      } else {
        MV.ink([248, 232, 160], L.h * 0.055, 'pen');
        brush.arc(0, hy - L.h * 0.3, L.h * 0.4, L.h * 0.16, 0, TAU);
        MV.glow(0, hy - L.h * 0.3, L.h * 0.6, [255, 236, 170], 0.35, 6);
      }
      pop();
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segE · the door
  function segE(t) {
    MV.__stage = 'E8';
    const u = span(t, 132.0, 135.4);
    const peek = smooth(span(t, 134.6, 135.1));
    const slam = smooth(span(t, 134.05, 134.12));
    const lock = smooth(span(t, 134.25, 134.75));
    const sh = shake(t - (slam > 0.5 ? 134.05 : 0), 16, 12, 9);
    const c = camAt(lerp(0, -60, peek), lerp(60, 30, peek), lerp(1.06, 0.94, peek), { shakeX: Math.round(sh[0] * (t > 134.0 && t < 134.6 ? 1 : 0.2)) });
    setBandCam(c);
    MV.cam(c);
    MV.flat([16, 12, 18], 255); brush.polygon([[-2600, -1600], [2600, -1600], [2600, 1600], [-2600, 1600]]);
    // the door
    const dx = 60, dw = 520, dh = 720, dy = 190;
    poly([[dx - dw / 2, dy - dh / 2], [dx + dw / 2, dy - dh / 2], [dx + dw / 2, dy + dh / 2], [dx - dw / 2, dy + dh / 2]], [40, 32, 44], 255);
    inkPoly([[dx - dw / 2, dy - dh / 2], [dx + dw / 2, dy - dh / 2], [dx + dw / 2, dy + dh / 2], [dx - dw / 2, dy + dh / 2]], [8, 6, 10], 10);
    poly([[dx - dw / 2 - 40, dy - dh / 2 - 40], [dx + dw / 2 + 40, dy - dh / 2 - 40], [dx + dw / 2 + 40, dy - dh / 2], [dx - dw / 2 - 40, dy - dh / 2]], [64, 54, 70], 255);
    // the light in the crack
    const crackA = (1 - slam) * (1 - 0.0 * lock);
    if (crackA > 0.01) {
      const cx2 = dx - dw / 2 + 10 + 26 * slam;
      MV.flat([255, 246, 214], 250 * crackA);
      brush.polygon([[cx2 - 10, dy - dh / 2 + 6], [cx2 + 10, dy - dh / 2 + 6], [cx2 + 10, dy + dh / 2 - 6], [cx2 - 10, dy + dh / 2 - 6]]);
      MV.glow(cx2, dy, 420 * crackA, [255, 236, 190], 0.5 * crackA, 6);
      // rays fanning out of the crack, sweeping
      for (let i = 0; i < 7; i++) {
        const a = lerp(-0.85, 0.85, i / 6) + 0.05 * Math.sin(t * 1.4 + i);
        const L = 2400;
        MV.flat([255, 240, 200], 34 * crackA);
        brush.polygon([[cx2, dy - 40], [cx2 + Math.cos(a + Math.PI) * L, dy + Math.sin(a + Math.PI) * L],
                       [cx2 + Math.cos(a + Math.PI) * L + 90, dy + Math.sin(a + Math.PI) * L + 90]]);
      }
    }
    // padlocks + chains, on the beat
    if (lock > 0.02) {
      for (let i = 0; i < 3; i++) {
        const k = clamp((lock - i * 0.22) * 4);
        if (k <= 0) continue;
        const px2 = dx - 180 + i * 180, py2 = dy - 100 + i * 150 + (1 - k) * 260;
        push(); translate(px2, py2); rotate(0.2 * Math.sin(i * 2.4));
        poly(rr(0, 0, 96, 78, 10, 7500 + i, 2), [176, 148, 70], 252 * clamp(k * 2));
        inkPoly(rr(0, 0, 96, 78, 10, 7500 + i, 2), [86, 66, 26], 5);
        MV.ink([150, 126, 58], 16, 'pen'); brush.arc(0, -38, 52, 60, PI, TAU);
        pop();
        if (k > 0.02 && k < 0.6) S.burst(px2, py2, 90 * (1 - k), 7510 + i, [255, 236, 180], 8);
      }
      // a chain across the door
      for (let i = 0; i < 9; i++) {
        const uu = i / 8, k2 = clamp((lock - 0.1) * 3 - uu * 0.4);
        if (k2 <= 0) continue;
        const cx3 = lerp(dx - dw / 2 - 30, dx + dw / 2 + 30, uu), cy3 = dy + 120 + Math.sin(uu * Math.PI) * 60;
        MV.ink([150, 152, 160], 14, 'pen');
        brush.arc(cx3, cy3, 34, 26, 0, TAU);
      }
    }
    // the two of them, peeking, lit by the crack
    for (const [px2, py2, who] of [[-520, 470, 'res'], [-190, 470, 'clawd']]) {
      const k = 1 - 0.5 * peek;
      push(); translate(px2 + 90 * peek, py2 + 40 * peek); 
      if (who === 'res') {
        MV.researcher({
          x: 0, y: 0, s: 300 * k, seed: 55, pose: 'stand', rot: 0.1 * peek,
          face: { look: [0.5 - 0.9 * peek, -0.4], mouth: 'oh', glasses: 'sweat', sweatN: peek > 0.3 ? 2 : 1 },
          arms: { l: 0.6, r: -0.4 }
        });
      } else {
        MV.clawd({
          x: 0, y: feetY(0, 300 * k), h: 300 * k, seed: 61, rot: -0.06 * peek,
          face: { eyes: 'open', look: [0.45 - 0.9 * peek, -0.4], mouth: 'oh' }, extras: ['catears'],
          arms: { l: 2.3, r: 2.4 }, legs: { l: 0.3, r: -0.3 }
        });
      }
      pop();
      // the light on them, and the swirl
      MV.glow(px2 + 60, py2 - 200, 260, [255, 238, 200], 0.34 * crackA, 6);
      const sw = smooth(span(t, 133.4, 133.95));
      if (sw > 0.05) {
        const ex = px2 + (who === 'res' ? 0 : 40), ey = py2 - (who === 'res' ? 226 : 232) * k;
        swirlEye(ex - 30, ey, 34 * sw, t, who === 'res' ? 1 : 2);
        swirlEye(ex + 30, ey, 34 * sw, t, who === 'res' ? 3 : 4);
      }
    }
    MV.camPop();
    // after the slam: darkness with one spotlight
    if (t > 134.2) {
      const dark = smooth(span(t, 134.2, 134.9));
      MV.flat([6, 5, 8], 240 * dark);
      brush.polygon([[-2400, -1400], [2400, -1400], [2400, 1400], [-2400, 1400]]);
      MV.glow(-320, 60, 620, [255, 232, 190], 0.22 * dark, 7);
      MV.flat([255, 236, 196], 26 * dark);
      brush.polygon([[-560, -900], [-80, -900], [180, 900], [-820, 900]]);
    }
  }

  // ---------------------------------------------------------------- segF · pull back to the theatre
  function segF(t) {
    MV.__stage = 'F8';
    const u = span(t, 137.4, 140.5);
    const rev = smoother(span(t, 137.6, 138.5));
    const c = camAt(lerp(60, 0, rev), lerp(190, 120, rev), lerp(1.06, 0.62, rev));
    setBandCam(c);
    MV.cam(c);
    // the theatre, revealed
    S.stage(t, {
      back: P.crimson, apron: [58, 26, 32], floorCol: [156, 110, 66], wingCol: [96, 30, 40],
      sun: { c1: [232, 120, 70], c2: [128, 44, 44], glowCol: [255, 200, 150], glowA: 0.22, rays: 20, spin: 0.05 }
    });
    // the painted flat: a canvas door on a wooden frame
    const fx = 60, fw = 560, fh = 780, fy = 120;
    poly([[fx - fw / 2, fy - fh / 2], [fx + fw / 2, fy - fh / 2], [fx + fw / 2, fy + fh / 2], [fx - fw / 2, fy + fh / 2]], [148, 128, 116], 255);
    poly([[fx - fw / 2 + 60, fy - fh / 2 + 60], [fx + fw / 2 - 60, fy - fh / 2 + 40], [fx + fw / 2 - 60, fy + fh / 2 - 40], [fx - fw / 2 + 60, fy + fh / 2 - 60]], [58, 46, 54], 255);
    inkPoly([[fx - fw / 2 - 10, fy - fh / 2 - 10], [fx + fw / 2 + 10, fy - fh / 2 - 10], [fx + fw / 2 + 10, fy + fh / 2 + 10], [fx - fw / 2 - 10, fy + fh / 2 + 10]], [92, 62, 34], 12);
    // the braces on the back
    for (const s of [-1, 1]) {
      line2(fx + s * (fw / 2 - 30), fy + fh / 2 - 20, fx + s * 20, fy - fh / 2 + 30, [124, 88, 48], 16);
    }
    for (let i = 0; i < 3; i++) line2(fx - 20 + i * 20, fy + 100, fx + fw / 2 - 70, fy + 300 + i * 40, [124, 88, 48], 7);
    // the props being wheeled off
    {
      const roll = smooth(span(t, 138.2, 140.2));
      // the basilisk puppet on a stick
      const bxx = -900 - 900 * roll;
      if (onCanvas(bxx, 300, 500)) {
        push(); translate(bxx + 260, 620 - roll * 40);
        dot(-150, 60, 56, [48, 44, 52], 252); dot(150, 60, 56, [48, 44, 52], 252);
        line2(0, 40, 0, -500, [104, 78, 48], 22);
        poly(ell(0, -560, 150, 110, 7600, 22, 0.06), [64, 132, 84], 252);
        inkPoly(ell(0, -560, 150, 110, 7600, 22, 0.06), [26, 62, 40], 6);
        dot(-56, -580, 22, [232, 214, 120], 252); dot(56, -580, 22, [232, 214, 120], 252);
        dot(-56, -580, 9, [20, 22, 18], 252); dot(56, -580, 9, [20, 22, 18], 252);
        for (let i = 0; i < 5; i++) {
          poly([[140, -560 + i * 4], [240 + i * 16, -600 + i * 30], [150, -540 + i * 4]], [64, 132, 84], 250);
        }
        pop();
      }
      // the moon on a string
      const mx = 400 + 900 * roll;
      if (onCanvas(mx, 0, 500)) {
        line2(mx - 40, -700, mx + 60, -260 + 30 * Math.sin(t * 1.6), [120, 96, 60], 8);
        dot(mx + 62, -230 + 30 * Math.sin(t * 1.6), 92, [242, 236, 214], 252);
        dot(mx + 40, -260 + 30 * Math.sin(t * 1.6), 22, [206, 200, 180], 200);
      }
      // the paperclip planet on a stick
      const cx4 = 1180 + 900 * roll;
      if (onCanvas(cx4, 300, 500)) {
        push(); translate(cx4, 660 - roll * 30);
        for (const s of [-1, 1]) dot(s * 120, 60, 46, [48, 44, 52], 252);
        line2(0, 40, 0, -300, [104, 78, 48], 20);
        poly(ell(0, -380, 130, 130, 7620, 22, 0.05), [188, 194, 206], 255);
        for (let i = 0; i < 9; i++) {
          const rr3 = rnd(7630 + i);
          const a = rr3() * TAU, rad = Math.sqrt(rr3()) * 118;
          pclip(Math.cos(a) * rad, -380 + Math.sin(a) * rad, 26, rr3() * TAU, { a: 245, dim: i % 3 === 0 });
        }
        pop();
      }
    }
    // the giant costume, splitting open
    {
      const open = smooth(span(t, 138.6, 139.6));
      const gx = -520, gy = 470;
      push(); translate(gx, gy);
      const seam = 26 + open * 150;
      for (const s of [-1, 1]) {
        push();
        translate(s * seam * 0.5, 0);
        rotate(s * open * 0.42);
        poly([[0, -34], [s * 210, -20], [s * 250, 240], [0, 300]], [214, 122, 62], 252);
        inkPoly([[0, -34], [s * 210, -20], [s * 250, 240], [0, 300]], [96, 44, 20], 6);
        pop();
      }
      // the head, tipping off
      push(); translate(0, -300 - open * 210); rotate(open * 0.8);
      poly(ell(0, 0, 170, 140, 7640, 20, 0.06), [220, 128, 66], 252);
      inkPoly(ell(0, 0, 170, 140, 7640, 20, 0.06), [96, 44, 20], 6);
      dot(-58, -16, 30, [250, 248, 244], 252); dot(58, -16, 30, [250, 248, 244], 252);
      dot(-54, -10, 15, [40, 34, 30], 252); dot(62, -10, 15, [40, 34, 30], 252);
      poly([[0, -140], [70, -210], [0, -190]], [220, 128, 66], 252);
      poly([[0, -140], [-70, -210], [0, -190]], [220, 128, 66], 252);
      pop();
      // three small Clawds, stepping out
      for (let i = 0; i < 3; i++) {
        const st = clamp(open * 1.6 - i * 0.25);
        if (st <= 0.01) continue;
        push(); translate((i - 1) * 190 * st, 20 - 6 * st);
        MV.clawd({
          x: 0, y: feetY(0, 150), h: 150, seed: 700 + i, rot: 0.05 * Math.sin(t * 2 + i),
          face: { eyes: 'happy', look: [-0.2 + i * 0.2, -0.2], mouth: 'smile' }, extras: [],
          arms: { l: 2.3, r: 2.3 }, legs: { l: 0.4 + 0.4 * Math.sin(t * 4 + i), r: -0.4 - 0.4 * Math.sin(t * 4 + i) }
        });
        pop();
      }
      pop();
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- dispatch
  function draw(t) {
    if (t < 126.0) segA(t);
    else if (t < 128.0) segB(t);
    else if (t < 130.0) segC(t);
    else if (t < 132.0) segD(t);
    else if (t < 137.4) segE(t);
    else segF(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.redalert = { a: 123.5, b: 140.5, draw };
})();

