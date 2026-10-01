import sys, os
sys.path.insert(0, os.environ["LIBDIR"])
import musiclib as mg

# 冬夜海港夜市 BGM
# F大调，BPM96，16小节 = 40秒，4/4拍
BPM = 96
BARS = 16
p = mg.Piece(bpm=BPM, bars=BARS)

# === 音阶与和弦定义 ===
# F大调音阶: F G A Bb C D E
SCALE = [0,2,4,5,7,9,11]  # 相对于F的半音
TONIC = mg.note_to_midi('F4')  # 主音基准

def deg(d, oct=0):
    return mg.deg(SCALE, TONIC, d, oct)

# 和声进行（16小节，每小节一个和弦，最后两小节做循环预备）
# Fmaj7 - Dm7 - Gm7 - C7 - Fmaj7 - Bbmaj7 - Am7 - Dm7 - Gm7 - C7 - Fmaj7 - Dm7 - Gm7 - C7 - Fmaj7 - F/C
chord_prog = [
    ('F', 'maj7', 0),
    ('D', 'min7', -1),
    ('G', 'min7', -1),
    ('C', '7', -1),
    ('F', 'maj7', 0),
    ('Bb', 'maj7', -1),
    ('A', 'min7', -1),
    ('D', 'min7', -1),
    ('G', 'min7', -1),
    ('C', '7', -1),
    ('F', 'maj7', 0),
    ('D', 'min7', -1),
    ('G', 'min7', -1),
    ('C', '7', -1),
    ('F', 'maj7', 0),
    ('F', 'maj7', 1),  # 第二转位，低音C引回开头，循环流畅
]

# 和弦根音MIDI
root_map = {'F': mg.note_to_midi('F3'), 'D': mg.note_to_midi('D3'), 
            'G': mg.note_to_midi('G2'), 'C': mg.note_to_midi('C3'),
            'Bb': mg.note_to_midi('Bb2'), 'A': mg.note_to_midi('A2')}

# 七和弦结构: maj7=[0,4,7,11], min7=[0,3,7,10], 7=[0,4,7,10]
chord_type = {'maj7': [0,4,7,11], 'min7': [0,3,7,10], '7': [0,4,7,10]}

# === 1. 钢琴主奏（温暖明亮，主奏旋律+和弦伴奏） ===
piano = p.track('Piano', mg.GM['piano'], pan=42, volume=72)

# 主奏旋律（在和弦音上创作，温馨治愈的曲调）
melody = [
    # bar 0 Fmaj7
    (0+0, deg(1,0), 1, 70), (0+1, deg(3,0), 1, 68), (0+2, deg(5,0), 2, 72),
    # bar 1 Dm7
    (4+0, deg(3,0), 1, 65), (4+1, deg(5,0), 1, 68), (4+2, deg(6,0), 2, 70),
    # bar 2 Gm7
    (8+0, deg(7,-1), 1, 62), (8+1, deg(2,0), 1, 65), (8+2, deg(4,0), 2, 68),
    # bar 3 C7
    (12+0, deg(5,0), 1, 68), (12+1, deg(7,0), 1, 70), (12+2, deg(4,1), 2, 75),
    # bar 4 Fmaj7
    (16+0, deg(1,1), 2, 76), (16+2, deg(7,0), 2, 70),
    # bar 5 Bbmaj7
    (20+0, deg(6,0), 1, 68), (20+1, deg(4,0), 1, 68), (20+2, deg(1,0), 2, 65),
    # bar 6 Am7
    (24+0, deg(3,0), 1, 65), (24+1, deg(5,0), 1, 66), (24+2, deg(6,0), 2, 68),
    # bar 7 Dm7
    (28+0, deg(1,0), 1, 62), (28+1, deg(4,0), 1, 65), (28+2, deg(5,0), 2, 66),
    # bar 8 Gm7
    (32+0, deg(7,-1), 2, 64), (32+2, deg(2,0), 2, 66),
    # bar 9 C7
    (36+0, deg(3,0), 1, 68), (36+1, deg(5,0), 1, 70), (36+2, deg(2,1), 2, 74),
    # bar10 Fmaj7
    (40+0, deg(5,0), 1, 70), (40+1, deg(3,0), 1, 68), (40+2, deg(1,0), 2, 72),
    # bar11 Dm7
    (44+0, deg(6,0), 1, 68), (44+1, deg(5,0), 1, 66), (44+2, deg(3,0), 2, 65),
    # bar12 Gm7
    (48+0, deg(4,0), 1, 66), (48+1, deg(2,0), 1, 64), (48+2, deg(7,-1), 2, 63),
    # bar13 C7
    (52+0, deg(5,0), 2, 68), (52+2, deg(7,0), 2, 70),
    # bar14 Fmaj7
    (56+0, deg(1,0), 1, 70), (56+1, deg(5,0), 1, 68), (56+2, deg(3,0), 2, 66),
    # bar15 Fmaj7/C (预备循环回开头)
    (60+0, deg(5,0), 2, 65), (60+2, deg(1,0), 2, 63),
]
for t, n, d, v in melody:
    piano.note(t, n, d, v)

