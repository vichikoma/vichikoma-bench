"""music-gen 核心库 —— 写 MIDI / 渲染 / 无缝循环母带 / 数值质检。

设计目标：让 Agent 不用重写样板、不踩已知的坑。
所有路径基于本文件位置推导，因此在 skill 目录、任意 workdir 下都可用。

典型用法：
    import musiclib as mg
    p = mg.Piece(bpm=80, bars=16)
    SCALE = [...]                                   # 音阶＝相对主音的半音数列表，由你定义
    lead = p.track("lead", mg.GM['flute'], pan=64, volume=106)
    lead.note(0, mg.deg(SCALE, 65, 3), 2, 74)      # 第 0 拍，主音 F4 的音阶第 3 级，2 拍长
    ...
    p.save("piece.mid")
"""
from __future__ import annotations

import os
import shutil
import subprocess
import sys

# ---------------------------------------------------------------- 路径
_HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.dirname(_HERE)                     # skill 根目录


def _find_fluidsynth():
    """按此顺序找 FluidSynth：环境变量 FLUIDSYNTH → PATH → 本目录 bin/。"""
    env = os.environ.get("FLUIDSYNTH")
    if env and os.path.exists(env):
        return env
    for name in ("fluidsynth", "fluidsynth.exe"):
        p = shutil.which(name)
        if p:
            return p
    for name in ("fluidsynth.exe", "fluidsynth"):
        p = os.path.join(SKILL_ROOT, "bin", name)
        if os.path.exists(p):
            return p
    return os.path.join(SKILL_ROOT, "bin", "fluidsynth.exe")   # 报错时给出预期位置


def _find_soundfont():
    """环境变量 SOUNDFONT → 本目录 soundfonts/ 里的 .sf2。"""
    env = os.environ.get("SOUNDFONT")
    if env and os.path.exists(env):
        return env
    d = os.path.join(SKILL_ROOT, "soundfonts")
    if os.path.isdir(d):
        for f in sorted(os.listdir(d)):
            if f.lower().endswith(".sf2"):
                return os.path.join(d, f)
    return os.path.join(d, "GeneralUser-GS.sf2")


FLUIDSYNTH = _find_fluidsynth()
SOUNDFONT = _find_soundfont()


# ---------------------------------------------------------------- GM 音色表
# GM 音色号（本库暴露的条目）；编号↔名称对照见 references/instruments.md
GM = {
    # 钢琴 / 键盘
    'piano': 0, 'bright_piano': 1, 'electric_piano': 4, 'harpsichord': 6,
    'celesta': 8, 'glockenspiel': 9, 'music_box': 10, 'vibraphone': 11,
    'marimba': 12, 'xylophone': 13, 'tubular_bells': 14, 'dulcimer': 15,
    # 风琴 / 簧风琴
    'organ': 19, 'church_organ': 19, 'reed_organ': 20, 'accordion': 21,
    'harmonica': 22,
    # 吉他 / 拨弦
    'nylon_guitar': 24, 'steel_guitar': 25, 'jazz_guitar': 26,
    'clean_guitar': 27, 'overdriven_guitar': 29, 'distortion_guitar': 30,
    # 贝斯
    'acoustic_bass': 32, 'finger_bass': 33, 'pick_bass': 34, 'synth_bass': 38,
    # 弦乐 / 独奏
    'violin': 40, 'viola': 41, 'cello': 42, 'contrabass': 43,
    'tremolo_strings': 44, 'pizzicato_strings': 45, 'harp': 46,
    'timpani': 47,
    # 弦乐 / 合奏
    'strings': 48, 'strings_slow': 49, 'strings_synth': 50, 'choir_aahs': 52,
    'voice_oohs': 53, 'orchestra_hit': 55,
    # 铜管
    'trumpet': 56, 'trombone': 57, 'tuba': 58, 'french_horn': 60,
    'brass_section': 61, 'synth_brass': 62,
    # 簧管 / 木管
    'soprano_sax': 64, 'alto_sax': 65, 'tenor_sax': 66, 'oboe': 68,
    'english_horn': 69, 'bassoon': 70, 'clarinet': 71,
    # 吹管
    'piccolo': 72, 'flute': 73, 'recorder': 74, 'pan_flute': 75,
    'ocarina': 79,
    # 合成 / 音效
    'square_lead': 80, 'saw_lead': 81, 'calliope_lead': 82,
    'warm_pad': 89, 'bowed_glass': 92, 'crystal': 98,
    'atmosphere': 99, 'brightness': 100, 'goblins': 101, 'echoes': 102,
    'sci_fi': 103, 'fx_soundtrack': 97, 'fx_crystal': 98,
    'fx_seashore': 122, 'fx_bird': 123, 'fx_helicopter': 125,
}

