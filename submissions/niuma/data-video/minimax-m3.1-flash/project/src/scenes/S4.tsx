import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SAFE_X, SAFE_Y} from '../theme';
import {CountUp, GrowBar, ParallaxBg, Push, SpringIn, Sticker, Sweep, WipeIn, fmt} from '../motion';
import * as D from '../data';

const BOX = {left: SAFE_X, top: SAFE_Y, width: 1920 - SAFE_X * 2, height: 1080 - SAFE_Y * 2};

// =====================================================================
// S4 · 引擎（8.0s–11.0s，90 帧）
// 讲：华北是唯一显著跑赢的大区，+61.3%，扛下近四成增量
// 手法：焦点贴纸 + 对照条形生长 + 数字滚动 + 扫光 + 分层视差推镜
// 版式：上半屏焦点卡（华北），下半屏四条对照条
// =====================================================================
export const S4: React.FC = () => {
  const data = D.REGIONS;
  const max = Math.max(...data.map((r) => r.growth));
  const top = data[0];
  const rest = data.slice(1);
  const BAR_MAX = 620;

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={6} />
      <Push from={1.0} to={1.045}>
        <AbsoluteFill
          style={{
            padding: `${BOX.top + 10}px ${BOX.left}px`,
            flexDirection: 'column',
          }}
        >
          <SpringIn delay={2} from={38}>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <Sticker color={C.blue} tilt={-2} style={{padding: '10px 28px'}}>
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.ink}}>引擎</div>
              </Sticker>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.white}}>
                华北一个区，扛下近四成增量
              </div>
            </div>
          </SpringIn>

          {/* ---- 焦点卡：华北 ---- */}
          <SpringIn delay={8} from={48}>
            <Sticker
              color={C.orange}
              tilt={-1.2}
              style={{
                marginTop: 34,
                padding: '28px 44px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 40,
              }}
            >
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 112,
                  color: C.ink,
                  letterSpacing: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                华北
              </div>
              <div style={{width: 6, height: 148, backgroundColor: C.ink, borderRadius: 3}} />
              <div>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, color: C.ink, letterSpacing: 2}}>
                  销售额环比
                </div>
                <div style={{display: 'flex', alignItems: 'baseline'}}>
                  <CountUp
                    to={top.growth}
                    delay={14}
                    duration={22}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 124, color: C.ink}}
                  />
                  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 58, color: C.ink, marginLeft: 4}}>%</span>
                </div>
              </div>
              <div style={{width: 6, height: 148, backgroundColor: C.ink, borderRadius: 3}} />
              <div>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, color: C.ink, letterSpacing: 2}}>
                  增量贡献
                </div>
                <div style={{display: 'flex', alignItems: 'baseline'}}>
                  <CountUp
                    to={top.contrib}
                    delay={20}
                    duration={22}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 124, color: C.ink}}
                  />
                  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 58, color: C.ink, marginLeft: 4}}>%</span>
                </div>
              </div>
              <div style={{width: 6, height: 148, backgroundColor: C.ink, borderRadius: 3}} />
              <div>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, color: C.ink, letterSpacing: 2}}>
                  环比增量
                </div>
                <div style={{display: 'flex', alignItems: 'baseline'}}>
                  <CountUp
                    to={top.delta}
                    delay={26}
                    duration={22}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 108, color: C.ink}}
                  />
                  <span
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      fontSize: 44,
                      color: C.ink,
                      marginLeft: 8,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    万元
                  </span>
                </div>
              </div>
            </Sticker>
          </SpringIn>

          {/* ---- 对照：其余四个大区 ---- */}
          <div style={{marginTop: 44, display: 'flex', flexDirection: 'column', gap: 26}}>
            {rest.map((r, i) => (
              <div key={r.name} style={{display: 'flex', alignItems: 'center', gap: 26}}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 46,
                    color: C.gray,
                    width: 150,
                    textAlign: 'right',
                  }}
                >
                  {r.name}
                </div>
                <GrowBar
                  width={(r.growth / max) * BAR_MAX}
                  height={56}
                  color={C.blue}
                  delay={32 + i * 8}
                  duration={24}
                  glow={false}
                />
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 900,
                    fontSize: 52,
                    color: C.blue,
                    width: 190,
                    whiteSpace: 'nowrap',
                  }}
                >
                  +{fmt(r.growth, 1)}%
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 40,
                    color: C.gray,
                    whiteSpace: 'nowrap',
                  }}
                >
                  增量 {fmt(r.delta, 1)} 万元
                </div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </Push>
      <WipeIn duration={14} color={C.blue} />
      <Sweep delay={12} length={22} opacity={0.4} />
    </AbsoluteFill>
  );
};