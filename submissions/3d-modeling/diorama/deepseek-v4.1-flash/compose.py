# -*- coding: utf-8 -*-
"""把多角度渲染拼成对照图（自查 / 交付用）。

用法:
  python compose.py <renders_dir> <out.png> <mode:sheet|detail>
"""
import os
import sys

from PIL import Image

rd, out, mode = sys.argv[1], sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else "sheet")


def load(name):
    return Image.open(os.path.join(rd, name)).convert("RGB")


def grid(imgs, cols, cell, bg=(20, 26, 36), pad=10):
    rows = (len(imgs) + cols - 1) // cols
    W = cols * cell + (cols + 1) * pad
    H = rows * cell + (rows + 1) * pad
    canvas = Image.new("RGB", (W, H), bg)
    for i, im in enumerate(imgs):
        r, c = divmod(i, cols)
        im = im.copy()
        im.thumbnail((cell, cell), Image.LANCZOS)
        x = pad + c * (cell + pad) + (cell - im.width) // 2
        y = pad + r * (cell + pad) + (cell - im.height) // 2
        canvas.paste(im, (x, y))
    return canvas


if mode == "sheet":
    names = ["sheet_az%03d.png" % a for a in (0, 60, 120, 180, 240, 300)]
    grid([load(n) for n in names], 3, 620).save(out)
else:
    imgs = [load("close_az314.png"), load("low_az332.png")]
    grid(imgs, 2, 720).save(out)
print("COMPOSE_OK", out)
