#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""track01 —— 《巨象压境 / March of the Colossi》

为「战象军团压境」画面所作的可循环战争进行曲 BGM。
16 bars @ 96 BPM = 40.0 s 无缝循环。
调性：D 自然小调 + 弗里几亚 b2 (Eb) 色彩（巨象的压迫感 / 异域感）。
曲式：A( dread ostinato ) -> A'( 铜管动机 ) -> B( 无词挽歌·合唱 ) -> A''( 全奏高潮 + 回转 )。
结尾 bar15 的 Eb -> 循环头 Dm = 弗里几亚终止，每圈落下都是一次"压境"。
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

# ------------------------------------------------------------ 参数
SCALE = [0, 2, 3, 5, 7, 8, 10]        # 自然小调
TONIC = mg.note_to_midi('D3')         # 50
BPM = 96
BARS = 16
BPB = 4
OUT = os.environ.get("OUT_MID", "track01.mid")

def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)

def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)

EB = TONIC + 1                        # Eb3，弗里几亚色彩音
EB_CHORD = [EB, EB + 4, EB + 7]       # Eb G Bb

# 每小节和弦：1=Dm 3=F 4=Gm 6=Bb 7=C；None = 借用 Eb 大三和弦(bII)
PROG = [1, 1, 6, 7,
        1, 1, 4, None,
        3, 7, 6, 4,
        1, 7, 6, None]

def chord_for(bar, octave=0):
    d = PROG[bar]
    if d is None:
        return [n + 12 * octave for n in EB_CHORD]
    return C(d, 3, octave)

def root2(bar):
    """和弦根音的低八度（oct2 区），供 drone / 定音鼓用。"""
    return chord_for(bar)[0] - 12

p = mg.Piece(bpm=BPM, bars=BARS)

# ============================================================ 1) 低音锚
drone = p.track("drone-cb", mg.GM['contrabass'], pan=64, volume=90)
tuba = p.track("drone-tuba", mg.GM['tuba'], pan=64, volume=78)
for bar in range(BARS):
    r = root2(bar)
    vel = 66 + (6 if bar >= 8 else 0) + (6 if bar >= 12 else 0)
    drone.note(bar * BPB, r, BPB - 0.06, vel)
    if bar % 2 == 1:                       # 五度长音托厚度
        tuba.note(bar * BPB, r + 7, BPB - 0.06, 60)

# ============================================================ 2) 战争机器 ostinato
ost = p.track("ost-cello", mg.GM['cello'], pan=14, volume=96)
ost2 = p.track("ost-cb", mg.GM['contrabass'], pan=114, volume=86)
for bar in range(2, BARS):                 # bar0-1 留给 dread 引子
    r = chord_for(bar)[0]
    pat = [(0.0, 0.5, 84), (0.5, 0.5, 62), (1.0, 0.5, 72), (1.5, 0.5, 62),
           (2.0, 0.75, 88), (2.75, 0.25, 58), (3.0, 0.5, 76), (3.5, 0.5, 66)]
    gain = 1.0 if bar < 8 else 1.08
    for bt, du, vel in pat:
        v = min(110, int(vel * gain))
        ost.note(bar * BPB + bt, r, du * 0.92, v)
        ost2.note(bar * BPB + bt, r - 12, du * 0.92, max(40, v - 20))

# ============================================================ 3) 战鼓
drm = p.track("war-drums", 0, drums=True, pan=64, volume=104)
K, TL, TM, SN, CR = 36, 41, 47, 38, 49
for bar in range(BARS):
    b = bar * BPB
    if bar == 0:                           # 开场重锤
        drm.note(b, K, 0.4, 108)
        drm.note(b + 2.0, TL, 0.3, 84)
        drm.note(b + 3.5, K, 0.3, 78)
        continue
    if bar == 15:                          # 回转 fill 进循环点
        drm.note(b, K, 0.3, 100)
        drm.note(b + 2.0, K, 0.3, 92)
        for i in range(6):
            drm.note(b + 2.0 + i * 0.3333, TM if i % 2 else TL, 0.2, 60 + i * 7)
        drm.note(b + 3.5, SN, 0.2, 96)
        continue
    # 基础进行曲型
    drm.note(b + 0.0, K, 0.3, 100)
    drm.note(b + 2.0, K, 0.3, 92)
    drm.note(b + 3.5, K, 0.3, 84)
    drm.note(b + 1.5, TL, 0.25, 70)
    drm.note(b + 2.5, TM, 0.25, 66)
    if bar >= 4:
        drm.note(b + 0.5, TL, 0.25, 78)
        drm.note(b + 1.0, TM, 0.25, 72)
        drm.note(b + 3.0, TL, 0.25, 80)
        drm.note(b + 0.75, SN, 0.15, 52)
        drm.note(b + 2.75, SN, 0.15, 56)
    if bar in (8, 12):                     # 段落 crash + 小军鼓滚
        drm.note(b, CR, 1.5, 74)
        for i in range(4):
            drm.note(b + 1.0 + i * 0.25, SN, 0.12, 44 + i * 8)

timp = p.track("timpani", mg.GM['timpani'], pan=64, volume=98)
for bar in range(BARS):
    r = root2(bar)
    timp.note(bar * BPB, r, 1.2, 96 if bar % 4 == 0 else 84)
    if bar in (7, 15):
        timp.note(bar * BPB + 2.0, r + 7, 1.0, 88)

