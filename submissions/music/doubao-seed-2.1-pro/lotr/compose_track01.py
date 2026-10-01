#!/usr/bin/env python
"""track01 — 指环王战象冲锋：悲壮史诗战争 BGM.
D 自然小调, BPM=90, 16小节 ≈ 42.7秒.
和声进行 (每2小节一换): i-VI-III-VII | i-IV-V-i
    Dm - Bb - F - C | Dm - Gm - A - Dm
配器：Timpani战鼓, 低大提+贝斯铺底, 铜管齐奏和弦, 圆号主旋律, 人声合唱氛围, 军鼓重击.
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

# ============================================================ 可调参数
# D自然小调：D E F G A Bb C
SCALE = [0, 2, 3, 5, 7, 8, 10]
TONIC = mg.note_to_midi('D3')  # 主音 D3
BPM = 90
BARS = 16
BPB = 4
# 和声进行：每小节使用的和弦级数
PROG = [
    1, 1, 6, 6,  # Dm Dm Bb Bb   (i i VI VI)
    3, 3, 7, 7,  # F  F  C  C    (III III VII VII)
    1, 1, 4, 4,  # Dm Dm Gm Gm   (i i IV IV)
    5, 5, 1, 1,  # A  A  Dm Dm   (V V i i)
]
OUT = os.environ.get("OUT_MID", "track01.mid")


def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)


def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


p = mg.Piece(bpm=BPM, bars=BARS)

# ============================================================ 1. 定音鼓 Timpani：沉重战鼓（低频根基）
# 正拍重击，模拟战象脚步
timpani = p.track("timpani", mg.GM['timpani'], pan=64, volume=110)
for bar in range(BARS):
    for beat in [0, 2]:  # 1、3拍沉重一击
        # 根据小节调整音高：主音和属音交替
        root = D(PROG[bar], octave=-1)  # 低音区
        timpani.note(bar * BPB + beat, root, 1.8, vel=105)
    # 第四拍加一个轻装饰（呼应脚步拖曳感）
    timpani.note(bar * BPB + 3, D(PROG[bar], octave=-1), 0.8, vel=78)

# ============================================================ 2. 低音提琴 Contrabass：长音低音铺底（保证低频不空）
bass = p.track("contrabass", mg.GM['contrabass'], pan=60, volume=100)
for bar in range(BARS):
    root = D(PROG[bar], octave=-1)
    # 每2小节一个长音，带轻微弓法
    bass.note(bar * BPB, root, 3.9, vel=85)
    # 第五拍(小节中)加五度支撑
    fifth_deg = PROG[bar] + 4  # 和弦五度
    bass.note(bar * BPB + 2, D(fifth_deg, octave=-1), 1.9, vel=72)

# ============================================================ 3. 大提琴 Cello：悲壮低音线条
cello = p.track("cello", mg.GM['cello'], pan=70, volume=95)
# 每小节一个长音根+五度，做和声低音的中音支撑
for bar in range(BARS):
    deg = PROG[bar]
    cello.note(bar * BPB, D(deg, octave=0), 2.0, vel=78)
    cello.note(bar * BPB + 2, D(deg + 4, octave=0), 1.9, vel=72)

# ============================================================ 4. 铜管齐奏 Brass Section：和声和弦（史诗核心）
brass = p.track("brass", mg.GM['brass_section'], pan=64, volume=96)
for bar in range(BARS):
    # 每小节奏和弦，带强起
    chd = C(PROG[bar], size=3, octave=0)
    brass.chord(bar * BPB, chd, 3.9, vel=85)
    # 第3拍加一次强调（步伐感）
    brass.chord(bar * BPB + 2, chd, 1.9, vel=78)

# 高潮段（9-15小节）加入长号加强
trombone = p.track("trombone", mg.GM['trombone'], pan=58, volume=92)
for bar in range(8, BARS):
    chd = C(PROG[bar], size=3, octave=0)
    trombone.chord(bar * BPB, chd, 3.9, vel=80)

# ============================================================ 5. 圆号 French Horn：主旋律（号角/战争号召感）
horn = p.track("horn", mg.GM['french_horn'], pan=72, volume=108)
# 悲壮号角旋律，D小调，4+4+4+4 四句
MELODY = [
    # 第一句（bars 0-3）低沉开场——远处象群浮现
    (0, 0.0, 1, 1, 2.0, 88),
    (0, 2.0, 3, 1, 1.9, 82),
    (1, 0.0, 5, 1, 2.0, 90),
    (1, 2.0, 1, 2, 1.9, 92),
    (2, 0.0, 6, 1, 1.0, 86),
    (2, 1.0, 5, 1, 1.0, 82),
    (2, 2.0, 3, 1, 1.9, 84),
    (3, 0.0, 1, 1, 2.0, 88),
    (3, 2.0, 6, 0, 1.9, 80),
    # 第二句（bars 4-7）上扬
    (4, 0.0, 3, 1, 2.0, 90),
    (4, 2.0, 5, 1, 1.9, 92),
    (5, 0.0, 7, 1, 1.0, 96),
    (5, 1.0, 1, 2, 1.0, 98),
    (5, 2.0, 7, 1, 1.9, 92),
    (6, 0.0, 7, 1, 1.0, 90),
    (6, 1.0, 5, 1, 1.0, 88),
    (6, 2.0, 3, 1, 1.9, 86),
    (7, 0.0, 2, 1, 2.0, 90),
    (7, 2.0, 5, 1, 1.9, 88),
    # 第三句（bars 8-11）——高潮段，象群冲锋
    (8, 0.0, 1, 2, 2.0, 105),
    (8, 2.0, 3, 2, 1.0, 100),
    (8, 3.0, 5, 2, 0.9, 102),
    (9, 0.0, 1, 2, 2.0, 108),
    (9, 2.0, 7, 1, 1.0, 96),
    (9, 3.0, 5, 1, 0.9, 94),
    (10, 0.0, 4, 1, 1.0, 98),
    (10, 1.0, 6, 1, 1.0, 100),
    (10, 2.0, 1, 2, 1.9, 106),
    (11, 0.0, 4, 1, 2.0, 98),
    (11, 2.0, 5, 1, 1.9, 96),
    # 第四句（bars 12-15）回落并解决到主音，为循环做准备
    (12, 0.0, 5, 1, 1.0, 100),
    (12, 1.0, 7, 1, 1.0, 102),
    (12, 2.0, 2, 2, 1.9, 104),
    (13, 0.0, 5, 1, 1.0, 96),
    (13, 1.0, 3, 1, 1.0, 94),
    (13, 2.0, 1, 1, 1.9, 92),
    (14, 0.0, 1, 2, 2.0, 100),
    (14, 2.0, 7, 1, 1.0, 90),
    (14, 3.0, 5, 1, 0.9, 88),
    (15, 0.0, 3, 1, 2.0, 88),
    (15, 2.0, 1, 1, 1.9, 92),  # 落回主音D，无缝接回开头
]
for bar, beat, deg, octv, dur, vel in MELODY:
    horn.note(bar * BPB + beat, D(deg, octv), dur * 0.95, vel=vel)

# ============================================================ 6. 人声合唱 Choir Aahs：和声铺底（营造神圣悲壮感）
choir = p.track("choir", mg.GM['choir_aahs'], pan=64, volume=85)
for bar in range(BARS):
    # 长音和弦铺底
    chd = C(PROG[bar], size=3, octave=1)
    choir.chord(bar * BPB, chd, 3.95, vel=72)

# 第二合唱团声像偏移做立体声宽
choir2 = p.track("choir_R", mg.GM['choir_aahs'], pan=20, volume=75)
for bar in range(BARS):
    # 高一八度，错开节奏（延迟半拍进入）制造合唱厚度
    chd = C(PROG[bar], size=3, octave=2)
    choir2.chord(bar * BPB + 0.3, chd, 3.6, vel=60)

# ============================================================ 7. 打击乐：大军鼓+军鼓（战争推进）
drums = p.track("drums", program=0, drums=True, pan=64, volume=105)
for bar in range(BARS):
    # 底鼓沉重正拍
    drums.note(bar * BPB, mg.DRUMS['kick'], 0.6, vel=100)
    drums.note(bar * BPB + 2, mg.DRUMS['kick'], 0.6, vel=95)
    # 高潮段（bar8起）加军鼓
    if bar >= 8:
        drums.note(bar * BPB + 1, mg.DRUMS['snare'], 0.4, vel=82)
        drums.note(bar * BPB + 3, mg.DRUMS['snare'], 0.4, vel=80)
    # 每4小节加crash标志段落
    if bar in [0, 4, 8, 12]:
        drums.note(bar * BPB, mg.DRUMS['crash'], 1.5, vel=75)

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | scale=D-minor tonic=D3 bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
