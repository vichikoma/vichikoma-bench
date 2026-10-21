// 品牌规范 —— 全部颜色来自 brand.md，不得使用其它颜色
export const C = {
  bg: "#0B1026", // 藏蓝黑（底）
  orange: "#FF7A1A", // 燃橙（主）
  blue: "#2E9BFF", // 冰蓝（辅）
  yellow: "#FFD23D", // 明黄（点缀/高光）
  white: "#F4F6FF", // 雾白
  gray: "#B9C0DE", // 雾灰（次要信息，仅深底）
  cardDark: "#141A38", // 深色卡片（bg 提亮一档，同色系透明度玩法）
} as const;

export const FONT =
  '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Noto Sans SC", sans-serif';

// ---------- 时间轴（与 out/beats.json 同源：128BPM，1 拍 = 14.0625 帧） ----------
export const FPS = 30;
export const BPM = 128;
export const FRAME_PER_BEAT = (60 / BPM) * FPS; // 14.0625
export const FRAME_PER_BAR = FRAME_PER_BEAT * 4; // 56.25
export const BEATS = 64;

// 每场 2 小节，8 场共 16 小节；切点 = 小节第一拍（四舍五入，误差 ≤0.5 帧）
export const SCENE_STARTS = [0, 113, 225, 338, 450, 563, 675, 788, 900];

/** 第 i 拍（0 基）所在的帧 */
export const beatFrame = (i: number): number => Math.round(i * FRAME_PER_BEAT);
/** 第 b 小节（1 基）第一拍所在帧 */
export const barFrame = (b: number): number =>
  Math.round((b - 1) * FRAME_PER_BAR);

/** 当前帧之前最近一拍（0 基拍号） */
export const lastBeat = (frame: number): number => {
  let i = Math.floor(frame / FRAME_PER_BEAT);
  if (i > BEATS - 1) i = BEATS - 1;
  return i;
};

/** 节拍脉冲：1 → 0 指数衰减（打在拍点上） */
export const beatPulse = (frame: number): number => {
  const dt = frame - beatFrame(lastBeat(frame));
  return Math.exp(-dt / 3.2);
};

/** 当前帧距离最近的小节首拍脉冲（更强） */
export const barPulse = (frame: number): number => {
  const i = lastBeat(frame);
  const dt = frame - beatFrame(i);
  return i % 4 === 0 ? Math.exp(-dt / 4.5) : 0;
};

// 确定性伪随机（渲染稳定）
export const rand = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
