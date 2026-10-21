import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SAFE_X, SAFE_Y} from '../theme';
import {
  Arrow,
  CountUp,
  GrowBar,
  ParallaxBg,
  Push,
  SpringIn,
  Sticker,
  WipeIn,
  fmt,
  useBeatPulse,
} from '../motion';
import * as D from '../data';

const BOX = {left: SAFE_X, top: SAFE_Y, width: 1920 - SAFE_X * 2, height: 1080 - SAFE_Y * 2};

// =====================================================================
// S6 · 转折（14.0s–18.0s，120 帧）
// 讲：销售额涨了，毛利率却从 55.9% 掉到 54.2%；原因是外卖占比从 49.3% 升到 53.0%
// 手法：焦点贴纸 + 数字滚动 + 下坠箭头 + 对照条生长 + 分层视差推镜
// 版式：上下两段，各段内部用两列排布，全部落在 5% 安全区内
// =====================================================================
export const S6: React.FC = () => {
  const pulse = useBeatPulse(0);
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={10} />
      <Push from={1.0} to={1.04}>
        <AbsoluteFill
          style={{
            padding: `${BOX.top + 10}px ${BOX.left}px`,
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* ---- 标题 ---- */}
          <SpringIn delay={2} from={36}>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <Sticker color={C.gray} tilt={-1.5} style={{padding: '10px 28px'}}>
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.ink}}>转折</div>
              </Sticker>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.white}}>
                销售额涨了，毛利率却掉了
              </div>
            </div>
          </SpringIn>

          {/* ---- 主对比：Q2 毛利率 → Q3 毛利率 ---- */}
          <div
            style={{
              marginTop: 46,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 56,
            }}
          >
            {/* Q2 基准 */}
            <SpringIn delay={8} from={40}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.gray, letterSpacing: 2}}>
                  第二季度
                </div>
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 116, color: C.gray}}>
                  {fmt(D.Q2.margin, 1)}%
                </div>
              </div>
            </SpringIn>

            {/* 下坠箭头 + 差值 */}
            <SpringIn delay={16} from={0}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
                <Arrow color={C.orange} size={54} rotate={90} />
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.orange, whiteSpace: 'nowrap'}}>
                  {fmt(D.MARGIN_DELTA_PP, 1)}pp
                </div>
              </div>
            </SpringIn>

            {/* Q3 焦点 */}
            <SpringIn delay={12} from={40}>
              <Sticker color={C.orange} tilt={2} style={{padding: '18px 46px 24px', scale: `${1 + pulse * 0.02}`}}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.ink}}>
                  第三季度毛利率
                </div>
                <div style={{display: 'flex', alignItems: 'baseline'}}>
                  <CountUp
                    to={D.Q3.margin}
                    delay={18}
                    duration={28}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 172, color: C.ink}}
                  />
                  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 72, color: C.ink, marginLeft: 4}}>%</span>
                </div>
              </Sticker>
            </SpringIn>
          </div>

          {/* ---- 归因：外卖占比上行 ---- */}
          <SpringIn delay={44} from={30}>
            <div
              style={{
                marginTop: 52,
                padding: '26px 36px 30px',
                border: `5px solid ${C.blue}`,
                borderRadius: 34,
                backgroundColor: `${C.blue}12`,
                display: 'flex',
                alignItems: 'center',
                gap: 34,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 44,
                  color: C.white,
                  width: 300,
                  whiteSpace: 'nowrap',
                }}
              >
                外卖销售占比
              </div>

              {/* 4 月 */}
              <div style={{display: 'flex', alignItems: 'center', gap: 18, flex: 1}}>
                <GrowBar
                  width={300}
                  height={50}
                  color={C.gray}
                  delay={50}
                  duration={24}
                  glow={false}
                />
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 50,
                    color: C.gray,
                    width: 130,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmt(D.WAIMAI_SHARE_APR, 1)}%
                </div>
              </div>

              <SpringIn delay={56} from={0}>
                <Arrow color={C.orange} size={44} rotate={0} />
              </SpringIn>

              {/* 9 月 */}
              <div style={{display: 'flex', alignItems: 'center', gap: 18, flex: 1}}>
                <GrowBar
                  width={322}
                  height={50}
                  color={C.orange}
                  delay={60}
                  duration={24}
                />
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 50,
                    color: C.orange,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fmt(D.WAIMAI_SHARE_SEP, 1)}%
                </div>
              </div>
            </div>
          </SpringIn>

          <SpringIn delay={70} from={24}>
            <div
              style={{
                marginTop: 30,
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 50,
                color: C.yellow,
                textAlign: 'center',
                letterSpacing: 2,
              }}
            >
              冲量靠外卖，赚钱还是靠门店
            </div>
          </SpringIn>
        </AbsoluteFill>
      </Push>
      <WipeIn duration={16} color={C.gray} />
    </AbsoluteFill>
  );
};