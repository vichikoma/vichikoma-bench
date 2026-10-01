"""Render script: open saved .blend, render a still with given camera.
Usage: blender -b scene.blend --python render_diorama.py -- <out.png> [CAM_NAME] [res]
"""
import bpy, sys, os

argv = sys.argv[sys.argv.index("--") + 1:]
out_path = os.path.abspath(argv[0])
cam_name = argv[1] if len(argv) > 1 else "CAM_MAIN"
res = int(argv[2]) if len(argv) > 2 else 1600

scn = bpy.context.scene
if cam_name in bpy.data.objects:
    scn.camera = bpy.data.objects[cam_name]
scn.render.resolution_x = res
scn.render.resolution_y = res
scn.eevee.taa_render_samples = 128
scn.render.filepath = out_path

bpy.ops.render.render(write_still=True)
print("RENDER_OK:", out_path, "cam:", scn.camera.name if scn.camera else "none")
