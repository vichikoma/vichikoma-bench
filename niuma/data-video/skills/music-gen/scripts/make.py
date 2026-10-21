#!/usr/bin/env python
"""make.py —— 一条命令完成「渲染 → 无缝循环 → 归一化母带 → 导出」。

用法：
    python scripts/make.py --mid piece.mid --seconds 32 --out out/theme

参数：
    --mid       输入 MIDI
    --out       输出基名（不带扩展名）
    --seconds   循环长度；给了就做 tail-fold 无缝循环，不给＝按渲染原长输出
    --width     M/S 展宽系数，默认 1.5（1.0=不动）
    --gain      FluidSynth 主增益，默认 0.6
    --reverb    room,damp,level 默认 0.9,0.3,0.8；传 off 关闭
    --formats   逗号分隔，默认 wav,ogg,mp3
    --fade      结尾淡出秒数，默认 0（游戏用循环不加淡出）
    --rate      采样率，默认 44100
    --no-qa     跳过质检
"""
import argparse
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import musiclib as mg  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mid", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--seconds", type=float, default=None)
    ap.add_argument("--width", type=float, default=1.5)
    ap.add_argument("--gain", type=float, default=0.6)
    ap.add_argument("--reverb", default="0.9,0.3,0.8")
    ap.add_argument("--formats", default="wav,ogg,mp3")
    ap.add_argument("--fade", type=float, default=0.0)
    ap.add_argument("--rate", type=int, default=44100)
    ap.add_argument("--no-qa", action="store_true")
    a = ap.parse_args()

    if not os.path.exists(a.mid):
        sys.exit(f"找不到 MIDI: {a.mid}")

    reverb = None
    if a.reverb.lower() != "off":
        room, damp, level = (float(v) for v in a.reverb.split(","))
        reverb = (room, damp, level)

    tmp = os.path.join(tempfile.gettempdir(), "music-gen-raw.wav")
    dur = mg.render(a.mid, tmp, gain=a.gain, rate=a.rate, reverb=reverb)
    print(f"渲染完成 {dur:.2f}s -> {tmp}")

    if a.seconds:
        rate, audio = mg.seamless_loop(tmp, a.seconds, width=a.width,
                                       fade_out=a.fade)
        print(f"无缝循环 {a.seconds:.3f}s (tail-fold, 余响 {dur - a.seconds:.2f}s 折回开头)")
    else:
        import numpy as np
        rate, audio = mg._read_wav(tmp)
        peak = float(np.abs(audio).max())
        if peak > 0:
            audio = audio * (0.89 / peak)
        if a.fade > 0:
            fn = int(a.fade * rate)
            audio[-fn:] *= np.linspace(1, 0, fn)[:, None]
        print(f"按原长输出 {audio.shape[0] / rate:.2f}s")

    outs = mg.export(a.out, rate, audio, formats=tuple(a.formats.split(",")))
    for p in outs:
        print("写出", p)
    if not a.no_qa and outs:
        print("\n--- 质检 ---")
        mg.qa(outs[0])


if __name__ == "__main__":
    main()
