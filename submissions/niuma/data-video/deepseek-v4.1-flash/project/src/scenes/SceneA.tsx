import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bean, Bolt, Pill, Star as Burst, useBeat } from "../bits";
import { C, FONT } from "../theme";
import { RollingNumber } from "../RollingNumber";
import { META, TOTAL } from "../data";

/**
 * 第 1 场（0.0–6.0s，小节 1–3）
 *   0.0–2.0s  品牌名（由常驻的 BrandMark 承担）与装饰图形上场
 *   2.0–6.0s  本季大盘：6467.7 万元 / 同比 +28.5% / 单季销售额新高
 */
export const SceneA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const beat = useBeat();

  // 整层镜头运动：缓慢推近
  const cam = interpolate(frame, [0, 170], [1.06, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const decoIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const titleIn = interpolate(frame, [fps * 2.0, fps * 2.0 + 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const numIn = interpolate(frame, [fps * 2.0, fps * 2.3], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chipIn = interpolate(frame, [fps * 3.0, fps * 3.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const chip2In = interpolate(frame, [fps * 3.5, fps * 3.9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  // 数字定格后扫过一道光（细、轻，不遮字）
  const sheen = interpolate(frame, [fps * 3.1, fps * 3.9], [-620, 1500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const numPulse = 1 + beat.down * 0.022;

  return (
    <div style={{ position: "absolute", inset: 0, scale: `${cam}` }}>
      {/* 贴纸感装饰 */}
      <Burst
        size={260}
        color="rgba(255,122,26,0.2)"
        stroke="rgba(255,122,26,0.55)"
        style={{
          position: "absolute",
          left: 230,
          top: 620,
          opacity: decoIn,
          rotate: `${t * 22}deg`,
        }}
      />
      <Burst
        size={150}
        color="rgba(46,155,255,0.22)"
        stroke="rgba(46,155,255,0.6)"
        style={{ position: "absolute", right: 210, top: 300, opacity: decoIn, rotate: `${-t * 30}deg` }}
      />
      <Bean
        size={74}
        color={C.yellow}
        style={{ position: "absolute", right: 300, top: 640, rotate: `${t * 40}deg`, opacity: 0.9 * decoIn }}
      />
      <Bean
        size={56}
        color={C.orange}
        style={{ position: "absolute", left: 214, top: 300, rotate: `${-t * 34}deg`, opacity: 0.9 * decoIn }}
      />
      <Bolt
        size={62}
        style={{ position: "absolute", right: 430, top: 760, opacity: decoIn, rotate: "18deg" }}
      />

      {/* 本季大盘 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 322,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 32,
          fontFamily: FONT,
        }}
      >
        <div style={{ opacity: titleIn, translate: `${(1 - titleIn) * 40}px 0px` }}>
          <Pill bg={C.orange} color={C.ink} fontSize={50} px={40} py={12} rotate={-1.6}>
            {META.periodLabel} 经营快报
          </Pill>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "baseline", gap: 20 }}>
          <div
            style={{
              position: "relative",
              fontWeight: 900,
              fontSize: 248,
              lineHeight: 1.1,
              color: C.yellow,
              letterSpacing: -4,
              scale: `${numPulse}`,
              textShadow: `0 0 ${34 + beat.down * 26}px rgba(255,210,61,0.55), 0 10px 0 rgba(11,16,38,0.85)`,
              opacity: numIn,
            }}
          >
            <RollingNumber to={6467.7} start={2.0} dur={1.1} decimals={1} />
            <div
              style={{
                position: "absolute",
                top: -30,
                bottom: -30,
                left: sheen,
                width: 64,
                background:
                  "linear-gradient(100deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)",
                transform: "skewX(-18deg)",
                mixBlendMode: "screen",
              }}
            />
          </div>
          <span style={{ fontSize: 88, fontWeight: 800, color: C.mist, letterSpacing: 4, opacity: numIn }}>
            万元
          </span>
        </div>

        <div style={{ display: "flex", gap: 26, alignItems: "center", marginTop: 6 }}>
          <div style={{ opacity: chipIn, scale: `${0.7 + 0.3 * chipIn}` }}>
            <Pill bg={C.yellow} color={C.ink} fontSize={54} px={36} py={12} rotate={1.2}>
              同比 {TOTAL.yoySales}
            </Pill>
          </div>
          <div style={{ opacity: chip2In, scale: `${0.7 + 0.3 * chip2In}` }}>
            <Pill bg={C.mist} color={C.ink} fontSize={46} px={32} py={12} rotate={-1.4}>
              单季销售额新高
            </Pill>
          </div>
        </div>
      </div>
    </div>
  );
};
