import React from "react";
import { Composition } from "remotion";
import { NiuMaQ3 } from "./NiuMaQ3";
import { DURATION, FPS } from "./timing";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NiuMaQ3"
        component={NiuMaQ3}
        durationInFrames={DURATION * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
