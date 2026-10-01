#!/usr/bin/env python
"""track01 - Lantern Drift
16 小节,D 多利亚,90 BPM,循环约 42.7s.
画面:星露谷夜市的紫灯船+木栈道+水面灯笼——静谧又带节日暖意.
"""
import os, sys
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

# ============================================================ 可调参数
# D 多利亚: D E F G A B C  (相对主音半音数,一个八度内,升序)
SCALE  = [0, 2, 3, 5, 7, 9, 10]
TONIC  = mg.note_to_midi('D3')    # 主音 D3
BPM    = 90
BARS   = 16
BPB    = 4

# 和声进行(每小节一个和弦级数,在 D 多利亚里)
# 1=Dm(i) 2=Em(ii) 3=F(III) 4=G(IV) 5=Am(v) 6=Bb(bVI) 7=C(bVII)
# Dm-C-Bb-F-Dm-Em-F-C  两遍,共 16 小节,结尾停在 C (bVII) -> 下一轮 Dm 形成 V-i 解决
PROG = [1, 7, 6, 3, 1, 2, 3, 7] * 2

def D(degree, octave=0):
    return mg.deg(SCALE, TONIC, degree, octave)

def C(degree, size=3, octave=0):
    return mg.chord_of(SCALE, TONIC, degree, size=size, octave=octave)

# 和弦构造(每音一个八度内,后续用 octave 调整)
CHORDS_BASE = {
    1: [1, 3, 5],   # Dm: D F A
    2: [2, 4, 6],   # Em: E G B
    3: [3, 5, 7],   # F:  F A C
    4: [4, 6, 1],   # G:  G B D
    5: [5, 7, 2],   # Am: A C E
    6: [6, 1, 3],   # Bb: Bb D F   (degree 6 in D = B natural, 减半音 -> Bb)
    7: [7, 2, 4],   # C:  C E G
}
# 修正:Bb 的音: Bb = 主音下方小六度,mid(D3)=50,Bb2=46. 我们用 degree=6 但要做 ♭.
# 简单做法: 直接用 mg.chord_of 给出 1+♭ 的音(D Dorian 的 bVI 是 Bb, 即主音上方小六度)
# 用显式音高列表避免歧义
CHORD_PITCHES = {
    # bar : list of 4 notes spanning low-to-high (琴上呈现的音,用于竖琴/弦乐)
    1: [mg.note_to_midi('D3'), mg.note_to_midi('F3'), mg.note_to_midi('A3'), mg.note_to_midi('D4')],  # Dm
    2: [mg.note_to_midi('C3'), mg.note_to_midi('E3'), mg.note_to_midi('G3'), mg.note_to_midi('C4')],  # C
    3: [mg.note_to_midi('A2'), mg.note_to_midi('D3'), mg.note_to_midi('F3'), mg.note_to_midi('A3')],  # Bb (=Bb2,D3,F3,A3)
    4: [mg.note_to_midi('F2'), mg.note_to_midi('A2'), mg.note_to_midi('C3'), mg.note_to_midi('F3')],  # F
    5: [mg.note_to_midi('D3'), mg.note_to_midi('F3'), mg.note_to_midi('A3'), mg.note_to_midi('D4')],  # Dm (重复 1)
    6: [mg.note_to_midi('E3'), mg.note_to_midi('G3'), mg.note_to_midi('B3'), mg.note_to_midi('E4')],  # Em
    7: [mg.note_to_midi('F2'), mg.note_to_midi('A2'), mg.note_to_midi('C3'), mg.note_to_midi('F3')],  # F (重复 4)
    8: [mg.note_to_midi('C3'), mg.note_to_midi('E3'), mg.note_to_midi('G3'), mg.note_to_midi('C4')],  # C (重复 2)
}
# 根音(贝斯用,低八度)
BASS_ROOTS = {
    1: mg.note_to_midi('D2'),
    2: mg.note_to_midi('C2'),
    3: mg.note_to_midi('A1'),   # Bb2 在低八度 = A#1
    4: mg.note_to_midi('F1'),
    5: mg.note_to_midi('D2'),
    6: mg.note_to_midi('E2'),
    7: mg.note_to_midi('F1'),
    8: mg.note_to_midi('C2'),
}
# 五音(贝斯第二拍)
BASS_FIFTHS = {
    1: mg.note_to_midi('A2'),
    2: mg.note_to_midi('G2'),
    3: mg.note_to_midi('F2'),
    4: mg.note_to_midi('C3'),
    5: mg.note_to_midi('A2'),
    6: mg.note_to_midi('B2'),
    7: mg.note_to_midi('C3'),
    8: mg.note_to_midi('G2'),
}

