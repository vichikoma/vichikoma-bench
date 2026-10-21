// ─── 2026Q3 经营数据（由 data/sales_2025-01_2026-09.csv 去重后计算）───
// 清洗：原文件 1060 行，其中 2026-07 华北 10 个「品类×渠道」组合被重复导出，
// 整行重复 → 按 (月份,大区,品类,渠道) 去重后 1050 行（21 个月 × 5 大区 × 5 品类 × 2 渠道）。
// 金额显示单位：万元（brief.md），保留 1 位小数；百分比 1 位小数。

export const D = {
  // 总盘（2026-07..09 全部行求和）
  rev: 6467.7, // 万元
  gm: 3504.2, // 毛利额 万元
  yoy: 28.5, // 销售额同比 %（vs 2025-07..09）
  qoq: 22.7, // 销售额环比 %（vs 2026-04..06）
  deltaYoy: 1434.0, // 同比增收 万元
  isBestQuarter: true, // 7 个有数季度中销售额最高

  // 月度（Q3 内）
  months: [
    {label: '7月', rev: 2221.4},
    {label: '8月', rev: 2247.8}, // 21 个月里单月最高
    {label: '9月', rev: 1998.5},
  ],

  // 渠道
  takeoutShare: 52.1, // 外卖销售额占比 %（季度口径首次过半）
  storeShare: 47.9,
  takeoutYoy: 54.0,
  storeYoy: 8.9,

  // 品类同比 %（2026Q3 vs 2025Q3 销售额）
  cats: [
    {name: '轻食', yoy: 195.6, color: 'orange', note: '杀疯了'},
    {name: '茶饮', yoy: 42.9, color: 'yellow'},
    {name: '创意特调', yoy: 26.6, color: 'yellow'},
    {name: '经典咖啡', yoy: 2.0, color: 'blue', note: '主力失速'},
    {name: '周边', yoy: -5.5, color: 'gray', note: '负增长'},
  ],

  // 利润
  margin: 54.2, // Q3 毛利率 %（Σ毛利/Σ销售额）
  marginYoy: 56.8, // 2025Q3 毛利率 %
  marginDrop: 2.6, // 同比下降 pp
  marginCurve: [56.0, 56.0, 55.8, 54.3, 54.2, 53.9], // 2026-04..09 月毛利率 %
  takeoutMargin: 48.4,
  storeMargin: 60.5,

  // 大区
  swYoy: 113.6, // 西南销售额同比 %
  regions: [
    {name: '华东', rev: 2070.4},
    {name: '华南', rev: 1475.5},
    {name: '华北', rev: 1270.8},
    {name: '华中', rev: 880.3},
    {name: '西南', rev: 770.6},
  ],
} as const;
