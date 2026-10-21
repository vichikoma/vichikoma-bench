import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Num, Burst, kick} from '../lib/ui';

// S2 总盘（120-240）：史上最高季度大数字滚动 → 高潮帧 sole focus → 同环比徽章 → 盖章
export const S2: React.FC = () => {
  const local = useCurrentFrame();
  const g = local + 120;
  const k = kick(g);
  const camScale = interpolate(g, [120, 240], [1, 1.06]);
  return (
    <AbsoluteFill style={{transform: `scale(${camScale})`, fontFamily: FONT_STACK}}>
      {/* 顶部说明（无数字，左移避开品牌贴，右让印章）*/}
      <div style={{position: 'absolute', left: 370, right: 0, top: 130, display: 'flex', justifyContent: 'flex-start'}}>
        <Pop at={122} g={g} rotate={-1}>
          <Sticker bg={C.ink} fg={C.white} border={C.orange} radius={999} pad="10px 44px">
            <span style={{fontSize: 52, fontWeight: 900}}>季度总销售额 · 史上最高</span>
          </Sticker>
        </Pop>
      </div>
      {/* 英雄数字（滚动 125→165）*/}
      <div style={{position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', justifyContent: 'center'}}>
        <div style={{position: 'relative', scale: `${1 + k * 0.012}`}}>
          <Num
            id="revQ3"
            g={g}
            size={330}
            glow={`0 12px 0 ${RGBA.ink(0.55)}, 0 0 60px ${RGBA.yellow(0.35)}`}
            style={{rotate: '-2deg'}}
          />
          {/* 扫光（高潮帧后划过）*/}
          {g > 165 && g < 196 ? (
            <div
              style={{
                position: 'absolute',
                top: -12,
                bottom: 0,
                left: `${interpolate(g, [165, 194], [-70, 130])}%`,
                width: '42%',
                background: `linear-gradient(105deg, ${RGBA.white(0)} 20%, ${RGBA.white(0.5)} 50%, ${RGBA.white(0)} 80%)`,
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }}
            />
          ) : null}
        </div>
      </div>
      {/* 同环比徽章 */}
      <div style={{position: 'absolute', left: 330, top: 730, display: 'flex'}}>
        <Pop at={172} g={g} rotate={-2}>
          <Sticker bg={C.orange} pad="12px 34px" style={{display: 'flex', alignItems: 'baseline'}}>
            <span style={{fontSize: 56, fontWeight: 900, color: C.ink, marginRight: 16}}>同比</span>
            <Num id="yoy" g={g} size={62} color={C.ink} unitColor={C.ink} />
          </Sticker>
        </Pop>
      </div>
      <div style={{position: 'absolute', right: 330, top: 730, display: 'flex'}}>
        <Pop at={187} g={g} rotate={2}>
          <Sticker bg={C.blue} pad="12px 34px" style={{display: 'flex', alignItems: 'baseline'}}>
            <span style={{fontSize: 56, fontWeight: 900, color: C.ink, marginRight: 16}}>环比</span>
            <Num id="qoq" g={g} size={62} color={C.ink} unitColor={C.ink} />
          </Sticker>
        </Pop>
      </div>
      {/* 盖章：史上最高季度（拍 14 = f210 砸下，右上净区）*/}
      <div style={{position: 'absolute', left: 1380, top: 80, transform: 'rotate(11deg)'}}>
        <Pop at={210} g={g} rotate={0}>
          <div style={{position: 'relative', width: 400, height: 285, scale: `${1 + k * 0.05}`}}>
            <div style={{position: 'absolute', left: -18, top: -16}}>
              <Burst w={440} h={320} color={C.yellow} points={16} rotate={g / 14} />
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.ink,
                fontSize: 54,
                fontWeight: 900,
                lineHeight: 1.15,
                textAlign: 'center',
              }}
            >
              史上
              <br />
              最高季度!
            </div>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};
