# K 动画题 · 给 CocoMon 做 4 组循环动画

> 同一只已绑定的角色、同一份 rig，8 家各交一个带动画的 `.blend`；8 位评委直接打开文件看动画，另有无情脚本先过一遍硬门槛。
>
> 题面见 [`TASK.md`](TASK.md)；输入资产是 [`cocomon_tpose.blend`](cocomon_tpose.blend)；各家产出见 `../../submissions/niuma/k-animation/`；结果见 `../../results/niuma/k-animation/results.md`。

---

## 一、出题

打开 `cocomon_tpose.blend`（CocoMon，已绑定 25 骨 FK rig，EEVEE 场景），做 4 个 Action，命名严格一致：

| Action | 内容 | 帧数（24fps） | 循环 |
|---|---|:-:|---|
| `IDLE` | 待机呼吸循环 | 48–96 | 完美循环 |
| `TALK` | 自然说话，有语气起伏和重音 | 48–96 | 完美循环 |
| `JUMP` | 原地跳跃：起跳 → 腾空 → 落地 → 收势 | 24–72 | 首末帧姿态一致 |
| `EMOTE` | 困倦伸懒腰：打瞌睡 → 猛然惊醒 → 展臂 → 恢复精神 | 24–120 | 首末帧姿态一致 |

**不渲视频**，交付 `cocomon_animated.blend` 即可——评审直接开文件看。任务书还专门提醒了 Blender 保存时会清掉"无使用者"的 Action，交付前要重开确认 4 个都在。

## 二、硬门槛（不满足直接出局）

1. **循环闭合**：`IDLE`/`TALK` 首末帧全部骨骼姿态逐一致；`JUMP`/`EMOTE` 首末帧为同一站立姿态
2. **不改资产**：骨骼数量/层级/命名、网格顶点数、绑定关系保持原样，不加形态键
3. **帧数**在区间内

## 三、参赛的 8 家

GPT-6.1-Sol · Claude-Haiku-5.5 · Gemini-3.8-Flash · DeepSeek-V4.1-Flash · Qwen-3.8-Flash · Xiaomi-MiMo-V2.6-Pro · MiniMax-M3.1-Flash · GLM-5.3-Flash

## 四、怎么评

**盲评 60**（8 位评委，取均值）—— 评委打开 `.blend` 逐个 Action 看：

| 维度 | 分 |
|---|:-:|
| 生动性 | 15 |
| 重量感与物理可信度 | 15 |
| 细节层次 | 10 |
| 动作流畅度 | 10 |
| 动作可读性 | 10 |

**客观 40** —— 全部由脚本从交付的 `.blend` 里算，阈值固定：

| 块 | 分 | 内容 |
|---|:-:|---|
| A 动作内容 | 16 | IDLE 呼吸循环 3 ／ TALK 起伏与重音 3 ／ EMOTE 四拍 4 ／ JUMP 四段 4 ／ 四动作齐备且命名正确 2 |
| B JUMP 物理 | 16 | 腾空高度 6 ／ 原地性 4 ／ 触地脚不拖地 3 ／ 脚不穿地 3 |
| C 契约 | 8 | 循环闭合/接缝 4 ／ 帧数在区间 2 ／ 资产未改 1 ／ 相机与五灯未改 1 |

> 硬门槛就是 C1／C3／C2。**千问**的 `IDLE` 与 `TALK` 首末帧不闭合，按任务书判出局、整件计 0 分、不进盲评——它按同一张 40 分表其实能拿 33 分，**0 分来自门槛，不来自评分**。详见结果页。

## 五、怎么复现

1. 装 Blender 4.3（作者用的版本），打开 `cocomon_tpose.blend` 就是原始输入
2. 各件成品从 Release 的 `k-animation-8.zip` 取（8 个 `.blend`，解压后约 113 MB；单文件 12–17 MB，未入库）
3. 打开任一 `cocomon_animated.blend`，在 Action 编辑器或 NLA 里能看到 `IDLE`／`TALK`／`JUMP`／`EMOTE`
4. `submissions/niuma/k-animation/<模型>/review/shots/` 是评审用的三张动作帧（`01-talk`／`02-jump`／`03-emote`），统一机位渲染

## 六、两处容易误会的地方

- **成品 `.blend` 里是模型自己的文件**，保留了他们各自的场景设置。8 件的相机与五灯都和输入一致（这是客观项 C4 的检查内容），所以打开后视角一样。
- 每件的交付目录里还有一个 `cocomon_animated_review.blend`：把四个 Action 串成一条时间线（约 350 帧）的副本，方便连着看。它不是交付物，未收录。
