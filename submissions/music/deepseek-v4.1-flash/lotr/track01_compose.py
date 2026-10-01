"""track01 —— 「战象冲锋」史诗战阵 BGM

画面：巨型战象披甲列阵踏来，象背上木塔林立，脚下是密密麻麻的步兵方阵，
      天色昏黄、尘土漫天。=> 压迫感、不可阻挡的行进、古老的战意。

设计：
  调性  D 小调（自然小调为主，句末用 A7 属七做推动）
  速度  96 BPM，16 小节 = 40.0s（规格 30–48s 内）
  结构  bar 1–4   低频铺底 + 战鼓渐强（远方的象群逼近）
        bar 5–8   圆号奏出主题 S1，Gm→Bb→A7 收在半音导音上
        bar 9–12  弦乐高八度变奏 S2（圆号低八度托底），鼓点加密
        bar 13–16 铜管全奏主题高八度 S3（高潮）+ Dm 主和弦收束回环
  循环  末小节停在 Dm 主和弦、长音自然延续；接缝靠 tail-fold 把余响折回开头
"""
import os
import sys

if not os.environ.get("OUT_MID"):
    raise SystemExit("OUT_MID 未设置 —— 拒绝把 .mid 写进 skill 目录")
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

SCALE = [0, 2, 3, 5, 7, 8, 10]          # 自然小调（相对主音的半音数）
TONIC = mg.note_to_midi('D3')
BPM = 96
BARS = 16
OUT = os.environ["OUT_MID"]
MUTE = {x for x in os.environ.get("MUTE", "").split(",") if x}

N = mg.note_to_midi
p = mg.Piece(bpm=BPM, bars=BARS)
B = 4                                   # 每小节拍数


def bt(bar, beat=0.0):
    """(小节 1..16, 拍 0..4) -> 全局拍"""
    return (bar - 1) * B + beat


TR = {}


def mk(name, program, **kw):
    TR[name] = None if name in MUTE else p.track(name, program, **kw)


def put(name, kind, *a, **kw):
    t = TR.get(name)
    if t is None:
        return
    g = TGAIN.get(name, 1.0)
    if kind == 'note' and len(a) == 4:
        a = (a[0], a[1], a[2], max(1, min(127, int(round(a[3] * g)))))
    elif kind == 'chord' and 'vel' in kw:
        kw['vel'] = max(1, min(127, int(round(kw['vel'] * g))))
    getattr(t, kind)(*a, **kw)


# ============================================================ 和声骨架
CH = {1: 'Dm', 2: 'Dm', 3: 'Bb', 4: 'C', 5: 'Dm', 6: 'Gm', 7: 'Bb', 8: 'A7',
      9: 'Dm', 10: 'Bb', 11: 'Gm', 12: 'A7', 13: 'Dm', 14: 'Gm', 15: 'A7', 16: 'Dm'}
# 低音根音（刻意保持在 55–100Hz，避免大跳破坏"碾压感"）
BASS = {1: 38, 2: 38, 3: 34, 4: 36, 5: 38, 6: 43, 7: 34, 8: 33,
        9: 38, 10: 34, 11: 43, 12: 33, 13: 38, 14: 43, 15: 33, 16: 38}
# 中音区弦乐铺底（3 音，G3–A4 之间，给旋律让出上方空间）
PAD = {'Dm': [57, 62, 65], 'Bb': [58, 62, 65], 'C': [60, 64, 67],
       'Gm': [55, 58, 62], 'A7': [55, 61, 64]}
# 定音鼓：只用 D2/F2/G2/A2，全是调内音
TIMP = {1: [(0, 38, 70)], 2: [(0, 38, 74), (2, 38, 62)],
        3: [(0, 38, 80), (2, 41, 70)],
        4: [(0, 38, 86), (2, 45, 76), (3, 38, 84), (3.5, 45, 88)],
        5: [(0, 38, 96)], 6: [(0, 43, 90), (2, 38, 70)], 7: [(0, 41, 90)],
        8: [(0, 45, 96), (2, 45, 80)],
        9: [(0, 38, 98)], 10: [(0, 41, 88), (2, 38, 72)], 11: [(0, 43, 90)],
        12: [(0, 45, 96), (2, 45, 82)],
        13: [(0, 38, 104), (2, 38, 84)], 14: [(0, 43, 96)],
        15: [(0, 45, 100), (2, 45, 88)],
        16: [(0, 38, 104), (2, 38, 90), (3, 38, 92), (3.5, 38, 104)]}