# 通用 MIDI 打击乐（通道 9；pitch 即鼓件号）
DRUMS = {
    'kick': 36, 'snare': 38, 'clap': 39, 'snare_rim': 37,
    'tom_low': 41, 'tom_mid': 47, 'tom_high': 50,
    'hh_closed': 42, 'hh_pedal': 44, 'hh_open': 46,
    'crash': 49, 'ride': 51, 'ride_bell': 53,
    'tambourine': 54, 'cowbell': 56, 'shaker': 82,
}

# ---------------------------------------------------------------- 音阶
# 本库不预设音阶。deg()/chord_of() 直接接收「相对主音的半音数列表」，
# 升序、一个八度内，长度不限（5/6/7/8…皆可）。音阶由调用方自己定义。

NOTE_NAMES = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
              'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
              'A#': 10, 'Bb': 10, 'B': 11}


def note_to_midi(name: str) -> int:
    """'F4' -> 65, 'C#3' -> 49, 'Bb2' -> 46。C4 = 60（中央 C）"""
    n = name.strip()
    letter = n[0].upper()
    i = 1
    if i < len(n) and n[i] in '#b':
        letter += n[i]
        i += 1
    octave = int(n[i:])
    return NOTE_NAMES[letter] + (octave + 1) * 12


def deg(scale, tonic: int, degree: int, octave: int = 0) -> int:
    """取音阶音级。degree 从 1 开始（8 = 下一个八度的主音，0/-1 = 下方八度，依此类推）。

    scale：相对主音的半音数列表（升序、一个八度内），由调用方定义。
    """
    steps = list(scale)
    n = len(steps)
    d = degree - 1
    oct_shift, idx = divmod(d, n)
    return tonic + steps[idx] + 12 * (oct_shift + octave)


def chord_of(scale, tonic: int, degree: int, size: int = 3, octave: int = 0):
    """按音阶叠三度取和弦音（只含音阶内音）。degree=1 即 I 级。size=3 三和弦，4 七和弦。"""
    steps = list(scale)
    n = len(steps)
    out = []
    for k in range(size):
        d = (degree - 1) + 2 * k
        oct_shift, idx = divmod(d, n)
        out.append(tonic + steps[idx] + 12 * (oct_shift + octave))
    return out


# ---------------------------------------------------------------- 作曲
class _TrackBuilder:
    def __init__(self, piece: "Piece", name, program, channel, pan=None, volume=None):
        self.piece = piece
        self.chan = channel
        self.events = []          # (tick, priority, seq, msg)
        self.seq = 0
        self._add(0, 0, ('meta', name))
        self._add(0, 1, ('program', program))
        if volume is not None:
            self._add(0, 1, ('cc', 7, volume))
        if pan is not None:
            self._add(0, 1, ('cc', 10, pan))

    def _add(self, tick, prio, payload):
        self.events.append((tick, prio, self.seq, payload))
        self.seq += 1

    def note(self, start_beat, pitch, dur_beats, vel=70):
        s = int(round(start_beat * self.piece.tpb))
        e = int(round((start_beat + max(dur_beats, 0.01)) * self.piece.tpb))
        self._add(s, 2, ('on', pitch, int(vel)))
        self._add(e, 1, ('off', pitch))

    def chord(self, start_beat, pitches, dur_beats, vel=60, spread=0.0):
        """spread>0 时各音依次延迟 spread 拍（琶音化）。"""
        for i, p in enumerate(pitches):
            v = vel if not isinstance(vel, (list, tuple)) else vel[i]
            self.note(start_beat + i * spread, p, dur_beats - i * spread, v)

    def cc(self, start_beat, control, value):
        self._add(int(round(start_beat * self.piece.tpb)), 1, ('cc', control, value))

    def _flush(self, end_beat):
        from mido import MidiTrack, Message, MetaMessage
        tr = MidiTrack()
        self.events.sort(key=lambda x: (x[0], x[1], x[2]))
        last = 0
        for tick, _p, _s, payload in self.events:
            kind = payload[0]
            if kind == 'meta':
                msg = MetaMessage('track_name', name=payload[1])
            elif kind == 'program':
                msg = Message('program_change', program=payload[1], channel=self.chan)
            elif kind == 'cc':
                msg = Message('control_change', channel=self.chan,
                              control=payload[1], value=payload[2])
            elif kind == 'on':
                msg = Message('note_on', note=payload[1], velocity=payload[2],
                              channel=self.chan)
            else:
                msg = Message('note_off', note=payload[1], velocity=0,
                              channel=self.chan)
            tr.append(msg.copy(time=tick - last))
            last = tick
        end = int(round(end_beat * self.piece.tpb))
        tr.append(MetaMessage('end_of_track', time=max(0, end - last)))
        return tr


