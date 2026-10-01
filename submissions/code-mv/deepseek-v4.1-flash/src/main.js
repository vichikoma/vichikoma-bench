// src/main.js — sketch entry: canvas, deterministic frame rendering, render contract.
(function () {
  const MV = window.MV;
  const W = 1920, H = 1080;

  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
  const waitFrames = async (n) => { for (let i = 0; i < n; i++) await raf(); };

  function shotList() {
    return Object.values(MV.shots).sort((a, b) => a.a - b.a);
  }
  function shotAt(t) {
    const L = shotList();
    for (const s of L) if (t >= s.a - 1e-6 && t < s.b) return s;
    return t < L[0].a ? L[0] : L[L.length - 1];
  }

  // ---- one frame: pure function of t -------------------------------------
  function renderFrame(t) {
    const tag = Math.round(t * 1000);
    randomSeed(1000 + tag);
    noiseSeed(7000 + tag);
    MV.clearProp();
    MV.TIME = t;
    MV.hideCaptions = false;
    MV.blackoutAlpha = 0;
    try { shotAt(t).draw(t); }
    catch (e) { console.error('SHOT ERROR @ t=' + t.toFixed(2) + ' stage=' + MV.__stage + ' :: ' + e.message + ' || ' + String(e.stack || '').split('\n').slice(1, 5).join(' | ')); }
    MV.paper(0.55);                 // paper grain + vignette over the paint
    MV.subtitles.draw(t, { hide: MV.hideCaptions });   // karaoke captions on top
    MV.blackoutFill(MV.blackoutAlpha);                 // fade-to-black overlay (2D layer, above the paint)
    MV.presentText();
    MV.FRAME_DRAWS = (MV.FRAME_DRAWS || 0) + 1;
  }

  window.setup = function () {
    const stale = document.getElementById('out');
    if (stale) stale.remove();
    const c = createCanvas(W, H, WEBGL);
    c.elt.id = 'out';
    pixelDensity(1);
    setAttributes('preserveDrawingBuffer', true);
    brush.load();
    brush.scaleBrushes(3);
    MV.SCALE = 3;
    MV.initBuffers(W, H);
    if (location.search.includes('dbg')) {
      const OCs = window.OffscreenCanvas;
      if (OCs) {
        window.OffscreenCanvas = function (w, h) {
          if (!(w > 0) || !(h > 0) || !isFinite(w) || !isFinite(h)) console.error('BAD OffscreenCanvas(' + w + ',' + h + ')');
          return new OCs(Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
        };
        window.OffscreenCanvas.prototype = OCs.prototype;
      }
      const clip = (a) => { try { const s = JSON.stringify(a); return s.length > 160 ? s.slice(0, 160) + '…' : s; } catch (e) { return '?'; } };
      const hasNaN = (v, d = 0) => {
        if (d > 4 || v == null) return false;
        if (typeof v === 'number') return !isFinite(v);
        if (Array.isArray(v)) return v.some(x => hasNaN(x, d + 1));
        return false;
      };
      for (const k of ['line', 'polygon', 'circle', 'rect', 'arc', 'wash', 'fill', 'stroke', 'hatch', 'set', 'mass', 'bleed', 'fillTexture', 'fillBleed', 'spray', 'wiggle', 'field', 'noField', 'noStroke', 'noFill', 'noWash', 'noHatch', 'noClip', 'clip']) {
        const f = brush[k];
        if (typeof f !== 'function') continue;
        brush[k] = (...a) => {
          if (hasNaN(a)) console.error('BRUSH-NAN.' + k + '(' + clip(a) + ') || ' + String(new Error().stack || '').split('\n').slice(2, 5).join(' | '));
          try { return f.apply(brush, a); } catch (e) { console.error('BRUSH.' + k + '(' + clip(a) + ') :: ' + e.message + ' || ' + String(e.stack || '').split('\n').slice(0, 5).join(' | ')); throw e; }
        };
      }
    }
    MV.TIME = 0;
    noLoop();
    window.ready = true;
  };

  window.draw = function () { renderFrame(MV.TIME || 0); };

  // ---- render contract ---------------------------------------------------
  window.renderAt = async function (t, type = 'image/png', q) {
    MV.TIME = t;
    redraw();
    await waitFrames(3);            // brush strokes land in the drawing buffer on later frames
    return document.getElementById('out').toDataURL(type, q);
  };

  window.renderSheet = async function (times, cols = 3, w = 640) {
    const cw = w, ch = Math.round(w * H / W);
    const rows = Math.ceil(times.length / cols);
    const sheet = document.createElement('canvas');
    sheet.width = cw * cols; sheet.height = ch * rows;
    const g = sheet.getContext('2d');
    g.fillStyle = '#2a2630'; g.fillRect(0, 0, sheet.width, sheet.height);
    const ms = [];
    g.textBaseline = 'top';
    for (let i = 0; i < times.length; i++) {
      const t0 = performance.now();
      await window.renderAt(times[i], 'image/png');
      const el = document.getElementById('out');
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      g.drawImage(el, x, y, cw, ch);
      ms.push(Math.round(performance.now() - t0));
      g.font = '600 15px system-ui, sans-serif';
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x + 4, y + 4, 72, 20);
      g.fillStyle = '#fff'; g.fillText(times[i].toFixed(2) + 's', x + 9, y + 7);
    }
    return { url: sheet.toDataURL('image/jpeg', 0.92), ms };
  };

  window.gpuInfo = function () {
    try {
      const gl = document.getElementById('out').getContext('webgl2');
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'no-debug-info';
    } catch (e) { return 'error: ' + e.message; }
  };

  MV.renderFrame = renderFrame;
  MV.shotAt = shotAt;
})();
