import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {Camera, Pop, RollingNumber, Sticker} from '../components/kit';
import {FMT, M} from '../data';

/* ============================================================
   S5 · 毛利率  24–28s（720–840 帧）
   数字：54.2% / -2.6pp / 48.4% / 60.5%
   ============================================================ */

const BAR_X = 1200;
const BAR_MAX = 336;

export const S5Margin: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <Camera
        startFrame={720}
        endFrame={840}
        from={{scale: 1, x: 18, y: 0}}
        to={{scale: 1.05, x: -12, y: -10}}
      >
        {/* 左：整体毛利率 */}
        <div style={{position: 'absolute', left: 150, top: 232}}>
          <Pop startFrame={720}>
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 68, color: C.white, letterSpacing: 6}}>
              第三季度毛利率
            </div>
          </Pop>
        </div>

        <Pop startFrame={720} damping={11} from={0.85} slideY={24} style={{position: 'absolute', left: 132, top: 330}}>
          <RollingNumber
            startFrame={720}
            duration={30}
            value={M.margin}
            decimals={1}
            suffix="%"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 296,
              color: C.yellow,
              lineHeight: 1.08,
              textShadow: `0 0 48px ${C.yellow}55`,
            }}
          />
        </Pop>

        <Pop startFrame={765} slideY={36} style={{position: 'absolute', left: 150, top: 680}}>
          <Sticker bg={C.blue} fg={C.navy} fontSize={58} rotate={-1.4}>
            同比 {FMT.marginDelta}
          </Sticker>
        </Pop>

        {/* 右：分渠道毛利率 */}
        <div style={{position: 'absolute', left: 1020, top: 270}}>
          <Pop startFrame={720}>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 46, color: C.gray, letterSpacing: 4}}>
              分渠道毛利率
            </div>
          </Pop>
        </div>

        {[
          {label: '外卖', fmt: FMT.deliveryMargin, v: M.deliveryMargin, color: C.blue, y: 390, start: 735},
          {label: '门店', fmt: FMT.storeMargin, v: M.storeMargin, color: C.orange, y: 545, start: 750},
        ].map((row) => {
          const grow = interpolate(frame, [row.start, row.start + 26], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          return (
            <div key={row.label}>
              <Pop startFrame={row.start} style={{position: 'absolute', left: 1020, top: row.y + 8}}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 52,
                    color: C.white,
                    letterSpacing: 4,
                  }}
                >
                  {row.label}
                </div>
              </Pop>
              <div
                style={{
                  position: 'absolute',
                  left: BAR_X,
                  top: row.y,
                  width: (row.v / 65) * BAR_MAX * grow,
                  height: 74,
                  background: row.color,
                  borderRadius: 14,
                  boxShadow: `0 0 28px ${row.color}55`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 1576,
                  top: row.y + 6,
                  width: 204,
                  textAlign: 'right',
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 58,
                  color: C.white,
                  fontVariantNumeric: 'tabular-nums',
                  opacity: grow,
                }}
              >
                {row.fmt}
              </div>
            </div>
          );
        })}

        {/* 结论句 */}
        <Pop startFrame={765} slideY={30} style={{position: 'absolute', left: 152, top: 856}}>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 46,
              color: C.gray,
              letterSpacing: 3,
            }}
          >
            外卖占比升高，拉低整体毛利率
          </div>
        </Pop>
      </Camera>
    </AbsoluteFill>
  );
};
