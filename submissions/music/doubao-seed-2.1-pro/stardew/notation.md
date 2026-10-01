# Doubao-Seed-2.1-Pro（作品 D）· 文本乐谱

> 本文件由作品的 MIDI 文件机械转写而成：音高、时值、力度、音量/声像控制值均为文件原始数据，未做任何分析或解读。

## 一、全局参数

- 速度：96.00 BPM（全曲无变速）
- 拍号：4/4
- 长度：16 小节（64 拍）
- 按上述速度换算的演奏长度：40.00 秒（最后音符结束于 40.00 秒）
- 声部数：6 条（其中打击乐 1 条）
- 音符总数：460

## 二、配器表（声部按文件中的顺序编号）

| 声部 | 乐器（General MIDI） | 音量 CC7 | 声像 CC10 | 音域 | 音符数 |
|---|---|---|---|---|---|
| T1 | Acoustic Grand Piano (GM 0) | 72 | 42 | E4–E6 | 108 |
| T2 | Glockenspiel (GM 9) | 48 | 110 | F4–A#6 | 32 |
| T3 | Electric Bass (finger) (GM 33) | 75 | 62 | G2–F4 | 48 |
| T4 | Contrabass (GM 43) | 65 | 50 | G0–F1 | 16 |
| T5 | 打击乐组（GM 通道 10，音高＝鼓件号） | 42 | 20 | Bass Drum 1, Side Stick, Closed Hi-Hat | 192 |
| T6 | Pad 2 (warm) (GM 89) | 55 | 90 | G3–E5 | 64 |

## 三、逐小节音符事件

格式：`拍位 音名(时值,v力度)`，拍位为小节内偏移（0 = 小节第 1 拍）。打击乐声部以鼓件名代替音名。
音名统一用升号写法（A# 即 Bb）。时值单位为「拍」；写成 `二分(1.92拍)` 表示该音实际比二分略短（音符间留有微小间隙）。

### T1　Acoustic Grand Piano

- 小节  1：0 F4(四分,v70)　1 A4(四分,v68)　2 C5(二分,v72)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)　3 E6(四分,v38)
- 小节  2：0 A4(四分,v65)　1 C5(四分,v68)　2 D5(二分,v70)　3 D5(四分,v38)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)
- 小节  3：0 E4(四分,v62)　1 G4(四分,v65)　2 A#4(二分,v68)　3 G4(四分,v38)　3 A#4(四分,v38)　3 D5(四分,v38)　3 F5(四分,v38)
- 小节  4：0 C5(四分,v68)　1 E5(四分,v70)　2 A#5(二分,v75)　3 C5(四分,v38)　3 E5(四分,v38)　3 G5(四分,v38)　3 A#5(四分,v38)
- 小节  5：0 F5(二分,v76)　2 E5(二分,v70)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)　3 E6(四分,v38)
- 小节  6：0 D5(四分,v68)　1 A#4(四分,v68)　2 F4(二分,v65)　3 A#4(四分,v38)　3 D5(四分,v38)　3 F5(四分,v38)　3 A5(四分,v38)
- 小节  7：0 A4(四分,v65)　1 C5(四分,v66)　2 D5(二分,v68)　3 A4(四分,v38)　3 C5(四分,v38)　3 E5(四分,v38)　3 G5(四分,v38)
- 小节  8：0 F4(四分,v62)　1 A#4(四分,v65)　2 C5(二分,v66)　3 D5(四分,v38)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)
- 小节  9：0 E4(二分,v64)　2 G4(二分,v66)　3 G4(四分,v38)　3 A#4(四分,v38)　3 D5(四分,v38)　3 F5(四分,v38)
- 小节 10：0 A4(四分,v68)　1 C5(四分,v70)　2 G5(二分,v74)　3 C5(四分,v38)　3 E5(四分,v38)　3 G5(四分,v38)　3 A#5(四分,v38)
- 小节 11：0 C5(四分,v70)　1 A4(四分,v68)　2 F4(二分,v72)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)　3 E6(四分,v38)
- 小节 12：0 D5(四分,v68)　1 C5(四分,v66)　2 A4(二分,v65)　3 D5(四分,v38)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)
- 小节 13：0 A#4(四分,v66)　1 G4(四分,v64)　2 E4(二分,v63)　3 G4(四分,v38)　3 A#4(四分,v38)　3 D5(四分,v38)　3 F5(四分,v38)
- 小节 14：0 C5(二分,v68)　2 E5(二分,v70)　3 C5(四分,v38)　3 E5(四分,v38)　3 G5(四分,v38)　3 A#5(四分,v38)
- 小节 15：0 F4(四分,v70)　1 C5(四分,v68)　2 A4(二分,v66)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)　3 E6(四分,v38)
- 小节 16：0 C5(二分,v65)　2 F4(二分,v63)　3 F5(四分,v38)　3 A5(四分,v38)　3 C6(四分,v38)　3 E6(四分,v38)

