/**
 * timing.ts —— 时间轴。以 120 BPM 的音乐为基准：每拍 0.500s、每小节 4 拍 = 2.000s，
 * 全片 30.000s = 15 小节。每一处切镜都落在「小节第一拍」上，与 out/beats.json 完全对应。
 */
export const BPM = 120;
export const BEAT = 60 / BPM; // 0.5s
export const BAR = BEAT * 4; // 2.0s
export const FPS = 30;
export const DURATION = 30; // 秒
export const TOTAL_FRAMES = DURATION * FPS; // 900

export const f = (seconds: number) => Math.round(seconds * FPS);

/** 每一处切镜的时间点（秒），全部是小节第一拍 */
export const SCENES = [
  { id: "A", from: 0.0, to: 6.0 },
  { id: "B", from: 6.0, to: 14.0 },
  { id: "C", from: 14.0, to: 22.0 },
  { id: "D", from: 22.0, to: 30.0 },
] as const;
