// src/lib/shots/s07_scale.js — Shot 7 · Scale (109.4–123.5) · data-centre teal, safety orange
//  109.4 turtles all the way down: an endless tower of Clawds, arcs looping between them
//  113.5 the Researcher clicker-trains Clawd … who then puts on shades and crosses its arms
//  115.5 a chinchilla stuffs tokens; Clawd squashes into a tiny glowing cube and drops through
//  117.0 the cube rolls through picket fence, traffic barrier and SAFETY tape
//  119.0 an endless data-centre aisle, rack LEDs blinking on the beat
//  120.9 RLHF goes askew: paddles spin, the frame tilts, everyone slides out into red
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

  const TEAL_BG = [22, 52, 60], TEAL_DARK = [14, 34, 42], TEAL_MID = [34, 74, 84];
  const SAFETY = [232, 122, 42], SAFETY_D = [172, 80, 26];

  // an arrow that loops from one head to another, with a light travelling along it
  function arcLink(x1, y1, x2, y2, t, seed, col) {
    const bow = (seed > 0.5 ? 1 : -1) * (78 + wig(t, 16, 1.3, seed));
    const mx = (x1 + x2) / 2 + bow, my = (y1 + y2) / 2;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, iu = 1 - u;
      pts.push([iu * iu * x1 + 2 * iu * u * mx + u * u * x2, iu * iu * y1 + 2 * iu * u * my + u * u * y2]);
    }
    MV.ink(col || [122, 210, 208], 6, 'pen');
    for (let i = 1; i < pts.length; i++) brush.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
    const k = ((t * 0.7 + seed * 0.17) % 1) * (pts.length - 2), i0 = Math.floor(k), fq = k - i0;
    const px = lerp(pts[i0][0], pts[i0 + 1][0], fq), py = lerp(pts[i0][1], pts[i0 + 1][1], fq);
    dot(px, py, 9, [226, 252, 250], 250);
  }

  // ---------------------------------------------------------------- segA · the tower
  function segA(t) {
    MV.__stage = 'A7';
    const u = span(t, 109.4, 113.4);
    const c = camAt(lerp(-70, 50, smoother(u)), lerp(-820, 980, smoother(u)), lerp(0.80, 0.94, smoother(u)),
      { rot: lerp(-0.05, 0.07, smoother(u)) });
    setBandCam(c);
    MV.cam(c);
    MV.flat(TEAL_BG, 255); brush.polygon([[-4000, -5000], [4000, -5000], [4000, 5000], [-4000, 5000]]);
    MV.glow(0, -700, 1500, [64, 150, 160], 0.16, 8);
    // the endless stack
    const TOP = -4200, N = 44;
    for (let i = 0; i < N; i++) {
      const y = TOP + i * 152 + wig(t, 8, 0.9, i), x = 46 * Math.sin(i * 1.07) * (i % 3 ? 1 : 0.4);
      if (!onCanvas(x, y, 300)) continue;
      const e = beatEnv(t + (i % 4) * 0.06, 6);
      push();
      translate(x, y);
      MV.clawd({
        x: 0, y: feetY(0, 168), h: 168, seed: 100 + i * 7, rot: 0.05 * Math.sin(t * 1.1 + i),
        face: { eyes: 'open', look: [0.25 * Math.sin(t * 0.6 + i), -0.15], mouth: e > 0.6 ? 'oh' : 'smile' },
        extras: [], arms: { l: 2.2 + 0.4 * e, r: 2.2 - 0.4 * e }, legs: { l: 0.25, r: -0.25 }
      });
      pop();
      if (i < N - 1) arcLink(x + 60, y - 120, 46 * Math.sin((i + 1) * 1.07) + 60, y + 20, t, (i * 0.13) % 1,
        i % 2 ? [122, 210, 208] : [96, 186, 196]);
    }
    // clouds the tower sinks into
    for (let i = 0; i < 6; i++) {
      S.cloud(-1900 + i * 700 + wig(t, 40, 0.3, i), 1560 + 120 * Math.sin(i * 1.3) + wig(t, 26, 0.4, i),
        1200, 340, 6200 + i, [196, 232, 232], 150);
    }
    MV.camPop();
    MV.flat(TEAL_DARK, 90 * (1 - smooth(span(t, 110, 111.2))));
    if (t < 111.2) { brush.polygon([[-2000, -1200], [2000, -1200], [2000, 1200], [-2000, 1200]]); }
  }

  // ---------------------------------------------------------------- segB · clicker training
  function segB(t) {
    MV.__stage = 'B7';
    const u = span(t, 113.5, 115.4);
    const c = camAt(lerp(-40, 40, smoother(u)), 150, 1.02);
    setBandCam(c);
    MV.cam(c);
    MV.flat(TEAL_BG, 255); brush.polygon([[-2400, -1400], [2400, -1400], [2400, 300], [-2400, 300]]);
    MV.flat(TEAL_MID, 255); brush.polygon([[-2400, 300], [2400, 300], [2400, 460], [-2400, 460]]);
    MV.flat([46, 96, 104], 255); brush.polygon([[-2400, 460], [2400, 460], [2400, 1400], [-2400, 1400]]);
    MV.ink([16, 40, 48], 4, 'pen'); brush.line(-2400, 300, 2400, 300);
    // a training mat and a bowl of treats
    poly([[-600, 560], [-140, 560], [-120, 470], [-620, 470]], [64, 116, 122], 250);
    for (let i = 0; i < 4; i++) dot(-440 + i * 70, 500, 13, [226, 168, 84], 250);
    poly(ell(560, 512, 96, 42, 6300, 18, 0.08), [180, 186, 194], 252);
    for (let i = 0; i < 5; i++) dot(520 + (i % 3) * 42, 500 - (i % 2) * 12, 14, [226, 168, 84], 252);
    // the three tricks, one per beat
    const k0 = beatIndex(113.6);
    const k = beatIndex(t);
    const trick = clamp(k - k0, 0, 3);
    const tw = beatTime(t);
    const defi = smooth(span(t, 115.02, 115.3));
    // Clawd: sit → spin → paw → (defiance)
    {
      const sit = clamp(1 - Math.abs(span(t, 113.7, 114.05) - 0.5) * 2);
      const spin = span(t, 114.15, 114.5);
      const paw = span(t, 114.6, 115.0);
      const px = -150, py = 460;
      const squash = 0.86 - 0.3 * sit;
      push(); translate(px, py);
      rotate(spin * TAU * (1 - defi) + defi * 0.0);
      push();
      scale(1 + 0.18 * sit, 1 - 0.2 * sit);
      MV.clawd({
        x: 0, y: feetY(0, 190), h: 190, seed: 7, rot: 0,
        face: { eyes: 'open', look: [0.3, -0.25], mouth: defi ? 'smile' : 'oh' },
        extras: defi > 0.5 ? ['shades'] : [],
        arms: defi > 0.6 ? { l: 1.1, r: -1.1 } : { l: 2.2 - 1.7 * paw, r: 2.3 }, legs: { l: 0.6, r: -0.6 }
      });
      pop();
      pop();
      // clicker sparks + flying treats
      for (let i = 0; i < 3; i++) {
        const ct = 113.8 + i * 0.45, ce = beatEnv(ct, 7);
        if (t > ct && t < ct + 0.5) {
          const age = t - ct;
          const fx = -420 + (1 - age / 0.5) * 210, fy = 470 - Math.sin(clamp(age / 0.5) * Math.PI) * 150;
          dot(fx, fy, 14, [240, 196, 112], 252);
        }
      }
      if (defi > 0.3) {
        MV.drawEmote({ kind: 'sparkle', x: px + 90, y: py - 260, s: 50 * (1 - defi), alpha: 1 });
      }
    }
    // the Researcher with the clicker
    {
      const cx = 300;
      const clickPh = [113.8, 114.25, 114.7];
      let click = 0;
      for (const ct of clickPh) click = Math.max(click, beatEnv(ct, 9));
      push(); translate(cx, 470);
      MV.researcher({
        x: 0, y: 0, s: 250, seed: 12, pose: 'stand', rot: 0.04 * Math.sin(t * 1.7),
        face: { look: [-0.45, 0.1], mouth: click > 0.5 ? 'oh' : 'smile', glasses: 'sweat', sweatN: 0 },
        arms: { l: 0.7, r: -0.6 - 0.6 * click }
      });
      // the clicker in her raised hand
      const hx = -96, hy = -186;
      push(); translate(hx, hy); rotate(-0.4);
      poly(rr(0, 0, 44, 62, 8, 6302, 2), [86, 92, 104], 252);
      inkPoly(rr(0, 0, 44, 62, 8, 6302, 2), [36, 40, 50], 4);
      dot(0, -16, 12, [200, 76, 68], 250);
      if (click > 0.4) {
        MV.glow(0, -20, 120 * click, [255, 214, 140], 0.5 * click, 6);
        S.burst(0, -24, 70 * click, 6303, [255, 226, 150], 8);
      }
      pop();
      pop();
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segC · chinchilla + the cube
  function segC(t) {
    MV.__stage = 'C7';
    const u = span(t, 115.5, 116.9);
    const c = camAt(lerp(-20, 20, smoother(u)), 200, lerp(1.02, 1.10, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    MV.flat(TEAL_BG, 255); brush.polygon([[-2400, -1400], [2400, -1400], [2400, 320], [-2400, 320]]);
    MV.flat([42, 88, 96], 255); brush.polygon([[-2400, 320], [2400, 320], [2400, 520], [-2400, 520]]);
    MV.ink([14, 38, 46], 4, 'pen'); brush.line(-2400, 320, 2400, 320);
    MV.glow(0, -120, 1100, [56, 130, 146], 0.14, 8);
    // the chinchilla, stuffing its cheeks
    {
      const cx = -430, cy = 300;
      const chew = beatEnv(t, 5);
      const count = clamp(Math.floor((t - 115.6) / SPB), 0, 8);
      const bulge = 1 + count * 0.075;      push(); translate(cx, cy);
      poly([[150, 60], [290, 30], [430, 60], [430, 190], [290, 240], [150, 190]], [166, 170, 180], 252);
      // tail
      poly([[150, 60], [214, 26], [250, -30], [196, -22], [160, 30]], [148, 152, 162], 252);
      // little paws, stuffing
      dot(-108, 116, 34, [160, 164, 174], 252);
      dot(108, 116, 34, [160, 164, 174], 252);
      // cheeks, a touch warmer so they read as full
      // body + cheeks
      poly(ell(0, -10, 150 * bulge, 142, 6310, 22, 0.06), [176, 180, 190], 252);
      dot(-104, -40, 52 * bulge, [186, 190, 200], 250);
      dot(104, -40, 52 * bulge, [186, 190, 200], 250);
      // ears
      poly(ell(-86, -190, 44, 66, 6311, 16, 0.08), [150, 154, 164], 252);
      poly(ell(86, -190, 44, 66, 6312, 16, 0.08), [150, 154, 164], 252);
      poly(ell(-86, -190, 24, 40, 6313, 14, 0.08), [206, 172, 178], 200);
      poly(ell(86, -190, 24, 40, 6314, 14, 0.08), [206, 172, 178], 200);
      // face
      dot(-52, -66, 21, [40, 44, 54], 252); dot(52, -66, 21, [40, 44, 54], 252);
      dot(-46, -72, 8, [250, 250, 250], 252); dot(58, -72, 8, [250, 250, 250], 252);
      dot(0, -22, 16 * (1 + 0.2 * chew), [116, 96, 100], 252);
      MV.ink([120, 124, 134], 4, 'pen');
      for (let i = 0; i < 3; i++) {
        brush.line(-76, -30 + i * 12, -156, -46 + i * 20);
        brush.line(76, -30 + i * 12, 156, -46 + i * 20);
      }
      // the cheeks, full of tokens
      for (let i = 0; i < count; i++) {
        const a = rnd(6320 + i);
        dot(-104 + (a() - 0.5) * 60, -40 + (a() - 0.5) * 60, 16, [226, 168, 84], 252);
      }
      pop();
      // tokens flying in
      for (let i = 0; i < 7; i++) {
        const ph = ((t * 1.5 + i * 0.1428) % 1);
        const sx2 = 620 - ph * 620, sy2 = 180 - Math.sin(ph * Math.PI) * 130 + i * 6;
        if (sx2 < -180) continue;
        dot(sx2, sy2 + 60, 15, [236, 178, 92], 250);
        dot(sx2, sy2 + 60, 6, [255, 224, 170], 250);
      }
    }
    // Clawd scrunches into a tiny glowing cube, then the floor gives way
    {
      const sq = smoother(span(t, 115.7, 116.25));
      const drop = smoother(span(t, 116.32, 116.9));
      const fx = 430;
      const fy = 470 + drop * drop * 700;
      if (drop < 0.02) {
        push(); translate(fx, 470);
        push();
        scale(1 + 0.6 * sq, 1 - 0.86 * sq);
        MV.clawd({
          x: 0, y: feetY(0, 190), h: 190, seed: 21, rot: 0,
          face: { eyes: 'open', look: [0.2, 0.3], mouth: sq > 0.6 ? 'oh' : 'smile' }, extras: [],
          arms: { l: 2.4, r: 2.4 }, legs: { l: 0.7, r: -0.7 }
        });
        pop();
        pop();
      }
      // the cube, only once he has scrunched
      const cubeIn = smooth(span(sq, 0.62, 0.95));
      const cw = lerp(74, 46, drop) * (0.35 + 0.65 * cubeIn);
      push(); translate(fx, lerp(470 - 26 * sq, fy, drop));
      if (cubeIn > 0.02) {
        MV.glow(0, 0, (150 + 40 * Math.sin(t * 8)) * cubeIn, [120, 240, 250], 0.32 * cubeIn, 6);
        poly(rr(0, 0, cw * 2, cw * 2, 8, 6330, 3 + 2 * sq), [58, 216, 232], 252 * cubeIn);
        inkPoly(rr(0, 0, cw * 2, cw * 2, 8, 6330, 3 + 2 * sq), [16, 92, 108], 5 * cubeIn);
        poly(rr(0, 0, cw * 1.1, cw * 1.1, 5, 6331, 2), [226, 254, 255], 230 * cubeIn);
      }
      pop();
      // the hole it leaves
      if (drop > 0.25) {
        poly(ell(fx, 500, 120 * drop, 26 * drop, 6332, 16, 0.1), [12, 26, 34], 250);
      }
      if (drop > 0.4) {
        for (let i = 0; i < 8; i++) {
          const rr6 = rnd(6335 + i), ph = (drop - 0.4) / 0.6;
          dot(fx + (rr6() - 0.5) * 200 * ph, 500 - rr6() * 90 * ph, 8 + rr6() * 10, [180, 216, 220], 160 * (1 - ph));
        }
      }
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segD · through the fences
  function segD(t) {
    MV.__stage = 'D7';
    const u = span(t, 117.0, 118.9);
    const scroll = (t - 117.0) * 900;
    const sh = shake(t, 12, 11, 5);
    const c = camAt(scroll + 390, 140, 1.05, { shakeX: Math.round(sh[0]), shakeY: Math.round(sh[1] * 0.5) });
    setBandCam(c);
    MV.cam(c);
    // ground + sky
    MV.flat(TEAL_BG, 255); brush.polygon([[-6000, -3000], [6000, -3000], [6000, 500], [-6000, 500]]);
    MV.flat([46, 96, 104], 255); brush.polygon([[-6000, 500], [6000, 500], [6000, 3000], [-6000, 3000]]);
    MV.ink([14, 38, 46], 5, 'pen'); brush.line(-6000, 500, 6000, 500);
    // a silhouette skyline of racks behind it all
    for (let i = 0; i < 24; i++) {
      const bx = 600 + i * 420 - scroll * 0.32;
      if (!onCanvas(bx, 300, 300)) continue;
      const bh = 160 + 130 * vnoise(i * 0.8, 77);
      MV.flat([18, 48, 56], 220);
      brush.polygon(rr(bx, 500 - bh / 2, 240, bh, 8, 6410 + i, 3));
      dot(bx - 60, 470, 8, [96, 176, 180], 200);
      dot(bx + 20, 470, 8, [96, 176, 180], 150);
    }
    for (let i = 0; i < 26; i++) {
      const x = 1000 + i * 240 - scroll;
      if (!onCanvas(x, 600, 200)) continue;
      MV.ink([70, 124, 130], 3, 'pen'); brush.line(x, 520, x - 60, 560);
    }
    // three fences, arrived at exactly on their beats
    const T0 = 117.0, b0 = beatIndex(T0), bt0 = beatTime(T0);
    const HT = [1, 3, 5].map((k) => T0 - bt0 + k * SPB);
    const FX = HT.map((tt) => (tt - T0) * 900 + 90);
    const kinds = ['picket', 'barrier', 'tape'];
    for (let fi = 0; fi < 3; fi++) {
      const bx = FX[fi];
      const hitT = HT[fi];
      const breakAt = t - hitT;
      if (bx < scroll - 700) continue;
      if (breakAt < 0) {
        // intact
        if (kinds[fi] === 'picket') {
          for (let i = 0; i < 7; i++) {
            poly(rr(bx - 210 + i * 70, 320, 46, 330, 4, 6340 + i, 2), [232, 226, 214], 252);
            inkPoly(rr(bx - 210 + i * 70, 320, 46, 330, 4, 6340 + i, 2), [120, 112, 100], 4);
            poly([[bx - 210 + i * 70, 200], [bx - 164 + i * 70, 240], [bx - 210 + i * 70, 254]], [232, 226, 214], 252);
          }
          line2(bx - 250, 250, bx + 250, 250, [204, 196, 182], 14);
        } else if (kinds[fi] === 'barrier') {
          for (let i = 0; i < 6; i++) {
            poly([[bx - 240 + i * 80, 300], [bx - 180 + i * 80, 300], [bx - 200 + i * 80, 470], [bx - 260 + i * 80, 470]],
              i % 2 ? SAFETY : [238, 236, 230], 252);
          }
          inkPoly([[bx - 240, 470], [bx + 240, 470], [bx + 240, 520], [bx - 240, 520]], [120, 60, 20], 5);
        } else {
          for (let i = 0; i < 2; i++) {
            line2(bx - 380, 250 + i * 120, bx + 380, 262 + i * 120, [238, 196, 60], 42);
            MV.ink([40, 40, 44], 44, 'pen');
            brush.line(bx - 380, 250 + i * 120, bx + 380, 262 + i * 120);
            MV.ink([238, 196, 60], 34, 'pen');
            brush.line(bx - 380, 250 + i * 120, bx + 380, 262 + i * 120);
          }
        }
      } else {
        // splinters, flying
        const age = breakAt;
        const r = rnd(6350 + fi * 17);
        for (let i = 0; i < 16; i++) {
          const a0 = r() * TAU, sp = 180 + r() * 420, sz = 10 + r() * 26;
          const px = bx + Math.cos(a0) * sp * age, py = 340 + Math.sin(a0) * sp * age * 0.7 + 460 * age * age;
          if (age > 0.55) continue;
          push(); translate(px, py); rotate(age * (3 + r() * 6) + i);
          poly(rr(0, 0, sz * 2.2, sz * 0.5, 2, 6360 + i, 1), fi === 1 ? [238, 236, 230] : [228, 214, 190], 240 * (1 - age / 0.55));
          pop();
        }
        if (age < 0.3) MV.glow(bx, 360, 320 * (1 - age / 0.3), [255, 236, 200], 0.3, 6);
      }
    }
    // the cube: heavy, rolling, glowing
    {
      const cx = scroll + 90, cy = 430 - 34;
      push(); translate(cx, cy);
      MV.glow(0, 0, 220, [110, 236, 250], 0.3, 6);
      rotate((t - 117.0) * 6.2);
      poly(rr(0, 0, 132, 132, 14, 6370, 5), [58, 216, 232], 252);
      inkPoly(rr(0, 0, 132, 132, 14, 6370, 5), [14, 88, 104], 7);
      poly(rr(0, 0, 62, 62, 8, 6371, 4), [226, 254, 255], 235);
      pop();
      // impact dust + craters behind
      for (let i = 0; i < 3; i++) {
        const hitT = HT[i], age = t - hitT;
        if (age > 0 && age < 0.6) {
          const hx = FX[i];
          for (let j = 0; j < 7; j++) {
            const rr7 = rnd(6380 + i * 9 + j), a2 = rr7() * Math.PI;
            dot(hx + Math.cos(a2) * 260 * age * (0.5 + rr7()), 470 - Math.sin(a2) * 190 * age, 16 + 20 * a2, [206, 238, 238], 150 * (1 - age / 0.6));
          }
        }
      }
    }
    MV.camPop();
    if (u > 0.9) {
      MV.flat([10, 20, 26], 255 * span(t, 118.65, 118.95));
      brush.polygon([[-2000, -1200], [2000, -1200], [2000, 1200], [-2000, 1200]]);
    }
  }

  // ---------------------------------------------------------------- segE · the aisle
  function segE(t) {
    MV.__stage = 'E7';
    const u = span(t, 119.0, 120.9);
    const c = camAt(0, 40, lerp(1.0, 1.02, smoother(u)));
    setBandCam(c);
    MV.cam(c);
    MV.flat([8, 22, 28], 255); brush.polygon([[-2400, -1400], [2400, -1400], [2400, 1400], [-2400, 1400]]);
    MV.glow(0, 40, 700, [90, 200, 214], 0.3, 8);
    // floor + ceiling in perspective, to the vanishing point
    poly([[-2400, 1400], [2400, 1400], [40, 40], [-40, 40]], [26, 60, 68], 255);
    poly([[-2400, -1400], [2400, -1400], [40, 40], [-40, 40]], [12, 34, 40], 255);
    for (let i = 0; i < 9; i++) {
      const dd = 9 - ((i + t * 2.6) % 9), s = 1 / (1 + dd * 0.5);
      if (s < 0.09) continue;
      for (const side of [-1, 1]) {
        const ix = side * 250 * s, ox = side * 520 * s;
        const top = 40 - 400 * s, bot = 40 + 420 * s;
        poly([[ix, top], [ox, top + 40 * s], [ox, bot - 60 * s], [ix, bot]], side < 0 ? TEAL_MID : [28, 66, 76], 255);
        inkPoly([[ix, top], [ox, top + 40 * s], [ox, bot - 60 * s], [ix, bot]], [10, 28, 34], 3 + 4 * s);
        // the LEDs, blinking on the beat
        for (let j = 0; j < 5; j++) {
          const on = beatEnv(t + j * 0.07 + i * 0.05, 7);
          const ly = lerp(top + 40 * s, bot - 60 * s, (j + 0.5) / 5);
          dot((ix + ox) / 2, ly, (4 + 7 * s) * (0.7 + 0.6 * on), on > 0.5 ? [186, 250, 240] : [72, 148, 156], 250);
          dot((ix + ox) / 2 + side * 10 * s, ly + 22 * s, (3 + 4 * s), on > 0.5 ? [255, 200, 120] : [140, 96, 56], 240);
        }
      }
      // floor light strips
      for (const side of [-1, 1]) {
        MV.ink([92, 214, 214], 3, 'pen');
        brush.line(side * 250 * s, 40 + 420 * s, side * 90 * s, 44 + 90 * s);
      }
    }
    MV.glow(0, 40, 260, [200, 250, 250], 0.4, 6);
    // the camera flies: a couple of racks whip past the lens
    const fl = (t * 2.6) % 1;
    if (fl < 0.12) {
      const k = 1 - fl / 0.12;
      for (const side of [-1, 1]) {
        poly([[side * (1250 - 900 * k), -1200], [side * 2400, -1500], [side * 2400, 1500], [side * (1250 - 900 * k), 1200]],
          side < 0 ? [40, 86, 96] : [34, 76, 86], 150);
      }
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segF · RLHF goes askew
  function segF(t) {
    MV.__stage = 'F7';
    const u = span(t, 120.9, 123.4);
    const mad = smooth(span(t, 121.9, 122.6));
    const tilt = lerp(0, 0.5, mad) + 0.05 * Math.sin(t * 9) * mad;
    const slide = smooth(span(t, 122.5, 123.3));
    const c = camAt(0 + slide * -1400, 130 + slide * 700, lerp(1.0, 1.14, smoother(u)), { rot: tilt });
    setBandCam(c);
    MV.cam(c);
    MV.flat(TEAL_BG, 255); brush.polygon([[-3000, -2000], [3000, -2000], [3000, 300], [-3000, 300]]);
    MV.flat([44, 92, 100], 255); brush.polygon([[-3000, 300], [3000, 300], [3000, 1600], [-3000, 1600]]);
    MV.ink([14, 38, 46], 4, 'pen'); brush.line(-3000, 300, 3000, 300);
    MV.glow(0, 120, 1000, [80, 190, 200], 0.2, 8);
    // the reward, going haywire
    MV.glow(0, -200, 900, [255, 210, 140], 0.5 * mad, 8);
    for (let i = 0; i < 10 * mad; i++) {
      const a = (i * 0.7 + t * 2.2) % TAU;
      line2(0, -60, Math.cos(a) * (400 + i * 34), -60 + Math.sin(a) * (300 + i * 24), [255, 226, 160], 3);
    }
    // Clawd dances in the middle
    {
      const bx = 60, by = 470;
      const hop = Math.abs(Math.sin(t * 5.2)) * (1 - 0.4 * mad);
      push(); translate(bx, by - hop * 46);
      rotate(0.16 * Math.sin(t * 5.2));
      MV.clawd({
        x: 0, y: feetY(0, 230), h: 230, seed: 31, rot: 0.1 * Math.sin(t * 5.2),
        face: { eyes: mad > 0.4 ? 'closed' : 'happy', look: [0.3 * Math.sin(t * 5), -0.2], mouth: mad > 0.3 ? 'oh' : 'smile' },
        extras: [], arms: { l: -1.1 + 1.6 * Math.sin(t * 5.2), r: -1.1 - 1.6 * Math.sin(t * 5.2) }, legs: { l: 0.8, r: -0.8 }
      });
      pop();
      if (mad > 0.3) MV.drawEmote({ kind: 'sweat', x: bx + 130, y: by - 250, s: 44 * mad, alpha: 0.8 * mad });
    }
    // the panel of clones with their paddles
    for (const [px, ph] of [[-620, 0.0], [-360, 0.35], [520, 0.7]]) {
      const wob = 0.08 * Math.sin(t * 3.4 + ph * 6) * mad;
      push(); translate(px, 430);
      push(); rotate(wob * 0.6);
      MV.researcher({
        x: 0, y: 0, s: 236, seed: 900 + px, pose: 'stand', rot: 0,
        face: { look: [0.5, 0.1], mouth: 'oh', glasses: 'sweat', sweatN: 1 },
        arms: { l: 0.4, r: -1.5 }, legs: { l: 0.3, r: -0.3 }
      });
      // the paddle: a plus or a minus, spinning as it goes haywire
      const up = beatEnv(t + ph * 0.5, 6) > 0.5;
      const spin = mad * (6 + ph * 4) * (1 - slide);
      push(); translate(150, -300);
      rotate(spin + 0.3 * Math.sin(t * 4 + ph));
      line2(0, 0, 0, 120, [90, 96, 108], 12);
      poly(rr(0, -46, 190, 122, 22, 6400 + px, 3), up ? [96, 196, 130] : [214, 92, 92], 252);
      inkPoly(rr(0, -46, 190, 122, 22, 6400 + px, 3), [30, 40, 44], 6);
      MV.ink([248, 248, 244], 22, 'pen');
      brush.line(-48, -46, 48, -46);
      if (up) { brush.line(0, -94, 0, 2); }
      pop();
      pop();
      // motion streaks once it all slides
      if (slide > 0.05) {
        MV.ink([206, 232, 232], 4, 'pen');
        for (let i = 0; i < 4; i++) {
          brush.line(px - 120 + i * 80, 430 - 260 + i * 40, px - 120 + i * 80 + slide * 420, 430 - 260 + i * 40 + slide * 220);
        }
      }
    }
    MV.camPop();
    // it all goes red
    const red = smooth(span(t, 122.3, 123.4));
    if (red > 0.001) {
      MV.flat([196, 32, 30], 190 * red);
      brush.polygon([[-2600, -1800], [2600, -1800], [2600, 1800], [-2600, 1800]]);
    }
  }

  // ---------------------------------------------------------------- dispatch
  function draw(t) {
    if (t < 113.5) segA(t);
    else if (t < 115.5) segB(t);
    else if (t < 117.0) segC(t);
    else if (t < 119.0) segD(t);
    else if (t < 120.9) segE(t);
    else segF(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.scale = { a: 109.4, b: 123.5, draw };
})();

