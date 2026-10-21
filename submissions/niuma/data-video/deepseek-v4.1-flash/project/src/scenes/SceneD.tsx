import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bean, Bolt, Pill, Star as Burst, useBeat } from "../bits";
import { C, FONT } from "../theme";
import { META, TOTAL } from "../data";

/**
 * 第 4 场（22.0–30.0s，小节 12–15）
 *   22.0–26.0s 高潮帧：本季毛利率 54.2%，同比 -2.6pp —— 全片唯一焦点
 *   26.0–30.0s 收尾：品牌落版
 */
export const SceneD: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const beat = useBeat();

  // 高潮帧数字的「砸下来」
  const slam = interpolate(frame, [0, 7, 12], [1.9, 0.96, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const slamIn = interpolate(frame, [0, 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flash = interpolate(frame, [0, 3, 12], [0.5, 0.24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const d1Out = interpolate(frame, [128, 141], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  // 收尾一屏同样用小节第一拍上的斜切遮罩转场，与前面四场保持一致
  const d2Wipe = interpolate(frame, [120, 132], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const d2Clip =
    d2Wipe >= 1 ? undefined : `polygon(0% 0%, ${d2Wipe * 116}% 0%, ${d2Wipe * 116 - 16}% 100%, 0% 100%)`;

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* ---------------- 高潮帧 ---------------- */}
      <div style={{ position: "absolute", inset: 0, opacity: d1Out, scale: `${1 + (1 - d1Out) * 0.05}` }}>
        <Burst
          size={720}
          color="rgba(255,122,26,0.16)"
          stroke="rgba(255,122,26,0.42)"
          points={22}
          style={{ position: "absolute", left: 600, top: 190, rotate: `${t * 10}deg` }}
        />
        {[0, 1, 2].map((i) => {
          const p = ((frame - i * 5) / 34) % 1.6;
          if (p < 0 || p > 1) return null;
          const size = 320 + p * 900;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 960 - size / 2,
                top: 500 - size / 2,
                width: size,
                height: size,
                borderRadius: "50%",
                border: `5px solid rgba(255,210,61,${0.42 * (1 - p)})`,
              }}
            />
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 226,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 56,
            fontWeight: 900,
            color: C.mist,
            letterSpacing: 6,
          }}
        >
          2026 Q3 毛利率
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 300,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 300,
            fontWeight: 900,
            lineHeight: 1.05,
            color: C.yellow,
            letterSpacing: -6,
            scale: `${slam * (1 + beat.down * 0.018)}`,
            opacity: slamIn,
            textShadow: `0 0 ${40 + beat.down * 40}px rgba(255,210,61,0.6), 0 12px 0 rgba(11,16,38,0.9)`,
          }}
        >
          {TOTAL.profitRate}
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, top: 678, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              scale: `${interpolate(frame, [30, 42], [0.6, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: (x) => 1 + 2.6 * Math.pow(x - 1, 3) + 1.6 * Math.pow(x - 1, 2),
              })}`,
            }}
          >
            <Pill bg={C.orange} color={C.ink} fontSize={62} px={40} py={12} rotate={-1.4}>
              同比 {TOTAL.profitRateDelta}
            </Pill>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 838,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 34,
            opacity: interpolate(frame, [48, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            fontFamily: FONT,
          }}
        >
          <span style={{ fontSize: 44, fontWeight: 800, color: C.mist }}>
            销售同比 <span style={{ color: C.yellow, fontWeight: 900 }}>{TOTAL.yoySales}</span>
          </span>
          <span style={{ fontSize: 40, color: C.gray }}>|</span>
          <span style={{ fontSize: 44, fontWeight: 800, color: C.mist }}>
            毛利同比 <span style={{ color: C.orange, fontWeight: 900 }}>{TOTAL.yoyProfit}</span>
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 926,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 38,
            fontWeight: 700,
            color: C.gray,
            opacity: interpolate(frame, [60, 72], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          毛利率同比下滑
        </div>

        <div style={{ position: "absolute", inset: 0, background: C.yellow, opacity: flash, pointerEvents: "none" }} />
      </div>

      {/* ---------------- 收尾 ---------------- */}
      <div style={{ position: "absolute", inset: 0, clipPath: d2Clip }}>
        <Burst
          size={330}
          color="rgba(255,122,26,0.2)"
          stroke="rgba(255,122,26,0.55)"
          style={{ position: "absolute", left: 210, top: 190, rotate: `${-t * 18}deg` }}
        />
        <Burst
          size={210}
          color="rgba(46,155,255,0.24)"
          stroke="rgba(46,155,255,0.6)"
          style={{ position: "absolute", right: 200, bottom: 196, rotate: `${t * 24}deg` }}
        />
        <Bean
          size={70}
          color={C.yellow}
          style={{ position: "absolute", left: 250, top: 648, rotate: `${t * 30}deg`, opacity: 0.95 }}
        />
        <Bolt size={66} style={{ position: "absolute", right: 452, top: 218, rotate: "16deg" }} />

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 384,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontFamily: FONT,
            scale: `${interpolate(frame, [120, 132, 140], [0.8, 1.06, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}`,
            opacity: interpolate(frame, [120, 128], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 300,
              right: 300,
              height: 214,
              background: C.orange,
              transform: "skewX(-12deg)",
              borderRadius: 30,
            }}
          />
          <span
            style={{
              position: "relative",
              fontSize: 172,
              fontWeight: 900,
              color: C.ink,
              letterSpacing: 8,
            }}
          >
            {META.brand}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 634,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 52,
            fontWeight: 800,
            color: C.mist,
            letterSpacing: 4,
            opacity: interpolate(frame, [135, 147], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {META.periodLabel} 经营快报
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 748,
            display: "flex",
            justifyContent: "center",
            gap: 22,
            opacity: interpolate(frame, [150, 164], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <Pill bg={C.mist} color={C.ink} fontSize={38} px={28} py={10} rotate={-1}>
            销售 {TOTAL.sales} 万元
          </Pill>
          <Pill bg={C.yellow} color={C.ink} fontSize={38} px={28} py={10} rotate={1}>
            同比 {TOTAL.yoySales}
          </Pill>
          <Pill bg={C.blue} color={C.ink} fontSize={38} px={28} py={10} rotate={-1.4}>
            毛利率 {TOTAL.profitRate}
          </Pill>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 906,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 34,
            fontWeight: 700,
            color: C.gray,
            opacity: interpolate(frame, [152, 161], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          数据口径：{META.periodLabel} · 金额单位万元
        </div>
      </div>
    </div>
  );
};
