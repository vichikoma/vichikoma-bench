import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {Camera, Pop, Shine, Sticker} from '../components/kit';

/* ============================================================
   S6 · 落版  28–30s（840–900 帧）
   数字：「2026」（副行）
   ============================================================ */
export const S6End: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Camera
        startFrame={840}
        endFrame={900}
        from={{scale: 1.05, x: 0, y: 8}}
        to={{scale: 1, x: 0, y: 0}}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 300,
            width: 1920,
            textAlign: 'center',
          }}
        >
          <Shine startFrame={855} duration={30} style={{display: 'inline-block'}}>
            <Pop startFrame={840} damping={10} from={0.8} slideY={30}>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 200,
                  color: C.orange,
                  letterSpacing: 12,
                  textShadow: `0 0 60px ${C.orange}66, 0 12px 0 ${C.navy}`,
                  WebkitTextStroke: `3px ${C.yellow}`,
                }}
              >
                牛马咖啡
              </div>
            </Pop>
          </Shine>
        </div>

        <div style={{position: 'absolute', left: 0, top: 610, width: 1920, textAlign: 'center'}}>
          <Pop startFrame={855} slideY={40} style={{display: 'inline-block'}}>
            <Sticker bg={C.navy} fg={C.white} fontSize={58} rotate={-1}>
              2026 第三季度
            </Sticker>
          </Pop>
        </div>

        {/* 装饰闪电 ×2 */}
        <Pop startFrame={855} from={0.5} style={{position: 'absolute', left: 320, top: 330}}>
          <svg width={110} height={180}>
            <polygon points="58,0 16,100 52,100 26,180 100,64 60,64 88,0" fill={C.yellow} stroke={C.navy} strokeWidth={7} />
          </svg>
        </Pop>
        <Pop startFrame={870} from={0.5} style={{position: 'absolute', left: 1490, top: 330}}>
          <svg width={110} height={180}>
            <polygon points="58,0 16,100 52,100 26,180 100,64 60,64 88,0" fill={C.yellow} stroke={C.navy} strokeWidth={7} />
          </svg>
        </Pop>
      </Camera>
    </AbsoluteFill>
  );
};
