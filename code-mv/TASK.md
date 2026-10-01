# 任务:用代码把一首歌做成水彩风 MV

你拿到的是一个仓库脚手架 + 全部创作输入。请**从零实现 `src/`**,用 p5.js + p5.brush 把这首歌做成手绘水彩风的音乐视频。

## 输入(都已给出,不许搜索或参考任何外部资料)

| 文件 | 内容 |
|---|---|
| `assets/song.mp3` | 音轨,全长 156.6 秒 |
| `LYRICS.md` | 歌词 + 每句的起止时间 |
| `STORYBOARD.md` | **逐镜头分镜(创作方向已定,严格执行)** |
| `CHARACTER.md` | 主角 Clawd 和 Researcher 的外观设定 |
| `studio.html` / `render.mjs` / `package.json` | 渲染脚手架(先 `npm install`) |

## 必须满足的硬性契约(render.mjs 依赖这些全局)

1. 一切就绪后设 `window.ready = true`(页面以 `?render` 参数打开)
2. `window.renderAt(t, type, q)` → `Promise<dataURL>`:绘制歌曲时间 `t` 的 **1920×1080 完整一帧**(含背景),返回 `document.getElementById('out')` 对应 canvas 的 dataURL
3. `window.renderSheet(times, cols, w)` → `Promise<{url, ms}>`:把多个时间点拼成一张接触表(自检用)
4. **每帧必须是 `t` 的纯函数**:帧会并行、乱序渲染。禁止 `Math.random()`(用确定性 hash),禁止任何跨帧累积状态
5. 画面底部为**中英双语卡拉OK字幕条**,按 LYRICS.md 的时间切换:**英文主字幕、中文辅助字幕,≥46px**。**字幕节奏以英文为准**:时间轴对应的是英文演唱,切换时机、卡拉OK高亮/进度(如有)都跟英文走;中文只是整句对照翻译,随英文一起出现、一起消失。验收时会把视频缩放到手机竖屏全宽(约 393px 宽)检查,两行字幕都必须清晰可读。关键画面元素避开字幕区域
6. 角色的弹跳和动作重击要卡在音乐节拍上(**自己分析音频的 BPM 和节拍偏移**,这是任务的一部分)
7. 代码全部本次编写;入口为 `src/main.js`,可自行增加文件并在 studio.html 中加 `<script>` 标签

## 自检与验收命令

```bash
npm install
# 快速自检:9 个检查点拼成一张图
node render.mjs --sheet=23,25.6,27.2,28.8,30.2,32.9,34.3,36.9,38.25 --out=out/check.jpg
# 渲染片段成带声 MP4
node render.mjs --clip=0:38.5 --out=out/seg.mp4
# 完整全片
node render.mjs --frames=0:156.6 --workers=4
node render.mjs --encode --out=out/mv.mp4
```

## 评分标准

逐镜头评分:水彩质感、角色一致性、分镜还原度(**对照** STORYBOARD.md 评:让画的都画了吗)、节拍同步、运镜生动性、歌词贴合度(**不看**分镜盲评:只凭画面+歌词,梗能否一眼被看懂)
