# 做这支片子用的两个工具

这道题里 8 个模型都是靠这两样东西把片子做出来的。想让自己的 Agent 也走同一条路，就按下面准备。

## 1. Remotion —— 做视频

**先查本机有没有。** 不少 Agent 产品自带 Remotion 技能，或者你之前已经装过：

- 看它的技能列表 / `skills/` 目录里有没有 Remotion 相关条目（常见名字 `remotion-best-practices`、`remotion`）；
- 项目里已经 `npm i` 过 `remotion`，那也算有。

**有就直接用，不用再装。** 没有再走下面任一条：

```bash
# A. 装官方 Agent Skills 合集（需要 Node 18+）
npx skills add remotion-dev/skills

# B. 不装技能，直接当普通 npm 包用
npm i remotion @remotion/cli
```

官方文档：<https://www.remotion.dev/docs/ai/skills> · <https://www.remotion.dev/docs/>

> 本仓库**不附带** Remotion 技能的原文：那是 Remotion 官方的版权内容，上游未声明开源许可，复制进来不合适；而且技能内容随版本更新，用官方的比用快照更稳。本仓库里真正值钱的是 `../../../submissions/niuma/data-video/` 下那 8 份**能直接跑**的工程——`npm i && npx remotion render` 就能出片，比看文档快。

## 2. music-gen —— 做 BGM

就在本目录 [`music-gen/`](music-gen/)，自写代码 + 完整文档：

| 文件 | 内容 |
|---|---|
| [`music-gen/README.md`](music-gen/README.md) | 安装：Windows x64 下 [运行时包](https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip)；mac/Linux 包管理器装 FluidSynth 即可 |
| [`music-gen/SKILL.md`](music-gen/SKILL.md) | 用法：API、命令、参数、硬约束 |
| [`music-gen/references/`](music-gen/references/) | GM 音色表、坑清单、质检参考线 |

Windows x64 最短路径（在 `skills/music-gen/` 目录里执行，2 分钟内能听到声音）：

```bash
# 1. 拉运行时包（约 32 MB）并就地解压，得到 bin/ 与 soundfonts/
curl -L -o mg.zip https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip
powershell -Command "Expand-Archive -Force mg.zip ."

# 2. Python 依赖
pip install mido numpy scipy

# 3. 自检
python -c "import sys;sys.path.insert(0,'scripts');import musiclib as mg;print(mg.FLUIDSYNTH);print(mg.SOUNDFONT)"
```

两行都打出现实存在的路径 → 环境好了。接着照 `music-gen/README.md` 第四节跑一遍。

> 直链不可用时走 Release 页：<https://github.com/vichikoma/vichikoma-bench/releases/tag/niuma-2026-10>。

## 3. 这套组合实际用到的 Remotion 要点

8 件作品踩出来的、跟本题最相关的几条（省得再去文档里翻）：

- **时间线**用 `<Sequence from={n} durationInFrames={m}>` 或 `<Series>` 排镜头；`useCurrentFrame()` 拿当前帧，`useVideoConfig()` 拿 `fps` / `durationInFrames`。**不要**用 `Date.now()` 或 CSS transition 计时——Remotion 渲染时是逐帧求值的。
- **卡点**：`beats.json` 是秒，帧 = `Math.round(t * fps)`。切镜头的 `from` 就填这个值，误差自然为 0。
- **音频**用 `<Audio src={staticFile('bgm.wav')} />`，文件放 `project/public/`。
- **静态资源**一律 `staticFile('...')`，不要用相对 `./` 路径。
- **缓动**用 `interpolate()` + `spring()`；`spring` 默认有回弹，做「有物理感」最省事。
- **异步准备**（字体、图片、音频解码）用 `delayRender()` / `continueRender()`，否则会渲染出空帧。
- **字体**：本题零外部素材，别用在线字体服务；用系统字体或把字体文件放进 `public/`。
- **渲染**：`npx remotion render <composition-id> out/video.mp4 --codec=h264`。片子多长、多少帧由 composition 的 `durationInFrames` 决定，改 `brief.md` 的时长要求时先改这里。
- **版本**：各家 `package.json` 里的 Remotion 版本不一样，按各自的 `package.json` / lockfile 装，别混。
