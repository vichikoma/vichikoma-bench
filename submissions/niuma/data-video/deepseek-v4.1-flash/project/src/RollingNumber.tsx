import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { easeOutExpo } from "./bits";

/**
 * 数字滚动：从 0（或 from）滚到 to，用强缓出让它「刹车」停住。
 * 小数位数固定，保证同一指标在全片写法一致。
 */
export const RollingNumber: React.FC<{
  to: number;
  from?: number;
  start: number; // 起始秒（相对所在 Sequence）
  dur: number; // 滚动时长（秒）
  decimals?: number;
  style?: React.CSSProperties;
}> = ({ to, from = 0, start, dur, decimals = 1, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const p = interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOutExpo,
  });
  const v = from + (to - from) * p;
  const text = v.toFixed(decimals);
  return <span style={style}>{text}</span>;
};
