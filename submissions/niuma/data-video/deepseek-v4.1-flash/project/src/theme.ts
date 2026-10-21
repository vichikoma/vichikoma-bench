/**
 * 品牌视觉常量 —— 全部取自 brand.md，只用其中的颜色（可通过透明度调节）。
 */
export const C = {
  ink: "#0B1026", // 藏蓝黑
  orange: "#FF7A1A", // 燃橙
  blue: "#2E9BFF", // 冰蓝
  yellow: "#FFD23D", // 明黄
  mist: "#F4F6FF", // 雾白
  gray: "#B9C0DE", // 雾灰
} as const;

/** 只用系统自带中文无衬线字体，不引用任何外部字体文件。 */
export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif';

/** 安全边距：四边各留 ≥5%（1920×1080 → 96px / 54px），这里取更宽裕的值。 */
export const PAD_X = 120;
export const PAD_Y = 76;

export const W = 1920;
export const H = 1080;
export const FPS = 30;
