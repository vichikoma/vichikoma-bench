# -*- coding: utf-8 -*-
"""最终成图后处理：暗角 + 轻微提亮中心（PIL）。

用法:
  python finalize.py <src.png> <dst.png> [vignette=0.16]

渲染本身（.blend 里的 compositor）已经做了：辉光(FOG_GLOW) + 冷暗部/暖亮部调色。
这里只补暗角，把观者的视线收拢到底座主体上。
"""
import sys

from PIL import Image, ImageFilter

src, dst = sys.argv[1], sys.argv[2]
k = float(sys.argv[3]) if len(sys.argv) > 3 else 0.16

im = Image.open(src).convert("RGB")
w, h = im.size

# 椭圆遮罩：中心 1，四角 0（用渐晕的方式画，再模糊）
mask = Image.new("L", (w, h), 0)
d = int(min(w, h) * 1.10)
mask.paste(255, ((w - d) // 2, (h - d) // 2, (w + d) // 2, (h + d) // 2),
           Image.new("L", (d, d), 255).filter(ImageFilter.GaussianBlur(d * 0.22)))
mask = mask.filter(ImageFilter.GaussianBlur(min(w, h) * 0.06))

px = im.load()
mp = mask.load()
for y in range(h):
    for x in range(w):
        f = 1.0 - k * (1.0 - mp[x, y] / 255.0)
        r, g, b = px[x, y]
        px[x, y] = (min(255, int(r * f + 0.5)), min(255, int(g * f + 0.5)),
                    min(255, int(b * f + 0.5)))
im.save(dst)
print("FINAL_OK", dst, im.size, "vignette=%.2f" % k)
