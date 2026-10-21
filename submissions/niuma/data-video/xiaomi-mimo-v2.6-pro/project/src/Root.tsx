import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {DURATION, FPS} from './theme';

export const Root: React.FC = () => {
  return (
    <Composition
      id="Q3Report"
      component={Main}
      durationInFrames={DURATION}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
