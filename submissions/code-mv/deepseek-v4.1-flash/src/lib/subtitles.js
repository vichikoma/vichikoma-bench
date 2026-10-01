// src/lib/subtitles.js — bilingual karaoke captions + big painted sound effects.
// Drawn into the shared 2D text buffer (system fonts => CJK works), composited 1:1 on top.
(function () {
  const MV = window.MV;
  const { clamp, span, smooth, PAL, css } = MV;

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
    [109.4, 113.4, "\"Just transformers all the way!\"", "「全是 Transformer,一路到底!」"],
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

  const EN_FONT = '900 60px "Segoe UI", "Arial Black", Arial, sans-serif';
  const ZH_FONT = '600 44px "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif';
  const BAND_TOP = 968, EN_Y = 1012, ZH_Y = 1058;

  function activeLine(t) {
    for (const L of LYRICS) if (t >= L[0] - 0.06 && t <= L[1] + 0.4) return L;
    return null;
  }

  // karaoke sweep across the english line; chinese shows as a whole-sentence translation
  function draw(t, opts = {}) {
    const tb = MV.textLayer(); if (!tb) return;
    const ctx = tb.drawingContext;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, 1920, 1080);
    const L = opts.line || activeLine(t);
    if (L && opts.hide !== true) {
      const [a, b, en, zh] = L;
      const fadeIn = smooth(span(t, a - 0.12, a + 0.06));
      const fadeOut = 1 - smooth(span(t, b + 0.06, b + 0.42));
      const alpha = clamp(fadeIn * fadeOut);
      if (alpha > 0.01) {
        const prog = clamp((t - a) / Math.max(0.25, b - a));
        // --- soft cream plate so the text stays readable on any background ---
        ctx.save();
        ctx.globalAlpha = alpha;
        const g = ctx.createLinearGradient(0, BAND_TOP - 34, 0, 1080);
        g.addColorStop(0, 'rgba(246,240,226,0)');
        g.addColorStop(0.35, 'rgba(246,240,226,0.72)');
        g.addColorStop(1, 'rgba(246,240,226,0.9)');
        ctx.fillStyle = g; ctx.fillRect(0, BAND_TOP - 34, 1920, 1080 - BAND_TOP + 34);
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        // english: shadow halo
        ctx.font = EN_FONT;
        ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(250,246,236,0.95)'; ctx.lineJoin = 'round';
        ctx.strokeText(en, 960, EN_Y);
        // unsung part
        ctx.fillStyle = 'rgba(92,80,74,0.42)';
        ctx.fillText(en, 960, EN_Y);
        // sung part (clipped sweep)
        const w = ctx.measureText(en).width;
        const x0 = 960 - w / 2;
        ctx.save();
        ctx.beginPath();
        const cut = x0 + w * prog + 6;
        ctx.rect(x0 - 20, EN_Y - 46, cut - x0 + 20, 92);
        ctx.clip();
        ctx.fillStyle = '#2b2324';
        ctx.fillText(en, 960, EN_Y);
        ctx.fillStyle = 'rgba(184,72,58,0.34)';           // warm karaoke ink on the sung part
        ctx.font = EN_FONT;
        ctx.restore();
        // the sung sweep gets a warm underline
        ctx.save();
        ctx.beginPath(); ctx.rect(x0, EN_Y + 30, Math.max(0, cut - x0), 7); ctx.clip();
        ctx.fillStyle = 'rgba(198,86,66,0.75)'; ctx.fillRect(x0, EN_Y + 30, w * prog + 6, 7);
        ctx.restore();
        ctx.restore();

        // chinese辅助字幕
        ctx.save();
        ctx.globalAlpha = alpha * 0.95;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = ZH_FONT;
        ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(250,246,236,0.9)'; ctx.lineJoin = 'round';
        ctx.strokeText(zh, 960, ZH_Y);
        ctx.fillStyle = '#463a38';
        ctx.fillText(zh, 960, ZH_Y);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 1;
  }

  // Big painted onomatopoeia (use sparingly). opts: {color, rot, s, alpha, outline}
  function sfx(text, x, y, opts = {}) {
    // NOTE: shots draw BEFORE subtitles.draw(), which clears the caption buffer — so sound
    // effects must go into the prop buffer (cleared at frame start, composited above the paint).
    const tb = (MV.propLayer && MV.propLayer()) || MV.textLayer(); if (!tb) return;
    const ctx = tb.drawingContext;
    const s = opts.s || 150, alpha = opts.alpha ?? 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y); ctx.rotate(opts.rot || 0);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${s}px "Segoe UI", "Arial Black", Arial, sans-serif`;
    const col = opts.color || PAL.crimson;
    ctx.lineWidth = s * 0.14; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(252,246,232,0.96)';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = css(col, 1);
    ctx.fillText(text, 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  MV.LYRICS = LYRICS;
  MV.subtitles = { draw, sfx, activeLine, BAND_TOP };
})();