# 钢琴右手轻和弦铺底（每小节弱拍轻触）
for bar in range(BARS):
    root, typ, inv = chord_prog[bar]
    base = root_map[root]
    c_notes = [base + i for i in chord_type[typ]]
    # 高两个八度，轻力度分解
    c_notes_high = [n + 24 for n in c_notes]
    piano.chord(bar*4 + 3, c_notes_high, 1, vel=38)

# === 2. 钟琴 / 钢片琴（像夜空中闪烁的灯光，装饰音，点缀） ===
bells = p.track('Bells', mg.GM['glockenspiel'], pan=110, volume=48)
# 每小节第1/4拍后加一个高音装饰音，像星光闪烁
bell_notes = [
    (0+3, deg(5,1), 0.5, 45), (0+3.5, deg(1,2), 0.5, 40),
    (4+3, deg(6,1), 0.5, 42), (4+3.5, deg(3,1), 0.5, 38),
    (8+3, deg(7,1), 0.5, 42), (8+3.5, deg(2,1), 0.5, 38),
    (12+3, deg(4,2), 0.5, 48), (12+3.5, deg(5,1), 0.5, 40),
    (16+3, deg(1,2), 0.5, 46), (16+3.5, deg(5,1), 0.5, 40),
    (20+3, deg(4,1), 0.5, 40), (20+3.5, deg(6,1), 0.5, 38),
    (24+3, deg(5,1), 0.5, 42), (24+3.5, deg(3,1), 0.5, 38),
    (28+3, deg(1,1), 0.5, 40), (28+3.5, deg(4,1), 0.5, 38),
    (32+3, deg(2,1), 0.5, 40), (32+3.5, deg(7,0), 0.5, 36),
    (36+3, deg(7,1), 0.5, 45), (36+3.5, deg(2,2), 0.5, 42),
    (40+3, deg(1,1), 0.5, 42), (40+3.5, deg(5,1), 0.5, 38),
    (44+3, deg(3,1), 0.5, 40), (44+3.5, deg(6,1), 0.5, 36),
    (48+3, deg(7,0), 0.5, 38), (48+3.5, deg(4,1), 0.5, 36),
    (52+3, deg(5,1), 0.5, 42), (52+3.5, deg(7,1), 0.5, 40),
    (56+3, deg(3,1), 0.5, 40), (56+3.5, deg(1,1), 0.5, 38),
    (60+3, deg(1,0), 0.5, 36), (60+3.5, deg(5,0), 0.5, 34),
]
for t, n, d, v in bell_notes:
    bells.note(t, n, d, v)

# === 3. 指弹电贝斯（低音线条，像水波荡漾） ===
bass = p.track('Bass', mg.GM['finger_bass'], pan=62, volume=75)

# === 3.5 低音提琴（补超低频，让冬夜水面更厚重温暖） ===
contrabass = p.track('Contrabass', mg.GM['contrabass'], pan=50, volume=65)
for bar in range(BARS):
    root, typ, inv = chord_prog[bar]
    base = root_map[root] - 24  # 比贝斯再低一个八度，直达40-80Hz超低频
    contrabass.note(bar*4, base, 4, vel=62)
for bar in range(BARS):
    root, typ, inv = chord_prog[bar]
    base = root_map[root]
    # 每个小节根音 + 五度 + 过渡音，营造水波流动感
    bass.note(bar*4, base, 2, 75)
    bass.note(bar*4+2, base+7, 1, 65)
    if bar < BARS-1:
        next_root = chord_prog[bar+1][0]
        nr = root_map[next_root]
        bass.note(bar*4+3, (base + nr)//2 if abs(nr-base)<=5 else base+12, 1, 60)
    else:
        # 最后一小节低音落到C，接回开头的F形成完美循环
        bass.note(bar*4+3, mg.note_to_midi('C3'), 1, 60)

# === 4. 鼓组（轻刷鼓，如船在水面轻晃） ===
drums = p.track('Drums', 0, pan=20, volume=42, drums=True)
# 轻踩镲八分音符（刷镲感，音高42=闭合踩镲）
for bar in range(BARS):
    for beat in range(8):  # 每拍两个八分音符
        t = bar*4 + beat*0.5
        v = 42 if beat % 2 == 0 else 35
        drums.note(t, 42, 0.4, v)
# 军鼓轻击2、4拍（40=电鼓边击，轻柔）
for bar in range(BARS):
    drums.note(bar*4+1, 37, 0.5, 30)  # snare rim 边击，轻柔
    drums.note(bar*4+3, 37, 0.5, 30)
# 底鼓轻1、3拍
for bar in range(BARS):
    drums.note(bar*4, 36, 0.5, 45)
    drums.note(bar*4+2, 36, 0.5, 40)

# === 5. 弦乐Pad铺底（温暖空气感，营造夜空氛围） ===
pad = p.track('Pad', mg.GM['warm_pad'], pan=90, volume=55)
for bar in range(BARS):
    root, typ, inv = chord_prog[bar]
    base = root_map[root]
    c_notes = [base + i for i in chord_type[typ]]
    c_notes_mid = [n + 12 for n in c_notes]  # 中八度
    pad.chord(bar*4, c_notes_mid, 4, vel=45)

# 保存MIDI
out = os.environ["OUT_MID"]
os.makedirs(os.path.dirname(out), exist_ok=True)
p.save(out)
print(f"MIDI saved: {out}")
print(f"BPM={BPM}, BARS={BARS}, loop seconds = {BARS*4/BPM*60:.1f}s")
