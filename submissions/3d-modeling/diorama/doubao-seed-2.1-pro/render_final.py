"""Render final winter diorama image from saved .blend.
Usage:
    blender -b <blend> --python render_final.py -- <output.png> <azimuth_deg>
"""
import bpy, sys, math, mathutils

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]
az = float(argv[1]) if len(argv) > 1 else 135.0
elev = float(argv[2]) if len(argv) > 2 else 28.0
dist = float(argv[3]) if len(argv) > 3 else 7.5

scene = bpy.context.scene
cam = scene.camera

a = math.radians(az)
e = math.radians(elev)
loc = mathutils.Vector((
    math.cos(e)*math.cos(a) * dist,
    math.cos(e)*math.sin(a) * dist,
    math.sin(e) * dist
))
# shift up a bit
loc.z += 0.8
cam.location = loc
target = mathutils.Vector((0, -0.1, 0.7))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z','Y').to_euler()

scene.render.filepath = out
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_depth = '8'
bpy.ops.render.render(write_still=True)
print("RENDER_OK:", out)
