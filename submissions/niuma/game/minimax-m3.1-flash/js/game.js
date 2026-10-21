/* ============================================================
 *  game.js —— 渲染 / 机制 / 交互 / 波次 / 结算
 * ============================================================ */
'use strict';

var R = {}, S = {}, UI = {};
var COLORS = {};

/* ---------- 模型工厂 ---------- */
var MODEL_FN = {
  coffee: M_coffee, ddl: M_ddl, scapegoat: M_scapegoat, tank: M_tank,
  resign: M_resign, busy: M_busy, read: M_read, align: M_align,
  doc: M_doc, urgent: M_urgent, boss: M_boss, meeting: M_meeting, regular: M_regular
};
var GROUND_Y = 0.09;

/* ============================================================
 *  初始化
 * ============================================================ */
function initGame() {
  var canvas = document.getElementById('gl');
  R.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
  R.renderer.setPixelRatio(1);
  R.renderer.setSize(1280, 720, false);
  R.renderer.shadowMap.enabled = true;
  R.renderer.shadowMap.type = THREE.PCFShadowMap;
  R.renderer.setClearColor(0xf3efe6);

  R.scene = new THREE.Scene();
  R.scene.fog = new THREE.Fog(0xf3efe6, 26, 46);

  R.camera = new THREE.PerspectiveCamera(32, 1280 / 720, 0.5, 80);
  R.camera.position.set(1.0, 12.8, 10.6);
  R.camera.lookAt(1.0, 0.30, 0.0);

  initMats();

  /* 光照：暖色主光 + 冷色补光 + 半球环境 */
  var hemi = new THREE.HemisphereLight(0xffffff, 0xb2a48c, 0.62);
  R.scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff2dc, 0.82);
  sun.position.set(7, 16, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  var d = 14;
  sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
  sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 45;
  sun.shadow.bias = -0.0012;
  sun.shadow.normalBias = 0.02;
  R.scene.add(sun);
  var fill = new THREE.DirectionalLight(0xcfe4ff, 0.22);
  fill.position.set(-9, 7, -6);
  R.scene.add(fill);
  R.sun = sun;

  buildScene(R.scene);
  S.slotMeshes = buildSlots(R.scene);
  buildSlotBase(R.scene);

  /* 战场网格高亮框 */
  R.cellHi = new THREE.Mesh(
    new THREE.BoxGeometry(CELL - 0.06, 0.06, ROW_GAP - 0.06),
    new THREE.MeshBasicMaterial({ color: 0x7ef29a, transparent: true, opacity: 0.55 })
  );
  R.cellHi.visible = false;
  R.scene.add(R.cellHi);
  R.cellBad = R.cellHi.clone();
  R.cellBad.material = new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.5 });
  R.cellBad.visible = false;
  R.scene.add(R.cellBad);

  /* 网格射线平面 */
  R.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -GROUND_Y);
  R.ray = new THREE.Raycaster();
  R.ndc = new THREE.Vector2();

  /* 粒子池 */
  R.partGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  R.parts = [];
  for (var i = 0; i < 90; i++) {
    var m = new THREE.Mesh(R.partGeo, new THREE.MeshBasicMaterial({ transparent: true }));
    m.visible = false;
    R.scene.add(m);
    R.parts.push({ mesh: m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, g: -6 });
  }

  /* 拖拽幽灵 / 铲子 */
  R.ghost = new THREE.Group(); R.ghost.visible = false; R.scene.add(R.ghost);
  R.shovel = buildShovel(); R.shovel.visible = false; R.scene.add(R.shovel);

  /* 悬浮 DOM 文字 */
  UI.float = document.getElementById('floats');

  S.units = []; S.enemies = []; S.bullets = []; S.drops = []; S.effects = [];

  bindUI();
  fitStage();
  window.addEventListener('resize', fitStage);
  makeIcons();
  newGame(true);
  showScreen('menu');

  R.clock = new THREE.Clock();
  R.time = 0;
  requestAnimationFrame(tick);
}

/* 舞台等比缩放（游戏内部坐标恒为 1280×720） */
function fitStage() {
  var el = document.getElementById('stage');
  var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  el.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
}

function buildShovel() {
  var g = new THREE.Group(), b = new VB();
  b.b(0, -0.34, 0, 0.07, 0.62, 0.07, C.wood);
  b.b(0, -0.62, 0, 0.10, 0.10, 0.10, C.red2);
  b.b(0, 0.02, 0, 0.26, 0.26, 0.05, C.gray);
  b.b(0, -0.06, 0.06, 0.20, 0.10, 0.10, C.dark);
  g.add(voxMesh(b));
  return g;
}

/* ============================================================
 *  局内状态
 * ============================================================ */
function newGame(silent) {
  /* 清场 */
  [S.units, S.enemies, S.bullets, S.drops].forEach(function (arr) {
    arr.forEach(function (e) { if (e.mesh && e.mesh.parent) R.scene.remove(e.mesh); });
    arr.length = 0;
  });
  for (var i = 0; i < ECON.slotCount; i++) for (var r = 0; r < ROWS; r++) S.slotMeshes[r][i].visible = false;
  S.fxClear();

  S.state = 'menu';
  S.caffeine = ECON.startCaffeine;
  S.wave = 0;
  S.waveActive = false;
  S.queue = [];
  S.waveTimer = 14;
  S.prep = true;
  S.killed = 0;
  S.leaves = [true, true, true, true, true];   // 每工位 1 次年假
  S.filled = [0, 0, 0, 0, 0];
  S.dropTimer = ECON.dropInterval;
  S.pendingSlot = [];
  S.pendingBoss = null;
  S.elapsed = 0;
  S.paused = false;
  S.speed = 1;
  S.cooldowns = {};
  UNITS.forEach(function (u) { S.cooldowns[u.key] = 0; });
  S.bossAlive = false;
  S.waveBannerT = 0;
  if (!silent) { hideScreens(); S.state = 'play'; bgmStart(); }
  syncUI();
}

/* ============================================================
 *  主循环
 * ============================================================ */
function tick() {
  requestAnimationFrame(tick);
  var dt = Math.min(0.06, R.clock.getDelta());
  R.time += dt;
  var gsdt = dt * S.speed;
  if (S.state === 'play' && !S.paused) update(gsdt);
  animateWorld(R.time, S.state === 'play' && !S.paused ? gsdt : 0);
  R.renderer.render(R.scene, R.camera);
  updateFloats();
}

/* ============================================================
 *  更新
 * ============================================================ */
