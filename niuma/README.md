# 牛马横评

同一批 8 个模型连做三道长程任务，每题独立出题、独立盲评，最后把**每单成本 × 交付质量**放在一起看。

| 题 | 任务包 | 交付物 | 说明 |
|---|---|---|---|
| 代码题 | [`game/`](game/) | `index.html` 游戏文件夹，`file://` 双击即玩 | [game/README.md](game/README.md) |
| K 动画 | [`k-animation/`](k-animation/) | `cocomon_animated.blend`，4 个命名 Action | [k-animation/README.md](k-animation/README.md) |
| 数据短片 | [`data-video/`](data-video/) | `out/video.mp4` + Remotion 工程 + BGM + `facts.json` | [data-video/README.md](data-video/README.md) |

任务包目录里就是当时下发给模型的**全部输入**（题面 + 素材 + 脚手架），可直接复制使用。数据短片题另附 [`data-video/skills/`](data-video/skills/)：做片用的 Remotion 装配说明与自写的 music-gen 工具包，`TASK.md` 里有对应的准备步骤。

## 参赛

| 模型 | ID |
|---|---|
| GPT | `gpt-6.1-sol` |
| Claude | `claude-haiku-5.5` |
| Gemini | `gemini-3.8-flash` |
| DeepSeek | `deepseek-v4.1-flash` |
| 千问 | `qwen-3.8-flash` |
| 小米 | `xiaomi-mimo-v2.6-pro` |
| MiniMax | `minimax-m3.1-flash` |
| GLM | `glm-5.3-flash` |

8 家三题全部交齐。每题 8 位评委盲评（评委不知道作品归属），客观项由脚本核验。

## 结果

| 题 | 结果页 | 计分 |
|---|---|---|
| 代码题 | [`results/niuma/game/results.md`](../results/niuma/game/results.md) | 盲评 60（均值）+ 客观 40 |
| K 动画 | [`results/niuma/k-animation/results.md`](../results/niuma/k-animation/results.md) | 盲评 60（均值）+ 客观 40 |
| 数据短片 | [`results/niuma/data-video/results.md`](../results/niuma/data-video/results.md) | 盲评 60（中位）+ 客观 40 |
| **三题综合** | [`results/niuma/summary.md`](../results/niuma/summary.md) | 三题名次取平均 |

## 大文件

成片 `.mp4`、带动画的 `.blend`、`.wav` 未入库，见
[Release `niuma-2026-10`](https://github.com/vichikoma/vichikoma-bench/releases/tag/niuma-2026-10)：

| 资产 | 内容 |
|---|---|
| `niuma-2026-10-game-8.zip` | 8 件游戏完整文件夹，解压后双击 `index.html` |
| `niuma-2026-10-k-animation-8.zip` | 8 件 `cocomon_animated.blend` |
| `niuma-2026-10-data-video-8.zip` | 8 件数据短片完整交付（成片 + 工程 + BGM + 数字清单） |
| `niuma-music-gen-win-x64.zip` | 数据短片题的 BGM 工具 Windows x64 运行时（FluidSynth + 音源 + 许可），配合 [`data-video/skills/music-gen/`](data-video/skills/music-gen/) 使用 |

## 读之前先知道三件事

1. **评审时用的是「作品 A–H」这种匿名编号**，同一个字母在三道题里指的不是同一个模型。正文用模型名，个别对照处保留了原始编号。
2. **三题的汇总方式不同**：代码题、K 动画用 8 位评委**均值**；数据短片用**中位数**（该题评委单次评判的浮动较大）。各题结果页顶部写明。
3. **K 动画题**有客观硬门槛：循环不闭合等不满足项直接出局、整件计 0 分，不进盲评。千问就是这种情况，结果页里单独说明。
