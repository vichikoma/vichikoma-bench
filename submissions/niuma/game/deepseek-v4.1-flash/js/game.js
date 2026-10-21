/* =============================================================================
 * game.js — 主逻辑：场景搭建 / 单位与敌人 / 弹幕 / 波次 / 槽位与年假 / 胜负
 * ===========================================================================*/
(function (global) {
  'use strict';
  var G = CFG.GRID, P = Vox.PAL, M = CFG.MISC;
  var ROWS = G.ROWS, COLS = G.COLS;

  // ------------------------------------------------------------------ 全局状态
  var renderer, scene, camera, camTarget, cameraRig;
  var state = 'menu';                 // menu | playing | over
  var paused = false, speedMul = 1;
  var caf = 0, kills = 0, cafRate = 0;
  var units = [], enemies = [], projs = [], pickups = [];
  var slots = [0, 0, 0, 0, 0], leaveUsed = [false, false, false, false, false];
  var sweeps = [null, null, null, null, null];
  var cds = {};
  var gameTime = 0, dtAcc = 0;
  var clock = null, lastTs = 0, fpsAcc = 0, fpsFrames = 0, fpsVal = 0;
  var dropTimer = 0;
  var waveIndex = 0, waveState = 'idle', waveTimer = 0, spawnList = [], spawnCursor = 0;
  var bossWaiting = null;
  var rowBag = [], lastRow = -1;
  var shakeT = 0, shakeAmp = 0;
  var trays = [], workers = [], hlFrame = null, hlQuad = null;
  var matOK, matBad;
  var drag = null, shovelOn = false, selectedCard = null, shovelDrag = null, restartDisarm = null;
  var _ray, _plane, _hit, _ndc;
  var CAM_Y = 0, camTargetBaseY = 0, CAM_Z = 0, camTargetBaseZ = 0;

  // ------------------------------------------------------------------ 初始化
  function init() {
    var canvas = document.getElementById('game');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(1280, 720, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a3038);

    camera = new THREE.PerspectiveCamera(36, 1280 / 720, 0.1, 140);
    camTarget = new THREE.Vector3(0, 1.0, -0.2);
    var pitch = 43 * Math.PI / 180;
    camera.position.set(0, camTarget.y + Math.sin(pitch) * 14.6, camTarget.z + Math.cos(pitch) * 14.6);
    camera.lookAt(camTarget);

    matOK = new THREE.MeshBasicMaterial({ color: 0x8cf0b0 });
    matBad = new THREE.MeshBasicMaterial({ color: 0xff6a52 });
    buildLights();
    buildRoom();
    buildGrid();
    buildWorkstations();
    buildBossOffice();
    buildDecor();
    buildParticles();
    buildHighlight();
    buildProjGeos();

    _ray = new THREE.Raycaster();
    _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    _hit = new THREE.Vector3();
    _ndc = new THREE.Vector2();

    clock = new THREE.Clock();
    bindInput();
    lastTs = performance.now();
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------------ 光照
  var sun;
  function buildLights() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.30));
    var hemi = new THREE.HemisphereLight(0xdff0ff, 0x6b6350, 0.34);
    scene.add(hemi);
    sun = new THREE.DirectionalLight(0xfff2dc, 0.55);
    sun.position.set(-13, 21, 15);
    sun.target.position.set(0, 0, 0);
    scene.add(sun); scene.add(sun.target);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    var c = sun.shadow.camera;
    c.left = -15; c.right = 15; c.top = 14; c.bottom = -14; c.near = 4; c.far = 60;
    sun.shadow.bias = -0.0009;
    sun.shadow.normalBias = 0.022;
    // 氛围点光
    var p1 = new THREE.PointLight(0xffd9a0, 0.30, 22, 2); p1.position.set(-5, 3.4, 2.5); scene.add(p1);
    var p2 = new THREE.PointLight(0x9fd8ff, 0.22, 24, 2); p2.position.set(6.5, 3.2, -1.5); scene.add(p2);
  }

  // ------------------------------------------------------------------ 办公室
  function buildRoom() {
    var b = new Vox.Builder();
    // 大地板
    b.box(0, -0.24, 0.5, 30, 0.5, 24, 0x5d6673, {});
    b.box(0, -0.02, 0.5, 29, 0.06, 23, 0x707a88, {});
    // 地胶质感的浅色走廊（右半边）
    b.box(7.4, 0.02, 0.4, 12.6, 0.04, 14, 0x8a9099, {});
    var floor = new THREE.Mesh(b.geo(), Vox.MATS.solid);
    floor.receiveShadow = true;
    scene.add(floor);

    var w = new Vox.Builder();
    // 后墙（带窗）
    w.box(1, 2.2, -5.4, 30, 4.4, 0.3, P.wall, {});
    w.box(1, 4.5, -5.4, 30, 0.3, 0.5, P.wallD, {});
    for (var i = 0; i < 6; i++) {
      var x = -8.5 + i * 3.4;
      w.box(x, 2.55, -5.2, 2.5, 1.9, 0.08, 0x1d2630, {});
      w.box(x, 2.55, -5.15, 2.3, 1.7, 0.06, 0x9fdcf2, { shade: false });
      w.box(x, 3.55, -5.2, 2.7, 0.16, 0.16, P.steel, {});
      w.box(x, 1.55, -5.2, 2.7, 0.16, 0.16, P.steel, {});
      w.box(x, 2.55, -5.2, 0.14, 2.2, 0.14, P.steel, {});
    }
    // 左墙
    w.box(-9.6, 2.2, 0, 0.3, 4.4, 18, P.wallD, {});
    // 踢脚线
    w.box(1, 0.12, -5.2, 30, 0.24, 0.2, P.wallD, {});
    var walls = new THREE.Mesh(w.geo(), Vox.MATS.solid);
    walls.receiveShadow = true;
    scene.add(walls);

    // 顶部天花：只保留靠后的一段（相机在半俯视位置，前面不能有天花板遮挡视线）
    var c = new Vox.Builder();
    c.box(1, 4.7, -4.6, 30, 0.3, 3.0, P.ceiling, {});
    c.box(1, 4.42, -5.9, 30, 0.5, 0.3, P.wallD, {});
    for (var k = 0; k < 7; k++) {
      c.box(-9 + k * 3.4, 4.15, -4.6, 1.5, 0.14, 0.4, 0xfff4d8, { shade: false });
    }
    var ceil = new THREE.Mesh(c.geo(), Vox.MATS.solid);
    scene.add(ceil);
  }

  // ------------------------------------------------------------------ 作战网格
  function buildGrid() {
    var t = new Vox.Builder(), line = new Vox.Builder();
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = G.colX(c), z = G.rowZ(r);
        var col = ((r + c) % 2 === 0) ? P.carpetA : P.carpetB;
        t.box(x, 0.03, z, 0.94, 0.06, 0.94, col, { topLight: true });
        t.box(x, 0.02, z, 1.0, 0.05, 1.0, P.carpetLine, { dark: 0.05 });
      }
    }
    // 边框（加粗，让格子边界清楚）
    for (var i = 0; i <= COLS; i++) {
      line.box(-4.5 + i, 0.075, 0, 0.05, 0.03, 5.06, 0x3f7a5f, { shade: false });
    }
    for (var j = 0; j <= ROWS; j++) {
      line.box(0, 0.075, -2.5 + j, 9.06, 0.03, 0.05, 0x3f7a5f, { shade: false });
    }
    var g1 = new THREE.Mesh(t.geo(), Vox.MATS.solid);
    g1.receiveShadow = true;
    scene.add(g1);
    var g2 = new THREE.Mesh(line.geo(), Vox.MATS.solid);
    scene.add(g2);
    // 网格两侧压条，强化“办公区格子”的感觉
    var e = new Vox.Builder();
    e.box(-4.62, 0.09, 0, 0.16, 0.14, 5.5, P.woodD, {});
    e.box(4.62, 0.09, 0, 0.16, 0.14, 5.5, P.woodD, {});
    scene.add(new THREE.Mesh(e.geo(), Vox.MATS.solid));
  }

  // ------------------------------------------------------------------ 工位
  function buildWorkstations() {
    scene.add(VoxModel.instantiate('prop_desk'));
    var rack = new Vox.Builder();
    for (var r = 0; r < ROWS; r++) {
      var z = G.rowZ(r);
      // 立柱 + 四层托盘架
      rack.box(-6.02, 1.35, z - 0.28, 0.1, 2.5, 0.1, P.steelD, {});
      rack.box(-6.02, 1.35, z + 0.28, 0.1, 2.5, 0.1, P.steelD, {});
      rack.box(-6.02, 2.55, z, 0.16, 0.12, 0.72, P.steel, { topLight: true });
      rack.box(-6.02, 0.12, z, 0.22, 0.24, 0.72, P.dark, {});
      var gear = VoxModel.instantiate('prop_gear');
      gear.position.z = z; scene.add(gear);
      var wk = VoxModel.instantiate('prop_worker_' + r);
      wk.position.set(-6.32, 0, z);
      scene.add(wk);
      workers.push({ g: wk, parts: wk.userData.parts, panic: 0, row: r, cheer: 0 });
      // 4 个槽位托盘
      var rowTrays = [];
      for (var i = 0; i < M.SLOTS_PER_DESK; i++) {
        var tr = VoxModel.instantiate('prop_tray');
        tr.position.set(-6.02, 1.16 + i * 0.36, z);
        tr.userData.parts.full.visible = false;
        scene.add(tr);
        rowTrays.push(tr);
      }
      trays.push(rowTrays);
    }
    scene.add(new THREE.Mesh(rack.geo(), Vox.MATS.solid));
  }

  // ------------------------------------------------------------------ 老板办公室
  function buildBossOffice() {
    scene.add(VoxModel.instantiate('prop_bossroom'));
    // 门牌
    var b = new Vox.Builder();
    b.box(5.62, 2.5, -2.5, 0.1, 0.5, 1.9, P.red, {});
    b.box(5.56, 2.52, -2.5, 0.06, 0.3, 1.5, P.cream, { shade: false });
    b.box(5.62, 2.9, -2.5, 0.05, 0.2, 2.3, P.dark, {});
    scene.add(new THREE.Mesh(b.geo(), Vox.MATS.solid));
  }

  // ------------------------------------------------------------------ 陈设
  function buildDecor() {
    function put(name, x, z, ry) {
      var o = VoxModel.instantiate(name);
      o.position.set(x, 0, z);
      if (ry) o.rotation.y = ry;
      scene.add(o);
      return o;
    }
    put('prop_whiteboard', -3.0, -5.0);
    put('prop_whiteboard', -0.6, -5.0);
    put('prop_plant', -8.0, -4.4);
    put('prop_plant', -8.0, 3.9);
    put('prop_plant', -4.0, 3.7);
    put('prop_cooler', -7.6, -1.6);
    put('prop_cooler', -7.6, 0.9);
    put('prop_cabinet', -1.2, 4.2, Math.PI);
    put('prop_cabinet', 0.2, 4.2, Math.PI);
    put('prop_cabinet', 1.6, 4.2, Math.PI);
    put('prop_partition', 3.2, 3.6);
    put('prop_partition', -2.6, -4.0);
    put('prop_box', 2.8, 4.1, 0.4);
    put('prop_box', 3.4, 4.3, -0.3);
    put('prop_box', -7.9, 2.0, 0.2);
    // 地毯
    var b = new Vox.Builder();
    b.box(7.6, 0.06, 3.7, 7.6, 0.06, 3.0, P.rug, { topLight: true });
    b.box(7.6, 0.075, 3.7, 7.0, 0.02, 2.4, P.rugD, {});
    scene.add(new THREE.Mesh(b.geo(), Vox.MATS.solid));
  }

  // ------------------------------------------------------------------ 粒子
  var PN = [
    { size: 0.075, max: 420, o: null },
    { size: 0.16, max: 300, o: null },
    { size: 0.32, max: 120, o: null }
  ];
  function buildParticles() {
    PN.forEach(function (p) {
      var geo = new THREE.BufferGeometry();
      p.pos = new Float32Array(p.max * 3);
      p.col = new Float32Array(p.max * 3);
      p.vel = new Float32Array(p.max * 3);
      p.life = new Float32Array(p.max);
      p.max_life = new Float32Array(p.max);
      p.grav = new Float32Array(p.max);
      p.cursor = 0;
      for (var i = 0; i < p.max; i++) { p.pos[i * 3 + 1] = -999; }
      geo.setAttribute('position', new THREE.BufferAttribute(p.pos, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('color', new THREE.BufferAttribute(p.col, 3).setUsage(THREE.DynamicDrawUsage));
      geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 60);
      var mat = new THREE.PointsMaterial({ size: p.size, vertexColors: true, sizeAttenuation: true });
      var pts = new THREE.Points(geo, mat);
      pts.frustumCulled = false;
      scene.add(pts);
      p.o = pts;
    });
  }
  function spawnP(x, y, z, color, n, spread, up, cls, grav) {
    var p = PN[cls == null ? 1 : cls];
    var r = ((color >> 16) & 255) / 255, g = ((color >> 8) & 255) / 255, b = (color & 255) / 255;
    for (var i = 0; i < n; i++) {
      var k = p.cursor; p.cursor = (p.cursor + 1) % p.max;
      p.pos[k * 3] = x + (Math.random() - 0.5) * 0.2;
      p.pos[k * 3 + 1] = y + (Math.random() - 0.5) * 0.2;
      p.pos[k * 3 + 2] = z + (Math.random() - 0.5) * 0.2;
      var a = Math.random() * Math.PI * 2, s = Math.random();
      p.vel[k * 3] = Math.cos(a) * spread * s;
      p.vel[k * 3 + 1] = up * (0.5 + Math.random() * 0.9);
      p.vel[k * 3 + 2] = Math.sin(a) * spread * s;
      p.col[k * 3] = r; p.col[k * 3 + 1] = g; p.col[k * 3 + 2] = b;
      p.max_life[k] = 0.55 + Math.random() * 0.6;
      p.life[k] = p.max_life[k];
      p.grav[k] = grav == null ? 5.5 : grav;
    }
  }
  function updateParticles(dt) {
    PN.forEach(function (p) {
      var any = false;
      for (var i = 0; i < p.max; i++) {
        if (p.life[i] <= 0) continue;
        any = true;
        p.life[i] -= dt;
        if (p.life[i] <= 0) { p.pos[i * 3 + 1] = -999; continue; }
        p.vel[i * 3 + 1] -= p.grav[i] * dt;
        p.pos[i * 3] += p.vel[i * 3] * dt;
        p.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt;
        p.pos[i * 3 + 2] += p.vel[i * 3 + 2] * dt;
        if (p.pos[i * 3 + 1] < 0.06) { p.pos[i * 3 + 1] = 0.06; p.vel[i * 3 + 1] *= -0.32; p.vel[i * 3] *= 0.7; p.vel[i * 3 + 2] *= 0.7; }
      }
      if (any) {
        p.o.geometry.attributes.position.needsUpdate = true;
        p.o.geometry.attributes.color.needsUpdate = true;
      }
    });
  }

  // ------------------------------------------------------------------ 高亮框
  function buildHighlight() {
    hlFrame = VoxModel.instantiate('fx_cellframe', { noShadow: true });
    hlFrame.visible = false;
    hlFrame.userData.parts.all.material = matOK;
    scene.add(hlFrame);
    var geo = new THREE.BoxGeometry(0.9, 0.03, 0.9);
    hlQuad = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0x8cf0b0, transparent: true, opacity: 0.22, depthWrite: false
    }));
    hlQuad.position.y = 0.075;
    hlQuad.visible = false;
    scene.add(hlQuad);
  }

  // =================================================================== 弹幕
  var PROJ_GEO = {}, projPool = [];
  function buildProjGeos() {
    var b = new Vox.Builder();
    b.box(0, 0, 0, 0.2, 0.14, 0.18, P.paper, { topLight: true });
    b.box(0.09, 0, 0, 0.05, 0.1, 0.14, P.red, { shade: false });
    b.box(0, 0.078, 0, 0.16, 0.03, 0.14, P.inkD, { shade: false });
    PROJ_GEO.doc = b.geo();
    var w = new Vox.Builder();
    w.box(0, 0, 0, 0.17, 0.17, 0.17, P.water, { topLight: true });
    w.box(0, 0.07, 0, 0.11, 0.1, 0.11, 0xbfeeff, { shade: false });
    PROJ_GEO.water = w.geo();
    var m = new Vox.Builder();
    m.box(0, 0, 0, 0.24, 0.15, 0.16, P.white, { topLight: true });
    m.box(0.08, 0.02, 0, 0.1, 0.09, 0.18, P.cyan, { shade: false });
    m.box(0, 0.055, 0, 0.1, 0.06, 0.17, P.cyan, { shade: false });
    PROJ_GEO.mail = m.geo();
  }
  function getProjMesh(kind) {
    var mesh = projPool.pop();
    if (!mesh) { mesh = new THREE.Mesh(PROJ_GEO[kind], Vox.MATS.solid); mesh.castShadow = false; }
    else mesh.geometry = PROJ_GEO[kind];
    mesh.visible = true;
    scene.add(mesh);
    return mesh;
  }
  function freeProj(p) {
    scene.remove(p.mesh);
    projPool.push(p.mesh);
  }

  function fire(u, target) {
    var a = u.def.attack;
    var p = {
      x: u.x + 0.34, y: 0.5, z: u.z, row: u.row, vx: a.projSpeed, dmg: a.damage,
      kind: a.proj, slow: a.slow || null, homing: false, target: null
    };
    p.mesh = getProjMesh(a.proj);
    p.mesh.position.set(p.x, p.y, p.z);
    projs.push(p);
    if (u.key === 'fishtank') GameAudio.play('shootWater'); else GameAudio.play('shoot');
    if (u.parts.barrel) { u.recoil = 0.16; }
    if (u.parts.fish) { u.fishPush = 0.3; }
  }
  function fireMail(u, target) {
    var a = u.def.attack;
    var p = {
      x: u.x, y: 0.95, z: u.z, row: target.row, vx: a.projSpeed, dmg: a.damage,
      kind: 'mail', slow: null, homing: true, target: target
    };
    p.mesh = getProjMesh('mail');
    p.mesh.position.set(p.x, p.y, p.z);
    projs.push(p);
  }
  function updateProjs(dt) {
    for (var i = projs.length - 1; i >= 0; i--) {
      var p = projs[i], hit = null;
      if (p.homing) {
        if (!p.target || p.target.dead) { freeProj(p); projs.splice(i, 1); continue; }
        var tx = p.target.x, ty = 0.5, tz = p.target.z;
        var dx = tx - p.x, dy = ty - p.y, dz = tz - p.z;
        var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        var mv = p.vx * dt;
        if (dist <= mv + 0.2) { hit = p.target; }
        else {
          p.x += dx / dist * mv; p.y += dy / dist * mv; p.z += dz / dist * mv;
          p.mesh.rotation.y = Math.atan2(dz, dx);
          p.mesh.rotation.z = Math.sin(performance.now() / 90) * 0.25;
        }
      } else {
        var x0 = p.x;
        p.x += p.vx * dt;
        // 只打本行、沿直线飞行，命中这条线上最先碰到的敌人（用区间判定避免穿透）
        var bestX = 1e9;
        for (var j = 0; j < enemies.length; j++) {
          var e = enemies[j];
          if (e.dead || e.row !== p.row || e.state === 'enter') continue;
          if (e.x <= p.x + 0.45 && e.x >= x0 - 0.45 && e.x < bestX) { bestX = e.x; hit = e; }
        }
      }
      p.mesh.position.set(p.x, p.y, p.z);
      if (hit) {
        damageEnemy(hit, p.dmg, p.slow);
        spawnP(p.x + 0.1, p.y, p.z, p.kind === 'water' ? 0x8fdcff : 0xfff0c0, 5, 1.6, 1.6, 0, 7);
        if (GameAudio.throttle('hit', 38)) GameAudio.play('hit');
        freeProj(p); projs.splice(i, 1); continue;
      }
      if (p.x > 9 || p.x < -8 || p.y < -1) { freeProj(p); projs.splice(i, 1); }
    }
  }

  // =================================================================== 效果
  function popEnemy(e, color) {
    if (e.dead) return;
    e.dead = true;
    var i = enemies.indexOf(e);
    if (i >= 0) enemies.splice(i, 1);
    scene.remove(e.g);
    var col = color || 0xf2ecd8;
    spawnP(e.x, 0.5, e.z, col, 14, 2.4, 3.2, 1, 9);
    spawnP(e.x, 0.7, e.z, e.type === 'boss' ? 0x39445c : (e.type === 'urgent' ? 0xf18a2b : 0xdcd3bb), 8, 1.6, 2.4, 0, 8);
  }
  function killEnemy(e) { kills++; popEnemy(e); }
  function damageEnemy(e, dmg, slow) {
    if (e.dead) return;
    e.hp -= dmg;
    if (slow) { e.slowT = slow.time; e.slowMul = slow.mul; }
    if (e.hp <= 0) killEnemy(e);
    else spawnP(e.x, 0.55, e.z, 0xfff6d8, 3, 1.2, 1.2, 0, 8);
  }

  // =================================================================== 单位
  function occupied(col, row) {
    for (var i = 0; i < units.length; i++) if (!units[i].dead && units[i].col === col && units[i].row === row) return units[i];
    return null;
  }
  function placeUnit(key, col, row) {
    var def = CFG.UNITS[key];
    var u = {
      key: key, def: def, col: col, row: row, x: G.colX(col), z: G.rowZ(row),
      hp: def.hp, maxHp: def.hp, t: Math.random() * 5, atkTimer: 0.25, recoil: 0,
      prodTimer: def.produce ? def.produce.interval * 0.75 : 0,
      armT: def.mine ? def.mine.armTime : 0, armed: !def.mine,
      fuse: def.nuke ? def.nuke.fuse : 0, rateMul: 1, dead: false, fishPush: 0
    };
    var g = VoxModel.instantiate(def.model);
    g.position.set(u.x, 0.06, u.z);
    g.scale.setScalar(0.01);
    u.g = g; u.parts = g.userData.parts; u.spawnT = 0;
    u.scale = M.UNIT_SCALE;
    if (def.mine) g.userData.parts.armed.visible = false;
    scene.add(g);
    units.push(u);
    caf -= def.cost; cds[key] = def.cd;
    GameAudio.play('plant');
    spawnP(u.x, 0.25, u.z, 0xffffff, 8, 1.6, 2.2, 0, 6);
    return u;
  }
  function removeUnit(u, quiet) {
    if (u.dead) return;
    u.dead = true;
    var i = units.indexOf(u);
    if (i >= 0) units.splice(i, 1);
    scene.remove(u.g);
    if (!quiet) {
      spawnP(u.x, 0.4, u.z, 0xd9d2c0, 12, 2.2, 3, 1, 8);
      if (GameAudio.throttle('hit', 60)) GameAudio.play('hit');
    }
  }
  /** 铲除一个单位：统一走这里，保证拖拽铲除与「选中铲子后点击」表现完全一致 */
  function shovelUnit(u) {
    removeUnit(u, true);
    GameAudio.play('shovel');
    spawnP(u.x, 0.3, u.z, 0xd9d2c0, 16, 2.6, 3.4, 1, 9);
    UI.toast('已铲除「' + u.def.name + '」', '');
  }
  function addCaf(n, from) {
    caf += n;
    if (from) spawnP(from.x, 0.9, from.z, 0xffe08a, 4, 1, 1.6, 0, 4);
  }

  function leftmostEnemy(row, fromX) {
    var best = null;
    for (var i = 0; i < enemies.length; i++) {
      var e = enemies[i];
      if (e.dead || e.row !== row || e.state === 'enter') continue;
      if (fromX != null && e.x < fromX - 0.9) continue;
      if (!best || e.x < best.x) best = e;
    }
    return best;
  }
  function bossAlive() {
    for (var i = 0; i < enemies.length; i++) if (!enemies[i].dead && enemies[i].type === 'boss') return true;
    return false;
  }
  function findMine(e) {
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (u.dead || u.row !== e.row || u.def.kind !== 'mine' || !u.armed) continue;
      var d = e.x - u.x;
      if (d <= 0.85 && d > -0.35) return u;
    }
    return null;
  }
  function findBlocker(e) {
    var best = null;
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (u.dead || u.row !== e.row || u.def.kind === 'nuke') continue;
      var d = e.x - u.x;
      if (d <= 0.85 && d > -0.36) { if (!best || u.x > best.x) best = u; }
    }
    return best;
  }
  function triggerMine(u, e) {
    var dmg = u.def.mine.damage;
    removeUnit(u, true);
    spawnP(u.x, 0.5, u.z, 0xe04a3a, 18, 3, 4, 1, 10);
    spawnP(u.x, 0.4, u.z, 0x333333, 10, 2, 3, 2, 3);
    shake(0.35, 0.05);
    GameAudio.play('mine');
    damageEnemy(e, dmg);
  }
  function detonateResign(u) {
    removeUnit(u, true);
    spawnP(u.x, 0.6, u.z, 0xffffff, 26, 6, 6, 2, 6);
    spawnP(u.x, 0.6, u.z, 0xe04a3a, 22, 5, 5, 1, 8);
    spawnP(u.x, 1.0, u.z, 0xfff0a0, 20, 4, 7, 1, 5);
    shake(0.7, 0.16);
    GameAudio.play('explode');
    var col = u.col, row = u.row;
    UI.toast('「我 辞 职 ！」——全场工作作鸟兽散', 'good');
    // 先清场再判定风险
    for (var i = enemies.length - 1; i >= 0; i--) popEnemy(enemies[i], 0xffe08a);
    if (Math.random() < u.def.nuke.risk) {
      setTimeout(function () { if (state === 'playing') lose('resign'); }, 620);
    } else {
      UI.toast('老板没批，你暂时还得上班（第 ' + (row + 1) + ' 行）', '');
    }
  }
  function shake(t, amp) { shakeT = Math.max(shakeT, t); shakeAmp = Math.max(shakeAmp, amp); }

  function updateUnits(dt) {
    for (var i = units.length - 1; i >= 0; i--) {
      var u = units[i];
      if (u.dead) continue;
      u.t += dt;
      if (u.spawnT < 1) { u.spawnT = Math.min(1, u.spawnT + dt * 5); u.g.scale.setScalar(ease(u.spawnT) * M.UNIT_SCALE); }
      if (u.recoil > 0) u.recoil = Math.max(0, u.recoil - dt * 1.4);
      var d = u.def;

      // —— 经济
      if (d.produce) {
        u.prodTimer -= dt;
        if (u.prodTimer <= 0) { u.prodTimer += d.produce.interval; addCaf(d.produce.amount, u); GameAudio.play('cash'); }
        if (Math.random() < dt * 2.4) spawnP(u.x - 0.1, 1.05, u.z, 0xffffff, 1, 0.15, 1.4, 0, -0.6);
      }
      // —— 地雷武装
      if (d.mine && !u.armed) {
        u.armT -= dt;
        if (u.armT <= 0) { u.armed = true; u.parts.armed.visible = true; GameAudio.play('mineArm'); spawnP(u.x, 0.3, u.z, 0xe04a3a, 6, 1.4, 2, 0, 4); }
      }
      if (d.mine && u.armed && Math.random() < dt * 2) spawnP(u.x, 0.9, u.z, 0xe04a3a, 1, 0.2, 1.2, 0, -1);
      // —— 辞职信引信
      if (d.nuke) {
        u.fuse -= dt;
        u.parts.letter.rotation.y += dt * 5;
        u.parts.letter.position.y = 0.72 + Math.sin(u.t * 9) * 0.06;
        if (u.fuse <= 0) { detonateResign(u); continue; }
      }
      // —— 攻击
      if (d.attack) {
        u.atkTimer -= dt;
        if (u.atkTimer <= 0) {
          if (d.attack.perRow) {
            var fired = 0;
            for (var r = 0; r < ROWS; r++) { var te = leftmostEnemy(r); if (te) { fireMail(u, te); fired++; } }
            if (fired) { u.atkTimer = d.attack.interval * u.rateMul; GameAudio.play('shootMail'); }
            else u.atkTimer = 0.25;
          } else {
            var e = leftmostEnemy(u.row, u.x);
            if (e) { fire(u, e); u.atkTimer = d.attack.interval * u.rateMul; }
            else u.atkTimer = 0.2;
          }
        }
      }
      // —— 待机动画
      animUnit(u, dt);
    }
  }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  function animUnit(u, dt) {
    var t = u.t, p = u.parts, k = u.key;
    if (k === 'cannon') {
      if (p.barrel) p.barrel.position.x = 0.08 - u.recoil;
      u.g.position.y = 0.06 + Math.sin(t * 2.4) * 0.012;
      if (p.sign) p.sign.rotation.z = Math.sin(t * 6) * 0.05;
    } else if (k === 'coffee') {
      if (p.cup) p.cup.position.y = 0.09 + Math.abs(Math.sin(t * 2)) * 0.012;
    } else if (k === 'fishtank') {
      if (p.fish) {
        p.fish.position.x = 0.04 + Math.sin(t * 1.6) * 0.14;
        p.fish.position.z = -0.04 + Math.cos(t * 1.2) * 0.12;
        p.fish.rotation.y = Math.sin(t * 1.6 + 1.6) > 0 ? 0 : Math.PI;
        p.fishPush = Math.max(0, (u.fishPush || 0) - dt * 2);
      }
      if (p.body) p.body.position.y = 0.06 + Math.sin(t * 1.4) * 0.01;
    } else if (k === 'scapegoat') {
      u.g.position.y = 0.06 + Math.sin(t * 2) * 0.018;
      u.g.rotation.z = Math.sin(t * 1.7) * 0.02;
    } else if (k === 'fakebusy') {
      if (p.armed && p.armed.visible) {
        p.armed.rotation.y += dt * 2;
        p.armed.scale.setScalar(1 + Math.sin(t * 7) * 0.08);
      }
      if (p.screen) p.screen.position.y = 0.58 + Math.sin(t * 20) * 0.006;
    } else if (k === 'pie') {
      if (p.pie) { p.pie.position.y = 0.78 + Math.sin(t * 1.8) * 0.06; p.pie.rotation.y += dt * 1.1; }
      if (p.halo) { p.halo.rotation.y -= dt * 0.8; p.halo.scale.setScalar(1 + Math.sin(t * 2.4) * 0.05); }
      if (p.bubble) { p.bubble.position.y = 1.18 + Math.sin(t * 1.8 + 0.7) * 0.07; p.bubble.rotation.y += dt * 0.7; }
    } else if (k === 'massmail') {
      if (p.plane) {
        p.plane.position.x = Math.cos(t * 1.5) * 0.42;
        p.plane.position.z = Math.sin(t * 1.5) * 0.42;
        p.plane.position.y = 1.05 + Math.sin(t * 3) * 0.08;
        p.plane.rotation.y = -t * 1.5 + Math.PI / 2;
        p.plane.rotation.z = Math.sin(t * 3) * 0.2;
      }
      if (p.lights) p.lights.children.forEach(function (m, i) { m.visible = (Math.floor(t * 3 + i) % 3) === 0; });
    } else if (k === 'resign') {
      /* 在引信分支里处理 */
    }
  }

  // 光环（老板画的饼）——每 0.25s 重算一次
  var auraTimer = 0;
  function updateAuras(dt) {
    auraTimer -= dt;
    if (auraTimer > 0) return;
    auraTimer = 0.25;
    for (var i = 0; i < units.length; i++) units[i].rateMul = 1;
    for (var j = 0; j < units.length; j++) {
      var pie = units[j];
      if (pie.dead || !pie.def.aura) continue;
      var R = pie.def.aura.radius;
      for (var k = 0; k < units.length; k++) {
        var u = units[k];
        if (u.dead || !u.def.attack) continue;
        if (Math.abs(u.col - pie.col) <= R && Math.abs(u.row - pie.row) <= R) u.rateMul = Math.min(u.rateMul, pie.def.aura.rate);
      }
    }
  }

  // =================================================================== 敌人
  function spawnEnemy(type, row) {
    var def = CFG.ENEMIES[type];
    var e = {
      type: type, def: def, row: row, x: G.SPAWN_X, z: G.rowZ(row),
      hp: def.hp, maxHp: def.hp, speed: def.speed, slowT: 0, slowMul: 1,
      state: 'walk', target: null, legPhase: Math.random() * 6, dead: false,
      jumped: false, enter: null, jump: null,
      spawnT: def.spawner ? def.spawner.interval * (0.55 + Math.random() * 0.5) : 0,
      wispT: 0
    };
    var g = VoxModel.instantiate(def.model);
    g.rotation.y = Math.PI;
    g.position.set(e.x, 0.06, e.z);
    g.scale.setScalar(M.ENEMY_SCALE);
    scene.add(g);
    e.g = g; e.parts = g.userData.parts;
    enemies.push(e);
    if (type === 'boss') {
      GameAudio.play('boss');
      UI.banner('老 板 来 了', '他亲自下场了 · 走到任意工位立刻结束', false);
      UI.toast('老板出现在第 ' + (row + 1) + ' 行！', 'bad');
    }
    return e;
  }

  function enterDesk(e) {
    if (e.type === 'boss') { lose('boss'); return; }
    var r = e.row;
    if (sweeps[r]) { popEnemy(e, 0xd8f0c0); return; }   // 年假正在清场
    if (slots[r] >= M.SLOTS_PER_DESK) { lose('slot'); return; }
    slots[r]++;
    var tray = trays[r][slots[r] - 1];
    tray.userData.parts.full.visible = true;
    e.state = 'enter';
    e.enter = {
      t: 0, x0: e.x, y0: 0.06, z0: e.z,
      tx: tray.position.x, ty: tray.position.y + 0.14, tz: tray.position.z
    };
    GameAudio.play('slot');
    spawnP(e.x, 0.5, e.z, 0xc9b898, 8, 1.6, 2.4, 0, 6);
    updateSlotHUD();
    if (slots[r] >= M.SLOTS_PER_DESK) triggerLeave(r);
  }

  function triggerLeave(r) {
    leaveUsed[r] = true;
    sweeps[r] = { x: G.DESK_X - 0.1, t: 0, mesh: null };
    updateSlotHUD();
    GameAudio.play('leave');
    UI.banner('年 假 审 批', '第 ' + (r + 1) + ' 行 · 清空场上该行的工作（但槽位还堆着）', true);
    UI.toast('第 ' + (r + 1) + ' 行工位堆满 4 格 → 自动放年假！', 'good');
    var wk = workers[r];
    if (wk) { wk.cheer = 1.6; }
  }

  function updateSweeps(dt) {
    for (var r = 0; r < ROWS; r++) {
      var s = sweeps[r];
      if (!s) continue;
      s.t += dt;
      s.x += 18 * dt;
      if (!s.mesh) {
        s.mesh = VoxModel.instantiate('fx_leave', { noShadow: true });
        s.mesh.position.set(s.x, 1.35, G.rowZ(r));
        scene.add(s.mesh);
        spawnP(s.x, 1.3, G.rowZ(r), 0x9cf0b8, 10, 2, 2, 0, 3);
      }
      s.mesh.position.x = s.x;
      s.mesh.rotation.z = Math.sin(s.t * 12) * 0.16;
      s.mesh.rotation.y = Math.sin(s.t * 6) * 0.3;
      for (var i = enemies.length - 1; i >= 0; i--) {
        var e = enemies[i];
        if (e.dead || e.row !== r || e.state === 'enter') continue;
        if (e.x <= s.x) {
          popEnemy(e, 0xd8f0c0);
          spawnP(e.x, 0.6, e.z, 0x9cf0b8, 5, 1.6, 2.4, 0, 5);
        }
      }
      if (s.t > 1.15 || s.x > 8) { scene.remove(s.mesh); sweeps[r] = null; }
    }
  }

  function updateEnemies(dt) {
    for (var i = enemies.length - 1; i >= 0; i--) {
      var e = enemies[i];
      if (e.dead) continue;
      if (e.slowT > 0) {
        e.slowT -= dt;
        if (e.slowT <= 0) e.slowMul = 1;
        if (Math.random() < dt * 4) spawnP(e.x, 0.2, e.z, 0x6fd8ff, 1, 0.5, 0.6, 0, 2);
      }
      if (e.def.spawner) {
        e.spawnT -= dt;
        if (e.spawnT <= 0) {
          e.spawnT = e.def.spawner.interval;
          var cell = randomFreeCell(e.row, Math.max(2, G.xCol(e.x)));
          if (cell != null) {
            var ne = spawnEnemy(e.def.spawner.type, e.row);
            ne.x = G.colX(cell); ne.g.position.x = ne.x;
            spawnP(ne.x, 0.4, ne.z, 0xffd166, 8, 1.6, 2.4, 0, 5);
            UI.toast('例会产出了新的普通需求（第 ' + (e.row + 1) + ' 行）', 'bad');
          }
        }
      }

      if (e.state === 'walk') {
        e.x -= e.speed * e.slowMul * dt;
        var mine = findMine(e);
        if (mine) { triggerMine(mine, e); continue; }
        var blk = findBlocker(e);
        if (blk) {
          if (e.def.jump && !e.jumped) {
            e.state = 'jump';
            e.jump = { t: 0, x0: e.x, x1: blk.x - 0.95 };
            spawnP(e.x, 0.3, e.z, 0x9fd8ff, 6, 1.4, 2, 0, 3);
          } else {
            e.state = 'eat'; e.target = blk;
          }
        } else if (e.x <= G.DESK_X) {
          enterDesk(e);
          if (e.dead || e.state === 'enter') continue;
        }
      } else if (e.state === 'eat') {
        var tgt = e.target;
        if (!tgt || tgt.dead) { e.state = 'walk'; e.target = null; }
        else {
          tgt.hp -= e.def.dps * dt;
          if (GameAudio.throttle('chew', 240)) GameAudio.play('chew');
          if (Math.random() < dt * 6) spawnP(tgt.x + 0.3, 0.6, tgt.z, 0xd9d2c0, 1, 0.8, 1.2, 0, 6);
          if (tgt.hp <= 0) { removeUnit(tgt); e.state = 'walk'; e.target = null; }
        }
      } else if (e.state === 'jump') {
        e.jump.t += dt;
        var k = Math.min(1, e.jump.t / 0.5);
        e.x = e.jump.x0 + (e.jump.x1 - e.jump.x0) * k;
        e.g.position.y = 0.06 + Math.sin(k * Math.PI) * 1.15;
        if (k >= 1) { e.state = 'walk'; e.jumped = true; e.g.position.y = 0.06; spawnP(e.x, 0.2, e.z, 0xc8d8e8, 6, 1.4, 1.6, 0, 5); }
      } else if (e.state === 'enter') {
        var en = e.enter;
        en.t += dt;
        var kk = Math.min(1, en.t / 0.75);
        var s = 1 - 0.88 * kk * kk;
        e.g.scale.setScalar(Math.max(0.08, s) * M.ENEMY_SCALE);
        e.g.position.x = en.x0 + (en.tx - en.x0) * kk;
        e.g.position.z = en.z0 + (en.tz - en.z0) * kk;
        e.g.position.y = en.y0 + (en.ty - en.y0) * kk * kk;
        e.g.rotation.y = Math.PI + kk * 6;
        if (kk >= 1) { popEnemy(e, 0xffe6a8); }
        continue;
      }

      // 应用变换 + 走路动画
      if (e.state !== 'enter') {
        e.g.position.x = e.x; e.g.position.z = e.z;
        if (e.state !== 'jump') {
          var walk = e.state === 'walk' ? 1 : 0.35;
          e.g.position.y = 0.06 + Math.abs(Math.sin(e.legPhase)) * 0.045 * walk;
          e.legPhase += dt * (5.5 + e.speed * 6) * walk * (e.slowMul < 1 ? 0.6 : 1);
          if (e.parts.legL) { e.parts.legL.rotation.z = Math.sin(e.legPhase) * 0.55 * walk; e.parts.legR.rotation.z = -Math.sin(e.legPhase) * 0.55 * walk; }
          if (e.parts.armL) { e.parts.armL.rotation.x = Math.sin(e.legPhase) * 0.3; e.parts.armR.rotation.x = -Math.sin(e.legPhase) * 0.3; }
          if (e.state === 'eat') {
            e.g.rotation.z = Math.sin(e.legPhase * 5) * 0.05;
            if (e.parts.body) e.parts.body.rotation.x = Math.sin(e.legPhase * 8) * 0.07;
          } else {
            e.g.rotation.z = 0;
            if (e.parts.body) e.parts.body.rotation.x = 0;
          }
          if (e.parts.flag) e.parts.flag.rotation.z = Math.sin(e.legPhase * 0.8) * 0.12;
        }
      }
    }
  }
  function randomFreeCell(row, minCol) {
    var free = [], min = minCol == null ? 0 : minCol;
    for (var c = min; c < COLS; c++) {
      if (occupied(c, row)) continue;
      var taken = false;
      for (var i = 0; i < enemies.length; i++) if (!enemies[i].dead && enemies[i].row === row && Math.abs(G.xCol(enemies[i].x) - c) < 1) taken = true;
      if (!taken) free.push(c);
    }
    if (!free.length) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  // =================================================================== 咖啡雨
  function spawnDrop() {
    var col = Math.floor(Math.random() * COLS), row = Math.floor(Math.random() * ROWS);
    var g = VoxModel.instantiate('fx_coffee_cup', { noShadow: true });
    g.position.set(G.colX(col), 7.5, G.rowZ(row));
    scene.add(g);
    pickups.push({ g: g, x: G.colX(col), z: G.rowZ(row), y: 7.5, t: 0, done: false });
  }
  function updatePickups(dt) {
    for (var i = pickups.length - 1; i >= 0; i--) {
      var p = pickups[i];
      p.t += dt;
      p.y = 7.5 - 22 * p.t * p.t * 0.12 - p.t * 5.0;
      if (p.y <= 0.55) {
        p.y = 0.55;
        g_collect(p);
        scene.remove(p.g); pickups.splice(i, 1); continue;
      }
      p.g.position.y = p.y;
      p.g.rotation.y += dt * 3;
    }
  }
  function g_collect(p) {
    addCaf(CFG.ECON.drop.amount);
    GameAudio.play('coin');
    spawnP(p.x, 0.6, p.z, 0x8a5a34, 10, 2, 3, 0, 6);
    spawnP(p.x, 0.7, p.z, 0xf1e6cf, 6, 1.6, 2.4, 0, 5);
    UI.toast('+25 咖啡因（一杯天降的咖啡）', 'good');
  }

  // =================================================================== 波次
  function buildBag(comp) {
    var bag = [];
    for (var k in comp) for (var i = 0; i < comp[k]; i++) bag.push(k);
    // 洗牌
    for (var j = bag.length - 1; j > 0; j--) { var r = Math.floor(Math.random() * (j + 1)); var t = bag[j]; bag[j] = bag[r]; bag[r] = t; }
    return bag;
  }
  function nextRow() {
    if (rowBag.length === 0) {
      rowBag = [0, 1, 2, 3, 4];
      for (var i = rowBag.length - 1; i > 0; i--) { var r = Math.floor(Math.random() * (i + 1)); var t = rowBag[i]; rowBag[i] = rowBag[r]; rowBag[r] = t; }
      if (rowBag[rowBag.length - 1] === lastRow && rowBag.length > 1) { var tmp = rowBag[0]; rowBag[0] = rowBag[rowBag.length - 1]; rowBag[rowBag.length - 1] = tmp; }
    }
    var v = rowBag.pop();
    lastRow = v;
    return v;
  }
  function startWave(idx) {
    var w = CFG.WAVES[idx];
    waveIndex = idx;
    spawnList = []; spawnCursor = 0; waveTimer = 0; waveState = 'spawning';
    var bag = buildBag(w.comp);
    var list = [];
    for (var i = 0; i < w.n; i++) list.push({ t: i * w.itv, row: nextRow(), type: bag[i % bag.length] });
    if (w.boss) { var at = Math.max(1, Math.round(w.n * 0.4)); list.splice(at, 0, { t: at * w.itv, row: nextRow(), type: 'boss' }); }
    spawnList = list;
    var total = list.length;
    UI.setWave(idx + 1, 0, w.big ? '一大波工作来袭！' : '出怪中…');
    if (w.big) {
      UI.banner('一 大 波 工 作 来 袭', '第 ' + (idx + 1) + ' 波 · ' + total + ' 件工作正在派发', false);
      GameAudio.play('warn');
    } else {
      UI.banner('第 ' + (idx + 1) + ' 波', w.n + ' 件工作正在派发', true);
      GameAudio.play('click');
    }
  }
  function updateWaves(dt) {
    if (state !== 'playing') return;
    waveTimer += dt;
    if (waveState === 'prep') {
      if (waveTimer >= 3.0) startWave(0);
    } else if (waveState === 'spawning') {
      while (spawnCursor < spawnList.length && spawnList[spawnCursor].t <= waveTimer) {
        var s = spawnList[spawnCursor];
        if (s.type === 'boss' && bossAlive()) break;
        spawnEnemy(s.type, s.row);
        spawnCursor++;
      }
      var prog = spawnList.length ? spawnCursor / spawnList.length : 1;
      UI.setWave(waveIndex + 1, prog, '出怪中… ' + spawnCursor + '/' + spawnList.length);
      if (spawnCursor >= spawnList.length) { waveState = 'clearing'; waveTimer = 0; }
    } else if (waveState === 'clearing') {
      UI.setWave(waveIndex + 1, 1, enemies.length ? '清场中… 剩余 ' + enemies.length : '清理完毕');
      if (enemies.length === 0) {
        if (waveIndex + 1 >= CFG.WAVES.length) { victory(); return; }
        waveState = 'break'; waveTimer = 0;
        UI.banner('本波清空', '稍作喘息，下一波马上到', true);
      }
    } else if (waveState === 'break') {
      UI.setWave(waveIndex + 1, 1, '下一波 ' + Math.max(0, CFG.WAVE_BREAK - waveTimer).toFixed(1) + 's');
      if (waveTimer >= CFG.WAVE_BREAK) { startWave(waveIndex + 1); }
    }
  }

  // =================================================================== 胜负
  function lose(reason) {
    if (state !== 'playing') return;
    state = 'over';
    GameAudio.stopBGM();
    GameAudio.play('lose');
    shake(0.6, 0.2);
    var pool = reason === 'boss' ? M.FEEDBACK.loseBoss : (reason === 'resign' ? M.FEEDBACK.loseResign : M.FEEDBACK.loseSlot);
    var quote = pool[Math.floor(Math.random() * pool.length)];
    var reasonText = reason === 'boss' ? '老板走到了工位——年假也拦不住老板。'
      : (reason === 'resign' ? '辞职信引爆了，老板还真的批了。' : '某行的工位在年假用完之后，又堆上了一件工作。');
    UI.resultScreen(false, stats(), quote, reasonText);
  }
  function victory() {
    if (state !== 'playing') return;
    state = 'over';
    GameAudio.stopBGM();
    GameAudio.play('win');
    var remain = leaveUsed.filter(function (x) { return !x; }).length;
    var filled = slots.reduce(function (a, b) { return a + b; }, 0);
    var pool = filled === 0 ? M.FEEDBACK.winPerfect : (remain >= 3 ? M.FEEDBACK.win : M.FEEDBACK.winHard);
    UI.resultScreen(true, stats(), pool[Math.floor(Math.random() * pool.length)], '');
  }
  function stats() {
    return { kills: kills, caf: Math.floor(caf), leave: leaveUsed.filter(function (x) { return !x; }).length, wave: waveIndex + 1 };
  }
  function updateSlotHUD() { UI.setSlots(slots, leaveUsed); }

  // =================================================================== 输入
  function pointerNDC(ev) {
    var c = document.getElementById('game');
    var r = c.getBoundingClientRect();
    _ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    _ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    return _ndc;
  }
  function pickCell(ev) {
    _ray.setFromCamera(pointerNDC(ev), camera);
    if (!_ray.ray.intersectPlane(_plane, _hit)) return null;
    var col = Math.round(_hit.x + 4), row = Math.round(_hit.z + 2);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    if (Math.abs(_hit.x - G.colX(col)) > 0.52 || Math.abs(_hit.z - G.rowZ(row)) > 0.52) return null;
    return { col: col, row: row };
  }
  function setHighlight(col, row, ok) {
    if (col == null) { hlFrame.visible = false; hlQuad.visible = false; return; }
    hlFrame.visible = true; hlQuad.visible = true;
    hlFrame.position.set(G.colX(col), 0.085, G.rowZ(row));
    hlQuad.position.set(G.colX(col), 0.075, G.rowZ(row));
    hlFrame.userData.parts.all.material = ok ? matOK : matBad;
    hlQuad.material.color.setHex(ok ? 0x8cf0b0 : 0xff6a52);
  }
  function bindInput() {
    var canvas = document.getElementById('game');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mousedown', onCanvasDown);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('keydown', onKey);
  }
  function onMove(ev) {
    if (state !== 'playing' || paused) return;
    if (shovelDrag) {
      var sm = Math.abs(ev.clientX - shovelDrag.sx) + Math.abs(ev.clientY - shovelDrag.sy);
      if (sm > 5) shovelDrag.moved = true;
      UI.shovelGhostMove(ev.clientX, ev.clientY);
      var sc0 = pickCell(ev);
      var tgt = sc0 ? occupied(sc0.col, sc0.row) : null;
      shovelDrag.col = sc0 ? sc0.col : -1;
      shovelDrag.row = sc0 ? sc0.row : -1;
      shovelDrag.on = !!tgt;
      UI.shovelGhostOn(!!tgt);
      if (sc0) setHighlight(sc0.col, sc0.row, !!tgt);
      else setHighlight(null);
      return;
    }
    if (drag) {
      var m = Math.abs(ev.clientX - drag.sx) + Math.abs(ev.clientY - drag.sy);
      if (m > 5) drag.moved = true;
      var cell = pickCell(ev);
      var u = CFG.UNITS[drag.key];
      if (cell) {
        var free = !occupied(cell.col, cell.row);
        var ok = free && caf >= u.cost && cds[drag.key] <= 0;
        drag.col = cell.col; drag.row = cell.row; drag.valid = ok;
        drag.ghost.visible = true;
        drag.ghost.position.set(G.colX(cell.col), 0.06, G.rowZ(cell.row));
        drag.ghost.userData.parts && setGhostMat(drag.ghost, ok ? 'ghost' : 'ghostBad');
        setHighlight(cell.col, cell.row, ok);
      } else {
        drag.col = -1; drag.ghost.visible = false; setHighlight(null);
      }
      return;
    }
    if (shovelOn || selectedCard) {
      var c2 = pickCell(ev);
      if (!c2) { setHighlight(null); return; }
      var occ = occupied(c2.col, c2.row);
      if (shovelOn) setHighlight(c2.col, c2.row, !!occ);
      else {
        var u2 = CFG.UNITS[selectedCard];
        var ok2 = !occ && caf >= u2.cost && cds[selectedCard] <= 0;
        setHighlight(c2.col, c2.row, ok2);
      }
    }
  }
  function setGhostMat(g, matKey) {
    var mat = Vox.MATS[matKey];
    g.traverse(function (o) { if (o.isMesh) o.material = mat; });
  }
  function onUp(ev) {
    if (shovelDrag) {
      var sd = shovelDrag; shovelDrag = null;
      document.body.classList.remove('shoveling');
      UI.shovelGhostHide();
      setHighlight(null);
      if (!sd.moved) {              // 原地按一下 = 点选铲子（保留原来的「选中后点击」用法）
        toggleShovel();
        return;
      }
      if (sd.col < 0) return;       // 拖到战场外松手 = 取消
      var tu = occupied(sd.col, sd.row);
      if (tu) shovelUnit(tu);
      else GameAudio.play('deny');
      return;
    }
    if (!drag) return;
    var d = drag; drag = null;
    document.body.classList.remove('dragging');
    scene.remove(d.ghost);
    setHighlight(null);
    if (!d.moved) {          // 视为“点击卡片” -> 进入点击放置模式
      selectedCard = (selectedCard === d.key) ? null : d.key;
      shovelOn = false;
      GameAudio.play('click');
      return;
    }
    if (d.col < 0 || d.col == null) return;
    var u = CFG.UNITS[d.key];
    if (occupied(d.col, d.row)) { GameAudio.play('deny'); UI.toast('这里有东西了', 'bad'); return; }
    if (caf < u.cost) { GameAudio.play('deny'); UI.toast('咖啡因不够（还差 ' + Math.ceil(u.cost - caf) + '）', 'bad'); return; }
    if (cds[d.key] > 0) { GameAudio.play('deny'); UI.toast('这张卡还在冷却', 'bad'); return; }
    placeUnit(d.key, d.col, d.row);
  }
  function onCanvasDown(ev) {
    if (state !== 'playing' || paused) return;
    var cell = pickCell(ev);
    if (!cell) return;
    if (shovelOn) {
      var u = occupied(cell.col, cell.row);
      if (u) {
        shovelUnit(u);
        setHighlight(null);
      } else { GameAudio.play('deny'); setHighlight(cell.col, cell.row, false); }
      return;
    }
    if (selectedCard) {
      var def = CFG.UNITS[selectedCard];
      if (occupied(cell.col, cell.row)) { GameAudio.play('deny'); return; }
      if (caf < def.cost || cds[selectedCard] > 0) { GameAudio.play('deny'); return; }
      placeUnit(selectedCard, cell.col, cell.row);
      if (ev.shiftKey === false) { /* 保持选中，方便连续放置 */ }
    }
  }
  function onKey(ev) {
    var k = ev.key.toLowerCase();
    if (k === 'c') { cancelShovelDrag(); UI.codexOpen() ? UI.closeCodex() : UI.openCodex(); return; }
    if (state === 'menu' || state === 'over') {
      if (k === 'r' || k === 'enter') { var b = document.getElementById('btn-play') || document.getElementById('btn-again'); if (b) b.click(); }
      return;
    }
    if (k === ' ') { ev.preventDefault(); togglePause(); }
    else if (k === '1') { setSpeed(1); }
    else if (k === '2') { setSpeed(2); }
    else if (k === 's') { toggleShovel(); }
    else if (k === 'm') { toggleSound(); }
    else if (k === 'r') { restart(); }
    else if (k === 'escape') { selectedCard = null; shovelOn = false; cancelShovelDrag(); }
  }
  /** 中断正在进行的铲子拖拽（暂停 / 开图鉴 / 重置时用），避免幽灵与状态残留 */
  function cancelShovelDrag() {
    if (!shovelDrag) return;
    shovelDrag = null;
    document.body.classList.remove('shoveling');
    UI.shovelGhostHide();
    setHighlight(null);
  }
  function togglePause() {
    if (state !== 'playing') return;
    paused = !paused;
    if (paused) cancelShovelDrag();
    document.getElementById('btn-pause').classList.toggle('on', paused);
    document.getElementById('btn-pause').textContent = paused ? '继续' : '暂停';
    if (paused) { GameAudio.duckBGM(0.35); UI.banner('已 暂 停', '空格继续', true); }
    else GameAudio.duckBGM(1);
  }
  function setSpeed(s) {
    speedMul = s;
    var b = document.getElementById('btn-speed');
    b.textContent = s + '×';
    b.classList.toggle('on', s === 2);
  }
  function toggleShovel() {
    shovelOn = !shovelOn;
    if (shovelOn) selectedCard = null;
    GameAudio.play('click');
    document.getElementById('shovel').classList.toggle('active', shovelOn);
  }
  function toggleSound() {
    var on = !GameAudio.isEnabled();
    GameAudio.setEnabled(on);
    GameAudio.setBgm(on);
    document.getElementById('btn-sound').textContent = on ? '音效' : '静音';
    document.getElementById('btn-sound').classList.toggle('warn', !on);
  }
  function restart() {
    UI.hideOverlay(); UI.closeCodex(); UI.hideTip();
    resetGame();
    GameAudio.setBgm(GameAudio.isEnabled());
    GameAudio.startBGM();
    GameAudio.play('click');
    UI.banner('重 新 开 始', '本局已重置，守住 5 个工位', true);
  }
  function resetGame() {
    units.slice().forEach(function (u) { scene.remove(u.g); });
    enemies.slice().forEach(function (e) { scene.remove(e.g); });
    projs.slice().forEach(function (p) { freeProj(p); });
    pickups.slice().forEach(function (p) { scene.remove(p.g); });
    sweeps.forEach(function (s) { if (s && s.mesh) scene.remove(s.mesh); });
    units = []; enemies = []; projs = []; pickups = [];
    for (var r = 0; r < ROWS; r++) { sweeps[r] = null; slots[r] = 0; leaveUsed[r] = false; trays[r].forEach(function (t) { t.userData.parts.full.visible = false; }); }
    cds = {}; CFG.UNIT_ORDER.forEach(function (k) { cds[k] = 0; });
    caf = CFG.ECON.start; kills = 0; gameTime = 0; dropTimer = 6;
    waveIndex = 0; waveState = 'prep'; waveTimer = 0; spawnList = []; spawnCursor = 0;
    rowBag = []; lastRow = -1;
    paused = false; speedMul = 1; shakeT = 0; shakeAmp = 0; drag = null; shovelOn = false; selectedCard = null;
    shovelDrag = null;
    document.body.classList.remove('shoveling');
    UI.shovelGhostHide();
    if (restartDisarm) restartDisarm();
    document.getElementById('btn-pause').classList.remove('on');
    document.getElementById('btn-pause').textContent = '暂停';
    document.getElementById('btn-speed').textContent = '1×';
    document.getElementById('btn-speed').classList.remove('on');
    document.getElementById('shovel').classList.remove('active');
    updateSlotHUD();
    UI.setWave(1, 0, '准备中…');
    state = 'playing';
  }

  // =================================================================== 主循环
  function step(dt) {
    gameTime += dt;
    // 经济
    dropTimer += dt;
    if (dropTimer >= CFG.ECON.drop.interval) { dropTimer -= CFG.ECON.drop.interval; spawnDrop(); }
    cafRate = CFG.ECON.drop.amount / CFG.ECON.drop.interval;
    for (var i = 0; i < units.length; i++) {
      var u = units[i];
      if (u.def.produce && !u.dead) cafRate += u.def.produce.amount / u.def.produce.interval;
    }
    // 冷却
    for (var k in cds) if (cds[k] > 0) cds[k] = Math.max(0, cds[k] - dt);
    updateAuras(dt);
    updateUnits(dt);
    updateSweeps(dt);
    updateEnemies(dt);
    updateProjs(dt);
    updatePickups(dt);
    updateWaves(dt);
    for (var r = 0; r < ROWS; r++) {
      var wk = workers[r];
      if (!wk) continue;
      if (wk.cheer > 0) { wk.cheer -= dt; wk.parts.body.rotation.z = Math.sin(wk.cheer * 22) * 0.22; wk.g.position.y = Math.abs(Math.sin(wk.cheer * 16)) * 0.12; }
      else {
        var danger = 0;
        for (var j = 0; j < enemies.length; j++) if (enemies[j].row === r && enemies[j].x < -1.2) danger = 1;
        wk.panic += (danger - wk.panic) * Math.min(1, dt * 4);
        wk.parts.body.rotation.z = Math.sin(gameTime * 26) * 0.06 * wk.panic;
        wk.parts.body.position.x = Math.sin(gameTime * 13) * 0.03 * wk.panic;
        wk.parts.body.position.y = slots[r] >= M.SLOTS_PER_DESK ? Math.sin(gameTime * 3) * 0.05 : 0;
        wk.g.position.y = 0;
      }
    }
  }

  var hudTimer = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var raw = Math.min(0.05, (ts - lastTs) / 1000);
    if (raw < 0) raw = 0;
    lastTs = ts;

    if (state === 'playing' && !paused) {
      var dt = raw * speedMul;
      if (dt > 0.035) { step(dt / 2); step(dt / 2); } else step(dt);
    } else if (state === 'menu') {
      // 开始界面：让办公室自己“活着”
      workers.forEach(function (w, i) { w.parts.body.rotation.z = Math.sin(gameTime * 2 + i) * 0.03; });
      gameTime += raw;
    }
    updateParticles((state === 'playing' && !paused) ? Math.min(raw * speedMul, 0.05) : raw);

    // 相机抖动（纯位移，不改变朝向）
    var oy = 0;
    if (shakeT > 0) {
      shakeT = Math.max(0, shakeT - raw);
      oy = Math.sin(shakeT * 58) * shakeAmp * Math.min(1, shakeT * 4);
      if (shakeT <= 0) shakeAmp = 0;
    }
    camera.position.y = CAM_Y + oy;
    camTarget.y = camTargetBaseY + oy;
    camera.lookAt(camTarget);

    // HUD
    hudTimer -= raw;
    if (hudTimer <= 0) { hudTimer = 0.08; UI.setCaffeine(caf, cafRate); UI.setSlots(slots, leaveUsed); }
    UI.updateCards(caf, cds, drag ? drag.key : null, shovelOn || (shovelDrag && shovelDrag.moved));

    fpsAcc += raw; fpsFrames++;
    if (fpsAcc >= 0.5) {
      fpsVal = Math.round(fpsFrames / fpsAcc); fpsAcc = 0; fpsFrames = 0;
      document.getElementById('fps').textContent = fpsVal + ' fps';
    }
    renderer.render(scene, camera);
  }

  // =================================================================== 启动
  function boot() {
    var handlers = {
      cardDown: function (key, ev) {
        if (state !== 'playing' || paused) return;
        var u = CFG.UNITS[key];
        if (caf < u.cost || cds[key] > 0) { GameAudio.play('deny'); UI.toast('咖啡因不够 / 冷却中', 'bad'); return; }
        UI.hideTip();
        selectedCard = null; shovelOn = false;
        document.getElementById('shovel').classList.remove('active');
        var ghost = VoxModel.instantiate(u.model, { mat: 'ghost', noShadow: true });
        ghost.scale.setScalar(M.UNIT_SCALE);
        drag = {
          key: key, sx: ev.clientX, sy: ev.clientY, moved: false,
          ghost: ghost,
          col: -1, row: -1, valid: false
        };
        scene.add(drag.ghost);
        document.body.classList.add('dragging');
      },
      cardClick: function (key) { /* mousedown 已处理 */ },
      /** 铲子按下：开始一次「拖拽铲除」。原地松手（没移动）时会被当成点选铲子。 */
      shovelDown: function (ev) {
        if (state !== 'playing' || paused) return;
        shovelDrag = { sx: ev.clientX, sy: ev.clientY, moved: false, col: -1, row: -1, on: false };
        selectedCard = null;
        document.body.classList.add('shoveling');
        UI.shovelGhostShow();
        UI.shovelGhostMove(ev.clientX, ev.clientY);
        UI.shovelGhostOn(false);
      },
      toggleShovel: function () {
        if (state !== 'playing') return;
        toggleShovel();
      }
    };
    // 先建好所有体素几何体，卡片图标要用它们离屏渲染
    Vox.initMaterials();
    VoxModel.init();
    UI.init(handlers);
    init();
    CAM_Y = camera.position.y;
    CAM_Z = camera.position.z;
    camTargetBaseY = camTarget.y;
    camTargetBaseZ = camTarget.z;

    document.getElementById('btn-pause').addEventListener('click', togglePause);
    document.getElementById('btn-speed').addEventListener('click', function () { setSpeed(speedMul === 2 ? 1 : 2); });
    document.getElementById('btn-codex').addEventListener('click', function () { UI.openCodex(); });
    document.getElementById('btn-codex-close').addEventListener('click', function () { UI.closeCodex(); });
    document.getElementById('btn-sound').addEventListener('click', toggleSound);
    // 随时重开：二次确认，避免误触（按 R 仍是即时重开）
    var restartArmTimer = 0;
    restartDisarm = function () {
      var b = document.getElementById('btn-restart');
      b.textContent = '重开';
      b.classList.remove('confirm');
      if (restartArmTimer) { clearTimeout(restartArmTimer); restartArmTimer = 0; }
    };
    document.getElementById('btn-restart').addEventListener('click', function () {
      if (state !== 'playing') return;
      var b = document.getElementById('btn-restart');
      if (b.classList.contains('confirm')) {
        restartDisarm();
        restart();
        return;
      }
      GameAudio.play('click');
      b.textContent = '确认重开？';
      b.classList.add('confirm');
      if (restartArmTimer) clearTimeout(restartArmTimer);
      restartArmTimer = setTimeout(restartDisarm, 3000);
    });
    document.getElementById('overlay').addEventListener('click', function (ev) {
      var id = ev.target.id;
      if (id === 'btn-play' || id === 'btn-again') {
        GameAudio.unlock();
        UI.hideOverlay();
        resetGame();
        GameAudio.startBGM();
        GameAudio.play('click');
        UI.banner('开始上班', '守住 5 个工位，撑过 12 波', true);
      } else if (id === 'btn-codex2') { UI.openCodex(); }
      else if (id === 'btn-help') {
        var h = document.getElementById('helpbox');
        if (h) h.style.display = h.style.display === 'none' ? 'block' : 'none';
      }
    });
    UI.startScreen();
    UI.setCaffeine(CFG.ECON.start, 2.5);
    UI.setWave(1, 0, '准备中…');
    updateSlotHUD();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window);
