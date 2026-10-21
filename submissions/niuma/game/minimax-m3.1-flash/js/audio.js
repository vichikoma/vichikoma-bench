/* ============================================================
 *  audio.js —— 全部声音在运行时由 WebAudio 合成（无任何音频文件）
 *  音效：种植/铲除/发射/命中/爆炸/警告/收集/年假/胜利/失败/UI
 *  BGM：16 步循环序列（贝斯 + 琶音旋律 + 底鼓/军鼓），用前瞻调度器
 *        按固定步长排音符，循环长度与排程长度严格相等 → 无缝循环
 * ============================================================ */
'use strict';

var AUD = {
  ctx: null, master: null, sfxBus: null, bgmBus: null,
  enabled: true, bgmOn: false, step: 0, nextTime: 0, timer: null,
  BPM: 128
};

/* 8 步一循环的音符序列（相对半音，null = 休止） */
var BASS = [0, null, 0, 7, 5, null, 3, 7];
var ARP = [12, 15, 19, 15, 12, 10, 12, 7];
var ROOT = 55; // A1

function audioInit() {
  if (AUD.ctx) return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { AUD.enabled = false; return; }
  try { AUD.ctx = new AC(); } catch (e) { AUD.enabled = false; return; }
  var c = AUD.ctx;
  AUD.master = c.createGain(); AUD.master.gain.value = 0.85;
  AUD.master.connect(c.destination);
  AUD.sfxBus = c.createGain(); AUD.sfxBus.gain.value = 0.9; AUD.sfxBus.connect(AUD.master);
  AUD.bgmBus = c.createGain(); AUD.bgmBus.gain.value = 0.36; AUD.bgmBus.connect(AUD.master);
  AUD.noiseBuf = makeNoise(c);
}

function makeNoise(c) {
  var len = c.sampleRate * 1.0, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function audioResume() {
  audioInit();
  if (AUD.ctx && AUD.ctx.state === 'suspended') AUD.ctx.resume();
}

function now() { return AUD.ctx.currentTime; }

function env(g, t, a, d, peak) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

/* 基础音：振荡器 */
function tone(opt) {
  if (!AUD.enabled || !AUD.ctx) return;
  var c = AUD.ctx, t = opt.t || now();
  var o = c.createOscillator(), g = c.createGain();
  o.type = opt.type || 'square';
  o.frequency.setValueAtTime(opt.f, t);
  if (opt.f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, opt.f2), t + (opt.slide || 0.12));
  g.gain.value = 0.0001;
  env(g, t, opt.a || 0.005, opt.d || 0.15, opt.v || 0.2);
  var node = o;
  if (opt.filter) {
    var f = c.createBiquadFilter();
    f.type = opt.filter; f.frequency.setValueAtTime(opt.fc || 1200, t);
    if (opt.fc2) f.frequency.exponentialRampToValueAtTime(opt.fc2, t + (opt.slide || 0.12));
    node.connect(f); f.connect(g);
  } else node.connect(g);
  g.connect(opt.bus || AUD.sfxBus);
  o.start(t); o.stop(t + (opt.a || 0.005) + (opt.d || 0.15) + 0.02);
}

/* 噪声：打击感 */
function noise(opt) {
  if (!AUD.enabled || !AUD.ctx) return;
  var c = AUD.ctx, t = opt.t || now();
  var s = c.createBufferSource(); s.buffer = AUD.noiseBuf;
  var f = c.createBiquadFilter(); f.type = opt.filter || 'bandpass';
  f.frequency.setValueAtTime(opt.f || 1400, t);
  if (opt.f2) f.frequency.exponentialRampToValueAtTime(Math.max(60, opt.f2), t + (opt.d || 0.2));
  f.Q.value = opt.q || 1.0;
  var g = c.createGain(); g.gain.value = 0.0001;
  env(g, t, opt.a || 0.004, opt.d || 0.2, opt.v || 0.25);
  s.connect(f); f.connect(g); g.connect(opt.bus || AUD.sfxBus);
  s.start(t); s.stop(t + (opt.a || 0.004) + (opt.d || 0.2) + 0.02);
}

