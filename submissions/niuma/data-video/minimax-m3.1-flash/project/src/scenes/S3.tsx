import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SAFE_X, SAFE_Y} from '../theme';
import {Arrow, DrawLine, GrowColumn, ParallaxBg, Push, SpringIn, Sticker, WipeIn, fmt} from '../motion';
import * as D from '../data';

const BOX = {left: SAFE_X, top: SAFE_Y, width: 1920 - SAFE_X * 2, height: 1080 - SAFE_Y * 2};

// =====================================================================
// S3 · 节奏（5.0s–8.0s，90 帧）
// 讲：7 月冲上 2656.2 万后连续两个月回落，9 月已低于 6 月
// 手法：柱状图生长 + 折线画出 + 数值滚动 + 下坠箭头 + 分层视差推镜
// 版式：左图右注，两栏互不重叠
// =====================================================================
export const S3: React.FC = () => {
  const data = D.MONTHLY;
  const max = Math.max(...data.map((m) => m.s));
  const CH_H = 372;
  const colW = 168;
  const gap = 40;
  const step = colW + gap;

  // 折线走在柱顶上方 34px 处，不压数值标签
  const pts = data.map((m, i) => ({
    x: i * step + colW / 2,
    y: CH_H - (m.s / max) * CH_H - 34,
  }));

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={4} />
      <Push from={1.04} to={1.0}>
        <AbsoluteFill
          style={{
            padding: `${BOX.top + 10}px ${BOX.left}px`,
            flexDirection: 'column',
          }}
        >
          <SpringIn delay={2} from={40}>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <Sticker color={C.yellow} tilt={-2} style={{padding: '10px 28px'}}>
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.ink}}>节奏</div>
              </Sticker>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.white, letterSpacing: 1}}>
                7 月冲高之后，连跌两个月
              </div>
            </div>
          </SpringIn>

          <div style={{display: 'flex', gap: 56, marginTop: 40, alignItems: 'flex-start'}}>
            {/* ---------------- 左：柱状图 + 折线 ---------------- */}
            <div style={{position: 'relative', width: step * data.length - gap, height: CH_H + 108}}>
              {/* 柱 */}
              <div style={{display: 'flex', alignItems: 'flex-end', height: CH_H, gap}}>
                {data.map((m, i) => (
                  <GrowColumn
                    key={m.m}
                    w={colW}
                    h={(m.s / max) * CH_H}
                    color={m.q3 ? (i === 3 ? C.orange : C.blue) : C.gray}
                    delay={8 + i * 6}
                    duration={22}
                    glow={m.q3}
                  />
                ))}
              </div>

              {/* 折线：走在柱顶上方 */}
              <div style={{position: 'absolute', left: 0, top: 0}}>
                <DrawLine points={pts} color={C.yellow} width={9} delay={32} duration={26} />
              </div>

              {/* 数值 + 月份：数值贴在柱顶内侧，月份落在基线下方 */}
              {data.map((m, i) => (
                <React.Fragment key={m.m}>
                  <div
                    style={{
                      position: 'absolute',
                      left: i * step,
                      top: CH_H - (m.s / max) * CH_H + 16,
                      width: colW,
                      textAlign: 'center',
                    }}
                  >
                    <SpringIn delay={14 + i * 6} from={16}>
                      <div
                        style={{
                          fontFamily: FONT,
                          fontWeight: 900,
                          fontSize: 36,
                          color: C.white,
                          textShadow: `0 3px 0 ${C.ink}`,
                        }}
                      >
                        {fmt(m.s, 1)}
                      </div>
                    </SpringIn>
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      left: i * step,
                      top: CH_H + 16,
                      width: colW,
                      textAlign: 'center',
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 32,
                      color: m.q3 ? C.orange : C.gray,
                    }}
                  >
                    {m.m}
                  </div>
                </React.Fragment>
              ))}

              {/* 基线 */}
              <div
                style={{
                  position: 'absolute',
                  left: -8,
                  top: CH_H,
                  width: step * data.length - gap + 16,
                  height: 5,
                  backgroundColor: C.gray,
                  opacity: 0.55,
                }}
              />
            </div>

            {/* ---------------- 右：注解栏 ---------------- */}
            <div style={{flex: 1, paddingTop: 18}}>
              <SpringIn delay={40} from={34}>
                <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                  <Arrow color={C.orange} size={46} rotate={112} />
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 42, color: C.white, lineHeight: 1.25}}>
                    9 月跌回
                    <br />
                    起点附近
                  </div>
                </div>
              </SpringIn>

              <SpringIn delay={52} from={30}>
                <Sticker color={C.orange} tilt={-3} style={{padding: '12px 28px', marginTop: 30}}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontWeight: 900,
                      fontSize: 68,
                      color: C.ink,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {D.JUL_TO_SEP}%
                  </div>
                </Sticker>
              </SpringIn>

              <SpringIn delay={62} from={24}>
                <div
                  style={{
                    marginTop: 28,
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: 40,
                    color: C.yellow,
                    lineHeight: 1.35,
                  }}
                >
                  7 月 {fmt(D.JUL_WAN, 1)} 万元
                  <br />
                  9 月 {fmt(D.SEP_WAN, 1)} 万元
                  <br />
                  <span style={{color: C.gray, fontSize: 36}}>已低于 6 月</span>
                </div>
              </SpringIn>
            </div>
          </div>
        </AbsoluteFill>
      </Push>
      <WipeIn duration={14} color={C.orange} />
    </AbsoluteFill>
  );
};