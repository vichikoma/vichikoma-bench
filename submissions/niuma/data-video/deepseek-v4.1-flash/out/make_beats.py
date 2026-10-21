# -*- coding: utf-8 -*-
"""make_beats.py — 由乐曲参数生成 out/beats.json。

速度 120 BPM ⇒ 每拍 0.500s，每小节 4 拍 = 2.000s，全曲 15 小节 = 30.000s。
成片里每一次切镜（0/2/6/10/14/18/22/26 秒）都落在小节第一拍上。
"""
import json
import os

BPM = 120
BEATS_PER_BAR = 4
BARS = 15
BEAT_SECONDS = 60.0 / BPM
TOTAL = BARS * BEATS_PER_BAR * BEAT_SECONDS          # 30.0

OUT = os.environ["OUT"]

beats = []
for i in range(BARS * BEATS_PER_BAR):
    t = round(i * BEAT_SECONDS, 6)
    beats.append({
        "index": i,                                  # 从 0 开始的拍号
        "time": t,                                   # 该拍的时间点（秒）
        "bar": i // BEATS_PER_BAR + 1,               # 第几小节（1 起）
        "beat_in_bar": i % BEATS_PER_BAR + 1,        # 小节内第几拍（1 起）
        "is_downbeat": i % BEATS_PER_BAR == 0,       # 是否小节第一拍
    })

data = {
    "source": "project/music/compose_bgm.py",
    "bpm": BPM,
    "beats_per_bar": BEATS_PER_BAR,
    "bars": BARS,
    "beat_seconds": round(BEAT_SECONDS, 6),
    "duration_seconds": round(TOTAL, 3),
    "count": len(beats),
    "downbeats": [b["time"] for b in beats if b["is_downbeat"]],
    "beats": beats,
    "cuts": {
        "note": "成片每一次切镜都落在下列拍点上（均为小节第一拍）",
        "times": [0.0, 2.0, 6.0, 10.0, 14.0, 18.0, 22.0, 26.0, 30.0],
    },
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("OK %s | %d 拍 / %.1fs / 每拍 %.3fs" % (OUT, len(beats), TOTAL, BEAT_SECONDS))
