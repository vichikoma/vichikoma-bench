import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BEAT, FPS } from "./timing";

/* ------------------------------------------------------------------ 节拍 */

export type BeatInfo = {
  /** 当前时间（秒） */
  t: number;
  /** 从 0 开始的拍号 */
  index: number;
  /** 该拍已过去的比例 0→1 */
  phase: number;
  /** 是否小节第一拍 */
  isDownbeat: boolean;
  /** 距最近一次下拍经过的秒数 */
  sinceDownbeat: number;
  /** 下拍脉冲：下拍瞬间为 1，0.34s 内衰减到 0 */
  down: number;
  /** 每一拍的脉冲：拍点瞬间为 1，0.22s 内衰减到 0 */
  local: number;
};

/** 让画面与音乐联动：读取当前帧落在第几拍上。 */
export const useBeat = (): BeatInfo => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const index = Math.floor(t / BEAT + 1e-6);
  const phase = (t / BEAT) % 1;
  const isDownbeat = index % 4 === 0;
  const sinceDownbeat = (index % 4) * BEAT + phase * BEAT;
  const down = Math.max(0, 1 - sinceDownbeat / 0.34);
  const local = Math.max(0, 1 - (phase * BEAT) / 0.22);
  return { t, index, phase, isDownbeat, sinceDownbeat, down, local };
};

/** 每一拍一次的脉冲值：下拍最亮，然后快速衰减。 */
export const beatPulse = (index: number, sinceDownbeat: number) => {
  const down = Math.max(0, 1 - sinceDownbeat / 0.34);
  const local = Math.max(0, 1 - (sinceDownbeat % BEAT) / 0.22);
  return { down, local };
};

/* ------------------------------------------------------------------ 缓动 */

export const easeOutExpo = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const easeOutBack = (p: number, s = 1.7) => {
  const c3 = s + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
};

/* ------------------------------------------------------------------ 组件 */

/** 贴纸风圆角块：粗描边 + 大圆角。 */
export const Pill: React.FC<{
  children: React.ReactNode;
  bg: string;
  color: string;
  border?: string;
  fontSize?: number;
  px?: number;
  py?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ children, bg, color, border = "#0B1026", fontSize = 44, px = 34, py = 14, rotate = 0, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      background: bg,
      color,
      border: `6px solid ${border}`,
      borderRadius: 26,
      padding: `${py}px ${px}px`,
      fontFamily: "inherit",
      fontWeight: 800,
      fontSize,
      lineHeight: 1.15,
      rotate: `${rotate}deg`,
      boxShadow: "10px 10px 0 rgba(11,16,38,0.55)",
      ...style,
    }}
  >
    {children}
  </div>
);

/** 闪电（品牌装饰图形，纯代码绘制）。 */
export const Bolt: React.FC<{ size?: number; color?: string; stroke?: string; style?: React.CSSProperties }> = ({
  size = 90,
  color = "#FFD23D",
  stroke = "#0B1026",
  style,
}) => (
  <svg width={size} height={size * 1.45} viewBox="0 0 40 58" style={style}>
    <path
      d="M24 2 L4 32 H16 L11 56 L36 22 H22 Z"
      fill={color}
      stroke={stroke}
      strokeWidth={5}
      strokeLinejoin="round"
    />
  </svg>
);

/** 爆炸贴（多角星），用于强调。 */
export const Star: React.FC<{ size?: number; color?: string; stroke?: string; points?: number; style?: React.CSSProperties }> = ({
  size = 240,
  color = "#FF7A1A",
  stroke = "#0B1026",
  points = 14,
  style,
}) => {
  const r1 = 50;
  const r2 = 38;
  const path: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2;
    const r = i % 2 === 0 ? r1 : r2;
    path.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
      <polygon points={path.join(" ")} fill={color} stroke={stroke} strokeWidth={3.4} strokeLinejoin="round" />
    </svg>
  );
};

/** 咖啡豆（品牌装饰图形，纯代码绘制）。 */
export const Bean: React.FC<{ size?: number; color?: string; stroke?: string; style?: React.CSSProperties }> = ({
  size = 60,
  color = "#FF7A1A",
  stroke = "#0B1026",
  style,
}) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={style}>
    <ellipse cx="20" cy="20" rx="17" ry="12.5" fill={color} stroke={stroke} strokeWidth={4} transform="rotate(-30 20 20)" />
    <path d="M10 30 C16 24 24 16 30 10" stroke={stroke} strokeWidth={4} fill="none" strokeLinecap="round" />
  </svg>
);

/** 斜切色块（品牌视觉元素）。 */
export const Slab: React.FC<{
  width: number;
  height: number;
  color: string;
  skew?: number;
  style?: React.CSSProperties;
}> = ({ width, height, color, skew = -12, style }) => (
  <div style={{ width, height, background: color, transform: `skewX(${skew}deg)`, borderRadius: 18, ...style }} />
);

/* ------------------------------------------------------------------ 转场 */

/**
 * 遮罩转场：每一场以自己的开头做斜切 wipe reveal，
 * 起始帧 = 该场的第一帧 = beats.json 上的一小节第一拍。
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  dir?: "left" | "right" | "up" | "down";
  frames?: number;
  slant?: number;
}> = ({ children, dir = "left", frames = 9, slant = 28 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const e = p * 100 + slant + 12;

  let clip = "none";
  if (dir === "left") clip = `polygon(0% 0%, ${e}% 0%, ${e - slant}% 100%, 0% 100%)`;
  if (dir === "right") clip = `polygon(${100 - e}% 0%, 100% 0%, 100% 100%, ${100 - e + slant}% 100%)`;
  if (dir === "up") clip = `polygon(0% 0%, 100% 0%, 100% ${e}%, 0% ${e - slant}%)`;
  if (dir === "down") clip = `polygon(0% ${100 - e}%, 100% ${100 - e + slant}%, 100% 100%, 0% 100%)`;

  return (
    <div style={{ position: "absolute", inset: 0, clipPath: clip === "none" || p >= 1 ? undefined : clip }}>
      {children}
    </div>
  );
};

/* ------------------------------------------------------------------ 底部节拍条 */

/** 画面底部的节拍刻度：与 beats.json 一一对应，每一拍亮一次。 */
export const BeatBar: React.FC<{ accent?: string }> = ({ accent = "#FF7A1A" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const beats = 60;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 58,
        height: 10,
        display: "flex",
        gap: 5,
        opacity: 0.85,
      }}
    >
      {Array.from({ length: beats }).map((_, i) => {
        const bt = i * BEAT;
        const down = i % 4 === 0;
        const passed = t >= bt;
        const age = t - bt;
        const glow = passed ? Math.max(0, 1 - age / 0.5) : 0;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: down ? 10 : 6,
              marginTop: down ? 0 : 2,
              borderRadius: 4,
              background: down ? accent : "#B9C0DE",
              opacity: passed ? 0.35 + 0.65 * glow : 0.16,
              scale: `1 ${1 + glow * 0.9}`,
            }}
          />
        );
      })}
    </div>
  );
};

export const sec2frame = (s: number) => Math.round(s * FPS);
