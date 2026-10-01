"""快速诊断:画波形+频谱,看循环点和能量分布."""
import numpy as np
import wave
import struct

wav_path = r"C:\Users\whales\AppData\Roaming\slimory-team\agents\none4\storage\bgm\track01.wav"

with wave.open(wav_path, 'rb') as w:
    nch = w.getnchannels()
    sr = w.getframerate()
    nf = w.getnframes()
    raw = w.readframes(nf)

pcm = np.frombuffer(raw, dtype=np.int16)
audio = pcm.reshape(-1, nch).astype(np.float32) / 32768.0
dur = nf / sr
print(f"duration = {dur:.2f}s   rate = {sr}   ch = {nch}")
print(f"peak = {np.abs(audio).max():.3f}   rms = {np.sqrt((audio**2).mean()):.3f}")

# Per-second RMS
sec = int(dur)
rms_per_sec = []
for s in range(sec):
    a = audio[s*sr:(s+1)*sr]
    rms_per_sec.append(np.sqrt((a**2).mean()))
print("\n每秒 RMS (dBFS):")
for i, r in enumerate(rms_per_sec):
    db = 20*np.log10(r + 1e-9)
    bar = "#" * max(0, int((db + 40) * 2))
    print(f"  t={i:3d}s  {db:6.1f} dB  {bar}")

# Loop seam check: tail vs head
loop_sec = 42.67
tail_n = int(0.5 * sr)
head_n = int(0.5 * sr)
seam_tail = audio[int(loop_sec*sr) - tail_n: int(loop_sec*sr)]
seam_head = audio[: head_n]
mono_tail = seam_tail.mean(axis=1)
mono_head = seam_head.mean(axis=1)
step = float(np.abs(mono_tail - mono_head).mean())
step_max = float(np.abs(mono_tail - mono_head).max())
print(f"\n循环接缝(尾0.5s vs 头0.5s, 单声道):")
print(f"  mean |diff| = {step:.5f}    max |diff| = {step_max:.5f}")

# 频段占比
fft = np.fft.rfft(audio.mean(axis=1))
mag = np.abs(fft)
freqs = np.fft.rfftfreq(len(audio), 1/sr)
total = mag.sum()
bands = [(0,80), (80,250), (250,800), (800,2500), (2500,6000), (6000,16000)]
print("\n频段占比:")
for lo, hi in bands:
    mask = (freqs >= lo) & (freqs < hi)
    pct = mag[mask].sum() / total * 100
    bar = "#" * int(pct)
    print(f"  {lo:5d}-{hi:5d} Hz: {pct:5.1f}%  {bar}")

# L / R
L = audio[:,0]
R = audio[:,1] if nch > 1 else L
corr = float(np.corrcoef(L, R)[0,1])
print(f"\nL/R 相关度 = {corr:.3f}")

# Loop point detection: 找最相似的接缝位置(应该就在 42.67s)
mono = audio.mean(axis=1)
window = mono[int(loop_sec*sr) - int(0.2*sr): int(loop_sec*sr) + int(0.2*sr)]
best_off, best_d = 0, 1e9
for off in range(int(loop_sec*sr) - int(2*sr), int(loop_sec*sr) + int(2*sr)):
    candidate = mono[off:off+len(window)]
    if len(candidate) != len(window):
        continue
    d = float(np.abs(candidate - window).mean())
    if d < best_d:
        best_d = d
        best_off = off
print(f"\n循环点搜索: 最佳偏移 {best_off - int(loop_sec*sr):+d} samples ({(best_off - int(loop_sec*sr))/sr*1000:+.1f} ms), mean|diff|={best_d:.5f}")