class Piece:
    """一首曲子。bars 决定循环长度：bars × 4 拍 ÷ bpm × 60 = 循环秒数。"""

    def __init__(self, bpm=80, bars=16, beats_per_bar=4, tpb=480):
        self.bpm = bpm
        self.bars = bars
        self.beats_per_bar = beats_per_bar
        self.tpb = tpb
        self._tracks = []
        self._next_channel = 0

    @property
    def total_beats(self):
        return self.bars * self.beats_per_bar

    @property
    def loop_seconds(self):
        return self.total_beats * 60.0 / self.bpm

    def track(self, name, program, channel=None, pan=None, volume=None, drums=False):
        """新建一轨。drums=True 时强制走通道 9（GM 打击乐）。"""
        if drums:
            channel = 9
        elif channel is None:
            while self._next_channel == 9:
                self._next_channel += 1
            channel = self._next_channel
            self._next_channel += 1
        b = _TrackBuilder(self, name, program, channel, pan, volume)
        self._tracks.append(b)
        return b

    def save(self, path):
        from mido import MidiFile, MidiTrack, MetaMessage, bpm2tempo
        mid = MidiFile(ticks_per_beat=self.tpb)
        # 第 0 轨只放速度
        head = MidiTrack()
        head.append(MetaMessage('track_name', name='tempo', time=0))
        head.append(MetaMessage('set_tempo', tempo=bpm2tempo(self.bpm), time=0))
        mid.tracks.append(head)
        for b in self._tracks:
            mid.tracks.append(b._flush(self.total_beats))
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        mid.save(path)
        return path


# ---------------------------------------------------------------- 渲染
def render(mid_path, wav_path, gain=0.6, rate=44100,
           reverb=(0.9, 0.3, 0.8), soundfont=SOUNDFONT, extra_tail=None):
    """MIDI -> wav（FluidSynth 离线渲染）。
    reverb=(room_size, damp, level)；传 None 关闭混响。
    返回渲染出的 wav 时长（秒）。"""
    if not os.path.exists(FLUIDSYNTH):
        raise FileNotFoundError(
            f"找不到 FluidSynth: {FLUIDSYNTH}\n"
            "三种解法：① 设置环境变量 FLUIDSYNTH 指向可执行文件；"
            "② 装进 PATH（apt/brew/choco install fluidsynth）；"
            "③ 把便携版解压进本目录（得到 bin/fluidsynth.exe）。详见 README.md")
    if not os.path.exists(soundfont):
        raise FileNotFoundError(
            f"找不到音源: {soundfont}\n"
            "把 .sf2 放进本目录 soundfonts/，或用环境变量 SOUNDFONT 指定路径")

    cmd = [FLUIDSYNTH, "-ni", "-F", wav_path, "-O", "s16", "-r", str(rate),
           "-g", str(gain)]
    if reverb is None:
        cmd += ["-R", "0"]
    else:
        room, damp, level = reverb
        cmd += [f"-o", f"synth.reverb.room-size={room}",
                f"-o", f"synth.reverb.damp={damp}",
                f"-o", f"synth.reverb.level={level}",
                f"-o", "synth.reverb.width=1.0"]
    cmd += [soundfont, mid_path]
    os.makedirs(os.path.dirname(os.path.abspath(wav_path)), exist_ok=True)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(wav_path):
        raise RuntimeError(f"FluidSynth 渲染失败 (rc={r.returncode})\n{r.stdout}\n{r.stderr}")
    import wave
    with wave.open(wav_path, "rb") as w:
        return w.getnframes() / w.getframerate()


# ---------------------------------------------------------------- 母带
def _read_wav(path):
    import numpy as np
    from scipy.io import wavfile
    rate, x = wavfile.read(path)
    x = x.astype(np.float64) / 32768.0
    if x.ndim == 1:
        x = x[:, None]
    return rate, x


def write_wav(path, rate, x):
    import numpy as np
    from scipy.io import wavfile
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    wavfile.write(path, rate, (np.clip(x, -1, 1) * 32767).astype(np.int16))


