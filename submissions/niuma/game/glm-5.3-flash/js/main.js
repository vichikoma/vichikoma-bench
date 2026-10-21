/* main.js —— 游戏主逻辑:场景 / 经济 / 波次 / 战斗 / 槽位与年假 / UI 交互
 * 坐标约定:格子(col c, row r) → 世界 x = c-4, z = r-2;桌子在 -x,老板办公室在 +x。
 * 相机固定在战场正前方偏上(俯角约 45°),正对战场、无横向偏转。
 */
'use strict';

/* ================= 常量与数值总表 ================= */
const ROWS = 5, COLS = 9, CELL = 1;
const DESK_X = -4.62;          // 敌人越过此线 = 到达工位
const GRID_X0 = -4, GRID_Z0 = -2;

const UNIT_DEFS = {
  coffee:  { name: '咖啡机',     cost: 50,  cd: 5,  hp: 150,  cls: 'eco',   desc: '每 12 秒产出 25 咖啡因,经济命脉——但机器本身脆得很。' },
  cannon:  { name: 'DDL 加农炮', cost: 100, cd: 5,  hp: 300,  cls: 'atk',   desc: '每 1.5 秒轰出一发交付物(20 伤害)。DDL 是第一生产力。' },
  goat:    { name: '背锅侠',     cost: 50,  cd: 10, hp: 3000, cls: 'tank',  desc: '不攻击,血极厚(3000,加农炮的 10 倍)。背的是锅,挡的是枪。' },
  fish:    { name: '摸鱼鱼缸',   cost: 175, cd: 5,  hp: 300,  cls: 'atk',   desc: '每 1.5 秒泼一朵水花(20 伤害),命中后移速减半 5 秒——纸泡了水,走不动了。' },
  resign:  { name: '辞职信',     cost: 150, cd: 30, hp: 999,  cls: 'nuke',  desc: '放置 1 秒后引爆,清空全场所有敌人——但有 15% 概率被老板批准,直接失败!真·赌博。' },
  pretend: { name: '假装在忙',   cost: 25,  cd: 20, hp: 400,  cls: 'mine',  desc: '布置后 10 秒进入状态;之后踩中它的第一个工作被当场戳穿、原地秒杀。' },
  milk:    { name: '奶茶续命',   cost: 125, cd: 20, hp: 200,  cls: 'heal', custom: true,
             desc: '【自创】每 10 秒给十字相邻的友军各回 150 血。奶茶到,士气到,血条回。' },
  printer: { name: '卡纸打印机', cost: 200, cd: 10, hp: 300,  cls: 'aoe',  custom: true,
             desc: '【自创】每 3 秒向远处(≥3 格)抛射一摞卡纸,落点范围 40 伤害(半径 1.1 格)。卡得越狠,溅得越广。' },
};
const CARD_ORDER = ['coffee', 'cannon', 'pretend', 'goat', 'fish', 'milk', 'printer', 'resign'];

const ENEMY_DEFS = {
  doc:     { name: '普通需求', hp: 200, speed: .40, bite: 22, desc: '一沓最普通的需求文档。血 200,速度 0.40 格/秒。' },
  urgent:  { name: '加急需求', hp: 400, speed: .45, bite: 22, desc: '冒火的需求。血 400(2 倍),速度 0.45 格/秒。' },
  boss:    { name: '老板',     hp: 800, speed: .22, bite: 60, desc: '唯一的人形敌人。血 800,全场最慢(0.22)。到达任一工位立即失败——年假也拦不住!' },
  meeting: { name: '临时会议', hp: 220, speed: .42, bite: 22, desc: '血 220,速度 0.42。遇到第一个我方单位直接跳过去(每局一次)。' },
  recmeet: { name: '例会',     hp: 420, speed: .36, bite: 30, desc: '血 420,速度 0.36。行进中每 10 秒在本行随机空格生成一个普通需求。第 6 波起出现。' },
};

const RESIGN_FAIL_RATE = 0.15;
const ARM_TIME = 10, MILK_HEAL = 150, MILK_EVERY = 10, PRINT_DMG = 40, PRINT_EVERY = 3;
const SKY_EVERY = 9, SKY_AMOUNT = 25, START_CAFF = 150;

// 波次表(12 波;第 6/12 波为大波)。list 为出场顺序。
const WAVES = [
  { interval: 8.0, list: ['doc', 'doc', 'doc'] },
  { interval: 7.5, list: ['doc', 'doc', 'doc', 'doc'] },
  { interval: 7.0, list: ['doc', 'doc', 'urgent', 'doc', 'doc'] },
  { interval: 6.5, list: ['doc', 'urgent', 'doc', 'meeting', 'doc', 'urgent'] },
  { interval: 6.0, list: ['doc', 'urgent', 'meeting', 'doc', 'urgent', 'doc', 'meeting', 'doc'] },
  { interval: 5.0, big: true, list: ['doc', 'doc', 'urgent', 'doc', 'meeting', 'doc', 'urgent', 'doc', 'doc', 'urgent', 'meeting', 'doc', 'recmeet', 'urgent'] },
  { interval: 6.0, list: ['recmeet', 'doc', 'urgent', 'doc', 'meeting', 'doc', 'urgent', 'doc'] },
  { interval: 5.5, list: ['doc', 'recmeet', 'urgent', 'doc', 'urgent', 'meeting', 'doc', 'urgent', 'doc', 'recmeet'] },
  { interval: 5.5, list: ['boss', 'doc', 'doc', 'urgent', 'doc', 'recmeet', 'urgent', 'doc'] },
  { interval: 4.6, list: ['doc', 'urgent', 'recmeet', 'doc', 'meeting', 'urgent', 'doc', 'urgent', 'recmeet', 'doc', 'doc'] },
  { interval: 4.2, list: ['urgent', 'doc', 'recmeet', 'doc', 'urgent', 'doc', 'recmeet', 'urgent', 'doc', 'meeting', 'urgent', 'doc', 'doc'] },
  { interval: 3.6, big: true, list: ['boss', 'doc', 'doc', 'urgent', 'recmeet', 'doc', 'meeting', 'urgent', 'doc', 'doc', 'urgent', 'doc', 'recmeet', 'urgent', 'doc', 'meeting', 'doc', 'urgent', 'doc', 'urgent', 'doc', 'doc'] },
];

/* ================= 三维场景 ================= */
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(1280, 720);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ddd3bf');

const camera = new THREE.PerspectiveCamera(40, 1280 / 720, 0.1, 100);
camera.position.set(0, 8.7, 9.3);
camera.lookAt(0, 0, 0.1);

// 光照:暖色环境 + 主方向光(投影)。注意模型已烘焙面明暗,环境光别拉太高
scene.add(new THREE.HemisphereLight(0xfff2dc, 0x6b5a48, 0.3));
const amb = new THREE.AmbientLight(0xffffff, 0.3); scene.add(amb);
const sun = new THREE.DirectionalLight(0xffe8c8, 0.72);
sun.position.set(6, 13, 6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
sun.shadow.camera.top = 8; sun.shadow.camera.bottom = -8;
sun.shadow.camera.far = 40;
sun.shadow.bias = -0.0004;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdde8ff, 0.12); fill.position.set(-6, 8, 4); scene.add(fill);

