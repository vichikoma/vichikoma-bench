/* ============================================================
 * data.js —— 最终数值总表（平衡基准）
 * 所有数值为本局游戏实际采用的最终值（与图鉴/注释一致）
 * ============================================================ */
'use strict';

const CFG = {
  // 场地：5 行 × 9 列作战网格，格子边长 1
  GRID_ROWS: 5,
  GRID_COLS: 9,
  TILE: 1,
  DESK_X: -0.6,        // 敌人到达此 x 即视为抵达工位（钻入槽位/触发失败）
  SPAWN_X: 10.2,       // 老板办公室出怪口 x（右侧）
  // 咖啡因经济
  CAFFEINE_START: 100,
  DROP_INTERVAL: 8,    // 每 8 秒天降一杯咖啡
  DROP_AMOUNT: 25,
  // 波次框架：12 波，第 6/12 波为"一大波"
  TOTAL_WAVES: 12,
};

// ---------------- 我方单位（打工人武器库） ----------------
// dps 仅供图鉴展示；frozen/slow 等为机制参数
const UNITS = {
  coffee: {
    key: 'coffee', name: '咖啡机', cost: 50, cd: 6000, hp: 300,
    makeInterval: 10000, makeAmount: 25,
    desc: '每 10 秒产出 25 咖啡因，打工人的能量源泉；血薄，别让工作贴脸。',
  },
  cannon: {
    key: 'cannon', name: 'DDL 加农炮', cost: 100, cd: 6000, hp: 300,
    atkInterval: 1500, dmg: 20, bulletSpeed: 5.6,
    desc: '每 1.5 秒轰出一发"交付物"，伤害 20。死线是第一生产力。',
  },
  wall: {
    key: 'wall', name: '背锅侠', cost: 50, cd: 10000, hp: 3000,
    desc: '背锅实习同事，不攻击，血量 3000（加农炮的 10 倍），纯纯的肉盾。',
  },
  splash: {
    key: 'splash', name: '摸鱼鱼缸', cost: 175, cd: 6000, hp: 300,
    atkInterval: 1800, dmg: 20, slowPct: 0.5, slowTime: 5000, bulletSpeed: 5.0,
    desc: '每 1.8 秒泼一朵水花，伤害 20 并让敌人移速减半 5 秒。需求泡了水就走不动。',
  },
  bomb: {
    key: 'bomb', name: '辞职信', cost: 150, cd: 30000, hp: 400, fuse: 1000,
    risk: 0.15,
    desc: '放下 1 秒后引爆：清空全场敌人（含老板）；但有 15% 概率老板当场批准辞职——直接输。真赌局。',
  },
  mine: {
    key: 'mine', name: '假装在忙', cost: 25, cd: 20000, hp: 300, armTime: 15000,
    desc: '"假忙套装"布置现场需 15 秒；武装后敌人踩中即同归于尽（秒杀，包括老板）。',
  },
  chat: { // ★自创 1
    key: 'chat', name: '群聊@全体', cost: 125, cd: 12000, hp: 300,
    atkInterval: 2000, dmg: 15, chains: 5, reach: 3.6, chainRange: 3.0,
    desc: '★自创。每 2 秒在本行找最近敌人发出 @全体，消息在 3.0 格内连锁跳给至多 5 个目标（可跨行），每个 15 伤。一条@全体，谁都别想摸鱼。',
  },
  ac: { // ★自创 2
    key: 'ac', name: '空调遥控器', cost: 100, cd: 15000, hp: 300,
    atkInterval: 5500, freezeTime: 1300, rangeX: 2.2, rangeZ: 1.1,
    desc: '★自创。每 5.5 秒向四周 2 格喷一口冷风，范围±2 列±1 行内的敌人僵住 1.3 秒（不动不吃）。温度降一度，需求冻成狗。',
  },
};
const UNIT_ORDER = ['coffee', 'cannon', 'wall', 'splash', 'bomb', 'mine', 'chat', 'ac'];

