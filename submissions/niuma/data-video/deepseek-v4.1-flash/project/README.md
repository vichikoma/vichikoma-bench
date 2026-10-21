# 牛马咖啡 2026 Q3 经营快报 · Remotion 工程

## 复现成片

```bash
cd project
npm install          # 首次
npx remotion render NiuMaQ3 ../out/video.mp4
```

也支持：

```bash
npx remotion studio            # 打开预览
npx remotion still NiuMaQ3 out.png --frame=765   # 导出单帧
npx remotion compositions      # 列出可用 composition
```

## 结构

| 文件 | 作用 |
|---|---|
| `src/index.ts` | 入口（`registerRoot`） |
| `src/Root.tsx` | 注册 composition `NiuMaQ3`（1920×1080 / 30fps / 900 帧 = 30s） |
| `src/NiuMaQ3.tsx` | 场景编排、常驻品牌角标、底部节拍条、音轨 |
| `src/timing.ts` | 时间轴：120 BPM，每拍 0.5s、每小节 2.0s，全片 15 小节 |
| `src/theme.ts` | 品牌色（取自 `brand.md`）与安全边距 |
| `src/bits.tsx` | 贴纸风基础件：`Pill` / `Bolt` / `Star` / `Bean` / `Reveal`（斜切遮罩转场）/ `BeatBar`（节拍刻度）/ `useBeat`（节拍联动） |
| `src/Backdrop.tsx` | 全片共用背景：三层视差 + 斜切色块 + 圆点网格 + 斜纹 + 光斑 + 粒子 + 周期扫光 + 暗角 |
| `src/RollingNumber.tsx` | 数字滚动 |
| `src/data.ts` | 画面用到的全部数字（由 `data/` 聚合而来） |
| `src/scenes/SceneA–D.tsx` | 四场 |

## 画面结构（每处切镜都落在小节第一拍，误差 0 帧）

| 时间 | 内容 | 手法 |
|---|---|---|
| 0.0–6.0s | 品牌居中 → 收到右上角常驻；本季大盘 6467.7 万元 / 同比 +28.5% | 推近、数字滚动、辉光、扫光 |
| 6.0–14.0s | 品类同比条形图逐拍生长；10.0s 起轻食条形冲出图表放大 | 图表生长、缓出/回弹、放大聚焦 |
| 14.0–22.0s | 大区同比柱状图（西南冲顶，16.0s 闪白）；18.0s 切渠道结构，外卖首次过半 | 幽灵轮廓 + 柱状生长、闪白、100% 堆叠条生长 |
| 22.0–30.0s | 高潮帧：毛利率 54.2%、同比 −2.6pp；26.0s 落版 | 数字砸下、扩散圆环、斜切遮罩转场 |

图形全部由代码绘制（含 SVG 绘制的闪电 / 星形 / 咖啡豆），不引用任何外部图片、字体或音频。

## 素材

- `public/bgm.wav` — 由 music-gen 技能生成，120 BPM、15 小节、30.000s，与画面同起同止。
