/* ============================================================
 * audio.js —— 全部声音运行时 WebAudio 合成（零音频文件）
 * SFX：种植/铲除/发射/泼水/命中/爆炸/清场/警告/收集/年假/冻结/
 *      连锁@/入槽/被咬/武装完成/点击/错误/胜利/失败
 * BGM：8 小节办公室放克循环，lookahead 调度器实现无缝循环
 * ============================================================ */
'use strict';

const Sound = (() => {
  let ctx = null, master = null, sfxBus = null, bgmBus = null;
  let bgmOn = true, started = false;
  let noiseBuf = null;

  function ensure() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return false; }
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
    bgmBus = ctx.createGain(); bgmBus.gain.value = 0.42; bgmBus.connect(master);
    // 预生成噪声
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }

  /* ---------- 基础发声器 ---------- */
  function tone({ f = 440, f2 = null, t0 = 0, dur = 0.15, type = 'sine', vol = 0.3, bus = () => sfxBus, attack = 0.005, curve = 'exp' }) {
    if (!ctx) return;
    const t = ctx.currentTime + t0;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (f2 !== null) {
      if (curve === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
      else o.frequency.linearRampToValueAtTime(Math.max(f2, 1), t + dur);
    }
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus());
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise({ t0 = 0, dur = 0.2, vol = 0.3, freq = 1200, q = 0.8, type = 'bandpass', bus = () => sfxBus, sweep = null }) {
    if (!ctx) return;
    const t = ctx.currentTime + t0;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(sweep, 20), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus());
    s.start(t); s.stop(t + dur + 0.05);
  }

  /* ---------- SFX 清单 ---------- */
  const SFX = {
    click()    { tone({ f: 700, f2: 900, dur: 0.06, type: 'square', vol: 0.12 }); },
    error()    { tone({ f: 200, f2: 120, dur: 0.18, type: 'sawtooth', vol: 0.2 }); },
    plant()    { noise({ dur: 0.12, vol: 0.25, freq: 500, sweep: 2200, type: 'lowpass' });
                 tone({ f: 320, f2: 520, dur: 0.14, type: 'triangle', vol: 0.25 }); },
    shovel()   { noise({ dur: 0.22, vol: 0.3, freq: 2600, sweep: 400, type: 'highpass' });
                 tone({ f: 180, f2: 90, dur: 0.2, type: 'square', vol: 0.12 }); },
    shoot()    { tone({ f: 620, f2: 240, dur: 0.09, type: 'square', vol: 0.16 });
                 noise({ dur: 0.05, vol: 0.08, freq: 3000, type: 'highpass' }); },
    splash()   { noise({ dur: 0.18, vol: 0.2, freq: 1800, sweep: 600, type: 'bandpass', q: 1.5 });
                 tone({ f: 500, f2: 260, dur: 0.12, type: 'sine', vol: 0.12 }); },
    hit()      { noise({ dur: 0.07, vol: 0.2, freq: 900, q: 2 }); },
    explode()  { noise({ dur: 0.5, vol: 0.5, freq: 700, sweep: 90, type: 'lowpass' });
                 tone({ f: 130, f2: 40, dur: 0.45, type: 'sawtooth', vol: 0.35 }); },
    bigClear() { noise({ dur: 0.9, vol: 0.4, freq: 2400, sweep: 150, type: 'lowpass' });
                 for (let i = 0; i < 5; i++) tone({ t0: i * 0.07, f: 900 - i * 130, f2: 200, dur: 0.3, type: 'triangle', vol: 0.16 }); },
    warn()     { for (let i = 0; i < 3; i++) { tone({ t0: i * 0.42, f: 440, f2: 587, dur: 0.36, type: 'sawtooth', vol: 0.22 });
                 tone({ t0: i * 0.42, f: 220, f2: 293, dur: 0.36, type: 'sawtooth', vol: 0.14 }); } },
    bossWarn() { tone({ f: 98, f2: 90, dur: 1.2, type: 'sawtooth', vol: 0.3 });
                 tone({ t0: 0.3, f: 147, f2: 130, dur: 0.9, type: 'square', vol: 0.12 });
                 noise({ t0: 0.1, dur: 0.8, vol: 0.1, freq: 300, sweep: 100, type: 'lowpass' }); },
    collect()  { tone({ f: 880, dur: 0.08, type: 'sine', vol: 0.22 });
                 tone({ t0: 0.07, f: 1320, dur: 0.1, type: 'sine', vol: 0.2 }); },
    make()     { tone({ f: 523, dur: 0.07, type: 'triangle', vol: 0.14 });
                 tone({ t0: 0.06, f: 784, dur: 0.09, type: 'triangle', vol: 0.12 }); },
    leave()    {  // 年假：纸张甩出 + 上行叮咚
                 noise({ dur: 0.3, vol: 0.18, freq: 5000, sweep: 1500, type: 'highpass' });
                 [523, 659, 784, 1046].forEach((f, i) => tone({ t0: 0.15 + i * 0.09, f, dur: 0.16, type: 'sine', vol: 0.16 })); },
    slotIn()   { noise({ dur: 0.16, vol: 0.16, freq: 400, sweep: 1600, type: 'lowpass' });
                 tone({ t0: 0.1, f: 150, f2: 70, dur: 0.14, type: 'square', vol: 0.18 }); },
    bite()     { noise({ dur: 0.08, vol: 0.16, freq: 400, q: 3 }); tone({ f: 110, f2: 60, dur: 0.1, type: 'square', vol: 0.14 }); },
    arm()      { tone({ f: 330, dur: 0.09, type: 'square', vol: 0.14 }); tone({ t0: 0.09, f: 494, dur: 0.12, type: 'square', vol: 0.14 }); },
    fuse()     { noise({ dur: 0.1, vol: 0.12, freq: 6000, type: 'highpass' }); },
    chain()    { tone({ f: 1200, f2: 1600, dur: 0.05, type: 'square', vol: 0.1 }); },
    notify()   { tone({ f: 740, dur: 0.06, type: 'sine', vol: 0.16 }); tone({ t0: 0.05, f: 988, dur: 0.09, type: 'sine', vol: 0.14 }); },
    freeze()   { noise({ dur: 0.4, vol: 0.14, freq: 6000, sweep: 2500, type: 'highpass' });
                 tone({ f: 2000, f2: 600, dur: 0.4, type: 'sine', vol: 0.1 }); },
    eat()      { tone({ f: 240, f2: 100, dur: 0.25, type: 'sawtooth', vol: 0.18 }); },
    win()      { const mel = [523, 659, 784, 1046, 784, 1046, 1318];
                 mel.forEach((f, i) => tone({ t0: i * 0.16, f, dur: 0.3, type: 'triangle', vol: 0.22 }));
                 tone({ t0: 0.96, f: 261, dur: 1.2, type: 'sawtooth', vol: 0.1 }); },
    lose()     { const mel = [392, 330, 262, 196];
                 mel.forEach((f, i) => tone({ t0: i * 0.32, f, f2: f * 0.97, dur: 0.5, type: 'sawtooth', vol: 0.2 }));
                 noise({ t0: 1.1, dur: 0.8, vol: 0.12, freq: 200, sweep: 60, type: 'lowpass' }); },
  };

  /* ---------- BGM：办公室放克 8 小节循环 ---------- */
  // 每 16 分音符一步；A 小调。bass/keys/melody/hat/kick/snare/clap
  const BPM = 104, SPB = 60 / BPM, STEP = SPB / 4;
  const N = (semi) => 440 * Math.pow(2, semi / 12);
  const BASS = () => {
    const s = new Array(128).fill(0);
    const bars = [[-24, -24, -17, -24, -19, -24, -17, -12], [-24, -24, -17, -24, -19, -24, -22, -24],
                  [-26, -26, -19, -26, -21, -26, -19, -14], [-29, -29, -22, -29, -24, -29, -22, -20]];
    for (let b = 0; b < 8; b++) {
      const pat = bars[b % 4];
      pat.forEach((n, i) => { s[b * 16 + i * 2] = n; s[b * 16 + i * 2 + 1] = n + (i % 4 === 3 ? 12 : 0); });
    }
    s[63] = -12; s[79] = -10; s[95] = -5; s[111] = -8;   // 过门小加花
    return s;
  };
  const CHORDS = () => { // keys 反拍 stab
    const s = new Array(128).fill(null);
    const prog = [[-24, -17, -12, -10], [-24, -17, -12, -8], [-22, -15, -10, -8], [-19, -12, -7, -5]];
    for (let b = 0; b < 8; b++) {
      const ch = prog[b % 4];
      [6, 10, 14].forEach((off) => { s[b * 16 + off] = ch; });
      if (b % 4 === 3) s[b * 16 + 12] = ch.map(n => n + 2);
    }
    return s;
  };
  const MELODY = () => { // 口哨式主旋律（32 分里抽 16 分），两段问答
    const s = new Array(128).fill(0);
    const put = (i, n) => { s[i] = n; };
    const lineA = [-12, -5, -7, -12, -10, -7, -3, -5];  
    const lineB = [-1, -3, -5, -7, -8, -7, -5, -3];
    lineA.forEach((n, i) => put(i * 4 + 2, n));
    lineA.forEach((n, i) => put(32 + i * 4 + 2, n - 2));
    lineB.forEach((n, i) => put(64 + i * 4 + 2, n));
    lineB.forEach((n, i) => put(96 + i * 4 + 2, n + 4));
    s[62] = -15; s[124] = -17; s[126] = -15;
    return s;
  };
  const HAT = () => { const s = new Array(128).fill(0); for (let i = 0; i < 128; i++) if (i % 2 === 1) s[i] = 1; for (let b = 0; b < 8; b++) s[b * 16 + 15] = 2; return s; };
  const KICK = [0, 8, 18, 26, 32, 40, 50, 58, 64, 72, 82, 90, 96, 104, 114, 122];
  const SNARE = [4, 12, 20, 28, 36, 44, 52, 60, 68, 76, 84, 92, 100, 108, 116, 124];
  const bassSeq = BASS(), chordSeq = CHORDS(), melSeq = MELODY(), hatSeq = HAT();

  function bgmVoice(type, freq, t, dur, vol, glide = 0) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(freq * glide, t + dur * 0.9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bgmBus);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function bgmNoise(t, dur, vol, freq, type, q) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(bgmBus);
    s.start(t); s.stop(t + dur + 0.02);
  }

  let schedTimer = null, nextStep = 0, stepIdx = 0;
  function scheduleSteps() {
    const ahead = 0.25;
    while (nextStep < ctx.currentTime + ahead) {
      const t = Math.max(nextStep, ctx.currentTime + 0.02);
      const i = stepIdx % 128;
      if (bassSeq[i]) bgmVoice('sawtooth', N(bassSeq[i]), t, STEP * 1.8, 0.16);
      const ch = chordSeq[i];
      if (ch) ch.forEach(n => bgmVoice('square', N(n + 12), t, STEP * 1.2, 0.024));
      if (melSeq[i] && (stepIdx % 2 === 0)) {
        bgmVoice('triangle', N(melSeq[i] + 24), t, STEP * 2.6, 0.12, 1.02);
        bgmVoice('sine', N(melSeq[i] + 36), t, STEP * 1.6, 0.02);
      }
      const h = hatSeq[i];
      if (h) bgmNoise(t, h === 2 ? 0.16 : 0.045, h === 2 ? 0.06 : 0.033, 9000, 'highpass', 0.7);
      if (KICK.includes(i)) bgmVoice('sine', 160, t, 0.14, 0.32, 0.35);
      if (SNARE.includes(i)) { bgmNoise(t, 0.1, 0.08, 1900, 'bandpass', 0.8); bgmVoice('triangle', 190, t, 0.07, 0.06); }
      stepIdx++; nextStep += STEP;
    }
  }
  function startBGM() {
    if (!ctx || schedTimer) return;
    nextStep = ctx.currentTime + 0.1; stepIdx = 0;
    schedTimer = setInterval(scheduleSteps, 90);
  }
  function stopBGM() { if (schedTimer) { clearInterval(schedTimer); schedTimer = null; } }

  /* ---------- 对外接口 ---------- */
  return {
    /** 必须在用户手势里调用一次（开始按钮） */
    unlock() { if (!ensure()) return false; resume(); if (!started) { started = true; } if (bgmOn) startBGM(); return true; },
    play(name) { if (!ctx) return; if (SFX[name]) SFX[name](); },
    setBGM(on) { bgmOn = on; if (!ctx) return; if (on) { bgmBus.gain.value = 0.42; startBGM(); } else stopBGM(); },
    duckBGM(d) { if (ctx) bgmBus.gain.setTargetAtTime(d ? 0.12 : 0.42, ctx.currentTime, 0.15); },
    get ctx() { return ctx; },
  };
})();