# ============================================================ 4) 弦乐垫（左右分轨做宽度）
pad = p.track("pad-L", mg.GM['strings'], pan=10, volume=84)
pad2 = p.track("pad-R", mg.GM['strings_slow'], pan=118, volume=80)
for bar in range(BARS):
    ch = chord_for(bar, 1)
    vel = 56 if bar < 4 else (62 if bar < 8 else 70)
    pad.chord(bar * BPB, ch, BPB - 0.08, vel=vel)
    pad2.chord(bar * BPB, [ch[0] + 12, ch[2] + 12], BPB - 0.08, vel=vel - 8)

trem = p.track("tremolo", mg.GM['tremolo_strings'], pan=64, volume=70)
for bar in (6, 7, 14, 15):                 # 张力震音
    ch = chord_for(bar, 1)
    trem.note(bar * BPB, ch[1] + 12, BPB - 0.05, 64)
    trem.note(bar * BPB + 2, ch[2] + 12, 2 - 0.05, 70)

# ============================================================ 5) 合唱挽歌（B 段的心）
CHOIR_MEL = [
    (8, 0.0, 5, 1, 2.0), (8, 2.0, 6, 1, 2.0),
    (9, 0.0, 7, 1, 3.0), (9, 3.0, 6, 1, 1.0),
    (10, 0.0, 8, 1, 2.5), (10, 2.5, 7, 1, 1.5),
    (11, 0.0, 6, 1, 4.0),
    (12, 0.0, 5, 1, 2.0), (12, 2.0, 3, 1, 2.0),
    (13, 0.0, 4, 1, 4.0),
]
choir = p.track("choir-L", mg.GM['choir_aahs'], pan=40, volume=78)
choir2 = p.track("choir-R", mg.GM['voice_oohs'], pan=88, volume=72)
lead = p.track("lead-str", mg.GM['strings'], pan=64, volume=96)
for bar, bt, dg, oc, du in CHOIR_MEL:
    pit = D(dg, oc)
    choir.note(bar * BPB + bt, pit, du * 0.97, 74)
    choir2.note(bar * BPB + bt, pit - 12, du * 0.97, 62)
    if bar < 12:
        lead.note(bar * BPB + bt, pit + 12, du * 0.97, 72)   # 高八度翱翔

# ============================================================ 6) 铜管
horn = p.track("horn", mg.GM['french_horn'], pan=52, volume=92)
tbone = p.track("trombone", mg.GM['trombone'], pan=76, volume=86)
HORN_MOTIF = [                             # A' 段：隐忍的号角动机
    (4, 0.0, 1, 0, 1.5), (4, 1.5, 1, 0, 0.5), (4, 2.0, 3, 0, 2.0),
    (5, 0.0, 4, 0, 1.0), (5, 1.0, 3, 0, 1.0), (5, 2.0, 1, 0, 2.0),
    (6, 0.0, 5, 0, 1.5), (6, 1.5, 4, 0, 0.5), (6, 2.0, 3, 0, 2.0),
]
for bar, bt, dg, oc, du in HORN_MOTIF:
    pit = D(dg, oc)
    horn.note(bar * BPB + bt, pit + 12, du * 0.95, 82)
    tbone.note(bar * BPB + bt, pit, du * 0.95, 74)
# bar7：弗里几亚叹息 Eb -> D
horn.note(7 * BPB, EB + 12, 1.9, 84)
tbone.note(7 * BPB, EB, 1.9, 76)
horn.note(7 * BPB + 2, D(1, 1), 1.9, 80)
tbone.note(7 * BPB + 2, D(1, 0), 1.9, 72)

brass = p.track("brass-sec", mg.GM['brass_section'], pan=64, volume=94)
CLIMAX = [                                 # A'' 段：全奏宣言
    (12, 0.0, 5, 1, 1.5), (12, 1.5, 5, 1, 0.5), (12, 2.0, 8, 1, 2.0),
    (13, 0.0, 7, 1, 1.0), (13, 1.0, 6, 1, 1.0), (13, 2.0, 5, 1, 2.0),
    (14, 0.0, 6, 1, 1.5), (14, 1.5, 5, 1, 0.5), (14, 2.0, 4, 1, 2.0),
]
for bar, bt, dg, oc, du in CLIMAX:
    pit = D(dg, oc)
    brass.note(bar * BPB + bt, pit, du * 0.95, 88)
    brass.note(bar * BPB + bt, pit - 12, du * 0.95, 78)
    lead.note(bar * BPB + bt, pit, du * 0.95, 84)             # 弦乐同度加厚
brass.note(15 * BPB, EB + 12, 1.9, 90)                        # bar15 蓄力
brass.note(15 * BPB, EB, 1.9, 80)
brass.note(15 * BPB + 2, EB + 16, 1.9, 94)
brass.note(15 * BPB + 2, EB + 4, 1.9, 84)

# ============================================================ 7) 钟色点缀
bell = p.track("bells", mg.GM['tubular_bells'], pan=96, volume=58)
for bar in (8, 12):
    bell.note(bar * BPB, D(5, 2), 2.5, 62)
    bell.note(bar * BPB + 2, D(3, 2), 2.0, 54)

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s tracks={len(p._tracks)}")
