/* game.js — 《植物大战僵尸 · 打工人版》主逻辑
 * 依赖：three.min.js（UMD，全局 THREE）、models.js（VB/UNIT_MODELS/ENEMY_MODELS）、audio.js（SFX）
 */

/* ================= 常量与数值（最终数值总表，同时展示在图鉴里） ================= */
const W = 1280, H = 720;
const CELL = 1.6, ROWS = 5, COLS = 9, TOTAL_WAVES = 12;
const SPAWN_X = 8.4;        // 老板办公室出口
const DESK_EDGE = -7.6;     // 工位桌前沿：敌人越过即"到达工位"
const START_COFFEE = 100;
const DROP_INT = 8, DROP_VAL = 25;          // 天降咖啡因：每 8 秒 +25
const MACHINE_INT = 10, MACHINE_VAL = 25;   // 咖啡机：每 10 秒 +25
const RESIGN_RISK = 0.18;                   // 辞职信引爆后老板批准的概率
const SLOT_Z = [-0.52, -0.17, 0.17, 0.52];  // 每个工位 4 个槽位的 z 偏移
const DEADLINE_BOOST = 1.37;                // DDL 加农炮：最后 25% 出怪时射速加成

const UNITS = {
  coffee:   { name: '咖啡机',   icon: '☕', cost: 50,  cd: 5,  hp: 150,  block: true,
              desc: '每 10 秒自动产出 25 咖啡因。血薄、不攻击，请好好护着它。' },
  cannon:   { name: 'DDL 加农炮', icon: '🧨', cost: 100, cd: 5,  hp: 300,  block: true, dmg: 20, int: 1.5,
              desc: '每 1.5 秒轰出一发「交付物」，伤害 20。死线越近火力越猛：本波最后 25% 出怪时射速 +37%。' },
  wall:     { name: '背锅侠',   icon: '🍳', cost: 50,  cd: 10, hp: 3000, block: true,
              desc: '不攻击，血厚如锅（约为 DDL 加农炮的 10 倍）。花 50 咖啡因请来的挡枪实习同事。' },
  fishbowl: { name: '摸鱼鱼缸', icon: '🐠', cost: 175, cd: 5,  hp: 250,  block: true, dmg: 20, int: 1.5, slowMul: 0.5, slowT: 5,
              desc: '每 1.5 秒泼出水花，伤害 20，命中敌人移速减半 5 秒。纸泡了水，走不动了。' },
  resign:   { name: '辞职信',   icon: '📝', cost: 150, cd: 30, hp: 100,  block: true, fuse: 1,
              desc: '放置 1 秒后引爆，清空全场所有敌人（老板也算）。但每次引爆有 18% 概率老板同意辞职——游戏失败。' },
  fakebusy: { name: '假装在忙', icon: '🧥', cost: 25,  cd: 20, hp: 1,    block: false, arm: 15,
              desc: '放置后 15 秒才进入状态（之前无效、也不挡路）；之后敌人踩中即秒杀该敌人并同归于尽。老板免疫。' },
  shredder: { name: '碎纸机',   icon: '📄', cost: 75,  cd: 8,  hp: 500,  block: true, counter: 15, custom: true,
              desc: '【自创】咬住它的敌人会被反咬，每秒受 15 伤害。文件可以乱放，但绝不能乱碎。' },
  email:    { name: '凌晨三点的抄送', icon: '🌙', cost: 100, cd: 15, hp: 200, block: true, pulse: 6, pdmg: 30, custom: true,
              desc: '【自创】每 6 秒给本行所有敌人（老板除外）抄送一封「请大家周末看一下」，造成 30 伤害。' },
};
const CARD_ORDER = ['coffee', 'cannon', 'wall', 'fishbowl', 'resign', 'fakebusy', 'shredder', 'email'];

const ENEMY_DEF = {
  normal:  { name: '普通需求', hp: 100, spd: 0.9, dps: 8,  desc: '一沓需求文档。基准血量与移速。' },
  rush:    { name: '加急需求', hp: 200, spd: 1.0, dps: 12, desc: '冒火的需求文档。血量约为普通需求的 2 倍。' },
  boss:    { name: '老板',     hp: 400, spd: 0.4, dps: 40, desc: '拿公文包的老板。血量 4 倍、全场最慢。到达工位即游戏结束，年假也挡不住；全场同时最多 1 个。' },
  meeting: { name: '临时会议', hp: 100, spd: 1.0, dps: 8,  desc: '日历邀请。遇到第一个我方单位会跳过它（每个会议只跳一次）。' },
  sync:    { name: '例会',     hp: 200, spd: 0.7, dps: 8,  desc: '行走的会议白板。第 6 波起出现，行进中每 10 秒在本行空格生成 1 个普通需求。' },
};
const UNIT_COLOR = { coffee: 0x9ca3af, cannon: 0xf97316, wall: 0x3b82f6, fishbowl: 0x38bdf8, resign: 0xfef3c7, fakebusy: 0xf97316, shredder: 0x94a3b8, email: 0x818cf8 };
const ENEMY_COLOR = { normal: 0xf8fafc, rush: 0xef4444, boss: 0x374151, meeting: 0x3b82f6, sync: 0x8b5cf6 };

// 波次配置（确定性部分；具体敌人顺序随机）
function waveSpec(w) {
  const big = (w === 6 || w === 12);
  return {
    big,
    total: Math.round((8 + 3 * w) * (big ? 1.4 : 1)),
    interval: Math.max(0.8, 2.3 - 0.11 * (w - 1)) * (big ? 0.85 : 1),
    bossAt: (w === 4 || w === 8 || w === 12) ? 0.6 : -1,
  };
}
function buildWave(w) {
  const sp = waveSpec(w);
  const list = [];
  const pRush = Math.min(0.08 + 0.035 * (w - 1), 0.4);
  const pMeet = w >= 3 ? 0.08 : 0;
  const pSync = w >= 6 ? 0.07 : 0;
  for (let i = 0; i < sp.total; i++) {
    let type;
    if (sp.bossAt > 0 && i === Math.floor(sp.total * sp.bossAt)) type = 'boss';
    else {
      const r = Math.random();
      if (r < pRush) type = 'rush';
      else if (r < pRush + pMeet) type = 'meeting';
      else if (r < pRush + pMeet + pSync) type = 'sync';
      else type = 'normal';
    }
    list.push({ type, row: Math.floor(Math.random() * ROWS) });
  }
  return list;
}

/* ================= 工具函数 ================= */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const colX = c => (c - 4) * CELL;
const rowZ = r => (r - 2) * CELL;
const cellInGrid = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

/* ================= 三维场景 ================= */
const stage = $('#stage');
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4ead6);
scene.fog = new THREE.Fog(0xf4ead6, 26, 48);

const CAM_BASE = new THREE.Vector3(0, 13, 12.5);
const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 200);
camera.position.copy(CAM_BASE);
camera.lookAt(0, 0, -0.6);          // 正对战场、无横向偏转、无侧倾
camera.updateMatrixWorld();

scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a7a60, 0.95));
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(-6, 14, 9);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 12, bottom: -12, near: 1, far: 60 });
sun.shadow.bias = -0.0008;
scene.add(sun);

