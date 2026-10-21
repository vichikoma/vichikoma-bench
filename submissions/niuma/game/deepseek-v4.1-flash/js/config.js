/* =============================================================================
 * config.js — 最终数值总表 & 波次编排（唯一的数据源，游戏与注释保持一致）
 * ===========================================================================*/
(function (global) {
  'use strict';

  var GRID = {
    COLS: 9, ROWS: 5,
    CELL: 1,
    colX: function (c) { return c - 4; },       // 列 0..8 -> x -4..4，col0 贴近大长桌
    rowZ: function (r) { return r - 2; },       // 行 0..4 -> z -2..2
    xCol: function (x) { return Math.round(x + 4); },
    zRow: function (z) { return Math.round(z + 2); },
    // 敌人越过这条线 = 到达本行工位（钻进槽位）
    DESK_X: -4.52,
    SPAWN_X: 5.9
  };

  // ------------------------------------------------------------------ 我方单位
  // kind: economy | shooter | tank | slow | nuke | mine | multishot | buffer
  var UNITS = {
    coffee: {
      key: 'coffee', model: 'u_coffee', name: '咖啡机', short: '经济',
      cost: 50, cd: 5, hp: 60, kind: 'economy',
      produce: { amount: 25, interval: 10 },
      desc: '每天 10 秒自动产出 25 咖啡因。血很薄，请放在后排。',
      tip: '打工人本命，经济命脉'
    },
    cannon: {
      key: 'cannon', model: 'u_cannon', name: 'DDL 加农炮', short: '直线输出',
      cost: 100, cd: 5, hp: 300, kind: 'shooter', hpRef: true,
      attack: { damage: 22, interval: 1.4, projSpeed: 9, proj: 'doc' },
      desc: '每 1.4 秒轰出一发 22 点伤害的「交付物」，只打本行最左边的敌人。',
      tip: '死线越近，火力越猛'
    },
    scapegoat: {
      key: 'scapegoat', model: 'u_scapegoat', name: '背锅侠', short: '肉盾',
      cost: 50, cd: 10, hp: 3000, kind: 'tank',
      desc: '不攻击。花 50 咖啡因请来的挡枪同事，血量是加农炮的 10 倍，替你扛住一线。',
      tip: '锅我来背，你只管往前'
    },
    fishtank: {
      key: 'fishtank', model: 'u_fishtank', name: '摸鱼鱼缸', short: '输出+减速',
      cost: 175, cd: 5, hp: 260, kind: 'shooter',
      attack: { damage: 20, interval: 1.5, projSpeed: 7, proj: 'water', slow: { mul: 0.5, time: 5 } },
      desc: '每 1.5 秒泼出一朵水花：20 点伤害，命中后敌人移速减半、持续 5 秒。',
      tip: '需求文档泡了水就走不动了'
    },
    resign: {
      key: 'resign', model: 'u_resign', name: '辞职信', short: '全场清场',
      cost: 150, cd: 30, hp: 9999, kind: 'nuke',
      nuke: { fuse: 1.0, risk: 0.18 },
      desc: '放下 1 秒后引爆，清空全场所有敌人并自毁；但有 18% 概率老板真的批准了 → 直接失败。',
      tip: '我辞职！——万一他同意了呢'
    },
    fakebusy: {
      key: 'fakebusy', model: 'u_fakebusy', name: '假装在忙', short: '低价秒杀',
      cost: 25, cd: 20, hp: 100, kind: 'mine',
      mine: { armTime: 15, damage: 1000 },
      desc: '布置后需要 15 秒「进入状态」；进入状态后，踩中的敌人被当场戳穿、同归于尽。',
      tip: '人不在，但看起来在加班'
    },
    // ---------------- 自创单位 1 ----------------
    massmail: {
      key: 'massmail', model: 'u_massmail', name: '全员邮件', short: '跨行打击',
      cost: 125, cd: 20, hp: 260, kind: 'multishot',
      attack: { damage: 30, interval: 7, projSpeed: 10, proj: 'mail', perRow: true },
      desc: '每 7 秒给「每一行的最左敌人」各投递一封邮件，每封 30 点伤害——雨露均沾。',
      tip: '这事得让所有人都知道',
      created: true
    },
    // ---------------- 自创单位 2 ----------------
    pie: {
      key: 'pie', model: 'u_pie', name: '老板画的饼', short: '攻速光环',
      cost: 150, cd: 25, hp: 200, kind: 'buffer',
      aura: { rate: 0.8, radius: 1 },   // 攻击间隔 ×0.8（攻速 +25%），3×3 范围
      desc: '不攻击。使周围 3×3 内的我方攻击单位攻速 +25%（不叠加）。饼是假的，鸡血是真的。',
      tip: '听我说，明年公司上市……',
      created: true
    }
  };

  var UNIT_ORDER = ['coffee', 'cannon', 'scapegoat', 'fishtank', 'resign', 'fakebusy', 'massmail', 'pie'];

  // ------------------------------------------------------------------ 敌方
  var ENEMIES = {
    normal: {
      key: 'normal', model: 'enemy_normal', name: '普通需求',
      hp: 220, speed: 0.40, dps: 25,
      desc: '基准血量与移速，一沓需求文档。'
    },
    urgent: {
      key: 'urgent', model: 'enemy_urgent', name: '加急需求',
      hp: 440, speed: 0.52, dps: 40,
      desc: '血量为普通需求 2 倍、跑得更快，头上还带着火。'
    },
    boss: {
      key: 'boss', model: 'enemy_boss', name: '老板',
      hp: 900, speed: 0.24, dps: 70, unique: true,
      desc: '血量约普通需求 4 倍、全场最慢；走到任意工位立即结束游戏（年假也拦不住）。全场同时只会有 1 个。'
    },
    meeting: {
      key: 'meeting', model: 'enemy_meeting', name: '临时会议',
      hp: 220, speed: 0.44, dps: 30, jump: true,
      desc: '遇到第一个我方单位会直接「跳过」它、落地继续前进（每个只跳一次）。'
    },
    standup: {
      key: 'standup', model: 'enemy_standup', name: '例会',
      hp: 440, speed: 0.36, dps: 35, spawner: { interval: 10, type: 'normal' },
      desc: '血量约等于加急需求；行进中每 10 秒在本行随机空格产出 1 个普通需求。'
    }
  };

  // ------------------------------------------------------------------ 经济
  var ECON = {
    start: 100,
    drop: { amount: 25, interval: 10 },     // 天上掉咖啡，落在随机格子，自动收集
    passiveHint: '每 10 秒会有一杯咖啡从天而降（+25）'
  };

  // ------------------------------------------------------------------ 波次
  // n = 出怪数量, itv = 出怪间隔(秒), comp = 按权重轮转的配比, boss = 该波是否出老板
  var WAVE_BREAK = 3.2;
  var WAVES = [
    { n: 5,  itv: 6.0, comp: { normal: 1 } },
    { n: 7,  itv: 5.0, comp: { normal: 1 } },
    { n: 8,  itv: 4.6, comp: { normal: 3, urgent: 1 } },
    { n: 10, itv: 4.2, comp: { normal: 2, urgent: 1 } },
    { n: 11, itv: 3.8, comp: { normal: 2, urgent: 1, meeting: 1 }, boss: true },
    { n: 17, itv: 2.6, comp: { normal: 3, urgent: 2, meeting: 1 }, big: true },
    { n: 12, itv: 3.4, comp: { normal: 3, urgent: 2, standup: 1 } },
    { n: 14, itv: 3.0, comp: { normal: 3, urgent: 2, standup: 1, meeting: 1 }, boss: true },
    { n: 16, itv: 2.8, comp: { normal: 3, urgent: 2, standup: 1 } },
    { n: 18, itv: 2.6, comp: { normal: 4, urgent: 3, standup: 2 } },
    { n: 20, itv: 2.4, comp: { normal: 4, urgent: 3, standup: 2 }, boss: true },
    { n: 27, itv: 1.7, comp: { normal: 4, urgent: 3, standup: 2, meeting: 1 }, boss: true, big: true }
  ];

  // ------------------------------------------------------------------ 其它
  var MISC = {
    SLOTS_PER_DESK: 4,
    TOTAL_WAVES: WAVES.length,
    // 模型在战场上的统一缩放：体素模型是按“真实比例”做的（约半格宽），
    // 直接放进 1×1 的格子里会显得太小、看不清；这里放大到占满格。
    UNIT_SCALE: 1.5,
    ENEMY_SCALE: 1.45,
    FEEDBACK: {
      // 胜利/失败后的打工人评价语池
      win: [
        '守得漂亮！这个季度的绩效，我给你 A。',
        '稳。你就是那种平时不说话、出事最靠得住的人。',
        '需求都被你干掉了，KPI 却算在老板头上——这就是打工。',
        '辛苦了。年假还剩几张？记得真的去休。'
      ],
      // 完美通关（一个槽位都没被占）才出现
      winPerfect: [
        '全场没让一个需求走到工位，你建议直接升组长。',
        '零堆积、零年假，五个工位干净得像刚入职那天。',
        '一个需求都没碰到工位——老板开始怀疑你这一整天到底在忙什么。'
      ],
      winHard: [
        '险胜。你今天的发际线，比昨天高了 0.5 毫米。',
        '赢了，但槽位是满的，工位是炸的，人还在。',
        '勉强通关。建议下次早点搞经济，别总想着硬扛。',
        '赢是赢了，就是工位上那堆活……回头还是你自己的。'
      ],
      loseSlot: [
        '工位堆爆了。这就是你嘴上说的「马上就好」。',
        '年假用完了才会知道，假条只能挡一次。',
        '你被优化了。不是因为能力，是因为活实在太多。',
        '需求堆到工位爆炸，HR 已经在写你的离职证明了。'
      ],
      loseBoss: [
        '老板亲自来了。看见他站在你工位旁边的那一刻，你就知道完了。',
        '老板走到工位了。没事，反正你也想走。',
        '他拿的是公文包，你拿的是工牌——胜负已分。'
      ],
      loseResign: [
        '你赌了一把辞职信，然后老板真的签了字。恭喜自由。',
        '「我辞职！」三个字出口，HR 笑得比你还开心。',
        '全场清空，代价是你也被清空了。'
      ]
    }
  };

  global.CFG = {
    GRID: GRID, UNITS: UNITS, UNIT_ORDER: UNIT_ORDER, ENEMIES: ENEMIES,
    ECON: ECON, WAVES: WAVES, WAVE_BREAK: WAVE_BREAK, MISC: MISC,
    UNIT_SCALE: MISC.UNIT_SCALE, ENEMY_SCALE: MISC.ENEMY_SCALE
  };
})(window);