/* ================= 办公室场景搭建 ================= */
function buildScenery() {
  const g = new THREE.Group();
  const add = m => { g.add(m); return m; };

  // 地板(整块) + 地毯区(棋盘格)
  const floorBoxes = [];
  floorBoxes.push([-1.0, -0.06, 0, 18.5, .12, 11.5, '#b8ad9a']); // 大地板(中心偏移 x=-1)
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const even = (r + c) % 2 === 0;
    floorBoxes.push([c - 4, -0.005, r - 2, .96, .02, .96, even ? '#ddcb9f' : '#c9b489']);
  }
  // 网格线(细深色条)
  for (let c = 0; c <= COLS; c++) floorBoxes.push([c - 4.5, .005, 0, .05, .02, 5.0, '#a08c6a']);
  for (let r = 0; r <= ROWS; r++) floorBoxes.push([0, .005, r - 2.5, 9.0, .02, .05, '#a08c6a']);
  const floor = add(new THREE.Mesh(Vox.buildGeometry(floorBoxes), Vox.baseMat));
  floor.receiveShadow = true; floor.castShadow = false;

  // 后墙 + 窗户 + 踢脚线
  const wallBoxes = [[0, 1.2, -4.55, 19, 2.6, .3, '#e2d8c8']];
  for (let i = 0; i < 5; i++) wallBoxes.push([-6 + i * 2.6, 1.35, -4.42, 1.7, 1.3, .08, '#bfe3ef']);
  wallBoxes.push([0, 2.62, -4.55, 19, .16, .34, '#b7a98f']);
  add(new THREE.Mesh(Vox.buildGeometry(wallBoxes), Vox.baseMat));

  // 白板(靠后墙左侧)
  const wb = new THREE.Group();
  wb.add(new THREE.Mesh(Vox.buildGeometry([[0, 1.1, 0, 2.0, 1.1, .08, '#8d9aa5']]), Vox.baseMat));
  wb.add(new THREE.Mesh(Vox.buildGeometry([
    [-.5, 1.3, .05, .7, .06, .02, '#e53935'], [.2, 1.05, .05, .8, .06, .02, '#3949ab'],
    [-.3, .85, .05, 1.0, .06, .02, '#43a047'], [-.55, 1.3, 0, .1, .3, .1, '#c62828'],
  ]), Vox.baseMat));
  wb.position.set(-6.5, 0, -4.3); add(wb);

  // 左侧大长桌:横贯 5 行,桌面 + 桌腿 + 每行一个工位(显示器/键盘/组员)
  const desk = new THREE.Group();
  desk.add(new THREE.Mesh(Vox.buildGeometry([
    [-5.45, .52, 0, 1.7, .1, 6.0, '#a9744f'],
    [-5.45, .44, 0, 1.5, .06, 5.8, '#8a5a33'],
  ]), Vox.baseMat));
  for (const zz of [-2.8, 2.8]) for (const xx of [-6.1, -4.85])
    desk.add(new THREE.Mesh(Vox.buildGeometry([[xx, .25, zz, .12, .5, .12, '#6d4c41']]), Vox.baseMat));
  desk.castShadow = true;
  const workerHeads = [];
  for (let r = 0; r < ROWS; r++) {
    const z = r - 2;
    const st = new THREE.Group();
    st.add(new THREE.Mesh(Vox.buildGeometry([
      // 组员(背对战场坐着,面向 +x 屏幕)
      [-5.0, .8, z, .26, .34, .26, '#5c8bd6'],   // 身体
      [-5.0, 1.07, z, .2, .16, .2, '#f0c088'],    // 头
      [-5.0, 1.16, z, .21, .05, .21, '#4e342e'],  // 头发
      // 显示器(面向 +x,落在桌面上)
      [-4.62, .88, z, .07, .4, .54, '#263238'],
      [-4.58, .88, z, .02, .32, .46, '#9fd8e8'],  // 屏幕发光面
      [-4.62, .62, z, .06, .1, .16, '#37474f'],
      // 键盘 & 鼠标
      [-4.32, .6, z, .3, .05, .4, '#455a64'],
      [-4.32, .6, z + .28, .08, .05, .1, '#37474f'],
      // 椅子
      [-5.35, .45, z, .4, .08, .4, '#546e7a'],
      [-5.52, .75, z, .08, .6, .4, '#546e7a'],
    ]), Vox.baseMat));
    st.children.forEach(m => { m.castShadow = true; });
    desk.add(st);
    workerHeads.push(st);
  }
  // 档位筐:每个工位上方 4 个槽位
  const traySlots = [];
  for (let r = 0; r < ROWS; r++) {
    const z = r - 2;
    const tray = new THREE.Group();
    tray.add(new THREE.Mesh(Vox.buildGeometry([
      [-5.7, 1.62, z, .5, .05, 1.0, '#8d6e63'],
      [-5.7, 1.72, z, .05, .22, 1.0, '#8d6e63'],
      [-5.7, 1.62, z - .5, .5, .14, .04, '#8d6e63'], [-5.7, 1.62, z + .5, .5, .14, .04, '#8d6e63'],
    ]), Vox.baseMat));
    for (let i = 0; i < 4; i++) {
      const slotMesh = new THREE.Mesh(Vox.buildGeometry([[0, .06, 0, .3, .12, .16, '#fafafa']]), Vox.baseMat);
      slotMesh.position.set(-5.7, 1.68, z - .36 + i * .24);
      slotMesh.visible = false;
      tray.add(slotMesh);
      traySlots.push(slotMesh);
    }
    desk.add(tray);
  }
  // 支柱撑住筐
  desk.add(new THREE.Mesh(Vox.buildGeometry([[-5.7, 1.2, -2.8, .05, 1.3, .05, '#6d4c41'], [-5.7, 1.2, 2.8, .05, 1.3, .05, '#6d4c41']]), Vox.baseMat));
  add(desk);

  // 右侧老板办公室:玻璃幕墙 + 门框 + 内部大班台 + 老板剪影
  const office = new THREE.Group();
  const gx = 5.9;
  office.add(new THREE.Mesh(Vox.buildGeometry([
    [gx + 1.2, 1.1, -2.75, 2.6, .14, .3, '#90a4ae'], [gx + 1.2, 1.1, 2.75, 2.6, .14, .3, '#90a4ae'],
    [gx + 1.2, 2.3, 0, 2.6, .12, 5.8, '#90a4ae'],      // 顶棚
  ]), Vox.baseMat));
  // 玻璃(透明)
  const glassMat = new THREE.MeshLambertMaterial({ color: 0xbfe9f5, transparent: true, opacity: 0.18 });
  const glassGeo = Vox.buildGeometry([
    [gx + 1.2, 1.1, 0, .06, 2.0, 5.2, '#bfe9f5'],      // 后玻璃
    [gx + 2.4, 1.1, 0, .06, 2.0, 5.8, '#bfe9f5'],      // 右侧玻璃(背对战场,基本看不见)
  ]);
  office.add(new THREE.Mesh(glassGeo, glassMat));
  // 正面玻璃幕墙(行中心之间留出门柱,敌人从门前走过)
  for (let r = 0; r < ROWS; r++) {
    office.add(new THREE.Mesh(Vox.buildGeometry([[gx, 1.1, r - 2, .05, 2.0, .84, '#bfe9f5']]), glassMat));
  }
  // 门柱(每行边界) + 行间玻璃留出走道
  for (let r = 0; r <= ROWS; r++) {
    office.add(new THREE.Mesh(Vox.buildGeometry([[gx, 1.1, r - 2.5, .18, 2.0, .14, '#78909c']]), Vox.baseMat));
  }
  // 老板大班台 + 老板剪影
  office.add(new THREE.Mesh(Vox.buildGeometry([
    [gx + 1.1, .55, 0, 1.3, .09, 2.6, '#6d4c41'],
    [gx + 1.1, .3, 0, 1.0, .5, 2.2, '#5d4037'],
    [gx + .5, .8, .8, .3, .3, .3, '#37474f'], [gx + .5, .8, -.8, .3, .3, .3, '#37474f'],
    [gx + 1.6, .68, 0, .35, .3, .35, '#4e342e'],       // 老板椅
  ]), Vox.baseMat));
  const silhouette = Vox.makeStatic('boss');
  silhouette.traverse(m => { if (m.isMesh) { m.castShadow = false; } });
  silhouette.material = new THREE.MeshLambertMaterial({ color: 0x37474f, transparent: true, opacity: .55 });
  silhouette.position.set(gx + 1.35, .6, 0);
  silhouette.rotation.y = Math.PI / 2;
  office.add(silhouette);
  add(office);

  // 氛围陈设:绿植 / 饮水机 / 矮隔断
  function plant(x, z, big) {
    const p = new THREE.Group();
    const boxes = [[0, .18, 0, .34, .36, .34, '#b5562f'], [0, .4, 0, .3, .1, .3, '#8d3f22']];
    p.add(new THREE.Mesh(Vox.buildGeometry(boxes), Vox.baseMat));
    const leaf = big ? [[0, .8, 0, .6, .7, .6, '#43a047'], [0, 1.25, 0, .35, .35, .35, '#66bb6a']]
                     : [[0, .65, 0, .45, .5, .45, '#66bb6a']];
    p.add(new THREE.Mesh(Vox.buildGeometry(leaf), Vox.baseMat));
    p.position.set(x, 0, z); p.traverse(m => { if (m.isMesh) m.castShadow = true; });
    add(p);
  }
  plant(-7.4, -3.6, true); plant(4.6, -3.7, true); plant(8.6, -3.6, true); plant(8.6, 3.4, false); plant(-7.4, 3.5, false);
  const cooler = new THREE.Group();
  cooler.add(new THREE.Mesh(Vox.buildGeometry([
    [0, .5, 0, .5, 1.0, .5, '#eceff1'], [0, 1.15, 0, .38, .3, .38, '#4fc3f7'], [0, .9, .25, .12, .1, .12, '#263238'],
  ]), Vox.baseMat));
  cooler.position.set(-3.2, 0, -3.7); add(cooler);

  // 行间矮隔断(高度 0.35,带缺口,不遮挡)
  for (let r = 0; r < ROWS - 1; r++) {
    const z = r - 1.5;
    add(new THREE.Mesh(Vox.buildGeometry([
      [-2.2, .18, z, 2.6, .36, .07, '#8fa1a8'], [2.2, .18, z, 2.4, .36, .07, '#8fa1a8'],
    ]), Vox.baseMat));
  }
  scene.add(g);
  return { traySlots, workerHeads };
}
const scenery = buildScenery();

