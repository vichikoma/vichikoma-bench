# -*- coding: utf-8 -*-
"""冬季微缩展示台（diorama）建模入口。

用法:
  blender --background --factory-startup --python build.py -- <out.blend> [out.glb]

依赖同目录 lib_diorama.py（本脚本目录会自动加入 sys.path）。
"""
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

import lib_diorama as L


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    out_blend = argv[0] if argv else os.path.join(HERE, "diorama.blend")
    out_glb = argv[1] if len(argv) > 1 else os.path.splitext(out_blend)[0] + ".glb"
    out_blend = os.path.abspath(out_blend)
    out_glb = os.path.abspath(out_glb)

    L.clear_scene()
    data = L.assemble()

    scn = bpy.context.scene
    # ---- 渲染设置：Eevee Next
    scn.render.engine = 'BLENDER_EEVEE_NEXT'
    scn.render.resolution_x = 1400
    scn.render.resolution_y = 1400
    scn.render.resolution_percentage = 100
    scn.render.film_transparent = False
    scn.render.image_settings.file_format = 'PNG'
    try:
        scn.view_settings.view_transform = 'AgX'
        scn.view_settings.look = 'AgX - Punchy'
    except Exception as exc:
        print("view transform fallback:", exc)
    scn.view_settings.exposure = 0.15
    ee = scn.eevee
    for k, v in (("use_shadows", True), ("shadow_ray_count", 4), ("shadow_step_count", 8),
                 ("taa_render_samples", 72), ("use_gtao", True), ("use_raytracing", True),
                 ("use_volumetric_shadows", False)):
        try:
            setattr(ee, k, v)
        except Exception as exc:
            print("eevee skip", k, exc)
    try:
        ee.ray_tracing_options.use_denoise = True
    except Exception:
        pass

    # ---- 泛光（合成器 Glare）
    scn.use_nodes = True
    ct = scn.node_tree
    ct.nodes.clear()
    rl = ct.nodes.new('CompositorNodeRLayers')
    glare = ct.nodes.new('CompositorNodeGlare')
    glare.glare_type = 'FOG_GLOW'
    glare.quality = 'HIGH'
    glare.threshold = 0.85
    glare.size = 7
    comp = ct.nodes.new('CompositorNodeComposite')
    ct.links.new(rl.outputs['Image'], glare.inputs['Image'])

    # 冷暗部 / 暖亮部（split tone）
    cb = ct.nodes.new('CompositorNodeColorBalance')
    cb.correction_method = 'LIFT_GAMMA_GAIN'
    cb.lift = (0.980, 0.995, 1.030)
    cb.gamma = (1.000, 0.998, 0.995)
    cb.gain = (1.045, 1.005, 0.968)
    ct.links.new(glare.outputs['Image'], cb.inputs['Image'])
    ct.links.new(cb.outputs['Image'], comp.inputs['Image'])

    # ---- 默认英雄机位
    p, t = L.cam_from(-42.0, 21.0, 24.0, (0.0, 0.0, 1.75))
    L.add_camera(p, t, lens=50.0, name="CamHero")

    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print("BLEND_OK:", out_blend)

    n_tri = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
    print("STATS: objects=%d meshes=%d polys=%d" % (
        len(bpy.data.objects), len(bpy.data.meshes), n_tri))

    bpy.ops.export_scene.gltf(filepath=out_glb, export_format='GLB', export_apply=True,
                              export_draco_mesh_compression_enable=False)
    print("EXPORT_OK:", out_glb)


main()
