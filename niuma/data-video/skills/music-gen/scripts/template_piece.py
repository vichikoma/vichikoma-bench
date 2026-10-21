#!/usr/bin/env python
"""template_piece.py —— 起手骨架。

只提供 `musiclib` 的调用方式，不含任何成品音乐内容：
音阶、曲式、配器、和声进行、旋律都由你自己决定。

用法：把它复制到你的工程里（例如 project/compose.py），填好【可调参数】，
在各声部段落里写音符，然后 `python compose.py`。
所有音高都用 mg.deg()（音阶级数）表达 —— 改 SCALE / TONIC 即可整曲换音阶、换调，
不用重算任何音符。
"""
import os
import sys

# 找到 musiclib：环境变量 LIBDIR → 本文件同级 → 同级 scripts/ → 上一级 scripts/
_HERE = os.path.dirname(os.path.abspath(__file__))
for _d in (os.environ.get("LIBDIR"), _HERE,
           os.path.join(_HERE, "scripts"),
           os.path.join(os.path.dirname(_HERE), "scripts")):
    if _d and os.path.exists(os.path.join(_d, "musiclib.py")):
        sys.path.insert(0, _d)
        break
else:
    sys.exit("找不到 musiclib.py，请用环境变量 LIBDIR 指向 music-gen/scripts")
import musiclib as mg  # noqa: E402

# ============================================================ 可调参数
SCALE = [...]                          # 音阶：相对主音的半音数列表（升序、一个八度内），自定义
TONIC = mg.note_to_midi('C4')          # 主音音高（C4=60）
BPM = 100                              # 速度
BARS = 16                              # 循环小节数（秒数 = BARS*4/BPM*60）
PROG = [1] * BARS                      # 每小节的音阶级数（用哪个音级的和弦）
OUT = os.environ.get("OUT_MID", "piece.mid")

# ============================================================ 捷径函数
def D(degree, octave=0):
    """音阶级数 -> MIDI 音高。D(1)=主音，D(len(SCALE)+1)=高八度主音，D(1,-1)=低八度。"""
    return mg.deg(SCALE, TONIC, degree, octave)


def C(degree, size=3, octave=0):
    """音阶内和弦。size=3 三和弦，size=4 七和弦。"""
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


p = mg.Piece(bpm=BPM, bars=BARS)
BPB = 4  # 每小节 4 拍

# ------------------------------------------------------- 声部
# 每个声部 = 一条 track。API：
#   t = p.track(名字, 音色号, pan=0..127, volume=0..127)   # 音色号见 musiclib.GM
#   t.note(开始拍, 音高, 时值拍, 力度)
#   t.chord(开始拍, [音高,...], 时值拍, vel=力度)
# 时间以「拍」为单位，从 0 开始；第 bar 小节的第 b 拍 = bar * BPB + b。

# 声部 1：
# t1 = p.track("...", mg.GM['...'], pan=64, volume=100)
# for bar in range(BARS):
#     ...

# 声部 2：
# ...

# 主旋律：
# lead = p.track("lead", mg.GM['...'], pan=64, volume=106)
# MELODY = [ (小节, 拍, 音级, 八度, 时值拍), ... ]
# for bar, beat, degree, octv, dur in MELODY:
#     lead.note(bar * BPB + beat, D(degree, octv), dur * 0.96, 78)

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | scale={SCALE} tonic={TONIC} bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
