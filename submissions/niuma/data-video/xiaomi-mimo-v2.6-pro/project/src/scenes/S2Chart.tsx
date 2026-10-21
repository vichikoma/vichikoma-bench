import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';
import {Camera, Pop, RollingNumber, Shine, Sticker} from '../components/kit';
import {FMT, M} from '../data';

/* ============================================================
   S2 · 大盘  4–10s（120–300 帧）
   数字：6467.67 万元 / +28.5% / 2221.38 / 2247.83 / 1998.46 万元 / 7月 8月 9月
   ============================================================ */

const BASE_Y = 850;          // 图表基线
const MAX_V = 2350;          // 柱高标定
const MAX_H = 400;
const GROUPS = [1250, 1420, 1590];

export const S2Chart: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill>
      <Camera
        startFrame={120}
        endFrame={300}
        from={{scale: 1, x: 26, y: 0}}
        to={{scale: 1.035, x: -26, y: -8}}
      >
        {/* 左：大数字 */}
        <div
          style={{
            position: 'absolute',
            left: 140,
            top: 218,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 58,
            color: C.white,
            letterSpacing: 4,
          }}
        >
          <Pop startFrame={120}>第三季度销售额（万元）</Pop>
        </div>

        <Pop startFrame={120} damping={10} from={0.86} slideY={26} style={{position: 'absolute', left: 132, top: 330}}>
          <Shine startFrame={174} duration={32}>
            <div style={{display: 'flex', alignItems: 'flex-end'}}>
              <RollingNumber
                startFrame={120}
                duration={30}
                decimals={2}
                value={M.q3Sales}
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 215,
                  color: C.yellow,
                  lineHeight: 1.05,
                  textShadow: `0 0 46px ${C.yellow}55`,
                }}
              />
            </div>
          </Shine>
        </Pop>

        <Pop startFrame={180} slideY={40} style={{position: 'absolute', left: 148, top: 700}}>
          <Sticker bg={C.orange} fg={C.navy} fontSize={58} rotate={-1.5}>
            同比 {FMT.q3SalesYoy}
          </Sticker>
        </Pop>

        {/* 右：分月柱状图（生长动画 + 去年同期淡色对比） */}
        <div
          style={{
            position: 'absolute',
            left: 1150,
            top: 232,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 42,
            color: C.gray,
            letterSpacing: 3,
          }}
        >
          <Pop startFrame={120}>分月销售额（万元）</Pop>
        </div>

        {/* 图例 */}
        <Pop startFrame={135} style={{position: 'absolute', left: 1150, top: 296}}>
          <div style={{display: 'flex', gap: 12, alignItems: 'center', fontFamily: FONT, fontSize: 34, color: C.gray}}>
            <div style={{width: 30, height: 30, background: C.orange, borderRadius: 8}} />
            <span>今年</span>
            <div style={{width: 30, height: 30, background: C.blue, opacity: 0.35, borderRadius: 8, marginLeft: 12}} />
            <span>去年同期</span>
          </div>
        </Pop>

        {M.months.map((m, i) => {
          const gx = GROUPS[i];
          const ghostStart = 135;
          const mainStart = 150 + i * 15;
          const ghostH = (m.prev / MAX_V) * MAX_H;
          const mainH = (m.v / MAX_V) * MAX_H;

          const ghostGrow = interpolate(frame, [ghostStart, ghostStart + 26], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          const s = spring({
            frame: frame - mainStart,
            fps,
            config: {damping: 13, mass: 0.9, stiffness: 120},
          });

          return (
            <React.Fragment key={m.label}>
              {/* 去年同期 */}
              <div
                style={{
                  position: 'absolute',
                  left: gx - 88,
                  top: BASE_Y - ghostH * ghostGrow,
                  width: 66,
                  height: ghostH * ghostGrow,
                  background: C.blue,
                  opacity: 0.32,
                  borderRadius: '12px 12px 0 0',
                }}
              />
              {/* 今年 */}
              <div
                style={{
                  position: 'absolute',
                  left: gx - 4,
                  top: BASE_Y - mainH * s,
                  width: 80,
                  height: mainH * s,
                  background: `linear-gradient(180deg, ${C.yellow}, ${C.orange})`,
                  borderRadius: '16px 16px 0 0',
                  boxShadow: `0 0 34px ${C.orange}55`,
                }}
              />
              {/* 数值 */}
              <Pop startFrame={mainStart + 15} style={{position: 'absolute', left: gx - 46, top: BASE_Y - mainH - 70}}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 38,
                    color: C.white,
                    fontVariantNumeric: 'tabular-nums',
                    width: 160,
                    textAlign: 'center',
                  }}
                >
                  {FMT.monthVals[i]}
                </div>
              </Pop>
              {/* 月份标签 */}
              <Pop startFrame={135 + i * 15} style={{position: 'absolute', left: gx - 46, top: BASE_Y + 26}}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 46,
                    color: C.white,
                    width: 160,
                    textAlign: 'center',
                  }}
                >
                  {FMT.monthLabels[i]}
                </div>
              </Pop>
            </React.Fragment>
          );
        })}

        {/* 基线 */}
        <div
          style={{
            position: 'absolute',
            left: 1150,
            top: BASE_Y,
            width: interpolate(frame, [120, 150], [0, 560], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            height: 6,
            background: C.gray,
            opacity: 0.55,
          }}
        />
      </Camera>
    </AbsoluteFill>
  );
};
