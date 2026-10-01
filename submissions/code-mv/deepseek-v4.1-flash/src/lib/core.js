// src/lib/core.js — deterministic randomness, easing, beat grid, camera, misc geometry.
// Everything here is a pure function of its arguments (no cross-frame state) so a frame at
// song time t is reproducible regardless of render order.
(function () {
  const MV = (window.MV = window.MV || {});

  // ---------- deterministic hashing / rng ----------
  function ihash(n) {              // integer -> uint32
    n = n | 0;
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function hash() {                // hash(...numbers) -> [0,1)
    let h = 0x811c9dc5;
    for (let i = 0; i < arguments.length; i++) {
      const v = arguments[i] | 0;
      h = Math.imul(h ^ (v & 0xffff), 0x01000193);
      h = Math.imul(h ^ ((v >>> 16) & 0xffff), 0x01000193);
    }
    return ihash(h) / 4294967296;
  }
  // seeded stream: rnd(seed) -> () => [0,1)
  function rnd(seed) {
    let a = ihash(seed | 0);
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const srnd = (seed, lo, hi) => lo + (hi - lo) * rnd(seed)();
  // smooth 1-D value noise (deterministic), for gentle continuous wobble
  function vnoise(x, seed) {
    const i0 = Math.floor(x), f = x - i0, u = f * f * (3 - 2 * f);
    const a = hash(i0, seed), b = hash(i0 + 1, seed);
    return a + (b - a) * u;
  }
  const nw = (x, seed, lo, hi) => lo + (hi - lo) * vnoise(x, seed);

  // ---------- math ----------
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  // normalised progress with clamp; soft=(ease) applied
  const span = (t, a, b) => clamp((t - a) / (b - a));
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const smoother = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };
  const easeIn = (x) => clamp(x) * clamp(x);
  const easeOut = (x) => 1 - (1 - clamp(x)) * (1 - clamp(x));
  const easeOut3 = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const easeOut4 = (x) => 1 - Math.pow(1 - clamp(x), 4);
  const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
  const easeBack = (x) => { const c = 1.70158, c3 = c + 1; x = clamp(x); return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const easeElastic = (x) => { x = clamp(x); if (x === 0 || x === 1) return x; const c = (2 * Math.PI) / 3; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c) + 1; };
  const easeOutBounce = (x) => {
    x = clamp(x); const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  };
  // hump: 0 at a, 1 at peak, 0 at b
  const hump = (t, a, m, b) => (t <= a || t >= b) ? 0 : (t < m ? smooth(span(t, a, m)) : smooth(1 - span(t, m, b)));
  const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  const rgba = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

  // ---------- beat grid (measured from assets/song.mp3) ----------
  // 132.0 BPM, beat period 0.454545 s, first beat at 0.208 s  (verified against the kick
  // pattern and a comb search over 0–156 s; see tools/beat.mjs)
  const BPM = 132.0, SPB = 60 / BPM, BEAT0 = 0.208;
  const beatPos = (t) => (t - BEAT0) / SPB;                    // continuous beat position
  const beatIndex = (t) => Math.floor(beatPos(t));
  const beatPhase = (t) => beatPos(t) - Math.floor(beatPos(t)); // 0 at beat, ->1 before next
  const beatTime = (i) => BEAT0 + i * SPB;
  // sharp attack at every beat, exponential decay afterwards
  const beatEnv = (t, decay = 7) => Math.exp(-beatPhase(t) * decay);
  // pulse tied to a specific beat offset (e.g. hit lands on the half-bar)
  const envAt = (t, shift = 0, decay = 7) => Math.exp(-(((beatPos(t) - shift) % 1) + 1) % 1 * decay);
  const barPhase = (t) => ((beatPos(t) / 4) % 1 + 1) % 1;
  const barIndex = (t) => Math.floor(beatPos(t) / 4);
  // list of beat times in [a,b]
  const beatsIn = (a, b) => { const out = []; for (let i = Math.ceil((a - BEAT0) / SPB); i <= Math.floor((b - BEAT0) / SPB); i++) out.push(beatTime(i)); return out; };
  // "hit at beat k" envelope: 1 just after that beat, decaying
  const hit = (t, k, decay = 6) => { const d = beatPos(t) - k; return d < 0 ? 0 : Math.exp(-d * decay); };

  // ---------- camera ----------
  // A camera is a plain object; push/pop wrap p5 transforms. Scene space is centred at (0,0)
  // (WEBGL convention); 1920x1080 canvas => x in [-960,960], y in [-540,540].
  const cam = (o = {}) => {
    const { x = 0, y = 0, zoom = 1, rot = 0, shakeX = 0, shakeY = 0 } = o;
    push();
    translate(x + shakeX, y + shakeY);
    if (rot) rotate(rot);
    if (zoom !== 1) scale(zoom);
    return o;
  };
  const camPop = () => pop();

  // deterministic on-beat shake (no state): decays after each beat, axis-flips by beat index
  const shake = (t, amp = 8, decay = 9, seed = 1) => {
    const e = beatEnv(t, decay), i = beatIndex(t);
    return [amp * e * (hash(i, seed) * 2 - 1), amp * e * (hash(i, seed + 77) * 2 - 1)];
  };

  // ---------- geometry helpers ----------
  // hand-drawn polyline between two points
  function wobbleLine(x1, y1, x2, y2, seed, amp = 3, steps = 6) {
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const nx = lerp(x1, x2, u), ny = lerp(y1, y2, u);
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
      const n = (vnoise(i * 0.7 + seed * 0.13, seed) - 0.5) * 2 * amp * (i === 0 || i === steps ? 0.35 : 1);
      pts.push([nx - dy / len * n, ny + dx / len * n]);
    }
    return pts;
  }
  // wobbly closed blob approximating a circle/ellipse
  function wobbleEllipse(cx, cy, rx, ry, seed, n = 26, amp = 0.06, rot = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (vnoise(i * 0.55 + seed * 0.31, seed) - 0.5) * 2 * amp;
      let px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      if (rot) { const c = Math.cos(rot), s = Math.sin(rot); const tx = px * c - py * s; py = px * s + py * c; px = tx; }
      pts.push([cx + px, cy + py]);
    }
    return pts;
  }
  // rounded-rect (squircle) polygon, hand-drawn
  function wobbleRoundRect(cx, cy, w, h, r, seed, n = 6, amp = 2.2, rot = 0) {
    const hw = w / 2, hh = h / 2;
    r = Math.min(r, hw, hh);
    const pts = [], cs = [['tl', -hw + r, -hh + r], ['tr', hw - r, -hh + r], ['br', hw - r, hh - r], ['bl', -hw + r, hh - r]];
    const key = [[Math.PI, Math.PI * 1.5], [Math.PI * 1.5, Math.PI * 2], [0, Math.PI * 0.5], [Math.PI * 0.5, Math.PI]];
    const path = [];
    for (let i = 0; i < 4; i++) {
      const [name, ox, oy] = cs[i], [a0, a1] = key[i];
      for (let k = 0; k <= n; k++) {
        const a = lerp(a0, a1, k / n);
        path.push([ox + Math.cos(a) * r, oy + Math.sin(a) * r]);
      }
    }
    for (let i = 0; i < path.length; i++) {
      const jitter = (vnoise(i * 0.9 + seed * 0.7, seed) - 0.5) * 2 * amp;
      let px = path[i][0] + jitter * 0.5, py = path[i][1] + jitter;
      if (rot) { const c = Math.cos(rot), s = Math.sin(rot); const tx = px * c - py * s; py = px * s + py * c; px = tx; }
      pts.push([cx + px, cy + py]);
    }
    return pts;
  }
  function polyPath(pts, close = false) { beginShape(); for (const p of pts) vertex(p[0], p[1]); if (close) endShape(CLOSE); else endShape(); }

  MV.hash = hash; MV.rnd = rnd; MV.srnd = srnd; MV.vnoise = vnoise; MV.nw = nw; MV.ihash = ihash;
  MV.clamp = clamp; MV.lerp = lerp; MV.inv = inv; MV.span = span; MV.smooth = smooth; MV.smoother = smoother;
  MV.easeIn = easeIn; MV.easeOut = easeOut; MV.easeOut3 = easeOut3; MV.easeOut4 = easeOut4;
  MV.easeInOut = easeInOut; MV.easeBack = easeBack; MV.easeOutBack = easeBack; MV.easeElastic = easeElastic; MV.easeOutBounce = easeOutBounce;
  MV.hump = hump; MV.mix = mix; MV.rgba = rgba;
  MV.BPM = BPM; MV.SPB = SPB; MV.BEAT0 = BEAT0; MV.beatPos = beatPos; MV.beatIndex = beatIndex;
  MV.beatPhase = beatPhase; MV.beatTime = beatTime; MV.beatEnv = beatEnv; MV.envAt = envAt;
  MV.barPhase = barPhase; MV.barIndex = barIndex; MV.beatsIn = beatsIn; MV.hit = hit;
  MV.cam = cam; MV.camPop = camPop; MV.shake = shake;
  MV.wobbleLine = wobbleLine; MV.wobbleEllipse = wobbleEllipse; MV.wobbleRoundRect = wobbleRoundRect; MV.polyPath = polyPath;
})();
