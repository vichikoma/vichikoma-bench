// audio.js - WebAudio 生成音效与可循环 BGM（零外部音频文件）

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmPlaying = false;
    this.muted = false;
    this.bgmTimer = null;
    this.currentStep = 0;
    this.bpm = 124;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.initialized = true;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- 音效生成集合 ---
  // 1. 种植/放置
  playPlant() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(587.33, t + 0.12);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 2. 铲除
  playShovel() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.16);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // 3. 收集咖啡因
  playCollect() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);
      gain.gain.setValueAtTime(0.35, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.005, t + i * 0.04 + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.12);
    });
  }

  // 4. 发射 (加农炮/鱼缸/薪火)
  playShoot(type = 'normal') {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    if (type === 'water') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    } else if (type === 'fire') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    } else {
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    }
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // 5. 命中
  playHit() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // 6. 爆炸 (假装在忙 / 辞职信)
  playExplosion(big = false) {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = big ? 0.6 : 0.35;
    // 白色噪声缓冲
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * (i / bufferSize));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(big ? 600 : 800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(big ? 0.9 : 0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);

    // 叠加低频震颤
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(100, t);
    subOsc.frequency.exponentialRampToValueAtTime(30, t + dur);
    subGain.gain.setValueAtTime(0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    subOsc.start(t);
    subOsc.stop(t + dur);
  }

  // 7. 大波警告警报
  playHugeWave() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const startT = t + i * 0.35;
      osc.frequency.setValueAtTime(300, startT);
      osc.frequency.linearRampToValueAtTime(650, startT + 0.25);
      gain.gain.setValueAtTime(0.45, startT);
      gain.gain.exponentialRampToValueAtTime(0.01, startT + 0.28);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startT);
      osc.stop(startT + 0.28);
    }
  }

  // 8. 敌人缩小钻进工位槽位
  playSlotEnter() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // 9. 年假审批单触发 (清屏轰鸣 + 治愈钟声)
  playVacation() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    // 华丽上行和弦
    [261.63, 329.63, 392.0, 523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const noteT = t + idx * 0.08;
      osc.frequency.setValueAtTime(freq, noteT);
      gain.gain.setValueAtTime(0.5, noteT);
      gain.gain.exponentialRampToValueAtTime(0.005, noteT + 0.6);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(noteT);
      osc.stop(noteT + 0.65);
    });
    // 气浪声
    this.playExplosion(false);
  }

  // 10. 胜利
  playVictory() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const st = t + i * 0.12;
      osc.frequency.setValueAtTime(f, st);
      gain.gain.setValueAtTime(0.45, st);
      gain.gain.exponentialRampToValueAtTime(0.01, st + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.55);
    });
  }

  // 11. 失败 (哀乐/辞退重低音)
  playDefeat() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [392.0, 369.99, 349.23, 311.13, 220.0];
    notes.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      const st = t + i * 0.22;
      osc.frequency.setValueAtTime(f, st);
      gain.gain.setValueAtTime(0.4, st);
      gain.gain.exponentialRampToValueAtTime(0.01, st + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(st);
      osc.stop(st + 0.45);
    });
  }

  // 12. 临时会议跳跃
  playJump() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // 13. 甩锅（自创单位：防狼喷雾/甩锅手套 弹开或挡住）
  playBounce() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // --- BGM: 无缝循环 16小节/32拍 办公轻快Lo-Fi Chiptune ---
  startBGM() {
    this.ensureContext();
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    this.currentStep = 0;
    this.scheduleBGM();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleBGM() {
    if (!this.bgmPlaying || !this.ctx) return;

    const stepDuration = 60 / this.bpm / 2; // 八分音符步长
    const now = this.ctx.currentTime;

    // 旋律音符序列 (32 步循环, 频率 Hz, 0 表示休止)
    // C大调/A小调 律动小调，表现打工人的快节奏与机智幽默
    const melody = [
      261.63, 0, 329.63, 392.0, 523.25, 392.0, 329.63, 0,
      220.00, 0, 261.63, 329.63, 440.00, 329.63, 261.63, 0,
      174.61, 0, 220.00, 261.63, 349.23, 261.63, 220.00, 0,
      196.00, 246.94, 293.66, 392.00, 329.63, 293.66, 261.63, 0
    ];

    // 低音 Bass 序列
    const bass = [
      130.81, 130.81, 0, 130.81, 130.81, 0, 130.81, 0,
      110.00, 110.00, 0, 110.00, 110.00, 0, 110.00, 0,
      87.31,  87.31,  0, 87.31,  87.31,  0, 87.31,  0,
      98.00,  98.00,  0, 98.00,  98.00,  0, 98.00,  0
    ];

    const step = this.currentStep % 32;

    // 播放主旋律音符
    const melFreq = melody[step];
    if (melFreq > 0) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(melFreq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + stepDuration * 0.85);
      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + stepDuration * 0.9);
    }

    // 播放 Bass
    const bassFreq = bass[step];
    if (bassFreq > 0) {
      const bOsc = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassFreq, now);
      bGain.gain.setValueAtTime(0.18, now);
      bGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);
      bOsc.connect(bGain);
      bGain.connect(this.bgmGain);
      bOsc.start(now);
      bOsc.stop(now + stepDuration * 0.95);
    }

    // 节拍鼓点 (偶数步小军鼓/踩镲模拟)
    if (step % 2 === 0) {
      // 滴答敲击
      const click = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      click.type = 'sine';
      click.frequency.setValueAtTime(step % 4 === 0 ? 800 : 400, now);
      cGain.gain.setValueAtTime(0.05, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      click.connect(cGain);
      cGain.connect(this.bgmGain);
      click.start(now);
      click.stop(now + 0.035);
    }

    this.currentStep = (this.currentStep + 1) % 32;
    this.bgmTimer = setTimeout(() => {
      this.scheduleBGM();
    }, stepDuration * 1000);
  }
}

window.soundSystem = new SoundSystem();
