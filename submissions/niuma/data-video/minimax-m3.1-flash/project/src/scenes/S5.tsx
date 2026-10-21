import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C, FONT, SAFE_X, SAFE_Y} from '../theme';
import {CountUp, GrowBar, ParallaxBg, Push, SpringIn, Sticker, WipeIn, fmt} from '../motion';
import * as D from '../data';

const BOX = {left: SAFE_X, top: SAFE_Y, width: 1920 - SAFE_X * 2, height: 1080 - SAFE_Y * 2};

// =====================================================================
// S5 · 渠道（11.0s–14.0s，90 帧）
// 讲：外卖贡献了 58.3% 的增量，已经占到销售额的一半以上
// 手法：整条堆叠条从左向右生长 + 数字滚动 + 下坠箭头 + 分层视差推镜
// 版式：上条形（占比）下双卡（增量），纵向三段，互不重叠
// =====================================================================
export const S5: React.FC = () => {
  const store = D.CHANNELS.find((c) => c.name === '门店')!;
  const wm = D.CHANNELS.find((c) => c.name === '外卖')!;

  // 全片统一的安全区宽度：1920 - 2*96 = 1728
  const BARW = 1728;
  const storeW = (store.share / 100) * BARW;
  const wmW = BARW - storeW;

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={8} />
      <Push from={1.045} to={1.0}>
        <AbsoluteFill
          style={{
            padding: `${BOX.top + 10}px ${BOX.left}px`,
            flexDirection: 'column',
          }}
        >
          <SpringIn delay={2} from={38}>
            <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
              <Sticker color={C.yellow} tilt={-2} style={{padding: '10px 28px'}}>
                <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.ink}}>渠道</div>
              </Sticker>
              <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 52, color: C.white, letterSpacing: 1}}>
                外卖贡献了 {fmt(wm.contrib, 1)}% 的增量
              </div>
            </div>
          </SpringIn>

          {/* ---- 占比堆叠条：整条一次性从左生长 ---- */}
          <div style={{position: 'relative', height: 176, marginTop: 46}}>
            <div style={{position: 'absolute', left: 0, top: 0, display: 'flex', height: 176}}>
              <GrowBar
                width={storeW}
                height={176}
                color={C.gray}
                delay={10}
                duration={28}
                radius={34}
                glow={false}
                style={{borderRight: 'none'}}
              />
              <GrowBar
                width={wmW}
                height={176}
                color={C.orange}
                delay={10}
                duration={28}
                radius={34}
              />
            </div>

            {/* 门店标签：贴在灰色段内 */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 22,
                width: storeW,
                textAlign: 'center',
              }}
            >
              <SpringIn delay={20} from={18}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.ink}}>门店</div>
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center'}}>
                  <CountUp
                    to={store.share}
                    delay={24}
                    duration={24}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.ink}}
                  />
                  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.ink, marginLeft: 2}}>%</span>
                </div>
              </SpringIn>
            </div>

            {/* 外卖标签：贴在橙色段内 */}
            <div
              style={{
                position: 'absolute',
                left: storeW,
                top: 22,
                width: wmW,
                textAlign: 'center',
              }}
            >
              <SpringIn delay={26} from={18}>
                <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 40, color: C.ink}}>外卖</div>
                <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center'}}>
                  <CountUp
                    to={wm.share}
                    delay={30}
                    duration={24}
                    decimals={1}
                    style={{fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.ink}}
                  />
                  <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.ink, marginLeft: 2}}>%</span>
                </div>
              </SpringIn>
            </div>
          </div>

          <SpringIn delay={38} from={22}>
            <div
              style={{
                marginTop: 12,
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 38,
                color: C.gray,
                letterSpacing: 1,
              }}
            >
              占第三季度总销售额的比例
            </div>
          </SpringIn>

          {/* ---- 增量双卡 ---- */}
          <div style={{display: 'flex', gap: 44, marginTop: 40}}>
            {[
              {n: wm.name, v: wm.delta, g: wm.growth, color: C.orange, hot: true},
              {n: store.name, v: store.delta, g: store.growth, color: C.blue, hot: false},
            ].map((c, i) => (
              <Sticker
                key={c.n}
                color={C.ink}
                tilt={i === 0 ? -2 : 1.5}
                style={{
                  flex: 1,
                  padding: '22px 40px 26px',
                  backgroundColor: C.ink,
                  border: `6px solid ${c.color}`,
                  boxShadow: `0 0 ${c.hot ? 44 : 18}px ${c.color}${c.hot ? '55' : '2a'}, 0 10px 0 ${C.ink}`,
                }}
              >
                <SpringIn delay={44 + i * 9} from={26}>
                  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 38, color: C.gray}}>
                    {c.n} · 环比增量
                  </div>
                  <div style={{display: 'flex', alignItems: 'baseline', marginTop: 2}}>
                    <CountUp
                      to={c.v}
                      delay={48 + i * 9}
                      duration={22}
                      decimals={1}
                      style={{fontFamily: FONT, fontWeight: 900, fontSize: 82, color: c.color}}
                    />
                    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 38, color: c.color, marginLeft: 8}}>
                      万元
                    </span>
                    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.white, marginLeft: 26}}>
                      +{fmt(c.g, 1)}%
                    </span>
                  </div>
                </SpringIn>
              </Sticker>
            ))}
          </div>
        </AbsoluteFill>
      </Push>
      <WipeIn duration={14} color={C.orange} />
    </AbsoluteFill>
  );
};