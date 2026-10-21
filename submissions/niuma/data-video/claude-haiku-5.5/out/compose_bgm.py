#!/usr/bin/env python
"""原创 BGM：牛马咖啡 Q3 数据短片。A 小调，120 BPM，4/4，15 小节 = 30.0 秒。
输出：out/bgm.mid（MIDI）、out/beats.json（每一拍时间点，标出小节首拍）。
作曲与配器均为原创，只用 music-gen 的 musiclib 生成。
"""
import os, sys, json
LIBDIR = os.environ["LIBDIR"]
sys.path.insert(0, LIBDIR)
import musiclib as mg  # noqa

OUT_DIR = os.environ.get("OUT_DIR", "out")
os.makedirs(OUT_DIR, exist_ok=True)

# A natural minor, tonic A3
SCALE = [0, 2, 3, 5, 7, 8, 10]
TONIC = mg.note_to_midi('A3')
BPM = 120
BARS = 15
BPB = 4
# 每小节的和弦级数（索引 0 起）：
# 0-1 intro: Am F；2-5: Am F C G（动机A）；6-9: Am F C G（动机A）；10-13: Am F C G（动机B 高八度）；14: Am 收束
PROG = [1, 6,  1, 6, 3, 7,  1, 6, 3, 7,  1, 6, 3, 7,  1]

def D(d, o=0):
    return mg.deg(SCALE, TONIC, d, o)

def C(d, size=3, o=0):
    return mg.chord_of(SCALE, TONIC, d, size=size, octave=o)

p = mg.Piece(bpm=BPM, bars=BARS)

# ---- 鼓：分段编排（intro 轻 / 中段满 / 高潮 / 收束）
drums = p.track("drums", 0, drums=True, volume=110)
K, S, HC, HO, CR, CL = mg.DRUMS['kick'], mg.DRUMS['snare'], mg.DRUMS['hh_closed'], mg.DRUMS['hh_open'], mg.DRUMS['crash'], mg.DRUMS['clap']
for bar in range(BARS):
    b0 = bar * BPB
    if bar < 2:  # intro：只有踢鼓 + 闭镲
        for k in range(8):
            drums.note(b0 + k * 0.5, HC, 0.2, 40 + (k % 2) * 12)
        drums.note(b0, K, 0.25, 95)
        drums.note(b0 + 2, K, 0.25, 95)
        continue
    # 满编
    for k in range(8):
        drums.note(b0 + k * 0.5, HC, 0.2, 58 if k % 2 == 0 else 82)
    drums.note(b0, K, 0.25, 118)
    drums.note(b0 + 2, K, 0.25, 112)
    drums.note(b0 + 3.5, K, 0.25, 90)
    drums.note(b0 + 1, S, 0.25, 110)
    drums.note(b0 + 3, S, 0.25, 110)
    drums.note(b0 + 1, CL, 0.25, 70)
    drums.note(b0 + 3, CL, 0.25, 66)
    if bar in (2, 8, 14):  # 段落起点：crash
        drums.note(b0, CR, 1.0, 110)
    if bar == 14:  # 收束：开放镲
        drums.note(b0 + 1, HO, 3.0, 100)

# ---- 贝斯：八分音根音律动
bass = p.track("bass", mg.GM['finger_bass'], pan=60, volume=104)
for bar in range(BARS):
    b0 = bar * BPB
    root = D(PROG[bar], -1)
    fifth = D(PROG[bar] + 4, -1) if PROG[bar] + 4 <= 7 else D(PROG[bar] - 3, -1)
    if bar < 2:
        bass.note(b0, root, 4, 80)
        continue
    for k in range(8):
        pitch = root if k % 4 != 3 else (root + 12 if bar % 2 else fifth)
        bass.note(b0 + k * 0.5, pitch, 0.4, 100 if k % 2 == 0 else 84)
    if bar == 14:
        bass.note(b0, root, 4, 96)

# ---- 合成器和弦：咖啡豆“咔哒”式点刺 + 长音铺底
pad = p.track("pad", mg.GM['strings'], pan=40, volume=70)
for bar in range(BARS):
    b0 = bar * BPB
    for pitch in C(PROG[bar], 3, 0):
        pad.note(b0, pitch, 4, 62 if bar < 2 else 72)

