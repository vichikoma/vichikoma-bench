// src/lib/shots/s03_takeoff.js — Shot 3 · Takeoff (38.5–59.0) · morning sky → speed → rose
//   38.5 sunny gym: Clawd jogs on a treadmill, the Researcher times him, the wall TV plays a
//        calm loss curve → the camera dives onto the speed dial
//   41.5 an elbow clocks the dial to MAX, a black hole opens in the wall and eats the gym
//   45.0 rocket-skateboard parallax over loss-surface hills, overtaking a train and a jet
//   49.4 the Researcher's atoms rearrange, briefly spelling a paperclip
//   53.4 Sydney's heart room: a heart-shaped birdcage, a ring, a giant heart bubble that pops
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeOut, easeOut3, easeInOut, easeBack, mix, css,
    beatEnv, beatPos, beatIndex, beatsIn, rnd, vnoise, shake
  } = MV;
  const TAU = Math.PI * 2;

  // ================================================================ shared helpers
  // MV.clawd's y is the body CENTRE; the feet land 0.62*h lower (measured off characters.js)
  const feetY = (feet, h) => feet - h * 0.62;
  // camera that keeps the scene point (px,py) pinned while zooming
  const camOn = (px, py, zoom, extra) => Object.assign({ x: -px * (zoom - 1), y: -py * (zoom - 1), zoom }, extra || {});
  // the last 4 frames of a shot belong to the wipe of the next one
  const reveal = (t, a, b, col, seed) => { const u = smooth(span(t, a, b)); if (u < 0.995) MV.wipeBand(u, col, seed, 'out'); };

  // a limb drawn as a rotated rounded block — same construction as characters.js
  function limb(ax, ay, bx, by, thick, fill, inkCol) {
    const cx = (ax + bx) / 2, cy = (ay + by) / 2, len = Math.hypot(bx - ax, by - ay);
    const rot = Math.atan2(by - ay, bx - ax);
    const pts = MV.wobbleRoundRect(cx, cy, len + thick * 0.5, thick, thick * 0.5, Math.round(Math.abs(ax * 7 + ay * 13 + bx)), 4, thick * 0.05, rot);
    MV.flat(fill, 252); brush.polygon(pts);
    MV.ink(inkCol || MV.shade(fill, -70), Math.max(0.7, thick * 0.05), 'pen'); brush.polygon(pts);
    return [bx, by];
  }
  function cap(x, y, r, fill, inkCol) {
    MV.flat(fill, 250); brush.circle(x, y, r);
    MV.ink(inkCol || [150, 118, 96], Math.max(0.8, r * 0.1), 'pen'); brush.circle(x, y, r);
  }
  // flat colour blob / ink outline helpers
  const poly = (pts, col, a) => { MV.flat(col, a === undefined ? 252 : a); brush.polygon(pts); };
  const inkPoly = (pts, col, w) => { MV.ink(col, w, 'pen'); brush.polygon(pts); };
  const rr = (cx, cy, w, h, r, seed, amp) => MV.wobbleRoundRect(cx, cy, w, h, r, seed, 5, amp === undefined ? 1.8 : amp);

  // ================================================================ segA · the gym (38.5–41.4)
  const G = {
    wall: [240, 232, 214], wallLow: [224, 214, 194], skirt: [178, 164, 142],
    floor: [190, 156, 112], floorLine: [150, 118, 82],
    belt: [64, 66, 76], beltLine: [46, 48, 58], frame: [126, 132, 142], frameDark: [92, 98, 108],
    screen: [30, 52, 62], screenInk: [124, 208, 198], mat: [92, 150, 146]
  };
  const DECK = { x: -520, yFar: 196, yNear: 262, wFar: 240, wNear: 300 };
  const CONSOLE = { x: 60, y: 250, w: 420, h: 190 };   // console cart beside the machine
  const DIAL = { x: 185, y: 228, r: 54 };              // speed dial on its right end
  const RES = { x: 330, feet: 340, s: 250 };           // the Researcher, leaning over the dial
  const RES_LEAN = -0.30;                              // his lean while he watches the dial
  const JOG = { feet: 232, h: 300 };                   // the lead Clawd on the belt
  const TV = { x: -380, y: -320, w: 420, h: 270 };     // wall TV above the treadmill
  const WIN = { x: -870, y: -220, w: 340, h: 400 };    // window on the left wall
  const HOLE = { x: 140, y: -260 };                    // black hole in the back wall

  // morning sky seen through the window / behind the gym
  function morningSky(t, o = {}) {
    const c0 = o.c0 || [246, 240, 222], c1 = o.c1 || [148, 196, 228];
    for (let i = 0; i < 12; i++) {
      const u = i / 11, y0 = -640 + 900 * u;
      MV.flat(mix(c0, c1, Math.pow(u, 0.85)), 255);
      brush.polygon([[-1100, y0 - 60], [1100, y0 - 60], [1100, y0 + 60], [-1100, y0 + 60]]);
    }
    S.cloud(-520, -430, 520, 150, 411, [252, 250, 244], 210);
    S.cloud(120, -520, 620, 170, 412, [252, 250, 244], 190);
    S.cloud(760, -400, 520, 140, 413, [252, 250, 244], 175);
  }

  function windowBox(t) {
    const { x, y, w, h } = WIN;
    poly(rr(x, y, w, h, 26, 501, 2.4), [252, 248, 238], 255);
    // the sky inside
    push();
    brush.noStroke();
    MV.flat([250, 246, 236], 255); brush.polygon(rr(x, y, w - 34, h - 34, 18, 502, 2));
    pop();
    // clip the sky into the frame by drawing a smaller sky block over it
    const sx0 = x - w / 2 + 17, sx1 = x + w / 2 - 17, sy0 = y - h / 2 + 17, sy1 = y + h / 2 - 17;
    for (let i = 0; i < 10; i++) {
      const u = i / 9, yy = lerp(sy0, sy1, u);
      MV.flat(mix([168, 208, 234], [232, 240, 232], Math.pow(u, 1.3)), 255);
      brush.polygon([[sx0, yy - 24], [sx1, yy - 24], [sx1, yy + 24], [sx0, yy + 24]]);
    }
    MV.flat([250, 226, 150], 240); brush.circle(sx0 + 74, sy0 + 66, 46);       // sun
    MV.glow(sx0 + 74, sy0 + 66, 130, [250, 226, 150], 0.3, 6);
    S.cloud(sx0 + 150, sy1 - 120, 260, 84, 503, [252, 250, 244], 225);
    S.cloud(sx1 - 90, sy0 + 150, 220, 74, 504, [252, 250, 244], 200);
    // mullions + sill
    MV.ink([196, 184, 162], 6, 'pen');
    brush.line(x, y, x, y + h / 2); brush.line(x, y - h / 2, x, y);
    brush.line(sx0, y, sx1, y);
    inkPoly(rr(x, y, w, h, 26, 501, 2.4), [166, 152, 128], 5);
    poly(rr(x, y + h / 2 + 12, w + 40, 26, 10, 505, 2), [176, 160, 134], 255);
  }

  // the wall TV: a calm (then panicking) loss curve
  function gymTV(t, panic) {
    const { x, y, w, h } = TV;
    poly(rr(x, y, w, h, 20, 511, 2.2), [58, 60, 68], 255);            // bezel
    const sx0 = x - w / 2 + 26, sx1 = x + w / 2 - 26, sy0 = y - h / 2 + 26, sy1 = y + h / 2 - 26;
    poly([[sx0, sy0], [sx1, sy0], [sx1, sy1], [sx0, sy1]], G.screen, 252);
    // faint grid
    MV.ink([112, 176, 176], 0.9, 'pen');
    for (let i = 1; i < 4; i++) brush.line(sx0, lerp(sy0, sy1, i / 4), sx1, lerp(sy0, sy1, i / 4));
    for (let i = 1; i < 6; i++) brush.line(lerp(sx0, sx1, i / 6), sy0, lerp(sx0, sx1, i / 6), sy1);
    // the curve: gentle when calm, thrashing after MAX
    const A = lerp(26, 74, panic), k = 0.013 + 0.02 * panic, sp = 0.55 + 4.6 * panic;
    MV.ink(panic > 0.02 ? [236, 122, 96] : G.screenInk, 5, 'pen');
    let px = sx0, py = 0;
    for (let i = 0; i <= 26; i++) {
      const u = i / 26, x0 = lerp(sx0, sx1, u);
      const y0 = sy1 - 26 - A * (0.5 + 0.5 * Math.sin(u * k * 300 + t * sp)) - (1 - u) * 30 * panic;
      if (i) brush.line(px, py, x0, y0);
      px = x0; py = y0;
    }
    // scanline sheen
    MV.flat([255, 255, 255], 26);
    for (let i = 0; i < 5; i++) brush.polygon([[sx0, sy0 + (sy1 - sy0) * (i / 5)], [sx1, sy0 + (sy1 - sy0) * (i / 5)], [sx1, sy0 + (sy1 - sy0) * (i / 5) + 12], [sx0, sy0 + (sy1 - sy0) * (i / 5) + 12]]);
  }

  // dumbbell / bottle / towel — small gym props that get eaten later
  function dumbbell(x, y, s, rot) {
    push(); translate(x, y); rotate(rot || 0); scale(s, s);
    MV.ink([72, 78, 88], 8, 'pen'); brush.line(-52, 0, 52, 0);
    for (const sx of [-1, 1]) {
      poly(rr(sx * 54, 0, 34, 76, 12, 521 + sx, 1.6), [72, 78, 88], 252);
      poly(rr(sx * 78, 0, 26, 96, 11, 523 + sx, 1.6), [56, 62, 72], 252);
      inkPoly(rr(sx * 78, 0, 26, 96, 11, 523 + sx, 1.6), [34, 38, 46], 2);
    }
    pop();
  }
  function bottle(x, y, s, rot) {
    push(); translate(x, y); rotate(rot || 0); scale(s, s);
    poly(rr(0, -14, 58, 118, 22, 531, 1.8), [176, 214, 226], 225);
    inkPoly(rr(0, -14, 58, 118, 22, 531, 1.8), [86, 132, 146], 2);
    poly(rr(0, -26, 58, 60, 12, 532, 1.6), [128, 176, 196], 160);
    poly(rr(0, -84, 30, 34, 9, 533, 1.4), [206, 84, 72], 250);
    pop();
  }
  function towel(x, y, s, t) {
    push(); translate(x, y); scale(s, s);
    const w = 120, pts = [[-w / 2, 0], [w / 2, 0], [w / 2, 96 + 8 * Math.sin(t * 3)], [-w / 2 + 14, 84 + 10 * Math.sin(t * 3 + 1.2)]];
    poly(pts, [214, 118, 104], 250);
    inkPoly(pts, [150, 70, 62], 2.4);
    MV.ink([236, 196, 186], 3, 'pen');
    brush.line(-w / 2 + 16, 40, w / 2 - 16, 40);
    pop();
  }

  // the gym shell: cream wall, skirting, plank floor, teal mat (shared by segA + segB)
  function gymRoom(t) {
    MV.flat(G.wall, 255);
    brush.polygon([[-1100, -660], [1100, -660], [1100, 220], [-1100, 220]]);
    MV.flat(G.wallLow, 90);
    brush.polygon([[-1100, 40], [1100, 40], [1100, 220], [-1100, 220]]);
    poly([[-1100, 220], [1100, 220], [1100, 254], [-1100, 254]], G.skirt, 255);
    MV.flat(G.floor, 255);
    brush.polygon([[-1100, 254], [1100, 254], [1100, 660], [-1100, 660]]);
    for (let i = -7; i <= 7; i++) {
      MV.ink(G.floorLine, 1.6, 'pen');
      brush.line(i * 92, 254, i * 190, 660);
    }
    poly([[-880, 266], [-160, 266], [-100, 306], [-940, 306]], G.mat, 195);
  }

  // treadmill: perspective deck + scrolling belt + rails, then the console cart beside it
  function treadmill(t, speed, o = {}) {
    const d = DECK;
    const farL = d.x - d.wFar, farR = d.x + d.wFar, nearL = d.x - d.wNear, nearR = d.x + d.wNear;
    // machine body under the deck
    poly([[farL - 14, d.yFar + 6], [farR + 14, d.yFar + 6], [nearR + 26, d.yNear + 48], [nearL - 26, d.yNear + 48]], G.frameDark, 255);
    // belt surface
    poly([[farL, d.yFar], [farR, d.yFar], [nearR, d.yNear], [nearL, d.yNear]], G.belt, 255);
    // scrolling stripes (they travel away from the camera)
    const off = (t * 2.2 * speed) % 1;
    const nS = 7;
    for (let i = 0; i < nS; i++) {
      const u = ((i / nS) + off) % 1;
      const yy = lerp(d.yNear, d.yFar, u), ww = lerp(d.wNear, d.wFar, u);
      MV.ink(G.beltLine, 5 + 6 * u, 'pen');
      brush.line(d.x - ww, yy, d.x + ww, yy);
    }
    // blur band when the belt is flying
    if (speed > 2.0) {
      MV.flat([212, 218, 228], clamp(26 * (speed - 2.0)));
      brush.polygon([[farL, d.yFar], [farR, d.yFar], [nearR, d.yNear], [nearL, d.yNear]]);
    }
    inkPoly([[farL, d.yFar], [farR, d.yFar], [nearR, d.yNear], [nearL, d.yNear]], [40, 42, 52], 4.5);
    // side rails in perspective
    for (const sx of [-1, 1]) {
      const xf = sx < 0 ? farL - 26 : farR + 26, xn = sx < 0 ? nearL - 34 : nearR + 34;
      MV.ink([92, 98, 108], 17, 'pen');
      brush.line(xf, d.yFar - 6, xn, d.yNear + 20);
      MV.ink([136, 142, 152], 8, 'pen');
      brush.line(xf, d.yFar - 12, xn, d.yNear + 14);
    }
    // ---- console cart on the right
    const c = CONSOLE;
    for (const lx of [c.x - c.w * 0.36, c.x + c.w * 0.36]) {
      poly(rr(lx, c.y + c.h * 0.5 + 52, 26, 112, 10, 551 + Math.round(lx), 1.4), G.frame, 252);
      inkPoly(rr(lx, c.y + c.h * 0.5 + 52, 26, 112, 10, 551 + Math.round(lx), 1.4), [64, 70, 80], 2.2);
    }
    poly(rr(c.x, c.y, c.w, c.h, 20, 552, 2.0), [74, 80, 90], 255);
    inkPoly(rr(c.x, c.y, c.w, c.h, 20, 552, 2.0), [42, 46, 54], 3.4);
    // slanted inner face
    poly([[c.x - c.w / 2 + 26, c.y - c.h / 2 + 24], [c.x + c.w / 2 - 26, c.y - c.h / 2 + 18], [c.x + c.w / 2 - 26, c.y + 34], [c.x - c.w / 2 + 26, c.y + 42]], [54, 60, 70], 250);
    // little speed screen on the left half (bars, no text)
    poly(rr(c.x - 96, c.y - 10, 158, 96, 8, 553, 1.4), G.screen, 252);
    MV.ink(G.screenInk, 4, 'pen');
    for (let i = 0; i < 5; i++) brush.line(c.x - 154 + i * 26, c.y + 28, c.x - 154 + i * 26, c.y + 28 - (14 + i * 11));
    for (let i = 0; i < 3; i++) { poly(rr(c.x - 150 + i * 30, c.y + 62, 20, 20, 7, 554 + i, 1.1), i === 0 ? [206, 92, 78] : [226, 222, 210], 250); }
    // panicked red lamp above the dial
    if (o.maxLamp > 0.02) {
      MV.glow(DIAL.x, DIAL.y - DIAL.r - 32, 74, [232, 74, 62], 0.34 * o.maxLamp, 6);
      poly(MV.wobbleEllipse(DIAL.x, DIAL.y - DIAL.r - 32, 17, 17, 555, 14, 0.06), [232, 74, 62], 255);
    }
  }

  // the speed dial: brass gauge, red danger zone, needle driven by u (0..1)
  function dialGauge(u, t, o = {}) {
    const { x, y, r } = DIAL;
    poly(MV.wobbleEllipse(x, y, r + 12, r + 12, 551, 22, 0.05), [188, 146, 78], 252);
    inkPoly(MV.wobbleEllipse(x, y, r + 12, r + 12, 551, 22, 0.05), [92, 62, 26], 3);
    poly(MV.wobbleEllipse(x, y, r - 6, r - 6, 552, 22, 0.05), [246, 240, 224], 255);
    // tick marks over the top half
    for (let i = 0; i <= 10; i++) {
      const a = lerp(-2.62, -0.52, i / 10);
      const long = i % 5 === 0;
      MV.ink(i >= 8 ? [198, 52, 48] : [116, 104, 92], long ? 4.2 : 2.6, 'pen');
      brush.line(x + Math.cos(a) * (r - 18), y + Math.sin(a) * (r - 18), x + Math.cos(a) * (r - 8), y + Math.sin(a) * (r - 8));
    }
    // red danger arc
    MV.ink([198, 52, 48], 7, 'pen');
    let pa = null;
    for (let i = 0; i <= 8; i++) {
      const a = lerp(-0.52 - 0.28, -0.52, i / 8);
      const px2 = x + Math.cos(a) * (r - 22), py2 = y + Math.sin(a) * (r - 22);
      if (pa) brush.line(pa[0], pa[1], px2, py2);
      pa = [px2, py2];
    }
    // needle
    const a = lerp(-2.62, -0.52, clamp(u));
    MV.ink([92, 40, 36], 9, 'pen');
    brush.line(x, y, x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14));
    poly(MV.wobbleEllipse(x, y, 15, 15, 553, 14, 0.06), [92, 40, 36], 255);
    if (o.shudder) {
      MV.ink([198, 52, 48], 4, 'pen');
      for (let i = 0; i < 5; i++) {
        const aa = -2.4 + i * 0.5;
        brush.line(x + Math.cos(aa) * (r + 20), y + Math.sin(aa) * (r + 20), x + Math.cos(aa) * (r + 40 + 10 * Math.sin(t * 30 + i)), y + Math.sin(aa) * (r + 40 + 10 * Math.sin(t * 30 + i)));
      }
    }
  }

  // Clawd jogging in place on the treadmill
  function jogClawd(t, x, feet, h, o = {}) {
    const cad = o.cadence || 1;                       // steps per beat-ish
    const ph = beatPos(t) * 0.5 * cad;
    const str = Math.sin(ph * TAU);
    const e = beatEnv(t, 9);
    const hop = -10 * e;
    const armL = 1.15 - 0.85 * str, armR = Math.PI - 1.15 - 0.85 * -str;
    MV.clawd({
      x, y: feetY(feet, h) + hop, h, seed: 71, sx: 1 - 0.05 * e, sy: 1 + 0.06 * e,
      rot: -0.03 * str,
      face: {
        eyes: o.tired ? 'happy' : (e > 0.55 ? 'happy' : 'open'),
        look: [0.15, -0.1], mouth: e > 0.5 ? 'oh' : 'smile', blush: true
      },
      arms: { l: armL, r: armR },
      legs: { l: 0.35 + 0.5 * str, r: -0.35 - 0.5 * str },
      extras: ['sweatband']
    });
    // sweat flying off the head on the beat
    if (e > 0.25) {
      const r = rnd(761);
      for (let i = 0; i < 3; i++) {
        const a = -1.9 - i * 0.5 - 0.3 * r();
        const d = (1 - e) * (140 + 90 * r());
        MV.drawEmote({ kind: 'sweat', x: x + Math.cos(a) * d, y: feetY(feet, h) - h * 0.6 - 30 + Math.sin(a) * d - 40, s: 30 + 16 * r(), alpha: clamp(e * 1.4) * 0.9 });
      }
    }
  }

  // local point in the Researcher's frame -> world (origin at his feet, then his lean)
  function resPt(rot, lx, ly) {
    const c = Math.cos(rot), sn = Math.sin(rot);
    return [RES.x + lx * c - ly * sn, RES.feet + lx * sn + ly * c];
  }
  // world position of one of his hand caps
  function resHand(rot, side, aAng) {
    const s = RES.s, cw = s * 0.175, legH = s * 0.30, bodyH = s * 0.38, armL = s * 0.27;
    return resPt(rot, side * cw * 1.05 + Math.cos(aAng) * armL, -legH - bodyH * 0.88 + Math.sin(aAng) * armL * 0.9);
  }
  function clipboard(x, y, rot, s, t) {
    push(); translate(x, y); rotate(rot); scale(s, s);
    poly(rr(0, 0, 112, 146, 8, 561, 1.6), [246, 240, 224], 255);
    inkPoly(rr(0, 0, 112, 146, 8, 561, 1.6), [150, 138, 116], 2.4);
    poly(rr(0, -67, 50, 22, 7, 562, 1.2), [178, 166, 146], 255);
    MV.ink([168, 156, 136], 2.2, 'pen');
    for (let i = 0; i < 4; i++) brush.line(-40, -30 + i * 25, 40, -30 + i * 25);
    MV.ink([200, 96, 84], 3, 'pen');
    let p = null;
    for (let i = 0; i <= 8; i++) {
      const qx = -40 + i * 10, qy = 10 + Math.sin(i * 0.9 + t * 1.4) * 9 + i * 2;
      if (p) brush.line(p[0], p[1], qx, qy);
      p = [qx, qy];
    }
    pop();
  }
  function stopwatch(x, y, s, t) {
    push(); translate(x, y); scale(s, s);
    poly(MV.wobbleEllipse(0, 0, 26, 26, 563, 16, 0.06), [206, 172, 96], 252);
    inkPoly(MV.wobbleEllipse(0, 0, 26, 26, 563, 16, 0.06), [110, 82, 34], 2.6);
    poly(MV.wobbleEllipse(0, 0, 18, 18, 564, 14, 0.06), [248, 244, 232], 255);
    MV.ink([120, 60, 50], 3, 'pen');
    brush.line(0, 0, 0, -12); brush.line(0, 0, 9, 6);
    poly(rr(0, -30, 16, 14, 5, 565, 1.1), [168, 138, 74], 255);
    const wink = 0.5 + 0.5 * Math.sin(t * 11);
    if (wink > 0.72) MV.glow(0, 0, 42, [250, 226, 160], 0.5 * (wink - 0.72), 5);
    pop();
  }

  // the Researcher at the console: nodding, stopwatch on a chain, clipboard in his right hand
  function gymResearcher(t, o = {}) {
    const nod = Math.sin(t * TAU / 0.909);
    const rot = o.rot !== undefined ? o.rot : -0.10 + 0.04 * nod;
    const aL = o.aL !== undefined ? o.aL : 1.55;
    const aR = o.aR !== undefined ? o.aR : 1.28;
    MV.researcher({
      x: RES.x, y: RES.feet + Math.abs(nod) * 3, s: RES.s, rot, seed: 5,
      face: { look: [-0.45, -0.05], mouth: o.shock ? 'oh' : 'smile', sweatN: o.shock ? 3 : 0, glasses: o.shock ? 'sweat' : 'plain' },
      arms: { l: aL, r: aR }
    });
    // chain + stopwatch on his chest
    const n0 = resPt(rot, 0, -RES.s * 0.70), n1 = resPt(rot, 0, -RES.s * 0.52 + 5 * nod);
    MV.ink([168, 158, 140], 2.4, 'pen');
    brush.line(n0[0], n0[1], n1[0] - 6, n1[1]); brush.line(n0[0], n0[1], n1[0] + 6, n1[1]);
    stopwatch(n1[0], n1[1] + 12, 0.72, t);
    // clipboard in his right hand (he drops it when the room goes)
    if (!o.dropClip) { const h = resHand(rot, 1, aR); clipboard(h[0] + 4, h[1] + 8, rot - 0.28, RES.s / 250, t); }
  }

  // ---------- segA camera: slow push, then a dive onto the speed dial
  const DIAL_SHOT = { a: 40.95, b: 41.45 };
  function gymCam(t) {
    const k = smoother(span(t, DIAL_SHOT.a, DIAL_SHOT.b));
    const z0 = 1.06 + 0.07 * smooth(span(t, 38.5, 40.9));
    const fx = lerp(-200, DIAL.x + 26, k), fy = lerp(40, DIAL.y + 14, k);
    const zoom = lerp(z0, 2.6, k);
    const sh = shake(t, 3, 10, 21);
    return camOn(fx, fy, zoom, { shakeX: sh[0], shakeY: sh[1] });
  }

  function segA(t) {
    MV.__stage = 'A';
    morningSky(t);
    MV.cam(gymCam(t));
    gymRoom(t);
    windowBox(t);
    gymTV(t, clamp((t - 41.72) * 2.4));
    // props (they get eaten in segB)
    dumbbell(-980, 352, 0.95, 0.06);
    dumbbell(-800, 388, 0.8, -0.05);
    bottle(-300, 358, 0.9, 0.04);
    towel(-96, 176, 0.62, t);
    treadmill(t, 1, { maxLamp: clamp((t - 41.7) * 4) });
    dialGauge(0.18 + 0.06 * Math.sin(t * 2), t, {});
    jogClawd(t, DECK.x, JOG.feet, JOG.h, { cadence: 1 });
    gymResearcher(t, {});
    MV.camPop();
    // soft morning light from the window
    MV.glow(-620, -180, 620, [255, 244, 218], 0.16, 6);
    reveal(t, 38.52, 39.02, P.crimsonDeep, 91);
  }

  // ================================================================ segB · MAX + the hole (41.5–44.9)
  const PULL = { a: 42.05, b: 42.95 };                 // camera pulls back off the dial
  const BUMP = { a: 41.62, b: 41.80 };                 // the elbow lands
  const HOLE_OPEN = { a: 42.55, b: 43.55 };
  const HOLE_EAT = { a: 44.35, b: 45.0 };              // the hole swallows the frame

  function segBCam(t) {
    const k = smoother(span(t, PULL.a, PULL.b));
    const z0 = lerp(2.6, 2.95, smooth(span(t, 41.5, PULL.a)));
    const fx = lerp(DIAL.x + 26, -120, k), fy = lerp(DIAL.y + 14, 20, k);
    const zoom = lerp(z0, 1.0, k);
    const sh = shake(t, 3, 10, 21), sh2 = shake(t, 5, 8, 22);
    return camOn(fx, fy, zoom, { shakeX: sh[0] * (1 - k) + sh2[0] * k, shakeY: sh[1] * (1 - k) + sh2[1] * k });
  }

  function segB(t) {
    MV.__stage = 'B';
    morningSky(t);
    MV.cam(segBCam(t));
    gymRoom(t);
    windowBox(t);
    gymTV(t, clamp((t - 41.72) * 2.4));
    // the doorway he ends up clinging to
    const doorX = -940;
    poly(rr(doorX, 96, 300, 480, 12, 621, 2.2), [108, 86, 64], 255);
    poly(rr(doorX + 10, 104, 250, 440, 8, 622, 2.0), [64, 50, 40], 252);
    inkPoly(rr(doorX, 96, 300, 480, 12, 621, 2.2), [72, 54, 42], 3);

    const bumpK = smoother(span(t, BUMP.a, BUMP.b));
    const maxed = t > BUMP.a;
    const speed = 1 + 5.4 * smoother(span(t, 41.6, 42.3));
    const cadence = 1 + 3.4 * smoother(span(t, 41.6, 42.3));

    // ---- the gym props go into the hole one after another
    drawSucked(t, 43.05, [-980, 352], 1.05, (x, y, s) => dumbbell(x, y, s, 0.06));
    drawSucked(t, 43.25, [-800, 388], 1.05, (x, y, s) => dumbbell(x, y, 0.8 * s, -0.05));
    drawSucked(t, 43.45, [-300, 358], 1.05, (x, y, s) => bottle(x, y, 0.9 * s, 0.04));
    drawSucked(t, 43.60, [-96, 176], 0.95, (x, y, s, r2, tt) => towel(x, y, s * 0.62, tt));
    // the dropped clipboard spirals in too
    if (t > 42.4) drawSucked(t, 42.4, [RES.x + 60, RES.feet - 200], 1.15, (x, y, s, r2, tt) => clipboard(x, y, r2, 0.9 * s, tt));

    // ---- the machine + the jogger: they lift off and fly in at the end
    const suck = suckPath(t, 43.7, [DECK.x, 250], 1.25);
    if (!suck || suck.u < 0.96) {
      if (suck && suck.u > 0) {
        push(); translate(suck.x, suck.y); rotate(suck.rot * 0.5);
        scale(suck.sc * suck.stretch, suck.sc * (1 - 0.25 * suck.u));
        treadmill(t, speed, { maxLamp: maxed ? 1 : 0 });
        jogClawd(t, DECK.x, JOG.feet, JOG.h, { cadence });
        pop();
      } else {
        treadmill(t, speed, { maxLamp: maxed ? 1 : 0 });
        dialGauge(maxed ? clamp(easeBack(span(t, BUMP.a, BUMP.b + 0.06))) : 0.18 + 0.06 * Math.sin(t * 2), t, { shudder: maxed });
        jogClawd(t, DECK.x, JOG.feet, JOG.h, { cadence });
      }
    }

    // ---- the Researcher: his arm swings out and clocks the dial
    const grounded = t < 43.15;
    if (grounded) {
      const aL = lerp(1.55, 2.64, bumpK) + 0.16 * Math.sin(bumpK * Math.PI);
      gymResearcher(t, {
        rot: lerp(-0.10, RES_LEAN + 0.04 * Math.sin(t * 13), bumpK),
        aL, shock: maxed, dropClip: t > 42.35
      });
      if (t > BUMP.b) MV.drawEmote({ kind: 'exclaim', x: RES.x - 30, y: RES.feet - RES.s - 34, s: 64, alpha: clamp(1 - (t - BUMP.b) * 1.5) });
    } else {
      // ---- he is yanked off his feet and clings to the doorway, flapping
      const k = smoother(span(t, 43.15, 43.75));
      const flap = Math.sin(t * 9.5) * 0.16;
      const px2 = lerp(RES.x, -640, k), py2 = lerp(RES.feet, 40, k);
      push(); translate(px2, py2 + flap * 22); rotate(-Math.PI / 2 + flap * 0.9);
      MV.researcher({
        x: 0, y: 0, s: RES.s * lerp(1, 0.92, k), seed: 5,
        face: { look: [-0.2, 0.3], mouth: 'oh', sweatN: 3, glasses: 'sweat' },
        arms: { l: -1.55, r: -1.75 }, pose: 'run'
      });
      // coat tail flapping behind him
      MV.flat(P.coat, 245);
      brush.polygon([[-8, -30], [-120 - 40 * Math.sin(t * 8), -66 + 20 * Math.sin(t * 7)], [-140 - 40 * Math.sin(t * 6.4), 10 + 16 * Math.sin(t * 6)], [-10, 22]]);
      pop();
      // wind streaks racing toward the hole
      MV.ink([196, 214, 232], 3, 'pen');
      for (let i = 0; i < 8; i++) {
        const yy = -220 + i * 56 + 12 * Math.sin(t * 6 + i);
        const l0 = -1000 + ((t * 300 + i * 120) % 300), l1 = l0 + 170 + 40 * Math.sin(i);
        brush.line(l0, yy, l1, yy);
      }
      // his papers fly off
      const r = rnd(641);
      MV.flat([250, 246, 234], 240);
      for (let i = 0; i < 6; i++) {
        const u = ((t * 0.9 + i * 0.17) % 1);
        const px3 = lerp(-640, HOLE.x, u * u), py3 = lerp(30 + r() * 120, HOLE.y, u * u);
        brush.polygon(rr(px3, py3, 54, 40, 4, 651 + i, 1.2, u * 6));
      }
    }

    // ---- the hole itself + cracks in the wall
    blackHole(t, HOLE_OPEN.a, 200, { rim: true });
    if (t > 42.8) {
      const k = clamp((t - 42.8) / 1.6);
      const r = rnd(631);
      MV.ink([92, 76, 88], 2.6, 'pen');
      for (let i = 0; i < 9; i++) {
        const a = r() * TAU;
        let x0 = HOLE.x + Math.cos(a) * 190, y0 = HOLE.y + Math.sin(a) * 170;
        for (let k2 = 0; k2 < 5; k2++) {
          const a2 = a + (r() - 0.5) * 1.1, len = (60 + 60 * r()) * k;
          const x1 = x0 + Math.cos(a2) * len, y1 = y0 + Math.sin(a2) * len;
          brush.line(x0, y0, x1, y1); x0 = x1; y0 = y1;
        }
      }
    }
    MV.camPop();

    // ---- the hole floods the frame and turns into the sky of segC
    if (t > 44.35) {
      const k = smoother(span(t, 44.35, 44.98));
      const R = lerp(200, 2700, k);
      const col = mix([18, 12, 26], [132, 190, 228], clamp((k - 0.25) / 0.6));
      // NOTE: brush.circle() stops painting somewhere past r≈2000, so the flood is an
      // explicit polygon (64 verts) instead of a brush circle — same look, no ceiling.
      MV.flat(col, 255);
      brush.polygon(MV.wobbleEllipse(HOLE.x, HOLE.y, R * 1.06, R, 681, 64, 0.012));
      if (R < 1900) {
        MV.ink(mix([70, 40, 96], [176, 214, 240], clamp((k - 0.3) / 0.6)), 8, 'pen');
        brush.polygon(MV.wobbleEllipse(HOLE.x, HOLE.y, R * 1.06, R, 681, 64, 0.012));
      }
    }
    // the needle slams: a quick flash
    if (t > BUMP.b && t < BUMP.b + 0.14) {
      MV.flat([255, 246, 226], 190 * (1 - (t - BUMP.b) / 0.14));
      brush.polygon([[-1400, -800], [1400, -800], [1400, 800], [-1400, 800]]);
    }
  }

  // the sucked prop path: spiral in, stretch as it goes
  function suckPath(t, t0, from, dur) {
    const u = smoother(span(t, t0, t0 + dur));
    if (u <= 0) return null;
    const r0 = Math.hypot(from[0] - HOLE.x, from[1] - HOLE.y) || 1;
    const a0 = Math.atan2((from[1] - HOLE.y) * 1.25, from[0] - HOLE.x);
    const a = a0 + 5.4 * Math.pow(u, 0.8);
    const rad = lerp(r0, 4, Math.pow(u, 1.5));
    return {
      u, x: HOLE.x + Math.cos(a) * rad, y: HOLE.y + Math.sin(a) * rad * 0.8,
      sc: lerp(1, 0.12, Math.pow(u, 1.3)), rot: u * 7, stretch: 1 + 2.8 * u
    };
  }
  function drawSucked(t, t0, from, dur, draw) {
    const s = suckPath(t, t0, from, dur);
    if (!s) return draw(from[0], from[1], 1, 0, t);
    if (s.u > 0.985) return;
    push(); translate(s.x, s.y); rotate(s.rot); scale(s.sc * s.stretch, s.sc * (1 - 0.25 * s.u));
    draw(0, 0, 1, 0, t); pop();
  }

  function blackHole(t, t0, R, o = {}) {
    const g = smoother(span(t, t0, t0 + 1.0));
    const rr2 = R * g;
    if (rr2 < 1) return;
    const swirl = t * 2.4;
    // accretion glow
    MV.glow(HOLE.x, HOLE.y, rr2 * 1.9, [96, 62, 150], 0.34, 7);
    // the hole
    poly(MV.wobbleEllipse(HOLE.x, HOLE.y, rr2 * 1.16, rr2 * 1.0, 601, 26, 0.05), [22, 14, 30], 255);
    inkPoly(MV.wobbleEllipse(HOLE.x, HOLE.y, rr2 * 1.16, rr2 * 1.0, 601, 26, 0.05), [58, 34, 86], 5);
    // spiralling accretion ink
    for (let i = 0; i < 7; i++) {
      const a = swirl + i * 0.9;
      MV.ink(i % 2 ? [140, 104, 200] : [72, 48, 116], 4 + i * 0.6, 'pen');
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const u = k / 12, aa = a + u * 2.4, rad = rr2 * (0.42 + 0.72 * u);
        pts.push([HOLE.x + Math.cos(aa) * rad, HOLE.y + Math.sin(aa) * rad * 0.86]);
      }
      for (let k = 1; k < pts.length; k++) brush.line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1]);
    }
    // pull lines out in the room
    const r = rnd(611);
    MV.ink([150, 128, 176], 2.2, 'pen');
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU, l0 = rr2 * (1.5 + r() * 0.7), l1 = l0 + 90 + 130 * r();
      brush.line(HOLE.x + Math.cos(a) * l0, HOLE.y + Math.sin(a) * l0 * 0.9, HOLE.x + Math.cos(a) * l1, HOLE.y + Math.sin(a) * l1 * 0.9);
    }
    if (o.rim) { MV.ink([214, 186, 246], 3, 'pen'); brush.polygon(MV.wobbleEllipse(HOLE.x, HOLE.y, rr2 * 1.16, rr2 * 1.0, 602, 26, 0.05)); }
  }


  // ================================================================ segC · parallax (45.0–48.5)
  //   Clawd rides a rocket skateboard over hills drawn as loss-surface contours, overtaking a
  //   train and a jet; he grows on every beat. The Researcher hangs off the tail. At 48.5 the
  //   board shoots ahead, the camera whips onto the Researcher — and segD's atoms rearrange.
  const SKYC = { top: [98, 168, 220], mid: [164, 212, 234], hor: [224, 240, 238] };
  const RIDEB = { x: 150, y: 92 };                 // skateboard deck centre
  const RIDES = (t) => S.stair(t, 98.5, 106.5, 1, 1.52, 0.2);  // board+Clawd scale, beat-stepped
  const RIDER_ROT = -0.20;
  const bhalf = (s) => 200 + 150 * s;                          // deck half-width (kept clear of the Clawd)
  // the hills: three parallax layers, each profile a sum of sines (loss-surface contours)
  const HILLS = [
    { y: 122, A: 76, sp: 78, fill: [182, 216, 230], ink: [130, 176, 200], P: 720, ns: [1, 2, 3], am: [1, 0.30, 0.10], cf: 0.62 },
    { y: 228, A: 112, sp: 196, fill: [144, 194, 206], ink: [94, 150, 172], P: 720, ns: [1, 2, 3], am: [1, 0.34, 0.12], cf: 0.78 },
    { y: 404, A: 126, sp: 420, fill: [106, 166, 178], ink: [64, 120, 140], P: 720, ns: [1, 2, 3], am: [1, 0.40, 0.14], cf: 0.0 }
  ];
  function hprof(t, L, x) {
    const P = L.P, ph = (t * L.sp) % P, s0 = TAU / P;
    return L.y + L.A * L.am[0] * Math.sin((x + ph) * s0 * L.ns[0])
      + L.A * L.am[1] * Math.sin((x + ph) * s0 * L.ns[1] + 1.1)
      + L.A * L.am[2] * Math.sin((x + ph) * s0 * L.ns[2] + 2.4);
  }
  function hill(t, L, xa, xb) {
    const x0 = xa === undefined ? -1560 : xa, x1 = xb === undefined ? 1560 : xb;
    const pts = [[x0, 900]];
    for (let x = x0; x <= x1; x += 40) pts.push([x, hprof(t, L, x)]);
    pts.push([x1, 900]);
    poly(pts, L.fill, 252);
    for (let c = 1; c <= (L.cf > 0 ? 3 : 2); c++) {
      MV.ink(L.ink, (L.cf > 0 ? 2.9 : 2.4) - c * 0.35, 'pen');
      let prev = null;
      for (let x = x0; x <= x1; x += 40) {
        const y0 = hprof(t, L, x) + c * 36 * Math.max(L.cf, 0.55);
        if (!onScreenY(y0)) { prev = null; continue; }
        if (prev) brush.line(prev[0], prev[1], x, y0);
        prev = [x, y0];
      }
    }
    MV.ink(L.ink, 4, 'pen');
    let prev = null;
    for (let x = x0; x <= x1; x += 40) {
      const y0 = hprof(t, L, x);
      if (!onScreenY(y0)) { prev = null; continue; }
      if (prev) brush.line(prev[0], prev[1], x, y0);
      prev = [x, y0];
    }
  }

  // ---------- visible-band bookkeeping (p5.brush throws when a shape's on-canvas
  // scissor rect comes out empty, i.e. a shape that misses the canvas completely, so
  // every helper tests against the current band before queueing anything)
  const BAND = { fx: 0, cy: 0, hw: 1700, hh: 700, zoom: 1 };
  function setBand(z, foc) {
    BAND.zoom = z; BAND.fx = foc[0]; BAND.cy = foc[1];
    BAND.hw = 960 / z + 120; BAND.hh = 540 / z + 80;
  }
  const onScreenX = (x, ext) => Math.abs(x - BAND.fx) - (ext || 0) < BAND.hw + 60;
  const onScreenY = (y, ext) => Math.abs(y - BAND.cy) - (ext || 0) < BAND.hh + 60;
  const onCanvas = (x, y, ext) => onScreenX(x, ext) && onScreenY(y, ext);

  function skyRide(t, foc) {
    const fx = BAND.fx, hw = BAND.hw + 40;
    const top = BAND.cy - BAND.hh - 40, bot = BAND.cy + BAND.hh + 40;
    const bands = 26;
    for (let i = 0; i < bands; i++) {
      const ya = lerp(top, bot, i / bands), yb = lerp(top, bot, (i + 1) / bands);
      const u = clamp((ya + 660) / 1320);
      MV.flat(mix(SKYC.top, u < 0.62 ? SKYC.mid : SKYC.hor, u < 0.62 ? u / 0.62 : (u - 0.62) / 0.38), 255);
      brush.polygon([[fx - hw, ya], [fx + hw, ya], [fx + hw, yb], [fx - hw, yb]]);
    }
    // clouds — skipped when they sit entirely outside the band
    const cl = [[-640, -380, 620, 150, 811, 200], [520, -470, 700, 170, 812, 175], [-1500, -300, 520, 130, 813, 150]];
    for (const c of cl) {
      if (onScreenX(c[0], c[2] * 0.62) && onScreenY(c[1], c[3] * 0.62)) S.cloud(c[0], c[1], c[2], c[3], c[4], [254, 252, 246], c[5]);
    }
  }

  // the Researcher hanging off the tail of the board, coat flapping
  function ridPos(t) {
    // once the board rockets away (48.4+) he stays put in the world; the camera is on him,
    // so his rig position is frozen at 48.4 while the board's x keeps travelling
    const tc = Math.min(t, 48.4);
    const sK = RIDES(tc);
    return { x: RIDEB.x - bhalf(sK) - 90, feet: RIDEB.y + 158, s: 210 };
  }
  function rideResearcher(t, o = {}) {
    const p = ridPos(t);
    // during the whip the board shoots away — his hands let go and he tumbles
    const wp = smoother(span(t, WHIP.a, WHIP.a + 0.55));
    const rot = o.rot !== undefined ? o.rot : riderRot(t);
    push(); translate(p.x, p.feet); rotate(rot); translate(-p.x, -p.feet);
    MV.researcher({
      x: p.x, y: p.feet, s: p.s, seed: 9,
      face: { look: [0.3, 0.15], mouth: o.mouth || 'oh', glasses: o.glasses || 'sweat', sweatN: 3 },
      arms: { l: lerp(0.1, -1.5, wp), r: lerp(-0.12, -1.9, wp) }, pose: 'run'
    });
    // coat tails streaming out behind (two slim ribbons, not a slab)
    MV.flat(P.coat, 235);
    for (const k of [0, 1]) {
      const f = (22 + k * 14) * Math.sin(t * 9 + k * 1.7);
      brush.polygon([
        [p.x - 26, p.feet - 152 - k * 16],
        [p.x - 78 - k * 18 - f, p.feet - 168 - k * 22 + f * 0.5],
        [p.x - 104 - k * 22 - f * 0.6, p.feet - 140 - k * 18 - f * 0.4],
        [p.x - 34, p.feet - 128 - k * 14]
      ]);
    }
    pop();
  }

  function rocketBoard(t, s, bx, by) {
    // deck — half-width bhalf(s), so the tail always clears the Clawd's silhouette
    const hw2 = bhalf(s);
    poly(rr(bx, by, hw2 * 2, 34 * s, 14 * s, 701, 1.8), [234, 178, 98], 252);
    inkPoly(rr(bx, by, hw2 * 2, 34 * s, 14 * s, 701, 1.8), [130, 86, 42], 3);
    MV.ink([172, 126, 70], 2.4, 'pen');
    for (let i = -2; i <= 2; i++) brush.line(bx + i * 62 * s, by - 10 * s, bx + i * 62 * s, by + 10 * s);
    // wheels
    for (const sx of [-1, 1]) {
      const wx = bx + sx * (hw2 - 64), wy = by + 30 * s;
      poly(MV.wobbleEllipse(wx, wy, 26 * s, 26 * s, 702 + sx, 16, 0.05), [94, 98, 110], 255);
      inkPoly(MV.wobbleEllipse(wx, wy, 26 * s, 26 * s, 702 + sx, 16, 0.05), [44, 48, 58], 3);
      poly(MV.wobbleEllipse(wx, wy, 10 * s, 10 * s, 703 + sx, 12, 0.05), [222, 218, 208], 255);
      MV.ink([184, 188, 196], 3.4 * s, 'pen');
      const a = t * 24;
      brush.line(wx + Math.cos(a) * 12 * s, wy + Math.sin(a) * 12 * s, wx + Math.cos(a) * 24 * s, wy + Math.sin(a) * 24 * s);
    }
    // rocket taped to the tail + flame
    const rx0 = bx - hw2 + 24;
    poly(rr(rx0, by + 4 * s, 92 * s, 46 * s, 16 * s, 704, 1.6), [198, 68, 60], 252);
    inkPoly(rr(rx0, by + 4 * s, 92 * s, 46 * s, 16 * s, 704, 1.6), [104, 34, 34], 2.6);
    poly([[rx0 - 44 * s, by - 8 * s], [rx0 - 86 * s, by + 4 * s], [rx0 - 44 * s, by + 18 * s]], [218, 174, 80], 250);
    const fl = (60 + 54 * beatEnv(t, 7) + 18 * Math.sin(t * 26)) * s;
    const r2 = rnd(705);
    for (let i = 0; i < 6; i++) {
      const yy = by + 6 * s + (r2() - 0.5) * 30 * s, len = fl * (0.5 + r2() * 0.7);
      poly([[rx0 - 44 * s, yy - 12 * s], [rx0 - 44 * s, yy + 12 * s], [rx0 - 44 * s - len, yy + (r2() - 0.5) * 18 * s]], i < 3 ? [246, 188, 76] : [234, 106, 64], 195);
    }
    // duct tape X
    MV.ink([162, 152, 140], 5 * s, 'pen');
    brush.line(bx - 62 * s, by - 16 * s, bx - 22 * s, by + 16 * s);
    brush.line(bx - 22 * s, by - 16 * s, bx - 62 * s, by + 16 * s);
  }

  function rideClawd(t, s, bx, by, vis) {
    const h = 250 * s, e = beatEnv(t, 8);
    const feet = by - 17 * s + 6;
    bx += 150 * (s - 1);            // he drifts right as he grows, keeping the tail clear
    // speed lines behind him (hung off the camera band so they never fall off-canvas)
    const band = vis || 960;
    MV.ink([255, 255, 255], 4, 'pen');
    for (let i = 0; i < 7; i++) {
      const yy = feet - 40 - i * 62 + 10 * Math.sin(t * 7 + i);
      const l0 = BAND.fx - band - 40 + ((t * 900 + i * 210) % 420), l1 = l0 + 170 + 60 * Math.sin(i * 2.1);
      if (onScreenY(yy, 6)) brush.line(l0, yy, l1, yy);
    }
    MV.clawd({
      x: bx, y: feetY(feet, h) - 8 * e, h, seed: 77,
      sx: 1 - 0.04 * e, sy: 1 + 0.05 * e, rot: -0.06 + 0.03 * Math.sin(t * 5),
      face: { eyes: 'open', look: [0.45, -0.3], mouth: 'open', blush: true },
      arms: { l: 3.05, r: 0.09 }, legs: { l: 0.55, r: -0.25 }
    });
    // dust kicked off the wheels on the beat
    if (e > 0.2) {
      for (const sx of [-1, 1]) S.cloud(bx + sx * 104 * s - 70 - 90 * (1 - e), by + 34 * s, 180, 90, 706 + sx, [246, 244, 236], 150 * e);
    }
  }

  function train(t, x, y, vis) {
    push(); translate(x, y);
    // rail under it
    MV.ink([96, 84, 74], 9, 'pen'); brush.line(-1600 - x, 40, 1600 - x, 40);
    MV.ink([126, 112, 96], 5, 'pen');
    const band = vis || 960;
    for (let i = -26; i <= 26; i++) {
      const sx2 = i * 74 + ((t * 300) % 74);
      if (Math.abs(x + sx2 - BAND.fx) < BAND.hw + 260) brush.line(sx2, 34, sx2, 52);
    }
    // wheels
    for (const wx of [-118, -30, 96]) {
      poly(MV.wobbleEllipse(wx, -8, 32, 32, 712, 16, 0.05), [74, 68, 66], 255);
      inkPoly(MV.wobbleEllipse(wx, -8, 32, 32, 712, 16, 0.05), [38, 34, 34], 3);
      MV.ink([168, 158, 146], 3, 'pen');
      const a = t * 26;
      for (let k = 0; k < 3; k++) brush.line(wx, -8, wx + Math.cos(a + k * 2.1) * 26, -8 + Math.sin(a + k * 2.1) * 26);
    }
    // loco body (nose to the right)
    poly(rr(0, -92, 340, 150, 26, 711, 1.8), [182, 62, 58], 252);
    inkPoly(rr(0, -92, 340, 150, 26, 711, 1.8), [98, 34, 34], 3);
    poly(rr(-104, -150, 120, 110, 18, 713, 1.6), [150, 48, 46], 252);      // cab
    inkPoly(rr(-104, -150, 120, 110, 18, 713, 1.6), [88, 30, 30], 2.8);
    poly(rr(-104, -152, 74, 52, 10, 714, 1.4), [200, 224, 232], 235);      // cab window
    poly(rr(112, -168, 46, 66, 12, 715, 1.5), [92, 88, 92], 252);          // chimney
    poly([[150, -110], [186, -110], [206, -84], [150, -84]], [232, 186, 96], 252);   // cowcatcher
    MV.ink([240, 232, 216], 3, 'pen');
    brush.line(-150, -60, 150, -60);
    const sg = rnd(716);
    for (let i = 0; i < 4; i++) S.cloud(112 + 10 * i + 30 * sg(), -230 - i * 84 - 20 * ((t * 3 + i) % 1), 90, 70, 717 + i, [246, 244, 238], 150);
    push(); translate(-330, -70); scale(1, 1);                              // one car
    poly(rr(0, 0, 300, 140, 20, 718, 1.7), [64, 104, 148], 252);
    inkPoly(rr(0, 0, 300, 140, 20, 718, 1.7), [34, 62, 92], 3);
    for (let i = -1; i <= 1; i++) { poly(rr(i * 88, -16, 62, 46, 8, 719 + i, 1.3), [206, 228, 236], 225); }
    for (const wx of [-96, 96]) { poly(MV.wobbleEllipse(wx, 74, 26, 26, 721, 14, 0.05), [74, 68, 66], 255); inkPoly(MV.wobbleEllipse(wx, 74, 26, 26, 721, 14, 0.05), [38, 34, 34], 2.6); }
    pop();
    pop();
  }

  function jet(t, x, y) {
    push(); translate(x, y);
    // vapour trail (behind = to the left, since the nose points right)
    const vr = rnd(731);
    for (let i = 0; i < 12; i++) {
      const u = i / 11;
      poly(MV.wobbleEllipse(-260 - u * 700, (vr() - 0.5) * 26 + u * 10, 60 + 80 * u, 22 + 34 * u, 732 + i, 14, 0.16), [250, 252, 254], 60 * (1 - u * 0.7));
    }
    // wings
    poly([[-40, -6], [70, -6], [40, -96], [-30, -80]], [190, 198, 212], 252);
    inkPoly([[-40, -6], [70, -6], [40, -96], [-30, -80]], [58, 66, 82], 3.2);
    poly([[-40, 6], [70, 6], [40, 96], [-30, 80]], [166, 176, 194], 252);
    inkPoly([[-40, 6], [70, 6], [40, 96], [-30, 80]], [58, 66, 82], 3.2);
    // fuselage, nose to the right
    poly([[250, 2], [150, -34], [-160, -38], [-230, -6], [-160, 34], [150, 36]], [208, 216, 228], 252);
    inkPoly([[250, 2], [150, -34], [-160, -38], [-230, -6], [-160, 34], [150, 36]], [58, 66, 82], 3.6);
    poly([[-40, -60], [150, -30], [150, -14], [-40, -34]], [186, 62, 58], 245);            // stripe
    poly([[132, -30], [196, -14], [132, 0]], [58, 92, 116], 250);                        // canopy
    poly([[-150, -34], [-206, -78], [-140, -40]], [186, 196, 210], 252);                  // tail fin
    inkPoly([[-150, -34], [-206, -78], [-140, -40]], [58, 66, 82], 3);
    // exhaust
    const fl = 50 + 40 * Math.sin(t * 24);
    for (let i = 0; i < 3; i++) poly([[-232, -10 + i * 10], [-232, 2 + i * 10], [-232 - fl * (0.5 + i * 0.3), -4 + i * 10]], i === 0 ? [250, 208, 120] : [238, 140, 90], 170);
    pop();
  }

  // ---------- the whip: the board shoots off, the camera dives onto the Researcher
  const WHIP = { a: 48.45, b: 49.18 };
  // the whip's own rotation, so the camera aims at where his head actually is
  const riderRot = (t) => RIDER_ROT + 0.5 * smoother(span(t, WHIP.a, WHIP.a + 0.55)) + 0.05 * Math.sin(t * 6);
  // he settles at ~0.26 rad; aim the camera there so head and target agree
  const FIZZ_ROT = 0.26;
  const headWorld = () => { const p = ridPos(48.4); const rt = FIZZ_ROT, c = Math.cos(rt), sn = Math.sin(rt); const hy = -p.s * 0.80; return [p.x + (0 * c - hy * sn), p.feet + (0 * sn + hy * c)]; };
  function rideZoom(t) { return 1.06 - 0.06 * smooth(span(t, 45.0, 48.4)); }
  function rideFocus(t) {
    const k = smoother(span(t, WHIP.a, WHIP.b));
    const hd = headWorld();
    return [lerp(60, hd[0], k), lerp(-40, hd[1], k)];
  }
  // camera + the info the culling needs (p5.brush throws on shapes that miss the canvas
  // entirely — an empty scissor rect gives its mask a negative size)
  function rideCam(t) {
    const foc = rideFocus(t);
    const k = smoother(span(t, WHIP.a, WHIP.b));
    const zoom = lerp(rideZoom(t), 3.0, k);
    const sh = shake(t, 4 * k, 8, 31);
    return { cam: camOn(foc[0], foc[1], zoom, { rot: -0.04 * k * Math.sin(t * 30), shakeX: sh[0], shakeY: sh[1] }), foc, zoom, vis: 960 / zoom };
  }
  const whipCam = (t) => rideCam(t).cam;

  function rideScene(t, o = {}) {
    const foc = o.foc || [60, -40], zoom = o.zoom || 1;
    const band = 960 / zoom + 1100;          // cull anything that misses the canvas
    const hills = 960 / zoom + 140;          // the hills only need to cover the visible band
    skyRide(t, foc);
    hill(t, HILLS[0], foc[0] - hills, foc[0] + hills);
    hill(t, HILLS[1], foc[0] - hills, foc[0] + hills);
    // the vehicles slide from right to left (they face right; he is faster)
    if (o.vehicles !== false) {
      const jx = lerp(1900, -2100, smoother(span(t, 46.05, 48.05)));
      if (jx < 1900 && jx > -2100 && onScreenX(jx, 1400) && onScreenY(-250, 220)) jet(t, jx, -250);
    }
    hill(t, HILLS[2], foc[0] - hills, foc[0] + hills);
    if (o.vehicles !== false) {
      const tx = lerp(1700, -1900, smoother(span(t, 45.30, 47.25)));
      if (onScreenX(tx, 1200) && onScreenY(336, 420)) train(t, tx, 336, 960 / zoom);
    }
    // the board + the Clawd (they shoot off to the right during the whip) — the Researcher is
    // never culled: during the whip he IS the subject
    if (o.board !== false) {
      const s = RIDES(t), bx = RIDEB.x + 820 * smoother(span(t, 48.4, 49.05));
      if (onScreenX(bx, 1100) && onScreenY(RIDEB.y, 520 * s)) {
        rocketBoard(t, s, bx, RIDEB.y);
        rideClawd(t, s, bx, RIDEB.y, 960 / zoom);
      }
    }
    if (o.rider !== false) rideResearcher(t, {});
  }

  function segC(t) {
    MV.__stage = 'C';
    const rc = rideCam(t);
    setBand(rc.zoom, rc.foc);
    MV.cam(rc.cam);
    rideScene(t, { foc: rc.foc, zoom: rc.zoom });
    MV.camPop();
    // whip streaks — ragged, slanted smears that tear across as the camera whips
    const k = smoother(span(t, WHIP.a, WHIP.b));
    const fade = 1 - smoother(span(t, 49.05, 49.45));
    if (k > 0.02 && fade > 0.02) {
      const r = rnd(741);
      for (let i = 0; i < 13; i++) {
        const yy = -560 + r() * 1120, hgt = 4 + r() * 26, sl = (r() - 0.5) * 44;
        const x0 = -1150 + r() * 480, x1 = 1150 - r() * 480;
        MV.flat(i % 3 === 0 ? [206, 224, 234] : [255, 254, 248], (50 + 130 * k) * fade);
        brush.polygon([[x0, yy], [x1, yy + sl], [x1, yy + sl + hgt], [x0, yy + hgt]]);
      }
    }
  }

  // ================================================================ segD · atoms (49.4–51.9)
  //   the Researcher fizzes into coloured dots, they swirl and briefly spell a paperclip,
  //   then snap back into him — dizzy, glasses knocked askew. Hearts float in at the end.
  const FIZZ = { dissolve: [49.45, 50.15], swirlT: 49.9, clipA: 50.5, clipB: 51.30, back: [51.45, 51.95], pop: 51.85 };

  function paperclipPts(cx, cy, s) {
    const R = s * 0.34, H = s * 0.85, segs = [];
    let cur = [];
    const add = (x, y) => cur.push([cx + x, cy + y]);
    const brk = () => { if (cur.length > 1) segs.push(cur); cur = []; };
    const arc = (ax, ay, rad, a0, a1, k) => { for (let i = 0; i <= k; i++) { const a = lerp(a0, a1, i / k); add(ax + Math.cos(a) * rad, ay + Math.sin(a) * rad); } };
    add(-R, -H * 0.74);
    for (let i = 1; i <= 6; i++) add(-R, lerp(-H * 0.74, H - R, i / 6));
    arc(0, H - R, R, Math.PI, 0, 8);
    for (let i = 1; i <= 8; i++) add(R, lerp(H - R, -H * 0.92, i / 8));
    brk();
    add(R * 0.45, H * 0.68);
    for (let i = 1; i <= 6; i++) add(R * 0.45, lerp(H * 0.68, -H + R * 0.45, i / 6));
    arc(0, -H + R * 0.45, R * 0.45, 0, Math.PI, 6);
    for (let i = 1; i <= 7; i++) add(-R * 0.45, lerp(-H + R * 0.45, H * 0.92, i / 7));
    brk();
    const all = segs.reduce((a, b) => a.concat(b), []);
    return { segs, all };
  }

  // Translucent stand-in drawn while his real body is not: built from pre-rotated world
  // coordinates (no push/rotate around brush calls — p5.brush's mask sizing gets confused
  // by that combination and throws when the rect comes out empty).
  function ghostResearcher(p, rot, alpha) {
    if (alpha <= 0.02) return;
    const s = p.s, X = p.x, Y = p.feet;
    const c = Math.cos(rot), sn = Math.sin(rot);
    const W = (x, y) => [X + (x * c - y * sn), Y + (x * sn + y * c)];
    const legH = s * 0.30, bodyH = s * 0.38, cw = s * 0.175, headR = s * 0.145;
    const coat = [W(-cw * 0.8, -legH), W(-cw * 1.05, -legH - bodyH), W(cw * 1.05, -legH - bodyH), W(cw * 0.8, -legH)];
    MV.flat(P.coat, 210 * alpha); brush.polygon(coat);
    const hc = W(0, -s * 0.7989);
    MV.flat(P.skin, 225 * alpha);
    brush.polygon(MV.wobbleEllipse(hc[0], hc[1], headR, headR, 883, 16, 0.05));
    MV.flat(P.coatShadow, 200 * alpha);
    for (const sg of [-1, 1]) {
      brush.polygon([
        W(sg * s * 0.05 - s * 0.031, -legH), W(sg * s * 0.05 + s * 0.031, -legH),
        W(sg * s * 0.07 + s * 0.029, 0), W(sg * s * 0.07 - s * 0.029, 0)
      ]);
    }
  }

  function fizzDots(t, cx, cy, s) {
    const r = rnd(881), N = 112;
    const legH = s * 0.30, bodyH = s * 0.38, cw = s * 0.175, armL = s * 0.27;
    const headY = -0.7989 * s, headR = s * 0.145;
    const homes = [], cols = [];
    const C = [P.coat, P.coatShadow, P.skin, P.hair, [206, 224, 232], [62, 52, 48]];
    const ACC = [P.rose, P.tealGlow, P.gold2, [244, 166, 96]];
    for (let i = 0; i < N; i++) {
      let x, y, c;
      if (i < 30) { const a = r() * TAU, rad = Math.sqrt(r()) * headR * 1.05; x = Math.cos(a) * rad; y = headY + Math.sin(a) * rad; c = i < 10 ? C[3] : (i < 16 ? C[4] : C[2]); }
      else if (i < 70) { x = (r() - 0.5) * 2 * cw * 0.95; y = -legH - r() * bodyH; c = (i % 6 === 0) ? ACC[i % 4] : C[i % 2]; }
      else if (i < 92) { const sg = i % 2 ? 1 : -1; x = sg * s * 0.05 + (r() - 0.5) * s * 0.09; y = -r() * legH; c = C[1]; }
      else if (i < 114) { const sg = i % 2 ? 1 : -1; const a = r() * 2.6 + 0.3; x = sg * cw * 1.05 + Math.cos(a) * armL * r(); y = -legH - bodyH * 0.88 + Math.sin(a) * armL * 0.9 * r(); c = i % 8 === 0 ? ACC[(i + 1) % 4] : C[2]; }
      else { x = (i % 2 ? 1 : -1) * headR * 0.45; y = headY + (r() - 0.5) * headR * 0.9; c = C[4]; }
      homes.push([cx + x, cy + y]); cols.push(c);
    }
    const kd = smoother(span(t, FIZZ.dissolve[0], FIZZ.dissolve[1]));
    const kc = smoother(span(t, FIZZ.clipA, FIZZ.clipB - 0.35));
    const kb = smoother(span(t, FIZZ.back[0], FIZZ.back[1]));
    const headWy = cy - s * 0.2989;      // his head, relative to the body centre (cy)
    const clip = paperclipPts(cx, headWy, s * 0.34);
    // vortex arcs + a soft glow behind the dots
    const uu = clamp((t - FIZZ.swirlT) * 1.1);
    if (uu > 0.01 && kb < 0.9 && kd > 0.05) {
      MV.glow(cx, cy, s * (0.9 + 0.4 * uu), [228, 242, 252], (0.12 + 0.12 * uu) * (1 - kc), 6);
      MV.ink([252, 253, 255], 4.5 + 5 * uu, 'pen');
      for (let i = 0; i < 4; i++) {
        const rr0 = s * (0.17 + i * 0.14) * (0.6 + 0.6 * uu), rr1 = rr0 * (1.25 + 0.18 * i);
        const a0 = i * 1.7 + t * (1.5 + i * 0.45);
        let prev = null;
        for (let k = 0; k <= 9; k++) {
          const a = a0 + k * 0.24, rad = lerp(rr0, rr1, k / 9);
          const px2 = cx + Math.cos(a) * rad, py2 = cy + Math.sin(a) * rad * 0.92;
          if (prev) brush.line(prev[0], prev[1], px2, py2);
          prev = [px2, py2];
        }
      }
    }
    // his ghost fades as the dots take over
    ghostResearcher({ x: cx, feet: cy + s * 0.5, s }, FIZZ_ROT, (1 - kd) * (1 - kb));
    if (t < FIZZ.dissolve[0] - 0.02) return;
    push(); noStroke();
    for (let i = 0; i < N; i++) {
      const ph = r(), ph2 = r();
      const home = homes[i];
      const hx = home[0] - cx, hy = home[1] - cy;
      const a0 = Math.atan2(hy, hx), r0 = Math.hypot(hx, hy) || 1;
      // swirling orbit
      const u = (t - FIZZ.swirlT) * (0.9 + ph * 0.5);
      const a = a0 + u * 5.2 + 1.2 * Math.sin(u * 2 + ph * 6);
      const rad = r0 * (1 + 0.30 * Math.sin(clamp(u) * 1.4)) + 7 * (1 + ph2) * clamp(u * 0.6);
      const sx = cx + Math.cos(a) * rad, sy = cy + Math.sin(a) * rad;
      const ci = clip.all[Math.floor(ph2 * clip.all.length) % clip.all.length];
      let px = lerp(home[0], sx, kd), py = lerp(home[1], sy, kd);
      px = lerp(px, ci[0], kc); py = lerp(py, ci[1], kc);
      px = lerp(px, home[0], kb); py = lerp(py, home[1], kb);
      const rr2 = s * (0.015 + ph * 0.013) * (1 + 0.22 * Math.sin(t * 20 + ph * 10) + 0.5 * kd * Math.sin(u * 6 + ph * 9));
      fill(css(cols[i], 245 * (1 - 0.35 * kb)));
      circle(px, py, rr2 * 2);
    }
    pop();
    // the wire flashes while the dots spell it
    if (kc > 0.02) {
      MV.ink([96, 84, 78], 5, 'pen');
      for (const sg of clip.segs) {
        for (let i = 1; i < sg.length; i++) brush.line(sg[i - 1][0], sg[i - 1][1], sg[i][0], sg[i][1]);
      }
      if (t > FIZZ.clipB - 0.34 && t < FIZZ.clipB - 0.12) {
        S.burst(cx, headWy - s * 0.85, 34 + 40 * (t - (FIZZ.clipB - 0.34)) * 5, 771, [236, 208, 140], 7);
      }
    }
    // the snap-back pop
    if (t > FIZZ.pop && t < FIZZ.pop + 0.3) {
      const u = (t - FIZZ.pop) / 0.3;
      S.burst(cx, cy, 100 * (1 - u) + 50, 772, [255, 240, 200], 12);
      MV.glow(cx, cy, 200 * (1 - u) + 80, [255, 246, 214], 0.3 * (1 - u), 5);
    }
  }

  function segD(t) {
    MV.__stage = 'D';
    const rc = rideCam(t);
    setBand(rc.zoom, rc.foc);
    MV.cam(rc.cam);
    rideScene(t, { vehicles: false, board: false, rider: false, foc: rc.foc, zoom: rc.zoom });
    const p = ridPos(48.4);
    const rot = FIZZ_ROT + 0.14 * Math.sin(t * 3.1) * clamp(span(t, 50.8, 51.0));
    const cx = p.x, cy = p.feet - p.s * 0.5;
    // he is drawn until he comes apart, and again after he snaps back
    if (t < FIZZ.dissolve[0] + 0.12 || t > FIZZ.pop) {
      const dizzy = t > FIZZ.pop;
      push(); translate(p.x, p.feet); rotate(rot); translate(-p.x, -p.feet);
      MV.researcher({
        x: p.x, y: p.feet, s: p.s, seed: 9,
        face: {
          look: [0.2, 0.1], mouth: dizzy ? 'oh' : 'oh',
          glasses: dizzy ? 'swirl' : 'sweat', sweatN: dizzy ? 2 : 3
        },
        arms: { l: dizzy ? 0.5 : 0.1, r: dizzy ? 1.9 : -0.12 }, pose: 'run'
      });
      pop();
      if (dizzy) {
        // glasses knocked askew, spinning beside his head
        const gx = p.x + p.s * 0.30, gy = p.feet - p.s * 0.72;
        push(); translate(gx, gy); rotate(2.6 + 0.12 * Math.sin(t * 9)); scale(0.9, 0.9);
        MV.ink([70, 60, 56], 4, 'pen');
        brush.circle(-16, 0, 15); brush.circle(16, 0, 15); brush.line(-2, 0, 2, 0);
        pop();
      }
    }
    fizzDots(t, cx, cy, p.s);
    MV.camPop();
    // hearts float in as the room turns pink (51.9 → 53.4)
    const hk = clamp((t - 51.9) / 1.5);
    if (hk > 0) heartsFloat(t, hk);
  }

  // drifting hearts used to hand off to Sydney's room
  function heartsFloat(t, k) {
    const r = rnd(901);
    for (let i = 0; i < 26; i++) {
      const x0 = -1000 + r() * 2000, ph = r(), sp = 90 + r() * 130, sz = (34 + r() * 60) * (0.5 + k);
      const u = ((t * sp + ph * 1400) % 1400) / 1400;
      const y = 620 - u * 1300, x = x0 + Math.sin(t * 1.6 + ph * 9) * 40;
      if (Math.abs(x) > 1180 || Math.abs(y) > 760) continue;      // screen space: keep it on-canvas
      MV.heartShape(x, y, sz, mix([240, 190, 196], P.rose, ph), [150, 70, 78], 3);
    }
    // the sky warms toward rose
    MV.flat(mix([210, 226, 232], [246, 214, 218], k), 150 * k);
    brush.polygon([[-1600, -800], [1600, -800], [1600, 800], [-1600, 800]]);
  }

  // ================================================================ segE · Sydney's room (53.4–59.0)
  //   A pink room of hearts: heart-eyed Sydney-Clawd cuddles a heart-shaped birdcage with the
  //   Researcher rattling the bars inside, she offers a ring, he squeezes out between the bars —
  //   then she blows a giant heart bubble that fills the frame and pops (handoff to the arena).
  const SYD = {
    wallA: [253, 238, 241], wallB: [248, 214, 224], floor: [235, 202, 206],
    rug: [243, 178, 192], ink: [152, 76, 88], deep: [198, 108, 120], gold: [232, 184, 96]
  };
  const CAGE = { x: -180, base: 294, w: 300 };          // heart birdcage: centre x, base y, width
  const SCL = { x: 340, feet: 418, h: 332 };             // Sydney-Clawd beside it (body centre = feetY)
  const RIN = { a: 55.35, b: 56.35 };                   // she offers the ring
  const OUT = { a: 56.40, b: 57.10 };                   // he squeezes out between the bars
  const BUB = { a: 57.10, b: 58.30, pop: 58.30 };       // the bubble grows … then pops

  // the heart silhouette (normalised: width 2r, top at -1.0r, bottom point at +1.06r)
  function heartProfile(r) {
    const pts = [];
    for (let i = 0; i <= 44; i++) {
      const a = (i / 44) * TAU;
      const x = 16 * Math.pow(Math.sin(a), 3);
      const y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      pts.push([x * r / 16, y * r / 16]);
    }
    return pts;
  }
  // the heart's upper edge at local x (used to trim the cage bars)
  function heartTop(r, x) {
    let best = -r * 1.04;
    for (const p of heartProfile(r)) if (Math.abs(p[0] - x) < r * 0.14 && p[1] < best) best = p[1];
    return best;
  }
  const cageGeom = (shakeX) => {
    const r = CAGE.w / 2, x = CAGE.x + shakeX, cyc = CAGE.base - r * 1.14;
    return { r, x, cyc, perch: cyc + r * 0.60 };
  };

  function sydCam(t) {
    const k1 = smoother(span(t, 53.5, 54.6));                       // settle into the room
    const k2 = smoother(span(t, 55.30, 55.90)) - smoother(span(t, 56.30, 56.90));   // push on the ring
    const k3 = smoother(span(t, 56.95, 57.45));                     // pull back for the bubble
    const zoom = lerp(1.02, 1.16, k1) + 0.20 * k2 - 0.16 * k3 + 0.34 * smoother(span(t, 58.0, 58.30));
    return camOn(lerp(-6, 26, k1) + 30 * k2, lerp(-40, -26, k1) - 14 * k2, zoom, {});
  }

  function heartRoom(t) {
    const W = 1500;
    MV.flat(SYD.wallA, 255); brush.polygon([[-W, -900], [W, -900], [W, 40], [-W, 40]]);
    MV.flat(SYD.wallB, 255); brush.polygon([[-W, -300], [W, -300], [W, 44], [-W, 44]]);
    // wallpaper hearts (a loose grid on the upper wall only; anything off the band is skipped)
    const r = rnd(941);
    for (let i = 0; i < 32; i++) {
      const hx = -1080 + (i % 8) * 300 + (r() - 0.5) * 70;
      const hy = -620 + Math.floor(i / 8) * 250 + (r() - 0.5) * 70;
      const hr = 34 + r() * 26;
      if (hy + hr > 10) continue;
      if (!onScreenX(hx, hr) || !onScreenY(hy, hr * 1.1)) continue;
      MV.heartShape(hx, hy, hr, mix(SYD.wallB, [255, 246, 248], r()), [220, 164, 178], 4);
    }
    // floor
    MV.flat(SYD.floor, 255); brush.polygon([[-W, 40], [W, 40], [W, 900], [-W, 900]]);
    MV.ink([196, 148, 156], 5, 'pen'); brush.line(-W, 42, W, 42);
    // rug
    const rp = MV.wobbleEllipse(-40, 470, 660, 150, 942, 28, 0.06);
    MV.flat(SYD.rug, 250); brush.polygon(rp);
    MV.ink([184, 112, 126], 4, 'pen'); brush.polygon(rp);
    // a little round side table with a heart vase (left wall)
    MV.flat([226, 198, 168], 250); brush.polygon(MV.wobbleEllipse(-760, 232, 96, 22, 943, 16, 0.05));
    MV.ink([168, 132, 96], 3.4, 'pen'); brush.polygon(MV.wobbleEllipse(-760, 232, 96, 22, 943, 16, 0.05));
    MV.ink([186, 150, 108], 9, 'pen'); brush.line(-760, 240, -760, 396);
    MV.flat([222, 190, 158], 250); brush.polygon(MV.wobbleEllipse(-760, 400, 70, 18, 944, 16, 0.05));
    MV.heartShape(-742, 176, 26, [238, 168, 180], [172, 96, 110], 5);
    MV.ink([150, 176, 130], 4, 'pen'); brush.line(-742, 196, -730, 216);
    // bunting of small hearts across the ceiling
    for (let i = 0; i < 9; i++) {
      const bx = -880 + i * 220, by = -430 + 46 * Math.sin(i * 1.1);
      if (!onScreenX(bx, 30)) continue;
      MV.heartShape(bx, by, 26 + 8 * Math.sin(i * 2.3), mix([244, 186, 198], SYD.deep, 0.4 + 0.5 * (i % 3) / 2), [178, 104, 118], 6);
    }
  }

  function cageBack(g, t, glow) {
    const pts = heartProfile(g.r).map(p => [g.x + p[0], g.cyc + p[1]]);
    MV.bloom([255, 248, 251], 120 + 90 * glow);
    brush.polygon(pts);
    // tray + perch
    const tr = rr(g.x, CAGE.base - 8, CAGE.w * 1.08, 22, 9, 951, 1.4);
    MV.flat([226, 200, 164], 252); brush.polygon(tr);
    MV.ink([152, 116, 74], 3.4, 'pen'); brush.polygon(tr);
    MV.ink([170, 130, 88], 5, 'pen'); brush.line(g.x - g.r * 0.52, g.perch, g.x + g.r * 0.52, g.perch);
  }
  function cageFront(g, t) {
    const pts = heartProfile(g.r).map(p => [g.x + p[0], g.cyc + p[1]]);
    MV.ink([136, 112, 120], 3.2, 'pen');
    for (let i = -4; i <= 4; i++) {
      const bx = g.x + i * (g.r / 4.6);
      brush.line(bx, g.cyc + g.r * 1.0, bx, g.cyc + heartTop(g.r, bx - g.x) + g.r * 0.06);
    }
    brush.line(g.x - g.r * 0.88, g.cyc + g.r * 0.76, g.x + g.r * 0.88, g.cyc + g.r * 0.76);
    MV.ink([114, 86, 94], 6, 'pen'); brush.polygon(pts);
    // hook + chain running up out of frame
    MV.ink([176, 152, 120], 4, 'pen');
    brush.circle(g.x, g.cyc - g.r * 1.20, 13);
    brush.line(g.x, g.cyc - g.r * 1.34, g.x, -900);
  }

  function sydneyClawd(t, o = {}) {
    const offer = smoother(span(t, RIN.a, RIN.b)) * (1 - smoother(span(t, OUT.a, OUT.b)));
    MV.clawd({
      x: SCL.x, y: feetY(SCL.feet, SCL.h), h: SCL.h, seed: 21,
      face: { eyes: 'heart', mouth: offer > 0.2 ? 'smile' : 'smile', look: [-0.3, 0.05], blush: true },
      arms: offer > 0.25 ? { l: 'hug', r: 'reach' } : { l: 'hug', r: 'hug' },
      legs: { l: 0.12, r: -0.12 },
      sx: 1, sy: 1 + 0.02 * Math.sin(t * 3.2)
    });
    // a rose bow on the crown, so she reads as "Sydney"
    const by = feetY(SCL.feet, SCL.h) - SCL.h * 0.56, bw = SCL.h * 0.17;
    MV.flat(SYD.deep, 250);
    brush.polygon([[0, by], [-bw, by - bw * 0.75], [-bw * 1.1, by + bw * 0.55]]);
    brush.polygon([[0, by], [bw, by - bw * 0.75], [bw * 1.1, by + bw * 0.55]]);
    MV.ink([146, 74, 86], SCL.h * 0.016, 'pen');
    brush.polygon([[0, by], [-bw, by - bw * 0.75], [-bw * 1.1, by + bw * 0.55]]);
    brush.polygon([[0, by], [bw, by - bw * 0.75], [bw * 1.1, by + bw * 0.55]]);
  }

  function ringProp(t, x, y, k) {
    const s = 44 * (0.8 + 0.2 * k);
    MV.ink([196, 148, 52], 7, 'pen'); brush.circle(x, y, s);
    MV.ink([248, 226, 150], 3, 'pen'); brush.circle(x, y, s * 0.86);
    MV.flat([236, 240, 248], 250);
    brush.polygon(MV.wobbleEllipse(x, y - s * 1.06, s * 0.30, s * 0.24, 955, 12, 0.06));
    MV.ink([176, 182, 196], 2.6, 'pen');
    brush.polygon(MV.wobbleEllipse(x, y - s * 1.06, s * 0.30, s * 0.24, 955, 12, 0.06));
    for (let i = 0; i < 4; i++) {
      const a = t * 2.2 + i * 1.57, rr2 = s * (1.5 + 0.5 * Math.sin(t * 3 + i));
      const px2 = x + Math.cos(a) * rr2, py2 = y - s * 0.9 + Math.sin(a) * rr2 * 0.9;
      MV.ink([252, 244, 210], 3, 'pen');
      brush.line(px2 - 7, py2, px2 + 7, py2); brush.line(px2, py2 - 7, px2, py2 + 7);
    }
  }

  function bubbleHeart(cx, cy, r, t) {
    const pts = heartProfile(r).map(p => [cx + p[0], cy + p[1]]);
    MV.bloom([255, 226, 238], 150);
    brush.polygon(pts);
    MV.flat([252, 214, 226], 150);
    brush.polygon(pts);
    MV.ink([226, 150, 172], 7, 'pen'); brush.polygon(pts);
    MV.flat([255, 255, 255], 180);
    brush.polygon(MV.wobbleEllipse(cx - r * 0.44, cy - r * 0.30, r * 0.2, r * 0.13, 963, 12, 0.08));
    MV.flat([255, 255, 255], 130);
    brush.polygon(MV.wobbleEllipse(cx - r * 0.18, cy + r * 0.30, r * 0.11, r * 0.07, 964, 12, 0.08));
  }

  function segE(t) {
    MV.__stage = 'E';
    const cam = sydCam(t);
    setBand(cam.zoom, [0, 0]);
    MV.cam(cam);
    heartRoom(t);

    const shakeX = 5 * Math.sin(t * 41) * (1 - smoother(span(t, OUT.a, OUT.b))) * smoother(span(t, 54.2, 54.6));
    const g = cageGeom(shakeX);
    const outU = smoother(span(t, OUT.a, OUT.b));
    cageBack(g, t, 0.4 + 0.4 * Math.sin(t * 6.2));

    // ---- the Researcher: rattling inside, then squeezing out between the bars ----
    const sq = Math.sin(clamp(outU) * Math.PI);                       // squash while passing the bars
    const inside = 1 - outU;
    const rx = lerp(g.x - 6, g.x - g.r * 1.72, easeInOut(outU));
    const rFeet = lerp(g.perch + 4, 402, outU);
    const rH = 120;
    if (outU < 0.5) cageFront(g, t);                 // behind the bars while he is still inside
    push();
    translate(rx, rFeet); if (outU > 0.001 && outU < 0.999) scale(1 - 0.34 * sq, 1 + 0.34 * sq); translate(-rx, -rFeet);
    MV.researcher({
      x: rx, y: rFeet, s: rH, seed: 13,
      face: { look: inside > 0.5 ? [0.4, 0.1] : [-0.5, 0.1], mouth: inside > 0.5 ? 'oh' : 'smile', glasses: 'sweat', sweatN: inside > 0.5 ? 3 : 1 },
      arms: { l: inside > 0.5 ? lerp(0.2, -2.2, 0.5 + 0.5 * Math.sin(t * 9)) : -0.6, r: inside > 0.5 ? lerp(0.2, 2.2, 0.5 - 0.5 * Math.sin(t * 9)) : -1.5 },
      pose: inside > 0.5 ? 'run' : 'stroll'
    });
    pop();
    if (outU >= 0.5) cageFront(g, t);                // in front of them once he is squeezing through

    // ---- Sydney-Clawd, then the ring ----
    sydneyClawd(t, {});
    const rk = smoother(span(t, RIN.a, RIN.b)) * (1 - smoother(span(t, 56.6, 56.9)));
    if (rk > 0.02) ringProp(t, SCL.x - SCL.h * 0.66, feetY(SCL.feet, SCL.h) - SCL.h * 0.62 - 40 * rk, rk);

    // ---- hearts pop on the beat around the cage ----
    for (const bt of beatsIn(53.8, 58.20)) {
      const u = clamp((t - bt) / 0.66);
      if (t < bt || u >= 1) continue;
      const r1 = rnd(9700 + Math.round(bt * 100));
      const hx = g.x + (r1() - 0.5) * 460, hy = g.cyc - 40 + (r1() - 0.5) * 210 - u * 150;
      const sz = (18 + 22 * r1()) * (1 - u) * (1 - u);
      if (sz < 2 || !onScreenX(hx, sz) || !onScreenY(hy, sz)) continue;
      MV.heartShape(hx, hy, sz, mix([246, 182, 196], SYD.deep, r1()), [176, 96, 112], 7);
    }

    // ---- the giant heart bubble ----
    const bu = smoother(span(t, BUB.a, BUB.pop));
    if (bu > 0.02 && t < BUB.pop) {
      const bounce = 1 + 0.05 * Math.sin(t * 7.5);
      const r = lerp(46, 1180, Math.pow(bu, 1.5)) * bounce;
      bubbleHeart(SCL.x - SCL.h * 0.42, feetY(SCL.feet, SCL.h) - SCL.h * 0.30, r, t);
    }
    // the pop
    if (t > BUB.pop) {
      const u = clamp((t - BUB.pop) / 0.55);
      const r2 = rnd(981);
      for (let i = 0; i < 26; i++) {
        const a = r2() * TAU, d = (60 + 1100 * r2()) * easeOut(u);
        const hx = SCL.x - SCL.h * 0.42 + Math.cos(a) * d, hy = feetY(SCL.feet, SCL.h) - SCL.h * 0.30 + Math.sin(a) * d * 0.8;
        const sz = (26 + 40 * r2()) * (1 - 0.6 * u);
        if (!onScreenX(hx, sz) || !onScreenY(hy, sz)) continue;
        MV.heartShape(hx, hy, sz, mix([255, 236, 244], [232, 132, 154], r2()), [178, 96, 112], 8);
      }
      MV.flat([255, 252, 253], 220 * (1 - u) * (1 - u));
      brush.polygon([[-1600, -900], [1600, -900], [1600, 900], [-1600, 900]]);
    }
    // ---- the room dissolves into a pink heart field (handoff to the arena) ----
    const ko = smoother(span(t, 58.42, 59.0));
    if (ko > 0.01) {
      MV.flat(SYD.wallB, 235 * ko);
      brush.polygon([[-1600, -900], [1600, -900], [1600, 900], [-1600, 900]]);
      const r3 = rnd(993);
      for (let i = 0; i < 16; i++) {
        const ph = r3() * 6.28, spd = 0.6 + r3() * 0.8;
        const hx = -760 + r3() * 1520;
        const hy = ((r3() * 1400 - 700) + (t - 58.42) * 120 * spd) % 1100 - 550;
        const sz = 22 + r3() * 34;
        if (!onScreenX(hx, sz) || !onScreenY(hy, sz)) continue;
        MV.heartShape(hx, hy, sz * (0.4 + 0.6 * ko), mix([255, 240, 245], SYD.deep, r3()) , [206, 138, 156], 9);
      }
    }
    MV.camPop();
  }

  // ================================================================ dispatch
  function draw(t) {
    if (t < 41.5) segA(t);
    else if (t < 45.0) segB(t);
    else if (t < 49.4) segC(t);
    else if (t < 53.4) segD(t);
    else segE(t);
  }

  MV.shots = MV.shots || {};
  MV.shots.takeoff = { a: 38.5, b: 59.0, draw };
})();
