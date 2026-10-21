import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {BEAT, C, DURATION} from './theme';

/**
 * 全片共用的动效基元。视觉基调（brand.md：热血、闹腾、贴纸感、橙蓝撞色、深色底）：
 *  - 分层视差：背景 < 中景 < 前景，不同速度
 *  - 与节拍联动的脉冲（每一拍都有一次轻微「弹」）
 *  - 斜切色块 + 圆角贴纸块
 *  - 扫光 / 辉光
 */

// ---------------------------------------------------------------- 节拍脉冲
/**
 * 返回一个0..1 的节拍包络：拍点瞬间为 1，随后衰减。
 * 用于「与音乐节拍联动的动效」——每一次切镜、每一个数据块的弹跳都踩在拍上。
 */
export const useBeatPulse = (phase = 0) => {
  const frame = useCurrentFrame();
  const sinceBeat = (((frame - phase) % BEAT) + BEAT) % BEAT;
  return Math.exp(-sinceBeat / 4.5);
};

// ---------------------------------------------------------------- 分层视差背景
/**
 * 三层背景：网点 / 斜切色块 / 光斑，各自以不同速度移动。
 * 贯穿全片使用，构成统一的「镜头在动」的基础。
 */
export const ParallaxBg: React.FC<{seed?: number}> = ({seed = 0}) => {
  const frame = useCurrentFrame();
  const t = frame / DURATION;

  // 背景层：慢速横移 + 整体缓推
  const dots = Array.from({length: 132}, (_, i) => {
    const col = i % 22;
    const row = Math.floor(i / 22);
    const x = col * 96 + ((row % 2) * 48);
    const y = row * 96;
    return {x, y, k: ((i * 37) % 11) / 11};
  });

  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: C.ink}}>
      {/* 底层网点：0.35 倍速横移 */}
      <AbsoluteFill
        style={{
          translate: `${-t * 210 + seed * 13}px ${-t * 26}px`,
          opacity: 0.5,
        }}
      >
        {dots.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: d.x - 240,
              top: d.y - 120,
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: d.k > 0.7 ? C.blue : C.gray,
              opacity: 0.16 + d.k * 0.2,
            }}
          />
        ))}
      </AbsoluteFill>

      {/* 中层：斜切大色块，0.9 倍速反向横移 */}
      <AbsoluteFill style={{translate: `${t * 170}px 0px`, opacity: 0.9}}>
        <div
          style={{
            position: 'absolute',
            left: -420 + t * 90,
            top: -160,
            width: 900,
            height: 1500,
            backgroundColor: C.orange,
            opacity: 0.1,
            rotate: '14deg',
            borderRadius: 120,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 1380 + t * 60,
            top: -260,
            width: 760,
            height: 1700,
            backgroundColor: C.blue,
            opacity: 0.1,
            rotate: '11deg',
            borderRadius: 120,
          }}
        />
      </AbsoluteFill>

      {/* 前景光斑：1.6 倍速 + 呼吸辉光 */}
      <AbsoluteFill
        style={{
          translate: `${-t * 340}px ${-t * 70}px`,
          filter: `blur(${70 + useBeatPulse() * 16}px)`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 90,
            width: 520,
            height: 520,
            borderRadius: '50%',
            backgroundColor: C.orange,
            opacity: 0.2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 1240,
            top: 620,
            width: 620,
            height: 620,
            borderRadius: '50%',
            backgroundColor: C.blue,
            opacity: 0.18,
          }}
        />
      </AbsoluteFill>

      {/* 暗角，把注意力收到中央 */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 74% 68% at 50% 48%, rgba(11,16,38,0) 34%, rgba(11,16,38,0.82) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 贴纸块
/** 粗描边 + 大圆角 + 藏蓝黑投影的「贴纸」卡片 */
export const Sticker: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
  tilt?: number;
}> = ({children, color = C.ink, style, tilt = 0}) => (
  <div
    style={{
      backgroundColor: color,
      borderRadius: 34,
      border: `6px solid ${C.ink}`,
      boxShadow: `0 10px 0 ${C.ink}, 0 22px 44px rgba(0,0,0,0.45)`,
      rotate: `${tilt}deg`,
      ...style,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------- 遮罩转场
/**
 * 斜切遮罩转场（wipe）：每个镜头进场时，一道橙/蓝斜切色块从侧边扫过，
 * 把新画面「揭开」。全片统一使用，转场节奏与音乐小节同步。
 */
export const WipeIn: React.FC<{duration?: number; color?: string}> = ({
  duration = 14,
  color = C.orange,
}) => {
  const frame = useCurrentFrame();
  if (frame >= duration) {
    return null;
  }
  // 缓出：前段快、末段慢
  const p = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  // 斜切条从左向右扫过（略超出画面）
  const x = interpolate(p, [0, 1], [-1250, 2100]);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: -420,
          width: 760,
          height: 2000,
          backgroundColor: color,
          rotate: '15deg',
          opacity: 0.92,
          boxShadow: `40px 0 90px ${color}66`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 扫光
/** 一道从左到右的高光带，掠过文字或色块。全片作为统一的「光泽」语言。 */
export const Sweep: React.FC<{
  delay?: number;
  length?: number;
  opacity?: number;
  width?: number;
}> = ({delay = 0, length = 22, opacity = 0.4, width = 620}) => {
  const frame = useCurrentFrame() - delay;
  if (frame < 0 || frame > length) {
    return null;
  }
  const p = interpolate(frame, [0, length], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        overflow: 'hidden',
        opacity: opacity * Math.sin(Math.PI * Math.min(1, Math.max(0, p))),
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: interpolate(p, [0, 1], [-width, 1920 + width]),
          top: -300,
          width,
          height: 1700,
          rotate: '16deg',
          background:
            'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.30) 46%, rgba(255,255,255,0.62) 52%, rgba(255,255,255,0.30) 58%, rgba(255,255,255,0) 100%)',
          filter: 'blur(10px)',
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 数字滚动
/**
 * 数字滚动：把一个数从 0 滚到目标值（缓出 + 落定时轻微回弹）。
 * 全片所有关键数字都用它出现。
 */
export const CountUp: React.FC<{
  to: number;
  delay?: number;
  duration?: number;
  decimals?: number;
  thousands?: boolean;
  /** 结尾回弹强度（像素级 scale 抖动） */
  bounce?: boolean;
  style?: React.CSSProperties;
}> = ({to, delay = 0, duration = 26, decimals = 1, thousands = false, bounce = true, style}) => {
  const frame = useCurrentFrame() - delay;
  if (frame < 0) {
    return <span style={style}>{fmt(0, decimals, thousands)}</span>;
  }
  const p = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.12, 0.9, 0.2, 1),
  });
  const val = to * p;
  const over = bounce
    ? interpolate(frame, [duration - 6, duration], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.back(2.2)),
      })
    : 1;
  return (
    <span style={{...style, scale: `${1 + (over - 1) * 0.06}`}}>
      {fmt(val, decimals, thousands)}
    </span>
  );
};

export const fmt = (v: number, decimals = 1, thousands = false) => {
  const s = v.toFixed(decimals);
  if (!thousands) {
    return s;
  }
  const [i, d] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d ? '.' + d : '');
};

