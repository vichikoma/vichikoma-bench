import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, FONT, BEAT, rnd} from '../theme';

/* ============================ 分层视差背景 ============================ */
export const Bg: React.FC = () => {
  const frame = useCurrentFrame();
  // 三层不同速度漂移（背景 / 中景 / 前景）
  const s1 = frame * 0.10;
  const s2 = frame * 0.28;
  const s3 = frame * 0.62;
  // 节拍脉冲：每拍（15帧）一次
  const beatPhase = (frame % BEAT) / BEAT;
  const pulse = 1 - Math.pow(beatPhase, 2);

  return (
    <AbsoluteFill style={{backgroundColor: C.navy, overflow: 'hidden'}}>
      {/* 背景层：大辉光 */}
      <div
        style={{
          position: 'absolute',
          width: 1400,
          height: 1400,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.orange}33 0%, ${C.orange}00 65%)`,
          right: -300 + s1,
          top: -500 + s1 * 0.4,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1200,
          height: 1200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.blue}2E 0%, ${C.blue}00 65%)`,
          left: -320 - s1 * 0.8,
          bottom: -420 + s1 * 0.5,
        }}
      />
      {/* 中景层：斜切条纹 + 大圆环 */}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.5}}>
        <g transform={`translate(${-s2 % 240}, ${s2 * 0.2})`}>
          {Array.from({length: 14}).map((_, i) => (
            <line
              key={i}
              x1={-200 + i * 240}
              y1={1200}
              x2={340 + i * 240}
              y2={-120}
              stroke={C.blue}
              strokeWidth={2}
              opacity={0.16}
            />
          ))}
        </g>
        <circle
          cx={1620 - s2 * 0.5}
          cy={220 + s2 * 0.25}
          r={330}
          fill="none"
          stroke={C.orange}
          strokeWidth={3}
          opacity={0.22}
        />
        <circle
          cx={240 + s2 * 0.4}
          cy={880 - s2 * 0.2}
          r={260}
          fill="none"
          stroke={C.yellow}
          strokeWidth={3}
          opacity={0.16}
        />
      </svg>
      {/* 前景层：圆点阵 + 漂浮贴纸 */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        {Array.from({length: 42}).map((_, i) => {
          const x = (rnd(i, 1) * 2100 + s3 * (0.5 + rnd(i, 2))) % 2100 - 90;
          const y = rnd(i, 3) * 1080;
          const r = 3 + rnd(i, 4) * 6;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={r}
              fill={i % 3 === 0 ? C.yellow : i % 3 === 1 ? C.blue : C.orange}
              opacity={0.16 + pulse * 0.1}
            />
          );
        })}
        {/* 贴纸小元素：闪电 / 三角 / 圆环 */}
        <g transform={`translate(${1500 - s3 * 0.35}, ${760 + s3 * 0.22}) rotate(${-14 + s3 * 0.25})`}>
          <polygon points="0,0 34,0 18,26 40,26 6,62 16,32 -4,32" fill={C.yellow} opacity={0.5} />
        </g>
        <g transform={`translate(${320 + s3 * 0.28}, ${250 - s3 * 0.18}) rotate(${20 - s3 * 0.2})`}>
          <rect x={0} y={0} width={54} height={54} rx={12} fill={C.orange} opacity={0.32} />
        </g>
        <circle cx={980 + s3 * 0.2} cy={180 + s3 * 0.32} r={22} fill="none" stroke={C.blue} strokeWidth={5} opacity={0.4} />
      </svg>
      {/* 节拍脉冲光 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 45%, ${C.blue}14 0%, transparent 55%)`,
          opacity: 0.3 + pulse * 0.7,
        }}
      />
    </AbsoluteFill>
  );
};

/* ============================ 遮罩转场（斜切 wipe + 扫光带） ============================ */
export const Wipe: React.FC<{
  startFrame: number; // 转场开始帧（= 切点 - 6）
  cutFrame: number;   // 切点帧（转场结束）
  children: React.ReactNode;
  bandColor?: string;
}> = ({startFrame, cutFrame, children, bandColor = C.yellow}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, cutFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.65, 0, 0.25, 1),
  });
  const edge = p * 118; // 斜切边缘
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `polygon(0 0, ${edge}% 0, ${edge - 12}% 100%, 0 100%)`,
        }}
      >
        {children}
      </AbsoluteFill>
      {p > 0 && p < 1 ? (
        <div
          style={{
            position: 'absolute',
            top: -80,
            left: `${edge - 15}%`,
            width: 220,
            height: 1240,
            background: `linear-gradient(90deg, ${bandColor}00, ${bandColor}66, ${bandColor}00)`,
            transform: 'rotate(9deg)',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/* ============================ 物理感弹性入场 ============================ */
export const Pop: React.FC<{
  startFrame: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  damping?: number;
  from?: number;
  slideY?: number;
}> = ({startFrame, children, style, damping = 12, from = 0.72, slideY = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({
    frame: frame - startFrame,
    fps,
    config: {damping, mass: 0.8, stiffness: 130},
  });
  return (
    <div
      style={{
        ...style,
        transform: `translateY(${(1 - s) * slideY}px) scale(${from + (1 - from) * s})`,
        opacity: interpolate(frame, [startFrame, startFrame + 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      {children}
    </div>
  );
};

/* ============================ 数字滚动 ============================ */
export const RollingNumber: React.FC<{
  startFrame: number;
  duration: number;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({startFrame, duration, value, decimals = 0, prefix = '', suffix = '', style}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [startFrame, startFrame + duration], [0, value], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <span style={{fontVariantNumeric: 'tabular-nums', ...style}}>
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/* ============================ 扫光 ============================ */
export const Shine: React.FC<{
  startFrame: number;
  duration: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({startFrame, duration, children, style}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [startFrame, startFrame + duration], [-40, 140], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <div style={{position: 'relative', overflow: 'hidden', ...style}}>
      {children}
      {frame >= startFrame && frame <= startFrame + duration ? (
        <div
          style={{
            position: 'absolute',
            top: -60,
            left: `${x}%`,
            width: '26%',
            height: '220%',
            background:
              'linear-gradient(105deg, rgba(244,246,255,0) 0%, rgba(244,246,255,0.55) 50%, rgba(244,246,255,0) 100%)',
            transform: 'skewX(-18deg)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
};

/* ============================ 粒子爆发 ============================ */
export const Particles: React.FC<{
  startFrame: number;
  count?: number;
  cx?: number;
  cy?: number;
}> = ({startFrame, count = 26, cx = 960, cy = 500}) => {
  const frame = useCurrentFrame();
  const t = (frame - startFrame) / 30;
  if (t < 0 || t > 2.6) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute'}}>
      {Array.from({length: count}).map((_, i) => {
        const ang = rnd(i, 7) * Math.PI * 2;
        const dist = (120 + rnd(i, 8) * 460) * (1 - Math.exp(-2.4 * t));
        const x = cx + Math.cos(ang) * dist;
        const y = cy + Math.sin(ang) * dist * 0.72 - t * 40;
        const r = 5 + rnd(i, 9) * 12;
        const op = Math.max(0, 0.85 - t * 0.42);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={i % 3 === 0 ? C.yellow : i % 3 === 1 ? C.orange : C.blue}
            opacity={op}
          />
        );
      })}
    </svg>
  );
};

/* ============================ 贴纸文本（粗描边） ============================ */
export const Sticker: React.FC<{
  children: React.ReactNode;
  bg: string;
  fg: string;
  fontSize: number;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({children, bg, fg, fontSize, rotate = 0, style}) => (
  <div
    style={{
      display: 'inline-block',
      background: bg,
      color: fg,
      fontFamily: FONT,
      fontWeight: 900,
      fontSize,
      padding: `${fontSize * 0.16}px ${fontSize * 0.36}px`,
      borderRadius: fontSize * 0.28,
      border: `6px solid ${C.navy}`,
      boxShadow: `10px 10px 0 ${C.navy}88`,
      transform: `rotate(${rotate}deg)`,
      lineHeight: 1.12,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ============================ 相机层（整层推/拉/横移） ============================ */
export const Camera: React.FC<{
  startFrame: number;
  endFrame: number;
  from: {scale: number; x: number; y: number};
  to: {scale: number; x: number; y: number};
  children: React.ReactNode;
}> = ({startFrame, endFrame, from, to, children}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [startFrame, endFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 0.3, 1),
  });
  const scale = from.scale + (to.scale - from.scale) * p;
  const x = from.x + (to.x - from.x) * p;
  const y = from.y + (to.y - from.y) * p;
  return (
    <AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${scale})`}}>
      {children}
    </AbsoluteFill>
  );
};
