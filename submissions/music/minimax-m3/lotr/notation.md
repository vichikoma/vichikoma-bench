# MiniMax-M3（作品 E）· 文本乐谱

> 本文件由作品的 MIDI 文件机械转写而成：音高、时值、力度、音量/声像控制值均为文件原始数据，未做任何分析或解读。

## 一、全局参数

- 速度：96.00 BPM（全曲无变速）
- 拍号：4/4
- 长度：16 小节（64 拍）
- 按上述速度换算的演奏长度：40.00 秒（最后音符结束于 40.00 秒）
- 声部数：8 条（其中打击乐 1 条）
- 音符总数：418

## 二、配器表（声部按文件中的顺序编号）

| 声部 | 乐器（General MIDI） | 音量 CC7 | 声像 CC10 | 音域 | 音符数 |
|---|---|---|---|---|---|
| T1 | Contrabass (GM 43) | 100 | 20 | A1–G2 | 14 |
| T2 | Timpani (GM 47) | 105 | 110 | F1–D2 | 31 |
| T3 | String Ensemble 2 (GM 49) | 92 | 50 | D3–D#4 | 48 |
| T4 | Choir Aahs (GM 52) | 78 | 80 | D4–D#5 | 36 |
| T5 | French Horn (GM 60) | 106 | 60 | D3–A4 | 42 |
| T6 | Brass Section (GM 61) | 92 | 70 | D2–A3 | 23 |
| T7 | Flute (GM 73) | 82 | 40 | D4–A5 | 21 |
| T8 | 打击乐组（GM 通道 10，音高＝鼓件号） | 88 | 64 | Bass Drum 1, Acoustic Snare, Closed Hi-Hat, Open Hi-Hat, Crash Cymbal 1 | 203 |

## 三、逐小节音符事件

格式：`拍位 音名(时值,v力度)`，拍位为小节内偏移（0 = 小节第 1 拍）。打击乐声部以鼓件名代替音名。
音名统一用升号写法（A# 即 Bb）。时值单位为「拍」；写成 `二分(1.92拍)` 表示该音实际比二分略短（音符间留有微小间隙）。

### T1　Contrabass

- 小节  1：0 D2(7.60拍,v78)
- 小节  2：—（休止）
- 小节  3：0 G2(全(3.80拍),v78)
- 小节  4：0 D2(全(3.80拍),v78)
- 小节  5：0 A1(全(3.80拍),v78)
- 小节  6：0 D2(7.60拍,v78)
- 小节  7：—（休止）
- 小节  8：0 A1(全(3.80拍),v78)
- 小节  9：0 F2(全(3.80拍),v78)
- 小节 10：0 D2(全(3.80拍),v78)
- 小节 11：0 G2(全(3.80拍),v78)
- 小节 12：0 D2(全(3.80拍),v78)
- 小节 13：0 A1(全(3.80拍),v78)
- 小节 14：0 D2(全(3.80拍),v78)
- 小节 15：0 G2(全(3.80拍),v78)
- 小节 16：0 D2(全(3.80拍),v78)

### T2　Timpani