// 格子高亮框(放置预览)
const highlight = new THREE.Mesh(
  Vox.buildGeometry([[0, .02, 0, .96, .04, .96, '#ffffff']]),
  new THREE.MeshBasicMaterial({ color: 0x44ff88, transparent: true, opacity: .45 })
);
highlight.visible = false; scene.add(highlight);

/* ================= 图标预渲染(卡片/图鉴用,同一渲染器出图) ================= */
const ICONS = {};
(function prerenderIcons() {
  const ir = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  ir.setSize(128, 128);
  const sc = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 20);
  cam.position.set(2.1, 1.9, 2.5); cam.lookAt(0, .42, 0);
  sc.add(new THREE.AmbientLight(0xffffff, .55));
  const dl = new THREE.DirectionalLight(0xffffff, .62); dl.position.set(3, 5, 4); sc.add(dl);
  for (const key of [...Object.keys(UNIT_DEFS), ...Object.keys(ENEMY_DEFS)]) {
    while (sc.children.length) sc.remove(sc.children[0]);
    sc.add(new THREE.AmbientLight(0xffffff, .55));
    const d2 = new THREE.DirectionalLight(0xffffff, .62); d2.position.set(3, 5, 4); sc.add(d2);
    const u = Vox.makeUnit(key);
    // 敌人在游戏里朝 -x,图标统一转到面对镜头
    if (ENEMY_DEFS[key]) u.group.rotation.y = Math.PI / 2.6;
    sc.add(u.group);
    ir.render(sc, cam);
    ICONS[key] = ir.domElement.toDataURL();
  }
  // 铲子图标
  while (sc.children.length) sc.remove(sc.children[0]);
  sc.add(new THREE.AmbientLight(0xffffff, .55));
  const d3 = new THREE.DirectionalLight(0xffffff, .62); d3.position.set(3, 5, 4); sc.add(d3);
  const shovel = new THREE.Mesh(Vox.buildGeometry([
    [0, .3, 0, .07, .55, .07, '#8d6e63'], [0, .62, 0, .14, .1, .1, '#5d4037'],
    [0, .05, 0, .22, .16, .05, '#90a4ae'], [0, .14, 0, .1, .06, .05, '#607d8b'],
  ]), Vox.baseMat);
  shovel.rotation.y = .5; sc.add(shovel);
  ir.render(sc, cam);
  ICONS.shovel = ir.domElement.toDataURL();
  ir.dispose();
})();

/* ================= 粒子 & 飘字 ================= */
const particles = [];
(function initParticles() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 90; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ transparent: true }));
    m.visible = false; scene.add(m);
    particles.push({ mesh: m, life: 0, max: 1, vx: 0, vy: 0, vz: 0, grav: 0, size: .1 });
  }
})();
function burst(pos, colors, count, opt = {}) {
  const { spread = 1.6, up = 2.2, grav = 6, size = .09, life = .7 } = opt;
  let n = 0;
  for (const p of particles) {
    if (p.life > 0) continue;
    p.life = life * (0.6 + Math.random() * .8); p.max = p.life;
    p.mesh.visible = true;
    p.mesh.position.set(pos.x + (Math.random() - .5) * .3, pos.y + Math.random() * .3, pos.z + (Math.random() - .5) * .3);
    p.vx = (Math.random() - .5) * spread; p.vz = (Math.random() - .5) * spread;
    p.vy = Math.random() * up; p.grav = grav;
    p.size = size * (0.6 + Math.random() * .9);
    p.mesh.scale.setScalar(p.size);
    p.mesh.material.color.set(colors[(Math.random() * colors.length) | 0]);
    p.mesh.material.opacity = 1;
    if (++n >= count) break;
  }
}
function updateParticles(dt) {
  for (const p of particles) {
    if (p.life <= 0) continue;
    p.life -= dt;
    if (p.life <= 0) { p.mesh.visible = false; continue; }
    p.vy -= p.grav * dt;
    p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
    if (p.mesh.position.y < 0.02) { p.mesh.position.y = 0.02; p.vy *= -0.35; p.vx *= .7; p.vz *= .7; }
    p.mesh.material.opacity = Math.min(1, p.life / p.max * 1.6);
    p.mesh.rotation.x += dt * 4; p.mesh.rotation.y += dt * 5;
  }
}

const floaters = [];
function floatText(worldPos, text, color = '#ffffff', opt = {}) {
  const v = worldPos.clone().project(camera);
  const el = document.createElement('div');
  el.className = 'floater' + (opt.cls ? ' ' + opt.cls : '');
  el.textContent = text;
  el.style.color = color;
  el.style.left = ((v.x * .5 + .5) * 100) + '%';
  el.style.top = ((-v.y * .5 + .5) * 100) + '%';
  document.getElementById('stage').appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

/* ================= 游戏状态 ================= */
const G = {
  phase: 'menu',            // menu | playing | over
  paused: false, speed: 1,
  time: 0, caffeine: START_CAFF,
  kills: 0, spent: 0,
  slots: [0, 0, 0, 0, 0], leavesUsed: [false, false, false, false, false],
  units: [], enemies: [], bullets: [], slotAnims: [], skyDrops: [],
  occupancy: new Array(ROWS * COLS).fill(null),
  cardCds: {}, skyTimer: 3.5,
  waveIdx: -1, waveQueue: [], waveSpawnTimer: 0, waveDone: false, waveRest: 0,
  bossAlive: false, bossRef: null,
  dragging: null, selectedShovel: false,
  over: false,
};
const unitAt = (r, c) => G.occupancy[r * COLS + c];
const setUnitAt = (r, c, u) => { G.occupancy[r * COLS + c] = u; };

/* ================= 单位放置 ================= */
function makeHPBar(halfW) {
  const bar = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2 + .08, .1), new THREE.MeshBasicMaterial({ color: 0x263238 }));
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, .07), new THREE.MeshBasicMaterial({ color: 0x66ff8c }));
  fg.position.z = .001; bar.add(bg); bar.add(fg);
  bar.visible = false;
  return { bar, fg };
}

function placeUnit(key, r, c) {
  const def = UNIT_DEFS[key];
  if (unitAt(r, c)) return false;
  const u = Vox.makeUnit(key);
  u.group.position.set(c - 4, 0, r - 2);
  scene.add(u.group);
  const hp = makeHPBar(.3);
  hp.bar.position.y = 1.0; u.group.add(hp.bar);
  const unit = {
    kind: 'unit', key, def, r, c, x: c - 4, z: r - 2,
    hp: def.hp, maxHp: def.hp, mesh: u.group, extras: u.extras, materials: u.materials,
    hpBar: hp, flashT: 0, phase: Math.random() * 10,
    t1: 0, t2: 0, armed: false, done: false, recoil: 0, biteAnim: 0, shakeT: 0,
    bobBase: 0,
  };
  setUnitAt(r, c, unit); G.units.push(unit);
  if (key === 'pretend') unit.armT = ARM_TIME;
  if (key === 'resign') unit.fuseT = 1.0;
  burst(new THREE.Vector3(unit.x, .3, unit.z), ['#ffffff', '#e0d6c2', '#bfe9f5'], 8, { spread: 1.2, up: 1.6, size: .07, life: .5 });
  return true;
}

function removeUnit(unit, silent) {
  setUnitAt(unit.r, unit.c, null);
  scene.remove(unit.mesh);
  G.units.splice(G.units.indexOf(unit), 1);
  if (!silent) {
    burst(new THREE.Vector3(unit.x, .4, unit.z), ['#eceff1', '#b0bec5', '#ffffff'], 10, { spread: 2, up: 2.4, size: .09 });
    AudioSys.sfx('shovel');
  }
}