function update(dt) {
  var i;
  /* 咖啡因冷却 */
  for (i = 0; i < UNITS.length; i++) {
    var k = UNITS[i].key;
    if (S.cooldowns[k] > 0) { S.cooldowns[k] = Math.max(0, S.cooldowns[k] - dt); }
  }

  /* 咖啡因掉落 */
  S.dropTimer -= dt;
  if (S.dropTimer <= 0) { S.dropTimer = ECON.dropInterval; spawnDrop(); }

  /* 波次推进 */
  if (S.prep) {
    S.waveTimer -= dt;
    if (S.waveTimer <= 0) startWave();
  } else {
    while (S.queue.length && S.queue[0].at <= S.elapsed) spawnEnemy(S.queue.shift());
    S.elapsed += dt;
    if (!S.queue.length) {
      /* 本波出怪完毕 */
      S.waveActive = false;
      if (S.wave >= TOTAL_WAVES) {
        if (S.enemies.length === 0) endGame(true);
      } else {
        S.prep = true;
        S.waveTimer = 15;
        banner('第 ' + (S.wave + 1) + ' 波工作马上到，喘口气～', 2.4);
      }
    }
  }

  /* 单位 */
  for (i = S.units.length - 1; i >= 0; i--) {
    var u = S.units[i];
    u.t += dt;
    switch (u.def.key) {
      case 'coffee':
        if (u.t >= u.def.rate) { u.t = 0; addCaffeine(u.def.produce); burst(u.x, 0.5, u.z, 0xaef, 6, 2); sfx('produce'); floatText(u.x, 1.1, u.z, '+' + u.def.produce, 'good small'); }
        break;
      case 'ddl':
        if (u.t >= u.def.rate) {
          var tg = leftmostEnemy(u.row, u.x);
          if (tg) { u.t = 0; fireBullet(u, tg, 'ddl'); }
        }
        break;
      case 'tank':
        if (u.t >= u.def.rate) {
          var tg2 = leftmostEnemy(u.row, u.x);
          if (tg2) { u.t = 0; fireBullet(u, tg2, 'splash'); }
        }
        break;
      case 'resign':
        u.fuse -= dt;
        u.mesh.scale.setScalar(1 + Math.sin(R.time * 22) * 0.08);
        if (u.fuse <= 0) { doResign(u); removeUnit(u, i); break; }
        break;
      case 'busy':
        if (u.armLeft > 0) {
          u.armLeft -= dt;
          if (u.armLeft <= 0) {
            u.armed = true;
            burst(u.x, 0.4, u.z, 0x7ef29a, 10, 2.2);
            floatText(u.x, 1.0, u.z, '进入状态！', 'good');
          }
        }
        break;
      case 'read':
        u.chargeT -= dt;
        if (u.chargeT <= 0 && u.charges > 0) {
          u.charges--; u.chargeT = u.def.rate;
          stunRow(u.row, u.def.stunTime, u);
          ring(u.x, u.z, 0x7fd8ff);
          if (u.charges === 0) floatText(u.x, 1.2, u.z, '已读不回…用完了', 'bad');
        }
        break;
      case 'align':
        if (u.t >= u.def.rate) {
          var es = enemiesInRow(u.row);
          if (es.length) {
            u.t = 0;
            ring(u.x, u.z, 0xffd54a);
            es.forEach(function (e) { hurt(e, u.def.dmg); if (e.hp > 0) { e.slowT = Math.max(e.slowT, u.def.slowTime); e.slowF = u.def.slow; } });
            sfx('shoot');
          }
        }
        break;
    }
  }

  /* 敌人 */
  for (i = S.enemies.length - 1; i >= 0; i--) {
    var e = S.enemies[i];
    e.anim += dt;
    if (e.entering) continue;          /* 入槽动画由下面的独立循环负责 */
    if (e.stun > 0) { e.stun -= dt; }
    else {
      if (e.slowT > 0) e.slowT -= dt;
      var spd = e.def.spd * (e.slowT > 0 ? e.slowF : 1);
      /* 例会：每 10 秒在本格随机空格生成一个普通需求 */
      if (e.def.key === 'regular') {
        e.spawnT -= dt;
        if (e.spawnT <= 0) { e.spawnT = e.def.spawnEvery; spawnEnemy({ type: 'doc', row: e.row, at: e.x + 0.9 }); }
      }
      /* 踩中"假装在忙" → 同归于尽 */
      var trap = trapAt(e);
      if (trap) { detonateTrap(trap, e); continue; }
      /* 遇到我方单位 */
      var block = unitAhead(e);
      if (block) {
        if (e.def.key === 'meeting' && !e.jumped) {
          e.jumped = true; e.hop = 0.55; e.x -= 1.05;
          floatText(e.x, 0.9, e.z, '这个会我跳过～', 'info');
          sfx('hit');
        } else if (e.hop <= 0) {
          e.biting = block;
          block.hp -= BITE_DPS * dt;
          e.chew = (e.chew || 0) + dt;
          if (e.chew > 0.45) { e.chew = 0; sfx('bite'); burst(block.x, 0.5, block.z, 0xdddddd, 2, 1.4); }
          if (block.hp <= 0) {
            burst(block.x, 0.5, block.z, 0xff8a6a, 12, 3);
            floatText(block.x, 1.0, block.z, '被吃掉了！', 'bad');
            removeUnit(block, S.units.indexOf(block));
          }
          continue;
        }
      }
      e.x -= spd * CELL * dt;
      if (e.x <= DESK_HIT_X) { reachDesk(e); continue; }
    }
    if (e.hop > 0) e.hop -= dt;
    /* 动画：位置与朝向 */
    var em = e.mesh;
    em.position.x = e.x;
    var hopY = e.hop > 0 ? Math.sin((1 - e.hop / 0.55) * Math.PI) * 0.9 : 0;
    em.position.y = GROUND_Y + hopY;
    em.position.z = e.z;
    var walking = (!e.biting) && e.stun <= 0;
    em.rotation.y = Math.sin(e.anim * 9) * 0.12 * (walking ? 1 : 0);
    var sq = 1 + Math.sin(e.anim * 10) * 0.03;
    var pk = popK(e.born, R.time);
    em.scale.set(pk, pk * (walking ? sq : 1), pk);
    if (e.biting) em.scale.x = pk * (1 + Math.sin(e.anim * 18) * 0.09);
    /* 血条 */
    if (e.hp < e.maxHp) setHpBar(e);
  }

  /* 子弹 */
  for (i = S.bullets.length - 1; i >= 0; i--) {
    var bl = S.bullets[i];
    bl.x += bl.spd * dt;
    bl.mesh.position.x = bl.x;
    bl.mesh.rotation.x += dt * 9; bl.mesh.rotation.z += dt * 7;
    if (bl.kind === 'splash' && Math.random() < 0.4) {
      spawnParticle(bl.x + (Math.random() - 0.5) * 0.3, 0.45 + Math.random() * 0.2, bl.z, 0x9fe8f2, 0.6, 1.2, 1);
    }
    var hitE = null;
    var es2 = S.enemies;
    for (var j = 0; j < es2.length; j++) {
      var e2 = es2[j];
      if (e2.row !== bl.row || e2.dead) continue;
      if (Math.abs(e2.x - bl.x) < 0.36) { hitE = e2; break; }
    }
    if (hitE) {
      hurt(hitE, bl.dmg);
      if (bl.slow) { hitE.slowT = Math.max(hitE.slowT, bl.slowTime); hitE.slowF = bl.slow; }
      burst(bl.x, 0.5, bl.z, bl.kind === 'splash' ? 0x9fe8f2 : 0xffd0a0, 7, 2.4);
      sfx(bl.kind === 'splash' ? 'splash' : 'hit');
      R.scene.remove(bl.mesh);
      S.bullets.splice(i, 1);
      continue;
    }
    if (bl.x > 7.2) { R.scene.remove(bl.mesh); S.bullets.splice(i, 1); }
  }

  /* 咖啡因掉落 */
  for (i = S.drops.length - 1; i >= 0; i--) {
    var d = S.drops[i];
    d.t += dt;
    d.vy -= 9 * dt;
    d.y += d.vy * dt;
    d.mesh.position.y = d.y;
    d.mesh.rotation.y += dt * 2.4;
    if (d.y <= GROUND_Y + 0.02 && d.vy < 0) {
      d.vy = 0; d.y = GROUND_Y + 0.02;
      d.pick = (d.pick || 0) + dt;
      if (d.pick > 0.55) {
        addCaffeine(ECON.dropAmount);
        sfx('pickup');
        floatText(d.x, 0.9, d.z, '+' + ECON.dropAmount + ' 咖啡因', 'good small');
        burst(d.x, 0.4, d.z, 0xffcf5a, 8, 2);
        R.scene.remove(d.mesh);
        S.drops.splice(i, 1);
      }
    }
  }

  /* 粒子 / 特效 */
  updateParts(dt);
  for (i = S.effects.length - 1; i >= 0; i--) {
    var fx = S.effects[i];
    fx.t += dt;
    if (fx.t >= fx.life) S.effects.splice(i, 1);
  }

  /* 入槽动画中的敌人 */
  for (i = S.enemies.length - 1; i >= 0; i--) {
    var en = S.enemies[i];
    if (en.entering) {
      en.enterT += dt / 0.6;
      var t = Math.min(1, en.enterT);
      en.mesh.position.x = en.x + (en.tx - en.x) * ease(t);
      en.mesh.position.y = GROUND_Y + (en.ty - GROUND_Y) * ease(t);
      en.mesh.position.z = en.z + (en.tz - en.z) * ease(t);
      var sc = Math.max(0.02, 1 - t * 0.92);
      en.mesh.scale.setScalar(sc);
      en.mesh.rotation.y = t * 6;
      if (t >= 1) { removeEnemy(en, i); }
    }
  }

  /* 待结算的入槽（放在逻辑更新里，不依赖表现层） */
  if (S.pendingSlot.length) {
    for (var q = S.pendingSlot.length - 1; q >= 0; q--) {
      S.pendingSlot[q].t -= dt;
      if (S.pendingSlot[q].t <= 0) { var row = S.pendingSlot[q].row; S.pendingSlot.splice(q, 1); resolveSlot(row); }
    }
  }
  /* 老板到位的判定也走游戏内时间 */
  if (S.pendingBoss) {
    S.pendingBoss.t -= dt;
    if (S.pendingBoss.t <= 0) {
      var br = S.pendingBoss.row; S.pendingBoss = null;
      endGame(false, '老板亲自走到了 ' + (br + 1) + ' 号工位前面。');
    }
  }

  syncUI();
}
function ease(t) { return t * t * (3 - 2 * t); }
function popK(born, t) {
  var k = Math.min(1, (t - born) / 0.34), q = k - 1;
  return k >= 1 ? 1 : 1 + 2.0 * q * q * q + 1.3 * q * q;
}