let baseMesh = null, floorMesh = null, hlMesh = null;
let slotMeshes = [];        // [r][i] = { pad, paper }
let headMeshes = [];        // 工位上的组员头部（用于打字点头动画）
const ghostCache = {};
let shake = 0;

function buildScene() {
  // 地面底座 + 办公区地砖（留缝隙当格子边界）
  const base = new VB();
  base.box(0, -0.4, 0, 30, 0.4, 20, 0xcdb995);
  baseMesh = base.build(); baseMesh.castShadow = false; scene.add(baseMesh);

  const tiles = new VB();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    tiles.box(colX(c), 0, rowZ(r), 1.5, 0.05, 1.5, ((r + c) % 2) ? 0xeadbbf : 0xdccba6);
  }
  floorMesh = tiles.build(); floorMesh.castShadow = false; scene.add(floorMesh);

  // 悬停高亮（绿=可放 / 红=不可放 / 橙=可铲）
  hlMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5),
    new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.45, depthWrite: false }));
  hlMesh.rotation.x = -Math.PI / 2; hlMesh.position.y = 0.07; hlMesh.visible = false;
  scene.add(hlMesh);

  // ---- 左侧：长桌 + 5 个工位 + 每行 4 个槽位 ----
  const desk = new VB();
  desk.box(-9.0, 0.72, 0, 2.8, 0.12, 9.6, 0xb08858);
  for (const x of [-10.25, -7.75]) for (const z of [-4.6, 4.6]) desk.box(x, 0, z, 0.12, 0.72, 0.12, 0x6b4b2b);
  scene.add(desk.build());

  slotMeshes = []; headMeshes = [];
  const shirts = [0x4f46e5, 0x0ea5e9, 0x16a34a, 0xd946ef, 0xea580c];
  const hairs = [0x3f2a1a, 0x111111, 0x7c2d12, 0x1f2937, 0x92400e];
  for (let r = 0; r < ROWS; r++) {
    const z = rowZ(r);
    const st = new VB();
    st.box(-10.0, 0.84, z, 0.12, 0.5, 0.6, 0x222222);                 // 显示器
    st.box(-10.04, 0.9, z, 0.03, 0.34, 0.46, 0x38bdf8);               // 屏幕（朝向组员）
    st.box(-9.1, 0.84, z, 0.4, 0.04, 0.7, 0xe5e7eb);                  // 键盘
    st.box(-11.0, 0.3, z, 0.55, 0.1, 0.55, 0x1f2937);                 // 椅子座
    st.box(-11.3, 0.4, z, 0.1, 0.8, 0.55, 0x1f2937);                  // 椅背
    st.box(-11.0, 0, z, 0.1, 0.3, 0.1, 0x111111);                     // 椅腿
    scene.add(st.build());
    const worker = assemble({
      body: vb => vb.box(-10.95, 0.4, z, 0.42, 0.5, 0.4, shirts[r]),
      head: vb => vb.box(-10.95, 0.9, z, 0.32, 0.32, 0.32, 0xf2c9a0).box(-10.95, 1.19, z, 0.34, 0.07, 0.34, hairs[r]),
    });
    scene.add(worker);
    headMeshes.push(worker.userData.parts.head);

    const row = [];
    for (let i = 0; i < 4; i++) {
      const sx = -8.2, sz = z + SLOT_Z[i];
      const pad = new VB(); pad.box(sx, 0.84, sz, 0.28, 0.04, 0.22, 0x6b7280);
      const paperVB = new VB(); paperVB.box(sx, 0.88, sz, 0.26, 0.12, 0.2, 0xfff7ed).box(sx, 0.98, sz, 0.24, 0.02, 0.18, 0xffffff);
      const padM = pad.build({ shadow: false }), paperM = paperVB.build({ shadow: false });
      paperM.visible = false;
      scene.add(padM); scene.add(paperM);
      row.push({ pad: padM, paper: paperM });
    }
    slotMeshes.push(row);
  }

  // ---- 右侧：老板办公室（玻璃隔间）----
  const off = new VB();
  off.box(10.3, 0, 0, 4.6, 0.04, 9.2, 0xc7d2e8);                       // 地毯
  off.box(11.3, 0, -0.2, 1.4, 0.7, 2.4, 0x7c4a2d);                     // 老板桌
  off.box(11.3, 0.7, -0.3, 0.1, 0.5, 0.6, 0x222222).box(11.3, 0.7, -0.3, 0.02, 0.4, 0.46, 0x38bdf8);
  off.box(12.1, 0, 2.6, 0.2, 0.9, 0.2, 0x065f46).box(12.1, 0.9, 2.6, 0.7, 0.7, 0.7, 0x22c55e); // 绿植
  off.box(12.45, 0, -3.5, 0.2, 0.2, 0.2, 0x000000);
  scene.add(off.build());
  const glass = new VB();
  glass.box(7.85, 0, 0, 0.06, 1.9, 9.2, 0x7dd3fc);
  glass.box(10.2, 0, -4.6, 4.8, 1.9, 0.06, 0x7dd3fc);
  const glassM = glass.build({ transparent: true, opacity: 0.28, depthWrite: false, shadow: false });
  scene.add(glassM);
  const frame = new VB();
  frame.box(12.6, 0, 0, 0.3, 2.2, 9.2, 0x9ca3af).box(7.8, 1.9, 0, 0.12, 0.12, 9.2, 0x9ca3af);
  scene.add(frame.build());
  const boss = ENEMY_MODELS.boss(); boss.position.set(10.6, 0, -1.2); boss.rotation.y = -0.4; scene.add(boss);

  // ---- 背景：墙、白板、窗、饮水机、绿植 ----
  const wall = new VB();
  wall.box(0, 0, -6.2, 34, 4.6, 0.4, 0xefe6d2);
  wall.box(-4.6, 1.6, -5.98, 3.6, 1.8, 0.05, 0xffffff);
  wall.box(5.2, 0, -5.2, 0.6, 0.5, 0.6, 0xe5e7eb).box(5.2, 0.5, -5.2, 0.5, 0.8, 0.5, 0x7dd3fc);
  for (const [px, pz] of [[-12.2, -5.2], [-4.2, -5.4], [2.6, -5.5], [-12.4, 4.2], [7.8, -5.3]]) {
    wall.box(px, 0, pz, 0.5, 0.45, 0.5, 0xb45309)
        .box(px, 0.45, pz, 0.9, 0.5, 0.9, 0x16a34a)
        .box(px + 0.2, 0.9, pz - 0.2, 0.6, 0.5, 0.6, 0x22c55e);
  }
  scene.add(wall.build());
  const winVB = new VB(); winVB.box(0, 2.9, -5.97, 26, 1.1, 0.04, 0xbae6fd);
  scene.add(winVB.build({ shadow: false }));
  const boardFrame = new VB(); boardFrame.box(-4.6, 1.5, -5.99, 3.7, 1.95, 0.03, 0x94a3b8);
  scene.add(boardFrame.build({ shadow: false }));
}

function buildGhostCache(type) {
  if (!ghostCache[type]) {
    const g = UNIT_MODELS[type]({ ghost: true });
    g.visible = false; scene.add(g); ghostCache[type] = g;
  }
  return ghostCache[type];
}