/* ================= 敌人 ================= */
function spawnEnemy(key, r, opt = {}) {
  const def = ENEMY_DEFS[key];
  const u = Vox.makeUnit(key);
  const x = opt.x !== undefined ? opt.x : 5.6;
  u.group.position.set(x, 0, r - 2);
  u.group.scale.setScalar(0.01);
  scene.add(u.group);
  const hp = makeHPBar(key === 'boss' ? .42 : .3);
  hp.bar.position.y = key === 'boss' ? 1.35 : 0.95;
  u.group.add(hp.bar);
  const e = {
    kind: 'enemy', key, def, r, x, z: r - 2, hp: def.hp, maxHp: def.hp,
    mesh: u.group, extras: u.extras, materials: u.materials, hpBar: hp,
    flashT: 0, slowT: 0, spawnT: .35, biteT: 0, biteAnim: 0, phase: Math.random() * 10,
    jumped: false, jumpT: -1, jumpFrom: 0, jumpTo: 0, spawnCd: 10,
    dying: false,
  };
  G.enemies.push(e);
  if (key === 'boss') { G.bossAlive = true; G.bossRef = e; AudioSys.sfx('bossHorn'); banner('老板亲自出动!', 'boss'); }
  return e;
}
function killEnemy(e, countKill = true) {
  if (e.dying) return;
  e.dying = true;
  scene.remove(e.mesh);
  G.enemies.splice(G.enemies.indexOf(e), 1);
  if (e.key === 'boss') { G.bossAlive = false; G.bossRef = null; }
  if (countKill) { G.kills++; }
  burst(new THREE.Vector3(e.x, .4, e.z), ['#fafafa', '#ef5350', '#e0d6c2'], 12, { spread: 2.2, up: 2.6, size: .1 });
}

// 到达工位:缩小钻进槽位
function arriveDesk(e) {
  if (e.key === 'boss') { gameOver('boss'); return; }
  if (G.leavesUsed[e.r]) { gameOver('overflow', e.r); return; }
  killEnemy(e, false);
  // 缩小钻进槽位的小文档
  const mesh = new THREE.Mesh(
    Vox.cachedGeometry('slotdoc', [[0, .1, 0, .34, .2, .22, '#f5f0e6'], [0, .22, 0, .26, .06, .16, '#ef5350']]),
    Vox.baseMat
  );
  mesh.position.set(DESK_X, .25, e.z);
  scene.add(mesh);
  G.slotAnims.push({ r: e.r, t: 0, fromX: DESK_X, fromZ: e.z, mesh });
  AudioSys.sfx('deny');
}

function triggerLeave(r) {
  G.leavesUsed[r] = true;
  AudioSys.sfx('leave');
  banner('【年假】第 ' + (r + 1) + ' 行年假审批通过!该行工作全部清空', 'leave');
  floatText(new THREE.Vector3(-5.7, 1.6, r - 2), '年假!', '#2e7d32', { cls: 'big' });
  // 清空该行敌人
  for (const e of [...G.enemies]) if (e.r === r) killEnemy(e, true);
  // 飞舞的审批单
  const paper = new THREE.Mesh(Vox.buildGeometry([[0, 0, 0, .5, .34, .04, '#a5d6a7'], [0, .1, .025, .3, .05, .012, '#2e7d32']]), Vox.baseMat);
  paper.position.set(-5.7, 1.8, r - 2);
  scene.add(paper);
  G.leavesFx = G.leavesFx || [];
  G.leavesFx.push({ mesh: paper, t: 0, r });
}

function onSlotFilled(r, n) {
  scenery.traySlots[r * 4 + (n - 1)].visible = true;
  if (n >= 4) triggerLeave(r);
}

/* ================= 波次 ================= */
function startWave(i) {
  G.waveIdx = i;
  const w = WAVES[i];
  G.waveQueue = w.list.slice();
  G.waveSpawnTimer = 1.2;
  G.waveDone = false;
  G.waveRest = 0;
  if (w.big) { banner('⚠ 一大波工作来袭!⚠', 'big'); AudioSys.sfx('bigwave'); }
  else { banner('第 ' + (i + 1) + ' 波', 'wave'); AudioSys.sfx('wave'); }
  updateWaveUI();
}
function updateWaves(dt) {
  if (G.waveIdx < 0) { G.waveRest -= dt; if (G.waveRest <= 0) startWave(0); return; }
  const w = WAVES[G.waveIdx];
  if (G.waveQueue.length > 0) {
    G.waveSpawnTimer -= dt;
    if (G.waveSpawnTimer <= 0) {
      let type = G.waveQueue.shift();
      if (type === 'boss' && G.bossAlive) { G.waveQueue.unshift('boss'); G.waveSpawnTimer = 1.5; return; } // 老板全场同时仅 1 个
      let r = (Math.random() * ROWS) | 0;
      if (G.waveIdx < 3) r = 1 + ((Math.random() * 3) | 0); // 前 3 波只在中间 3 行出怪(难度曲线)
      spawnEnemy(type, r);
      G.waveSpawnTimer = w.interval * (0.85 + Math.random() * .3);
      updateWaveUI();
    }
  } else if (!G.waveDone) {
    // 终波:必须全歼才能胜利
    if (G.waveIdx >= WAVES.length - 1) {
      if (G.enemies.length === 0 && G.slotAnims.length === 0) { G.waveDone = true; win(); }
      updateWaveUI();
      return;
    }
    // 本波出怪完毕:敌人少于等于 2 或超时 → 下一波
    if (G.waveRest === 0) G.waveRest = (G.enemies.length <= 2 ? 3.5 : 16);
    G.waveRest -= dt;
    if (G.waveRest <= 0 || G.enemies.length === 0) {
      G.waveRest = 0; G.waveDone = true;
      if (G.waveIdx >= WAVES.length - 1) { win(); return; }
      startWave(G.waveIdx + 1);
    }
  }
  updateWaveUI();
}
function updateWaveUI() {
  const total = WAVES.length;
  const done = Math.max(0, G.waveIdx);
  let pct = (done / total) * 100;
  if (G.waveIdx >= 0 && WAVES[G.waveIdx]) {
    const w = WAVES[G.waveIdx];
    const spawned = w.list.length - G.waveQueue.length;
    pct = (done + spawned / w.list.length) / total * 100;
  }
  document.getElementById('waveFill').style.width = Math.min(100, pct) + '%';
  document.getElementById('waveLabel').textContent = G.waveIdx < 0 ? '准备中…' : ('第 ' + (G.waveIdx + 1) + ' / ' + total + ' 波');
}

/* ================= 咖啡因经济 ================= */
const elCaff = document.getElementById('caffCount');
function addCaffeine(n) { G.caffeine += n; elCaff.textContent = G.caffeine; refreshCards(); }
function spendCaffeine(n) {
  if (G.caffeine < n) return false;
  G.caffeine -= n; elCaff.textContent = G.caffeine; refreshCards(); return true;
}

// 天降咖啡因:咖啡杯从天而降,自动收集
function updateSkyDrops(dt) {
  G.skyTimer -= dt;
  if (G.skyTimer <= 0) {
    G.skyTimer = SKY_EVERY;
    const r = (Math.random() * ROWS) | 0, c = (Math.random() * COLS) | 0;
    const mesh = new THREE.Mesh(Vox.buildGeometry([
      [0, .13, 0, .3, .26, .3, '#fff8e1'], [0, .28, 0, .3, .04, .3, '#6d4c41'],
      [0, .36, 0, .2, .1, .2, '#ffffff'], [.2, .18, 0, .1, .05, .1, '#fff8e1'],
    ]), Vox.baseMat);
    mesh.position.set(c - 4, 6.5, r - 2);
    scene.add(mesh);
    G.skyDrops.push({ mesh, r, c });
  }
  for (const d of [...G.skyDrops]) {
    d.mesh.position.y -= 4.2 * dt;
    d.mesh.rotation.y += dt * 3;
    if (d.mesh.position.y <= 0) {
      scene.remove(d.mesh);
      G.skyDrops.splice(G.skyDrops.indexOf(d), 1);
      addCaffeine(SKY_AMOUNT);
      AudioSys.sfx('coffeeDrop');
      floatText(new THREE.Vector3(d.c - 4, .8, d.r - 2), '+' + SKY_AMOUNT, '#8d5a2b');
      burst(new THREE.Vector3(d.c - 4, .2, d.r - 2), ['#6d4c41', '#fff8e1', '#a1887f'], 8, { spread: 1.4, up: 1.8, size: .08, life: .55 });
    }
  }
}

