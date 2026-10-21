import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C} from './theme';
import {BEAT} from './timeline';
import raw from './nums.json';

export interface NumDef {
  id: string;
  scene: string;
  display: string;
  unit: string;
  value?: number;
  decimals?: number;
  start: number;
  full: number;
  out: number;
  text?: string;
  name?: string;
  tone?: string;
  kind: string;
  basis: string;
}

export const NUMS = (raw as {numbers: NumDef[]}).numbers;
export const NUM: Record<string, NumDef> = Object.fromEntries(
  NUMS.map((n) => [n.id, n]),
);
export const SCENES_META = (raw as {scenes: {id: string; from: number; to: number}[]}).scenes;

// 节拍脉冲：给定全局帧，返回 0~1 的冲击衰减（正拍瞬间 1，约 6 帧内衰减）
export const kick = (g: number, perBeat = BEAT) =>
  Math.max(0, 1 - ((g % perBeat) + perBeat) % perBeat / 6);

// 弹出（带回弹过冲）：在 at 帧开始
export const pop = (g: number, at: number, fps: number) =>
  spring({
    frame: g - at,
    fps,
    config: {damping: 11, stiffness: 150, mass: 0.9},
  });

// 缓出进度 [0,1]
export const ramp = (g: number, a: number, b: number) =>
  interpolate(g, [a, b], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

// 数字滚动文本：count 期间从 0 滚到目标，full 帧起与 nums.json display 完全一致
export const rolledText = (n: NumDef, g: number): string => {
  if (!('value' in n) || n.value === undefined) return n.display;
  if (g >= n.full) return n.display;
  const p = n.start >= n.full ? 1 : ramp(g, n.start, n.full);
  const v = n.value * p;
  const sign = n.display.trim().startsWith('+') ? '+' : n.display.trim().startsWith('−') ? '−' : '';
  return sign + Math.abs(v).toFixed(n.decimals ?? 1);
};

// ─── 通用弹入容器 ───
export const Pop: React.FC<{
  at: number;
  g: number;
  rotate?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({at, g, rotate = 0, children, style}) => {
  const {fps} = useVideoConfig();
  const p = pop(g, at, fps);
  const op = interpolate(g, [at, at + 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        opacity: op,
        scale: `${p}`,
        rotate: `${(1 - p) * 14 + rotate}deg`,
        transformOrigin: '50% 60%',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// ─── 贴纸卡片 ───
export const Sticker: React.FC<{
  bg: string;
  fg?: string;
  border?: string;
  bw?: number;
  radius?: number;
  rotate?: number;
  pad?: string;
  shadow?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({
  bg,
  fg = C.ink,
  border = C.ink,
  bw = 5,
  radius = 24,
  rotate = 0,
  pad = '14px 38px',
  shadow = '0 10px 0 rgba(0,0,0,0.30)',
  children,
  style,
}) => (
  <div
    style={{
      background: bg,
      color: fg,
      border: `${bw}px solid ${border}`,
      borderRadius: radius,
      transform: `rotate(${rotate}deg)`,
      padding: pad,
      boxShadow: shadow,
      fontFamily:
        '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
      fontWeight: 900,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── 数字条目渲染（滚动 + 单位）───
export const Num: React.FC<{
  id: string;
  g: number;
  size: number;
  color?: string;
  unitColor?: string;
  unitSize?: number;
  glow?: string;
  style?: React.CSSProperties;
}> = ({id, g, size, color = C.yellow, unitColor, unitSize, glow, style}) => {
  const n = NUM[id];
  const {fps} = useVideoConfig();
  const p = pop(g, n.start, fps);
  const op = interpolate(g, [n.start, n.start + 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const k = kick(g) * 0.028;
  const us = unitSize ?? size * 0.6;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: size > 150 ? 22 : 6,
        opacity: op,
        scale: `${1 + k * (g >= n.full ? 1 : 0)}`,
        transform: `translateY(${(1 - p) * 60}px)`,
        fontFamily:
          '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
        fontWeight: 900,
        color,
        fontSize: size,
        lineHeight: 1.05,
        textShadow: glow ?? 'none',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span>{rolledText(n, g)}</span>
      {n.unit ? (
        <span style={{fontSize: us, color: unitColor ?? C.white}}>{n.unit}</span>
      ) : null}
    </div>
  );
};

// ─── 闪电（代码绘制）───
export const Bolt: React.FC<{
  size: number;
  color: string;
  stroke?: string;
  style?: React.CSSProperties;
}> = ({size, color, stroke = C.ink, style}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={style}>
    <polygon
      points="62,2 20,54 44,54 34,98 80,40 54,40"
      fill={color}
      stroke={stroke}
      strokeWidth={6}
      strokeLinejoin="round"
    />
  </svg>
);

// ─── 爆炸贴（代码绘制多角星）───
export const Burst: React.FC<{
  w: number;
  h: number;
  color: string;
  points?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({w, h, color, points = 14, rotate = 0, style}) => {
  const cx = 50;
  const cy = 50;
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? 48 : 33;
    const a = (Math.PI * i) / points - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{transform: `rotate(${rotate}deg)`, ...style}}
    >
      <polygon points={pts.join(' ')} fill={color} />
    </svg>
  );
};
