# -*- coding: utf-8 -*-
"""牛马咖啡 2026Q3 经营短片 BGM —— 作曲脚本（music-gen / musiclib）

规格：120 BPM，15 小节 4/4，共 60 拍 = 恰好 30.0 秒。
每拍 0.5s = 15 帧@30fps；画面所有切镜都落在这张拍点网格上。
风格：热血弹跳的流行摇滚/卡通电子，Am-F-C-G 循环（B 站开场味）。
结构：bars1-2 引入 / 3-6 主 riff A / 7-10 高八度 B / 11-13 蓄势爬升 / 14-15 终章定音。
"""
import os, sys

LIBDIR = os.environ["LIBDIR"]
sys.path.insert(0, LIBDIR)
import musiclib as mg

BPM, BARS = 120, 15
p = mg.Piece(bpm=BPM, bars=BARS)

def N(name):  # 'A5' -> midi
    return mg.note_to_midi(name)

# 每小节的和弦（循环 Am F C G）
CHORDS = ['Am', 'F', 'C', 'G']
ROOT = {'Am': 45, 'F': 41, 'C': 48, 'G': 43}          # 贝斯根音（低八度）
STAB = {'Am': [57, 60, 64], 'F': [53, 57, 60],        # 中声部三和弦
        'C': [48, 52, 55], 'G': [55, 59, 62]}
PAD = {'Am': [57, 64, 69], 'F': [53, 60, 65],
       'C': [55, 60, 67], 'G': [55, 62, 67]}

def bar_beat(bar, b):      # bar: 0..14, b: 拍内位置 0..3.5 → 全局拍
    return bar * 4 + b

# ---------------- 音轨 ----------------
pad = p.track('pad', mg.GM['warm_pad'], pan=64, volume=62)
bass = p.track('bass', mg.GM['synth_bass'], pan=52, volume=104)
piano = p.track('piano stab', mg.GM['bright_piano'], pan=10, volume=96)
arp = p.track('arp', mg.GM['electric_piano'], pan=120, volume=92)
lead = p.track('lead', mg.GM['square_lead'], pan=72, volume=100)
glock = p.track('glock', mg.GM['glockenspiel'], pan=112, volume=98)
drums = p.track('drums', 0, drums=True, volume=110)

# ---------------- 和声垫：每小节铺满 ----------------
for bar in range(BARS):
    ch = CHORDS[bar % 4]
    pad.chord(bar_beat(bar, 0), PAD[ch], 4, vel=58)

# ---------------- 贝斯：8 分驱动，段落递进 ----------------
for bar in range(BARS):
    ch = CHORDS[bar % 4]
    r = ROOT[ch]
    if bar < 1:
        continue
    if bar < 2:
        bass.note(bar_beat(bar, 0), r, 3.5, 92)
        continue
    for b in (0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5):
        v = 100 if b in (0, 2) else 84
        oc = 12 if b in (1.5, 3.5) else 0
        bass.note(bar_beat(bar, b), r + oc, 0.45, v)

# ---------------- 钢琴反拍 stab（3-13 小节） ----------------
for bar in range(2, 13):
    ch = CHORDS[bar % 4]
    for b in (0.5, 1.5, 2.5, 3.5):
        piano.chord(bar_beat(bar, b), STAB[ch], 0.4, vel=86)

# ---------------- 电钢 16 分轮动（爬升段 11-13 小节加密） ----------------
for bar in range(10, 13):
    ch = CHORDS[bar % 4]
    for b in (0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75):
        arp.note(bar_beat(bar, b), STAB[ch][(int(b * 4)) % 3] + 12, 0.22, 78)

# ---------------- 主旋律 riff ----------------
# A riff（3-6 小节），按循环内小节位置给出：(音名, 拍, 时长, 力度)
RIFF = {
    0: [('A5', 0, .5, 100), ('A5', .5, .5, 88), ('E5', 1, 1, 96),
        ('C6', 2, 1, 104), ('A5', 3, .5, 90), ('G5', 3.5, .5, 86)],
    1: [('F5', 0, .5, 100), ('F5', .5, .5, 88), ('A5', 1, 1, 100),
        ('G5', 2, .5, 92), ('F5', 2.5, .5, 86), ('C5', 3, 1, 96)],
    2: [('G5', 0, .5, 100), ('G5', .5, .5, 88), ('E5', 1, 1, 96),
        ('D5', 2, .5, 90), ('C5', 2.5, .5, 86), ('E5', 3, 1, 98)],
    3: [('D5', 0, .75, 100), ('G5', 1, 1, 104), ('D5', 2, .5, 90),
        ('B4', 2.5, .5, 86), ('A4', 3, .5, 90), ('B4', 3.5, .5, 92)],
}
for bar in range(2, 6):                                   # 段 A
    for nm, b, d, v in RIFF[bar % 4]:
        lead.note(bar_beat(bar, b), N(nm), d, v)
