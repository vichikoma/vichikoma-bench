import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {C, CUTS, FONT, FONT_HEAVY, SAFE_X, SAFE_Y, sticker} from './theme';
import {
  Arrow,
  CountUp,
  DrawLine,
  GrowBar,
  GrowColumn,
  ParallaxBg,
  Push,
  SpringIn,
  Sticker,
  Sweep,
  WipeIn,
  fmt,
  useBeatPulse,
} from './motion';
import * as D from './data';

export {S3} from './scenes/S3';
export {S4} from './scenes/S4';
export {S5} from './scenes/S5';
export {S6} from './scenes/S6';
export {S8} from './scenes/S8';

/** 场景内容安全框：四边 5% 边距内的可用区 */
const BOX = {
  left: SAFE_X,
  top: SAFE_Y,
  width: 1920 - SAFE_X * 2,
  height: 1080 - SAFE_Y * 2,
};

// =====================================================================
// S1 · 片头（0.0s–2.0s，60 帧）
// 手法：斜切遮罩揭开 + 品牌名贴纸甩入 + 扫光 + 节拍脉冲
// =====================================================================
export const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = useBeatPulse(0);
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <SpringIn delay={2} from={70}>
          <div
            style={{
              ...sticker(C.white, 168, 10),
              rotate: '-3deg',
              scale: `${1 + pulse * 0.035}`,
            }}
          >
            牛马咖啡
          </div>
        </SpringIn>
        <SpringIn delay={12} from={34}>
          <div
            style={{
              marginTop: 34,
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              rotate: '1.5deg',
            }}
          >
            <Sticker color={C.orange} tilt={-2} style={{padding: '14px 40px'}}>
              <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 62, color: C.ink, letterSpacing: 2}}>
                2026 Q3
              </div>
            </Sticker>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 60,
                color: C.yellow,
                letterSpacing: 4,
              }}
            >
              经营速报
            </div>
          </div>
        </SpringIn>
      </AbsoluteFill>
      <WipeIn duration={12} color={C.orange} />
      <Sweep delay={14} length={20} opacity={0.55} />
    </AbsoluteFill>
  );
};

