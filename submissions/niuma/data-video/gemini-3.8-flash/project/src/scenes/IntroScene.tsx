import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND } from '../constants';

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animations
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const badgeSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const subtitleSpring = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Camera drift
  const scale = interpolate(frame, [0, 60], [0.95, 1.05], { extrapolateRight: 'clamp' });
  const rotate = interpolate(frame, [0, 60], [-1, 0.5], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        transform: `scale(${scale}) rotate(${rotate}deg)`,
      }}
    >
      {/* Sticker badge */}
      <div
        style={{
          transform: `scale(${badgeSpring}) rotate(-4deg)`,
          backgroundColor: BRAND.accent,
          color: BRAND.bgDark,
          padding: '12px 36px',
          borderRadius: 20,
          fontWeight: 900,
          fontSize: 36,
          letterSpacing: 3,
          border: `5px solid ${BRAND.bgDark}`,
          boxShadow: `8px 8px 0px ${BRAND.secondary}`,
          marginBottom: 32,
        }}
      >
        🔥 季度经营大盘速报
      </div>

      {/* Main Massive Title */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 128,
            fontWeight: 900,
            lineHeight: 1.1,
            color: BRAND.primary,
            textShadow: `0 0 50px rgba(255, 122, 26, 0.6), 4px 4px 0px ${BRAND.bgDark}`,
            letterSpacing: 4,
          }}
        >
          牛马咖啡
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: BRAND.white,
            marginTop: 12,
            letterSpacing: 6,
            textShadow: `0 4px 20px rgba(0,0,0,0.8)`,
          }}
        >
          2026 年第三季度战报
        </div>
      </div>

      {/* Tagline / Subtitle */}
      <div
        style={{
          transform: `translateY(${interpolate(subtitleSpring, [0, 1], [40, 0])}px)`,
          opacity: subtitleSpring,
          marginTop: 40,
          display: 'flex',
          gap: 24,
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(244, 246, 255, 0.1)',
            border: `3px solid ${BRAND.secondary}`,
            borderRadius: 16,
            padding: '14px 28px',
            color: BRAND.white,
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          ⚡ 期间：2026.07 - 2026.09
        </div>
        <div
          style={{
            backgroundColor: BRAND.secondary,
            borderRadius: 16,
            padding: '14px 28px',
            color: BRAND.bgDark,
            fontSize: 32,
            fontWeight: 900,
          }}
        >
          📈 强势增长 · 韧性领跑
        </div>
      </div>
    </div>
  );
};
