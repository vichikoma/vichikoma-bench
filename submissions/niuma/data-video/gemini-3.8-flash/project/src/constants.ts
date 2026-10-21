export const BRAND = {
  primary: '#FF7A1A', // 燃橙
  secondary: '#2E9BFF', // 冰蓝
  accent: '#FFD23D', // 明黄
  bgDark: '#0B1026', // 藏蓝黑
  white: '#F4F6FF', // 雾白
  gray: '#B9C0DE', // 雾灰
};

export const DATA_STATS = {
  // Q3 2026 totals
  q3_rev_wan: 6902.48, // 6,902.48 万元
  q3_gp_wan: 3740.81, // 3,740.81 万元
  q3_orders_wan: 281.65, // 281.65 万单
  q3_margin_pct: 54.2, // 54.2%
  q3_atv: 24.5, // 24.5 元
  
  // Growth
  yoy_rev_pct: 37.1, // +37.1%
  yoy_gp_pct: 30.9, // +30.9%
  yoy_orders_pct: 33.2, // +33.2%
  qoq_rev_pct: 30.9, // +30.9%
  
  // Peak July
  jul_rev_wan: 2656.19, // 2,656.19 万元
  
  // Monthly 2026
  monthly_2026: [
    { month: '4月', rev: 1563.97, gp: 875.19 },
    { month: '5月', rev: 1727.90, gp: 968.23 },
    { month: '6月', rev: 1980.38, gp: 1104.56 },
    { month: '7月', rev: 2656.19, gp: 1443.81 },
    { month: '8月', rev: 2247.83, gp: 1218.92 },
    { month: '9月', rev: 1998.46, gp: 1078.08 },
  ],

  // Categories
  categories: [
    { name: '经典咖啡', rev: 2230.59, pct: 32.3, yoy: 9.2, color: '#FF7A1A' },
    { name: '创意特调', rev: 1965.01, pct: 28.5, yoy: 34.8, color: '#2E9BFF' },
    { name: '茶饮', rev: 1281.87, pct: 18.6, yoy: 52.4, color: '#FFD23D' },
    { name: '轻食', rev: 1069.53, pct: 15.5, yoy: 215.0, color: '#F4F6FF' },
    { name: '周边', rev: 355.48, pct: 5.2, yoy: 0.9, color: '#B9C0DE' },
  ],

  // Channels
  channels: [
    { name: '外卖', rev: 3585.32, pct: 51.9, yoy: 64.0, color: '#FF7A1A' },
    { name: '门店', rev: 3317.16, pct: 48.1, yoy: 16.5, color: '#2E9BFF' },
  ],

  // Regions
  regions: [
    { name: '华东', rev: 2070.43, pct: 30.0 },
    { name: '华北', rev: 1705.66, pct: 24.7 },
    { name: '华南', rev: 1475.46, pct: 21.4 },
    { name: '华中', rev: 880.29, pct: 12.8 },
    { name: '西南', rev: 770.65, pct: 11.2 },
  ],
};
