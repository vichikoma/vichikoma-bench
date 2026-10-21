// config.js - 单位、敌人数值总表、自创单位定义与波次配置

const CONFIG = {
  // 网格配置 (5行 x 9列)
  GRID_ROWS: 5,
  GRID_COLS: 9,
  CELL_WIDTH: 1.6,   // X轴（横向列宽）
  CELL_HEIGHT: 1.6,  // Z轴（纵向行距）
  START_X: -5.6,     // 列0中心X
  START_Z: -3.2,     // 行0中心Z

  // 经济系统
  INITIAL_CAFFEINE: 100,
  SKY_DROP_INTERVAL: 8.0,   // 每8秒掉落一份咖啡因
  SKY_DROP_AMOUNT: 25,
  COFFEE_MAKER_INTERVAL: 10.0, // 咖啡机每10秒产出
  COFFEE_MAKER_AMOUNT: 25,

  // 工位与槽位系统
  SLOTS_PER_ROW: 4,

  // 辞职信引爆与风险
  RESIGN_TRIGGER_DELAY: 1.0, // 放置1秒后引爆
  RESIGN_FAIL_CHANCE: 0.15,  // 15% 真实风险被老板批准离职直接判负

  // 假装在忙
  FAKE_BUSY_ARM_TIME: 15.0,  // 15秒武装时间
};

// 我方单位详细数值总表（包含2个自创单位）
const UNIT_TYPES = {
  COFFEE_MAKER: {
    id: 'COFFEE_MAKER',
    name: '咖啡机',
    cost: 50,
    cooldown: 5.0,
    hp: 150,
    type: 'eco',
    desc: '每10秒自动产出25咖啡因，打工人的续命燃油；血量较薄。',
    createModel: () => window.voxelBuilder.createCoffeeMaker()
  },
  DDL_CANNON: {
    id: 'DDL_CANNON',
    name: 'DDL加农炮',
    cost: 100,
    cooldown: 5.0,
    hp: 200,
    damage: 20,
    attackInterval: 1.5,
    bulletSpeed: 7.0,
    bulletType: 'cannon',
    type: 'shooter',
    desc: '每1.5秒轰出一发“交付物”，造成20伤害。死线是第一生产力！',
    createModel: () => window.voxelBuilder.createDDLCannon()
  },
  BACK_SCAPER: {
    id: 'BACK_SCAPER',
    name: '背锅侠',
    cost: 50,
    cooldown: 10.0,
    hp: 2000, // 为DDL加农炮(200)的10倍
    type: 'wall',
    desc: '不攻击，身负超高血量(2000 HP)，扛着黑铁锅替整个项目组挡灾。',
    createModel: () => window.voxelBuilder.createBackScaper()
  },
  FISH_TANK: {
    id: 'FISH_TANK',
    name: '摸鱼鱼缸',
    cost: 175,
    cooldown: 5.0,
    hp: 250,
    damage: 20,
    attackInterval: 1.5,
    slowDuration: 5.0,
    slowFactor: 0.5,
    bulletSpeed: 6.5,
    bulletType: 'water',
    type: 'shooter',
    desc: '每1.5秒泼出水花造成20伤害并减速50%持续5秒。文档泡水寸步难行。',
    createModel: () => window.voxelBuilder.createFishTank()
  },
  RESIGN_LETTER: {
    id: 'RESIGN_LETTER',
    name: '辞职信',
    cost: 150,
    cooldown: 30.0,
    hp: 100,
    type: 'bomb',
    desc: '放置1秒后引爆清空全场敌人！但有15%概率被老板当场批准导致直接失败！',
    createModel: () => window.voxelBuilder.createResignationLetter()
  },
  FAKE_BUSY: {
    id: 'FAKE_BUSY',
    name: '假装在忙',
    cost: 25,
    cooldown: 20.0,
    hp: 150,
    armTime: 15.0,
    type: 'mine',
    desc: '布置15秒进入假装加班状态；之后敌人踩中即同归于尽，秒杀该敌人。',
    createModel: (isReady) => window.voxelBuilder.createFakeBusy(isReady)
  },

  // === 自创单位 1 ===
  PAID_POOP: {
    id: 'PAID_POOP',
    name: '带薪拉屎',
    cost: 75,
    cooldown: 8.0,
    hp: 600,
    produceInterval: 6.0,
    produceAmount: 15,
    type: 'poop',
    desc: '【自创】坚固的黄金马桶阻挡敌人，同时每6秒在身心放松中产出15咖啡因。',
    createModel: () => window.voxelBuilder.createPaidPoop()
  },

  // === 自创单位 2 ===
  PIE_MACHINE: {
    id: 'PIE_MACHINE',
    name: '画大饼机',
    cost: 125,
    cooldown: 12.0,
    hp: 220,
    damage: 15,
    attackInterval: 2.2,
    bulletSpeed: 5.5,
    bulletType: 'pie',
    knockback: 0.4,
    type: 'shooter',
    desc: '【自创】向本行发射金黄大饼，命中造成15伤害并将其击退0.4格。',
    createModel: () => window.voxelBuilder.createPieMachine()
  }
};