# ---- 铜管：节拍“插话”（stab）
brass = p.track("brass", mg.GM['brass_section'], pan=72, volume=96)
for bar in range(2, BARS):
    b0 = bar * BPB
    chord = C(PROG[bar], 3, 0)
    if bar in (14,):
        brass.chord(b0, chord, 4, vel=112)
        continue
    for beat in (0.0, 2.5):
        brass.chord(b0 + beat, chord, 0.45, vel=100 if beat == 0 else 84)
    if bar % 4 == 2:
        brass.chord(b0 + 3.5, chord, 0.4, vel=84)

# ---- 闪亮拨弦（glockenspiel）：intro 八分音阶琶音 -> 中段点缀
bell = p.track("bell", mg.GM['glockenspiel'], pan=100, volume=92)
for bar in range(BARS):
    b0 = bar * BPB
    if bar < 2:
        arp = [D(1, 2), D(3, 2), D(5, 2), D(8, 2)]
        for k, pitch in enumerate(arp * 2):
            bell.note(b0 + k * 0.5, pitch, 0.4, 84 if bar == 0 else 92)
    elif bar in (3, 4, 9, 10):
        for k, pitch in enumerate([D(5, 2), D(3, 2), D(5, 2), D(7, 2)]):
            bell.note(b0 + 1 + k * 0.5, pitch, 0.3, 80)

# ---- 主旋律（square_lead）：A 小调“钩子”动机，两小节一句
lead = p.track("lead", mg.GM['square_lead'], pan=64, volume=96)
# (小节内拍, 音阶级数, 八度, 时值)
MOTIF_A = [  # 对应 Am
    [(0, 1, 1, 1), (1, 3, 1, 0.5), (1.5, 5, 1, 0.5), (2, 4, 1, 1), (3, 3, 1, 1)],
    # F
    [(0, 5, 1, 1), (1, 6, 1, 1), (2, 7, 1, 0.5), (2.5, 6, 1, 0.5), (3, 5, 1, 1)],
    # C
    [(0, 3, 1, 1), (1, 5, 1, 1), (2, 3, 1, 1), (3, 2, 1, 1)],
    # G
    [(0, 2, 1, 1), (1, 1, 1, 0.5), (1.5, 2, 1, 0.5), (2, 7, 1, 2)],
]
MOTIF_B = [  # 高潮段：同动机高八度
    [(0, 1, 2, 1), (1, 3, 2, 0.5), (1.5, 5, 2, 0.5), (2, 4, 2, 1), (3, 3, 2, 1)],
    [(0, 5, 2, 1), (1, 6, 2, 1), (2, 7, 2, 0.5), (2.5, 6, 2, 0.5), (3, 5, 2, 1)],
    [(0, 3, 2, 1), (1, 5, 2, 1), (2, 3, 2, 1), (3, 2, 2, 1)],
    [(0, 2, 2, 1), (1, 1, 2, 0.5), (1.5, 2, 2, 0.5), (2, 7, 2, 2)],
]
def play(bar_start, motif, chords_idx_list):
    for j, phrase in enumerate(motif):
        bar = bar_start + j
        b0 = bar * BPB
        for beat, dg, oc, dur in phrase:
            lead.note(b0 + beat, D(dg, oc), dur * 0.92, 92)
play(2, MOTIF_A, None)      # index 2..5 (Am F C G)
play(6, MOTIF_A, None)      # index 6..9 (Am F C G)
play(10, MOTIF_B, None)     # index 10..13 (Am F C G) 高潮，高八度
# 末小节：主音长音收束
lead.note(14 * BPB, D(1, 1), 4, 100)

p.save(os.path.join(OUT_DIR, "bgm.mid"))

# ---- 拍点表
beats = []
total_beats = BARS * BPB
for b in range(total_beats + 1):
    t = round(b * 60.0 / BPM, 4)
    beats.append({"beat": b, "t": t, "bar": b // BPB + 1, "downbeat": b % BPB == 0})
json.dump({"bpm": BPM, "beatsPerBar": BPB, "bars": BARS, "duration": round(BARS * BPB * 60.0 / BPM, 3),
           "beats": beats}, open(os.path.join(OUT_DIR, "beats.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("OK bpm", BPM, "bars", BARS, "loop", p.loop_seconds)
