import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Main';
import {FPS, TOTAL_FRAMES} from './lib/timeline';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="NiumaQ3"
    component={Video}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