# ============================================================ 旋律
# S1 主题（圆号，中音区）——上升后回落，收在半音导音 C# 上，吊住听众
S1 = [(5, 0, 'D4', 1.5, 78), (5, 1.5, 'F4', 0.5, 72), (5, 2, 'A4', 2.0, 80),
      (6, 0, 'G4', 1.5, 78), (6, 1.5, 'A4', 0.5, 72), (6, 2, 'Bb4', 2.0, 82),
      (7, 0, 'A4', 1.0, 80), (7, 1, 'G4', 1.0, 74), (7, 2, 'F4', 2.0, 78),
      (8, 0, 'E4', 2.0, 80), (8, 2, 'C#4', 2.0, 76)]
# S2 变奏（小提琴高音区，圆号低八度托底）——同音材料的抒情下行
S2 = [(9, 0, 'D5', 2.0, 80), (9, 2, 'F5', 2.0, 82),
      (10, 0, 'D5', 1.5, 78), (10, 1.5, 'F5', 0.5, 72), (10, 2, 'G5', 2.0, 84),
      (11, 0, 'D5', 1.0, 80), (11, 1, 'C5', 1.0, 74), (11, 2, 'Bb4', 2.0, 78),
      (12, 0, 'A4', 2.0, 82), (12, 2, 'C#5', 2.0, 80)]
# S3 高潮（铜管全奏高八度）——回到主题动机，落在主音 D 上
S3 = [(13, 0, 'D5', 1.5, 94), (13, 1.5, 'F5', 0.5, 88), (13, 2, 'A5', 2.0, 96),
      (14, 0, 'G5', 1.5, 94), (14, 1.5, 'A5', 0.5, 88), (14, 2, 'Bb5', 2.0, 96),
      (15, 0, 'A5', 1.0, 96), (15, 1, 'G5', 1.0, 90), (15, 2, 'E5', 2.0, 94),
      (16, 0, 'F5', 1.5, 96), (16, 1.5, 'E5', 0.5, 90), (16, 2, 'D5', 2.5, 92)]


def shift(seq, semis):
    return [(b, q, N(n) + semis, d, v) for (b, q, n, d, v) in seq]


# ============================================================ 建立声部
mk('bass', mg.GM['contrabass'], pan=64, volume=120)          # 低音提琴（行进引擎）
mk('cello', mg.GM['cello'], pan=54, volume=110)               # 大提琴（长音托底）
mk('tuba', mg.GM['tuba'], pan=70, volume=100)                 # 大号（低音铜管加厚）
mk('padL', mg.GM['strings'], pan=22, volume=106)              # 弦乐铺底 左
mk('padR', mg.GM['strings'], pan=108, volume=106)             # 弦乐铺底 右
mk('choir', mg.GM['voice_oohs'], pan=64, volume=68)           # 人声「哦」（仅高潮）
mk('horn', mg.GM['french_horn'], pan=72, volume=120)          # 圆号（主题）
mk('vln', mg.GM['violin'], pan=86, volume=114)                # 小提琴（S2 领奏）
mk('brass', mg.GM['brass_section'], pan=58, volume=120)       # 铜管组（S3 全奏）
mk('trem', mg.GM['tremolo_strings'], pan=96, volume=80)       # 震音弦乐（推进器）
mk('timp', mg.GM['timpani'], pan=64, volume=124)             # 定音鼓
mk('drums', 0, drums=True, volume=100)                       # 战鼓组

# 声部级增益（作曲/混音迭代时不用改音符）
TGAIN = {'bass': float(os.environ.get('G_BASS', '1.25')),
         'cello': float(os.environ.get('G_CELLO', '1.20')),
         'tuba': float(os.environ.get('G_TUBA', '1.25')),
         'timp': float(os.environ.get('G_TIMP', '1.20')),
         'padL': float(os.environ.get('G_PAD', '1.0')),
         'padR': float(os.environ.get('G_PAD', '1.0')),
         'choir': float(os.environ.get('G_CHOIR', '1.0')),}

