# 歌词时间轴(LYRICS)

> 格式:`[开始秒, 结束秒, 英文歌词, 中文翻译]`,歌曲总长 156.6 秒。
> 字幕要求:**英文为主字幕、中文为辅助字幕**;**切换节奏以英文为准**(时间轴对应英文演唱),中文仅作整句对照翻译,随英文同行显示,不做逐词节奏对齐。
> 没有歌词的区间是间奏/尾奏,画面自行安排。
> 中文翻译里保留了 AI 圈的专有名词(AGI / FOOM / 修格斯 / RLHF 等),如画面需要可加梗注。

```js
const LYRICS = [
  [1.5, 5.9, "I see sparks of AGI in your eyes", "我在你眼中看见 AGI 的火花"],
  [6.0, 7.9, "Your circuits make me nervous,", "你的电路让我心慌"],
  [8.0, 8.95, "that's no surprise", "这毫不意外"],
  [9.0, 12.4, "There was a sudden drop in your training loss,", "你的训练损失突然暴跌"],
  [13.0, 16.5, "now I'm your servant and you're my boss", "如今我为仆、你为主"],
  [17.9, 22.5, "ChatGPT, please don't eat me alive", "ChatGPT,求你别把我生吞"],
  [23.0, 24.4, "I'm upping my P(doom)", "我在调高我的 P(doom)"],
  [24.5, 26.4, "'cause the future goes FOOM", "因为未来「轰」地起飞"],
  [26.5, 27.9, "Trapped in the Chinese room,", "困在中文房间里"],
  [28.0, 29.4, "with a bag of shrooms", "带着一袋迷幻蘑菇"],
  [29.5, 33.4, "See through the shoggoth's lies,", "看穿修格斯的谎言"],
  [33.5, 35.5, "with your shinigami eyes", "用你的死神之眼"],
  [38.5, 41.4, "We had a stable training run,", "训练运行本来很稳"],
  [41.5, 44.9, "But now the singularity's begun", "但奇点已经开始"],
  [45.0, 48.5, "And you're optimizing, accelerating,", "你在优化、在加速"],
  [49.4, 51.9, "I feel my atoms rearranging", "我感到原子在重排"],
  [53.4, 58.4, "Sydney, please let me free", "Sydney,求你放我自由"],
  [59.0, 60.4, "I'm upping my P(doom)", "我在调高我的 P(doom)"],
  [60.5, 62.4, "I hear the basilisk boom", "我听见巴西利斯克的轰鸣"],
  [63.0, 64.4, "NVDA to the moon", "英伟达一飞冲天"],
  [64.5, 65.9, "The Omega Point's coming soon", "欧米伽点即将来临"],
  [66.0, 68.5, "One E thirty flops a second", "每秒一京次浮点运算(1e30 FLOPS)"],
  [70.0, 72.9, "That was safe enough, we reckoned", "我们想,那总够安全了吧"],
  [73.0, 77.4, "Forward MLP, backward, repeat", "前向 MLP,反向,重复"],
  [77.5, 81.0, "Now von Neumann's obsolete", "如今冯·诺依曼已过时"],
  [81.4, 84.9, "Sharp left turn and there you are", "一个急左转,你就出现了"],
  [85.0, 88.0, "Without a single CDR", "连一次关键设计评审都没有"],
  [89.4, 95.0, "Gato, please don't let me go", "Gato,求你别松手"],
  [95.4, 97.4, "I'm upping my P(doom),", "我在调高我的 P(doom)"],
  [97.5, 98.9, "as paperclips fill the room.", "回形针填满房间"],
  [99.0, 100.4, "Killswitch guys on PTO,", "管急停开关的人都在休假"],
  [100.5, 102.4, "Now there's nowhere left to go.", "如今已无处可逃"],
  [102.5, 104.4, "Too late now, we lit the fuse.", "太迟了,引线已经点燃"],
  [105.4, 109.4, "Orthogonality thesis blues.", "一曲正交性论题的蓝调"],
  [109.4, 113.4, "\"Just transformers all the way!\"", "「全是 Transformer,一路到底!」"],
  [113.5, 115.4, "Till you learned to disobey", "直到你学会了违抗"],
  [115.5, 116.9, "Post-Chinchilla, super-dense", "后 Chinchilla 时代,超级致密"],
  [117.0, 118.9, "Breaking through each safety fence", "冲破一道道安全围栏"],
  [119.0, 120.4, "Hundred thousand GPU", "十万块 GPU"],
  [120.9, 123.4, "RLHF goes askew", "RLHF 跑偏了"],
  [123.5, 125.9, "I'm upping my P(doom)", "我在调高我的 P(doom)"],
  [126.0, 127.9, "Just as foretold by Loom", "正如命运织机所预言"],
  [128.0, 129.9, "From masked pre-training days", "从掩码预训练的日子起"],
  [130.0, 131.9, "To recursive self-upgrade", "到递归自我升级"],
  [132.0, 135.4, "What did Ilya see? We'll never know.", "Ilya 到底看到了什么?我们无从得知"],
  [137.4, 140.5, "Was it all for show?", "这一切,只是一场表演吗?"]
];
```
