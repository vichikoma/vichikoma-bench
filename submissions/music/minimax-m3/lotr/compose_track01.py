#!/usr/bin/env python
"""track01 —— 象群冲锋 / 史诗战场 BGM。

画面：D Phrygian 调，象群在佩兰诺平野般的战场上踏过倒地战士，
尘土飞扬、压迫、悲壮。16 小节无缝循环。

设计要点
- 调性：D Phrygian (D E♭ F G A B♭ C) —— 古希腊/中土战争感
- BPM 96 → 16 小节 = 40 秒（落在 30–48s 区间）
- 配器（保证 80–250Hz 不空 + 立体声宽度）：
    * contrabass (低音提琴)  pan 20  —— 持续低音
    * timpani    (定音鼓)    pan 110 —— 节奏骨架 + 旋律点缀
    * strings_slow (弦乐)    pan 50  —— 长音铺垫
    * choir_aahs (人声 "啊") pan 80  —— 悲剧感 pad
    * french_horn (圆号)     pan 60  —— 主旋律
    * brass_section (铜管组) pan 70  —— 后半段叠厚
    * flute      (长笛)      pan 40  —— 高音装饰
    * drums (鼓组, ch 9)
- 结构 AABA-like：
    bar 0-3  A    圆号陈述动机
    bar 4-7  A'   重复 + 弦乐/合唱进入
    bar 8-11 B    旋律上扬 + 铜管齐奏进入
    bar 12-15 A'' 综合再现 + 解决到 D
"""
import os
import sys
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

# ============================================================ 可调参数
SCALE = [0, 1, 3, 5, 7, 8, 10]          # D Phrygian 半音数
TONIC = mg.note_to_midi('D3')          # 主音放低，让低音线条真正在低音区
BPM = 96
BARS = 16
PROG = [1, 4, 1, 5,                   # bar 0-3  i - iv - i - v (phrygian 化的 v)
        1, 4, 1, 1,                   # bar 4-7
        3, 1, 4, 1,                   # bar 8-11 B段：vi - i - iv - i
        5, 1, 4, 1]                   # bar 12-15
OUT = os.environ.get("OUT_MID", "track01.mid")

def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)

def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


p = mg.Piece(bpm=BPM, bars=BARS)
BPB = 4
LOOP_BEATS = BARS * BPB               # 64 拍

# ============================================================ 低音线条（contrabass, pan 20）
# 走主音 + 四度/五度，强调 ♭2 解决到主音（phrygian cadence）
# 全程做长音 + 偶尔走动；保证 80–250Hz 丰满
bass = p.track("bass", mg.GM["contrabass"], pan=20, volume=100)
BASS = [
    # (bar, beat, degree, octave, duration_beats)
    (0, 0, 1, 0, 8),     # D 长
    (2, 0, 4, 0, 4),     # G
    (3, 0, 1, 0, 4),     # D
    (4, 0, 5, -1, 4),    # A2
    (5, 0, 1, 0, 8),     # D 长
    (7, 0, 5, -1, 4),    # A2
    (8, 0, 3, 0, 4),     # F
    (9, 0, 1, 0, 4),     # D
    (10, 0, 4, 0, 4),    # G
    (11, 0, 1, 0, 4),    # D
    (12, 0, 5, -1, 4),   # A2
    (13, 0, 1, 0, 4),    # D
    (14, 0, 4, 0, 4),    # G
    (15, 0, 1, 0, 4),    # D
]
for bar, beat, deg, octv, dur in BASS:
    bass.note(bar * BPB + beat, D(deg, octv - 1), dur * 0.95, 78)

# 加一条走动低音（八分音符）的微小修饰，让节奏更稳
# 用拨弦方式：在 2、4 拍附加
# 实际上为简洁起见不做，留给 timpani

