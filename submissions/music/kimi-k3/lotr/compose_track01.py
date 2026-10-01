#!/usr/bin/env python
"""track01 - War of the Colossi (D Phrygian epic war loop, 16 bars @100bpm)"""
import os, sys
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg  # noqa: E402

SCALE = [0, 1, 3, 5, 7, 8, 10]          # D Phrygian
TONIC = mg.note_to_midi('D4')           # 62
BPM = 100
BARS = 16                               # 38.4s loop
#            intro        theme A      theme B      climax
PROG = [1,1,1,1,   1,6,4,2,   1,2,1,2,   6,2,6,1]
OUT = os.environ.get("OUT_MID", "track01.mid")

def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)

def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)

p = mg.Piece(bpm=BPM, bars=BARS)
B = 4  # beats per bar

def root(bar, octv):
    return D(PROG[bar], octv)

def sect(bar):  # section id: 0 intro, 1 themeA, 2 themeB, 3 climax
    return 0 if bar < 4 else 1 if bar < 8 else 2 if bar < 12 else 3

# ---------------- 定音鼓：战争的脉搏 ----------------
timp = p.track("timpani", mg.GM['timpani'], pan=64, volume=108)
for bar in range(BARS):
    s = sect(bar)
    base = 62 + s * 10
    timp.note(bar*B + 0,   root(bar, -2), 1.0, base + 26)
    timp.note(bar*B + 2,   root(bar, -2), 0.5, base + 12)
    timp.note(bar*B + 2.5, root(bar, -2), 0.5, base)
    timp.note(bar*B + 3,   D(5, -2),      1.0, base + 18)
    if s == 3:  # climax: driving quarters
        for b, v in [(1, 92), (1.5, 80), (3.5, 96)]:
            timp.note(bar*B + b, root(bar, -2), 0.45, v)