/* ---------- 查询 ---------- */
function leftmostEnemy(row, x) {
  var best = null;
  for (var i = 0; i < S.enemies.length; i++) {
    var e = S.enemies[i];
    if (e.row !== row || e.entering || e.dead) continue;
    if (e.x > x + 0.25 && (!best || e.x < best.x)) best = e;
  }
  return best;
}
function enemiesInRow(row) {
  return S.enemies.filter(function (e) { return e.row === row && !e.entering && !e.dead; });
}
function unitAhead(e) {
  for (var i = 0; i < S.units.length; i++) {
    var u = S.units[i];
    if (u.row !== e.row) continue;
    if (u.x <= e.x + 0.62 && u.x >= e.x - 0.15) return u;
  }
  return null;
}
/* 敌人脚下是否有已武装的"假装在忙" */
function trapAt(e) {
  for (var i = 0; i < S.units.length; i++) {
    var u = S.units[i];
    if (u.def.key !== 'busy' || !u.armed || u.row !== e.row) continue;
    if (Math.abs(u.x - e.x) < 0.55) return u;
  }
  return null;
}
function detonateTrap(u, e) {
  u.armed = false;
  u.armLeft = 999;             // 已触发，不再重复
  sfx('boom');
  burst(u.x, 0.5, u.z, 0xffd54a, 18, 3.4);
  burst(u.x, 0.5, u.z, 0xffffff, 10, 2.6);
  floatText(u.x, 1.1, u.z, '被戳穿了！', 'bad');
  hurt(e, 99999);
  removeUnit(u);
}
function unitAt(col, row) {
  for (var i = 0; i < S.units.length; i++) {
    if (S.units[i].col === col && S.units[i].row === row) return S.units[i];
  }
  return null;
}

/* ---------- 伤害 ---------- */
function hurt(e, dmg) {
  if (e.dead) return;
  e.hp -= dmg;
  if (e.hp <= 0) {
    e.dead = true;
    S.killed++;
    burst(e.x, 0.5, e.z, 0xf4f1e8, 14, 3.2);
    burst(e.x, 0.5, e.z, 0xff9a6a, 8, 2.4);
    sfx('hit');
    R.scene.remove(e.mesh);
    var i = S.enemies.indexOf(e);
    if (i >= 0) S.enemies.splice(i, 1);
    syncUI();
  } else {
    setHpBar(e);
  }
}
function setHpBar(e) {
  if (!e.hpBar) {
    var g = new THREE.Group();
    var bg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.06), new THREE.MeshBasicMaterial({ color: 0x2b3038 }));
    var fg = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.05, 0.07), new THREE.MeshBasicMaterial({ color: 0x67d97a }));
    fg.position.z = 0.01;
    g.add(bg); g.add(fg);
    g.position.y = e.def.key === 'boss' ? 1.55 : 0.75;
    e.mesh.add(g);
    e.hpBar = g; e.hpFill = fg;
  }
  var r = Math.max(0, e.hp / e.maxHp);
  e.hpFill.scale.x = Math.max(0.001, r);
  e.hpFill.position.x = -(0.46 * (1 - r)) / 2;
  e.hpBar.visible = true;
}