# ------------------------------------------------------------ 低音提琴：行进 ostinato
for bar in range(1, BARS + 1):
    r = BASS[bar]
    rn = BASS[bar + 1] if bar < BARS else BASS[1]
    if bar == 1:
        put('bass', 'note', bt(1, 0), r, 3.9, 62)
    elif bar == 2:
        put('bass', 'note', bt(2, 0), r, 1.9, 66)
        put('bass', 'note', bt(2, 2), r, 1.9, 70)
    elif bar == 3:
        put('bass', 'note', bt(3, 0), r, 0.95, 72)
        put('bass', 'note', bt(3, 1), r, 0.95, 58)
        put('bass', 'note', bt(3, 2), r, 1.9, 74)
    elif bar == 4:
        put('bass', 'note', bt(4, 0), r, 0.95, 78)
        put('bass', 'note', bt(4, 1), r, 0.95, 64)
        put('bass', 'note', bt(4, 2), r, 0.95, 80)
        put('bass', 'note', bt(4, 3), r, 0.45, 74)
        put('bass', 'note', bt(4, 3.5), r + 2 if rn > r else r - 2, 0.45, 82)
    else:
        put('bass', 'note', bt(bar, 0), r, 0.95, 92)
        put('bass', 'note', bt(bar, 1), r, 0.95, 68)
        put('bass', 'note', bt(bar, 2), r, 0.95, 84)
        put('bass', 'note', bt(bar, 3), r, 0.45, 66)
        lead = rn if abs(rn - r) <= 4 else (r + 2 if rn > r else r - 2)
        put('bass', 'note', bt(bar, 3.5), lead, 0.45, 78)

# ------------------------------------------------------------ 大提琴：长音（接缝的定海神针）
for bar in range(1, BARS + 1):
    c = BASS[bar] + 12
    if bar <= 8:
        put('cello', 'note', bt(bar, 0), c, 3.9, 72)
    elif bar == 16:
        put('cello', 'note', bt(bar, 0), c, 4.4, 78)      # 跨过循环点
    else:
        put('cello', 'note', bt(bar, 0), c, 1.9, 78)
        put('cello', 'note', bt(bar, 2), c, 1.9, 70)

# ------------------------------------------------------------ 大号：低音铜管
for bar in range(5, BARS + 1):
    r = BASS[bar]
    if bar >= 13:
        put('tuba', 'note', bt(bar, 0), r, 1.9, 88)
        if bar < 16:
            put('tuba', 'note', bt(bar, 2), r, 1.9, 78)
    else:
        put('tuba', 'note', bt(bar, 0), r, 3.9, 74)

# ------------------------------------------------------------ 弦乐铺底（左右分工 → 立体声宽度）
for bar in range(1, BARS + 1):
    v = PAD[CH[bar]]
    vel = 58 if bar <= 2 else (64 if bar <= 4 else (72 if bar < 13 else 84))
    dur = 4.3 if bar == 16 else 3.9
    put('padL', 'chord', bt(bar, 0), v[:2], dur, vel=vel)
    put('padR', 'chord', bt(bar, 0), v[1:], dur, vel=vel - 4)

# ------------------------------------------------------------ 人声「哦」：只在高潮加色彩（与铺底同音，不加新音高）
for bar in range(13, 17):
    put('choir', 'chord', bt(bar, 0), PAD[CH[bar]], 4.3 if bar == 16 else 3.9, vel=72)

# ------------------------------------------------------------ 震音弦乐：两处推进器
for (bar, notes, v0, v1) in ((3, [50, 57], 44, 56), (4, [50, 57], 56, 72),
                             (11, [55, 62], 48, 60), (12, [57, 64], 60, 76)):
    put('trem', 'chord', bt(bar, 0), notes, 3.9, vel=v0)
    put('trem', 'cc', bt(bar, 2), 11, v0)
    put('trem', 'cc', bt(bar, 4) - 0.05, 11, v1)
put('trem', 'cc', bt(1, 0), 11, 127)

# ------------------------------------------------------------ 圆号：贯穿 5–16 的主线
# ------------------------------------------------------------ 圆号：贯穿 5–16 的主线
MG_ = float(os.environ.get("MEL_GAIN", "1.72"))      # 主旋律电平校准（见 stems.py）

def mv(v):
    return max(1, min(127, int(v * MG_)))


for (bar, q, pit, dur, vel) in S1:
    put('horn', 'note', bt(bar, q), N(pit), dur * 0.97, mv(vel))
for (bar, q, pit, dur, vel) in shift(S2, -12):
    put('horn', 'note', bt(bar, q), pit, dur * 0.97, mv(vel))
for (bar, q, pit, dur, vel) in shift(S3, -12):
    put('horn', 'note', bt(bar, q), pit, dur * 0.97, mv(vel))

