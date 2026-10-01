#!/usr/bin/env python
"""Mûmakil Charge — 史诗战争背景音乐
   画面：巨兽冲锋，千军万马，阴云压顶
   调性：D harmonic minor（暗黑、古老、异域）
   BPM 96 × 16 bars = 40s
"""
import os, sys
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

# === 音阶与调性 ===
SCALE = [0, 2, 3, 5, 7, 8, 11]   # D harmonic minor: D E F G A Bb C#
TONIC = mg.note_to_midi('D3')      # 50
BPM = 96
BARS = 16
BPB = 4

def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)

def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)

OUT = os.environ.get("OUT_MID", "makil_charge.mid")
p = mg.Piece(bpm=BPM, bars=BARS)

# ============================================================
# Track 1: Timpani — 原始战鼓，大地震颤
# ============================================================
timpani = p.track("timpani", mg.GM['timpani'], pan=64, volume=115)
for bar in range(BARS):
    base = bar * BPB
    # 核心节奏：咚——哒咚——咚
    timpani.note(base + 0.0, D(1, -2), 0.6, 105)   # D2 强拍
    timpani.note(base + 1.5, D(1, -2), 0.3, 75)     # 弱起
    timpani.note(base + 2.0, D(5, -2), 0.5, 95)     # A1 五度
    timpani.note(base + 3.0, D(1, -2), 0.3, 80)     # 回到 D
    timpani.note(base + 3.5, D(5, -2), 0.25, 70)    # 装饰

# ============================================================
# Track 2: Contrabass — 驱动性低音固定音型（巨兽踏步）
# ============================================================
bass = p.track("contrabass", mg.GM['contrabass'], pan=38, volume=105)
BASS_OST = [
    # (偏移拍, 度数, 八度, 时值, 基础力度)
    (0.0, 1, -1, 0.45, 95),   # D2
    (0.5, 1, -1, 0.45, 80),
    (1.0, 5, -2, 0.45, 90),   # A1
    (1.5, 1, -1, 0.45, 80),
    (2.0, 1, -1, 0.45, 95),   # D2
    (2.5, 3, -1, 0.45, 75),   # F2
    (3.0, 5, -2, 0.45, 85),   # A1
    (3.5, 1, -1, 0.45, 80),   # D2
]
for bar in range(BARS):
    base = bar * BPB
    for off, deg, octv, dur, vel in BASS_OST:
        bass.note(base + off, D(deg, octv), dur, vel)

# ============================================================
# Track 3: Cello — 低声部对位（暗流涌动）
# ============================================================
cello = p.track("cello", mg.GM['cello'], pan=85, volume=95)
for bar in range(BARS):
    base = bar * BPB
    # 分解和弦织体
    if bar % 4 < 2:  # Dm 区域
        cello.note(base + 0.0, D(1, 0), 0.75, 80)
        cello.note(base + 0.75, D(3, 0), 0.75, 72)
        cello.note(base + 1.5, D(5, 0), 0.75, 68)
        cello.note(base + 2.25, D(3, 0), 0.5, 62)
        cello.note(base + 2.75, D(1, 0), 1.2, 72)
    elif bar % 4 == 2:  # 上升区域
        cello.note(base + 0.0, D(6, -1), 0.75, 78)  # Bb2
        cello.note(base + 0.75, D(1, 0), 0.75, 75)   # D3
        cello.note(base + 1.5, D(3, 0), 0.75, 72)    # F3
        cello.note(base + 2.25, D(5, 0), 0.75, 68)   # A3
        cello.note(base + 3.0, D(3, 0), 1.0, 65)     # F3
    else:  # 属→主解决
        cello.note(base + 0.0, D(5, 0), 0.75, 82)    # A3
        cello.note(base + 0.75, D(7, 0), 0.75, 78)   # C#4
        cello.note(base + 1.5, D(1, 1), 1.0, 85)     # D4
        cello.note(base + 2.5, D(5, 0), 1.5, 70)     # A3