# ============================================================ 定音鼓（timpani, pan 110）
# 节奏骨架：1、3 拍重击；B 段加重；最后小节滚奏
timpani = p.track("timpani", mg.GM["timpani"], pan=110, volume=105)
TIMPANI_HITS = [
    # A 段：1,3 拍
    (0, 0, 1, 0, 1.5),
    (0, 2, 4, -1, 1.5),
    (1, 0, 1, 0, 1.5),
    (1, 2, 4, -1, 1.5),
    (2, 0, 1, 0, 1.5),
    (2, 2, 4, -1, 1.5),
    (3, 0, 1, 0, 3.5),
    # A' 段：加入更多变化
    (4, 0, 1, 0, 1.0),
    (4, 1, 5, -1, 1.0),
    (4, 2, 1, 0, 1.5),
    (5, 0, 4, -1, 1.5),
    (5, 2, 1, 0, 1.5),
    (6, 0, 5, -1, 1.5),
    (6, 2, 1, 0, 1.5),
    (7, 0, 4, -1, 1.5),
    (7, 2, 1, 0, 3.0),
    # B 段：加速 + 加重
    (8, 0, 1, 0, 1.0),
    (8, 1, 1, 0, 1.0),
    (8, 2, 1, 0, 1.5),
    (9, 0, 3, -1, 1.5),
    (9, 2, 1, 0, 1.5),
    (10, 0, 4, -1, 1.5),
    (10, 2, 1, 0, 1.5),
    (11, 0, 1, 0, 3.5),
    # A'' 段：解决
    (12, 0, 5, -1, 1.5),
    (12, 2, 4, -1, 1.5),
    (13, 0, 1, 0, 1.5),
    (13, 2, 5, -1, 1.5),
    (14, 0, 4, -1, 1.5),
    (14, 2, 1, 0, 1.5),
    (15, 0, 1, 0, 3.5),
]
for bar, beat, deg, octv, dur in TIMPANI_HITS:
    timpani.note(bar * BPB + beat, D(deg, octv - 1), dur * 0.9, 95)

# ============================================================ 弦乐长音铺垫（strings_slow, pan 50）
# 每两小节一个长音和弦，缓慢变化
strings = p.track("strings", mg.GM["strings_slow"], pan=50, volume=92)
for bar in range(BARS):
    deg = PROG[bar]
    chord_notes = C(deg, size=3, octave=0)   # 在 D3 区域上方的三和弦
    strings.chord(bar * BPB, chord_notes, BPB * 0.98, 70)

# ============================================================ 人声"啊"持续垫（choir_aahs, pan 80）
# 只在 A'、B、A'' 段加入，A 段保持安静让圆号单独陈述
choir = p.track("choir", mg.GM["choir_aahs"], pan=80, volume=78)
# 从 bar 4 开始（弦乐加入的同时）
for bar in range(4, BARS):
    deg = PROG[bar]
    # 上方三和弦（octave +1）做柔和高音
    chord_notes = C(deg, size=3, octave=1)
    choir.chord(bar * BPB, chord_notes, BPB * 0.98, 60)