/* ================= 游戏状态 ================= */
let G = null;
let grid = [];
let units = [], enemies = [], projs = [], parts = [], drops = [];
const projGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
const projMat = {
  cannon: new THREE.MeshLambertMaterial({ color: 0xf97316 }),
  fishbowl: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
};
const partGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
const partMats = {};
const pmat = col => partMats[col] || (partMats[col] = new THREE.MeshLambertMaterial({ color: col }));

function newState() {
  return {
    phase: 'menu',           // menu | play | win | lose
    coffee: START_COFFEE, kills: 0, annualClear: 0,
    annualUsed: [false, false, false, false, false],
    slots: [0, 0, 0, 0, 0],
    wave: 0, queue: [], queueTotal: 0, spawnT: 0, interval: 2, gapT: null, waveWait: 3,
    paused: false, speed: 1, dropT: DROP_INT, cd: {}, shovelMode: false,
    pending: null,
  };
}

function resetWorld() {
  for (const u of units) scene.remove(u.group);
  for (const e of enemies) scene.remove(e.group);
  for (const p of projs) scene.remove(p.m);
  for (const p of parts) scene.remove(p.m);
  for (const d of drops) scene.remove(d.g);
  units = []; enemies = []; projs = []; parts = []; drops = [];
  grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let r = 0; r < ROWS; r++) for (const s of slotMeshes[r]) s.paper.visible = false;
  hlMesh.visible = false;
}

/* ================= 实体：单位 ================= */
function makeUnit(type, r, c) {
  const d = UNITS[type];
  const group = UNIT_MODELS[type]();
  group.position.set(colX(c), 0, rowZ(r));
  group.scale.setScalar(0.01);            // 出生弹出动画
  scene.add(group);
  const u = {
    type, r, c, x: colX(c), z: rowZ(r), hp: d.hp, group, dead: false,
    hitT: 0, t: 0, spawnT: 0,
    prod: MACHINE_INT,                    // 咖啡机
    fireT: 0.6,                           // 加农炮 / 鱼缸
    pulse: d.pulse || 0,                  // 抄送
    armT: d.arm || 0, armed: false,       // 假装在忙
    fuse: d.fuse || 0,                    // 辞职信
    recoil: 0,
  };
  grid[r][c] = u; units.push(u);
  return u;
}

function killUnit(u, why) {
  if (u.dead) return;
  u.dead = true;
  grid[u.r][u.c] = null;
  scene.remove(u.group);
  burst(u.x, 0.7, u.z, UNIT_COLOR[u.type], why === 'eaten' ? 10 : 16, 3.2);
}

function damageUnit(u, amt) {
  u.hp -= amt; u.hitT = 0.12;
  if (u.hp <= 0) killUnit(u, 'eaten');
}

function updateUnit(u, dt) {
  const d = UNITS[u.type];
  const P = u.group.userData.parts;
  u.t += dt;
  // 出生弹出 + 受击回弹
  if (u.spawnT < 0.25) { u.spawnT += dt; const k = Math.min(1, u.spawnT / 0.25); u.group.scale.setScalar(0.01 + 0.99 * (1 - Math.pow(1 - k, 3))); }
  else { u.hitT = Math.max(0, u.hitT - dt); u.group.scale.setScalar(1 + 0.06 * (u.hitT / 0.12)); }

  switch (u.type) {
    case 'coffee':
      if (P.steam) P.steam.position.y = Math.sin(u.t * 3) * 0.05;
      u.prod -= dt;
      if (u.prod <= 0) { u.prod += MACHINE_INT; addCoffee(MACHINE_VAL, u.x, 1.2, u.z, false); }
      break;
    case 'cannon': {
      if (P.barrel) P.barrel.position.x = -0.14 * u.recoil;
      u.recoil = Math.max(0, u.recoil - dt * 6);
      u.fireT -= dt * (deadlineBoost() ? DEADLINE_BOOST : 1);
      if (u.fireT <= 0) { if (fireAt(u)) u.fireT = d.int; else u.fireT = 0; }
      break;
    }
    case 'fishbowl':
      if (P.fish) P.fish.position.x = Math.sin(u.t * 2.2) * 0.12;
      u.fireT -= dt;
      if (u.fireT <= 0) { if (fireAt(u)) u.fireT = d.int; else u.fireT = 0; }
      break;
    case 'email':
      u.pulse -= dt;
      if (u.pulse <= 0) { u.pulse = d.pulse; pulseRow(u); }
      if (P.mail) P.mail.scale.setScalar(1 + 0.12 * Math.sin(u.t * 6));
      break;
    case 'shredder':
      if (P.strips) P.strips.scale.y = 0.9 + 0.2 * Math.sin(u.t * 5);
      break;
    case 'wall':
      if (P.torso) P.torso.position.y = Math.sin(u.t * 2) * 0.015;
      break;
    case 'resign':
      u.fuse -= dt;
      if (P.paper) P.paper.position.x = Math.sin(u.t * (30 + 60 * (1 - clamp(u.fuse, 0, 1)))) * 0.03;
      if (u.fuse <= 0) { explodeResign(u); return; }
      break;
    case 'fakebusy':
      if (!u.armed) {
        u.armT -= dt;
        if (u.armT <= 0) {
          u.armed = true; SFX.play('arm');
          if (P.screen) P.screen.material.emissive.setHex(0x60a5fa);
          floatAt(u.x, 1.4, u.z, '进入状态', '#fde68a');
        }
      } else {
        if (P.screen) P.screen.material.emissive.setHex(Math.sin(u.t * 4) > 0 ? 0x60a5fa : 0x1e3a8a);
        for (const e of enemies) {
          if (e.dead || e.r !== u.r || e.type === 'boss' || e.state === 'suck' || e.state === 'jump') continue;
          if (Math.abs(e.x - u.x) < 0.9) {
            killEnemy(e);
            burst(u.x, 0.8, u.z, 0xf97316, 20, 4);
            floatAt(u.x, 1.5, u.z, '戳穿！', '#fca5a5');
            SFX.play('boom');
            killUnit(u, 'boom');
            return;
          }
        }
      }
      break;
  }
}

function deadlineBoost() {
  // 本波最后 25% 出怪（或已出完）时，DDL 加农炮射速提升
  return G.wave > 0 && G.queue.length <= 0.25 * G.queueTotal;
}

function explodeResign(u) {
  killUnit(u, 'boom');
  SFX.play('explode');
  shake = 0.45;
  burst(u.x, 0.9, u.z, 0xfef3c7, 30, 6);
  burst(u.x, 0.9, u.z, 0xef4444, 20, 5);
  for (const e of enemies.slice()) if (!e.dead && e.state !== 'suck') killEnemy(e);
  if (Math.random() < RESIGN_RISK) {
    floatAt(u.x, 2, u.z, '老板：批了。', '#fca5a5');
    G.pending = { t: 1.2, fn: () => lose('辞职信引爆的瞬间，老板回了一句："好的，批了。"') };
  } else {
    floatAt(u.x, 2, u.z, '全场清空！老板没批', '#fde047');
  }
}

