// voxel.js - 体素模型生成器（Crossy Road 风格：纯方块拼搭、鲜明配色、代码生成无贴图）

const VoxelColors = {
  // 办公室地毯与网格
  CARPET_LIGHT: 0xCFD8DC,
  CARPET_DARK: 0xB0BEC5,
  GRID_LINE: 0x90A4AE,
  GRID_HOVER: 0x4DD0E1,
  GRID_INVALID: 0xFF5252,

  // 家具与建筑
  DESK_WOOD: 0xD7CCC8,
  DESK_TOP: 0xEFEBE9,
  DESK_LEGS: 0x546E7A,
  CHAIR_BLUE: 0x1E88E5,
  MONITOR_BEZEL: 0x263238,
  MONITOR_SCREEN: 0x81D4FA,
  WALL_GRAY: 0xECEFF1,
  GLASS_BLUE: 0x80DEEA,
  BOSS_DOOR_FRAME: 0x3E2723,
  GOLD_ACCENT: 0xFFD54F,

  // 单位配色
  COFFEE_RED: 0xE53935,
  COFFEE_DARK: 0x4E342E,
  COFFEE_LIQUID: 0x3E2723,
  COFFEE_STEAM: 0xFFFFFF,
  
  CANNON_GREEN: 0x2E7D32,
  CANNON_DARK: 0x1B5E20,
  CANNON_RED: 0xD32F2F,
  
  POT_BLACK: 0x212121,
  POT_GRAY: 0x424242,
  SKIN_TONE: 0xFFCC80,
  SHIRT_WHITE: 0xFAFAFA,
  PANTS_JEANS: 0x1565C0,

  TANK_GLASS: 0x81D4FA,
  WATER_BLUE: 0x29B6F6,
  FISH_ORANGE: 0xFF7043,

  ENVELOPE_WHITE: 0xFFFFFF,
  RESIGN_RED: 0xD50000,
  WASTEBASKET: 0x78909C,

  COAT_BROWN: 0x6D4C41,
  SCREEN_GLOW: 0xB388FF,

  // 自创单位 1：带薪拉屎
  TOILET_WHITE: 0xFFFFFF,
  TOILET_WATER: 0x4FC3F7,
  PHONE_GOLD: 0xFFD700,

  // 自创单位 2：画大饼机
  OVEN_METAL: 0x78909C,
  PIE_GOLD: 0xFFA000,
  PIE_CRUST: 0xFFCA28,

  // 敌人配色
  DOC_WHITE: 0xFFFFFF,
  DOC_TEXT: 0x424242,
  DOC_BORDER: 0xB0BEC5,
  
  FIRE_ORANGE: 0xFF5722,
  FIRE_YELLOW: 0xFFEB3B,

  BOSS_SUIT: 0x1A237E,
  BOSS_HAIR: 0x3E2723,
  BRIEFCASE_BROWN: 0x4E342E,

  CALENDAR_RED: 0xC62828,
  CALENDAR_WHITE: 0xFAFAFA,
  
  MEETING_TABLE: 0x8D6E63,
  PROJECTOR_CYAN: 0x00E5FF
};

class VoxelBuilder {
  constructor() {
    this.boxGeo = new THREE.BoxGeometry(1, 1, 1);
    this.materials = new Map();
  }

  getMaterial(colorHex, opacity = 1.0) {
    const key = `${colorHex}_${opacity}`;
    if (!this.materials.has(key)) {
      const mat = new THREE.MeshLambertMaterial({
        color: colorHex,
        transparent: opacity < 1.0,
        opacity: opacity
      });
      this.materials.set(key, mat);
    }
    return this.materials.get(key);
  }

