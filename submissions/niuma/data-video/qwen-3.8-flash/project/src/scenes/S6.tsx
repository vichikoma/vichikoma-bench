import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Num, Burst, Bolt, kick} from '../lib/ui';
import {D} from '../lib/data';

// S6 西南黑马（615-720）：+113.6% 英雄数 + 基数→现值 + 大区体量柱（无数字标注）
export const S6: React.FC = () => {
  const local = useCurrentFrame();
  const g = local + 615;
  const {fps} = useVideoConfig();
  const k = kick(g);
  const camScale = interpolate(g, [615, 720], [1, 1.06]);
  const maxRev = Math.max(...D.regions.map((r) => r.rev));
  return (
    <AbsoluteFill style={{transform: `scale(${camScale})`, fontFamily: FONT_STACK}}>
      <div style={{position: 'absolute', left: 150, top: 195}}>
        <Pop at={617} g={g} rotate={-1}>
          <span style={{fontSize: 76, fontWeight: 900, color: C.white, textShadow: `6px 7px 0 ${RGBA.orange(0.55)}`}}>
            区域黑马 · 西南
          </span>
        </Pop>
      </div>
      {/* 英雄数字 + 爆炸光 */}
      <div style={{position: 'absolute', left: 130, top: 330}}>
        <div style={{position: 'relative', width: 1080, height: 360, scale: `${1 + k * 0.015}`}}>
          <div style={{position: 'absolute', left: -60, top: -50, opacity: 0.55}}>
            <Burst w={1060} h={440} color={RGBA.orange(0.32)} points={18} rotate={g / 9} />
          </div>
          <div style={{position: 'absolute', left: 40, top: 30}}>
            <Num id="swYoy" g={g} size={250} color={C.orange} glow={`0 12px 0 ${RGBA.ink(0.6)}`} style={{rotate: '-3deg'}} />
          </div>
        </div>
      </div>
      {/* 基数 → 现值 */}
      <div style={{position: 'absolute', left: 170, top: 760}}>
        <Pop at={660} g={g} rotate={1}>
          <Sticker bg={C.blue} pad="14px 36px">
            <span style={{display: 'inline-flex', alignItems: 'baseline', gap: 14}}>
              <span style={{fontSize: 46, fontWeight: 900, color: C.ink}}>去年</span>
              <Num id="swBase" g={g} size={62} color={C.ink} unitColor={C.ink} />
              <svg width={70} height={40} style={{margin: '0 6px', transform: 'translateY(2px)'}}>
                <polygon points="0,12 44,12 44,0 70,20 44,40 44,28 0,28" fill={C.ink} />
              </svg>
              <span style={{fontSize: 46, fontWeight: 900, color: C.ink}}>本季</span>
              <Num id="swNow" g={g} size={62} color={C.ink} unitColor={C.ink} />
            </span>
          </Sticker>
        </Pop>
      </div>
      {/* 梗贴纸 */}
      <div style={{position: 'absolute', left: 1010, top: 858, transform: 'rotate(-3deg)'}}>
        <Pop at={648} g={g}>
          <Sticker bg={C.ink} fg={C.yellow} border={C.yellow} bw={4} radius={999} pad="8px 26px">
            <span style={{fontSize: 40, fontWeight: 900}}>闷声发大财</span>
          </Sticker>
        </Pop>
      </div>
      {/* 右侧大区体量柱（仅名称，不标数字）*/}
      <div style={{position: 'absolute', left: 1330, top: 210}}>
        <Pop at={620} g={g}>
          <span style={{fontSize: 44, fontWeight: 900, color: C.white}}>大区销售额体量</span>
        </Pop>
        <div style={{display: 'flex', gap: 22, marginTop: 24, alignItems: 'flex-end', height: 560}}>
          {D.regions.map((r, i) => {
            const isSw = r.name === '西南';
            const start = 628 + i * 10;
            const grow = spring({frame: Math.max(0, g - start), fps, config: {damping: 10, stiffness: 110}});
            const h = (r.rev / maxRev) * 460 * grow;
            return (
              <div key={r.name} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end'}}>
                <div
                  style={{
                    width: 78,
                    height: h,
                    background: isSw ? C.orange : RGBA.blue(0.75),
                    border: `5px solid ${C.ink}`,
                    borderRadius: 18,
                    boxShadow: isSw ? `0 10px 0 ${RGBA.orange(0.35)}` : `0 8px 0 ${RGBA.black(0.3)}`,
                    rotate: isSw ? '-1.5deg' : '0deg',
                    scale: isSw ? `${1 + k * 0.02}` : '1',
                  }}
                />
                <span style={{marginTop: 12, fontSize: 38, fontWeight: 900, color: isSw ? C.orange : C.gray}}>
                  {r.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* 闪电装饰 */}
      <div style={{position: 'absolute', left: 880, top: 150, transform: 'rotate(14deg)'}}>
        <Pop at={640} g={g}>
          <Bolt size={130} color={C.yellow} />
        </Pop>
      </div>
    </AbsoluteFill>
  );
};
