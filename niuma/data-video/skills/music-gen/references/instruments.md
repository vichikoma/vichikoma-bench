# GM 音色表（编号 ↔ 名称映射）

`musiclib.GM['key']` 直接取编号。以下是 `musiclib.GM` 暴露的全部条目。

| # | key | 英文名 | 中文名 |
|---|---|---|---|
| 0 | `piano` | Acoustic Grand Piano | 大钢琴 |
| 1 | `bright_piano` | Bright Acoustic Piano | 明亮钢琴 |
| 4 | `electric_piano` | Electric Piano 1 | 电钢琴 1 |
| 6 | `harpsichord` | Harpsichord | 大键琴 |
| 8 | `celesta` | Celesta | 钢片琴 |
| 9 | `glockenspiel` | Glockenspiel | 钟琴 |
| 10 | `music_box` | Music Box | 八音盒 |
| 11 | `vibraphone` | Vibraphone | 颤音琴 |
| 12 | `marimba` | Marimba | 马林巴 |
| 13 | `xylophone` | Xylophone | 木琴 |
| 14 | `tubular_bells` | Tubular Bells | 管钟 |
| 15 | `dulcimer` | Dulcimer | 扬琴 |
| 19 | `organ` / `church_organ` | Church Organ | 教堂管风琴 |
| 20 | `reed_organ` | Reed Organ | 簧风琴 |
| 21 | `accordion` | Accordion | 手风琴 |
| 22 | `harmonica` | Harmonica | 口琴 |
| 24 | `nylon_guitar` | Acoustic Guitar (nylon) | 尼龙弦吉他 |
| 25 | `steel_guitar` | Acoustic Guitar (steel) | 钢弦吉他 |
| 26 | `jazz_guitar` | Electric Guitar (jazz) | 爵士电吉他 |
| 27 | `clean_guitar` | Electric Guitar (clean) | 清音电吉他 |
| 29 | `overdriven_guitar` | Overdriven Guitar | 过载吉他 |
| 30 | `distortion_guitar` | Distortion Guitar | 失真吉他 |
| 32 | `acoustic_bass` | Acoustic Bass | 原声贝斯 |
| 33 | `finger_bass` | Electric Bass (finger) | 指弹电贝斯 |
| 34 | `pick_bass` | Electric Bass (pick) | 拨片电贝斯 |
| 38 | `synth_bass` | Synth Bass 1 | 合成贝斯 1 |
| 40 | `violin` | Violin | 小提琴 |
| 41 | `viola` | Viola | 中提琴 |
| 42 | `cello` | Cello | 大提琴 |
| 43 | `contrabass` | Contrabass | 低音提琴 |
| 44 | `tremolo_strings` | Tremolo Strings | 震音弦乐 |
| 45 | `pizzicato_strings` | Pizzicato Strings | 拨弦弦乐 |
| 46 | `harp` | Orchestral Harp | 竖琴 |
| 47 | `timpani` | Timpani | 定音鼓 |
| 48 | `strings` | String Ensemble 1 | 弦乐合奏 1 |
| 49 | `strings_slow` | String Ensemble 2 | 弦乐合奏 2 |
| 50 | `strings_synth` | Synth Strings 1 | 合成弦乐 1 |
| 52 | `choir_aahs` | Choir Aahs | 人声「啊」 |
| 53 | `voice_oohs` | Voice Oohs | 人声「哦」 |
| 55 | `orchestra_hit` | Orchestra Hit | 管弦乐齐奏 |
| 56 | `trumpet` | Trumpet | 小号 |
| 57 | `trombone` | Trombone | 长号 |
| 58 | `tuba` | Tuba | 大号 |
| 60 | `french_horn` | French Horn | 圆号 |
| 61 | `brass_section` | Brass Section | 铜管组 |
| 62 | `synth_brass` | Synth Brass 1 | 合成铜管 1 |
| 64 | `soprano_sax` | Soprano Sax | 高音萨克斯 |
| 65 | `alto_sax` | Alto Sax | 中音萨克斯 |
| 66 | `tenor_sax` | Tenor Sax | 次中音萨克斯 |
| 68 | `oboe` | Oboe | 双簧管 |
| 69 | `english_horn` | English Horn | 英国管 |
| 70 | `bassoon` | Bassoon | 大管 |
| 71 | `clarinet` | Clarinet | 单簧管 |
| 72 | `piccolo` | Piccolo | 短笛 |
| 73 | `flute` | Flute | 长笛 |
| 74 | `recorder` | Recorder | 竖笛 |
| 75 | `pan_flute` | Pan Flute | 排箫 |
| 79 | `ocarina` | Ocarina | 陶笛 |
| 80 | `square_lead` | Lead 1 (square) | 方波主音 |
| 81 | `saw_lead` | Lead 2 (sawtooth) | 锯齿主音 |
| 82 | `calliope_lead` | Lead 3 (calliope) | 汽笛主音 |
| 89 | `warm_pad` | Pad 2 (warm) | 温暖音垫 |
| 92 | `bowed_glass` | Pad 5 (bowed) | 弓弦音垫 |
| 97 | `fx_soundtrack` | FX 2 (soundtrack) | 音轨效果 |
| 98 | `crystal` / `fx_crystal` | FX 3 (crystal) | 水晶效果 |
| 99 | `atmosphere` | FX 4 (atmosphere) | 大气效果 |
| 100 | `brightness` | FX 5 (brightness) | 明亮效果 |
| 101 | `goblins` | FX 6 (goblins) | 小妖精效果 |
| 102 | `echoes` | FX 7 (echoes) | 回声效果 |
| 103 | `sci_fi` | FX 8 (sci-fi) | 科幻效果 |
| 122 | `fx_seashore` | Seashore | 海浪 |
| 123 | `fx_bird` | Bird Tweet | 鸟鸣 |
| 125 | `fx_helicopter` | Helicopter | 直升机 |

> 其它编号未在 `musiclib.GM` 中暴露。需要时直接用数字传给 `p.track(name, program=数字)`。

## 打击乐（通道 9，pitch 即鼓件号）

`musiclib.DRUMS` 暴露的条目：

| pitch | key | 英文名 | 中文名 |
|---|---|---|---|
| 36 | `kick` | Bass Drum 1 | 底鼓 |
| 37 | `snare_rim` | Side Stick | 边击 |
| 38 | `snare` | Acoustic Snare | 军鼓 |
| 39 | `clap` | Hand Clap | 拍手 |
| 41 | `tom_low` | Low Floor Tom | 低音通鼓 |
| 42 | `hh_closed` | Closed Hi-Hat | 闭合踩镲 |
| 44 | `hh_pedal` | Pedal Hi-Hat | 踩镲（踏板） |
| 46 | `hh_open` | Open Hi-Hat | 开放踩镲 |
| 47 | `tom_mid` | Low-Mid Tom | 中低通鼓 |
| 49 | `crash` | Crash Cymbal 1 | 强音镲 |
| 50 | `tom_high` | High Tom | 高音通鼓 |
| 51 | `ride` | Ride Cymbal 1 | 叮叮镲 |
| 53 | `ride_bell` | Ride Bell | 叮叮镲铃 |
| 54 | `tambourine` | Tambourine | 铃鼓 |
| 56 | `cowbell` | Cowbell | 牛铃 |
| 82 | `shaker` | Shaker | 沙锤 |
