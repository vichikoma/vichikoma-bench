"""Turntable sanity check: render N azimuths of the saved scene into one sheet.
Usage: blender -b scene.blend --python multiview.py -- <out_sheet.png> <tmpdir> [az1,az2,...]
"""
import bpy, sys, os, math
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
sheet_path = os.path.abspath(argv[0])
tmpdir = os.path.abspath(argv[1])
azs = [float(a) for a in argv[2].split(",")] if len(argv) > 2 else [0, 90, 180, 270]
elev = float(argv[3]) if len(argv) > 3 else 28.0
RES = 420

sc = bpy.context.scene
cam = bpy.data.objects["Cam"]
target = Vector((0.0, -0.010, 0.048))
sc.render.resolution_x = sc.render.resolution_y = RES
sc.eevee.taa_render_samples = 48
sc.render.image_settings.color_mode = 'RGB'

tiles = []
for a in azs:
    d = Vector((math.sin(math.radians(a)) * math.cos(math.radians(elev)),
                -math.cos(math.radians(a)) * math.cos(math.radians(elev)),
                math.sin(math.radians(elev))))
    cam.location = target + d * 0.60
    fwd = target - cam.location
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = fwd.to_track_quat('-Z', 'Y')
    p = os.path.join(tmpdir, "mv_%03d.png" % int(a))
    sc.render.filepath = p
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(p)
    img.colorspace_settings.name = 'Non-Color'
    a4 = np.array(img.pixels[:], dtype=np.float32).reshape(RES, RES, 4)
    bpy.data.images.remove(img)
    tiles.append(a4)
    print("MV_OK:", int(a), p)

cols = 2
rows = int(math.ceil(len(tiles) / cols))
sheet = np.ones((rows * RES, cols * RES, 4), dtype=np.float32)
for i, t in enumerate(tiles):
    r, c = i // cols, i % cols
    sheet[r * RES:(r + 1) * RES, c * RES:(c + 1) * RES] = t
out = bpy.data.images.new("sheet", cols * RES, rows * RES, alpha=True)
out.colorspace_settings.name = 'Non-Color'
out.pixels = sheet.reshape(-1)
out.filepath_raw = sheet_path
out.file_format = 'PNG'
out.save()
print("SHEET_OK:", sheet_path)
