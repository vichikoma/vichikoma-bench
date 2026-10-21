---
name: music-gen
description: 用 MIDI + 采样音源离线生成可循环的背景音乐——含无缝循环、离线渲染与数值质检。触发场景：给画面/场景配乐、"做游戏 BGM"、"生成背景音乐"、"做一首曲子"、"这段音乐太薄/太糊/循环有咔哒声"、"需要可循环的音频"、程序化作曲、MIDI 渲染成音频。
---

# 音乐生成（MIDI + 采样音源，离线）

把文字/画面描述变成**可循环的背景音乐**。全流程离线、脚本化：
写 MIDI（Python）→ FluidSynth 渲染 → 无缝循环母带 → 导出 wav/ogg/mp3 → 数值质检。

**先确认环境**（安装步骤见 [README.md](README.md)）：

```bash
python -c "import sys;sys.path.insert(0,'scripts');import musiclib as mg;print(mg.FLUIDSYNTH);print(mg.SOUNDFONT)"
```

两条路径都存在 → 可以开始。不存在 → 装 FluidSynth / 放音源，或按 README 第三节用 `FLUIDSYNTH`、`SOUNDFONT` 环境变量指定。

## 管线（两步）

```
① 写 .mid（Python + musiclib）  →  ② make.py：渲染 + 无缝循环 + 归一化 + 导出 + 质检
```

### ① 写 MIDI

用 `scripts/musiclib.py` 的 API 生成 `.mid`（API 见下节）。从 [scripts/template_piece.py](scripts/template_piece.py) 起手 ——
它只有 API 用法、没有成品内容：

```bash
cp scripts/template_piece.py my_piece.py    # 填 SCALE / TONIC / BPM / BARS 和各声部
python my_piece.py                          # -> piece.mid
```

自己的脚本放在哪都行：`musiclib` 按 `LIBDIR` → 同目录 → 同目录 `scripts/` → 上一级 `scripts/` 的顺序找。

### ② 渲染 + 无缝循环 + 导出 + 质检

```bash
python scripts/make.py --mid piece.mid --seconds 32 --out out/theme
```

输出 `theme.wav` / `.ogg` / `.mp3`，并自动打印质检报告。整条链约 2–4 秒。

## API 速查

`musiclib`（源码见 [scripts/musiclib.py](scripts/musiclib.py)）：

| 调用 | 作用 |
|---|---|
| `p = mg.Piece(bpm=BPM, bars=BARS)` | 建一个曲子。`p.loop_seconds` = 循环秒数 |
| `t = p.track(名字, 音色号, pan=0..127, volume=0..127)` | 加一条轨。音色号用 `mg.GM['名字']`，编号↔名称见 [references/instruments.md](references/instruments.md) |
| `t.note(开始拍, 音高, 时值拍, 力度)` | 写单个音 |
| `t.chord(开始拍, [音高…], 时值拍, vel=力度)` | 写一组同时发音的音 |
| `p.track(..., drums=True)` | 走 GM 打击乐通道（通道 9，音高＝鼓件号，见 [references/instruments.md](references/instruments.md)） |
| `p.save(path)` | 写出 `.mid` |
| `mg.note_to_midi('F4')` | 音名 → MIDI 号（=65） |
| `mg.deg(SCALE, TONIC, 度数, octave)` | 音阶级数 → MIDI 音高。`SCALE` = 相对主音的半音数列表，由你自定义 |
| `mg.chord_of(SCALE, TONIC, 度数, size, octave)` | 音阶内和弦（叠三度） |
| `mg.render` / `mg.seamless_loop` / `mg.qa` / `mg.export` | 底层函数，通常由 `make.py` 调用 |

时间以「拍」为单位、从 0 开始；第 bar 小节的第 b 拍 = `bar * 4 + b`。

## 命令速查

| 目的 | 命令 |
|---|---|
| 渲染 + 无缝循环 + 导出 | `python scripts/make.py --mid piece.mid --seconds 32 --out out/theme` |
| 只要渲染，不做循环 | `python scripts/make.py --mid piece.mid --out out/theme --formats wav` |
| 质检任意 wav | `python scripts/qa.py out/theme.wav` |
| 改混响空间 | `--reverb room,damp,level`（默认 `0.9,0.3,0.8`）/ `off` 关闭 |
| 改立体声宽度 | `--width 1.5`（默认）/ `1.0` 不动 / `1.8` 更宽 |
| 当独立曲目听（加淡出） | `--fade 3` |

`--seconds` = 循环长度（秒）= `BARS × 4 ÷ BPM × 60`。
其余参数：`--gain`（默认 0.6）、`--rate`（默认 44100）、`--formats`（默认 `wav,ogg,mp3`）、`--no-qa`。

## 关键约束

- **GM 音源光靠 CC10 pan 做不出立体声宽度**（实测相关度只到 0.94）。
  必须：pan 拉到极端（≤15/≥110）+ 左右分轨 + `--width` M/S 展宽。目标 0.60–0.85。
- **无缝循环只能靠 tail-fold**（`--seconds` 已实现）。别用淡入淡出糊接缝。
- **渲染结果比 MIDI 长**（末尾释放 + 混响余响，约 +5~7s）是正常的，那正是做无缝循环的原料，别删。
- **80–250 Hz 占比 < 8% 就是「薄」**，这是最常见的毛病。
- 数值参考线与完整坑清单 → [references/qa-standards.md](references/qa-standards.md)、[references/pitfalls.md](references/pitfalls.md)

## 文件

- [README.md](README.md) —— 安装（Windows 预编译包 / 各平台自装）、环境变量、自检
- [references/instruments.md](references/instruments.md) —— GM 音色编号 ↔ 名称、打击乐映射
- [references/pitfalls.md](references/pitfalls.md) —— 坑清单
- [references/qa-standards.md](references/qa-standards.md) —— 质检各项的参考区间
- [scripts/template_piece.py](scripts/template_piece.py) —— 起手骨架（只含 API 用法，无成品内容）
- [scripts/musiclib.py](scripts/musiclib.py) —— 核心库
- [scripts/make.py](scripts/make.py)、[scripts/qa.py](scripts/qa.py) —— 命令行入口
- [THIRD_PARTY.md](THIRD_PARTY.md) —— 音源与二进制的来源、版本、许可
