#!/usr/bin/env python
"""night_dock.py —— 夜晚海上市集 BGM（16 小节无缝循环）
A 小调温柔夜曲：八音盒主旋律 + 竖琴琶音 + 弦乐拨奏 + 暖垫 + 低音托底。
BPM 92, 16 bars -> 41.74s
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

# ============================================================ 参数
SCALE = [0, 2, 3, 5, 7, 8, 10]          # A 自然小调
TONIC = mg.note_to_midi('A4')           # 69
BPM = 92
BARS = 16
BPB = 4
OUT = os.environ.get("OUT_MID", "piece.mid")

# 每小节和弦（音级）：Am Am F F | C C G G | Am Am F G | Am F G Am
PROG = [1, 1, 6, 6, 3, 3, 7, 7, 1, 1, 6, 7, 1, 6, 7, 1]


def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)


def chord_degrees(d):
    return [d, d + 2, d + 4]


p = mg.Piece(bpm=BPM, bars=BARS)

# ------------------------------------------------------- 轨道
bass = p.track("bass", mg.GM['acoustic_bass'], pan=64, volume=100)
cello = p.track("cello", mg.GM['cello'], pan=55, volume=68)
padL = p.track("padL", mg.GM['strings_slow'], pan=15, volume=52)
padR = p.track("padR", mg.GM['strings_slow'], pan=112, volume=52)
harp = p.track("harp", mg.GM['harp'], pan=20, volume=58)
pizz = p.track("pizz", mg.GM['pizzicato_strings'], pan=105, volume=52)
lead = p.track("lead", mg.GM['music_box'], pan=78, volume=98)
vibes = p.track("vibes", mg.GM['vibraphone'], pan=40, volume=58)
perc = p.track("perc", 0, pan=64, volume=66, drums=True)

# ------------------------------------------------------- 低音（根音全音符 + B 段加五度）
for bar in range(BARS):
    d = PROG[bar]
    root = D(d, -2)
    bass.note(bar * BPB, root, 3.8, 76)
    if bar >= 8:
        bass.note(bar * BPB + 2, D(d + 4, -2), 1.6, 62)

# ------------------------------------------------------- 大提琴（根音+五度长音，中低频托底）
for bar in range(BARS):
    d = PROG[bar]
    cello.chord(bar * BPB, [D(d, -1), D(d + 4, -1)], 3.7, vel=46)

# ------------------------------------------------------- 弦乐垫（左右分轨拉开宽度）
for bar in range(BARS):
    d = PROG[bar]
    tones = [D(x, -1) for x in chord_degrees(d)]
    tonesR = [D(chord_degrees(d)[1], -1), D(chord_degrees(d)[2], -1), D(chord_degrees(d)[0], 0)]
    dur = 7.7 if (bar % 2 == 0 and bar < 8) else 3.7
    if bar % 2 == 0 or bar >= 10:
        padL.chord(bar * BPB, tones, dur, vel=38)
        padR.chord(bar * BPB, tonesR, dur, vel=34)

# ------------------------------------------------------- 竖琴琶音（第 5 小节起）
HARP_PAT = [(0.0, 0, -1, 42), (0.5, 2, -1, 33), (1.0, 4, -1, 36), (1.5, 0, 0, 32),
            (2.0, 2, 0, 38), (2.5, 0, 0, 30), (3.0, 4, -1, 34), (3.5, 2, -1, 30)]
for bar in range(4, BARS):
    d = PROG[bar]
    for beat, off, octv, vel in HARP_PAT:
        harp.note(bar * BPB + beat, D(d + off, octv), 0.85, vel)

# ------------------------------------------------------- 拨弦（2/4 拍轻点，摇曳感）
for bar in range(2, BARS):
    d = PROG[bar]
    pizz.chord(bar * BPB + 1.0, [D(d, -1), D(d + 4, -1)], 0.45, vel=52)
    pizz.chord(bar * BPB + 3.0, [D(d, -1), D(d + 4, -1)], 0.45, vel=46)

# ------------------------------------------------------- 主旋律（八音盒）
# (小节, 拍, 音级, 八度, 时值拍)
MELODY = [
    (0, 1, 5, 0, 1), (0, 2, 1, 1, 2),
    (1, 0, 7, 0, 1), (1, 1, 5, 0, 1), (1, 2, 4, 0, 2),
    (2, 0, 3, 0, 1), (2, 1, 4, 0, 1), (2, 2, 5, 0, 2),
    (3, 0, 4, 0, 2), (3, 2, 3, 0, 1), (3, 3, 1, 0, 1),
    (4, 0, 3, 0, 1), (4, 1, 5, 0, 1), (4, 2, 7, 0, 2),
    (5, 0, 1, 1, 2), (5, 2, 7, 0, 1), (5, 3, 5, 0, 1),
    (6, 0, 4, 0, 2), (6, 2, 5, 0, 1), (6, 3, 2, 0, 1),
    (7, 0, 4, 0, 1), (7, 1, 3, 0, 1), (7, 2, 2, 0, 2),
    (8, 1, 5, 0, 1), (8, 2, 1, 1, 1), (8, 3, 2, 1, 1),
    (9, 0, 3, 1, 2), (9, 2, 2, 1, 1), (9, 3, 1, 1, 1),
    (10, 0, 1, 1, 1), (10, 1, 3, 1, 1), (10, 2, 2, 1, 1), (10, 3, 1, 1, 1),
    (11, 0, 7, 0, 2), (11, 2, 4, 0, 2),
    (12, 0, 5, 0, 1), (12, 1, 1, 1, 2), (12, 3, 7, 0, 1),
    (13, 0, 6, 0, 1), (13, 1, 5, 0, 1), (13, 2, 4, 0, 2),
    (14, 0, 4, 0, 1), (14, 1, 5, 0, 1), (14, 2, 4, 0, 1), (14, 3, 2, 0, 1),
    (15, 0, 3, 0, 1), (15, 1, 2, 0, 1), (15, 2, 1, 0, 2),
]
for bar, beat, deg, octv, dur in MELODY:
    vel = 74 if bar < 8 else 84
    vel += 4 if beat == 0 else 0
    lead.note(bar * BPB + beat, D(deg, octv), dur * 0.95, min(vel, 96))

# ------------------------------------------------------- 颤音琴回声（乐句尾高八度轻叩）
ECHO = [(3, 3, 1, 0), (7, 2, 2, 0), (11, 2, 4, 0), (15, 2, 1, 0)]
for bar, beat, deg, octv in ECHO:
    vibes.note(bar * BPB + beat + 0.5, D(deg, octv + 1), 1.6, 38)

# ------------------------------------------------------- 打击（第 5 小节起，极轻）
for bar in range(4, BARS):
    for e in range(8):
        vel = 30 if e % 2 == 0 else 20
        perc.note(bar * BPB + e * 0.5, mg.DRUMS['shaker'], 0.2, vel)
    perc.note(bar * BPB + 2, mg.DRUMS['snare_rim'], 0.2, 40)

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | Am nocturne | bpm={BPM} bars={BARS} loop={p.loop_seconds:.2f}s")
