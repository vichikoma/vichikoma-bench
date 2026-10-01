// src/subtitles.js — 底部中英双语卡拉OK字幕条(2D 层,清晰可读)
// 英文为主字幕:切换时机与卡拉OK进度都跟英文走;中文随英文整句同行出现/消失。
window.MV = window.MV || {};

MV.subs = (function () {
  const T = MV.tl;
  const W = T.W, H = T.H;

  const EN_FONT = '700 @px "Trebuchet MS", "Arial Black", Arial, sans-serif';
  const ZH_FONT = '500 @px "Microsoft YaHei", "PingFang SC", sans-serif';

  function draw(ctx, t) {
    const line = T.lyricAt(t);
    // 字幕底衬(渐变,不遮挡画面主体)
    const g = ctx.createLinearGradient(0, H - 240, 0, H);
    g.addColorStop(0, 'rgba(22,14,26,0)');
    g.addColorStop(0.35, 'rgba(22,14,26,0.38)');
    g.addColorStop(1, 'rgba(22,14,26,0.62)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H - 240, W, 240);

    if (!line) return;

    // 入场:轻微上滑 + 淡入(纯 t 函数)
    const inK = T.smooth(T.inv(t, line.a, line.a + 0.16));
    const dy = (1 - inK) * 18;

    const en = line.en, zh = line.zh;
    // 英文主字幕(卡拉OK:已唱部分变亮)
    let enSize = 70;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = EN_FONT.replace('@', enSize);
    while (ctx.measureText(en).width > W - 240 && enSize > 46) {
      enSize -= 2;
      ctx.font = EN_FONT.replace('@', enSize);
    }
    const enY = H - 118 + dy;
    const prog = T.clamp((t - line.a) / Math.max(0.001, line.b - line.a));

    // 描边
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(8, enSize * 0.14);
    ctx.strokeStyle = 'rgba(18,10,20,0.92)';
    ctx.strokeText(en, W / 2, enY);
    // 未唱部分
    ctx.fillStyle = '#e9dfc8';
    ctx.fillText(en, W / 2, enY);
    // 已唱部分(金色,卡拉OK进度按英文推进)
    const wTotal = ctx.measureText(en).width;
    const x0 = W / 2 - wTotal / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0 - 14, enY - enSize * 1.2, wTotal * prog + 8, enSize * 1.6);
    ctx.clip();
    ctx.fillStyle = '#ffd66b';
    ctx.fillText(en, W / 2, enY);
    ctx.restore();

    // 中文辅助字幕
    const zhSize = 52;
    ctx.font = ZH_FONT.replace('@', zhSize);
    const zhY = H - 46 + dy * 0.7;
    ctx.lineWidth = Math.max(7, zhSize * 0.15);
    ctx.strokeStyle = 'rgba(18,10,20,0.92)';
    ctx.strokeText(zh, W / 2, zhY);
    ctx.fillStyle = 'rgba(240,232,216,0.96)';
    ctx.fillText(zh, W / 2, zhY);
  }

  return { draw };
})();
