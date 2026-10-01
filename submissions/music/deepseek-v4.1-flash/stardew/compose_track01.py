# -*- coding: utf-8 -*-
"""夜港灯火 —— 16 小节可循环夜曲（A 自然小调 / 92 BPM / 4-4）

画面：像素风夜间港湾，冷蓝紫夜色 + 暖橙灯串，木栈桥、小船、雪顶小屋、
      温室药草、渔夫与摊主。音乐取向：慢速夜曲 —— 指弹吉他作织体，
      弦乐与人声长音铺底，长笛吟唱主旋律，钢片琴点缀灯火。

和声（每小节一个和弦，A 小调级数）：
  1 Am | 6 F | 3 C | 7 G |  1 Am | 4 Dm | 6 F | 7 G |
  3 C  | 7 G | 1 Am| 6 F |  4 Dm | 7 G  | 3 C | 7 G
循环接缝：第 15-16 小节旋律 E-D-C-B（下行音阶），第 16 小节停在导音 B4、
          低音落在 B2，接回第 1 小节的 A4/A2 —— 接缝处是"未说完"，不是"终止"。

运行：
    exec(workdir="skill://public/music-gen",
         env={"LIBDIR": "skill://public/music-gen/scripts",
              "OUT_MID": "private://work/track01.mid"},
         command="python %COMPOSE%")
"""
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

# ============================================================ 基本参数
SCALE = [0, 2, 3, 5, 7, 8, 10]          # A 自然小调 A B C D E F G
TONIC = mg.note_to_midi('A3')           # 57
BPM = 92
BARS = 16
BPB = 4
PROG = [1, 6, 3, 7, 1, 4, 6, 7, 3, 7, 1, 6, 4, 7, 3, 7]
OUT = os.environ.get("OUT_MID", "track01.mid")
MUTE = set(x for x in os.environ.get("MUTE", "").split(",") if x)   # 诊断用：静音某些声部

# ============================================================ 各声部音区（手工配器，避免糊在一起）
# 低音  A2-C3 (41-50) | 吉他 A3-G4 (57-67) | 弦乐铺底 F3-G4 (53-67)
# 人声 F4-D5 (65-74)  | 长笛 G4-A5 (67-81) | 钢片琴 E5-C6 (76-84)
PAD = {1: [57, 60, 64], 3: [60, 64, 67], 4: [57, 62, 65],
       6: [53, 57, 60], 7: [55, 59, 62]}
OOH = {1: [69, 76], 3: [72, 79], 4: [69, 74], 6: [65, 72], 7: [67, 74]}
GTR = {1: [57, 60, 64], 3: [60, 64, 67], 4: [57, 62, 65],
       6: [57, 60, 65], 7: [59, 62, 67]}
BROOT = {1: 45, 3: 48, 4: 50, 6: 41, 7: 43}     # A2 C3 D3 F2 G2
BFIFTH = {1: 52, 3: 55, 4: 45, 6: 48, 7: 50}    # E3 G3 A2 C3 D3
BWALK = {4: 47, 8: 47, 12: 45, 14: 47, 16: 47}  # 乐句尾的经过音（导音/共同音）


def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)


p = mg.Piece(bpm=BPM, bars=BARS)
print(f"loop = {p.loop_seconds:.2f}s  ({BARS} 小节 @ {BPM} BPM)")

# ============================================================ 1. 低音（原声贝斯，居中）
if "bass" not in MUTE:
    bass = p.track("bass", mg.GM['acoustic_bass'], pan=64, volume=110)
    for bar in range(BARS):
        dg = PROG[bar]
        t0 = bar * BPB
        bass.note(t0, BROOT[dg], 1.95, 66)
        bass.note(t0 + 2, BROOT[dg], 0.95, 55)
        last = BWALK.get(bar + 1, BFIFTH[dg])
        bass.note(t0 + 3, last, 0.95, 58)

# ============================================================ 2. 指弹吉他（左右分轨，交错八分音）
if "gtr" not in MUTE:
    gl = p.track("gtr_L", mg.GM['nylon_guitar'], pan=34, volume=96)
    gr = p.track("gtr_R", mg.GM['nylon_guitar'], pan=106, volume=88)
    for bar in range(BARS):
        t0 = bar * BPB
        v = GTR[PROG[bar]]
        # 正拍（左）：低音弦 + 内声部，音稍长让它延音
        gl.note(t0 + 0, v[0], 1.90, 64 if bar % 4 == 0 else 60)
        gl.note(t0 + 1, v[1], 0.90, 55)
        gl.note(t0 + 2, v[0], 1.90, 61)
        gl.note(t0 + 3, v[2], 0.90, 55)
        # 反拍（右）：高音弦碎片，轻，做右侧微光
        gr.note(t0 + 0.5, v[2], 0.45, 47)
        gr.note(t0 + 1.5, v[1], 0.45, 43)
        gr.note(t0 + 2.5, v[2], 0.45, 46)
        gr.note(t0 + 3.5, v[1], 0.45, 42)
    # 第 16 小节尾句：左手补一个上行小填充，把循环接缝"递"回主和弦
    gl.note(63.0, 62, 0.45, 52)      # D4
    gl.note(63.5, 67, 0.45, 56)      # G4 → 接回第 1 小节

