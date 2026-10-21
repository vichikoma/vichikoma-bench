import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={871}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
