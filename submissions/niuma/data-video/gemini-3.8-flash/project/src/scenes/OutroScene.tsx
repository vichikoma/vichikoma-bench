import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BRAND, DATA_STATS } from '../constants';

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const cardSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 90 },
  });

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
      }}
    >
      {/* Brand Big Logo */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: BRAND.primary,
            color: BRAND.bgDark,
            padding: '16px 48px',
            borderRadius: 24,
            fontWeight: 900,
            fontSize: 54,
            letterSpacing: 4,
            border: `5px solid ${BRAND.bgDark}`,
            boxShadow: `0 10px 30px rgba(255, 122, 26, 0.5)`,
            marginBottom: 24,
          }}
        >
          ⚡ 牛马咖啡
        </div>

        <div
          style={{
            fontSize: 68,
            fontWeight: 900,
            color: BRAND.white,
            letterSpacing: 3,
            textShadow: `0 4px 20px rgba(0,0,0,0.8)`,
          }}
        >
          2026 Q4 · 乘势而上，再攀高峰！
        </div>
      </div>

      {/* Summary Recap Cards */}
      <div
        style={{
          transform: `scale(${cardSpring})`,
          opacity: cardSpring,
          marginTop: 48,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 28,
          width: '75%',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 122, 26, 0.12)',
            border: `2px solid ${BRAND.primary}`,
            borderRadius: 20,
            padding: '24px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ color: BRAND.gray, fontSize: 26, fontWeight: 700 }}>Q3 季度营收</div>
          <div style={{ color: BRAND.primary, fontSize: 48, fontWeight: 900, marginTop: 6, fontFamily: 'monospace' }}>
            {DATA_STATS.q3_rev_wan}万
          </div>
          <div style={{ color: BRAND.accent, fontSize: 22, fontWeight: 800, marginTop: 6 }}>
            同比 +{DATA_STATS.yoy_rev_pct}%
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(46, 155, 255, 0.12)',
            border: `2px solid ${BRAND.secondary}`,
            borderRadius: 20,
            padding: '24px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ color: BRAND.gray, fontSize: 26, fontWeight: 700 }}>Q3 综合毛利</div>
          <div style={{ color: BRAND.secondary, fontSize: 48, fontWeight: 900, marginTop: 6, fontFamily: 'monospace' }}>
            {DATA_STATS.q3_gp_wan}万
          </div>
          <div style={{ color: BRAND.white, fontSize: 22, fontWeight: 800, marginTop: 6 }}>
            毛利率 {DATA_STATS.q3_margin_pct}%
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'rgba(255, 210, 61, 0.12)',
            border: `2px solid ${BRAND.accent}`,
            borderRadius: 20,
            padding: '24px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ color: BRAND.gray, fontSize: 26, fontWeight: 700 }}>总成交订单</div>
          <div style={{ color: BRAND.accent, fontSize: 48, fontWeight: 900, marginTop: 6, fontFamily: 'monospace' }}>
            {DATA_STATS.q3_orders_wan}万单
          </div>
          <div style={{ color: BRAND.primary, fontSize: 22, fontWeight: 800, marginTop: 6 }}>
            同比 +{DATA_STATS.yoy_orders_pct}%
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div
        style={{
          marginTop: 48,
          color: BRAND.gray,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        牛马咖啡运营分析部 · 2026年10月
      </div>
    </div>
  );
};
