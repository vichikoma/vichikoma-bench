// subs.js — bilingual karaoke bar on the 2D out-canvas (crisp text, English-led timing)
'use strict';
/* global W,H,LYRICS */

function findLyric(t) {
  let cur = null;
  for (const L of LYRICS) { if (t >= L[0] && t < L[1]) { cur = L; break; } }
  return cur;
}
function drawSubsBar(ctx, t) {
  const L = findLyric(t);
  const y0 = 950, hh = H - y0; // band 950..1080
  if (!L) return;
  const [s, e, en, zh] = L;
  // band
  ctx.fillStyle = 'rgba(22,14,18,0.66)';
  ctx.fillRect(0, y0, W, hh);
  // top border: hand-painted feel double line
  ctx.fillStyle = 'rgba(240,200,90,0.9)';
  ctx.fillRect(0, y0, W, 4);
  ctx.fillStyle = 'rgba(240,200,90,0.35)';
  ctx.fillRect(0, y0 + 6, W, 2);
  const cx = W / 2;
  // English (primary, karaoke fill)
  const enSize = 54, zhSize = 36;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const enY = y0 + 32 + enSize * 0.42, zhY = y0 + 40 + enSize + zhSize * 0.42;
  ctx.font = `bold ${enSize}px "Trebuchet MS", "Comic Sans MS", sans-serif`;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,6,10,0.85)'; ctx.lineWidth = 8;
  ctx.strokeText(en, cx, enY);
  ctx.fillStyle = '#f7f2e4';
  ctx.fillText(en, cx, enY);
  // karaoke sweep
  const u = Math.max(0, Math.min(1, (t - s) / (e - s)));
  if (u > 0) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, y0, W * u, hh); ctx.clip();
    ctx.strokeStyle = 'rgba(10,6,10,0.85)'; ctx.lineWidth = 8;
    ctx.strokeText(en, cx, enY);
    ctx.fillStyle = '#ffd257';
    ctx.fillText(en, cx, enY);
    ctx.restore();
  }
  // Chinese (secondary)
  ctx.font = `${zhSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
  ctx.strokeStyle = 'rgba(10,6,10,0.8)'; ctx.lineWidth = 5;
  ctx.strokeText(zh, cx, zhY);
  ctx.fillStyle = '#e8ddc4';
  ctx.fillText(zh, cx, zhY);
}
