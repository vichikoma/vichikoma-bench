import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {C, FONT, T, WIPE} from './theme';
import {Bg, Wipe} from './components/kit';
import {S1Cover} from './scenes/S1Cover';
import {S2Chart} from './scenes/S2Chart';
import {S3LightFood} from './scenes/S3LightFood';
import {S4Channel} from './scenes/S4Channel';
import {S5Margin} from './scenes/S5Margin';
import {S6End} from './scenes/S6End';

// 分镜切换全部压在 beats.json 的小节第一拍上：
//   4s / 10s / 18s / 24s / 28s（帧 120 / 300 / 540 / 720 / 840）
// 每个分镜自带同源视差背景（Bg 只依赖当前帧，换屏时视觉连续），
// 用斜切遮罩 wipe 揭示新场景，转场恰好在切点帧完成。
export const Main: React.FC = () => {
  const frame = useCurrentFrame();
  const live = (seg: readonly [number, number]) => frame >= seg[0] - WIPE && frame < seg[1];

  return (
    <AbsoluteFill style={{backgroundColor: C.navy, fontFamily: FONT}}>
      <Bg />

      {frame < T.s1[1] ? <S1Cover /> : null}

      {live(T.s2) ? (
        <Wipe startFrame={T.s2[0] - WIPE} cutFrame={T.s2[0]} bandColor={C.yellow}>
          <Bg />
          <S2Chart />
        </Wipe>
      ) : null}

      {live(T.s3) ? (
        <Wipe startFrame={T.s3[0] - WIPE} cutFrame={T.s3[0]} bandColor={C.orange}>
          <Bg />
          <S3LightFood />
        </Wipe>
      ) : null}

      {live(T.s4) ? (
        <Wipe startFrame={T.s4[0] - WIPE} cutFrame={T.s4[0]} bandColor={C.blue}>
          <Bg />
          <S4Channel />
        </Wipe>
      ) : null}

      {live(T.s5) ? (
        <Wipe startFrame={T.s5[0] - WIPE} cutFrame={T.s5[0]} bandColor={C.yellow}>
          <Bg />
          <S5Margin />
        </Wipe>
      ) : null}

      {live(T.s6) ? (
        <Wipe startFrame={T.s6[0] - WIPE} cutFrame={T.s6[0]} bandColor={C.orange}>
          <Bg />
          <S6End />
        </Wipe>
      ) : null}

      <Audio src={staticFile('bgm.wav')} />
    </AbsoluteFill>
  );
};
