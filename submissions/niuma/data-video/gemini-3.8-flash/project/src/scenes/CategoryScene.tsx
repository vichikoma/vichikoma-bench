import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { BrandHeader } from '../components/BrandHeader';
import { BRAND, DATA_STATS } from '../constants';

export const CategoryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Intro animation
  const headerSpring = spring({ frame, fps, config: { damping: 12 } });

  // Bar progress animations
  const barProgress = interpolate(frame, [10, 45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const maxRev = 2230.59;

  return (
    <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <BrandHeader subtitle="02 / 业务结构剖析" />

      {/* Title Header */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 72,
          right: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          transform: `scale(${headerSpring})`,
        }}
      >
        <div>
          <div style={{ fontSize: 54, fontWeight: 900, color: BRAND.white }}>
            经典基石稳固 · 特调轻食 <span style={{ color: BRAND.accent }}>双引擎爆发</span>
          </div>
          <div style={{ fontSize: 28, color: BRAND.gray, marginTop: 6, fontWeight: 600 }}>
            咖啡与特调贡献超 60% 营收，轻食同比暴增 215% 成最大黑马
          </div>
        </div>

        {/* Highlight badge */}
        <div
          style={{
            backgroundColor: BRAND.accent,
            color: BRAND.bgDark,
            padding: '10px 24px',
            borderRadius: 16,
            fontWeight: 900,
            fontSize: 28,
            boxShadow: `0 6px 20px rgba(255, 210, 61, 0.4)`,
          }}
        >
          轻食同比 +215.0% 🚀
        </div>
      </div>

      {/* Main Content Area: Left = Category Bars, Right = Channel Distribution */}
      <div
        style={{
          position: 'absolute',
          top: 250,
          left: 72,
          right: 72,
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 36,
        }}
      >
        {/* Left Card: 5 Categories horizontal growing bars */}
        <div
          style={{
            backgroundColor: 'rgba(244, 246, 255, 0.04)',
            border: `2px solid rgba(244, 246, 255, 0.15)`,
            borderRadius: 28,
            padding: '30px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: BRAND.white, fontSize: 30, fontWeight: 800 }}>五大核心品类贡献</span>
            <span style={{ color: BRAND.gray, fontSize: 24, fontWeight: 600 }}>金额单位：万元</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {DATA_STATS.categories.map((cat, idx) => {
              const currentWidth = (cat.rev / maxRev) * 100 * barProgress;
              const displayVal = (cat.rev * barProgress).toFixed(1);

              return (
                <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: BRAND.white, fontSize: 28, fontWeight: 800 }}>{cat.name}</span>
                      <span
                        style={{
                          backgroundColor: `${cat.color}22`,
                          color: BRAND.white,
                          border: `1px solid ${cat.color}`,
                          padding: '2px 10px',
                          borderRadius: 8,
                          fontSize: 20,
                          fontWeight: 700,
                        }}
                      >
                        同比 +{cat.yoy}%
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ color: cat.color, fontSize: 32, fontWeight: 900, fontFamily: 'monospace' }}>
                        {displayVal}
                      </span>
                      <span style={{ color: BRAND.white, fontSize: 22, fontWeight: 700 }}>万元 ({cat.pct}%)</span>
                    </div>
                  </div>

                  {/* Progress track */}
                  <div
                    style={{
                      height: 18,
                      width: '100%',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${currentWidth}%`,
                        backgroundColor: cat.color,
                        borderRadius: 10,
                        boxShadow: `0 0 12px ${cat.color}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Card: Channel split & Regional Insight */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Channel Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 122, 26, 0.06)',
              border: `2px solid ${BRAND.primary}`,
              borderRadius: 24,
              padding: '28px 32px',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: BRAND.white, fontSize: 28, fontWeight: 800 }}>渠道结构：线上线下并进</span>
              <span style={{ color: BRAND.accent, fontSize: 24, fontWeight: 800 }}>外卖反超门店</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
              {/* Delivery */}
              <div
                style={{
                  backgroundColor: 'rgba(255, 122, 26, 0.15)',
                  borderRadius: 18,
                  padding: '18px 20px',
                  border: `2px solid ${BRAND.primary}`,
                }}
              >
                <div style={{ color: BRAND.gray, fontSize: 24, fontWeight: 700 }}>外卖渠道 (51.9%)</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: BRAND.primary, marginTop: 6, fontFamily: 'monospace' }}>
                  {(DATA_STATS.channels[0].rev * barProgress).toFixed(1)}
                  <span style={{ fontSize: 24, color: BRAND.white, marginLeft: 4 }}>万</span>
                </div>
                <div style={{ color: BRAND.accent, fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                  同比增速 +64.0% ⚡
                </div>
              </div>

              {/* Store */}
              <div
                style={{
                  backgroundColor: 'rgba(46, 155, 255, 0.15)',
                  borderRadius: 18,
                  padding: '18px 20px',
                  border: `2px solid ${BRAND.secondary}`,
                }}
              >
                <div style={{ color: BRAND.gray, fontSize: 24, fontWeight: 700 }}>门店渠道 (48.1%)</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: BRAND.secondary, marginTop: 6, fontFamily: 'monospace' }}>
                  {(DATA_STATS.channels[1].rev * barProgress).toFixed(1)}
                  <span style={{ fontSize: 24, color: BRAND.white, marginLeft: 4 }}>万</span>
                </div>
                <div style={{ color: BRAND.white, fontSize: 22, fontWeight: 800, marginTop: 6 }}>
                  毛利率 60.5% (高利)
                </div>
              </div>
            </div>
          </div>

          {/* Region Top 1 Card */}
          <div
            style={{
              backgroundColor: 'rgba(46, 155, 255, 0.06)',
              border: `2px solid ${BRAND.secondary}`,
              borderRadius: 24,
              padding: '24px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ color: BRAND.gray, fontSize: 24, fontWeight: 700 }}>五大区域领头羊</div>
              <div style={{ color: BRAND.white, fontSize: 32, fontWeight: 900, marginTop: 4 }}>
                华东大区 销售额 <span style={{ color: BRAND.secondary }}>2070.43万元</span>
              </div>
              <div style={{ color: BRAND.gray, fontSize: 22, fontWeight: 600, marginTop: 2 }}>
                占全盘 30.0% · 华东、华北、华南三强合计贡献 76.1%
              </div>
            </div>
            <div
              style={{
                backgroundColor: BRAND.secondary,
                color: BRAND.bgDark,
                padding: '10px 20px',
                borderRadius: 14,
                fontWeight: 900,
                fontSize: 26,
              }}
            >
              华东领跑
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ticker bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 54,
          left: 72,
          right: 72,
          backgroundColor: 'rgba(255, 122, 26, 0.1)',
          border: `2px dashed ${BRAND.primary}`,
          borderRadius: 18,
          padding: '16px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: BRAND.white, fontSize: 28, fontWeight: 800 }}>
          💡 结构洞察：外卖高增扩大用户触达面，高毛利门店与经典咖啡稳保利润中枢。
        </span>
        <span style={{ color: BRAND.accent, fontSize: 26, fontWeight: 900 }}>
          全盘毛利率稳定 54.2%
        </span>
      </div>
    </div>
  );
};
