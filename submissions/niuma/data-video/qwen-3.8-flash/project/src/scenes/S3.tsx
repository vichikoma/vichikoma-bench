import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Num, kick, ramp} from '../lib/ui';

// S3 渠道（240-360）：外卖/门店分割条，分割线从 50% 弹簧过冲到 52.1%（“过半”叙事）
export const S3: React.FC = () => {
  const local = useCurrentFrame();
  const g = local + 240;
  const {fps} = useVideoConfig();
  const k = kick(g);
  const camScale = interpolate(g, [240, 360], [1, 1.05]);

  // 分割占比：从 50 起跳，弹簧过冲落在 52.1
  const sp = spring({frame: Math.max(0, g - 255), fps, config: {damping: 9, stiffness: 90, mass: 1.1}});
  const share = 50 + 2.1 * sp;
  const barIn = spring({frame: Math.max(0, g - 248), fps, config: {damping: 12, stiffness: 120}});
  const barW = 1560 * barIn;
  const arrowUp = (color: string, h: number) => (
    <svg width={h} height={h} style={{marginRight: 14}}>
      <polygon points={`${h / 2},0 ${h},${h} 0,${h}`} fill={color} stroke={C.ink} strokeWidth={h / 9} strokeLinejoin="round" />
    </svg>
  );
  return (
    <AbsoluteFill style={{transform: `scale(${camScale})`, fontFamily: FONT_STACK}}>
      {/* 标题（无数字：过半是叙述）*/}
      <div style={{position: 'absolute', left: 0, right: 0, top: 150, display: 'flex', justifyContent: 'center'}}>
        <Pop at={242} g={g} rotate={-1}>
          <span style={{fontSize: 96, fontWeight: 900, color: C.white, textShadow: `6px 7px 0 ${RGBA.blue(0.5)}`, letterSpacing: 3}}>
            外卖，已经过半
          </span>
        </Pop>
      </div>
      {/* 分割条 */}
      <div style={{position: 'absolute', left: 180, top: 400, width: barW, height: 150}}>
        <div
          style={{
            display: 'flex',
            width: 1560,
            height: 150,
            borderRadius: 30,
            border: `6px solid ${C.ink}`,
            overflow: 'hidden',
            transform: 'rotate(-1.2deg)',
            boxShadow: `0 12px 0 ${RGBA.black(0.35)}`,
            scale: `${1 + k * 0.008}`,
          }}
        >
          <div
            style={{
              width: `${share}%`,
              background: C.orange,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              minWidth: 420,
            }}
          >
            <span style={{fontSize: 64, fontWeight: 900, color: C.ink}}>外卖</span>
            <Num id="shareTo" g={g} size={78} color={C.ink} unitColor={C.ink} unitSize={48} />
          </div>
          <div
            style={{
              flex: 1,
              background: C.blue,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              minWidth: 380,
            }}
          >
            <span style={{fontSize: 64, fontWeight: 900, color: C.ink}}>门店</span>
            <Num id="shareSt" g={g} size={78} color={C.ink} unitColor={C.ink} unitSize={48} />
          </div>
        </div>
        {/* 50% 基准线 + 标签 */}
        <div
          style={{
            position: 'absolute',
            left: `${(1560 * 0.5) / 1}px`,
            top: -26,
            width: 0,
            borderLeft: `5px dashed ${C.white}`,
            height: 202,
            opacity: g >= 245 ? 1 : 0,
          }}
        />
        <div style={{position: 'absolute', left: '50%', top: -92, transform: 'translateX(-50%)'}}>
          <Pop at={245} g={g}>
            <Sticker bg={C.ink} fg={C.white} border={C.white} bw={4} radius={14} pad="6px 20px">
              <Num id="axis50" g={g} size={44} unitSize={30} color={C.white} />
            </Sticker>
          </Pop>
        </div>
      </div>
      {/* 两个同比徽章 */}
      <div style={{position: 'absolute', left: 330, top: 700, display: 'flex'}}>
        <Pop at={290} g={g} rotate={-2}>
          <Sticker bg={C.yellow} pad="12px 32px" style={{display: 'flex', alignItems: 'baseline'}}>
            <span style={{fontSize: 52, fontWeight: 900, color: C.ink, marginRight: 14}}>外卖同比</span>
            {arrowUp(C.orange, 40)}
            <Num id="yoyTo" g={g} size={58} color={C.ink} unitColor={C.ink} />
          </Sticker>
        </Pop>
      </div>
      <div style={{position: 'absolute', right: 330, top: 700, display: 'flex'}}>
        <Pop at={305} g={g} rotate={2}>
          <Sticker bg={C.ink} fg={C.white} border={C.orange} radius={24} style={{display: 'flex', alignItems: 'baseline'}}>
            <span style={{fontSize: 52, fontWeight: 900, color: C.white, marginRight: 14}}>门店同比</span>
            {arrowUp(C.blue, 26)}
            <Num id="yoySt" g={g} size={58} color={C.white} />
          </Sticker>
        </Pop>
      </div>
      {/* 梗贴纸 */}
      <div style={{position: 'absolute', right: 230, top: 210, transform: 'rotate(6deg)'}}>
        <Pop at={275} g={g}>
          <Sticker bg={C.orange} pad="10px 28px" radius={999}>
            <span style={{fontSize: 46, fontWeight: 900, color: C.ink}}>这外卖，绝了</span>
          </Sticker>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};
