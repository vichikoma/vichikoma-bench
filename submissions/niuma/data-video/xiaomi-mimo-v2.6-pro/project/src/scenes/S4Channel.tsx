import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, FONT} from '../theme';
import {Camera, Pop, RollingNumber, Sticker} from '../components/kit';
import {FMT, M} from '../data';

/* ============================================================
   S4 · 渠道结构  18–24s（540–720 帧）
   数字：52.1% / 47.9% / +54.0% / +8.9%
   ============================================================ */

const BAR_X = 240;
const BAR_W = 1440;
const BAR_Y = 430;
const BAR_H = 280;

export const S4Channel: React.FC = () => {
  const frame = useCurrentFrame();

  // 百分比堆叠条自中心生长
  const grow = interpolate(frame, [540, 585], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const labelOp = interpolate(frame, [555, 570], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const leftW = BAR_W * (M.deliveryShare / 100);
  const rightW = BAR_W * (M.storeShare / 100);

  return (
    <AbsoluteFill>
      <Camera
        startFrame={540}
        endFrame={720}
        from={{scale: 1, x: -30, y: 0}}
        to={{scale: 1.04, x: 30, y: -10}}
      >
        <div style={{position: 'absolute', left: 150, top: 190}}>
          <Pop startFrame={540}>
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 88, color: C.white, letterSpacing: 5}}>
              外卖<span style={{color: C.orange}}>首次反超</span>门店
            </div>
          </Pop>
          <Pop startFrame={555} slideY={26}>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 46,
                color: C.gray,
                marginTop: 18,
                letterSpacing: 3,
              }}
            >
              第三季度销售额渠道占比
            </div>
          </Pop>
        </div>

        {/* 堆叠条（外卖 冰蓝 / 门店 燃橙） */}
        <div
          style={{
            position: 'absolute',
            left: BAR_X,
            top: BAR_Y,
            width: BAR_W,
            height: BAR_H,
            display: 'flex',
            transform: `scaleX(${grow})`,
            transformOrigin: '50% 50%',
            borderRadius: 26,
            overflow: 'hidden',
            border: `6px solid ${C.navy}`,
            boxShadow: `16px 16px 0 ${C.navy}66`,
          }}
        >
          <div style={{width: leftW, background: C.blue, height: '100%'}} />
          <div style={{width: rightW, background: C.orange, height: '100%'}} />
        </div>

        {/* 段内标签 */}
        <div style={{position: 'absolute', left: BAR_X + 40, top: BAR_Y + 36, width: leftW - 80, opacity: labelOp}}>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 54, color: C.navy, letterSpacing: 6}}>外卖</div>
          <RollingNumber
            startFrame={555}
            duration={30}
            value={M.deliveryShare}
            decimals={1}
            suffix="%"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 132,
              color: C.navy,
              lineHeight: 1.15,
            }}
          />
        </div>
        <div style={{position: 'absolute', left: BAR_X + leftW + 40, top: BAR_Y + 36, width: rightW - 80, opacity: labelOp}}>
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 54, color: C.navy, letterSpacing: 6}}>门店</div>
          <RollingNumber
            startFrame={555}
            duration={30}
            value={M.storeShare}
            decimals={1}
            suffix="%"
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 132,
              color: C.navy,
              lineHeight: 1.15,
            }}
          />
        </div>

        {/* 同比贴纸 */}
        <Pop startFrame={600} slideY={40} style={{position: 'absolute', left: BAR_X + 60, top: BAR_Y + BAR_H + 62}}>
          <Sticker bg={C.navy} fg={C.white} fontSize={56} rotate={-1.2} style={{borderColor: C.blue, boxShadow: `10px 10px 0 ${C.blue}66`}}>
            同比 {FMT.deliveryYoy}
          </Sticker>
        </Pop>
        <Pop startFrame={615} slideY={40} style={{position: 'absolute', left: BAR_X + leftW + 60, top: BAR_Y + BAR_H + 62}}>
          <Sticker bg={C.navy} fg={C.white} fontSize={56} rotate={1.2} style={{borderColor: C.orange, boxShadow: `10px 10px 0 ${C.orange}66`}}>
            同比 {FMT.storeYoy}
          </Sticker>
        </Pop>
      </Camera>
    </AbsoluteFill>
  );
};
