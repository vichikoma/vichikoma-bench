# -*- coding: utf-8 -*-
"""由 BGM 的 BPM/拍数生成 beats.json（与 bgm.mid 完全同源：120 BPM × 60 拍）。
beats.json: 每拍的绝对时间（秒）+ 小节号 + 是否小节第一拍（downbeat）。
"""
import json

BPM = 120.0
TOTAL_BEATS = 60          # 15 小节 × 4 拍 = 60 拍 = 30.0 秒
SPB = 60.0 / BPM          # 0.5 秒/拍

beats = []
for i in range(TOTAL_BEATS):
    beats.append({
        'beat': i,
        'time_sec': round(i * SPB, 3),
        'bar': i // 4 + 1,
        'beat_in_bar': i % 4 + 1,
        'downbeat': i % 4 == 0,
    })

out = {
    'bpm': BPM,
    'fps': 30,
    'frames_per_beat': int(round(30 * SPB)),   # 15
    'total_beats': TOTAL_BEATS,
    'duration_sec': round(TOTAL_BEATS * SPB, 3),
    'beats': beats,
}
with open('out/beats.json', 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print('beats.json written,', len(beats), 'beats,', out['duration_sec'], 'sec')
