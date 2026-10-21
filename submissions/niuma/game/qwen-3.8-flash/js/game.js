/* ============================================================
 * game.js —— 《植物大战僵尸 · 打工人版》主逻辑
 * 渲染/光照 → 粒子与飘字 → 实体(单位/敌人/子弹/掉落) →
 * 波次状态机 → 战斗/工位槽位/年假 → 输入(拖拽/铲子) → HUD/界面
 * ============================================================ */
'use strict';

/* ---------------- 渲染基础 ---------------- */
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(1280, 720, false);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd8e4ee);
scene.fog = new THREE.Fog(0xd8e4ee, 22, 46);

// 固定半俯视：俯角 45°，正对战场（零横向偏转/零侧倾），一行=一屏内水平带
const CAM = { x: 3.4, h: 9.0, cz: 2.25, lookY: 0.1, lookZ: 1.72 };
const camera = new THREE.PerspectiveCamera(40, 1280 / 720, 0.1, 100);
camera.position.set(CAM.x, CAM.h, CAM.cz + CAM.h);
camera.lookAt(CAM.x, CAM.lookY, CAM.lookZ);

scene.add(new THREE.HemisphereLight(0xeaf4ff, 0xc8b28f, 0.9));
const sun = new THREE.DirectionalLight(0xfff3dd, 0.85);
sun.position.set(5, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -9; sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12; sun.shadow.camera.bottom = -6;
sun.shadow.camera.far = 40;
sun.shadow.bias = -0.0007;
scene.add(sun);

const world = buildWorld(scene);

/* ---------------- 全局状态 ---------------- */
const G = {
  phase: 'start',          // start | playing | over
  paused: false, speed: 1,
  time: 0,
  caffeine: CFG.CAFFEINE_START,
  kills: 0, planted: 0,
  units: [], enemies: [], bullets: [], drops: [],
  occ: Array.from({ length: CFG.GRID_ROWS }, () => new Array(CFG.GRID_COLS).fill(null)),
  cardCd: {},              // key -> 冷却截止(ms, G.time 基准)
  dropTimer: 0,
  bossAlive: false, bossPending: false,
  wave: { i: -1, stage: 'idle', stageEnd: 0, spawned: 0, nextAt: 0, total: 0, bigWarned: false },
  totalSpawns: 0, spawnedAll: 0,
  leavesLeft: 5,
  over: null,
};
for (const k of UNIT_ORDER) G.cardCd[k] = 0;
for (const w of WAVES) G.totalSpawns += Object.values(w.comp).reduce((a, b) => a + b, 0);

/* ---------------- 粒子池（1 个 InstancedMesh，1 draw call） ---------------- */
const PMAX = 900;
const partMesh = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffffff }), PMAX);
partMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
partMesh.frustumCulled = false;
{ const c = new THREE.Color(1, 1, 1); for (let i = 0; i < PMAX; i++) partMesh.setColorAt(i, c); }
scene.add(partMesh);
const parts = [];
const _m4 = new THREE.Matrix4(), _v3 = new THREE.Vector3(), _q = new THREE.Quaternion(), _s3 = new THREE.Vector3(), _col = new THREE.Color();
for (let i = 0; i < PMAX; i++) {
  parts.push({ on: false, x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, s: 0.1, life: 0, ttl: 1, grav: 6, spin: 0, rot: 0 });
  partMesh.setColorAt(i, _col.setHex(0xffffff));
}
function burst(x, y, z, color, n, spd = 3, s = 0.09, ttl = 0.7, grav = 7, spreadY = 1) {
  let made = 0;
  for (const p of parts) {
    if (p.on) continue;
    const a = Math.random() * Math.PI * 2, v = spd * (0.4 + Math.random() * 0.8);
    p.on = true; p.x = x; p.y = y; p.z = z;
    p.vx = Math.cos(a) * v; p.vz = Math.sin(a) * v * 0.5;
    p.vy = Math.random() * spd * spreadY;
    p.s = s * (0.5 + Math.random()); p.life = ttl * (0.6 + Math.random() * 0.6); p.ttl = p.life;
    p.grav = grav; p.rot = Math.random() * 3; p.spin = (Math.random() - 0.5) * 10;
    partMesh.setColorAt(p.__i ?? 0, _col.setHex(color));
    partMesh.instanceColor.needsUpdate = true;
    if (++made >= n) break;
  }
}
// 给池补索引（setColorAt 需要 index）——用序号对象引用重写：
parts.forEach((p, i) => { p.__i = i; });
function updateParts(dt) {
  let any = false;
  parts.forEach((p, i) => {
    if (!p.on) return;
    any = true;
    p.life -= dt;
    if (p.life <= 0) { p.on = false; _m4.makeScale(0, 0, 0); partMesh.setMatrixAt(i, _m4); return; }
    p.vy -= p.grav * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y < 0.03) { p.y = 0.03; p.vy *= -0.35; p.vx *= 0.7; p.vz *= 0.7; }
    p.rot += p.spin * dt;
    const k = Math.max(p.life / p.ttl, 0.05);
    _q.setFromAxisAngle(_v3.set(0.3, 0.8, 0.4).normalize(), p.rot);
    _s3.setScalar(p.s * (0.4 + k));
    _m4.compose(_v3.set(p.x, p.y, p.z), _q, _s3);
    partMesh.setMatrixAt(i, _m4);
  });
  if (any) { partMesh.instanceMatrix.needsUpdate = true; }
}

/* ---------------- 3D→屏幕 飘字 ---------------- */
const labelsPool = [];
function label3(text, x, y, z, cls = '') {
  let el = labelsPool.find(l => !l.busy);
  if (!el) {
    const div = document.createElement('div');
    div.className = 'label3';
    document.getElementById('labels').appendChild(div);
    el = { div, busy: false }; labelsPool.push(el);
  }
  el.busy = true; el.t = 0; el.el3 = { x, y, z };
  el.div.textContent = text;
  el.div.className = 'label3 ' + cls;
  el.div.style.display = 'block';
}
function updateLabels(dt) {
  for (const l of labelsPool) {
    if (!l.busy) continue;
    l.t += dt;
    const v = new THREE.Vector3(l.el3.x, l.el3.y + l.t * 0.9, l.el3.z).project(camera);
    const r = canvas.getBoundingClientRect();
    l.div.style.left = ((v.x * 0.5 + 0.5) * r.width) + 'px';
    l.div.style.top = ((-v.y * 0.5 + 0.5) * r.height) + 'px';
    l.div.style.opacity = Math.max(1 - l.t / 1.15, 0);
    if (l.t > 1.15) { l.busy = false; l.div.style.display = 'none'; }
  }
}