/* ---------- 动作 ---------- */
function stunRow(row, time, src) {
  var n = 0;
  S.enemies.forEach(function (e) {
    if (e.row === row && !e.entering) { e.stun = time; e.biting = null; n++; }
  });
  if (n) { sfx('hit'); if (src) floatText(src.x, 1.3, src.z, '已读不回 ×' + n, 'info'); }
}
function ring(x, z, color) {
  var c = color;
  for (var i = 0; i < 14; i++) {
    var a = i / 14 * Math.PI * 2;
    spawnParticle(x + Math.cos(a) * 0.3, 0.3, z + Math.sin(a) * 0.3, c, 0.55, 0, 0,
      Math.cos(a) * 4.2, 1.4, Math.sin(a) * 4.2);
  }
}
function spawnParticle(x, y, z, color, life, size, grav, vx, vy, vz) {
  for (var i = 0; i < R.parts.length; i++) {
    var p = R.parts[i];
    if (p.life > 0) continue;
    p.mesh.visible = true;
    p.mesh.position.set(x, y, z);
    p.mesh.material.color.setHex(color);
    p.mesh.scale.setScalar((size || 1) * 0.8);
    p.life = p.max = life || 0.6;
    p.vx = vx || (Math.random() - 0.5) * 3;
    p.vy = vy || Math.random() * 3 + 0.6;
    p.vz = vz || (Math.random() - 0.5) * 3;
    p.g = grav === undefined ? -7 : grav;
    return;
  }
}
function burst(x, y, z, color, n, speed) {
  for (var i = 0; i < n; i++) spawnParticle(x, y, z, color, 0.45 + Math.random() * 0.35, 0.8 + Math.random() * 0.6, -7,
    (Math.random() - 0.5) * speed * 2, Math.random() * speed + 1, (Math.random() - 0.5) * speed * 2);
}
function updateParts(dt) {
  for (var i = 0; i < R.parts.length; i++) {
    var p = R.parts[i];
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.mesh.visible = false; continue; }
    p.vy += p.g * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    if (p.mesh.position.y < 0.06) { p.mesh.position.y = 0.06; p.vy *= -0.3; p.vx *= 0.7; p.vz *= 0.7; }
    var k = p.life / p.max;
    p.mesh.material.opacity = k;
    p.mesh.rotation.x += dt * 6; p.mesh.rotation.y += dt * 5;
  }
}
S.fxClear = function () {
  R.parts.forEach(function (p) { p.life = 0; p.mesh.visible = false; });
};

/* ---------- 咖啡因 ---------- */
function addCaffeine(n) { S.caffeine += n; }
function spawnDrop() {
  var col = Math.floor(Math.random() * COLS), row = Math.floor(Math.random() * ROWS);
  var m = M_cup();
  m.position.set(gx(col), 7.0, gz(row));
  m.scale.setScalar(0.9);
  R.scene.add(m);
  S.drops.push({ mesh: m, x: gx(col), z: gz(row), y: 7.0, vy: 0, t: 0 });
}

/* ---------- 子弹 ---------- */
function fireBullet(u, target, kind) {
  var m = kind === 'splash' ? M_splash() : M_bullet();
  var x0 = u.x + 0.45;
  m.position.set(x0, 0.62, u.z);
  if (kind === 'splash') m.scale.setScalar(0.9);
  R.scene.add(m);
  S.bullets.push({
    mesh: m, x: x0, row: u.row, kind: kind,
    spd: kind === 'splash' ? 7.5 : 10.5,
    dmg: kind === 'splash' ? u.def.dmg : u.def.dmg,
    slow: kind === 'splash' ? u.def.slow : 0,
    slowTime: kind === 'splash' ? u.def.slowTime : 0
  });
  u.recoil = 1;
  sfx('shoot');
}

/* ---------- 敌人到达工位 / 年假 / 失败 ---------- */
function reachDesk(e) {
  var row = e.row;
  var filled = S.filled[row];
  /* 动画：缩小钻进槽位 */
  var sx = DESK_X - 0.42, sy = (filled < 2 ? 0.60 : 0.76) + 0.12;
  var sz = gz(row) + (filled % 2 ? 0.20 : -0.20);
  e.entering = true; e.enterT = 0;
  e.tx = sx; e.ty = sy; e.tz = sz;
  e.biting = null;
  sfx('slot');

  /* 老板到达 = 立即结束（延迟 0.42s 走游戏内时间，等一下它“走到桌前”的动画） */
  if (e.def.key === 'boss') {
    S.pendingBoss = { t: 0.42, row: row };
    return;
  }

  S.pendingSlot = S.pendingSlot || [];
  S.pendingSlot.push({ row: row, t: 0.6 });
}

function resolveSlot(row) {
  if (S.filled[row] >= ECON.slotCount) {
    /* 已满且年假已用过 → 失败 */
    endGame(false, (row + 1) + ' 号工位的年假已经用完了，工作堆爆。');
    return;
  }
  S.filled[row]++;
  S.slotMeshes[row][S.filled[row] - 1].visible = true;
  if (S.filled[row] >= ECON.slotCount) {
    /* 触发年假 */
    S.leaves[row] = false;
    var killed = 0;
    S.enemies.slice().forEach(function (e) {
      if (e.row === row && !e.entering) { killed++; burst(e.x, 0.5, e.z, 0xffffff, 10, 3); removeEnemy(e); }
    });
    spawnLeave(row);
    sfx('leave');
    floatText(DESK_X - 0.4, 1.6, gz(row), '年假已批准！本行清空（槽位不空）', 'good');
  }
}

function spawnLeave(row) {
  var m = M_leave();
  m.position.set(DESK_X - 0.4, 1.0, gz(row));
  R.scene.add(m);
  S.effects.push({ type: 'leave', mesh: m, row: row, t: 0, life: 2.2, x: DESK_X - 0.4, z: gz(row) });
}

/* ---------- 辞职信 ---------- */
function doResign(u) {
  sfx('fuse');
  var risk = Math.random() < u.def.risk;
  /* 引爆完全走游戏内时间（不用 setTimeout），暂停/加速时表现才一致 */
  sfx('boom');
  for (var i = 0; i < 26; i++) {
    spawnParticle(u.x + (Math.random() - 0.5) * 3, 0.6 + Math.random() * 2, u.z + (Math.random() - 0.5) * 6,
      Math.random() < 0.5 ? 0xffffff : 0xffd54a, 0.9, 1.3, -6);
  }
  ring(u.x, u.z, 0xffffff);
  if (risk) {
    endGame(false, '老板当场批了你的辞职信。');
    return;
  }
  S.enemies.forEach(function (e) { burst(e.x, 0.5, e.z, 0xffffff, 8, 2.6); });
  var all = S.enemies.slice();
  all.forEach(function (e) { removeEnemy(e); });
  banner('全场工作作鸟兽散！', 2.2);
}