# ============================================================
# Track 4: French Horn — 英雄主题旋律（悲壮、史诗）
# ============================================================
horn = p.track("french_horn", mg.GM['french_horn'], pan=52, volume=110)
MELODY = [
    # --- Bars 0-3: 主题 A，沉重步伐 ---
    (0, 0.0, 5, 0, 2.0, 88),     # A3 长音
    (0, 2.0, 3, 0, 1.5, 82),     # F3
    (0, 3.5, 1, 0, 0.5, 75),     # D3
    (1, 0.0, 5, 0, 1.0, 92),     # A3
    (1, 1.0, 7, 0, 1.0, 88),     # C#4
    (1, 2.0, 1, 1, 2.0, 98),     # D4 ★
    (3, 0.0, 1, 1, 1.5, 92),     # D4
    (3, 1.5, 7, 0, 0.5, 85),     # C#4
    (3, 2.0, 5, 0, 2.0, 82),     # A3

    # --- Bars 4-7: 主题 B，向上升腾 ---
    (4, 0.0, 3, 1, 2.0, 100),    # F4
    (4, 2.0, 1, 1, 1.5, 95),     # D4
    (4, 3.5, 6, 0, 0.5, 88),     # Bb3
    (5, 0.0, 5, 0, 1.0, 102),    # A3
    (5, 1.0, 3, 1, 1.0, 98),     # F4
    (5, 2.0, 5, 1, 2.0, 108),    # A4 ★ 高潮
    (7, 0.0, 5, 1, 1.5, 105),    # A4
    (7, 1.5, 3, 1, 0.5, 98),     # F4
    (7, 2.0, 1, 1, 2.0, 92),     # D4

    # --- Bars 8-11: 高潮 C，最强音 ---
    (8, 0.0, 7, 1, 1.0, 112),    # C#5
    (8, 1.0, 1, 2, 1.0, 118),    # D5 ★★
    (8, 2.0, 7, 1, 1.5, 110),    # C#5
    (8, 3.5, 5, 1, 0.5, 102),    # A4
    (9, 0.0, 3, 1, 2.0, 108),    # F4
    (9, 2.0, 1, 1, 2.0, 102),    # D4
    (10, 0.0, 5, 0, 1.0, 95),    # A3
    (10, 1.0, 7, 0, 1.0, 90),    # C#4
    (10, 2.0, 1, 1, 2.0, 105),   # D4
    (12, 0.0, 5, 1, 2.0, 110),   # A4
    (12, 2.0, 3, 1, 1.5, 105),   # F4
    (12, 3.5, 1, 1, 0.5, 98),    # D4

    # --- Bars 13-15: 回落 + 转回（为循环准备） ---
    (13, 0.0, 7, 0, 2.0, 92),    # C#4
    (13, 2.0, 5, 0, 2.0, 88),    # A3
    (14, 0.0, 3, 0, 1.5, 82),    # F3
    (14, 1.5, 5, 0, 0.5, 78),    # A3
    (14, 2.0, 1, 0, 2.0, 85),    # D3
    (15, 0.0, 5, 0, 1.0, 82),    # A3
    (15, 1.0, 3, 0, 1.0, 78),    # F3
    (15, 2.0, 1, 0, 2.0, 85),    # D3 → 回到 bar 0 的 A3
]
for bar, beat, deg, octv, dur, vel in MELODY:
    horn.note(bar * BPB + beat, D(deg, octv), dur * 0.96, vel)

# ============================================================
# Track 5: Trombone — 暗色铜管和声（压迫感）
# ============================================================
trombone = p.track("trombone", mg.GM['trombone'], pan=78, volume=100)
# 和声骨架：每 2 小节一个和弦
HARMONY = [
    # (bar, degree, octave)
    (0,  1, 0), (2,  1, 0),    # Dm
    (4,  6, 0), (6,  6, 0),    # Bb
    (8,  4, 0), (10, 5, 0),    # Gm → A
    (12, 1, 0), (14, 5, 0),    # Dm → A（属准备回主）
]
for bar, deg, octv in HARMONY:
    chord_notes = C(deg, size=3, octave=octv)
    for n in chord_notes:
        trombone.note(bar * BPB, n, 2.0 * 0.95, 78)
    # 第二拍重复
    for n in chord_notes:
        trombone.note(bar * BPB + 2.0, n, 2.0 * 0.95, 72)

