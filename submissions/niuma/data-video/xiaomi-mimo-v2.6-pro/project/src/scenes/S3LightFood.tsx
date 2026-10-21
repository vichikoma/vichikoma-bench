import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {Camera, Particles, Pop, RollingNumber, Shine} from '../components/kit';
import {FMT, M} from '../data';

/* ============================================================
   S3 · 轻食高潮  10–18s（300–540 帧）
   数字：+195.6% / 1004 万元 / 6.7% / 15.5%
   高潮帧：12.0–14.0s（360–420）「+195.6%」怼脸成唯一焦点
   ============================================================ */

export const S3LightFood: React.FC = () => {
  const frame = useCurrentFrame();

  // 「+195.6%」：居中怼脸 → 高潮放大 → 收到左上锚点（全程在屏）
  const sc =
    frame < 360
      ? 1
      : frame < 420
      ? interpolate(frame, [360, 382], [1, 1.55], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.18, 0.9, 0.25, 1),
        })
      : interpolate(frame, [420, 442], [1.55, 0.62], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.bezier(0.2, 0.8, 0.2, 1),
        });
  const tx = interpolate(frame, [420, 442], [0, -508], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });
  const ty = interpolate(frame, [420, 442], [0, -122], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  // 高潮环形辉光
  const ringScale = interpolate(frame, [360, 420], [0.6, 1.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ringOp = interpolate(frame, [355, 372, 408, 424], [0, 0.75, 0.75, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 其它元素在高潮时让位
  const restOp = interpolate(frame, [352, 372, 424, 442], [1, 0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <Camera
        startFrame={300}
        endFrame={540}
        from={{scale: 1.06, x: 0, y: 12}}
        to={{scale: 1.01, x: -14, y: -8}}
      >
        {/* 标签 */}
        <div
          style={{
            position: 'absolute',
            left: 150,
            top: 178,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 68,
            color: C.white,
            letterSpacing: 5,
          }}
        >
          <Pop startFrame={300}>增长引擎 · 轻食</Pop>
        </div>

        {/* 高潮环 */}
        <div
          style={{
            position: 'absolute',
            left: 960 - 420,
            top: 540 - 420,
            width: 840,
            height: 840,
            borderRadius: '50%',
            border: `10px solid ${C.yellow}`,
            opacity: ringOp,
            transform: `scale(${ringScale})`,
            boxShadow: `0 0 120px ${C.yellow}66`,
          }}
        />
        <Particles startFrame={360} cx={960} cy={520} />

        {/* 主数字：滚动 + 拽脸放大 */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 352,
            width: 1920,
            textAlign: 'center',
            transform: `translate(${tx}px, ${ty}px) scale(${sc})`,
            transformOrigin: '50% 42%',
          }}
        >
          <RollingNumber
            startFrame={300}
            duration={60}
            value={M.lightFoodYoy}
            decimals={1}
            prefix="+"
            suffix="%"
            style={{
              display: 'inline-block',
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 258,
              color: C.yellow,
              lineHeight: 1.12,
              textShadow: `0 0 60px ${C.yellow}66, 0 10px 0 ${C.navy}88`,
            }}
          />
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 48,
              color: C.gray,
              letterSpacing: 6,
              marginTop: 34,
            }}
          >
            轻食品类 · 同比增速
          </div>
        </div>

        <Shine startFrame={375} duration={36} style={{position: 'absolute', inset: 0}} />

        {/* 右侧面板（14s 起） */}
        <div style={{position: 'absolute', left: 1020, top: 286, opacity: restOp}}>
          <Pop startFrame={435}>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.white, letterSpacing: 3}}>
              轻食销售额
            </div>
          </Pop>
          <Pop startFrame={450} slideY={30} style={{display: 'flex', alignItems: 'flex-end', marginTop: 10}}>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 128,
                color: C.yellow,
                lineHeight: 1.05,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {FMT.lightFoodSales}
            </div>
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.white, marginLeft: 14, marginBottom: 20}}>
              万元
            </div>
          </Pop>

          {/* 占比条：去年 vs 今年 */}
          <Pop startFrame={465} style={{marginTop: 34}}>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.gray, letterSpacing: 3, marginBottom: 12}}>
              品类占比
            </div>
          </Pop>

          {[
            {label: '去年同期', val: M.lightFoodSharePrev, fmt: FMT.sharePrev, color: C.blue, w: 380 * (M.lightFoodSharePrev / M.lightFoodShareNow), start: 465},
            {label: '今年', val: M.lightFoodShareNow, fmt: FMT.shareNow, color: C.orange, w: 380, start: 480},
          ].map((row) => {
            const grow = interpolate(frame, [row.start, row.start + 26], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            });
            return (
              <div key={row.label} style={{display: 'flex', alignItems: 'center', marginTop: 18}}>
                <Pop startFrame={row.start}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 42,
                      color: C.white,
                      width: 210,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.label}
                  </div>
                </Pop>
                <div
                  style={{
                    width: row.w * grow,
                    height: 58,
                    background: row.color,
                    borderRadius: 12,
                    opacity: row.label === '去年同期' ? 0.42 : 1,
                  }}
                />
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 52,
                    color: C.white,
                    marginLeft: 26,
                    fontVariantNumeric: 'tabular-nums',
                    opacity: interpolate(frame, [row.start, row.start + 8], [0, 1], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    }),
                  }}
                >
                  {row.fmt}
                </div>
              </div>
            );
          })}
        </div>
      </Camera>
    </AbsoluteFill>
  );
};
