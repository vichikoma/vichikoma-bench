#!/usr/bin/env python
# compose_track01.py — 《夜港灯市》16 小节无缝循环 BGM
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

SCALE = [0, 2, 4, 5, 7, 9, 11]          # D 大调
TONIC = mg.note_to_midi('D4')
BPM = 96                                # 16 小节 × 4 拍 = 40.0 s
BARS = 16
PROG = [1, 6, 4, 5,                     # I  vi  IV  V
        3, 6, 2, 5,                     # iii vi  ii  V
        1, 6, 4, 3,                     # I  vi  IV  iii
        2, 5, 1, 5]                     # ii V   I   V(回环)
OUT = os.environ.get("OUT_MID", "track01.mid")


def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)


def C(degree, size=4, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


def N(name):
    return mg.note_to_midi(name)


p = mg.Piece(bpm=BPM, bars=BARS)
BPB = 4

# ---------------- 和声托底：慢弦乐 + 极轻暖垫 ----------------
pad = p.track("slow_strings", mg.GM['strings_slow'], pan=64, volume=52)
warm = p.track("warm_pad", mg.GM['warm_pad'], pan=64, volume=30)
for bar in range(BARS):
    st = bar * BPB
    vo = C(PROG[bar], size=4, octave=-1)          # D3 附近，避免低频泥泞
    pad.chord(st, vo, 4.0, vel=46, spread=0.025)
    warm.chord(st, [vo[0] - 12, vo[1]], 4.0, vel=24, spread=0.0)  # 只留根/三度，托住夜色

# ---------------- 贝斯：让 80–250Hz 不空，但脚步很轻 ----------------
bass = p.track("acoustic_bass", mg.GM['acoustic_bass'], pan=64, volume=96)
for bar in range(BARS):
    st = bar * BPB
    root = D(PROG[bar], -2)                       # D2/B1/G1/A1 一带
    fifth = root + 7
    next_root = D(PROG[(bar + 1) % BARS], -2)
    # 1 拍落根，2 拍留白，3 拍五度，4 拍轻走到下一小节
    bass.note(st + 0.0, root, 1.65, 82)
    bass.note(st + 2.0, fifth, 0.95, 62)
    if bar in (3, 7, 11, 15):
        bass.note(st + 3.0, root, 0.9, 56)       # 转折处收敛，给旋律让位
    else:
        approach = next_root - 1 if next_root > root else next_root + 2
        bass.note(st + 3.0, root, 0.45, 58)
        bass.note(st + 3.5, approach, 0.45, 52)

# ---------------- 双吉他分解和弦：左右拉开，像水面两排灯 ----------------
gtr_l = p.track("nylon_left", mg.GM['nylon_guitar'], pan=10, volume=72)
gtr_r = p.track("steel_right", mg.GM['steel_guitar'], pan=118, volume=55)
arp_pat = [0, 2, 4, 3, 1, 2, 4, 2]
for bar in range(BARS):
    st = bar * BPB
    ch = C(PROG[bar], size=5, octave=-1)          # 根三五七九，D3–F#4 左右
    ch_hi = [x + 12 for x in ch]
    for e in range(8):
        t = st + e * 0.5
        idx = arp_pat[e]
        v = 70 if e in (0, 4) else 56
        gtr_l.note(t, ch[idx], 0.42, v)
        # 右手高八度、错位半拍，做宽度和“灯影晃动”
        if e in (1, 3, 5, 7):
            gtr_r.note(t + 0.02, ch_hi[arp_pat[(e + 1) % 8]], 0.34, v - 12)

# ---------------- 主旋律：长笛 —— 温暖、可哼唱、带一点夜色蓝调 ----------------
lead = p.track("flute_lead", mg.GM['flute'], pan=64, volume=98)
# (bar, beat, note, dur_beats, vel)
MELODY = [
    # A：灯市初见，平稳叙述
    (0, 0.0, 'A4', 1.5, 78), (0, 1.5, 'F#4', 0.5, 70), (0, 2.0, 'E4', 1.0, 72), (0, 3.0, 'D4', 1.0, 76),
    (1, 0.0, 'D4', 1.0, 72), (1, 1.0, 'B3', 1.0, 66), (1, 2.0, 'C#4', 1.0, 70), (1, 3.0, 'D4', 1.0, 76),
    (2, 0.0, 'B3', 1.5, 70), (2, 1.5, 'D4', 0.5, 68), (2, 2.0, 'G4', 1.0, 78), (2, 3.0, 'F#4', 1.0, 74),
    (3, 0.0, 'E4', 1.0, 72), (3, 1.0, 'F#4', 0.5, 70), (3, 1.5, 'G4', 0.5, 72), (3, 2.0, 'A4', 2.0, 84),
    # A'：情绪往前一步，最高点到 B4/C#5
    (4, 0.0, 'C#5', 1.5, 84), (4, 1.5, 'A4', 0.5, 74), (4, 2.0, 'F#4', 2.0, 78),
    (5, 0.0, 'B4', 1.0, 82), (5, 1.0, 'A4', 0.5, 76), (5, 1.5, 'F#4', 0.5, 72), (5, 2.0, 'D4', 2.0, 76),
    (6, 0.0, 'E4', 1.0, 70), (6, 1.0, 'G4', 1.0, 76), (6, 2.0, 'B4', 2.0, 84),
    (7, 0.0, 'A4', 0.5, 80), (7, 0.5, 'G4', 0.5, 74), (7, 1.0, 'F#4', 0.5, 72), (7, 1.5, 'E4', 0.5, 70), (7, 2.0, 'D4', 2.0, 78),
    # B：灯更亮，人更近；旋律抬高一个呼吸
    (8, 0.0, 'F#5', 1.0, 86), (8, 1.0, 'E5', 0.5, 78), (8, 1.5, 'D5', 0.5, 76), (8, 2.0, 'A4', 2.0, 82),
    (9, 0.0, 'B4', 1.0, 80), (9, 1.0, 'D5', 1.0, 84), (9, 2.0, 'C#5', 2.0, 82),
    (10, 0.0, 'B4', 1.5, 80), (10, 1.5, 'D5', 0.5, 78), (10, 2.0, 'G5', 2.0, 90),
    (11, 0.0, 'A5', 1.0, 92), (11, 1.0, 'F#5', 0.5, 82), (11, 1.5, 'E5', 0.5, 80), (11, 2.0, 'C#5', 2.0, 82),
    (12, 0.0, 'E5', 1.0, 84), (12, 1.0, 'G5', 0.5, 86), (12, 1.5, 'F#5', 0.5, 82), (12, 2.0, 'E5', 2.0, 84),
    (13, 0.0, 'D5', 1.0, 82), (13, 1.0, 'C#5', 0.5, 78), (13, 1.5, 'B4', 0.5, 76), (13, 2.0, 'A4', 2.0, 80),
    # 回家，再把门轻轻留给循环（V → I）
    (14, 0.0, 'F#4', 0.5, 72), (14, 0.5, 'A4', 0.5, 76), (14, 1.0, 'D5', 1.5, 86), (14, 2.5, 'F#5', 1.5, 88),
    (15, 0.0, 'E5', 1.0, 82), (15, 1.0, 'D5', 0.5, 76), (15, 1.5, 'C#5', 0.5, 74), (15, 2.0, 'B4', 1.0, 74), (15, 3.0, 'A4', 1.0, 78),
]
for bar, beat, note, dur, vel in MELODY:
    lead.note(bar * BPB + beat, N(note), dur * 0.96, vel)

# ---------------- 八音盒碎光：只点几处，像远处灯笼映水 ----------------
box = p.track("music_box_sparkle", mg.GM['music_box'], pan=104, volume=50)
sparkles = [
    (2, 3.5, 'D6', 0.45, 52), (3, 2.5, 'A5', 0.4, 48),
    (6, 2.5, 'B5', 0.45, 52), (7, 0.0, 'A5', 0.35, 44),
    (10, 2.0, 'G6', 0.6, 56), (11, 0.0, 'A6', 0.4, 50),
    (14, 1.0, 'D6', 0.7, 56), (15, 3.5, 'E6', 0.35, 46),
]
for bar, beat, note, dur, vel in sparkles:
    box.note(bar * BPB + beat, N(note), dur, vel)

# ---------------- 人声气息：后半段轻轻托高情绪 ----------------
ooh = p.track("voice_oohs", mg.GM['voice_oohs'], pan=64, volume=34)
for bar in range(8, 16):
    st = bar * BPB
    vo = C(PROG[bar], size=4, octave=0)
    ooh.chord(st, vo[1:], 4.0, vel=30, spread=0.05)   # 去掉根音，避免和贝斯抢低频

# ---------------- 打击乐：夜市远处的脚步与杯盏，不抢戏 ----------------
dr = p.track("drums", mg.DRUMS['kick'], drums=True, pan=64, volume=84)
for bar in range(BARS):
    st = bar * BPB
    phrase_turn = bar in (3, 7, 11, 15)
    dr.note(st + 0.0, mg.DRUMS['kick'], 0.12, 48 if not phrase_turn else 42)
    if bar % 4 == 2:
        dr.note(st + 2.0, mg.DRUMS['kick'], 0.10, 36)
    dr.note(st + 1.0, mg.DRUMS['snare_rim'], 0.10, 54)
    dr.note(st + 3.0, mg.DRUMS['snare_rim'], 0.10, 50)
    for e in range(8):
        t = st + e * 0.5
        v = 40 if e in (0, 4) else 30
        if phrase_turn and e == 7:
            continue
        dr.note(t, mg.DRUMS['hh_closed'], 0.08, v)
    dr.note(st + 0.0, mg.DRUMS['ride'], 0.7, 30 if bar < 8 else 34)
    if phrase_turn:
        dr.note(st + 3.5, mg.DRUMS['tambourine'], 0.12, 44)
        dr.note(st + 3.75, mg.DRUMS['shaker'], 0.10, 30)

p.save(OUT)
print(f"OK {OUT} | D major | bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
