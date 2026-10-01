# code-mv · 代码 MV 横评

> 把一首歌交给模型：**从零写代码**、逐帧绘制一部 1920×1080 的水彩风 MV。分镜脚本沿用原版，考的纯粹是**执行**。
>
> 题面与素材见本目录；各家产出见 `../submissions/code-mv/`；用量与费用见 `../results/code-mv/results.md`。

---

## 一、出题：分镜借用原版，只考执行

原版是 Opus 5.5 做的一支动画 MV —— **《I'm Upping My P(Doom)》**（P(Doom) = probability of doom，世界毁灭的概率），歌词里是成串的 AI 圈梗。

- 原视频源码：<https://github.com/JohnHeibel/PDoomVideo>（p5.js，里面就有 Claude 写的分镜）
- 作者后来基于自己的经验，又整理了一个新手友好版：<https://github.com/JohnHeibel/ClaudeAnimationBase>

本次**不考创意与分镜**——分镜脚本直接沿用原版（`STORYBOARD.md`，创作方向已定、要求严格执行）。理由是：真实业务里分镜相对好解决、人也做得不错，**执行**才费时费力；如果低价的国产模型能把分镜执行做好，会很实用。

所以任务包只保留**分镜脚本 + 原曲音频**（在原作项目基础上裁掉了其它干扰信息），用来测模型真实的动画能力。

## 二、任务要求（硬性契约）

从零实现 `src/`，用 **p5.js + p5.brush** 把这首歌做成手绘水彩风 MV，全长 **156.6 秒**。

**输入**（都已给出，不许搜索或参考任何外部资料）：

| 文件 | 内容 |
|---|---|
| `assets/song.mp3` | 音轨，全长 156.6 秒 |
| `LYRICS.md` | 歌词 + 每句起止时间 |
| `STORYBOARD.md` | 逐镜头分镜（创作方向已定，**严格执行**） |
| `CHARACTER.md` | 主角 Clawd 与 Researcher 的外观设定 |
| `studio.html` / `render.mjs` / `package.json` | 渲染脚手架（先 `npm install`） |

**`render.mjs` 依赖的全局契约**：

1. 一切就绪后设 `window.ready = true`（页面以 `?render` 参数打开）
2. `window.renderAt(t, type, q)` → 返回歌曲时间 `t` 的 **1920×1080 完整一帧**（含背景）的 dataURL
3. `window.renderSheet(times, cols, w)` → 把多个时间点拼成一张接触表（自检用）
4. **每帧必须是 `t` 的纯函数**（帧会并行、乱序渲染）：禁止 `Math.random()`（改用确定性 hash），禁止任何跨帧累积状态
5. 画面底部为**中英双语卡拉OK字幕**：英文主字幕 + 中文辅助字幕、**≥46px**；**节奏以英文演唱为准**（切换时机、高亮进度都跟英文走，中文只是整句对照）。验收时会缩到手机竖屏全宽（约 393px）检查，两行都必须清晰可读
6. 角色的弹跳与动作重击要**卡在音乐节拍上**（自己分析音频的 BPM 与节拍偏移，这也是任务的一部分）
7. 代码全部本次编写，入口 `src/main.js`

**自检与验收命令**：

```bash
npm install
node render.mjs --sheet=23,25.6,27.2,28.8,30.2,32.9,34.3,36.9,38.25 --out=out/check.jpg   # 9 个检查点拼图自检
node render.mjs --clip=0:38.5 --out=out/seg.mp4                                           # 带声片段
node render.mjs --frames=0:156.6 --workers=4                                              # 全片逐帧
node render.mjs --encode --out=out/mv.mp4                                                 # 合成 MP4
```

## 三、工作方式与迭代轮次

模型按 `TASK.md` 自建 `src/`，用接触表（`--sheet`）自检。**这一题各家的输出轮次不同**，看结果时需要一并考虑：

| 模型 | 输出轮次 |
|---|---|
| DeepSeek V4.1 Flash | **不是一轮直出**：在首次产出基础上微调了 **4 处细节**，共多出 **6 轮交互** |
| GLM 5.3 Flash | 一次性输出（质量太差，无法调整） |
| Xiaomi MiMo V2.6 Pro | 一次性输出（质量太差，无法调整） |

（原作者自己也经过多轮调整。）

## 四、参赛的 3 家

只请了 3 家，原因是：

- **太贵、不实用**：Kimi K3、Qwen 3.8 Max
- **做不出来**：Qwen 3.8 Flash
- **按之前测评不值得花时间(钱)**：MiniMax、Doubao

## 五、为什么不设 AI 打分

两个原因：

1. 具备动画评估能力的模型太少，评分不太稳定；
2. 从结果看，DeepSeek 与另外两家差距有点大，**没有排名的必要**。

`TASK.md` 末尾仍留了一份逐镜头评分标准（水彩质感、角色一致性、分镜还原度、节拍同步、运镜生动性、歌词贴合度），但本次**没有走 AI 打分流程**——仓库里本题只有用量与费用，见 `../results/code-mv/results.md`。

## 六、怎么复现

1. **装环境**：Node.js、Google Chrome、FFmpeg（可以让 agent 代装）
2. **（建议）先让 agent 准备技能**，减少环境与 `p5.js` / `p5.brush` 函数调用的试错。作者当时给 agent 的原话：
   > 创建一个通用的 p5.js、p5.brush 技能，目的是减少不必要的环境或函数调用试错，不要带有任务信息以及任何主观的设计决策，只能包含客观的、通用的信息。
3. **跟 agent 说「执行 TASK.md」** 即可开始
4. 各家产出在 `../submissions/code-mv/<模型>/`
