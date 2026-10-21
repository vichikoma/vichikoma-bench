import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import metrics from './metrics.json';

// ---------------------------------------------------------------- 配色（项目内未找到品牌规范文件，自定义的一套高对比配色）
const C = {
  navy: '#0B1026',   // 藏蓝黑 底
  orange: '#FF7A1A', // 燃橙
  blue: '#2E9BFF',   // 冰蓝
  yellow: '#FFD23D', // 明黄
  white: '#F4F6FF',  // 雾白
  grey: '#B9C0DE',   // 雾灰（仅做透明度纹理，不做正文）
};
const FONT = '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif';

// ---------------------------------------------------------------- 节拍：120 BPM，每拍 15 帧，每小节 60 帧
const BEAT = 15;
const pulse = (f: number) => {
  const t = f - Math.floor(f / BEAT) * BEAT; // 距上一拍的帧数
  return 1 + 0.025 * Math.exp(-t / 3);       // 拍点冲击后迅速回落
};

// ---------------------------------------------------------------- 数据格式化（全部来自 metrics.json）
const f1 = (x: number) => x.toFixed(1);
const signed = (x: number) => (x > 0 ? '+' : '') + x.toFixed(1);
const M = metrics;
const ch = M.channel as any;

// ---------------------------------------------------------------- 动效工具
const sp = (frame: number, fps: number, delay = 0, cfg = {damping: 12, stiffness: 140, mass: 0.8}) =>
  spring({frame: Math.max(0, frame - delay), fps, config: cfg});
const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

/** 扫光：斜向高光带，沿 x 方向扫过容器 */
const Sweep: React.FC<{x: number; w?: number; h?: number}> = ({x, w = 260, h = 900}) => (
  <div style={{
    position: 'absolute', left: x, top: -80, width: w, height: h,
    background: `linear-gradient(90deg, transparent, rgba(255,210,61,0.55), transparent)`,
    transform: 'skewX(-18deg)', pointerEvents: 'none',
  }} />
);

/** 贴纸：粗描边 + 斜向偏移阴影（藏蓝黑描边，蓝色投影） */
const sticker = (bg: string): React.CSSProperties => ({
  background: bg, color: C.navy, fontFamily: FONT, fontWeight: 900,
  border: `6px solid ${C.navy}`, borderRadius: 28,
  boxShadow: `12px 12px 0 ${C.blue}`,
});

// ---------------------------------------------------------------- 全局背景（分层视差：点阵 / 斜纹 / 斜切色块）
const Background: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.navy, overflow: 'hidden'}}>
      {/* 远景：斜切色块（最慢） */}
      <div style={{
        position: 'absolute', right: -260 + (f * 0.3) % 40, top: -160, width: 760, height: 1400,
        background: 'rgba(255,122,26,0.10)', transform: 'skewX(-12deg)',
      }} />
      <div style={{
        position: 'absolute', left: -340, bottom: -220, width: 520, height: 700,
        background: 'rgba(46,155,255,0.08)', transform: 'skewX(-12deg)',
      }} />
      {/* 中景：点阵（中速） */}
      <div style={{
        position: 'absolute', inset: -100,
        backgroundImage: `radial-gradient(${C.grey} 3px, transparent 3.5px)`,
        backgroundSize: '64px 64px', opacity: 0.22,
        transform: `translate(${-((f * 0.6) % 64)}px, ${-((f * 0.35) % 64)}px)`,
      }} />
      {/* 近景：斜纹（最快） */}
      <div style={{
        position: 'absolute', inset: -400,
        backgroundImage: `repeating-linear-gradient(115deg, rgba(46,155,255,0.13) 0 36px, transparent 36px 120px)`,
        transform: `translateX(${-((f * 1.8) % 120)}px)`,
      }} />
    </AbsoluteFill>
  );
};

/** 镜头运动：每个镜头整层缓慢推近 */
const Cam: React.FC<{len: number; from?: number; to?: number; children: React.ReactNode}> = ({len, from = 1.0, to = 1.05, children}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [0, len], [from, to], {...clamp, easing: Easing.out(Easing.cubic)});
  return <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------- 镜头 0：开场（0–4 秒）