- 小节  1：0 D2(附点四分(1.35拍),v95)　2 G1(附点四分(1.35拍),v95)
- 小节  2：0 D2(附点四分(1.35拍),v95)　2 G1(附点四分(1.35拍),v95)
- 小节  3：0 D2(附点四分(1.35拍),v95)　2 G1(附点四分(1.35拍),v95)
- 小节  4：0 D2(附点二分(3.15拍),v95)
- 小节  5：0 D2(四分(0.90拍),v95)　1 A1(四分(0.90拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节  6：0 G1(附点四分(1.35拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节  7：0 A1(附点四分(1.35拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节  8：0 G1(附点四分(1.35拍),v95)　2 D2(附点二分(2.70拍),v95)
- 小节  9：0 D2(四分(0.90拍),v95)　1 D2(四分(0.90拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节 10：0 F1(附点四分(1.35拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节 11：0 G1(附点四分(1.35拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节 12：0 D2(附点二分(3.15拍),v95)
- 小节 13：0 A1(附点四分(1.35拍),v95)　2 G1(附点四分(1.35拍),v95)
- 小节 14：0 D2(附点四分(1.35拍),v95)　2 A1(附点四分(1.35拍),v95)
- 小节 15：0 G1(附点四分(1.35拍),v95)　2 D2(附点四分(1.35拍),v95)
- 小节 16：0 D2(附点二分(3.15拍),v95)

### T3　String Ensemble 2

- 小节  1：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节  2：0 G3(全(3.92拍),v70)　0 A#3(全(3.92拍),v70)　0 D4(全(3.92拍),v70)
- 小节  3：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节  4：0 A3(全(3.92拍),v70)　0 C4(全(3.92拍),v70)　0 D#4(全(3.92拍),v70)
- 小节  5：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节  6：0 G3(全(3.92拍),v70)　0 A#3(全(3.92拍),v70)　0 D4(全(3.92拍),v70)
- 小节  7：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节  8：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节  9：0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)　0 C4(全(3.92拍),v70)
- 小节 10：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节 11：0 G3(全(3.92拍),v70)　0 A#3(全(3.92拍),v70)　0 D4(全(3.92拍),v70)
- 小节 12：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节 13：0 A3(全(3.92拍),v70)　0 C4(全(3.92拍),v70)　0 D#4(全(3.92拍),v70)
- 小节 14：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)
- 小节 15：0 G3(全(3.92拍),v70)　0 A#3(全(3.92拍),v70)　0 D4(全(3.92拍),v70)
- 小节 16：0 D3(全(3.92拍),v70)　0 F3(全(3.92拍),v70)　0 A3(全(3.92拍),v70)

### T4　Choir Aahs

- 小节  1：—（休止）
- 小节  2：—（休止）
- 小节  3：—（休止）
- 小节  4：—（休止）
- 小节  5：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)
- 小节  6：0 G4(全(3.92拍),v60)　0 A#4(全(3.92拍),v60)　0 D5(全(3.92拍),v60)
- 小节  7：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)
- 小节  8：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)
- 小节  9：0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)　0 C5(全(3.92拍),v60)
- 小节 10：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)
- 小节 11：0 G4(全(3.92拍),v60)　0 A#4(全(3.92拍),v60)　0 D5(全(3.92拍),v60)
- 小节 12：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)
- 小节 13：0 A4(全(3.92拍),v60)　0 C5(全(3.92拍),v60)　0 D#5(全(3.92拍),v60)
- 小节 14：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)
- 小节 15：0 G4(全(3.92拍),v60)　0 A#4(全(3.92拍),v60)　0 D5(全(3.92拍),v60)
- 小节 16：0 D4(全(3.92拍),v60)　0 F4(全(3.92拍),v60)　0 A4(全(3.92拍),v60)

### T5　French Horn

- 小节  1：0 D4(二分(1.88拍),v82)　2 A3(二分(1.88拍),v82)
- 小节  2：0 G3(附点四分(1.41拍),v82)　1.5 F3(八分(0.47拍),v82)　2 D3(二分(1.88拍),v82)
- 小节  3：0 D4(二分(1.88拍),v82)　2 A3(四分(0.94拍),v82)　3 G3(四分(0.94拍),v82)
- 小节  4：0 F3(全(3.76拍),v82)
- 小节  5：0 D4(二分(1.88拍),v82)　2 A3(二分(1.88拍),v82)
- 小节  6：0 G3(附点四分(1.41拍),v82)　1.5 F3(八分(0.47拍),v82)　2 D3(二分(1.88拍),v82)
- 小节  7：0 D4(附点四分(1.41拍),v82)　1.5 A3(八分(0.47拍),v82)　2 F3(四分(0.94拍),v82)　3 A3(四分(0.94拍),v82)
- 小节  8：0 G3(全(3.76拍),v82)
- 小节  9：0 D4(附点四分(1.41拍),v82)　1.5 F4(八分(0.47拍),v82)　2 A4(四分(0.94拍),v82)　3 G4(四分(0.94拍),v82)
- 小节 10：0 F4(附点四分(1.41拍),v82)　1.5 D4(八分(0.47拍),v82)　2 G4(二分(1.88拍),v82)
- 小节 11：0 A4(四分(0.94拍),v82)　1 G4(四分(0.94拍),v82)　2 F4(二分(1.88拍),v82)
- 小节 12：0 D4(全(3.76拍),v82)
- 小节 13：0 A4(附点四分(1.41拍),v82)　1.5 G4(八分(0.47拍),v82)　2 F4(二分(1.88拍),v82)
- 小节 14：0 D4(附点四分(1.41拍),v82)　1.5 A3(八分(0.47拍),v82)　2 F3(四分(0.94拍),v82)　3 D3(四分(0.94拍),v82)
- 小节 15：0 G3(附点四分(1.41拍),v82)　1.5 F3(八分(0.47拍),v82)　2 A3(四分(0.94拍),v82)　3 G3(四分(0.94拍),v82)
- 小节 16：0 D3(全(3.76拍),v82)

### T6　Brass Section

- 小节  1：—（休止）
- 小节  2：—（休止）
- 小节  3：—（休止）
- 小节  4：—（休止）
- 小节  5：—（休止）
- 小节  6：—（休止）
- 小节  7：—（休止）
- 小节  8：—（休止）
- 小节  9：0 D3(附点四分(1.41拍),v78)　1.5 F3(八分(0.47拍),v78)　2 A3(四分(0.94拍),v78)　3 G3(四分(0.94拍),v78)
- 小节 10：0 F3(附点四分(1.41拍),v78)　1.5 D3(八分(0.47拍),v78)　2 G3(二分(1.88拍),v78)
- 小节 11：0 A3(四分(0.94拍),v78)　1 G3(四分(0.94拍),v78)　2 F3(二分(1.88拍),v78)
- 小节 12：0 D3(全(3.76拍),v78)
- 小节 13：0 A3(附点四分(1.41拍),v78)　1.5 G3(八分(0.47拍),v78)　2 F3(二分(1.88拍),v78)
- 小节 14：0 D3(附点四分(1.41拍),v78)　1.5 A2(八分(0.47拍),v78)　2 F2(四分(0.94拍),v78)　3 D2(四分(0.94拍),v78)
- 小节 15：0 G2(附点四分(1.41拍),v78)　1.5 F2(八分(0.47拍),v78)　2 A2(四分(0.94拍),v78)　3 G2(四分(0.94拍),v78)
- 小节 16：0 D2(全(3.76拍),v78)

### T7　Flute

- 小节  1：—（休止）
- 小节  2：—（休止）
- 小节  3：—（休止）
- 小节  4：—（休止）
- 小节  5：—（休止）
- 小节  6：—（休止）
- 小节  7：2 D5(八分(0.45拍),v72)　2.5 F5(八分(0.45拍),v72)
- 小节  8：0 A5(附点四分(1.35拍),v72)　1.5 G5(八分(0.45拍),v72)
- 小节  9：0 D5(附点四分(1.35拍),v72)　1.5 F5(八分(0.45拍),v72)　2 A5(四分(0.90拍),v72)　3 G5(四分(0.90拍),v72)
- 小节 10：0 F5(附点四分(1.35拍),v72)　1.5 D5(八分(0.45拍),v72)　2 G5(二分(1.80拍),v72)
- 小节 11：0 A5(四分(0.90拍),v72)　1 G5(四分(0.90拍),v72)　2 F5(二分(1.80拍),v72)
- 小节 12：—（休止）
- 小节 13：2 F5(二分(1.80拍),v72)
- 小节 14：0 D5(附点四分(1.35拍),v72)　1.5 A4(八分(0.45拍),v72)　2 F4(四分(0.90拍),v72)　3 D4(四分(0.90拍),v72)
- 小节 15：2 A4(四分(0.90拍),v72)　3 G4(四分(0.90拍),v72)
- 小节 16：—（休止）

### T8　打击乐（鼓件）

- 小节  1：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节  2：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节  3：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节  4：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节  5：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节  6：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Open Hi-Hat(八分,v65)
- 小节  7：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Open Hi-Hat(八分,v65)
- 小节  8：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Open Hi-Hat(八分,v65)
- 小节  9：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0 Crash Cymbal 1(二分,v95)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Bass Drum 1(八分,v95)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Bass Drum 1(八分,v95)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Open Hi-Hat(八分,v65)
- 小节 10：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Bass Drum 1(八分,v95)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Bass Drum 1(八分,v95)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Open Hi-Hat(八分,v65)
- 小节 11：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Bass Drum 1(八分,v95)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Bass Drum 1(八分,v95)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Open Hi-Hat(八分,v65)
- 小节 12：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Bass Drum 1(八分,v95)　1.5 Open Hi-Hat(八分,v65)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Bass Drum 1(八分,v95)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3 Crash Cymbal 1(四分,v80)　3.5 Open Hi-Hat(八分,v65)
- 小节 13：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节 14：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节 15：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3.5 Closed Hi-Hat(十六分,v55)
- 小节 16：0 Bass Drum 1(八分,v95)　0 Closed Hi-Hat(十六分,v55)　0.5 Closed Hi-Hat(十六分,v55)　1 Acoustic Snare(八分,v80)　1 Closed Hi-Hat(十六分,v55)　1.5 Closed Hi-Hat(十六分,v55)　2 Bass Drum 1(八分,v95)　2 Closed Hi-Hat(十六分,v55)　2.5 Closed Hi-Hat(十六分,v55)　3 Acoustic Snare(八分,v80)　3 Closed Hi-Hat(十六分,v55)　3 Crash Cymbal 1(四分,v85)　3.5 Closed Hi-Hat(十六分,v55)

## 四、音级分布（按时值加权，不含打击乐声部）

| 音级 | 时值占比 |
|---|---|
| D |  35.2% ██████████████████ |
| A |  21.7% ███████████ |
| F |  18.7% █████████ |
| G |  13.7% ███████ |
| A# |   5.0% ███ |
| C |   3.6% ██ |
| D# |   2.1% █ |
| C# |   0.0%  |
| E |   0.0%  |
| F# |   0.0%  |
| G# |   0.0%  |
| B |   0.0%  |

## 五、逐小节音集合（不含打击乐；用于和声/调式分析）

| 小节 | 出现的音级 | 其中低音区(<C4) |
|---|---|---|
| 1 | D F G A | D F G A |
| 2 | D F G A# | D F G A# |
| 3 | D F G A | D F G A |
| 4 | C D D# F A | D F A |
| 5 | D F A | D F A |
| 6 | D F G A# | D F G A# |
| 7 | D F A | D F A |
| 8 | D F G A | D F G A |
| 9 | C D F G A | D F G A |
| 10 | D F G A | D F G A |
| 11 | D F G A A# | D F G A A# |
| 12 | D F A | D F A |
| 13 | C D# F G A | F G A |
| 14 | D F A | D F A |
| 15 | D F G A A# | D F G A A# |
| 16 | D F A | D F A |