/* ================= 单位行为 ================= */
const _white = new THREE.Color(1, 1, 1), _red = new THREE.Color(1, .3, .3);
function setFlash(materials, on) {
  for (const m of materials) m.color.copy(on ? _red : _white);
}
function enemiesInRow(r) { return G.enemies.filter(e => e.r === r && e.spawnT <= 0); }
function leftmostEnemy(r, minX) {
  let best = null;
  for (const e of G.enemies) {
    if (e.r !== r || e.spawnT > 0 || e.dying) continue;
    if (e.x < minX) continue;
    if (!best || e.x < best.x) best = e;
  }
  return best;
}

function updateUnits(dt) {
  for (const u of [...G.units]) {
    // 受击闪红 & 血条
    if (u.flashT > 0) { u.flashT -= dt; setFlash(u.materials, u.flashT > 0); }
    if (u.hp < u.maxHp) {
      u.hpBar.bar.visible = true;
      const ratio = Math.max(0, u.hp / u.maxHp);
      u.hpBar.fg.scale.x = ratio;
      u.hpBar.fg.position.x = -(1 - ratio) * .3;
      u.hpBar.fg.material.color.setRGB(ratio > .5 ? 1 - (ratio - .5) * 1.4 : 1, ratio > .5 ? 1 : ratio * 1.6, .3);
    }
    if (u.shakeT > 0) { u.shakeT -= dt; u.mesh.position.x = u.x + Math.sin(G.time * 45) * .04; }
    else u.mesh.position.x = u.x;
    u.mesh.position.y = Math.sin(G.time * 2.1 + u.phase) * .02;

    const t = G.time + u.phase;
    switch (u.key) {
      case 'coffee': {
        if (u.extras.steam) {
          u.extras.steam.position.y = .82 + Math.sin(t * 3) * .05;
          u.extras.steam.material.opacity = .45 + Math.sin(t * 5) * .25;
        }
        u.t1 += dt;
        if (u.t1 >= 12) {
          u.t1 -= 12; addCaffeine(25);
          floatText(new THREE.Vector3(u.x, .9, u.z), '+25', '#8d5a2b');
          AudioSys.sfx('collect');
        }
        break;
      }
      case 'cannon': {
        if (u.recoil > 0) { u.recoil -= dt * 5; u.extras.barrel.position.x = -Math.max(0, u.recoil) * .16; }
        u.t1 += dt;
        const target = leftmostEnemy(u.r, u.x + .2);
        if (target && u.t1 >= 1.5) {
          u.t1 = 0; u.recoil = 1;
          fireBullet('shell', u.x + .55, u.z, 6.5, 20);
          AudioSys.sfx('shoot');
        }
        break;
      }
      case 'fish': {
        u.extras.fish.position.x = Math.sin(t * 2.6) * .13;
        u.extras.fish.position.z = .06 + Math.cos(t * 3.3) * .06;
        u.t1 += dt;
        const target = leftmostEnemy(u.r, u.x + .2);
        if (target && u.t1 >= 1.5) {
          u.t1 = 0;
          fireBullet('splash', u.x + .45, u.z, 5.5, 20, { slow: true });
          AudioSys.sfx('splash');
        }
        break;
      }
      case 'printer': {
        u.t1 += dt;
        if (u.t1 >= PRINT_EVERY) {
          // 只打远处(≥3 格),近身干瞪眼
          let target = null;
          for (const e of G.enemies) {
            if (e.r !== u.r || e.spawnT > 0 || e.dying) continue;
            if (e.x >= u.x + 2.5 && (!target || e.x < target.x)) target = e;
          }
          if (target) {
            u.t1 = 0;
            fireLob(u, target);
            AudioSys.sfx('lob');
          }
        }
        break;
      }
      case 'milk': {
        u.mesh.position.y = Math.sin(G.time * 2.6 + u.phase) * .03;
        u.t1 += dt;
        if (u.t1 >= MILK_EVERY) {
          u.t1 = 0;
          let healed = false;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const n = unitAt(u.r + dr, u.c + dc);
            if (n && n.hp < n.maxHp && n.key !== 'resign') {
              n.hp = Math.min(n.maxHp, n.hp + MILK_HEAL);
              floatText(new THREE.Vector3(n.x, .9, n.z), '+' + MILK_HEAL, '#43a047');
              burst(new THREE.Vector3(n.x, .6, n.z), ['#f48fb1', '#fff', '#ef5da8'], 6, { spread: .8, up: 1.4, size: .06, grav: 1, life: .6 });
              healed = true;
            }
          }
          if (healed) AudioSys.sfx('heal');
        }
        break;
      }
      case 'pretend': {
        if (!u.armed) {
          u.armT -= dt;
          u.extras.screen.material.color.setRGB(.55 + Math.random() * .1, .75 + Math.random() * .1, .85); // 待机屏幕微闪
          if (u.armT <= 0) {
            u.armed = true;
            u.extras.screen.material.color.setRGB(.5, 1, .5);
            AudioSys.sfx('arm');
            floatText(new THREE.Vector3(u.x, 1.0, u.z), '已进入状态!', '#2e7d32');
            burst(new THREE.Vector3(u.x, .7, u.z), ['#a5d6a7', '#fff'], 8, { spread: 1, up: 1.6, size: .07, grav: 2 });
          }
        } else {
          u.extras.screen.material.color.setRGB(.45 + Math.sin(G.time * 6) * .1, 1, .45);
          for (const e of enemiesInRow(u.r)) {
            if (Math.abs(e.x - u.x) < .45) {
              // 踩中!当场戳穿
              killEnemy(e, true);
              AudioSys.sfx('explosion');
              burst(new THREE.Vector3(u.x, .4, u.z), ['#ffd54f', '#ef5350', '#fff'], 16, { spread: 3, up: 3, size: .1 });
              removeUnit(u, true);
              break;
            }
          }
        }
        break;
      }
      case 'resign': {
        u.mesh.rotation.z = Math.sin(G.time * 28) * .05;
        u.fuseT -= dt;
        if (u.fuseT <= 0) detonateResign(u);
        break;
      }
    }
  }
}

function detonateResign(u) {
  removeUnit(u, true);
  AudioSys.sfx('resignBoom');
  burst(new THREE.Vector3(u.x, .5, u.z), ['#fff', '#ef5350', '#ffd54f', '#fafafa'], 22, { spread: 3.5, up: 3.5, size: .12, life: .9 });
  for (const e of [...G.enemies]) {
    burst(new THREE.Vector3(e.x, .4, e.z), ['#fafafa', '#eceff1'], 8, { spread: 2, up: 2.2, size: .09 });
    killEnemy(e, true);
  }
  if (Math.random() < RESIGN_FAIL_RATE) gameOver('resign');
  else floatText(new THREE.Vector3(u.x, 1.4, u.z), '工作清空!', '#c62828', { cls: 'big' });
}

