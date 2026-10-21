// game.js - 核心战斗循环、3D场景搭建、拖拽与铲子交互、波次调度与胜负判定

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.canvas = document.getElementById('game-canvas');
    this.width = 1280;
    this.height = 720;

    // 状态机
    this.state = 'MENU'; // MENU, PLAYING, PAUSED, VICTORY, DEFEAT
    this.speedMultiplier = 1.0;
    this.caffeine = CONFIG.INITIAL_CAFFEINE;
    this.score = 0;
    this.killedCount = 0;

    // 3D 核心
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 战场数据结构
    // grid[row][col] -> null 或 单位对象
    this.grid = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      this.grid[r] = new Array(CONFIG.GRID_COLS).fill(null);
    }
    this.workstations = []; // 5个工位
    this.enemies = [];      // 场上活跃敌人
    this.bullets = [];      // 场上飞行子弹
    this.drops = [];        // 场上掉落物（咖啡因）
    this.particles = [];    // 爆炸/火花粒子

    // 计时器与波次控制
    this.waveIndex = 0;
    this.currentWave = null;
    this.waveSpawnQueue = [];
    this.waveTimer = 0;
    this.isWaveSpawning = false;
    this.skyDropTimer = 0;
    this.lastTime = 0;

    // 冷却跟踪: cardCooldowns[unitId] = remainingSeconds
    this.cardCooldowns = {};
    for (const key in UNIT_TYPES) {
      this.cardCooldowns[key] = 0;
    }

    // 拖拽与交互状态
    this.draggingCardId = null;
    this.draggingShovel = false;
    this.dragGhost = null;
    this.hoverRow = -1;
    this.hoverCol = -1;
    this.hoverMesh = null;

    // 网格地面高亮辅助 Plane
    this.gridPlanes = [];

    // 老板同屏数量限制
    this.bossInScene = false;

    // 初始化
    this.initThree();
    this.initSceneEnvironment();
    this.initUI();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  // ---------------- 3D 初始化 ----------------
  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xDCE775); // 明快微黄绿背景色（Crossy Road 经典高饱和明媚色调）
    this.scene.fog = new THREE.Fog(0xDCE775, 25, 45);

    // 半俯视正对视角（严禁横向侧倾倾斜，严格保持对称与行线近似水平）
    // 战场中心约在 (0, 0, 0)
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.5, 100);
    // 俯角约 45 度：Y=13.5, Z=13.5，看着 (0, 0, 0)
    this.camera.position.set(0, 13.8, 12.8);
    this.camera.lookAt(new THREE.Vector3(0, -0.5, -0.6));

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 灯光设置：明快 Crossy Road 阳光与柔和天光
    const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x546E7A, 0.45);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.65);
    dirLight.position.set(10, 22, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 5;
    dirLight.shadow.camera.far = 45;
    dirLight.shadow.camera.left = -14;
    dirLight.shadow.camera.right = 14;
    dirLight.shadow.camera.top = 12;
    dirLight.shadow.camera.bottom = -12;
    this.scene.add(dirLight);

    // 辅助环境弱点光（营造办公室微光）
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.2);
    this.scene.add(ambientLight);
  }

  // ---------------- 场景环境搭建 ----------------
  initSceneEnvironment() {
    // 1. 办公室地面地毯大底座
    const floorGeo = new THREE.BoxGeometry(28, 0.6, 16);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x90A4AE }); // 更柔和耐看的灰色办公室地毯
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.3, 0);
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 2. 作战网格（5 行 x 9 列），交错双色地毯小方砖与清晰分隔线
    const gridGroup = new THREE.Group();
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      this.gridPlanes[r] = [];
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const x = CONFIG.START_X + c * CONFIG.CELL_WIDTH;
        const z = CONFIG.START_Z + r * CONFIG.CELL_HEIGHT;

        // 棋盘格对比更清晰明朗的办公地毯砖
        const isAlt = (r + c) % 2 === 0;
        const tileColor = isAlt ? 0xB0BEC5 : 0xCFD8DC;

        const tileMesh = window.voxelBuilder.createBlock(
          x, 0.02, z,
          CONFIG.CELL_WIDTH * 0.94, 0.04, CONFIG.CELL_HEIGHT * 0.94,
          tileColor
        );
        tileMesh.receiveShadow = true;
        tileMesh.userData = { row: r, col: c };
        gridGroup.add(tileMesh);
        this.gridPlanes[r][c] = tileMesh;
      }
    }
    this.scene.add(gridGroup);

    // 悬停高亮框
    this.hoverMesh = window.voxelBuilder.createBlock(
      0, 0.06, 0,
      CONFIG.CELL_WIDTH * 0.98, 0.06, CONFIG.CELL_HEIGHT * 0.98,
      VoxelColors.GRID_HOVER, 0.55
    );
    this.hoverMesh.visible = false;
    this.scene.add(this.hoverMesh);

    // 3. 左侧大长桌与 5 个工位
    const deskGroup = new THREE.Group();
    // 贯穿全部 5 行的大长桌台面
    const deskLongX = CONFIG.START_X - 1.8;
    const deskLongZ = 0;
    const deskLong = window.voxelBuilder.createBlock(
      deskLongX, 0.45, deskLongZ,
      1.6, 0.15, CONFIG.GRID_ROWS * CONFIG.CELL_HEIGHT + 0.4,
      VoxelColors.DESK_TOP
    );
    deskGroup.add(deskLong);

    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      const z = CONFIG.START_Z + r * CONFIG.CELL_HEIGHT;
      const ws = window.voxelBuilder.createWorkstation(r);
      ws.position.set(deskLongX, 0, z);
      deskGroup.add(ws);
      this.workstations.push(ws);
    }
    this.scene.add(deskGroup);

    // 4. 右侧老板办公室
    const bossOfficeX = CONFIG.START_X + (CONFIG.GRID_COLS - 0.5) * CONFIG.CELL_WIDTH + 2.2;
    const bossOffice = window.voxelBuilder.createBossOffice();
    bossOffice.position.set(bossOfficeX, 0, 0);
    this.scene.add(bossOffice);

    // 5. 办公室四周体素陈设氛围（绿植盆栽、饮水机、文件柜、隔断等）
    this.addOfficeDecorations();
  }

  addOfficeDecorations() {
    const decorGroup = new THREE.Group();
    // 盆栽绿植 (上方与下方)
    const plantPositions = [
      { x: -7.5, z: -5.0 }, { x: -4.0, z: -5.0 }, { x: 2.0, z: -5.0 }, { x: 7.0, z: -5.0 },
      { x: -7.5, z: 5.0 }, { x: -2.0, z: 5.0 }, { x: 4.0, z: 5.0 }, { x: 7.0, z: 5.0 }
    ];
    plantPositions.forEach(pos => {
      // 花盆
      decorGroup.add(window.voxelBuilder.createBlock(pos.x, 0.3, pos.z, 0.7, 0.6, 0.7, 0x8D6E63));
      // 绿植叶球
      decorGroup.add(window.voxelBuilder.createBlock(pos.x, 0.9, pos.z, 0.9, 0.8, 0.9, 0x2E7D32));
      decorGroup.add(window.voxelBuilder.createBlock(pos.x, 1.4, pos.z, 0.5, 0.4, 0.5, 0x43A047));
    });

    // 饮水机 (打工人摸鱼闲聊圣地)
    const coolerX = -7.5;
    const coolerZ = -3.5;
    decorGroup.add(window.voxelBuilder.createBlock(coolerX, 0.6, coolerZ, 0.6, 1.2, 0.6, 0xECEFF1));
    decorGroup.add(window.voxelBuilder.createBlock(coolerX, 1.4, coolerZ, 0.45, 0.6, 0.45, VoxelColors.GLASS_BLUE, 0.7));
    decorGroup.add(window.voxelBuilder.createBlock(coolerX, 0.65, coolerZ + 0.32, 0.15, 0.1, 0.08, 0x1E88E5)); // 蓝水龙头
    decorGroup.add(window.voxelBuilder.createBlock(coolerX, 0.65, coolerZ + 0.32, 0.15, 0.1, 0.08, 0xE53935)); // 红水龙头

    this.scene.add(decorGroup);
  }

  // ---------------- UI 与事件绑定 ----------------
  initUI() {
    this.uiCaffeine = document.getElementById('caffeine-val');
    this.uiWaveProgress = document.getElementById('wave-progress-bar');
    this.uiWaveText = document.getElementById('wave-text');
    this.uiCards = document.getElementById('cards-container');
    this.uiShovel = document.getElementById('shovel-btn');
    this.uiGhost = document.getElementById('ghost-drag-img');
    this.uiTooltip = document.getElementById('card-tooltip');
    this.uiHugeWaveAlert = document.getElementById('huge-wave-alert');
    this.uiVacationAlert = document.getElementById('vacation-alert');

    // 渲染卡片栏
    this.renderCardBar();

    // 铲子拖拽与点击支持
    this.initShovelEvents();

    // 悬停气泡提示
    this.initTooltipEvents();

    // 顶部通用按钮（暂停、2倍速、重开、图鉴）
    document.getElementById('btn-pause').onclick = () => this.togglePause();
    document.getElementById('btn-speed').onclick = () => this.toggleSpeed();
    document.getElementById('btn-restart').onclick = () => this.restartGame();
    document.getElementById('btn-handbook').onclick = () => this.openHandbook();

    // 菜单界面的按钮
    document.getElementById('btn-start-game').onclick = () => this.startGame();
    document.getElementById('btn-menu-handbook').onclick = () => this.openHandbook();
    document.getElementById('btn-close-handbook').onclick = () => this.closeHandbook();
    document.getElementById('btn-victory-restart').onclick = () => this.restartGame();
    document.getElementById('btn-defeat-restart').onclick = () => this.restartGame();

    // 全局鼠标/触摸事件（实现卡片拖拽与 3D 悬停落子）
    this.initPointerDragEvents();
  }

  renderCardBar() {
    this.uiCards.innerHTML = '';
    for (const key in UNIT_TYPES) {
      const u = UNIT_TYPES[key];
      const card = document.createElement('div');
      card.className = 'card-item';
      card.dataset.unitId = u.id;

      card.innerHTML = `
        <div class="card-cost">${u.cost}</div>
        <div class="card-icon icon-${u.id}"></div>
        <div class="card-name">${u.name}</div>
        <div class="card-cooldown-overlay"></div>
      `;

      // 拖拽启动
      card.addEventListener('pointerdown', (e) => {
        if (this.state !== 'PLAYING') return;
        if (this.caffeine < u.cost || this.cardCooldowns[u.id] > 0) return;
        this.startDraggingCard(u.id, e);
      });

      this.uiCards.appendChild(card);
    }
  }

  initShovelEvents() {
    this.uiShovel.addEventListener('pointerdown', (e) => {
      if (this.state !== 'PLAYING') return;
      this.startDraggingShovel(e);
    });
  }

  initTooltipEvents() {
    let hoverTimer = null;
    const showTip = (u, clientX, clientY) => {
      this.uiTooltip.innerHTML = `
        <div class="tip-title">${u.name} <span class="tip-cost">☕ ${u.cost}</span></div>
        <div class="tip-stats">冷却: ${u.cooldown}s | 生命: ${u.hp}${u.damage ? ` | 伤害: ${u.damage}` : ''}</div>
        <div class="tip-desc">${u.desc}</div>
      `;
      this.uiTooltip.style.left = `${clientX + 12}px`;
      this.uiTooltip.style.top = `${clientY + 15}px`;
      this.uiTooltip.classList.remove('hidden');
    };

    const hideTip = () => {
      if (hoverTimer) clearTimeout(hoverTimer);
      this.uiTooltip.classList.add('hidden');
    };

    this.uiCards.addEventListener('mouseover', (e) => {
      const card = e.target.closest('.card-item');
      if (!card || this.draggingCardId || this.draggingShovel) return;
      const u = UNIT_TYPES[card.dataset.unitId];
      if (!u) return;

      hideTip();
      hoverTimer = setTimeout(() => {
        const rect = card.getBoundingClientRect();
        showTip(u, rect.left, rect.bottom);
      }, 500); // 约 0.5 秒悬停
    });

    this.uiCards.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.card-item');
      if (card) hideTip();
    });

    this.hideTooltip = hideTip;
  }

  initPointerDragEvents() {
    window.addEventListener('pointermove', (e) => {
      if (!this.draggingCardId && !this.draggingShovel) return;
      this.updateDrag(e);
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.draggingCardId && !this.draggingShovel) return;
      this.endDrag(e);
    });

    // 点击 3D 场景收集咖啡因（虽然支持自动收集，但也支持手动提前点击收取爽感）
    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'PLAYING' || this.draggingCardId || this.draggingShovel) return;
      this.handleClickCanvas(e);
    });
  }

  startDraggingCard(unitId, e) {
    this.hideTooltip();
    this.draggingCardId = unitId;
    this.uiGhost.style.display = 'block';
    this.uiGhost.innerText = UNIT_TYPES[unitId].name;
    this.uiGhost.className = 'ghost-drag active-card';
    this.updateGhostPosition(e.clientX, e.clientY);
  }

  startDraggingShovel(e) {
    this.hideTooltip();
    this.draggingShovel = true;
    this.uiGhost.style.display = 'block';
    this.uiGhost.innerText = '铲除';
    this.uiGhost.className = 'ghost-drag active-shovel';
    this.updateGhostPosition(e.clientX, e.clientY);
  }

  updateGhostPosition(clientX, clientY) {
    this.uiGhost.style.left = `${clientX + 10}px`;
    this.uiGhost.style.top = `${clientY + 10}px`;
  }

  updateDrag(e) {
    this.updateGhostPosition(e.clientX, e.clientY);

    // 屏幕坐标转射线
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    // 与所有地块进行求交
    const allTiles = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        allTiles.push(this.gridPlanes[r][c]);
      }
    }

    const intersects = this.raycaster.intersectObjects(allTiles);
    if (intersects.length > 0) {
      const tile = intersects[0].object;
      const { row, col } = tile.userData;
      this.hoverRow = row;
      this.hoverCol = col;

      const posX = CONFIG.START_X + col * CONFIG.CELL_WIDTH;
      const posZ = CONFIG.START_Z + row * CONFIG.CELL_HEIGHT;
      this.hoverMesh.position.set(posX, 0.05, posZ);
      this.hoverMesh.visible = true;

      // 放置合法性检查
      let isValid = false;
      if (this.draggingCardId) {
        isValid = (this.grid[row][col] === null);
      } else if (this.draggingShovel) {
        isValid = (this.grid[row][col] !== null);
      }

      this.hoverMesh.material.color.setHex(isValid ? VoxelColors.GRID_HOVER : VoxelColors.GRID_INVALID);
    } else {
      this.hoverRow = -1;
      this.hoverCol = -1;
      this.hoverMesh.visible = false;
    }
  }

  endDrag(e) {
    this.uiGhost.style.display = 'none';
    this.hoverMesh.visible = false;

    if (this.hoverRow >= 0 && this.hoverCol >= 0) {
      const r = this.hoverRow;
      const c = this.hoverCol;

      if (this.draggingCardId) {
        const u = UNIT_TYPES[this.draggingCardId];
        if (this.grid[r][c] === null && this.caffeine >= u.cost && this.cardCooldowns[u.id] <= 0) {
          this.plantUnit(u.id, r, c);
        }
      } else if (this.draggingShovel) {
        if (this.grid[r][c] !== null) {
          this.removeUnit(r, c);
        }
      }
    }

    this.draggingCardId = null;
    this.draggingShovel = false;
    this.hoverRow = -1;
    this.hoverCol = -1;
  }

  // ---------------- 游戏启动与状态切换 ----------------
  startGame() {
    window.soundSystem.ensureContext();
    window.soundSystem.startBGM();

    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    this.state = 'PLAYING';
    this.lastTime = performance.now();

    // 启动第 1 波
    this.startWave(0);
  }

  restartGame() {
    window.soundSystem.ensureContext();
    window.soundSystem.startBGM();

    // 清理场上对象
    // 1. 单位
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        if (this.grid[r][c]) {
          this.scene.remove(this.grid[r][c].mesh);
          this.grid[r][c] = null;
        }
      }
    }
    // 2. 敌人
    this.enemies.forEach(en => this.scene.remove(en.mesh));
    this.enemies = [];
    // 3. 子弹
    this.bullets.forEach(b => this.scene.remove(b.mesh));
    this.bullets = [];
    // 4. 掉落物
    this.drops.forEach(d => this.scene.remove(d.mesh));
    this.drops = [];
    // 5. 粒子
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    // 重置工位槽位和年假
    this.workstations.forEach(ws => {
      ws.userData.usedCount = 0;
      ws.userData.vacationUsed = false;
      ws.userData.slots.forEach(s => {
        const stack = s.getObjectByName('docStack');
        if (stack) stack.visible = false;
      });
    });

    // 重置冷却与资源
    this.caffeine = CONFIG.INITIAL_CAFFEINE;
    this.score = 0;
    this.killedCount = 0;
    this.bossInScene = false;
    this.speedMultiplier = 1.0;
    document.getElementById('btn-speed').innerText = '1X';

    for (const key in this.cardCooldowns) {
      this.cardCooldowns[key] = 0;
    }

    // 隐藏结算弹窗
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('defeat-modal').classList.add('hidden');
    document.getElementById('start-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.startWave(0);
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('btn-pause').innerText = '继续';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      document.getElementById('btn-pause').innerText = '暂停';
    }
  }

  toggleSpeed() {
    this.speedMultiplier = this.speedMultiplier === 1.0 ? 2.0 : 1.0;
    document.getElementById('btn-speed').innerText = `${this.speedMultiplier}X`;
  }

  openHandbook() {
    this.renderHandbookList();
    document.getElementById('handbook-modal').classList.remove('hidden');
  }

  closeHandbook() {
    document.getElementById('handbook-modal').classList.add('hidden');
  }

  renderHandbookList() {
    const listEl = document.getElementById('handbook-list');
    listEl.innerHTML = '';

    // 我方单位
    const h3Unit = document.createElement('h3');
    h3Unit.className = 'handbook-subhead';
    h3Unit.innerText = '🛡️ 打工人防身武器库';
    listEl.appendChild(h3Unit);

    for (const key in UNIT_TYPES) {
      const u = UNIT_TYPES[key];
      const card = document.createElement('div');
      card.className = 'handbook-card';
      card.innerHTML = `
        <div class="h-name">${u.name}</div>
        <div class="h-stats">费用: ${u.cost} ☕ | 冷却: ${u.cooldown}s | 生命: ${u.hp}${u.damage ? ` | 伤害: ${u.damage}` : ''}</div>
        <div class="h-desc">${u.desc}</div>
      `;
      listEl.appendChild(card);
    }

    // 敌方单位
    const h3Enemy = document.createElement('h3');
    h3Enemy.className = 'handbook-subhead';
    h3Enemy.innerText = '⚠️ 涌来的各种工作';
    listEl.appendChild(h3Enemy);

    for (const key in ENEMY_TYPES) {
      const en = ENEMY_TYPES[key];
      const card = document.createElement('div');
      card.className = 'handbook-card enemy-card';
      card.innerHTML = `
        <div class="h-name">${en.name}</div>
        <div class="h-stats">生命: ${en.hp} | 移速: ${en.speed}格/秒 | 啃食伤害: ${en.biteDps}/s</div>
        <div class="h-desc">${en.desc}</div>
      `;
      listEl.appendChild(card);
    }
  }

  // ---------------- 种植与铲除 ----------------
  plantUnit(unitId, row, col) {
    const u = UNIT_TYPES[unitId];
    this.caffeine -= u.cost;
    this.cardCooldowns[unitId] = u.cooldown;
    window.soundSystem.playPlant();

    const posX = CONFIG.START_X + col * CONFIG.CELL_WIDTH;
    const posZ = CONFIG.START_Z + row * CONFIG.CELL_HEIGHT;

    const mesh = u.createModel();
    mesh.position.set(posX, 0.05, posZ);
    this.scene.add(mesh);

    const unitObj = {
      id: u.id,
      row: row,
      col: col,
      hp: u.hp,
      maxHp: u.hp,
      mesh: mesh,
      attackTimer: 0,
      produceTimer: 0,
      armTimer: 0,
      isArmed: false,
      resignTriggerTimer: 0
    };

    this.grid[row][col] = unitObj;
  }

  removeUnit(row, col) {
    const unit = this.grid[row][col];
    if (!unit) return;
    window.soundSystem.playShovel();
    this.createBreakParticles(unit.mesh.position.x, unit.mesh.position.y + 0.5, unit.mesh.position.z, 0x90A4AE);
    this.scene.remove(unit.mesh);
    this.grid[row][col] = null;
  }

  // ---------------- 波次推进与出怪 ----------------
  startWave(waveIdx) {
    if (waveIdx >= WAVE_CONFIGS.length) return; // 胜利结算将在 update 中检查
    this.waveIndex = waveIdx;
    this.currentWave = WAVE_CONFIGS[waveIdx];
    this.isWaveSpawning = true;
    this.waveTimer = 0;

    // 展开本波怪物序列
    this.waveSpawnQueue = [];
    let accDelay = 1.0; // 本波开始后的缓冲时间
    this.currentWave.enemies.forEach(group => {
      for (let i = 0; i < group.count; i++) {
        this.waveSpawnQueue.push({
          type: group.type,
          spawnTime: accDelay + Math.random() * 0.8
        });
        accDelay += group.delay;
      }
    });

    // 按照 spawnTime 升序排序
    this.waveSpawnQueue.sort((a, b) => a.spawnTime - b.spawnTime);

    // 大波提醒
    if (this.currentWave.isHuge) {
      this.triggerHugeWaveAlert();
    }
  }

  triggerHugeWaveAlert() {
    window.soundSystem.playHugeWave();
    this.uiHugeWaveAlert.classList.remove('hidden');
    setTimeout(() => {
      this.uiHugeWaveAlert.classList.add('hidden');
    }, 2800);
  }

  spawnEnemy(enemyTypeKey, targetRow = null) {
    // 老板全场唯一限制
    if (enemyTypeKey === 'BOSS') {
      if (this.bossInScene) {
        // 若场上已有老板，则降级为加急需求
        enemyTypeKey = 'URGENT_DOC';
      } else {
        this.bossInScene = true;
      }
    }

    const tpl = ENEMY_TYPES[enemyTypeKey];
    const row = targetRow !== null ? targetRow : Math.floor(Math.random() * CONFIG.GRID_ROWS);
    const startX = CONFIG.START_X + (CONFIG.GRID_COLS - 0.5) * CONFIG.CELL_WIDTH + 1.8;
    const startZ = CONFIG.START_Z + row * CONFIG.CELL_HEIGHT;

    const mesh = tpl.createModel();
    mesh.position.set(startX, 0.05, startZ);
    mesh.rotation.y = -Math.PI / 2; // 面朝左（朝工位推进）
    this.scene.add(mesh);

    const enemy = {
      type: enemyTypeKey,
      tpl: tpl,
      row: row,
      x: startX,
      z: startZ,
      hp: tpl.hp,
      maxHp: tpl.hp,
      speed: tpl.speed,
      biteDps: tpl.biteDps,
      mesh: mesh,
      isBiting: false,
      slowTimer: 0,
      hasJumped: false,
      isJumping: false,
      jumpProgress: 0,
      jumpStartX: 0,
      jumpEndX: 0,
      spawnChildTimer: 0,
      isEnteringSlot: false,
      slotAnimProgress: 0,
      targetSlotPos: null
    };

    this.enemies.push(enemy);
  }

  // ---------------- 工位槽位与年假判定 ----------------
  handleEnemyReachStation(enemy) {
    const row = enemy.row;
    const ws = this.workstations[row];

    // 失败条件 1：老板到达工位，年假也无法阻挡，直接游戏结束！
    if (enemy.type === 'BOSS') {
      this.triggerDefeat("老板亲自杀到工位前！打工生涯宣告终结！");
      return;
    }

    // 失败条件 2：该工位年假已经用过，再有敌人到达 → 堆爆辞退，游戏结束！
    if (ws.userData.vacationUsed) {
      this.triggerDefeat(`第 ${row + 1} 行工位的年假已用完，工作彻底堆爆！你被优化了！`);
      return;
    }

    // 正常进入槽位动画
    window.soundSystem.playSlotEnter();
    enemy.isEnteringSlot = true;
    enemy.slotAnimProgress = 0;

    const currentUsed = ws.userData.usedCount;
    const slotIdx = Math.min(currentUsed, CONFIG.SLOTS_PER_ROW - 1);
    const targetSlot = ws.userData.slots[slotIdx];

    // 获取槽位在世界坐标中的位置
    const worldPos = new THREE.Vector3();
    targetSlot.getWorldPosition(worldPos);
    enemy.targetSlotPos = worldPos;
    enemy.assignedSlot = targetSlot;

    ws.userData.usedCount++;

    // 检查是否占满 4 个槽位 → 自动触发年假！
    if (ws.userData.usedCount >= CONFIG.SLOTS_PER_ROW && !ws.userData.vacationUsed) {
      this.triggerVacation(row);
    }
  }

  triggerVacation(row) {
    const ws = this.workstations[row];
    ws.userData.vacationUsed = true;
    window.soundSystem.playVacation();

    // 弹出年假审批单浮层提醒
    this.uiVacationAlert.innerText = `第 ${row + 1} 行【年假审批单】生效！本行工作全部清空！`;
    this.uiVacationAlert.classList.remove('hidden');
    setTimeout(() => {
      this.uiVacationAlert.classList.add('hidden');
    }, 2500);

    // 清空场上该行的所有活跃敌人（年假只清敌人，不清槽位）
    const remainingEnemies = [];
    this.enemies.forEach(en => {
      if (en.row === row && !en.isEnteringSlot) {
        if (en.type === 'BOSS') this.bossInScene = false;
        this.createBreakParticles(en.mesh.position.x, en.mesh.position.y + 0.5, en.mesh.position.z, 0xFFEB3B);
        this.scene.remove(en.mesh);
        this.killedCount++;
      } else {
        remainingEnemies.push(en);
      }
    });
    this.enemies = remainingEnemies;
  }

  // ---------------- 辞职信引爆与风险判定 ----------------
  triggerResignationLetter(unit) {
    window.soundSystem.playExplosion(true);
    this.createBreakParticles(unit.mesh.position.x, unit.mesh.position.y + 0.8, unit.mesh.position.z, 0xD50000, 30);

    // 移除辞职信自身
    this.scene.remove(unit.mesh);
    this.grid[unit.row][unit.col] = null;

    // 15% 真实风险被老板当场批准导致直接失败
    const dice = Math.random();
    if (dice < CONFIG.RESIGN_FAIL_CHANCE) {
      this.triggerDefeat("老板当场在辞职信上签字盖章：“同意，明天不用来了！”");
      return;
    }

    // 引爆清空全场所有正在进攻的敌人
    this.enemies.forEach(en => {
      if (!en.isEnteringSlot) {
        if (en.type === 'BOSS') this.bossInScene = false;
        this.createBreakParticles(en.mesh.position.x, en.mesh.position.y + 0.5, en.mesh.position.z, 0xFF5722);
        this.scene.remove(en.mesh);
        this.killedCount++;
      }
    });
    this.enemies = this.enemies.filter(en => en.isEnteringSlot);
  }

  // ---------------- 结算：胜利与失败 ----------------
  triggerVictory() {
    this.state = 'VICTORY';
    window.soundSystem.stopBGM();
    window.soundSystem.playVictory();

    // 统计剩余年假
    let remainingVacations = 0;
    this.workstations.forEach(ws => {
      if (!ws.userData.vacationUsed) remainingVacations++;
    });

    // 随机评语
    const comment = WORKER_COMMENTS_VICTORY[Math.floor(Math.random() * WORKER_COMMENTS_VICTORY.length)];

    document.getElementById('vic-killed').innerText = this.killedCount;
    document.getElementById('vic-caffeine').innerText = this.caffeine;
    document.getElementById('vic-vacation').innerText = `${remainingVacations} / 5 次`;
    document.getElementById('vic-comment').innerText = comment;

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('victory-modal').classList.remove('hidden');
  }

  triggerDefeat(reason) {
    this.state = 'DEFEAT';
    window.soundSystem.stopBGM();
    window.soundSystem.playDefeat();

    const comment = WORKER_COMMENTS_DEFEAT[Math.floor(Math.random() * WORKER_COMMENTS_DEFEAT.length)];

    document.getElementById('defeat-reason').innerText = reason;
    document.getElementById('defeat-comment').innerText = comment;

    document.getElementById('hud').classList.add('hidden');
    document.getElementById('defeat-modal').classList.remove('hidden');
  }

  // ---------------- 掉落物咖啡因 ----------------
  spawnCaffeineDrop(worldX, worldZ) {
    const mesh = window.voxelBuilder.createCoffeeDrop();
    mesh.position.set(worldX, 3.5, worldZ);
    this.scene.add(mesh);

    this.drops.push({
      mesh: mesh,
      targetY: 0.25,
      y: 3.5,
      vy: -3.0,
      life: 12.0 // 存在12秒后自动收取或消失
    });
  }

  collectDrop(drop) {
    window.soundSystem.playCollect();
    this.caffeine += CONFIG.SKY_DROP_AMOUNT;
    this.scene.remove(drop.mesh);
  }

  handleClickCanvas(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const dropMeshes = this.drops.map(d => d.mesh);
    const intersects = this.raycaster.intersectObjects(dropMeshes, true);
    if (intersects.length > 0) {
      const topObj = intersects[0].object;
      const foundDrop = this.drops.find(d => {
        let cur = topObj;
        while (cur) {
          if (cur === d.mesh) return true;
          cur = cur.parent;
        }
        return false;
      });
      if (foundDrop) {
        this.collectDrop(foundDrop);
        this.drops = this.drops.filter(d => d !== foundDrop);
      }
    }
  }

  // ---------------- 粒子特效 ----------------
  createBreakParticles(x, y, z, colorHex, count = 12) {
    for (let i = 0; i < count; i++) {
      const pMesh = window.voxelBuilder.createBlock(x, y, z, 0.14, 0.14, 0.14, colorHex);
      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 4 + 1.5,
        vz: (Math.random() - 0.5) * 4,
        life: 0.6
      });
    }
  }

  // ---------------- 主更新循环 ----------------
  update(dt) {
    if (this.state !== 'PLAYING') return;

    // 1. 卡片冷却更新
    for (const key in this.cardCooldowns) {
      if (this.cardCooldowns[key] > 0) {
        this.cardCooldowns[key] = Math.max(0, this.cardCooldowns[key] - dt);
      }
    }

    // 2. 天降咖啡因生成
    this.skyDropTimer += dt;
    if (this.skyDropTimer >= CONFIG.SKY_DROP_INTERVAL) {
      this.skyDropTimer = 0;
      const randCol = Math.floor(Math.random() * CONFIG.GRID_COLS);
      const randRow = Math.floor(Math.random() * CONFIG.GRID_ROWS);
      const dropX = CONFIG.START_X + randCol * CONFIG.CELL_WIDTH;
      const dropZ = CONFIG.START_Z + randRow * CONFIG.CELL_HEIGHT;
      this.spawnCaffeineDrop(dropX, dropZ);
    }

    // 3. 掉落物下落与自动收取
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.life -= dt;
      if (drop.y > drop.targetY) {
        drop.y = Math.max(drop.targetY, drop.y + drop.vy * dt);
        drop.mesh.position.y = drop.y;
      } else {
        // 轻微上下浮动
        drop.mesh.position.y = drop.targetY + Math.sin(performance.now() * 0.005) * 0.08;
      }
      drop.mesh.rotation.y += dt * 2.0;

      // 自动收集（满足规范“自动收集”）
      if (drop.life <= 10.0) { // 落地稍作展示后自动入账
        this.collectDrop(drop);
        this.drops.splice(i, 1);
      }
    }

    // 4. 单位行为逻辑
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        const unit = this.grid[r][c];
        if (!unit) continue;

        // 咖啡机产出
        if (unit.id === 'COFFEE_MAKER') {
          unit.produceTimer += dt;
          if (unit.produceTimer >= CONFIG.COFFEE_MAKER_INTERVAL) {
            unit.produceTimer = 0;
            this.caffeine += CONFIG.COFFEE_MAKER_AMOUNT;
            window.soundSystem.playCollect();
            this.createBreakParticles(unit.mesh.position.x, unit.mesh.position.y + 0.8, unit.mesh.position.z, 0xFFD54F, 8);
          }
        }

        // 自创：带薪拉屎产出
        if (unit.id === 'PAID_POOP') {
          unit.produceTimer += dt;
          const uTpl = UNIT_TYPES.PAID_POOP;
          if (unit.produceTimer >= uTpl.produceInterval) {
            unit.produceTimer = 0;
            this.caffeine += uTpl.produceAmount;
            window.soundSystem.playCollect();
            this.createBreakParticles(unit.mesh.position.x, unit.mesh.position.y + 0.8, unit.mesh.position.z, 0xFFD700, 6);
          }
        }

        // 假装在忙（武装计时）
        if (unit.id === 'FAKE_BUSY' && !unit.isArmed) {
          unit.armTimer += dt;
          if (unit.armTimer >= CONFIG.FAKE_BUSY_ARM_TIME) {
            unit.isArmed = true;
            // 荧光亮起
            const screen = unit.mesh.getObjectByName('screenGlow');
            if (screen) screen.material.color.setHex(VoxelColors.SCREEN_GLOW);
          }
        }

        // 辞职信引爆倒计时
        if (unit.id === 'RESIGN_LETTER') {
          unit.resignTriggerTimer += dt;
          if (unit.resignTriggerTimer >= CONFIG.RESIGN_TRIGGER_DELAY) {
            this.triggerResignationLetter(unit);
            continue;
          }
        }

        // 攻击类单位发射检测（DDL加农炮、摸鱼鱼缸、画大饼机）
        const uTpl = UNIT_TYPES[unit.id];
        if (uTpl && uTpl.type === 'shooter') {
          unit.attackTimer += dt;
          if (unit.attackTimer >= uTpl.attackInterval) {
            // 检查本行右方是否有活跃敌人
            const hasEnemyInRow = this.enemies.some(
              en => en.row === r && !en.isEnteringSlot && en.x >= unit.mesh.position.x - 0.2
            );
            if (hasEnemyInRow) {
              unit.attackTimer = 0;
              this.fireBullet(unit, uTpl);
            }
          }
        }
      }
    }

    // 5. 子弹飞行与碰撞
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.speed * dt;
      b.mesh.position.x = b.x;

      // 旋转特效
      b.mesh.rotation.x += dt * 5;
      b.mesh.rotation.z += dt * 8;

      // 飞出右侧屏幕老板办公室销毁
      const rightBound = CONFIG.START_X + CONFIG.GRID_COLS * CONFIG.CELL_WIDTH + 1.5;
      if (b.x > rightBound) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      // 寻找本行最靠左的敌人检测碰撞
      const hitEnemy = this.enemies.find(
        en => en.row === b.row && !en.isEnteringSlot && Math.abs(en.x - b.x) < 0.45
      );

      if (hitEnemy) {
        // 命中反馈
        window.soundSystem.playHit();
        this.createBreakParticles(b.x, b.mesh.position.y, b.mesh.position.z, 0xFFEB3B, 5);

        // 结算伤害
        hitEnemy.hp -= b.damage;

        // 减速处理
        if (b.bulletType === 'water') {
          hitEnemy.slowTimer = 5.0; // 减速5秒
        }

        // 击退处理（画大饼机）
        if (b.knockback) {
          hitEnemy.x += b.knockback * CONFIG.CELL_WIDTH;
          hitEnemy.mesh.position.x = hitEnemy.x;
        }

        // 销毁子弹
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }

    // 6. 敌人移动、跳跃、啃咬、例会产仔
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];

      // 死亡检测
      if (en.hp <= 0) {
        if (en.type === 'BOSS') this.bossInScene = false;
        window.soundSystem.playHit();
        this.createBreakParticles(en.mesh.position.x, en.mesh.position.y + 0.5, en.mesh.position.z, 0x455A64, 15);
        this.killedCount++;
        this.score += en.tpl.score;
        this.scene.remove(en.mesh);
        this.enemies.splice(i, 1);
        continue;
      }

      // 正在缩小入槽动画中
      if (en.isEnteringSlot) {
        en.slotAnimProgress += dt * 3.5;
        const p = Math.min(1.0, en.slotAnimProgress);
        // 插值缩放与位置移动
        en.mesh.scale.set((1 - p * 0.8) * 0.65, (1 - p * 0.8) * 0.65, (1 - p * 0.8) * 0.65);
        if (en.targetSlotPos) {
          en.mesh.position.lerp(en.targetSlotPos, 0.25);
        }
        if (p >= 1.0) {
          // 入槽完毕，点亮槽内堆积物
          if (en.assignedSlot) {
            const stack = en.assignedSlot.getObjectByName('docStack');
            if (stack) stack.visible = true;
          }
          this.scene.remove(en.mesh);
          this.enemies.splice(i, 1);
        }
        continue;
      }

      // 例会（ROUTINE_MEETING）：行进中每10秒在前方本行空格生成1个普通需求
      if (en.type === 'ROUTINE_MEETING') {
        en.spawnChildTimer += dt;
        if (en.spawnChildTimer >= 10.0) {
          en.spawnChildTimer = 0;
          this.spawnEnemy('NORMAL_DOC', en.row);
        }
      }

      // 减速计时
      let currentSpeed = en.speed;
      if (en.slowTimer > 0) {
        en.slowTimer -= dt;
        currentSpeed *= 0.5; // 减速50%
      }

      // 计算当前所在网格列
      const gridCol = Math.round((en.x - CONFIG.START_X) / CONFIG.CELL_WIDTH);

      // 跳跃处理（临时会议遇到第一个单位起跳）
      if (en.isJumping) {
        en.jumpProgress += dt * 2.2;
        const jp = Math.min(1.0, en.jumpProgress);
        en.x = en.jumpStartX + (en.jumpEndX - en.jumpStartX) * jp;
        // 抛物线高度
        const jumpY = Math.sin(jp * Math.PI) * 1.5;
        en.mesh.position.set(en.x, 0.05 + jumpY, en.z);

        if (jp >= 1.0) {
          en.isJumping = false;
          en.mesh.position.y = 0.05;
        }
        continue;
      }

      // 检测当前格是否有我方单位阻挡
      let blockingUnit = null;
      if (gridCol >= 0 && gridCol < CONFIG.GRID_COLS) {
        const u = this.grid[en.row][gridCol];
        if (u) {
          // 与单位的距离
          const unitX = CONFIG.START_X + gridCol * CONFIG.CELL_WIDTH;
          if (Math.abs(en.x - unitX) < 0.45) {
            blockingUnit = u;
          }
        }
      }

      if (blockingUnit) {
        // 临时会议：遇到第一个单位跳跃跳过
        if (en.tpl.canJump && !en.hasJumped) {
          en.hasJumped = true;
          en.isJumping = true;
          en.jumpProgress = 0;
          en.jumpStartX = en.x;
          en.jumpEndX = en.x - CONFIG.CELL_WIDTH * 1.35; // 跨过单位落到前一格
          window.soundSystem.playJump();
          continue;
        }

        // 假装在忙：若已武装进入状态，直接自爆秒杀敌人！
        if (blockingUnit.id === 'FAKE_BUSY' && blockingUnit.isArmed) {
          window.soundSystem.playExplosion(false);
          this.createBreakParticles(en.x, 0.4, en.z, 0xD50000, 20);
          // 秒杀敌人
          en.hp = 0;
          if (en.type === 'BOSS') this.bossInScene = false;
          this.scene.remove(en.mesh);
          this.enemies.splice(i, 1);
          this.killedCount++;
          // 移除假装在忙
          this.scene.remove(blockingUnit.mesh);
          this.grid[blockingUnit.row][blockingUnit.col] = null;
          continue;
        }

        // 停下啃咬单位
        en.isBiting = true;
        blockingUnit.hp -= en.biteDps * dt;
        if (blockingUnit.hp <= 0) {
          // 单位阵亡
          window.soundSystem.playShovel();
          this.createBreakParticles(blockingUnit.mesh.position.x, 0.5, blockingUnit.mesh.position.z, 0x78909C, 12);
          this.scene.remove(blockingUnit.mesh);
          this.grid[blockingUnit.row][blockingUnit.col] = null;
          en.isBiting = false;
        }
      } else {
        en.isBiting = false;
      }

      // 未被阻挡且未跳跃，向前推进行走
      if (!en.isBiting && !en.isJumping) {
        en.x -= currentSpeed * CONFIG.CELL_WIDTH * dt;
        en.mesh.position.x = en.x;

        // 敌人行走轻微摇摆体态
        const walkCycle = performance.now() * 0.01;
        const legL = en.mesh.getObjectByName('legL');
        const legR = en.mesh.getObjectByName('legR');
        if (legL && legR) {
          legL.position.y = 0.1 + Math.sin(walkCycle) * 0.05;
          legR.position.y = 0.1 - Math.sin(walkCycle) * 0.05;
        }

        // 检测是否到达左侧工位底线！
        const stationBoundaryX = CONFIG.START_X - 0.7;
        if (en.x <= stationBoundaryX) {
          this.handleEnemyReachStation(en);
        }
      }
    }

    // 7. 粒子更新
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vy -= 9.8 * dt; // 重力
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 8. 波次排期出怪更新
    if (this.isWaveSpawning) {
      this.waveTimer += dt;
      while (this.waveSpawnQueue.length > 0 && this.waveSpawnQueue[0].spawnTime <= this.waveTimer) {
        const item = this.waveSpawnQueue.shift();
        this.spawnEnemy(item.type);
      }

      // 当本波敌人全部出完，且场上无活跃敌人时，切入下一波
      if (this.waveSpawnQueue.length === 0 && this.enemies.length === 0) {
        this.isWaveSpawning = false;
        if (this.waveIndex + 1 < WAVE_CONFIGS.length) {
          // 4秒后自动开启下一波
          setTimeout(() => {
            if (this.state === 'PLAYING') {
              this.startWave(this.waveIndex + 1);
            }
          }, 4000);
        } else {
          // 全部 12 波撑过，且场上无怪 → 胜利结算！
          this.triggerVictory();
        }
      }
    }

    // 9. 更新 HUD 界面
    this.updateHUD();
  }

  fireBullet(unit, uTpl) {
    window.soundSystem.playShoot(uTpl.bulletType);
    let bulletMesh;
    if (uTpl.bulletType === 'water') {
      bulletMesh = window.voxelBuilder.createWaterBullet();
    } else if (uTpl.bulletType === 'pie') {
      bulletMesh = window.voxelBuilder.createPieBullet();
    } else {
      bulletMesh = window.voxelBuilder.createCannonBullet();
    }

    const startX = unit.mesh.position.x + 0.4;
    const startY = 0.65;
    const startZ = unit.mesh.position.z;

    bulletMesh.position.set(startX, startY, startZ);
    this.scene.add(bulletMesh);

    this.bullets.push({
      mesh: bulletMesh,
      row: unit.row,
      x: startX,
      speed: uTpl.bulletSpeed,
      damage: uTpl.damage,
      bulletType: uTpl.bulletType,
      knockback: uTpl.knockback || 0
    });
  }

  updateHUD() {
    this.uiCaffeine.innerText = this.caffeine;
    this.uiWaveText.innerText = `第 ${this.waveIndex + 1} / 12 波`;
    const progress = Math.min(100, Math.round(((this.waveIndex + 1) / 12) * 100));
    this.uiWaveProgress.style.width = `${progress}%`;

    // 更新卡片置灰与冷却覆盖层
    const cardElements = this.uiCards.querySelectorAll('.card-item');
    cardElements.forEach(card => {
      const uId = card.dataset.unitId;
      const u = UNIT_TYPES[uId];
      const cd = this.cardCooldowns[uId];
      const cdOverlay = card.querySelector('.card-cooldown-overlay');

      const notEnoughCaffeine = this.caffeine < u.cost;
      const onCooldown = cd > 0;

      if (notEnoughCaffeine || onCooldown) {
        card.classList.add('disabled');
      } else {
        card.classList.remove('disabled');
      }

      if (onCooldown) {
        const cdRatio = cd / u.cooldown;
        cdOverlay.style.height = `${cdRatio * 100}%`;
      } else {
        cdOverlay.style.height = '0%';
      }
    });
  }

  // ---------------- 渲染帧主循环 ----------------
  animate(time) {
    requestAnimationFrame(this.animate);

    if (this.lastTime === 0) this.lastTime = time;
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // 限制单帧最大步长，防后台切页跳帧
    if (dt > 0.1) dt = 0.1;
    dt *= this.speedMultiplier;

    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