# ------------------------------------------------------------ 小提琴：S1 齐奏 + S2 领奏 + S3 叠奏
for (bar, q, pit, dur, vel) in S1:
    put('vln', 'note', bt(bar, q), N(pit), dur * 0.97, mv(vel * 0.94))
for (bar, q, pit, dur, vel) in S2:
    put('vln', 'note', bt(bar, q), N(pit), dur * 0.97, mv(vel))
for (bar, q, pit, dur, vel) in S3:
    if bar <= 14:
        put('vln', 'note', bt(bar, q), N(pit), dur * 0.97, mv(vel))

# ------------------------------------------------------------ 铜管组：S3 全奏
for (bar, q, pit, dur, vel) in S3:
    put('brass', 'note', bt(bar, q), N(pit), dur * 0.97, mv(vel))

# 末音渐弱（CC11），让收尾自然、接缝不突兀
for tr in ('horn', 'vln', 'brass', 'choir', 'padL', 'padR'):
    put(tr, 'cc', bt(1, 0), 11, 127)
    put(tr, 'cc', bt(16, 2), 11, 120)
    put(tr, 'cc', bt(16, 3), 11, 104)
    put(tr, 'cc', bt(16, 4), 11, 88)

# ------------------------------------------------------------ 定音鼓：和声化战鼓
for bar, hits in TIMP.items():
    for (q, pit, vel) in hits:
        put('timp', 'note', bt(bar, q), pit, 0.9, vel)

# ------------------------------------------------------------ 战鼓组
K, TL, TM, TH = (mg.DRUMS['kick'], mg.DRUMS['tom_low'],
                 mg.DRUMS['tom_mid'], mg.DRUMS['tom_high'])
SN, CR, TB = mg.DRUMS['snare'], mg.DRUMS['crash'], mg.DRUMS['tambourine']


def drum(bar, q, pitch, vel):
    put('drums', 'note', bt(bar, q), pitch, 0.25, vel)


# 引子：单点 → 双点 → 四点 → 军鼓滚奏
drum(1, 0, K, 78)
drum(2, 0, K, 82)
drum(2, 2, TL, 66)
drum(3, 0, K, 88)
drum(3, 2, TL, 74)
drum(3, 3, TM, 66)
drum(4, 0, K, 95)
for i in range(12):                       # 16 分音符滚奏，1→4 拍渐强
    drum(4, 1 + i * 0.25, SN, int(26 + i * 3.4))

# 主体：八分音符战鼓推进
MAIN = [(0, K, 96), (0.5, TL, 60), (1, TM, 80), (1.5, TL, 58),
        (2, K, 88), (2.5, TM, 64), (3, TL, 82), (3.5, TM, 70)]
for bar in range(5, 17):
    k = 1.12 if bar < 9 else (1.18 if bar < 13 else 1.28)
    for (q, pitch, vel) in MAIN:
        drum(bar, q, pitch, min(118, int(vel * k)))
    if bar >= 9:                          # 加军鼓推句尾
        drum(bar, 3.5, SN, 56)
    if 13 <= bar <= 15:                   # 高潮加镲片 + 反拍铃鼓
        drum(bar, 0, CR, 64 if bar == 13 else 56)
        drum(bar, 2, SN, 60)
        for q in (0.5, 1.5, 2.5, 3.5):
            drum(bar, q, TB, 32)

# 末小节：大镲 + 通鼓过门，把能量推回第 1 小节
drum(16, 0, K, 108)
drum(16, 0, CR, 72)
for (q, pitch, vel) in ((1, TL, 88), (1.5, TM, 78), (2, TL, 96), (2.5, TH, 82),
                        (3, TM, 100), (3.25, TH, 86), (3.5, TL, 96), (3.75, TH, 112)):
    drum(16, q, pitch, vel)
for q in (0.5, 1.5, 2.5, 3.5):
    drum(16, q, TB, 34)

# ============================================================ 输出
for _tr in p._tracks:
    for (_tick, _prio, _seq, _pl) in _tr.events:
        if _pl[0] in ('on', 'off') and not isinstance(_pl[1], int):
            print(f"BAD pitch={_pl!r} tick={_tick} chan={_tr.chan}")
p.save(OUT)
print(f"OK {OUT}")
print(f"  bpm={BPM} bars={BARS} loop={p.loop_seconds:.2f}s  "
      f"scale={SCALE} tonic={TONIC}")
print(f"  tracks={[k for k, v in TR.items() if v is not None]}")
if MUTE:
    print(f"  muted={sorted(MUTE)}")