/* ---------------- 单位 ---------------- */
function buildUnitGroup(key) {
  const { group, parts: p } = buildModel(UNIT_MODELS[key]);
  return { group, parts: p };
}
function makeHpBar(w = 0.62, y = 1.0) {
  const bg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.03),
    new THREE.MeshBasicMaterial({ color: 0x2a2f38 }));
  const fg = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.05),
    new THREE.MeshBasicMaterial({ color: 0x6fd06f }));
  const g = new THREE.Group(); g.add(bg); g.add(fg);
  g.position.y = y; g.visible = false; fg.userData.w = w;
  return { group: g, fg };
}
function plantUnit(key, row, col) {
  const def = UNITS[key];
  const { group, parts } = buildUnitGroup(key);
  group.scale.setScalar(1.14);   // 体量感：底面≈格子的 0.65~0.7
  group.position.set(col, 0, row);
  enableShadow(group, true);
  scene.add(group);
  const hp = makeHpBar(0.62, key === 'boss' ? 1.4 : (key === 'wall' ? 1.0 : key === 'ac' ? 0.92 : 0.78));
  group.add(hp.group);
  const u = {
    key, def, row, col, x: col, z: row, group, parts,
    hp: def.hp, maxHp: def.hp, timer: 0, fuse: 0, armed: false, armT: 0,
    bar: hp, flash: 0, anim: { recoil: 0, fire: 0 },
  };
  if (key === 'mine') { // 武装进度条（贴在假忙套装头顶）
    const pr = makeHpBar(0.5, 0.86);
    pr.group.visible = true; pr.fg.material.color.setHex(PAL.yellow);
    pr.fg.scale.x = 0.001;
    u.group.add(pr.group); u.armBar = pr;
  }
  if (key === 'bomb') u.parts.letter.position.y = 0.28;
  G.units.push(u); G.occ[row][col] = u; G.planted++;
  Sound.play('plant');
  const pc = { coffee: PAL.coral, cannon: PAL.metal, wall: PAL.cyan, splash: PAL.water, bomb: PAL.paper, mine: PAL.navy, chat: PAL.cyan, ac: PAL.frost }[key];
  burst(col, 0.12, row, pc, 10, 1.6, 0.07, 0.5, 5);
  return u;
}
function removeUnit(u) {
  const i = G.units.indexOf(u); if (i >= 0) G.units.splice(i, 1);
  G.occ[u.row][u.col] = null;
  disposeGroup(u.group);
}
function disposeGroup(g) {
  scene.remove(g);
  g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
}
function damageUnit(u, dmg) {
  u.hp -= dmg; u.flash = 0.18;
  u.bar.group.visible = true;
  const k = Math.max(u.hp / u.maxHp, 0);
  u.bar.fg.scale.x = Math.max(k, 0.001);
  u.bar.fg.position.x = -(1 - k) * u.bar.fg.userData.w / 2;
  u.bar.fg.material.color.setHex(k > 0.5 ? 0x6fd06f : k > 0.25 ? 0xffd23f : 0xe4443c);
  if (u.hp <= 0) {
    burst(u.x, 0.35, u.z, 0xdfe6ee, 16, 2.6, 0.08, 0.8);
    Sound.play('eat');
    removeUnit(u);
  }
}

/* ---------------- 敌人 ---------------- */
function spawnEnemy(key, row, atX) {
  const def = ENEMIES[key];
  if (key === 'boss') {
    if (G.bossAlive) { G.bossPending = true; return null; }  // 全场同时仅限 1 个
    G.bossAlive = true;
  }
  const { group, parts } = buildModel(ENEMY_MODELS[key]);
  if (key === 'boss') group.rotation.y = Math.PI;            // 人形面朝前进方向
  group.position.set(atX ?? CFG.SPAWN_X, 0, row);
  group.scale.setScalar(key === 'boss' ? 1.3 : 1.22);
  enableShadow(group, true);
  scene.add(group);
  const e = {
    key, def, row, x: group.position.x, hp: def.hp, maxHp: def.hp,
    speed: def.speed, group, parts, state: 'walk',
    slowT: 0, frozenT: 0, jumpUsed: false, jt: null,
    enter: null, biteAcc: 0, flash: 0, bob: Math.random() * 6,
    meetT: 0,
  };
  G.enemies.push(e);
  return e;
}
function killEnemy(e, silent) {
  const i = G.enemies.indexOf(e); if (i < 0) return;
  G.enemies.splice(i, 1);
  G.kills++;
  if (e.key === 'boss') { G.bossAlive = false; }
  if (!silent) {
    const paper = { normal: PAL.paper, rush: PAL.redDk, jump: PAL.yellow, spawn: PAL.navy, boss: PAL.navyDk }[e.key];
    burst(e.x, 0.35, e.row, paper, 14, 2.8, 0.08, 0.8);
    burst(e.x, 0.3, e.row, PAL.paper, 8, 2.2, 0.07, 0.9);
  }
  disposeGroup(e.group);
}
function damageEnemy(e, dmg) {
  e.hp -= dmg; e.flash = 0.15;
  Sound.play('hit');
  if (e.hp <= 0 && e.state !== 'entering') killEnemy(e);
}

/* ---------------- 工位 & 年假 ---------------- */
function stationOf(row) { return world.stations[row]; }
function arriveAtStation(e) {
  const st = stationOf(e.row);
  if (e.key === 'boss') { gameOver('boss'); return; }
  if (st.leave <= 0) { gameOver('work'); return; }     // 年假已用 → 再来的直接堆爆
  const slot = st.slots;
  e.state = 'entering';
  e.enter = { t: 0, dur: STATION.slotFillTime / 1000, from: { x: e.x, y: 0, s: 1 },
              tray: st.trays[slot], slot };
  st.slots++;
  Sound.play('slotIn');
  if (st.slots >= STATION.SLOTS && st.leave > 0) {
    st.leave = 0; G.leavesLeft--;
    triggerAnnualLeave(st);
  }
}
function triggerAnnualLeave(st) {
  const row = st.row;
  banner(`工位 ${row + 1}：年假批准！${row === 4 ? '' : ''}这一行的工作全部散场`, 'leave');
  Sound.play('leave');
  // 审批单飞出动画
  const { group } = buildModel(PROP_MODELS.leave_form);
  group.position.set(LAYOUT.deskCx + 0.6, 0.8, row);
  group.rotation.set(0.3, -0.8, 0.1);
  scene.add(group);
  G.flyForms = G.flyForms || [];
  G.flyForms.push({ group, t: 0, row });
  // 清空该行敌人（老板不吃这套）
  let cleared = 0;
  for (const e of [...G.enemies]) {
    if (e.row === row && e.state !== 'entering') {
      burst(e.x, 0.4, e.row, PAL.paper, 10, 3.2, 0.08, 0.9, 6);
      killEnemy(e, true); cleared++;
    }
  }
  label3('✉ 年假 + 全场清行', LAYOUT.deskCx + 1.2, 1.2, row, 'lv');
  updateHud();
}

