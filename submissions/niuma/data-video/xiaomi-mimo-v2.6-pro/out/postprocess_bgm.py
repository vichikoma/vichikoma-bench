#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
postprocess_bgm.py —— BGM 母带：
  1) M/S 立体声展宽（目标 L/R 相关度 0.6~0.85）
  2) 精确裁切到 30.000s（= 成片时长）
  3) 末尾 28.6–30.0s 余弦淡出（配合小节 15 的收束大 hit，自然收尾）
  4) 峰值归一化到 0.89
"""
import os, sys, wave
import numpy as np

RAW = sys.argv[1]
OUT = sys.argv[2]
DUR = 30.0
WIDTH = 1.45
FADE_START, FADE_END = 28.6, 30.0
PEAK = 0.89

with wave.open(RAW, "rb") as w:
    rate, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
    data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768.0
x = data.reshape(-1, ch)

# M/S 展宽
mid = (x[:, 0] + x[:, 1]) / 2.0
side = (x[:, 0] - x[:, 1]) / 2.0 * WIDTH
x = np.stack([mid + side, mid - side], axis=1)

# 裁切到 30s
n = int(round(DUR * rate))
x = x[:n]
if len(x) < n:
    x = np.vstack([x, np.zeros((n - len(x), 2))])

# 淡出（余弦）+ 起始 5ms 防爆音
t = np.arange(n) / rate
env = np.ones(n)
m = t >= FADE_START
env[m] = 0.5 * (1 + np.cos(np.pi * np.clip((t[m] - FADE_START) / (FADE_END - FADE_START), 0, 1)))
env[t < 0.005] = t[t < 0.005] / 0.005
x *= env[:, None]

# 归一化
peak = np.max(np.abs(x))
if peak > 0:
    x *= PEAK / peak

pcm = np.clip(x * 32767, -32768, 32767).astype(np.int16)
with wave.open(OUT, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(rate)
    w.writeframes(pcm.tobytes())

L, R = x[:, 0], x[:, 1]
corr = float(np.corrcoef(L, R)[0, 1])
rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print(f"OK {OUT} | {n / rate:.3f}s rate={rate} | peak={np.max(np.abs(x)):.3f} rms={rms:.1f}dB corr={corr:.3f}")
