import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {Camera, Pop, Shine, Sticker} from '../components/kit';

/* ============================================================
   S1 · 开场封面  0–4s（0–120 帧）
   数字：「2026」（标题副行）
   ============================================================ */
export const S1Cover: React.FC = () => {
  const frame = useCurrentFrame();

  // 斜切大色块滑入
  const blockX = interpolate(frame, [0, 26], [-760, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  return (
    <AbsoluteFill>
      <Camera
        startFrame={0}
        endFrame={120}
        from={{scale: 1, x: 0, y: 0}}
        to={{scale: 1.055, x: -18, y: -12}}
      >
        {/* 斜切橙色大色块 */}
        <div
          style={{
            position: 'absolute',
            left: -120,
            top: 250,
            width: 1560,
            height: 560,
            background: C.orange,
            transform: `translateX(${blockX}px) rotate(-3.5deg)`,
            clipPath: 'polygon(0 0, 100% 6%, 96% 100%, 0 94%)',
            boxShadow: `24px 24px 0 ${C.blue}`,
          }}
        />

        {/* 品牌名（贴纸感大字） */}
        <Shine startFrame={45} duration={30} style={{position: 'absolute', left: 150, top: 320}}>
          <Pop startFrame={0} damping={11} from={0.82} slideY={40}>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 232,
                color: C.navy,
                letterSpacing: 10,
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}
            >
              牛马咖啡
            </div>
          </Pop>
        </Shine>

        {/* 副标题贴纸 */}
        <Pop startFrame={30} slideY={70} style={{position: 'absolute', left: 160, top: 610}}>
          <Sticker bg={C.navy} fg={C.white} fontSize={68} rotate={-1.2}>
            2026 第三季度 · 经营快报
          </Sticker>
        </Pop>

        {/* 装饰：闪电 / 圆环 / 爆炸贴 */}
        <Pop startFrame={45} from={0.4} style={{position: 'absolute', left: 1450, top: 200}}>
          <svg width={190} height={300}>
            <polygon
              points="96,0 26,168 86,168 44,300 168,110 102,110 148,0"
              fill={C.yellow}
              stroke={C.navy}
              strokeWidth={8}
            />
          </svg>
        </Pop>
        <Pop startFrame={60} from={0.5} style={{position: 'absolute', left: 1560, top: 560}}>
          <svg width={230} height={230}>
            <circle cx={115} cy={115} r={100} fill={C.blue} stroke={C.navy} strokeWidth={8} />
            <circle cx={115} cy={115} r={52} fill={C.navy} />
          </svg>
        </Pop>
        <Pop startFrame={75} from={0.5} style={{position: 'absolute', left: 1290, top: 720}}>
          <svg width={170} height={170}>
            <rect x={12} y={12} width={146} height={146} rx={34} fill={C.yellow} stroke={C.navy} strokeWidth={8} transform="rotate(12 85 85)" />
          </svg>
        </Pop>
      </Camera>
    </AbsoluteFill>
  );
};
