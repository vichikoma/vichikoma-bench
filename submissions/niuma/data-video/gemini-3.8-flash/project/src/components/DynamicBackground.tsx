import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { BRAND } from '../constants';

export const DynamicBackground: React.FC<{ beatFlash?: boolean }> = ({ beatFlash = false }) => {
  const frame = useCurrentFrame();

  // Floating particles / subtle grid drift
  const gridOffsetY = (frame * 1.5) % 80;
  const gridOffsetX = (frame * 0.8) % 80;
  
  // Rotating ambient glow
  const glowRot = frame * 0.4;
  const pulse = Math.sin(frame * 0.1) * 0.15 + 0.85;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: BRAND.bgDark,
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* Dynamic radial gradient */}
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: '-10%',
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle, rgba(255, 122, 26, 0.18) 0%, rgba(11, 16, 38, 0) 70%)`,
          transform: `rotate(${glowRot}deg) scale(${pulse})`,
          filter: 'blur(40px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          right: '-10%',
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle, rgba(46, 155, 255, 0.18) 0%, rgba(11, 16, 38, 0) 70%)`,
          transform: `rotate(${-glowRot}deg) scale(${pulse})`,
          filter: 'blur(40px)',
        }}
      />

      {/* Retro halftone / tech grid lines */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.12,
        }}
      >
        <defs>
          <pattern
            id="dotGrid"
            x={gridOffsetX}
            y={gridOffsetY}
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="30" cy="30" r="2.5" fill={BRAND.white} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
      </svg>

      {/* Vignette border */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          boxShadow: 'inset 0 0 120px rgba(0,0,0,0.85)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