# ============================================================ 主旋律(音乐盒)
# (bar, beat, dur_beats, midi_pitch, vel)
# 高音区 D5..C6,用的是 D 多利亚 + 一些经过音
def M(bar, beat, dur, pitch, vel=80):
    return (bar, beat, dur, pitch, vel)

# 句 A (1-8)  起伏不大,以 F5/A5 为主音域
MELODY_A = [
    # bar 1 (Dm): F A - G F  |  E .  .  .
    M(0, 0.0, 1.0, mg.note_to_midi('F5'), 78),
    M(0, 1.0, 1.0, mg.note_to_midi('A5'), 82),
    M(0, 2.0, 0.5, mg.note_to_midi('G5'), 76),
    M(0, 2.5, 0.5, mg.note_to_midi('F5'), 74),
    M(0, 3.0, 1.0, mg.note_to_midi('E5'), 70),
    # bar 2 (C): E G - F E  |  D .  .  .
    M(1, 0.0, 1.0, mg.note_to_midi('E5'), 78),
    M(1, 1.0, 1.0, mg.note_to_midi('G5'), 82),
    M(1, 2.0, 0.5, mg.note_to_midi('F5'), 76),
    M(1, 2.5, 0.5, mg.note_to_midi('E5'), 74),
    M(1, 3.0, 1.0, mg.note_to_midi('D5'), 70),
    # bar 3 (Bb): D F - A G  |  F .  .  .
    M(2, 0.0, 1.0, mg.note_to_midi('D5'), 78),
    M(2, 1.0, 1.0, mg.note_to_midi('F5'), 80),
    M(2, 2.0, 0.5, mg.note_to_midi('A5'), 82),
    M(2, 2.5, 0.5, mg.note_to_midi('G5'), 78),
    M(2, 3.0, 1.0, mg.note_to_midi('F5'), 70),
    # bar 4 (F): A C6 - B A  |  G .  .  .   (B5 是 Dorian 色彩音)
    M(3, 0.0, 1.0, mg.note_to_midi('A5'), 80),
    M(3, 1.0, 1.0, mg.note_to_midi('C6'), 86),
    M(3, 2.0, 0.5, mg.note_to_midi('B5'), 80),
    M(3, 2.5, 0.5, mg.note_to_midi('A5'), 76),
    M(3, 3.0, 1.0, mg.note_to_midi('G5'), 70),
    # bar 5 (Dm): F A - c6 b5 |  a5 .  .  .
    M(4, 0.0, 1.0, mg.note_to_midi('F5'), 78),
    M(4, 1.0, 1.0, mg.note_to_midi('A5'), 82),
    M(4, 2.0, 0.5, mg.note_to_midi('C6'), 84),
    M(4, 2.5, 0.5, mg.note_to_midi('B5'), 80),
    M(4, 3.0, 1.0, mg.note_to_midi('A5'), 74),
    # bar 6 (Em): G F - E D  |  E .  .  .
    M(5, 0.0, 1.0, mg.note_to_midi('G5'), 78),
    M(5, 1.0, 1.0, mg.note_to_midi('F5'), 76),
    M(5, 2.0, 0.5, mg.note_to_midi('E5'), 74),
    M(5, 2.5, 0.5, mg.note_to_midi('D5'), 72),
    M(5, 3.0, 1.0, mg.note_to_midi('E5'), 70),
    # bar 7 (F): A C6 - B G  |  A .  .  .
    M(6, 0.0, 1.0, mg.note_to_midi('A5'), 80),
    M(6, 1.0, 1.0, mg.note_to_midi('C6'), 86),
    M(6, 2.0, 0.5, mg.note_to_midi('B5'), 80),
    M(6, 2.5, 0.5, mg.note_to_midi('G5'), 76),
    M(6, 3.0, 1.0, mg.note_to_midi('A5'), 74),
    # bar 8 (C): E G - D .  |  . .  .  .
    M(7, 0.0, 1.0, mg.note_to_midi('E5'), 78),
    M(7, 1.0, 1.0, mg.note_to_midi('G5'), 82),
    M(7, 2.0, 2.0, mg.note_to_midi('D5'), 76),
]

# 句 B (9-16) - 句 A 的高八度变体,加一点经过音
MELODY_B = []
for bar, beat, dur, pitch, vel in MELODY_A:
    MELODY_B.append((bar + 8, beat, dur, pitch + 12 if pitch < mg.note_to_midi('C6') else pitch, vel + 2))
