import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, Easing} from 'remotion';
import {C, RGBA} from '../lib/theme';

// 贴纸感扫块遮罩：在切帧（local=4）全屏覆盖 → 换屏恰好发生在拍点上
const COLORS = [C.orange, C.blue, C.yellow];

export const Wipe: React.FC<{index: number}> = ({index}) => {
  const l = useCurrentFrame(); // 0..10
  const color = COLORS[index % 3];
  const rtl = index % 2 === 1;
  const cov = interpolate(l, [0, 4, 10], [-2750, -340, 2150], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const x = rtl ? -cov - 2600 + 1920 : cov;
  const flash = Math.max(0, 1 - Math.abs(l - 4) / 2) * 0.22;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: x, top: 0, width: 2600, height: 1080}}>
        <svg width={2600} height={1080}>
          <polygon points="330,0 2600,0 2270,1080 0,1080" fill={color} stroke={C.ink} strokeWidth={14} />
          <polygon points="430,0 560,0 230,1080 100,1080" fill={RGBA.ink(0.18)} />
          <polygon points="700,0 760,0 430,1080 370,1080" fill={RGBA.white(0.25)} />
          {/* 闪电角标 */}
          <polygon
            points="1500,380 1380,560 1470,560 1420,720 1610,500 1510,500"
            fill={C.yellow}
            stroke={C.ink}
            strokeWidth={10}
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {flash > 0 ? <AbsoluteFill style={{background: RGBA.white(flash)}} /> : null}
    </AbsoluteFill>
  );
};