// =====================================================================
// S2 · 大盘（2.0s–5.0s，90 帧）★ 高潮帧
// 手法：数字滚动 + 镜头缓推 + 节拍脉冲 + 三张对比贴纸生长
// 主数字 6902.5 万元占画面高度 1/4 以上 → 唯一焦点
// =====================================================================
export const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = useBeatPulse(6);
  const ring = interpolate(frame, [0, 100], [520, 1380], {
    extrapolateRight: 'extend',
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });

  const cards = [
    {label: '同比', value: D.YOY.sales, suffix: '%', color: C.yellow},
    {label: '环比', value: D.QOQ.sales, suffix: '%', color: C.blue},
    {label: '毛利', value: D.Q3.grossWan, suffix: '万元', color: C.white, small: true},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={2} />
      <Push from={1.0} to={1.05}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          {/* 脉冲光环：与音乐节拍联动，踩拍扩散 */}
          <div
            style={{
              position: 'absolute',
              left: 960 - ring / 2,
              top: 430 - ring / 2,
              width: ring,
              height: ring,
              borderRadius: '50%',
              border: `4px solid ${C.orange}`,
              opacity: (1 - ring / 1380) * 0.5,
            }}
          />
          <SpringIn delay={2} from={40}>
            <Sticker color={C.white} tilt={-2} style={{padding: '12px 40px'}}>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 56,
                  color: C.ink,
                  letterSpacing: 8,
                }}
              >
                第三季度总销售额
              </div>
            </Sticker>
          </SpringIn>

          {/* 唯一焦点：巨号数字 */}
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              alignItems: 'baseline',
              scale: `${1 + pulse * 0.022}`,
            }}
          >
            <CountUp
              to={D.Q3.salesWan}
              delay={6}
              duration={30}
              decimals={1}
              style={{
                fontFamily: FONT, fontWeight: 900,
                fontSize: 300,
                color: C.white,
                letterSpacing: -6,
                textShadow: `0 10px 0 ${C.ink}, 0 0 70px ${C.orange}66`,
              }}
            />
            <div
              style={{
                fontFamily: FONT, fontWeight: 900,
                fontSize: 92,
                color: C.orange,
                marginLeft: 18,
              }}
            >
              万元
            </div>
          </div>

          {/* 三张对比贴纸，逐个弹入 */}
          <div style={{display: 'flex', gap: 34, marginTop: 34}}>
            {cards.map((c, i) => (
              <Sticker
                key={c.label}
                color={C.ink}
                tilt={i === 0 ? -3 : i === 1 ? 2.5 : -1}
                style={{
                  padding: '18px 40px 20px',
                  backgroundColor: C.ink,
                  border: `6px solid ${c.color}`,
                  boxShadow: `0 0 34px ${c.color}44, 0 10px 0 ${C.ink}`,
                  minWidth: 300,
                  textAlign: 'center',
                }}
              >
                <SpringIn delay={16 + i * 7} from={26}>
                  <div
                    style={{
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: 38,
                      color: C.gray,
                      letterSpacing: 4,
                    }}
                  >
                    {c.label}
                  </div>
                  <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginTop: 4}}>
                    <CountUp
                      to={c.value}
                      delay={20 + i * 7}
                      duration={24}
                      decimals={1}
                      style={{fontFamily: FONT, fontWeight: 900, fontSize: c.small ? 66 : 84, color: c.color}}
                    />
                    <span style={{fontFamily: FONT, fontWeight: 900, fontSize: 38, color: c.color, marginLeft: 6}}>{c.suffix}</span>
                  </div>
                </SpringIn>
              </Sticker>
            ))}
          </div>
        </AbsoluteFill>
      </Push>
      <WipeIn duration={14} color={C.blue} />
      <Sweep delay={6} length={24} opacity={0.5} />
    </AbsoluteFill>
  );
};