/* ---------- 波次 ---------- */
function startWave() {
  S.prep = false;
  S.wave++;
  S.elapsed = 0;
  var w = WAVES[S.wave - 1];
  var q = [];
  w.groups.forEach(function (g) {
    for (var i = 0; i < g.n; i++) q.push({ type: g.t, at: g.off + i * g.g });
  });
  q.sort(function (a, b) { return a.at - b.at; });
  /* 行分配：用步长 2 的轮转把本波敌人均匀铺到 5 个工位上，起点随机。
     这样每波"哪一行吃压力"是可读、可预判的，而不是纯随机堆脸。 */
  var base = Math.floor(Math.random() * ROWS);
  for (var qi = 0; qi < q.length; qi++) q[qi].row = (base + qi * 2) % ROWS;
  S.queue = q;
  S.waveActive = true;
  if (w.big) { banner('⚠ 一大波工作来袭！⚠', 3.2); sfx('warn'); }
  else banner('第 ' + S.wave + ' 波工作到了', 1.8);
  syncUI();
}

function spawnEnemy(item) {
  var def = ENEMY_BY[item.type];
  if (!def) return;
  if (def.key === 'boss' && S.bossAlive) return;   /* 全场最多 1 个老板 */
  if (def.key === 'boss') S.bossAlive = true;
  var row = (item.row == null) ? Math.floor(Math.random() * ROWS) : item.row;
  var m = MODEL_FN[def.key]();
  var x = SPAWN_X + Math.random() * 0.5;
  m.position.set(x, GROUND_Y, gz(row));
  m.rotation.y = -Math.PI / 2;   /* 面向左，正在走来 */
  R.scene.add(m);
  var e = {
    def: def, row: row, x: x, z: gz(row), hp: def.hp, maxHp: def.hp,
    mesh: m, anim: Math.random() * 6, slowT: 0, slowF: 1, stun: 0, born: R.time,
    jumped: false, hop: 0, biting: null, spawnT: def.spawnEvery || 0, entering: false, dead: false
  };
  m.userData.e = e;
  S.enemies.push(e);
  if (def.key === 'boss') { banner('老板下场了！拦住他！', 2.4); sfx('warn'); }
}

var ENEMY_BY = {};
ENEMIES.forEach(function (e) { ENEMY_BY[e.key] = e; });

function removeEnemy(e) {
  if (e.mesh && e.mesh.parent) R.scene.remove(e.mesh);
  var k = S.enemies.indexOf(e);
  if (k >= 0) S.enemies.splice(k, 1);
  if (e.def.key === 'boss') S.bossAlive = false;
}
function removeUnit(u, i) {
  if (u.mesh && u.mesh.parent) R.scene.remove(u.mesh);
  var k = S.units.indexOf(u);
  if (k >= 0) S.units.splice(k, 1);
  R.cellHi.visible = false;
}

/* ---------- 结算 ---------- */
function endGame(win, reason) {
  if (S.state === 'over') return;
  S.state = 'over';
  S.paused = false;
  if (win) sfx('win'); else sfx('lose');
  var left = S.leaves.filter(Boolean).length;
  var q = QUOTES_BAD;
  if (win) q = QUOTES_GOOD;
  else if (S.killed > 40) q = QUOTES_MID;
  var quote = q[Math.floor(Math.random() * q.length)];
  showScreen('result', {
    reason: reason, quote: quote, killed: S.killed,
    caffeine: S.caffeine, leaves: left, wave: S.wave, win: win
  });
  syncUI();
}

/* ============================================================
 *  世界动画（与逻辑无关的表现）
 * ============================================================ */
function animateWorld(t, dt) {
  var i;
  /* 单位待机 */
  for (i = 0; i < S.units.length; i++) {
    var u = S.units[i];
    var g = u.mesh;
    g.position.y = GROUND_Y + Math.sin(t * 2 + u.col * 0.7) * 0.012;
    /* 落位弹出动画（easeOutBack） */
    var k = Math.min(1, (t - u.born) / 0.32);
    var q = k - 1;
    g.scale.setScalar(1 + 2.0 * q * q * q + 1.3 * q * q);
    if (u.recoil > 0) { u.recoil = Math.max(0, u.recoil - dt * 5); g.position.x = u.x - u.recoil * 0.09; }
    else g.position.x = u.x;
    animateParts(g, t, u.col * 1.3);
    if (u.def.key === 'busy') {
      var s = g.userData.parts.screen;
      if (s) s.position.y = 0.24 + Math.sin(t * 6 + u.col) * 0.012;
    }
    if (u.def.key === 'resign') {
      var f = g.userData.parts.fuse;
      if (f) f.scale.setScalar(1 + Math.sin(t * 26) * 0.5);
    }
  }
  /* 敌人待机 */
  for (i = 0; i < S.enemies.length; i++) {
    var e = S.enemies[i];
    if (e.entering) continue;
    animateParts(e.mesh, t + e.anim, e.anim);
    if (e.def.key === 'boss') {
      var s2 = Math.sin(t * 3) * 0.03;
      e.mesh.scale.multiplyScalar(1 + s2);
    }
  }
  /* 特效 */
  for (i = S.effects.length - 1; i >= 0; i--) {
    var fx = S.effects[i];
    if (fx.type === 'leave') {
      fx.mesh.position.y = 1.0 + fx.t * 1.2;
      fx.mesh.rotation.y += 0.06;
      fx.mesh.rotation.z = Math.sin(fx.t * 6) * 0.3;
      var k = fx.t / fx.life;
      fx.mesh.scale.setScalar(1 + k * 0.6);
      if (fx.t >= fx.life) { R.scene.remove(fx.mesh); S.effects.splice(i, 1); }
    }
  }
}

function animateParts(g, t, ph) {
  var ps = g.userData.parts;
  if (!ps) return;
  if (ps.steam) { ps.steam.position.y = Math.sin(t * 2.2 + ph) * 0.06; ps.steam.scale.setScalar(0.9 + Math.sin(t * 2.6 + ph) * 0.12); }
  if (ps.fish) { ps.fish.position.x = 0.12 + Math.sin(t * 1.6 + ph) * 0.14; ps.fish.rotation.z = Math.sin(t * 4 + ph) * 0.25; }
  if (ps.fish2) { ps.fish2.position.z = -0.12 + Math.cos(t * 1.3 + ph) * 0.1; }
  if (ps.bubble) { ps.bubble.position.y = 0.28 + ((t * 0.3 + ph) % 0.6); }
  if (ps.fuse) { ps.fuse.rotation.y += 0.1; }
  if (ps.flame) { var f = 1 + Math.sin(t * 18 + ph) * 0.25; ps.flame.scale.set(f, f * 1.15, f); ps.flame.position.y = 0.34 + Math.sin(t * 12) * 0.04; }
  if (ps.flame2) { var f2 = 0.8 + Math.sin(t * 21 + ph) * 0.3; ps.flame2.scale.set(f2, f2, f2); }
  if (ps.spin) { ps.spin.rotation.y += 0.06; }
  if (ps.clock) { ps.clock.position.y = 0.86 + Math.sin(t * 2 + ph) * 0.04; }
  if (ps.bubble1) { ps.bubble1.position.y = 1.22 + Math.sin(t * 2 + ph) * 0.07; ps.bubble1.scale.setScalar(0.9 + Math.sin(t * 3) * 0.1); }
  if (ps.bubble2) { ps.bubble2.position.y = 1.44 + Math.sin(t * 2 + ph + 1.4) * 0.06; }
}