  // 创建单个方块
  createBlock(x, y, z, sx, sy, sz, colorHex, opacity = 1.0) {
    const mesh = new THREE.Mesh(this.boxGeo, this.getMaterial(colorHex, opacity));
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  // 1. 咖啡机 (冒热气与滴滤壶)
  createCoffeeMaker() {
    const group = new THREE.Group();
    // 底座
    group.add(this.createBlock(0, 0.2, 0, 1.2, 0.4, 1.0, VoxelColors.COFFEE_RED));
    // 机身背板
    group.add(this.createBlock(0, 0.9, -0.3, 1.1, 1.0, 0.4, VoxelColors.COFFEE_RED));
    // 顶部顶盖
    group.add(this.createBlock(0, 1.45, -0.05, 1.1, 0.3, 0.9, VoxelColors.COFFEE_RED));
    // 滴滤壶 (透明玻璃)
    group.add(this.createBlock(0, 0.65, 0.1, 0.7, 0.6, 0.7, VoxelColors.GLASS_BLUE, 0.65));
    // 咖啡液
    group.add(this.createBlock(0, 0.55, 0.1, 0.6, 0.4, 0.6, VoxelColors.COFFEE_LIQUID));
    // 顶部出水口
    group.add(this.createBlock(0, 1.25, 0.1, 0.25, 0.15, 0.25, VoxelColors.POT_BLACK));
    // 咖啡热气体素颗粒 (将在主循环中驱动浮动动画)
    const steamGroup = new THREE.Group();
    steamGroup.name = "steam";
    steamGroup.add(this.createBlock(-0.15, 1.7, 0.1, 0.15, 0.15, 0.15, VoxelColors.COFFEE_STEAM, 0.8));
    steamGroup.add(this.createBlock(0.15, 1.9, 0.05, 0.15, 0.15, 0.15, VoxelColors.COFFEE_STEAM, 0.8));
    group.add(steamGroup);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 2. DDL 加农炮 (炮身 + 大红死线倒计时)
  createDDLCannon() {
    const group = new THREE.Group();
    // 轮子 / 底座
    group.add(this.createBlock(-0.5, 0.3, -0.4, 0.3, 0.6, 0.8, VoxelColors.POT_BLACK));
    group.add(this.createBlock(0.5, 0.3, -0.4, 0.3, 0.6, 0.8, VoxelColors.POT_BLACK));
    group.add(this.createBlock(0, 0.2, -0.4, 0.8, 0.3, 0.6, VoxelColors.CANNON_DARK));

    // 炮管主体 (仰角倾斜)
    const barrel = new THREE.Group();
    barrel.name = "barrel";
    barrel.position.set(0, 0.6, -0.2);
    barrel.rotation.x = -Math.PI / 12; // 稍微抬高朝右/朝前

    // 炮膛
    barrel.add(this.createBlock(0, 0, 0.3, 0.8, 0.8, 1.2, VoxelColors.CANNON_GREEN));
    // 炮口加厚圈
    barrel.add(this.createBlock(0, 0, 0.95, 0.95, 0.95, 0.2, VoxelColors.CANNON_DARK));
    // 炮管口空腔黑色
    barrel.add(this.createBlock(0, 0, 1.0, 0.6, 0.6, 0.05, VoxelColors.POT_BLACK));

    // DDL 大红警示看板
    barrel.add(this.createBlock(0, 0.6, 0.3, 0.9, 0.45, 0.1, VoxelColors.CANNON_RED));
    // 白色的 DDL 文字块
    barrel.add(this.createBlock(-0.25, 0.6, 0.36, 0.15, 0.3, 0.05, 0xFFFFFF));
    barrel.add(this.createBlock(0, 0.6, 0.36, 0.15, 0.3, 0.05, 0xFFFFFF));
    barrel.add(this.createBlock(0.25, 0.6, 0.36, 0.15, 0.3, 0.05, 0xFFFFFF));

    group.add(barrel);
    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 3. 背锅侠 (实习同事扛着厚重的大黑铁锅)
  createBackScaper() {
    const group = new THREE.Group();
    // 实习生身体
    // 双腿
    group.add(this.createBlock(-0.2, 0.3, 0, 0.25, 0.6, 0.3, VoxelColors.PANTS_JEANS));
    group.add(this.createBlock(0.2, 0.3, 0, 0.25, 0.6, 0.3, VoxelColors.PANTS_JEANS));
    // 上身白衬衫
    group.add(this.createBlock(0, 0.8, 0, 0.7, 0.6, 0.4, VoxelColors.SHIRT_WHITE));
    // 领带
    group.add(this.createBlock(0, 0.8, 0.22, 0.12, 0.45, 0.05, 0x1976D2));
    // 头部
    group.add(this.createBlock(0, 1.3, 0, 0.5, 0.45, 0.45, VoxelColors.SKIN_TONE));
    // 头发
    group.add(this.createBlock(0, 1.55, 0, 0.54, 0.15, 0.5, 0x3E2723));
    // 眼睛 (委屈/汗流浃背表情)
    group.add(this.createBlock(-0.15, 1.3, 0.23, 0.08, 0.08, 0.05, 0x212121));
    group.add(this.createBlock(0.15, 1.3, 0.23, 0.08, 0.08, 0.05, 0x212121));
    // 冷汗一滴
    group.add(this.createBlock(0.28, 1.35, 0.23, 0.06, 0.09, 0.05, 0x4FC3F7));

    // 胸前/背部超大黑铁锅 (立在身前抵挡风雨)
    const potGroup = new THREE.Group();
    potGroup.name = "ironPot";
    // 锅面主体
    potGroup.add(this.createBlock(0, 0.85, 0.38, 1.25, 1.25, 0.2, VoxelColors.POT_BLACK));
    // 锅沿加固
    potGroup.add(this.createBlock(0, 0.85, 0.45, 1.35, 1.35, 0.08, VoxelColors.POT_GRAY));
    // 两个铁耳把手
    potGroup.add(this.createBlock(-0.72, 0.85, 0.38, 0.15, 0.3, 0.15, VoxelColors.POT_GRAY));
    potGroup.add(this.createBlock(0.72, 0.85, 0.38, 0.15, 0.3, 0.15, VoxelColors.POT_GRAY));
    group.add(potGroup);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 4. 摸鱼鱼缸 (工位透明鱼缸，带水和小金鱼)
  createFishTank() {
    const group = new THREE.Group();
    // 底座木垫
    group.add(this.createBlock(0, 0.1, 0, 1.2, 0.2, 0.9, VoxelColors.DESK_WOOD));
    // 水体
    group.add(this.createBlock(0, 0.65, 0, 0.95, 0.8, 0.65, VoxelColors.WATER_BLUE, 0.8));
    // 外层透明玻璃缸
    group.add(this.createBlock(0, 0.7, 0, 1.1, 0.95, 0.8, VoxelColors.TANK_GLASS, 0.45));
    // 缸底水草
    group.add(this.createBlock(-0.3, 0.35, -0.1, 0.15, 0.4, 0.15, 0x43A047));
    group.add(this.createBlock(-0.2, 0.45, 0.1, 0.15, 0.5, 0.15, 0x2E7D32));
    // 小金鱼 (待机时可摆尾)
    const fish = new THREE.Group();
    fish.name = "fish";
    fish.position.set(0.1, 0.65, 0);
    fish.add(this.createBlock(0, 0, 0, 0.35, 0.2, 0.15, VoxelColors.FISH_ORANGE));
    fish.add(this.createBlock(-0.22, 0, 0, 0.12, 0.15, 0.05, 0xFFAB91)); // 鱼尾
    fish.add(this.createBlock(0.12, 0.04, 0.08, 0.05, 0.05, 0.03, 0x212121)); // 鱼眼
    group.add(fish);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 5. 辞职信 (巨大的加粗红色辞职报告信封 + 印章)
  createResignationLetter() {
    const group = new THREE.Group();
    // 垃圾桶底座或信件底托
    group.add(this.createBlock(0, 0.15, 0, 1.1, 0.3, 0.8, VoxelColors.WASTEBASKET));
    // 大信封本体
    group.add(this.createBlock(0, 0.8, 0, 1.2, 1.0, 0.15, VoxelColors.ENVELOPE_WHITE));
    // 信封翻盖线条
    group.add(this.createBlock(0, 1.15, 0.05, 1.0, 0.25, 0.1, 0xEEEEEE));
    // 红色大印章 / \"辞职\"两字象征红色印戳
    group.add(this.createBlock(0, 0.75, 0.1, 0.6, 0.5, 0.08, VoxelColors.RESIGN_RED));
    // 印戳金色闪光
    group.add(this.createBlock(0, 0.75, 0.15, 0.25, 0.2, 0.05, VoxelColors.GOLD_ACCENT));

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 6. 假装在忙 (椅背上搭着工装外套 + 常亮代码屏幕)
  createFakeBusy(isReady = false) {
    const group = new THREE.Group();
    // 办公椅下盘
    group.add(this.createBlock(0, 0.1, 0, 0.6, 0.15, 0.6, VoxelColors.POT_BLACK));
    group.add(this.createBlock(0, 0.35, 0, 0.15, 0.4, 0.15, VoxelColors.POT_BLACK));
    // 办公椅坐垫
    group.add(this.createBlock(0, 0.55, 0, 0.8, 0.15, 0.8, VoxelColors.CHAIR_BLUE));
    // 椅背
    group.add(this.createBlock(0, 0.95, -0.32, 0.75, 0.7, 0.15, VoxelColors.CHAIR_BLUE));
    // 搭在椅背上的假装加班外套
    group.add(this.createBlock(0, 1.0, -0.35, 0.85, 0.65, 0.12, VoxelColors.COAT_BROWN));
    // 外套袖子垂下
    group.add(this.createBlock(-0.45, 0.8, -0.3, 0.15, 0.5, 0.2, VoxelColors.COAT_BROWN));
    group.add(this.createBlock(0.45, 0.8, -0.3, 0.15, 0.5, 0.2, VoxelColors.COAT_BROWN));

    // 前方常亮假装加班的显示器小屏幕
    group.add(this.createBlock(0, 0.5, 0.35, 0.1, 0.3, 0.1, VoxelColors.POT_BLACK)); // 支架
    // 屏幕框
    group.add(this.createBlock(0, 0.75, 0.35, 0.6, 0.4, 0.1, VoxelColors.MONITOR_BEZEL));
    // 屏幕光 (未激活时暗蓝，武装就绪后荧光紫)
    const screenColor = isReady ? VoxelColors.SCREEN_GLOW : 0x1565C0;
    const screenMesh = this.createBlock(0, 0.75, 0.41, 0.5, 0.3, 0.05, screenColor);
    screenMesh.name = "screenGlow";
    group.add(screenMesh);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 7. 自创单位 1：带薪拉屎 (黄金马桶 + 隔间门)
  // 机制：阻挡敌人，且每 6 秒在排毒中产出 15 咖啡因（打工人最神圣的偷闲时光）
  createPaidPoop() {
    const group = new THREE.Group();
    // 瓷砖小底座
    group.add(this.createBlock(0, 0.1, 0, 1.1, 0.2, 1.1, 0xE0E0E0));
    // 马桶底座与桶身
    group.add(this.createBlock(0, 0.4, 0.1, 0.6, 0.5, 0.7, VoxelColors.TOILET_WHITE));
    // 水箱
    group.add(this.createBlock(0, 0.85, -0.25, 0.6, 0.7, 0.3, VoxelColors.TOILET_WHITE));
    // 黄金马桶盖
    group.add(this.createBlock(0, 0.68, 0.1, 0.65, 0.08, 0.65, VoxelColors.PHONE_GOLD));
    // 手机支架上正刷视频的黄金手机
    group.add(this.createBlock(0.35, 0.75, 0.2, 0.05, 0.2, 0.05, VoxelColors.POT_BLACK));
    group.add(this.createBlock(0.35, 0.9, 0.2, 0.1, 0.18, 0.04, VoxelColors.PHONE_GOLD));
    // 卷纸筒
    group.add(this.createBlock(-0.35, 0.7, 0.1, 0.15, 0.2, 0.15, 0xFFFFFF));

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 8. 自创单位 2：画大饼机 (旋转大烤箱喷出大饼)
  // 机制：向整行发射旋转金黄大饼（高击退效果+范围香气减速），打工人的终极精神胜利
  createPieMachine() {
    const group = new THREE.Group();
    // 烤箱金属底盘
    group.add(this.createBlock(0, 0.45, 0, 1.0, 0.8, 0.9, VoxelColors.OVEN_METAL));
    // 烤箱玻璃观察窗
    group.add(this.createBlock(0, 0.45, 0.46, 0.7, 0.5, 0.05, VoxelColors.GLASS_BLUE, 0.6));
    // 炉内火光
    group.add(this.createBlock(0, 0.45, 0.4, 0.6, 0.4, 0.05, 0xFF7043));
    // 顶部旋转大饼架
    const pie = new THREE.Group();
    pie.name = "spinningPie";
    pie.position.set(0, 1.1, 0);
    // 黄金大饼主体
    pie.add(this.createBlock(0, 0, 0, 0.8, 0.15, 0.8, VoxelColors.PIE_GOLD));
    // 大饼花边
    pie.add(this.createBlock(0, 0.04, 0, 0.9, 0.08, 0.9, VoxelColors.PIE_CRUST));
    // 大饼芝麻/纹理
    pie.add(this.createBlock(-0.15, 0.1, -0.15, 0.08, 0.04, 0.08, 0x5D4037));
    pie.add(this.createBlock(0.15, 0.1, 0.15, 0.08, 0.04, 0.08, 0x5D4037));
    group.add(pie);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // ---------------- 敌人体素模型 ----------------
  // 1. 普通需求 (一沓堆叠的需求文档，带红批注)
  createNormalDoc() {
    const group = new THREE.Group();
    // 纸张主体
    group.add(this.createBlock(0, 0.6, 0, 0.7, 0.9, 0.5, VoxelColors.DOC_WHITE));
    // 文档边缘黑色装订线
    group.add(this.createBlock(-0.36, 0.6, 0, 0.06, 0.9, 0.52, VoxelColors.DOC_BORDER));
    // 页面文字横线 (体素条纹)
    group.add(this.createBlock(0.05, 0.8, 0.26, 0.45, 0.06, 0.04, VoxelColors.DOC_TEXT));
    group.add(this.createBlock(0.05, 0.65, 0.26, 0.45, 0.06, 0.04, VoxelColors.DOC_TEXT));
    group.add(this.createBlock(0.05, 0.5, 0.26, 0.45, 0.06, 0.04, VoxelColors.DOC_TEXT));
    // 红色的 ASAP 催办印戳
    group.add(this.createBlock(0.05, 0.35, 0.26, 0.35, 0.12, 0.04, 0xD32F2F));
    // 底部小脚 (漂浮或行走步态)
    const legL = this.createBlock(-0.2, 0.1, 0, 0.15, 0.2, 0.15, VoxelColors.DOC_BORDER);
    const legR = this.createBlock(0.2, 0.1, 0, 0.15, 0.2, 0.15, VoxelColors.DOC_BORDER);
    legL.name = "legL";
    legR.name = "legR";
    group.add(legL);
    group.add(legR);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 2. 加急需求 (冒火的需求文档，体素火焰粒子)
  createUrgentDoc() {
    const group = this.createNormalDoc();
    // 头部追加熊熊烈火
    const fireGroup = new THREE.Group();
    fireGroup.name = "fire";
    fireGroup.add(this.createBlock(0, 1.25, 0, 0.4, 0.5, 0.4, VoxelColors.FIRE_ORANGE));
    fireGroup.add(this.createBlock(0, 1.45, 0, 0.2, 0.3, 0.2, VoxelColors.FIRE_YELLOW));
    fireGroup.add(this.createBlock(-0.2, 1.15, 0.1, 0.2, 0.3, 0.2, VoxelColors.FIRE_ORANGE));
    fireGroup.add(this.createBlock(0.2, 1.15, -0.1, 0.2, 0.3, 0.2, VoxelColors.FIRE_ORANGE));
    group.add(fireGroup);
    return group;
  }

  // 3. 老板 (全场唯一人形敌人，穿深蓝西装、手提公文包、皮鞋，体型高大霸气)
  createBoss() {
    const group = new THREE.Group();
    // 锃亮皮鞋与西裤
    const legL = this.createBlock(-0.22, 0.4, 0, 0.22, 0.8, 0.25, VoxelColors.BOSS_SUIT);
    const legR = this.createBlock(0.22, 0.4, 0, 0.22, 0.8, 0.25, VoxelColors.BOSS_SUIT);
    legL.name = "legL";
    legR.name = "legR";
    group.add(legL);
    group.add(legR);
    // 皮鞋尖
    group.add(this.createBlock(-0.22, 0.08, 0.1, 0.24, 0.16, 0.4, 0x212121));
    group.add(this.createBlock(0.22, 0.08, 0.1, 0.24, 0.16, 0.4, 0x212121));

    // 西装上身 (宽肩膀大身躯)
    group.add(this.createBlock(0, 1.2, 0, 0.9, 0.9, 0.5, VoxelColors.BOSS_SUIT));
    // 白色衬衫前襟与红领带
    group.add(this.createBlock(0, 1.2, 0.26, 0.3, 0.7, 0.05, 0xFFFFFF));
    group.add(this.createBlock(0, 1.15, 0.29, 0.12, 0.55, 0.05, 0xC62828));

    // 头部
    group.add(this.createBlock(0, 1.85, 0, 0.55, 0.5, 0.5, VoxelColors.SKIN_TONE));
    // 地中海/大背头发型
    group.add(this.createBlock(0, 2.12, -0.05, 0.58, 0.18, 0.55, VoxelColors.BOSS_HAIR));
    group.add(this.createBlock(-0.3, 1.85, 0, 0.08, 0.4, 0.45, VoxelColors.BOSS_HAIR));
    group.add(this.createBlock(0.3, 1.85, 0, 0.08, 0.4, 0.45, VoxelColors.BOSS_HAIR));
    // 金丝眼镜
    group.add(this.createBlock(-0.16, 1.88, 0.26, 0.16, 0.12, 0.04, VoxelColors.GOLD_ACCENT));
    group.add(this.createBlock(0.16, 1.88, 0.26, 0.16, 0.12, 0.04, VoxelColors.GOLD_ACCENT));
    group.add(this.createBlock(0, 1.88, 0.26, 0.1, 0.04, 0.04, VoxelColors.GOLD_ACCENT));

    // 右手提着的真皮公文包 (里面装满了降薪与优化名单)
    const armR = new THREE.Group();
    armR.name = "armR";
    armR.position.set(0.55, 1.15, 0);
    armR.add(this.createBlock(0, -0.2, 0, 0.18, 0.6, 0.2, VoxelColors.BOSS_SUIT));
    // 公文包
    armR.add(this.createBlock(0, -0.55, 0.05, 0.16, 0.45, 0.6, VoxelColors.BRIEFCASE_BROWN));
    armR.add(this.createBlock(0, -0.32, 0.05, 0.08, 0.1, 0.2, VoxelColors.GOLD_ACCENT));
    group.add(armR);

    // 左手背在身后
    const armL = this.createBlock(-0.55, 1.0, -0.1, 0.18, 0.55, 0.2, VoxelColors.BOSS_SUIT);
    group.add(armL);

    group.scale.set(0.72, 0.72, 0.72); // 整体身材稍显压迫感
    return group;
  }

  // 4. 临时会议 (日历与会议邀请，弹跳前进，遇到障碍起跳)
  createTempMeeting() {
    const group = new THREE.Group();
    // 日历红色顶梁
    group.add(this.createBlock(0, 1.0, 0, 0.85, 0.25, 0.35, VoxelColors.CALENDAR_RED));
    // 翻页铁环
    group.add(this.createBlock(-0.25, 1.15, 0, 0.08, 0.15, 0.2, 0xB0BEC5));
    group.add(this.createBlock(0.25, 1.15, 0, 0.08, 0.15, 0.2, 0xB0BEC5));
    // 日历白色纸面
    group.add(this.createBlock(0, 0.55, 0, 0.8, 0.7, 0.3, VoxelColors.CALENDAR_WHITE));
    // 日期大红字 (体素方块组成的“Urgent”)
    group.add(this.createBlock(0, 0.6, 0.16, 0.4, 0.4, 0.05, VoxelColors.CALENDAR_RED));
    // 弹簧小脚
    const spring = new THREE.Group();
    spring.name = "springLeg";
    spring.add(this.createBlock(0, 0.1, 0, 0.2, 0.2, 0.2, 0x455A64));
    group.add(spring);

    group.scale.set(0.65, 0.65, 0.65);
    return group;
  }

  // 5. 例会 (行走的微型会议室：会议长桌+投影仪光束+老板椅，行进中生出新需求)
  createRoutineMeeting() {
    const group = new THREE.Group();
    // 会议长桌底盘
    group.add(this.createBlock(0, 0.45, 0, 1.1, 0.2, 0.8, VoxelColors.MEETING_TABLE));
    // 桌腿
    group.add(this.createBlock(-0.45, 0.2, -0.3, 0.12, 0.4, 0.12, 0x4E342E));
    group.add(this.createBlock(0.45, 0.2, -0.3, 0.12, 0.4, 0.12, 0x4E342E));
    group.add(this.createBlock(-0.45, 0.2, 0.3, 0.12, 0.4, 0.12, 0x4E342E));
    group.add(this.createBlock(0.45, 0.2, 0.3, 0.12, 0.4, 0.12, 0x4E342E));

    // 桌上迷你投影仪
    group.add(this.createBlock(-0.25, 0.65, 0, 0.3, 0.2, 0.3, 0x37474F));
    // 幽蓝投影光束
    const beam = this.createBlock(0.2, 0.85, 0, 0.5, 0.3, 0.4, VoxelColors.PROJECTOR_CYAN, 0.4);
    beam.name = "projectorBeam";
    group.add(beam);

    // 迷你白板/幕布
    group.add(this.createBlock(0.5, 0.9, 0, 0.08, 0.7, 0.7, 0xFFFFFF));
    group.add(this.createBlock(0.5, 0.9, 0, 0.1, 0.6, 0.6, 0x00E5FF, 0.3));

    // 四条走动小脚
    const leg1 = this.createBlock(-0.35, 0.08, 0, 0.15, 0.16, 0.15, 0x212121);
    const leg2 = this.createBlock(0.35, 0.08, 0, 0.15, 0.16, 0.15, 0x212121);
    leg1.name = "legL";
    leg2.name = "legR";
    group.add(leg1);
    group.add(leg2);

    group.scale.set(0.68, 0.68, 0.68);
    return group;
  }

  // ---------------- 场景：左侧工位与槽位 ----------------
  // 单个工位：办公桌、办公椅、电脑屏幕、组员小人、4个文件槽筐
  createWorkstation(rowIdx) {
    const station = new THREE.Group();
    station.name = `workstation_${rowIdx}`;

    // 办公桌
    station.add(this.createBlock(0, 0.5, 0, 1.4, 0.15, 1.4, VoxelColors.DESK_TOP));
    // 桌腿
    station.add(this.createBlock(-0.6, 0.22, -0.6, 0.12, 0.45, 0.12, VoxelColors.DESK_LEGS));
    station.add(this.createBlock(-0.6, 0.22, 0.6, 0.12, 0.45, 0.12, VoxelColors.DESK_LEGS));
    station.add(this.createBlock(0.6, 0.22, -0.6, 0.12, 0.45, 0.12, VoxelColors.DESK_LEGS));
    station.add(this.createBlock(0.6, 0.22, 0.6, 0.12, 0.45, 0.12, VoxelColors.DESK_LEGS));

    // 电脑屏幕
    station.add(this.createBlock(-0.15, 0.65, 0, 0.1, 0.2, 0.1, VoxelColors.MONITOR_BEZEL)); // 支架
    station.add(this.createBlock(-0.15, 0.95, 0, 0.12, 0.5, 0.8, VoxelColors.MONITOR_BEZEL)); // 外框
    station.add(this.createBlock(-0.08, 0.95, 0, 0.05, 0.44, 0.74, VoxelColors.MONITOR_SCREEN)); // 屏幕亮蓝
    // 键盘
    station.add(this.createBlock(0.2, 0.6, 0, 0.25, 0.05, 0.6, 0x455A64));

    // 组员小人体素 (打工人本尊坐在桌前疯狂敲键盘)
    const worker = new THREE.Group();
    worker.name = "worker";
    worker.position.set(0.6, 0.3, 0);
    // 椅子
    worker.add(this.createBlock(0, 0.2, 0, 0.6, 0.4, 0.6, VoxelColors.CHAIR_BLUE));
    // 组员身体 (深灰/浅灰毛衣)
    worker.add(this.createBlock(0, 0.65, 0, 0.45, 0.55, 0.4, 0x546E7A));
    // 组员头
    worker.add(this.createBlock(0, 1.1, 0, 0.4, 0.38, 0.38, VoxelColors.SKIN_TONE));
    // 组员头发
    worker.add(this.createBlock(0, 1.3, 0, 0.42, 0.12, 0.4, 0x263238));
    // 伸出的打字双手
    worker.add(this.createBlock(-0.3, 0.7, -0.15, 0.3, 0.12, 0.12, VoxelColors.SKIN_TONE));
    worker.add(this.createBlock(-0.3, 0.7, 0.15, 0.3, 0.12, 0.12, VoxelColors.SKIN_TONE));
    station.add(worker);

    // 4 个文件槽位（收件筐），整齐排列在桌子靠左侧/上方
    const slots = [];
    const slotOffsetZ = [-0.45, -0.15, 0.15, 0.45];
    for (let s = 0; s < 4; s++) {
      const slotGroup = new THREE.Group();
      slotGroup.name = `slot_${s}`;
      slotGroup.position.set(-0.5, 0.62, slotOffsetZ[s]);

      // 空槽位收件盒（低矮敞口木筐）
      const tray = this.createBlock(0, 0, 0, 0.3, 0.08, 0.24, 0x78909C);
      slotGroup.add(tray);

      // 槽位堆积物（初始隐藏或缩放到 0，入槽时展开）
      const docStack = this.createBlock(0, 0.12, 0, 0.26, 0.16, 0.2, 0xFF5252);
      docStack.name = "docStack";
      docStack.visible = false;
      slotGroup.add(docStack);

      station.add(slotGroup);
      slots.push(slotGroup);
    }

    station.userData = { slots, usedCount: 0, vacationUsed: false };
    return station;
  }

  // ---------------- 场景：右侧老板办公室 ----------------
  createBossOffice() {
    const office = new THREE.Group();
    office.name = "bossOffice";

    // 奢华木纹/大理石墙面框架
    office.add(this.createBlock(0, 2.5, 0, 0.4, 5.0, 11.0, VoxelColors.WALL_GRAY));
    // 隔间金色边框门套
    office.add(this.createBlock(-0.05, 2.5, 0, 0.15, 5.2, 11.2, VoxelColors.GOLD_ACCENT));

    // 落地玻璃推拉门 (半透明，能隐约看到里面豪华大红木老板椅与发财树)
    office.add(this.createBlock(-0.1, 2.2, 0, 0.1, 4.2, 8.5, VoxelColors.GLASS_BLUE, 0.35));

    // 办公室内部体素摆件
    // 红木大老板桌
    office.add(this.createBlock(1.5, 0.7, 0, 1.2, 1.0, 3.5, 0x3E2723));
    // 真皮大老板椅
    office.add(this.createBlock(2.4, 1.2, 0, 0.8, 1.8, 1.2, 0x212121));
    // 办公室发财树
    office.add(this.createBlock(1.5, 0.3, -3.5, 0.6, 0.6, 0.6, 0x8D6E63)); // 花盆
    office.add(this.createBlock(1.5, 1.3, -3.5, 0.9, 1.4, 0.9, 0x2E7D32)); // 树冠
    // 发财树金元宝
    office.add(this.createBlock(1.5, 2.1, -3.5, 0.3, 0.2, 0.3, VoxelColors.GOLD_ACCENT));

    // 门顶金色牌匾：“总经理办公室 / 核心决策区”
    const plaque = this.createBlock(-0.25, 4.4, 0, 0.1, 0.6, 3.0, VoxelColors.BOSS_DOOR_FRAME);
    office.add(plaque);
    const plaqueGold = this.createBlock(-0.31, 4.4, 0, 0.05, 0.45, 2.8, VoxelColors.GOLD_ACCENT);
    office.add(plaqueGold);

    return office;
  }

  // ---------------- 掉落物与子弹模型 ----------------
  // 咖啡杯 (咖啡因掉落物，金黄热气，闪烁跳跃)
  createCoffeeDrop() {
    const group = new THREE.Group();
    // 咖啡纸杯
    group.add(this.createBlock(0, 0.25, 0, 0.4, 0.5, 0.4, 0xFFFFFF));
    // 绿色星巴克风格隔热套
    group.add(this.createBlock(0, 0.25, 0, 0.44, 0.25, 0.44, 0x00796B));
    // 白色杯盖
    group.add(this.createBlock(0, 0.52, 0, 0.45, 0.08, 0.45, 0xEEEEEE));
    // 闪烁金光
    const glow = this.createBlock(0, 0.3, 0, 0.6, 0.6, 0.6, VoxelColors.GOLD_ACCENT, 0.4);
    glow.name = "glow";
    group.add(glow);
    return group;
  }

  // 子弹 1：DDL 加农炮炮弹 (印有“紧急交付”的红色体素包裹)
  createCannonBullet() {
    const group = new THREE.Group();
    group.add(this.createBlock(0, 0, 0, 0.3, 0.3, 0.3, 0xD32F2F));
    group.add(this.createBlock(0, 0, 0, 0.34, 0.1, 0.34, 0xFFEB3B)); // 黄色封条
    return group;
  }

  // 子弹 2：摸鱼水花 (蓝色晶莹水珠)
  createWaterBullet() {
    const group = new THREE.Group();
    group.add(this.createBlock(0, 0, 0, 0.25, 0.25, 0.25, 0x29B6F6, 0.85));
    group.add(this.createBlock(-0.05, 0.05, 0, 0.12, 0.12, 0.12, 0xE1F5FE, 0.9));
    return group;
  }

  // 子弹 3：自创画大饼机大饼 (金色飞盘大饼)
  createPieBullet() {
    const group = new THREE.Group();
    group.add(this.createBlock(0, 0, 0, 0.45, 0.1, 0.45, VoxelColors.PIE_GOLD));
    group.add(this.createBlock(0, 0.03, 0, 0.5, 0.05, 0.5, VoxelColors.PIE_CRUST));
    return group;
  }
}

window.voxelBuilder = new VoxelBuilder();
