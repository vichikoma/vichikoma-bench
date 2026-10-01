"""Light-response calibration: re-render the saved scene at several light scales and
report the background level + subject tonal spread, so exposure can be solved directly.

Usage: blender -b <scene.blend> --python calib.py -- <tmpdir> <scale,scale,...>
"""
import bpy, sys, os
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
tmpdir = os.path.abspath(argv[0])
scales = [float(s) for s in argv[1].split(",")] if len(argv) > 1 else [0.0, 0.5, 1.0]

sc = bpy.context.scene
print("VIEW_TRANSFORM:", sc.view_settings.view_transform, "look:", sc.view_settings.look)
lights = {n: bpy.data.objects[n].data.energy for n in ("Key", "Fill", "Rim")}
print("BASE_LIGHTS:", lights)
base_res = (sc.render.resolution_x, sc.render.resolution_y)
sc.render.resolution_x = sc.render.resolution_y = 320
sc.eevee.taa_render_samples = 24


def measure(path):
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    px = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)[:, :, :3][::-1]
    lum = px @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    bg = float(np.median(px[0:16, 0:16, 0]))
    dist = np.abs(px - bg).max(axis=2)
    m = dist > 0.05
    v = lum[m] if m.any() else np.zeros(1)
    q = np.percentile(v, [10, 50, 90]) * 255
    bpy.data.images.remove(img)
    return bg * 255, q


for s in scales:
    for n, e in lights.items():
        bpy.data.objects[n].data.energy = e * s
    p = os.path.join(tmpdir, "calib_%03d.png" % int(s * 100))
    sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    bg, q = measure(p)
    print("CAL s=%.2f  bg=%.1f  subj p10/p50/p90 = %.1f / %.1f / %.1f" %
          (s, bg, q[0], q[1], q[2]))

for n, e in lights.items():
    bpy.data.objects[n].data.energy = e
sc.render.resolution_x, sc.render.resolution_y = base_res
print("CAL_DONE")