/* ============================================================
 *  交互：拖拽种植 / 铲子 / 卡片
 * ============================================================ */
var drag = null;      // {mode:'plant'|'shovel', key, ghost}
var selected = null;  // 点击模式下选中的卡片

function bindUI() {
  var bar = document.getElementById('cards');
  UI.cardEls = [];
  UNITS.forEach(function (u) {
    var el = document.createElement('div');
    el.className = 'card';
    el.dataset.key = u.key;
    var ic = document.createElement('canvas');
    ic.className = 'card-icon'; ic.width = 128; ic.height = 128;
    var nm = document.createElement('div'); nm.className = 'card-name'; nm.textContent = u.name;
    var cs = document.createElement('div'); cs.className = 'card-cost'; cs.textContent = '☕' + u.cost;
    el.appendChild(ic); el.appendChild(nm); el.appendChild(cs);
    u.iconCanvas = ic;
    bar.appendChild(el);
    UI.cardEls.push({ el: el, def: u, icon: ic });

    el.addEventListener('pointerenter', function () {
      el._tipTimer = setTimeout(function () { showTip(u, el); }, 500);
    });
    el.addEventListener('pointerleave', hideTip);
    el.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      hideTip();
      startDrag('plant', u, ev);
    });
  });

  /* 铲子 */
  var sh = document.getElementById('shovel');
  sh.addEventListener('pointerenter', function () {
    sh._tipTimer = setTimeout(function () { showShovelTip(sh); }, 500);
  });
  sh.addEventListener('pointerleave', hideTip);
  sh.addEventListener('pointerdown', function (ev) {
    ev.preventDefault(); hideTip();
    startDrag('shovel', null, ev);
  });

  /* 画布指针 */
  var cv = document.getElementById('stage');
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  document.getElementById('btn-pause').onclick = function () { togglePause(); };
  document.getElementById('btn-speed').onclick = function () {
    S.speed = S.speed === 1 ? 2 : 1;
    this.textContent = '⏩×' + S.speed;
    sfx('ui');
  };
  document.getElementById('btn-restart').onclick = function () { sfx('ui'); newGame(); };
  document.getElementById('btn-codex').onclick = function () {
    sfx('ui');
    S.paused = true;              /* 看图鉴时游戏暂停，别一边读一边被偷 */
    showScreen('codex');
  };
  document.getElementById('btn-codex2').onclick = function () { sfx('ui'); showScreen('codex'); };
  document.getElementById('btn-resume').onclick = function () { hideScreens(); S.state = 'play'; };
  document.getElementById('btn-start').onclick = function () {
    audioResume(); sfx('ui'); bgmStart();
    newGame();
  };
  document.getElementById('btn-again').onclick = function () { sfx('ui'); newGame(); };
  document.getElementById('btn-menu').onclick = function () { sfx('ui'); newGame(true); showScreen('menu'); };
  document.getElementById('btn-codex-back').onclick = function () {
    sfx('ui');
    S.paused = false;
    if (S.state === 'play') hideScreens(); else showScreen('menu');
  };
  document.getElementById('btn-quit').onclick = function () { sfx('ui'); newGame(true); showScreen('menu'); };
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (S.state === 'play') { if (drag) cancelDrag(); else togglePause(); }
      else if (S.state === 'paused') togglePause();
    }
    if (e.key === ' ') { e.preventDefault(); if (S.state === 'play') togglePause(); }
  });
}

/* ---------- 拖拽 ---------- */
function startDrag(mode, def, ev) {
  if (S.state !== 'play') return;
  drag = { mode: mode, def: def, x: ev.clientX, y: ev.clientY, moved: false, t0: performance.now(), target: null };
  if (mode === 'plant') {
    buildGhost(def);
    drag.ghost = R.ghost;
  } else {
    R.shovel.visible = true;
    drag.ghost = R.shovel;
  }
  document.body.classList.add('dragging-' + mode);
  sfx('ui');
  onMove(ev);
}

function buildGhost(def) {
  R.ghost.clear();
  var m = MODEL_FN[def.key]();
  m.traverse(function (o) {
    if (o.isMesh) {
      o.material = new THREE.MeshLambertMaterial({
        vertexColors: true, transparent: true, opacity: 0.5, depthWrite: false
      });
      o.castShadow = false; o.receiveShadow = false;
    }
  });
  R.ghost.add(m);
  R.ghost.visible = true;
}

function onMove(ev) {
  if (!drag) { hoverCheck(ev); return; }
  drag.moved = drag.moved || (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y)) > 6;
  drag.x = ev.clientX; drag.y = ev.clientY;
  var hit = pickCell(ev);
  if (drag.mode === 'plant') {
    var def = drag.def;
    var ok = hit && canPlace(def, hit.col, hit.row) && S.caffeine >= def.cost && S.cooldowns[def.key] <= 0;
    var gx3 = hit ? gx(hit.col) : 0, gz3 = hit ? gz(hit.row) : 0;
    drag.ghost.position.set(gx3, GROUND_Y + 0.06, gz3);
    drag.ghost.rotation.y = Math.PI / 2;
    R.cellHi.visible = !!hit && ok;
    R.cellBad.visible = !!hit && !ok;
    if (hit) { R.cellHi.position.set(gx3, GROUND_Y + 0.02, gz3); R.cellBad.position.set(gx3, GROUND_Y + 0.02, gz3); }
  } else {
    var u = pickUnitAt(ev);
    if (u) {
      drag.target = u;
      drag.ghost.position.set(u.x, GROUND_Y + 0.7, u.z);
      R.cellBad.visible = true; R.cellBad.position.set(u.x, GROUND_Y + 0.02, u.z);
      R.cellBad.material.color.setHex(0xff5a4a);
    } else {
      drag.target = null;
      var p = pickCell(ev);
      if (p) { drag.ghost.position.set(gx(p.col), GROUND_Y + 0.7, gz(p.row)); }
      R.cellBad.visible = false;
    }
  }
}