def seamless_loop(raw_wav, loop_seconds, width=1.5, normalize_to=0.89,
                  fade_out=0.0):
    """把渲染结果（含尾部余响）折成无缝循环。

    原理 tail-fold：渲染出的尾部余响是最后一批音的释放+混响，
    把它叠加回开头，循环时上一遍的残响自然延续 —— 听不出接缝。

    width : M/S 展宽系数（1.0=不动；1.3~1.6 常用）。GM 音源光靠 CC10 pan
            做不出宽度，必须在这里补。
    fade_out : 0 = 纯粹无缝循环（游戏用）；>0 秒则加淡出（当独立曲目听）。
    """
    import numpy as np
    rate, x = _read_wav(raw_wav)
    loopn = int(round(loop_seconds * rate))
    if len(x) <= loopn:
        raise ValueError(
            f"渲染结果只有 {len(x)/rate:.2f}s，不足循环长度 {loop_seconds}s。"
            "检查 MIDI 是否被截断，或减小 --seconds。")
    loop = x[:loopn].copy()
    tail = x[loopn:]
    n = min(len(tail), loopn)
    loop[:n] += tail[:n]

    if width and width != 1.0 and loop.shape[1] == 2:
        mid = (loop[:, 0] + loop[:, 1]) / 2
        side = (loop[:, 0] - loop[:, 1]) / 2 * width
        loop[:, 0] = mid + side
        loop[:, 1] = mid - side

    if fade_out > 0:
        fn = int(fade_out * rate)
        loop[-fn:] *= np.linspace(1, 0, fn)[:, None]

    peak = float(np.abs(loop).max())
    if peak > 0:
        loop *= normalize_to / peak
    return rate, loop


def export(base_path, rate, audio, formats=("wav", "ogg", "mp3")):
    """导出 wav / ogg / mp3。base_path 不带扩展名。返回实际写出的文件列表。"""
    outs = []
    if "wav" in formats:
        p = base_path + ".wav"
        write_wav(p, rate, audio)
        outs.append(p)
    ff = shutil.which("ffmpeg")
    for fmt, args in (("ogg", ["-c:a", "libvorbis", "-q:a", "6"]),
                      ("mp3", ["-c:a", "libmp3lame", "-b:a", "256k"])):
        if fmt not in formats:
            continue
        p = base_path + "." + fmt
        if not ff:
            print(f"[warn] 找不到 ffmpeg，跳过 {fmt}", file=sys.stderr)
            continue
        src = base_path + ".wav"
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", src] + args + [p],
                       check=True)
        outs.append(p)
    return outs


# ---------------------------------------------------------------- 质检
def qa(wav_path, bands=((0, 80), (80, 250), (250, 800), (800, 2500),
                        (2500, 6000), (6000, 16000))):
    """数值质检 —— 不靠耳朵就能发现大部分问题。返回 dict，同时打印报告。"""
    import numpy as np
    rate, x = _read_wav(wav_path)
    mono = x.mean(axis=1)
    dur = len(x) / rate
    peak = float(np.abs(x).max())
    rms = float(np.sqrt((x ** 2).mean()))
    rms_db = 20 * np.log10(rms + 1e-12)

    out = {
        "seconds": round(dur, 3), "peak": round(peak, 4),
        "rms_dbfs": round(rms_db, 1),
        "clipping_samples": int((np.abs(x) >= 0.999).sum()),
    }

    if x.shape[1] == 2:
        corr = float(np.corrcoef(x[:, 0], x[:, 1])[0, 1])
        out["lr_corr"] = round(corr, 3)
        seam = float(abs(mono[:int(0.001 * rate)].mean()
                         - mono[-int(0.001 * rate):].mean()))
        d = np.abs(np.diff(mono))
        p9999 = float(np.percentile(d, 99.99))
        out["seam_step"] = round(seam, 5)
        out["seam_ok"] = bool(seam <= p9999 * 1.5 or seam < 0.02)

    spec = np.abs(np.fft.rfft(mono * np.hanning(len(mono))))
    f = np.fft.rfftfreq(len(mono), 1 / rate)
    tot = spec.sum()
    out["bands"] = {f"{lo}-{hi}Hz": round(100 * spec[(f >= lo) & (f < hi)].sum() / tot, 1)
                    for lo, hi in bands}
    seg = rate
    out["rms_profile"] = [round(20 * np.log10(float(np.sqrt((mono[i:i + seg] ** 2).mean())) + 1e-12))
                          for i in range(0, len(mono), seg)]

    _print_qa_report(out)
    return out


def _print_qa_report(q):
    print(f"时长       {q['seconds']} s")
    print(f"峰值/RMS   {q['peak']} / {q['rms_dbfs']} dBFS"
          f"   clipping={q['clipping_samples']}")
    if "lr_corr" in q:
        print(f"L/R 相关度 {q['lr_corr']}   (1.0=单声道；0.6~0.85 较好)")
    if "seam_step" in q:
        print(f"循环接缝   step={q['seam_step']}  {'OK' if q['seam_ok'] else '!! 可能有咔哒'}")
    print("频段占比   " + "  ".join(f"{k}:{v}%" for k, v in q["bands"].items()))
    print("每秒 RMS   " + " ".join(f"{v:.0f}" for v in q["rms_profile"]))
