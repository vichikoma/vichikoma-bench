# -*- coding: utf-8 -*-
"""从 .blend 出发批量渲染（Eevee Next, headless）。

用法:
  blender -b <scene.blend> --python render.py -- <mode> <out_dir> [samples]

mode: hero | sheet | top | close | low
  每次渲染打印 RENDER_OK，出错打印 RENDER_FAIL。
"""
import math
import os
import sys

import bpy
from mathutils import Vector

MODES = {
    # 主图：3/4 视角（相机在右前方）
    'hero': dict(res=(1500, 1500), lens=54.0, dist=23.2, target=(0.0, 0.0, 1.72),
                 az=(-42.0,), elev=18.5, samples=110),
    # 转台自查：6 个方位角小图
    'sheet': dict(res=(640, 640), lens=50.0, dist=27.0, target=(0.0, 0.0, 1.60),
                  az=(0.0, 60.0, 120.0, 180.0, 240.0, 300.0), elev=19.0, samples=24),
    # 俯视：查布局
    'top': dict(res=(1000, 1000), lens=45.0, dist=26.0, target=(0.0, 0.0, 0.10),
                az=(-90.0,), elev=88.0, samples=20),
    # 房屋特写
    'close': dict(res=(1100, 1100), lens=68.0, dist=13.5, target=(0.15, 0.35, 2.20),
                  az=(-46.0,), elev=13.0, samples=90),
    # 正对 -Y 山墙（门/窗所在面）
    'front': dict(res=(1000, 1000), lens=62.0, dist=14.0, target=(0.15, 0.30, 1.95),
                  az=(-72.0,), elev=9.0, samples=70),
    # 正对 +X 侧墙（大窗/高侧窗所在面）
    'side': dict(res=(1000, 1000), lens=62.0, dist=14.0, target=(0.15, 0.30, 1.95),
                 az=(18.0,), elev=9.0, samples=70),
    # 低机位：院子 + 火塘 + 冰湖
    'low': dict(res=(1400, 1000), lens=45.0, dist=15.5, target=(-0.9, -1.6, 1.10),
                az=(-28.0,), elev=7.0, samples=90),
}


def cam_pos(az, elev, dist, target):
    a, e = math.radians(az), math.radians(elev)
    d = Vector((math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e)))
    return Vector(target) + d * dist


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    mode = argv[0] if argv else 'hero'
    out_dir = os.path.abspath(argv[1]) if len(argv) > 1 else os.path.abspath(".")
    samples = int(argv[2]) if len(argv) > 2 else None
    cfg = MODES[mode]
    os.makedirs(out_dir, exist_ok=True)

    scn = bpy.context.scene
    cam = scn.camera
    cam.data.lens = cfg['lens']
    scn.render.resolution_x, scn.render.resolution_y = cfg['res']
    if samples:
        scn.eevee.taa_render_samples = samples

    ok = []
    for az in cfg['az']:
        cam.location = cam_pos(az, cfg['elev'], cfg['dist'], cfg['target'])
        d = Vector(cfg['target']) - cam.location
        cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
        path = os.path.join(out_dir, "%s_az%03d.png" % (mode, int(round(az % 360))))
        scn.render.filepath = path
        bpy.ops.render.render(write_still=True)
        if os.path.exists(path):
            ok.append(path)
            print("RENDER_OK: %s (az=%g)" % (path, az))
        else:
            print("RENDER_FAIL: %s" % path)
    print("MODE_DONE: %s n=%d" % (mode, len(ok)))


main()