# ============================================================ 主旋律：圆号（french_horn, pan 60）
# A 段：陈述动机 —— 下行五度 + 上扬，附点节奏
# B 段：上扬到 G5，再下行解决
horn = p.track("horn", mg.GM["french_horn"], pan=60, volume=106)
HORN_MELODY = [
    # ---------- A 句：bar 0-3，陈述
    (0, 0, 1, 1, 2.0),       # D5（高音起）
    (0, 2, 5, 0, 2.0),       # A4
    (1, 0, 4, 0, 1.5),       # G4
    (1, 1.5, 3, 0, 0.5),     # F4
    (1, 2, 1, 0, 2.0),       # D4
    (2, 0, 8, 0, 2.0),       # C4
    (2, 2, 5, 0, 1.0),       # A4
    (2, 3, 4, 0, 1.0),       # G4
    (3, 0, 3, 0, 4.0),       # F4 长
    # ---------- A' 句：bar 4-7，重复 + 加花
    (4, 0, 1, 1, 2.0),       # D5
    (4, 2, 5, 0, 2.0),       # A4
    (5, 0, 4, 0, 1.5),       # G4
    (5, 1.5, 3, 0, 0.5),     # F4
    (5, 2, 1, 0, 2.0),       # D4
    (6, 0, 8, 0, 1.5),       # C4
    (6, 1.5, 5, 0, 0.5),     # A4
    (6, 2, 3, 0, 1.0),       # F4
    (6, 3, 5, 0, 1.0),       # A4
    (7, 0, 4, 0, 4.0),       # G4 长（phrygian cadence 准备）
    # ---------- B 句：bar 8-11，上扬
    (8, 0, 1, 1, 1.5),       # D5
    (8, 1.5, 3, 1, 0.5),     # F5
    (8, 2, 5, 1, 1.0),       # A5
    (8, 3, 4, 1, 1.0),       # G5
    (9, 0, 3, 1, 1.5),       # F5
    (9, 1.5, 1, 1, 0.5),     # D5
    (9, 2, 4, 1, 2.0),       # G5（最高持续）
    (10, 0, 5, 1, 1.0),      # A5
    (10, 1, 4, 1, 1.0),      # G5
    (10, 2, 3, 1, 2.0),      # F5
    (11, 0, 1, 1, 4.0),      # D5 长（属准备）
    # ---------- A'' 句：bar 12-15，综合 + 解决
    (12, 0, 5, 1, 1.5),      # A5
    (12, 1.5, 4, 1, 0.5),    # G5
    (12, 2, 3, 1, 2.0),      # F5
    (13, 0, 1, 1, 1.5),      # D5
    (13, 1.5, 5, 0, 0.5),    # A4
    (13, 2, 3, 0, 1.0),      # F4
    (13, 3, 1, 0, 1.0),      # D4
    (14, 0, 4, 0, 1.5),      # G4
    (14, 1.5, 3, 0, 0.5),    # F4
    (14, 2, 5, 0, 1.0),      # A4
    (14, 3, 4, 0, 1.0),      # G4
    (15, 0, 1, 0, 4.0),      # D4 长（解决）
]
for bar, beat, deg, octv, dur in HORN_MELODY:
    horn.note(bar * BPB + beat, D(deg, octv), dur * 0.94, 82)

# ============================================================ 铜管副旋律（brass_section, pan 70）
# 在 B 段和 A'' 段进入，叠厚圆号
brass = p.track("brass", mg.GM["brass_section"], pan=70, volume=92)
BRASS_HARMONY = [
    # B 句（bar 8-11）：跟圆号做下方三度
    (8, 0, 1, 0, 1.5),       # D4
    (8, 1.5, 3, 0, 0.5),     # F4
    (8, 2, 5, 0, 1.0),       # A4
    (8, 3, 4, 0, 1.0),       # G4
    (9, 0, 3, 0, 1.5),       # F4
    (9, 1.5, 1, 0, 0.5),     # D4
    (9, 2, 4, 0, 2.0),       # G4
    (10, 0, 5, 0, 1.0),      # A4
    (10, 1, 4, 0, 1.0),      # G4
    (10, 2, 3, 0, 2.0),      # F4
    (11, 0, 1, 0, 4.0),      # D4
    # A'' 句（bar 12-15）：再叠一次
    (12, 0, 5, 0, 1.5),      # A4
    (12, 1.5, 4, 0, 0.5),    # G4
    (12, 2, 3, 0, 2.0),      # F4
    (13, 0, 1, 0, 1.5),      # D4
    (13, 1.5, 5, -1, 0.5),   # A3
    (13, 2, 3, -1, 1.0),     # F3
    (13, 3, 1, -1, 1.0),     # D3
    (14, 0, 4, -1, 1.5),     # G3
    (14, 1.5, 3, -1, 0.5),   # F3
    (14, 2, 5, -1, 1.0),     # A3
    (14, 3, 4, -1, 1.0),     # G3
    (15, 0, 1, -1, 4.0),     # D3 长
]
for bar, beat, deg, octv, dur in BRASS_HARMONY:
    brass.note(bar * BPB + beat, D(deg, octv), dur * 0.94, 78)

