import React from 'react';
import { BRAND } from '../constants';

export const BrandHeader: React.FC<{ subtitle?: string }> = ({ subtitle = '2026 Q3 季度经营报告' }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        left: 72,
        right: 72,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Brand Badge */}
        <div
          style={{
            backgroundColor: BRAND.primary,
            color: BRAND.bgDark,
            padding: '8px 20px',
            borderRadius: 14,
            fontWeight: 900,
            fontSize: 28,
            letterSpacing: 2,
            border: `3px solid ${BRAND.bgDark}`,
            boxShadow: `0 4px 16px rgba(255, 122, 26, 0.4)`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>⚡</span>
          <span>牛马咖啡</span>
        </div>
        <span
          style={{
            color: BRAND.gray,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          COFFEE OPS
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'rgba(244, 246, 255, 0.08)',
          border: `2px solid rgba(46, 155, 255, 0.4)`,
          padding: '6px 20px',
          borderRadius: 24,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: BRAND.accent,
            boxShadow: `0 0 10px ${BRAND.accent}`,
          }}
        />
        <span
          style={{
            color: BRAND.white,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {subtitle}
        </span>
      </div>
    </div>
  );
};
