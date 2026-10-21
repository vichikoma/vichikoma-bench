/* =============================================================================
 * ui.js — DOM 界面层（HUD / 卡片栏 / 铲子 / 悬浮介绍 / 图鉴 / 结算界面）
 * 卡片图标不是图片文件，而是把 3D 体素模型实时渲到离屏 canvas 再贴进卡片，
 * 所以「一眼能认出是什么」同时也是模型质量的验收。
 * ===========================================================================*/
(function (global) {
  'use strict';

  var D = document;
  var el = function (id) { return D.getElementById(id); };
  var stage, canvas, UIEL;

  // ---------------------------------------------------------------- 图标渲染
  var icon = { r: null, sc: null, cam: null, key: {} };
  function initIconRenderer() {
    var c = D.createElement('canvas');
    icon.r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    icon.r.setSize(160, 160, false);
    icon.r.setPixelRatio(1);
    icon.r.setClearColor(0x000000, 0);
    icon.sc = new THREE.Scene();
    icon.sc.add(new THREE.HemisphereLight(0xffffff, 0x555566, 1.15));
    var d1 = new THREE.DirectionalLight(0xffffff, 0.9); d1.position.set(4, 6, 5); icon.sc.add(d1);
    var d2 = new THREE.DirectionalLight(0xbcd8ff, 0.35); d2.position.set(-5, 3, -4); icon.sc.add(d2);
    icon.cam = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  }
  /** 把模型渲染到 w×h 的 canvas 上并返回它 */
  function renderIcon(modelName, w, h) {
    icon.r.setSize(w, h, false);
    var g = VoxModel.instantiate(modelName, { noShadow: true });
    icon.sc.add(g);
    var box = new THREE.Box3().setFromObject(g);
    var c = box.getCenter(new THREE.Vector3());
    var size = box.getSize(new THREE.Vector3());
    var radius = Math.max(size.x, size.y, size.z) * 0.5 + 0.001;
    var dist = radius / Math.sin(icon.cam.fov * Math.PI / 360) * 1.34;
    var dir = new THREE.Vector3(0.82, 0.62, 1.15).normalize();
    icon.cam.aspect = w / h; icon.cam.updateProjectionMatrix();
    icon.cam.position.copy(c).addScaledVector(dir, dist);
    icon.cam.lookAt(c);
    icon.r.render(icon.sc, icon.cam);
    // 拷到 2D canvas，避免每张卡片各占一个 WebGL 上下文
    var out = D.createElement('canvas'); out.width = w; out.height = h;
    out.getContext('2d').drawImage(icon.r.domElement, 0, 0, w, h);
    icon.sc.remove(g);
    return out;
  }

  // ---------------------------------------------------------------- 悬浮介绍
  var tooltip = null, tipTimer = null, tipEl = null;
  function bindTooltip(cardEl, key) {
    var u = CFG.UNITS[key];
    cardEl.addEventListener('mouseenter', function () {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () { showTip(cardEl, key); }, 500);
    });
    cardEl.addEventListener('mouseleave', function () { clearTimeout(tipTimer); hideTip(); });
  }
  function showTip(cardEl, key) {
    var u = CFG.UNITS[key];
    var extra = u.created ? '<span style="font-size:10px;color:#ffd166;border:1px solid #ffd166;border-radius:5px;padding:0 4px;margin-left:6px">自创</span>' : '';
    tipEl.innerHTML =
      '<div class="tt-name"><span>' + u.name + extra + '</span><span class="tt-cost">' + u.cost + ' ☕</span></div>' +
      '<div class="tt-sub">' + u.short + ' · 冷却 ' + u.cd + 's · 血量 ' + (u.hp > 9000 ? '—' : u.hp) + '</div>' +
      '<div class="tt-desc">' + u.desc + '</div>' +
      '<div class="tt-tip">「' + u.tip + '」</div>';
    tipEl.classList.add('show');
    var r = cardEl.getBoundingClientRect(), s = stage.getBoundingClientRect();
    var sc = s.width / 1280;
    var x = (r.left - s.left) / sc + r.width / 2 - 125;
    x = Math.max(8, Math.min(1280 - 258, x));
    tipEl.style.left = x + 'px';
    tipEl.style.top = Math.max(4, (r.top - s.top) / sc - 152) + 'px';
  }
  function hideTip() { if (tipEl) tipEl.classList.remove('show'); }

  // ---------------------------------------------------------------- 铲子幽灵
  // 铲子的默认交互是「把铲子拖到单位上」，所以拖拽时要有一个跟着光标的铲子。
  // 用 fixed 定位挂在 body 上：不随舞台缩放（像光标一样恒定大小），也不会被舞台裁掉。
  var shovelGhost = null;
  function shovelGhostShow() {
    if (shovelGhost) return;
    shovelGhost = D.createElement('div');
    shovelGhost.id = 'shovel-ghost';
    shovelGhost.innerHTML = '<i class="g-handle"></i><i class="g-blade"></i>';
    D.body.appendChild(shovelGhost);
  }
  function shovelGhostMove(x, y) {
    if (!shovelGhost) return;
    shovelGhost.style.left = x + 'px';
    shovelGhost.style.top = y + 'px';
  }
  function shovelGhostHide() {
    if (!shovelGhost) return;
    D.body.removeChild(shovelGhost);
    shovelGhost = null;
  }
  function shovelGhostOn(on) {
    if (shovelGhost) shovelGhost.classList.toggle('hot', !!on);
  }

  // ---------------------------------------------------------------- 卡片栏
  var cards = {};
  var handlers = {};
  function buildCards() {
    var bar = el('cardbar');
    bar.innerHTML = '';
    // 铲子
    var sh = D.createElement('div');
    sh.id = 'shovel';
    sh.innerHTML = '<div class="sh-ico"><i class="sh-handle"></i><i class="sh-blade"></i></div><div class="sh-txt">铲子</div>';
    sh.addEventListener('mousedown', function (ev) {
      // 默认交互：按住铲子直接拖到单位上松手即铲除（见 game.js 的 shovelDrag）。
      // 若只是原地按一下（未移动），game.js 会把它当成「点选铲子」。
      ev.preventDefault();
      hideTip();
      handlers.shovelDown && handlers.shovelDown(ev);
    });
    sh.addEventListener('mouseenter', function () {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(function () {
        tipEl.innerHTML = '<div class="tt-name"><span>铲子</span></div>' +
          '<div class="tt-sub">工具 · 随时可用</div>' +
          '<div class="tt-desc">把铲子<b>拖到</b>已布置的单位上松手，即可铲除并清空格子（也可以先点一下铲子选中，再点单位）。</div>' +
          '<div class="tt-tip">「这活得重做」</div>';
        tipEl.classList.add('show');
        var r = sh.getBoundingClientRect(), s = stage.getBoundingClientRect(), sc = s.width / 1280;
        var x = Math.max(8, (r.left - s.left) / sc + r.width / 2 - 125);
        tipEl.style.left = x + 'px';
        tipEl.style.top = Math.max(4, (r.top - s.top) / sc - 152) + 'px';
      }, 500);
    });
    sh.addEventListener('mouseleave', function () { clearTimeout(tipTimer); hideTip(); });
    bar.appendChild(sh);
    cards.__shovel = sh;

    var sep = D.createElement('div'); sep.className = 'cardbar-sep'; bar.appendChild(sep);

    CFG.UNIT_ORDER.forEach(function (key) {
      var u = CFG.UNITS[key];
      var c = D.createElement('div');
      c.className = 'card';
      c.dataset.key = key;
      var ic = D.createElement('div'); ic.className = 'icon';
      ic.appendChild(renderIcon(u.model, 136, 124));
      c.appendChild(ic);
      var nm = D.createElement('div'); nm.className = 'cname'; nm.textContent = u.name; c.appendChild(nm);
      var co = D.createElement('div'); co.className = 'ccost'; co.innerHTML = u.cost + '<span>☕</span>'; c.appendChild(co);
      if (u.created) { var b = D.createElement('div'); b.className = 'badge'; b.textContent = '自创'; c.appendChild(b); }
      var mask = D.createElement('div'); mask.className = 'cdmask'; mask.style.height = '0%'; c.appendChild(mask);
      var txt = D.createElement('div'); txt.className = 'cdtext'; txt.style.display = 'none'; c.appendChild(txt);
      bar.appendChild(c);
      cards[key] = { el: c, mask: mask, txt: txt };
      bindTooltip(c, key);
      c.addEventListener('mousedown', function (e) {
        hideTip();
        handlers.cardDown && handlers.cardDown(key, e);
      });
      c.addEventListener('click', function (e) { handlers.cardClick && handlers.cardClick(key, e); });
    });
  }

  function updateCards(caf, cds, draggingKey, shovelOn) {
    CFG.UNIT_ORDER.forEach(function (key) {
      var u = CFG.UNITS[key], c = cards[key];
      var cd = cds[key] || 0;
      var poor = caf < u.cost;
      var no = poor || cd > 0;
      c.el.classList.toggle('disabled', no);
      c.el.classList.toggle('dragging', draggingKey === key);
      c.el.classList.toggle('selected', shovelOn && false);
      if (cd > 0) {
        c.mask.style.height = Math.min(100, (cd / u.cd) * 100) + '%';
        c.txt.style.display = 'flex';
        c.txt.textContent = cd >= 10 ? Math.ceil(cd) : cd.toFixed(1);
      } else if (poor) {
        c.mask.style.height = '100%';
        c.txt.style.display = 'none';
      } else {
        c.mask.style.height = '0%';
        c.txt.style.display = 'none';
      }
    });
    cards.__shovel.classList.toggle('active', !!shovelOn);
  }

  // ---------------------------------------------------------------- HUD
  var lastCaf = -1;
  function setCaffeine(v, rate) {
    var e = el('caf-num');
    e.textContent = Math.floor(v);
    if (lastCaf >= 0 && Math.floor(v) > lastCaf) {
      e.classList.remove('bump'); void e.offsetWidth; e.classList.add('bump');
    }
    lastCaf = Math.floor(v);
    if (rate != null) el('caf-rate').textContent = '+' + rate.toFixed(1) + ' / 秒';
  }
  function buildPips() {
    var p = el('wave-pips'); p.innerHTML = '';
    CFG.WAVES.forEach(function (w, i) {
      var d = D.createElement('div');
      d.className = 'pip' + (w.big ? ' big' : '');
      p.appendChild(d);
    });
  }
  function setWave(idx, progress, status) {
    var lab = el('wave-label');
    lab.innerHTML = '第 <b>' + Math.min(idx, CFG.WAVES.length) + '</b> / ' + CFG.WAVES.length + ' 波';
    el('wavebar-fill').style.width = (progress * 100).toFixed(1) + '%';
    el('wave-status').textContent = status;
    var pips = el('wave-pips').children;
    for (var i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('done', i < idx - 1);
      pips[i].classList.toggle('now', i === idx - 1);
    }
  }

  // ---------------------------------------------------------------- 左侧槽位
  var slotRows = [];
  function buildSlots() {
    var box = el('slothud'); box.innerHTML = '';
    slotRows = [];
    for (var r = 0; r < CFG.GRID.ROWS; r++) {
      var row = D.createElement('div');
      row.className = 'slotrow';
      var n = D.createElement('div'); n.className = 'sname'; n.textContent = '第' + (r + 1) + '行';
      var cells = D.createElement('div'); cells.className = 'cells';
      var cs = [];
      for (var i = 0; i < CFG.MISC.SLOTS_PER_DESK; i++) {
        var c = D.createElement('div'); c.className = 'sc'; cells.appendChild(c); cs.push(c);
      }
      var lv = D.createElement('div'); lv.className = 'leave'; lv.textContent = '年假';
      row.appendChild(n); row.appendChild(cells); row.appendChild(lv);
      box.appendChild(row);
      slotRows.push({ row: row, cells: cs, leave: lv });
    }
  }
  function setSlots(slots, leaveUsed) {
    for (var r = 0; r < slotRows.length; r++) {
      var s = slotRows[r];
      for (var i = 0; i < s.cells.length; i++) s.cells[i].classList.toggle('on', i < slots[r]);
      s.leave.textContent = leaveUsed[r] ? '年假已用' : '年假';
      s.leave.classList.toggle('used', !!leaveUsed[r]);
      s.row.classList.toggle('used', !!leaveUsed[r]);
      s.row.classList.toggle('danger', slots[r] >= CFG.MISC.SLOTS_PER_DESK);
    }
  }

  // ---------------------------------------------------------------- 播报
  function banner(text, sub, soft) {
    var b = el('banner');
    b.className = soft ? 'soft' : '';
    b.querySelector('.b1').textContent = text;
    b.querySelector('.b2').textContent = sub || '';
    void b.offsetWidth;
    b.classList.add('show');
  }
  function toast(text, cls) {
    var box = el('toast');
    var d = D.createElement('div');
    d.className = 'toast-item ' + (cls || '');
    d.textContent = text;
    box.appendChild(d);
    setTimeout(function () { d.remove(); }, 2300);
    while (box.children.length > 3) box.removeChild(box.firstChild);
  }

  // ---------------------------------------------------------------- 结算/遮罩
  function overlay(html) {
    var o = el('overlay');
    o.classList.remove('hidden');
    o.innerHTML = '<div class="screen">' + html + '</div>';
    return o;
  }
  function hideOverlay() { el('overlay').classList.add('hidden'); }

  function startScreen() {
    overlay(
      '<div class="title-cn">植物大战僵尸 · 打工人版</div>' +
      '<div class="title-en">WORKERS VS. WORK · 3D VOXEL TOWER DEFENSE</div>' +
      '<div class="title-sub">你是小组组长：把打工人武器库摆进办公区，挡住从老板办公室涌出来的一波波「工作」</div>' +
      '<button class="play-btn clickable" id="btn-play">开 始 上 班</button>' +
      '<div class="menu-row">' +
      '<div class="mbtn clickable" id="btn-codex2">图鉴</div>' +
      '<div class="mbtn clickable" id="btn-help">操作说明</div>' +
      '</div>' +
      '<div class="help" id="helpbox">' +
      '<b>怎么玩：</b>按住底部卡片<b>拖拽</b>到中间格子松手即可布置（拖拽时有幽灵预览与格子高亮，红框＝不能放）。' +
      '想清理格子：把<b>铲子拖到</b>那个单位上松手即可铲除（也可先点铲子选中再点单位）。' +
      '局势没救时随时点右上角<b>重开</b>（或按 <span class="k">R</span>）重打本局。<br>' +
      '<b>目标：</b>守住左侧 5 个工位，撑过 12 波。敌人走到工位前会缩进收件筐让槽位 +1；' +
      '某工位 4 个槽位占满会自动放一次<b>年假</b>（清空该行敌人，但槽位还在），每个工位只有一次。<br>' +
      '<b>失败：</b>老板走到任意工位，或某个工位年假用完后又有敌人抵达。<br>' +
      '<b>快捷：</b><span class="k">空格</span>暂停 <span class="k">1</span>/<span class="k">2</span>切换倍速 ' +
      '<span class="k">C</span>图鉴 <span class="k">S</span>铲子 <span class="k">M</span>静音 <span class="k">R</span>重开' +
      '</div>'
    );
  }

  function resultScreen(win, stats, quote, loseReason) {
    var s = '';
    s += '<div class="res-title ' + (win ? 'res-win' : 'res-lose') + '">' + (win ? '守住工位，全员上岸！' : '你被优化了') + '</div>';
    if (!win && loseReason) s += '<div class="title-sub" style="color:#ffb3a3">' + loseReason + '</div>';
    s += '<div class="res-quote">「' + quote + '」</div>';
    s += '<div class="res-stats">' +
      '<div class="stat"><div class="sv">' + stats.kills + '</div><div class="sl">消灭工作数</div></div>' +
      '<div class="stat"><div class="sv">' + stats.caf + '</div><div class="sl">剩余咖啡因</div></div>' +
      '<div class="stat"><div class="sv">' + stats.leave + ' / 5</div><div class="sl">剩余年假</div></div>' +
      '<div class="stat"><div class="sv">' + stats.wave + ' / 12</div><div class="sl">推进波次</div></div>' +
      '</div>';
    s += '<div class="menu-row"><button class="play-btn clickable" id="btn-again" style="padding:12px 46px;font-size:18px">再 来 一 局</button>' +
      '<div class="mbtn clickable" id="btn-codex2">图鉴</div></div>';
    overlay(s);
  }

  // ---------------------------------------------------------------- 图鉴
  function buildCodex() {
    var ub = el('cx-units'), eb = el('cx-enemies');
    ub.innerHTML = ''; eb.innerHTML = '';
    CFG.UNIT_ORDER.forEach(function (k) {
      var u = CFG.UNITS[k];
      var d = D.createElement('div');
      d.className = 'cx-item' + (u.created ? ' made' : '');
      var ic = D.createElement('div'); ic.className = 'ci-icon';
      ic.appendChild(renderIcon(u.model, 108, 104));
      var tx = D.createElement('div');
      tx.innerHTML = '<div class="ci-n">' + u.name + (u.created ? ' ·自创' : '') + '</div>' +
        '<div class="ci-c">费用 ' + u.cost + ' · 冷却 ' + u.cd + 's' +
        (u.hp > 9000 ? '' : ' · 血量 ' + u.hp) + '</div>' +
        '<div class="ci-d">' + u.desc + '</div>';
      d.appendChild(ic); d.appendChild(tx);
      ub.appendChild(d);
    });
    var eorder = ['normal', 'urgent', 'boss', 'meeting', 'standup'];
    eorder.forEach(function (k) {
      var e = CFG.ENEMIES[k];
      var d = D.createElement('div');
      d.className = 'cx-item';
      var ic = D.createElement('div'); ic.className = 'ci-icon';
      ic.appendChild(renderIcon(e.model, 108, 104));
      var tx = D.createElement('div');
      tx.innerHTML = '<div class="ci-n">' + e.name + '</div>' +
        '<div class="ci-c">血量 ' + e.hp + ' · 速度 ' + e.speed.toFixed(2) + ' 格/秒</div>' +
        '<div class="ci-d">' + e.desc + '</div>';
      d.appendChild(ic); d.appendChild(tx);
      eb.appendChild(d);
    });
  }

  function openCodex() { el('codex').classList.remove('hidden'); }
  function closeCodex() { el('codex').classList.add('hidden'); }
  function codexOpen() { return !el('codex').classList.contains('hidden'); }

  // ---------------------------------------------------------------- 缩放
  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = 'scale(' + s + ')';
  }

  function init(h) {
    handlers = h || {};
    stage = el('stage'); canvas = el('game'); UIEL = el('ui');
    tipEl = el('tooltip');
    initIconRenderer();
    buildCards();
    buildPips();
    buildSlots();
    buildCodex();
    window.addEventListener('resize', fit);
    fit();
  }

  global.UI = {
    init: init, cards: cards,
    renderIcon: renderIcon,
    updateCards: updateCards, setCaffeine: setCaffeine, setWave: setWave, setSlots: setSlots,
    banner: banner, toast: toast,
    overlay: overlay, hideOverlay: hideOverlay, startScreen: startScreen, resultScreen: resultScreen,
    openCodex: openCodex, closeCodex: closeCodex, codexOpen: codexOpen, hideTip: hideTip,
    shovelGhostShow: shovelGhostShow, shovelGhostMove: shovelGhostMove,
    shovelGhostHide: shovelGhostHide, shovelGhostOn: shovelGhostOn,
    stage: function () { return stage; }, canvas: function () { return canvas; },
    fit: fit
  };
})(window);
