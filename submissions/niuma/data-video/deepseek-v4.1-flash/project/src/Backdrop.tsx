import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { BEAT } from "./timing";

const mod = (a: number, n: number) => ((a % n) + n) % n;

/**
 * 全片共用的背景层（全局时间轴，跨切镜连续，不因切镜重启）。
 * 三层视差：远景斜切大色块 / 中景圆点网格 + 斜纹 / 近景光斑与粒子。
 * 色块做成「靠边浓、向中间淡出」的渐变，保证橙蓝撞色的浓度，又不把画面中央搅浑。
 * 另外叠一条每 4 秒一次的扫光，起点落在小节第一拍上。
 */
export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const beatPhase = t / BEAT;
  const downPulse = Math.max(0, 1 - (beatPhase % 4) * BEAT * 1.15);
  const everyPulse = Math.max(0, 1 - (beatPhase % 1) * 2.6);
  const sweepP = mod(t, 4) / 0.9;

  const dx = (amp: number, sp: number, ph = 0) => Math.sin(t * sp + ph) * amp;

  return (
    <div style={{ position: "absolute", inset: 0, background: C.ink, overflow: "hidden" }}>
      {/* 远景 1：左侧橙色斜切大色块 */}
      <div
        style={{
          position: "absolute",
          left: -700 + dx(120, 0.18),
          top: -180,
          width: 1750,
          height: 1500,
          transform: "skewX(-14deg)",
          rotate: "6deg",
          background: `linear-gradient(100deg, rgba(255,122,26,0.52) 0%, rgba(255,122,26,0.26) 42%, rgba(255,122,26,0) 78%)`,
        }}
      />
      {/* 远景 2：右下蓝色斜切大色块 */}
      <div
        style={{
          position: "absolute",
          left: 1180 + dx(140, 0.14, 2.1),
          top: 320,
          width: 1300,
          height: 1100,
          transform: "skewX(-14deg)",
          rotate: "-5deg",
          background: `linear-gradient(255deg, rgba(46,155,255,0.5) 0%, rgba(46,155,255,0.2) 45%, rgba(46,155,255,0) 80%)`,
        }}
      />
      {/* 远景 3：明黄窄条，点缀 */}
      <div
        style={{
          position: "absolute",
          left: 300 + dx(200, 0.22, 0.8),
          top: 900,
          width: 1500,
          height: 130,
          transform: "skewX(-24deg)",
          background: `linear-gradient(90deg, rgba(255,210,61,0) 0%, rgba(255,210,61,0.3) 50%, rgba(255,210,61,0) 100%)`,
        }}
      />

      {/* 中景：圆点网格（比色块快） */}
      <div
        style={{
          position: "absolute",
          inset: -80,
          backgroundImage: `radial-gradient(${C.gray} 1.6px, transparent 1.8px)`,
          backgroundSize: "72px 72px",
          backgroundPosition: `${mod(t * 20, 72)}px ${mod(-t * 11, 72)}px`,
          opacity: 0.15,
        }}
      />

      {/* 中景：斜纹（更快） */}
      <div
        style={{
          position: "absolute",
          inset: -400,
          background:
            "repeating-linear-gradient(-38deg, rgba(46,155,255,0.55) 0px, rgba(46,155,255,0.55) 3px, transparent 3px, transparent 84px)",
          backgroundPosition: `${mod(t * 30, 130)}px 0px`,
          opacity: 0.1,
        }}
      />

      {/* 近景：游走光斑，随下拍脉冲 */}
      <div
        style={{
          position: "absolute",
          left: 980 + Math.sin(t * 0.55) * 520 - (340 + downPulse * 90),
          top: 160 + Math.cos(t * 0.42) * 260 - (340 + downPulse * 90),
          width: 680 + downPulse * 190,
          height: 680 + downPulse * 190,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255,122,26,${0.22 + downPulse * 0.14}) 0%, rgba(255,122,26,0) 68%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -140 + Math.sin(t * 0.31 + 2) * 220,
          bottom: -200 + Math.cos(t * 0.38 + 1) * 160,
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(46,155,255,0.26) 0%, rgba(46,155,255,0) 70%)`,
        }}
      />

      {/* 近景：上浮粒子（最快） */}
      {Array.from({ length: 30 }).map((_, i) => {
        const rnd = i * 0.137;
        const rnd2 = mod(i * 0.371 + 0.21, 1);
        const speed = 30 + rnd * 54;
        const x = 40 + rnd * 1840;
        const y = 1200 - mod(t * speed + rnd2 * 1360, 1420);
        const size = 3 + rnd2 * 7;
        const col = i % 3 === 0 ? C.yellow : i % 3 === 1 ? C.blue : C.orange;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: col,
              opacity: 0.18 + 0.34 * everyPulse * (0.4 + rnd2),
            }}
          />
        );
      })}

      {/* 周期扫光 */}
      {sweepP < 1 ? (
        <div
          style={{
            position: "absolute",
            top: -600,
            left: -900 + sweepP * 3600,
            width: 560,
            height: 2200,
            background:
              "linear-gradient(96deg, rgba(244,246,255,0) 0%, rgba(244,246,255,0.075) 45%, rgba(244,246,255,0.015) 100%)",
            rotate: "12deg",
          }}
        />
      ) : null}

      {/* 暗角 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 46%, rgba(11,16,38,0) 45%, rgba(11,16,38,0.55) 100%)",
        }}
      />
    </div>
  );
};
