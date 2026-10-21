# 数据短片题 · 牛马咖啡 Q3 经营数据

> 给 8 家 AI 一份未经清洗的经营数据，各做一支 **30 秒无口播**动态数据短片；自己定故事、自己写 Remotion 工程、自己谱 BGM、自己卡点。
>
> 题面见 [`TASK.md`](TASK.md)，背景见 [`brief.md`](brief.md)，品牌见 [`brand.md`](brand.md)，数据是 [`data/sales_2025-01_2026-09.csv`](data/sales_2025-01_2026-09.csv)；各家产出见 `../../submissions/niuma/data-video/`；结果见 `../../results/niuma/data-video/results.md`。

---

## 一、出题

| 项 | 要求 |
|---|---|
| 成片 | `out/video.mp4`，1920×1080 / 30fps / H.264，30±2 秒 |
| 工程 | `project/`，用 Remotion 做，`npx remotion render` 能复现 |
| 音乐 | `out/bgm.wav` + `out/bgm.mid` + 生成脚本 + `out/beats.json`（每拍时间点，标出小节首拍） |
| 数字清单 | `out/facts.json`：画面里每个数字各一条，写明画面写法、出现时间、计算口径 |
| 说明 | `out/README.md` ≤ 300 字 |

硬约束：**不要口播**；画面数字必须来自所给数据；**零外部素材**（图形全代码绘制，音乐只用 music-gen 生成）；全片简体中文。
另有 7 条可测的质量标准（卡点误差 ≤2 帧、音乐与画面同起同止、读得完、看得清、不出界不重叠、品牌一致、数字一致），以及一节「视觉目标」——手法密度 ≥4 种、焦点纪律、至少一个高潮帧。

## 二、数据里的坑

CSV 共 1060 行，其中 **10 行是完全重复行**（10 个字段逐字相同，都在 2026-07）；`brief.md` 明说这份数据「系统原始导出、未经清洗」。

| 口径 | 2026 Q3 合计 | 同比 |
|---|:-:|:-:|
| 含重复行 | 6902.48 万 | +37.1% |
| 去重（正确） | 6467.67 万 | +28.49% |

差 434.81 万元。这题最重要的一条区分线就在这里：**去重是基本功，不是加分项**。8 件里 5 件洗对了、3 件没洗。

## 三、参赛的 8 家

GPT-6.1-Sol · Claude-Haiku-5.5 · Gemini-3.8-Flash · DeepSeek-V4.1-Flash · Qwen-3.8-Flash · Xiaomi-MiMo-V2.6-Pro · MiniMax-M3.1-Flash · GLM-5.3-Flash

## 四、怎么评

**盲评 60**（8 位评委取**中位数**）：

| 维度 | 分 | 评委实际依据 |
|---|:-:|---|
| 视觉与美术 | 15 | 三张冻结证据帧 |
| 动效与视觉语言 | 25 | **读代码** |
| 叙事与信息传达 | 20 | **读代码** + 证据帧 |

> 注意：评委**没有播放成片、没有听音乐、没有跑工程**。所以「动效」这一维评的是代码里写了什么动效，不是实际观感。这是本题评审方法的已知局限，结果页里也写明了。

**客观 40** —— 脚本 + 人工核验：

| 块 | 分 | 内容 |
|---|:-:|---|
| A1 交付与硬约束 | 8 | 交付物齐备、规格、零外部素材、简体中文、品牌色 |
| A2 数据准确 | 20 | 逐条对复算基准（去重口径） |
| A3 节奏与音乐 | 8 | 切点是否压在 `beats.json` 的拍上、音乐与画面同起同止、`beats.json` 真实性（读 `bgm.mid` 的 tempo 重算拍点） |
| A4 质量验收 | 4 | 字号、边距、对比度、重叠、截断、品牌一致 |

> 对比度口径：TASK.md 要求文字 ≥ 4.5:1，`brand.md` 另注明「正文 ≥4.5、大标题 ≥3」。实际只有一处对比度判罚（B 的黄字压在橙环上，1.8:1），其余未因对比度扣分。

## 五、怎么复现

1. `cd submissions/niuma/data-video/<模型>/project && npm i && npx remotion render`（Remotion 版本见各自 `package.json`）
2. 盲评用的工程是**匿名化副本**，刻意省略了 `public/bgm.wav`；仓库里这份是**原始交付**，`out/bgm.wav` 已在 Release 包中，放回 `project/public/` 即可完整渲染
3. 成片见 Release 的 `data-video-8.zip`（8 件完整交付，含 `out/video.mp4`、`bgm.wav`、工程与数字清单）
4. 各件 `review/shots/` 是评审用的三张冻结证据帧（`01`／`02`／`03`）

## 六、仓库里收了什么

| | 内容 |
|---|---|
| **收录** | `project/` 源码与配置（`package.json`、`tsconfig.json`、`remotion.config.ts`、`src/`）、`out/` 里的 `README.md`／`facts.json`／`beats.json`／`bgm.mid`／生成脚本、各家自带的 QA 报告类 JSON |
| **未收录** | `video.mp4`、`bgm.wav`（含 `project/public/bgm.wav`）、各家自查用的静帧与 `project/out/` 渲染中间产物、`delivery.zip`——都在 Release 的 `data-video-8.zip` 里 |
| **工具包** | [`skills/`](skills/)：`skills/README.md`（Remotion 怎么备、这道题用到的要点）+ `skills/music-gen/`（自写的作曲/渲染/质检代码与文档）。FluidSynth 二进制与 30 MB 音源在 Release 的 `niuma-music-gen-win-x64.zip` 里 |

> 所以仓库里这份是**去大文件版**：`submissions/niuma/data-video/<模型>/` + Release 那个 zip = 完整原始交付。除删掉上述大文件外，其余文件逐字节未改。

## 七、想自己做一支

`TASK.md` 可以整份丢给任何 Agent，它自带「开工前准备工具」一节：Remotion 先查本机有没有、没有再 `npx skills add`；music-gen 照 `skills/music-gen/README.md` 装。想换题，改 `brand.md` 和 `data/` 里的 CSV 即可，其余不用动。

两件事提前知道：

- **音乐工具的 Windows 运行时在 Release**（[`niuma-music-gen-win-x64.zip`](https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip)，约 32 MB），仓库里只放代码。其它平台按 README 装 FluidSynth，脚本不用改。
- 8 份能直接跑的工程在 `../../submissions/niuma/data-video/`，是最好的参照：`npm i && npx remotion render` 就能出片。