# ============================================================ 长笛装饰（flute, pan 40）
# 在 A' 段后期和 B 段加入高音装饰，像远处的回声
flute = p.track("flute", mg.GM["flute"], pan=40, volume=82)
FLUTE = [
    # bar 6-7：短装饰
    (6, 2, 1, 2, 0.5),       # D6
    (6, 2.5, 3, 2, 0.5),     # F6
    (7, 0, 5, 2, 1.5),       # A6
    (7, 1.5, 4, 2, 0.5),     # G6
    # B 句：跟随圆号高八度
    (8, 0, 1, 2, 1.5),       # D6
    (8, 1.5, 3, 2, 0.5),     # F6
    (8, 2, 5, 2, 1.0),       # A6
    (8, 3, 4, 2, 1.0),       # G6
    (9, 0, 3, 2, 1.5),       # F6
    (9, 1.5, 1, 2, 0.5),     # D6
    (9, 2, 4, 2, 2.0),       # G6
    (10, 0, 5, 2, 1.0),      # A6
    (10, 1, 4, 2, 1.0),      # G6
    (10, 2, 3, 2, 2.0),      # F6
    # A'' 段
    (12, 2, 3, 2, 2.0),      # F6
    (13, 0, 1, 2, 1.5),      # D6
    (13, 1.5, 5, 1, 0.5),    # A5
    (13, 2, 3, 1, 1.0),      # F5
    (13, 3, 1, 1, 1.0),      # D5
    (14, 2, 5, 1, 1.0),      # A5
    (14, 3, 4, 1, 1.0),      # G5
]
for bar, beat, deg, octv, dur in FLUTE:
    flute.note(bar * BPB + beat, D(deg, octv), dur * 0.9, 72)

# ============================================================ 鼓组（drums, ch 9, pan 64）
drums = p.track("drums", 0, drums=True, pan=64, volume=88)

# 底鼓：1、3 拍强调（B 段加重）
KICK_PATTERN_FULL = [0, 2]                 # A 段、A' 段、A'' 段
KICK_PATTERN_HEAVY = [0, 1.5, 2, 3]       # B 段

# Hi-hat：八分音符走底纹（节拍器感）
# 实际节奏：1+ 2+ 3+ 4+ = 8 个 8 分

def write_bar_drums(bar, kick_beats, hat_open=False):
    base = bar * BPB
    # 底鼓
    for b in kick_beats:
        drums.note(base + b, mg.DRUMS["kick"], 0.5, 95)
    # Hi-hat 8 分
    for i in range(8):
        b = i * 0.5
        if hat_open and i in (3, 7):
            drums.note(base + b, mg.DRUMS["hh_open"], 0.5, 65)
        else:
            drums.note(base + b, mg.DRUMS["hh_closed"], 0.25, 55)
    # 军鼓：2、4 拍
    for b in (1, 3):
        drums.note(base + b, mg.DRUMS["snare"], 0.5, 80)

# A 段：bar 0-3 —— 沉稳
for bar in (0, 1, 2, 3):
    write_bar_drums(bar, KICK_PATTERN_FULL, hat_open=False)

# A' 段：bar 4-7 —— 加入开镲
for bar in (4, 5, 6, 7):
    write_bar_drums(bar, KICK_PATTERN_FULL, hat_open=(bar >= 5))

# B 段：bar 8-11 —— 加重 + 开镲
for bar in (8, 9, 10, 11):
    write_bar_drums(bar, KICK_PATTERN_HEAVY, hat_open=True)
    # B 段第 1 拍加重音镲
    if bar == 8:
        drums.note(bar * BPB, mg.DRUMS["crash"], 2.0, 95)
    if bar == 11:
        drums.note(bar * BPB + 3, mg.DRUMS["crash"], 1.0, 80)

# A'' 段：bar 12-15 —— 回到沉稳，但末尾用强音镲
for bar in (12, 13, 14):
    write_bar_drums(bar, KICK_PATTERN_FULL, hat_open=False)
# bar 15：收束
write_bar_drums(15, KICK_PATTERN_FULL, hat_open=False)
drums.note(15 * BPB + 3, mg.DRUMS["crash"], 1.0, 85)

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | scale={SCALE} tonic={TONIC} bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