/* ================= 子弹 ================= */
const bulletPool = [];
(function initBullets() {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
    m.visible = false; scene.add(m);
    bulletPool.push(m);
  }
})();
const BULLET_STYLE = {
  shell: { color: 0x37474f, size: [.16, .16, .16] },
  splash: { color: 0x4fc3f7, size: [.2, .14, .2] },
  a4: { color: 0xfafafa, size: [.24, .05, .2] },
};
function fireBullet(style, x, z, v, dmg, opt = {}) {
  const mesh = bulletPool.find(m => !m.visible);
  if (!mesh) return;
  const s = BULLET_STYLE[style];
  mesh.material.color.set(s.color);
  mesh.scale.set(...s.size);
  mesh.position.set(x, .35, z);
  mesh.visible = true;
  G.bullets.push({ mesh, x, z, v, dmg, style, ...opt });
}
function fireLob(u, target) {
  const mesh = bulletPool.find(m => !m.visible);
  if (!mesh) return;
  const s = BULLET_STYLE.a4;
  mesh.material.color.set(s.color);
  mesh.scale.set(...s.size);
  mesh.visible = true;
  const T = .55;
  G.bullets.push({
    mesh, style: 'a4', lob: true, t: 0, T,
    x0: u.x + .3, z0: u.z, x1: target.x, z1: target.z,
    y0: .55, h: 1.4, dmg: PRINT_DMG,
  });
}
function updateBullets(dt) {
  for (const b of [...G.bullets]) {
    if (b.lob) {
      b.t += dt;
      const k = b.t / b.T;
      if (k >= 1) {
        b.mesh.visible = false;
        G.bullets.splice(G.bullets.indexOf(b), 1);
        // 落点 AOE
        burst(new THREE.Vector3(b.x1, .25, b.z1), ['#fafafa', '#e0e0e0', '#bdbdbd'], 12, { spread: 2.4, up: 2, size: .08 });
        for (const e of [...G.enemies]) {
          const dx = e.x - b.x1, dz = e.z - b.z1;
          if (dx * dx + dz * dz < 1.1 * 1.1) damageEnemy(e, b.dmg);
        }
        AudioSys.sfx('hit');
        continue;
      }
      const x = b.x0 + (b.x1 - b.x0) * k, z = b.z0 + (b.z1 - b.z0) * k;
      const y = b.y0 + Math.sin(Math.PI * k) * b.h;
      b.mesh.position.set(x, y, z);
      b.mesh.rotation.x += dt * 12; b.mesh.rotation.z += dt * 9;
      continue;
    }
    b.x += b.v * dt;
    b.mesh.position.x = b.x;
    b.mesh.rotation.x += dt * 10;
    if (b.style === 'splash') b.mesh.position.y = .35 + Math.sin(b.x * 6) * .06;
    if (b.x > 9) { b.mesh.visible = false; G.bullets.splice(G.bullets.indexOf(b), 1); continue; }
    for (const e of G.enemies) {
      if (e.r * 1 !== b.z + 2 || e.spawnT > 0 || e.dying) continue;
      if (Math.abs(e.x - b.x) < .32) {
        b.mesh.visible = false;
        G.bullets.splice(G.bullets.indexOf(b), 1);
        damageEnemy(e, b.dmg);
        if (b.slow) e.slowT = 5;
        burst(new THREE.Vector3(b.x, .4, b.z), b.style === 'splash' ? ['#4fc3f7', '#b3e5fc'] : ['#eceff1', '#90a4ae'], 5, { spread: 1, up: 1.4, size: .06, life: .4 });
        AudioSys.sfx('hit');
        break;
      }
    }
  }
}
function damageEnemy(e, dmg) {
  if (e.dying) return;
  e.hp -= dmg;
  e.flashT = .12;
  setFlash(e.materials, true);
  if (e.hp <= 0) killEnemy(e, true);
}

/* ================= 敌人行为 ================= */
function updateEnemies(dt) {
  for (const e of [...G.enemies]) {
    if (e.flashT > 0) { e.flashT -= dt; setFlash(e.materials, e.flashT > 0); }
    if (e.slowT > 0) e.slowT -= dt;
    if (e.spawnT > 0) {
      e.spawnT -= dt;
      e.mesh.scale.setScalar(Math.min(1, 1 - e.spawnT / .35));
      continue;
    }
    const t = G.time + e.phase;
    // 待机/行走动画
    if (e.extras.feet) e.extras.feet.position.y = Math.abs(Math.sin(t * 9)) * .055;
    if (e.key === 'urgent' && e.extras.flame) e.extras.flame.scale.y = 1 + Math.sin(t * 14) * .18;
    if (e.key === 'boss') e.mesh.rotation.z = Math.sin(t * 3) * .05;
    e.mesh.position.y = Math.abs(Math.sin(t * 7)) * .04;

    // 例会:持续产出普通需求
    if (e.key === 'recmeet') {
      e.spawnCd -= dt;
      if (e.spawnCd <= 0) {
        e.spawnCd = 10;
        const empties = [];
        for (let c = 0; c < COLS; c++) {
          if (unitAt(e.r, c)) continue;
          const cx = c - 4;
          if (G.enemies.some(o => o.r === e.r && Math.abs(o.x - cx) < .6)) continue;
          empties.push(cx);
        }
        if (empties.length) spawnEnemy('doc', e.r, { x: empties[(Math.random() * empties.length) | 0] });
      }
    }

    // 跳跃中(临时会议)
    if (e.jumpT >= 0) {
      e.jumpT += dt;
      const k = e.jumpT / .75;
      if (k >= 1) { e.jumpT = -1; e.x = e.jumpTo; e.mesh.position.y = 0; }
      else {
        e.x = e.jumpFrom + (e.jumpTo - e.jumpFrom) * k;
        e.mesh.position.y = Math.sin(Math.PI * k) * .9;
      }
      e.mesh.position.x = e.x;
      continue;
    }

    // 找阻挡单位
    let blocker = null;
    for (const u of G.units) {
      if (u.r !== e.r) continue;
      if (u.key === 'pretend' && u.armed) continue; // 已武装的假忙套不阻挡,让敌人踩上来
      const stopX = u.x + .55;
      if (e.x > stopX && e.x - speedOf(e) * dt * (e.slowT > 0 ? .5 : 1) <= stopX) { blocker = u; break; }
    }
    if (blocker) {
      if (e.key === 'meeting' && !e.jumped) {
        // 临时会议:跳过第一个单位
        e.jumped = true;
        e.jumpT = 0;
        e.jumpFrom = e.x;
        e.jumpTo = Math.max(DESK_X + .3, blocker.x - 1.05);
        AudioSys.sfx('jump');
        continue;
      }
      e.x = blocker.x + .55;
      // 啃咬
      e.biteT += dt;
      e.biteAnim = .25;
      if (e.biteT >= .8) {
        e.biteT -= .8;
        blocker.hp -= e.def.bite * .8;
        blocker.flashT = .12; setFlash(blocker.materials, true);
        blocker.shakeT = .25;
        AudioSys.sfx('bite');
        if (blocker.hp <= 0) removeUnit(blocker, false);
      }
    } else {
      e.biteT = Math.min(e.biteT, .4);
      e.x -= speedOf(e) * dt * (e.slowT > 0 ? .5 : 1);
    }
    e.mesh.position.x = e.x;
    e.mesh.rotation.y = e.key === 'boss' ? 0 : Math.sin(t * 5) * .05;

    // 到达工位
    if (e.x <= DESK_X) { arriveDesk(e); continue; }
  }
  // 同行敌人简单排队,避免重叠
  const byRow = new Map();
  for (const e of G.enemies) { if (!byRow.has(e.r)) byRow.set(e.r, []); byRow.get(e.r).push(e); }
  for (const list of byRow.values()) {
    list.sort((a, b) => a.x - b.x);
    for (let i = 1; i < list.length; i++) {
      if (list[i].jumpT >= 0) continue;
      if (list[i].x - list[i - 1].x < .52) list[i].x = list[i - 1].x + .52;
    }
  }
  // Boss 血条
  const bossBar = document.getElementById('bossBar');
  if (G.bossRef && !G.bossRef.dying) {
    bossBar.style.display = 'block';
    document.getElementById('bossFill').style.width = (G.bossRef.hp / G.bossRef.maxHp * 100) + '%';
  } else bossBar.style.display = 'none';
}
function speedOf(e) { return e.def.speed; }

/* ================= 槽位入筐 & 年假飞单 ================= */
function updateSlotAnims(dt) {
  for (const a of [...G.slotAnims]) {
    a.t += dt / .9;
    const n = G.slots[a.r];
    const tx = -5.7, ty = 1.68, tz = (a.r - 2) - .36 + n * .24;
    const k = Math.min(1, a.t);
    a.mesh.position.set(
      a.fromX + (tx - a.fromX) * k,
      .25 + (ty - .25) * k + Math.sin(Math.PI * k) * .5,
      a.fromZ + (tz - a.fromZ) * k
    );
    a.mesh.scale.setScalar(Math.max(.1, 1 - k * .85));
    a.mesh.rotation.y = k * 5;
    if (a.t >= 1) {
      scene.remove(a.mesh);
      G.slotAnims.splice(G.slotAnims.indexOf(a), 1);
      G.slots[a.r]++;
      onSlotFilled(a.r, G.slots[a.r]);
    }
  }
  for (const f of (G.leavesFx || [])) {
    f.t += dt;
    f.mesh.position.y += dt * 1.6;
    f.mesh.position.x += dt * 1.2;
    f.mesh.rotation.z += dt * 4;
  }
  if (G.leavesFx) G.leavesFx = G.leavesFx.filter(f => { if (f.t > 1.5) { scene.remove(f.mesh); return false; } return true; });
}

