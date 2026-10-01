# -*- coding: utf-8 -*-
"""列出指定世界坐标区域内的对象（用于定位可疑的白色圆盘）。"""
import sys
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
x0, x1, y0, y1 = (float(v) for v in argv[:4]) if len(argv) >= 4 else (3.0, 8.0, -7.0, 0.0)

print("REGION x[%.1f,%.1f] y[%.1f,%.1f]" % (x0, x1, y0, y1))
rows = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    cx = sum(v.x for v in bb) / 8.0
    cy = sum(v.y for v in bb) / 8.0
    if not (x0 <= cx <= x1 and y0 <= cy <= y1):
        continue
    sx = max(v.x for v in bb) - min(v.x for v in bb)
    sy = max(v.y for v in bb) - min(v.y for v in bb)
    sz = max(v.z for v in bb) - min(v.z for v in bb)
    mat = o.data.materials[0].name if o.data.materials else "-"
    rows.append((cx, cy, o.name, sx, sy, sz, max(v.z for v in bb), mat))
rows.sort(key=lambda r: (r[1], r[0]))
for cx, cy, name, sx, sy, sz, ztop, mat in rows:
    print("  (%6.2f,%6.2f) %-26s size %5.2f x %5.2f x %5.2f  ztop %5.2f  %s"
          % (cx, cy, name, sx, sy, sz, ztop, mat))
print("COUNT", len(rows))
