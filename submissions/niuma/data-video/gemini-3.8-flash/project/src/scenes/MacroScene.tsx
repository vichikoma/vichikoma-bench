import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandHeader } from '../components/BrandHeader';
import { BRAND, DATA_STATS } from '../constants';

export const MacroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const card1 = spring({ frame: frame - 5, fps, config: { damping: 12 } });
  const card2 = spring({ frame: frame - 12, fps, config: { damping: 12 } });
  const card3 = spring({ frame: frame - 19, fps, config: { damping: 12 } });

  // Number counting animations (over 30 frames)
  const revProgress = interpolate(frame, [8, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentRev = (DATA_STATS.q3_rev_wan * revProgress).toFixed(2);

  const gpProgress = interpolate(frame, [15, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentGp = (DATA_STATS.q3_gp_wan * gpProgress).toFixed(2);

  const ordProgress = interpolate(frame, [22, 54], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const currentOrders = (DATA_STATS.q3_orders_wan * ordProgress).toFixed(2);

  // Parallax subtle camera zoom
  const camScale = interpolate(frame, [0, 90], [1.0, 1.04]);

  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        transform: `scale(${camScale})`,
      }}
    >
      <BrandHeader subtitle="01 / 核心大盘总览" />

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: BRAND.white,
              letterSpacing: 2,
            }}
          >
            三季度营收突破 <span style={{ color: BRAND.primary }}>6900万</span> 创历史新高
          </div>
          <div
            style={{
              fontSize: 28,
              color: BRAND.gray,
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            全季度实现高规模与强盈利双轮驱动，消费活力持续迸发
          </div>
        </div>

        {/* Highlight pill */}
        <div
          style={{
            backgroundColor: BRAND.primary,
            color: BRAND.bgDark,
            padding: '10px 24px',
            borderRadius: 16,
            fontWeight: 900,
            fontSize: 28,
            boxShadow: `0 6px 20px rgba(255, 122, 26, 0.4)`,
          }}
        >
          同比增速 +37.1%
        </div>
      </div>

      {/* 3 Major Metric Cards */}
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 72,
          right: 72,
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr 1fr',
          gap: 32,
        }}
      >
        {/* Card 1: 销售额 (Hero Card) */}
        <div
          style={{
            transform: `scale(${card1})`,
            opacity: card1,
            backgroundColor: 'rgba(255, 122, 26, 0.08)',
            border: `3px solid ${BRAND.primary}`,
            borderRadius: 28,
            padding: '36px 36px',
            position: 'relative',
            boxShadow: `0 12px 36px rgba(255, 122, 26, 0.25)`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: BRAND.primary,
              color: BRAND.bgDark,
              fontSize: 22,
              fontWeight: 900,
              padding: '6px 20px',
              borderBottomLeftRadius: 18,
            }}
          >
            历史峰值
          </div>

          <div style={{ color: BRAND.gray, fontSize: 30, fontWeight: 700 }}>
            Q3 季度总销售额
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 18, gap: 12 }}>
            <span
              style={{
                fontSize: 84,
                fontWeight: 900,
                color: BRAND.primary,
                letterSpacing: -1,
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {currentRev}
            </span>
            <span style={{ fontSize: 38, fontWeight: 800, color: BRAND.white }}>万元</span>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '2px dashed rgba(255, 122, 26, 0.3)',
              display: 'flex',
              gap: 24,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.white }}>
              同比 <span style={{ color: BRAND.accent }}>+{DATA_STATS.yoy_rev_pct}%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.white }}>
              环比 <span style={{ color: BRAND.secondary }}>+{DATA_STATS.qoq_rev_pct}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: 毛利 */}
        <div
          style={{
            transform: `scale(${card2})`,
            opacity: card2,
            backgroundColor: 'rgba(46, 155, 255, 0.08)',
            border: `3px solid ${BRAND.secondary}`,
            borderRadius: 28,
            padding: '36px 36px',
            boxShadow: `0 12px 36px rgba(46, 155, 255, 0.2)`,
          }}
        >
          <div style={{ color: BRAND.gray, fontSize: 30, fontWeight: 700 }}>
            Q3 季度毛利总额
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 18, gap: 12 }}>
            <span
              style={{
                fontSize: 84,
                fontWeight: 900,
                color: BRAND.secondary,
                letterSpacing: -1,
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {currentGp}
            </span>
            <span style={{ fontSize: 38, fontWeight: 800, color: BRAND.white }}>万元</span>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '2px dashed rgba(46, 155, 255, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.white }}>
              毛利率 <span style={{ color: BRAND.accent }}>{DATA_STATS.q3_margin_pct}%</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.white }}>
              同比 <span style={{ color: BRAND.accent }}>+{DATA_STATS.yoy_gp_pct}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: 订单数 */}
        <div
          style={{
            transform: `scale(${card3})`,
            opacity: card3,
            backgroundColor: 'rgba(255, 210, 61, 0.08)',
            border: `3px solid ${BRAND.accent}`,
            borderRadius: 28,
            padding: '36px 36px',
            boxShadow: `0 12px 36px rgba(255, 210, 61, 0.2)`,
          }}
        >
          <div style={{ color: BRAND.gray, fontSize: 30, fontWeight: 700 }}>
            Q3 累计总订单数
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 18, gap: 12 }}>
            <span
              style={{
                fontSize: 84,
                fontWeight: 900,
                color: BRAND.accent,
                letterSpacing: -1,
                fontFamily: 'monospace, sans-serif',
              }}
            >
              {currentOrders}
            </span>
            <span style={{ fontSize: 38, fontWeight: 800, color: BRAND.white }}>万单</span>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '2px dashed rgba(255, 210, 61, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.white }}>
              客单价 <span style={{ color: BRAND.primary }}>{DATA_STATS.q3_atv}元</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: BRAND.white }}>
              同比 <span style={{ color: BRAND.primary }}>+{DATA_STATS.yoy_orders_pct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Monthly progression mini-chart */}
      <div
        style={{
          position: 'absolute',
          bottom: 54,
          left: 72,
          right: 72,
          backgroundColor: 'rgba(244, 246, 255, 0.05)',
          border: '2px solid rgba(244, 246, 255, 0.15)',
          borderRadius: 22,
          padding: '20px 36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 34 }}>📅</span>
          <div>
            <div style={{ color: BRAND.white, fontSize: 28, fontWeight: 800 }}>
              月度走势：7月 <span style={{ color: BRAND.primary }}>2656.19万元</span> (年内峰值) → 8月 2247.83万元 → 9月 1998.46万元
            </div>
            <div style={{ color: BRAND.gray, fontSize: 24, fontWeight: 600, marginTop: 4 }}>
              暑期旺季点燃消费热情，季度内持续高位平稳运行
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: BRAND.secondary,
            color: BRAND.bgDark,
            padding: '8px 24px',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 26,
          }}
        >
          单月突破 2600万+
        </div>
      </div>
    </div>
  );
};
