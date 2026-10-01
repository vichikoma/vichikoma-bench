// util.js — math, determinism, beat grid, camera, watercolor vocabulary, transitions
'use strict';
const W = 1920, H = 1080;
const BPM = 132, BEAT0 = 0.25, BEATLEN = 60 / BPM; // 0.45454s, beat k at BEAT0 + k*BEATLEN

// ---------- deterministic randomness ----------
function hash32(...ns) {
  let h = 0x9e3779b9 >>> 0;
  for (const n of ns) {
    let x = Math.imul((n * 1e4 + 0.5) | 0 ^ (n | 0), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ x, 0xc2b2ae35) >>> 0;
    h = (h + 0x165667b1) >>> 0;
    h ^= h >>> 13; h = Math.imul(h, 0x27d4eb2f) >>> 0; h ^= h >>> 16;
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// per-frame rng: salt is usually scene id or a name
function RNG(t, salt) {
  const r = mulberry32(hash32(Math.round(t * 1000), typeof salt === 'string' ? hashStr(salt) : (salt | 0)));
  r.f = (a, b) => a + r() * (b - a);
  r.i = (a, b) => Math.floor(r.f(a, b + 1));
  r.pick = arr => arr[Math.floor(r() * arr.length)];
  r.sign = () => r() < 0.5 ? -1 : 1;
  return r;
}
function hashStr(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// ---------- beat grid ----------
function beatPhase(t) { const p = ((t - BEAT0) / BEATLEN) % 1; return p < 0 ? p + 1 : p; }
function beatK(t) { return Math.floor((t - BEAT0) / BEATLEN); }
function beatsFrom(t0) { return (t - t0) / BEATLEN; }
// |sin| hop: 0 at beat instant, 1 mid-beat
function hop(t, div = 1) { const p = (beatPhase(t) * div) % 1; return Math.abs(Math.sin(Math.PI * p)); }
// landing squash: 1 right after beat instant, decays
function squash(t, div = 1) { const p = (beatPhase(t) * div) % 1; return Math.exp(-p * 7); }
// 0..1 pulse of each beat (for step-advance animations)
function beatStep(t, div = 1) { return Math.floor(beatPhase(t) * 0 + (t - BEAT0) / (BEATLEN / div)); }

// ---------- audio envelope ----------
function pulse(t) { // onset strength 0..1
  const i = t / ENV_DT;
  const i0 = Math.max(0, Math.min(ENVELOPE.length - 1, i | 0));
  return Math.min(1, ENVELOPE[i0] / 3);
}
function loudAt(t) {
  const i = Math.max(0, Math.min(LOUDNESS.length - 1, t / ENV_DT | 0));
  return LOUDNESS[i];
}
// decaying hit envelope from a list of [time, magnitude] — for camera shake / flashes
function hitEnv(t, hits, decay = 6) {
  let v = 0;
  for (const [ht, mag] of hits) { const d = t - ht; if (d >= 0 && d < 1.2) v += mag * Math.exp(-d * decay); }
  return v;
}

// ---------- math ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, u) => a + (b - a) * u;
const smooth = (a, b, v) => { const u = clamp((v - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
const easeInOut = u => u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
const easeOut = u => 1 - (1 - u) * (1 - u);
const easeIn = u => u * u;
const easeOutBack = u => { const c = 1.70158; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const easeOutElastic = u => u === 0 ? 0 : u === 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
const TAU = Math.PI * 2;
// timeline progress helpers
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1); // 0..1 within [a,b]
const win = (t, a, b) => t >= a && t < b; // inside window

// ---------- palette ----------
const INK = '#4a2c17';            // warm dark ink for outlines
const CREAM = '#f5edda';          // paper
const C = {
  ink: INK, cream: CREAM,
  clawd: '#f28f2e', clawdD: '#d96f14', clawdL: '#ffb95a',
  blush: '#e8604c', red: '#c22f24', redD: '#8e1d15',
  blue: '#3e7cb1', blueD: '#28567f', teal: '#3a9d8f',
  green: '#5d9e4a', gold: '#e8b73a', violet: '#6f5aa8', violetD: '#4b3a7e',
  pink: '#ef7fa8', pinkD: '#d1517f', brown: '#8a5a2b', grey: '#8d8a92', greyD: '#5c5962',
  white: '#faf6ec', night: '#2b2a4a', steel: '#7e8794', steelD: '#4c545f',
};
function withA(hex, a) { // hex (or rgba string) → rgba string; alpha multiplies for rgba input
  if (hex.startsWith('rgba')) {
    if (a === undefined) return hex;
    return hex.replace(/([\d.]+)\)$/, (m, al) => (parseFloat(al) * a) + ')');
  }
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}

// ---------- brush helpers (call inside p5 instance context; uses global P) ----------
// base tip widths in px at scaleBrushes(7), measured: probe4
const BRUSH_PX = { pen: 4, rotring: 3, '2B': 4, HB: 3, '2H': 2, cpencil: 2, pastel: 12, crayon: 14, charcoal: 16, spray: 40, marker: 18 };
function bw(name, px) { return Math.max(0.12, px / (BRUSH_PX[name] || 4)); }
// wobbly polygon points around a circle
function wobCirclePts(cx, cy, r, n, rng, jit = 0.06, squashY = 1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    const rr = r * (1 + (rng() * 2 - 1) * jit);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squashY]);
  }
  return pts;
}
function ellipsePts(cx, cy, rx, ry, n = 18, rot = 0, jit = 0, rng = null) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU;
    let j = jit && rng ? 1 + (rng() * 2 - 1) * jit : 1;
    const x0 = Math.cos(a) * rx * j, y0 = Math.sin(a) * ry * j;
    pts.push([cx + x0 * Math.cos(rot) - y0 * Math.sin(rot), cy + x0 * Math.sin(rot) + y0 * Math.cos(rot)]);
  }
  return pts;
}
function rrectPts(x, y, w, h, rad, per, rng, jit = 0.03) {
  // rounded-rect outline points, clockwise, wobbled (quadratic-bezier corners)
  const pts = [];
  const jx = () => (rng() * 2 - 1) * Math.min(w, h) * jit * 0.5;
  const corners = [ // [cornerX, cornerY, startPt, endPt] going clockwise
    [x + rad, y + rad, [x, y + rad], [x + rad, y]],                       // TL
    [x + w - rad, y + rad, [x + w - rad, y], [x + w, y + rad]],           // TR
    [x + w - rad, y + h - rad, [x + w, y + h - rad], [x + w - rad, y + h]], // BR
    [x + rad, y + h - rad, [x + w - rad, y + h], [x, y + h - rad]],       // BL
  ];
  for (let ci = 0; ci < 4; ci++) {
    const [cx, cy, s, e] = corners[ci];
    // corner arc: bezier with control at the sharp corner (cx±rad, cy±rad)
    const qx = x + (ci === 0 || ci === 3 ? 0 : w), qy = y + (ci === 0 || ci === 1 ? 0 : h); // sharp corner
    const n = Math.max(2, Math.round(rad * 1.5 / per));
    for (let i = 0; i <= n; i++) {
      const u = i / n, q = 1 - u;
      pts.push([q * q * s[0] + 2 * q * u * qx + u * u * e[0] + jx(), q * q * s[1] + 2 * q * u * qy + u * u * e[1] + jx()]);
    }
    // straight edge to next corner's start point
    const nxt = corners[(ci + 1) % 4][2];
    const len = Math.hypot(nxt[0] - e[0], nxt[1] - e[1]);
    const m = Math.max(2, Math.round(len / per));
    for (let i = 1; i <= m; i++) {
      const u = i / m;
      pts.push([lerp(e[0], nxt[0], u) + jx(), lerp(e[1], nxt[1], u) + jx()]);
    }
  }
  return pts;
}
// flat translucent fill of a wobbled shape (native, reliable) — layered twice for watercolor unevenness
function fillShape(pts, color, alpha) {
  P.push();
  P.noStroke();
  P.fill(withA(color, alpha));
  P.beginShape();
  for (const p of pts) P.vertex(p[0], p[1]);
  P.endShape(P.CLOSE);
  P.pop();
}
function washShape(pts, color, op, rng) {
  fillShape(pts, color, Math.min(1, op));
  if (op >= 0.4) { // mottle layer, offset wobble for uneven watercolor feel
    fillShape(pts.map(p => [p[0] + (rng() * 2 - 1) * 5, p[1] + (rng() * 2 - 1) * 5]), color, 0.12);
  }
}
function washBlob(cx, cy, r, color, op, rng, opts = {}) {
  const pts = wobCirclePts(cx, cy, r, opts.n || 16, rng, opts.jit ?? 0.08, opts.squashY || 1);
  washShape(pts, color, op, rng);
  if (opts.stroke !== false) strokePts(pts, opts.strokeCol || withA(C.ink, 0.75), opts.strokeW || 3, opts.brush || 'pen');
  return pts;
}
function strokePts(pts, col, w, name = 'pen', close = true) {
  brush.noFill(); brush.noWash();
  brush.set(name, col, bw(name, w));
  for (let i = 0; i < pts.length - 1; i++) brush.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  if (close && pts.length > 2) brush.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1]);
}
function strokePath(pts, col, w, name = 'pen') {
  brush.noFill(); brush.noWash();
  brush.set(name, col, bw(name, w));
  for (let i = 0; i < pts.length - 1; i++) brush.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
}
// painted text as sprite (WEBGL text unreliable) — cached, deterministic
const _spriteCache = new Map();
function textSprite(str, size, col, opts = {}) {
  const key = str + '|' + size + '|' + col + '|' + (opts.font || '') + (opts.outline || '') + (opts.bold ? 1 : 0);
  if (_spriteCache.has(key)) return _spriteCache.get(key);
  const font = opts.font || 'Comic Sans MS';
  const pad = Math.ceil(size * 0.35);
  // measure with a scratch 2d canvas
  const m = document.createElement('canvas').getContext('2d');
  m.font = `${opts.bold === false ? '' : 'bold '}${size}px "${font}"`;
  const w = Math.ceil(m.measureText(str).width) + pad * 2;
  const h = Math.ceil(size * 1.35) + pad * 2;
  const pg = P.createGraphics(w, h);
  const cx = pg.drawingContext;
  cx.font = `${opts.bold === false ? '' : 'bold '}${size}px "${font}"`;
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.lineJoin = 'round';
  if (opts.outline && opts.outline !== 'rgba(0,0,0,0)') { cx.strokeStyle = opts.outline; cx.lineWidth = size * 0.14; cx.strokeText(str, w / 2, h / 2); }
  cx.fillStyle = col;
  cx.fillText(str, w / 2, h / 2);
  const spr = { pg, w, h };
  _spriteCache.set(key, spr);
  return spr;
}
function drawSprite(spr, x, y, opts = {}) {
  P.push();
  P.translate(x, y);
  if (opts.rot) P.rotate(opts.rot);
  P.image(spr.pg, -spr.w / 2, -spr.h / 2, spr.w, spr.h);
  P.pop();
}
// hand-drawn underline / squiggle
function squiggle(x, y, len, amp, n, col, w, rng, name = 'pen') {
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([x + len * i / n, y + Math.sin(i / n * TAU * 2) * amp * (0.6 + rng() * 0.4)]);
  strokePath(pts, col, w, name);
}
// watercolor ground: broad layered bands across the frame (native fills)
function bgWash(t, salt, colors, rng) {
  // colors: [[color, y0, y1, op], ...] horizontal bands with wobble
  for (const [col, y0, y1, op] of colors) {
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) pts.push([-80 + i * (W + 160) / n, y0 + Math.sin(i * 1.7 + hashStr(salt) % 10) * 30 + (rng() * 2 - 1) * 25]);
    for (let i = n; i >= 0; i--) pts.push([-80 + i * (W + 160) / n, y1 + Math.cos(i * 1.3) * 30 + (rng() * 2 - 1) * 25]);
    fillShape(pts, col, op);
  }
}
// ---------- camera ----------
function camBegin(zoom = 1, cx = W / 2, cy = H / 2, rot = 0) {
  P.push();
  // NOTE: renderFrame has already translated to top-left origin space
  if (rot) { P.translate(cx, cy); P.rotate(rot); P.translate(-cx, -cy); }
  P.translate(cx, cy); P.scale(zoom); P.translate(-cx, -cy);
}
function camEnd() { P.pop(); }

