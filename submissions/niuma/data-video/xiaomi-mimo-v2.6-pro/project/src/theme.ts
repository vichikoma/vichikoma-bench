// 主题：颜色 / 字体 / 时间轴常量（帧 @30fps）
export const C = {
  navy: '#0B1026',   // 藏蓝黑（底）
  orange: '#FF7A1A', // 燃橙（主）
  blue: '#2E9BFF',   // 冰蓝（辅）
  yellow: '#FFD23D', // 明黄（高光）
  white: '#F4F6FF',  // 雾白
  gray: '#B9C0DE',   // 雾灰（仅次要信息）
};

export const FONT =
  "'Microsoft YaHei','PingFang SC','Noto Sans CJK SC','Noto Sans SC',sans-serif";

export const FPS = 30;
export const DURATION = 900; // 30.0s
export const BEAT = 15;      // 1 拍 = 0.5s（BPM 120）

// 分镜切点（全部落在 beats.json 的小节第一拍上）
export const T = {
  s1: [0, 120],     // 0–4s   开场封面
  s2: [120, 300],   // 4–10s  大盘
  s3: [300, 540],   // 10–18s 轻食高潮
  s4: [540, 720],   // 18–24s 渠道结构
  s5: [720, 840],   // 24–28s 毛利率
  s6: [840, 900],   // 28–30s 落版
} as const;

export const WIPE = 6; // 遮罩转场帧数（新场景在切点帧上完全显露）

// 确定性伪随机（渲染可复现）
export const rnd = (i: number, salt = 0) => {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