// ---------------------------------------------------------------- 文字进场（带物理感）
/**
 * 统一的文字入场：弹簧回弹 + 逐字错位。
 * 用 spring 的回弹表现「贴纸被甩到画面上」的物理感。
 */
export const SpringIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  from?: number;
  style?: React.CSSProperties;
}> = ({children, delay = 0, from = 46, style}) => {
  const frame = useCurrentFrame() - delay;
  if (frame < 0) {
    return null;
  }
  const p = interpolate(frame, [0, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.18, 1.5, 0.4, 1), // back-out：落定时过冲再回弹
  });
  return (
    <div
      style={{
        ...style,
        translate: `0 ${(1 - p) * from}px`,
        scale: `${0.86 + p * 0.14}`,
        opacity: interpolate(p, [0, 0.5], [0, 1], {extrapolateRight: 'clamp'}),
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------- 镜头运动
/**
 * 整层推镜：每个镜头都有一个持续的缓推/缓拉（Ken Burns），
 * 让画面「一直在动」，而不是静态卡片。
 */
export const Push: React.FC<{
  children: React.ReactNode;
  from?: number;
  to?: number;
  style?: React.CSSProperties;
}> = ({children, from = 1.0, to = 1.06, style}) => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 120], [from, to], {
    extrapolateRight: 'extend',
    easing: Easing.bezier(0.4, 0, 0.3, 1),
  });
  return <AbsoluteFill style={{...style, scale: `${s}`}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- 图表生长
/** 横向条形从 0 生长到目标宽度（缓出），带落定回弹 */
export const GrowBar: React.FC<{
  width: number;
  height: number;
  color: string;
  delay?: number;
  duration?: number;
  radius?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({width, height, color, delay = 0, duration = 22, radius = 999, glow = true, style}) => {
  const frame = useCurrentFrame() - delay;
  const pulse = useBeatPulse(delay);
  if (frame < 0) {
    return null;
  }
  const p = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.14, 0.9, 0.2, 1),
  });
  return (
    <div
      style={{
        ...style,
        width: Math.max(4, width * p),
        height,
        backgroundColor: color,
        borderRadius: radius,
        border: `5px solid ${C.ink}`,
        boxShadow: glow
          ? `0 0 ${18 + pulse * 26}px ${color}88, 0 8px 0 ${C.ink}`
          : `0 8px 0 ${C.ink}`,
        scale: `${1 + pulse * 0.012}`,
      }}
    />
  );
};