/* 攻击：统一瞄准本行最左侧（最靠近工位）的敌人，子弹朝目标方向飞 */
function fireAt(u) {
  let t = null;
  for (const e of enemies) {
    if (e.dead || e.r !== u.r || e.state === 'suck') continue;
    if (!t || e.x < t.x) t = e;
  }
  if (!t) return false;
  const dir = t.x >= u.x ? 1 : -1;
  const d = UNITS[u.type];
  const m = new THREE.Mesh(projGeo, projMat[u.type]);
  const x0 = u.x + 0.6 * dir;
  m.position.set(x0, 0.55, u.z);
  scene.add(m);
  projs.push({ m, r: u.r, x: x0, dir, dmg: d.dmg, slow: !!d.slowMul });
  u.recoil = 1;
  SFX.play('shoot');
  return true;
}

function pulseRow(u) {
  for (const e of enemies.slice()) {
    if (e.dead || e.r !== u.r || e.type === 'boss' || e.state === 'suck') continue;
    damageEnemy(e, UNITS.email.pdmg);
  }
  burst(u.x, 1.0, u.z, 0x818cf8, 8, 2.5);
  floatAt(u.x, 1.6, u.z, '抄送!', '#c4b5fd');
  SFX.play('pop');
}

/* ================= 实体：敌人 ================= */
function spawnEnemy(type, r, x) {
  const def = ENEMY_DEF[type];
  const group = ENEMY_MODELS[type]();
  const sx = x === undefined ? SPAWN_X : x;
  group.position.set(sx, 0, rowZ(r));
  scene.add(group);
  const e = {
    type, r, x: sx, y: 0, group, dead: false,
    hp: def.hp, spd: def.spd, dps: def.dps,
    state: 'walk', target: null, slowT: 0, skipUsed: false,
    jt: 0, jx0: 0, jx1: 0, sk: 0, sx: 0, sy: 0, sz: 0, tx: 0, ty: 0, tz: 0,
    ph: Math.random() * 6, hitT: 0, spawnT: 10,
  };
  enemies.push(e);
  return e;
}

function damageEnemy(e, amt) {
  if (e.dead) return;
  e.hp -= amt; e.hitT = 0.1;
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e, byAnnual) {
  if (e.dead) return;
  e.dead = true;
  scene.remove(e.group);
  burst(e.x, 0.6, rowZ(e.r), ENEMY_COLOR[e.type], 14, 4);
  if (byAnnual) G.annualClear++; else G.kills++;
}

function updateEnemy(e, dt) {
  e.ph += dt;
  if (e.hitT > 0) e.hitT -= dt;

  // —— 缩小钻进槽位 ——
  if (e.state === 'suck') {
    e.sk += dt;
    const k = Math.min(1, e.sk / 0.45), ease = k * k * (3 - 2 * k);
    e.group.position.set(e.sx + (e.tx - e.sx) * ease, e.sy + (e.ty - e.sy) * ease + Math.sin(k * Math.PI) * 0.6, e.sz + (e.tz - e.sz) * ease);
    e.group.scale.setScalar(Math.max(0.01, 1 - 0.9 * ease));
    if (k >= 1) {
      scene.remove(e.group); e.dead = true;
      updateSlotVis(e.r);
      burst(e.tx, 1, e.tz, 0xfef3c7, 6, 2);
    }
    return;
  }

  if (e.slowT > 0) e.slowT -= dt;
  const mul = e.slowT > 0 ? 0.5 : 1;

  if (e.state === 'eat') {
    const u = e.target;
    if (!u || u.dead) { e.state = 'walk'; e.target = null; }
    else {
      damageUnit(u, e.dps * dt);
      if (u.type === 'shredder') {
        e.hp -= UNITS.shredder.counter * dt; e.hitT = 0.05;
        if (e.hp <= 0) { killEnemy(e); return; }
      }
      if (Math.random() < dt * 2) SFX.play('bite');
      const wob = Math.sin(e.ph * 30) * 0.04;
      e.group.position.set(e.x + wob, e.y, rowZ(e.r));
      e.group.scale.setScalar(1);
      return;
    }
  }

  if (e.state === 'jump') {
    e.jt += dt;
    const k = Math.min(1, e.jt / 0.8);
    e.x = e.jx0 + (e.jx1 - e.jx0) * k;
    e.y = Math.sin(Math.PI * k) * 0.9;
    if (k >= 1) { e.state = 'walk'; e.y = 0; }
  } else {
    const nx = e.x - e.spd * mul * dt;
    const c = Math.round((nx - 0.5) / CELL) + 4;     // 前缘所在格
    let blocker = null;
    if (c >= 0 && c < COLS) { const u = grid[e.r][c]; if (u && u.block) blocker = u; }
    if (blocker) {
      if (e.type === 'meeting' && !e.skipUsed) {
        // 临时会议：跳过第一个挡路的单位（每个会议只一次）
        e.skipUsed = true; e.state = 'jump'; e.jt = 0; e.jx0 = e.x; e.jx1 = e.x - 2.6;
        floatAt(e.x, 1.6, rowZ(e.r), '跳过！', '#93c5fd');
        SFX.play('pop');
      } else {
        e.x = Math.max(nx, colX(c) + 1.3);           // 贴住单位右侧
        e.state = 'eat'; e.target = blocker;
      }
    } else {
      e.x = nx;
    }
  }

  // 到达工位（桌前沿）
  if (e.x - 0.5 <= DESK_EDGE) { arrive(e); return; }

  // 例会：每 10 秒在本行空格生成普通需求
  if (e.type === 'sync') {
    e.spawnT -= dt;
    if (e.spawnT <= 0) {
      e.spawnT = 10;
      const free = [];
      for (let c = 0; c < COLS; c++) if (!grid[e.r][c] && colX(c) < e.x - 1.2 && colX(c) > DESK_EDGE + 1) free.push(c);
      if (free.length) {
        const c = free[Math.floor(Math.random() * free.length)];
        spawnEnemy('normal', e.r, colX(c));
        floatAt(colX(c), 1.2, rowZ(e.r), '新需求+1', '#c4b5fd');
      }
    }
  }

  e.group.position.set(e.x, e.y + (e.state === 'walk' ? Math.abs(Math.sin(e.ph * 9)) * 0.05 : 0), rowZ(e.r));
  const s = 1 + (e.hitT > 0 ? 0.08 * e.hitT / 0.1 : 0);
  e.group.scale.setScalar(s);
}

function arrive(e) {
  if (e.type === 'boss') { lose('老板亲自走到了工位前。年假？不好意思，老板不吃这一套。'); return; }
  if (G.annualUsed[e.r]) { lose(`${e.r + 1} 号工位的年假已经用过了，工作还是堆爆了。`); return; }
  const idx = G.slots[e.r];
  G.slots[e.r] = idx + 1;
  e.state = 'suck'; e.sk = 0;
  e.sx = e.x; e.sy = e.y; e.sz = rowZ(e.r);
  e.tx = -8.2; e.ty = 0.95; e.tz = rowZ(e.r) + SLOT_Z[Math.min(3, idx)];
  SFX.play('suck');
  updateStations();
  if (G.slots[e.r] >= 4) annual(e.r);
}

