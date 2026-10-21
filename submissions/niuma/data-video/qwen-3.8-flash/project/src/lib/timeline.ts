// ─── 全局时间轴：30fps；BGM 120BPM → 1 拍 = 0.5s = 15 帧 ───
export const FPS = 30;
export const BEAT = 15;
export const TOTAL_FRAMES = 900; // 30.0s，与 bgm.wav 完全同长同止

// 场景表（mount 全部为拍点：/15 = 0,8,16,24,33,41,48 拍；S7 内 780 换屏 = 拍 52）
export const SCENES = [
  {id: 'S1', mount: 0, dur: 120},
  {id: 'S2', mount: 120, dur: 120},
  {id: 'S3', mount: 240, dur: 120},
  {id: 'S4', mount: 360, dur: 135},
  {id: 'S5', mount: 495, dur: 120},
  {id: 'S6', mount: 615, dur: 105},
  {id: 'S7', mount: 720, dur: 180},
]; // Σ = 900 ✓

// 换屏帧（硬切恰好落在拍上，0 帧误差）+ 扫块遮罩（切点前 4 帧开始，11 帧扫完）
export const CUTS = [120, 240, 360, 495, 615, 720, 780];
export const WIPE_PRE = 4;
export const WIPE_DUR = 11;

// S7 内部：720-780 总结贴纸，780-900 片尾
export const S7_SPLIT = 780;