/* ---------------- 波次状态机 ---------------- */
function startWave(i) {
  const w = WAVES[i];
  G.wave.i = i;
  const types = [];
  for (const [k, n] of Object.entries(w.comp)) for (let j = 0; j < n; j++) types.push(k);
  for (let j = types.length - 1; j > 0; j--) { const r2 = Math.floor(Math.random() * (j + 1));[types[j], types[r2]] = [types[r2], types[j]]; }
  if (i < 2) types.sort((a, b) => (a === 'normal' ? 0 : 1) - (b === 'normal' ? 0 : 1));
  G.wave.types = types;
  G.wave.total = types.length;
  G.wave.spawned = 0;
  G.wave.bossRatio = w.boss ?? -1;
  G.wave.bossOut = false;
  G.wave.gap = w.gap;
  G.wave.big = !!w.big;
  G.wave.clearedEarly = false;
  G.wave.lastRow = -1; G.wave.rowRepeat = 0;
  if (w.big) {
    G.wave.stage = 'warn'; G.wave.stageEnd = G.time + 2.2;
    banner('⚠ 一大波工作来袭！！', 'big');
    Sound.play('warn');
  } else {
    G.wave.stage = 'spawning'; G.wave.nextAt = G.time + 0.5;
  }
  updateHud();
}
function pickRow() {
  let r2 = Math.floor(Math.random() * CFG.GRID_ROWS);
  if (r2 === G.wave.lastRow) { if (G.wave.rowRepeat >= 2) r2 = (r2 + 1 + Math.floor(Math.random() * 4)) % CFG.GRID_ROWS; else G.wave.rowRepeat++; }
  else G.wave.rowRepeat = 0;
  G.wave.lastRow = r2;
  return r2;
}
function tryBoss() {
  const w = G.wave;
  const due = G.bossPending ||
    (w.bossRatio >= 0 && !w.bossOut && w.spawned >= Math.ceil(w.types.length * w.bossRatio));
  if (due && !G.bossAlive) {
    spawnEnemy('boss', pickRow());
    w.bossOut = true; G.bossPending = false;
    banner('👔 老板亲自下场了！！', 'boss');
    Sound.play('bossWarn');
  }
}
function waveSpawnOne() {
  const w = G.wave;
  tryBoss();
  if (w.spawned < w.types.length) {
    spawnEnemy(w.types[w.spawned], pickRow());
    w.spawned++; G.spawnedAll++;
    updateHud();
  }
}
function updateWaves(dt) {
  const w = G.wave;
  if (w.i >= WAVES.length - 1 && w.stage === 'done') return;
  if (w.stage === 'idle') {
    if (G.time >= w.nextWaveAt) startWave(0);
    return;
  }
  if (w.stage === 'warn') {
    if (G.time >= w.stageEnd) { w.stage = 'spawning'; w.nextAt = G.time + 0.2; }
    return;
  }
  if (w.stage === 'spawning') {
    if (G.time >= w.nextAt) {
      waveSpawnOne();
      w.nextAt = G.time + w.gap;
      if (w.spawned >= w.types.length) {
        w.stage = 'tail';
        const ni = w.i + 1;
        w.tailLead = ni < WAVES.length ? WAVES[ni].lead : 0;
        w.nextWaveAt = G.time + w.tailLead;
        if (w.bossRatio >= 0 && !w.bossOut) G.bossPending = true;   // 老板顺延，绝不双老板
      }
    }
    return;
  }
  if (w.stage === 'tail') {
    const ni = w.i + 1;
    if (ni >= WAVES.length) {
      if (G.enemies.length === 0 && !G.bossPending) w.stage = 'done';
      return;
    }
    if (G.enemies.length === 0 && !w.clearedEarly && G.time < w.nextWaveAt - 3) {
      w.clearedEarly = true;
      w.nextWaveAt = Math.max(G.time + 2.5, w.nextWaveAt - w.tailLead * 0.5);
    }
    if (G.time >= w.nextWaveAt) startWave(ni);
  }
}

/* ---------------- 天降咖啡因 ---------------- */
function spawnDrop() {
  const col = Math.floor(Math.random() * CFG.GRID_COLS);
  const row = Math.floor(Math.random() * CFG.GRID_ROWS);
  const { group, parts } = buildModel(PROP_MODELS.coffee_drop);
  group.position.set(col + (Math.random() - 0.5) * 0.3, 6.5, row + (Math.random() - 0.5) * 0.3);
  enableShadow(group, true);
  scene.add(group);
  G.drops.push({ group, y: 6.5, vy: 0, state: 'fall', t: 0 });
}
function updateDrops(dt) {
  G.dropTimer += dt;
  if (G.dropTimer >= CFG.DROP_INTERVAL) { G.dropTimer = 0; spawnDrop(); }
  for (const d of [...G.drops]) {
    if (d.state === 'fall') {
      d.vy -= 14 * dt; d.y += d.vy * dt;
      d.group.position.y = d.y;
      if (d.y <= 0.16) { d.y = 0.16; d.state = 'rest'; d.t = 0; d.group.position.y = d.y; Sound.play('make'); burst(d.group.position.x, 0.2, d.group.position.z, PAL.metal, 5, 1.2, 0.05, 0.4, 4); }
    } else {
      d.t += dt;
      d.group.rotation.y += dt * 2;
      d.group.position.y = d.y + Math.sin(d.t * 5) * 0.03;
      if (d.t > 1.0) {   // 自动收集
        G.caffeine += CFG.DROP_AMOUNT;
        label3('+' + CFG.DROP_AMOUNT + ' ☕', d.group.position.x, 0.6, d.group.position.z, 'caf');
        Sound.play('collect');
        burst(d.group.position.x, 0.4, d.group.position.z, PAL.coral, 8, 1.8, 0.06, 0.5, 5);
        disposeGroup(d.group);
        G.drops.splice(G.drops.indexOf(d), 1);
        updateHud();
      }
    }
  }
}

/* ---------------- 子弹 ---------------- */
function fireBullet(u, kind) {
  const cfg = kind === 'package' ? u.def : u.def;
  const proto = kind === 'package' ? PROP_MODELS.bullet_package : PROP_MODELS.bullet_splash;
  const { group } = buildModel(proto);
  group.position.set(u.x + 0.45, kind === 'package' ? 0.5 : 0.55, u.z);
  scene.add(group);
  G.bullets.push({ group, x: u.x + 0.45, y: group.position.y, row: u.row,
    speed: cfg.bulletSpeed, dmg: cfg.dmg, kind, slow: kind === 'splash' });
  u.anim.recoil = 1;
  Sound.play(kind === 'package' ? 'shoot' : 'splash');
}
function updateBullets(dt) {
  for (const b of [...G.bullets]) {
    b.x += b.speed * dt;
    b.group.position.x = b.x;
    b.group.rotation.x += dt * 9;
    b.y = b.y0 ?? (b.y0 = b.y);
    b.group.position.y = b.y0 + Math.sin(b.x * 3.2) * (b.kind === 'package' ? 0.05 : 0.03);
    let hit = null;
    for (const e of G.enemies) {
      if (e.row !== b.row || e.state === 'entering') continue;
      if (e.x - b.x < 0.22 && e.x - b.x > -0.35) { hit = e; break; }
    }
    if (hit) {
      if (b.slow) { hit.slowT = UNITS.splash.slowTime / 1000; burst(b.x, 0.4, b.row, PAL.water, 8, 2.4, 0.06, 0.45, 8); }
      else burst(b.x, 0.42, b.row, PAL.paper, 6, 2, 0.05, 0.4, 8);
      damageEnemy(hit, b.dmg);
      disposeGroup(b.group);
      G.bullets.splice(G.bullets.indexOf(b), 1);
    } else if (b.x > CFG.SPAWN_X + 1) {
      disposeGroup(b.group); G.bullets.splice(G.bullets.indexOf(b), 1);
    }
  }
}

