import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SAFE_X, SAFE_Y} from '../theme';
import {CountUp, ParallaxBg, Push, SpringIn, Sticker, WipeIn, fmt} from '../motion';
import * as D from '../data';

const BOX = {left: SAFE_X, top: SAFE_Y, width: 1920 - SAFE_X * 2, height: 1080 - SAFE_Y * 2};

// =====================================================================
// S8 · 结论（23.0s–27.0s，120 帧）
// 三条结论，每条落在一个小节第一拍上（23.0 / 24.0 / 25.0 秒）
// 手法：编号贴纸弹入 + 数字滚动 + 斜切色块推进 + 分层视差
// =====================================================================
const CONCLUSIONS = [
  {
    n: '01',
    t: '总量创新高',
    d: `${fmt(D.YOY.sales, 1)}%`,
    s: '同比增速',
    c: C.orange,
  },
  {
    n: '02',
    t: '华北跑出来',
    d: `${fmt(D.REGIONS[0].contrib, 1)}%`,
    s: '增量贡献',
    c: C.blue,
  },
  {
    n: '03',
    t: '毛利率承压',
    d: `${fmt(D.MARGIN_DELTA_PP, 1)}pp`,
    s: '环比变化',
    c: C.yellow,
  },
];

export const S8: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.ink}}>
    <ParallaxBg seed={14} />
    <Push from={1.0} to={1.035}>
      <AbsoluteFill
        style={{
          padding: `${BOX.top + 6}px ${BOX.left}px`,
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <SpringIn delay={2} from={36}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 26}}>
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 68, color: C.white, letterSpacing: 6}}>
              这个季度，三句话
            </div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.gray}}>
              2026 Q3
            </div>
          </div>
        </SpringIn>

        <div style={{display: 'flex', flexDirection: 'column', gap: 34, marginTop: 48}}>
          {CONCLUSIONS.map((c, i) => (
            <SpringIn key={c.n} delay={12 + i * 30} from={60}>
              <div style={{display: 'flex', alignItems: 'center', gap: 36}}>
                {/* 编号贴纸 */}
                <Sticker
                  color={c.c}
                  tilt={i === 1 ? -2.5 : 2}
                  style={{
                    padding: '12px 34px',
                    width: 172,
                    textAlign: 'center',
                    boxShadow: `0 10px 0 ${C.ink}, 0 0 40px ${c.c}55`,
                  }}
                >
                  <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 66, color: C.ink}}>{c.n}</div>
                </Sticker>

                {/* 结论文字 */}
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 74, color: C.white, width: 460}}>
                  {c.t}
                </div>

                {/* 斜切色块 + 数字 */}
                <Sticker color={C.ink} tilt={i === 0 ? -1.5 : 1.2} style={{padding: '12px 36px 16px', flex: 1, display: 'flex', alignItems: 'baseline', gap: 20, backgroundColor: C.ink, border: `6px solid ${c.c}`, boxShadow: `0 10px 0 ${C.ink}`}}>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.gray}}>{c.s}</div>
                  <CountUp
                    to={parseFloat(c.d)}
                    delay={20 + i * 30}
                    duration={20}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 82, color: c.c}}
                  />
                  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 48, color: c.c}}>
                    {c.d.endsWith('pp') ? 'pp' : '%'}
                  </span>
                </Sticker>
              </div>
            </SpringIn>
          ))}
        </div>
      </AbsoluteFill>
    </Push>
    <WipeIn duration={14} color={C.blue} />
  </AbsoluteFill>
);