/* ================= 横幅 / 结算 ================= */
let bannerTimer = null;
function banner(text, cls) {
  const el = document.getElementById('banner');
  el.textContent = text;
  el.className = 'show ' + (cls || '');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => { el.className = ''; }, 2300);
}

const WIN_QUOTES = [
  '一次年假都没请就扛过了 12 波?老板看了都沉默——建议直接晋升"卷王之王"。',
  '守是守住了,但请掉的年假,记得年底用加班还回来哦。',
  '恭喜通关!不过别高兴太早——下个季度的需求已经在路上了。',
  '你守住了工位,却守不住发际线。胜利属于打工人!',
  '这一局守得漂亮,下午茶你点,算组里报销(并不能)。',
];
const LOSE_QUOTES = {
  boss: ['老板亲自下场的那一刻,你在工位上"假装在忙"的样子,他都看在眼里。',
         '年假拦得住工作,拦得住老板吗?显然拦不住。'],
  overflow: ['工位堆爆的那一刻,HR 的优化名单上已经有了你的名字。',
             '年假用完了还在堆工作?这就是当代打工人的日常,祝你顺利(不)。',
             '工作不会消失,只会转移——比如转移到你被优化的通知里。'],
  resign: ['辞职信被批准了——恭喜!你提前通关了人生副本。',
           '"我辞职!"说完这句话之后,老板微笑着盖了章。',
           '赌博有风险,辞职需谨慎。这次,老板真的同意了。'],
};
function pickQuote(list) { return list[(Math.random() * list.length) | 0]; }

function win() {
  if (G.over) return;
  G.over = true; G.phase = 'over';
  AudioSys.stopBGM(); AudioSys.sfx('win');
  const leavesLeft = G.leavesUsed.filter(x => !x).length;
  const perfect = leavesLeft === 5;
  showEnd(true, '🎉 守住了!全年无"工作事故"通关!', [
    ['消灭工作数', G.kills + ' 个'],
    ['剩余咖啡因', G.caffeine],
    ['剩余年假', leavesLeft + ' 次'],
  ], perfect ? WIN_QUOTES[0] : pickQuote(WIN_QUOTES));
}
function gameOver(reason, r) {
  if (G.over) return;
  G.over = true; G.phase = 'over';
  AudioSys.stopBGM(); AudioSys.sfx('gameOver');
  const titles = {
    boss: '你被优化了 —— 老板亲自走到了工位前',
    overflow: '你被优化了 —— 第 ' + (r + 1) + ' 行的工位被工作堆爆了',
    resign: '你被优化了 —— 老板批准了你的辞职信',
  };
  showEnd(false, titles[reason], [
    ['消灭工作数', G.kills + ' 个'],
    ['撑到', '第 ' + Math.max(1, G.waveIdx + 1) + ' 波'],
  ], pickQuote(LOSE_QUOTES[reason]));
}
function showEnd(winFlag, title, stats, quote) {
  const el = document.getElementById('endScreen');
  document.getElementById('endTitle').textContent = title;
  document.getElementById('endTitle').className = winFlag ? 'win' : 'lose';
  const st = document.getElementById('endStats');
  st.innerHTML = stats.map(([k, v]) => `<div class="stat"><span>${k}</span><b>${v}</b></div>`).join('');
  document.getElementById('endQuote').textContent = '【打工人评价】' + quote;
  el.style.display = 'flex';
}

/* ================= UI:卡片栏 ================= */
const cardEls = {};
(function buildCards() {
  const bar = document.getElementById('cardBar');
  for (const key of CARD_ORDER) {
    const def = UNIT_DEFS[key];
    const el = document.createElement('div');
    el.className = 'card';
    el.dataset.key = key;
    el.innerHTML = `
      ${def.custom ? '<div class="customTag">自创</div>' : ''}
      <img src="${ICONS[key]}" draggable="false">
      <div class="cname">${def.name}</div>
      <div class="ccost">${def.cost}</div>
      <div class="cdOverlay"></div>`;
    bar.appendChild(el);
    cardEls[key] = el;

    el.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      if (G.phase !== 'playing' || G.paused) return;
      if (G.cardCds[key] > 0 || G.caffeine < def.cost) {
        AudioSys.sfx('error');
        el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
        return;
      }
      beginDrag(key, 'unit', ev);
    });
    el.addEventListener('mouseenter', () => {
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => showTooltip(key, el), 500);
    });
    el.addEventListener('mouseleave', hideTooltip);
  }
})();
let tipTimer = null;
function showTooltip(key, cardEl) {
  if (G.dragging) return;
  const def = UNIT_DEFS[key];
  const tip = document.getElementById('tooltip');
  tip.innerHTML = `<b>${def.name}</b><span class="tipcost">☕ ${def.cost} · 冷却 ${def.cd}s</span><p>${def.desc}</p>`;
  tip.style.left = cardEl.offsetLeft + 'px';
  tip.style.top = (cardEl.offsetTop + cardEl.offsetHeight + 6) + 'px';
  tip.classList.add('show');
}
function hideTooltip() { clearTimeout(tipTimer); document.getElementById('tooltip').classList.remove('show'); }

function refreshCards() {
  for (const key of CARD_ORDER) {
    const el = cardEls[key], def = UNIT_DEFS[key];
    el.classList.toggle('disabled', G.caffeine < def.cost || (G.cardCds[key] || 0) > 0);
  }
}
function updateCardUI() {
  for (const key of CARD_ORDER) {
    const el = cardEls[key], def = UNIT_DEFS[key];
    const left = G.cardCds[key] || 0;
    el.querySelector('.cdOverlay').style.height = left > 0 ? (left / def.cd * 100) + '%' : '0';
    el.classList.toggle('disabled', G.caffeine < def.cost || left > 0);
    el.classList.toggle('selected', G.selectedCard === key);
  }
  document.getElementById('shovelBtn').classList.toggle('selected', G.selectedShovel);
}

/* ================= 拖拽 / 铲子 / 点击放置 ================= */
const ghost = document.getElementById('ghost');
const stageEl = document.getElementById('stage');
const rc = new THREE.Raycaster();
function screenToGround(ev) {
  const rect = canvas.getBoundingClientRect();
  const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  const ny = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  rc.setFromCamera({ x: nx, y: ny }, camera);
  const t = -rc.ray.origin.y / rc.ray.direction.y;
  return rc.ray.origin.clone().addScaledVector(rc.ray.direction, t);
}
function cellOf(p) {
  const c = Math.round(p.x + 4), r = Math.round(p.z + 2);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return null;
  return { r, c };
}

function beginDrag(key, type, ev) {
  G.dragging = { key, type, startX: ev.clientX, startY: ev.clientY, moved: false };
  hideTooltip();
  ghost.innerHTML = `<img src="${type === 'unit' ? ICONS[key] : ICONS.shovel}">`;
  ghost.classList.add('show');
  moveGhost(ev);
}
function moveGhost(ev) {
  const rect = stageEl.getBoundingClientRect();
  const scale = rect.width / 1280;
  ghost.style.left = ((ev.clientX - rect.left) / scale) + 'px';
  ghost.style.top = ((ev.clientY - rect.top) / scale) + 'px';
}
function endDrag() {
  G.dragging = null;
  ghost.classList.remove('show');
  highlight.visible = false;
}
function updateHighlight(ev) {
  const p = screenToGround(ev);
  const cell = cellOf(p);
  if (!cell) { highlight.visible = false; return null; }
  highlight.visible = true;
  highlight.position.set(cell.c - 4, .02, cell.r - 2);
  const occ = unitAt(cell.r, cell.c);
  if (G.dragging && G.dragging.type === 'unit') {
    highlight.material.color.set(occ ? 0xff5252 : 0x44ff88);
    highlight.material.opacity = occ ? .5 : .4;
  } else if (G.dragging && G.dragging.type === 'shovel') {
    highlight.material.color.set(occ ? 0xff9800 : 0x90a4ae);
    highlight.material.opacity = .45;
  } else if (G.selectedCard) {
    highlight.material.color.set(occ ? 0xff5252 : 0x44ff88);
    highlight.material.opacity = .4;
  } else if (G.selectedShovel) {
    highlight.material.color.set(occ ? 0xff9800 : 0x90a4ae);
  }
  return cell;
}

