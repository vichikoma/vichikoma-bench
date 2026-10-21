import {Easing} from 'remotion';

// ─── 品牌：牛马咖啡（brand.md）——只允许以下颜色（可调透明度）───
export const C = {
  ink: '#0B1026', // 藏蓝黑（底 / 描边 / 彩底上的字）
  orange: '#FF7A1A', // 燃橙
  blue: '#2E9BFF', // 冰蓝
  yellow: '#FFD23D', // 明黄
  white: '#F4F6FF', // 雾白
  gray: '#B9C0DE', // 雾灰（仅次要信息、仅藏蓝黑底）
} as const;

// 对比度均取自 brand.md 表：正文 ≥4.5 全部满足
// white/ink 17.4 · yellow/ink 13.0 · orange/ink 7.2 · blue/ink 6.5 · gray/ink 10.4
// ink/orange 7.2 · ink/yellow 13.0 · ink/blue 6.5

export const FONT_STACK =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';
export const font = (weight: number) => ({
  fontFamily: FONT_STACK,
  fontWeight: weight,
});

// 品牌色的透明变体（brand.md 允许“可调透明度”）
export const RGBA = {
  white: (a: number) => `rgba(244,246,255,${a})`,
  ink: (a: number) => `rgba(11,16,38,${a})`,
  orange: (a: number) => `rgba(255,122,26,${a})`,
  blue: (a: number) => `rgba(46,155,255,${a})`,
  yellow: (a: number) => `rgba(255,210,61,${a})`,
  gray: (a: number) => `rgba(185,192,222,${a})`,
  black: (a: number) => `rgba(0,0,0,${a})`,
};

// ─── 画布与安全区（5% 边距：1920×1080 → 左右 96 / 上下 54）───
export const W = 1920;
export const H = 1080;
export const SAFE = {x: 100, y: 70};

// ─── 动效缓动 ───
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1); // 缓出
export const easeIo = Easing.ease;

// 贴纸风：粗描边 + 大圆角 + 微旋转
export const sticker = (
  bg: string,
  opts: {border?: number; radius?: number; rotate?: number} = {},
) => ({
  background: bg,
  borderRadius: opts.radius ?? 26,
  border: `${opts.border ?? 5}px solid ${C.ink}`,
  transform: `rotate(${opts.rotate ?? 0}deg)`,
  boxShadow: '0 10px 0 rgba(0,0,0,0.28)',
});