/* ---------------- 我方行为 ---------------- */
function rowTarget(u, minDx = 0.25) {
  let best = null;
  for (const e of G.enemies) {
    if (e.row !== u.row || e.state === 'entering') continue;
    const dx = e.x - u.x;
    if (dx > minDx && dx < 11 && (!best || e.x < best.x)) best = e;
  }
  return best;
}
function updateUnits(dt) {
  for (const u of [...G.units]) {
    u.flash = Math.max(0, u.flash - dt);
    u.anim.recoil = Math.max(0, u.anim.recoil - dt * 5);
    u.anim.fire = Math.max(0, u.anim.fire - dt * 3);
    // 受击闪色
    const fc = u.flash > 0 ? 0xffb0a0 : 0xffffff;
    u.group.traverse(o => { if (o.isMesh && o.material && !o.userData.noFlash) o.material.color.setHex(fc); });
    // 待机呼吸
    u.group.position.y = Math.sin(G.time * 2 + u.col) * 0.012;

    switch (u.key) {
      case 'coffee':
        u.timer += dt;
        if (u.timer >= u.def.makeInterval / 1000) {
          u.timer = 0;
          G.caffeine += u.def.makeAmount;
          label3('+' + u.def.makeAmount + ' ☕', u.x, 0.9, u.z, 'caf');
          burst(u.x + 0.15, 0.7, u.z, PAL.water, 4, 0.6, 0.04, 0.8, 0.6); // 热气
          Sound.play('make'); updateHud();
        }
        break;
      case 'cannon':
        u.timer += dt;
        if (u.timer >= u.def.atkInterval / 1000) {
          const t2 = rowTarget(u);
          if (t2) { u.timer = 0; fireBullet(u, 'package'); }
        }
        if (u.parts.barrel) u.parts.barrel.position.x = 0.1 - u.anim.recoil * 0.16;
        if (u.parts.sign) u.parts.sign.rotation.z = Math.sin(G.time * 3 + u.col) * 0.08;
        break;
      case 'splash':
        u.timer += dt;
        if (u.timer >= u.def.atkInterval / 1000) {
          const t2 = rowTarget(u);
          if (t2) { u.timer = 0; fireBullet(u, 'splash'); }
        }
        if (u.parts.fish) u.parts.fish.rotation.y = Math.sin(G.time * 3.4 + u.col) * 0.8;
        if (u.parts.water) u.parts.water.position.y = 0.36 + Math.sin(G.time * 2.2) * 0.008;
        break;
      case 'chat': {
        u.timer += dt;
        u.parts.bubble.position.y = 0.78 + Math.sin(G.time * 2.6 + u.col) * 0.04;
        if (u.timer >= u.def.atkInterval / 1000) {
          // 找射程内最近敌人（任意行），然后连锁
          let first = null, fd = 1e9;
          for (const e of G.enemies) {
            if (e.state === 'entering') continue;
            const d2 = Math.hypot(e.x - u.x, e.row - u.z);
            if (d2 < fd) { fd = d2; first = e; }
          }
          if (first && fd <= u.def.reach) {
            u.timer = 0; u.anim.fire = 1;
            const hitSet = new Set();
            let cur = first;
            for (let n = 0; n < u.def.chains && cur; n++) {
              hitSet.add(cur);
              damageEnemy(cur, u.def.dmg);
              label3('@', cur.x, 0.75, cur.row, 'at');
              Sound.play(n === 0 ? 'notify' : 'chain');
              let nx = null, nd = 1e9;
              for (const e of G.enemies) {
                if (e.state === 'entering' || hitSet.has(e)) continue;
                const d2 = Math.hypot(e.x - cur.x, e.row - cur.row);
                if (d2 < u.def.chainRange && d2 < nd) { nd = d2; nx = e; }
              }
              cur = nx;
            }
          }
        }
        break;
      }
      case 'ac': {
        u.timer += dt;
        if (u.parts.louver) u.parts.louver.rotation.x = Math.sin(G.time * 4 + u.col) * 0.25;
        if (u.timer >= u.def.atkInterval / 1000) {
          const targets = G.enemies.filter(e => e.state !== 'entering'
            && Math.abs(e.x - u.x) <= u.def.rangeX && Math.abs(e.row - u.z) <= u.def.rangeZ);
          if (targets.length) {
            u.timer = 0; u.anim.fire = 1;
            for (const e of targets) {
              e.frozenT = Math.max(e.frozenT, u.def.freezeTime / 1000);
              burst(e.x, 0.5, e.row, PAL.frost, 6, 1.6, 0.06, 0.6, 3);
            }
            burst(u.x + 0.2, 0.4, u.z, PAL.frost, 10, 2.4, 0.06, 0.5, 2);
            Sound.play('freeze');
          }
        }
        break;
      }
      case 'wall':
        break;
      case 'mine':
        u.armT += dt * 1000;
        if (!u.armed && u.armT >= u.def.armTime) {
          u.armed = true; Sound.play('arm');
          label3('已就位 ✓', u.x, 0.95, u.z, 'ok');
        }
        if (u.armBar) {
          const k = u.armed ? 1 : Math.min(u.armT / u.def.armTime, 1);
          u.armBar.fg.scale.x = Math.max(k, 0.001);
          u.armBar.fg.position.x = -(1 - k) * 0.25;
          u.armBar.fg.material.color.setHex(u.armed ? 0x6fd06f : 0xffd23f);
          u.armBar.group.visible = true;
        }
        if (u.parts.desk) {
          // 武装完成 => 屏幕狂闪（把戏就绪）
          u.parts.desk.material.color.setHex(u.armed && Math.sin(G.time * 10) > 0 ? 0xc8ffe8 : 0xffffff);
        }
        if (u.armed) {
          for (const e of G.enemies) {
            if (e.row !== u.row || e.state === 'entering' || e.state === 'bite') continue;
            if (Math.abs(e.x - u.x) < 0.5) {
              Sound.play('explode');
              burst(u.x, 0.4, u.z, PAL.paper, 22, 3.5, 0.09, 0.9);
              burst(u.x, 0.3, u.z, PAL.coral, 12, 4, 0.08, 0.8);
              label3('把戏被戳穿！同归于尽', u.x, 1.1, u.z, 'boom');
              killEnemy(e); removeUnit(u);
              break;
            }
          }
        }
        break;
      case 'bomb':
        u.fuse += dt * 1000;
        if (u.parts.letter) u.parts.letter.position.y = 0.28 + Math.min(u.fuse / u.def.fuse, 1) * 0.16 + Math.sin(G.time * 14) * 0.01;
        if (u.fuse >= u.def.fuse) {
          Sound.play('bigClear');
          if (Math.random() < u.def.risk) {
            label3('老板：批了。', u.x, 1.2, u.z, 'boom');
            removeUnit(u);
            gameOver('resign');
            return;
          }
          burst(u.x, 0.5, u.z, PAL.paper, 40, 4.5, 0.1, 1.2);
          label3('"我辞职！" 全场工作作鸟兽散！', u.x, 1.3, u.z, 'boom');
          for (const e of [...G.enemies]) {
            if (e.state !== 'entering') {
              burst(e.x, 0.4, e.row, PAL.paper, 8, 3, 0.07, 0.8);
              killEnemy(e, true);
            }
          }
          removeUnit(u);
        }
        break;
    }
  }
}
/* ---------------- 敌人行为 ---------------- */
function freeColsInRow(row) {
  const arr = [];
  for (let c = 0; c < CFG.GRID_COLS; c++) if (!G.occ[row][c]) arr.push(c);
  return arr;
}
function updateEnemies(dt) {
  for (const e of [...G.enemies]) {
    e.flash = Math.max(0, e.flash - dt);
    if (e.frozenT > 0) e.frozenT -= dt;
    if (e.slowT > 0) e.slowT -= dt;
    const mul = e.frozenT > 0 ? 0 : (e.slowT > 0 ? UNITS.splash.slowPct : 1);

    // 视觉：受击红闪 > 冰冻青 > 减速淡蓝 > 原色
    let tint = 0xffffff;
    if (e.flash > 0) tint = 0xffc0b0;
    else if (e.frozenT > 0) tint = 0xa8dcf2;
    else if (e.slowT > 0) tint = 0xd6f2fa;
    e.group.traverse(o => { if (o.isMesh) o.material.color.setHex(tint); });
    if (e.key === 'rush' && e.parts.flame) {
      const f = 1 + Math.sin(G.time * 14 + e.bob) * 0.13;
      e.parts.flame.scale.set(f, 1 / f * (1 + Math.sin(G.time * 9) * 0.2), f);
    }

    /* --- 入槽动画 --- */
    if (e.state === 'entering') {
      const en = e.enter;
      en.t += dt / en.dur;
      const p = Math.min(en.t, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const tw = en.tray.group.position;
      e.group.position.x = e.x + (tw.x - e.x) * ease;
      e.group.position.z = e.row + (tw.z - e.row) * ease;
      e.group.position.y = 0.1 + Math.sin(p * Math.PI) * 0.34 + (tw.y + 0.06 - 0.1) * ease;
      const s = Math.max(1 - 0.84 * ease, 0.16);
      e.group.scale.setScalar(s * (e.key === 'boss' ? 1.3 : 1.22));
      e.group.rotation.y += dt * 9;
      if (p >= 1) {
        en.tray.fill.visible = true;
        en.tray.pop = 0;                       // 纸堆弹出动画
        killEnemy(e, true);
      }
      continue;
    }
    /* --- 跳跃动画（临时会议） --- */
    if (e.state === 'jumping') {
      e.jt += dt / 0.62;
      const p = Math.min(e.jt, 1);
      e.x = e.jx0 + (e.jx1 - e.jx0) * p;
      e.group.position.x = e.x;
      e.group.position.y = Math.sin(p * Math.PI) * 1.05;
      e.group.rotation.z = -p * Math.PI * 2;
      if (p >= 1) { e.state = 'walk'; e.group.position.y = 0; e.group.rotation.z = 0; }
      continue;
    }

    /* --- 啃咬 --- */
    if (e.state === 'bite') {
      const u = e.biteU;
      if (!u || G.units.indexOf(u) < 0) { e.state = 'walk'; }
      else {
        e.biteAcc += dt;
        e.group.rotation.z = Math.sin(e.biteAcc * 14) * 0.09;
        if (e.biteAcc >= 0.5) {
          e.biteAcc = 0;
          damageUnit(u, e.def.dps * 0.5);
          Sound.play('bite');
          burst((e.x + u.x) / 2, 0.45, e.row, 0xcccccc, 3, 1.2, 0.05, 0.35, 6);
        }
        continue;
      }
    }

    /* --- 行走 --- */
    e.x -= e.speed * mul * dt;
    e.group.position.x = e.x;
    e.group.position.y = Math.abs(Math.sin((G.time + e.bob) * 5.2 * mul)) * 0.05;
    e.group.rotation.z = Math.sin((G.time + e.bob) * 5.2 * mul) * 0.05;

    // 例会持续拉新需求
    if (e.key === 'spawn' && mul > 0) {
      e.meetT += dt;
      if (e.meetT >= ENEMIES.spawn.meets / 1000) {
        e.meetT = 0;
        const free = freeColsInRow(e.row).filter(c => Math.abs(c - e.x) > 0.6);
        if (free.length) {
          const c = free[Math.floor(Math.random() * free.length)];
          const nn = spawnEnemy('normal', e.row, c);
          if (nn) {
            nn.group.scale.setScalar(0.06); nn.popT = 0;
            label3('例会开出了新需求', c, 1.0, e.row, 'mt');
            Sound.play('notify');
          }
        }
      }
    }
    if (e.popT !== undefined && e.popT < 1) {   // 例会产怪的弹出动画
      e.popT = Math.min(e.popT + dt * 3, 1);
      e.group.scale.setScalar((0.06 + 0.94 * (1 - Math.pow(1 - e.popT, 3))) * 1.22);
    }

    // 阻挡判定
    let blocker = null;
    for (const u of G.units) {
      if (u.row !== e.row) continue;
      const d = e.x - u.x;
      if (d > -0.05 && d <= 0.55 && (!blocker || u.x > blocker.x)) blocker = u;
    }
    if (blocker && blocker.key !== 'mine') {
      if (e.key === 'jump' && !e.jumpUsed) {
        e.jumpUsed = true; e.state = 'jumping'; e.jt = 0;
        e.jx0 = e.x; e.jx1 = Math.max(blocker.x - 0.72, CFG.DESK_X + 0.05);
        Sound.play('make');
      } else if (!(e.key === 'boss' && false)) {
        e.state = 'bite'; e.biteU = blocker; e.biteAcc = 0.42;
      }
    } else if (blocker && blocker.key === 'mine') {
      // 假装在忙由 mine 逻辑处理碰撞（可被啃→武装前能被吃）
      if (!blocker.armed) {
        e.state = 'bite'; e.biteU = blocker; e.biteAcc = 0.42;
      }
    }
    // 抵达工位
    if (e.x <= CFG.DESK_X) { arriveAtStation(e); continue; }
  }
}

/* ---------------- 年假审批单飞行 ---------------- */
function updateFly(dt) {
  G.flyForms = G.flyForms || [];
  for (const f of [...G.flyForms]) {
    f.t += dt;
    f.group.position.y += dt * 1.5;
    f.group.position.x += dt * 1.1;
    f.group.rotation.y += dt * 4;
    f.group.rotation.z = Math.sin(f.t * 6) * 0.25;
    if (f.t > 1.8) {
      burst(f.group.position.x, f.group.position.y, f.group.position.z, PAL.paper, 8, 1.5, 0.05, 0.6);
      disposeGroup(f.group);
      G.flyForms.splice(G.flyForms.indexOf(f), 1);
    }
  }
  // 槽位纸堆 pop 动画
  for (const st of world.stations) for (const tr of st.trays) {
    if (tr.pop !== undefined && tr.pop < 1) {
      tr.pop = Math.min(tr.pop + dt * 4, 1);
      const s = 1 + Math.sin(tr.pop * Math.PI) * 0.5;
      tr.fill.scale.set(s, s, s);
    }
  }
}

/* ---------------- 胜负 ---------------- */
function checkWin() {
  if (G.phase !== 'playing') return;
  if (G.wave.stage === 'done' && G.enemies.length === 0) gameWin();
}
function gameWin() {
  G.phase = 'over';
  Sound.stopBGMFor?.();
  Sound.setBGM(false);
  Sound.play('win');
  showEnd(true);
}
function gameOver(reason) {
  if (G.phase !== 'playing') return;
  G.phase = 'over';
  Sound.setBGM(false);
  Sound.play('lose');
  G.over = reason;
  showEnd(false, reason);
}

/* ---------------- 主循环 ---------------- */
let _last = performance.now(), _fpsAcc = 0, _fpsN = 0;
function step(dt) {
  G.time += dt;
  updateDrops(dt);
  updateUnits(dt);
  updateBullets(dt);
  updateEnemies(dt);
  updateFly(dt);
  updateWaves(dt);
  updateCdUI();
  checkWin();
}
function frame(now) {
  requestAnimationFrame(frame);
  const dtr = Math.min((now - _last) / 1000, 0.05);
  _last = now;
  _fpsAcc += dtr; _fpsN++;
  if (_fpsAcc > 0.5) {
    document.getElementById('fps').textContent = Math.round(_fpsN / _fpsAcc) + ' fps';
    _fpsAcc = 0; _fpsN = 0;
  }
  if (G.phase === 'playing' && !G.paused) {
    step(dtr * G.speed);
  }
  updateParts(dtr);
  updateLabels(dtr);
  // 工位组员待机：年假用完的工位，组员"黑化"低头
  for (const st of world.stations) {
    if (st.leave <= 0 && st.ws) st.ws.children[0].rotation.x = 0.25; // 微微鞠躬（心死）
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);
/* ============================================================
 * 输入 & UI
 * ============================================================ */
const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _pv = new THREE.Vector3();
function screenToTile(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const nx = ((clientX - r.left) / r.width) * 2 - 1;
  const ny = -(((clientY - r.top) / r.height) * 2 - 1);
  raycaster.setFromCamera({ x: nx, y: ny }, camera);
  const hit = raycaster.ray.intersectPlane(groundPlane, _pv);
  if (!hit) return null;
  const col = Math.round(hit.x), row = Math.round(hit.z);
  const inGrid = col >= 0 && col < CFG.GRID_COLS && row >= 0 && row < CFG.GRID_ROWS;
  return { col: inGrid ? col : col, row: inGrid ? row : row, x: hit.x, z: hit.z, inGrid };
}

/* 格子高亮框 */
const hlBoxes = [
  [0, 0, 0.48, 1.0, 0.05, 0.06], [0, 0, -0.48, 1.0, 0.05, 0.06],
  [0.48, 0, 0, 0.06, 0.05, 0.9], [-0.48, 0, 0, 0.06, 0.05, 0.9],
];
const hlMesh = new THREE.Mesh(
  (() => { const v = new Vox(); for (const b of hlBoxes) v.box(...b, 0x6fd06f); return v.geom(); })(),
  new THREE.MeshBasicMaterial({ color: 0x7de2a0, transparent: true, opacity: 0.95 }));
hlMesh.visible = false; hlMesh.position.y = 0.07;
scene.add(hlMesh);

/* 幽灵预览缓存 */
const ghosts = {};
function getGhost(key) {
  if (!ghosts[key]) {
    const { group } = buildUnitGroup(key);
    ghostify(group);
    group.visible = false;
    enableShadow(group, false);
    scene.add(group);
    ghosts[key] = group;
  }
  return ghosts[key];
}

/* 工具状态（拖拽 / 点选通用） */
const D = { mode: null, key: null, dragging: false, armed: false, sx: 0, sy: 0, moved: false };
function beginTool(mode, key, ev) {
  const def = mode === 'unit' ? UNITS[key] : null;
  if (mode === 'unit' && (G.caffeine < def.cost || G.cardCd[key] > G.time * 1000)) {
    Sound.play('error'); shakeCard(key); return false;
  }
  D.mode = mode; D.key = key; D.dragging = true; D.armed = false;
  D.sx = ev.clientX; D.sy = ev.clientY; D.moved = false;
  hideTip();
  document.body.classList.add('carrying');
  return true;
}
function moveTool(ev) {
  if (!D.dragging && !D.armed) { hlMesh.visible = false; return; }
  const t = screenToTile(ev.clientX, ev.clientY);
  const g = D.mode === 'unit' ? getGhost(D.key) : null;
  if (!t || !t.inGrid) {
    hlMesh.visible = false; if (g) g.visible = false; return;
  }
  const occupied = !!G.occ[t.row][t.col];
  if (D.mode === 'shovel') {
    const hasUnit = occupied;
    hlMesh.position.set(t.col, 0.07, t.row);
    hlMesh.visible = true;
    hlMesh.material.color.setHex(hasUnit ? 0xffb35a : 0x9aa7b5);
  } else {
    hlMesh.position.set(t.col, 0.07, t.row);
    hlMesh.visible = true;
    hlMesh.material.color.setHex(occupied ? 0xff5a5a : 0x7de2a0);
    g.visible = true;
    g.position.set(t.col, occupied ? 0.12 : 0, t.row);
  }
}
function endTool(ev, isClickOnCanvas) {
  if (!D.mode) return;
  const t = ev ? screenToTile(ev.clientX, ev.clientY) : null;
  let acted = false;
  if (t && t.inGrid) {
    acted = tryUseTool(t);
  }
  if (D.dragging && !D.moved && !acted) {           // 纯点击卡片 → 进入点选模式
    D.armed = true; D.dragging = false; return;
  }
  if (D.dragging && !acted && D.moved && ev) {      // 拖到无效处
    if (t && t.inGrid) Sound.play('error');
  }
  D.dragging = false;
  if (!D.armed) clearTool();
  else if (D.mode === 'unit') {                     // 保持点选：让幽灵跟随
  }
}
function tryUseTool(t) {
  if (D.mode === 'shovel') {
    const u = G.occ[t.row][t.col];
    if (u) {
      Sound.play('shovel');
      burst(u.x, 0.4, u.z, 0xcfd6dd, 14, 2.4, 0.07, 0.6);
      label3('已铲除', u.x, 0.9, u.z, 'dig');
      removeUnit(u);
      clearTool();
      return true;
    }
    return false;
  }
  const def = UNITS[D.key];
  if (G.occ[t.row][t.col]) return false;
  if (G.caffeine < def.cost) return false;
  G.caffeine -= def.cost;
  G.cardCd[D.key] = (G.time + def.cd / 1000) * 1000;
  plantUnit(D.key, t.row, t.col);
  clearTool();
  updateHud();
  return true;
}
function clearTool() {
  D.mode = null; D.key = null; D.dragging = false; D.armed = false;
  hlMesh.visible = false;
  for (const k in ghosts) ghosts[k].visible = false;
  document.body.classList.remove('carrying');
}

/* 指针事件绑定 */
canvas.addEventListener('pointermove', (ev) => { if (D.dragging || D.armed) { const r = canvas.getBoundingClientRect(); if (Math.hypot(ev.clientX - D.sx, ev.clientY - D.sy) > 5) D.moved = true; moveTool(ev); } });
window.addEventListener('pointermove', (ev) => {
  if (D.dragging) {
    if (Math.hypot(ev.clientX - D.sx, ev.clientY - D.sy) > 5) D.moved = true;
    const overCanvas = canvas.getBoundingClientRect();
    moveTool(ev);
  }
});
window.addEventListener('pointerup', (ev) => {
  if (!D.dragging) return;
  const r = canvas.getBoundingClientRect();
  const overCanvas = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  if (D.moved && overCanvas) { endTool(ev, true); }
  else endTool(D.moved ? ev : ev, false);
});
canvas.addEventListener('pointerdown', (ev) => {
  if (D.armed) {                                     // 点选模式落子
    const t = screenToTile(ev.clientX, ev.clientY);
    if (t && t.inGrid) {
      if (!tryUseTool(t)) { Sound.play('error'); }
    }
  }
});
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') clearTool();
  if (ev.key === ' ') { ev.preventDefault(); if (G.phase === 'playing') togglePause(); }
});

