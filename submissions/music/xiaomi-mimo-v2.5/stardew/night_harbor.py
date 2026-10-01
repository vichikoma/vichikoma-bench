#!/usr/bin/env python
"""night_harbor.py — 夜景港口主题背景音乐"""

import os
import sys

# 注意：exec 平台会从子进程中剔除 PYTHONPATH —— 别用 PYTHONPATH。
# 用普通 env 名（LIBDIR），它的 scheme 值会被解析成绝对路径并导出给子进程。
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

# ============================================================ 可调参数
# C小调自然音阶
SCALE = [0, 2, 3, 5, 7, 8, 10]  # 半音数列表（升序、一个八度内）
TONIC = mg.note_to_midi('C4')    # 主音音高（C4=60）
BPM = 90                         # 速度
BARS = 16                        # 循环小节数（秒数 = BARS*4/BPM*60）
BPB = 4                          # 每小节拍数

# 和声进行：i-iv-VI-V （每小节一个和弦）
# C小调：i=Cm, iv=Fm, VI=Ab, V=G
PROG = [1, 4, 6, 5] * 4  # 重复4次得到16小节

OUT = os.environ.get("OUT_MID", "night_harbor.mid")

# ============================================================ 捷径函数
def D(degree, octave=0):
    """音阶级数 -> MIDI 音高。D(1)=主音，D(len(SCALE)+1)=高八度主音，D(1,-1)=低八度。"""
    return mg.deg(SCALE, TONIC, degree, octave)


def C(degree, size=3, octave=0):
    """音阶内和弦。size=3 三和弦，size=4 七和弦。"""
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


p = mg.Piece(bpm=BPM, bars=BARS)

# ------------------------------------------------------- 声部1：主旋律（方波主音）
lead = p.track("lead", mg.GM['square_lead'], pan=64, volume=100)

# 主旋律音符：(小节, 拍, 音级, 八度, 时值拍)
MELODY = [
    # 第1-4小节（i和弦）
    (0, 0, 1, 0, 2), (0, 2, 3, 0, 1), (0, 3, 5, 0, 1),
    (1, 0, 5, 0, 2), (1, 2, 3, 0, 1), (1, 3, 1, 0, 1),
    (2, 0, 3, 0, 2), (2, 2, 5, 0, 1), (2, 3, 7, 0, 1),
    (3, 0, 5, 0, 2), (3, 2, 3, 0, 1), (3, 3, 1, 0, 1),
    # 第5-8小节（iv和弦）
    (4, 0, 4, 0, 2), (4, 2, 6, 0, 1), (4, 3, 8, 0, 1),
    (5, 0, 8, 0, 2), (5, 2, 6, 0, 1), (5, 3, 4, 0, 1),
    (6, 0, 6, 0, 2), (6, 2, 8, 0, 1), (6, 3, 10, 0, 1),
    (7, 0, 8, 0, 2), (7, 2, 6, 0, 1), (7, 3, 4, 0, 1),
    # 第9-12小节（VI和弦）
    (8, 0, 6, 0, 2), (8, 2, 8, 0, 1), (8, 3, 10, 0, 1),
    (9, 0, 10, 0, 2), (9, 2, 8, 0, 1), (9, 3, 6, 0, 1),
    (10, 0, 8, 0, 2), (10, 2, 10, 0, 1), (10, 3, 12, 0, 1),
    (11, 0, 10, 0, 2), (11, 2, 8, 0, 1), (11, 3, 6, 0, 1),
    # 第13-16小节（V和弦）
    (12, 0, 5, 0, 2), (12, 2, 7, 0, 1), (12, 3, 9, 0, 1),
    (13, 0, 9, 0, 2), (13, 2, 7, 0, 1), (13, 3, 5, 0, 1),
    (14, 0, 7, 0, 2), (14, 2, 9, 0, 1), (14, 3, 11, 0, 1),
    (15, 0, 9, 0, 2), (15, 2, 7, 0, 1), (15, 3, 5, 0, 1),
]

for bar, beat, degree, octv, dur in MELODY:
    lead.note(bar * BPB + beat, D(degree, octv), dur * 0.96, 78)

# ------------------------------------------------------- 声部2：和声（温暖音垫）
pad = p.track("pad", mg.GM['warm_pad'], pan=64, volume=80)

# 每小节的和弦：根据PROG
for bar in range(BARS):
    degree = PROG[bar]
    chord_notes = C(degree, size=3, octave=-1)  # 低八度的三和弦
    pad.chord(bar * BPB, chord_notes, 3.5, vel=60)  # 时值3.5拍，留0.5拍呼吸

# ------------------------------------------------------- 声部3：贝斯（合成贝斯）
bass = p.track("bass", mg.GM['synth_bass'], pan=64, volume=110)

# 贝斯线条：每小节根音，八分音符节奏
for bar in range(BARS):
    degree = PROG[bar]
    root = D(degree, -2)  # 低两个八度的根音
    # 简单的八分音符节奏：根音在拍0，八度在拍2
    bass.note(bar * BPB + 0, root, 1.5, 90)
    bass.note(bar * BPB + 2, root + 12, 1.5, 70)  # 高八度

# ------------------------------------------------------- 声部4：打击乐（鼓组）
drums = p.track("drums", 0, pan=64, volume=90, drums=True)

# 简单的鼓点模式
for bar in range(BARS):
    # 底鼓：拍0和拍2
    drums.note(bar * BPB + 0, mg.DRUMS['kick'], 0.8, 100)
    drums.note(bar * BPB + 2, mg.DRUMS['kick'], 0.8, 100)
    # 军鼓：拍1和拍3
    drums.note(bar * BPB + 1, mg.DRUMS['snare'], 0.8, 80)
    drums.note(bar * BPB + 3, mg.DRUMS['snare'], 0.8, 80)
    # 踩镲：每拍
    for beat in range(4):
        drums.note(bar * BPB + beat, mg.DRUMS['hh_closed'], 0.5, 60)

# ------------------------------------------------------- 声部5：环境音效（海浪声）
# 使用音色122（海浪），添加一些随机音符来模拟海浪
fx = p.track("fx", 122, pan=64, volume=40)

# 在每4小节的开头添加海浪声
for bar in range(0, BARS, 4):
    fx.note(bar * BPB, 60, 3, vel=50)  # 使用音高60，时值3拍

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | scale={SCALE} tonic={TONIC} bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")