#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
compose_bgm.py —— 牛马咖啡 2026Q3 数据短片 BGM 生成脚本
BPM 120 · 4/4 · 15 小节 = 30.0s，与成片时长严格一致（1 拍 = 0.5s = 15 帧 @30fps）。

产出：
  OUT_MID   -> out/bgm.mid
  OUT_BEATS -> out/beats.json   （每一拍时间点，标注每小节第一拍）

风格：热血电子摇滚（synth bass 驱动 + offbeat 和弦 stab + saw lead 旋律），
曲式与分镜一一对应：
  小节 1     (0.0–2.0s)  Intro hit          开场封面
  小节 2–5   (2.0–10.0s) A 段（大盘）
  小节 6–9   (10.0–18.0s) B 段（轻食高潮，旋律八度上移）
  小节 10–12 (18.0–24.0s) C 段（渠道结构）
  小节 13–14 (24.0–28.0s) D 段（毛利率，鼓组滚奏推进）
  小节 15    (28.0–30.0s) 收束大 hit + 余响淡出
"""
import os, sys, json

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

OUT_MID = os.environ.get("OUT_MID", "piece.mid")
OUT_BEATS = os.environ.get("OUT_BEATS", "beats.json")

BPM = 120
BARS = 15
BPB = 4
SEC_PER_BEAT = 60.0 / BPM          # 0.5s
TOTAL_BEATS = BARS * BPB           # 60

# ============================================================ 音高工具
N = mg.note_to_midi               # 'E4' -> 64

CHORDS = {                         # 每小节的和弦（绝对 MIDI，便于大三和弦）
    0: ("Em", [N('E3'), N('G3'), N('B3')], N('E2')),
    1: ("Em", [N('E3'), N('G3'), N('B3')], N('E2')),
    2: ("C",  [N('C3'), N('E3'), N('G3')], N('C2')),
    3: ("G",  [N('G3'), N('B3'), N('D4')], N('G2')),
    4: ("D",  [N('D3'), N('F#3'), N('A3')], N('D2')),
    5: ("Em", [N('E3'), N('G3'), N('B3')], N('E2')),
    6: ("C",  [N('C3'), N('E3'), N('G3')], N('C2')),
    7: ("G",  [N('G3'), N('B3'), N('D4')], N('G2')),
    8: ("D",  [N('D3'), N('F#3'), N('A3')], N('D2')),
    9: ("Em", [N('E3'), N('G3'), N('B3')], N('E2')),
    10: ("C", [N('C3'), N('E3'), N('G3')], N('C2')),
    11: ("G", [N('G3'), N('B3'), N('D4')], N('G2')),
    12: ("C", [N('C3'), N('E3'), N('G3')], N('C2')),
    13: ("D", [N('D3'), N('F#3'), N('A3')], N('D2')),
    14: ("Em", [N('E3'), N('G3'), N('B3')], N('E2')),
}

p = mg.Piece(bpm=BPM, bars=BARS)

# ============================================================ 声部
drums = p.track("drums", mg.GM['synth_bass'], pan=64, volume=104, drums=True)
bass = p.track("bass", mg.GM['synth_bass'], pan=64, volume=102)
chords = p.track("chords", mg.GM['synth_brass'], pan=112, volume=86)
pad = p.track("pad", mg.GM['warm_pad'], pan=18, volume=58)
arp = p.track("arp", mg.GM['glockenspiel'], pan=118, volume=74)
lead = p.track("lead", mg.GM['saw_lead'], pan=64, volume=108)

KICK, SNARE, CLAP, HAT, OHAT, CRASH, RIDE, TOM_H, TOM_L = 36, 38, 39, 42, 46, 49, 51, 48, 45

# ---------------------------------------------------------- 鼓组
# Intro (bar 0)
drums.note(0, CRASH, 2, 118)
drums.note(0, KICK, 1, 122)
drums.note(1, KICK, 0.5, 108)
drums.note(2, KICK, 0.5, 112)
drums.note(3, SNARE, 0.25, 96)
drums.note(3.25, SNARE, 0.25, 104)
drums.note(3.5, SNARE, 0.25, 112)
drums.note(3.75, SNARE, 0.25, 122)
for b in (2, 2.5, 3):
    drums.note(b, HAT, 0.25, 84)

# 常规段落 A/B/C (bars 1-11)：four-on-floor + 2/4 拍手 + 八分 offbeat 踩镲
for bar in range(1, 12):
    s = bar * BPB
    for beat in range(4):
        drums.note(s + beat, KICK, 0.5, 120 if beat == 0 else 112)
        drums.note(s + beat + 0.5, HAT, 0.25, 88)
        drums.note(s + beat, HAT, 0.25, 70)
    drums.note(s + 1, CLAP, 0.5, 112)
    drums.note(s + 3, CLAP, 0.5, 112)
    drums.note(s + 3.5, OHAT, 0.4, 96)
    if bar % 4 == 0:                       # 每 4 小节小过门
        drums.note(s + 3.25, TOM_H, 0.25, 96)
        drums.note(s + 3.75, TOM_L, 0.25, 104)
    if bar in (5, 9):
        drums.note(s, CRASH, 2, 116)

# B 段高潮 (bars 5-8) 加 ride
for bar in range(5, 9):
    s = bar * BPB
    for b8 in range(8):
        drums.note(s + b8 * 0.5, RIDE, 0.25, 76 if b8 % 2 else 88)

# D 段 (bars 12-13)：bar13 十六分军鼓滚奏推进
for bar in (12, 13):
    s = bar * BPB
    for beat in range(4):
        drums.note(s + beat, KICK, 0.5, 118)
        drums.note(s + beat, HAT, 0.25, 74)
        drums.note(s + beat + 0.5, HAT, 0.25, 90)
    drums.note(s + 1, CLAP, 0.5, 110)
    drums.note(s + 3, CLAP, 0.5, 110)
for i in range(8):                          # bar13 后半拍滚奏
    t = 13 * BPB + 2 + i * 0.25
    drums.note(t, SNARE, 0.22, 84 + i * 5)
drums.note(13 * BPB + 2, OHAT, 1.9, 100)

# 收束 (bar 14)
drums.note(56, CRASH, 2.5, 127)
drums.note(56, KICK, 1, 127)
drums.note(56, SNARE, 1, 122)
drums.note(57, KICK, 1, 100)

# ---------------------------------------------------------- 贝斯
for bar in range(0, 14):
    s = bar * BPB
    root = CHORDS[bar][2]
    if bar == 0:
        bass.note(0, root, 2, 118)
        bass.note(2, root, 0.5, 106)
        bass.note(2.5, root, 0.5, 106)
        bass.note(3, root, 0.5, 112)
        bass.note(3.5, root + 12, 0.5, 112)
        continue
    if bar in (12, 13):
        for i in range(8):
            bass.note(s + i * 0.5, root, 0.45, 112 if i % 2 == 0 else 100)
        continue
    # A/B/C：八分驱动，第 2 拍后半 & 第 4 拍后半跳八度/五度
    for i in range(8):
        t = s + i * 0.5
        dur = 0.45
        vel = 116 if i % 2 == 0 else 102
        pitch = root
        if i == 3:
            pitch = root + 12
        elif i == 7:
            pitch = root + 7
        bass.note(t, pitch, dur, vel)
bass.note(56, N('E2'), 3, 122)              # 收束长音

# ---------------------------------------------------------- 和弦 stab
STAB_BEATS = [(0, 0.75), (1.5, 0.4), (2, 0.4), (2.5, 0.4), (3.5, 0.45)]
for bar in range(0, 14):
    s = bar * BPB
    notes = CHORDS[bar][1]
    if bar == 0:
        chords.chord(0, notes, 1.6, vel=112)
        continue
    for off, dur in STAB_BEATS:
        chords.chord(s + off, notes, dur, vel=100 if off == 0 else 88)
chords.chord(56, CHORDS[14][1], 3.2, vel=118)   # 收束

# ---------------------------------------------------------- 铺底 pad
for bar in range(0, 14):
    s = bar * BPB
    pad.chord(s, CHORDS[bar][1], 3.9, vel=72)
pad.chord(56, CHORDS[14][1], 4, vel=86)

# ---------------------------------------------------------- 星光琶音（B/C 段）
for bar in list(range(5, 12)):
    s = bar * BPB
    tones = [n + 12 for n in CHORDS[bar][1]] + [CHORDS[bar][1][0] + 24]
    for i in range(8):
        arp.note(s + i * 0.5, tones[i % 4] if i < 4 else tones[(7 - i) % 4], 0.45, 78)
for i in range(4):
    arp.note(52 + i, CHORDS[13][1][i % 3] + 12, 0.9, 82 + i * 6)
arp.note(56, N('E5'), 2.6, 104)
arp.note(56, N('B5'), 2.6, 96)

# ---------------------------------------------------------- 主旋律 lead
A_THEME = [
    (4, 'E4', 0.5), (4.5, 'G4', 0.5), (5, 'B4', 1), (6, 'A4', 0.5), (6.5, 'G4', 0.5), (7, 'E4', 1),
    (8, 'G4', 0.5), (8.5, 'E4', 0.5), (9, 'G4', 1), (10, 'C5', 1), (11, 'B4', 1),
    (12, 'D5', 0.5), (12.5, 'B4', 0.5), (13, 'D5', 1), (14, 'G4', 2),
    (16, 'A4', 0.5), (16.5, 'F#4', 0.5), (17, 'A4', 1), (18, 'B4', 1), (19, 'A4', 1),
]
B_THEME = [
    (20, 'B4', 1), (21, 'A4', 0.5), (21.5, 'G4', 0.5), (22, 'E4', 1.5), (23.5, 'G4', 0.5),
    (24, 'A4', 1), (25, 'G4', 0.5), (25.5, 'E4', 0.5), (26, 'G4', 1.5), (27.5, 'A4', 0.5),
    (28, 'B4', 1), (29, 'D5', 0.5), (29.5, 'B4', 0.5), (30, 'A4', 2),
    (32, 'A4', 1), (33, 'F#4', 0.5), (33.5, 'A4', 0.5), (34, 'B4', 1), (35, 'A4', 1),
]
C_THEME = [
    (36, 'E5', 0.5), (36.5, 'D5', 0.5), (37, 'B4', 1), (38, 'G4', 0.5), (38.5, 'A4', 0.5), (39, 'B4', 1),
    (40, 'C5', 0.5), (40.5, 'B4', 0.5), (41, 'G4', 1), (42, 'A4', 1), (43, 'G4', 1),
    (44, 'D5', 1), (45, 'B4', 0.5), (45.5, 'D5', 0.5), (46, 'E5', 2),
]
D_THEME = [
    (48, 'G4', 1), (49, 'A4', 1), (50, 'C5', 2),
    (52, 'A4', 0.5), (52.5, 'B4', 0.5), (53, 'D5', 1), (54, 'E5', 2),
]
for beat, name, dur in A_THEME:
    lead.note(beat, N(name), dur * 0.94, 96)
for beat, name, dur in B_THEME:
    lead.note(beat, N(name), dur * 0.94, 110)
for beat, name, dur in C_THEME:
    lead.note(beat, N(name), dur * 0.94, 108)
for beat, name, dur in D_THEME:
    lead.note(beat, N(name), dur * 0.94, 104)
lead.note(56, N('E5'), 3.2, 120)            # 收束长音

# ============================================================ 输出
p.save(OUT_MID)

beats = []
for i in range(TOTAL_BEATS):
    beats.append({
        "index": i,
        "timeSec": round(i * SEC_PER_BEAT, 3),
        "bar": i // BPB + 1,
        "beatInBar": i % BPB + 1,
        "downbeat": (i % BPB == 0),
    })
beats_doc = {
    "bpm": BPM,
    "beatsPerBar": BPB,
    "secondsPerBeat": SEC_PER_BEAT,
    "totalBeats": TOTAL_BEATS,
    "durationSec": TOTAL_BEATS * SEC_PER_BEAT,
    "note": "每拍 0.5s；downbeat=true 为每小节第一拍。成片切镜/换屏全部对齐 downbeat。",
    "beats": beats,
}
with open(OUT_BEATS, "w", encoding="utf-8") as f:
    json.dump(beats_doc, f, ensure_ascii=False, indent=2)

print(f"OK {OUT_MID} | {OUT_BEATS} | bpm={BPM} bars={BARS} dur={TOTAL_BEATS * SEC_PER_BEAT}s")
