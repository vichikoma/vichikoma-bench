import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, RGBA, FONT_STACK} from '../lib/theme';
import {Pop, Sticker, Num, Burst, NUMS, kick} from '../lib/ui';

// S4 品类（360-495）：五行横向条形（sqrt 定宽），轻食独大 + 周边负增长左伸
const TONE: Record<string, string> = {
  hot: C.orange,
  good: C.yellow,
  flat: C.blue,
  down: C.gray,
};
const AXIS = 500; // 零线 x
const MAXW = 900;

export const S4: React.FC = () => {
  const local = useCurrentFrame();
  const g = local + 360;
  const {fps} = useVideoConfig();
  const k = kick(g);
  const camScale = interpolate(g, [360, 495], [1, 1.045]);
  const rows = NUMS.filter((n) => n.scene === 'S4' && n.name);
  let y = 250;
  return (
    <AbsoluteFill style={{transform: `scale(${camScale})`, fontFamily: FONT_STACK}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center'}}>
        <Pop at={362} g={g} rotate={-1}>
          <span style={{fontSize: 92, fontWeight: 900, color: C.white, textShadow: `6px 7px 0 ${RGBA.orange(0.5)}`}}>
            品类同比：谁在狂奔
          </span>
        </Pop>
      </div>
      {/* 零线 */}
      <div
        style={{
          position: 'absolute',
          left: AXIS,
          top: 215,
          height: 600,
          borderLeft: `5px dashed ${RGBA.white(0.5)}`,
          opacity: g >= 368 ? 1 : 0,
        }}
      />
      {rows.map((r) => {
        const col = TONE[r.tone ?? 'good'];
        const h = r.tone === 'hot' ? 120 : 84;
        const ty = y;
        y += h + 22;
        const full = Math.max(96, Math.sqrt(Math.abs(r.value ?? 0) / 195.6) * MAXW);
        const grow = spring({
          frame: Math.max(0, g - r.start),
          fps,
          config: {damping: r.tone === 'hot' ? 8 : 12, stiffness: r.tone === 'hot' ? 110 : 90},
        });
        const w = full * grow;
        const neg = (r.value ?? 0) < 0;
        const fs = r.tone === 'hot' ? 66 : 54;
        return (
          <div key={r.id}>
            {/* 品类名 */}
            <div
              style={{
                position: 'absolute',
                left: 120,
                top: ty + (h - (r.tone === 'hot' ? 62 : 52)) / 2,
                width: AXIS - 150,
                textAlign: 'right',
                fontSize: r.tone === 'hot' ? 60 : 50,
                fontWeight: 900,
                color: r.tone === 'down' ? C.gray : C.white,
                opacity: interpolate(g, [r.start, r.start + 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              }}
            >
              {r.name}
            </div>
            {/* 条 */}
            <div
              style={{
                position: 'absolute',
                left: neg ? AXIS - w : AXIS + 8,
                top: ty,
                width: w,
                height: h,
                background: col,
                border: `5px solid ${C.ink}`,
                borderRadius: 22,
                boxShadow: `0 8px 0 ${RGBA.black(0.3)}`,
                scale: `${r.tone === 'hot' ? 1 + k * 0.012 : 1}`,
              }}
            />
            {/* 数值（滚动到 full 帧定形）*/}
            <div
              style={{
                position: 'absolute',
                left: neg ? AXIS - w - 250 : AXIS + 24 + w,
                top: ty + (h - fs) / 2 - 6,
              }}
            >
              <Num
                id={r.id}
                g={g}
                size={fs}
                color={r.tone === 'down' ? C.gray : r.tone === 'flat' ? C.blue : r.tone === 'hot' ? C.orange : C.yellow}
                glow={r.tone === 'hot' ? `0 8px 0 ${RGBA.ink(0.5)}` : undefined}
              />
            </div>
          </div>
        );
      })}
      {/* 轻食爆炸贴：收入 1003.8万（右下空区，不压任何条与数）*/}
      <div style={{position: 'absolute', left: 1130, top: 585, transform: 'rotate(-4deg)'}}>
        <Pop at={428} g={g}>
          <div style={{position: 'relative', width: 620, height: 210}}>
            <div style={{position: 'absolute', left: -30, top: -25}}>
              <Burst w={680} h={260} color={C.yellow} points={15} rotate={-6 + k * 5} />
            </div>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10}}>
              <span style={{fontSize: 44, fontWeight: 900, color: C.ink}}>轻食收入</span>
              <Num id="revQs" g={g} size={54} color={C.ink} unitColor={C.ink} />
            </div>
          </div>
        </Pop>
      </div>
      {/* 经典咖啡注脚 */}
      <div style={{position: 'absolute', left: 560, top: 862}}>
        <Pop at={432} g={g} rotate={-1}>
          <span style={{fontSize: 42, fontWeight: 800, color: C.gray}}>经典咖啡：主力失速</span>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};
