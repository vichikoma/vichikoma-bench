import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import {Audio} from '@remotion/media';
import {C, RGBA, FONT_STACK} from './lib/theme';
import {SCENES, CUTS, WIPE_PRE, WIPE_DUR, TOTAL_FRAMES, BEAT} from './lib/timeline';
import {Backdrop} from './lib/Backdrop';
import {Wipe} from './lib/Wipe';
import {kick} from './lib/ui';
import {S1} from './scenes/S1';
import {S2} from './scenes/S2';
import {S3} from './scenes/S3';
import {S4} from './scenes/S4';
import {S5} from './scenes/S5';
import {S6} from './scenes/S6';
import {S7} from './scenes/S7';

const SCENE_MAP: Record<string, React.FC> = {S1, S2, S3, S4, S5, S6, S7};

// 角落品牌贴（S1 之后常驻）
export const CornerBrand: React.FC = () => {
  const g = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: 110,
        top: 84,
        padding: '6px 22px',
        background: C.ink,
        border: `4px solid ${C.orange}`,
        borderRadius: 999,
        fontSize: 34,
        fontWeight: 900,
        color: C.white,
        fontFamily: FONT_STACK,
        opacity: interpolate(g, [128, 140], [0, 0.92], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      }}
    >
      牛马咖啡
    </div>
  );
};

// 底部节拍条：进度 + 每拍脉冲头（全程跟拍可视化）
export const BeatTicker: React.FC = () => {
  const g = useCurrentFrame();
  const w = (g / TOTAL_FRAMES) * 1620;
  const k = kick(g);
  const inBeats = Math.floor(g / BEAT);
  const bar = Math.floor(inBeats / 4);
  return (
    <div style={{position: 'absolute', left: 150, top: 984, width: 1620, opacity: g > 20 ? 1 : 0}}>
      <div style={{height: 10, background: RGBA.white(0.16), borderRadius: 999, position: 'relative'}}>
        <div
          style={{
            height: 10,
            width: w,
            background: C.orange,
            borderRadius: 999,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: w - 11 - k * 6,
            top: -13 - k * 6,
            width: 22 + k * 10,
            height: 34 + k * 14,
            background: C.yellow,
            border: `4px solid ${C.ink}`,
            borderRadius: 8,
          }}
        />
      </div>
      {/* 小节点 */}
      <div style={{display: 'flex', gap: 18, marginTop: 12, justifyContent: 'flex-start'}}>
        {Array.from({length: 15}).map((_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: i < bar ? C.blue : i === bar ? C.yellow : RGBA.white(0.2),
              border: `3px solid ${C.ink}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export const Video: React.FC = () => {
  return (
    <AbsoluteFill style={{background: C.ink}}>
      {/* BGM：与画面同起同止（wav 30.0s = 900 帧）*/}
      <Audio src={staticFile('bgm.wav')} />
      <Backdrop />
      {SCENES.map((s) => (
        <Sequence key={s.id} from={s.mount} durationInFrames={s.dur} name={s.id}>
          {React.createElement(SCENE_MAP[s.id])}
        </Sequence>
      ))}
      {/* 遮罩扫块：切帧全覆盖 → 换屏恰好发生在拍点 */}
      {CUTS.map((c, i) => (
        <Sequence key={c} from={c - WIPE_PRE} durationInFrames={WIPE_DUR} name={`wipe-${c}`}>
          <Wipe index={i} />
        </Sequence>
      ))}
      <CornerBrand />
      <BeatTicker />
    </AbsoluteFill>
  );
};
