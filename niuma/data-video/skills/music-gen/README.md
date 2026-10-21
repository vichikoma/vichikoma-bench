# music-gen · 安装与用法

用 MIDI + 采样音源离线生成可循环的背景音乐。写 MIDI（Python）→ FluidSynth 渲染 → 无缝循环母带 → 导出 wav/ogg/mp3 → 数值质检。

这是「牛马横评」数据短片题里各家模型用的那套工具的**通用版**：去掉了对特定 Agent 平台的依赖，命令就是普通命令行。

---

## 一、装两样东西

### 1. Python 依赖

```bash
python -V                      # 需要 3.9+；3.11/3.12 都验过
pip install mido numpy scipy
```

`ffmpeg` 可选，只在导出 ogg/mp3 时用到（`winget install Gyan.FFmpeg` / `brew install ffmpeg` / `apt install ffmpeg`）。没有它 wav 照样出。

### 2. FluidSynth + 音源

**Windows x64 —— 用预编译包（最省事）**

从本仓库 Release 下载 [`niuma-music-gen-win-x64.zip`](https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip)（约 32 MB），解压到本目录，得到：

```
skills/music-gen/
├── bin/             fluidsynth.exe + libfluidsynth-3.dll + sndfile.dll + SDL3.dll
├── soundfonts/      GeneralUser-GS.sf2
└── LICENSES/        各组件许可全文
```

不用改 PATH、不用重启终端，脚本会自己找到 `bin/`。

解压前可以先拉下来（`skills/music-gen/` 目录里执行）：

```bash
curl -L -o mg.zip https://github.com/vichikoma/vichikoma-bench/releases/download/niuma-2026-10/niuma-music-gen-win-x64.zip
powershell -Command "Expand-Archive -Force mg.zip ."
```

直链不可用时走 Release 页：<https://github.com/vichikoma/vichikoma-bench/releases/tag/niuma-2026-10>。

**其它平台 —— 自己装（代码完全一样，只是把 FluidSynth 装进系统）**

| 平台 | 装 FluidSynth |
|---|---|
| macOS | `brew install fluid-synth` |
| Debian / Ubuntu | `sudo apt install fluidsynth` |
| Windows（无包时） | `choco install fluidsynth`，或从 [FluidSynth releases](https://github.com/FluidSynth/fluidsynth/releases) 下 zip |

音源 `GeneralUser-GS.sf2`（30.8 MB，GM/GS，261 音色 + 13 鼓组，允许商用）若本地没有：
从 [schristiancollins.com/generaluser.php](https://schristiancollins.com/generaluser.php) 下载，放进 `soundfonts/`；
或者放哪都行，用环境变量 `SOUNDFONT` 指过去。

> 音源和 `bin/` 里各二进制的来源与许可，见 [THIRD_PARTY.md](THIRD_PARTY.md)。

## 二、自检

```bash
python -c "import sys;sys.path.insert(0,'scripts');import musiclib as mg;print(mg.FLUIDSYNTH);print(mg.SOUNDFONT)"
```

两行都打出现实存在的路径就对了。任一行是「不存在的路径」，按第三节的环境变量补。

## 三、脚本怎么找东西

不用配也能跑；要覆盖时用环境变量：

| 环境变量 | 作用 | 找不到时的默认 |
|---|---|---|
| `FLUIDSYNTH` | `fluidsynth` 可执行文件的完整路径 | 先查 PATH，再查 `bin/fluidsynth.exe` |
| `SOUNDFONT` | `.sf2` 音源路径 | `soundfonts/` 下第一个 `.sf2` |
| `LIBDIR` | `musiclib.py` 所在目录（只在自己写脚本 `import musiclib` 时用） | 脚本同级 / 同级 `scripts/` / 上一级 `scripts/` |

## 四、跑一遍（最短路径）

```bash
# 1. 起手：复制骨架，填音符（骨架里只有 API 用法，没有成品旋律）
cp scripts/template_piece.py my_piece.py
#    改 my_piece.py 里的 SCALE / TONIC / BPM / BARS 和各声部，然后：
python my_piece.py                       # -> piece.mid

# 2. 渲染 + 无缝循环 + 归一化 + 导出 + 质检（一条命令，2~4 秒）
python scripts/make.py --mid piece.mid --seconds 32 --out out/theme

# 3. 随时体检任意 wav
python scripts/qa.py out/theme.wav
```

`--seconds` = 循环长度 = `BARS × 4 ÷ BPM × 60`。整条链的用法见 [SKILL.md](SKILL.md)。

## 五、这个版本改了哪里

相对原始 skill：

- `musiclib.py` 的 FluidSynth / 音源路径改成「环境变量 → PATH → 本地 `bin/`、`soundfonts/`」三级查找，mac/Linux 只要能装上 FluidSynth 就能直接用同一份脚本。
- `template_piece.py` 的 `import musiclib` 改成按 `LIBDIR` → 同级 → `scripts/` 顺序找，不再依赖特定平台的路径协议。
- 文档里所有平台专属调用方式换成了普通命令行；管线、API、参数、坑清单没动。