/** 竖向柱子生长（柱状图用），底边固定 */
export const GrowColumn: React.FC<{
  w: number;
  h: number;
  color: string;
  delay?: number;
  duration?: number;
  glow?: boolean;
  style?: React.CSSProperties;
}> = ({w, h, color, delay = 0, duration = 24, glow = true, style}) => {
  const frame = useCurrentFrame() - delay;
  const pulse = useBeatPulse(delay);
  if (frame < 0) {
    return null;
  }
  const p = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 0.95, 0.2, 1),
  });
  return (
    <div
      style={{
        ...style,
        width: w,
        height: Math.max(3, h * p),
        backgroundColor: color,
        borderRadius: 22,
        border: `5px solid ${C.ink}`,
        boxShadow: glow ? `0 0 ${16 + pulse * 30}px ${color}99, 0 9px 0 ${C.ink}` : `0 9px 0 ${C.ink}`,
        scale: `${1 + pulse * 0.015}`,
      }}
    />
  );
};

/** 折线（用 SVG path 的 stroke-dashoffset 做「画出来」的生长动画） */
export const DrawLine: React.FC<{
  points: {x: number; y: number}[];
  color: string;
  width?: number;
  delay?: number;
  duration?: number;
}> = ({points, color, width = 10, delay = 0, duration = 30}) => {
  const frame = useCurrentFrame() - delay;
  if (frame < 0 || points.length < 2) {
    return null;
  }
  const p = interpolate(frame, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0.1, 0.2, 1),
  });
  const d = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x.toFixed(1)},${pt.y.toFixed(1)}`)
    .join(' ');
  return (
    <svg style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <path
        d={d}
        fill="none"
        stroke={C.ink}
        strokeWidth={width + 8}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={20000}
        strokeDashoffset={20000}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={20000}
        strokeDashoffset={20000 * (1 - p)}
      />
    </svg>
  );
};

/** 箭头（三角形），指向某个数据 */
export const Arrow: React.FC<{color?: string; size?: number; rotate?: number; style?: React.CSSProperties}> = ({
  color = C.yellow,
  size = 44,
  rotate = 0,
  style,
}) => (
  <div
    style={{
      ...style,
      width: 0,
      height: 0,
      borderTop: `${size * 0.55}px solid transparent`,
      borderBottom: `${size * 0.55}px solid transparent`,
      borderLeft: `${size}px solid ${color}`,
      rotate: `${rotate}deg`,
      filter: `drop-shadow(0 0 10px ${color}88)`,
    }}
  />
);