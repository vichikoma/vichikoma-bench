/* ============================================================
 *  data.js —— 全部数值总表 / 波次编排 / 图鉴文案 / 评价语
 *  （游戏本体见 game.js，数值与本表严格一致）
 * ============================================================ */
'use strict';

var CELL = 1.2;          // 格子边长
var ROW_GAP = 1.3;       // 行距（略大于格子，让画面透气）
var COLS = 9;
var ROWS = 5;

/* 坐标换算：列 0..8（从左到右），行 0..4（0 = 靠近相机的近端） */
function gx(col) { return (col - (COLS - 1) / 2) * CELL; }
function gz(row) { return (row - (ROWS - 1) / 2) * ROW_GAP; }
function colOf(x) { return Math.round(x / CELL + (COLS - 1) / 2); }
function rowOf(z) { return Math.round(z / ROW_GAP + (ROWS - 1) / 2); }

/* 战场左右边界（世界坐标） */
var FIELD_LEFT = gx(0);          // -4.8
var SPAWN_X = 6.05;              // 老板办公室门口
var DESK_X = -6.15;              // 长桌中心
var DESK_HIT_X = -5.15;          // 敌人到达工位的判定线

/* ---------------- 经济 ---------------- */
var ECON = {
  startCaffeine: 250,
  dropInterval: 5,     /* 秒 / 掉 1 杯 */
  dropAmount: 25,
  slotCount: 4         // 每个工位 4 个槽位
};

/* ---------------- 我方单位 ---------------- */
/* hp=血量；cd=卡片冷却(s)；rate=攻击/产出间隔(s)；dmg=单发伤害 */
var UNITS = [
  {
    key: 'coffee', name: '咖啡机', cost: 50, cd: 5, hp: 400,
    rate: 7, produce: 25,
    desc: '每 7 秒自动产出 25 咖啡因。血薄，但经济是一切的开始。',
    tip: '经济流核心，越早铺开收益越高'
  },
  {
    key: 'ddl', name: 'DDL 加农炮', cost: 100, cd: 5, hp: 400,
    rate: 1.5, dmg: 20,
    desc: '每 1.5 秒轰出一发"交付物"，伤害 20。只打本行最左边的敌人。',
    tip: 'DDL 是第一生产力：死线越近，火力越猛'
  },
  {
    key: 'scapegoat', name: '背锅侠', cost: 50, cd: 10, hp: 4000,
    desc: '不攻击，血量 4000（约为加农炮的 10 倍）。花 50 咖啡因请来的挡枪实习同事。',
    tip: '纯肉盾，放在最左边替同事挡刀'
  },
  {
    key: 'tank', name: '摸鱼鱼缸', cost: 175, cd: 5, hp: 400,
    rate: 1.5, dmg: 18, slow: 0.5, slowTime: 5,
    desc: '每 1.5 秒泼出一朵水花，伤害 18 并让敌人移速减半 5 秒。纸泡了水，走不动了。',
    tip: '输出略低于加农炮，但减速价值极高'
  },
  {
    key: 'resign', name: '辞职信', cost: 150, cd: 30, hp: 999,
    fuse: 1, risk: 0.20,
    desc: '放置 1 秒后引爆，清空全场所有敌人，自身消失。但有 20% 概率被老板当场同意——直接game over。',
    tip: '真赌博：救场用，也可能直接被优化'
  },
  {
    key: 'busy', name: '假装在忙', cost: 25, cd: 20, hp: 900,
    arm: 15,
    desc: '低价陷阱。放置后需要 15 秒"进入状态"，状态就绪后敌人踩上去即秒杀同归于尽。装置本身很皮实（900 血），能撑到武装完成。',
    tip: '武装 15 秒，布置要提前'
  },
  /* —— 自创 2 个 —— */
  {
    key: 'read', name: '已读不回塔', cost: 125, cd: 12, hp: 400,
    rate: 14, stunTime: 3.5, charges: 6, custom: true,
    desc: '【自创】手机支架塔。每 14 秒让本行所有工作"已读不回"——原地卡壳 3.5 秒。共 6 次。',
    tip: '纯控制，无伤害；放最前面替全行挡节奏'
  },
  {
    key: 'align', name: '对齐会投影仪', cost: 150, cd: 15, hp: 400,
    rate: 8, dmg: 18, slow: 0.6, slowTime: 3, custom: true,
    desc: '【自创】把全组拉进对齐会。每 8 秒对"本行全体"照射一次，造成 18 伤害并减速 40% 共 3 秒。',
    tip: '唯一行 AoE 单位，人多的行收益极高'
  }
];

/* ---------------- 敌方：工作 ---------------- */
/* spd 单位：格/秒 */
var ENEMIES = [
  { key: 'doc', name: '普通需求', hp: 200, spd: 0.42, desc: '一沓需求文档。基准血量与移速，走到你工位就往收件筐里塞。' },
  { key: 'urgent', name: '加急需求', hp: 400, spd: 0.50, desc: '血量约为普通需求的 2 倍，还冒着火。它比普通需求跑得更快。' },
  { key: 'boss', name: '老板', hp: 800, spd: 0.22, desc: '全场唯一的人形敌人，血量约为普通需求的 4 倍、移速全场最慢。走到任一工位即 game over，年假也拦不住。全场同时最多 1 个。' },
  { key: 'meeting', name: '临时会议', hp: 200, spd: 0.42, desc: '血量与普通需求相当，但被逼急了会"跳过"遇到的第一个我方单位（每个只跳一次），落地后继续前进。' },
  { key: 'regular', name: '例会', hp: 400, spd: 0.42, spawnEvery: 10, fromWave: 6, desc: '血量≈加急需求。第 6 波起出现；行进中每 10 秒在本行随机空格生成 1 个普通需求——每场例会都会产出一堆新需求。' }
];

