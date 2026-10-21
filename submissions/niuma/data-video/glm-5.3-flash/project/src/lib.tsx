import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, beatFrame, beatPulse, rand } from "./theme";

export const SPRING = { damping: 14, stiffness: 160, mass: 0.9 };
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// ---------- 数字滚动 ----------
export const CountUp: React.FC<{
  to: number;
  decimals?: number;
  dur?: number;
  delay?: number;
  from?: number;
}> = ({ to, decimals = 0, dur = 26, delay = 0, from = 0 }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [delay, delay + dur], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return <>{v.toFixed(decimals)}</>;
};

// ---------- 描边大字（贴纸感：双层文字，描边在下层） ----------
export const OutlinedText: React.FC<{
  text: string;
  size: number;
  color: string;
  strokeColor?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}> = ({ text, size, color, strokeColor = C.bg, strokeWidth = 8, style }) => {
  const base: React.CSSProperties = {
    fontFamily: FONT,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 1.1,
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
  };
  return (
    <div style={{ position: "relative", ...style }}>
      <span
        style={{
          ...base,
          position: "absolute",
          inset: 0,
          WebkitTextStroke: `${strokeWidth * 2}px ${strokeColor}`,
        }}
      >
        {text}
      </span>
      <span style={{ ...base, position: "relative", color }}>{text}</span>
    </div>
  );
};

// ---------- 贴纸卡片 ----------
export const Sticker: React.FC<{
  bg: string;
  color: string;
  children: React.ReactNode;
  size?: number;
  pad?: string;
  rotate?: number;
  border?: string;
  style?: React.CSSProperties;
}> = ({ bg, color, children, size = 44, pad = "14px 34px", rotate = 0, border, style }) => (
  <div
    style={{
      display: "inline-block",
      background: bg,
      color,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: size,
      padding: pad,
      borderRadius: 22,
      border: border ?? `4px solid ${C.bg}`,
      boxShadow: `8px 8px 0 rgba(0,0,0,0.35)`,
      rotate: `${rotate}deg`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------- 闪电（代码绘制装饰） ----------
export const Bolt: React.FC<{
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size = 90, color = C.yellow, style }) => (
  <svg
    width={size}
    height={size * 1.3}
    viewBox="0 0 100 130"
    style={{ ...style }}
  >
    <polygon
      points="58,2 12,72 44,72 30,128 88,50 52,50"
      fill={color}
      stroke={C.bg}
      strokeWidth={7}
      strokeLinejoin="round"
    />
  </svg>
);

// ---------- 圆点装饰 ----------
export const Dot: React.FC<{ size?: number; color?: string; style?: React.CSSProperties }> = ({
  size = 18,
  color = C.blue,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
      border: `3px solid ${C.bg}`,
      ...style,
    }}
  />
);

// ---------- 爆炸贴（星形爆炸框） ----------
export const Burst: React.FC<{
  size?: number;
  color?: string;
  children: React.ReactNode;
  textColor?: string;
  fontSize?: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({ size = 260, color = C.yellow, children, textColor = C.bg, fontSize = 44, rotate = 0, style }) => {
  const spikes = 14;
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 50 : 40;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`);
  }
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        rotate: `${rotate}deg`,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{ position: "absolute", width: "100%", height: "100%", filter: `drop-shadow(6px 6px 0 rgba(0,0,0,0.35))` }}
      >
        <polygon points={pts.join(" ")} fill={color} stroke={C.bg} strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      <div
        style={{
          position: "relative",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize,
          color: textColor,
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ---------- 粒子（庆祝喷发） ----------
export const BurstParticles: React.FC<{
  cx: number;
  cy: number;
  startFrame: number;
  count?: number;
  spread?: number;
}> = ({ cx, cy, startFrame, count = 36, spread = 900 }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;
  const t = frame - startFrame;
  const colors = [C.orange, C.blue, C.yellow, C.white];
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {Array.from({ length: count }).map((_, i) => {
        const a = rand(i * 3 + 1) * Math.PI * 2;
        const v = (0.35 + rand(i * 7 + 2) * 0.65) * spread;
        const x = cx + Math.cos(a) * v * (t / 30) * Math.min(1, 30 / Math.max(t, 1) * 2);
        const y = cy + Math.sin(a) * v * (t / 30) + 0.028 * t * t; // 重力
        const s = 6 + rand(i * 11 + 3) * 12;
        const op = interpolate(t, [0, 4, 40, 58], [0, 1, 1, 0], {
          extrapolateRight: "clamp",
        });
        if (op <= 0 || y > 1100) return null;
        return (
          <rect
            key={i}
            x={x - s / 2}
            y={y - s / 2}
            width={s}
            height={s}
            rx={s / 4}
            fill={colors[i % 4]}
            opacity={op}
            rotate={`${t * (rand(i) > 0.5 ? 6 : -6)}`}
          />
        );
      })}
    </svg>
  );
};

// ---------- 冲击波圆环 ----------
export const ShockRing: React.FC<{ cx: number; cy: number; startFrame: number; color?: string }> = ({
  cx,
  cy,
  startFrame,
  color = C.orange,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;
  const t = frame - startFrame;
  const p = interpolate(t, [0, 26], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const op = interpolate(t, [0, 4, 22, 26], [0, 0.9, 0.25, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        width: 500,
        height: 500,
        marginLeft: -250,
        marginTop: -250,
        borderRadius: "50%",
        border: `10px solid ${color}`,
        opacity: op,
        scale: `${0.2 + p * 2.6}`,
      }}
    />
  );
};

// 辉光背景
export const Glow: React.FC<{ size: number; color: string; style?: React.CSSProperties }> = ({
  size,
  color,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: "blur(10px)",
      ...style,
    }}
  />
);

// 扫光（白色斜条扫过容器）
export const Shine: React.FC<{ start: number; dur?: number; width?: number }> = ({
  start,
  dur = 20,
  width = 220,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [-30, 130], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (frame < start || frame > start + dur) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        display: "flex",
        alignItems: "stretch",
      }}
    >
      <div
        style={{
          width,
          marginLeft: `${p}%`,
          background:
            "linear-gradient(105deg, transparent 0%, rgba(244,246,255,0.26) 50%, transparent 100%)",
          rotate: "8deg",
        }}
      />
    </div>
  );
};

// 节拍同步的弹跳缩放
export const useBeatScale = (strength = 0.035): number => {
  const frame = useCurrentFrame();
  return 1 + beatPulse(frame) * strength;
};
