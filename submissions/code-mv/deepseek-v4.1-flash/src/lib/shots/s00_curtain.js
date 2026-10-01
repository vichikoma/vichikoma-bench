// src/lib/shots/s00_curtain.js — Shot 0 · Curtain up (0–1.5s)
// Painted red curtains sweep open, "I'M UPPING MY P(DOOM)" is painted on the backdrop,
// Clawd pops up through a trapdoor and waves. Out: brush wipe into the lab.
(function () {
  const MV = window.MV;
  const { PAL, css, lerp, clamp, span, smooth, easeOut3, easeOut, easeOutBack, beatEnv, beatTime, beatIndex } = MV;

  // brush-wipe transition into shot 1 (cover, then reveal)
  const TX = { coverA: 1.28, coverB: 1.42, revA: 1.42, revB: 1.60 };
  const txOverlay = (t, color = PAL.crimsonDeep, seed = 91) => {
    if (t < TX.coverA) return;
    if (t < TX.revA) MV.wipeBand(smooth(span(t, TX.coverA, TX.coverB)), color, seed, 'in');
    else MV.wipeBand(1 - easeOut(span(t, TX.revA, TX.revB)), color, seed, 'out');
  };

  // ---------------------------------------------------------------- backdrop
  function sunburst(t) {
    const rays = 22, R = 1500;
    for (let i = 0; i < rays; i++) {
      const a0 = (i / rays) * Math.PI * 2, a1 = a0 + (Math.PI * 2 / rays) * 0.5;
      const col = i % 2 ? PAL.crimson : PAL.crimsonDeep;
      MV.flat(col, i % 2 ? 120 : 70);
      brush.polygon([[0, -230], [Math.cos(a0) * R, -230 + Math.sin(a0) * R], [Math.cos(a1) * R, -230 + Math.sin(a1) * R]]);
    }
  }
  function title(t, cam) {
    const ctx = MV.propLayer().drawingContext;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // world -> buffer transform (so the title rides the camera)
    const z = cam.zoom || 1;
    ctx.setTransform(z, 0, 0, z, 960 + (cam.x || 0) * z, 540 + (cam.y || 0) * z);
    const appear = smooth(span(t, 0.9, 1.15));
    ctx.globalAlpha = appear;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = [{ s: "I'M UPPING", y: -250, size: 132, rot: -0.026 }, { s: 'MY P(DOOM)', y: -100, size: 176, rot: 0.018 }];
    for (const L of lines) {
      ctx.save();
      ctx.translate(0, L.y); ctx.rotate(L.rot);
      ctx.font = `900 ${L.size}px Georgia, "Times New Roman", serif`;
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'rgba(72,16,24,0.55)';
      ctx.fillText(L.s, 8, 10);
      ctx.lineWidth = L.size * 0.16; ctx.strokeStyle = '#7c1a24';
      ctx.strokeText(L.s, 0, 0);
      ctx.lineWidth = L.size * 0.08; ctx.strokeStyle = PAL.gold;
      ctx.strokeText(L.s, 0, 0);
      ctx.fillStyle = '#f6e6c4';
      ctx.fillText(L.s, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- stage
  function stage(t) {
    // back wall
    MV.flat(PAL.crimsonDeep, 255);
    brush.polygon([[-980, -560], [980, -560], [980, 300], [-980, 300]]);
    sunburst(t);
    // side wings (darker)
    for (const s of [-1, 1]) {
      MV.flat([84, 18, 28], 210);
      brush.polygon([[s * 700, 300], [s * 980, 300], [s * 980, -560], [s * 760, -560]]);
    }
    // floor: perspective boards
    MV.flat([150, 106, 62], 255);
    brush.polygon([[-1020, 440], [1020, 440], [660, 250], [-660, 250]]);
    for (let i = 0; i < 7; i++) {
      const u = i / 6, y0 = lerp(250, 440, u * u * 0.75 + u * 0.25);
      MV.ink([104, 70, 40], 1.6 + u * 1.2, 'pen');
      brush.line(-1020, y0, 1020, y0);
    }
    MV.flat([176, 128, 74], 190);
    brush.polygon([[-1020, 440], [1020, 440], [1020, 396], [-1020, 396]]);
    // front lip
    MV.flat(PAL.gold, 240);
    brush.polygon([[-1020, 452], [1020, 452], [1020, 430], [-1020, 430]]);
    MV.ink([120, 82, 30], 2, 'pen');
    brush.line(-1020, 430, 1020, 430);
    MV.flat([58, 26, 32], 255);
    brush.polygon([[-1020, 560], [1020, 560], [1020, 448], [-1020, 448]]);
  }

  function trapdoor(t, clawdY) {
    // dark hole
    MV.flat([38, 20, 24], 255);
    brush.polygon(MV.wobbleEllipse(0, 392, 190, 52, 3, 24, 0.04));
    // open flap leaning back
    const flap = smooth(span(t, 0.95, 1.12));
    if (flap < 1) {
      MV.flat([136, 94, 54], 250);
      brush.polygon([[-190, 392 - flap * 60], [190, 392 - flap * 60], [190, 392 - flap * 130], [-190, 392 - flap * 130]]);
    }
  }
  function trapdoorLip() {
    // drawn over Clawd so he reads as rising out of the hole
    MV.flat([160, 114, 66], 255);
    brush.polygon([[-1020, 440], [1020, 440], [1020, 386], [-1020, 386]]);
    MV.ink([104, 70, 40], 1.8, 'pen');
    brush.line(-1020, 386, 1020, 386);
    MV.flat([168, 126, 78], 200);
    brush.polygon([[-1020, 440], [1020, 440], [1020, 404], [-1020, 404]]);
  }

  function footlights(t) {
    for (let i = -3; i <= 3; i++) {
      const x = i * 250, e = beatEnv(t + i * 0.01, 5);
      MV.glow(x, 420, 130 + 30 * e, PAL.lamp, 0.5 + 0.3 * e, 6);
      push(); noStroke(); fill(css(PAL.lamp, 0.95)); ellipse(x, 424, 76, 26); pop();
      push(); noStroke(); fill(css([255, 244, 210], 0.95)); ellipse(x, 421, 44, 13); pop();
    }
  }

  // ---------------------------------------------------------------- curtains
  function curtainPanel(t, side, open) {
    const s = side;                                    // -1 left, +1 right
    const inner = s * open;                            // inner edge x (0 when closed)
    const outX = inner + s * 1080;
    const r = MV.rnd(400 + side);
    const nBand = 9;
    for (let i = 0; i < nBand; i++) {
      const u0 = i / nBand, u1 = (i + 1) / nBand;
      const x0 = lerp(inner, outX, u0), x1 = lerp(inner, outX, u1);
      const sag = Math.sin((i / nBand) * Math.PI) * 16;
      const w0 = (r() - 0.5) * 8;
      const col = i % 2 ? PAL.crimson : [118, 26, 36];
      MV.flat(col, 255);
      brush.polygon([
        [x0, -560], [x1 + w0, -560],
        [x1 + w0 + sag * 0.1, 470 - sag], [x0 - sag * 0.1, 470 + sag]
      ]);
    }
    // shading gradient toward the outer edge
    push(); noStroke();
    for (let i = 0; i < 5; i++) {
      const u = i / 5, x = lerp(inner, outX, u);
      fill(css([60, 12, 22], 0.1)); rect(Math.min(x, x + s * 1080 / 5), -560, 1080 / 5, 1030);
    }
    pop();
    // gold fringe along the inner edge
    MV.flat(PAL.gold, 250);
    brush.polygon([[inner - s * 26, -560], [inner + s * 4, -560], [inner + s * 4, 470], [inner - s * 26, 470]]);
    MV.ink([130, 88, 30], 1.6, 'pen');
    brush.line(inner - s * 26, -560, inner - s * 26, 470);
    // subtle vertical highlight stripes
    MV.ink([190, 92, 84], 3.2, 'pen');
    for (let i = 0; i < 6; i++) {
      const x = lerp(inner, outX, (i + 0.4) / 6);
      brush.line(x, -540, x, 440);
    }
  }

  function valance() {
    MV.flat(PAL.crimson, 255);
    brush.polygon([[-1020, -560], [1020, -560], [1020, -430], [-1020, -430]]);
    for (let i = -4; i <= 4; i++) {
      MV.flat(PAL.crimson, 255);
      brush.polygon(MV.wobbleEllipse(i * 226, -428, 118, 54, 60 + i, 18, 0.07));
    }
    MV.flat(PAL.gold, 250);
    brush.polygon([[-1020, -560], [1020, -560], [1020, -524], [-1020, -524]]);
    MV.flat([120, 26, 36], 255);
    brush.polygon([[-1020, -560], [1020, -560], [1020, -544], [-1020, -544]]);
  }

  // ---------------------------------------------------------------- shot
  function draw(t) {
    const cam = { x: 0, y: -16, zoom: 1 + 0.048 * smooth(span(t, 0, 1.4)) };
    const withLab = t > TX.revA - 0.001;
    if (withLab) {                       // the incoming scene shows through the wipe
      MV.shots.lab.draw(t);
    } else {
      MV.cam(cam);
      stage(t);
      const open = easeOut3(span(t, 0.04, 0.94)) * 1090 + 10 * beatEnv(t, 11) * (t < 0.9 ? 1 : 0);
      // trapdoor + clawd
      trapdoor(t, 0);
      const rise = easeOutBack(span(t, 0.95, 1.19));
      const hop = beatEnv(t, 13) * 9;
      const cy = lerp(540, 296, rise) - hop;
      const sq = 1 + 0.11 * beatEnv(t, 13), sx = 1 - 0.055 * beatEnv(t, 13);
      if (rise > 0.001) {
        MV.clawd({
          x: 0, y: cy, h: 210, seed: 21, sx, sy: sq,
          face: { eyes: t > 1.3 && beatEnv(t, 13) > 0.72 ? 'happy' : 'open', look: [-0.1, 0.1], mouth: 'smile', blush: true },
          arms: { l: -2.0 + 0.25 * Math.sin((t - 1.12) * 9), r: Math.PI + 1.72 - 0.55 * Math.sin((t - 1.12) * 15) },
          extras: []
        });
        if (rise > 0.5) {
          const e = beatEnv(t, 6);
          MV.drawEmote({ kind: 'sparkle', x: -180, y: cy - 190, s: 30 + 26 * e, alpha: clamp(0.4 + e) });
          MV.drawEmote({ kind: 'sparkle', x: 210, y: cy - 150, s: 20 + 40 * (1 - e), alpha: 0.7 });
        }
      }
      trapdoorLip();
      footlights(t);
      curtainPanel(t, -1, open);
      curtainPanel(t, 1, open);
      valance();
      MV.camPop();
    }
    title(t, withLab ? { x: 0, y: 0, zoom: 1 } : cam);
    txOverlay(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.curtain = { a: 0, b: 1.5, draw };
})();
