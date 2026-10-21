import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, beatPulse, barPulse, rand } from "./theme";
import {
  Bolt,
  Burst,
  BurstParticles,
  CountUp,
  Dot,
  Glow,
  OutlinedText,
  Shine,
  ShockRing,
  SPRING,
  Sticker,
  EASE_OUT,
} from "./lib";
import data from "./data.json";

// 通用入场：spring 弹出
const pop = (frame: number, at: number, dur = 18) =>
  interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.spring(SPRING),
  });

const rise = (frame: number, at: number, dur = 16) => {
  const p = interpolate(frame, [at, at + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE_OUT,
  });
  return { opacity: p, translateY: `${(1 - p) * 46}px` };
};

const Title: React.FC<{ children: React.ReactNode; at?: number; size?: number }> = ({
  children,
  at = 2,
  size = 66,
}) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 110, top: 96, ...rise(f, at), rotate: "-1.2deg" }}>
      <OutlinedText text={children as string} size={size} color={C.white} strokeWidth={7} />
    </div>
  );
};

// ================================================================ S1 开场
export const S1: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = barPulse(f);
  const boltWig = Math.sin(f / 5) * 6 * Math.min(1, f / 20);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* 品牌贴纸卡 */}
      <div
        style={{
          scale: `${pop(f, 0, 20) * (1 + pulse * 0.03)}`,
          rotate: `${-2 + pulse * 0.6}deg`,
          display: "flex",
          alignItems: "center",
          gap: 40,
          position: "relative",
        }}
      >
        <Bolt size={130} color={C.yellow} style={{ rotate: `${-8 + boltWig}deg`, translateY: "-30px" }} />
        <OutlinedText
          text="牛马咖啡"
          size={250}
          color={C.orange}
          strokeColor={C.white}
          strokeWidth={5}
          style={{ position: "relative" }}
        />
        <Bolt size={130} color={C.yellow} style={{ rotate: `${10 - boltWig}deg`, translateY: "-70px" }} />
      </div>
      <Shine start={54} dur={18} />
      {/* 期间贴纸 */}
      <div style={{ marginTop: 46, scale: `${pop(f, 14)}`, rotate: "1.6deg", display: "flex", gap: 30 }}>
        <Sticker bg={C.yellow} color={C.bg} size={54} pad="16px 42px" rotate={-1}>
          2026 Q3 经营快报
        </Sticker>
        <Sticker bg={C.blue} color={C.bg} size={54} pad="16px 42px" rotate={1.4}>
          7月–9月
        </Sticker>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S2 总量
export const S2: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = barPulse(f);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...rise(f, 8), rotate: "-1deg", marginBottom: 10 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 62, color: C.white, letterSpacing: "0.06em" }}>
          这个季度卖了
        </div>
      </div>
      {/* 巨大数字 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 24,
          scale: `${1 + pulse * 0.035}`,
          opacity: pop(f, 14, 10),
        }}
      >
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 252,
            color: C.yellow,
            lineHeight: 1.05,
            WebkitTextStroke: "12px #0B1026",
            paintOrder: "stroke",
          }}
        >
          <CountUp to={data.q3TotalWan} decimals={1} dur={30} delay={14} />
        </span>
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 84,
            color: C.orange,
            WebkitTextStroke: "8px #0B1026",
            paintOrder: "stroke",
          }}
        >
          万元
        </span>
      </div>
      {/* 徽章 */}
      <div style={{ display: "flex", gap: 34, marginTop: 56 }}>
        <div style={{ scale: `${pop(f, 42)}`, rotate: "-2deg" }}>
          <Sticker bg={C.orange} color={C.bg} size={52} pad="14px 40px">
            同比 +<CountUp to={data.yoyPct} decimals={1} dur={8} delay={44} />%
          </Sticker>
        </div>
        <div style={{ scale: `${pop(f, 56)}`, rotate: "1.8deg" }}>
          <Sticker bg={C.blue} color={C.bg} size={52} pad="14px 40px">
            环比 +<CountUp to={data.qoqPct} decimals={1} dur={8} delay={58} />%
          </Sticker>
        </div>
      </div>
      <Glow size={1100} color="rgba(255,122,26,0.18)" style={{ left: 410, top: -60 }} />
    </AbsoluteFill>
  );
};

