import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Backdrop } from "./Backdrop";
import { Bean, BeatBar, Bolt, Reveal, useBeat } from "./bits";
import { C, FONT } from "./theme";
import { SceneA } from "./scenes/SceneA";
import { SceneB } from "./scenes/SceneB";
import { SceneC } from "./scenes/SceneC";
import { SceneD } from "./scenes/SceneD";
import { META } from "./data";

/**
 * 品牌角标：开场以巨幅出现在画面正中，之后收进右上角，全片一直挂着。
 * 同一个元素连续变形 —— 既是「镜头运动」，也保证品牌名在全片任何时刻可见。
 */
const BrandMark: React.FC = () => {
  const frame = useCurrentFrame();
  const beat = useBeat();
  const p = interpolate(frame, [48, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });

  const cx = 960 + (1680 - 960) * p;
  const cy = 470 + (101 - 470) * p;
  const g = (a: number, b: number) => a + (b - a) * p;

  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top: cy,
        translate: "-50% -50%",
        display: "inline-flex",
        alignItems: "center",
        gap: g(26, 10),
        padding: `${g(30, 8)}px ${g(60, 16)}px`,
        background: "rgba(11,16,38,0.82)",
        border: `${g(12, 5)}px solid ${C.orange}`,
        borderRadius: g(60, 18),
        fontFamily: FONT,
        scale: `${1 + beat.down * 0.012}`,
        boxShadow: `0 0 ${g(46, 14)}px rgba(255,122,26,${g(0.5, 0.35)})`,
      }}
    >
      <Bolt size={g(120, 28)} />
      <span
        style={{
          fontSize: g(200, 40),
          fontWeight: 900,
          color: C.mist,
          letterSpacing: g(8, 2),
          lineHeight: 1.06,
          whiteSpace: "nowrap",
        }}
      >
        {META.brand}
      </span>
    </div>
  );
};

export const NiuMaQ3: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.ink, fontFamily: FONT }}>
      {/* 全片共用的视差背景 */}
      <Backdrop />

      {/* 四场：每一场的开头都是斜切遮罩转场，起始帧落在小节第一拍上 */}
      <Sequence from={0} durationInFrames={192}>
        <SceneA />
      </Sequence>
      <Sequence from={180} durationInFrames={252}>
        <Reveal dir="left">
          <SceneB />
        </Reveal>
      </Sequence>
      <Sequence from={420} durationInFrames={252}>
        <Reveal dir="up">
          <SceneC />
        </Reveal>
      </Sequence>
      <Sequence from={660} durationInFrames={240}>
        <Reveal dir="right">
          <SceneD />
        </Reveal>
      </Sequence>

      {/* 品牌角标与节拍条常驻在最上层 */}
      <BrandMark />
      <BeatBar />

      {/* 音乐：与画面同起同止（30.000s） */}
      <Audio src={staticFile("bgm.wav")} />
    </AbsoluteFill>
  );
};
