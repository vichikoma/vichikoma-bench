// src/lib/shots/s09_curtain.js — Shot 9 · Curtain call (140.5–156.6) · crimson and gold
//  140.5 the whole cast lines up and bows; flowers and confetti; the meter pops like a balloon
//  147.0 the final big dance, then the curtain falls with the title painted on it
//  150.0 the curtain closes, the title holds, and we fade to paper
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeIn, easeOut, easeOut3, easeOut4, easeInOut, easeBack, easeOutBack,
    mix, css, rnd, vnoise, shake, hump, beatEnv, beatPos, beatIndex, beatTime, SPB
  } = MV;
  const TAU = Math.PI * 2;

  const feetY = (feet, h) => feet - h * 0.62;
  const camOn = (px, py, zoom, extra) => Object.assign({ x: -px * (zoom - 1), y: -py * (zoom - 1), zoom }, extra || {});
  const camAt = (px, py, zoom, extra) => Object.assign({ x: -px * zoom, y: -py * zoom, zoom }, extra || {});
  const poly = (pts, col, a) => { MV.flat(col, a === undefined ? 252 : a); brush.polygon(pts); };
  const inkPoly = (pts, col, w) => { MV.ink(col, w, 'pen'); brush.polygon(pts); };
  const rr = (cx, cy, w, h, r, seed, amp) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp === undefined ? 1.6 : amp);
  const ell = (cx, cy, rx, ry, seed, n = 20, amp = 0.05) => MV.wobbleEllipse(cx, cy, rx, ry, seed, n, amp);
  const line2 = (x1, y1, x2, y2, col, w) => { MV.ink(col, w, 'pen'); brush.line(x1, y1, x2, y2); };
  const dot = (x, y, r, col, a) => { MV.flat(col, a === undefined ? 250 : a); brush.circle(x, y, r); };
  const wig = (t, amp, sp, seed) => amp * Math.sin(t * sp + seed * 2.7);

  const BAND = { zoom: 1, fx: 0, cy: 0, hw: 1100, hh: 700 };
  function setBandCam(c) {
    const z = c.zoom || 1;
    BAND.zoom = z; BAND.fx = -(c.x || 0) / z; BAND.cy = -(c.y || 0) / z;
    BAND.hw = 960 / z + 140; BAND.hh = 540 / z + 140;
  }
  const onCanvas = (x, y, ext) =>
    Math.abs(x - BAND.fx) - (ext || 0) < BAND.hw + 90 && Math.abs(y - BAND.cy) - (ext || 0) < BAND.hh + 90;

  // a confetti mote
  function confetti(t, seed, x0, delay) {
    const r2 = rnd(seed);
    const life = 4.2, ph = ((t - 140.5 - delay) / life);
    if (ph < 0) return;
    const u = (ph * 1.0) % 1;
    const x = x0 + (r2() - 0.5) * 300 + 90 * Math.sin(u * 6 + seed);
    const y = -1100 + u * 2400;
    const s = 12 + r2() * 16;
    push(); translate(x, y); rotate(u * 9 + seed);
    const cols = [[246, 226, 180], [232, 120, 120], [240, 180, 96], [126, 200, 190], [222, 226, 232]];
    poly(rr(0, 0, s * 1.7, s, 3, seed, 1), cols[Math.floor(r2() * cols.length)], 240);
    pop();
  }

  // a little flower
  function flower(x, y, s, seed, col) {
    const r2 = rnd(seed);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + seed;
      poly(ell(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, s * 0.34, s * 0.3, seed + i, 12, 0.1), col, 250);
    }
    dot(x, y, s * 0.22, [248, 218, 130], 252);
  }

  // ---------------------------------------------------------------- the cast, lining up
  function castAt(i, t, bowAmt, dance) {
    // returns {x, y, who}
    const line = [
      { x: -1050, who: 'shoggoth' }, { x: -750, who: 'basilisk' }, { x: -460, who: 'chinchilla' },
      { x: -170, who: 'clawd' }, { x: 150, who: 'res' }, { x: 460, who: 'sydney' }, { x: 770, who: 'gato' }
    ];
    const it = line[i]; if (!it) return null;
    const ph = i * 0.55;
    const bounce = Math.abs(Math.sin((t - 140.5) * 3.4 + ph)) * dance;
    return { x: it.x, y: 470 - bounce * 34, who: it.who, bow: bowAmt, ph };
  }

  function drawCast(t, bowAmt, dance, alpha) {
    for (let i = 0; i < 7; i++) {
      const c = castAt(i, t, bowAmt, dance);
      if (!c || !onCanvas(c.x, c.y, 400)) continue;
      const bob = Math.sin(t * 3.4 + c.ph) * 0.06 * dance;
      push(); translate(c.x, c.y);
      rotate(c.bow * 0.34 + bob);
      const A = alpha === undefined ? 1 : alpha;
      if (c.who === 'clawd') {
        MV.clawd({
          x: 0, y: feetY(0, 230), h: 230, seed: 3, rot: 0,
          face: { eyes: c.bow > 0.5 ? 'happy' : 'open', look: [0, -0.3], mouth: 'smile' }, extras: ['hat'],
          arms: c.bow > 0.5 ? { l: 2.4, r: 2.4 } : { l: -1.2 + 1.4 * Math.sin(t * 3.4), r: -1.2 - 1.4 * Math.sin(t * 3.4) },
          legs: { l: 0.6, r: -0.6 }
        });
      } else if (c.who === 'res') {
        MV.researcher({
          x: 0, y: 0, s: 300, seed: 5, pose: 'stand', rot: 0,
          face: { look: [0, -0.2], mouth: 'smile', glasses: 'sweat', sweatN: 0 },
          arms: c.bow > 0.5 ? { l: 0.9, r: -0.9 } : { l: -1.1 + 1.2 * Math.sin(t * 3.4), r: -1.1 - 1.2 * Math.sin(t * 3.4) }
        });
      } else if (c.who === 'shoggoth') {
        // a dark tentacled blob, wearing a smiley mask
        poly(ell(0, -170, 210 + 14 * Math.sin(t * 2.2), 190, 8100, 22, 0.08), [66, 52, 84], 250);
        inkPoly(ell(0, -170, 210, 190, 8100, 22, 0.08), [28, 20, 40], 6);
        for (let k = 0; k < 7; k++) {
          const a = PI + (k / 6) * PI;
          const wob = 30 * Math.sin(t * 2.4 + k);
          MV.ink([28, 20, 40], 26, 'pen');
          brush.line(Math.cos(a) * 170, -120, Math.cos(a) * 230, -120 + Math.sin(a) * 150 + wob + 90);
        }
        poly(ell(0, -210, 150, 96, 8101, 18, 0.06), [242, 236, 200], 252);
        inkPoly(ell(0, -210, 150, 96, 8101, 18, 0.06), [120, 100, 60], 5);
        MV.ink([40, 34, 30], 9, 'pen');
        brush.arc(0, -226, 60, 44, 0.15, PI - 0.15);
        dot(-58, -262, 13, [40, 34, 30], 252); dot(58, -262, 13, [40, 34, 30], 252);
      } else if (c.who === 'basilisk') {
        // a crowned serpent head on a coil
        for (let k = 0; k < 4; k++) {
          const yy = -40 - k * 90;
          poly(ell(30 * Math.sin(k * 1.1), yy, 150 - k * 12, 70, 8110 + k, 18, 0.07), [64, 132, 84], 250);
          inkPoly(ell(30 * Math.sin(k * 1.1), yy, 150 - k * 12, 70, 8110 + k, 18, 0.07), [26, 62, 40], 5);
        }
        poly(ell(0, -430, 130, 110, 8115, 20, 0.06), [72, 146, 92], 252);
        inkPoly(ell(0, -430, 130, 110, 8115, 20, 0.06), [26, 62, 40], 6);
        dot(-46, -450, 20, [238, 220, 120], 252); dot(46, -450, 20, [238, 220, 120], 252);
        dot(-46, -450, 8, [22, 24, 20], 252); dot(46, -450, 8, [22, 24, 20], 252);
        const cpts = [];
        for (let k = 0; k <= 8; k++) {
          const a = k / 8;
          cpts.push([-96 + a * 192, -520 - (k % 2 ? 74 : 22)]);
        }
        poly(cpts.concat([[96, -506], [-96, -506]]), [232, 190, 78], 252);
        inkPoly(cpts.concat([[96, -506], [-96, -506]]), [120, 92, 26], 5);
      } else if (c.who === 'chinchilla') {
        poly(ell(0, -120, 150, 142, 8120, 22, 0.06), [176, 180, 190], 252);
        poly(ell(-86, -300, 44, 66, 8121, 16, 0.08), [150, 154, 164], 252);
        poly(ell(86, -300, 44, 66, 8122, 16, 0.08), [150, 154, 164], 252);
        poly(ell(-86, -300, 24, 40, 8123, 14, 0.08), [206, 172, 178], 200);
        poly(ell(86, -300, 24, 40, 8124, 14, 0.08), [206, 172, 178], 200);
        dot(-52, -176, 21, [40, 44, 54], 252); dot(52, -176, 21, [40, 44, 54], 252);
        dot(-46, -182, 8, [250, 250, 250], 252); dot(58, -182, 8, [250, 250, 250], 252);
        dot(0, -132, 17, [116, 96, 100], 252);
        MV.ink([120, 124, 134], 4, 'pen');
        for (let k = 0; k < 3; k++) { brush.line(-76, -140 + k * 12, -156, -156 + k * 20); brush.line(76, -140 + k * 12, 156, -156 + k * 20); }
      } else {
        // Sydney (heart eyes) and Gato (cat ears) — Clawds in costume
        MV.clawd({
          x: 0, y: feetY(0, 210), h: 210, seed: c.who === 'sydney' ? 8 : 9, rot: 0.05 * Math.sin(t * 3.4 + c.ph),
          face: { eyes: c.who === 'sydney' ? 'happy' : 'open', look: [0.1, -0.3], mouth: 'smile' },
          extras: c.who === 'gato' ? ['catears'] : [],
          arms: { l: -1.2 + 1.4 * Math.sin(t * 3.4 + c.ph), r: -1.2 - 1.4 * Math.sin(t * 3.4 + c.ph) },
          legs: { l: 0.5, r: -0.5 }
        });
        if (c.who === 'sydney') {
          for (const s of [-1, 1]) {
            const hx = s * 46, hy = feetY(0, 210) - 46;
            poly(ell(hx - 16, hy - 6, 17, 15, 8130 + s, 12, 0.08), [236, 92, 108], 252);
            poly(ell(hx + 16, hy - 6, 17, 15, 8131 + s, 12, 0.08), [236, 92, 108], 252);
            poly([[hx - 28, hy + 8], [hx + 28, hy + 8], [hx, hy + 34]], [236, 92, 108], 252);
          }
        }
      }
      pop();
    }
  }

  // ---------------------------------------------------------------- segA · the bows
  function segA(t) {
    MV.__stage = 'A9';
    const u = span(t, 140.5, 147.0);
    const bow = 0.5 + 0.5 * Math.sin((t - 141.4) * 2.6);
    const bowAmt = t < 141.4 ? 0 : bow;
    const c = camAt(lerp(-120, 60, smoother(u)), 250, lerp(0.98, 0.84, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    S.stage(t, {
      back: P.crimson, apron: [58, 26, 32], floorCol: [162, 116, 70], wingCol: [104, 32, 42],
      sun: { c1: [236, 128, 74], c2: [132, 46, 46], glowCol: [255, 206, 156], glowA: 0.24, rays: 24, spin: 0.06 }
    });
    S.footlights(t, { y: 438, color: [255, 196, 140] });
    drawCast(t, bowAmt, 0.35, 1);
    // the meter, swelling and about to pop
    const swell = smooth(span(t, 145.4, 146.8));
    if (t < 147.0) {
      S.meter(-30, 470, 0.9 * (1 + 0.22 * swell), S.stair(t, beatIndex(140.5), beatIndex(147), 96, 99.9, 0.2), { cam: c, readoutColor: '#2a2326' });
    }
    // flowers and confetti raining down
    for (let i = 0; i < 16; i++) confetti(t, 8200 + i * 13, -1500 + (i * 197) % 3000, (i % 5) * 0.42);
    for (let i = 0; i < 7; i++) {
      const ph = ((t - 142.0 - i * 0.5) / 4.0) % 1;
      if (ph < 0) continue;
      const r2 = rnd(8300 + i);
      flower(-1300 + r2() * 2600, -1000 + ph * 2100, 42 + r2() * 20, 8310 + i,
        [[240, 140, 150], [246, 200, 120], [230, 226, 240]][i % 3]);
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segB · the pop + final dance
  function segB(t) {
    MV.__stage = 'B9';
    const u = span(t, 147.0, 150.0);
    const balloon = smooth(span(t, 147.28, 147.4));
    const sh = shake(t - 147.34, 18, 14, 2);
    const c = camAt(lerp(60, -40, smoother(u)), 230, lerp(0.86, 0.92, smoother(u)),
      { shakeX: Math.round(sh[0] * (t > 147.2 && t < 148.2 ? 1 : 0.15)), shakeY: Math.round(sh[1] * 0.6 * (t > 147.2 && t < 148.2 ? 1 : 0.15)) });
    setBandCam(c);
    MV.cam(c);
    S.stage(t, {
      back: P.crimson, apron: [58, 26, 32], floorCol: [162, 116, 70], wingCol: [104, 32, 42],
      sun: { c1: [246, 148, 84], c2: [140, 50, 48], glowCol: [255, 214, 160], glowA: 0.3, rays: 30, spin: 0.12 }
    });
    S.footlights(t, { y: 438, color: [255, 206, 150] });
    drawCast(t, 0.15, 1.0, 1);
    // the meter pops like a balloon
    if (t < 147.55) {
      const inflate = 1 + 0.34 * smooth(span(t, 147.0, 147.3));
      S.meter(-30, 470, 0.9 * inflate * (1 - balloon), 99.9, { cam: c, readoutColor: '#2a2326' });
    }
    if (balloon > 0.02) {
      const age = clamp((t - 147.34) / 1.0);
      MV.glow(60, 330, 600 * (1 - age), [255, 244, 210], 0.5 * (1 - age), 6);
      for (let i = 0; i < 22; i++) {
        const r2 = rnd(8400 + i);
        const a = r2() * TAU, sp = 300 + r2() * 900;
        const px = 60 + Math.cos(a) * sp * age, py = 330 + Math.sin(a) * sp * age * 0.8 + 700 * age * age;
        if (age > 0.9) continue;
        push(); translate(px, py); rotate(age * (4 + r2() * 8));
        poly(rr(0, 0, 30 + r2() * 40, 12 + r2() * 22, 4, 8410 + i, 3),
          i % 3 === 0 ? [222, 226, 234] : [232, 84, 76], 240 * (1 - age / 0.9));
        pop();
      }
      // the needle, rocketing off
      push(); translate(60 + 700 * age, 330 - 1200 * age + 1400 * age * age); rotate(age * 9);
      line2(-40, 0, 40, 0, [196, 200, 210], 12);
      poly([[40, -18], [96, 0], [40, 18]], [214, 76, 68], 252);
      pop();
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segC · the curtain and the title
  function segC(t) {
    MV.__stage = 'C9';
    const u = span(t, 150.0, 156.6);
    const drop = smoother(span(t, 150.2, 151.8));
    const fade = smooth(span(t, 155.2, 156.5));
    const c = camAt(lerp(-40, 0, smoother(u)), 210, lerp(0.92, 0.98, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    S.stage(t, {
      back: P.crimson, apron: [58, 26, 32], floorCol: [162, 116, 70], wingCol: [104, 32, 42],
      sun: { c1: [236, 130, 76], c2: [132, 46, 46], glowCol: [255, 206, 156], glowA: 0.2, rays: 20, spin: 0.04 }
    });
    S.footlights(t, { y: 438, color: [255, 196, 140] });
    drawCast(t, 0.4, 0.5, 1 - drop);
    // the curtain, coming down
    const hem = -1500 + drop * 1980;
    const cx = 0, cw = 3200;
    for (let i = 0; i < 26; i++) {
      const x = cx - cw / 2 + (i + 0.5) * (cw / 26);
      const wob = 18 * Math.sin(t * 1.1 + i * 0.7);
      poly([[x - cw / 52, -1600], [x + cw / 52, -1600], [x + cw / 52, hem + wob], [x - cw / 52, hem + 30 + wob]], i % 2 ? [136, 22, 34] : [158, 28, 40], 255);
    }
    MV.flat([182, 34, 46], 250);
    brush.polygon([[cx - cw / 2, hem + 74], [cx + cw / 2, hem + 74], [cx + cw / 2, hem + 30], [cx - cw / 2, hem + 30]]);
    inkPoly([[cx - cw / 2, hem + 78], [cx + cw / 2, hem + 78], [cx + cw / 2, hem + 26], [cx - cw / 2, hem + 26]], [86, 12, 22], 7);
    // the title, painted on the curtain
    const ta = smooth(span(t, 151.3, 151.9)) * (1 - fade);
    if (ta > 0.01) {
      MV.propText("I'm Upping My P(doom)", 0, -220, {
        cam: c, font: '900 132px Georgia, serif', color: '#f6e6c8', outlineColor: 'rgba(74,12,20,0.9)', lineW: 10, alpha: ta
      });
      MV.propText('a Clawd production', 0, -80, {
        cam: c, font: 'italic 46px Georgia, serif', color: '#efd6ae', outlineColor: 'rgba(74,12,20,0.8)', lineW: 5, alpha: ta
      });
    }
    MV.camPop();
    // fade to paper
    if (fade > 0.001) {
      MV.flat([244, 236, 214], 255 * fade);
      brush.polygon([[-2400, -1400], [2400, -1400], [2400, 1400], [-2400, 1400]]);
    }
  }

  function draw(t) {
    if (t < 147.0) segA(t);
    else if (t < 150.0) segB(t);
    else segC(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.curtaincall = { a: 140.5, b: 156.6, draw };
})();