# 在 B 句中段加点装饰,丰富听感
# bar 11 (Bb) 加一个经过音 D5 -> D6? 不要拉太远,加在 bar 12 (F) 末位一个上行
# 已在变体中体现,不再额外加
MELODY = MELODY_A + MELODY_B

# ============================================================ 钢片琴闪烁 (celesta)
# 在主旋律空拍处点缀几个高音,营造"灯火光斑"
# 偶数小节(2,4,6,8,10,12,14,16) 第 3 拍加一个高音
SHIMMER = [
    # bar(0-based), beat, dur, pitch, vel
    (1, 2.5, 0.5, mg.note_to_midi('C6'), 70),
    (3, 2.5, 0.5, mg.note_to_midi('D6'), 72),
    (5, 2.5, 0.5, mg.note_to_midi('G5'), 68),
    (7, 2.5, 0.5, mg.note_to_midi('B5'), 70),
    (9, 2.5, 0.5, mg.note_to_midi('C7'), 74),
    (11, 2.5, 0.5, mg.note_to_midi('D6'), 72),
    (13, 2.5, 0.5, mg.note_to_midi('G6'), 70),
    (15, 2.5, 0.5, mg.note_to_midi('A5'), 68),
]

# ============================================================ 建曲子
p = mg.Piece(bpm=BPM, bars=BARS, beats_per_bar=BPB)

# 1) 低频玻璃垫(bowed glass) —— 极弱的 D2 + A2 长音,只为了让开头不会 -40dB
drone = p.track("drone", mg.GM['bowed_glass'], pan=64, volume=70)
drone.note(0.0, mg.note_to_midi('D2'), BARS * BPB + 4.0, 52)
drone.note(0.0, mg.note_to_midi('A2'), BARS * BPB + 4.0, 46)

# 2) 弦乐垫(strings slow) —— 每小节一个长和弦,贯穿全曲
strngs = p.track("strings", mg.GM['strings_slow'], pan=64, volume=85)
for bar in range(BARS):
    deg = PROG[bar]
    pitches = CHORD_PITCHES[deg]   # 4 个音
    # 在中音区: +12 让弦乐听起来更亮一点; 实际偏移一次即可
    # 不偏移:保持在 D3..F4 这个弦乐最温暖的音域
    strngs.chord(bar * BPB, pitches, BPB * 0.95, vel=68)

# 3) 贝斯(acoustic bass) —— 根音 + 五音
bass = p.track("bass", mg.GM['acoustic_bass'], pan=70, volume=90)
for bar in range(BARS):
    deg = PROG[bar]
    root  = BASS_ROOTS[deg]
    fifth = BASS_FIFTHS[deg]
    bass.note(bar * BPB + 0.0, root,  2.0, 86)
    bass.note(bar * BPB + 2.0, fifth, 2.0, 78)

# 4) 竖琴(harp) —— 每小节做 8 个音的琶音,1 拍 1 音,模拟水面波纹
# 极端左 pan
harp = p.track("harp", mg.GM['harp'], pan=28, volume=78)
for bar in range(BARS):
    deg = PROG[bar]
    pitches = CHORD_PITCHES[deg]   # 4 个音 [low..high]
    # 琶音上行再下行,共 8 步; 力度起伏
    order = [0, 1, 2, 3, 2, 1, 2, 3]   # 0..3..1..3
    for i, idx in enumerate(order):
        p_pitch = pitches[idx] + 12   # 整体高一个八度更晶莹
        vel = 60 + (i % 4) * 2
        harp.note(bar * BPB + i * 0.5, p_pitch, 0.5, vel)

# 5) 音乐盒(music box) —— 主旋律,极端右 pan
mb = p.track("musicbox", mg.GM['music_box'], pan=104, volume=100)
for bar, beat, dur, pitch, vel in MELODY:
    mb.note(bar * BPB + beat, pitch, dur, vel)

# 6) 钢片琴(celesta) —— 高音闪烁,左侧偏高
cl = p.track("celesta_shimmer", mg.GM['celesta'], pan=34, volume=82)
for bar, beat, dur, pitch, vel in SHIMMER:
    cl.note(bar * BPB + beat, pitch, dur, vel)

# ============================================================ 保存
OUT = os.environ.get("OUT_MID", "track01.mid")
p.save(OUT)
print(f"OK {OUT} | D Dorian | bpm={BPM} bars={BARS} loop={p.loop_seconds:.2f}s")
