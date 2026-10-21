# 牛马咖啡 · 季度经营短片

成片：30 秒，1920×1080，30fps，H.264。所有图形由 React、SVG 与 CSS 绘制，使用本机中文无衬线字体。配乐已内置于 public/bgm.wav，无口播。

在本目录执行：

```cmd
npm ci
npx remotion render src/index.ts NiumaQuarter ../out/video.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p
```

也可执行 `npm run render`。`npx remotion render` 能识别默认入口及唯一合成，按 CLI 提示选择输出即可。预览使用 `npm run studio`。

工程锁定 Remotion 官方包 4.0.503；最终封装通过 remotion.config.ts 直接使用原始 WAV 编码音轨，并限制终点为 30 秒，消除中间 AAC 分段带来的静音填充。不读取远程图片、字体、音频或数据。包管理器和浏览器下载仅用于安装渲染工具。字体首选 Microsoft YaHei，若在其他系统复现，应先检查本机中文字体字宽与排版。

五镜头从 0、4、10、16、22 秒开始。所有换屏用 4 帧横向遮罩，开始帧落在音乐节拍；转场中点最多偏离节拍 2 帧。每镜头末尾推近约 0.8%，背景视差、粒子、扫光、回弹与图表生长使用同一套动效语言。数字始终显示真实终值，未使用会产生虚构中间值的数字计数动画。

src/data.json 来自原始 CSV 清洗后的聚合值。清洗及计算脚本位于交付包的 scripts/prepare_data.py；出镜数字及原始行号、运算口径见 out/facts.json。季度年月来自 CSV 月份字段。

原创音乐生成脚本见 out/generate_bgm.py。音乐用 music-gen 的 musiclib API、FluidSynth 与技能内置 GeneralUser-GS 音源创作。重建时在交付包根目录设置 LIBDIR 为该技能的 scripts 目录，再执行：

```cmd
python out/generate_bgm.py
```

输出包含 MIDI、48kHz 立体声 WAV 与节拍表；末小节在 28 秒落主和弦，留足余音至 30 秒。该脚本重新复制 WAV 到 public/bgm.wav。

检验命令：`npm run check`；`node scripts/verify-render.cjs` 渲染开头、销售、中段、渠道、高潮静帧并检查字框、图表、安全边距及遮罩后的可见重叠。最终验收记录见 out/QA.md。
