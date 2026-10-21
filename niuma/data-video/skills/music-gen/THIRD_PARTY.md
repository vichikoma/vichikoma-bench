# 第三方组件与许可

本目录里的**代码和文档**（`scripts/`、`references/`、`SKILL.md`、`README.md`）是随本仓库发布的原创内容。
跑起来还需要两样第三方产物，它们**不在仓库里**，放在 Release 的 `niuma-music-gen-win-x64.zip`：

| 文件 | 放在 | 版本 | 许可 |
|---|---|---|---|
| `fluidsynth.exe`、`libfluidsynth-3.dll` | `bin/` | FluidSynth 2.6.0 | LGPL-2.1 or later |
| `sndfile.dll` | `bin/` | libsndfile 1.2.x | LGPL-2.1 or later |
| `SDL3.dll` | `bin/` | SDL 3.2.10 | zlib License |
| `GeneralUser-GS.sf2` | `soundfonts/` | GeneralUser GS 2.0.3 | License v2.0（作者自定义） |

各组件许可全文随 zip 一起发，在包的 `LICENSES/` 目录里（`LGPL-2.1.txt`、`SDL3-LICENSE.txt`、`GeneralUser-GS-LICENSE.txt`，以及写明版权人与源码位置的 `NOTES.md`）。

## 为什么这么放

- **LGPL 的两个库**（FluidSynth、libsndfile）：可以随附二进制，但必须同时给出许可全文和源码获取方式——所以 zip 里带了 `LGPL-2.1.txt` 和 `NOTES.md` 里的仓库地址。我们**未修改**这两个二进制的任何一行。
- **SDL3** 是 zlib 许可，保留版权声明即可（`SDL3-LICENSE.txt`）。
- **GeneralUser GS** 的作者原话：允许「use it in your software projects, and to modify the SoundFont bank or its packaging」，并要求在网站上提供时**不要直链作者的下载地址**，要么链回官网、要么放一份本地副本。本 zip 就是那个本地副本，官网地址也写进了 `NOTES.md`。
- 只发 Windows x64 的原因是这套二进制就是这个平台编译的。macOS / Linux 按 [README.md](README.md) 用包管理器装 FluidSynth，脚本不用改——找可执行文件的顺序是「环境变量 `FLUIDSYNTH` → PATH → `bin/`」。