const Scene0: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slam = sp(f, fps, 0, {damping: 9, stiffness: 200, mass: 0.7});
  const titleScale = interpolate(slam, [0, 1], [1.7, 1]);
  const sub = sp(f, fps, 15);
  const subY = interpolate(sub, [0, 1], [120, 0]);
  const sweepX = interpolate(f, [30, 66], [-500, 1700], clamp);
  const badge = sp(f, fps, 0, {damping: 8, stiffness: 180, mass: 0.6});
  return (
    <Cam len={120} from={1.0} to={1.04}>
      {/* 贴纸：品牌名 */}
      <div style={{
        position: 'absolute', left: 150, top: 130, padding: '14px 36px',
        transform: `rotate(-4deg) scale(${interpolate(badge, [0, 1], [0, 1])})`, ...sticker(C.orange),
        fontSize: 64, letterSpacing: 4,
      }}>牛马咖啡</div>
      {/* 闪电图形（代码绘制） */}
      <svg style={{position: 'absolute', left: 1450, top: 150, transform: `scale(${badge})`, transformOrigin: 'center'}} width={220} height={260} viewBox="0 0 100 120">
        <polygon points="60,0 8,68 46,68 30,120 92,44 52,44 74,0" fill={C.yellow} stroke={C.navy} strokeWidth={6} strokeLinejoin="round" />
      </svg>
      {/* 主标题 */}
      <div style={{position: 'absolute', left: 150, top: 330, transform: `scale(${titleScale})`, transformOrigin: 'left center'}}>
        <div style={{position: 'relative', overflow: 'hidden', fontFamily: FONT, fontWeight: 900, fontSize: 220, lineHeight: 1, color: C.yellow, textShadow: `10px 10px 0 ${C.blue}`}}>
          2026年Q3
          <Sweep x={sweepX} w={240} h={300} />
        </div>
      </div>
      <div style={{
        position: 'absolute', left: 150, top: 620, fontFamily: FONT, fontWeight: 900, fontSize: 170, lineHeight: 1,
        color: C.white, opacity: sub, transform: `translateY(${subY}px)`,
      }}>经营速览</div>
      {/* 底部色带 */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 130, height: 110, background: C.blue, transform: 'skewY(-2deg)', opacity: interpolate(f, [20, 30], [0, 1], clamp)}}>
        <div style={{height: '100%', display: 'flex', alignItems: 'center', paddingLeft: 150, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.navy}}>
          经营数据短片
        </div>
      </div>
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头 1：销售额（4–10 秒）
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = interpolate(f, [0, 15], [0, 100], {...clamp, easing: Easing.out(Easing.cubic)});
  const badge = sp(f, fps, 30, {damping: 8, stiffness: 180, mass: 0.6});
  const sweepX = interpolate(f, [45, 90], [-300, 1500], clamp);
  const bars = [
    {label: '2025Q3', v: M.sales.q3py, color: C.blue, delay: 30},
    {label: '2026Q2', v: M.sales.q2, color: C.blue, delay: 45},
    {label: '2026Q3', v: M.sales.q3, color: C.orange, delay: 60},
  ];
  const maxW = 1300;
  return (
    <Cam len={180} from={1.0} to={1.05}>
      {/* 标签 */}
      <div style={{position: 'absolute', left: 150, top: 150, padding: '12px 30px', background: C.yellow, color: C.navy, fontFamily: FONT, fontWeight: 900, fontSize: 56, borderRadius: 16}}>
        2026年Q3销售额
      </div>
      {/* 焦点：销售额 */}
      <div style={{position: 'absolute', left: 150, top: 270, transform: `scale(${pulse(f)})`, transformOrigin: 'left center'}}>
        <div style={{position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'baseline', fontFamily: FONT, fontWeight: 900, color: C.yellow}}>
          <span style={{fontSize: 300, lineHeight: 1, textShadow: `12px 12px 0 ${C.blue}`, clipPath: `inset(${100 - reveal}% 0 0 0)`}}>{f1(M.sales.q3)}</span>
          <span style={{fontSize: 110, marginLeft: 24, color: C.white}}>万元</span>
          <Sweep x={sweepX} w={220} h={420} />
        </div>
      </div>
      {/* 同比徽章（橙色贴纸） */}
      <div style={{
        position: 'absolute', left: 1380, top: 330, padding: '18px 34px',
        transform: `rotate(4deg) scale(${interpolate(badge, [0, 1], [0, 1])})`, ...sticker(C.orange), fontSize: 64,
      }}>同比 {signed(M.sales.yoyPct)}%</div>
      {/* 图表：横向条形，从 0 开始生长 */}
      {bars.map((b, i) => {
        const grow = sp(f, fps, b.delay, {damping: 11, stiffness: 120, mass: 0.9});
        const w = interpolate(grow, [0, 1], [0, (b.v / M.sales.q3) * maxW]);
        const y = 640 + i * 120;
        return (
          <div key={b.label} style={{position: 'absolute', left: 150, top: y, width: 1700, height: 84, display: 'flex', alignItems: 'center', fontFamily: FONT}}>
            <div style={{width: 230, fontSize: 48, fontWeight: 900, color: C.white}}>{b.label}</div>
            <div style={{width: w, height: 84, background: b.color, border: `4px solid ${C.navy}`, borderRadius: 10}} />
            <div style={{marginLeft: 28, whiteSpace: 'nowrap', fontSize: 52, fontWeight: 900, color: b.color === C.orange ? C.orange : C.white, opacity: grow}}>{f1(b.v)}万元</div>
          </div>
        );
      })}
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头 2：外卖增长（10–14 秒）
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = sp(f, fps, 0, {damping: 8, stiffness: 220, mass: 0.6});
  const rot = interpolate(s, [0, 1], [-14, -3]);
  const sub1 = sp(f, fps, 30);
  const sub2 = sp(f, fps, 45);
  return (
    <Cam len={120} from={1.0} to={1.05}>
      <div style={{position: 'absolute', left: 150, top: 150, fontFamily: FONT, fontWeight: 900, fontSize: 80, color: C.white}}>外卖同比增长</div>
      {/* 焦点：+54.0%（橙色贴纸） */}
      <div style={{
        position: 'absolute', left: 150, top: 290, padding: '20px 60px',
        transform: `rotate(${rot}deg) scale(${pulse(f) * interpolate(s, [0, 1], [0.2, 1])})`, transformOrigin: 'center',
        ...sticker(C.orange), fontSize: 340, lineHeight: 1.05,
      }}>
        {signed(ch['外卖'].yoyPct)}%
      </div>
      <div style={{position: 'absolute', left: 150, top: 830, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.white, opacity: sub1, transform: `translateY(${interpolate(sub1, [0, 1], [30, 0])}px)`}}>
        外卖销售额 {f1(ch['外卖'].sales)}万元
      </div>
      <div style={{position: 'absolute', left: 150, top: 920, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.yellow, opacity: sub2, transform: `translateY(${interpolate(sub2, [0, 1], [30, 0])}px)`}}>
        占总销售额 {f1(ch['外卖'].sharePct)}%
      </div>
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头 3：渠道毛利率对比（14–18 秒）
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rows = [
    {name: '外卖', v: ch['外卖'].marginPct, color: C.blue, delay: 8},
    {name: '门店', v: ch['门店'].marginPct, color: C.yellow, delay: 20},
  ];
  const t1 = sp(f, fps, 30);
  const t2 = sp(f, fps, 45);
  return (
    <Cam len={120} from={1.0} to={1.04}>
      <div style={{position: 'absolute', left: 150, top: 130, fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.white}}>外卖涨得快，赚得薄</div>
      <div style={{position: 'absolute', left: 150, top: 270, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.grey}}>毛利率</div>
      {rows.map((r, i) => {
        const g = sp(f, fps, r.delay, {damping: 10, stiffness: 110, mass: 1});
        const y = 360 + i * 190;
        const w = interpolate(g, [0, 1], [0, r.v / 100 * 1300]);
        return (
          <div key={r.name} style={{position: 'absolute', left: 150, top: y, display: 'flex', alignItems: 'center', fontFamily: FONT}}>
            <div style={{width: 170, height: 130, background: r.color, border: `6px solid ${C.navy}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: C.navy}}>{r.name}</div>
            <div style={{marginLeft: 26, width: w, height: 130, background: r.color, borderRadius: 12, opacity: 0.95}} />
            <div style={{marginLeft: 26, fontSize: 110, fontWeight: 900, color: r.color, opacity: g, lineHeight: 1}}>{f1(r.v)}%</div>
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 150, top: 760, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.white, opacity: t1, transform: `translateY(${interpolate(t1, [0, 1], [30, 0])}px)`}}>
        外卖同比 {signed(ch['外卖'].yoyPct)}%
      </div>
      <div style={{position: 'absolute', left: 150, top: 860, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: C.white, opacity: t2, transform: `translateY(${interpolate(t2, [0, 1], [30, 0])}px)`}}>
        门店同比 {signed(ch['门店'].yoyPct)}%
      </div>
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头 4a：毛利率折线（18–21.5 秒）
const LINE_X = [260, 620, 980, 1340, 1700];
const LINE_Q = ['2025Q3', '2025Q4', '2026Q1', '2026Q2', '2026Q3'];
const yOf = (v: number) => 880 - ((v - 54) / 3) * 520;

const Scene4a: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const series: number[] = M.margin.series;
  const draw = interpolate(f, [15, 75], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const d = series.map((v, i) => `${i === 0 ? 'M' : 'L'} ${LINE_X[i]} ${yOf(v)}`).join(' ');
  const badge = sp(f, fps, 45, {damping: 8, stiffness: 180, mass: 0.6});
  return (
    <Cam len={105} from={1.0} to={1.04}>
      <div style={{position: 'absolute', left: 150, top: 130, fontFamily: FONT, fontWeight: 900, fontSize: 96, color: C.white}}>毛利率连续走低</div>
      <div style={{
        position: 'absolute', right: 150, top: 150, padding: '14px 30px',
        transform: `rotate(3deg) scale(${interpolate(badge, [0, 1], [0, 1])})`, ...sticker(C.yellow), fontSize: 58,
      }}>同比 {signed(M.margin.deltaPt)}个百分点</div>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={1920} height={1080} viewBox="0 0 1920 1080">
        <line x1={160} y1={880} x2={1760} y2={880} stroke={C.grey} strokeOpacity={0.4} strokeWidth={4} />
        <path d={d} pathLength={1} fill="none" stroke={C.blue} strokeWidth={16} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="1" strokeDashoffset={1 - draw} />
      </svg>
      {series.map((v, i) => {
        const p = sp(f, fps, 15 * (i + 1), {damping: 10, stiffness: 180, mass: 0.6});
        const last = i === series.length - 1;
        const r = last ? 30 : 16;
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: LINE_X[i] - r, top: yOf(v) - r, width: 2 * r, height: 2 * r, borderRadius: '50%',
              background: last ? C.orange : C.blue, border: `6px solid ${C.navy}`, transform: `scale(${p})`}} />
            <div style={{position: 'absolute', left: LINE_X[i] - 150, width: 300, textAlign: 'center', top: yOf(v) - 120, fontFamily: FONT, fontWeight: 900, fontSize: last ? 96 : 64,
              color: last ? C.orange : C.yellow, opacity: p}}>{f1(v)}%</div>
            <div style={{position: 'absolute', left: LINE_X[i] - 150, width: 300, textAlign: 'center', top: 940, fontFamily: FONT, fontWeight: 900, fontSize: 44, color: C.white, opacity: p}}>{LINE_Q[i]}</div>
          </React.Fragment>
        );
      })}
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头 4b：高潮帧（21.5–24 秒）
const Scene4b: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const slam = sp(f, fps, 0, {damping: 9, stiffness: 200, mass: 0.7});
  const sweepX = interpolate(f, [12, 50], [-500, 2100], clamp);
  const cap1 = sp(f, fps, 10);
  const cap2 = sp(f, fps, 25);
  return (
    <Cam len={75} from={1.0} to={1.03}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 120, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 96, color: C.white, opacity: interpolate(f, [0, 6], [0, 1], clamp)}}>
        卖得更多，赚得更薄
      </div>
      {/* 高潮：毛利率，全画面唯一焦点 */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 240, textAlign: 'center', transform: `scale(${pulse(f) * interpolate(slam, [0, 1], [1.6, 1])})`, transformOrigin: 'center'}}>
        <div style={{position: 'relative', display: 'inline-block', overflow: 'hidden', fontFamily: FONT, fontWeight: 900, fontSize: 480, lineHeight: 1, color: C.yellow, textShadow: `18px 18px 0 ${C.blue}`}}>
          {f1(M.margin.q3)}%
          <Sweep x={sweepX} w={300} h={700} />
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 64, color: C.white, opacity: cap1, transform: `translateY(${interpolate(cap1, [0, 1], [30, 0])}px)`}}>
        每100元销售额的毛利
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 910, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 56, color: C.grey, opacity: cap2}}>
        去年同期 {f1(M.margin.q3py)} 元
      </div>
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头 5：收束与品牌（24–30 秒）
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const exit = interpolate(f, [90, 105], [1, 0], clamp);
  const chips = [
    {text: `销售额 ${f1(M.sales.q3)}万元　同比 ${signed(M.sales.yoyPct)}%`, bg: C.orange, delay: 0},
    {text: `外卖 同比 ${signed(ch['外卖'].yoyPct)}%`, bg: C.blue, delay: 8},
    {text: `毛利率 ${f1(M.margin.q3)}%　同比 ${signed(M.margin.deltaPt)}个百分点`, bg: C.yellow, delay: 15},
  ];
  const brand = sp(f, fps, 90, {damping: 8, stiffness: 200, mass: 0.6});
  const brandSub = interpolate(f, [100, 115], [0, 1], clamp);
  return (
    <Cam len={180} from={1.0} to={1.03}>
      <div style={{position: 'absolute', inset: 0, opacity: exit}}>
        {chips.map((c, i) => {
          const s = sp(f, fps, c.delay, {damping: 13, stiffness: 150, mass: 0.7});
          return (
            <div key={i} style={{
              position: 'absolute', left: 150, top: 180 + i * 240, width: 1620, height: 170,
              display: 'flex', alignItems: 'center', paddingLeft: 50, boxSizing: 'border-box',
              background: c.bg, border: `6px solid ${C.navy}`, borderRadius: 30, boxShadow: `12px 12px 0 ${C.navy}`,
              transform: `translateX(${interpolate(s, [0, 1], [-900, 0])}px)`,
              fontFamily: FONT, fontWeight: 900, fontSize: 66, color: C.navy,
            }}>{c.text}</div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 230, textAlign: 'center', transform: `scale(${interpolate(brand, [0, 1], [0.4, 1])})`}}>
        <div style={{display: 'inline-block', padding: '30px 90px', ...sticker(C.yellow), fontSize: 230, lineHeight: 1.1, letterSpacing: 10, transform: 'rotate(-3deg)'}}>
          牛马咖啡
        </div>
      </div>
      <svg style={{position: 'absolute', left: 1330, top: 640}} width={220} height={260} viewBox="0 0 100 120">
        <polygon points="60,0 8,68 46,68 30,120 92,44 52,44 74,0" fill={C.orange} stroke={C.navy} strokeWidth={6} strokeLinejoin="round" />
      </svg>
      <div style={{position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 84, color: C.white, opacity: brandSub}}>
        2026年Q3 经营速览
      </div>
    </Cam>
  );
};

// ---------------------------------------------------------------- 镜头切换：斜切遮罩（在拍点上完全遮住，切换发生在遮住的瞬间）
const WIPE_AT = [
  {b: 120, color: C.orange}, {b: 300, color: C.yellow}, {b: 420, color: C.blue},
  {b: 540, color: C.orange}, {b: 645, color: C.yellow}, {b: 720, color: C.blue},
];
const Wipes: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      {WIPE_AT.map(({b, color}) => {
        if (f < b - 8 || f > b + 8) return null;
        const x = interpolate(f, [b - 8, b + 8], [-2300, 2300], {...clamp, easing: Easing.inOut(Easing.cubic)});
        return (
          <div key={b} style={{position: 'absolute', left: -340, top: -200, width: 2600, height: 1500, background: color,
            transform: `translateX(${x}px) skewX(-14deg)`, borderLeft: `10px solid ${C.navy}`}} />
        );
      })}
    </>
  );
};

// ---------------------------------------------------------------- 主合成
export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{background: C.navy, fontFamily: FONT}}>
      <Background />
      <Sequence from={0} durationInFrames={120}><Scene0 /></Sequence>
      <Sequence from={120} durationInFrames={180}><Scene1 /></Sequence>
      <Sequence from={300} durationInFrames={120}><Scene2 /></Sequence>
      <Sequence from={420} durationInFrames={120}><Scene3 /></Sequence>
      <Sequence from={540} durationInFrames={105}><Scene4a /></Sequence>
      <Sequence from={645} durationInFrames={75}><Scene4b /></Sequence>
      <Sequence from={720} durationInFrames={180}><Scene5 /></Sequence>
      <Wipes />
      <Audio src={staticFile('bgm.wav')} />
    </AbsoluteFill>
  );
};