var BITE_DPS = 25;            // 敌人啃咬伤害/秒
var SPAWN_MIN_INTERVAL = 1.0;

/* ---------------- 波次表（12 波）----------------
 * g: 组内出怪间隔(s)；off: 该组相对本波开始的延迟(s)
 * 第 6、12 波为"一大波工作来袭"
 */
var WAVES = [
  { big: false, groups: [{ t: 'doc', n: 3, g: 4.0, off: 0 }] },
  { big: false, groups: [{ t: 'doc', n: 4, g: 3.5, off: 0 }, { t: 'urgent', n: 1, g: 1, off: 12 }] },
  { big: false, groups: [{ t: 'doc', n: 5, g: 3.2, off: 0 }, { t: 'urgent', n: 2, g: 3.2, off: 12 }, { t: 'meeting', n: 1, g: 1, off: 18 }] },
  { big: false, groups: [{ t: 'doc', n: 6, g: 3.0, off: 0 }, { t: 'urgent', n: 2, g: 3.0, off: 10 }, { t: 'meeting', n: 1, g: 1, off: 16 }] },
  { big: false, groups: [{ t: 'doc', n: 7, g: 2.8, off: 0 }, { t: 'urgent', n: 3, g: 3.0, off: 10 }, { t: 'meeting', n: 2, g: 5, off: 14 }] },
  { big: true, groups: [{ t: 'doc', n: 5, g: 2.4, off: 0 }, { t: 'urgent', n: 2, g: 2.4, off: 5 }, { t: 'meeting', n: 1, g: 4, off: 11 }] },
  { big: false, groups: [{ t: 'doc', n: 6, g: 2.2, off: 0 }, { t: 'urgent', n: 2, g: 2.2, off: 5 }, { t: 'meeting', n: 1, g: 4, off: 10 }, { t: 'regular', n: 2, g: 8, off: 15 }] },
  { big: false, groups: [{ t: 'doc', n: 8, g: 1.9, off: 0 }, { t: 'urgent', n: 4, g: 2.1, off: 4 }, { t: 'meeting', n: 2, g: 4, off: 9 }, { t: 'regular', n: 2, g: 8, off: 13 }, { t: 'boss', n: 1, g: 1, off: 26 }] },
  { big: false, groups: [{ t: 'doc', n: 8, g: 1.8, off: 0 }, { t: 'urgent', n: 5, g: 1.9, off: 4 }, { t: 'meeting', n: 2, g: 4, off: 9 }, { t: 'regular', n: 2, g: 8, off: 14 }] },
  { big: false, groups: [{ t: 'doc', n: 9, g: 1.7, off: 0 }, { t: 'urgent', n: 6, g: 1.9, off: 4 }, { t: 'meeting', n: 3, g: 3.5, off: 8 }, { t: 'regular', n: 3, g: 7, off: 14 }, { t: 'boss', n: 1, g: 1, off: 28 }] },
  { big: false, groups: [{ t: 'doc', n: 10, g: 1.5, off: 0 }, { t: 'urgent', n: 7, g: 1.7, off: 3 }, { t: 'meeting', n: 3, g: 3.5, off: 6 }, { t: 'regular', n: 3, g: 6, off: 10 }, { t: 'boss', n: 1, g: 1, off: 22 }] },
  { big: true, groups: [{ t: 'doc', n: 10, g: 1.4, off: 0 }, { t: 'urgent', n: 6, g: 1.6, off: 3 }, { t: 'meeting', n: 4, g: 3, off: 7 }, { t: 'regular', n: 4, g: 5, off: 10 }, { t: 'boss', n: 1, g: 1, off: 18 }] }
];

var TOTAL_WAVES = WAVES.length;

/* ---------------- 打工人评价语 ---------------- */
var QUOTES_GOOD = [
  '老板：这小子，有点东西啊。',
  'HR：你的 KPI 我看了一下，居然是绿的。',
  '茶水间阿姨：这位打工人，茶水管够。',
  '老板：为什么我们组最近加班变少了？……算了别问了。',
  '同事：你这是把需求当豆腐切啊，一刀一个准。',
  '系统提示：你的工位今天零投诉，可喜可贺。'
];
var QUOTES_MID = [
  '同事：守是守住了，就是脸有点绿。',
  'HR：你的年度评价是"还行，能用"。',
  '老板：过程不重要，结果……好吧结果还行。',
  'IT：你的键盘上还留着上次加班的泡面味。',
  '同事：你这打法，跟产品经理说的"敏捷迭代"一模一样——看不懂但好像有点用。'
];
var QUOTES_BAD = [
  'HR：恭喜你成为本季度唯一被优化的人。',
  '老板：你这防御力，跟你的工位一样，一推就倒。',
  '系统提示：您的 5 个工位已全部堆满，会议室预约自动延长至明天。',
  '同事：你不是被优化了，你是被"优化"了——动词。',
  '老板路过看了一眼，什么也没说，这比骂你更可怕。',
  'HR：你的工位已被回收，私人物品请于 15 分钟内清空。'
];