// 敌方单位数值总表
const ENEMY_TYPES = {
  NORMAL_DOC: {
    id: 'NORMAL_DOC',
    name: '普通需求',
    hp: 100,
    speed: 0.38, // 格/秒
    biteDps: 25,
    score: 10,
    desc: '基准需求文档，步伐坚定地向工位推进。',
    createModel: () => window.voxelBuilder.createNormalDoc()
  },
  URGENT_DOC: {
    id: 'URGENT_DOC',
    name: '加急需求',
    hp: 200,     // 约2倍基准血量
    speed: 0.44, // 略微快一点
    biteDps: 35,
    score: 25,
    desc: '头顶冒火的加急需求！血量翻倍，压迫感十足。',
    createModel: () => window.voxelBuilder.createUrgentDoc()
  },
  BOSS: {
    id: 'BOSS',
    name: '老板',
    hp: 400,     // 4倍普通需求血量
    speed: 0.22, // 全场最慢移速
    biteDps: 50,
    score: 100,
    desc: '亲自下场的终极Boss！到达工位直接判负（年假无效），场上同时仅限1个。',
    createModel: () => window.voxelBuilder.createBoss()
  },
  TEMP_MEETING: {
    id: 'TEMP_MEETING',
    name: '临时会议',
    hp: 110,     // 约普通需求血量
    speed: 0.42,
    biteDps: 25,
    score: 20,
    canJump: true,
    desc: '日历翻页邀请；遇到第一个我方单位时飞跃跳过，继续前进！',
    createModel: () => window.voxelBuilder.createTempMeeting()
  },
  ROUTINE_MEETING: {
    id: 'ROUTINE_MEETING',
    name: '例会',
    hp: 210,     // 约加急需求血量
    speed: 0.28,
    biteDps: 30,
    score: 40,
    spawnInterval: 10.0, // 每10秒产出1个普通需求
    desc: '行走的会议室！第6波起出现，行进中每10秒在前方本行生成新普通需求。',
    createModel: () => window.voxelBuilder.createRoutineMeeting()
  }
};

