/* ============================================================================
 * game.js —— 《植物大战僵尸 · 打工人版》主逻辑
 *  5×9 网格塔防 / 拖拽种植 / 铲子 / 咖啡因经济 / 工位槽位 / 年假 / 12 波次
 * ==========================================================================*/
(function () {
  'use strict';

  /* ================= 常量 ================= */
  var COLS = 9, ROWS = 5, CELL = 2.0;
  var HALF_W = COLS * CELL / 2;          // 9
  var HALF_D = ROWS * CELL / 2;          // 5
  var SPAWN_X = HALF_W + 2.2;            // 敌人出生点
  var ARRIVE_X = -HALF_W - 0.9;          // 敌人抵达工位的 x
  var BITE_DMG = 20, BITE_INTERVAL = 1.0;
  var DROP_INTERVAL = 8, DROP_AMOUNT = 25;
  var RESIGN_FUSE = 1.0, RESIGN_FAIL_RATE = 0.15;
  var MINE_ARM_TIME = 15;
  var WAVE_BREAK = 14, FIRST_BREAK = 10;

  /* ================= 单位数据表（与 index.html 注释中的数值总表一致） ================= */
  var UNITS = [
    {
      id: 'coffee', name: '咖啡机', cost: 50, cd: 5, hp: 100, type: 'produce',
      icon: '☕', build: VOX.coffeeMachine,
      desc: '每 10 秒产出 25 咖啡因，自动入账。经济核心，血薄要靠前排护着。',
      stat: '费用 50 / 冷却 5s / 血量 100 / 产出 25 咖啡因·10s'
    },
    {
      id: 'ddl', name: 'DDL 加农炮', cost: 100, cd: 5, hp: 150, type: 'shoot',
      icon: '💥', build: VOX.ddlCannon,
      desc: '每 1.5s 轰出一发「交付物」，伤害 25，直线打本行最左敌人。DDL 是第一生产力。',
      stat: '费用 100 / 冷却 5s / 血量 150 / 伤害 25·1.5s'
    },
    {
      id: 'scapegoat', name: '背锅侠', cost: 50, cd: 10, hp: 1500, type: 'wall',
      icon: '🛡', build: VOX.scapegoat,
      desc: '50 咖啡因请来挡枪的实习同事，背着一口大锅。不攻击，纯肉盾，血超厚。',
      stat: '费用 50 / 冷却 10s / 血量 1500（=加农炮 10 倍）'
    },
    {
      id: 'fish', name: '摸鱼鱼缸', cost: 175, cd: 5, hp: 150, type: 'water',
      icon: '🐟', build: VOX.fishTank,
      desc: '每 1.6s 泼一朵水花，伤害 20，命中移速减半 5 秒。纸泡了水，走不动了。',
      stat: '费用 175 / 冷却 5s / 血量 150 / 伤害 20·1.6s + 减速 50%·5s'
    },
    {
      id: 'resign', name: '辞职信', cost: 150, cd: 30, hp: 1, type: 'bomb',
      icon: '📜', build: VOX.resignLetter,
      desc: '放置 1 秒后引爆，清空全场敌人！但有 15% 概率被「老板同意辞职」→ 直接失败。',
      stat: '费用 150 / 冷却 30s / 1s 后清屏 / 15% 赌输'
    },
    {
      id: 'fakebusy', name: '假装在忙', cost: 25, cd: 20, hp: 120, type: 'mine',
      icon: '🪑', build: VOX.fakeBusy,
      desc: '低价秒杀：放置后要花 15 秒布置现场，武装完成后敌人踩中即自爆秒杀；武装前无效。',
      stat: '费用 25 / 冷却 20s / 血量 120 / 武装 15s / 秒杀 1 只'
    },
    {
      id: 'bbq', name: '团建烧烤架', cost: 125, cd: 15, hp: 300, type: 'aura',
      icon: '🍢', build: VOX.bbqGrill, custom: true,
      desc: '光环辅助：相邻（上下左右）单位攻击速度 +50%，自身不攻击。★自创单位。',
      stat: '费用 125 / 冷却 15s / 血量 300 / 相邻攻速 +50%'
    },
    {
      id: 'hr', name: 'HR 的约谈', cost: 75, cd: 8, hp: 120, type: 'hr',
      icon: '📋', build: VOX.hrTalk, custom: true,
      desc: '每 6 秒约谈本行最左敌人：10 伤害 + 击退 1 格 + 眩晕 1.5 秒。★自创单位。',
      stat: '费用 75 / 冷却 8s / 血量 120 / 10 伤害·6s + 击退 + 眩晕'
    }
  ];

  /* ================= 敌人数据表 ================= */
  var ENEMIES = [
    {
      id: 'doc', name: '普通需求', hp: 100, speed: 0.42, build: VOX.enemyDoc,
      desc: '一沓会走路的需求文档，基准血量与移速。',
      stat: '血量 100 / 速度 0.42 格/s'
    },
    {
      id: 'urgent', name: '加急需求', hp: 200, speed: 0.52, build: VOX.enemyUrgent,
      desc: '冒火的需求文档，血量约 2 倍，走得也更快。',
      stat: '血量 200（普通 ×2）/ 速度 0.52 格/s'
    },
    {
      id: 'boss', name: '老板', hp: 400, speed: 0.26, build: VOX.enemyBoss,
      desc: '血量约 4 倍、全场最慢，但到达任一工位立即游戏结束——年假也挡不住。全场同时仅 1 个。',
      stat: '血量 400（普通 ×4）/ 速度 0.26 格/s（最慢）/ 到达即败'
    },
    {
      id: 'meeting', name: '临时会议', hp: 100, speed: 0.47, build: VOX.enemyMeeting,
      desc: '血量≈普通需求。遇到第一个我方单位时直接跳过去（每只只跳一次），落地后继续前进。',
      stat: '血量 100 / 速度 0.47 格/s / 跳跃 1 次'
    },
    {
      id: 'standup', name: '例会', hp: 200, speed: 0.40, build: VOX.enemyStandup,
      desc: '血量≈加急需求。第 6 波起出现，行进中每 10 秒在本行随机空格生成 1 个普通需求。',
      stat: '血量 200 / 速度 0.40 格/s / 10s 产 1 只普通需求'
    }
  ];

  /* ================= 波次编排（12 波，第 6 / 12 波一大波） ================= */
  var WAVES = [
    { list: ['doc', 'doc'], iv: 3.5 },
    { list: ['doc', 'doc', 'doc', 'urgent'], iv: 3.2 },
    { list: ['doc', 'doc', 'doc', 'doc', 'urgent'], iv: 3.0 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'meeting'], iv: 2.8 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'meeting', 'meeting'], iv: 2.5 },
    { big: true, list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'meeting', 'standup', 'boss'], iv: 1.8 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'standup'], iv: 2.3 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'meeting', 'standup'], iv: 2.1 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'meeting', 'standup', 'boss'], iv: 2.0 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'meeting', 'meeting', 'standup', 'standup'], iv: 1.8 },
    { list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'meeting', 'meeting', 'standup', 'standup', 'boss'], iv: 1.6 },
    { big: true, list: ['doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'doc', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'urgent', 'meeting', 'meeting', 'meeting', 'meeting', 'meeting', 'standup', 'standup', 'standup', 'boss'], iv: 1.3 }
  ];

  /* ================= DOM ================= */
  var $ = function (id) { return document.getElementById(id); };
  var canvas = $('game');
  var stage = $('stage');

  /* ================= Three.js 初始化 ================= */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(1280, 720, false);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc4d3de);

  var camera = new THREE.PerspectiveCamera(50, 1280 / 720, 0.5, 200);
  camera.position.set(0, 14.2, 18.4);
  camera.lookAt(-0.6, 1.0, 0.4);

  // 光照：半球光 + 主平行光（带阴影）+ 一点暖色补光
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x6f7686, 0.85));
  var sun = new THREE.DirectionalLight(0xfff2d8, 0.95);
  sun.position.set(12, 20, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -22; sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 18; sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 70;
  sun.shadow.bias = -0.0012;
  scene.add(sun);
  var fill = new THREE.DirectionalLight(0xbcd8ff, 0.32);
  fill.position.set(-14, 12, -10);
  scene.add(fill);

  // 场景
  var sceneInfo = VOX.buildScene({ cols: COLS, rows: ROWS, cell: CELL });
  scene.add(sceneInfo.group);
  var DESK_X = sceneInfo.deskX;

  /* ================= 坐标工具 ================= */
  function colX(c) { return (c - (COLS - 1) / 2) * CELL; }
  function rowZ(r) { return (r - (ROWS - 1) / 2) * CELL; }
  function cellCol(x) { return Math.round(x / CELL + (COLS - 1) / 2); }
  function cellRow(z) { return Math.round(z / CELL + (ROWS - 1) / 2); }
  function inGrid(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }

  var groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  var raycaster = new THREE.Raycaster();
  var ndc = new THREE.Vector2();

  function screenToGround(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    var pt = new THREE.Vector3();
    return raycaster.ray.intersectPlane(groundPlane, pt) ? pt : null;
  }

  function worldToScreen(v) {
    var p = v.clone().project(camera);
    return { x: (p.x * 0.5 + 0.5) * 1280, y: (-p.y * 0.5 + 0.5) * 720 };
  }

  /* ================= 游戏状态 ================= */
  var G = {
    running: false, paused: false, over: false, speed: 1,
    caffeine: 100, wave: 0, wavePhase: 'idle', waveTimer: 0,
    spawnQueue: [], spawnTimer: 0, waveSpawned: 0, waveTotal: 0,
    dropTimer: 0, time: 0,
    units: [], enemies: [], projectiles: [], particles: [], drops: [],
    slots: [0, 0, 0, 0, 0], leaveUsed: [false, false, false, false, false],
    cooldowns: {}, stats: { kills: 0 },
    drag: null, shovelSelected: false
  };
  UNITS.forEach(function (u) { G.cooldowns[u.id] = 0; });

  /* ================= 模型工具 ================= */
  function ghostify(group) {
    group.traverse(function (o) {
      if (o.isMesh) {
        o.material = new THREE.MeshLambertMaterial({
          color: 0x7fe0ff, transparent: true, opacity: 0.5, depthWrite: false
        });
        o.castShadow = false;
      }
    });
    return group;
  }

  function spawnDebris(x, y, z, color, count, power) {
    for (var i = 0; i < count; i++) {
      if (G.particles.length > 220) break;
      var b = VOX.Builder();
      var s = 0.12 + Math.random() * 0.22;
      b.add({ w: s, h: s, d: s, x: 0, y: 0, z: 0, c: color });
      var m = b.build();
      m.position.set(x + (Math.random() - 0.5) * 0.5, y + Math.random() * 0.4, z + (Math.random() - 0.5) * 0.5);
      scene.add(m);
      G.particles.push({
        mesh: m,
        vx: (Math.random() - 0.5) * (power || 3),
        vy: 2 + Math.random() * (power || 3),
        vz: (Math.random() - 0.5) * (power || 3),
        life: 0.7 + Math.random() * 0.5
      });
    }
  }

  function floatText(pos, text, color) {
    var s = worldToScreen(pos);
    var d = document.createElement('div');
    d.className = 'float-text';
    d.textContent = text;
    d.style.cssText = 'position:absolute;left:' + s.x + 'px;top:' + s.y +
      'px;color:' + (color || '#fff') + ';font-size:22px;font-weight:900;' +
      'text-shadow:0 2px 6px rgba(0,0,0,.55);pointer-events:none;z-index:40;transition:transform 1s ease-out,opacity 1s ease-out;';
    $('hud').appendChild(d);
    requestAnimationFrame(function () {
      d.style.transform = 'translateY(-52px)';
      d.style.opacity = '0';
    });
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 1050);
  }

  function showToast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.style.animation = 'none';
    void t.offsetWidth;
    t.style.animation = '';
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { t.classList.add('hidden'); }, 1400);
  }

  /* ================= 卡片栏 UI ================= */
  var cardEls = {};
  function buildCards() {
    var wrap = $('cards');
    wrap.innerHTML = '';
    UNITS.forEach(function (u) {
      var el = document.createElement('div');
      el.className = 'card';
      el.dataset.id = u.id;
      el.innerHTML =
        '<canvas class="card-icon" width="176" height="144"></canvas>' +
        '<div class="card-name">' + u.name + '</div>' +
        '<div class="card-cost">☕ ' + u.cost + '</div>' +
        '<div class="cool-mask"></div>';
      wrap.appendChild(el);
      cardEls[u.id] = el;
      attachCardEvents(el, u);
    });
    attachShovelEvents();
  }

  var tooltipTimer = null;
  function attachCardEvents(el, u) {
    el.addEventListener('mouseenter', function (e) {
      clearTimeout(tooltipTimer);
      tooltipTimer = setTimeout(function () { showTooltip(u, e.clientX, e.clientY); }, 500);
    });
    el.addEventListener('mousemove', function (e) {
      if (!$('tooltip').classList.contains('hidden')) positionTooltip(e.clientX, e.clientY);
    });
    el.addEventListener('mouseleave', function () {
      clearTimeout(tooltipTimer);
      $('tooltip').classList.add('hidden');
    });
    el.addEventListener('mousedown', function (e) {
      e.preventDefault();
      clearTimeout(tooltipTimer);
      $('tooltip').classList.add('hidden');
      if (G.over || !G.running) return;
      if (G.paused) { showToast('游戏已暂停，先点继续'); GameAudio.sfx('reject'); return; }
      if (G.cooldowns[u.id] > 0) { showToast('还在冷却中……'); GameAudio.sfx('reject'); return; }
      if (G.caffeine < u.cost) { showToast('咖啡因不够！'); GameAudio.sfx('reject'); return; }
      startDrag({ kind: 'unit', def: u }, e);
    });
  }

  function showTooltip(u, x, y) {
    var t = $('tooltip');
    t.innerHTML = '<b>' + u.name + '</b> <span class="tt-cost">☕ ' + u.cost + '</span><br>' +
      u.desc + '<br><span class="tt-cost">' + u.stat + '</span>';
    t.classList.remove('hidden');
    positionTooltip(x, y);
  }
  function positionTooltip(x, y) {
    var t = $('tooltip');
    var sx = x + 18, sy = y + 14;
    if (sx > 1050) sx = x - 250;
    if (sy > 560) sy = y - 150;
    t.style.left = sx + 'px';
    t.style.top = sy + 'px';
  }

  /* ================= 铲子 ================= */
  function attachShovelEvents() {
    var el = $('shovel');
    el.addEventListener('mousedown', function (e) {
      e.preventDefault();
      if (G.over || !G.running) return;
      startDrag({ kind: 'shovel' }, e);
    });
    el.addEventListener('click', function () {
      G.shovelSelected = !G.shovelSelected;
      el.classList.toggle('selected', G.shovelSelected);
      showToast(G.shovelSelected ? '铲子已选中：点击要铲除的单位' : '已取消铲子');
      GameAudio.sfx('ui');
    });
  }

  /* ================= 图鉴 ================= */
  function buildDex() {
    var uw = $('dexUnits'); uw.innerHTML = '';
    UNITS.forEach(function (u) {
      var c = document.createElement('div');
      c.className = 'dex-card';
      c.innerHTML =
        '<canvas width="168" height="168"></canvas>' +
        '<div class="d-name">' + u.name + (u.custom ? '<span class="tag custom">★ 自创单位</span>' : '<span class="tag">标准单位</span>') + '</div>' +
        '<div class="d-cost">☕ ' + u.cost + '　冷却 ' + u.cd + 's</div>' +
        '<div class="d-desc">' + u.desc + '</div>' +
        '<div class="d-stat">' + u.stat + '</div>';
      uw.appendChild(c);
      iconTargets.push({ canvas: c.querySelector('canvas'), build: u.build, w: 168, h: 168 });
    });
    var ew = $('dexEnemies'); ew.innerHTML = '';
    ENEMIES.forEach(function (e) {
      var c = document.createElement('div');
      c.className = 'dex-card';
      c.innerHTML =
        '<canvas width="168" height="168"></canvas>' +
        '<div class="d-name">' + e.name + '</div>' +
        '<div class="d-cost" style="color:#ff9c8f">敌方 · 工作</div>' +
        '<div class="d-desc">' + e.desc + '</div>' +
        '<div class="d-stat">' + e.stat + '</div>';
      ew.appendChild(c);
      iconTargets.push({ canvas: c.querySelector('canvas'), build: e.build, w: 168, h: 168 });
    });
    // 卡片栏小图标
    UNITS.forEach(function (u) {
      var cv = cardEls[u.id].querySelector('.card-icon');
      iconTargets.push({ canvas: cv, build: u.build, w: 176, h: 144 });
    });
    renderIcons();
  }
  var iconTargets = [];

  function renderIcons() {
    var ir = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    ir.setSize(168, 168, false);
    var isc = new THREE.Scene();
    isc.add(new THREE.HemisphereLight(0xffffff, 0x8890a4, 1.15));
    var dl = new THREE.DirectionalLight(0xfff4e0, 1.35);
    dl.position.set(3, 5, 4); isc.add(dl);
    var dl2 = new THREE.DirectionalLight(0x99bbff, 0.7);
    dl2.position.set(-4, 3, -2); isc.add(dl2);
    var dl3 = new THREE.DirectionalLight(0xffffff, 0.55);
    dl3.position.set(0, 2, 6); isc.add(dl3);
    var icam = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

    iconTargets.forEach(function (t) {
      var g = t.build();
      isc.add(g);
      ir.setSize(t.w, t.h, false);
      icam.aspect = t.w / t.h;
      icam.updateProjectionMatrix();
      var box = new THREE.Box3().setFromObject(g);
      var size = new THREE.Vector3(), center = new THREE.Vector3();
      box.getSize(size); box.getCenter(center);
      var dist = Math.max(size.x, size.y * 1.15, size.z) * 1.85 + 0.5;
      icam.position.set(center.x + dist * 0.66, center.y + dist * 0.52, center.z + dist * 0.78);
      icam.lookAt(center.x, center.y, center.z);
      ir.render(isc, icam);
      var ctx2 = t.canvas.getContext('2d');
      ctx2.clearRect(0, 0, t.w, t.h);
      ctx2.drawImage(ir.domElement, 0, 0, t.w, t.h);
      isc.remove(g);
    });
    ir.dispose();
  }

  /* ================= 高亮框（拖拽时的格子提示） ================= */
  var hlBuilder = new VOX.Builder();
  hlBuilder.add({ w: CELL - 0.16, h: 0.1, d: CELL - 0.16, x: 0, y: 0, z: 0, c: 0x63e06c, a: 0.42 });
  hlBuilder.add({ w: CELL, h: 0.16, d: 0.14, x: 0, y: 0, z: -CELL / 2 + 0.07, c: 0x63e06c, a: 0.85 });
  hlBuilder.add({ w: CELL, h: 0.16, d: 0.14, x: 0, y: 0, z: CELL / 2 - 0.07, c: 0x63e06c, a: 0.85 });
  hlBuilder.add({ w: 0.14, h: 0.16, d: CELL, x: -CELL / 2 + 0.07, y: 0, z: 0, c: 0x63e06c, a: 0.85 });
  hlBuilder.add({ w: 0.14, h: 0.16, d: CELL, x: CELL / 2 - 0.07, y: 0, z: 0, c: 0x63e06c, a: 0.85 });
  var highlight = hlBuilder.build();
  highlight.visible = false;
  highlight.position.y = 0.32;
  scene.add(highlight);
  function setHighlightColor(colorHex) {
    highlight.traverse(function (o) {
      if (o.isMesh) {
        o.material.color.setHex(colorHex);
      }
    });
  }

  /* ================= 拖拽种植 / 铲子 ================= */
  function startDrag(drag, e) {
    if (G.drag) return;
    G.drag = drag;
    drag.cell = null; drag.valid = false;
    if (drag.kind === 'unit') {
      drag.ghost = ghostify(drag.def.build());
      drag.ghost.visible = false;
      scene.add(drag.ghost);
    }
    highlight.visible = true;
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragUp);
    onDragMove(e);
    GameAudio.sfx('ui');
  }

  function onDragMove(e) {
    if (!G.drag) return;
    var pt = screenToGround(e.clientX, e.clientY);
    if (!pt) return;
    var c = cellCol(pt.x), r = cellRow(pt.z);
    var ok = inGrid(c, r);
    if (G.drag.kind === 'unit') {
      var occupied = ok && findUnitAt(c, r);
      var afford = G.caffeine >= G.drag.def.cost && G.cooldowns[G.drag.def.id] <= 0;
      G.drag.valid = ok && !occupied && afford;
      G.drag.cell = ok ? { c: c, r: r } : null;
      G.drag.ghost.visible = ok;
      if (ok) {
        G.drag.ghost.position.set(colX(c), 0.16, rowZ(r));
        G.drag.ghost.traverse(function (o) {
          if (o.isMesh) o.material.color.setHex(G.drag.valid ? 0x7fe0ff : 0xff6b6b);
        });
      }
      setHighlightColor(G.drag.valid ? 0x63e06c : (ok ? 0xff5b5b : 0xffa63c));
    } else {
      // 铲子：只有落在有单位的格子才有效
      var target = ok ? findUnitAt(c, r) : null;
      G.drag.valid = !!target;
      G.drag.target = target;
      G.drag.cell = ok ? { c: c, r: r } : null;
      setHighlightColor(target ? 0xff5b5b : 0xffa63c);
    }
    if (ok) highlight.position.set(colX(c), 0.32, rowZ(r));
    else {
      highlight.position.set(
        Math.max(-HALF_W - 0.9, Math.min(HALF_W + 0.9, pt.x)), 0.32,
        Math.max(-HALF_D - 0.9, Math.min(HALF_D + 0.9, pt.z)));
    }
  }

  function onDragUp(e) {
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragUp);
    if (!G.drag) return;
    var drag = G.drag;
    G.drag = null;
    highlight.visible = false;
    if (drag.kind === 'unit' && drag.ghost) scene.remove(drag.ghost);

    if (!drag.valid || !drag.cell) {
      if (drag.kind === 'shovel' && !drag.target) { /* 空挥铲子，不响 */ }
      else GameAudio.sfx('reject');
      return;
    }
    if (drag.kind === 'unit') {
      placeUnit(drag.def, drag.cell.c, drag.cell.r);
    } else if (drag.target) {
      removeUnit(drag.target, true);
    }
  }

  function findUnitAt(c, r) {
    for (var i = 0; i < G.units.length; i++) {
      if (G.units[i].col === c && G.units[i].row === r && G.units[i].alive) return G.units[i];
    }
    return null;
  }

  /* ================= 单位 ================= */
  function placeUnit(def, c, r) {
    var g = def.build();
    g.position.set(colX(c), 0.15, rowZ(r));
    scene.add(g);
    var u = {
      def: def, col: c, row: r, x: colX(c), z: rowZ(r),
      hp: def.hp, maxHp: def.hp, group: g, alive: true,
      t: Math.random() * 6, fireT: Math.random() * 0.4, prodT: 0,
      armT: 0, armed: def.type !== 'mine', fuseT: 0, boost: 1
    };
    if (def.type === 'mine') u.armed = false;
    if (def.type === 'bomb') u.fuseT = RESIGN_FUSE;
    G.units.push(u);
    G.caffeine -= def.cost;
    G.cooldowns[def.id] = def.cd;
    recalcAura();
    spawnDebris(u.x, 0.6, u.z, 0xffe6a0, 6, 2);
    GameAudio.sfx('plant');
    floatText(new THREE.Vector3(u.x, 2.2, u.z), def.name, '#ffe08a');
  }

  function removeUnit(u, byShovel) {
    if (!u.alive) return;
    u.alive = false;
    scene.remove(u.group);
    if (u.hpBar) { scene.remove(u.hpBar.bg); scene.remove(u.hpBar.fill); u.hpBar = null; }
    var idx = G.units.indexOf(u);
    if (idx >= 0) G.units.splice(idx, 1);
    recalcAura();
    if (byShovel) {
      spawnDebris(u.x, 0.9, u.z, 0xd8d2c0, 12, 3.4);
      GameAudio.sfx('shovel');
      floatText(new THREE.Vector3(u.x, 2.2, u.z), '已铲除', '#ffd0d0');
    }
  }

  function recalcAura() {
    var i, u;
    for (i = 0; i < G.units.length; i++) G.units[i].boost = 1;
    for (i = 0; i < G.units.length; i++) {
      u = G.units[i];
      if (u.def.type !== 'aura') continue;
      for (var j = 0; j < G.units.length; j++) {
        var v = G.units[j];
        if (v === u) continue;
        if (Math.abs(v.col - u.col) + Math.abs(v.row - u.row) === 1) v.boost = 1.5;
      }
    }
  }

  function makeHpBar(y, w) {
    var b = new VOX.Builder();
    b.add({ w: w, h: 0.1, d: 0.08, x: 0, y: 0, z: 0, c: 0x2b2b33 });
    var bg = b.build();
    var b2 = new VOX.Builder();
    b2.add({ w: w - 0.06, h: 0.12, d: 0.1, x: 0, y: 0, z: 0, c: 0x4ce06c });
    var fillBar = b2.build();
    bg.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.85; } });
    fillBar.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.95; } });
    bg.position.y = y; fillBar.position.y = y;
    scene.add(bg); scene.add(fillBar);
    return { bg: bg, fill: fillBar, w: w - 0.06, y: y };
  }

  function updateHpBar(bar, x, z, ratio, y) {
    if (!bar) return;
    ratio = Math.max(0, Math.min(1, ratio));
    bar.bg.position.set(x, y, z);
    bar.fill.position.set(x - (bar.w * (1 - ratio)) / 2, y, z);
    bar.fill.scale.x = Math.max(0.001, ratio);
    bar.fill.visible = ratio < 0.999;
    bar.bg.visible = ratio < 0.999;
    bar.fill.traverse(function (o) {
      if (o.isMesh) o.material.color.setHex(ratio > 0.5 ? 0x4ce06c : (ratio > 0.25 ? 0xe0c94c : 0xe05c4c));
    });
  }

  /* ================= 敌人 ================= */
  function pickSpawnRow() {
    var counts = [0, 0, 0, 0, 0];
    for (var i = 0; i < G.enemies.length; i++) counts[G.enemies[i].row]++;
    var min = Math.min.apply(null, counts);
    var cand = [];
    for (var r = 0; r < ROWS; r++) if (counts[r] <= min + 1) cand.push(r);
    return cand[(Math.random() * cand.length) | 0];
  }

  function spawnEnemy(typeId, atX, atRow) {
    var def = null;
    for (var i = 0; i < ENEMIES.length; i++) if (ENEMIES[i].id === typeId) def = ENEMIES[i];
    if (!def) return false;
    if (typeId === 'boss') {
      for (var b = 0; b < G.enemies.length; b++) {
        if (G.enemies[b].def.id === 'boss') return false;   // 全场最多 1 个老板
      }
    }
    var row = (atRow != null) ? atRow : pickSpawnRow();
    var g = def.build();
    var x = (atX != null) ? atX : SPAWN_X + Math.random() * 1.2;
    g.position.set(x, 0.15, rowZ(row));
    g.scale.set(0.01, 0.01, 0.01);
    scene.add(g);
    G.enemies.push({
      def: def, row: row, x: x, z: rowZ(row), alive: true,
      hp: def.hp, maxHp: def.hp, speed: def.speed,
      slowT: 0, stunT: 0, biteT: 0, spawnAnim: 0,
      state: 'walk', hasJumped: false, jump: null,
      group: g, t: Math.random() * 6, hpBar: null, target: null, spawnT: 0
    });
    if (typeId === 'boss') GameAudio.sfx('boss');
    return true;
  }

  function killEnemy(e, silent) {
    if (!e.alive) return;
    e.alive = false;
    scene.remove(e.group);
    if (e.hpBar) { scene.remove(e.hpBar.bg); scene.remove(e.hpBar.fill); e.hpBar = null; }
    var idx = G.enemies.indexOf(e);
    if (idx >= 0) G.enemies.splice(idx, 1);
    G.stats.kills++;
    if (!silent) {
      spawnDebris(e.x, 1.1, e.z, 0xf2e6c8, 9, 3);
      GameAudio.sfx('hit');
    }
  }

  /* ================= 弹幕 ================= */
  function fireProjectile(u, kind) {
    var mesh;
    if (kind === 'water') mesh = VOX.waterBall();
    else if (kind === 'hr') mesh = VOX.hrWave();
    else mesh = VOX.projectile();
    mesh.position.set(u.x + 0.7, 1.25, u.z);
    scene.add(mesh);
    G.projectiles.push({
      mesh: mesh, kind: kind, x: u.x + 0.7, y: 1.25, z: u.z,
      speed: kind === 'hr' ? 11 : 8.5,
      dmg: kind === 'water' ? 20 : (kind === 'hr' ? 10 : 25),
      row: u.row, t: 0
    });
    if (kind === 'water') GameAudio.sfx('water');
    else if (kind === 'hr') GameAudio.sfx('hr');
    else GameAudio.sfx('shoot');
    // 后坐力小动画
    u.recoil = 0.16;
  }

  function frontEnemyInRow(row, minX) {
    var best = null;
    for (var i = 0; i < G.enemies.length; i++) {
      var e = G.enemies[i];
      if (e.row !== row || !e.alive) continue;
      if (minX != null && e.x < minX) continue;
      if (e.state === 'arriving') continue;
      if (!best || e.x < best.x) best = e;
    }
    return best;
  }

  /* ================= 年假 / 槽位 ================= */
  var slotMeshes = [];
  function buildSlotVisuals() {
    for (var r = 0; r < ROWS; r++) {
      slotMeshes[r] = [];
      for (var s = 0; s < 4; s++) slotMeshes[r][s] = null;
    }
  }
  function refreshSlotVisuals() {
    for (var r = 0; r < ROWS; r++) {
      for (var s = 0; s < 4; s++) {
        var filled = s < G.slots[r];
        if (filled && !slotMeshes[r][s]) {
          var b = new VOX.Builder();
          b.add({ w: 0.5, h: 0.1, d: 0.62, x: 0, y: 0, z: 0, c: 0xf7f3e8 });
          b.add({ w: 0.46, h: 0.1, d: 0.58, x: 0.03, y: 0.11, z: 0.02, c: 0xe8e2d2 });
          b.add({ w: 0.42, h: 0.1, d: 0.54, x: -0.02, y: 0.22, z: -0.02, c: 0xf2ecdc });
          b.add({ w: 0.24, h: 0.06, d: 0.06, x: 0, y: 0.3, z: 0.2, c: 0xd63b2f });
          var m = b.build();
          m.position.set(DESK_X + 0.62 + s * 0.72, 1.62, rowZ(r));
          scene.add(m);
          slotMeshes[r][s] = m;
        } else if (!filled && slotMeshes[r][s]) {
          scene.remove(slotMeshes[r][s]);
          slotMeshes[r][s] = null;
        }
      }
    }
    updateYearBadge();
  }

  function updateYearBadge() {
    var wrap = $('yearBadge');
    var html = '<div style="position:absolute;left:16px;bottom:16px;display:flex;gap:8px;">';
    for (var r = 0; r < ROWS; r++) {
      html += '<div style="background:rgba(28,32,46,.82);border-radius:9px;padding:7px 11px;font-size:13px;font-weight:700;' +
        'color:' + (G.leaveUsed[r] ? '#8b93a8' : '#8ef0a2') + ';border:1.5px solid ' +
        (G.leaveUsed[r] ? 'rgba(139,147,168,.4)' : 'rgba(142,240,162,.5)') + '">' +
        '工位 ' + (r + 1) + '　年假 ' + (G.leaveUsed[r] ? '已用' : '✔') +
        '　<span style="color:#ffd97a">盘 ' + G.slots[r] + '/4</span></div>';
    }
    wrap.innerHTML = html + '</div>';
  }

  var flyPapers = [];
  function triggerLeave(row) {
    if (G.leaveUsed[row]) return;
    G.leaveUsed[row] = true;
    // 年假审批单从工位飞出
    var paper = VOX.leavePaper();
    paper.position.set(DESK_X + 2.2, 2.4, rowZ(row));
    paper.rotation.y = -Math.PI / 2;
    scene.add(paper);
    flyPapers.push({
      mesh: paper, t: 0, dur: 1.35, row: row,
      from: new THREE.Vector3(DESK_X + 2.2, 2.4, rowZ(row)),
      to: new THREE.Vector3(HALF_W + 1.0, 3.2, rowZ(row))
    });
    GameAudio.sfx('leave');
    floatText(new THREE.Vector3(DESK_X + 2.4, 3.4, rowZ(row)), '年假审批！', '#8ef0a2');
    showToast('工位 ' + (row + 1) + ' 请了年假——清空该行工作（但活还堆着）');
    // 清空该行敌人（0.35s 后生效，配合纸片飞出）
    setTimeout(function () {
      for (var i = G.enemies.length - 1; i >= 0; i--) {
        var e = G.enemies[i];
        if (e.row === row && e.state !== 'arriving') {
          spawnDebris(e.x, 1.2, e.z, 0x8ef0a2, 7, 3);
          killEnemy(e, true);
        }
      }
    }, 350);
  }

  /* ================= 波次 ================= */
  function showBanner() {
    var b = $('banner');
    b.classList.remove('hidden');
    b.style.animation = 'none';
    void b.offsetWidth;
    b.style.animation = '';
    GameAudio.sfx('warn');
  }

  function startWave() {
    var w = WAVES[G.wave];
    G.spawnQueue = shuffle(w.list.slice());
    G.waveTotal = G.spawnQueue.length;
    G.waveSpawned = 0;
    G.spawnTimer = 1.2;
    G.wavePhase = 'spawning';
    if (w.big) showBanner();
    else showToast('第 ' + (G.wave + 1) + ' 波开始了');
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function updateWaves(dt) {
    if (G.wavePhase === 'prep') {
      G.waveTimer -= dt;
      if (G.waveTimer <= 0) startWave();
    } else if (G.wavePhase === 'spawning') {
      G.spawnTimer -= dt;
      if (G.spawnTimer <= 0 && G.spawnQueue.length) {
        var type = G.spawnQueue[0];
        if (spawnEnemy(type)) {
          G.spawnQueue.shift();
          G.waveSpawned++;
          G.spawnTimer = WAVES[G.wave].iv * (0.75 + Math.random() * 0.5);
        } else {
          // 老板已上场 → 稍后重试
          G.spawnTimer = 1.5;
        }
      }
      if (!G.spawnQueue.length && G.enemies.length === 0) {
        if (G.wave >= WAVES.length - 1) { winGame(); return; }
        G.wave++;
        G.wavePhase = 'prep';
        G.waveTimer = WAVE_BREAK;
        showToast('第 ' + G.wave + ' 波守住了！下一波准备中……');
        GameAudio.sfx('collect');
      }
    }
  }

  /* ================= 胜负结算 ================= */
  function remainingLeave() {
    var n = 0;
    for (var i = 0; i < ROWS; i++) if (!G.leaveUsed[i]) n++;
    return n;
  }

  function endGame(win, reason) {
    if (G.over) return;
    G.over = true;
    G.running = true;
    GameAudio.stopBGM();
    GameAudio.sfx(win ? 'win' : 'lose');
    $('hud').classList.add('hidden');
    var es = $('endScreen');
    es.classList.remove('hidden');
    $('endTitle').textContent = win ? '准时下班！🎉' : '你被优化了';
    $('endFlavor').innerHTML = win
      ? '你守住了 5 个工位，撑过全部 12 波工作。<br>组员们说：组长，明天还能准时下班吗？'
      : (reason === 'boss'
        ? '<b>老板亲自走到了工位前。</b><br>「小王啊，这个需求今天必须上。」——年假也挡不住他。'
        : (reason === 'resign'
          ? '<b>老板同意了你的辞职。</b><br>「行，那你明天不用来了。」——赌辞职信，赌输就是赌输。'
          : '<b>工作堆爆了工位。</b><br>年假已经请过，这次没人能再帮你顶了。'));
    var slotsUsed = 0;
    for (var i = 0; i < ROWS; i++) slotsUsed += G.slots[i];
    $('endStats').innerHTML =
      '<div><span class="k">消灭工作数：</span>' + G.stats.kills + '</div>' +
      '<div><span class="k">剩余咖啡因：</span>' + Math.floor(G.caffeine) + '</div>' +
      '<div><span class="k">剩余年假数：</span>' + remainingLeave() + ' / 5</div>' +
      '<div><span class="k">工位工作堆积：</span>' + slotsUsed + ' / 20 盘</div>' +
      '<div><span class="k">守到波次：</span>第 ' + Math.min(G.wave + 1, 12) + ' 波 / 12</div>';
    $('endReview').textContent = '💼 打工人评价：' + reviewLine(win, slotsUsed);
  }

  function reviewLine(win, slotsUsed) {
    var praise = [
      '这防线稳得像我的工位——永远不乱。年度最佳组长就是你！',
      '守得漂亮！老板都改天再来，今晚不加班。',
      '咖啡机放得明明白白，摸鱼鱼缸控得死死的，你是懂打工的。'
    ];
    var soSo = [
      '守是守住了，但工位上那堆文件……你确定不用留下来处理一下？',
      '赢了，但赢得像周报里的「稳步推进」——过程相当惊险。',
      '下次少赌几次辞职信，你的肝和我的心都受不了。'
    ];
    var lose1 = [
      '被优化了？没事，下一家公司还会有新的需求、新的老板、新的加班。',
      '防线都没摆好就上，这波啊，这波是「裸辞式防守」。',
      '年假都请完了还顶不住，看来是排兵的问题，不是摸鱼的问题。'
    ];
    var lose2 = [
      '都撑到后半程了，最后掉链子——像极了周五下午的我。',
      '可惜，差一点就准时下班了。要不再来一局？',
      '这波怪海战术确实猛，但你的应对也确实……有提升空间。'
    ];
    if (win) return (slotsUsed <= 6 ? praise : soSo)[Math.floor(Math.random() * 3)];
    return (G.wave < 5 ? lose1 : lose2)[Math.floor(Math.random() * 3)];
  }

  function winGame() { endGame(true); }
  function loseGame(reason) {
    spawnDebris(0, 2, 0, 0xff5b5b, 20, 5);
    endGame(false, reason);
  }

  /* ================= 主逻辑更新 ================= */
  function update(dt) {
    G.time += dt;
    var i, u, e;

    // 冷却
    for (i = 0; i < UNITS.length; i++) {
      if (G.cooldowns[UNITS[i].id] > 0) G.cooldowns[UNITS[i].id] = Math.max(0, G.cooldowns[UNITS[i].id] - dt);
    }

    // 天降咖啡
    G.dropTimer -= dt;
    if (G.dropTimer <= 0) {
      G.dropTimer = DROP_INTERVAL;
      var cup = VOX.coffeeCup();
      var dx = colX((Math.random() * COLS) | 0), dz = rowZ((Math.random() * ROWS) | 0);
      cup.position.set(dx, 11, dz);
      scene.add(cup);
      G.drops.push({ mesh: cup, x: dx, z: dz, t: 0, phase: 'fall' });
    }
    for (i = G.drops.length - 1; i >= 0; i--) {
      var d = G.drops[i];
      d.t += dt;
      if (d.phase === 'fall') {
        d.mesh.position.y -= dt * 9;
        d.mesh.rotation.y += dt * 2;
        if (d.mesh.position.y <= 0.6) {
          d.mesh.position.y = 0.6;
          d.phase = 'wait';
          d.t = 0;
        }
      } else if (d.phase === 'wait') {
        d.mesh.rotation.y += dt * 1.6;
        d.mesh.position.y = 0.6 + Math.sin(d.t * 5) * 0.08;
        if (d.t > 0.55) {
          G.caffeine += DROP_AMOUNT;
          GameAudio.sfx('collect');
          floatText(new THREE.Vector3(d.x, 1.8, d.z), '+' + DROP_AMOUNT + ' 咖啡因', '#ffd97a');
          scene.remove(d.mesh);
          G.drops.splice(i, 1);
        }
      }
    }

    updateWaves(dt);

    // ---- 单位 ----
    for (i = G.units.length - 1; i >= 0; i--) {
      u = G.units[i];
      u.t += dt;
      // 待机轻微起伏
      var idleY = 0.15 + Math.sin(u.t * 1.6) * 0.035;
      u.group.position.y = idleY;
      if (u.recoil && u.recoil > 0) {
        u.recoil = Math.max(0, u.recoil - dt * 1.4);
        u.group.position.x = u.x + u.recoil;
      } else u.group.position.x = u.x;

      switch (u.def.type) {
        case 'produce':
          u.prodT += dt * u.boost;
          if (u.prodT >= 10) {
            u.prodT = 0;
            G.caffeine += 25;
            GameAudio.sfx('brew');
            floatText(new THREE.Vector3(u.x, 2.4, u.z), '+25 咖啡因', '#ffd97a');
            spawnDebris(u.x, 1.9, u.z, 0xffd97a, 3, 1.6);
          }
          break;
        case 'shoot':
          u.fireT += dt * u.boost;
          if (u.fireT >= 1.5 && frontEnemyInRow(u.row, u.x - 0.5)) {
            u.fireT = 0;
            fireProjectile(u, 'doc');
          }
          break;
        case 'water':
          u.fireT += dt * u.boost;
          if (u.fireT >= 1.6 && frontEnemyInRow(u.row, u.x - 0.5)) {
            u.fireT = 0;
            fireProjectile(u, 'water');
          }
          break;
        case 'hr':
          u.fireT += dt * u.boost;
          if (u.fireT >= 6 && frontEnemyInRow(u.row, u.x - 0.5)) {
            u.fireT = 0;
            fireProjectile(u, 'hr');
          }
          break;
        case 'mine':
          if (!u.armed) {
            u.armT += dt;
            if (u.armT >= MINE_ARM_TIME) {
              u.armed = true;
              // 武装完成：屏幕变绿 + 提示灯
              var b = new VOX.Builder();
              b.add({ w: 0.28, h: 0.28, d: 0.28, x: 0, y: 0, z: 0, c: 0x4ce06c });
              var lamp = b.build();
              lamp.position.set(u.x, 2.15, u.z);
              scene.add(lamp);
              u.lamp = lamp;
              spawnDebris(u.x, 1.6, u.z, 0x4ce06c, 6, 2);
              floatText(new THREE.Vector3(u.x, 2.6, u.z), '就绪！', '#8ef0a2');
              GameAudio.sfx('collect');
            }
          } else if (u.lamp) {
            u.lamp.position.y = 2.15 + Math.sin(u.t * 4) * 0.1;
            u.lamp.rotation.y += dt * 2;
          }
          break;
        case 'bomb':
          u.fuseT -= dt;
          u.group.rotation.y += dt * 2.2;
          u.group.position.y = idleY + Math.sin(u.t * 9) * 0.08;
          if (u.fuseT <= 0) {
            // 清空全场敌人
            GameAudio.sfx('explode');
            for (var k = G.enemies.length - 1; k >= 0; k--) {
              var ee = G.enemies[k];
              spawnDebris(ee.x, 1.2, ee.z, 0xffd97a, 6, 3.2);
              killEnemy(ee, true);
            }
            spawnDebris(u.x, 1.4, u.z, 0xff8a3c, 22, 6);
            removeUnit(u, false);
            if (Math.random() < RESIGN_FAIL_RATE) {
              showToast('老板同意了你的辞职……游戏结束！');
              loseGame('resign');
              return;
            } else {
              showToast('辞职信生效！全场工作作鸟兽散！');
            }
            continue;
          }
          break;
      }

      // 血量条
      if (u.hp < u.maxHp && u.alive) {
        if (!u.hpBar) u.hpBar = makeHpBar(2.35, 1.25);
        updateHpBar(u.hpBar, u.x, u.z, u.hp / u.maxHp, 2.35);
      } else if (u.hpBar && u.hp >= u.maxHp) {
        updateHpBar(u.hpBar, u.x, u.z, 1, 2.35);
      }
    }

    // ---- 敌人 ----
    for (i = G.enemies.length - 1; i >= 0; i--) {
      e = G.enemies[i];
      if (!e.alive) continue;
      e.t += dt;

      // 出场缩放动画
      if (e.spawnAnim < 1) {
        e.spawnAnim = Math.min(1, e.spawnAnim + dt * 3.2);
        var s = 0.25 + e.spawnAnim * 0.75;
        e.group.scale.set(s, s, s);
      }

      if (e.state === 'arriving') {
        e.arriveT += dt / 0.85;
        var k2 = Math.min(1, e.arriveT);
        var tx = DESK_X + 1.9, ty = 2.0, tz = rowZ(e.row);
        e.group.position.x = e.x + (tx - e.x) * k2;
        e.group.position.y = 0.15 + (ty - 0.15) * k2;
        e.group.position.z = e.z + (tz - e.z) * k2;
        var sc = 1 - k2 * 0.82;
        e.group.scale.set(sc, sc, sc);
        e.group.rotation.y += dt * 7;
        if (k2 >= 1) {
          G.slots[e.row]++;
          GameAudio.sfx('slot');
          spawnDebris(tx, 2.0, tz, 0xf2e6c8, 5, 1.8);
          killEnemy(e, true);
          refreshSlotVisuals();
          if (G.slots[e.row] >= 4) triggerLeave(e.row);
        }
        continue;
      }

      if (e.state === 'jump' && e.jump) {
        var jt = e.jump;
        jt.t += dt / 0.85;
        var jk = Math.min(1, jt.t);
        e.group.position.x = jt.x0 + (jt.x1 - jt.x0) * jk;
        e.group.position.y = 0.15 + Math.sin(jk * Math.PI) * 1.75;
        e.group.rotation.z = Math.sin(jk * Math.PI * 2) * 0.55;
        if (jk >= 1) {
          e.x = jt.x1;
          e.group.position.y = 0.15;
          e.group.rotation.z = 0;
          e.state = 'walk';
          e.jump = null;
        }
        continue;
      }

      // 减速 / 眩晕计时
      if (e.slowT > 0) e.slowT -= dt;
      if (e.stunT > 0) e.stunT -= dt;

      // 行走动画
      var waddle = Math.sin(e.t * 6.2);
      e.group.position.x = e.x;
      e.group.position.z = e.z;
      e.group.position.y = 0.15 + Math.abs(Math.sin(e.t * 6.2)) * 0.07;
      e.group.rotation.z = waddle * 0.055;
      e.group.rotation.y = -0.5 + Math.sin(e.t * 2.4) * 0.08;   // 面向镜头偏左（行进方向）

      // 例会产怪
      if (e.def.id === 'standup') {
        e.spawnT += dt;
        if (e.spawnT >= 10) {
          e.spawnT = 0;
          var cc = (Math.random() * COLS) | 0;
          if (spawnEnemy('doc', colX(cc), e.row)) {
            spawnDebris(colX(cc), 1.4, e.z, 0x9fd6ff, 5, 2);
            floatText(new THREE.Vector3(colX(cc), 2.6, e.z), '新增需求！', '#ffd0a0');
            GameAudio.sfx('plant');
          }
        }
      }

      // 碰撞 / 咬
      var blocker = null;
      for (var j = 0; j < G.units.length; j++) {
        var uj = G.units[j];
        if (!uj.alive || uj.row !== e.row) continue;
        if (Math.abs(uj.x - e.x) < 1.02) { if (!blocker || uj.x > blocker.x) blocker = uj; }
      }

      if (blocker && blocker.def.type === 'mine' && blocker.armed) {
        // 假装在忙：踩中秒杀
        GameAudio.sfx('explode');
        spawnDebris(e.x, 1.2, e.z, 0x4ce06c, 16, 4.5);
        spawnDebris(blocker.x, 1.0, blocker.z, 0x8a6a44, 12, 4);
        floatText(new THREE.Vector3(e.x, 2.4, e.z), '当场戳穿！', '#8ef0a2');
        killEnemy(e, true);
        removeUnit(blocker, false);
        continue;
      }

      if (blocker && e.def.id === 'meeting' && !e.hasJumped && e.state === 'walk') {
        // 临时会议：跳过第一个单位
        e.hasJumped = true;
        e.state = 'jump';
        e.jump = { x0: e.x, x1: Math.max(ARRIVE_X, blocker.x - 1.45), t: 0 };
        GameAudio.sfx('jump');
        continue;
      }

      if (blocker) {
        if (e.state !== 'bite') { e.state = 'bite'; e.biteT = 0.35; e.target = blocker; }
        e.target = blocker;
        e.biteT -= dt;
        if (e.biteT <= 0) {
          e.biteT = BITE_INTERVAL;
          blocker.hp -= BITE_DMG;
          GameAudio.sfx('bite');
          spawnDebris(blocker.x, 1.0, blocker.z, 0xd8d2c0, 2, 1.2);
          if (blocker.hp <= 0) {
            spawnDebris(blocker.x, 1.0, blocker.z, 0xc9995c, 10, 3);
            removeUnit(blocker, false);
            e.state = 'walk';
            e.target = null;
          }
        }
      } else if (e.state === 'bite') {
        e.state = 'walk';
        e.target = null;
      }

      // 移动
      if (e.state === 'walk' && e.stunT <= 0) {
        var spd = e.speed * CELL * (e.slowT > 0 ? 0.5 : 1);
        e.x -= spd * dt;
        if (e.x <= ARRIVE_X) {
          if (e.def.id === 'boss') {
            showToast('老板走到了工位前……');
            loseGame('boss');
            return;
          }
          if (G.leaveUsed[e.row]) {
            showToast('工位 ' + (e.row + 1) + ' 已无年假可挡！');
            loseGame('overflow');
            return;
          }
          e.state = 'arriving';
          e.arriveT = 0;
          GameAudio.sfx('slot');
        }
      }

      // 受击血条
      if (e.hp < e.maxHp) {
        if (!e.hpBar) e.hpBar = makeHpBar(2.75, 1.5);
        updateHpBar(e.hpBar, e.x, e.z, e.hp / e.maxHp, 2.75);
      }
    }

    // ---- 弹幕 ----
    for (i = G.projectiles.length - 1; i >= 0; i--) {
      var p = G.projectiles[i];
      p.t += dt;
      p.x -= p.speed * dt;
      p.mesh.position.set(p.x, p.y + Math.sin(p.t * 8) * 0.06, p.z);
      p.mesh.rotation.x += dt * 7;
      p.mesh.rotation.y += dt * 5;
      var hit = null;
      for (var q = 0; q < G.enemies.length; q++) {
        var eq = G.enemies[q];
        if (eq.row !== p.row || !eq.alive || eq.state === 'arriving') continue;
        if (p.x <= eq.x + 0.55 && p.x >= eq.x - 1.0) { hit = eq; break; }
      }
      if (hit) {
        hit.hp -= p.dmg;
        if (p.kind === 'water') hit.slowT = 5;
        if (p.kind === 'hr') {
          hit.stunT = 1.5;
          hit.x = Math.min(SPAWN_X - 0.4, hit.x + 2.0);   // 击退 1 格
          hit.state = 'walk';
          spawnDebris(hit.x, 1.3, hit.z, 0xffd23f, 5, 2.4);
          floatText(new THREE.Vector3(hit.x, 2.6, hit.z), '约谈！', '#ffd23f');
        }
        spawnDebris(p.x, 1.2, p.z, p.kind === 'water' ? 0x59c2f0 : 0xf2e6c8, 3, 1.8);
        GameAudio.sfx('hit');
        if (hit.hp <= 0) {
          floatText(new THREE.Vector3(hit.x, 2.4, hit.z), '搞定！', '#8ef0a2');
          killEnemy(hit, true);
          spawnDebris(hit.x, 1.1, hit.z, 0xf2e6c8, 8, 3);
          GameAudio.sfx('hit');
        }
        scene.remove(p.mesh);
        G.projectiles.splice(i, 1);
        continue;
      }
      if (p.x < ARRIVE_X - 2) {
        scene.remove(p.mesh);
        G.projectiles.splice(i, 1);
      }
    }

    // ---- 粒子 ----
    for (i = G.particles.length - 1; i >= 0; i--) {
      var pt = G.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) { scene.remove(pt.mesh); G.particles.splice(i, 1); continue; }
      pt.vy -= 12 * dt;
      pt.mesh.position.x += pt.vx * dt;
      pt.mesh.position.y += pt.vy * dt;
      pt.mesh.position.z += pt.vz * dt;
      pt.mesh.rotation.x += dt * 4;
      pt.mesh.rotation.y += dt * 5;
      if (pt.mesh.position.y < 0.12) { pt.mesh.position.y = 0.12; pt.vy *= -0.35; pt.vx *= 0.7; pt.vz *= 0.7; }
    }

    // ---- 飞行道具（年假审批单等） ----
    for (i = flyPapers.length - 1; i >= 0; i--) {
      var f = flyPapers[i];
      f.t += dt;
      var fk = Math.min(1, f.t / f.dur);
      f.mesh.position.lerpVectors(f.from, f.to, fk);
      f.mesh.position.y += Math.sin(fk * Math.PI) * 1.4;
      f.mesh.rotation.z = Math.sin(fk * 6) * 0.35;
      f.mesh.rotation.y = -Math.PI / 2 + fk * Math.PI * 2;
      if (fk >= 1) { scene.remove(f.mesh); flyPapers.splice(i, 1); }
    }

    updateHUD();
  }

  /* ================= HUD ================= */
  var hudTick = 0;
  function updateHUD() {
    $('caffeineVal').textContent = Math.floor(G.caffeine);
    hudTick++;
    if (hudTick % 4 === 0) {
      for (var i = 0; i < UNITS.length; i++) {
        var u = UNITS[i];
        var el = cardEls[u.id];
        var cd = G.cooldowns[u.id];
        var mask = el.querySelector('.cool-mask');
        mask.style.height = (cd > 0 ? (cd / u.cd * 100) : 0) + '%';
        var dis = (G.caffeine < u.cost) || cd > 0;
        el.classList.toggle('disabled', dis);
      }
      var total = WAVES.length;
      var frac = 0;
      if (G.wavePhase === 'spawning') frac = G.waveTotal ? G.waveSpawned / G.waveTotal : 1;
      if (G.wavePhase === 'done') frac = 1;
      var overall = (G.wave + frac) / total;
      $('waveBarInner').style.width = Math.min(100, overall * 100).toFixed(1) + '%';
      if (G.wavePhase === 'prep') {
        $('waveText').textContent = '第 ' + (G.wave + 1) + ' 波 / 12　—　下一波 ' + Math.ceil(G.waveTimer) + 's';
      } else if (G.wavePhase === 'spawning') {
        var left = G.spawnQueue.length + G.enemies.length;
        $('waveText').textContent = '第 ' + (G.wave + 1) + ' 波 / 12　—　剩余工作 ' + left;
      }
    }
  }

  /* ================= 开始 / 重开 ================= */
  function clearEntities() {
    var i;
    for (i = 0; i < G.units.length; i++) scene.remove(G.units[i].group);
    for (i = 0; i < G.enemies.length; i++) {
      scene.remove(G.enemies[i].group);
      if (G.enemies[i].hpBar) { scene.remove(G.enemies[i].hpBar.bg); scene.remove(G.enemies[i].hpBar.fill); }
    }
    for (i = 0; i < G.projectiles.length; i++) scene.remove(G.projectiles[i].mesh);
    for (i = 0; i < G.particles.length; i++) scene.remove(G.particles[i].mesh);
    for (i = 0; i < G.drops.length; i++) scene.remove(G.drops[i].mesh);
    for (i = 0; i < flyPapers.length; i++) scene.remove(flyPapers[i].mesh);
    for (var r = 0; r < ROWS; r++) {
      for (var s = 0; s < 4; s++) if (slotMeshes[r] && slotMeshes[r][s]) { scene.remove(slotMeshes[r][s]); slotMeshes[r][s] = null; }
    }
    G.units = []; G.enemies = []; G.projectiles = []; G.particles = [];
    G.drops = []; flyPapers = [];
  }

  function startGame() {
    clearEntities();
    G.caffeine = 100;
    G.wave = 0;
    G.wavePhase = 'prep';
    G.waveTimer = FIRST_BREAK;
    G.spawnQueue = [];
    G.spawnTimer = 0;
    G.waveSpawned = 0;
    G.waveTotal = 0;
    G.dropTimer = 4;
    G.slots = [0, 0, 0, 0, 0];
    G.leaveUsed = [false, false, false, false, false];
    G.stats = { kills: 0 };
    G.over = false;
    G.paused = false;
    G.running = true;
    G.shovelSelected = false;
    $('shovel').classList.remove('selected');
    UNITS.forEach(function (u) { G.cooldowns[u.id] = 0; });
    refreshSlotVisuals();
    $('btnPause').textContent = '⏸ 暂停';
    $('endScreen').classList.add('hidden');
    $('startScreen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    GameAudio.resume();
    GameAudio.startBGM();
    updateHUD();
  }

  /* ================= 按钮 / 键盘 ================= */
  function bindUI() {
    $('btnStart').addEventListener('click', function () {
      GameAudio.resume();
      GameAudio.sfx('ui');
      startGame();
    });
    $('btnAgain').addEventListener('click', function () {
      GameAudio.resume();
      GameAudio.sfx('ui');
      startGame();
    });
    $('btnRestart').addEventListener('click', function () {
      GameAudio.sfx('ui');
      showToast('重新开始本局');
      startGame();
    });
    $('btnPause').addEventListener('click', function () {
      if (G.over) return;
      G.paused = !G.paused;
      this.textContent = G.paused ? '▶ 继续' : '⏸ 暂停';
      GameAudio.sfx('ui');
      showToast(G.paused ? '已暂停' : '继续上班');
    });
    $('btnSpeed').addEventListener('click', function () {
      G.speed = (G.speed === 1) ? 2 : 1;
      this.textContent = G.speed === 2 ? '⏩ ×1' : '⏩ ×2';
      this.classList.toggle('on', G.speed === 2);
      GameAudio.sfx('ui');
      showToast('游戏速度 ×' + G.speed);
    });
    $('btnMute').addEventListener('click', function () {
      var m = !GameAudio.isMuted();
      GameAudio.setMuted(m);
      this.textContent = m ? '🔇' : '🔊';
      if (!m) GameAudio.sfx('ui');
    });

    function openDex() {
      $('dexScreen').classList.remove('hidden');
      GameAudio.sfx('ui');
    }
    function closeDex() {
      $('dexScreen').classList.add('hidden');
      GameAudio.sfx('ui');
    }
    $('btnDex').addEventListener('click', openDex);
    $('btnDexStart').addEventListener('click', openDex);
    $('btnDexEnd').addEventListener('click', openDex);
    $('btnDexClose').addEventListener('click', closeDex);

    var tabs = document.querySelectorAll('.dex-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
        this.classList.add('active');
        var isUnits = this.dataset.tab === 'units';
        $('dexUnits').classList.toggle('hidden', !isUnits);
        $('dexEnemies').classList.toggle('hidden', isUnits);
        GameAudio.sfx('ui');
      });
    }

    // 画布点击：用于铲子选中模式下点击铲除
    canvas.addEventListener('mousedown', function (e) {
      if (G.shovelSelected && G.running && !G.over && !G.paused) {
        var pt = screenToGround(e.clientX, e.clientY);
        if (pt) {
          var c = cellCol(pt.x), r = cellRow(pt.z);
          var u = inGrid(c, r) ? findUnitAt(c, r) : null;
          if (u) {
            removeUnit(u, true);
            G.shovelSelected = false;
            $('shovel').classList.remove('selected');
          }
        }
      }
    });

    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $('dexScreen').classList.add('hidden');
        if (G.drag && G.drag.kind === 'unit' && G.drag.ghost) scene.remove(G.drag.ghost);
        G.drag = null;
        highlight.visible = false;
        G.shovelSelected = false;
        $('shovel').classList.remove('selected');
        $('tooltip').classList.add('hidden');
      }
      if (e.key === ' ') {
        e.preventDefault();
        $('btnPause').click();
      }
    });

    // 视口缩放（等比适配，画布内始终保持 1280×720）
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      var s = Math.min(w / 1280, h / 720);
      stage.style.transform = 'scale(' + s + ')';
      stage.style.left = ((w - 1280 * s) / 2) + 'px';
      stage.style.top = ((h - 720 * s) / 2) + 'px';
    }
    window.addEventListener('resize', resize);
    resize();
  }

  /* ================= 主循环 ================= */
  var last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.06) dt = 0.06;
    if (G.running && !G.paused && !G.over) {
      update(dt * G.speed);
    } else {
      // 暂停/结束时仍缓慢推进微小装饰动画（相机与渲染保持流畅）
      for (var i = 0; i < G.particles.length; i++) {
        var pt = G.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) { scene.remove(pt.mesh); G.particles.splice(i, 1); i--; }
      }
    }
    renderer.render(scene, camera);
  }

  /* ================= 启动 ================= */
  buildSlotVisuals();
  buildCards();
  buildDex();
  bindUI();
  updateYearBadge();
  requestAnimationFrame(loop);

  // —— 自动化调试钩子（仅提供坐标/状态查询，不影响游戏逻辑）——
  window.__cellClientPos = function (c, r) {
    var rect = canvas.getBoundingClientRect();
    var s = worldToScreen(new THREE.Vector3(colX(c), 0.3, rowZ(r)));
    return { x: rect.left + s.x / 1280 * rect.width, y: rect.top + s.y / 720 * rect.height };
  };
  window.__gameState = G;
})();
