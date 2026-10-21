# -*- coding: utf-8 -*-
"""compose_bgm.py — 为「牛马咖啡 2026 Q3」30 秒数据短片写一首 120BPM / 15 小节的原创作曲。

结构（每小节 2 秒，15 小节 = 30.0 秒，与成片等长）：
    小节 1-3   0-6s    引子：低音脉冲 + 底鼓，末小节军鼓滚奏推进
    小节 4-7   6-14s   主歌：完整鼓组 + 八分贝斯 + 铜管切分 + 主旋律
    小节 8-11  14-22s  推进：加 16 分琶音、铃鼓、镲
    小节 12-13 22-26s  高潮：最高力度，主旋律上扬
    小节 14-15 26-30s  收束：Am 长和弦，余韵自然衰减

调性 A 自然小调；速度 120BPM ⇒ 每拍 0.5s，每小节 2.0s，
成片每一次切镜（0/2/6/10/14/18/22/26 秒）都正好落在小节第一拍上。
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

OUT = os.environ.get("OUT_MID", "bgm.mid")

# ============================================================ 参数
BPM = 120
BARS = 15
BPB = 4
SCALE = [0, 2, 3, 5, 7, 8, 10]              # 自然小调
TONIC = mg.note_to_midi("A3")               # 57

# 每小节的音级（1 = Am, 3 = C, 6 = F, 7 = G）
PROG = [1, 6, 7, 1, 6, 3, 7, 1, 6, 3, 7, 6, 7, 1, 1]


def D(d, octv=0):
    return mg.deg(SCALE, TONIC, d, octv)


def C(d, size=3, octv=0):
    return mg.chord_of(SCALE, TONIC, d, size=size, octave=octv)


# 低音音区修正：让贝斯稳定落在 A2/F2/G2/C3 一带
BASS_OCT = {1: -1, 3: -1, 6: -2, 7: -2}


def bass_root(d):
    return D(d, BASS_OCT[d])


p = mg.Piece(bpm=BPM, bars=BARS)

# ============================================================ 声部
drums = p.track("drums", 0, drums=True, pan=64, volume=118)
bass = p.track("bass", mg.GM["synth_bass"], pan=64, volume=102)
padL = p.track("padL", mg.GM["warm_pad"], pan=14, volume=82)
padR = p.track("padR", mg.GM["warm_pad"], pan=112, volume=82)
brassL = p.track("brassL", mg.GM["synth_brass"], pan=22, volume=88)
brassR = p.track("brassR", mg.GM["synth_brass"], pan=104, volume=88)
arpL = p.track("arpL", mg.GM["crystal"], pan=18, volume=78)
arpR = p.track("arpR", mg.GM["crystal"], pan=108, volume=78)
lead = p.track("lead", mg.GM["saw_lead"], pan=64, volume=100)
percL = p.track("percL", 0, drums=True, pan=30, volume=88)
percR = p.track("percR", 0, drums=True, pan=100, volume=88)

DR = mg.DRUMS

# ------------------------------------------------------------ 鼓组
for bar in range(BARS):
    t0 = bar * BPB
    n = bar + 1

    if n <= 2:
        # 引子：只有底鼓骨架，留白
        drums.note(t0 + 0, DR["kick"], 0.5, 104)
        drums.note(t0 + 2.5, DR["kick"], 0.5, 92)
    elif n == 3:
        # 推进小节：底鼓 + 军鼓渐强
        drums.note(t0 + 0, DR["kick"], 0.5, 108)
        drums.note(t0 + 2, DR["kick"], 0.5, 100)
        for i in range(8):
            drums.note(t0 + 2 + i * 0.25, DR["snare"], 0.24, 40 + i * 9)
        drums.note(t0 + 3.5, DR["crash"], 1.0, 78)
    elif n == 15:
        # 收束小节：只有一记落底 + 强音镲，让和弦自然衰减
        drums.note(t0 + 0, DR["kick"], 0.5, 108)
        drums.note(t0 + 0, DR["crash"], 2.0, 74)
    else:
        # 主 beat
        heavy = n in (12, 13)
        drums.note(t0 + 0, DR["kick"], 0.5, 118 if heavy else 112)
        drums.note(t0 + 1.5, DR["kick"], 0.5, 92)
        drums.note(t0 + 2, DR["kick"], 0.5, 114 if heavy else 106)
        drums.note(t0 + 3.5, DR["kick"], 0.5, 92)
        drums.note(t0 + 1, DR["snare"], 0.5, 112 if heavy else 104)
        drums.note(t0 + 3, DR["snare"], 0.5, 114 if heavy else 106)
        for i in range(8):
            v = 58 if i % 2 == 0 else 40
            drums.note(t0 + i * 0.5, DR["hh_closed"], 0.45, v)
        if n % 2 == 0:
            drums.note(t0 + 1.5, DR["hh_open"], 0.45, 56)
            drums.note(t0 + 3.5, DR["hh_open"], 0.45, 56)
        if n in (4, 8, 12, 14):
            drums.note(t0 + 0, DR["crash"], 1.2, 96)
        if n in (7, 11):
            drums.note(t0 + 3.0, DR["tom_high"], 0.25, 88)
            drums.note(t0 + 3.25, DR["tom_mid"], 0.25, 94)
            drums.note(t0 + 3.5, DR["tom_low"], 0.25, 100)
            drums.note(t0 + 3.75, DR["tom_low"], 0.25, 106)

    # 推进段的小打击乐（左右分轨，做出宽度）
    if 5 <= n <= 11:
        for i in range(8):
            percL.note(t0 + i * 0.5 + 0.25, DR["tambourine"], 0.3, 38 + (i % 2) * 8)
    if 7 <= n <= 11:
        for i in range(16):
            percR.note(t0 + i * 0.25, DR["shaker"], 0.2, 30 + (i % 4) * 5)

# ------------------------------------------------------------ 贝斯
for bar in range(BARS):
    t0 = bar * BPB
    n = bar + 1
    d = PROG[bar]
    r = bass_root(d)
    if n <= 2:
        # 引子：全音符长音托底
        bass.note(t0, r, 3.9, 88)
    elif n == 15:
        # 收束：低音主音长音，随混响自然收掉
        bass.note(t0, r, 1.6, 96)
    elif n == 3:
        for i, b in enumerate([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]):
            bass.note(t0 + b, r, 0.46, 70 + (i % 2) * 8)
    else:
        pat = [0, 0, 12, 0, 0, 0, 12, 0] if n % 2 == 0 else [0, 0, 0, 12, 0, 0, 12, 0]
        acc = [112, 76, 88, 76, 108, 76, 88, 82]
        for i, b in enumerate([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5]):
            bass.note(t0 + b, r + pat[i], 0.46, acc[i])

# ------------------------------------------------------------ 和声垫
for bar in range(BARS):
    t0 = bar * BPB
    n = bar + 1
    ch = C(PROG[bar], size=3, octv=0)
    if n <= 2:
        padL.chord(t0, [x - 12 for x in ch], 4.0, vel=54)
        padR.chord(t0, [x - 12 for x in ch[:2]] + [ch[2] - 24], 4.0, vel=50)
    elif n <= 13:
        padL.chord(t0, ch, 3.9, vel=64)
        padR.chord(t0, [ch[0], ch[1] + 12, ch[2] + 12], 3.9, vel=60)
    elif n == 14:
        padL.chord(t0, ch + [ch[0] + 12], 3.9, vel=74)
        padR.chord(t0, [ch[0] - 12, ch[1], ch[2] + 12], 3.9, vel=70)
    else:
        padL.chord(t0, ch + [ch[0] + 12], 1.7, vel=70)
        padR.chord(t0, [ch[0] - 12, ch[1], ch[2] + 12], 1.7, vel=66)

# ------------------------------------------------------------ 铜管切分
for bar in range(BARS):
    t0 = bar * BPB
    n = bar + 1
    if n < 4 or n > 14:
        continue
    ch = C(PROG[bar], size=3, octv=1)
    v = 96 if n >= 12 else 82
    for b, vel in ((1.5, v - 10), (3.5, v), (3.0, v - 22)):
        brassL.chord(t0 + b, ch, 0.28, vel=vel)
        brassR.chord(t0 + b, [ch[0] + 12, ch[1], ch[2]], 0.28, vel=vel)

# ------------------------------------------------------------ 16 分琶音（左右错位，做出立体声）
for bar in range(BARS):
    t0 = bar * BPB
    n = bar + 1
    if n < 5 or n > 12:
        continue
    ch = C(PROG[bar], size=3, octv=1)
    tones = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1], ch[0] + 12, ch[2] + 12]
    for i in range(16):
        b = i * 0.25
        v = 54 + (i % 4) * 6
        arpL.note(t0 + b, tones[i % 8], 0.24, v)
        arpR.note(t0 + b, tones[(i + 3) % 8], 0.24, v - 6)

# ------------------------------------------------------------ 主旋律
MEL = [
    # (小节, 拍, 音级, 八度, 时值拍)
    (4, 0, 8, 0, 0.5), (4, 0.5, 10, 0, 0.5), (4, 1, 9, 0, 1),
    (4, 2, 8, 0, 0.5), (4, 2.5, 6, 0, 0.5), (4, 3, 7, 0, 1.0),

    (5, 0, 8, 0, 0.5), (5, 0.5, 5, 0, 0.5), (5, 1, 6, 0, 1.5),
    (5, 3, 7, 0, 0.5), (5, 3.5, 8, 0, 0.5),

    (6, 0, 10, 0, 1), (6, 1, 9, 0, 0.5), (6, 1.5, 8, 0, 0.5),
    (6, 2, 7, 0, 1), (6, 3, 5, 0, 1),

    (7, 0, 7, 0, 0.5), (7, 0.5, 8, 0, 0.5), (7, 1, 9, 0, 0.5), (7, 1.5, 10, 0, 0.5),
    (7, 2, 12, 0, 2),

    (8, 0, 8, 1, 0.5), (8, 0.5, 10, 1, 0.5), (8, 1, 9, 1, 1),
    (8, 2, 8, 1, 0.5), (8, 2.5, 6, 1, 0.5), (8, 3, 7, 1, 1),

    (9, 0, 8, 1, 0.5), (9, 0.5, 5, 1, 0.5), (9, 1, 6, 1, 1.5),
    (9, 3, 7, 0, 0.5), (9, 3.5, 8, 0, 0.5),

    (10, 0, 10, 1, 1), (10, 1, 9, 1, 0.5), (10, 1.5, 8, 1, 0.5),
    (10, 2, 7, 1, 1), (10, 3, 5, 1, 0.5), (10, 3.5, 7, 1, 0.5),

    (11, 0, 8, 1, 0.5), (11, 0.5, 9, 1, 0.5), (11, 1, 10, 1, 0.5), (11, 1.5, 12, 1, 0.5),
    (11, 2, 13, 0, 2),

    (12, 0, 13, 0, 1), (12, 1, 12, 0, 0.5), (12, 1.5, 10, 0, 0.5),
    (12, 2, 12, 0, 1.5), (12, 3.5, 13, 0, 0.5),

    (13, 0, 15, 0, 1), (13, 1, 13, 0, 0.5), (13, 1.5, 12, 0, 0.5),
    (13, 2, 13, 0, 2),

    (14, 0, 8, 1, 1.5), (14, 2, 7, 1, 0.5), (14, 2.5, 6, 1, 0.5), (14, 3, 1, 0, 0.95),
]
for bar, beat, degv, octv, dur in MEL:
    vel = 100 if bar >= 12 else 86
    lead.note((bar - 1) * BPB + beat, D(degv, octv), dur * 0.95, vel)

p.save(OUT)
print("OK %s | bpm=%d bars=%d loop=%.2fs" % (OUT, BPM, BARS, p.loop_seconds))