/* ---------------- 音效清单 ---------------- */
var SFX = {
  plant: function () {
    tone({ type: 'square', f: 420, f2: 720, slide: 0.09, a: 0.005, d: 0.14, v: 0.22 });
    noise({ f: 2200, f2: 700, d: 0.14, v: 0.16 });
  },
  shovel: function () {
    noise({ f: 900, f2: 260, d: 0.22, v: 0.24, filter: 'lowpass' });
    tone({ type: 'triangle', f: 240, f2: 90, slide: 0.2, d: 0.2, v: 0.18 });
  },
  shoot: function () {
    tone({ type: 'square', f: 700, f2: 180, slide: 0.1, a: 0.003, d: 0.11, v: 0.16 });
    noise({ f: 3000, f2: 800, d: 0.08, v: 0.12 });
  },
  hit: function () {
    noise({ f: 1800, f2: 500, d: 0.09, v: 0.18, q: 1.4 });
    tone({ type: 'triangle', f: 320, f2: 140, slide: 0.08, d: 0.09, v: 0.12 });
  },
  splash: function () {
    noise({ f: 2600, f2: 900, d: 0.18, v: 0.16 });
    tone({ type: 'sine', f: 900, f2: 380, slide: 0.15, d: 0.16, v: 0.12 });
  },
  boom: function () {
    noise({ f: 900, f2: 90, d: 0.55, v: 0.4, filter: 'lowpass', q: 0.7 });
    tone({ type: 'sine', f: 180, f2: 40, slide: 0.45, a: 0.01, d: 0.5, v: 0.32 });
  },
  bite: function () {
    noise({ f: 500, f2: 240, d: 0.08, v: 0.1, filter: 'lowpass' });
  },
  pickup: function () {
    tone({ type: 'sine', f: 880, d: 0.1, v: 0.16 });
    tone({ type: 'sine', f: 1320, t: now() + 0.06, d: 0.12, v: 0.14 });
  },
  produce: function () {
    tone({ type: 'triangle', f: 520, f2: 880, slide: 0.12, d: 0.2, v: 0.15 });
    noise({ f: 1600, f2: 600, d: 0.16, v: 0.08 });
  },
  slot: function () {
    tone({ type: 'square', f: 260, f2: 130, slide: 0.15, d: 0.22, v: 0.2 });
    noise({ f: 1200, f2: 300, d: 0.2, v: 0.12 });
  },
  leave: function () {
    /* 年假：轻快的上行三音 + 纸张感 */
    [0, 4, 7, 12].forEach(function (n, i) {
      tone({ type: 'triangle', f: 440 * Math.pow(2, n / 12), t: now() + i * 0.09, d: 0.26, v: 0.18 });
    });
    noise({ f: 3000, f2: 1200, d: 0.4, v: 0.07 });
  },
  warn: function () {
    /* 一大波工作来袭：警报 */
    for (var i = 0; i < 3; i++) {
      tone({ type: 'sawtooth', f: 660, f2: 880, slide: 0.18, t: now() + i * 0.26, a: 0.02, d: 0.22, v: 0.2, filter: 'lowpass', fc: 2200 });
    }
    tone({ type: 'sine', f: 110, d: 0.8, v: 0.2 });
  },
  ui: function () { tone({ type: 'square', f: 620, d: 0.05, v: 0.1 }); },
  deny: function () { tone({ type: 'square', f: 200, f2: 130, slide: 0.1, d: 0.16, v: 0.16 }); },
  lose: function () {
    [0, -2, -5, -9].forEach(function (n, i) {
      tone({ type: 'sawtooth', f: 330 * Math.pow(2, n / 12), t: now() + i * 0.18, a: 0.01, d: 0.42, v: 0.2, filter: 'lowpass', fc: 1400 });
    });
  },
  win: function () {
    [0, 4, 7, 12, 16, 19].forEach(function (n, i) {
      tone({ type: 'square', f: 392 * Math.pow(2, n / 12), t: now() + i * 0.11, a: 0.01, d: 0.35, v: 0.16 });
      tone({ type: 'triangle', f: 196 * Math.pow(2, n / 12), t: now() + i * 0.11, a: 0.01, d: 0.35, v: 0.12 });
    });
  },
  fuse: function () { noise({ f: 4200, f2: 2000, d: 0.5, v: 0.1 }); }
};
function sfx(name) { if (SFX[name]) { audioInit(); SFX[name](); } }

/* ---------------- BGM ---------------- */
function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

function bgmStart() {
  audioInit(); audioResume();
  if (!AUD.ctx || AUD.bgmOn) return;
  AUD.bgmOn = true;
  AUD.step = 0;
  AUD.nextTime = AUD.ctx.currentTime + 0.08;
  var stepDur = 60 / AUD.BPM / 4;   // 16 分音符
  AUD.timer = setInterval(function () {
    if (!AUD.bgmOn) return;
    var horizon = AUD.ctx.currentTime + 0.25;
    while (AUD.nextTime < horizon) {
      scheduleStep(AUD.step, AUD.nextTime, stepDur);
      AUD.step = (AUD.step + 1) % 16;
      AUD.nextTime += stepDur;
    }
  }, 40);
}

function bgmStop() {
  AUD.bgmOn = false;
  if (AUD.timer) { clearInterval(AUD.timer); AUD.timer = null; }
}

function scheduleStep(i, t, dur) {
  var bus = AUD.bgmBus;
  var bar = Math.floor(i / 8) % 2;
  var chord = bar ? [0, 3, 7, 10] : [0, 5, 7, 12];  // Am / F 走向

  /* 底鼓：每小节 0 / 6 / 10 */
  if (i % 8 === 0 || i % 8 === 6 || i % 8 === 10) {
    tone({ type: 'sine', f: 130, f2: 45, slide: 0.09, t: t, a: 0.002, d: 0.16, v: 0.5, bus: bus });
  }
  /* 军鼓：2 / 6 / 14 */
  if (i % 8 === 2 || i % 8 === 6 || i % 8 === 14) {
    noise({ f: 1800, f2: 800, t: t, d: 0.12, v: 0.22, q: 0.8, bus: bus });
  }
  /* 踩镲：每 2 步 */
  if (i % 2 === 1) noise({ f: 8000, t: t, d: 0.04, v: 0.06, q: 2.0, bus: bus });

  /* 贝斯 */
  var bn = BASS[i % 8];
  if (bn !== null && bn !== undefined) {
    tone({ type: 'triangle', f: midi(ROOT + bn), t: t, a: 0.01, d: dur * 1.7, v: 0.34, bus: bus, filter: 'lowpass', fc: 700 });
  }
  /* 旋律琶音（每步一个音，8 步乐句循环，共 16 步） */
  var arp = ARP[i % 8];
  tone({ type: 'square', f: midi(ROOT + 24 + arp + (bar ? 0 : 0)), t: t, a: 0.005, d: dur * 1.4, v: 0.13, bus: bus, filter: 'lowpass', fc: 2600 });
  /* 每 8 步加一个长音和弦，撑住和声 */
  if (i % 8 === 0) {
    for (var c = 0; c < chord.length; c++) {
      tone({ type: 'sine', f: midi(ROOT + 12 + chord[c]), t: t, a: 0.03, d: dur * 7.2, v: 0.06, bus: bus });
    }
  }
}