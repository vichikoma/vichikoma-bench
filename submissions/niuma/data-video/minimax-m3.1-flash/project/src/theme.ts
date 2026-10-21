/**
 * 全片共用的常量：品牌色、节奏网格、安全边距、动效曲线。
 * 所有数据口径见 src/data.ts（由 build_facts.py 从原始 CSV 汇总生成）。
 */

// ---- 品牌色（brand.md）--------------------------------------------
export const C = {
  orange: '#FF7A1A', // 燃橙（主色）
  blue: '#2E9BFF', // 冰蓝（辅色）
  yellow: '#FFD23D', // 明黄（点缀/高亮）
  ink: '#0B1026', // 藏蓝黑（底色）
  white: '#F4F6FF', // 雾白
  gray: '#B9C0DE', // 雾灰（仅次要信息，仅藏蓝黑底）
} as const;

// ---- 节奏网格（out/beats.json）------------------------------------
export const FPS = 30;
export const BEAT = 15; // 120 BPM → 0.5s = 15 帧
export const BAR = 60; // 2.0s = 60 帧
export const DURATION = 900; // 30.0s

/** 场景切换点，全部落在小节第一拍上 */
export const CUTS = {
  s1: 0, // 0.0s  片头
  s2: 60, // 2.0s  大盘
  s3: 150, // 5.0s  趋势
  s4: 240, // 8.0s  华北引擎
  s5: 330, // 11.0s 渠道
  s6: 420, // 14.0s 毛利率转折
  s7: 540, // 18.0s 高潮帧
  s8: 690, // 23.0s 结论
} as const;

// ---- 安全区：四边各留 5% → 1920*0.05=96, 1080*0.05=54 -------------
export const SAFE_X = 96;
export const SAFE_Y = 54;

// ---- 字体：系统自带中文无衬线，不引用外部字体文件 ------------------
export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", "Hiragino Sans GB", sans-serif';
export const FONT_BOLD = `700 ${FONT}`;
export const FONT_HEAVY = `900 ${FONT}`;

/** 品牌名标准写法所需的粗描边贴纸文字样式 */
export const sticker = (color: string, size: number, stroke = 6) => ({
  fontFamily: FONT,
  fontWeight: 900 as const,
  fontSize: size,
  color,
  letterSpacing: size * 0.02,
  WebkitTextStroke: `${stroke}px ${C.ink}`,
  paintOrder: 'stroke fill' as any,
  textShadow: `0 ${stroke * 1.5}px 0 ${C.ink}, 0 0 ${size * 0.35}px ${C.ink}55`,
});