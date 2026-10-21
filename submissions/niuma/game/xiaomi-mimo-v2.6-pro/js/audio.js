/* ============================================================================
 * audio.js —— 全部声音均用 WebAudio 在运行时合成（无任何音频文件/外部资源）
 *  - SFX：种植/铲除/发射/命中/爆炸/警告/收集/年假/跳跃/入槽/胜利/失败/拒绝…
 *  - BGM：112 BPM、8 小节循环（方波贝斯 + 三角波和弦 + 主旋律 + 鼓点），
 *         音序按 step 取模循环，包络在小节边界前收尾 → 循环处无缝、无咔哒。
 * ==========================================================================*/
(function (global) {
  'use strict';

  var ctx = null;
  var master = null, sfxBus = null, bgmBus = null;
  var noiseBuf = null;
  var muted = false;
  var bgmRunning = false;
  var timerId = null;
  var nextNoteTime = 0;
  var currentStep = 0;

  var BPM = 112;
  var STEP = 60 / BPM / 4;          // 十六分音符时长
  var TOTAL_STEPS = 128;            // 8 小节 × 16
  var LOOKAHEAD = 0.12;             // 前瞻排程（秒）

  function init() {
    if (ctx) return;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 1.0;
    sfxBus.connect(master);
    bgmBus = ctx.createGain();
    bgmBus.gain.value = 0.32;
    bgmBus.connect(master);

    // 预生成白噪声缓冲
    var len = ctx.sampleRate * 1.2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }

  function resume() {
    init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  /* ---------------- 基础合成工具 ---------------- */
  function tone(o) {
    // o: {t, freq, dur, type, gain, glideTo, attack, bus, filter, detune}
    if (!ctx) return;
    var t0 = o.t != null ? o.t : now();
    var osc = ctx.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.glideTo), t0 + o.dur);
    if (o.detune) osc.detune.value = o.detune;
    var g = ctx.createGain();
    var atk = o.attack != null ? o.attack : 0.005;
    var peak = o.gain != null ? o.gain : 0.3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    var node = osc;
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.value = o.filter.freq || 1200;
      f.Q.value = o.filter.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.bus || sfxBus);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.03);
  }

  function noise(o) {
    // o: {t, dur, gain, type, freq, q, glideTo, bus}
    if (!ctx || !noiseBuf) return;
    var t0 = o.t != null ? o.t : now();
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1000, t0);
    if (o.glideTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.glideTo), t0 + o.dur);
    f.Q.value = o.q != null ? o.q : 1;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(o.gain != null ? o.gain : 0.25, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);
    src.connect(f); f.connect(g); g.connect(o.bus || sfxBus);
    src.start(t0);
    src.stop(t0 + o.dur + 0.03);
  }

  /* ---------------- 音效清单 ---------------- */
  var sfxTable = {
    // 种植 / 布置：木质「咚」+ 上扬
    plant: function () {
      var t = now();
      tone({ t: t, freq: 180, glideTo: 320, dur: 0.12, type: 'triangle', gain: 0.32 });
      tone({ t: t + 0.03, freq: 520, glideTo: 760, dur: 0.10, type: 'square', gain: 0.12 });
      noise({ t: t, dur: 0.08, freq: 900, gain: 0.10 });
    },
    // 铲除：噪声「唰」+ 碎片叮
    shovel: function () {
      var t = now();
      noise({ t: t, dur: 0.22, freq: 2600, glideTo: 320, gain: 0.30, q: 1.4 });
      tone({ t: t + 0.12, freq: 1400, glideTo: 700, dur: 0.12, type: 'triangle', gain: 0.14 });
    },
    // 发射：DDL 炮（低沉砰）
    shoot: function () {
      var t = now();
      tone({ t: t, freq: 150, glideTo: 70, dur: 0.13, type: 'square', gain: 0.22 });
      noise({ t: t, dur: 0.07, freq: 700, gain: 0.13 });
    },
    // 发射：鱼缸水花（滤波噪声）
    water: function () {
      var t = now();
      noise({ t: t, dur: 0.18, freq: 2200, glideTo: 900, gain: 0.16, q: 2.2 });
      tone({ t: t, freq: 700, glideTo: 420, dur: 0.10, type: 'sine', gain: 0.10 });
    },
    // 发射：HR 约谈（冷静提示音）
    hr: function () {
      var t = now();
      tone({ t: t, freq: 660, dur: 0.08, type: 'triangle', gain: 0.16 });
      tone({ t: t + 0.09, freq: 520, glideTo: 380, dur: 0.18, type: 'triangle', gain: 0.15 });
    },
    // 命中
    hit: function () {
      var t = now();
      noise({ t: t, dur: 0.055, freq: 1800, gain: 0.14, q: 1.2 });
      tone({ t: t, freq: 320, glideTo: 200, dur: 0.05, type: 'square', gain: 0.10 });
    },
    // 敌人啃咬
    bite: function () {
      var t = now();
      noise({ t: t, dur: 0.05, freq: 620, gain: 0.12, q: 1.6 });
      tone({ t: t, freq: 240, glideTo: 150, dur: 0.06, type: 'sawtooth', gain: 0.07 });
    },
    // 爆炸（辞职信 / 假装在忙）
    explode: function () {
      var t = now();
      tone({ t: t, freq: 220, glideTo: 45, dur: 0.55, type: 'sawtooth', gain: 0.30 });
      noise({ t: t, dur: 0.5, freq: 1400, glideTo: 180, gain: 0.32, q: 0.8 });
      noise({ t: t + 0.06, dur: 0.35, freq: 400, glideTo: 90, gain: 0.22, q: 0.7 });
    },
    // 大波警告：双音警报
    warn: function () {
      var t = now();
      for (var i = 0; i < 3; i++) {
        tone({ t: t + i * 0.30, freq: 560, glideTo: 880, dur: 0.26, type: 'square', gain: 0.22 });
        tone({ t: t + i * 0.30, freq: 280, glideTo: 440, dur: 0.26, type: 'square', gain: 0.12 });
      }
    },
    // 收集咖啡因：上行「叮咚」
    collect: function () {
      var t = now();
      tone({ t: t, freq: 784, dur: 0.09, type: 'sine', gain: 0.22 });
      tone({ t: t + 0.075, freq: 1175, dur: 0.16, type: 'sine', gain: 0.22 });
    },
    // 咖啡机产出
    brew: function () {
      var t = now();
      tone({ t: t, freq: 420, glideTo: 620, dur: 0.12, type: 'triangle', gain: 0.14 });
      noise({ t: t, dur: 0.16, freq: 3200, glideTo: 1400, gain: 0.07, q: 2 });
    },
    // 年假触发：上行琶音
    leave: function () {
      var t = now();
      var seq = [523, 659, 784, 1047, 1319];
      for (var i = 0; i < seq.length; i++) {
        tone({ t: t + i * 0.085, freq: seq[i], dur: 0.32, type: 'triangle', gain: 0.22 });
      }
      tone({ t: t + 0.42, freq: 1568, dur: 0.5, type: 'sine', gain: 0.18 });
    },
    // 敌人缩小入槽
    slot: function () {
      var t = now();
      tone({ t: t, freq: 520, glideTo: 180, dur: 0.16, type: 'square', gain: 0.16 });
      noise({ t: t + 0.12, dur: 0.06, freq: 2400, gain: 0.10 });
    },
    // 临时会议跳跃
    jump: function () {
      var t = now();
      tone({ t: t, freq: 300, glideTo: 900, dur: 0.22, type: 'square', gain: 0.16 });
    },
    // 老板出场 / 失败低鸣
    boss: function () {
      var t = now();
      tone({ t: t, freq: 110, glideTo: 70, dur: 0.9, type: 'sawtooth', gain: 0.26 });
      tone({ t: t, freq: 82, glideTo: 55, dur: 1.1, type: 'square', gain: 0.18 });
    },
    // 拒绝放置
    reject: function () {
      var t = now();
      tone({ t: t, freq: 190, dur: 0.10, type: 'square', gain: 0.18 });
      tone({ t: t + 0.10, freq: 140, dur: 0.16, type: 'square', gain: 0.18 });
    },
    // UI 点击
    ui: function () {
      tone({ freq: 880, dur: 0.055, type: 'triangle', gain: 0.12 });
    },
    // 胜利：大调上行琶音
    win: function () {
      var t = now();
      var seq = [523, 659, 784, 1047, 1319, 1568];
      for (var i = 0; i < seq.length; i++) {
        tone({ t: t + i * 0.13, freq: seq[i], dur: 0.45, type: 'triangle', gain: 0.24 });
        tone({ t: t + i * 0.13, freq: seq[i] / 2, dur: 0.45, type: 'square', gain: 0.10 });
      }
      tone({ t: t + 0.82, freq: 1047, dur: 1.1, type: 'triangle', gain: 0.24 });
    },
    // 失败：小调下行 + 低频闷响
    lose: function () {
      var t = now();
      var seq = [523, 466, 415, 349, 294, 233];
      for (var i = 0; i < seq.length; i++) {
        tone({ t: t + i * 0.19, freq: seq[i], dur: 0.5, type: 'sawtooth', gain: 0.18,
               filter: { type: 'lowpass', freq: 1600 } });
      }
      tone({ t: t + 1.15, freq: 98, glideTo: 55, dur: 1.4, type: 'sawtooth', gain: 0.28 });
      noise({ t: t + 1.15, dur: 1.2, freq: 300, glideTo: 70, gain: 0.18, q: 0.8 });
    }
  };

  function sfx(name) {
    if (!ctx || muted) return;
    var fn = sfxTable[name];
    if (fn) fn();
  }

  /* ---------------- BGM：8 小节无缝循环 ---------------- */
  // 和弦进行 I – vi – IV – V（打工进行），每小节一个和弦
  var BARS = [
    { root: 48, triad: [60, 64, 67] },   // C
    { root: 45, triad: [57, 60, 64] },   // Am
    { root: 41, triad: [53, 57, 60] },   // F
    { root: 43, triad: [55, 59, 62] },   // G
    { root: 48, triad: [60, 64, 67] },   // C
    { root: 45, triad: [57, 60, 64] },   // Am
    { root: 41, triad: [53, 57, 60] },   // F
    { root: 43, triad: [55, 59, 62] }    // G
  ];
  // 主旋律：每小节 4 个四分音符（midi，-1 为休止）
  var MELODY = [
    [64, 67, 69, 67],
    [69, 72, 69, 67],
    [65, 69, 72, 69],
    [67, 71, 74, 71],
    [76, 74, 72, 67],
    [69, 72, 76, 74],
    [72, 69, 65, 69],
    [67, 69, 71, 74]
  ];

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function scheduleStep(step, t) {
    var bar = Math.floor(step / 16);
    var s = step % 16;
    var info = BARS[bar];

    // 底鼓 / 军鼓 / 踩镲
    if (s === 0 || s === 8) {
      tone({ t: t, freq: 120, glideTo: 45, dur: 0.12, type: 'sine', gain: 0.55, bus: bgmBus });
    }
    if (s === 4 || s === 12) {
      noise({ t: t, dur: 0.10, freq: 1900, gain: 0.16, q: 0.9, bus: bgmBus });
    }
    if (s % 2 === 0) {
      noise({ t: t, dur: 0.035, freq: 8200, gain: (s % 4 === 0) ? 0.075 : 0.045, q: 1, bus: bgmBus });
    }

    // 贝斯：八分音符走位
    if (s % 2 === 0) {
      var bm = info.root;
      if (s === 2 || s === 10) bm = info.root + 7;
      else if (s === 14) bm = info.root + 12;
      tone({ t: t, freq: mtof(bm), dur: STEP * 1.7, type: 'square', gain: 0.30, bus: bgmBus,
             filter: { type: 'lowpass', freq: 500, q: 0.8 } });
    }

    // 和弦铺底：每小节头尾各铺一次
    if (s === 0 || s === 8) {
      for (var i = 0; i < info.triad.length; i++) {
        tone({ t: t, freq: mtof(info.triad[i]), dur: STEP * 7, type: 'triangle',
               gain: 0.11, attack: 0.05, bus: bgmBus,
               filter: { type: 'lowpass', freq: 1800 } });
      }
    }

    // 主旋律：四分音符
    if (s % 4 === 0) {
      var m = MELODY[bar][s / 4];
      if (m > 0) {
        tone({ t: t, freq: mtof(m), dur: STEP * 3.4, type: 'triangle', gain: 0.26, bus: bgmBus,
               filter: { type: 'lowpass', freq: 3200 } });
        // 高八度点缀
        if (s === 0) {
          tone({ t: t, freq: mtof(m + 12), dur: STEP * 2, type: 'sine', gain: 0.07, bus: bgmBus });
        }
      }
    }
  }

  function schedulerTick() {
    if (!ctx) return;
    while (nextNoteTime < now() + LOOKAHEAD) {
      scheduleStep(currentStep, nextNoteTime);
      nextNoteTime += STEP;
      currentStep = (currentStep + 1) % TOTAL_STEPS;
    }
  }

  function startBGM() {
    init();
    if (!ctx || bgmRunning) return;
    bgmRunning = true;
    nextNoteTime = now() + 0.08;
    currentStep = 0;
    timerId = setInterval(schedulerTick, 25);
  }

  function stopBGM() {
    bgmRunning = false;
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function setMuted(v) {
    muted = v;
    if (master) master.gain.value = v ? 0 : 0.85;
  }
  function isMuted() { return muted; }

  global.GameAudio = {
    init: init,
    resume: resume,
    sfx: sfx,
    startBGM: startBGM,
    stopBGM: stopBGM,
    setMuted: setMuted,
    isMuted: isMuted
  };
})(window);
