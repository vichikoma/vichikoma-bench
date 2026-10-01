// src/lib/sets.js — shared stage furniture for the show numbers (chorus 1 & 4) and the
// mouth-iris transition. All pure functions of their arguments (no cross-frame state).
(function () {
  const MV = window.MV;
  const { PAL, lerp, clamp, span, smooth, easeOut3, easeInOut, beatEnv, beatIndex, vnoise, css } = MV;
  const TAU = Math.PI * 2;
  const CONF = [PAL.rose, PAL.ochre, PAL.gold, PAL.tealGlow, [226, 240, 190], [242, 178, 152], PAL.crimson];

  // ---------------------------------------------------------------- backdrop
  // painted sunburst on the back wall (rose + ochre for chorus 1; teal/gold for later acts)
  function sunburst(t, o = {}) {
    const rays = o.rays || 26, R = o.R || 1800, cy = o.cy !== undefined ? o.cy : -200;
    const c1 = o.c1 || PAL.rose, c2 = o.c2 || [186, 78, 72];
    const rot = (o.rot || 0) + (o.spin ? t * o.spin : 0);
    for (let i = 0; i < rays; i++) {
      const a0 = (i / rays) * TAU + rot, a1 = a0 + (TAU / rays) * 0.5;
      MV.flat(i % 2 ? c1 : c2, i % 2 ? (o.a1 !== undefined ? o.a1 : 148) : (o.a2 !== undefined ? o.a2 : 92));
      brush.polygon([[0, cy], [Math.cos(a0) * R, cy + Math.sin(a0) * R], [Math.cos(a1) * R, cy + Math.sin(a1) * R]]);
    }
    MV.glow(0, cy, 380, o.glowCol || PAL.ochre, o.glowA !== undefined ? o.glowA : 0.26, 7);
  }

  // the stage: back wall, angled wings, receding boards, gold lip, dark apron
  function stage(t, o = {}) {
    MV.flat(o.back || PAL.crimson, 255);
    brush.polygon([[-1000, -620], [1000, -620], [1000, 300], [-1000, 300]]);
    sunburst(t, o.sun || {});
    for (const s of [-1, 1]) {                       // wings
      MV.flat(o.wingCol || [96, 30, 40], 215);
      brush.polygon([[s * 690, 300], [s * 1000, 300], [s * 1000, -620], [s * 750, -620]]);
      MV.ink([64, 20, 28], 2, 'pen');
      brush.line(s * 690, 300, s * 1000, 300);
    }
    MV.flat(o.floorCol || [156, 110, 66], 255);      // floor boards
    brush.polygon([[-1060, 460], [1060, 460], [650, 240], [-650, 240]]);
    for (let i = 0; i < 7; i++) {
      const u = i / 6, y0 = lerp(240, 460, u * u * 0.72 + u * 0.28);
      MV.ink([106, 72, 42], 1.6 + u * 1.4, 'pen');
      brush.line(-1060, y0, 1060, y0);
    }
    MV.flat(PAL.gold, 240);                          // front lip
    brush.polygon([[-1060, 474], [1060, 474], [1060, 452], [-1060, 452]]);
    MV.flat(o.apron || [58, 26, 32], 255);           // apron below the lip
    brush.polygon([[-1060, 640], [1060, 640], [1060, 470], [-1060, 470]]);
  }

  function footlights(t, o = {}) {
    const col = o.color || PAL.lamp, y = o.y !== undefined ? o.y : 440;
    for (let i = -3; i <= 3; i++) {
      const x = i * 268, e = beatEnv(t + i * 0.012, 5);
      MV.glow(x, y, 150 + 50 * e, col, 0.42 + 0.34 * e, 6);
      push(); noStroke(); fill(css(col, 0.95)); ellipse(x, y + 4, 80, 26); pop();
      push(); noStroke(); fill(css([255, 246, 214], 0.95)); ellipse(x, y + 1, 46, 13); pop();
    }
  }

  // ---------------------------------------------------------------- P(doom) meter
  // painted stage thermometer: brass stand, glass tube, mercury column, bulb, ticks and a
  // small readout plate. pct is 0..100 (99.9 = topped out). Origin: base of the stand.
  function meter(x, y, s, pct, o = {}) {
    const H = 470 * s, W = 74 * s, bulbR = 44 * s;
    push(); translate(x, y);
    // stand
    MV.flat([122, 84, 48], 250);
    brush.polygon(MV.wobbleRoundRect(0, -8 * s, 190 * s, 26 * s, 8 * s, 71, 4, 1.5));
    MV.flat([150, 106, 60], 255);
    brush.polygon(MV.wobbleRoundRect(0, -H * 0.52, 34 * s, H, 14 * s, 72, 4, 1.4));
    // glass tube
    const tubeH = H * 0.86, tubeW = W;
    const tube = MV.wobbleRoundRect(0, -H * 0.5, tubeW, tubeH, tubeW * 0.5, 73, 5, 1.6);
    MV.flat([238, 232, 216], 250); brush.polygon(tube);
    // mercury column
    const inner = tubeH - 26 * s, frac = clamp(pct / 100);
    const colH = Math.max(tubeW * 0.72, inner * frac);
    const yBase = -H * 0.5 + tubeH * 0.5 - 13 * s;
    const yTop = yBase - colH;
    const liq = o.liquid || (pct > 85 ? [196, 40, 44] : PAL.crimson);
    MV.flat(liq, 250);
    brush.polygon([[ -tubeW * 0.5 + 8 * s, yBase], [tubeW * 0.5 - 8 * s, yBase], [tubeW * 0.5 - 8 * s, yTop + 12 * s], [-tubeW * 0.5 + 8 * s, yTop + 12 * s]]);
    brush.circle(0, yTop + 10 * s, tubeW * 0.5 - 8 * s);
    // bulb + mercury connecting it
    MV.flat(liq, 255);
    brush.circle(0, -2 * s, bulbR);
    MV.flat([238, 232, 216], 250);
    brush.polygon(MV.wobbleRoundRect(0, -H * 0.5 + tubeH * 0.5 - 6 * s, tubeW * 0.62, 40 * s, tubeW * 0.3, 74, 4, 1.2));
    // glass outline + highlight
    MV.ink([104, 92, 84], 1.8, 'pen'); brush.polygon(tube);
    MV.ink([104, 92, 84], 1.6, 'pen'); brush.circle(0, -2 * s, bulbR);
    MV.bloom([255, 255, 255], 110);
    brush.polygon(MV.wobbleRoundRect(-tubeW * 0.24, -H * 0.5 - tubeH * 0.1, tubeW * 0.18, tubeH * 0.5, tubeW * 0.09, 75, 4, 1.0));
    // ticks down the right side + a red danger zone at the top
    MV.flat([214, 74, 66], 120);
    brush.polygon([[tubeW * 0.5 + 4 * s, -H * 0.5 - tubeH * 0.42], [tubeW * 0.5 + 30 * s, -H * 0.5 - tubeH * 0.42], [tubeW * 0.5 + 30 * s, -H * 0.5 + tubeH * 0.5], [tubeW * 0.5 + 4 * s, -H * 0.5 + tubeH * 0.5]]);
    for (let i = 0; i <= 10; i++) {
      const yy = yBase - inner * (i / 10), long = i % 5 === 0;
      MV.ink([96, 84, 76], long ? 2.4 : 1.6, 'pen');
      brush.line(tubeW * 0.5 + 2 * s, yy, tubeW * 0.5 + (long ? 34 : 20) * s, yy);
    }
    // brass readout plate on a post above the tube
    const py = -H * 0.5 - tubeH * 0.5 - 52 * s;
    MV.flat([176, 132, 66], 252);
    brush.polygon(MV.wobbleRoundRect(0, py, 196 * s, 74 * s, 10 * s, 76, 4, 1.6));
    MV.ink([92, 62, 26], 2, 'pen'); brush.polygon(MV.wobbleRoundRect(0, py, 196 * s, 74 * s, 10 * s, 76, 4, 1.6));
    MV.flat([150, 106, 56], 255);
    brush.polygon(MV.wobbleRoundRect(0, -H * 0.5 - tubeH * 0.5 - 6 * s, 18 * s, 40 * s, 5 * s, 77, 3, 1.2));
    pop();
    // readout digits (typed into the overlay buffer so they stay crisp and ride the camera)
    if (o.cam && o.showReadout !== false) {
      const txt = pct >= 99.85 ? '99.9%' : Math.round(pct) + '%';
      MV.propText(txt, x, y + py, {
        cam: o.cam, font: `900 ${Math.round(46 * s)}px Georgia, "Times New Roman", serif`,
        color: o.readoutColor || '#2b2324', outlineColor: 'rgba(250,246,236,0.9)', lineW: 6 * s
      });
    }
  }

  // bicycle pump. o: { travel 0..1 (handle pushed down), hoseTo:[x,y], puffs 0..1 }
  function pump(x, y, s, o = {}) {
    const H = 300 * s, W = 92 * s, tr = clamp(o.travel || 0);
    push(); translate(x, y);
    MV.flat([92, 98, 108], 250);                       // base
    brush.polygon(MV.wobbleRoundRect(0, -10 * s, 168 * s, 22 * s, 7 * s, 81, 4, 1.4));
    // cylinder
    MV.flat([206, 200, 186], 250);
    brush.polygon(MV.wobbleRoundRect(0, -H * 0.5, W, H, W * 0.24, 82, 5, 1.5));
    MV.ink([84, 78, 74], 1.8, 'pen'); brush.polygon(MV.wobbleRoundRect(0, -H * 0.5, W, H, W * 0.24, 82, 5, 1.5));
    MV.bloom([255, 255, 255], 90);
    brush.polygon(MV.wobbleRoundRect(-W * 0.22, -H * 0.5, W * 0.16, H * 0.6, W * 0.08, 83, 4, 1.2));
    // rod + T handle (translates down with the stroke)
    const rodTop = -H * 0.5 - 150 * s + tr * (150 * s);
    MV.flat([150, 156, 166], 252);
    brush.rect(0, (rodTop + (-H * 0.5)) * 0.5, 20 * s, Math.abs(rodTop + H * 0.5) + 8 * s, 'center');
    MV.flat([196, 60, 52], 252);
    brush.polygon(MV.wobbleRoundRect(0, rodTop - 16 * s, 132 * s, 34 * s, 12 * s, 84, 4, 1.4));
    MV.ink([92, 34, 30], 1.8, 'pen'); brush.polygon(MV.wobbleRoundRect(0, rodTop - 16 * s, 132 * s, 34 * s, 12 * s, 84, 4, 1.4));
    pop();
    // hose: wobbly line from the cylinder head to the meter bulb
    if (o.hoseTo) {
      const p0 = [x + W * 0.34, y - H * 0.86], p1 = o.hoseTo;
      MV.ink([64, 60, 62], 6.5 * s, 'pen');
      for (let i = 0; i <= 10; i++) {
        const u = i / 10;
        const px = lerp(p0[0], p1[0], u), pyy = lerp(p0[1], p1[1], u) + Math.sin(u * Math.PI) * 70 * s;
        const u2 = (i + 1) / 10;
        const qx = lerp(p0[0], p1[0], u2), qy = lerp(p0[1], p1[1], u2) + Math.sin(u2 * Math.PI) * 70 * s;
        if (i < 10) brush.line(px, pyy, qx, qy);
      }
    }
    // release puffs
    if (o.puffs > 0.02) {
      const r = MV.rnd(88);
      for (let i = 0; i < 5; i++) {
        MV.flat([236, 232, 220], 120 * o.puffs);
        brush.circle(x + (r() - 0.5) * 120 * s, y - H * 0.7 - r() * 90 * s * o.puffs, (14 + r() * 26) * s * (0.5 + o.puffs));
      }
    }
  }

  // ---------------------------------------------------------------- confetti
  function confetti(t, o = {}) {
    const n = o.n || 70, seed = o.seed || 5, top = -620, bot = o.bot !== undefined ? o.bot : 470;
    const t0 = o.t0 !== undefined ? o.t0 : 0;
    const r = MV.rnd(seed);
    push(); noStroke();
    for (let i = 0; i < n; i++) {
      const x0 = (r() - 0.5) * 2400, ph = r(), sp = 130 + r() * 150, sz = 11 + r() * 16;
      const rot0 = r() * TAU, col = CONF[Math.floor(r() * CONF.length)];
      const u = ((t - t0) * sp + ph * 1500) % 1500;
      const y = lerp(top, bot, u / 1500);
      if (y > bot) continue;
      const x = x0 + Math.sin(t * 2.2 + ph * 11) * 46;
      const a = clamp((bot - y) / 120) * (o.alpha !== undefined ? o.alpha : 0.9);
      fill(css(col, a));
      translate(x, y); rotate(rot0 + t * (1.5 + ph * 3));
      rect(-sz * 0.5, -sz * 0.25, sz * (0.8 + 0.5 * beatEnv(t, 6)), sz * 0.5, sz * 0.16);
      rotate(-(rot0 + t * (1.5 + ph * 3))); translate(-x, -y);
    }
    pop();
  }

  // ---------------------------------------------------------------- mouth iris
  // paints gums/lips over the whole frame except an almond-shaped opening, so the stage
  // appears to be seen from inside a mouth. Screen space (call after camPop).
  //   cx,cy, rx,ry : the opening;  o: { teeth 0..1, gum, lip, rim, ragged }
  function mouthIris(cx, cy, rx, ry, o = {}) {
    const gum = o.gum || [116, 22, 32], lip = o.lip || [196, 66, 64];
    const N = 46, X0 = -1020, X1 = 1020, Y0 = -640, Y1 = 640;
    const edge = (xm) => {
      const u = (xm - cx) / Math.max(1, rx);
      if (Math.abs(u) >= 1) return null;
      const jit = (vnoise(xm * 0.006 + 3, 71) - 0.5) * 2 * (o.ragged !== undefined ? o.ragged : 9);
      const dy = ry * Math.sqrt(1 - u * u);
      return [cy - dy + jit, cy + dy - jit];
    };
    // gum: vertical strips covering everything outside the opening
    for (let i = 0; i < N; i++) {
      const xa = lerp(X0, X1, i / N) - 2, xb = lerp(X0, X1, (i + 1) / N) + 2, xm = (xa + xb) / 2;
      const e = edge(xm);
      const yTop = e ? e[0] : Y1, yBot = e ? e[1] : Y0;
      MV.flat(gum, 255);
      if (yTop > Y0) brush.polygon([[xa, Y0], [xb, Y0], [xb, yTop], [xa, yTop]]);
      if (yBot < Y1) brush.polygon([[xa, yBot], [xb, yBot], [xb, Y1], [xa, Y1]]);
      // lip band hugging the opening
      if (e) {
        const bw = 30;
        MV.flat(lip, 255);
        if (yTop - bw > Y0) brush.polygon([[xa, yTop - bw], [xb, yTop - bw], [xb, yTop], [xa, yTop]]);
        if (yBot + bw < Y1) brush.polygon([[xa, yBot], [xb, yBot], [xb, yBot + bw], [xa, yBot + bw]]);
      }
    }
    // soft dark rim inside the opening (throat shadow)
    if (o.rim !== false) {
      for (let i = 0; i < N; i++) {
        const xa = lerp(X0, X1, i / N) - 2, xb = lerp(X0, X1, (i + 1) / N) + 2, xm = (xa + xb) / 2;
        const e = edge(xm);
        if (!e) continue;
        const bw = 22;
        MV.flat([54, 8, 14], 130);
        brush.polygon([[xa, e[0]], [xb, e[0]], [xb, e[0] + bw], [xa, e[0] + bw]]);
        brush.polygon([[xa, e[1] - bw], [xb, e[1] - bw], [xb, e[1]], [xa, e[1]]]);
      }
    }
    // teeth hanging off both lip edges into the opening
    const th = clamp(o.teeth !== undefined ? o.teeth : 1);
    if (th > 0.02) {
      const nT = 11, toothLen = 150 * th;
      for (let i = 0; i < nT; i++) {
        const xm = lerp(cx - rx * 0.93, cx + rx * 0.93, (i + 0.5) / nT);
        const e = edge(xm);
        if (!e) continue;
        const w = (rx / nT) * 0.62;
        const room = Math.min(toothLen, Math.max(0, cy - 6 - e[0]));
        if (room > 12) {
          MV.flat([248, 242, 226], 252);
          brush.polygon([[xm - w, e[0] + 4], [xm + w, e[0] + 4], [xm, e[0] + 4 + room]]);
          MV.ink([120, 106, 96], 1.6, 'pen');
          brush.polygon([[xm - w, e[0] + 4], [xm + w, e[0] + 4], [xm, e[0] + 4 + room]]);
        }
        const room2 = Math.min(toothLen * 0.86, Math.max(0, e[1] - 6 - cy));
        if (room2 > 12) {
          MV.flat([248, 242, 226], 252);
          brush.polygon([[xm - w, e[1] - 4], [xm + w, e[1] - 4], [xm, e[1] - 4 - room2]]);
          MV.ink([120, 106, 96], 1.6, 'pen');
          brush.polygon([[xm - w, e[1] - 4], [xm + w, e[1] - 4], [xm, e[1] - 4 - room2]]);
        }
      }
    }
  }

  // ---------------------------------------------------------------- misc
  // on-beat stepped ramp: holds, then snaps to the next value on the given beat indices
  function stair(t, k0, k1, v0, v1, snap = 0.16) {
    const p0 = MV.beatPos(t), n = k1 - k0;
    const f = clamp((p0 - k0) / n);
    const steps = Math.floor(f * n);
    const local = f * n - steps;
    const u = clamp(local / snap);
    const a = lerp(v0, v1, steps / n), b = lerp(v0, v1, (steps + 1) / n);
    return lerp(a, b, u * u * (3 - 2 * u));
  }
  // painted sparkle burst (fireworks / magic)
  function burst(x, y, r, seed, col, n = 12) {
    const rr = MV.rnd(seed);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rr() * 0.4, len = r * (0.6 + rr() * 0.7);
      MV.ink(col, 3 + rr() * 3, 'pen');
      brush.line(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, x + Math.cos(a) * len, y + Math.sin(a) * len);
    }
  }
  // soft painted cloud / smoke blob
  function cloud(x, y, w, h, seed, col, alpha = 220) {
    const rr = MV.rnd(seed);
    for (let i = 0; i < 7; i++) {
      const u = i / 6;
      MV.flat(col, alpha);
      brush.polygon(MV.wobbleEllipse(x + (u - 0.5) * w * 0.72, y + (rr() - 0.5) * h * 0.4, w * (0.2 + rr() * 0.16), h * (0.28 + rr() * 0.22), seed + i, 18, 0.11));
    }
  }

  MV.sets = { sunburst, stage, footlights, meter, pump, confetti, mouthIris, stair, burst, cloud };
})();
