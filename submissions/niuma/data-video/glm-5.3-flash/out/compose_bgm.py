# -*- coding: utf-8 -*-
"""牛马咖啡 2026Q3 经营快报 BGM 作曲脚本
128 BPM × 16 小节 = 30.000s，与 30fps×900 帧成片精确对齐。
曲式: intro(0-1) groove(2-3) hookA(4-7) hookB(8-11) build(12) climax(13) ending(14-15)
和声: Am F C G 循环 (A 自然小调)。运行前需设置环境变量 LIBDIR 和 OUT_MID。
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

BPM = 128
BARS = 16
BPB = 4                      # beats per bar
TOTAL_BEATS = BARS * BPB     # 64

SCALE = [0, 2, 3, 5, 7, 8, 10]                 # A 自然小调
TONIC = mg.note_to_midi("A3")                  # 57

def deg(d, octave=0):
    return mg.deg(SCALE, TONIC, d, octave)

def chord(d, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, d, size=size, octave=octave)

# 每小节和弦级数: Am(1) F(6) C(3) G(7)
PROG = [1, 1, 6, 6, 3, 3, 7, 7, 1, 1, 6, 6, 7, 1, 1, 1]
# 低音根音 (A2/F2/C3/G2, 再由 track 降八度处理)
ROOT = {1: 45, 6: 41, 3: 48, 7: 43}

p = mg.Piece(bpm=BPM, bars=BARS)

drums = p.track("drums", 0, volume=110, drums=True)
bass  = p.track("bass", mg.GM["synth_bass"], pan=64, volume=105)
lead  = p.track("lead", mg.GM["saw_lead"], pan=76, volume=100)
stabL = p.track("stabL", mg.GM["synth_brass"], pan=30, volume=68)
stabR = p.track("stabR", mg.GM["synth_brass"], pan=98, volume=68)
padL  = p.track("padL", mg.GM["warm_pad"], pan=15, volume=52)
padR  = p.track("padR", mg.GM["warm_pad"], pan=112, volume=52)
spark = p.track("spark", mg.GM["glockenspiel"], pan=88, volume=60)

# ---------------------------------------------------------------- 鼓组
for bar in range(BARS):
    b0 = bar * BPB
    last = bar >= 14
    # 底鼓四四拍; 结尾两小节只在 bar14 第0拍收一记
    if not last:
        for k in range(4):
            drums.note(b0 + k, mg.DRUMS["kick"], 0.4, 118 if k == 0 else 102)
    # 军鼓 2、4 拍 (bar 2-11); bar12-13 为 build 滚奏
    if 2 <= bar <= 11:
        drums.note(b0 + 1, mg.DRUMS["snare"], 0.4, 96)
        drums.note(b0 + 3, mg.DRUMS["clap"], 0.4, 92)
    # 闭镲反拍
    if bar <= 13:
        for e in range(4):
            drums.note(b0 + e + 0.5, mg.DRUMS["hh_closed"], 0.2, 58)
    # 开镲: bar 3/7/11 第4拍
    if bar in (3, 7, 11):
        drums.note(b0 + 3.5, mg.DRUMS["hh_open"], 0.4, 72)
    # crash: bar 0/2/4/8/13/14 落点
    if bar in (0, 2, 4, 8, 13, 14):
        drums.note(b0, mg.DRUMS["crash"], 2.0, 90)

# bar 12-13: 军鼓 16 分滚奏渐强, 推向高潮
for i in range(16):
    vel = 42 + int(60 * i / 15)
    drums.note(12 * BPB + i * 0.25, mg.DRUMS["snare"], 0.15, vel)
for i in range(4):  # bar13 首拍四连击后进入高潮
    drums.note(13 * BPB + i * 0.5, mg.DRUMS["snare"], 0.2, 104)
drums.note(14 * BPB, mg.DRUMS["kick"], 0.5, 120)

# ---------------------------------------------------------------- 贝斯
# 8 分音符泵动: 根音低八度, 反拍高八度跳音; bar 0-1 intro 只留半拍点
BASS_PAT = [(0.0, 0, 0.48), (0.5, 1, 0.45), (1.0, 0, 0.45), (1.5, 1, 0.45),
            (2.0, 0, 0.45), (2.5, 1, 0.45), (3.0, 0, 0.45), (3.5, 1, 0.45)]
for bar in range(2, BARS):
    root = ROOT[PROG[bar]]
    b0 = bar * BPB
    if bar == 14:
        bass.note(b0, root - 12, 3.9, 108)          # 结尾长音
        continue
    for (off, oc, dur) in BASS_PAT:
        vel = 100 if off % 1 == 0 else 86
        bass.note(b0 + off, root + 12 * oc, dur, vel)

# ---------------------------------------------------------------- Pad
# 每 2 小节一次和弦长音 (最后一组 4 小节)
pad_spans = [(0, 2), (2, 2), (4, 2), (6, 2), (8, 2), (10, 2), (12, 1), (13, 1), (14, 2)]
for (bar, span) in pad_spans:
    ch = chord(PROG[bar], octave=1)                 # 中音区
    b0 = bar * BPB
    dur = span * BPB * 0.98
    padL.chord(b0, [n - 12 for n in ch], dur, vel=50)
    padR.chord(b0, [n for n in ch], dur, vel=50)

# ---------------------------------------------------------------- 和弦 stab
# 反拍短刺 (bar 4-12), 左右交替
for bar in range(4, 13):
    ch = chord(PROG[bar], octave=0)
    b0 = bar * BPB
    for off in (0.5, 2.5):
        (stabL if bar % 2 == 0 else stabR).chord(b0 + off, ch, 0.35, vel=76)

# ---------------------------------------------------------------- 主旋律
# (bar, beat, degree, octave, dur_beats, vel)
HOOK = [
    # hookA · bars 4-7 (Am F)
    (4, 0.0, 5, 1, 0.75, 100), (4, 1.0, 5, 1, 0.5, 92), (4, 1.5, 6, 1, 0.5, 88),
    (4, 2.0, 7, 1, 1.0, 96), (4, 3.0, 5, 1, 1.0, 90),
    (5, 0.0, 3, 1, 0.5, 92), (5, 0.5, 4, 1, 0.5, 86), (5, 1.0, 3, 1, 1.0, 94),
    (5, 2.0, 1, 1, 1.5, 100),
    (6, 0.0, 6, 1, 0.75, 100), (6, 1.0, 6, 1, 0.5, 92), (6, 1.5, 7, 1, 0.5, 88),
    (6, 2.0, 1, 2, 1.0, 96), (6, 3.0, 6, 1, 1.0, 90),
    (7, 0.0, 4, 1, 0.5, 92), (7, 0.5, 3, 1, 0.5, 86), (7, 1.0, 1, 1, 1.0, 94),
    (7, 2.0, 6, 0, 1.5, 96),
    # hookB · bars 8-11 (C G) 音区抬高
    (8, 0.0, 3, 1, 0.75, 100), (8, 1.0, 5, 1, 0.5, 92), (8, 1.5, 3, 1, 0.5, 88),
    (8, 2.0, 1, 2, 1.0, 98), (8, 3.0, 5, 1, 1.0, 90),
    (9, 0.0, 6, 1, 0.5, 92), (9, 0.5, 7, 1, 0.5, 86), (9, 1.0, 1, 2, 1.0, 96),
    (9, 2.0, 3, 2, 1.5, 100),
    (10, 0.0, 4, 1, 0.75, 102), (10, 1.0, 2, 1, 0.5, 92), (10, 1.5, 4, 1, 0.5, 88),
    (10, 2.0, 7, 1, 1.0, 98), (10, 3.0, 4, 1, 1.0, 90),
    (11, 0.0, 5, 1, 0.5, 92), (11, 0.5, 4, 1, 0.5, 86), (11, 1.0, 2, 1, 1.0, 94),
    (11, 2.0, 7, 0, 1.5, 96),
    # bar12 build: 简单上行音阶爬升
    (12, 0.0, 1, 1, 0.5, 88), (12, 0.5, 2, 1, 0.5, 90), (12, 1.0, 3, 1, 0.5, 92),
    (12, 1.5, 4, 1, 0.5, 94), (12, 2.0, 5, 1, 0.5, 96), (12, 2.5, 6, 1, 0.5, 98),
    (12, 3.0, 7, 1, 0.5, 100), (12, 3.5, 1, 2, 0.5, 102),
    # bar13 climax: 高八度主题重奏
    (13, 0.0, 1, 2, 0.75, 112), (13, 1.0, 1, 2, 0.5, 104), (13, 1.5, 2, 2, 0.5, 100),
    (13, 2.0, 3, 2, 1.0, 110), (13, 3.0, 1, 2, 1.0, 104),
    # bar14-15 ending: 主音长音收束
    (14, 0.0, 1, 2, 7.8, 116),
]
for (bar, beat, d, o, dur, vel) in HOOK:
    lead.note(bar * BPB + beat, deg(d, o), dur * 0.95, vel)

# 高潮段叠加低八度增厚 (bar 13-14)
for (bar, beat, d, o, dur, vel) in HOOK:
    if bar in (13, 14):
        lead.note(bar * BPB + beat, deg(d, o - 1), dur * 0.95, vel - 22)

# intro 亮点: bar 1 glockenspiel 琶音
for i, d in enumerate([1, 3, 5, 1]):
    spark.note(BPB + i * 0.5, deg(d, 2), 0.4, 76)

# bar 14 落点 stab 和弦(结束重音)
fin = chord(1, size=3, octave=0)
stabL.chord(14 * BPB, fin, 3.9, vel=92)
stabR.chord(14 * BPB, [n + 12 for n in fin], 3.9, vel=88)

OUT = os.environ["OUT_MID"]
p.save(OUT)
print(f"OK {OUT} | bpm={BPM} bars={BARS} loop={p.loop_seconds:.3f}s")

# ---------------------------------------------------------------- beats.json
import json
beats = []
for i in range(TOTAL_BEATS):
    beats.append({
        "t": round(i * 60.0 / BPM, 5),
        "beat": i,
        "bar": i // 4 + 1,
        "downbeat": i % 4 == 0,
    })
meta = {
    "bpm": BPM,
    "bars": BARS,
    "beats_per_bar": BPB,
    "duration": round(TOTAL_BEATS * 60.0 / BPM, 4),
    "beats": beats,
}
OUTJ = os.environ.get("OUT_BEATS", os.path.join(os.path.dirname(OUT), "beats.json"))
with open(OUTJ, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=1)
print(f"OK {OUTJ} | {TOTAL_BEATS} beats, duration {meta['duration']}s")
