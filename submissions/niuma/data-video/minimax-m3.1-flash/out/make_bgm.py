#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
牛马咖啡 2026 Q3 经营短片 · 原创 BGM
风格：小调电子放克（Funk/Electro），120 BPM，驱动型贝斯 + 方波主音 + 合成垫，
      为「热血 / 闹腾 / 橙蓝撞色」的数据短片设计。
结构（30 秒 = 15 小节 @120BPM）：
  bar 0-1   片头（稀疏，铺底）
  bar 2-5   推进（贝斯进入）
  bar 6-9   主段（全奏）
  bar 10-11 过渡（减配，为毛利率下降的转折留出呼吸）
  bar 12-13 高潮（全奏 + 八度叠加）
  bar 14    收束（回到主和弦，自然收尾，不在乐句中间截断）
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

# ============================================================ 可调参数
SCALE = [0, 2, 3, 5, 7, 8, 10]        # 自然小调（A 小调）
TONIC = mg.note_to_midi('A2')          # 主音 A2 = 45
BPM = 120
BARS = 15
# 每小节一个和弦级数（1=Am, 3=C, 4=Dm, 5=Em, 6=F, 7=G）
PROG = [1, 1, 1, 1,
        6, 4, 6, 4,
        1, 7, 4, 4,
        1, 1, 1]
OUT = os.environ.get("OUT_MID", "bgm.mid")
BPB = 4


def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)


def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


p = mg.Piece(bpm=BPM, bars=BARS)

# ---------------------------------------------------------- 段落强度
def intensity(bar):
    """返回 (鼓组力度, 贝斯力度, 主音力度, 铺底力度) —— 结构上的强弱曲线"""
    if bar < 2:      # 片头：稀疏
        return (0, 0, 0, 78)
    if bar < 4:      # 推进
        return (86, 92, 74, 84)
    if bar < 6:      # 主段
        return (104, 104, 92, 88)
    if bar < 10:     # 主段持续 + 和声推进
        return (110, 110, 100, 86)
    if bar < 12:     # 过渡：减配，为转折留呼吸
        return (78, 82, 76, 92)
    if bar < 14:     # 高潮
        return (124, 122, 118, 92)
    return (96, 100, 92, 84)          # 收束


# ---------------------------------------------------------------- 鼓
drums = p.track("drums", 0, pan=64, volume=118, drums=True)
for bar in range(BARS):
    d, _, _, _ = intensity(bar)
    if d == 0:
        continue
    b0 = bar * BPB
    # 底鼓：四踩（第 4 拍加重，bar 0、6、12 加 tom 过门）
    for beat in range(4):
        v = d if beat in (0, 2) else int(d * 0.78)
        drums.note(b0 + beat, mg.DRUMS['kick'], 0.45, v)
    if bar in (0, 6, 12):
        drums.note(b0 + 3, mg.DRUMS['kick'], 0.24, d)
    # 军鼓 / 拍手：第 2、4 拍
    snare_key = mg.DRUMS['clap'] if bar >= 6 else mg.DRUMS['snare']
    for beat in (1, 3):
        drums.note(b0 + beat, snare_key, 0.4, d)
    # 踩镲：八分
    for beat in range(4):
        drums.note(b0 + beat + 0.5, mg.DRUMS['hh_closed'], 0.22, int(d * 0.55))
        if bar >= 2:
            drums.note(b0 + beat, mg.DRUMS['hh_closed'], 0.12, int(d * 0.32))
    # 开放镲在第 4 拍后半，制造切分
    drums.note(b0 + 3.5, mg.DRUMS['hh_open'], 0.3, int(d * 0.5))
    # 高潮加 ride 十六分
    if bar in (12, 13):
        for i in range(8):
            drums.note(b0 + i * 0.5, mg.DRUMS['ride'], 0.18, int(d * 0.42))
    if bar == 14:
        # 收尾：一记 crash，然后干净落音
        drums.note(b0, mg.DRUMS['crash'], 1.2, 100)

# ---------------------------------------------------------------- 贝斯
# 根音八分音符 + 偶尔五度/八度跳进
bass = p.track("bass", mg.GM['synth_bass'], pan=64, volume=112)
BASS_FIG = [
    # (小节内起始拍, 音级, 时值, 力度倍率)
    [(0, 1, 0.5, 1.0), (0.5, 1, 0.5, 0.72), (1, 1, 0.5, 0.9), (1.5, 7, 0.5, 0.75),
     (2, 1, 0.5, 1.0), (2.5, 1, 0.5, 0.72), (3, 8, 0.5, 0.85), (3.5, 8, 0.5, 0.7)],
    [(0, 1, 0.5, 1.0), (0.5, 3, 0.5, 0.75), (1, 1, 0.5, 0.95), (1.5, 1, 0.5, 0.7),
     (2, 7, 0.5, 0.9), (2.5, 7, 0.5, 0.72), (3, 8, 1.0, 0.85)],
]
for bar in range(BARS):
    _, db, _, _ = intensity(bar)
    if db == 0:
        continue
    b0 = bar * BPB
    deg = PROG[bar]
    for start, dnum, dur, mult in BASS_FIG[bar % 2]:
        # 三和弦级数：把和弦音映射回音阶级数
        dd = ((deg - 1 + [0, 2, 4, 6][dnum % 4]) % 7) + 1
        bass.note(b0 + start, D(dd, 0), dur * 0.94, int(db * mult))

