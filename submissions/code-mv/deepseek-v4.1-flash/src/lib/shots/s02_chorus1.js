// src/lib/shots/s02_chorus1.js — Shot 2 · Chorus 1: The P(doom) Show (23.0–38.5)
//   23.0 mouth-iris opens onto the stage · 24.45 rocket rig · 26.11 FOOM · 26.5 Chinese room ·
//   28.0 shroom trip · 29.5 shoggoth · 33.5 shinigami eyes · 35.5 dance break.
(function () {
  const MV = window.MV;
  const P = MV.PAL, S = MV.sets;
  const {
    lerp, clamp, span, smooth, smoother, easeOut, easeOut3, easeInOut, easeBack, mix, css,
    beatEnv, beatPos, beatIndex, hash, rnd, vnoise, shake
  } = MV;
  const TAU = Math.PI * 2;

  // ---------------------------------------------------------------- shared helpers
  // arm angles: left arm points up at -2.05 / down at 1.25; right arm up at pi+1.45 / down at 1.5
  const armAng = (side, kind) => (side < 0
    ? (kind === 'up' ? -2.05 : 1.25)
    : (kind === 'up' ? Math.PI + 1.45 : 1.5));

  // a chorus Clawd: bobs on the beat, arms snap between up/down poses, happy face on the hit
  function danceClawd(x, feetY, h, t, ph, seed, o = {}) {
    const tt = t + ph;
    const e = Math.pow(beatEnv(tt, 6), 1.25);
    const bi = beatIndex(tt);
    const up = ((bi % 2) + 2) % 2 === 0;
    const hop = -h * 0.13 * e - (o.lift || 0);
    const sq = 1 + 0.13 * e, sx = 1 - 0.075 * e;
    const kind = e > 0.42 ? (up ? 'up' : 'down') : (up ? 'down' : 'up');
    const aL = o.armsUp ? armAng(-1, 'up') + 0.2 * e : armAng(-1, kind);
    const aR = o.armsUp ? armAng(1, 'up') - 0.2 * e : armAng(1, up ? 'down' : 'up');
    MV.clawd({
      x, y: feetY - h * 0.5 + hop, h, seed, sx, sy: sq, rot: (o.tilt || 0) + (up ? -0.05 : 0.05) * e,
      face: {
        eyes: e > 0.5 ? 'happy' : 'open',
        look: [Math.sin(tt * 1.3) * 0.4, -0.15],
        mouth: e > 0.5 ? 'oh' : 'smile', blush: true
      },
      arms: { l: aL, r: aR }, extras: o.extras || []
    });
  }

  // painted sky: warm cream up top drying to blue, with slow clouds
  function sky(t, o = {}) {
    const c0 = o.c0 || [250, 245, 231], c1 = o.c1 || [150, 198, 230];
    for (let i = 0; i < 14; i++) {
      const u = i / 13, y0 = -580 + 1180 * u;
      MV.flat(mix(c0, c1, Math.pow(u, 0.9)), 255);
      brush.polygon([[-1060, y0 - 46], [1060, y0 - 46], [1060, y0 + 46], [-1060, y0 + 46]]);
    }
    for (let i = 0; i < 6; i++) {
      const r = MV.rnd(300 + i);
      const x0 = -1100 + r() * 2200, y0 = -430 + r() * 700, w = 380 + r() * 560, hh = 130 + r() * 150;
      S.cloud(x0 + Math.sin(t * 0.22 + i * 2.3) * 70, y0 + Math.sin(t * 0.37 + i) * 20, w, hh, 310 + i, o.cloudCol || [252, 249, 240], o.cloudA || 185);
    }
  }

  // the P(doom) meter reading across the act (visible in segA + segG; monotone in between)
  function meterPct(t) {
    if (t < 24.45) return 8 + 5.5 * S.stair(t, 50, 53, 0, 1, 0.2);
    if (t < 35.55) return 13.5 + 16.5 * clamp((t - 24.45) / 11.1);
    return 30 + 4 * S.stair(t, 78, 84, 0, 1, 0.18);
  }

  // ---------------------------------------------------------------- stage ensemble
  // Character widths are 1.6*h (hw = h*0.8 is a HALF width), so everything on the stage is
  // laid out with that in mind: [meter -742] [pump -560] [lead -260] [researcher -40] [chorus 250/555/860]
  // o: { meter, pump, chorus, chorusX, researcher, resX, rocket, rocketT, launch }
  function showStage(t, cam, o = {}) {
    S.stage(t, { back: P.crimson, sun: { c1: P.rose, c2: [188, 80, 72] } });
    const pct = meterPct(t);
    if (o.meter !== false) S.meter(o.meterX !== undefined ? o.meterX : -728, 424, 0.92, pct, { cam });
    if (o.pump) {
      const pu = Math.pow(beatEnv(t, 5.2), 1.3);
      const tr = 0.45 + 0.55 * pu;
      S.pump(o.pumpX !== undefined ? o.pumpX : -562, 430, 0.88, { travel: tr, hoseTo: [o.meterX !== undefined ? o.meterX : -728, 420], puffs: pu });
      MV.clawd({
        x: o.leadX !== undefined ? o.leadX : -262, y: 274, h: o.leadH || 284, seed: 31,
        sx: 1 - 0.05 * pu, sy: 1 + 0.07 * pu,
        face: { eyes: pu > 0.5 ? 'happy' : 'open', look: [-0.55, 0.05], mouth: pu > 0.5 ? 'oh' : 'smile', blush: true },
        arms: { l: lerp(3.62, 2.92, tr), r: Math.PI + 0.62 }, extras: []
      });
    }
    if (o.rocket && t < (o.launch || 1e9) + 0.04) rocketRig(t, o.rocketT || t, o.launch || 1e9);
    if (o.chorus) {
      const xs = o.chorusX || [250, 555, 860];
      for (let i = 0; i < xs.length; i++) danceClawd(xs[i], 410, o.chorusH || 196, t, i * 0.055, 41 + i, {});
    }
    if (o.researcher !== false) {
      const look = [Math.sin(t * 0.9) * 0.7, 0.15];
      MV.researcher({
        x: o.resX !== undefined ? o.resX : -44, y: 412, s: o.resS || 232, seed: 3,
        face: { look, mouth: t > 23.6 ? 'oh' : 'flat' },
        arms: { l: -1.55 + 0.2 * Math.sin(t * 2), r: 2.05 - 0.2 * Math.sin(t * 2) }
      });
      const ex = Math.pow(beatEnv(t, 4), 2);
      if (ex > 0.55) MV.drawEmote({ kind: 'exclaim', x: (o.resX !== undefined ? o.resX : -44) - 150, y: 176, s: 46 * ex, alpha: ex });
    }
    S.footlights(t);
    S.confetti(t, { n: 44, t0: 23.0, bot: 448, alpha: 0.8 });
  }

  // ---------------------------------------------------------------- rocket
  // painted firework at (x,y) base; o: { s, lit, fuse, wobble, trail }
  function rocket(x, y, o = {}) {
    const s = o.s || 1, wob = o.wobble || 0;
    push(); translate(x + wob * 6, y); rotate(wob * 0.03);
    // stick
    MV.flat([188, 150, 96], 250);
    brush.polygon(MV.wobbleRoundRect(0, 132 * s, 22 * s, 300 * s, 8 * s, 61, 4, 1.4));
    // body
    const body = MV.wobbleRoundRect(0, -110 * s, 104 * s, 310 * s, 22 * s, 62, 5, 1.6);
    MV.flat([248, 242, 226], 252); brush.polygon(body);
    for (let i = 0; i < 3; i++) {
      MV.flat(P.crimson, 255);
      brush.polygon(MV.wobbleRoundRect(0, -170 * s + i * 62 * s, 108 * s, 32 * s, 10 * s, 63 + i, 4, 1.3));
    }
    MV.ink([102, 76, 52], 1.8, 'pen'); brush.polygon(body);
    // cone nose (gold so it reads against the crimson backdrop)
    MV.flat([232, 186, 92], 252);
    brush.polygon([[-54 * s, -256 * s], [54 * s, -256 * s], [0, -368 * s]]);
    MV.ink([128, 88, 32], 2, 'pen');
    brush.polygon([[-54 * s, -256 * s], [54 * s, -256 * s], [0, -368 * s]]);
    MV.flat(P.crimson, 250);
    brush.polygon([[-30 * s, -298 * s], [30 * s, -298 * s], [0, -368 * s]]);
    // fins
    for (const sg of [-1, 1]) {
      MV.flat([196, 150, 90], 250);
      brush.polygon([[sg * 46 * s, 10 * s], [sg * 46 * s, 76 * s], [sg * 104 * s, 96 * s]]);
    }
    // fuse (+ crawling spark)
    MV.ink([92, 74, 56], 3.6 * s, 'pen');
    const f = o.fuse || 0;
    const p0 = [40 * s, 44 * s], p1 = [128 * s, 96 * s], p2 = [190 * s, 52 * s];
    for (let i = 0; i < 10; i++) {
      const u0 = i / 10, u1 = (i + 1) / 10;
      const pt = (u) => {
        const a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
        return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]];
      };
      const q0 = pt(u0), q1 = pt(u1);
      brush.line(q0[0], q0[1], q1[0], q1[1]);
    }
    if (f > 0.02) {
      const u = clamp(f), sp = [lerp(p0[0], p2[0], u), lerp(p0[1], p2[1], u) - Math.sin(u * Math.PI) * 44 * s];
      MV.glow(sp[0], sp[1], 60 * s, [255, 216, 130], 0.5 + 0.4 * Math.sin(t0 * 30), 5);
      const r = rnd(900 + Math.floor(t0 * 24));
      for (let i = 0; i < 6; i++) {
        MV.flat([255, 224, 150], 200);
        brush.circle(sp[0] + (r() - 0.5) * 70 * s, sp[1] + (r() - 0.5) * 70 * s, (3 + r() * 6) * s);
      }
    }
    pop();
  }
  let t0 = 0;    // set per segment (only used for sparkle jitter seeding)

  // Clawd strapped onto the rocket + straps; drawn with the rocket on stage
  function rocketRig(t, tt, launch) {
    const s = 1.3;
    // fuse/spark/tremble are all keyed off the launch instant (segB's LAUNCH)
    const tL = launch && launch < 1e8 ? launch : 26.11;
    const wob = Math.pow(beatEnv(tt, 7), 1.4) * (tt > tL - 0.28 ? 2.2 : 1);
    // Clawd first, then the rocket over him, then the straps -> reads as "strapped onto it"
    MV.clawd({
      x: -40, y: 276 + wob * 3, h: 210, seed: 33,
      sx: 1 - 0.05 * wob, sy: 1 + 0.07 * wob,
      face: {
        eyes: tt > tL - 0.4 ? 'happy' : 'open', look: [0, -0.2],
        mouth: tt > tL - 0.4 ? 'oh' : 'smile', blush: true
      },
      arms: { l: -1.9 - 0.25 * wob, r: Math.PI + 1.9 + 0.25 * wob }, extras: []
    });
    rocket(-40, 402, { s, fuse: smooth(span(tt, tL - 0.53, tL - 0.02)), wobble: wob });
    // straps (in the rocket's own frame)
    push(); translate(-40, 402); rotate(wob * 0.03);
    for (const yy of [-205, -100]) {
      MV.flat([116, 86, 56], 248);
      brush.polygon(MV.wobbleRoundRect(0, yy * s, 196 * s, 30 * s, 11 * s, 66 + yy, 4, 1.4));
    }
    pop();
    // two chorus Clawds holding it steady (clear of the rocket's body)
    for (const sg of [-1, 1]) {
      danceClawd(sg < 0 ? -470 : 420, 428, 208, tt, sg * 0.09 + 0.2, 51 + sg, { armsUp: true, extras: [] });
    }
  }

  // ---------------------------------------------------------------- segA · 23.0–24.4
  // the mouth opens from a seam and the stage appears inside it
  function segA(t) {
    t0 = t;
    const op = easeOut3(span(t, 23.06, 23.78));
    const rx = 16 + 1750 * op, ry = 11 + 820 * op;
    const cam = { x: 0, y: -34, zoom: 1.05 + 0.05 * smooth(span(t, 23.2, 24.42)), rot: 0 };
    MV.cam(cam);
    showStage(t, cam, { pump: true, chorus: true });
    MV.camPop();
    const gm = smooth(span(t, 23.0, 23.6));
    S.mouthIris(0, -34, rx, ry, {
      teeth: (1 - op) * (1 - smooth(span(t, 23.6, 23.95))),
      gum: mix([106, 26, 36], [116, 22, 32], gm),
      lip: mix([156, 44, 50], [198, 68, 66], smooth(span(t, 23.06, 23.5))),
      rim: gm > 0.45
    });
  }

  // ---------------------------------------------------------------- segB · 24.45–26.5
  // strap on, light the fuse, FOOM, ride the rocket up as the camera tilts after it
  function segB(t) {
    t0 = t;
    // "FOOM" must land on the sung word. Measured on the master: the vowel attack is
    // 26.088–26.10 (vocal-band flux onset, right on beat 57 = 26.117) and the loudest part is
    // 26.157. At 24fps those fall between the frames 26.0833 and 26.125, and an SFX card reads
    // as "late" if it only reaches full opacity on 26.125 — so the text is put up on 26.0833,
    // i.e. the frame BEFORE the attack (LAUNCH = 26.05), which also puts the white flash's peak
    // and the rocket's lift right on the attack.
    // (The karaoke sweep is linear over the lyric window, so it lights "FOOM" at ~26.15 —
    //  that is the late-sounding cue, not this animation.)
    const LAUNCH = 25.55;
    const tilt = smoother(span(t, LAUNCH + 0.08, 26.48));
    sky(t, {});
    const sh = shake(t, t < LAUNCH ? 6 + 24 * smooth(span(t, LAUNCH - 0.51, LAUNCH)) : 34 * Math.exp(-(t - LAUNCH) * 5), 6, 3);
    const cam = {
      x: 0, y: lerp(-30, 1900, tilt), zoom: lerp(1.06, 0.88, tilt),
      rot: lerp(0, -0.075, tilt), shakeX: sh[0], shakeY: sh[1]
    };
    // launch screen position (frozen) so the ride reads as "camera tilts up after it"
    const z0 = 1.06, y0 = -30 + 402 * z0, x0 = -40 * z0;
    const rise = easeOut3(span(t, LAUNCH, 26.42));
    const rp = [x0 + 150 * tilt, lerp(y0, -560, rise)];
    MV.cam(cam);
    showStage(t, cam, { rocket: true, rocketT: t, launch: LAUNCH, chorus: false, pump: false, researcher: false });
    // the blast cloud stays with the stage (rides down out of frame)
    const bl = smooth(span(t, LAUNCH, LAUNCH + 0.18)) * (1 - smooth(span(t, LAUNCH + 0.9, LAUNCH + 1.5)));
    if (bl > 0.02) {
      S.cloud(-40, 300, 620 * (0.5 + bl), 360 * (0.5 + bl), 611, [250, 236, 208], 170 * bl);
      S.cloud(-40, 270, 360, 260, 612, [230, 132, 88], 175 * bl);
    }
    MV.camPop();
    // white flash at the FOOM (screen space, over the paint so far)
    const fl = smooth(span(t, LAUNCH - 0.02, LAUNCH + 0.04)) * (1 - smooth(span(t, LAUNCH + 0.04, LAUNCH + 0.2)));
    if (fl > 0.01) {
      MV.flat([255, 250, 238], 235 * fl);
      brush.polygon([[-1040, -600], [1040, -600], [1040, 600], [-1040, 600]]);
    }
    // the rocket rides up in screen space, with a sparking smoke trail
    if (t > LAUNCH) {
      const rs = lerp(0.9, 0.4, rise);
      for (let k = 5; k >= 1; k--) {
        const tk = Math.max(LAUNCH, t - k * 0.055);
        const rk = easeOut3(span(tk, LAUNCH, 26.42));
        const py = lerp(y0, -560, rk) + 40 * rs, px = x0 + 150 * smoother(span(tk, LAUNCH + 0.08, 26.48));
        S.cloud(px, py + 90, 210 * rs * (1 - k * 0.12), 190 * rs, 620 + k, [246, 236, 218], 190 - k * 22);
      }
      rocket(rp[0], rp[1] + 150 * rs, { s: rs, wobble: 0.5 * Math.sin(t * 26 + rise * 4) });
      if (rise < 0.75) {                    // the strapped Clawd rides along
        MV.clawd({
          x: rp[0], y: rp[1] + 40 * rs, h: 210 * rs, seed: 33,
          face: { eyes: 'happy', look: [0, -0.2], mouth: 'oh', blush: true },
          arms: { l: -1.95, r: Math.PI + 1.95 }, extras: []
        });
      }
    }
    MV.subtitles.sfx('FOOM', 1420, 300, {
      s: 250, color: P.crimson, rot: -0.07,
      // snap on in the frame right after the hit (~90% at 26.125), then clear before the
      // cut at 26.5 — the old span ran off the end of the segment and popped off hard
      alpha: smooth(span(t, LAUNCH - 0.01, LAUNCH + 0.02)) * (1 - smooth(span(t, 26.30, 26.46)))
    });
  }

  // ---------------------------------------------------------------- segC · 26.5–27.9
  // crash into a tiny paper room in the sky; inside: two mail slots, 你好/中文 slips, rulebook
  const SLIP_TXT = ['你好', '中文', '你好', '中文', '你好', '中文'];
  function slip(x, y, w, h, rot, col) {
    push(); translate(x, y); rotate(rot);
    MV.flat(col || [243, 236, 218], 250);
    brush.polygon(MV.wobbleRoundRect(0, 0, w, h, 3, 91 + Math.round(x), 3, 1.1));
    MV.ink([150, 132, 108], 1.2, 'pen');
    brush.polygon(MV.wobbleRoundRect(0, 0, w, h, 3, 91 + Math.round(x), 3, 1.1));
    pop();
  }
  function mailSlot(x, y, w, o = {}) {
    MV.flat([186, 142, 74], 252);
    brush.polygon(MV.wobbleRoundRect(x, y, w + 44, 46, 8, 93, 4, 1.6));
    MV.ink([96, 66, 30], 2, 'pen');
    brush.polygon(MV.wobbleRoundRect(x, y, w + 44, 46, 8, 93, 4, 1.6));
    MV.flat([34, 26, 26], 255);
    brush.polygon(MV.wobbleRoundRect(x, y, w, 18, 5, 94, 4, 1.2));
    MV.flat(o.inside || [64, 48, 44], 200);
    brush.polygon(MV.wobbleRoundRect(x, y + 16, w, 14, 5, 95, 3, 1.0));
  }

  function segC(t) {
    t0 = t;
    const hit = 26.62;                                   // the crash
    if (t < 26.78) {
      // --- exterior: paper room floating in the sky, rocket smashes into it
      sky(t, {});
      const fl = smoother(span(t, hit, 26.72));
      const rx2 = 250, ry2 = -60;
      push();
      translate(rx2, ry2 + fl * 40); rotate(-0.05 + fl * 0.5);
      // paper box: front + roof + side
      MV.flat([236, 228, 206], 255);
      brush.polygon([[-230, -170], [230, -170], [230, 170], [-230, 170]]);
      MV.flat([250, 244, 226], 255);
      brush.polygon([[-230, -170], [230, -170], [150, -260], [-310, -260]]);
      MV.flat([214, 206, 184], 255);
      brush.polygon([[-230, -170], [-230, 170], [-310, 260], [-310, -260]]);
      MV.ink([142, 128, 106], 2.2, 'pen');
      brush.polygon([[-230, -170], [230, -170], [230, 170], [-230, 170]]);
      brush.line(-230, -170, -310, -260); brush.line(-230, 170, -310, 260); brush.line(230, -170, 150, -260);
      // creases + a tiny mail slot on the front
      MV.ink([170, 156, 132], 1.6, 'pen');
      for (let i = 0; i < 3; i++) brush.line(-180 + i * 40, -170, -180 + i * 40, 170);
      mailSlot(120, 60, 150, {});
      pop();
      // the rocket comes in fast from the lower left
      const app = smooth(span(t, 26.5, hit));
      const rk = [lerp(-900, rx2 - 60, app), lerp(560, ry2 + 40, app)];
      const wob = Math.sin(t * 30) * 0.1;
      const rks = lerp(1.0, 0.78, app) + 0.02 * wob;
      rocket(rk[0], rk[1] + 130 * rks, { s: rks, wobble: wob });
      if (t > hit) {
        const b = smooth(span(t, hit, hit + 0.14)) * (1 - smooth(span(t, hit + 0.2, hit + 0.5)));
        S.cloud(rx2 - 40, ry2 + 30, 520 * (0.6 + b), 420 * (0.6 + b), 631, [250, 240, 220], 220 * b);
        const r = rnd(940);
        for (let i = 0; i < 12; i++) {          // paper scraps fly out
          const a = r() * TAU, d = (60 + r() * 190) * (0.5 + b);
          slip(rx2 - 40 + Math.cos(a) * d, ry2 + 30 + Math.sin(a) * d, 90 + r() * 50, 54, a + t * 4, [244, 236, 216]);
        }
      }
      const fl2 = smooth(span(t, 26.74, 26.8));
      if (fl2 > 0) { MV.flat([250, 246, 232], 255 * fl2); brush.polygon([[-1040, -600], [1040, -600], [1040, 600], [-1040, 600]]); }
      return;
    }
    // --- interior of the paper room
    const cam = { x: 0, y: -50 - 46 * smooth(span(t, 26.8, 27.9)), zoom: 1.0 + 0.12 * smooth(span(t, 26.8, 27.9)), rot: 0 };
    MV.cam(cam);
    // walls
    MV.flat([242, 234, 212], 255); brush.polygon([[-820, -520], [820, -520], [820, 400], [-820, 400]]);
    MV.flat([212, 203, 180], 255); brush.polygon([[-1060, -600], [-820, -520], [-820, 400], [-1060, 470]]);
    MV.flat([226, 217, 194], 255); brush.polygon([[1060, -600], [820, -520], [820, 400], [1060, 470]]);
    MV.flat([232, 222, 198], 255); brush.polygon([[-1060, 470], [1060, 470], [820, 400], [-820, 400]]);
    MV.flat([250, 243, 224], 255); brush.polygon([[-1060, -600], [1060, -600], [820, -520], [-820, -520]]);
    MV.ink([150, 136, 112], 2.4, 'pen');
    brush.line(-820, -520, -820, 400); brush.line(820, -520, 820, 400);
    brush.line(-1060, -600, -820, -520); brush.line(1060, -600, 820, -520);
    brush.line(-1060, 470, -820, 400); brush.line(1060, 470, 820, 400);
    brush.line(-1060, 470, 1060, 470);
    // fold creases on the back wall + pinned scraps
    MV.ink([186, 172, 148], 1.4, 'pen');
    for (let i = 0; i < 5; i++) brush.line(-700 + i * 350, -520, -700 + i * 350, 400);
    const r = rnd(951);
    for (let i = 0; i < 5; i++) slip(-700 + r() * 1400, -360 + r() * 300, 80 + r() * 60, 60, (r() - 0.5) * 0.4, [246, 240, 222]);
    // two mail slots
    mailSlot(-540, 120, 190); mailSlot(560, 60, 190);
    // giant rulebook on a lectern, left-front
    const flip = Math.pow(beatEnv(t, 4.2), 1.6);
    push(); translate(-430, 320); scale(1.5);
    MV.flat([132, 96, 56], 250);
    brush.polygon([[-230, 60], [230, 60], [180, -30], [-180, -30]]);
    MV.ink([84, 58, 34], 2, 'pen'); brush.polygon([[-230, 60], [230, 60], [180, -30], [-180, -30]]);
    for (const sg of [-1, 1]) {                       // open pages
      MV.flat([248, 242, 224], 252);
      brush.polygon([[0, -34], [sg * 250, -80], [sg * 250, 26], [0, 8]]);
      MV.ink([152, 138, 114], 1.8, 'pen');
      brush.polygon([[0, -34], [sg * 250, -80], [sg * 250, 26], [0, 8]]);
      MV.ink([178, 164, 138], 1.1, 'pen');
      for (let i = 1; i < 5; i++) brush.line(sg * 20, lerp(-34, 8, i / 5) + 2, sg * 230, lerp(-80, 26, i / 5) + 2);
    }
    // the flipping page (width collapses on the beat)
    const fw = Math.abs(Math.cos(Math.PI * (1 - flip))) ;
    MV.flat([238, 230, 210], 250);
    brush.polygon([[0, -36], [232 * fw, -80 + 40 * (1 - fw)], [232 * fw, 22 - 40 * (1 - fw)], [0, 6]]);
    pop();
    // Clawd in the middle, frantically shuffling
    const fast = Math.sin(t * 11), fast2 = Math.cos(t * 9.5);
    MV.clawd({
      x: 90, y: 190, h: 300, seed: 35, sx: 1 + 0.02 * fast, sy: 1 - 0.02 * fast,
      face: { eyes: 'scared', look: [0.35 * fast, 0.2], mouth: 'oh', blush: false },
      arms: { l: -0.5 + 0.5 * fast, r: Math.PI - 0.35 + 0.55 * fast2 }, extras: []
    });
    MV.drawEmote({ kind: 'sweat', x: 250, y: 30, s: 54, alpha: 0.85 });
    MV.drawEmote({ kind: 'sweat', x: -60, y: -10, s: 40, alpha: 0.7 });
    // slips cycling from slot to slot (text rides in the overlay buffer)
    for (let i = 0; i < 6; i++) {
      const ph = i / 6;
      const u = ((t * 1.15 + ph) % 1);
      const from = i % 2 ? [-540, 120] : [560, 60];
      const to = i % 2 ? [560, 60] : [-540, 120];
      const arc = Math.sin(u * Math.PI) * 150 * (i % 2 ? -1 : 1);
      const x = lerp(from[0], to[0], u) + 40;
      const y = lerp(from[1], to[1], u) - arc;
      const rot = (i % 2 ? -1 : 1) * 0.35 + Math.sin(t * 6 + i) * 0.25;
      slip(x, y, 132, 74, rot);
      MV.propText(SLIP_TXT[i], x, y, {
        cam, font: '700 34px "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif',
        color: '#3a3230', lineW: 4, outlineColor: 'rgba(250,246,236,0.85)'
      });
    }
    MV.camPop();
  }

  // ---------------------------------------------------------------- segD · 28.0–29.4
  // mushroom trip: paper room melts into swirling watercolour rainbows, shrooms sprout
  const RAIN = [[222, 106, 96], [236, 168, 88], [242, 214, 122], [172, 212, 152], [126, 206, 208], [146, 146, 212], [204, 138, 198]];
  function shroom(x, by, s, t, seed, born) {
    const g = easeOut3(span(t, born, born + 0.34));
    if (g <= 0.01) return;
    const e = Math.pow(beatEnv(t, 5.4), 1.4);
    push(); translate(x, by); scale(s * g * (1 - 0.1 * e), s * g * (1 + 0.2 * e));
    MV.flat([240, 235, 218], 252);
    brush.polygon(MV.wobbleRoundRect(0, -70, 56, 156, 17, seed, 4, 1.6));
    MV.ink([168, 152, 128], 1.8, 'pen'); brush.polygon(MV.wobbleRoundRect(0, -70, 56, 156, 17, seed, 4, 1.6));
    const cap = [];
    for (let i = 0; i <= 20; i++) {
      const a = Math.PI + (i / 20) * Math.PI;
      cap.push([Math.cos(a) * 124, -142 + Math.sin(a) * 120]);
    }
    MV.flat(P.crimson, 252); brush.polygon(cap);
    MV.ink([108, 28, 34], 2, 'pen'); brush.polygon(cap);
    const r = rnd(seed * 7 + 3);
    for (let i = 0; i < 4; i++) { MV.flat([248, 240, 222], 240); brush.circle(-72 + r() * 144, -196 + r() * 54, 13 + r() * 17); }
    pop();
  }

  function segD(t) {
    t0 = t;
    const melt = smoother(span(t, 28.0, 28.55));
    MV.flat(mix([238, 230, 208], [246, 240, 224], melt), 255);
    brush.polygon([[-1070, -630], [1070, -630], [1070, 630], [-1070, 630]]);
    // the paper walls melt away
    if (melt < 1) {
      const r = rnd(961);
      for (let i = 0; i < 5; i++) {
        const x0 = -900 + r() * 1800, y0 = -520 + r() * 880, w = 220 + r() * 300;
        MV.flat([238, 230, 208], 250 * (1 - melt));
        brush.polygon([[x0, y0 + melt * 700], [x0 + w, y0 + melt * 700], [x0 + w * 0.88, y0 + 130 + melt * 700], [x0 + w * 0.12, y0 + 130 + melt * 700]]);
      }
    }
    // rainbow walls: wavy bands, drawn as overlapping quads so nothing triangulates wrong
    const nb = RAIN.length, bandH = 1220 / nb;
    for (let b = 0; b < nb; b++) {
      const y0 = -600 + bandH * b;
      for (let i = 0; i < 13; i++) {
        const u0 = i / 13, u1 = (i + 1) / 13;
        const x0 = lerp(-1060, 1060, u0), x1 = lerp(-1060, 1060, u1) + 3;
        const w0 = Math.sin(u0 * 6.2 + t * 1.25 + b * 0.7) * (46 + 30 * Math.sin(t * 0.85 + b));
        const w1 = Math.sin(u1 * 6.2 + t * 1.25 + b * 0.7) * (46 + 30 * Math.sin(t * 0.85 + b));
        MV.flat(RAIN[b], 250 * (0.25 + 0.75 * melt));
        brush.polygon([[x0, y0 + w0], [x1, y0 + w1], [x1, y0 + bandH + 8 + w1], [x0, y0 + bandH + 8 + w0]]);
      }
    }
    // spiral swirls circling the centre
    for (let k = 0; k < 4; k++) {
      const rr = 210 + k * 92, phi = t * (0.8 + k * 0.22) + k;
      MV.ink([250, 248, 238], 7 + 2 * Math.sin(t * 2 + k), 'marker');
      for (let i = 0; i < 26; i++) {
        const a0 = (i / 26) * TAU * 1.15 + phi, a1 = ((i + 1) / 26) * TAU * 1.15 + phi;
        const r0 = rr * (0.35 + 0.65 * (i / 26)), r1 = rr * (0.35 + 0.65 * ((i + 1) / 26));
        brush.line(Math.cos(a0) * r0, Math.sin(a0) * r0, Math.cos(a1) * r1, Math.sin(a1) * r1);
      }
    }
    // mushrooms sprout along the bottom and bounce
    for (let i = 0; i < 7; i++) {
      const x = -960 + i * 320 + 40 * Math.sin(i * 2.1);
      shroom(x, 610, 2.0 + 0.35 * ((i * 37) % 5) / 4, t, 100 + i, 28.05 + i * 0.19);
    }
    // Clawd, eyes swirling, body wobbling
    const e = Math.pow(beatEnv(t, 5), 1.3);
    MV.clawd({
      x: 0, y: 210, h: 330, seed: 37,
      sx: 1 + 0.07 * Math.sin(t * 2.3) - 0.04 * e, sy: 1 - 0.07 * Math.sin(t * 2.3) + 0.08 * e,
      rot: Math.sin(t * 1.7) * 0.05,
      face: { eyes: 'swirl', look: [Math.sin(t * 1.4) * 0.3, Math.sin(t * 1.9) * 0.3], mouth: 'smile', blush: true },
      arms: { l: -2.1 + 0.5 * Math.sin(t * 3.1), r: Math.PI + 1.9 + 0.5 * Math.sin(t * 2.6) }, extras: []
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + t * 0.5;
      MV.drawEmote({ kind: i % 2 ? 'sparkle' : 'heart', x: Math.cos(a) * 470, y: -40 + Math.sin(a) * 220, s: 26 + 18 * Math.sin(t * 2 + i), alpha: 0.85 });
    }
    // the swirl resolves into a smiley face
    const sm = smoother(span(t, 29.12, 29.45));
    if (sm > 0.01) {
      const rr = 340 * sm;
      MV.flat([250, 246, 232], 252); brush.circle(0, -30, rr);
      MV.ink([150, 134, 112], 2.4, 'pen'); brush.circle(0, -30, rr);
      MV.flat([46, 38, 42], 250);
      brush.circle(-rr * 0.34, -30 - rr * 0.14, rr * 0.13);
      brush.circle(rr * 0.34, -30 - rr * 0.14, rr * 0.13);
      MV.ink([46, 38, 42], 5, 'pen');
      for (let i = 0; i <= 14; i++) {
        const a = 0.18 * Math.PI + (i / 14) * 0.64 * Math.PI;
        const px = Math.cos(a) * rr * 0.6, py = -30 + Math.sin(a) * rr * 0.5;
        const a2 = 0.18 * Math.PI + ((i + 1) / 14) * 0.64 * Math.PI;
        brush.line(px, py, Math.cos(a2) * rr * 0.6, -30 + Math.sin(a2) * rr * 0.5);
      }
    }
  }

  // ---------------------------------------------------------------- segE · 29.5–33.4
  // the shoggoth's lies: a friendly smiley waves, the mask slips, Clawd yanks it off
  function tentacle(x, y, ang, len, w0, t, seed, col) {
    const segs = 8, pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, a = ang + Math.sin(t * 5.6 + seed + u * 3.2) * 0.3 * u * (0.6 + 0.4 * beatEnv(t, 5));
      pts.push([x + Math.cos(a) * len * u, y + Math.sin(a) * len * u + 0.42 * len * u * u]);
    }
    for (let i = 0; i < segs; i++) {
      const wA = w0 * (1 - i / segs) + 4, wB = w0 * (1 - (i + 1) / segs) + 4;
      const p0 = pts[i], p1 = pts[i + 1];
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      MV.flat(col, 248);
      brush.polygon([[p0[0] + nx * wA * 0.5, p0[1] + ny * wA * 0.5], [p1[0] + nx * wB * 0.5, p1[1] + ny * wB * 0.5],
      [p1[0] - nx * wB * 0.5, p1[1] - ny * wB * 0.5], [p0[0] - nx * wA * 0.5, p0[1] - ny * wA * 0.5]]);
    }
  }
  function smiley(cx, cy, rr, rot, o = {}) {
    push(); translate(cx, cy); rotate(rot);
    MV.flat([252, 248, 236], 252); brush.circle(0, 0, rr);
    MV.ink([176, 160, 132], 2.2, 'pen'); brush.circle(0, 0, rr);
    // cheerful eyes + smile
    MV.flat([48, 40, 44], 250);
    brush.circle(-rr * 0.34, -rr * 0.2, rr * 0.12); brush.circle(rr * 0.34, -rr * 0.2, rr * 0.12);
    MV.ink([48, 40, 44], Math.max(4, rr * 0.055), 'marker');
    for (let i = 0; i <= 16; i++) {
      const a = 0.14 * Math.PI + (i / 16) * 0.72 * Math.PI;
      const a2 = 0.14 * Math.PI + ((i + 1) / 16) * 0.72 * Math.PI;
      brush.line(Math.cos(a) * rr * 0.56, Math.sin(a) * rr * 0.5, Math.cos(a2) * rr * 0.56, Math.sin(a2) * rr * 0.5);
    }
    // rosy cheeks
    MV.bloom([236, 168, 156], 55);
    brush.circle(-rr * 0.58, -rr * 0.02, rr * 0.12); brush.circle(rr * 0.58, -rr * 0.02, rr * 0.12);
    // a little waving hand on a stick arm
    if (o.arm) {
      MV.ink([150, 132, 108], 9, 'pen');
      brush.line(rr * 0.86, rr * 0.1, rr * 1.42, rr * 0.1 - 40 * o.armWave);
      MV.flat([252, 248, 236], 250);
      brush.circle(rr * 1.48, rr * 0.1 - 46 * o.armWave, rr * 0.15);
    }
    pop();
  }

  function segE(t) {
    t0 = t;
    // push into the eye at the end of the segment (Clawd's right eye sits at x0+hw*0.42)
    const k = 1 + 14 * smoother(span(t, 32.95, 33.42));
    const kk = k - 1, ex = -526, ey = 282;
    MV.flat([236, 226, 204], 255); brush.polygon([[-1080, -640], [1080, -640], [1080, 640], [-1080, 640]]);
    const cam = { x: -ex * kk, y: -ey * kk, zoom: k, rot: 0 };
    MV.cam(cam);
    // dark room tone that grows as the mask comes off
    const dark = smoother(span(t, 30.45, 31.15));
    if (dark > 0.01) {
      MV.flat(mix([236, 226, 204], [42, 32, 54], dark), 255 * dark);
      brush.polygon([[-1120, -680], [1120, -680], [1120, 680], [-1120, 680]]);
    }
    // ---- shoggoth
    const grow = smoother(span(t, 30.5, 31.2));
    const br = lerp(250, 470, grow);
    const body = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * TAU;
      const wob = 1 + 0.13 * Math.sin(a * 5 + t * 2.1) + 0.06 * Math.sin(a * 9 - t * 3.3);
      body.push([Math.cos(a) * br * 1.05 * wob, Math.sin(a) * br * 0.86 * wob - 40]);
    }
    MV.flat([74, 54, 84], 250); brush.polygon(body);
    MV.flat([52, 38, 62], 190); brush.polygon(MV.growPts(body, 0.72));
    // tentacles wiggle on the beat
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.12 + (i / 8) * 0.78);
      tentacle(Math.cos(a) * br * 0.8, -40 + Math.sin(a) * br * 0.6, a, 300 + 90 * Math.sin(i * 2.3), 54, t, i * 3.1, [66, 48, 76]);
    }
    // many eyes
    const eyes = [[-0.42, -0.30, 0.20], [-0.06, -0.44, 0.15], [0.34, -0.32, 0.22], [0.58, -0.02, 0.13], [0.12, -0.10, 0.26], [-0.36, 0.06, 0.16], [-0.10, 0.22, 0.12], [0.36, 0.24, 0.15]];
    for (let i = 0; i < eyes.length; i++) {
      const [u, v, w] = eyes[i], er = br * w * (0.5 + 0.5 * grow);
      const vx = -620 - u * br, vy = 320 - (v * br * 0.86 - 40) - 0;      // look toward Clawd
      const d = Math.hypot(vx, vy) || 1;
      MV.flat([250, 246, 236], 252); brush.circle(u * br, v * br * 0.86 - 40, er);
      MV.ink([96, 82, 92], 2, 'pen'); brush.circle(u * br, v * br * 0.86 - 40, er);
      MV.flat([30, 24, 34], 250);
      brush.circle(u * br + (vx / d) * er * 0.4, v * br * 0.86 - 40 + (vy / d) * er * 0.4, er * 0.45);
      push(); noStroke(); fill(255, 255, 255, 200);
      circle(u * br + (vx / d) * er * 0.4 - er * 0.18, v * br * 0.86 - 40 + (vy / d) * er * 0.4 - er * 0.2, er * 0.22); pop();
    }
    // ---- the smiley mask: waves, then slips out of frame
    const slip = smoother(span(t, 30.55, 31.0));
    const maskX = lerp(0, -430, slip), maskY = lerp(-30, 300, slip), maskRot = slip * 0.9 + Math.sin(t * 1.7) * 0.06 * (1 - slip);
    if (slip < 0.98) {
      smiley(maskX, maskY, lerp(330, 250, slip), maskRot, { arm: 1 - slip, armWave: Math.sin(t * 7) });
    }
    // the mask, yanked by Clawd and tossed away
    if (t > 31.25) {
      const th = smoother(span(t, 31.25, 31.95));
      const tx = lerp(-430, 1150, th), ty = lerp(300, -520, th) - Math.sin(th * Math.PI) * 180;
      smiley(tx, ty, 250 * (1 - 0.45 * th), th * 7, {});
    }
    // ---- Clawd (he does the yanking)
    const grab = smoother(span(t, 30.95, 31.35));
    const lean = 0.25 * grab;
    MV.clawd({
      x: -700 + 90 * grab, y: 250 + 40 * grab, h: 250, seed: 39, rot: -lean,
      face: {
        eyes: t > 32.35 ? 'red' : (t > 31.3 ? 'happy' : 'open'),
        look: [t > 32.35 ? 0 : 0.6, -0.1],
        mouth: t > 32.35 ? 'flat' : (t > 31.3 ? 'smile' : 'oh'), blush: t < 32.35
      },
      arms: { l: -1.1 - 0.9 * grab, r: Math.PI + 0.35 - 1.1 * grab }, extras: []
    });
    if (t > 31.2 && t < 32.1) {
      const ex2 = Math.pow(beatEnv(t, 3.5), 2);
      MV.drawEmote({ kind: 'sparkle', x: -540, y: 40, s: 40 + 30 * ex2, alpha: 0.9 });
      MV.drawEmote({ kind: 'sparkle', x: -880, y: 120, s: 26 + 40 * ex2, alpha: 0.8 });
    }
    MV.camPop();
    // iris flood as we push into the eye
    const flood = smoother(span(t, 33.3, 33.5));
    if (flood > 0.01) {
      MV.flat([24, 10, 16], 255 * flood);
      brush.circle(-526, 282, 2400 * flood);
    }
  }

  // ---------------------------------------------------------------- segF · 33.5–35.5
  // shinigami eyes: black + red speed lines, flaring red eyes, a lifespan counter, an apple
  function segF(t) {
    t0 = t;
    MV.flat(P.black, 255); brush.polygon([[-1080, -640], [1080, -640], [1080, 640], [-1080, 640]]);
    const sh = shake(t, 9, 7, 5);
    const cam = { x: 40, y: 10, zoom: 1.03 + 0.05 * smooth(span(t, 33.5, 35.4)), rot: 0, shakeX: sh[0], shakeY: sh[1] };
    MV.cam(cam);
    // red ink speed lines converging on Clawd
    const r = rnd(971);
    for (let i = 0; i < 46; i++) {
      const a = r() * TAU, e = 0.55 + 0.65 * Math.pow(beatEnv(t + r() * 0.1, 6), 1.2);
      const r0 = 240 + r() * 120, r1 = 1500 * e;
      MV.ink(r() > 0.65 ? [198, 40, 44] : [150, 26, 34], 2.5 + r() * 7, 'pen');
      brush.line(Math.cos(a) * r0 + 120, Math.sin(a) * r0, Math.cos(a) * r1 + 120, Math.sin(a) * r1);
    }
    // Clawd, eyes flaring red
    const e2 = Math.pow(beatEnv(t, 5.5), 1.3);
    MV.clawd({
      x: 120, y: 176, h: 470, seed: 43, sx: 1 + 0.05 * e2, sy: 1 - 0.05 * e2,
      face: { eyes: 'red', look: [0.1, 0.05], mouth: 'flat', blush: false }, arms: { l: 1.5, r: 1.5 }, extras: []
    });
    MV.glow(-40, 96, 150 + 50 * e2, [236, 62, 54], 0.4 + 0.4 * e2, 7);
    MV.glow(240, 100, 140 + 50 * e2, [236, 62, 54], 0.4 + 0.4 * e2, 7);
    // the Researcher, lifespan ticking down over his head
    MV.researcher({
      x: -520, y: 430, s: 208, seed: 3, face: { look: [0.5, -0.2], mouth: 'oh' },
      arms: { l: -2.4, r: -2.2 }
    });
    const bpi = beatPos(t) - 73.4;
    const life = Math.max(3, Math.round(63847 - bpi * 149));
    MV.propText(life.toLocaleString('en-US'), -520, 118, {
      cam, font: '700 60px Consolas, "Courier New", monospace',
      color: t > 34.6 ? '#f0c8b4' : '#f4eae2', outlineColor: 'rgba(24,6,10,0.92)', lineW: 8
    });
    MV.ink([198, 60, 54], 3, 'pen');
    for (let i = 0; i < 10; i++) {                        // little bracket marks around the number
      const a = (i / 10) * TAU + t * 0.4;
      brush.line(-520 + Math.cos(a) * 150, 118 + Math.sin(a) * 46, -520 + Math.cos(a) * 172, 118 + Math.sin(a) * 54);
    }
    // an apple bounces past on the beat
    const bp = beatPos(t) - 73.0;
    const bu = ((bp % 1) + 1) % 1;
    const ax = -1080 + (t - 33.4) * 640, ay = 400 - 4 * bu * (1 - bu) * 330;
    if (ax > -1120 && ax < 1180) {
      push(); translate(ax, ay); rotate(Math.sin(t * 6) * 0.2);
      MV.flat([196, 46, 46], 252); brush.polygon(MV.wobbleEllipse(0, 0, 56, 54, 55, 20, 0.08));
      MV.ink([126, 26, 28], 2, 'pen'); brush.polygon(MV.wobbleEllipse(0, 0, 56, 54, 55, 20, 0.08));
      push(); noStroke(); fill(240, 178, 168, 190); ellipse(-18, -18, 22, 16); pop();
      MV.ink([92, 70, 48], 4, 'pen'); brush.line(0, -50, 8, -74);
      MV.flat([104, 152, 84], 250); brush.polygon([[8, -70], [58, -88], [40, -52]]);
      pop();
    }
    MV.camPop();
    // red flash out
    const rf = smoother(span(t, 35.32, 35.5));
    if (rf > 0.01) {
      MV.flat([178, 30, 36], 255 * rf);
      brush.polygon([[-1080, -640], [1080, -640], [1080, 640], [-1080, 640]]);
    }
  }

  // ---------------------------------------------------------------- segG · 35.5–38.5
  // full-stage dance break: big Clawds in a spin wave, confetti, the Researcher doing the robot
  const TX = { a: 38.08, b: 38.46 };
  function segG(t) {
    t0 = t;
    const sh = shake(t, 7, 8, 9);
    const cam = { x: 0, y: -16 + 8 * Math.sin(t * 0.8), zoom: 1.0 + 0.06 * smooth(span(t, 35.5, 38.4)), rot: 0, shakeX: sh[0], shakeY: sh[1] };
    MV.cam(cam);
    S.stage(t, { back: P.crimson, sun: { c1: P.rose, c2: [188, 80, 72], spin: 0.06 } });
    // three big Clawds turning in a staggered wave.  NOTE: a Clawd body is 1.6*h wide,
    // so h = 330 (528 wide) at 580px spacing is the largest trio that keeps clear air
    // between the bodies — anything bigger and the three merge into one orange slab.
    const xs = [-580, 0, 580];
    for (let i = 0; i < 3; i++) {
      const bp = beatPos(t) - 78 - i * 0.5;
      const cyc = ((bp / 4) % 1 + 1) % 1;
      const p = clamp(cyc / 0.34);
      const spinning = cyc < 0.34;
      const sx = spinning ? Math.cos(p * Math.PI) : 1;
      const e = Math.pow(beatEnv(t + i * 0.02, 5.5), 1.3);
      const hop = -48 * e - (spinning ? 32 * Math.sin(p * Math.PI) : 0);
      MV.clawd({
        x: xs[i], y: 242 + hop, h: 330, seed: 61 + i, sx: sx * (1 - 0.06 * e), sy: 1 + 0.07 * e,
        rot: Math.sin(t * 3 + i) * 0.03,
        face: {
          eyes: spinning ? 'closed' : (e > 0.5 ? 'happy' : 'open'),
          look: [Math.sin(t * 2 + i) * 0.4, -0.15], mouth: e > 0.5 ? 'oh' : 'smile', blush: true
        },
        arms: spinning ? { l: -2.4, r: Math.PI + 2.3 } : { l: -2.1 - 0.3 * e, r: Math.PI + 1.9 + 0.3 * e },
        extras: []
      });
    }
    // the Researcher doing the robot, front and centre — but standing in the gap between
    // two Clawds so his head does not swallow a face.
    const rb = ((beatIndex(t) % 2) + 2) % 2 === 0;
    MV.researcher({
      x: -290, y: 436, s: 252, seed: 3, rot: rb ? -0.04 : 0.04,
      face: { look: [rb ? -0.6 : 0.6, -0.1], mouth: 'oh' },
      arms: rb ? { l: Math.PI + 0.1, r: 1.7 } : { l: 1.15, r: -0.1 }
    });
    S.footlights(t, { y: 452 });
    S.confetti(t, { n: 90, t0: 35.5, bot: 452, alpha: 0.95 });
    MV.camPop();
    // brush wipe out into shot 3
    if (t > TX.a) MV.wipeBand(smooth(span(t, TX.a, TX.b)), P.crimsonDeep, 91, 'in');
  }

  // ---------------------------------------------------------------- dispatch
  function draw(t) {
    MV.__stage = 'chorus1';
    if (t < 24.45) { MV.__stage = 'A'; segA(t); }
    else if (t < 26.5) { MV.__stage = 'B'; segB(t); }
    else if (t < 28.0) { MV.__stage = 'C'; segC(t); }
    else if (t < 29.5) { MV.__stage = 'D'; segD(t); }
    else if (t < 33.5) { MV.__stage = 'E'; segE(t); }
    else if (t < 35.5) { MV.__stage = 'F'; segF(t); }
    else { MV.__stage = 'G'; segG(t); }
  }

  MV.shots = MV.shots || {};
  MV.shots.chorus1 = { a: 23.0, b: 38.5, draw };
})();
