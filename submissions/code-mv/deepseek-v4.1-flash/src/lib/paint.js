// src/lib/paint.js — watercolor painting primitives on top of p5.brush.
(function () {
  const MV = window.MV;
  const { lerp, clamp, rgba, mix } = MV;

  const hex = (c) => {
    if (typeof c === 'string') return c;
    const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return '#' + h(c[0]) + h(c[1]) + h(c[2]);
  };
  const css = (c, a = 1) => (typeof c === 'string' ? c : rgba(c, a));
  const toRGB = (c) => (typeof c === 'string' ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c);
  const shade = (c, amt) => { const b = toRGB(c); return [b[0] + amt, b[1] + amt, b[2] + amt]; };
  const centroid = (pts) => { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; };
  const ext = (pts) => { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; };
  const growPts = (pts, k) => { const c = centroid(pts); return pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]); };

  // ---------- palettes (from STORYBOARD palette arc) ----------
  const PAL = {
    cream: [243, 236, 222], paper: [246, 240, 226],
    indigo: [28, 34, 66], indigoMid: [46, 56, 100], night: [20, 24, 48],
    lamp: [226, 168, 82], lampDeep: [186, 120, 48],
    teal: [46, 148, 150], tealDeep: [24, 96, 104], tealGlow: [126, 216, 205],
    crimson: [156, 40, 48], crimsonDeep: [104, 24, 34], gold: [216, 168, 74],
    rose: [214, 106, 96], ochre: [206, 158, 84],
    sky: [150, 196, 222], skyDeep: [96, 150, 186],
    violet: [78, 58, 120], gold2: [230, 186, 96],
    steel: [120, 130, 140], jazz: [38, 62, 108],
    dcTeal: [40, 122, 128], orange: [226, 120, 56],
    red: [198, 46, 44], black: [26, 24, 30],
    clawd: [226, 128, 58], clawdDark: [186, 92, 34], clawdLight: [244, 166, 96],
    coat: [240, 234, 216], coatShadow: [206, 199, 182], hair: [72, 58, 46], skin: [238, 206, 176],
    paper2: [232, 224, 204]
  };

  // ---------- state helpers (always set explicitly: brush state persists across frames) ----------
  function ink(color, weight, name = 'pen') {
    brush.set(name, hex(color), weight);
    brush.noFill(); brush.noWash(); brush.noHatch(); brush.noField();
    return { color, weight, name };
  }
  function flat(color, alpha = 220) {          // flat opaque wash (the reliable solid fill)
    brush.noStroke(); brush.noHatch(); brush.noFill();
    brush.wash(hex(color), alpha);
  }
  function bloom(color, alpha = 120) {         // soft watercolor bleed fill
    brush.noStroke(); brush.noHatch(); brush.noWash();
    brush.fill(hex(color), alpha);
  }
  function hatch(angle = 45, gap = 9, weight = 1) {
    brush.noStroke(); brush.noWash(); brush.noFill();
    brush.hatch(gap, angle);
  }
  function nostroke() { brush.noStroke(); }

  // ---------- custom brushes ----------
  // NOTE (measured): brushes created with brush.add() are registered (brush.box() lists them) but
  // CANNOT be used for strokes in p5.brush 2.2.3 — brush.line()/polygon() then throws
  // "Cannot read properties of undefined (reading 'type')". Fills (wash/fill) still work.
  // So: strokes only ever use the built-in brushes.
  // built-ins: pen, rotring, 2B, HB, 2H, cpencil, pastel, crayon, charcoal, spray, marker
  const BUILTIN = ['pen', 'rotring', '2B', 'HB', '2H', 'cpencil', 'pastel', 'crayon', 'charcoal', 'spray', 'marker'];

  /** watercolor area: soft bleeding fill edge + solid wash core (+ optional granulation / rim).
   *  pts (array of [x,y]), color, alpha 0..255, seed, opts { wet, bleed, tone, grit } */
  function wc(pts, color, alpha = 235, seed = 1, opts = {}) {
    const e = ext(pts);
    // 1) bleeding textured body: soft edge + darker rim, low alpha so it reads as water
    brush.noStroke(); brush.noHatch(); brush.noWash();
    brush.fillBleed(opts.bleedQ ?? 0.3, 'out');
    brush.fillTexture(opts.tex ?? 0.3, opts.border ?? 0.55, false);
    brush.fill(hex(color), opts.bodyAlpha ?? Math.min(alpha, 96));
    brush.polygon(growPts(pts, 1.0));
    // 2) solid core, slightly inset so the bleeding edge stays visible
    if (alpha > 40) {
      brush.noStroke(); brush.noHatch(); brush.noFill();
      brush.wash(hex(color), alpha);
      brush.polygon(growPts(pts, opts.inset ?? 0.972));
    }
    // 3) granulation: settled pigment (charcoal/spray short strokes) — opt-in
    if (opts.grit) {
      const r = MV.rnd(seed * 31 + 7);
      brush.set(opts.gritBrush || 'charcoal', hex(shade(color, -26)), opts.gritW ?? 0.3);
      brush.noFill(); brush.noWash(); brush.noHatch();
      const n = opts.gritN ?? 4, inner = growPts(pts, 0.86);
      for (let i = 0; i < n; i++) {
        const cx = e.cx + (r() - 0.5) * e.w * 0.55, cy = e.cy + (r() - 0.5) * e.h * 0.55;
        const a = r() * Math.PI * 2, len = Math.min(e.w, e.h) * (0.1 + r() * 0.22);
        brush.line(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      }
    }
    // 4) crisp painted rim (opt-in): gives cartoon definition on top of the water
    if (opts.wet) {
      brush.set(opts.wetBrush || 'marker', hex(shade(color, opts.wetShade ?? -70)), opts.wetW ?? 0.6);
      brush.noFill(); brush.noWash(); brush.noHatch();
      const g = opts.wetGrow ?? 1.0, n = pts.length;
      brush.polygon(growPts(pts, g));
    }
  }

  // pts: array of [x,y]; cfg: { wash:{color,alpha}, fill:{color,alpha,bleed,texture}, ink:{color,weight,name}, hatch:{...} }
  function shape(pts, cfg = {}) {
    if (cfg.wash) { flat(cfg.wash.color, cfg.wash.alpha ?? 220); brush.polygon(pts); }
    if (cfg.fill) {
      if (cfg.fill.bleed !== undefined) brush.fillBleed(cfg.fill.bleed, 'out');
      if (cfg.fill.texture !== undefined) brush.fillTexture(cfg.fill.texture, cfg.fill.texture2 ?? 0.5, false);
      bloom(cfg.fill.color, cfg.fill.alpha ?? 120); brush.polygon(pts);
    }
    if (cfg.hatch) { brush.hatch(cfg.hatch.gap ?? 9, cfg.hatch.angle ?? 45); brush.noStroke(); brush.noWash(); brush.noFill(); brush.polygon(pts); brush.noHatch(); }
    if (cfg.ink) { ink(cfg.ink.color, cfg.ink.weight ?? 1, cfg.ink.name); brush.polygon(pts); }
    return pts;
  }
  const blob = (cx, cy, rx, ry, seed, n = 26, amp = 0.06, rot = 0) => MV.wobbleEllipse(cx, cy, rx, ry, seed, n, amp, rot);
  const rrect = (cx, cy, w, h, r, seed, amp = 2.2, rot = 0) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp, rot);

  function line(x1, y1, x2, y2, color, weight, seed = 0, amp = 2.5, name = 'pen') {
    ink(color, weight, name);
    const pts = MV.wobbleLine(x1, y1, x2, y2, seed, amp, 7);
    for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
  }
  function polyline(pts, color, weight, name = 'pen', close = false) {
    ink(color, weight, name);
    const list = close ? pts.concat([pts[0]]) : pts;
    for (let i = 1; i < list.length; i++) brush.line(list[i - 1][0], list[i - 1][1], list[i][0], list[i][1]);
  }
  // irregular ink speckles (for grime, stars, dust)
  function speckle(x, y, w, h, seed, color, n, rmin = 1.5, rmax = 4, alpha = 200) {
    const r = MV.rnd(seed);
    push(); noStroke(); fill(css(color, alpha / 255));
    for (let i = 0; i < n; i++) circle(x + (r() - 0.5) * w, y + (r() - 0.5) * h, (rmin + r() * (rmax - rmin)) * 2);
    pop();
  }
  // soft radial glow (native p5, layered translucent circles; faint outward)
  function glow(x, y, r, color, alpha = 0.25, rings = 8) {
    push(); noStroke();
    for (let i = 1; i <= rings; i++) {
      const u = i / rings;
      fill(css(color, alpha * (1 - u) * 0.5));
      circle(x, y, r * 2 * u);
    }
    pop();
  }

  // ---------- paper / grain / vignette overlays ----------
  let grainBuf = null, vignetteBuf = null, textBuf = null, propBuf = null;

  function makeGrain(w, h) {
    const g = createGraphics(w, h, P2D);
    g.clear();
    const r = MV.rnd(20240929);
    g.noStroke();
    for (let i = 0; i < 26000; i++) {              // paper speckle
      const x = r() * w, y = r() * h, s = 0.6 + r() * 1.9;
      g.fill(120, 108, 92, 12 + r() * 26);
      g.ellipse(x, y, s, s);
    }
    for (let i = 0; i < 900; i++) {                // long fibres
      const x = r() * w, y = r() * h, a = r() * Math.PI, len = 20 + r() * 150;
      g.stroke(150, 138, 118, 10 + r() * 14); g.strokeWeight(0.7 + r() * 1.1);
      g.line(x, y, x + Math.cos(a) * len, y + Math.sin(a) * len);
    }
    return g;
  }
  function makeVignette(w, h) {
    const g = createGraphics(w, h, P2D);
    g.clear();
    const ctx = g.drawingContext;
    const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.65, 'rgba(120,96,72,0.05)');
    grad.addColorStop(1, 'rgba(84,62,44,0.22)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    return g;
  }
  function initBuffers(w, h) {
    grainBuf = makeGrain(w, h);
    vignetteBuf = makeVignette(w, h);
    textBuf = createGraphics(w, h, P2D);
    propBuf = createGraphics(w, h, P2D);
  }
  // composited with multiply so it darkens like paper grain
  function paper(alpha = 0.5) {
    if (!grainBuf) return;
    push(); blendMode(MULTIPLY); tint(255, 255 * alpha); noStroke(); imageMode(CENTER);
    image(grainBuf, 0, 0, width, height); pop();
    push(); noStroke(); imageMode(CENTER); image(vignetteBuf, 0, 0, width, height); pop();
  }
  // text buffers (2D ctx => system fonts / CJK work; WEBGL text() can't)
  const textLayer = () => textBuf;    // karaoke captions
  const propLayer = () => propBuf;    // scene titles / big sound effects
  function clearProp() { if (propBuf) { const c = propBuf.drawingContext; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, propBuf.width, propBuf.height); propBuf.resetMatrix?.(); } }
  /** full-screen flat black, drawn into the 2D overlay buffer so it lands on top of every paint layer.
   *  call from renderFrame after subtitles.draw() : MV.blackoutFill(MV.blackoutAlpha) */
  function blackoutFill(alpha) {
    if (!textBuf || !(alpha > 0)) return;
    const c = textBuf.drawingContext;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = clamp(alpha, 0, 1);
    c.fillStyle = '#000';
    c.fillRect(0, 0, textBuf.width, textBuf.height);
    c.globalAlpha = 1;
  }

  function presentText() {
    if (!textBuf) return;
    push(); blendMode(BLEND); noStroke(); tint(255, 255); imageMode(CENTER);
    image(propBuf, 0, 0, width, height);
    image(textBuf, 0, 0, width, height); pop();
  }

  // ---------- transitions ----------
  // Brush wipe band: a ragged painted swathe with a moving edge.
  //   mode 'in'  : paint grows from the left edge to the leading edge (covers)
  //   mode 'out' : paint fills from the leading edge to the right edge (reveals what is left of it)
  function wipeBand(p, color, seed = 7, mode = 'in', ragged = 130) {
    p = clamp(p, 0, 1);
    if (p <= 0 && mode === 'in') return;
    if (p <= 0 && mode === 'out') { wipeBand(1, color, seed, 'in', ragged); return; }
    const W = width, H = height, hw = W / 2, hh = H / 2;
    const edge = -hw - ragged + p * (W + ragged * 2);
    const r = MV.rnd(seed);
    const pts = [], N = 30;
    for (let i = 0; i <= N; i++) {
      const y = -hh - 12 + (H + 24) * (i / N);
      pts.push([edge + (r() - 0.5) * 2 * ragged + Math.sin(i * 1.7 + seed) * ragged * 0.4, y]);
    }
    if (mode === 'in') pts.push([-hw - 60, hh + 12], [-hw - 60, -hh - 12]);
    else pts.push([hw + 60, hh + 12], [hw + 60, -hh - 12]);
    flat(color, 255); brush.polygon(pts);
    // bristle streaks trailing the leading edge
    push(); noStroke();
    for (let i = 0; i < 16; i++) {
      const y = -hh + H * ((i + 0.5) / 16) + (r() - 0.5) * 24;
      const len = ragged * (0.5 + r() * 0.95);
      fill(css(color, 0.45));
      rect(mode === 'in' ? edge - len : edge, y - 1.5, len, 2 + r() * 4);
    }
    pop();
  }

  // text placed in scene space (goes into the prop buffer so it can ride the camera)
  function propText(str, x, y, o = {}) {
    if (!propBuf) return 0;
    const ctx = propBuf.drawingContext;
    const c = o.cam || { x: 0, y: 0, zoom: 1, rot: 0 };
    const z = c.zoom ?? 1, rot = c.rot ?? 0, cs = Math.cos(rot), sn = Math.sin(rot);
    const bx = 960 + (c.x || 0) + (x * cs - y * sn) * z;
    const by = 540 + (c.y || 0) + (x * sn + y * cs) * z;
    ctx.save();
    ctx.translate(bx, by);
    if (rot) ctx.rotate(rot);
    ctx.scale(z, z);
    ctx.font = o.font || '900 64px Georgia, "Times New Roman", serif';
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(str).width;
    if (o.outline !== false) {
      ctx.lineWidth = o.lineW ?? Math.max(5, (o.size || 64) * 0.14);
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.outlineColor || 'rgba(250,246,236,0.95)';
      ctx.strokeText(str, 0, 0);
    }
    ctx.fillStyle = o.color || '#2b2324';
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.fillText(str, 0, 0);
    ctx.restore();
    return w;
  }

  MV.PAL = PAL; MV.hex = hex; MV.css = css; MV.shade = shade; MV.centroid = centroid; MV.ext = ext; MV.growPts = growPts;
  MV.BUILTIN = BUILTIN; MV.wc = wc;
  MV.ink = ink; MV.flat = flat; MV.bloom = bloom; MV.hatch = hatch; MV.nostroke = nostroke;
  MV.shape = shape; MV.blob = blob; MV.rrect = rrect; MV.line = line; MV.polyline = polyline;
  MV.speckle = speckle; MV.glow = glow;
  MV.initBuffers = initBuffers; MV.paper = paper; MV.textLayer = textLayer; MV.propLayer = propLayer;
  MV.clearProp = clearProp; MV.presentText = presentText; MV.propText = propText;
  MV.blackoutFill = blackoutFill; MV.blackoutAlpha = 0;
  MV.wipeBand = wipeBand;
})();