// ================================================================ S3 月度柱状
export const S3: React.FC = () => {
  const f = useCurrentFrame();
  const max = Math.max(...data.monthly.map((m) => m.wan));
  const baseY = 920;
  const chartW = 1660;
  const bw = 172;
  const gap = (chartW - bw * 6) / 7;
  return (
    <AbsoluteFill>
      <Title at={0}>7月创单月历史新高</Title>
      {/* 网格基线 */}
      <div
        style={{
          position: "absolute",
          left: 150,
          top: baseY,
          width: 1620,
          height: 5,
          background: C.cardDark,
          borderRadius: 3,
        }}
      />
      {data.monthly.map((m, i) => {
        const at = 8 + i * 8;
        const g = interpolate(f, [at, at + 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const h = (m.wan / max) * 470 * g;
        const peak = m.label === "07月";
        const x = 150 + gap + i * (bw + gap);
        return (
          <React.Fragment key={m.label}>
            <div
              style={{
                position: "absolute",
                left: x,
                top: baseY - h,
                width: bw,
                height: Math.max(h, 0),
                borderRadius: "16px 16px 6px 6px",
                background: peak ? C.orange : C.blue,
                border: `4px solid ${C.bg}`,
                boxShadow: peak ? "0 0 60px rgba(255,122,26,0.5)" : "none",
              }}
            />
            {/* 数值 */}
            <div
              style={{
                position: "absolute",
                left: x - 20,
                top: baseY - h - 62,
                width: bw + 40,
                textAlign: "center",
                fontFamily: FONT,
                fontWeight: 900,
                fontSize: 44,
                color: peak ? C.yellow : C.white,
                opacity: interpolate(f, [at + 10, at + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              {m.wan.toFixed(1)}
            </div>
            {/* 月份 */}
            <div
              style={{
                position: "absolute",
                left: x - 20,
                top: baseY + 20,
                width: bw + 40,
                textAlign: "center",
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 36,
                color: C.gray,
              }}
            >
              {m.label}
            </div>
            {peak && (
              <Burst
                size={240}
                fontSize={40}
                rotate={8}
                style={{ position: "absolute", left: x - 24, top: baseY - h - 330, scale: `${pop(f, 70)}` }}
              >
                历史
                <br />
                新高
              </Burst>
            )}
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", right: 130, top: 110, opacity: 0.9 }}>
        <Sticker bg={C.cardDark} color={C.gray} size={34} pad="10px 26px" border={`3px solid ${C.blue}`}>
          单位：万元
        </Sticker>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S4 大区横条
export const S4: React.FC = () => {
  const f = useCurrentFrame();
  const rows = [...data.regions].sort((a, b) => b.qoqPct - a.qoqPct);
  const max = rows[0].qoqPct;
  const top = 300;
  return (
    <AbsoluteFill>
      <Title at={0}>华北跑得最快</Title>
      <div style={{ position: "absolute", left: 112, top: 176, ...rise(f, 6) }}>
        <span style={{ fontFamily: FONT, fontSize: 38, color: C.gray }}>环比增速 · 五大区</span>
      </div>
      {rows.map((r, i) => {
        const at = 8 + i * 9;
        const g = interpolate(f, [at, at + 22], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const hot = r.name === "华北";
        const barW = 620 + (r.qoqPct / max) * 560;
        const y = top + i * 128;
        return (
          <div key={r.name} style={{ position: "absolute", left: 150, top: y, width: 1640, opacity: pop(f, at, 8) }}>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div
                style={{
                  width: 150,
                  textAlign: "right",
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 48,
                  color: hot ? C.orange : C.white,
                }}
              >
                {r.name}
              </div>
              {/* 轨道 */}
              <div style={{ position: "relative", width: 1200, height: 66 }}>
                <div style={{ position: "absolute", inset: 0, background: C.cardDark, borderRadius: 16 }} />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: 66,
                    width: barW * g,
                    borderRadius: 16,
                    background: hot ? C.orange : C.blue,
                    border: `4px solid ${C.bg}`,
                    boxShadow: hot ? "0 0 46px rgba(255,122,26,0.45)" : "none",
                  }}
                />
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 52,
                  color: hot ? C.yellow : C.white,
                  scale: `${hot ? 1 + beatPulse(f) * 0.05 : 1}`,
                }}
              >
                +{r.qoqPct.toFixed(1)}%
              </div>
            </div>
          </div>
        );
      })}
      {/* 华北高亮贴纸 */}
      <Burst
        size={230}
        fontSize={38}
        rotate={10}
        color={C.yellow}
        style={{ position: "absolute", right: 420, top: 90, scale: `${pop(f, 28)}` }}
      >
        增速
        <br />
        第一
      </Burst>
      <div style={{ position: "absolute", left: 150, bottom: 96, scale: `${pop(f, 84)}`, rotate: "-1.4deg" }}>
        <Sticker bg={C.orange} color={C.bg} size={42} pad="12px 34px">
          华北 Q3 销售额 {data.regions.find((r) => r.name === "华北")?.q3Wan.toFixed(1)} 万
        </Sticker>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S5 品类
export const S5: React.FC = () => {
  const f = useCurrentFrame();
  const rows = [...data.cats].sort((a, b) => b.yoyPct - a.yoyPct);
  const top = 272;
  return (
    <AbsoluteFill>
      <Title at={0}>轻食同比 +215.0%</Title>
      {rows.map((r, i) => {
        const at = 8 + i * 10;
        const hot = r.name === "轻食";
        const slide = interpolate(f, [at, at + 20], [900, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <div
            key={r.name}
            style={{
              position: "absolute",
              left: 170,
              top: top + i * 142,
              width: 1580,
              opacity: pop(f, at, 8),
              translateX: `${slide}px`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: hot ? C.orange : C.cardDark,
                border: `4px solid ${hot ? C.bg : C.blue}`,
                borderRadius: 26,
                padding: hot ? "28px 46px" : "18px 46px",
                boxShadow: hot ? "0 0 60px rgba(255,122,26,0.4)" : "none",
                rotate: `${hot ? -1.2 : 0}deg`,
              }}
            >
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: hot ? 58 : 46,
                  color: hot ? C.bg : C.white,
                }}
              >
                {r.name}
              </span>
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: hot ? 78 : 52,
                  color: hot ? C.bg : r.yoyPct >= 50 ? C.yellow : C.blue,
                }}
              >
                +{r.yoyPct.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
      <Burst
        size={240}
        fontSize={40}
        rotate={-9}
        color={C.yellow}
        style={{ position: "absolute", left: 760, top: 150, scale: `${pop(f, 14)}` }}
      >
        品类
        <br />
        之最
      </Burst>
    </AbsoluteFill>
  );
};

// ================================================================ S6 外卖 donut
export const S6: React.FC = () => {
  const f = useCurrentFrame();
  const p = interpolate(f, [14, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const R = 250;
  const circ = 2 * Math.PI * R;
  const wm = data.wmShare; // 51.9
  const md = data.mdShare; // 48.1
  const pulse = 1 + barPulse(f) * 0.02;
  // 七个季度外卖占比（与 facts.json s6-streak 同源：逐季核算）
  const qtrs = [38.7, 41.2, 43.4, 45.2, 47.9, 50.0, 51.9];
  const sw = 560;
  const sh = 300;
  const localXY = (v: number, i: number): [number, number] => [
    30 + (i * sw) / 6,
    70 + sh - ((v - 30) / 30) * sh,
  ];
  const lineY = 70 + sh - ((50 - 30) / 30) * sh;
  const sparkP = interpolate(f, [56, 92], [0, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Title at={0} size={62}>
        外卖占比 51.9%，首次过半
      </Title>
      {/* donut */}
      <div
        style={{
          position: "absolute",
          left: 430,
          top: 600,
          scale: `${pulse}`,
        }}
      >
        <svg width={R * 2 + 40} height={R * 2 + 40} style={{ marginLeft: -R - 20, marginTop: -R - 20 }}>
          <g transform={`translate(${R + 20},${R + 20}) rotate(-90)`}>
            <circle r={R} fill="none" stroke={C.cardDark} strokeWidth={74} />
            <circle
              r={R}
              fill="none"
              stroke={C.blue}
              strokeWidth={74}
              pathLength={100}
              strokeDasharray={`${md * p} 100`}
              strokeDashoffset={-wm * p}
              strokeLinecap="butt"
            />
            <circle
              r={R}
              fill="none"
              stroke={C.orange}
              strokeWidth={74}
              pathLength={100}
              strokeDasharray={`${wm * p} 100`}
              strokeDashoffset={0}
              strokeLinecap="butt"
            />
          </g>
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 96, color: C.yellow, lineHeight: 1 }}>
            {wm.toFixed(1)}%
          </span>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 42, color: C.white, marginTop: 8 }}>外卖</span>
        </div>
      </div>
      {/* 右列 */}
      <div style={{ position: "absolute", left: 1010, top: 470, display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ scale: `${pop(f, 28)}`, rotate: "-1.2deg" }}>
          <Sticker bg={C.orange} color={C.bg} size={44} pad="12px 34px">
            外卖 {wm.toFixed(1)}%
          </Sticker>
        </div>
        <div style={{ scale: `${pop(f, 42)}`, rotate: "1deg" }}>
          <Sticker bg={C.blue} color={C.bg} size={44} pad="12px 34px">
            门店 {md.toFixed(1)}%
          </Sticker>
        </div>
        <div style={{ scale: `${pop(f, 56)}`, rotate: "-1.6deg" }}>
          <Sticker bg={C.yellow} color={C.bg} size={44} pad="12px 34px">
            外卖同比 +{data.wmYoy.toFixed(1)}%
          </Sticker>
        </div>
        <div style={{ scale: `${pop(f, 70)}`, rotate: "1.2deg" }}>
          <Sticker bg={C.cardDark} color={C.white} size={44} pad="12px 34px" border={`4px solid ${C.orange}`}>
            连续 7 季上升
          </Sticker>
        </div>
      </div>
      {/* 七季迷你折线 */}
      <div style={{ position: "absolute", left: 1090, top: 110, ...rise(f, 56) }}>
        <svg width={sw + 150} height={sh + 120}>
          {/* 50% 基准线 */}
          <line x1={0} x2={sw + 60} y1={lineY} y2={lineY} stroke={C.gray} strokeWidth={3} strokeDasharray="10 8" opacity={0.6} />
          <text x={sw + 70} y={lineY + 10} fill={C.gray} fontSize={30} fontFamily={FONT} fontWeight={700}>
            50%
          </text>
          <polyline
            points={qtrs
              .map((v, i) => localXY(v, i))
              .slice(0, Math.max(2, Math.floor(sparkP)))
              .map(([x, y]) => `${x},${y}`)
              .join(" ")}
            fill="none"
            stroke={C.orange}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {qtrs.map((v, i) => {
            const [x, y] = localXY(v, i);
            return sparkP > i + 1 ? (
              <circle key={i} cx={x} cy={y} r={11} fill={i === 6 ? C.yellow : C.orange} stroke={C.bg} strokeWidth={4} />
            ) : null;
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================ S7 高潮帧
export const S7: React.FC = () => {
  const f = useCurrentFrame();
  const dim = interpolate(f, [0, 22], [0, 0.62], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hit = f >= 56;
  const leadOpacity = interpolate(f, [2, 12, 50, 56], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leadScale = interpolate(f, [2, 56], [0.94, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  return (
    <AbsoluteFill>
      {/* 压暗聚焦 */}
      <AbsoluteFill style={{ background: "#05070F", opacity: dim }} />
      {!hit && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: leadOpacity,
            scale: `${leadScale}`,
          }}
        >
          <OutlinedText text="最重要的一个数字" size={104} color={C.white} strokeWidth={7} />
        </div>
      )}
      {hit && (
        <>
          <Glow size={1300} color="rgba(255,210,61,0.22)" style={{ left: 310, top: -110 }} />
          <ShockRing cx={960} cy={470} startFrame={56} color={C.orange} />
          <BurstParticles cx={960} cy={470} startFrame={56} count={40} />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              scale: `${pop(f, 56, 14)}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, scale: `${1 + barPulse(f) * 0.02}` }}>
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 288,
                  color: C.yellow,
                  lineHeight: 1,
                  WebkitTextStroke: "14px #0B1026",
                  paintOrder: "stroke",
                  textShadow: "0 0 90px rgba(255,210,61,0.35)",
                }}
              >
                <CountUp to={data.q3TotalWan} decimals={1} dur={10} delay={56} />
              </span>
              <span
                style={{
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 100,
                  color: C.orange,
                  WebkitTextStroke: "9px #0B1026",
                  paintOrder: "stroke",
                }}
              >
                万元
              </span>
            </div>
            <div
              style={{
                marginTop: 34,
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: 52,
                color: C.white,
                opacity: interpolate(f, [58, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
              }}
            >
              2026 Q3 总销售额
            </div>
            <div style={{ marginTop: 26, scale: `${pop(f, 58)}`, rotate: "-2deg" }}>
              <Sticker bg={C.orange} color={C.bg} size={56} pad="14px 46px">
                同比 +{data.yoyPct.toFixed(1)}%
              </Sticker>
            </div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ================================================================ S8 收尾
export const S8: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = barPulse(f);
  const zoom = interpolate(f, [0, 112], [1, 1.045], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", scale: `${zoom}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34, scale: `${pop(f, 2, 20) * (1 + pulse * 0.025)}`, rotate: `${-1.5 + pulse * 0.4}deg` }}>
        <Bolt size={110} color={C.yellow} style={{ rotate: "-10deg" }} />
        <OutlinedText text="牛马咖啡" size={210} color={C.orange} strokeColor={C.white} strokeWidth={5} />
        <Bolt size={110} color={C.yellow} style={{ rotate: "10deg", translateY: "-40px" }} />
      </div>
      <div style={{ marginTop: 44, ...rise(f, 26) }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 50, color: C.white }}>2026 Q3 经营快报 · 完</span>
      </div>
      <div style={{ marginTop: 22, ...rise(f, 42) }}>
        <span
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 62,
            color: C.yellow,
            WebkitTextStroke: "7px #0B1026",
            paintOrder: "stroke",
          }}
        >
          热血不凉，下季再见
        </span>
      </div>
      <div style={{ display: "flex", gap: 26, marginTop: 40, opacity: pop(f, 56) }}>
        <Dot size={22} color={C.orange} />
        <Dot size={22} color={C.blue} />
        <Dot size={22} color={C.yellow} />
      </div>
    </AbsoluteFill>
  );
};
