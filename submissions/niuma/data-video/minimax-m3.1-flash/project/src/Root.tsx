import React from 'react';
import {AbsoluteFill, Audio, Composition, Sequence, staticFile} from 'remotion';
import {C, CUTS, DURATION, FPS, FONT} from './theme';
import {S1, S2, S3, S4, S5, S6, S7, S8, S9} from './Scenes';

/**
 * 场景序列。每个 Sequence 的 from 都落在 BGM 的小节第一拍上（见 out/beats.json）：
 * 0.0 / 2.0 / 5.0 / 8.0 / 11.0 / 14.0 / 18.0 / 23.0 / 27.0 秒
 */
const Scenes: React.FC = () => (
  <>
    <Sequence name="S1 片头" from={CUTS.s1} durationInFrames={CUTS.s2 - CUTS.s1} premountFor={FPS}>
      <S1 />
    </Sequence>
    <Sequence name="S2 大盘·高潮" from={CUTS.s2} durationInFrames={CUTS.s3 - CUTS.s2} premountFor={FPS}>
      <S2 />
    </Sequence>
    <Sequence name="S3 月度节奏" from={CUTS.s3} durationInFrames={CUTS.s4 - CUTS.s3} premountFor={FPS}>
      <S3 />
    </Sequence>
    <Sequence name="S4 华北引擎" from={CUTS.s4} durationInFrames={CUTS.s5 - CUTS.s4} premountFor={FPS}>
      <S4 />
    </Sequence>
    <Sequence name="S5 渠道结构" from={CUTS.s5} durationInFrames={CUTS.s6 - CUTS.s5} premountFor={FPS}>
      <S5 />
    </Sequence>
    <Sequence name="S6 毛利率转折" from={CUTS.s6} durationInFrames={CUTS.s7 - CUTS.s6} premountFor={FPS}>
      <S6 />
    </Sequence>
    <Sequence name="S7 同比高潮帧" from={CUTS.s7} durationInFrames={CUTS.s8 - CUTS.s7} premountFor={FPS}>
      <S7 />
    </Sequence>
    <Sequence name="S8 三句话结论" from={CUTS.s8} durationInFrames={810 - CUTS.s8} premountFor={FPS}>
      <S8 />
    </Sequence>
    <Sequence name="S9 品牌落板" from={810} durationInFrames={DURATION - 810} premountFor={FPS}>
      <S9 />
    </Sequence>
  </>
);

export const Q3Report: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.ink, fontFamily: FONT}}>
    {/* 原创 BGM：music-gen 生成，30 秒，与画面同起同止 */}
    <Audio src={staticFile('bgm.wav')} />
    <Scenes />
  </AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Q3Report"
    component={Q3Report}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);