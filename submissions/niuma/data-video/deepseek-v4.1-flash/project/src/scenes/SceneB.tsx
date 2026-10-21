import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bean, Bolt, Pill, Star as Burst, useBeat } from "../bits";
import { C, FONT } from "../theme";
import { RollingNumber } from "../RollingNumber";
import { CATEGORY } from "../data";

const TITLE_TOP = 158;
const CHART_TOP = 306;
const ROW_H = 106;
const ROW_GAP = 22;
const NAME_X = 120;
const NAME_W = 190;
const TRACK_X = 340;
const TRACK_W = 1180;
const ZERO_RATIO = 0.08;
const VALUE_X = 1556;
const MAXV = 210;

const colorOf = (name: string) => {
  if (name === "轻食") return C.orange;
  if (name === "茶饮") return C.yellow;
  if (name === "创意特调") return C.blue;
  return C.gray;
};

/**
 * 第 2 场（6.0–14.0s，小节 4–7）
 *   6.0–10.0s  五个品类的同比增速条形图，逐拍生长
 *   10.0–14.0s 轻食的条形冲出图表、铺满画面：+195.6%
 */
export const SceneB: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const beat = useBeat();
  const focus = interpolate(frame, [120, 138], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const cam = interpolate(frame, [0, 239], [1.03, 0.995], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleIn = interpolate(frame, [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 2.4),
  });

  const zeroX = TRACK_X + TRACK_W * ZERO_RATIO;
  const unit = (TRACK_W * (1 - ZERO_RATIO)) / MAXV;

  return (
    <div style={{ position: "absolute", inset: 0, scale: `${cam}` }}>
      <Burst
        size={300}
        color="rgba(46,155,255,0.2)"
        stroke="rgba(46,155,255,0.55)"
        style={{ position: "absolute", right: -60, top: -70, rotate: `${t * 16}deg` }}
      />
      <Bean
        size={58}
        color={C.orange}
        style={{ position: "absolute", left: 132, top: 928, rotate: `${t * 36}deg`, opacity: 0.9 }}
      />
      <Bolt size={58} style={{ position: "absolute", left: 300, top: 916, opacity: 0.95, rotate: "-14deg" }} />

      <div
        style={{
          position: "absolute",
          left: NAME_X,
          top: TITLE_TOP,
          opacity: titleIn,
          translate: `${(1 - titleIn) * -50}px 0px`,
        }}
      >
        <Pill bg={C.blue} color={C.ink} fontSize={48} px={34} py={10} rotate={-1.2}>
          增长从哪来 · 品类
        </Pill>
      </div>

      {/* 条形图 */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - focus * 0.965 }}>
        <div
          style={{
            position: "absolute",
            left: zeroX,
            top: CHART_TOP - 14,
            width: 3,
            height: 5 * ROW_H + 4 * ROW_GAP + 28,
            background: C.gray,
            opacity: 0.45,
          }}
        />
        {CATEGORY.map((row, i) => {
          const start = i * 12; // 6.0s + i*0.4s
          const p = interpolate(frame, [start, start + 13], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: (x) => 1 - Math.pow(1 - x, 3),
          });
          const top = CHART_TOP + i * (ROW_H + ROW_GAP);
          const w = Math.abs(row.value) * unit * p;
          const isNeg = row.value < 0;
          const col = colorOf(row.name);
          return (
            <div key={row.name} style={{ position: "absolute", left: 0, right: 0, top, height: ROW_H }}>
              <div
                style={{
                  position: "absolute",
                  left: NAME_X,
                  top: 0,
                  width: NAME_W,
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  fontFamily: FONT,
                  fontSize: 46,
                  fontWeight: 800,
                  color: row.name === "轻食" ? C.orange : C.mist,
                  opacity: p,
                  translate: `${(1 - p) * -40}px 0px`,
                }}
              >
                {row.name}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: isNeg ? zeroX - w : zeroX,
                  top: 12,
                  width: w,
                  height: ROW_H - 24,
                  background: col,
                  borderRadius: 18,
                  border: `5px solid ${C.ink}`,
                  opacity: p,
                  boxShadow: row.name === "轻食" ? `0 0 ${18 + beat.down * 20}px rgba(255,122,26,0.6)` : "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: VALUE_X,
                  top: 0,
                  width: 244,
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  fontFamily: FONT,
                  fontSize: 54,
                  fontWeight: 900,
                  color: isNeg ? C.gray : C.mist,
                  opacity: p,
                }}
              >
                {isNeg ? "-" : "+"}
                <RollingNumber to={Math.abs(row.value)} start={(start + 2) / fps} dur={0.55} decimals={1} />%
              </div>
            </div>
          );
        })}
      </div>

      {/* 聚焦：轻食的条形冲出图表，铺满画面 */}
      {focus > 0.001 ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              left: NAME_X,
              top: 366,
              width: interpolate(focus, [0, 1], [0, 1680]),
              height: 214,
              background: C.orange,
              borderRadius: 36,
              border: `7px solid ${C.ink}`,
              boxShadow: `0 0 ${30 + beat.down * 40}px rgba(255,122,26,0.65), 14px 14px 0 rgba(11,16,38,0.6)`,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 48px",
              fontFamily: FONT,
            }}
          >
            <span style={{ fontSize: 104, fontWeight: 900, color: C.ink, opacity: focus }}>轻食</span>
            <span style={{ fontSize: 132, fontWeight: 900, color: C.ink, opacity: focus, letterSpacing: -2 }}>
              +<RollingNumber to={195.6} start={120 / fps + 0.12} dur={0.55} decimals={1} />%
            </span>
            <div
              style={{
                position: "absolute",
                top: -40,
                bottom: -40,
                left: interpolate(frame, [126, 150], [-300, 2000], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }),
                width: 120,
                background:
                  "linear-gradient(100deg, rgba(244,246,255,0) 0%, rgba(244,246,255,0.6) 50%, rgba(244,246,255,0) 100%)",
                transform: "skewX(-18deg)",
                mixBlendMode: "screen",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              left: NAME_X,
              top: 626,
              display: "flex",
              alignItems: "center",
              gap: 24,
              opacity: interpolate(frame, [134, 146], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              translate: `0px ${interpolate(frame, [134, 146], [26, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })}px`,
              fontFamily: FONT,
            }}
          >
            <Pill bg={C.yellow} color={C.ink} fontSize={42} px={28} py={10} rotate={1}>
              增速第一
            </Pill>
            <span style={{ fontSize: 46, fontWeight: 700, color: C.mist }}>
              轻食占本季销售额 <span style={{ color: C.yellow, fontWeight: 900 }}>15.5%</span>
            </span>
          </div>

          <div
            style={{
              position: "absolute",
              left: NAME_X,
              top: 736,
              fontSize: 40,
              fontWeight: 700,
              color: C.gray,
              fontFamily: FONT,
              opacity: interpolate(frame, [146, 158], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
            }}
          >
            经典咖啡 +2.0% · 周边 -5.5%
          </div>
        </div>
      ) : null}
    </div>
  );
};