# ============================================================
# Track 6: Tuba — 超低音铜管（大地震颤感）
# ============================================================
tuba = p.track("tuba", mg.GM['tuba'], pan=60, volume=95)
for bar in range(BARS):
    base = bar * BPB
    # 每小节一个长音，跟随和弦根音
    if bar % 8 < 4:
        tuba.note(base, D(1, -1), 3.8, 85)   # D2
    elif bar % 8 == 4 or bar % 8 == 5:
        tuba.note(base, D(6, -2), 3.8, 82)   # Bb1
    elif bar % 8 == 6:
        tuba.note(base, D(4, -2), 3.8, 80)   # G1
    else:
        tuba.note(base, D(5, -2), 3.8, 85)   # A1

# ============================================================
# Track 7: Choir Aahs — 肃杀合唱氛围
# ============================================================
choir = p.track("choir", mg.GM['choir_aahs'], pan=64, volume=82)
CHOIR = [
    # (bar, 度数, 八度, 时值拍, 力度)
    (0,  1, 0, 4.0, 65),   # D3
    (0,  5, 0, 4.0, 58),   # A3
    (4,  6, 0, 4.0, 70),   # Bb3
    (4,  1, 1, 4.0, 62),   # D4
    (8,  1, 0, 4.0, 75),   # D3
    (8,  5, 0, 4.0, 68),   # A3
    (8,  3, 1, 4.0, 60),   # F4
    (12, 5, 0, 4.0, 72),   # A3
    (12, 7, 0, 4.0, 65),   # C#4
]
for bar, deg, octv, dur, vel in CHOIR:
    choir.note(bar * BPB, D(deg, octv), dur * 0.95, vel)

# ============================================================
# Track 8: Tremolo Strings — 弦乐震音（紧张感）
# ============================================================
trem_str = p.track("tremolo_strings", mg.GM['tremolo_strings'], pan=50, volume=88)
for bar in range(BARS):
    base = bar * BPB
    if bar % 4 < 2:
        trem_str.note(base, D(1, 1), 4.0, 68)   # D4
    elif bar % 4 == 2:
        trem_str.note(base, D(6, 0), 4.0, 72)   # Bb3
    else:
        trem_str.note(base, D(5, 0), 4.0, 75)   # A3

# ============================================================
# Track 9: Drums — 战争打击乐
# ============================================================
drums = p.track("drums", 0, drums=True, pan=64, volume=108)
for bar in range(BARS):
    base = bar * BPB
    # Kick — 沉重步伐
    drums.note(base + 0.0, mg.DRUMS['kick'], 0.5, 105)
    drums.note(base + 2.0, mg.DRUMS['kick'], 0.5, 95)
    if bar >= 8:
        drums.note(base + 1.0, mg.DRUMS['kick'], 0.3, 80)  # 高潮加花
    # Snare — 军鼓
    drums.note(base + 1.0, mg.DRUMS['snare'], 0.5, 88)
    drums.note(base + 3.0, mg.DRUMS['snare'], 0.5, 82)
    if bar >= 4:
        drums.note(base + 2.5, mg.DRUMS['snare'], 0.25, 65)  # 加花
    # Hi-hat — 持续驱动
    for i in range(8):
        vel = 55 + (12 if i % 2 == 0 else 0) + (8 if bar >= 8 else 0)
        drums.note(base + i * 0.5, mg.DRUMS['hh_closed'], 0.25, vel)
    # Tom fills — bar 结尾加花
    if bar % 4 == 3:
        drums.note(base + 3.25, mg.DRUMS['tom_high'], 0.25, 70)
        drums.note(base + 3.5, mg.DRUMS['tom_mid'], 0.25, 75)
        drums.note(base + 3.75, mg.DRUMS['tom_low'], 0.25, 80)

# Crash — 重大结构点
for bar in [0, 4, 8, 12]:
    drums.note(bar * BPB, mg.DRUMS['crash'], 1.5, 105)

# Ride — 高潮段增添金属质感
for bar in range(8, 16):
    base = bar * BPB
    for i in range(4):
        drums.note(base + i, mg.DRUMS['ride'], 0.3, 55)

# ============================================================
p.save(OUT)
print(f"OK {OUT} | scale={SCALE} tonic={TONIC} bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