/* ---------------- 卡片栏 / 工具 / HUD ---------------- */
const elCards = document.getElementById('cards');
const cardEls = {};
function buildCards() {
  for (const key of UNIT_ORDER) {
    const def = UNITS[key];
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<canvas width="84" height="72"></canvas><div class="cname">${def.name}</div>
      <div class="ccost">☕${def.cost}</div><div class="cmask"></div><div class="cnum"></div>`;
    elCards.appendChild(el);
    const cv = el.querySelector('canvas');
    Icons.unitIcon(key, cv);
    el.querySelector('.cnum').textContent = '';
    // 交互
    el.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      if (G.phase !== 'playing') return;
      beginTool('unit', key, ev);
    });
    el.addEventListener('pointerenter', (ev) => showTip(key, def.name, `☕ ${def.cost} · 冷却 ${def.cd / 1000}s`, def.desc, el, 500));
    el.addEventListener('pointerleave', hideTip);
    cardEls[key] = { el, mask: el.querySelector('.cmask'), num: el.querySelector('.cnum') };
  }
}
function shakeCard(key) {
  const c = cardEls[key]; if (!c) return;
  c.el.classList.remove('shake'); void c.el.offsetWidth; c.el.classList.add('shake');
}
function updateCdUI() {
  for (const key of UNIT_ORDER) {
    const def = UNITS[key], c = cardEls[key];
    const cdLeft = Math.max(0, G.cardCd[key] - G.time * 1000) / 1000;
    const frac = Math.min(cdLeft / (def.cd / 1000), 1);
    c.mask.style.height = (frac * 100) + '%';
    c.el.classList.toggle('cooling', cdLeft > 0.05);
    c.el.classList.toggle('poor', G.caffeine < def.cost);
    c.num.textContent = cdLeft > 0.05 ? cdLeft.toFixed(0) : '';
    if (D.armed && D.mode === 'unit' && D.key === key && (cdLeft > 0)) clearTool();
  }
}

/* 悬停介绍 */
const tipEl = document.getElementById('tip');
let tipTimer = null;
function showTip(key, title, cost, desc, anchor, delay) {
  clearTimeout(tipTimer);
  tipTimer = setTimeout(() => {
    tipEl.innerHTML = `<b>${title}</b> <span class="tcost">${cost}</span><p>${desc}</p>`;
    const r = anchor.getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect();
    tipEl.style.left = (r.left - s.left) + 'px';
    tipEl.style.top = (r.bottom - s.top + 6) + 'px';
    tipEl.style.display = 'block';
  }, delay);
}
function hideTip() { clearTimeout(tipTimer); tipEl.style.display = 'none'; }

/* 横幅 */
const bannerQ = [];
let bannerBusy = false;
function banner(text, cls) {
  bannerQ.push([text, cls]);
  pumpBanner();
}
function pumpBanner() {
  if (bannerBusy || !bannerQ.length) return;
  bannerBusy = true;
  const [text, cls] = bannerQ.shift();
  const el = document.getElementById('banner');
  el.textContent = text;
  el.className = 'show ' + (cls || '');
  setTimeout(() => { el.className = ''; bannerBusy = false; setTimeout(pumpBanner, 250); }, 2300);
}

/* HUD */
function updateHud() {
  document.getElementById('caffeine').textContent = Math.floor(G.caffeine);
  const prog = Math.min(G.spawnedAll / G.totalSpawns, 1);
  document.getElementById('waveFill').style.width = (prog * 100) + '%';
  document.getElementById('waveText').textContent =
    `第 ${Math.max(G.wave.i + 1, 1)}/12 波`;
  document.getElementById('leaves').textContent = G.leavesLeft;
}

/* ---------------- 图鉴 ---------------- */
function buildCodex() {
  const box = document.getElementById('codexBody');
  if (box.dataset.built) return;
  const mk = (title, sub, cv) => {
    const d = document.createElement('div'); d.className = 'cx';
    d.appendChild(cv);
    d.insertAdjacentHTML('beforeend', `<h4>${title}</h4><p class="cxsub">${sub.txt}</p><p class="cxdesc">${sub.desc}</p>`);
    return d;
  };
  for (const key of UNIT_ORDER) {
    const def = UNITS[key];
    const cv = document.createElement('canvas'); cv.width = 110; cv.height = 92;
    box.appendChild(mk(def.name + (def.desc.startsWith('★') ? ' ★自创' : ''),
      { txt: `☕ ${def.cost} · 冷却 ${def.cd / 1000}s · 血量 ${def.hp}`, desc: def.desc }, cv));
    Icons.unitIcon(key, cv);
  }
  for (const key of ENEMY_ORDER) {
    const def = ENEMIES[key];
    const cv = document.createElement('canvas'); cv.width = 110; cv.height = 92;
    box.appendChild(mk('【工作】' + def.name,
      { txt: `血量 ${def.hp} · 移速 ${def.speed} 格/秒`, desc: def.desc }, cv));
    Icons.enemyIcon(key, cv);
  }
  box.dataset.built = 1;
}
function openCodex() {
  buildCodex();
  document.getElementById('codexModal').style.display = 'flex';
  if (G.phase === 'playing') { G.paused = true; document.getElementById('btnPause').textContent = '▶'; }
}
function closeCodex() {
  document.getElementById('codexModal').style.display = 'none';
  if (G.phase === 'playing') { G.paused = false; document.getElementById('btnPause').textContent = '⏸'; }
}

/* ---------------- 界面流程 ---------------- */
function togglePause() {
  G.paused = !G.paused;
  document.getElementById('btnPause').textContent = G.paused ? '▶' : '⏸';
  document.getElementById('pauseVeil').style.display = G.paused ? 'flex' : 'none';
  Sound.play('click');
}
function toggleSpeed() {
  G.speed = G.speed === 1 ? 2 : 1;
  document.getElementById('btnSpeed').textContent = '×' + G.speed;
  Sound.play('click');
}
function showEnd(win, reason) {
  const el = document.getElementById('endScreen');
  const minutes = Math.floor(G.time / 60), seconds = Math.floor(G.time % 60);
  const reasons = {
    boss: '老板亲自走到了你的工位前，微笑着说："有空吗？"',
    work: '有个工位的年假用完了，工作还是堆爆了它。',
    resign: '你喊出"我辞职！"——老板秒批："好的，人事就在门口。"',
  };
  const pool = win ? RANK_LINES_WIN : RANK_LINES_LOSE;
  const line = pool[Math.floor(Math.random() * pool.length)];
  el.innerHTML = `
    <div class="endcard ${win ? 'win' : 'lose'}">
      <h1>${win ? '🎉 你守住了整个部门！' : '💀 你被优化了'}</h1>
      ${win ? '' : `<p class="reason">${reasons[reason] || '工作吞噬了一切。'}</p>`}
      <div class="stats">
        <span>消灭工作 <b>${G.kills}</b> 份</span>
        <span>剩余咖啡因 <b>${Math.floor(G.caffeine)}</b></span>
        <span>剩余年假 <b>${G.leavesLeft}</b> / 5</span>
        <span>在岗时长 <b>${minutes}'${String(seconds).padStart(2, '0')}''</b></span>
      </div>
      <p class="rankline">「 ${line} 」</p>
      <button id="btnAgain" class="bigbtn">${win ? '再上一个班' : '重开一局'}</button>
    </div>`;
  el.style.display = 'flex';
  document.getElementById('btnAgain').addEventListener('click', () => { Sound.play('click'); el.style.display = 'none'; resetGame(); });
}
function resetGame() {
  for (const u of [...G.units]) removeUnit(u);
  for (const e of [...G.enemies]) killEnemy(e, true);
  for (const b of [...G.bullets]) disposeGroup(b.group);
  for (const d of [...G.drops]) disposeGroup(d.group);
  for (const f of [...(G.flyForms || [])]) disposeGroup(f.group);
  G.bullets = []; G.drops = []; G.flyForms = [];
  for (const p of parts) { p.on = false; }
  bannerQ.length = 0;
  for (const st of world.stations) {
    st.slots = 0; st.leave = STATION.LEAVES;
    st.ws && (st.ws.children[0].rotation.x = 0);
    for (const tr of st.trays) { tr.fill.visible = false; tr.pop = undefined; delete tr.pop; }
  }
  Object.assign(G, {
    time: 0, caffeine: CFG.CAFFEINE_START, kills: 0, planted: 0,
    dropTimer: 0, bossAlive: false, bossPending: false,
    spawnedAll: 0, leavesLeft: CFG.GRID_ROWS, phase: 'playing', paused: false, over: null,
  });
  for (const k of UNIT_ORDER) G.cardCd[k] = 0;
  G.wave = { i: -1, stage: 'idle', nextWaveAt: WAVES[0].lead, types: [], total: 0, spawned: 0 };
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('pauseVeil').style.display = 'none';
  document.getElementById('btnPause').textContent = '⏸';
  G.speed = 1; document.getElementById('btnSpeed').textContent = '×1';
  clearTool();
  updateHud();
  Sound.setBGM(true);
  banner('老板办公室来活了——守住工位！', 'go');
}

/* 铲子 & 按钮 */
document.getElementById('shovel').addEventListener('pointerdown', (ev) => {
  ev.preventDefault();
  if (G.phase !== 'playing') return;
  if (D.mode === 'shovel' && D.armed) { clearTool(); return; }
  beginTool('shovel', null, ev);
});
document.getElementById('btnPause').addEventListener('click', () => G.phase === 'playing' && togglePause());
document.getElementById('btnSpeed').addEventListener('click', toggleSpeed);
document.getElementById('btnCodex').addEventListener('click', openCodex);
document.getElementById('btnCodex2').addEventListener('click', openCodex);
document.getElementById('btnCodexClose').addEventListener('click', closeCodex);
document.getElementById('btnRestart').addEventListener('click', () => { Sound.play('click'); resetGame(); });
document.getElementById('btnStart').addEventListener('click', () => {
  Sound.unlock();
  Sound.play('click');
  document.getElementById('startScreen').style.display = 'none';
  resetGame();
});
window.addEventListener('contextmenu', (ev) => { if (D.mode) { ev.preventDefault(); clearTool(); } });

/* 自适应缩放（保持 1280×720 逻辑分辨率） */
function fitStage() {
  const stage = document.getElementById('stage');
  const s = Math.min(1, (window.innerWidth - 16) / 1280, (window.innerHeight - 16) / 720);
  stage.style.transform = `scale(${s})`;
}
window.addEventListener('resize', fitStage);

/* ---------------- 启动 ---------------- */
buildCards();
// 波次进度条上的 🚩 大波标记（第6/12波）
{
  const wrap = document.getElementById('waveWrap');
  let acc = 0;
  WAVES.forEach((w, i) => {
    acc += Object.values(w.comp).reduce((a, b) => a + b, 0);
    if (w.big) {
      const f = document.createElement('div');
      f.className = 'wflag hot';
      f.style.left = Math.min(acc / G.totalSpawns * 100, 98) + '%';
      f.textContent = '🚩';
      wrap.appendChild(f);
    }
  });
}
fitStage();
updateHud();
window.__G = { G, plantUnit, spawnEnemy, damageEnemy, arriveAtStation, gameOver, resetGame, startWave, camera, renderer };