function annual(r) {
  G.annualUsed[r] = true;
  SFX.play('annual');
  flyPaper(r);
  for (const e of enemies.slice()) if (!e.dead && e.r === r && e.state !== 'suck') killEnemy(e, true);
  toast(`${r + 1} 号工位：年假审批通过！本行清场——工作还堆在工位上，回头还得处理。`);
  shake = Math.max(shake, 0.15);
  updateStations();
}

function updateSlotVis(r) {
  for (let i = 0; i < 4; i++) slotMeshes[r][i].paper.visible = i < G.slots[r];
  updateStations();
}

/* ================= 投射物 / 粒子 / 掉落 ================= */
function updateProjs(dt) {
  for (const p of projs) {
    if (p.dead) continue;
    p.x += p.dir * 8 * dt;
    p.m.position.x = p.x;
    p.m.rotation.x += dt * 8;
    for (const e of enemies) {
      if (e.dead || e.r !== p.r || e.state === 'suck') continue;
      if (Math.abs(e.x - p.x) < 0.5) {
        damageEnemy(e, p.dmg);
        if (p.slow && !e.dead) e.slowT = UNITS.fishbowl.slowT;
        burst(p.x, 0.6, rowZ(p.r), p.slow ? 0x7dd3fc : 0xfdba74, 3, 1.5);
        SFX.play('hit');
        p.dead = true;
        break;
      }
    }
    if (!p.dead && Math.abs(p.x) > 11) p.dead = true;
    if (p.dead) scene.remove(p.m);
  }
  projs = projs.filter(p => !p.dead);
}

function burst(x, y, z, col, n = 10, spd = 3) {
  if (parts.length > 500) n = Math.min(n, 2);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(partGeo, pmat(col));
    m.position.set(x, y, z);
    m.scale.setScalar(rnd(0.6, 1.2));
    scene.add(m);
    const a = rnd(0, Math.PI * 2), s = rnd(0.4, 1) * spd;
    parts.push({ m, vx: Math.cos(a) * s, vy: rnd(2, 5), vz: Math.sin(a) * s * 0.7, life: rnd(0.45, 0.85) });
  }
}

function updateParts(dt) {
  for (const p of parts) {
    p.life -= dt;
    p.vy -= 14 * dt;
    p.m.position.x += p.vx * dt; p.m.position.y = Math.max(0.05, p.m.position.y + p.vy * dt); p.m.position.z += p.vz * dt;
    p.m.rotation.x += dt * 6;
    if (p.life <= 0) scene.remove(p.m);
  }
  parts = parts.filter(p => p.life > 0);
}

function spawnDrop() {
  const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
  const g = makeCoffeeCupModel();
  g.position.set(colX(c), 9, rowZ(r));
  scene.add(g);
  drops.push({ g, x: colX(c), z: rowZ(r), y: 9, t: 0, state: 'fall' });
}

function updateDrops(dt) {
  for (const d of drops) {
    if (d.state !== 'fall') continue;
    d.t += dt;
    const k = Math.min(1, d.t / 0.9);
    d.y = 9 * (1 - k) * (1 - k);
    d.g.position.set(d.x, d.y, d.z);
    d.g.rotation.y += dt * 2;
    if (k >= 1) {
      d.state = 'done';
      scene.remove(d.g);
      addCoffee(DROP_VAL, d.x, 1.0, d.z, true);
      burst(d.x, 0.8, d.z, 0xfde047, 10, 2.5);
    }
  }
  drops = drops.filter(d => d.state === 'fall');
}

function addCoffee(v, x, y, z, fromDrop) {
  G.coffee += v;
  floatAt(x, y + 0.8, z, `+${v}`, '#fde047');
  if (fromDrop) SFX.play('collect'); else SFX.play('cup');
}

/* ================= 波次与主循环 ================= */
function startWave(n) {
  G.wave = n;
  const sp = waveSpec(n);
  G.queue = buildWave(n);
  G.queueTotal = G.queue.length;
  G.interval = sp.interval;
  G.spawnT = 0.5;
  G.gapT = null;
  if (sp.big) {
    showBanner(n === 6 ? '⚠ 第 6 波：一大波工作来袭！' : '⚠ 最终波：一大波工作来袭！');
    SFX.play('warn');
    shake = Math.max(shake, 0.3);
  } else {
    toast(`第 ${n} 波 · 开会开始`);
  }
}

function spawnNext() {
  const it = G.queue.shift();
  let type = it.type;
  if (type === 'boss' && enemies.some(e => e.type === 'boss' && !e.dead)) type = 'normal';
  spawnEnemy(type, it.row);
}