# ---------------- 战鼓组 ----------------
dr = p.track("wardrums", 0, drums=True, volume=112)
K, SN, TL, TM, TH = 36, 38, 41, 47, 50
CR, SH = 49, 82
for bar in range(BARS):
    s = sect(bar)
    kv = 68 + s * 12
    dr.note(bar*B + 0, K, 0.4, kv + 22)
    dr.note(bar*B + 2, K, 0.4, kv + 16)
    if s >= 1:
        dr.note(bar*B + 1, SN, 0.3, kv + 6)
        dr.note(bar*B + 3, SN, 0.3, kv + 10)
        dr.note(bar*B + 1.5, TL, 0.4, kv - 4)
        dr.note(bar*B + 3.5, TL, 0.4, kv)
    else:
        dr.note(bar*B + 1, TL, 0.4, kv + 4)
        dr.note(bar*B + 3, TL, 0.4, kv + 8)
    if s >= 2:  # shaker 8ths drive
        for i in range(8):
            dr.note(bar*B + i*0.5, SH, 0.2, 46 + (i % 2) * 12)
    if bar in (0, 4, 8, 12):
        dr.note(bar*B, CR, 0.5, [82, 96, 102, 112][(bar//4)])
    if bar in (3, 7, 11, 15):  # tom fill into next section / loop point
        for i, (dt, tm) in enumerate([(2, TH), (2.5, TM), (3, TM), (3.5, TL)]):
            dr.note(bar*B + dt, tm, 0.42, 82 + i * 8 + s * 3)

# ---------------- 低音提琴 drone：低频托底 ----------------
cb = p.track("contrabass", mg.GM['contrabass'], pan=64, volume=100)
for bar in range(BARS):
    cb.note(bar*B, root(bar, -2), 3.9, 82 + sect(bar) * 4)
    if sect(bar) == 3:  # climax octave pulse
        cb.note(bar*B + 2, root(bar, -1), 1.9, 88)

# ---------------- 大提琴断奏 ostinato：铁蹄推进 ----------------
vc = p.track("cello_ost", mg.GM['cello'], pan=38, volume=94)
PAT = [(0,1),(0.5,1),(1,5),(1.5,1),(2,1),(2.5,5),(3,1),(3.5,4)]
for bar in range(2, BARS):
    s = sect(bar)
    for i, (dt, dg) in enumerate(PAT):
        v = 66 + s * 6 + (10 if i % 2 == 0 else 0)
        vc.note(bar*B + dt, D(dg, -1) if dg != 0 else root(bar, -1), 0.42, v)

# ---------------- 拨弦反拍 ----------------
pizz = p.track("pizz", mg.GM['pizzicato_strings'], pan=90, volume=78)
for bar in range(4, BARS):
    ch = C(PROG[bar], 3, -1)
    for i, dt in enumerate([0.5, 1.5, 2.5, 3.5]):
        pizz.note(bar*B + dt, ch[(i + 1) % 3] + 12, 0.35, 52 + sect(bar) * 5)

# ---------------- 弦乐铺底（左右分轨 + 极端 pan） ----------------
stL = p.track("strings_lo", mg.GM['strings'], pan=14, volume=84)
stR = p.track("strings_hi", mg.GM['strings_slow'], pan=113, volume=80)
for bar in range(BARS):
    v = 50 + sect(bar) * 7
    stL.chord(bar*B, C(PROG[bar], 3, -1), 3.95, vel=v)
    stR.chord(bar*B, C(PROG[bar], 3, 0), 3.95, vel=v - 4)

# ---------------- 震音弦乐：紧张感 ----------------
trem = p.track("tremolo", mg.GM['tremolo_strings'], pan=100, volume=76)
for bar in range(BARS):
    if bar < 4:
        trem.chord(bar*B, C(1, 3, 0), 3.95, vel=36 + bar * 9)
    elif bar >= 12:
        trem.chord(bar*B, C(PROG[bar], 3, 0), 3.95, vel=82)

# ---------------- 合唱 ----------------
choir = p.track("choir", mg.GM['choir_aahs'], pan=64, volume=76)
for bar in range(2, BARS):
    choir.chord(bar*B, C(PROG[bar], 3, 0), 3.95, vel=40 + sect(bar) * 10)

# ---------------- 圆号：主题 A + 引子呼应 + 高潮和声 ----------------
hn = p.track("horn", mg.GM['french_horn'], pan=58, volume=102)
THEME_A = [  # (bar, beat, degree, dur, vel)  octave +1
    (4,0,1,2.0,96),(4,2,1,0.5,88),(4,2.5,3,0.5,90),(4,3,5,1.0,94),
    (5,0,6,2.5,98),(5,2.5,5,0.5,90),(5,3,4,1.0,92),
    (6,0,3,2.0,92),(6,2,4,1.0,90),(6,3,5,1.0,96),
    (7,0,2,3.0,100),(7,3,3,1.0,92),
]
for bar, bt, dg, dur, v in THEME_A:
    hn.note(bar*B + bt, D(dg, 1), dur * 0.96, v)
HARM = [  # climax lower harmony, octave 0
    (12,0,4,2.0,92),(12,2,3,2.0,90),
    (13,0,4,3.0,96),(13,3,3,1.0,90),
    (14,0,3,2.0,90),(14,2,2,2.0,88),
    (15,0,1,4.0,92),
]
for bar, bt, dg, dur, v in HARM:
    hn.note(bar*B + bt, D(dg, 0), dur * 0.96, v)

# ---------------- 铜管组：主题 B ----------------
brs = p.track("brass", mg.GM['brass_section'], pan=70, volume=98)
THEME_B = [
    (8,0,1,1.0,98),(8,1,3,1.0,98),(8,2,5,2.0,104),
    (9,0,6,2.5,106),(9,2.5,5,0.5,96),(9,3,4,1.0,98),
    (10,0,5,2.0,102),(10,2,3,1.0,96),(10,3,1,1.0,94),
    (11,0,4,3.0,104),(11,3,5,1.0,100),
]
for bar, bt, dg, dur, v in THEME_B:
    brs.note(bar*B + bt, D(dg, 1), dur * 0.96, v)

# ---------------- 小号：高潮旋律 ----------------
tp = p.track("trumpet", mg.GM['trumpet'], pan=76, volume=106)
CLIMAX = [
    (12,0,6,2.0,110),(12,2,5,1.0,100),(12,3,6,1.0,106),
    (13,0,7,3.0,112),(13,3,6,1.0,104),
    (14,0,5,2.0,106),(14,2,4,1.0,100),(14,3,3,1.0,100),
    (15,0,1,4.0,108),
]
for bar, bt, dg, dur, v in CLIMAX:
    tp.note(bar*B + bt, D(dg, 1), dur * 0.97, v)

# ---------------- 长号：引子召唤 + 和声重音 ----------------
tb = p.track("trombone", mg.GM['trombone'], pan=26, volume=96)
CALL = [(2,0,'D3',1.0,88),(2,2,'D3',1.0,94),(3,0,'F3',1.0,100),(3,1,'Eb3',1.0,100),(3,2,'D3',1.8,106)]
for bar, bt, nm, dur, v in CALL:
    tb.note(bar*B + bt, mg.note_to_midi(nm), dur, v)
for bar in range(4, BARS):
    stabs = [0, 2] if sect(bar) == 3 else [0]
    for bt in stabs:
        tb.chord(bar*B + bt, [root(bar, -1), D(5, -1)], 0.8, vel=80 + sect(bar) * 5)

# ---------------- 大号：根音重锤 ----------------
tuba = p.track("tuba", mg.GM['tuba'], pan=44, volume=90)
for bar in range(4, BARS):
    tuba.note(bar*B, root(bar, -2), 0.9, 84 + sect(bar) * 4)
    if sect(bar) == 3:
        tuba.note(bar*B + 2, root(bar, -2), 0.9, 90)

# ---------------- 管弦齐奏：段落重音 ----------------
hit = p.track("orch_hit", mg.GM['orchestra_hit'], pan=64, volume=100)
for bt, v in [(8*B, 100), (12*B, 112), (14*B, 105)]:
    hit.chord(bt, C(PROG[bt // B], 3, 0), 0.5, vel=v)

p.save(OUT)
print(f"OK {OUT} | bpm={BPM} bars={BARS} loop={p.loop_seconds:.1f}s")
