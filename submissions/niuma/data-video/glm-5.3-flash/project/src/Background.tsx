import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, rand } from "./theme";
import { Bolt } from "./lib";

// 全片背景：藏蓝黑 + 三层视差漂浮元素（大圆 / 闪电 / 圆点）+ 上升粒子
// 层速不同 → 分层视差；元素随节拍轻微呼吸
export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  // 三层视差速度（px/帧）
  const speeds = [0.12, 0.3, 0.62];

  const layer = (n: number, items: React.ReactNode) => (
    <div style={{ position: "absolute", inset: -240, transform: `translateX(${-frame * speeds[n]}px)` }}>
      {items}
    </div>
  );

  // 大软圆（背景层）
  const blobs = Array.from({ length: 7 }).map((_, i) => {
    const x = rand(i * 5 + 1) * 2200;
    const y = rand(i * 5 + 2) * 1100;
    const s = 260 + rand(i * 5 + 3) * 420;
    const col = i % 2 === 0 ? C.blue : C.orange;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: s,
          height: s,
          borderRadius: "50%",
          background: col,
          opacity: 0.07 + rand(i * 5 + 4) * 0.05,
          filter: "blur(30px)",
        }}
      />
    );
  });

  // 闪电 + 描边圆环（中景层）
  const mids = Array.from({ length: 5 }).map((_, i) => {
    const x = rand(i * 9 + 11) * 2100;
    const y = rand(i * 9 + 12) * 1000;
    const rot = -20 + rand(i * 9 + 13) * 40;
    const bob = Math.sin((frame + i * 30) / 40) * 12;
    return i % 2 === 0 ? (
      <Bolt key={i} size={70 + rand(i) * 70} color={C.yellow} style={{ position: "absolute", left: x, top: y + bob, opacity: 0.14, rotate: `${rot}deg` }} />
    ) : (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y + bob,
          width: 90 + rand(i) * 90,
          height: 90 + rand(i) * 90,
          borderRadius: "50%",
          border: `6px dashed ${C.blue}`,
          opacity: 0.18,
          rotate: `${frame * 0.3 + i * 40}deg`,
        }}
      />
    );
  });

  // 圆点（前景层）
  const dots = Array.from({ length: 16 }).map((_, i) => {
    const x = rand(i * 13 + 21) * 2000;
    const y = rand(i * 13 + 22) * 1100;
    const s = 10 + rand(i * 13 + 23) * 22;
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: s,
          height: s,
          borderRadius: "50%",
          background: i % 3 === 0 ? C.orange : i % 3 === 1 ? C.blue : C.yellow,
          opacity: 0.2,
        }}
      />
    );
  });

  // 上升粒子（最前，微微向光）
  const particles = Array.from({ length: 26 }).map((_, i) => {
    const x = rand(i * 17 + 31) * 1920;
    const speed = 0.8 + rand(i * 17 + 32) * 1.8;
    const y = 1120 - ((frame * speed + rand(i * 17 + 33) * 1200) % 1400);
    const sway = Math.sin((frame + i * 24) / 26) * 16;
    const s = 4 + rand(i * 17 + 34) * 6;
    const op = interpolate(y, [80, 300, 1100], [0, 0.4, 0.15], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x + sway,
          top: y,
          width: s,
          height: s,
          borderRadius: "50%",
          background: i % 4 === 0 ? C.yellow : i % 4 === 1 ? C.orange : C.blue,
          opacity: op,
        }}
      />
    );
  });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: C.bg }}>
      {layer(0, blobs)}
      {layer(1, mids)}
      {layer(2, dots)}
      <div style={{ position: "absolute", inset: 0 }}>{particles}</div>
      {/* 顶部/底部轻微暗角，聚焦中心 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgba(5,7,15,0.55) 100%)",
        }}
      />
    </div>
  );
};
