import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Num, Bolt, kick} from '../lib/ui';
import {S7_SPLIT} from '../lib/timeline';

// S7（720-900）：A 段总结四贴纸（780 拍点换屏）→ B 段品牌片尾 + Q4 口号
export const S7: React.FC = () => {
  const local = useCurrentFrame();
  const g = local + 720;
  const k = kick(g);
  const part = g < S7_SPLIT ? 'A' : 'B';
  const camScale = part === 'A' ? 1 : interpolate(g, [780, 900], [1.02, 1.06]);
  return (
    <AbsoluteFill style={{transform: `scale(${camScale})`, fontFamily: FONT_STACK}}>
      {part === 'A' ? (
        <>
          <div style={{position: 'absolute', left: 0, right: 0, top: 110, display: 'flex', justifyContent: 'center'}}>
            <Pop at={722} g={g} rotate={-2}>
              <Sticker bg={C.yellow} pad="10px 40px" rotate={-2}>
                <span style={{fontSize: 76, fontWeight: 900, color: C.ink}}>本季重点，一张速记</span>
              </Sticker>
            </Pop>
          </div>
          {/* 四贴纸 2x2：同一正拍簇弹出，732 全部到位，显示至 780（≥1.6s）*/}
          <div style={{position: 'absolute', left: 240, top: 300, width: 1440, display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 64, columnGap: 60}}>
            <div style={{justifySelf: 'start', transform: 'rotate(-1.5deg)'}}>
              <Pop at={720} g={g}>
                <Sticker bg={C.orange} pad="20px 40px" radius={30}>
                  <div style={{fontSize: 46, color: C.ink, fontWeight: 900}}>营收</div>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 4}}>
                    <Num id="chip1rev" g={g} size={92} color={C.ink} unitColor={C.ink} />
                    <Num id="chip1yoy" g={g} size={62} color={C.ink} unitColor={C.ink} />
                  </div>
                </Sticker>
              </Pop>
            </div>
            <div style={{justifySelf: 'end', transform: 'rotate(1.5deg)'}}>
              <Pop at={724} g={g}>
                <Sticker bg={C.blue} pad="20px 40px" radius={30}>
                  <div style={{fontSize: 46, color: C.ink, fontWeight: 900}}>外卖占比</div>
                  <Num id="chip2" g={g} size={92} color={C.ink} unitColor={C.ink} style={{marginTop: 4}} />
                </Sticker>
              </Pop>
            </div>
            <div style={{justifySelf: 'start', transform: 'rotate(1deg)'}}>
              <Pop at={728} g={g}>
                <Sticker bg={C.yellow} pad="20px 40px" radius={30}>
                  <div style={{fontSize: 46, color: C.ink, fontWeight: 900}}>轻食同比</div>
                  <Num id="chip3" g={g} size={92} color={C.ink} unitColor={C.ink} style={{marginTop: 4}} />
                </Sticker>
              </Pop>
            </div>
            <div style={{justifySelf: 'end', transform: 'rotate(-1deg)'}}>
              <Pop at={732} g={g}>
                <Sticker bg={C.white} fg={C.ink} pad="20px 40px" radius={30}>
                  <div style={{fontSize: 46, color: C.ink, fontWeight: 900}}>毛利率（预警）</div>
                  <div style={{display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4}}>
                    <Num id="chip4" g={g} size={92} color={C.ink} unitColor={C.ink} />
                  </div>
                </Sticker>
              </Pop>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* 片尾：拍 52 遮罩揭示后品牌砸入 */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 250, display: 'flex', justifyContent: 'center'}}>
            <Pop at={784} g={g} rotate={-2}>
              <div style={{scale: `${1 + k * 0.02}`}}>
                <Sticker bg={C.orange} pad="30px 80px" radius={38} rotate={-2}>
                  <span style={{fontSize: 220, fontWeight: 900, color: C.ink, letterSpacing: 12}}>牛马咖啡</span>
                </Sticker>
              </div>
            </Pop>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 620, display: 'flex', justifyContent: 'center'}}>
            <span style={{fontSize: 60, fontWeight: 900, color: C.white, letterSpacing: 6, alignSelf: 'center'}}>
              数据在燃，团队更要燃
            </span>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: 760, display: 'flex', justifyContent: 'center', gap: 34}}>
            <div style={{transform: 'rotate(-12deg)', alignSelf: 'center'}}>
              <Pop at={826} g={g}>
                <Bolt size={110} color={C.yellow} />
              </Pop>
            </div>
            <Pop at={830} g={g} rotate={1}>
              <div style={{display: 'flex', alignItems: 'baseline', gap: 6, scale: `${1 + k * 0.03}`}}>
                <span style={{fontSize: 130, fontWeight: 900, color: C.yellow, textShadow: `0 10px 0 ${RGBA.ink(0.6)}`}}>Q</span>
                <Num id="q4" g={g} size={130} glow={`0 10px 0 ${RGBA.ink(0.6)}`} />
                <span style={{fontSize: 116, fontWeight: 900, color: C.white, marginLeft: 22, textShadow: `0 8px 0 ${RGBA.ink(0.55)}`}}>
                  接着燃!
                </span>
              </div>
            </Pop>
            <div style={{transform: 'rotate(12deg)', alignSelf: 'center'}}>
              <Pop at={826} g={g}>
                <Bolt size={110} color={C.blue} />
              </Pop>
            </div>
          </div>
          {/* 收尾渐暗提示（保留品牌卡到 900）*/}
        </>
      )}
    </AbsoluteFill>
  );
};