function simulate(dt) {
  if (G.phase !== 'play') return;

  // 延迟结算（辞职信的老板批准）
  if (G.pending) {
    G.pending.t -= dt;
    if (G.pending.t <= 0) { const f = G.pending.fn; G.pending = null; f(); return; }
  }

  // 天降咖啡因
  G.dropT -= dt;
  if (G.dropT <= 0) { G.dropT = DROP_INT; spawnDrop(); }

  // 冷却
  for (const k in G.cd) G.cd[k] = Math.max(0, G.cd[k] - dt);

  // 波次
  if (G.wave === 0) {
    G.waveWait -= dt;
    if (G.waveWait <= 0) startWave(1);
  } else if (G.queue.length) {
    G.spawnT -= dt;
    if (G.spawnT <= 0) { spawnNext(); G.spawnT = G.interval; }
  } else if (G.wave < TOTAL_WAVES) {
    if (G.gapT === null) G.gapT = 7;
    G.gapT -= dt;
    if (G.gapT <= 0) startWave(G.wave + 1);
  }

  for (const u of units.slice()) { if (!u.dead) updateUnit(u, dt); if (G.phase !== 'play') return; }
  for (const e of enemies.slice()) { if (!e.dead) updateEnemy(e, dt); if (G.phase !== 'play') return; }
  updateProjs(dt);
  updateParts(dt);
  updateDrops(dt);

  units = units.filter(u => !u.dead);
  enemies = enemies.filter(e => !e.dead);

  if (G.wave === TOTAL_WAVES && G.queue.length === 0 && enemies.length === 0) win();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (G.phase === 'play' && !G.paused) simulate(dt * G.speed);

  // 常驻动画：组员打字点头、镜头抖动、高亮脉冲
  const t = now / 1000;
  headMeshes.forEach((h, r) => { h.position.y = Math.sin(t * 7 + r) * 0.012; });
  shake = Math.max(0, shake - dt * 2.2);
  camera.position.set(
    CAM_BASE.x + rnd(-1, 1) * shake * 0.25,
    CAM_BASE.y + rnd(-1, 1) * shake * 0.25,
    CAM_BASE.z);
  camera.lookAt(0, 0, -0.6);
  if (hlMesh.visible) hlMesh.material.opacity = 0.35 + 0.15 * Math.sin(t * 6);

  updateCards();
  updateHUD();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

/* ================= 失败 / 胜利 ================= */
function lose(reason) {
  if (G.phase !== 'play') return;
  G.phase = 'lose';
  G.paused = false;
  SFX.bgm.stop();
  SFX.play('lose');
  setTimeout(() => showEnd(false, reason), 900);
}
function win() {
  if (G.phase !== 'play') return;
  G.phase = 'win';
  SFX.bgm.stop();
  SFX.play('win');
  setTimeout(() => showEnd(true), 1200);
}

const QUOTES = {
  good: ['守得漂亮！这波要是绩效考核，你直接定 S。', '工作在你面前像个笑话。要不要考虑下一次晋升？', '老板路过你的工位看了一眼，默默给你加了个工位。'],
  mid:  ['险胜。你离"优秀员工"只差一次没请假的全勤。', '守住了，但你的发际线好像后退了一点。', '年假用得很体面，就是咖啡喝得有点多。'],
  bad:  ['你守住了，代价是你的整个周末。', '工作堆得比你的工位还高，HR 说这叫"个人成长空间"。', '你连老板的影子都没挡住——好在他没看你。'],
  lose: ['别慌，这只是一次"绩效面谈"。', '他们说你不适合这个岗位。好消息：你终于有时间思考人生了。', '你被优化了。HR 祝你前程似锦。', '打工人的失败从来不是一次性的，它每个周五都在发生。'],
};
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function showEnd(isWin, reason) {
  const annualLeft = G.annualUsed.filter(v => !v).length;
  const stats = `
    <div>消灭工作 <b>${G.kills}</b></div>
    <div>年假清场 <b>${G.annualClear}</b></div>
    <div>剩余咖啡因 <b>${Math.floor(G.coffee)}</b></div>
    <div>剩余年假 <b>${annualLeft}</b> / 5</div>`;
  if (isWin) {
    $('#end-title').textContent = '🎉 撑过全部 12 波！';
    $('#end-sub').textContent = '工位无一沦陷。这段可以直接写进年终述职了。';
    $('#end-quote').textContent = pick(annualLeft >= 3 ? QUOTES.good : annualLeft >= 1 ? QUOTES.mid : QUOTES.bad);
  } else {
    $('#end-title').textContent = '💀 你被优化了';
    $('#end-sub').textContent = reason || '工作堆爆了。';
    $('#end-quote').textContent = pick(QUOTES.lose);
  }
  $('#end-stats').innerHTML = stats;
  showOv('ov-end');
}

/* ================= 界面：HUD / 卡片 / 提示 ================= */
const cardEls = {};
function buildCards() {
  const box = $('#cards');
  for (const type of CARD_ORDER) {
    const d = UNITS[type];
    const el = document.createElement('div');
    el.className = 'card' + (d.custom ? ' custom' : '');
    el.dataset.type = type;
    el.innerHTML = `<div class="ic">${d.icon}</div><div class="nm">${d.name}</div>
      <div class="cost">☕ ${d.cost}</div><div class="cdov"></div>`;
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const why = cardBlockReason(type);
      if (why) { SFX.play('deny'); toast(why); return; }
      beginDrag('card', type, e);
    });
    el.addEventListener('pointerenter', () => scheduleTip(type, el));
    el.addEventListener('pointerleave', hideTip);
    box.appendChild(el);
    cardEls[type] = el;
  }
  // 铲子（与卡片明显区分：橙色、单独一格）
  const sh = $('#shovel');
  sh.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    beginDrag('shovel', null, e);
  });
  sh.addEventListener('pointerenter', () => scheduleTip(null, sh));
  sh.addEventListener('pointerleave', hideTip);
}

function cardBlockReason(type) {
  const d = UNITS[type];
  if (G.phase !== 'play') return '还没开工';
  if ((G.cd[type] || 0) > 0) return `${d.name} 冷却中（${G.cd[type].toFixed(1)}s）`;
  if (G.coffee < d.cost) return `咖啡因不足（需要 ${d.cost}，现有 ${Math.floor(G.coffee)}）`;
  return null;
}

function updateCards() {
  for (const type of CARD_ORDER) {
    const el = cardEls[type], d = UNITS[type];
    const cdLeft = G.cd[type] || 0;
    const ready = G.phase === 'play' && cdLeft <= 0 && G.coffee >= d.cost;
    el.classList.toggle('off', !ready);
    el.classList.toggle('cdng', cdLeft > 0);
    const ov = el.querySelector('.cdov');
    ov.style.height = cdLeft > 0 ? Math.min(100, cdLeft / d.cd * 100) + '%' : '0%';
    ov.textContent = cdLeft > 0 ? cdLeft.toFixed(1) : '';
  }
}

let lastHUD = '';
function updateHUD() {
  const coffee = Math.floor(G.coffee);
  $('#coffee').textContent = coffee;
  let waveText, prog;
  if (G.phase === 'menu') { waveText = '准备上班'; prog = 0; }
  else if (G.wave === 0) { waveText = `第 1 波 · ${Math.ceil(G.waveWait)} 秒后开工`; prog = 0; }
  else {
    const inWave = G.queueTotal ? (G.queueTotal - G.queue.length) / G.queueTotal : 1;
    prog = ((G.wave - 1) + inWave) / TOTAL_WAVES;
    waveText = `第 ${G.wave} / ${TOTAL_WAVES} 波` + (G.queue.length ? ' · 工作涌来中' : (G.wave < TOTAL_WAVES ? ' · 喘口气' : ' · 清场中'));
  }
  $('#wave-fill').style.width = (clamp(prog, 0, 1) * 100).toFixed(1) + '%';
  const key = coffee + '|' + waveText;
  if (key !== lastHUD) { $('#wave-text').textContent = waveText; lastHUD = key; }
  if (G.phase === 'play' && G.paused) $('#pause-btn').textContent = '▶ 继续';
  else $('#pause-btn').textContent = '⏸ 暂停';
  $('#speed-btn').textContent = G.speed === 2 ? '×2 ✓' : '×2';
  $('#speed-btn').classList.toggle('on', G.speed === 2);
  $('#shovel').classList.toggle('on', G.shovelMode);
}