// ---------- transitions ----------
// brush wipe: painted wave sweeping across; p=0..1
function brushWipe(p, colA, colB, dir = 1) {
  if (p <= 0 || p >= 1) { if (p >= 1) { P.fill(colB); P.noStroke(); P.rect(0, 0, W, H); } return; }
  P.push();
  const x = -100 + p * (W + 200) * dir;
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const y = -60 + i * (H + 120) / 16;
    pts.push([x + Math.sin(i * 0.9) * 55 + Math.sin(i * 0.33 + 2) * 40, y]);
  }
  const pts2 = pts.map(pt => [pt[0] + (dir > 0 ? -170 : 170) + Math.sin(pt[1] * 0.01) * 50, pt[1]]);
  P.noStroke();
  P.fill(colA);
  P.beginShape(); for (const pt of pts) P.vertex(pt[0], pt[1]); for (let i = pts2.length - 1; i >= 0; i--) P.vertex(pts2[i][0], pts2[i][1]); P.endShape(P.CLOSE);
  P.fill(colB);
  P.beginShape(); for (const pt of pts2) P.vertex(pt[0], pt[1]); P.vertex(dir > 0 ? -200 : W + 200, -60); P.vertex(dir > 0 ? -200 : W + 200, H + 60); P.endShape(P.CLOSE);
  P.pop();
}
function flashOver(col, a) {
  P.push(); P.noStroke(); P.fill(col.startsWith('#') ? withA(col, a) : col); P.rect(0, 0, W, H); P.pop();
}
function irisHole(cx, cy, r, col = '#100c12') {
  // cover screen except circle at (cx,cy) radius r (top-left coords)
  P.push(); P.noStroke(); P.fill(col);
  const rr = Math.max(1, r);
  P.beginShape();
  P.vertex(-10, -10); P.vertex(W + 10, -10); P.vertex(W + 10, H + 10); P.vertex(-10, H + 10);
  for (let i = 0; i <= 40; i++) { const a = -i / 40 * TAU; P.vertex(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  P.endShape(P.CLOSE);
  P.pop();
}
// SFX word painted on screen (sprite text)
function sfxWord(txt, x, y, size, col, rot = 0, rng = null, outline = C.ink) {
  const spr = textSprite(txt, size, col, { outline, font: 'Comic Sans MS' });
  drawSprite(spr, x, y, { rot, alpha: 1 });
}
