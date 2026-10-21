/**
 * 自动生成，请勿手改。来源：data/sales_2025-01_2026-09.csv（原始明细，未经清洗）
 * 生成脚本：video-task/build_facts.py（口径与 out/facts.json 完全一致）
 * 期间：2026-07 ~ 2026-09（Q3），对比基期 2026-04 ~ 2026-06（Q2）与 2025-07 ~ 2025-09（去年同期）
 * 金额单位：万元（源数据为元，除以 10000 后四舍五入到 0.1）
 */

/** Q3 汇总（7+8+9 三个月全部明细行求和） */
export const Q3 = {
  /** 销售额 69024831 元 */
  salesWan: 6902.5,
  /** 毛利 37408123 元 */
  grossWan: 3740.8,
  /** 订单数 2816489 */
  orders: 2816489,
  /** 毛利率 */
  margin: 54.2,
  /** 客单价（元） */
  aov: 24.5,
};

/** Q2 汇总（对比基期） */
export const Q2 = {
  salesWan: 5272.2,
  grossWan: 2948.0,
  orders: 2165811,
  margin: 55.9,
  aov: 24.3,
};

/** 去年同期 Q3 汇总 */
export const Y3_SALES_WAN = 5033.7;
export const Y3_GROSS_WAN = 2858.3;

/** 同比 / 环比 */
export const YOY = {sales: 37.1, gross: 30.9};
export const QOQ = {sales: 30.9, gross: 26.9, orders: 30.0};

/** 毛利率环比变化（百分点） */
export const MARGIN_DELTA_PP = -1.7;

/** Q3 相对 Q2 的销售额增量总额（万元） */
export const DELTA_TOTAL_WAN = 1630.2;

/** 2026-04 ~ 2026-09 月度销售额（万元），用于折线/柱状轨迹 */
export const MONTHLY = [{"m": "04月", "s": 1564.0, "q3": false}, {"m": "05月", "s": 1727.9, "q3": false}, {"m": "06月", "s": 1980.4, "q3": false}, {"m": "07月", "s": 2656.2, "q3": true}, {"m": "08月", "s": 2247.8, "q3": true}, {"m": "09月", "s": 1998.5, "q3": true}];

/** 各大区 Q3 表现，按增速降序 */
export const REGIONS = [{"name": "华北", "q3": 1705.7, "growth": 61.3, "delta": 648.0, "contrib": 39.8}, {"name": "西南", "q3": 770.6, "growth": 32.2, "delta": 187.7, "contrib": 11.5}, {"name": "华南", "q3": 1475.5, "growth": 22.3, "delta": 269.5, "contrib": 16.5}, {"name": "华东", "q3": 2070.4, "growth": 21.9, "delta": 372.1, "contrib": 22.8}, {"name": "华中", "q3": 880.3, "growth": 21.0, "delta": 152.9, "contrib": 9.4}];

/** 渠道 Q3 表现 */
export const CHANNELS = [{"name": "门店", "q3": 3317.2, "q2": 2636.9, "growth": 25.8, "delta": 680.2, "contrib": 41.7, "share": 48.1}, {"name": "外卖", "q3": 3585.3, "q2": 2635.3, "growth": 36.1, "delta": 950.0, "contrib": 58.3, "share": 51.9}];

/** 外卖销售额占比：4 月 → 9 月（毛利率被稀释的结构性原因） */
export const WAIMAI_SHARE_APR = 49.3;
export const WAIMAI_SHARE_SEP = 53.0;

/** 峰值月与谷值月（2026 年内） */
export const JUL_WAN = 2656.2;
export const SEP_WAN = 1998.5;
export const JUN_WAN = 1980.4;
export const JUL_TO_SEP = -24.8;
