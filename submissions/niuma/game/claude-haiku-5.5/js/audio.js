/* audio.js — 全部声音由 WebAudio 运行时合成，无任何音频文件。
 * 音效：种植/铲除/发射/命中/爆炸/大波警告/咖啡因/年假/胜利/失败 等
 * BGM：A 小调 4 小节（Am-F-C-G）64 步 16 分音符循环，调度器按步数取模，循环处无缝。
 */
const SFX = (function () {
  let ctx = null, master = null, sfxBus = null, bgmBus = null, noiseBuf = null;
  let timer = null, step = 0, nextT = 0, muted = false;
  const BPM = 112, STEP = 60 / BPM / 4, STEPS = 64;

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
      bgmBus = ctx.createGain(); bgmBus.gain.value = 0.7; bgmBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }

  // 绝对时间（ctx.currentTime 基准）的振荡器音
  function synth(f, dur, type, vol, t, bus, slideTo) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol, t, freq, type, bus) {
    if (!ctx) return;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = freq || 1000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || sfxBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  const now = () => (ctx ? ctx.currentTime : 0);

  const sfx = {
    place()    { const t = now(); synth(520, 0.09, 'triangle', 0.25, t, null, 880); },
    shovel()   { const t = now(); noise(0.28, 0.35, t, 1800, 'bandpass'); synth(200, 0.22, 'sawtooth', 0.1, t, null, 90); },
    shoot()    { const t = now(); synth(900, 0.08, 'square', 0.07, t, null, 420); },
    hit()      { const t = now(); synth(300, 0.05, 'square', 0.08, t); },
    bite()     { const t = now(); noise(0.08, 0.18, t, 900); },
    explode()  { const t = now(); noise(0.55, 0.6, t, 600); synth(120, 0.45, 'sine', 0.5, t, null, 40); },
    boom()     { const t = now(); noise(0.35, 0.5, t, 2000); synth(180, 0.25, 'square', 0.16, t, null, 60); },
    pop()      { const t = now(); synth(1200, 0.06, 'sine', 0.12, t, null, 600); },
    suck()     { const t = now(); synth(800, 0.4, 'sine', 0.18, t, null, 200); },
    collect()  { const t = now(); [660, 880, 1320].forEach((f, i) => synth(f, 0.15, 'triangle', 0.25, t + i * 0.07)); },
    cup()      { const t = now(); synth(1046, 0.12, 'triangle', 0.14, t); synth(1568, 0.16, 'triangle', 0.1, t + 0.06); },
    arm()      { const t = now(); synth(440, 0.1, 'triangle', 0.15, t); synth(660, 0.14, 'triangle', 0.15, t + 0.1); },
    annual()   { const t = now(); [523, 659, 784, 1046].forEach((f, i) => synth(f, 0.3, 'sawtooth', 0.1, t + i * 0.12)); },
    warn()     { const t = now(); for (let i = 0; i < 3; i++) synth(660, 0.25, 'sawtooth', 0.12, t + i * 0.35, null, 990); },
    click()    { const t = now(); synth(700, 0.03, 'square', 0.06, t); },
    deny()     { const t = now(); synth(180, 0.14, 'square', 0.12, t, null, 120); },
    win() {
      const t = now();
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => synth(f, 0.28, 'triangle', 0.22, t + i * 0.16));
      synth(262, 1.2, 'sine', 0.25, t + 1.2, null, 262);
    },
    lose() {
      const t = now();
      [392, 349, 311, 262].forEach((f, i) => synth(f, 0.4, 'sawtooth', 0.14, t + i * 0.3));
      synth(155, 0.9, 'sine', 0.25, t + 1.2, null, 80);
    },
  };

  /* ---------------- BGM ---------------- */
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  const CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const BASS = [45, 41, 36, 43];
  // 每小节 16 步的旋律（null = 休止）
  const MEL = [
    76, null, 74, 72, 69, null, 72, null, 76, null, 79, null, 76, 74, 72, null,   // Am
    77, null, 76, 72, 69, null, 72, null, 77, null, 76, null, 72, 69, 65, null,   // F
    76, null, 79, null, 72, null, 76, null, 79, null, 76, 72, 74, null, 72, null, // C
    71, null, 74, null, 79, null, 76, null, 74, null, 71, 67, 69, null, null, null // G
  ];

  function schedule() {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.12) {
      const t = nextT, bar = (step >> 4) & 3, s16 = step & 15;
      if (s16 % 4 === 0) synth(midi(BASS[bar]), STEP * 3.6, 'triangle', 0.22, t, bgmBus);       // 贝斯四分
      if (s16 % 2 === 0) {                                                                     // 8 分琶音
        const note = CH[bar][(s16 >> 1) % 3] + 12;
        synth(midi(note), STEP * 1.8, 'triangle', 0.05, t, bgmBus);
      }
      const m = MEL[step];
      if (m !== null) synth(midi(m), STEP * 1.7, 'square', 0.035, t, bgmBus);                  // 旋律
      if (s16 === 0 || s16 === 8) synth(120, 0.14, 'sine', 0.5, t, bgmBus, 40);                // 底鼓
      if (s16 % 4 === 2) noise(0.03, 0.06, t, 7000, 'highpass', bgmBus);                       // 军鼓感噪声
      nextT += STEP;
      step = (step + 1) % STEPS;
    }
  }

  const BGM = {
    start() {
      if (!init() || timer) return;
      step = 0; nextT = ctx.currentTime + 0.05;
      timer = setInterval(schedule, 25);
    },
    stop() { if (timer) { clearInterval(timer); timer = null; } },
  };

  return {
    init,
    sfx,
    bgm: BGM,
    play(name) { if (!ctx && !init()) return; if (sfx[name]) sfx[name](); },
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.8; },
    isMuted() { return muted; },
  };
})();