// =====================================================================
// S3 · 节奏（5.0s–8.0s，90 帧）
// 讲：7 月冲上 2656.2 万后连续两个月回落，9 月已低于 6 月
// 手法：柱状图生长 + 折线画出 + 箭头标注 + 分层视差推镜
// =====================================================================
// S4 · 华北引擎（8.0s–11.0s，90 帧）
// 讲：华北是唯一显著跑赢的大区，+61.3%，贡献近四成增量
// 手法：横向条形生长排序 + 数字滚动 + 高亮描边 + 节拍脉冲
// =====================================================================
// S5 · 渠道（11.0s–14.0s，90 帧）
// 讲：外卖贡献了 58.3% 的增量，已经占到销售额一半以上
// 手法：分割条形从中间向两侧推开 + 数字滚动 + 箭头
// =====================================================================
// S6 · 毛利率转折（14.0s–18.0s，120 帧）
// 讲：销售额涨了，毛利率却从 55.9% 掉到 54.2%，外卖占比从 49.3% 升到 53.0%
// 手法：斜切色块压入 + 数字滚动 + 下坠箭头 + 冷暖色对比（唯一一次用雾灰/警示橙）
// =====================================================================
// S7 · 高潮帧（18.0s–23.0s，150 帧）
// 把最重要的结论放大成画面唯一焦点：同比 +37.1%
// 手法：整层强推 + 数字巨滚 + 径向爆闪 + 节拍粒子 + 品牌名贴纸
// =====================================================================
export const S7: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = useBeatPulse(0);
  const flash = interpolate(frame, [0, 10, 26], [0.9, 0, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const push = interpolate(frame, [0, 150], [1.16, 1.0], {
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // 踩拍粒子：每一拍甩出一圈圆点
  const beatIdx = Math.floor(frame / 15);
  const sinceBeat = frame - beatIdx * 15;

  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={12} />
      {/* 爆闪底光 */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 760px at 50% 46%, ${C.orange}55 0%, rgba(11,16,38,0) 68%)`,
          opacity: flash + pulse * 0.25,
        }}
      />
      <AbsoluteFill style={{scale: `${push}`}}>
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', flexDirection: 'column'}}>
          <SpringIn delay={2} from={30}>
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 76,
                color: C.white,
                letterSpacing: 16,
                rotate: '-2deg',
              }}
            >
              同比大涨
            </div>
          </SpringIn>

          {/* 唯一焦点 */}
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'baseline',
              scale: `${1 + pulse * 0.03}`,
              filter: `drop-shadow(0 0 ${40 + pulse * 50}px ${C.orange})`,
            }}
          >
            <CountUp
              to={D.YOY.sales}
              delay={4}
              duration={34}
              decimals={1}
              style={{
                fontFamily: FONT, fontWeight: 900,
                fontSize: 460,
                color: C.yellow,
                letterSpacing: -10,
                WebkitTextStroke: `10px ${C.ink}`,
                paintOrder: 'stroke fill',
              }}
            />
            <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 170, color: C.yellow, marginLeft: 10, WebkitTextStroke: `9px ${C.ink}`, paintOrder: 'stroke fill'}}>
              %
            </div>
          </div>

          <SpringIn delay={26} from={30}>
            <Sticker color={C.blue} tilt={-2.5} style={{padding: '16px 46px', marginTop: 26}}>
              <div style={{fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.ink, letterSpacing: 2}}>
                Q3 销售额 {fmt(D.Q3.salesWan, 1)} 万元 · 历史同期最高
              </div>
            </Sticker>
          </SpringIn>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* 踩拍粒子环 */}
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        {Array.from({length: 20}, (_, i) => {
          const a = (i / 20) * Math.PI * 2 + beatIdx * 0.22;
          const r = 340 + sinceBeat * 26;
          return (
            <div
              key={`${beatIdx}-${i}`}
              style={{
                position: 'absolute',
                left: 960 + Math.cos(a) * r,
                top: 470 + Math.sin(a) * r * 0.62,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: i % 3 === 0 ? C.blue : C.orange,
                opacity: Math.max(0, 1 - sinceBeat / 15) * 0.8,
              }}
            />
          );
        })}
      </AbsoluteFill>

      <Sweep delay={4} length={26} opacity={0.6} />
      <WipeIn duration={14} color={C.yellow} />
    </AbsoluteFill>
  );
};

// =====================================================================
// S8 · 结论（23.0s–27.0s，120 帧）
// 三条结论逐条落在小节第一拍上
// =====================================================================
// S9 · 落板（27.0s–30.0s，90 帧）
// 品牌名落板 + 数据来源，与音乐末小节同时收束
// =====================================================================
export const S9: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = useBeatPulse(0);
  const out = interpolate(frame, [76, 90], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <ParallaxBg seed={16} />
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: out}}>
        <SpringIn delay={2} from={50}>
          <div
            style={{
              ...sticker(C.orange, 172, 10),
              rotate: '-2.5deg',
              scale: `${1 + pulse * 0.03}`,
            }}
          >
            牛马咖啡
          </div>
        </SpringIn>
        <SpringIn delay={14} from={26}>
          <div
            style={{
              marginTop: 38,
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 52,
              color: C.white,
              letterSpacing: 3,
            }}
          >
            2026 年第三季度经营速报
          </div>
        </SpringIn>
        <SpringIn delay={24} from={20}>
          <div
            style={{
              marginTop: 20,
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 34,
              color: C.gray,
              letterSpacing: 1,
            }}
          >
            数据来源：业务系统月度经营明细
          </div>
        </SpringIn>
      </AbsoluteFill>
      <WipeIn duration={16} color={C.orange} />
      <Sweep delay={20} length={30} opacity={0.45} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ 工具
/** 本镜头内帧号 → 相对秒（仅用于调试标注） */
function useFrameToSeconds() {
  return useCurrentFrame() / 30;
}