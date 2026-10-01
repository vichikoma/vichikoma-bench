# compose_track01.py —— 《巨兽行军》战象军团 BGM
# E 弗里几亚，BPM 96，16 小节（40.0s 无缝循环）
import os
import sys

sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

# ============================================================ 参数
SCALE = [0, 1, 4, 5, 7, 8, 10]         # E 弗里几亚：威胁感 / 史诗感
TONIC = mg.note_to_midi('E3')          # 52
BPM = 96
BARS = 16
BPB = 4
PROG = [1, 1, 1, 1,                     # 引子：Em 持续，压迫酝酿
        1, 2, 1, 2,                     # A 段：i - bII 交替（弗里几亚标志）
        6, 7, 2, 1,                     # B 段：bVI - bVII - bII - i，上升转折
        4, 2, 7, 1]                     # 高潮：iv - bII - bvII - i，收束回主音
OUT = os.environ.get("OUT_MID", "track01.mid")


def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)


def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)


p = mg.Piece(bpm=BPM, bars=BARS)

# ============================================================ 声部
# 1) 低音托底：大提琴（E2 区）+ 低音提琴（E1 区），每小节根音长音
t_cello = p.track("cello", mg.GM['cello'], pan=64, volume=82)
t_cbass = p.track("contrabass", mg.GM['contrabass'], pan=64, volume=88)
for bar in range(BARS):
    d = PROG[bar]
    vel = 62 if bar < 4 else (78 if bar < 8 else (84 if bar < 12 else 88))
    t_cello.note(bar * BPB, D(d, -1), BPB * 0.98, vel)
    t_cbass.note(bar * BPB, D(d, -2), BPB * 0.98, vel + 2)
    # B/高潮段：低音加五度律动，避免后八小节低频发直
    if bar >= 8:
        t_cello.note(bar * BPB + 2, D(d + 4, -1), BPB * 0.48, vel - 6)

# 2) 弦乐固定音型（8 分音符），左右分轨 + 极端 pan，营造行军推进感
t_ostL = p.track("ostinato L", mg.GM['violin'], pan=12, volume=72)
t_ostR = p.track("ostinato R", mg.GM['violin'], pan=115, volume=72)
PAT_L = [0, 0, 1, 0, 0, 1, 0, 4]        # 根 根 上邻 根 根 上邻 根 五度（弗里几亚小二度 churn）
PAT_R = [0, 0, 8, 0, 0, 1, 0, 4]        # 右轨把第 3 个八分换成高八度，增加闪烁感
for bar in range(4, BARS):
    d = PROG[bar]
    for i in range(8):
        t = bar * BPB + i * 0.5
        acc = (i % 4 == 0)
        vel = (74 if bar >= 12 else 68) if acc else 58
        t_ostL.note(t, D(d + PAT_L[i], 1), 0.48, vel)
        t_ostR.note(t, D(d + PAT_R[i], 1), 0.48, vel - 4)

# 3) 圆号主旋律（E4 区），三段力度递进
t_horn = p.track("horn", mg.GM['french_horn'], pan=42, volume=100)
# 引子：低音区号角召唤
HORN_INTRO = [(0, 0, 1, 0, 3.5, 58), (2, 0, 5, 0, 1, 55), (2, 1, 1, 0, 3, 55)]
# 主题 A（bars 4-7）
HORN_A = [(4, 0, 5, 1, 2.5, 74), (4, 2.5, 6, 1, 1.5, 70),
          (5, 0, 5, 1, 2.0, 74), (5, 2, 4, 1, 2.0, 72),
          (6, 0, 3, 1, 2.5, 74), (6, 2.5, 4, 1, 1.5, 70),
          (7, 0, 2, 1, 2.0, 72), (7, 2, 1, 1, 2.0, 70)]
# 转折（bars 8-11）
HORN_B = [(8, 0, 6, 1, 1.5, 78), (8, 1.5, 7, 1, 1.5, 78),
          (9, 0, 1, 2, 2.0, 82), (9, 2, 7, 1, 1, 74), (9, 3, 6, 1, 1, 74),
          (10, 0, 4, 1, 2.0, 78), (10, 2, 3, 1, 2.0, 76),
          (11, 0, 2, 1, 2.0, 76), (11, 2, 1, 1, 2.0, 74)]
# 高潮（bars 12-15），末尾主音长音送入循环接缝
HORN_C = [(12, 0, 4, 1, 1, 88), (12, 1, 5, 1, 1, 88),
          (12, 2, 6, 1, 1, 90), (12, 3, 7, 1, 1, 88),
          (13, 0, 1, 2, 2.5, 90), (13, 2.5, 7, 1, 1.5, 82),
          (14, 0, 1, 2, 1, 84), (14, 1, 7, 1, 1, 80),
          (14, 2, 6, 1, 1, 80), (14, 3, 7, 1, 1, 80),
          (15, 0, 1, 2, 3.6, 80)]
