// src/paint.js — 水彩工具箱(全部确定性:凡随机皆 hash,凡纹理皆预烘焙)
// 世界坐标 = 画布左上角 (0,0)–(1920,1080);main.js 每帧先 translate(-960,-540) 再调用镜头代码。
window.MV = window.MV || {};

MV.paint = (function () {
  const T = MV.tl;
  const W = T.W, H = T.H;

  let paperG = null, grainG = null, vignetteG = null; // 预烘焙静态纹理(常量资源,非累积状态)
  // 笔触标定:opts.weight 一律按"世界像素宽"给,换算成 brush.set 的相对重量
  const BRUSH_K = 0.62;

  // ---------- 预烘焙纹理 ----------
  function bakePaper() {
    const g = createGraphics(W, H);
    const c = g.drawingContext;
    c.fillStyle = '#f3ebdc';
    c.fillRect(0, 0, W, H);
    // 大块水痕底色
    randomSeed(4242);
    for (let i = 0; i < 46; i++) {
      const x = random(W), y = random(H), r = 160 + random(520);
      const tint = random([['#efe4d0', 0.5], ['#f7f0e2', 0.5], ['#e9dcc6', 0.32], ['#f0e2cf', 0.3]]);
      c.fillStyle = tint[0];
      c.globalAlpha = tint[1];
      c.beginPath();
      c.ellipse(x, y, r, r * (0.5 + random(0.7)), random(TWO_PI), 0, TWO_PI);
      c.fill();
    }
    c.globalAlpha = 1;
    // 纸纹颗粒
    for (let i = 0; i < 26000; i++) {
      const x = random(W), y = random(H), l = random(3.2);
      c.fillStyle = random() < 0.5 ? 'rgba(120,96,72,0.05)' : 'rgba(255,250,238,0.09)';
      c.fillRect(x, y, l, l * (0.6 + random(1.2)));
    }
    // 纤维划痕
    c.strokeStyle = 'rgba(140,116,88,0.05)';
    for (let i = 0; i < 220; i++) {
      c.lineWidth = 0.6 + random(1.6);
      const x = random(W), y = random(H), a = random(TWO_PI), l = 40 + random(360);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + cos(a) * l, y + sin(a) * l); c.stroke();
    }
    return g;
  }

  function bakeGrain() {
    const g = createGraphics(512, 512);
    const c = g.drawingContext;
    randomSeed(777);
    for (let i = 0; i < 26000; i++) {
      const x = random(512), y = random(512);
      c.fillStyle = random() < 0.5 ? 'rgba(40,28,18,0.16)' : 'rgba(255,248,232,0.14)';
      c.fillRect(x, y, 1 + random(1.6), 1 + random(1.6));
    }
    return g;
  }

  function bakeVignette() {
    const g = createGraphics(W, H);
    const c = g.drawingContext;
    const gr = c.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 1.02);
    gr.addColorStop(0, 'rgba(30,18,12,0)');
    gr.addColorStop(1, 'rgba(30,18,12,0.34)');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
    return g;
  }

  function init() {
    if (!paperG) paperG = bakePaper();
    if (!grainG) grainG = bakeGrain();
    if (!vignetteG) vignetteG = bakeVignette();
  }

  // ---------- 基础变换 ----------
  // 相机:把世界点 (fx,fy) 放到画面中心并缩放 zoom、旋转 rot
  function cam(fx, fy, zoom, rot = 0) {
    translate(W / 2, H / 2);
    if (rot) rotate(rot);
    scale(zoom);
    translate(-fx, -fy);
  }

  // ---------- 形状工具 ----------
  const jit = (pts, j, seed) => pts.map((p, i) => [
    p[0] + (T.h2(seed, i * 2) - 0.5) * 2 * j,
    p[1] + (T.h2(seed, i * 2 + 1) - 0.5) * 2 * j
  ]);

  // 水彩色块:多层抖动多边形平涂叠出洇染感;alpha 为每层不透明度(0-255)
  // 注意:遮挡必须用 p5 原生填充(不透明);brush.wash 是正片叠底,
  // 会把后面的深色细节透出来,只用作自身表面的水彩深浅纹理。
  function rgba(hex, a) {
    let h = (hex || '#888888').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${(a / 255).toFixed(3)})`;
  }

  function blob(pts, color, alpha = 60, opts = {}) {
    const layers = opts.layers || 3, j = opts.jitter === undefined ? 7 : opts.jitter;
    const seed = opts.seed || 1;
    const grow = opts.grow === undefined ? 1.6 : opts.grow;
    push();
    noStroke();
    for (let l = layers - 1; l >= 0; l--) {
      const p2 = jit(pts.map(p => [p[0], p[1]]), j * (1 + l * grow), seed + l * 17);
      const a = alpha * (opts.fade === undefined ? 1 : Math.pow(opts.fade, l));
      fill(rgba(color, a));
      beginShape();
      for (const [x, y] of p2) vertex(x, y);
      endShape(CLOSE);
    }
    // 表面水彩纹理:同色 wash 叠一层(正片叠底叠在自身上,只加深不透底)
    if (alpha > 24) {
      push();
      randomSeed(seed * 31 + 97);
      brush.noStroke(); brush.noFill(); brush.noHatch(); brush.noMass(); brush.noField();
      brush.wash(color, alpha * 0.2);
      brush.polygon(pts);
      brush.noWash();
      pop();
    }
    pop();
  }

  function ellipseBlob(cx, cy, rx, ry, color, alpha = 60, opts = {}) {
    const n = opts.n || 22, pts = [];
    const wob = opts.wobble === undefined ? 0.06 : opts.wobble;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TWO_PI;
      const r = 1 + (T.h2((opts.seed || 3) + 5, i) - 0.5) * 2 * wob + sin(a * 3 + (opts.seed || 3)) * wob * 0.5;
      pts.push([cx + cos(a) * rx * r, cy + sin(a) * ry * r]);
    }
    blob(pts, color, alpha, opts);
    return pts;
  }

  // 圆角矩形点列(round 0..1 相对短边)
  function roundRectPts(x, y, w, h, round = 0.22, n = 6) {
    const r = Math.min(w, h) * round;
    const pts = [];
    const corner = (cx, cy, a0, a1) => { for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); pts.push([cx + cos(a) * r, cy + sin(a) * r]); } };
    corner(x + w - r, y + r, -HALF_PI, 0);
    corner(x + w - r, y + h - r, 0, HALF_PI);
    corner(x + r, y + h - r, HALF_PI, PI);
    corner(x + r, y + r, PI, PI + HALF_PI);
    return pts;
  }

  // ---------- 笔触 ----------
  function withInk(opts, fn) {
    push();
    randomSeed((opts.seed || 2) * 13 + 7);
    brush.set(opts.brush || 'pen', opts.color || '#2a2320', (opts.weight === undefined ? 2.2 : opts.weight) * BRUSH_K);
    brush.noFill(); brush.noWash(); brush.noHatch(); brush.noMass();
    if (opts.field) brush.field(opts.field); else brush.noField();
    fn();
    brush.noStroke();
    pop();
  }

  // 折线笔触(pts: [[x,y],...];jitter 加抖,curvature 用于 spline)
  function stroke(pts, opts = {}) {
    if (pts.length < 2) return;
    withInk(opts, () => {
      const jp = jit(pts, opts.jitter === undefined ? 2.2 : opts.jitter, (opts.seed || 2) + 3);
      if (opts.spline !== false && jp.length >= 3) {
        brush.spline(jp.map((p, i) => [p[0], p[1], opts.pressure ? opts.pressure(i / (jp.length - 1)) : 0.7]), opts.curvature === undefined ? 0.5 : opts.curvature);
      } else {
        for (let i = 1; i < jp.length; i++) brush.line(jp[i - 1][0], jp[i - 1][1], jp[i][0], jp[i][1]);
      }
    });
  }

  // 闭合轮廓描边
  function outline(pts, opts = {}) {
    const closed = pts.concat([pts[0], pts[1]]);
    stroke(closed, opts);
  }

  // 潦草乱线(头发/阴影/涂抹)
  function scribble(cx, cy, rx, ry, n, opts = {}) {
    const seed = opts.seed || 9;
    withInk(opts, () => {
      for (let i = 0; i < n; i++) {
        const a0 = T.h2(seed, i) * TWO_PI, a1 = a0 + 0.6 + T.h2(seed + 1, i) * 1.8;
        const r0 = 0.4 + T.h2(seed + 2, i) * 0.8;
        const p = [];
        for (let k = 0; k <= 5; k++) {
          const a = a0 + (a1 - a0) * (k / 5);
          const r = r0 * (0.75 + 0.45 * T.h2(seed + 3, i * 7 + k));
          p.push([cx + cos(a) * rx * r, cy + sin(a) * ry * r]);
        }
        brush.spline(p, 0.5);
      }
    });
  }

  // 排线阴影
  function hatch(pts, dist, angle, opts = {}) {
    push();
    randomSeed((opts.seed || 4) * 17 + 3);
    brush.noStroke(); brush.noWash(); brush.noFill(); brush.noMass(); brush.noField();
    brush.hatchStyle(opts.brush || 'pen', opts.color || '#2a2320', (opts.weight === undefined ? 1.6 : opts.weight) * BRUSH_K);
    brush.hatch(dist, angle, opts.options || { density: 1, gibson: 0.02, mincut: 5, maxcut: 200, jitter: 0.4, individual: false });
    brush.polygon(pts);
    brush.noHatch();
    pop();
  }

  // ---------- 小元素 ----------
  function dot(cx, cy, r, color, alpha = 255, seed = 5) {
    ellipseBlob(cx, cy, r, r * (0.9 + 0.2 * T.h1(seed)), color, alpha, { layers: 2, jitter: r * 0.12, seed, n: 10, wobble: 0.1 });
  }

  function splat(cx, cy, r, n, color, seed = 11, alpha = 200) {
    for (let i = 0; i < n; i++) {
      const a = T.h2(seed, i) * TWO_PI, d = Math.pow(T.h2(seed + 1, i), 0.6) * r;
      const s = 1.5 + T.h2(seed + 2, i) * 7;
      dot(cx + cos(a) * d, cy + sin(a) * d, s, color, alpha * (0.5 + T.h2(seed + 3, i) * 0.5), seed * 7 + i);
    }
  }

  function glow(cx, cy, r, color, alpha = 26, layers = 5) {
    for (let i = layers; i >= 1; i--) {
      const k = i / layers;
      ellipseBlob(cx, cy, r * k, r * k, color, alpha * (1.2 - k * 0.5), {
        layers: 1, jitter: r * 0.05, seed: 21 + i, n: 20, wobble: 0.12
      });
    }
  }

  // ---------- 手绘文字 ----------
  // p5 2.x 的 WEBGL text() 只认 loadFont 载入的字体,系统字体串画不出来;
  // 因此文字一律在 2D 离屏画布上逐字抖动烘焙成纹理,再贴进 WEBGL 场景(静态资源,固定 seed)。
  const textCache = new Map();
  function textTexture(str, size, opts = {}) {
    const font = `${opts.bold === false ? '' : '700 '}${size}px ${opts.font || 'Georgia, "Times New Roman", serif'}`;
    const key = str + '|' + size + '|' + (opts.color || '') + '|' + (opts.seed || 31) + '|' + font;
    if (textCache.has(key)) return textCache.get(key);
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = font;
    const widths = str.split('').map(ch => meas.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0);
    const pad = size * 0.55;
    const g = createGraphics(Math.ceil(total + pad * 2), Math.ceil(size * 1.9));
    const c = g.drawingContext;
    c.font = font;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    const seed = opts.seed || 31;
    let x = pad;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const jy = (T.h2(seed, i) - 0.5) * (opts.jitter === undefined ? size * 0.08 : opts.jitter);
      const jr = (T.h2(seed + 1, i) - 0.5) * (opts.rot === undefined ? 0.06 : opts.rot);
      c.save();
      c.translate(x + widths[i] / 2, g.height / 2 + jy);
      c.rotate(jr);
      if (opts.shadow) {
        c.fillStyle = opts.shadow;
        c.fillText(ch, opts.shadowOff || size * 0.05, opts.shadowOff || size * 0.05);
      }
      c.fillStyle = opts.color || '#2a2320';
      c.fillText(ch, -widths[i] / 2, 0);
      c.restore();
      x += widths[i];
    }
    const tex = { g, w: g.width, h: g.height };
    textCache.set(key, tex);
    return tex;
  }

  function drawTexture(tex, x, y, k = 1, rot = 0) {
    push();
    translate(x, y);
    if (rot) rotate(rot);
    scale(k);
    image(tex.g, -tex.w / 2, -tex.h / 2, tex.w, tex.h);
    pop();
  }

  function textPainted(str, x, y, size, opts = {}) {
    const tex = textTexture(str, size, opts);
    drawTexture(tex, x, y - size * 0.34, opts.scale || 1, opts.tilt || 0);
  }

  // ---------- 2D 层后期 ----------
  function grainOverlay(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    const p = grainG.canvas || grainG;
    for (let y = 0; y < H; y += 512) for (let x = 0; x < W; x += 512) ctx.drawImage(p, x, y);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(vignetteG.canvas || vignetteG, 0, 0);
    ctx.restore();
  }

  // 纸底(每帧先画,覆盖全画布;WEBGL 原点在中心)
  function paperBase(tint, tintAlpha = 0) {
    image(paperG, -W / 2, -H / 2, W, H);
    if (tint && tintAlpha > 0) {
      push();
      brush.noStroke(); brush.noFill(); brush.noHatch(); brush.noMass(); brush.noField();
      brush.wash(tint, tintAlpha);
      brush.polygon([[0, 0], [W, 0], [W, H], [0, H]]);
      brush.noWash();
      pop();
    }
  }

  // 涂抹式擦除过渡用的"漆带":从右侧盖过来 / 退回去,leading=带头的一侧
  function paintBand(progress, color, opts = {}) {
    const p = T.clamp(progress);
    const jag = opts.jag === undefined ? 120 : opts.jag;
    const seed = opts.seed || 55;
    const edge = W * (1 - p);
    const pts = [[W + 200, -120], [edge, -120]];
    for (let i = 0; i <= 12; i++) {
      const y = -120 + (H + 240) * (i / 12);
      pts.push([edge + (T.h2(seed, i) - 0.5) * jag * 2 - jag * (opts.shade || 0.6), y]);
    }
    pts.push([W + 200, H + 120]);
    blob(pts, color, 255, { layers: 2, jitter: 26, seed, grow: 0.5 });
    // 拖尾笔毛
    for (let i = 0; i < 9; i++) {
      const y = T.h2(seed + 3, i) * H;
      const x0 = edge + (T.h2(seed + 4, i) - 0.3) * jag;
      stroke([[x0, y], [x0 - 80 - T.h2(seed + 5, i) * 260, y + (T.h2(seed + 6, i) - 0.5) * 70]], {
        color, weight: 3 + T.h2(seed + 7, i) * 5, brush: 'pen', seed: seed + i, jitter: 6
      });
    }
  }

  return {
    init, cam, jit, blob, ellipseBlob, roundRectPts, withInk, stroke, outline,
    scribble, hatch, dot, splat, glow, textPainted, textTexture, drawTexture, grainOverlay, paperBase, paintBand,
    get paper() { return paperG; }
  };
})();
