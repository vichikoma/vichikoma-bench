# 素材与署名

本仓库分发了少量第三方素材。它们各自按其许可使用。**如果你把这里的文件再分发出去，请把对应的署名一起带上。**

## Cartoon Character —— K 动画题的角色基础模型

| | |
|---|---|
| 作品 | **Cartoon Character** |
| 作者 | **Rahib Roshan**（Sketchfab 用户名 `rahibroshan`） |
| 来源 | <https://sketchfab.com/3d-models/cartoon-character-825b8c83ae5546f8b6e5539dd47120c9> |
| 许可 | **CC BY 4.0** —— <https://creativecommons.org/licenses/by/4.0/> |
| 本仓库中的改动 | 重命名为 CocoMon；绑定为 25 骨 FK rig（`niuma/k-animation/cocomon_tpose.blend`）。`submissions/niuma/k-animation/*/cocomon_animated.blend` 与 Release `niuma-2026-10` 的 `k-animation-8.zip` 是对该文件的进一步修改（新增 4 个动画 Action） |

涉及的文件：

- `niuma/k-animation/cocomon_tpose.blend`（本题输入）
- `submissions/niuma/k-animation/<模型>/cocomon_animated.blend`（8 件交付）
- Release [`niuma-2026-10`](https://github.com/vichikoma/vichikoma-bench/releases/tag/niuma-2026-10) 中的 `niuma-2026-10-k-animation-8.zip`

可直接复制的署名（TASL 格式）：

> "Cartoon Character" by Rahib Roshan, licensed under CC BY 4.0.
> Source: https://sketchfab.com/3d-models/cartoon-character-825b8c83ae5546f8b6e5539dd47120c9
> Changes: renamed to CocoMon; rigged with a 25-bone FK skeleton; animation Actions added in derived files.

## 数据短片题的工具链

`music-gen` 在 Windows 上跑起来需要 FluidSynth、libsndfile、SDL 与 GeneralUser GS 音源，许可与来源单独记在
[`niuma/data-video/skills/music-gen/THIRD_PARTY.md`](niuma/data-video/skills/music-gen/THIRD_PARTY.md)（二进制与音源本身随 Release 的 `niuma-music-gen-win-x64.zip` 发布，包内有许可全文）。

## 其余内容

- 各题任务包的题面、脚手架，以及 `submissions/` 下的代码、脚本、JSON、MIDI、渲染图：本次横评中由各家模型生成或本项目自写，供阅读、复现与对照使用；引用时注明出自本仓库即可。
- 频道素材（`wechat-card.png`、logo 等）版权归「维奇克马」。
