import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandHeader } from '../components/BrandHeader';
import { BRAND, DATA_STATS } from '../constants';

export const ClimaxScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Dramatic impact scale
  const impact = spring({
    frame,
    fps,
    config: { damping: 9, stiffness: 140 },
  });

  const pulse = Math.sin(frame * 0.25) * 0.04 + 1;

  // Number counting for 6902.48
  const countProgress = interpolate(frame, [0, 35], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const currentNum = (DATA_STATS.q3_rev_wan * countProgress).toFixed(2);

  // Background light sweep
  const sweepX = interpolate(frame, [0, 120], [-100, 200]);

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BrandHeader subtitle="03 / 业绩巅峰焦点" />

      {/* Light Sweep Effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${sweepX}%`,
          width: '30%',
          height: '100%',
          background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,210,61,0.15) 50%, rgba(255,255,255,0) 100%)',
          transform: 'skewX(-25deg)',
          pointerEvents: 'none',
        }}
      />

      {/* Burst background glow */}
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 122, 26, 0.35) 0%, rgba(11, 16, 38, 0) 70%)',
          transform: `scale(${impact * pulse})`,
          filter: 'blur(30px)',
          zIndex: 1,
        }}
      />

      {/* Main Focus Container */}
      <div
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${impact})`,
        }}
      >
        {/* Top sticker pill */}
        <div
          style={{
            backgroundColor: BRAND.accent,
            color: BRAND.bgDark,
            padding: '12px 36px',
            borderRadius: 24,
            fontWeight: 900,
            fontSize: 34,
            letterSpacing: 2,
            border: `5px solid ${BRAND.bgDark}`,
            boxShadow: `0 8px 30px rgba(255, 210, 61, 0.5)`,
            marginBottom: 20,
          }}
        >
          🏆 2026 Q3 历史最高单季业绩
        </div>

        {/* Hero Number Focus */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 16,
          }}
        >
          <span
            style={{
              fontSize: 180,
              fontWeight: 900,
              lineHeight: 1,
              color: BRAND.primary,
              letterSpacing: -4,
              fontFamily: 'monospace, sans-serif',
              textShadow: `0 0 80px rgba(255, 122, 26, 0.8), 4px 4px 0px ${BRAND.bgDark}`,
            }}
          >
            {currentNum}
          </span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: BRAND.white,
              letterSpacing: 2,
              textShadow: `0 4px 20px rgba(0,0,0,0.8)`,
            }}
          >
            万元
          </span>
        </div>

        {/* Metric comparison ribbon */}
        <div
          style={{
            marginTop: 36,
            display: 'flex',
            gap: 32,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(244, 246, 255, 0.08)',
              border: `3px solid ${BRAND.secondary}`,
              borderRadius: 20,
              padding: '16px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: `0 8px 24px rgba(46, 155, 255, 0.25)`,
            }}
          >
            <span style={{ color: BRAND.gray, fontSize: 26, fontWeight: 700 }}>同比去年 Q3</span>
            <span style={{ color: BRAND.secondary, fontSize: 48, fontWeight: 900, marginTop: 4 }}>
              +{DATA_STATS.yoy_rev_pct}%
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 122, 26, 0.15)',
              border: `3px solid ${BRAND.primary}`,
              borderRadius: 20,
              padding: '16px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: `0 8px 24px rgba(255, 122, 26, 0.25)`,
            }}
          >
            <span style={{ color: BRAND.gray, fontSize: 26, fontWeight: 700 }}>环比今年 Q2</span>
            <span style={{ color: BRAND.primary, fontSize: 48, fontWeight: 900, marginTop: 4 }}>
              +{DATA_STATS.qoq_rev_pct}%
            </span>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 210, 61, 0.1)',
              border: `3px solid ${BRAND.accent}`,
              borderRadius: 20,
              padding: '16px 36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: `0 8px 24px rgba(255, 210, 61, 0.25)`,
            }}
          >
            <span style={{ color: BRAND.gray, fontSize: 26, fontWeight: 700 }}>毛利总额贡献</span>
            <span style={{ color: BRAND.accent, fontSize: 48, fontWeight: 900, marginTop: 4 }}>
              {DATA_STATS.q3_gp_wan}万
            </span>
          </div>
        </div>

        {/* Subtitle declaration */}
        <div
          style={{
            marginTop: 40,
            fontSize: 34,
            fontWeight: 800,
            color: BRAND.white,
            backgroundColor: BRAND.bgDark,
            padding: '12px 32px',
            borderRadius: 16,
            border: `2px solid rgba(244, 246, 255, 0.2)`,
            letterSpacing: 2,
          }}
        >
          🚀 连续 3 个季度高增，规模与利润空间全面打开！
        </div>
      </div>
    </div>
  );
};