### T2　Glockenspiel

- 小节  1：3 C6(八分,v45)　3.5 F6(八分,v40)
- 小节  2：3 D6(八分,v42)　3.5 A5(八分,v38)
- 小节  3：3 E6(八分,v42)　3.5 G5(八分,v38)
- 小节  4：3 A#6(八分,v48)　3.5 C6(八分,v40)
- 小节  5：3 F6(八分,v46)　3.5 C6(八分,v40)
- 小节  6：3 A#5(八分,v40)　3.5 D6(八分,v38)
- 小节  7：3 C6(八分,v42)　3.5 A5(八分,v38)
- 小节  8：3 F5(八分,v40)　3.5 A#5(八分,v38)
- 小节  9：3 G5(八分,v40)　3.5 E5(八分,v36)
- 小节 10：3 E6(八分,v45)　3.5 G6(八分,v42)
- 小节 11：3 F5(八分,v42)　3.5 C6(八分,v38)
- 小节 12：3 A5(八分,v40)　3.5 D6(八分,v36)
- 小节 13：3 E5(八分,v38)　3.5 A#5(八分,v36)
- 小节 14：3 C6(八分,v42)　3.5 E6(八分,v40)
- 小节 15：3 A5(八分,v40)　3.5 F5(八分,v38)
- 小节 16：3 F4(八分,v36)　3.5 C5(八分,v34)

### T3　Electric Bass (finger)

- 小节  1：0 F3(二分,v75)　2 C4(四分,v65)　3 D#3(四分,v60)
- 小节  2：0 D3(二分,v75)　2 A3(四分,v65)　3 D4(四分,v60)
- 小节  3：0 G2(二分,v75)　2 D3(四分,v65)　3 A2(四分,v60)
- 小节  4：0 C3(二分,v75)　2 G3(四分,v65)　3 D3(四分,v60)
- 小节  5：0 F3(二分,v75)　2 C4(四分,v65)　3 F4(四分,v60)
- 小节  6：0 A#2(二分,v75)　2 F3(四分,v65)　3 A2(四分,v60)
- 小节  7：0 A2(二分,v75)　2 E3(四分,v65)　3 B2(四分,v60)
- 小节  8：0 D3(二分,v75)　2 A3(四分,v65)　3 D4(四分,v60)
- 小节  9：0 G2(二分,v75)　2 D3(四分,v65)　3 A2(四分,v60)
- 小节 10：0 C3(二分,v75)　2 G3(四分,v65)　3 D3(四分,v60)
- 小节 11：0 F3(二分,v75)　2 C4(四分,v65)　3 D#3(四分,v60)
- 小节 12：0 D3(二分,v75)　2 A3(四分,v65)　3 D4(四分,v60)
- 小节 13：0 G2(二分,v75)　2 D3(四分,v65)　3 A2(四分,v60)
- 小节 14：0 C3(二分,v75)　2 G3(四分,v65)　3 D3(四分,v60)
- 小节 15：0 F3(二分,v75)　2 C4(四分,v65)　3 F3(四分,v60)
- 小节 16：0 F3(二分,v75)　2 C4(四分,v65)　3 C3(四分,v60)

### T4　Contrabass

- 小节  1：0 F1(全,v62)
- 小节  2：0 D1(全,v62)
- 小节  3：0 G0(全,v62)
- 小节  4：0 C1(全,v62)
- 小节  5：0 F1(全,v62)
- 小节  6：0 A#0(全,v62)
- 小节  7：0 A0(全,v62)
- 小节  8：0 D1(全,v62)
- 小节  9：0 G0(全,v62)
- 小节 10：0 C1(全,v62)
- 小节 11：0 F1(全,v62)
- 小节 12：0 D1(全,v62)
- 小节 13：0 G0(全,v62)
- 小节 14：0 C1(全,v62)
- 小节 15：0 F1(全,v62)
- 小节 16：0 F1(全,v62)