window.addEventListener('pointermove', ev => {
  if (!G.dragging) {
    if ((G.selectedCard || G.selectedShovel) && G.phase === 'playing' && !G.paused) {
      const cell = updateHighlight(ev);
      if (!cell) highlight.visible = false;
    }
    return;
  }
  if (Math.hypot(ev.clientX - G.dragging.startX, ev.clientY - G.dragging.startY) > 8) G.dragging.moved = true;
  moveGhost(ev);
  updateHighlight(ev);
});
window.addEventListener('pointerup', ev => {
  const d = G.dragging;
  if (!d) return;
  const cell = updateHighlight(ev);
  if (!d.moved) {
    // 视为点击:切换选中(也支持点卡片→点格子)
    if (d.type === 'unit') G.selectedCard = G.selectedCard === d.key ? null : d.key;
    else G.selectedShovel = !G.selectedShovel;
    AudioSys.sfx('deny');
  } else if (d.type === 'unit') {
    const def = UNIT_DEFS[d.key];
    if (cell && !unitAt(cell.r, cell.c) && spendCaffeine(def.cost)) {
      G.cardCds[d.key] = def.cd;
      placeUnit(d.key, cell.r, cell.c);
      AudioSys.sfx('place');
      G.selectedCard = null;
    } else if (cell) {
      AudioSys.sfx('deny');
      burst(new THREE.Vector3(cell.c - 4, .2, cell.r - 2), ['#ff5252', '#ef9a9a'], 8, { spread: 1.2, up: 1.2, size: .07, life: .4 });
    }
  } else if (d.type === 'shovel') {
    if (cell) {
      const u = unitAt(cell.r, cell.c);
      if (u) { removeUnit(u, false); floatText(new THREE.Vector3(u.x, .8, u.z), '铲掉了!', '#546e7a'); }
    }
    G.selectedShovel = false;
  }
  endDrag();
  updateCardUI();
});
// 选中卡片/铲子后点击格子
canvas.addEventListener('pointerdown', ev => {
  if (G.phase !== 'playing' || G.paused) return;
  if (!G.selectedCard && !G.selectedShovel) return;
  const cell = cellOf(screenToGround(ev));
  if (!cell) return;
  if (G.selectedShovel) {
    const u = unitAt(cell.r, cell.c);
    if (u) {
      removeUnit(u, false);
      floatText(new THREE.Vector3(u.x, .8, u.z), '铲掉了!', '#546e7a');
      G.selectedShovel = false;
    }
  } else {
    const key = G.selectedCard, def = UNIT_DEFS[key];
    if (!unitAt(cell.r, cell.c) && spendCaffeine(def.cost)) {
      G.cardCds[key] = def.cd;
      placeUnit(key, cell.r, cell.c);
      AudioSys.sfx('place');
      G.selectedCard = null;
    } else { AudioSys.sfx('deny'); }
  }
  updateCardUI();
});

/* ================= 按钮 & 图鉴 ================= */
document.getElementById('shovelBtn').addEventListener('pointerdown', ev => {
  ev.preventDefault();
  if (G.phase !== 'playing' || G.paused) return;
  G.selectedShovel = !G.selectedShovel;
  G.selectedCard = null;
  AudioSys.sfx('deny');
  updateCardUI();
});
const btnPause = document.getElementById('btnPause');
btnPause.addEventListener('click', () => {
  if (G.phase !== 'playing') return;
  G.paused = !G.paused;
  btnPause.textContent = G.paused ? '▶' : '⏸';
  document.getElementById('pauseTip').style.display = G.paused ? 'flex' : 'none';
});
const btnSpeed = document.getElementById('btnSpeed');
btnSpeed.addEventListener('click', () => {
  G.speed = G.speed === 1 ? 2 : 1;
  btnSpeed.textContent = '×' + G.speed;
});
document.getElementById('btnRestart').addEventListener('click', () => { resetGame(); });
document.getElementById('btnRestart2').addEventListener('click', () => { resetGame(); });
const btnMute = document.getElementById('btnMute');
btnMute.addEventListener('click', () => {
  AudioSys.setMuted(!AudioSys.isMuted());
  btnMute.textContent = AudioSys.isMuted() ? '🔇' : '🔊';
});

const codexEl = document.getElementById('codex');
let codexOpen = false;
function toggleCodex(force) {
  codexOpen = force !== undefined ? force : !codexOpen;
  codexEl.style.display = codexOpen ? 'flex' : 'none';
  if (G.phase === 'playing' && !G.over) {
    G.paused = codexOpen;
    btnPause.textContent = G.paused ? '▶' : '⏸';
  }
}
document.getElementById('btnCodex').addEventListener('click', () => toggleCodex());
document.getElementById('btnCodex2').addEventListener('click', () => toggleCodex());
document.getElementById('codexClose').addEventListener('click', () => toggleCodex(false));

(function buildCodex() {
  const mk = (def, key, extra) => `
    <div class="cxItem">
      <img src="${ICONS[key]}">
      <div><b>${def.name}</b>${extra || ''}<p>${def.desc}</p></div>
    </div>`;
  document.getElementById('codexAllies').innerHTML =
    CARD_ORDER.map(k => mk(UNIT_DEFS[k], k, `<span class="tag">☕${UNIT_DEFS[k].cost} · 冷却${UNIT_DEFS[k].cd}s · 血${UNIT_DEFS[k].hp}</span>`)).join('');
  document.getElementById('codexEnemies').innerHTML =
    Object.keys(ENEMY_DEFS).map(k => mk(ENEMY_DEFS[k], k, `<span class="tag">血${ENEMY_DEFS[k].hp} · 速度${ENEMY_DEFS[k].speed}格/秒</span>`)).join('');
})();

/* ================= 开始 / 重置 ================= */
document.getElementById('btnStart').addEventListener('click', () => {
  AudioSys.init(); AudioSys.resume(); AudioSys.startBGM();
  document.getElementById('menuScreen').style.display = 'none';
  resetGame();
});
document.getElementById('btnHome').addEventListener('click', () => {
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('menuScreen').style.display = 'flex';
  G.phase = 'menu';
  clearField();
});
window.addEventListener('keydown', ev => {
  if (ev.code === 'KeyP' && G.phase === 'playing') btnPause.click();
});

function clearField() {
  for (const u of [...G.units]) scene.remove(u.mesh);
  for (const e of [...G.enemies]) scene.remove(e.mesh);
  for (const b of G.bullets) b.mesh.visible = false;
  for (const d of G.skyDrops) scene.remove(d.mesh);
  for (const a of G.slotAnims) scene.remove(a.mesh);
  for (const f of (G.leavesFx || [])) scene.remove(f.mesh);
  G.units = []; G.enemies = []; G.bullets = []; G.skyDrops = []; G.slotAnims = []; G.leavesFx = [];
  G.occupancy.fill(null);
  G.bossAlive = false; G.bossRef = null;
}
function resetGame() {
  clearField();
  Object.assign(G, {
    phase: 'playing', paused: false, speed: G.speed, time: 0,
    caffeine: START_CAFF, kills: 0, spent: 0,
    slots: [0, 0, 0, 0, 0], leavesUsed: [false, false, false, false, false],
    cardCds: {}, skyTimer: 3.5,
    waveIdx: -1, waveQueue: [], waveSpawnTimer: 0, waveDone: false, waveRest: 5,
    over: false, selectedCard: null, selectedShovel: false,
  });
  for (const s of scenery.traySlots) s.visible = false;
  elCaff.textContent = G.caffeine;
  document.getElementById('endScreen').style.display = 'none';
  document.getElementById('pauseTip').style.display = 'none';
  btnPause.textContent = '⏸';
  banner('守住 5 个工位!别让老板走过来!', 'wave');
  refreshCards(); updateWaveUI(); updateCardUI();
}

/* ================= 主循环 ================= */
let lastT = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, (now - lastT) / 1000);
  lastT = now;
  if (G.phase === 'playing' && !G.paused) {
    const sdt = dt * G.speed;
    G.time += sdt;
    for (const k in G.cardCds) G.cardCds[k] = Math.max(0, G.cardCds[k] - sdt);
    updateSkyDrops(sdt);
    updateWaves(sdt);
    updateUnits(sdt);
    updateEnemies(sdt);
    updateBullets(sdt);
    updateSlotAnims(sdt);
    updateParticles(sdt);
    updateCardUI();
    // 工位组员打字小动作
    scenery.workerHeads.forEach((st, i) => { st.position.y = Math.abs(Math.sin(G.time * 7 + i * 1.7)) * .02; });
  } else {
    updateParticles(dt);
  }
  renderer.render(scene, camera);
}
requestAnimationFrame(loop);
elCaff.textContent = G.caffeine;
updateWaveUI();



