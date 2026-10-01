// src/main.js — 渲染管线入口:p5 WEBGL 画笔层 → #out 2D 合成层(字幕/颗粒)
// 硬性契约:
//   window.ready = true                       页面就绪
//   window.renderAt(t, type, q) → Promise     t 时刻完整一帧(1920×1080,含背景)的 dataURL
//   window.renderSheet(times, cols, w)        多时刻接触表 {url, ms}
// 每帧都是 t 的纯函数:固定 seed、无随机、无跨帧累积状态(静态纹理为固定 seed 预烘焙)。
window.MV = window.MV || {};

(function () {
  const T = MV.tl;
  let p5canvas = null, out = null, outCtx = null;
  let currentT = 0;

  function setup() {
    const r = createCanvas(T.W, T.H, WEBGL);
    p5canvas = r.canvas || r;
    p5canvas.style.display = 'none';        // 笔刷层不可见,#out 才是输出
    pixelDensity(1);
    setAttributes('preserveDrawingBuffer', true);
    brush.scaleBrushes(3);
    noLoop();
    MV.paint.init();

    out = document.getElementById('out');
    outCtx = out.getContext('2d');

    window.renderAt = async (t, type, q) => {
      currentT = t;
      await redraw();                        // 画完整一帧(p5.brush 墨迹在 redraw 返回时已落盘)
      composite(t);
      return out.toDataURL(type || 'image/jpeg', q === undefined ? 0.92 : q);
    };

    window.renderSheet = async (times, cols, w) => {
      const cellW = w, cellH = Math.round(w * T.H / T.W);
      const rows = Math.ceil(times.length / cols);
      const sheet = document.createElement('canvas');
      sheet.width = cols * cellW; sheet.height = rows * cellH;
      const sctx = sheet.getContext('2d');
      sctx.fillStyle = '#15121a'; sctx.fillRect(0, 0, sheet.width, sheet.height);
      const ms = [];
      for (let i = 0; i < times.length; i++) {
        const t0 = performance.now();
        currentT = times[i];
        await redraw();
        composite(times[i]);
        sctx.drawImage(out, (i % cols) * cellW, Math.floor(i / cols) * cellH, cellW, cellH);
        ms.push(Math.round(performance.now() - t0));
      }
      return { url: sheet.toDataURL('image/jpeg', 0.86), ms };
    };

    window.gpuInfo = () => {
      try {
        const gl = p5canvas.getContext('webgl2') || p5canvas.getContext('webgl');
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'webgl';
      } catch (e) { return 'n/a'; }
    };

    window.ready = true;
  }

  function draw() {
    MV.paint.paperBase();
    push();
    translate(-T.W / 2, -T.H / 2);           // 世界坐标 = 左上角原点
    MV.scenes.draw(currentT);
    pop();
  }

  function composite(t) {
    outCtx.drawImage(p5canvas, 0, 0, T.W, T.H);
    MV.subs.draw(outCtx, t);
    MV.paint.grainOverlay(outCtx);
  }

  window.setup = setup;
  window.draw = draw;
})();
