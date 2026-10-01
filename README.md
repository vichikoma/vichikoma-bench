# vichikoma-bench

「维奇克马」的 AI 横评 —— **题目、素材与各模型的原始产出**，供读者复现与对照。

每期横评，我把**同一道题**下发给多个 AI 模型，再对产出做评审。本仓库公开：

- 每道题的任务提示词与输入素材（**任务包**）
- 各模型的**原始产出**（源码、脚本与体积允许的成品），逐字节留档、未做任何修改
- 评分与消耗

## 目录

```
code-mv/        任务包 · 用 p5.js + p5.brush 把一首歌做成水彩风 MV
music/          任务包 · 为一张图创作 16 小节可循环 BGM
3d-modeling/    任务包 · Blender 无头模式程序化建模（复古相机 / 冬日微缩场景）
submissions/    各模型的原始产出，按 任务/模型 分目录
results/        评分与消耗
```

任务包目录里就是当时下发给模型的**全部输入**（题面 + 素材 + 脚手架），可直接复制使用。

体积过大的**最终产物**——成片 `.mp4`、`.blend`/`.glb` 工程、无损 `.wav`——未收录；需要时用 `submissions/` 里对应模型的**源码**重新渲染即可，各题步骤见其任务包 `README.md`。

## 题目

每个任务包目录下都有一份 `README.md`，说明这题**是怎么做的**——出题、要求、参赛模型、评分口径与复现步骤。

### `code-mv/` · 代码 MV
- 题面：`code-mv/TASK.md`，另有分镜 `STORYBOARD.md`、角色 `CHARACTER.md`、歌词时间轴 `LYRICS.md`
- 要求：只用代码绘制 1920×1080 每一帧，产出 156.6 秒、带中英双语卡拉OK字幕的水彩风 MV
- 参赛：3 家
- 说明与复现：见 [`code-mv/README.md`](code-mv/README.md)

### `music/` · 循环 BGM
- 题面：`music/prompt.md` + 两张附图（`set-1.png` 星露谷夜市 / `set-2.png` 帕兰诺平原之战）
- 要求：16 小节、30–48 秒无缝循环，交付 `track01.ogg`
- 参赛：7 家
- 说明与复现：见 [`music/README.md`](music/README.md)

### `3d-modeling/` · 程序化建模
- 题面：`camera-prompt.md`（1970s 复古胶片单反）与 `diorama-prompt.md`（冬日微缩展示台）
- 要求：全部几何与材质用 `bpy` 程序化生成，禁止导入外部模型 / 贴图 / HDR
- 参赛：7 家
- 说明与复现：见 [`3d-modeling/README.md`](3d-modeling/README.md)

## 结果

各题的结果统一为同一套模板（**名次 → 各维度评分 → 用量与费用**）：

| 位置 | 内容 |
|---|---|
| `results/code-mv/results.md` | 用量 / 费用（本题**无盲评**） |
| `results/music/results.md` | 两题名次 · 各维度分 · 用量与费用（7 位评委） |
| `results/3d-modeling/results.md` | 两题名次 · 各维度分 · 两组用量与费用（实力组 5 评委盲评） |

口径：名次按 **Borda** 判定（每位评委独立排序后累加）；各维度均为评委平均分，**分数只在同一维度内横向可比**；费用为人民币，含缓存命中与多轮自检重渲的累计用量。

---

## 关注

<img src="wechat-card.png" width="600" alt="微信搜一搜：维奇克马">

微信公众号「维奇克马」——AI 横评与实验的第一手发布地。
