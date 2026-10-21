/**
 * data.ts —— 画面里用到的全部数字，全部由 data/sales_2025-01_2026-09.csv 聚合而来。
 *
 * 口径：原始导出 1060 行，其中 2026-07 华北 的 5 品类 × 2 渠道 = 10 行是整行完全重复的记录，
 *       去重后 1050 行 = 21 个月 × 5 大区 × 5 品类 × 2 渠道，无缺失、无异常值。
 * 金额单位：元 → 万元（÷10000，保留 1 位小数）。
 */

export const META = {
  brand: "牛马咖啡",
  periodLabel: "2026 Q3",
  periodFull: "2026-07 — 2026-09",
};

/** 大盘：2026 Q3 */
export const TOTAL = {
  sales: "6467.7", // 万元
  salesUnit: "万元",
  yoySales: "+28.5%",
  yoyProfit: "+22.6%",
  profitRate: "54.2%",
  profitRateDelta: "-2.6pp",
};

/** 品类同比增速（2026 Q3 vs 2025 Q3） */
export const CATEGORY = [
  { name: "轻食", yoy: "+195.6%", value: 195.6, share: "15.5%" },
  { name: "茶饮", yoy: "+42.9%", value: 42.9 },
  { name: "创意特调", yoy: "+26.6%", value: 26.6 },
  { name: "经典咖啡", yoy: "+2.0%", value: 2.0 },
  { name: "周边", yoy: "-5.5%", value: -5.5 },
];

/** 大区同比增速（2026 Q3 vs 2025 Q3） */
export const REGION = [
  { name: "西南", yoy: "+113.6%", value: 113.6 },
  { name: "华南", yoy: "+22.7%", value: 22.7 },
  { name: "华东", yoy: "+22.3%", value: 22.3 },
  { name: "华北", yoy: "+21.2%", value: 21.2 },
  { name: "华中", yoy: "+20.7%", value: 20.7 },
];

/** 渠道：2026 Q3 */
export const CHANNEL = {
  deliveryShare: "52.1%",
  storeShare: "47.9%",
  deliveryYoy: "+54.0%",
  storeYoy: "+8.9%",
};
