// main.js — bootstrap, render contract (renderAt/renderSheet), paper compose, karaoke subs
'use strict';
/* global W,H,RNG,SCENES,LYRICS,hash32,drawSubsBar */
const SNAP_LAG = 3; // rAF ticks to wait after drawing before capturing

let P = null;
const st = { tick: 0, pendingT: null, renderedTick: -1, lastT: -1 };
const outCv = document.getElementById('out');
const octx = outCv.getContext('2d');
let paperCv = null;

// ---------- paper texture (built once, deterministic) ----------
function buildPaper() {
  paperCv = document.createElement('canvas');
  paperCv.width = W; paperCv.height = H;
  const c = paperCv.getContext('2d');
  let a = 987654321 >>> 0;
  const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  // vignette (white center → warm grey edges; used with 'multiply')
  const g = c.createRadialGradient(W / 2, H / 2 - 60, H * 0.35, W / 2, H / 2, H * 0.85);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.72, '#f2ede1');
  g.addColorStop(1, '#cfc4ae');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // grain
  for (let i = 0; i < 26000; i++) {
    const x = rnd() * W, y = rnd() * H, v = rnd();
    c.fillStyle = v < 0.5 ? `rgba(120,100,70,${0.028 + v * 0.05})` : `rgba(255,255,255,${0.03 + (v - 0.5) * 0.06})`;
    c.fillRect(x, y, 1 + (v > 0.93 ? 1 : 0), 1);
  }
  // fibers
  c.lineWidth = 1;
  for (let i = 0; i < 900; i++) {
    const x = rnd() * W, y = rnd() * H, ang = rnd() * Math.PI, len = 6 + rnd() * 22;
    c.strokeStyle = `rgba(140,120,90,${0.025 + rnd() * 0.03})`;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); c.stroke();
  }
  // a few darker blotches for handmade feel
  for (let i = 0; i < 26; i++) {
    const x = rnd() * W, y = rnd() * H, r = 30 + rnd() * 120;
    const rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(150,130,100,0.045)'); rg.addColorStop(1, 'rgba(150,130,100,0)');
    c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
}

// ---------- scene dispatch ----------
function pickScene(t) {
  for (const s of SCENES) if (t >= s.t0 && t < s.t1) return s;
  return SCENES[SCENES.length - 1];
}
let TEST = false;
window.testPattern = v => { TEST = v; };
window.dbgDraw = fn => { DBG = fn; };
let DBG = null;
function renderFrame(t) {
  const seed = hash32(Math.round(t * 1000));
  P.randomSeed(seed); P.noiseSeed(seed);
  P.push();
  P.translate(-W / 2, -H / 2); // draw in top-left coordinates
  P.background('#efe6d2');
  if (TEST) {
    P.noStroke();
    for (let gx = 0; gx <= W; gx += 100) {
      P.fill(gx % 500 === 0 ? '#ff0000' : '#000000');
      P.rect(gx - (gx % 500 === 0 ? 4 : 1), 0, gx % 500 === 0 ? 8 : 2, H);
    }
    for (let gy = 0; gy <= H; gy += 100) {
      P.fill(gy % 500 === 0 ? '#ff0000' : '#000000');
      P.rect(0, gy - (gy % 500 === 0 ? 4 : 1), W, gy % 500 === 0 ? 8 : 2);
    }
    P.fill('#00c000'); P.rect(0, 0, 300, 300);
    P.fill('#0090ff'); P.rect(W - 300, H - 300, 300, 300);
    P.fill('#ff00ff'); P.rect(W / 2 - 150, H / 2 - 150, 300, 300);
    // beginShape quad — suspected half-scale bug
    P.fill(withA('#4040a0', 0.5));
    P.beginShape();
    P.vertex(-40, -40); P.vertex(1960, -40); P.vertex(1960, 1120); P.vertex(-40, 1120);
    P.endShape(P.CLOSE);
    P.pop();
    return;
  }
  const scene = pickScene(t);
  const rng = RNG(t, scene.id);
  if (DBG) { DBG(t, rng); P.pop(); return; }
  scene.draw(t, rng);
  P.pop();
}

// ---------- compose: blit GL canvas → out, paper multiply, karaoke subs ----------
function compose(t) {
  octx.globalCompositeOperation = 'source-over';
  octx.globalAlpha = 1;
  octx.drawImage(P.canvas, 0, 0, W, H);
  if (paperCv) {
    octx.globalCompositeOperation = 'multiply';
    octx.drawImage(paperCv, 0, 0);
    octx.globalCompositeOperation = 'source-over';
  }
  drawSubsBar(octx, t);
}

// ---------- render contract ----------
function waitTicks(n) {
  return new Promise(res => {
    let k = 0;
    const step = () => { if (++k >= n) res(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}
window.renderAt = async function (t, type = 'image/jpeg', q = 0.92) {
  const myTick = st.tick + 1;
  st.pendingT = t;
  await waitTicks(SNAP_LAG + 1);
  if (st.renderedTick < myTick) throw new Error('frame not rendered');
  compose(t);
  return outCv.toDataURL(type, q);
};
window.renderSheet = async function (times, cols = 3, w = 640) {
  const h = Math.round(w * 9 / 16), gap = 4;
  const rows = Math.ceil(times.length / cols);
  const sheet = document.createElement('canvas');
  sheet.width = cols * (w + gap) + gap; sheet.height = rows * (h + gap) + gap;
  const sctx = sheet.getContext('2d');
  sctx.fillStyle = '#20242c'; sctx.fillRect(0, 0, sheet.width, sheet.height);
  const ms = [];
  for (let i = 0; i < times.length; i++) {
    const t0 = performance.now();
    await window.renderAt(times[i], 'image/jpeg', 0.9);
    ms.push(Math.round(performance.now() - t0));
    const cx = (i % cols), cy = Math.floor(i / cols);
    sctx.font = 'bold 22px monospace'; sctx.fillStyle = '#ffd866';
    sctx.fillText(times[i].toFixed(2) + 's', cx * (w + gap) + gap + 6, cy * (h + gap) + gap + 24);
    sctx.drawImage(outCv, cx * (w + gap) + gap, cy * (h + gap) + gap, w, h);
  }
  return { url: sheet.toDataURL('image/jpeg', 0.9), ms };
};
window.gpuInfo = function () {
  try {
    const gl = P.canvas.getContext('webgl2') || P.canvas.getContext('webgl');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown';
  } catch (e) { return 'err:' + e.message; }
};

// ---------- boot ----------
const sketch = p => {
  P = p;
  brush.instance(p);
  p.setup = () => {
    p.createCanvas(W, H, p.WEBGL);
    p.setAttributes({ preserveDrawingBuffer: true, antialias: true });
    p.pixelDensity(1);
    p.randomSeed(7); p.noiseSeed(7);
    brush.scaleBrushes(7);
    buildPaper();
    p.frameRate(60);
    window.ready = true;
  };
  p.draw = () => {
    st.tick++;
    if (st.pendingT != null) {
      const t = st.pendingT;
      st.pendingT = null;
      try { renderFrame(t); } catch (e) { console.error('renderFrame', t, e); }
      st.renderedTick = st.tick;
      st.lastT = t;
    }
  };
};
new p5(sketch);