function onUp(ev) {
  /* 没有拖拽时：若处于"选中卡片"状态，点击格子即放置（点击模式） */
  if (!drag) {
    if (selected && S.state === 'play') {
      var c = pickCell(ev);
      if (c) {
        var d0 = UNITS.filter(function (x) { return x.key === selected; })[0];
        if (d0) { tryPlace(d0, c.col, c.row); selected = null; syncUI(); }
      }
    }
    return;
  }
  var d = drag; drag = null;
  document.body.classList.remove('dragging-plant', 'dragging-shovel');
  R.cellHi.visible = false; R.cellBad.visible = false;
  R.ghost.visible = false; R.shovel.visible = false;

  if (d.mode === 'plant') {
    var hit = pickCell(ev);
    if (d.moved) {
      if (hit) tryPlace(d.def, hit.col, hit.row);
    } else {
      /* 点击模式：选中卡片，再点格子 */
      selected = (selected === d.def.key) ? null : d.def.key;
      syncUI();
    }
    return;
  }
  /* 铲子 */
  if (d.target) {
    var u = d.target;
    burst(u.x, 0.5, u.z, 0xff9a6a, 12, 3);
    removeUnit(u);
    sfx('shovel');
    floatText(u.x, 1.0, u.z, '已铲除', 'bad');
  } else if (!d.moved) {
    /* 铲子未拖拽的点击模式：点单位铲除 */
    var uu = pickUnitAt(ev);
    if (uu) { burst(uu.x, 0.5, uu.z, 0xff9a6a, 12, 3); removeUnit(uu); sfx('shovel'); }
  }
}
function cancelDrag() { drag = null; R.ghost.visible = false; R.shovel.visible = false; R.cellHi.visible = false; R.cellBad.visible = false; document.body.classList.remove('dragging-plant', 'dragging-shovel'); }

/* 未拖拽时的悬停：显示可铲除的高亮 */
function hoverCheck(ev) {
  if (S.state !== 'play') return;
  var u = pickUnitAt(ev);
  R.cellBad.visible = !!u;
  if (u) R.cellBad.position.set(u.x, GROUND_Y + 0.02, u.z);
  var st = document.getElementById('stage');
  st.style.cursor = u ? 'pointer' : 'default';
}

function canPlace(def, col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
  if (unitAt(col, row)) return false;
  return true;
}

function tryPlace(def, col, row) {
  if (S.state !== 'play') return;
  if (!canPlace(def, col, row)) { sfx('deny'); floatText(gx(col), 1.0, gz(row), '这里放不下', 'bad'); return; }
  if (S.caffeine < def.cost) { sfx('deny'); floatText(gx(col), 1.0, gz(row), '咖啡因不够', 'bad'); return; }
  if (S.cooldowns[def.key] > 0) { sfx('deny'); return; }
  S.caffeine -= def.cost;
  S.cooldowns[def.key] = def.cd;
  var m = MODEL_FN[def.key]();
  var x = gx(col), z = gz(row);
  m.position.set(x, GROUND_Y, z);
  m.rotation.y = 0;
  m.scale.setScalar(0.01);
  R.scene.add(m);
  var u = {
    born: R.time,
    def: def, col: col, row: row, x: x, z: z, hp: def.hp, maxHp: def.hp,
    mesh: m, t: 0, cooldown: def.cd, armLeft: def.arm || 0, armed: false,
    charges: def.charges || 0, chargeT: 0, fuse: def.fuse || 0, recoil: 0
  };
  m.userData.unit = u;
  if (def.key === 'read') { u.chargeT = 1.2; }
  S.units.push(u);
  burst(x, 0.3, z, 0xffffff, 10, 2.4);
  sfx('plant');
  syncUI();
}

/* ---------- 射线拾取 ---------- */
function setNdc(ev) {
  var cv = R.renderer.domElement;
  var r = cv.getBoundingClientRect();
  R.ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
  R.ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
}
function pickCell(ev) {
  setNdc(ev);
  R.ray.setFromCamera(R.ndc, R.camera);
  var p = new THREE.Vector3();
  if (!R.ray.ray.intersectPlane(R.plane, p)) return null;
  var col = colOf(p.x), row = rowOf(p.z);
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
  return { col: col, row: row };
}
/* 拾取单位：直接用地面格子定位（比射线更宽容，不会漏点） */
function pickUnitAt(ev) {
  var hit = pickCell(ev);
  if (!hit) return null;
  var u = unitAt(hit.col, hit.row);
  if (u) return u;
  /* 相邻格也找一下（模型可能略微超出格子） */
  var cand = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (var i = 0; i < cand.length; i++) {
    var v = unitAt(hit.col + cand[i][0], hit.row + cand[i][1]);
    if (v) return v;
  }
  return null;
}

/* ============================================================
 *  UI 同步
 * ============================================================ */
function syncUI() {
  var caf = document.getElementById('caffeine');
  caf.textContent = Math.floor(S.caffeine);
  caf.parentNode.classList.toggle('poor', S.caffeine < 50);

  /* 卡片可用态 */
  UI.cardEls.forEach(function (c) {
    var afford = S.caffeine >= c.def.cost;
    var ready = S.cooldowns[c.def.key] <= 0;
    c.el.classList.toggle('disabled', !afford || !ready);
    c.el.classList.toggle('sel', selected === c.def.key);
    if (!ready) {
      var k = S.cooldowns[c.def.key] / c.def.cd;
      c.el.style.setProperty('--cd', (k * 100).toFixed(1) + '%');
    } else c.el.style.setProperty('--cd', '0%');
  });

  /* 波次进度 */
  var label = document.getElementById('wave-label');
  var bar = document.getElementById('wave-bar');
  var wn = S.wave;
  label.textContent = S.prep && wn === 0 ? '准备中' : ('第 ' + Math.max(1, wn) + ' / ' + TOTAL_WAVES + ' 波');
  var frac = S.prep ? 0 : (1 - S.queue.length / Math.max(1, totalQueue()));
  bar.style.width = ((wn - (S.prep ? 1 : 0) + (S.prep ? 0 : frac)) / TOTAL_WAVES * 100).toFixed(1) + '%';
  document.getElementById('wave-num').textContent = wn;

  /* 槽位指示 */
  for (var r = 0; r < ROWS; r++) {
    var el = document.getElementById('slots-' + r);
    if (!el) continue;
    var s = '';
    for (var i = 0; i < ECON.slotCount; i++) s += '<i class="' + (i < S.filled[r] ? 'on' : '') + '"></i>';
    el.innerHTML = s + (S.leaves[r] ? '<b>还有年假</b>' : '<b class="used">年假已用</b>');
  }
}
function totalQueue() {
  var w = WAVES[Math.max(0, S.wave - 1)];
  if (!w) return 1;
  var n = 0;
  w.groups.forEach(function (g) { n += g.n; });
  return Math.max(1, n);
}

/* ---------- 提示 / 横幅 / 浮动文字 ---------- */
var tipTimer = null;
function showTip(def, el) {
  var t = document.getElementById('tooltip');
  var ic = document.createElement('canvas'); ic.width = 64; ic.height = 64; ic.className = 'tip-icon';
  drawThumbTo(def.key, ic);
  t.innerHTML = '';
  t.appendChild(ic);
  var d = document.createElement('div');
  d.innerHTML = '<h4>' + def.name + '<span>☕' + def.cost + ' · 冷却 ' + def.cd + 's</span></h4>' +
    '<p>' + def.desc + '</p><p class="tip-t">' + def.tip + '</p>';
  t.appendChild(d);
  t.classList.add('show');
  var r = el.getBoundingClientRect();
  t.style.left = Math.min(window.innerWidth - 330, r.left + r.width / 2 - 160) + 'px';
  t.style.top = (r.top - 12) + 'px';
}
function showShovelTip(el) {
  var t = document.getElementById('tooltip');
  t.innerHTML = '<div><h4>铲子<span>免费</span></h4><p>把铲子拖到已布置的单位上（或先点铲子再点单位），即可铲除并清空该格。</p></div>';
  t.classList.add('show');
  var r = el.getBoundingClientRect();
  t.style.left = Math.min(window.innerWidth - 330, r.left - 120) + 'px';
  t.style.top = (r.top - 12) + 'px';
}
function hideTip() {
  document.getElementById('tooltip').classList.remove('show');
}