for bar, beat, deg_, octv, dur, vel in HORN_INTRO + HORN_A + HORN_B + HORN_C:
    t_horn.note(bar * BPB + beat, D(deg_, octv), dur * 0.95, vel)

# 4) 小号：转折段短句 + 高潮段高八度叠加
t_tpt = p.track("trumpet", mg.GM['trumpet'], pan=88, volume=92)
TPT_B = [(8, 0, 3, 2, 1.5, 68), (8, 1.5, 4, 2, 1.5, 68),
         (9, 0, 5, 2, 2.5, 72), (9, 3, 7, 1, 1, 66)]
for bar, beat, deg_, octv, dur, vel in TPT_B:
    t_tpt.note(bar * BPB + beat, D(deg_, octv), dur * 0.95, vel)
for bar, beat, deg_, octv, dur, vel in HORN_C:
    t_tpt.note(bar * BPB + beat, D(deg_, octv + 1), dur * 0.95, vel - 8)

# 5) 人声合唱：每小节和弦长音，力度随段落爬升
t_choir = p.track("choir", mg.GM['choir_aahs'], pan=64, volume=96)
for bar in range(BARS):
    d = PROG[bar]
    vel = 48 if bar < 4 else (62 if bar < 8 else (70 if bar < 12 else 76))
    voicing = C(d, 3, 0) + [D(d, 1)]
    t_choir.chord(bar * BPB, voicing, BPB * 0.98, vel=vel)

# 6) 定音鼓：根音/五度重音 + 段前渐强滚奏
t_timp = p.track("timpani", mg.GM['timpani'], pan=64, volume=100)
for bar in range(BARS):
    d = PROG[bar]
    vel = 78 if bar < 4 else (88 if bar < 12 else 94)
    t_timp.note(bar * BPB, D(d, -1), 1.0, vel)
    if bar >= 4:
        t_timp.note(bar * BPB + 2, D(d + 4, -1), 1.0, vel - 14)
# 滚奏：bar 3/7/11 末两拍、bar 15 末一拍（推进循环接缝）
for bar, start, n16 in [(3, 2, 8), (7, 2, 8), (11, 2, 8), (15, 3, 4)]:
    for k in range(n16):
        v = 46 + int(50 * k / (n16 - 1))
        t_timp.note(bar * BPB + start + k * 0.25, D(1, -1), 0.24, v)

# 7) 打击乐：大鼓如战象踏地，3+3+2 型
t_dr = p.track("drums", 0, pan=64, volume=100, drums=True)
K, TL, TM, TH, SN, RIM, CRASH = (mg.DRUMS['kick'], mg.DRUMS['tom_low'],
                                 mg.DRUMS['tom_mid'], mg.DRUMS['tom_high'],
                                 mg.DRUMS['snare'], mg.DRUMS['snare_rim'],
                                 mg.DRUMS['crash'])
for bar in range(BARS):
    t0 = bar * BPB
    if bar < 4:                          # 引子：心跳
        t_dr.note(t0, K, 0.5, 84)
        t_dr.note(t0 + 2.5, K, 0.5, 66)
        t_dr.note(t0 + 3.5, TL, 0.4, 60)
    else:                                # 主体：3+3+2 战鼓
        t_dr.note(t0, K, 0.5, 96)
        t_dr.note(t0 + 1.5, K, 0.5, 78)
        t_dr.note(t0 + 2.0, K, 0.5, 88)
        t_dr.note(t0 + 3.5, TL, 0.4, 72)
        t_dr.note(t0 + 2.75, RIM, 0.2, 44)
for bar in (4, 8, 12):
    t_dr.note(bar * BPB, CRASH, 1.0, 96)
for bar, beats in [(7, [3.0, 3.25, 3.5, 3.75]), (15, [3.0, 3.25, 3.5])]:
    toms = [TH, TM, TL, TL]
    for i, b in enumerate(beats):
        t_dr.note(bar * BPB + b, toms[i % 4], 0.25, 70 + i * 8)

# 8) 竖琴：引子的悲悯微光
t_harp = p.track("harp", mg.GM['harp'], pan=100, volume=72)
for bar in range(4):
    d = PROG[bar]
    arp = [d, d + 2, d + 4, d + 6, d + 4, d + 2]
    for i, dd in enumerate(arp):
        t_harp.note(bar * BPB + i * 0.5, D(dd, 0), 0.9, 50 - i * 2)

# ============================================================ 输出
p.save(OUT)
print(f"OK {OUT} | scale={SCALE} tonic={TONIC} bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