for bar in range(6, 10):                                  # 段 B：高八度
    for nm, b, d, v in RIFF[bar % 4]:
        lead.note(bar_beat(bar, b), N(nm) + 12, d, min(v + 4, 120))
# 11-12 小节：抽稀蓄力（长音）
for bar in (10, 11):
    nm, b, d, v = RIFF[bar % 4][3] if bar == 10 else RIFF[1][2]
    lead.note(bar_beat(bar, 0), N(nm) + (0 if bar == 10 else 12), 2, 96)
# 13 小节：爬升音阶（8 分）
SC = ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']
for i, nm in enumerate(SC):
    lead.note(bar_beat(12, i * 0.5), N(nm), 0.45, 92 + i * 2)
# 14-15 小节：终句 —— 高 A 站住，回落到中音区收束
lead.note(bar_beat(13, 0), N('A6'), 2, 112)
lead.note(bar_beat(13, 2), N('E6'), 1.5, 104)
lead.note(bar_beat(13, 3.5), N('C6'), .5, 96)
lead.note(bar_beat(14, 0), N('A5'), 3, 110)
lead.note(bar_beat(14, 2), N('E5'), 2, 96)

# ---------------- 钟琴点缀：段落头 + 终章碎花 ----------------
for bar in (0, 2, 6, 10, 13, 14):
    glock.note(bar_beat(bar, 0), N('A5') + 12, .8, 96)
for i, nm in enumerate(['E5', 'A5', 'C6', 'E6']):           # 终章琶音
    glock.note(56 + i * 0.5, N(nm), 0.9, 92)

# ---------------- 鼓 ----------------
D = mg.DRUMS
def kick(b, v=110): drums.note(b, D['kick'], .3, v)
def snare(b, v=102): drums.note(b, D['snare'], .3, v)
def hat(b, v=68, open_=False): drums.note(b, D['hh_open' if open_ else 'hh_closed'], .3, v)
def crash(b, v=104): drums.note(b, D['crash'], 1, v)
def tom(b, p, v=100): drums.note(b, p, .3, v)

# bar1：四分之一 kick + 渐强军鼓引入 bar3
for bar in range(2):
    kick(bar_beat(bar, 0)); kick(bar_beat(bar, 2))
    if bar == 1:
        for i in range(8):
            snare(bar_beat(1, i * 0.5), 60 + i * 6)
crash(0)
# 主 groove：bars3-10（含过鼓）
for bar in range(2, 10):
    crash(bar_beat(bar, 0)) if bar in (2, 6) else None
    kick(bar_beat(bar, 0)); kick(bar_beat(bar, 1.5)); kick(bar_beat(bar, 2.5))
    snare(bar_beat(bar, 1)); snare(bar_beat(bar, 3))
    for b in (0, .5, 1, 1.5, 2, 2.5, 3):
        hat(bar_beat(bar, b), 70 if b % 1 == 0 else 54)
    hat(bar_beat(bar, 3.5), 76, open_=True)
    if bar == 9:   # 段落过鼓
        tom(36, D['tom_high']); tom(36.5, D['tom_mid'], 94); tom(37, D['tom_low'], 90)
# bars11-12：抽稀（只留心跳 + 8 分镲）
for bar in range(10, 12):
    kick(bar_beat(bar, 0)); kick(bar_beat(bar, 2))
    for b in (0, .5, 1, 1.5, 2, 2.5, 3, 3.5):
        hat(bar_beat(bar, b), 58)
    snare(bar_beat(bar, 3), 88)
# bar13：渐密军鼓爬升
for b in (0, .5, 1, 1.5, 2, 2.5, 3, 3.5):
    hat(bar_beat(12, b), 64)
    snare(bar_beat(12, b), 70 + b * 6)
kick(bar_beat(12, 2), 100)
# bars14-15：终章全开
crash(52); crash(56)
for bar in (13, 14):
    kick(bar_beat(bar, 0)); kick(bar_beat(bar, 1.5)); kick(bar_beat(bar, 2.5))
    snare(bar_beat(bar, 1)); snare(bar_beat(bar, 3))
    for b in (0, .5, 1, 1.5, 2, 2.5, 3):
        hat(bar_beat(bar, b), 72 if b % 1 == 0 else 56)
    hat(bar_beat(bar, 3.5), 78, open_=True)
kick(56, 118); snare(56, 108)

# ---------------- 保存 ----------------
out = os.environ.get('OUT_MID', 'bgm.mid')
p.save(out)
print('saved', out, '| loop_seconds =', p.loop_seconds)
