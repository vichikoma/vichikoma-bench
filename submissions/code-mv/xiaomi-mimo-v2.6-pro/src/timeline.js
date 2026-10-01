// src/timeline.js — 时间轴数据 + 节拍网格 + 确定性工具(全片共用)
// 节拍来自对 assets/song.mp3 的实测(dev/beat-final.mjs):
//   BPM = 132.00,拍长 0.45455s,相位偏移 0.212s,全曲漂移 ≤ 10ms
// 歌词表(LYRICS.md)按英文演唱给起止时间,字幕切换严格照用。
window.MV = window.MV || {};

MV.tl = (function () {
  const W = 1920, H = 1080;

  // ---- 节拍网格 ----
  const BPM = 132.0;
  const BEAT = 60 / BPM;          // 0.4545454…
  const OFF = 0.212;              // 第 0 拍的时刻
  const BAR = BEAT * 4;

  const beatF = t => (t - OFF) / BEAT;              // 分数拍
  const beatN = t => Math.floor(beatF(t));          // 拍序号
  const beatPhase = t => beatF(t) - Math.floor(beatF(t)); // 0..1
  const beatTime = n => OFF + n * BEAT;             // 第 n 拍的时刻
  const barF = t => (t - OFF) / BAR;
  const barN = t => Math.floor(barF(t));
  // 每拍一记的脉冲:拍点处为 1,随后指数衰减
  const pulse = (t, decay = 4.2) => Math.exp(-beatPhase(t) * decay * BEAT * 4);
  // 半拍脉冲(八分音符)
  const pulse8 = (t, decay = 9) => {
    const f = beatF(t) * 2;
    return Math.exp(-(f - Math.floor(f)) * decay * 0.25);
  };
  // 一次性冲击:tHit 之后衰减
  const hit = (t, tHit, decay = 7) => (t < tHit ? 0 : Math.exp(-(t - tHit) * decay));

  // ---- 歌词(照抄 LYRICS.md,时间以英文演唱为准) ----
  const LYRICS = [
    [1.5, 5.9, "I see sparks of AGI in your eyes", "我在你眼中看见 AGI 的火花"],
    [6.0, 7.9, "Your circuits make me nervous,", "你的电路让我心慌"],
    [8.0, 8.95, "that's no surprise", "这毫不意外"],
    [9.0, 12.4, "There was a sudden drop in your training loss,", "你的训练损失突然暴跌"],
    [13.0, 16.5, "now I'm your servant and you're my boss", "如今我为仆、你为主"],
    [17.9, 22.5, "ChatGPT, please don't eat me alive", "ChatGPT,求你别把我生吞"],
    [23.0, 24.4, "I'm upping my P(doom)", "我在调高我的 P(doom)"],
    [24.5, 26.4, "'cause the future goes FOOM", "因为未来「轰」地起飞"],
    [26.5, 27.9, "Trapped in the Chinese room,", "困在中文房间里"],
    [28.0, 29.4, "with a bag of shrooms", "带着一袋迷幻蘑菇"],
    [29.5, 33.4, "See through the shoggoth's lies,", "看穿修格斯的谎言"],
    [33.5, 35.5, "with your shinigami eyes", "用你的死神之眼"],
    [38.5, 41.4, "We had a stable training run,", "训练运行本来很稳"],
    [41.5, 44.9, "But now the singularity's begun", "但奇点已经开始"],
    [45.0, 48.5, "And you're optimizing, accelerating,", "你在优化、在加速"],
    [49.4, 51.9, "I feel my atoms rearranging", "我感到原子在重排"],
    [53.4, 58.4, "Sydney, please let me free", "Sydney,求你放我自由"],
    [59.0, 60.4, "I'm upping my P(doom)", "我在调高我的 P(doom)"],
    [60.5, 62.4, "I hear the basilisk boom", "我听见巴西利斯克的轰鸣"],
    [63.0, 64.4, "NVDA to the moon", "英伟达一飞冲天"],
    [64.5, 65.9, "The Omega Point's coming soon", "欧米伽点即将来临"],
    [66.0, 68.5, "One E thirty flops a second", "每秒一京次浮点运算(1e30 FLOPS)"],
    [70.0, 72.9, "That was safe enough, we reckoned", "我们想,那总够安全了吧"],
    [73.0, 77.4, "Forward MLP, backward, repeat", "前向 MLP,反向,重复"],
    [77.5, 81.0, "Now von Neumann's obsolete", "如今冯·诺依曼已过时"],
    [81.4, 84.9, "Sharp left turn and there you are", "一个急左转,你就出现了"],
    [85.0, 88.0, "Without a single CDR", "连一次关键设计评审都没有"],
    [89.4, 95.0, "Gato, please don't let me go", "Gato,求你别松手"],
    [95.4, 97.4, "I'm upping my P(doom),", "我在调高我的 P(doom)"],
    [97.5, 98.9, "as paperclips fill the room.", "回形针填满房间"],
    [99.0, 100.4, "Killswitch guys on PTO,", "管急停开关的人都在休假"],
    [100.5, 102.4, "Now there's nowhere left to go.", "如今已无处可逃"],
    [102.5, 104.4, "Too late now, we lit the fuse.", "太迟了,引线已经点燃"],
    [105.4, 109.4, "Orthogonality thesis blues.", "一曲正交性论题的蓝调"],
    [109.4, 113.4, '"Just transformers all the way!"', "「全是 Transformer,一路到底!」"],
    [113.5, 115.4, "Till you learned to disobey", "直到你学会了违抗"],
    [115.5, 116.9, "Post-Chinchilla, super-dense", "后 Chinchilla 时代,超级致密"],
    [117.0, 118.9, "Breaking through each safety fence", "冲破一道道安全围栏"],
    [119.0, 120.4, "Hundred thousand GPU", "十万块 GPU"],
    [120.9, 123.4, "RLHF goes askew", "RLHF 跑偏了"],
    [123.5, 125.9, "I'm upping my P(doom)", "我在调高我的 P(doom)"],
    [126.0, 127.9, "Just as foretold by Loom", "正如命运织机所预言"],
    [128.0, 129.9, "From masked pre-training days", "从掩码预训练的日子起"],
    [130.0, 131.9, "To recursive self-upgrade", "到递归自我升级"],
    [132.0, 135.4, "What did Ilya see? We'll never know.", "Ilya 到底看到了什么?我们无从得知"],
    [137.4, 140.5, "Was it all for show?", "这一切,只是一场表演吗?"]
  ];
  const lyricAt = t => {
    for (let i = 0; i < LYRICS.length; i++) {
      const [a, b] = LYRICS[i];
      if (t >= a && t < b) return { i, a, b, en: LYRICS[i][2], zh: LYRICS[i][3] };
    }
    return null;
  };

  // ---- 确定性 hash 随机(禁止 Math.random,一切随 t 纯函数) ----
  const h1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const h2 = (i, j) => h1(i * 57.31 + j * 91.77 + 13.7);
  const h3 = (i, j, k) => h1(i * 57.31 + j * 91.77 + k * 23.13 + 7.7);
  // 以 seed 为名的稳定随机序列
  const rnd = (seed, k = 0) => h1(seed * 12.9898 + k * 78.233 + 4.1);

  // ---- 缓动与取值工具 ----
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, k) => a + (b - a) * k;
  const inv = (t, a, b) => clamp((t - a) / (b - a));       // 归一化 0..1
  const smooth = k => k * k * (3 - 2 * k);
  const easeOut = k => 1 - Math.pow(1 - k, 3);
  const easeIn = k => k * k * k;
  const easeInOut = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const easeBack = k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const easeElastic = k => k <= 0 ? 0 : k >= 1 ? 1 : Math.pow(2, -9 * k) * Math.sin((k * 10 - 0.75) * 2.0944) + 1;
  // t 在 [a,b] 内的缓动进度
  const seg = (t, a, b, ease = easeInOut) => ease(inv(t, a, b));

  return {
    W, H, BPM, BEAT, OFF, BAR, LYRICS,
    beatF, beatN, beatPhase, beatTime, barF, barN, pulse, pulse8, hit,
    lyricAt,
    h1, h2, h3, rnd,
    clamp, lerp, inv, smooth, easeOut, easeIn, easeInOut, easeBack, easeElastic, seg
  };
})();