function buildStations() {
  const box = $('#stations-list');
  box.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    const row = document.createElement('div');
    row.className = 'st';
    row.innerHTML = `<span class="stn">工位 ${r + 1}</span><span class="slots"><i></i><i></i><i></i><i></i></span><span class="ann"></span>`;
    box.appendChild(row);
  }
}
function updateStations() {
  const rows = document.querySelectorAll('#stations-list .st');
  rows.forEach((row, r) => {
    const dots = row.querySelectorAll('.slots i');
    dots.forEach((d, i) => d.classList.toggle('full', i < G.slots[r]));
    const ann = row.querySelector('.ann');
    ann.textContent = G.annualUsed[r] ? '年假×' : '年假✓';
    ann.classList.toggle('used', G.annualUsed[r]);
  });
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
}
let bannerTimer = null;
function showBanner(msg) {
  const el = $('#banner');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// 3D 坐标 → 舞台像素上的飘字
function floatAt(x, y, z, text, color) {
  const v = new THREE.Vector3(x, y, z).project(camera);
  const px = (v.x + 1) / 2 * W, py = (1 - v.y) / 2 * H;
  const el = document.createElement('div');
  el.className = 'fl';
  el.textContent = text;
  el.style.left = px + 'px';
  el.style.top = py + 'px';
  if (color) el.style.color = color;
  $('#fx').appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function flyPaper(r) {
  const v = new THREE.Vector3(0, 1.6, rowZ(r)).project(camera);
  const py = (1 - v.y) / 2 * H;
  const el = document.createElement('div');
  el.className = 'paper';
  el.textContent = `📄 年假审批单 · ${r + 1} 号工位 · 已批准`;
  el.style.top = py + 'px';
  $('#fx').appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

/* ---- 悬停提示（0.5 秒后出现；开始拖拽立即消失） ---- */
let tipTimer = null, tipFor = null;
function scheduleTip(type, el) {
  hideTip();
  tipFor = el;
  tipTimer = setTimeout(() => {
    const tip = $('#tip');
    if (type) {
      const d = UNITS[type];
      tip.innerHTML = `<b>${d.icon} ${d.name}</b>
        <div class="tmeta">费用 ☕${d.cost} ｜ 冷却 ${d.cd}s${d.hp ? ' ｜ 血量 ' + d.hp : ''}</div>
        <div>${d.desc}</div>`;
    } else {
      tip.innerHTML = `<b>⛏️ 铲子</b><div>把铲子拖到已布置的单位上即可铲除（也可以点一下选中，再点单位铲除）。铲除不退咖啡因。</div>`;
    }
    const sr = stage.getBoundingClientRect(), er = el.getBoundingClientRect();
    const s = sr.width / W;
    tip.style.display = 'block';
    const tw = tip.offsetWidth;
    let left = (er.left + er.width / 2 - sr.left) / s - tw / 2;
    left = clamp(left, 8, W - tw - 8);
    tip.style.left = left + 'px';
    tip.style.top = ((er.top - sr.top) / s - tip.offsetHeight - 10) + 'px';
  }, 500);
}
function hideTip() {
  clearTimeout(tipTimer); tipTimer = null; tipFor = null;
  $('#tip').style.display = 'none';
}

/* ================= 拖拽：卡片布置 / 铲子 ================= */
let drag = null;
const chip = () => $('#dragchip');

function beginDrag(kind, type, e) {
  hideTip();
  drag = { kind, type, moved: false, sx: e.clientX, sy: e.clientY };
  const c = chip();
  if (kind === 'card') {
    const d = UNITS[type];
    c.innerHTML = `<span class="ci">${d.icon}</span><span class="ct">${d.name}</span>`;
    buildGhostCache(type);
  } else {
    c.innerHTML = `<span class="ci">⛏️</span><span class="ct">铲子</span>`;
  }
  c.style.display = 'flex';
  c.style.left = e.clientX + 'px';
  c.style.top = e.clientY + 'px';
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragUp);
  window.addEventListener('pointercancel', onDragCancel);
  e.preventDefault();
}

function pointerToStage(e) {
  const r = stage.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
const raycaster = new THREE.Raycaster();
function groundHit(e) {
  const p = pointerToStage(e);
  const ndc = new THREE.Vector2(p.x / W * 2 - 1, -(p.y / H) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects([floorMesh, baseMesh], false);
  if (!hits.length) return null;
  const pt = hits[0].point;
  const c = Math.round(pt.x / CELL) + 4, r = Math.round(pt.z / CELL) + 2;
  return { r, c, inGrid: cellInGrid(r, c), x: pt.x, z: pt.z };
}

function onDragMove(e) {
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 5) drag.moved = true;
  const c = chip();
  c.style.left = e.clientX + 'px';
  c.style.top = e.clientY + 'px';
  const cell = groundHit(e);
  const txt = c.querySelector('.ct');
  const ghost = drag.kind === 'card' ? buildGhostCache(drag.type) : null;

  if (drag.kind === 'card') {
    const d = UNITS[drag.type];
    const why = cardBlockReason(drag.type);
    if (cell && cell.inGrid) {
      const occupied = !!grid[cell.r][cell.c];
      ghost.visible = true;
      ghost.position.set(colX(cell.c), 0, rowZ(cell.r));
      hlMesh.visible = true; hlMesh.position.set(colX(cell.c), 0.07, rowZ(cell.r));
      if (occupied) { hlMesh.material.color.setHex(0xef4444); txt.textContent = `✖ 这格已被占用`; c.classList.add('bad'); }
      else if (why) { hlMesh.material.color.setHex(0xef4444); txt.textContent = `✖ ${why}`; c.classList.add('bad'); }
      else { hlMesh.material.color.setHex(0x22c55e); txt.textContent = `松开即可布置（${d.name}）`; c.classList.remove('bad'); }
    } else {
      hlMesh.visible = false;
      if (cell) { ghost.visible = true; ghost.position.set(cell.x, 0, cell.z); }
      else ghost.visible = false;
      txt.textContent = '✖ 拖到办公区的格子里再松手';
      c.classList.add('bad');
    }
  } else {
    if (cell && cell.inGrid && grid[cell.r][cell.c]) {
      hlMesh.visible = true; hlMesh.position.set(colX(cell.c), 0.07, rowZ(cell.r));
      hlMesh.material.color.setHex(0xf97316);
      txt.textContent = `松开铲除：${UNITS[grid[cell.r][cell.c].type].name}`;
      c.classList.remove('bad');
    } else {
      hlMesh.visible = false;
      txt.textContent = '把铲子拖到单位上';
      c.classList.add('bad');
    }
  }
}

function endDragVisuals() {
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragUp);
  window.removeEventListener('pointercancel', onDragCancel);
  chip().style.display = 'none';
  chip().classList.remove('bad');
  hlMesh.visible = false;
  for (const k in ghostCache) ghostCache[k].visible = false;
  drag = null;
}
function onDragCancel() { endDragVisuals(); }

function onDragUp(e) {
  if (!drag) return;
  const d = drag;
  const cell = groundHit(e);
  endDragVisuals();

  if (d.kind === 'card') {
    if (!d.moved) { toast('把卡片拖到办公区格子里松手，即可布置。'); return; }
    const why = cardBlockReason(d.type);
    if (!cell || !cell.inGrid) { SFX.play('deny'); return; }
    if (grid[cell.r][cell.c]) { SFX.play('deny'); toast('这格已经有人在上班了，换一格或先用铲子。'); return; }
    if (why) { SFX.play('deny'); toast(why); return; }
    placeUnit(d.type, cell.r, cell.c);
  } else {
    if (!d.moved) { setShovelMode(!G.shovelMode); return; }
    if (cell && cell.inGrid && grid[cell.r][cell.c]) shovelRemove(grid[cell.r][cell.c]);
    else toast('铲子没碰到单位。');
  }
}

function placeUnit(type, r, c) {
  const d = UNITS[type];
  G.coffee -= d.cost;
  G.cd[type] = d.cd;
  const u = makeUnit(type, r, c);
  SFX.play('place');
  burst(u.x, 0.3, u.z, 0xd6d3d1, 6, 1.8);
  return u;
}

function shovelRemove(u) {
  SFX.play('shovel');
  floatAt(u.x, 1.6, u.z, '铲!', '#fdba74');
  killUnit(u, 'shovel');
}

function setShovelMode(on) {
  G.shovelMode = on;
  canvas.style.cursor = on ? 'crosshair' : 'default';
  toast(on ? '铲子已选中：点击单位即可铲除（再点一次按钮取消）' : '铲子已收起');
}

/* 画布上的悬停：高亮格子 / 铲子模式 */
function bindCanvas() {
  canvas.addEventListener('pointermove', e => {
    if (drag || G.phase === 'menu') return;
    const cell = groundHit(e);
    if (cell && cell.inGrid) {
      hlMesh.visible = true;
      hlMesh.position.set(colX(cell.c), 0.07, rowZ(cell.r));
      const occupied = !!grid[cell.r][cell.c];
      hlMesh.material.color.setHex(G.shovelMode && occupied ? 0xf97316 : 0xffffff);
    } else hlMesh.visible = false;
  });
  canvas.addEventListener('pointerleave', () => { if (!drag) hlMesh.visible = false; });
  canvas.addEventListener('pointerdown', e => {
    if (!G.shovelMode || G.phase !== 'play') return;
    const cell = groundHit(e);
    if (cell && cell.inGrid && grid[cell.r][cell.c]) shovelRemove(grid[cell.r][cell.c]);
  });
}

/* ================= 覆盖层 / 按钮 ================= */
function showOv(id) { document.querySelectorAll('.ov').forEach(o => o.classList.add('hidden')); if (id) $('#' + id).classList.remove('hidden'); }
function hideOv() { document.querySelectorAll('.ov').forEach(o => o.classList.add('hidden')); }

function startGame() {
  SFX.init();
  SFX.play('click');
  SFX.bgm.start();
  resetWorld();
  G = newState();
  G.phase = 'play';
  G.waveWait = 4;
  G.shovelMode = false;
  canvas.style.cursor = 'default';
  updateStations();
  hideOv();
  toast('开工！把卡片拖到格子里。咖啡因会从天上掉下来。');
}

function togglePause() {
  if (G.phase !== 'play') return;
  G.paused = !G.paused;
  if (G.paused) showOv('ov-pause'); else hideOv();
}

function setupUI() {
  $('#btn-start').addEventListener('click', startGame);
  $('#btn-dex-start').addEventListener('click', () => openDex('ov-start'));
  const openDexInGame = () => { SFX.play('click'); dexWasPaused = G.paused; G.paused = true; openDex('game'); };
  $('#btn-dex-game').addEventListener('click', openDexInGame);
  $('#btn-dex-game-2').addEventListener('click', openDexInGame);
  $('#dex-close').addEventListener('click', closeDex);
  $('#btn-restart').addEventListener('click', () => { SFX.play('click'); startGame(); });
  $('#btn-restart-end').addEventListener('click', () => { SFX.play('click'); startGame(); });
  $('#btn-restart-pause').addEventListener('click', () => { SFX.play('click'); startGame(); });
  $('#pause-btn').addEventListener('click', () => { SFX.play('click'); togglePause(); });
  $('#btn-resume').addEventListener('click', () => { SFX.play('click'); togglePause(); });
  $('#speed-btn').addEventListener('click', () => { SFX.play('click'); G.speed = G.speed === 2 ? 1 : 2; });
  $('#btn-mute').addEventListener('click', () => {
    const m = !SFX.isMuted(); SFX.setMuted(m); $('#btn-mute').textContent = m ? '🔇' : '🔊';
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
    if (e.key === 'm' || e.key === 'M') $('#btn-mute').click();
  });
  bindCanvas();
}

function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}

/* ================= 图鉴 ================= */
let dexBuilt = false, dexReturn = null, dexWasPaused = false;
function buildDex() {
  if (dexBuilt) return;
  dexBuilt = true;
  const u = CARD_ORDER.map(t => {
    const d = UNITS[t];
    return `<div class="dx"><div class="dxh"><span class="dxi">${d.icon}</span><b>${d.name}</b>${d.custom ? '<em>自创</em>' : ''}</div>
      <div class="dxm">☕${d.cost} ｜ 冷却 ${d.cd}s ｜ 血量 ${d.hp}${d.dmg ? ' ｜ 伤害 ' + d.dmg : ''}${d.int ? ' ｜ 间隔 ' + d.int + 's' : ''}</div>
      <div class="dxd">${d.desc}</div></div>`;
  }).join('');
  const en = Object.keys(ENEMY_DEF).map(k => {
    const d = ENEMY_DEF[k];
    return `<div class="dx"><div class="dxh"><b>${d.name}</b></div>
      <div class="dxm">血量 ${d.hp} ｜ 移速 ${d.spd}/s ｜ 攻击 ${d.dps}/s</div>
      <div class="dxd">${d.desc}</div></div>`;
  }).join('');
  const vt = `<table class="vt">
    <tr><th>单位</th><th>费用</th><th>冷却</th><th>血量</th><th>伤害/间隔</th></tr>
    ${CARD_ORDER.map(t => { const d = UNITS[t]; return `<tr><td>${d.name}</td><td>${d.cost}</td><td>${d.cd}s</td><td>${d.hp}</td><td>${d.dmg ? d.dmg + ' / ' + d.int + 's' : (t === 'coffee' ? '+25 / 10s' : t === 'fakebusy' ? '秒杀（武装15s）' : t === 'email' ? '30 / 6s（全行）' : t === 'shredder' ? '反咬 15/s' : t === 'resign' ? '全场清空，18% 失败' : '—')}</td></tr>`; }).join('')}
    <tr><td>咖啡因</td><td colspan="4">初始 100；天降 +25 / 8s；咖啡机 +25 / 10s</td></tr>
    <tr><td>敌人</td><td colspan="4">普通 100血/0.9速 ｜ 加急 200血/1.0速 ｜ 老板 400血/0.4速 ｜ 临时会议 100血/1.0速 ｜ 例会 200血/0.7速</td></tr>
    <tr><td>波次</td><td colspan="4">12 波；每波 11→44 个（第 6/12 波 ×1.4 = 36/62）；出怪间隔 2.3s→1.0s；老板在第 4/8/12 波各出现 1 次</td></tr>
  </table>`;
  $('#dex-body').innerHTML = `
    <h3>我方单位（打工人武器库）</h3><div class="dxgrid">${u}</div>
    <h3>敌方（工作）</h3><div class="dxgrid">${en}</div>
    <h3>数值总表</h3>${vt}
    <p class="dxnote">辞职信：每次引爆有 18% 概率老板同意辞职→失败。难度曲线：前 3 波只有普通需求，咖啡因充裕、一门加农炮即可；第 3 波起混入临时会议，第 6 波起出现例会与大波、加急需求比例上升；后期需要配合减速、秒杀、年假与辞职信，单靠一种单位堆不过去。</p>`;
}
// from: 'ov-start'（从开始界面打开）或 'game'（游戏中打开，关闭后恢复原暂停状态）
function openDex(from) {
  buildDex();
  dexReturn = from;
  showOv('ov-dex');
}
function closeDex() {
  if (dexReturn === 'ov-start' || !G || G.phase !== 'play') { showOv('ov-start'); return; }
  G.paused = dexWasPaused;
  if (G.paused) showOv('ov-pause'); else hideOv();
}

/* ================= 启动 ================= */
(function init() {
  buildScene();
  buildCards();
  buildStations();
  setupUI();
  buildDex();
  G = newState();
  resetWorld();
  fit();
  window.addEventListener('resize', fit);
  updateStations();
  showOv('ov-start');
  requestAnimationFrame(t => { last = t; requestAnimationFrame(loop); });
})();
