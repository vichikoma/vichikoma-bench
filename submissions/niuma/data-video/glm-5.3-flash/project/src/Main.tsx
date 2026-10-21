import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, useCurrentFrame, staticFile } from "remotion";
import { C, FONT, SCENE_STARTS } from "./theme";
import { Background } from "./Background";
import { S1, S2, S3, S4, S5, S6, S7, S8 } from "./scenes";

const SCENES = [S1, S2, S3, S4, S5, S6, S7, S8];

// 整层推 / 拉：每场缓慢变焦，奇偶场交替方向
const SceneZoom: React.FC<{ index: number; children: React.ReactNode }> = ({ index, children }) => {
  const frame = useCurrentFrame();
  const len = SCENE_STARTS[index + 1] - SCENE_STARTS[index];
  const zoomIn = index % 2 === 0;
  const scale = interpolate(frame, [0, len], zoomIn ? [1.0, 1.055] : [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ scale: `${scale}` }}>{children}</AbsoluteFill>;
};

// 遮罩转场：斜切色板扫过（橙主 + 冰蓝拖尾边）
const Wipe: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame(); // 全局帧
  const from = start - 2;
  const to = start + 8;
  if (frame < from || frame > to) return null;
  const p = interpolate(frame, [from, to], [0, 1]);
  const x = (p - 0.5) * 240; // -120% → 120%
  return (
    <AbsoluteFill style={{ zIndex: 10, pointerEvents: "none", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-30%",
          width: "160%",
          height: "130%",
          translate: `${x}% 0`,
          skewX: "-12deg",
          background: C.orange,
        }}
      >
        <div
          style={{
            position: "absolute",
            right: -46,
            top: 0,
            width: 46,
            height: "100%",
            background: C.blue,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      <Background />
      <Audio src={staticFile("bgm.wav")} />
      {SCENE_STARTS.slice(0, -1).map((start, i) => {
        const len = SCENE_STARTS[i + 1] - start;
        const Scene = SCENES[i];
        return (
          <Sequence key={i} from={start} durationInFrames={len} name={`S${i + 1}`}>
            <SceneZoom index={i}>
              <Scene />
            </SceneZoom>
          </Sequence>
        );
      })}
      {SCENE_STARTS.slice(1, -1).map((s) => (
        <Wipe key={`w${s}`} start={s} />
      ))}
    </AbsoluteFill>
  );
};