// ---------------- 敌方（工作） ----------------
const ENEMIES = {
  normal: {
    key: 'normal', name: '普通需求', hp: 200, speed: 0.22, dps: 90,
    desc: '一沓平平无奇的需求文档。基准血量 200，移速 0.22 格/秒。',
  },
  rush: {
    key: 'rush', name: '加急需求', hp: 400, speed: 0.27, dps: 90,
    desc: '着火了的文档，血量 400（普通 2 倍），跑得也更快。',
  },
  boss: {
    key: 'boss', name: '老板', hp: 800, speed: 0.13, dps: 130, instantKill: true,
    desc: '全场唯一人形。血量 800、移速全场最慢、啃咬 130 DPS（压迫感）——但只要让他走到任一工位，游戏直接结束（年假也挡不住）。可用辞职信/假装在忙解决。',
  },
  jump: {
    key: 'jump', name: '临时会议', hp: 200, speed: 0.26, dps: 90,
    desc: '日历成精。遇到第一个我方单位会直接跳过去（每局仅一次），落地后继续前进。血量 200。',
  },
  spawn: {
    key: 'spawn', name: '例会', hp: 400, speed: 0.17, dps: 90, meets: 10000,
    desc: '行走的会议室，血量 400。第 6 波起出现；行进中每 10 秒在本行随机空格拉出一个新"普通需求"——开一次会产一堆活。',
  },
};
const ENEMY_ORDER = ['normal', 'rush', 'boss', 'jump', 'spawn'];

// ---------------- 工位与年假 ----------------
const STATION = {
  SLOTS: 4,             // 每工位 4 个槽位（工作堆积容量）
  LEAVES: 1,            // 每工位 1 次年假
  slotFillTime: 900,    // 缩小钻槽动画时长 ms
};

// ---------------- 波次编排 ----------------
// lead: 本波开始前准备时间; window: 出怪窗口（count 只按 gap 间隔出完）
// comp: 敌人配比（按顺序轮流出，随机行）; big: 一大波; bossAt: 老板在波内进度位置
const WAVES = [
  { lead: 18, gap: 8.0, comp: { normal: 3 } },
  { lead: 12, gap: 7.0, comp: { normal: 5 } },
  { lead: 12, gap: 6.5, comp: { normal: 6, rush: 2 } },
  { lead: 12, gap: 6.0, comp: { normal: 6, rush: 3, jump: 2 } },
  { lead: 11, gap: 5.5, comp: { normal: 6, rush: 4, jump: 2 }, boss: 0.7 },
  { lead: 14, gap: 2.2, big: true, comp: { normal: 8, rush: 4, jump: 3, spawn: 1 } },
  { lead: 12, gap: 4.5, comp: { normal: 5, rush: 4, jump: 3, spawn: 2 } },
  { lead: 12, gap: 4.5, comp: { normal: 6, rush: 5, jump: 3, spawn: 2 }, boss: 0.6 },
  { lead: 11, gap: 4.0, comp: { normal: 6, rush: 6, jump: 4, spawn: 2 } },
  { lead: 11, gap: 4.0, comp: { normal: 7, rush: 6, jump: 4, spawn: 3 }, boss: 0.55 },
  { lead: 10, gap: 3.5, comp: { normal: 8, rush: 7, jump: 5, spawn: 3 } },
  { lead: 16, gap: 1.6, big: true, comp: { normal: 10, rush: 8, jump: 5, spawn: 4 }, boss: 0.75 },
];

// ---------------- 打工人评价语（结算彩蛋） ----------------
const RANK_LINES_WIN = [
  '守得滴水不漏，老板连你工位在哪都没摸清。明年晋升名单第一行，就是你。',
  '12 波工作全灭。建议公司给你也来一罐咖啡因——你才是真正的人形DDL。',
  '需求见你绕道走，会议听你关门声。组长，请收下我们的膝盖。',
  '你守住的不是工位，是打工人的尊严。今晚不加班，批准了。',
  '完美防御。HR 想挖你去管安保，被你用来摸鱼了。',
];
const RANK_LINES_LOSE = [
  '老板站在你工位前，微笑着说：聊聊？——你被优化了。',
  '工作堆爆了工位，你抱着键盘流下打工人的泪。',
  '辞职信批了。走出大楼那一刻，阳光真好，房贷真多。',
  '下次记得：年假是最后的防线，不是第一张牌。',
  '你的咖啡因余额，和你的职场信用一起清零了。',
];

/* 难度曲线设计思路（详见 index.html 注释）：
 * 前 3 波只用普通/少量加急需求，间隔宽（8~6.5s），玩家 2~3 座炮台即可站稳，建立爽感；
 * 第 4 波临时会议、第 5 波老板登场迫使玩家分出咖啡因给肉盾/陷阱；
 * 第 6 波"一大波"+例会开始滚雪球（例会持续产出普通需求），考验阵型纵深与减速链；
 * 后半段咖啡因永远比欲望少 50，必须经济/输出/控制混编，年假要留到关键工位——
 * 无脑单一阵型在例会雪球+双加急压迫下必炸。 */
