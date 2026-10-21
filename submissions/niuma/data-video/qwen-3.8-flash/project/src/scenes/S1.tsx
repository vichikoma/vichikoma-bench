import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Bolt, kick} from '../lib/ui';

// S1 开场（0-120）：品牌贴纸砸入 + 期间信息 + 弹幕梗
export const S1: React.FC = () => {
  const g = useCurrentFrame(); // S1 mount=0，local 即全局
  const k = kick(g);
  const camScale = interpolate(g, [0, 120], [1, 1.05]);
  const danmakuX = interpolate(g, [52, 66, 120], [1980, 1160, 1128], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${camScale})`,
        fontFamily: FONT_STACK,
      }}
    >
      {/* 品牌主卡 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 210, display: 'flex', justifyContent: 'center'}}>
        <Pop at={8} g={g}>
          <div style={{scale: `${1 + k * 0.016}`}}>
            <Sticker bg={C.orange} rotate={-3} pad="26px 70px" radius={34}>
              <span style={{fontSize: 200, fontWeight: 900, color: C.ink, letterSpacing: 10}}>
                牛马咖啡
              </span>
            </Sticker>
          </div>
        </Pop>
      </div>
      {/* 闪电双翼 */}
      <div style={{position: 'absolute', left: 210, top: 240, transform: 'rotate(-14deg)'}}>
        <Pop at={16} g={g}>
          <Bolt size={170} color={C.yellow} />
        </Pop>
      </div>
      <div style={{position: 'absolute', right: 200, top: 430, transform: 'rotate(12deg)'}}>
        <Pop at={19} g={g}>
          <Bolt size={120} color={C.blue} />
        </Pop>
      </div>
      {/* 期间副标（2026 · 第三季度）*/}
      <div style={{position: 'absolute', left: 0, right: 0, top: 560, display: 'flex', justifyContent: 'center'}}>
        <Pop at={20} g={g} rotate={-1}>
          <span
            style={{
              fontSize: 82,
              fontWeight: 900,
              color: C.white,
              textShadow: `6px 7px 0 ${RGBA.orange(0.55)}`,
              letterSpacing: 4,
            }}
          >
            2026年第三季度经营速报
          </span>
        </Pop>
      </div>
      {/* 月份贴纸（7-9月）*/}
      <div style={{position: 'absolute', left: 0, right: 0, top: 705, display: 'flex', justifyContent: 'center'}}>
        <Pop at={35} g={g} rotate={2}>
          <Sticker bg={C.blue} pad="10px 40px" radius={999}>
            <span style={{fontSize: 62, color: C.ink, fontWeight: 900}}>7-9月</span>
          </Sticker>
        </Pop>
      </div>
      {/* 弹幕梗（52 帧右飞入，全显 ≥1.5s）*/}
      <div style={{position: 'absolute', left: danmakuX, top: 850, opacity: g >= 52 ? 1 : 0}}>
        <Sticker bg={C.ink} fg={C.white} border={C.orange} bw={4} pad="10px 28px" radius={18} rotate={-2}>
          <span style={{fontSize: 42, fontWeight: 800}}>全体目光向我看齐</span>
        </Sticker>
      </div>
      {/* 底部节奏三豆 */}
      {[C.orange, C.yellow, C.blue].map((col, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 880 + i * 60,
            top: 950 - Math.max(0, Math.sin((g - i * 4) / 3.6)) * 26,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: col,
            border: `4px solid ${C.ink}`,
            opacity: g > 24 ? 1 : 0,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
