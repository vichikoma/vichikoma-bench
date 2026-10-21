import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Num, kick} from '../lib/ui';

// S5 毛利（495-615）：亮黄英雄数字 + 渠道毛利对比条 + 预警贴纸
export const S5: React.FC = () => {
  const local = useCurrentFrame();
  const g = local + 495;
  const {fps} = useVideoConfig();
  const k = kick(g);
  const camScale = interpolate(g, [495, 615], [1, 1.05]);
  const barPairs = [
    {id: 'marginSt', name: '门店', val: 60.5, color: C.blue},
    {id: 'marginTo', name: '外卖', val: 48.4, color: C.orange},
  ];
  return (
    <AbsoluteFill style={{transform: `scale(${camScale})`, fontFamily: FONT_STACK}}>
      {/* 预警角贴（避开角落品牌贴）*/}
      <div style={{position: 'absolute', left: 560, top: 100, transform: 'rotate(8deg)'}}>
        <Pop at={497} g={g}>
          <Sticker bg={C.yellow} pad="8px 26px" radius={16}>
            <span style={{fontSize: 46, fontWeight: 900, color: C.ink, scale: `${1 + k * 0.06}`}}>预警</span>
          </Sticker>
        </Pop>
      </div>
      {/* 左列：标题 + 英雄数字 */}
      <div style={{position: 'absolute', left: 130, top: 180}}>
        <Pop at={498} g={g}>
          <span style={{fontSize: 76, fontWeight: 900, color: C.white, textShadow: `5px 6px 0 ${RGBA.yellow(0.45)}`}}>
            营收新高
            <br />
            毛利却在漏水
          </span>
        </Pop>
      </div>
      <div style={{position: 'absolute', left: 130, top: 480}}>
        <div style={{fontSize: 56, fontWeight: 900, color: C.white, marginBottom: 6}}>季度毛利率</div>
        <div style={{scale: `${1 + k * 0.012}`}}>
          <Num id="margin" g={g} size={240} glow={`0 10px 0 ${RGBA.ink(0.6)}, 0 0 70px ${RGBA.yellow(0.35)}`} style={{rotate: '-2deg'}} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 14}}>
          <span style={{fontSize: 46, fontWeight: 800, color: C.gray}}>去年同期</span>
          <Num id="marginYoy" g={g} size={52} color={C.gray} />
        </div>
      </div>
      {/* 降幅徽章：左下空区，避开 HUD 节拍条 */}
      <div style={{position: 'absolute', left: 600, top: 848}}>
        <Pop at={545} g={g} rotate={-2}>
          <Sticker bg={C.orange} pad="12px 34px" style={{display: 'flex', alignItems: 'center'}}>
            <svg width={44} height={44} style={{marginRight: 12}}>
              <polygon points="22,44 44,0 0,0" fill={C.ink} />
            </svg>
            <span style={{fontSize: 52, fontWeight: 900, color: C.ink, marginRight: 12}}>同比</span>
            <Num id="marginDrop" g={g} size={56} color={C.ink} unitColor={C.ink} />
          </Sticker>
        </Pop>
      </div>
      {/* 右列：渠道毛利对比 */}
      <div style={{position: 'absolute', left: 1080, top: 210, width: 700}}>
        <Pop at={510} g={g}>
          <span style={{fontSize: 54, fontWeight: 900, color: C.white}}>渠道毛利率对比</span>
        </Pop>
        {barPairs.map((b, i) => {
          const start = i === 0 ? 524 : 534;
          const grow = spring({frame: Math.max(0, g - start), fps, config: {damping: 11, stiffness: 90}});
          const w = (b.val / 70) * 620 * grow;
          return (
            <div key={b.id} style={{marginTop: 46}}>
              <div style={{fontSize: 48, fontWeight: 900, color: C.white, marginBottom: 10}}>{b.name}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
                <div
                  style={{
                    width: w,
                    height: 88,
                    background: b.color,
                    border: `5px solid ${C.ink}`,
                    borderRadius: 20,
                    boxShadow: `0 7px 0 ${RGBA.black(0.3)}`,
                  }}
                />
                <Num id={b.id} g={g} size={58} color={b.color} glow={`0 6px 0 ${RGBA.ink(0.5)}`} />
              </div>
            </div>
          );
        })}
        <div style={{marginTop: 44}}>
          <Pop at={570} g={g}>
            <span style={{fontSize: 42, fontWeight: 800, color: C.gray}}>外卖涨得快，赚得薄</span>
          </Pop>
        </div>
      </div>
    </AbsoluteFill>
  );
};
