"""Probe a rendered PNG: background level, subject framing, tonal spread, shadow depth.
Usage: blender -b --factory-startup --python analyze.py -- <png> [bg_x0 bg_y0]
"""
import bpy, sys, os
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
path = os.path.abspath(argv[0])

img = bpy.data.images.load(path)
img.colorspace_settings.name = 'Non-Color'
w, h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, :, :3]
px = px[::-1]                                     # top-down
lum = px @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)

corner = px[0:50, 0:50].reshape(-1, 3)
bg = np.median(corner, axis=0)
dist = np.abs(px - bg).max(axis=2)
mask = dist > 0.05
ys, xs = np.nonzero(mask)
print("IMG: %dx%d" % (w, h))
print("BG corner median (sRGB 0-255): %.1f  (linear %.4f)" % (bg[0] * 255, bg[0] ** 2.2 * 1.0))
# background gradient: sample the row band just above the subject
top_band = px[8:40, :, :].reshape(-1, 3)
print("BG top band median: %.1f   bottom corners: %.1f %.1f" % (
    np.median(top_band[:, 0]) * 255,
    np.median(px[-40:, 0:60, 0]) * 255, np.median(px[-40:, -60:, 0]) * 255))
if len(xs):
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    print("SUBJ bbox px: x[%d..%d] y[%d..%d]  w=%d h=%d  fill_w=%.3f fill_h=%.3f centre=(%.3f,%.3f)" % (
        x0, x1, y0, y1, x1 - x0, y1 - y0, (x1 - x0) / w, (y1 - y0) / h,
        (x0 + x1) / 2 / w, (y0 + y1) / 2 / h))
    core = mask.copy()
    core[y0:y1 + 1, x0:x1 + 1] &= True
    sel = lum[y0:y1 + 1, x0:x1 + 1]
    m = mask[y0:y1 + 1, x0:x1 + 1]
    v = sel[m]
    if v.size:
        q = np.percentile(v, [5, 25, 50, 75, 95])
        print("SUBJ luminance p5/p25/p50/p75/p95 (0-255): " +
              " ".join("%.1f" % (x * 255) for x in q))
        print("SUBJ max=%.1f  frac>0.96=%.4f  frac<0.03=%.4f" % (
            v.max() * 255, float((v > 0.96).mean()), float((v < 0.03).mean())))
    # contact shadow: darkest value in a band under the subject
    band = lum[min(y1 + 4, h - 1):min(y1 + 40, h), max(x0 - 40, 0):min(x1 + 40, w)]
    if band.size:
        print("SHADOW band min=%.1f p5=%.1f (bg %.1f -> depth %.1f%%)" % (
            band.min() * 255, np.percentile(band, 5) * 255, bg[0] * 255,
            100.0 * (1 - np.percentile(band, 5) / max(bg[0], 1e-6))))