// 12 波次梯度配置
// 整体曲线：前期(1~3波)低速少量、单兵熟悉；中期(4~6波)引入临时会议与例会，第6波首次大波；
// 后期(7~11波)混合编队、考验前排与控制；第12波终极工作潮+老板亲自压轴。
const WAVE_CONFIGS = [
  // 第 1 波：热身，3个普通需求，间隔充裕
  { wave: 1, enemies: [ { type: 'NORMAL_DOC', count: 3, delay: 5.0 } ], isHuge: false },
  // 第 2 波：5个普通需求
  { wave: 2, enemies: [ { type: 'NORMAL_DOC', count: 5, delay: 4.0 } ], isHuge: false },
  // 第 3 波：首次出现加急需求
  { wave: 3, enemies: [ { type: 'NORMAL_DOC', count: 4, delay: 3.5 }, { type: 'URGENT_DOC', count: 2, delay: 4.5 } ], isHuge: false },
  // 第 4 波：首次出现跳跃的临时会议
  { wave: 4, enemies: [ { type: 'NORMAL_DOC', count: 5, delay: 3.2 }, { type: 'TEMP_MEETING', count: 2, delay: 4.0 } ], isHuge: false },
  // 第 5 波：加急需求 + 临时会议混合进攻
  { wave: 5, enemies: [ { type: 'NORMAL_DOC', count: 6, delay: 3.0 }, { type: 'URGENT_DOC', count: 3, delay: 3.5 }, { type: 'TEMP_MEETING', count: 2, delay: 4.0 } ], isHuge: false },
  // 第 6 波：【一大波工作来袭！】首次出现会生怪的例会 + 密度大增
  { wave: 6, enemies: [ { type: 'NORMAL_DOC', count: 8, delay: 2.2 }, { type: 'URGENT_DOC', count: 4, delay: 2.6 }, { type: 'ROUTINE_MEETING', count: 2, delay: 4.0 } ], isHuge: true },
  // 第 7 波：例会 + 临时会议组合骚扰
  { wave: 7, enemies: [ { type: 'NORMAL_DOC', count: 8, delay: 2.5 }, { type: 'TEMP_MEETING', count: 4, delay: 3.0 }, { type: 'ROUTINE_MEETING', count: 2, delay: 4.0 } ], isHuge: false },
  // 第 8 波：加急需求集群冲锋
  { wave: 8, enemies: [ { type: 'URGENT_DOC', count: 6, delay: 2.5 }, { type: 'TEMP_MEETING', count: 3, delay: 3.0 }, { type: 'ROUTINE_MEETING', count: 2, delay: 3.8 } ], isHuge: false },
  // 第 9 波：老板首次视察（全场限1只老板，血量厚，移速慢）
  { wave: 9, enemies: [ { type: 'NORMAL_DOC', count: 8, delay: 2.2 }, { type: 'URGENT_DOC', count: 4, delay: 2.6 }, { type: 'BOSS', count: 1, delay: 5.0 } ], isHuge: false },
  // 第 10 波：高密度多路混编
  { wave: 10, enemies: [ { type: 'NORMAL_DOC', count: 9, delay: 2.0 }, { type: 'URGENT_DOC', count: 5, delay: 2.4 }, { type: 'TEMP_MEETING', count: 4, delay: 2.6 }, { type: 'ROUTINE_MEETING', count: 3, delay: 3.5 } ], isHuge: false },
  // 第 11 波：黎明前的暴风雨
  { wave: 11, enemies: [ { type: 'URGENT_DOC', count: 7, delay: 1.8 }, { type: 'TEMP_MEETING', count: 5, delay: 2.2 }, { type: 'ROUTINE_MEETING', count: 3, delay: 3.0 } ], isHuge: false },
  // 第 12 波：【终极波次！老板亲自带队清算！】全军出击
  { wave: 12, enemies: [ { type: 'NORMAL_DOC', count: 12, delay: 1.5 }, { type: 'URGENT_DOC', count: 8, delay: 1.8 }, { type: 'TEMP_MEETING', count: 5, delay: 2.0 }, { type: 'ROUTINE_MEETING', count: 4, delay: 2.5 }, { type: 'BOSS', count: 1, delay: 4.0 } ], isHuge: true }
];

// 打工人结算评价语库
const WORKER_COMMENTS_VICTORY = [
  "“守得漂亮！今晚不用通宵，准点打卡下班喝奶茶去！”",
  "“年终奖保住了！老板看了都得默默在绩效单上打个 A+！”",
  "“这就是金牌组长的统筹能力，把需求全挡在办公室门外！”",
  "“太稳了！需求千千万，唯我摸鱼心坚若磐石！”",
  "“完美防御！全组5个工位完好无损，甚至没人用掉全部年假！”"
];

const WORKER_COMMENTS_DEFEAT = [
  "“工位堆爆了……HR 已经把辞退离职交接单递到你脸上了。”",
  "“老板亲自杀到工位前，问你昨天的进度为什么还是 0%！”",
  "“请假也挡不住连环例会，年假审批单被老板原样退回！”",
  "“辞职信还是被老板含泪批准了，明天记得把工牌交还前台。”",
  "“锅被砸烂了，需求淹没了键盘，收拾东西准备去下一家公司吧。”"
];