# ============================================================ 3. 弦乐铺底（左）+ 人声长音（右）
if "pad" not in MUTE:
    pad = p.track("strings", mg.GM['strings'], pan=16, volume=98)
    ooh = p.track("oohs", mg.GM['voice_oohs'], pan=118, volume=82)
    for bar in range(BARS):
        dg = PROG[bar]
        t0 = bar * BPB
        accent = 3 if bar % 4 == 0 else 0
        for i, nt in enumerate(PAD[dg]):
            pad.note(t0, nt, 3.95, 50 + accent + (3 if i == 0 else 0))
        for i, nt in enumerate(OOH[dg]):
            ooh.note(t0, nt, 3.95, 42 + accent + (3 if i == 0 else 0))

# ============================================================ 4. 主旋律（长笛）—— 曲子的灵魂
# (小节, 拍, 级数, 八度, 时值, 力度)
MEL = [
    (1, 0.0, 8, 0, 1.5, 74), (1, 1.5, 10, 0, 0.5, 70), (1, 2.0, 12, 0, 1.90, 78),   # Am
    (2, 0.0, 11, 0, 1.5, 76), (2, 1.5, 10, 0, 0.5, 68), (2, 2.0, 8, 0, 1.90, 72),   # F
    (3, 0.0, 7, 0, 1.0, 70), (3, 1.0, 10, 0, 1.0, 74), (3, 2.0, 12, 0, 1.90, 78),   # C
    (4, 0.0, 11, 0, 1.5, 74), (4, 1.5, 9, 0, 0.5, 68), (4, 2.0, 7, 0, 1.90, 70),    # G
    (5, 0.0, 10, 0, 1.0, 76), (5, 1.0, 12, 0, 1.0, 78), (5, 2.0, 15, 0, 2.40, 82),  # Am  ← 顶点
    (6, 0.0, 13, 0, 1.0, 78), (6, 1.0, 12, 0, 1.0, 74), (6, 2.0, 11, 0, 1.90, 76),  # Dm
    (7, 0.0, 10, 0, 1.0, 72), (7, 1.0, 11, 0, 1.0, 74), (7, 2.0, 12, 0, 1.90, 78),  # F
    (8, 0.0, 11, 0, 2.0, 74), (8, 2.0, 9, 0, 1.90, 70),                             # G
    (9, 0.0, 7, 0, 1.0, 74), (9, 1.0, 12, 0, 1.0, 78), (9, 2.0, 14, 0, 2.40, 80),   # C  ← 重新升起
    (10, 0.0, 15, 0, 2.0, 80), (10, 2.0, 14, 0, 1.90, 76),                          # G
    (11, 0.0, 12, 0, 1.5, 78), (11, 1.5, 11, 0, 0.5, 72), (11, 2.0, 10, 0, 1.90, 74),  # Am
    (12, 0.0, 8, 0, 2.0, 72), (12, 2.0, 10, 0, 1.90, 74),                           # F
    (13, 0.0, 11, 0, 1.0, 74), (13, 1.0, 13, 0, 1.0, 78), (13, 2.0, 12, 0, 1.90, 76),  # Dm
    (14, 0.0, 11, 0, 2.0, 74), (14, 2.0, 9, 0, 1.90, 72),                           # G
    (15, 0.0, 12, 0, 2.0, 76), (15, 2.0, 11, 0, 1.0, 72), (15, 3.0, 10, 0, 1.0, 74),   # C
    (16, 0.0, 9, 0, 3.35, 73),                                                      # G  导音 → 回 A
]
if "lead" not in MUTE:
    lead = p.track("flute", mg.GM['flute'], pan=52, volume=96)
    for bar, beat, degree, octv, dur, vel in MEL:
        lead.note((bar - 1) * BPB + beat, D(degree, octv), dur, vel)
    # 末音渐弱收束：把导音 B4 缓缓放下，接缝处留一口气而不是硬切
    lead.cc(0, 11, 127)
    lead.cc(58.0, 11, 124)
    lead.cc(62.6, 11, 100)
    lead.cc(63.1, 11, 78)
    lead.cc(63.35, 11, 60)

# ============================================================ 5. 钢片琴（右侧，灯火般的高音微光）
CEL = [
    (2, 3.5, 15, 0.40, 40), (4, 3.0, 14, 0.90, 46), (6, 3.5, 13, 0.40, 39),
    (8, 3.0, 12, 0.90, 44), (9, 3.5, 17, 0.40, 47), (10, 3.0, 16, 0.90, 43),
    (11, 3.5, 15, 0.40, 45), (12, 3.0, 13, 0.90, 41), (13, 3.5, 17, 0.40, 47),
    (14, 3.0, 14, 0.90, 43), (15, 3.5, 15, 0.40, 45), (16, 3.0, 16, 0.80, 42),
]
if "cel" not in MUTE:
    cel = p.track("celesta", mg.GM['celesta'], pan=96, volume=92)
    for bar, beat, degree, dur, vel in CEL:
        cel.note((bar - 1) * BPB + beat, D(degree), dur, vel)

# ============================================================ 6. 沙锤（极轻的呼吸感）
if "sh" not in MUTE:
    sh = p.track("shaker", mg.DRUMS['shaker'], pan=78, volume=58, drums=True)
    for bar in range(BARS):
        t0 = bar * BPB
        lift = 3 if bar >= 8 else 0          # 后半段稍许抬起
        for bt, vel in [(0, 26), (0.5, 21), (1, 28), (1.5, 21),
                        (2, 35), (2.5, 23), (3, 28), (3.5, 23)]:
            sh.note(t0 + bt, mg.DRUMS['shaker'], 0.25, vel + lift)

p.save(OUT)
print(f"OK {OUT} bpm={BPM} bars={BARS} loop={p.loop_seconds:.2f}s"
      f" mute={sorted(MUTE) if MUTE else '-'}")
