/* =============================================================================
 * audio.js — 全部声音都用 WebAudio 运行时合成（零音频文件、零 base64）
 *  · SFX：振荡器 + 噪声缓冲 + 包络
 *  · BGM：16 分音符前瞻调度（lookahead scheduler），永不停止 -> 天然无缝循环
 * ===========================================================================*/
(function (global) {
  'use strict';

  var ctx = null, master = null, sfxBus = null, bgmBus = null, noiseBuf = null;
  var enabled = true, bgmOn = true, bgmPlaying = false;
  var timer = null, step = 0, nextTime = 0;
  var lastSfx = {};

  var BPM = 112;
  var STEP = 60 / BPM / 4;          // 16 分音符时长
  var LOOKAHEAD = 0.16;             // 调度前瞻（秒）

  function ensure() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.5; sfxBus.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.22; bgmBus.connect(master);
    // 1 秒白噪声，全部噪声类音效共用
    var n = ctx.sampleRate * 1.2, buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    noiseBuf = buf;
    return ctx;
  }

  function now() { return ctx.currentTime; }

  // 统一的参数兜底：任何缺省值都不得产生 NaN/Infinity，
  // 否则 osc.stop(NaN) / exponentialRamp(NaN) 会直接抛异常，把调用方（游戏逻辑）一起打断。
  function num(v, dflt) {
    return (typeof v === 'number' && isFinite(v)) ? v : dflt;
  }

  function env(node, t, a, d, peak, sustain, dec) {
    var g = node.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + a);
    if (sustain != null) {
      g.exponentialRampToValueAtTime(Math.max(0.0001, sustain), t + a + d);
      g.exponentialRampToValueAtTime(0.0001, t + a + d + dec);
    } else {
      g.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
  }

  function tone(o) {
    if (!ctx || !enabled) return;
    var t = num(o.t, now());
    var atk = num(o.a, 0.005);
    var dec = num(o.d, 0.12);
    var tail = o.sustain != null ? num(o.dec, 0.05) : 0;
    if (!isFinite(t) || !isFinite(atk) || !isFinite(dec)) return;
    var osc = ctx.createOscillator();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(Math.max(1, num(o.f0, 440)), t);
    if (o.f1) {
      var sweep = num(o.sweep, dec);
      if (o.exp !== false) osc.frequency.exponentialRampToValueAtTime(Math.max(1, num(o.f1, 1)), t + sweep);
      else osc.frequency.linearRampToValueAtTime(Math.max(1, num(o.f1, 1)), t + sweep);
    }
    if (o.vib) {
      var lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibDepth || 6;
      lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dec + 0.1);
    }
    var g = ctx.createGain(); osc.connect(g);
    var dest = o.bus || sfxBus;
    if (o.filter) { var f = ctx.createBiquadFilter(); f.type = o.filter; f.frequency.value = o.cutoff || 1200; f.Q.value = o.q || 1; g.connect(f); f.connect(dest); }
    else g.connect(dest);
    env(g, t, atk, dec, o.vol == null ? 0.3 : o.vol, o.sustain, o.dec == null ? 0.05 : o.dec);
    osc.start(t); osc.stop(t + atk + dec + tail + 0.05);
  }

  function noise(o) {
    if (!ctx || !enabled) return;
    var t = num(o.t, now());
    var atk = num(o.a, 0.003);
    var dec = num(o.d, 0.1);
    if (!isFinite(t) || !isFinite(atk) || !isFinite(dec)) return;
    var src = ctx.createBufferSource(); src.buffer = noiseBuf;
    src.loop = true;
    var g = ctx.createGain();
    var dest = o.bus || sfxBus;
    var node = src;
    if (o.filter || o.cutoff) {
      var f = ctx.createBiquadFilter(); f.type = o.filter || 'lowpass';
      f.frequency.setValueAtTime(Math.max(40, num(o.cutoff, 2000)), t);
      if (o.cutoff1) f.frequency.exponentialRampToValueAtTime(Math.max(60, num(o.cutoff1, 60)), t + dec);
      f.Q.value = o.q || 1;
      node.connect(f); node = f;
    }
    node.connect(g); g.connect(dest);
    env(g, t, atk, dec, o.vol == null ? 0.3 : o.vol);
    src.start(t); src.stop(t + atk + dec + 0.06);
  }

  function throttle(name, ms) {
    var t = performance.now();
    if (lastSfx[name] && t - lastSfx[name] < ms) return false;
    lastSfx[name] = t; return true;
  }

  // ------------------------------------------------------------------ 音效表
  var SFX = {
    plant: function (t) {
      tone({ t: t, type: 'square', f0: 420, f1: 150, d: 0.16, vol: 0.26, sweep: 0.14 });
      noise({ t: t, cutoff: 3000, cutoff1: 500, d: 0.12, vol: 0.18 });
      tone({ t: t + 0.05, type: 'triangle', f0: 880, f1: 1320, d: 0.12, vol: 0.12 });
    },
    shovel: function (t) {
      noise({ t: t, filter: 'highpass', cutoff: 700, cutoff1: 4200, d: 0.2, vol: 0.24 });
      tone({ t: t, type: 'triangle', f0: 300, f1: 900, d: 0.18, vol: 0.16 });
      tone({ t: t + 0.14, type: 'square', f0: 200, f1: 90, d: 0.14, vol: 0.16 });
    },
    shoot: function (t) {
      tone({ t: t, type: 'square', f0: 780, f1: 300, d: 0.09, vol: 0.16, sweep: 0.08 });
      noise({ t: t, filter: 'bandpass', cutoff: 1800, q: 1.5, d: 0.06, vol: 0.12 });
    },
    shootWater: function (t) {
      tone({ t: t, type: 'sine', f0: 620, f1: 260, d: 0.14, vol: 0.18 });
      noise({ t: t, filter: 'bandpass', cutoff: 900, cutoff1: 300, q: 2, d: 0.16, vol: 0.16 });
    },
    shootMail: function (t) {
      tone({ t: t, type: 'triangle', f0: 1200, f1: 1900, d: 0.12, vol: 0.14 });
      tone({ t: t + 0.06, type: 'sine', f0: 1600, f1: 2300, d: 0.1, vol: 0.1 });
    },
    hit: function (t) {
      noise({ t: t, filter: 'bandpass', cutoff: 2400, q: 1.2, d: 0.05, vol: 0.14 });
      tone({ t: t, type: 'triangle', f0: 260, f1: 170, d: 0.05, vol: 0.1 });
    },
    chew: function (t) {
      noise({ t: t, filter: 'lowpass', cutoff: 700, d: 0.09, vol: 0.16 });
      tone({ t: t, type: 'square', f0: 130, f1: 80, d: 0.08, vol: 0.12 });
    },
    explode: function (t) {
      noise({ t: t, filter: 'lowpass', cutoff: 2600, cutoff1: 120, d: 0.5, vol: 0.4 });
      tone({ t: t, type: 'sawtooth', f0: 180, f1: 30, d: 0.45, vol: 0.32 });
      tone({ t: t, type: 'square', f0: 90, f1: 40, d: 0.3, vol: 0.2 });
    },
    mine: function (t) {
      noise({ t: t, filter: 'lowpass', cutoff: 1800, cutoff1: 200, d: 0.32, vol: 0.34 });
      tone({ t: t, type: 'square', f0: 300, f1: 60, d: 0.26, vol: 0.26 });
    },
    coin: function (t) {
      tone({ t: t, type: 'triangle', f0: 1046, d: 0.07, vol: 0.2 });
      tone({ t: t + 0.07, type: 'triangle', f0: 1568, d: 0.16, vol: 0.2 });
      tone({ t: t + 0.07, type: 'sine', f0: 2093, d: 0.16, vol: 0.1 });
    },
    cash: function (t) {
      tone({ t: t, type: 'triangle', f0: 880, d: 0.06, vol: 0.13 });
      tone({ t: t + 0.05, type: 'triangle', f0: 1320, d: 0.1, vol: 0.11 });
    },
    leave: function (t) {   // 年假：一路向上的“解脱”琶音
      var seq = [523, 659, 784, 1046, 1318];
      for (var i = 0; i < seq.length; i++) {
        tone({ t: t + i * 0.08, type: 'triangle', f0: seq[i], d: 0.34, vol: 0.22 });
      }
      noise({ t: t, filter: 'highpass', cutoff: 3000, cutoff1: 6000, d: 0.5, vol: 0.08 });
    },
    warn: function (t) {
      for (var i = 0; i < 3; i++) {
        tone({ t: t + i * 0.34, type: 'sawtooth', f0: 440, f1: 660, d: 0.16, vol: 0.2, filter: 'lowpass', cutoff: 2200 });
        tone({ t: t + i * 0.34 + 0.16, type: 'sawtooth', f0: 330, d: 0.14, vol: 0.18, filter: 'lowpass', cutoff: 1800 });
      }
    },
    boss: function (t) {
      tone({ t: t, type: 'sawtooth', f0: 110, d: 1.1, vol: 0.26, filter: 'lowpass', cutoff: 500, vib: 5, vibDepth: 4 });
      tone({ t: t + 0.28, type: 'sawtooth', f0: 82, d: 1.0, vol: 0.22, filter: 'lowpass', cutoff: 420 });
      noise({ t: t, filter: 'lowpass', cutoff: 300, d: 1.2, vol: 0.14 });
    },
    win: function (t) {
      var seq = [[523, 0], [659, 0.14], [784, 0.28], [1046, 0.42], [784, 0.62], [1046, 0.76]];
      for (var i = 0; i < seq.length; i++) {
        tone({ t: t + seq[i][1], type: 'square', f0: seq[i][0], d: 0.3, vol: 0.2 });
        tone({ t: t + seq[i][1], type: 'triangle', f0: seq[i][0] / 2, d: 0.3, vol: 0.12 });
      }
    },
    lose: function (t) {
      var seq = [[392, 0], [330, 0.22], [262, 0.44], [196, 0.7]];
      for (var i = 0; i < seq.length; i++) {
        tone({ t: t + seq[i][1], type: 'sawtooth', f0: seq[i][0], d: 0.55, vol: 0.2, filter: 'lowpass', cutoff: 900 });
        tone({ t: t + seq[i][1], type: 'sine', f0: seq[i][0] / 2, d: 0.6, vol: 0.14 });
      }
    },
    click: function (t) { tone({ t: t, type: 'square', f0: 1100, d: 0.04, vol: 0.1 }); },
    deny: function (t) {
      tone({ t: t, type: 'square', f0: 160, f1: 110, d: 0.16, vol: 0.2, filter: 'lowpass', cutoff: 900 });
    },
    slot: function (t) {
      tone({ t: t, type: 'square', f0: 300, f1: 120, d: 0.2, vol: 0.2 });
      noise({ t: t, filter: 'bandpass', cutoff: 700, q: 1, d: 0.22, vol: 0.16 });
    },
    mineArm: function (t) {
      tone({ t: t, type: 'triangle', f0: 500, f1: 900, d: 0.1, vol: 0.16 });
      tone({ t: t + 0.1, type: 'triangle', f0: 900, f1: 1400, d: 0.12, vol: 0.14 });
    }
  };

  function play(name, t) {
    if (!enabled) return;
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    var f = SFX[name];
    // 音效永远不能打断游戏主逻辑：任何异常都在这里吃掉
    if (f) { try { f(t == null ? now() : t); } catch (e) { /* ignore */ } }
  }

  // ------------------------------------------------------------------ BGM
  // 8 小节循环：C - Am - F - G（I-vi-IV-V），方波主旋律 + 三角波贝斯 + 和声垫 + 鼓组
  var CHORDS = [
    [60, 64, 67], [60, 64, 67],   // C
    [57, 60, 64], [57, 60, 64],   // Am
    [53, 57, 60], [53, 57, 60],   // F
    [55, 59, 62], [55, 59, 62]    // G
  ];
  var BASS = [48, 48, 45, 45, 41, 41, 43, 43];
  // [16分位置, 音高, 时值(16分)]
  var MELODY = {
    0: [[0, 67, 2], [2, 64, 2], [4, 67, 2], [6, 72, 4], [12, 71, 2], [14, 69, 2]],
    1: [[0, 67, 4], [4, 64, 2], [6, 62, 2], [8, 64, 4], [12, 67, 3]],
    2: [[0, 69, 2], [2, 72, 2], [4, 69, 2], [6, 76, 4], [12, 72, 2], [14, 69, 2]],
    3: [[0, 67, 6], [8, 64, 4], [12, 62, 4]],
    4: [[0, 65, 2], [2, 69, 2], [4, 65, 2], [6, 72, 4], [12, 71, 2], [14, 69, 2]],
    5: [[0, 65, 6], [8, 64, 4], [12, 65, 4]],
    6: [[0, 67, 2], [2, 71, 2], [4, 74, 4], [8, 71, 2], [10, 67, 2], [12, 71, 3]],
    7: [[0, 72, 6], [8, 71, 3], [12, 69, 4]]
  };
  function midi(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function scheduleStep(i, t) {
    var s = i % 128;
    var bar = Math.floor(s / 16), b = s % 16;
    var chord = CHORDS[bar];
    // 鼓
    if (b === 0 || b === 8 || (bar > 3 && b === 14)) {
      tone({ t: t, bus: bgmBus, type: 'sine', f0: 150, f1: 45, d: 0.16, vol: 0.5, sweep: 0.14 });
    }
    if (b === 4 || b === 12) {
      noise({ t: t, bus: bgmBus, filter: 'bandpass', cutoff: 1700, q: 0.9, d: 0.11, vol: 0.3 });
      tone({ t: t, bus: bgmBus, type: 'triangle', f0: 220, d: 0.07, vol: 0.14 });
    }
    if (b % 2 === 0) {
      noise({ t: t, bus: bgmBus, filter: 'highpass', cutoff: b % 4 === 0 ? 7000 : 9000, d: 0.035, vol: b % 4 === 0 ? 0.13 : 0.08 });
    }
    // 贝斯
    if (b === 0 || b === 6 || b === 10) {
      var root = BASS[bar] + (b === 6 ? 12 : 0);
      tone({ t: t, bus: bgmBus, type: 'triangle', f0: midi(root), d: 0.3, vol: 0.34 });
    }
    // 和声垫（每小节头）
    if (b === 0) {
      for (var c = 0; c < chord.length; c++) {
        tone({ t: t, bus: bgmBus, type: 'sawtooth', f0: midi(chord[c] + 12), d: 1.9, vol: 0.055, a: 0.08, filter: 'lowpass', cutoff: 1600 });
      }
      // 反拍琶音
      tone({ t: t + STEP * 8, bus: bgmBus, type: 'triangle', f0: midi(chord[1] + 12), d: 0.16, vol: 0.08 });
      tone({ t: t + STEP * 12, bus: bgmBus, type: 'triangle', f0: midi(chord[2] + 12), d: 0.16, vol: 0.08 });
    }
    // 主旋律
    var m = MELODY[bar];
    if (m) for (var k = 0; k < m.length; k++) {
      if (m[k][0] === b) {
        tone({
          t: t, bus: bgmBus, type: 'square', f0: midi(m[k][1]), d: m[k][2] * STEP * 0.92,
          vol: 0.17, a: 0.012, filter: 'lowpass', cutoff: 4200
        });
      }
    }
  }

  function tick() {
    if (!ctx || !bgmPlaying) return;
    try {
      var guard = 0;
      while (nextTime < ctx.currentTime + LOOKAHEAD && guard++ < 64) {
        scheduleStep(step, nextTime);
        step++;
        nextTime += STEP;
      }
      if (!isFinite(nextTime)) nextTime = ctx.currentTime + 0.12;
    } catch (e) { nextTime = ctx.currentTime + 0.12; }
  }

  function startBGM() {
    if (!ensure() || !bgmOn) return;
    if (bgmPlaying) return;
    bgmPlaying = true;
    step = 0;
    nextTime = ctx.currentTime + 0.12;
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 25);
  }
  function stopBGM() {
    bgmPlaying = false;
    if (timer) { clearInterval(timer); timer = null; }
  }

  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
  }

  global.GameAudio = {
    play: play,
    startBGM: startBGM,
    stopBGM: stopBGM,
    unlock: unlock,
    throttle: throttle,
    isBgmPlaying: function () { return bgmPlaying; },
    setEnabled: function (on) {
      enabled = on;
      if (ctx) master.gain.value = on ? 0.9 : 0.0;
      if (!on) lastSfx = {};
    },
    isEnabled: function () { return enabled; },
    setBgm: function (on) {
      bgmOn = on;
      if (ctx) bgmBus.gain.value = on ? 0.22 : 0;
      if (on && !bgmPlaying) startBGM(); else if (!on) stopBGM();
    },
    isBgmOn: function () { return bgmOn; },
    duckBGM: function (v) { if (ctx) bgmBus.gain.value = 0.22 * v; }
  };
})(window);
