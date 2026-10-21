import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, RGBA} from './theme';
import {BEAT} from './timeline';
import {kick} from './ui';

// 视差背景：远/中/近三层不同速度漂移 + 节拍脉冲 + 光斑 + 噪点 + 镜头呼吸
// 全部颜色 = 品牌色透明变体（brand.md：可调透明度），无任何外链素材
const DotGrid: React.FC<{
  g: number;
  size: number;
  gap: number;
  color: string;
  opacity: number;
  speed: number;
}> = ({size, gap, color, opacity, speed, g}) => {
  const off = (g * speed) % gap;
  const cols = Math.ceil(2100 / gap) + 1;
  const rows = Math.ceil(1300 / gap) + 1;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      dots.push(
        <circle key={`${r}-${c}`} cx={c * gap - off} cy={r * gap - off * 0.6} r={size} fill={color} />,
      );
    }
  }
  return (
    <svg width={2100} height={1300} style={{position: 'absolute', left: -90, top: -110, opacity}}>
      {dots}
    </svg>
  );
};

export const Backdrop: React.FC = () => {
  const g = useCurrentFrame(); // 背景挂在根，g 即全局帧
  const k = kick(g);
  const breathe = 1.015 + 0.012 * Math.sin(g / 40) + k * 0.008;
  const panX = interpolate(g, [0, 900], [-16, 16], {
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: C.ink}}>
      {/* 底色微亮中心（雾白透明变体）*/}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at 50% 28%, ${RGBA.white(0.07)} 0%, ${RGBA.white(0)} 55%)`,
        }}
      />
      {/* 远景：慢速点阵（冰蓝变体）*/}
      <AbsoluteFill style={{transform: `scale(${breathe}) translate(${panX * 0.25}px, ${panX * -0.15}px)`}}>
        <DotGrid g={g} size={3} gap={96} color={RGBA.blue(0.3)} opacity={0.5} speed={0.16} />
      </AbsoluteFill>
      {/* 中景：较快十字点（雾白变体）*/}
      <AbsoluteFill style={{transform: `scale(${breathe * 1.01}) translate(${panX * 0.7}px, ${panX * -0.4}px)`}}>
        <DotGrid g={g} size={4} gap={170} color={RGBA.white(0.14)} opacity={0.5} speed={0.5} />
      </AbsoluteFill>
      {/* 光源斑：燃橙 / 冰蓝呼吸 */}
      <div
        style={{
          position: 'absolute',
          width: 1300,
          height: 1300,
          left: 880 + Math.sin(g / 65) * 90,
          top: -660 + Math.cos(g / 80) * 60,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${RGBA.blue(0.16)}, ${RGBA.blue(0)} 65%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1100,
          height: 1100,
          left: -330 + Math.cos(g / 70) * 80,
          top: 400 + Math.sin(g / 55) * 70,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${RGBA.orange(0.15)}, ${RGBA.orange(0)} 62%)`,
        }}
      />
      {/* 节拍脉冲圈：每小节正拍扩张一次 */}
      <svg width={1920} height={1080} style={{position: 'absolute'}}>
        <circle
          cx={960}
          cy={540}
          r={430 + ((g % (BEAT * 4)) / (BEAT * 4)) * 300}
          fill="none"
          stroke={RGBA.orange(0.16 + k * 0.2)}
          strokeWidth={2 + k * 4}
        />
      </svg>
      {/* 近景：最快斜纹（冰蓝变体）*/}
      <AbsoluteFill style={{transform: `translate(${panX * 1.5}px, ${panX * 0.6}px)`}}>
        <svg width={2200} height={1400} style={{position: 'absolute', left: -140, top: -160}}>
          {Array.from({length: 12}).map((_, i) => (
            <rect
              key={i}
              x={-260 + i * 210 + ((g * 1.2) % 210)}
              y={-200}
              width={22}
              height={1800}
              fill={RGBA.blue(0.055)}
              transform="rotate(18 1100 700)"
            />
          ))}
        </svg>
      </AbsoluteFill>
      {/* 噪点（feTurbulence 代码生成）*/}
      <svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.05}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      {/* 暗角 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(130% 100% at 50% 50%, ${RGBA.black(0)} 58%, ${RGBA.black(0.45)} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