### T5　打击乐（鼓件）

- 小节  1：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  2：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  3：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  4：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  5：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  6：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  7：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  8：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节  9：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 10：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 11：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 12：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 13：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 14：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 15：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)
- 小节 16：0 Bass Drum 1(八分,v45)　0 Closed Hi-Hat(八分(0.40拍),v42)　0.5 Closed Hi-Hat(八分(0.40拍),v35)　1 Side Stick(八分,v30)　1 Closed Hi-Hat(八分(0.40拍),v42)　1.5 Closed Hi-Hat(八分(0.40拍),v35)　2 Bass Drum 1(八分,v40)　2 Closed Hi-Hat(八分(0.40拍),v42)　2.5 Closed Hi-Hat(八分(0.40拍),v35)　3 Side Stick(八分,v30)　3 Closed Hi-Hat(八分(0.40拍),v42)　3.5 Closed Hi-Hat(八分(0.40拍),v35)

### T6　Pad 2 (warm)

- 小节  1：0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)　0 E5(全,v45)
- 小节  2：0 D4(全,v45)　0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)
- 小节  3：0 G3(全,v45)　0 A#3(全,v45)　0 D4(全,v45)　0 F4(全,v45)
- 小节  4：0 C4(全,v45)　0 E4(全,v45)　0 G4(全,v45)　0 A#4(全,v45)
- 小节  5：0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)　0 E5(全,v45)
- 小节  6：0 A#3(全,v45)　0 D4(全,v45)　0 F4(全,v45)　0 A4(全,v45)
- 小节  7：0 A3(全,v45)　0 C4(全,v45)　0 E4(全,v45)　0 G4(全,v45)
- 小节  8：0 D4(全,v45)　0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)
- 小节  9：0 G3(全,v45)　0 A#3(全,v45)　0 D4(全,v45)　0 F4(全,v45)
- 小节 10：0 C4(全,v45)　0 E4(全,v45)　0 G4(全,v45)　0 A#4(全,v45)
- 小节 11：0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)　0 E5(全,v45)
- 小节 12：0 D4(全,v45)　0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)
- 小节 13：0 G3(全,v45)　0 A#3(全,v45)　0 D4(全,v45)　0 F4(全,v45)
- 小节 14：0 C4(全,v45)　0 E4(全,v45)　0 G4(全,v45)　0 A#4(全,v45)
- 小节 15：0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)　0 E5(全,v45)
- 小节 16：0 F4(全,v45)　0 A4(全,v45)　0 C5(全,v45)　0 E5(全,v45)

## 四、音级分布（按时值加权，不含打击乐声部）

| 音级 | 时值占比 |
|---|---|
| F |  20.3% ██████████ |
| C |  19.4% ██████████ |
| A |  14.0% ███████ |
| D |  13.2% ███████ |
| G |  12.0% ██████ |
| E |  11.1% ██████ |
| A# |   9.5% █████ |
| D# |   0.4%  |
| B |   0.2%  |
| C# |   0.0%  |
| F# |   0.0%  |
| G# |   0.0%  |

## 五、逐小节音集合（不含打击乐；用于和声/调式分析）

| 小节 | 出现的音级 | 其中低音区(<C4) |
|---|---|---|
| 1 | C D# E F A | D# F |
| 2 | C D F A | D A |
| 3 | D E F G A A# | D G A A# |
| 4 | C D E G A# | C D G |
| 5 | C E F A | F |
| 6 | D F A A# | F A A# |
| 7 | C D E G A B | E A B |
| 8 | C D F A A# | D A |
| 9 | D E F G A A# | D G A A# |
| 10 | C D E G A A# | C D G |
| 11 | C D# E F A | D# F |
| 12 | C D F A | D A |
| 13 | D E F G A A# | D G A A# |
| 14 | C D E G A# | C D G |
| 15 | C E F A | F |
| 16 | C E F A | C F |