# ---------------------------------------------------------------- 铺底
pad = p.track("pad", mg.GM['warm_pad'], pan=64, volume=96)
for bar in range(BARS):
    _, _, _, dp = intensity(bar)
    b0 = bar * BPB
    deg = PROG[bar]
    # 第 1 段铺底用纯五度（更空），其余用三和弦
    size = 3 if bar >= 2 else 2
    pad.chord(b0, C(deg, size=size, octave=0), BPB - 0.15, vel=int(dp * 0.5))
    if bar >= 10:  # 高潮加高八度层
        pad.chord(b0, C(deg, size=3, octave=1), BPB - 0.15, vel=int(dp * 0.26))

# ---------------------------------------------------------------- 主音（方波，旋律钩子）
lead = p.track("lead", mg.GM['square_lead'], pan=64, volume=104)
# (小节, 拍, 音级, 八度, 时值拍, 力度)
MELODY = [
    # bar 2-3 主题句（上行动机）
    (2, 0, 1, 1, 0.5, 84), (2, 0.5, 3, 1, 0.5, 76), (2, 1, 4, 1, 1.0, 88), (2, 2.5, 6, 1, 0.5, 80),
    (2, 3, 4, 1, 0.5, 74), (2, 3.5, 3, 1, 0.5, 70),
    (3, 0, 1, 1, 1.5, 90), (3, 2, 7, 1, 0.5, 78), (3, 3, 8, 1, 1.0, 84),
    # bar 4-5 答句（下行）
    (4, 0, 4, 1, 0.5, 82), (4, 0.5, 3, 1, 0.5, 74), (4, 1, 1, 1, 1.0, 88),
    (4, 2.5, 3, 1, 0.5, 76), (4, 3, 4, 1, 1.0, 80),
    (5, 0, 6, 1, 1.5, 86), (5, 2, 4, 1, 0.5, 76), (5, 3, 1, 1, 1.0, 84),
    # bar 6-9 主段：主题 + 高音装饰
    (6, 0, 1, 1, 0.5, 96), (6, 0.5, 3, 1, 0.5, 88), (6, 1, 4, 1, 0.5, 94), (6, 1.5, 6, 1, 0.5, 88),
    (6, 2, 7, 1, 1.0, 98), (6, 3, 6, 1, 0.5, 84), (6, 3.5, 4, 1, 0.5, 82),
    (7, 0, 4, 1, 0.5, 92), (7, 0.5, 3, 1, 0.5, 84), (7, 1, 1, 1, 1.5, 96),
    (7, 3, 3, 1, 1.0, 86),
    (8, 0, 1, 1, 0.5, 94), (8, 0.5, 3, 1, 0.5, 86), (8, 1, 4, 1, 0.5, 92), (8, 1.5, 6, 1, 0.5, 86),
    (8, 2, 7, 1, 1.0, 96), (8, 3, 8, 1, 1.0, 90),
    (9, 0, 4, 1, 0.5, 90), (9, 0.5, 3, 1, 0.5, 82), (9, 1, 1, 1, 2.0, 94),
    # bar 10-11 过渡：留白，只剩长音
    (10, 0, 4, 1, 2.0, 70), (10, 2.5, 1, 1, 1.5, 66),
    (11, 0, 1, 1, 3.5, 68),
    # bar 12-13 高潮：主题 + 高八度
    (12, 0, 1, 2, 0.5, 112), (12, 0.5, 3, 2, 0.5, 100), (12, 1, 4, 2, 0.5, 106), (12, 1.5, 6, 2, 0.5, 100),
    (12, 2, 7, 2, 1.0, 114), (12, 3, 8, 2, 1.0, 104),
    (12, 0, 1, 1, 0.5, 84), (12, 1, 4, 1, 0.5, 80), (12, 2, 7, 1, 1.0, 86),
    (13, 0, 4, 2, 0.5, 106), (13, 0.5, 3, 2, 0.5, 96), (13, 1, 1, 2, 1.5, 112),
    (13, 3, 3, 2, 1.0, 100),
    (13, 0, 4, 1, 1.0, 84), (13, 2, 6, 1, 1.0, 86),
    # bar 14 收束：主和弦长音，干净落回 A 小调
    (14, 0, 1, 1, 3.6, 92),
    (14, 0, 1, 2, 3.6, 70),
]
for bar, beat, dnum, octv, dur, vel in MELODY:
    lead.note(bar * BPB + beat, D(dnum, octv), dur * 0.95, vel)

# ---------------------------------------------------------------- 高潮八度钢片装饰
bell = p.track("bell", mg.GM['glockenspiel'], pan=100, volume=78)
for bar in range(10, 15):
    b0 = bar * BPB
    for i, (beat, step) in enumerate(((0, 0), (1.5, 2), (2, 4), (3.5, 6))):
        deg = PROG[bar]
        bell.note(b0 + beat, D(((deg - 1 + step) % 7) + 1, 2), 0.45,
                  70 if bar < 12 else 88)

# ---------------------------------------------------------------- 输出
p.save(OUT)
print(f"OK {OUT} | bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s "
      f"beat={60.0 / BPM:.3f}s")