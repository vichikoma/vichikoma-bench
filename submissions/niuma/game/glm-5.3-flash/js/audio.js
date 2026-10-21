/* audio.js —— 全部声音由 WebAudio 运行时生成,零音频文件。
 * SFX:种植/铲除/发射/命中/爆炸/警告/咖啡因/年假/胜利/失败等 18 种。
 * BGM:Lo-fi 办公室律动,BPM 96,Am-F-C-G 和弦进行,8 小节循环;
 *      使用"预排程"调度器(lookahead 0.3s)对齐 AudioContext 时钟,循环无缝。
 */
'use strict';

const AudioSys = (() => {
  let ctx = null, master = null, sfxBus = null, bgmBus = null, muted = false;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1.0; sfxBus.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.42; bgmBus.connect(master);
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
  }
  function isMuted() { return muted; }

  // ---------- 基础合成器 ----------
  function env(g, t0, a, peak, d, sustain = 0, r = 0.05) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain * peak || 0.0001), t0 + a + d);
    if (r) g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d + r);
  }
  function tone({ f0 = 440, f1 = null, type = 'square', vol = .2, a = .005, d = .15, r = .05, t = null, bus = null, detune = 0 }) {
    if (!ctx) return;
    const t0 = t || ctx.currentTime;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + a + d);
    if (detune) o.detune.value = detune;
    const g = ctx.createGain();
    env(g, t0, a, vol, d, 0, r);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t0); o.stop(t0 + a + d + r + .1);
  }
  let noiseBuf = null;
  function getNoise() {
    if (!noiseBuf) {
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  function noise({ vol = .2, dur = .2, type = 'highpass', freq = 1000, q = .8, f1 = null, t = null, bus = null }) {
    if (!ctx) return;
    const t0 = t || ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = getNoise(); src.loop = true;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(freq, t0); flt.Q.value = q;
    if (f1) flt.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    const g = ctx.createGain();
    env(g, t0, .004, vol, dur);
    src.connect(flt); flt.connect(g); g.connect(bus || sfxBus);
    src.start(t0); src.stop(t0 + dur + .1);
  }
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  // ---------- SFX 清单 ----------
  const S = {
    place() { tone({ f0: 320, f1: 190, type: 'triangle', vol: .32, d: .1 }); tone({ f0: 640, f1: 900, type: 'sine', vol: .12, d: .06 }); },
    shovel() { noise({ vol: .22, dur: .16, freq: 2400, f1: 500 }); tone({ f0: 180, f1: 90, type: 'triangle', vol: .25, d: .12, t: ctx.currentTime + .05 }); },
    shoot() { tone({ f0: 720, f1: 180, type: 'square', vol: .14, d: .09 }); noise({ vol: .07, dur: .05, freq: 3000 }); },
    splash() { noise({ vol: .16, dur: .22, type: 'bandpass', freq: 1400, q: 1.5, f1: 400 }); tone({ f0: 500, f1: 240, type: 'sine', vol: .1, d: .15 }); },
    lob() { tone({ f0: 260, f1: 620, type: 'triangle', vol: .16, d: .16 }); },
    hit() { tone({ f0: 220, f1: 130, type: 'square', vol: .1, d: .05 }); },
    bite() { tone({ f0: 140, f1: 70, type: 'sawtooth', vol: .12, d: .08 }); },
    jump() { tone({ f0: 300, f1: 760, type: 'sine', vol: .18, d: .2 }); },
    arm() { tone({ f0: 880, type: 'square', vol: .12, d: .07 }); tone({ f0: 1320, type: 'square', vol: .1, d: .09, t: ctx.currentTime + .09 }); },
    heal() { [660, 880, 1100].forEach((f, i) => tone({ f0: f, type: 'sine', vol: .1, d: .1, t: ctx.currentTime + i * .06 })); },
    explosion() {
      noise({ vol: .4, dur: .5, type: 'lowpass', freq: 2600, f1: 120 });
      tone({ f0: 150, f1: 40, type: 'sine', vol: .5, d: .4 });
      tone({ f0: 100, f1: 35, type: 'triangle', vol: .4, d: .5, t: ctx.currentTime + .04 });
    },
    coffeeDrop() { [784, 1046, 1318].forEach((f, i) => tone({ f0: f, type: 'triangle', vol: .13, d: .12, t: ctx.currentTime + i * .07 })); },
    collect() { tone({ f0: 1046, type: 'sine', vol: .15, d: .08 }); tone({ f0: 1568, type: 'sine', vol: .12, d: .1, t: ctx.currentTime + .07 }); },
    leave() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone({ f0: f, type: 'triangle', vol: .16, d: .25, t: ctx.currentTime + i * .09 })); },
    error() { tone({ f0: 160, f1: 120, type: 'sawtooth', vol: .14, d: .16 }); },
    deny() { tone({ f0: 220, f1: 180, type: 'square', vol: .12, d: .1 }); },
    bossHorn() {
      tone({ f0: 98, type: 'sawtooth', vol: .3, d: .7, r: .2 });
      tone({ f0: 147, type: 'sawtooth', vol: .22, d: .7, r: .2 });
      noise({ vol: .1, dur: .6, type: 'lowpass', freq: 400 });
    },
    bigwave() {
      for (let i = 0; i < 3; i++) {
        const t = ctx.currentTime + i * .28;
        tone({ f0: 620, f1: 420, type: 'square', vol: .18, d: .16, t });
        tone({ f0: 310, f1: 210, type: 'square', vol: .16, d: .16, t });
      }
    },
    wave() { tone({ f0: 520, f1: 700, type: 'triangle', vol: .16, d: .14 }); tone({ f0: 700, f1: 900, type: 'triangle', vol: .12, d: .14, t: ctx.currentTime + .12 }); },
    win() { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone({ f0: f, type: 'triangle', vol: .2, d: .3, t: ctx.currentTime + i * .13 })); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone({ f0: f, f1: f * .94, type: 'sawtooth', vol: .18, d: .4, t: ctx.currentTime + i * .3 })); },
    resignBoom() {
      S.explosion();
      [880, 660, 440].forEach((f, i) => tone({ f0: f, type: 'square', vol: .12, d: .18, t: ctx.currentTime + .1 + i * .1 }));
    },
    gameOver() { tone({ f0: 200, f1: 60, type: 'sawtooth', vol: .3, d: .9 }); noise({ vol: .2, dur: .7, type: 'lowpass', freq: 1000, f1: 80 }); },
  };
  function sfx(name) {
    if (!ctx || muted) return;
    try { S[name] && S[name](); } catch (e) { /* 忽略音频异常 */ }
  }

  // ---------- BGM(无缝循环) ----------
  // 8 小节 × 16 步(十六分音符),BPM 96 → 步长 60/96/4 s
  const BPM = 96, STEP = 60 / BPM / 4, BARS = 8, TOTAL = BARS * 16;
  // 和弦:Am Am F F C C G G(根音 midi)
  const ROOTS = [45, 45, 41, 41, 36, 36, 43, 43]; // A2 A2 F2 F2 C2 C2 G2 G2
  const CHORDS = [
    [57, 60, 64], [57, 60, 64], [53, 57, 60], [53, 57, 60],
    [48, 52, 55], [48, 52, 55], [55, 59, 62], [55, 59, 62],
  ];
  // 旋律 [bar, step, midi, lenSteps] —— A 小调五声,有呼吸感
  const MELODY = [
    [0, 0, 69, 3], [0, 4, 72, 2], [0, 6, 76, 4], [0, 12, 74, 2], [0, 14, 72, 2],
    [1, 2, 69, 4], [1, 8, 76, 2], [1, 12, 74, 4],
    [2, 0, 77, 3], [2, 4, 76, 2], [2, 6, 72, 4], [2, 12, 74, 2], [2, 14, 76, 2],
    [3, 2, 77, 4], [3, 8, 72, 2], [3, 10, 69, 6],
    [4, 0, 76, 3], [4, 4, 72, 2], [4, 6, 79, 4], [4, 12, 76, 4],
    [5, 2, 74, 4], [5, 8, 72, 2], [5, 12, 67, 4],
    [6, 0, 74, 3], [6, 4, 71, 2], [6, 6, 67, 4], [6, 12, 74, 2], [6, 14, 76, 2],
    [7, 2, 77, 2], [7, 4, 79, 4], [7, 10, 76, 2], [7, 12, 74, 2], [7, 14, 71, 2],
  ];
  const melodyMap = new Map();
  MELODY.forEach(([b, s, m, l]) => melodyMap.set(b * 16 + s, { m, l }));

  let bgmTimer = null, nextStepTime = 0, stepIdx = 0, bgmOn = false;

  function scheduleStep(step, t) {
    const bar = Math.floor(step / 16) % BARS, s = step % 16;
    const root = midi(ROOTS[bar]);
    // 底鼓:0, 8(+第6步的 ghost)
    if (s === 0 || s === 8) tone({ f0: 130, f1: 42, type: 'sine', vol: .5, d: .12, t, bus: bgmBus });
    // 军鼓:4, 12
    if (s === 4 || s === 12) noise({ vol: .14, dur: .12, type: 'bandpass', freq: 1900, q: .9, t, bus: bgmBus });
    // 踩镲:偶数步,反拍加重
    if (s % 2 === 0) noise({ vol: s % 4 === 2 ? .07 : .04, dur: .045, freq: 7000, t, bus: bgmBus });
    // 贝斯
    if (s === 0 || s === 8) tone({ f0: root, type: 'triangle', vol: .3, d: .4, t, bus: bgmBus });
    if (s === 6 || s === 14) tone({ f0: root * (s === 14 ? 1.5 : 1), type: 'triangle', vol: .2, d: .16, t, bus: bgmBus });
    // 电钢和弦 stabs
    if (s === 2 || s === 10) {
      for (const n of CHORDS[bar]) {
        tone({ f0: midi(n), type: 'square', vol: .05, d: .22, t, bus: bgmBus });
        tone({ f0: midi(n), type: 'triangle', vol: .07, d: .26, t: t + .005, bus: bgmBus, detune: 6 });
      }
    }
    // 旋律
    const mel = melodyMap.get(step % TOTAL);
    if (mel) tone({ f0: midi(mel.m), type: 'square', vol: .075, d: mel.l * STEP * .9, a: .01, t, bus: bgmBus });
  }

  function startBGM() {
    if (!ctx || bgmOn) return;
    bgmOn = true;
    nextStepTime = ctx.currentTime + .1; stepIdx = 0;
    bgmTimer = setInterval(() => {
      if (!bgmOn) return;
      while (nextStepTime < ctx.currentTime + 0.3) {
        scheduleStep(stepIdx, nextStepTime);
        stepIdx = (stepIdx + 1) % TOTAL;
        nextStepTime += STEP;
      }
    }, 60);
  }
  function stopBGM() { bgmOn = false; if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; } }

  return { init, resume, sfx, startBGM, stopBGM, setMuted, isMuted };
})();
