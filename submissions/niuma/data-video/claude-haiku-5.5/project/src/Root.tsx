import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Video';

export const Root: React.FC = () => (
  <Composition id="Q3Summary" component={Main} durationInFrames={900} fps={30} width={1920} height={1080} />
);