function banner(text, dur) {
  var b = document.getElementById('banner');
  b.textContent = text;
  b.classList.add('show');
  clearTimeout(b._t);
  b._t = setTimeout(function () { b.classList.remove('show'); }, dur * 1000);
}

var floats = [];
function floatText(x, y, z, text, cls) {
  /* 浮动文字做上限，避免咖啡机一多就糊成一片（超过就把最老的挤掉） */
  while (floats.length >= 16) {
    var old = floats.shift();
    if (old.el.parentNode) old.el.parentNode.removeChild(old.el);
  }
  var el = document.createElement('div');
  el.className = 'float ' + (cls || '');
  el.textContent = text;
  UI.float.appendChild(el);
  floats.push({ el: el, pos: new THREE.Vector3(x, y, z), t: 0, life: 1.25 });
}
function updateFloats() {
  for (var i = floats.length - 1; i >= 0; i--) {
    var f = floats[i];
    f.t += 0.016;
    var v = f.pos.clone();
    v.y += f.t * 0.9;
    v.project(R.camera);
    var x = (v.x * 0.5 + 0.5) * 1280, y = (-v.y * 0.5 + 0.5) * 720;
    f.el.style.transform = 'translate(-50%,-50%) translate(' + x + 'px,' + y + 'px)';
    f.el.style.opacity = Math.max(0, 1 - f.t / f.life);
    if (f.t >= f.life) { f.el.remove(); floats.splice(i, 1); }
  }
}

function togglePause() {
  if (S.state === 'play') { S.state = 'paused'; showScreen('pause'); }
  else if (S.state === 'paused') { S.state = 'play'; hideScreens(); }
}

/* ---------- 界面切换 ---------- */
function showScreen(name, data) {
  var all = document.querySelectorAll('.screen');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('show');
  var el = document.getElementById('scr-' + name);
  if (el) el.classList.add('show');
  document.getElementById('hud').classList.toggle('dim', name !== 'none');
  if (name === 'result') fillResult(data);
  if (name === 'codex') S._prevState = S.state;
}
function hideScreens() {
  var all = document.querySelectorAll('.screen');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('show');
  document.getElementById('hud').classList.remove('dim');
}
function fillResult(d) {
  d = d || {};
  var win = !!d.win;
  document.getElementById('res-title').textContent = win ? '守住了！组里活下来了' : '你被优化了';
  document.getElementById('res-reason').textContent = win
    ? '12 波工作全部拦下，工位没有爆。老板没抓到把柄。' : (d.reason || '工位沦陷。');
  document.getElementById('res-stats').innerHTML =
    '<div><b>' + (d.killed || 0) + '</b><span>消灭工作</span></div>' +
    '<div><b>' + Math.floor(d.caffeine || 0) + '</b><span>剩余咖啡因</span></div>' +
    '<div><b>' + (d.leaves || 0) + '</b><span>剩余年假</span></div>' +
    '<div><b>' + (d.wave || 0) + '</b><span>撑到第几波</span></div>';
  document.getElementById('res-quote').innerHTML = '<b>打工人评价：</b>' + (d.quote || '');
  document.getElementById('res-skin').className = 'res ' + (win ? 'win' : 'lose');
}

/* ============================================================
 *  卡片缩略图：用同一套体素模型离屏渲染
 * ============================================================ */
var thumbCache = {};
function makeIcons() {
  var cv = R.renderer.domElement;
  var oldW = cv.width, oldH = cv.height;
  var sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xffffff, 0xb0a08a, 0.9));
  var l = new THREE.DirectionalLight(0xfff4e2, 1.1); l.position.set(4, 7, 6); sc.add(l);
  var l2 = new THREE.DirectionalLight(0xcfe4ff, 0.35); l2.position.set(-5, 4, -4); sc.add(l2);
  var cam = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  var holder = new THREE.Group(); sc.add(holder);

  var keys = Object.keys(MODEL_FN);
  R.renderer.setSize(160, 160, false);
  for (var i = 0; i < keys.length; i++) {
    holder.clear();
    var m = MODEL_FN[keys[i]]();
    m.rotation.y = Math.PI * 0.28;
    holder.add(m);
    var box = new THREE.Box3().setFromObject(m);
    var ctr = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var rad = Math.max(size.x, size.y, size.z) * 0.72 + 0.25;
    cam.position.set(ctr.x + rad * 0.9, ctr.y + rad * 0.95, ctr.z + rad * 1.25);
    cam.lookAt(ctr.x, ctr.y, ctr.z);
    R.renderer.render(sc, cam);
    /* 直接把 WebGL 画面拷进一张离屏 2D 画布（运行时生成，不落地、不外链） */
    var keep = document.createElement('canvas');
    keep.width = 160; keep.height = 160;
    keep.getContext('2d').drawImage(cv, 0, 0, 160, 160, 0, 0, 160, 160);
    thumbCache[keys[i]] = keep;
  }
  holder.clear();
  R.renderer.setSize(oldW, oldH, false);
  R.renderer.setClearColor(0xf3efe6);
  document.getElementById('gl').width = oldW;
  document.getElementById('gl').height = oldH;

  /* 填卡片与图鉴 */
  UI.cardEls.forEach(function (c) {
    c.el.querySelectorAll('canvas.card-icon').forEach(function (n) { n.remove(); });
    var cvv = document.createElement('canvas');
    cvv.className = 'card-icon'; cvv.width = 160; cvv.height = 160;
    var src = thumbCache[c.def.key];
    if (src) cvv.getContext('2d').drawImage(src, 0, 0);
    c.el.insertBefore(cvv, c.el.firstChild);
  });
  fillCodexIcons();
}

function drawThumbTo(key, canvas) {
  var src = thumbCache[key];
  if (src) canvas.getContext('2d').drawImage(src, 0, 0, 160, 160, 0, 0, canvas.width, canvas.height);
}

/* 图鉴里的所有缩略图 */
function fillCodexIcons() {
  var list = document.querySelectorAll('.cx-ic');
  for (var i = 0; i < list.length; i++) drawThumbTo(list[i].dataset.key, list[i]);
}

/* ============================================================
 *  启动
 * ============================================================ */
window.addEventListener('load', function () {
  try {
    initGame();
  } catch (e) {
    document.getElementById('err').style.display = 'block';
    document.getElementById('err').textContent = '初始化失败：' + e.message;
    if (window.console) console.error(e);
  }
});