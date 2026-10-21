import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Bean, Bolt, Pill, Star as Burst, useBeat } from "../bits";
import { C, FONT } from "../theme";
import { RollingNumber } from "../RollingNumber";
import { CHANNEL, REGION } from "../data";

const BASE_Y = 892;
const COL_W = 190;
const GAP = 129;
const START_X = (1920 - (5 * COL_W + 4 * GAP)) / 2;
const MAXV = 113.6;
const MAXH = 452;
/** 展示顺序：西南放在最右、最后上竿，前面的平稳先立住，黑马最后冲顶 */
const DISPLAY_ORDER = ["华东", "华南", "华北", "华中", "西南"];
const ROWS = DISPLAY_ORDER.map((n) => REGION.find((r) => r.name === n)!);
const hero = REGION.find((r) => r.name === "西南")!;

/**
 * 第 3 场（14.0–22.0s，小节 8–11）
 *   14.0–18.0s 五个大区的同比增速柱状图，西南一柱冲天
 *   18.0–22.0s 渠道结构：外卖 52.1%，首次过半
 */
export const SceneC: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const beat = useBeat();
  const cam = interpolate(frame, [0, 239], [1.0, 1.045], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleIn = interpolate(frame, [0, 9], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 2.4),
  });

  // 西南冲顶时的全场闪白
  const flash = interpolate(frame, [56, 60, 72], [0, 0.42, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const callIn = interpolate(frame, [60, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });

  const chartOut = interpolate(frame, [120, 132], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const c2In = interpolate(frame, [120, 132], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });

  // 外卖占比生长
  const grow = interpolate(frame, [122, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (x) => 1 - Math.pow(1 - x, 3),
  });
  const deliveryW = 0.521 * 1680 * grow;

  return (
    <div style={{ position: "absolute", inset: 0, scale: `${cam}` }}>
      <div style={{ position: "absolute", inset: 0, opacity: chartOut }}>
        <Burst
          size={280}
          color="rgba(255,122,26,0.18)"
          stroke="rgba(255,122,26,0.5)"
          style={{ position: "absolute", left: -50, bottom: -40, rotate: `${t * 14}deg` }}
        />
        <Bean
          size={60}
          color={C.blue}
          style={{ position: "absolute", left: 160, top: 96, rotate: `${t * 30}deg`, opacity: 0.8 }}
        />

        <div
          style={{
            position: "absolute",
            left: 120,
            top: 158,
            opacity: titleIn,
            translate: `${(1 - titleIn) * -50}px 0px`,
          }}
        >
          <Pill bg={C.blue} color={C.ink} fontSize={48} px={34} py={10} rotate={-1.2}>
            增长从哪来 · 大区
          </Pill>
        </div>

        {/* 副标题：把上方空区填住，同时给出图表口径 */}
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 254,
            fontFamily: FONT,
            fontSize: 44,
            fontWeight: 800,
            color: C.gray,
            opacity: titleIn,
            translate: `${(1 - titleIn) * -30}px 0px`,
          }}
        >
          2026 Q3 各大区销售额同比
        </div>

        {/* 右上角结论标签：黑马上竿的同时弹出 */}
        <div
          style={{
            position: "absolute",
            right: 120,
            top: 158,
            opacity: callIn,
            scale: `${0.72 + 0.28 * callIn}`,
            rotate: "1.6deg",
          }}
        >
          <Pill bg={C.orange} color={C.ink} fontSize={46} px={34} py={12}>
            西南领跑 {hero.yoy}
          </Pill>
        </div>

        {/* 基线 */}
        <div
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: BASE_Y + 4,
            height: 2,
            background: C.gray,
            opacity: 0.4,
          }}
        />

        {ROWS.map((r, i) => {
          const start = i * 12;
          const hero = r.name === "西南";
          const p = interpolate(frame, [start, start + (hero ? 12 : 13)], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: (x) => (hero ? 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2) : 1 - Math.pow(1 - x, 3)),
          });
          const h = Math.max(0, (r.value / MAXV) * MAXH * p);
          const full = (r.value / MAXV) * MAXH;
          const x = START_X + i * (COL_W + GAP);
          const col = hero ? C.orange : C.blue;
          const ghostIn = interpolate(frame, [i * 4, i * 4 + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: (x2) => 1 - Math.pow(1 - x2, 3),
          });
          return (
            <React.Fragment key={r.name}>
              {/* 幽灵轮廓：先把整张图的高度结构立住，实心柱再长进去 —— 避免前两秒画面下半部空着 */}
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: BASE_Y - full,
                  width: COL_W,
                  height: full,
                  borderRadius: 22,
                  border: `4px solid ${hero ? "rgba(255,122,26,0.62)" : "rgba(46,155,255,0.4)"}`,
                  opacity: ghostIn * (r.name === "西南" ? 0.85 : 0.7),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: x,
                  top: BASE_Y - h,
                  width: COL_W,
                  height: h,
                  background: col,
                  borderRadius: 22,
                  border: `6px solid ${C.ink}`,
                  opacity: hero ? 1 : 0.72,
                  boxShadow: hero
                    ? `0 0 ${26 + beat.down * 34}px rgba(255,122,26,0.7)`
                    : "0 0 0 rgba(0,0,0,0)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: x - 20,
                  width: COL_W + 40,
                  top: BASE_Y - h - 62,
                  textAlign: "center",
                  fontFamily: FONT,
                  fontSize: hero ? 58 : 46,
                  fontWeight: 900,
                  color: hero ? C.yellow : C.mist,
                  opacity: Math.min(1, p),
                  textShadow: hero ? "0 0 24px rgba(255,210,61,0.6)" : "none",
                }}
              >
                {r.yoy}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: x - 20,
                  width: COL_W + 40,
                  top: BASE_Y + 22,
                  textAlign: "center",
                  fontFamily: FONT,
                  fontSize: 44,
                  fontWeight: 800,
                  color: hero ? C.orange : C.gray,
                  opacity: Math.min(1, p),
                }}
              >
                {r.name}
              </div>
            </React.Fragment>
          );
        })}

        {/* 西南冲顶时的爆炸贴，压在黑马柱的正上方 */}
        {frame > 56 ? (
          <Burst
            size={170}
            color={C.yellow}
            style={{
              position: "absolute",
              left: 1296,
              top: 292,
              opacity: interpolate(frame, [58, 68], [0, 0.95], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              rotate: `${t * 40}deg`,
            }}
          />
        ) : null}
      </div>

      {/* 渠道：外卖首次过半 */}
      <div style={{ position: "absolute", inset: 0, opacity: c2In }}>
        <Bolt size={62} style={{ position: "absolute", right: 150, bottom: 190, rotate: "14deg" }} />
        <Bean
          size={58}
          color={C.orange}
          style={{ position: "absolute", left: 130, bottom: 200, rotate: `${t * 30}deg`, opacity: 0.9 }}
        />

        <div style={{ position: "absolute", left: 120, top: 158 }}>
          <Pill bg={C.blue} color={C.ink} fontSize={48} px={34} py={10} rotate={-1.2}>
            渠道 · 外卖首次过半
          </Pill>
        </div>

        <div
          style={{
            position: "absolute",
            left: 120,
            top: 330,
            fontSize: 46,
            fontWeight: 800,
            color: C.gray,
            fontFamily: FONT,
          }}
        >
          2026 Q3 渠道销售占比
        </div>

        {/* 100% 堆叠条 */}
        <div
          style={{
            position: "absolute",
            left: 120,
            top: 412,
            width: 1680,
            height: 208,
            borderRadius: 36,
            border: `8px solid ${C.ink}`,
            overflow: "hidden",
            display: "flex",
            boxShadow: "16px 16px 0 rgba(11,16,38,0.6)",
          }}
        >
          <div
            style={{
              width: deliveryW,
              height: "100%",
              background: C.orange,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 76, fontWeight: 900, color: C.ink, opacity: interpolate(grow, [0.6, 0.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              外卖 {CHANNEL.deliveryShare}
            </span>
          </div>
          <div
            style={{
              flex: 1,
              height: "100%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontFamily: FONT, fontSize: 66, fontWeight: 900, color: C.ink, opacity: interpolate(grow, [0.6, 0.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
              门店 {CHANNEL.storeShare}
            </span>
          </div>
        </div>

        {/* 50% 中线 */}
        <div
          style={{
            position: "absolute",
            left: 120 + 1680 * 0.5 - 2,
            top: 372,
            width: 4,
            height: 288,
            background: C.yellow,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 120 + 1680 * 0.5 - 70,
            top: 292,
            width: 140,
            textAlign: "center",
            fontFamily: FONT,
            fontSize: 34,
            fontWeight: 900,
            color: C.yellow,
          }}
        >
          半数
        </div>

        {/* 同比 */}
        <div style={{ position: "absolute", left: 120, top: 700, display: "flex", gap: 26 }}>
          <div
            style={{
              opacity: interpolate(frame, [136, 146], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              scale: `${interpolate(frame, [136, 146], [0.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}`,
            }}
          >
            <Pill bg={C.orange} color={C.ink} fontSize={46} px={30} py={10} rotate={-1}>
              外卖同比 {CHANNEL.deliveryYoy}
            </Pill>
          </div>
          <div
            style={{
              opacity: interpolate(frame, [143, 153], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              scale: `${interpolate(frame, [143, 153], [0.7, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}`,
            }}
          >
            <Pill bg={C.mist} color={C.ink} fontSize={46} px={30} py={10} rotate={1.2}>
              门店同比 {CHANNEL.storeYoy}
            </Pill>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 120,
            top: 820,
            fontFamily: FONT,
            fontSize: 40,
            fontWeight: 700,
            color: C.gray,
            opacity: interpolate(frame, [150, 162], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          外卖撑起增量，但毛利率低于门店
        </div>
      </div>

      {/* 闪白 */}
      <div style={{ position: "absolute", inset: 0, background: C.yellow, opacity: flash, pointerEvents: "none" }} />
    </div>
  );
};
