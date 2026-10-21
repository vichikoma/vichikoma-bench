import React from 'react';
import {
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  interpolate,
} from 'remotion';
import { DynamicBackground } from './components/DynamicBackground';
import { IntroScene } from './scenes/IntroScene';
import { MacroScene } from './scenes/MacroScene';
import { CategoryScene } from './scenes/CategoryScene';
import { ClimaxScene } from './scenes/ClimaxScene';
import { OutroScene } from './scenes/OutroScene';

// Scene durations in frames:
// Intro: 116 frames (0 to 116)
// Macro: 175 frames (116 to 291)
// Category: 174 frames (291 to 465)
// Climax: 232 frames (465 to 697)
// Outro: 174 frames (697 to 871)
// Total = 871 frames

export const MainVideo: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        backgroundColor: '#0B1026',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif',
      }}
    >
      {/* Background Music */}
      <Audio src={staticFile('bgm.wav')} />

      {/* Global Dynamic Background */}
      <DynamicBackground />

      {/* Scene 1: Intro (0 ~ 116) */}
      <Sequence from={0} durationInFrames={116}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: Macro (116 ~ 291) */}
      <Sequence from={116} durationInFrames={175}>
        <MacroScene />
      </Sequence>

      {/* Scene 3: Category (291 ~ 465) */}
      <Sequence from={291} durationInFrames={174}>
        <CategoryScene />
      </Sequence>

      {/* Scene 4: Climax (465 ~ 697) */}
      <Sequence from={465} durationInFrames={232}>
        <ClimaxScene />
      </Sequence>

      {/* Scene 5: Outro (697 ~ 174) */}
      <Sequence from={697} durationInFrames={174}>
        <OutroScene />
      </Sequence>
    </div>
  );
};
