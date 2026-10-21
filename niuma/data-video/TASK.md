# 任务：经营数据 → 动态数据短片

## 背景

公司是谁、汇报哪个期间、成片多长、数据字段含义，见 `brief.md`；品牌视觉见 `brand.md`。

讲哪几件事、怎么讲、用什么图表，由你自己判断。

## 输入

| 文件 | 说明 |
|---|---|
| `brief.md` | 汇报背景、期间、成片时长、数据字段说明、显示单位 |
| `brand.md` | 品牌名、颜色、字体 |
| `data/` | 经营数据 |

## 开工前：准备两样工具

这支片子需要 **Remotion**（画视频）和 **music-gen**（谱 BGM）。**先把两样都落地再动手**，装配方式如下。

### 1. Remotion

**先查本机，别急着重装。** 依次确认：

- 你的技能列表里是否已有 Remotion 相关技能（常见名 `remotion-best-practices`、`remotion`）；
- 当前项目是否已装 Remotion（`package.json` 依赖里有 `remotion`，或存在 `node_modules/remotion`）。

有就直接用。都没有，二选一：

- 装官方 Agent Skills 合集：`npx skills add remotion-dev/skills`（需 Node 18+；说明见 <https://www.remotion.dev/docs/ai/skills>）；
- 不用技能包，直接 `npm i remotion @remotion/cli`，照官方文档写。

本仓库不附带 Remotion 技能原文（版权与版本都归上游），但 `skills/README.md` 第 3 节记了这道题实际用到的几条要点（时间线、卡点换算、静态资源、缓动、渲染命令），可以先看那个。

### 2. music-gen（背景音乐）

源码、安装说明、坑清单都在 `skills/music-gen/`：

1. 先读 [`skills/music-gen/README.md`](skills/music-gen/README.md)（安装与自检）和 [`SKILL.md`](skills/music-gen/SKILL.md)（API 与用法）；
2. **Windows x64**：下载 [`niuma-music-gen-win-x64.zip`](https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip)（约 32 MB），解压到 `skills/music-gen/`（解出 `bin/`、`soundfonts/`、`LICENSES/` 三个目录），然后 `pip install mido numpy scipy`。
   直链不可用时去 Release 页 <https://github.com/vichikoma/vichikoma-bench/releases/tag/niuma-2026-10> 手动下。

   两行搞定：

   ```
   curl -L -o mg.zip https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip
   powershell -Command "Expand-Archive -Force mg.zip skills\music-gen"
   ```

3. **macOS / Linux**：按 README 用包管理器装 FluidSynth（`brew install fluid-synth` / `sudo apt install fluidsynth`），音源 `GeneralUser-GS.sf2` 放进 `soundfonts/` 或用 `SOUNDFONT` 指过去；
4. 自检——两条路径都打出现实存在的文件才算就绪：

   ```
   python -c "import sys;sys.path.insert(0,'scripts');import musiclib as mg;print(mg.FLUIDSYNTH);print(mg.SOUNDFONT)"
   ```

装不上怎么办：**不要**改用外部音乐素材。硬性约束第 3 条要求零外部素材，成片里的音乐必须由 music-gen 生成；环境装不下来就先解决环境。

## 交付物

1. **成片** `out/video.mp4`：1920×1080，30fps，H.264，时长符合 `brief.md`。
2. **工程源码** `project/`：用 **Remotion** 制作，能用 `npx remotion render` 复现成片。
3. **背景音乐**：用 music-gen 技能原创生成，交付：
   - `out/bgm.wav`：成片所用的音乐
   - `out/bgm.mid` 及生成它的脚本
   - `out/beats.json`：音乐每一拍的时间点（秒），标出每小节第一拍
4. **数字清单** `out/facts.json`：画面里出现的**每一个数字**各占一条，写明它在画面上的写法、出现的时间（秒）、计算口径（用哪些行、怎么算）。
5. **说明** `out/README.md`：不超过 300 字，说明这支片子讲了哪几件事、为什么选这几件。

## 硬性约束

1. **不要口播**，片中所有信息通过画面文字、数字、图表和音乐传达。
2. **画面中的数字必须来自所给数据**，不得编造、不得用占位数字；显示单位按 `brief.md`。
3. **零外部素材**：不引用任何外部图片、视频、字体、音频或在线资源；图形全部用代码绘制，音乐只用 music-gen 生成。可以使用 Remotion 官方包。
4. 全片文字使用简体中文（数字、单位、品牌名除外）。

## 质量标准

交付前请逐条自查：

1. **卡点**：每一次切镜、换屏，都落在 `beats.json` 的某一拍上，误差不超过 2 帧。
2. **音乐与画面同起同止**：音乐在成片结尾自然收束，不在乐句中间被截断。
3. **读得完**：每段文字完整显示的时长 ≥ 1.5 秒，且 ≥ 字数 ÷ 6 秒（数字和单位按 1 个字计）。
4. **看得清**：文字字号 ≥ 28px；文字与背景的对比度 ≥ 4.5:1。若 `brand.md` 附了对比度表，直接使用其中 ≥ 4.5 的组合；没附就自己算一遍再定配色。
5. **不出界、不重叠**：所有文字和图表在画面四边各留 ≥ 5% 的边距；文字之间、文字与图形之间无意外的重叠、溢出或截断。
6. **品牌一致**：只使用 `brand.md` 中的颜色（可调透明度）；品牌名至少出现一次，写法符合 `brand.md`。
7. **数字一致**：同一个指标在片中的写法、单位、小数位保持一致；画面与 `facts.json` 一一对应。

## 你可以自由决定的

- 讲哪些结论、讲几件、顺序如何
- 图表类型、动效、转场、版式、配色的具体用法（在品牌色范围内）
- 视觉风格与动效走向（见下方「视觉目标」）
- 音乐的风格、速度、结构
- 开头和结尾的处理

## 视觉目标

质量标准是及格线，这一节是「拿得出手」的线——**成片的视觉制作水准是评审的重要维度**，两者都要满足。

1. **手法密度**：从下列清单中至少选 4 种，贯穿全片使用（只在某一个镜头里用一次不算）：
   - 镜头运动：整层推 / 拉 / 横移
   - 分层视差：背景、中景、前景以不同速度移动
   - 数字滚动与图表生长动画
   - 有物理感的缓动（缓出、回弹）
   - 光效：扫光、辉光、粒子
   - 遮罩转场：wipe / reveal
   - 与音乐节拍联动的动效
2. **焦点纪律**：任意时刻画面只有一个视觉焦点；全片至少有一个「高潮帧」——把最重要的数字或结论放大成画面唯一焦点的时刻。
3. **语言统一**：选定的手法要成为全片基调，最忌只在某一个镜头里突然换一种风格——要么贯穿，要么不用。整体气质与 `brand.md` 的视觉调性保持一致（若其中有定义）。
4. **审美自查**：交付前渲染至少 3 张静帧（开头、中段、高潮帧），逐张确认：第一眼焦点唯一，且没有任何一帧只是「静态卡片 + 淡入淡出」。做不到就改。

## 判断标准

看完这支短片后，观众是否**准确、清楚地知道了这个期间最重要的几件事**，并且觉得**这支片子拿得出手**。
