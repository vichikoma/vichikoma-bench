"""
1970s Vintage SLR Camera — v9 (FINAL)
Magazine-quality polish: dramatic contact shadow, prominent viewfinder
eyepiece, refined materials, dramatic three-point lighting.
"""
import bpy
import math
from mathutils import Vector

# ---------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.eevee.taa_render_samples = 128
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 0.25
scene.view_settings.exposure = 0.15
scene.view_settings.gamma = 1.0
scene.view_settings.view_transform = 'Filmic'
scene.view_settings.look = 'High Contrast'

# World
world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
wn = world.node_tree
wn.nodes.clear()
bg = wn.nodes.new('ShaderNodeBackground')
out = wn.nodes.new('ShaderNodeOutputWorld')
bg.inputs['Color'].default_value = (0.910, 0.910, 0.910, 1.0)
bg.inputs['Strength'].default_value = 0.55
wn.links.new(bg.outputs['Background'], out.inputs['Surface'])

# ---------------------------------------------------------------------------
def purge():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.lights,
                bpy.data.cameras, bpy.data.curves):
        for o in list(col):
            if o.users == 0:
                col.remove(o)

def add_box(name, scale, loc, rot=(0, 0, 0), bevel=0.0, seg=1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot,
                                    scale=scale)
    obj = bpy.context.active_object
    obj.name = name
    if bevel > 0:
        bpy.ops.object.modifier_add(type='BEVEL')
        obj.modifiers['Bevel'].width = bevel
        obj.modifiers['Bevel'].segments = seg
        bpy.ops.object.modifier_apply(modifier='Bevel')
    return obj

def add_cyl(name, r, h, loc, rot=(0, 0, 0), seg=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, vertices=seg,
                                        location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    if bevel > 0:
        bpy.ops.object.modifier_add(type='BEVEL')
        obj.modifiers['Bevel'].width = bevel
        obj.modifiers['Bevel'].segments = 4
        bpy.ops.object.modifier_apply(modifier='Bevel')
    return obj

def add_torus(name, R, r, loc, rot=(0, 0, 0), seg=64):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
                                      major_segments=seg, minor_segments=24,
                                      location=loc, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    return obj

def shade_smooth(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()

def look_at(obj_cam, target):
    direction = (target - obj_cam.location).normalized()
    rot = direction.to_track_quat('-Z', 'Y').to_euler()
    obj_cam.rotation_euler = rot

purge()

# ---------------------------------------------------------------------------
# Geometry — moderate proportions for ~70% frame fill
# ---------------------------------------------------------------------------
BW = 1.45
BD = 0.55
BH = 0.95
TOP_THK = 0.06
BASE_THK = 0.045

body = add_box('Body', (BW, BD, BH), loc=(0, 0, BH / 2),
               bevel=0.05, seg=3)
top_plate = add_box('TopPlate', (BW + 0.02, BD + 0.02, TOP_THK),
                    loc=(0, 0, BH - TOP_THK / 2 + 0.001),
                    bevel=0.014, seg=3)
base_plate = add_box('BasePlate', (BW + 0.005, BD + 0.005, BASE_THK),
                     loc=(0, 0, BASE_THK / 2 - 0.001),
                     bevel=0.008)

# Pentaprism — slightly tilted forward by building it from two parts
# Main housing (rectangular, slightly forward-leaning)
PH_W = 0.62
PH_D = 0.36
PH_H = 0.38
pent = add_box('Pentaprism', (PH_W, PH_D, PH_H),
               loc=(0.05, 0.02, BH + PH_H / 2 + 0.005),
               bevel=0.04, seg=3)
# Add a darker base trim where prism meets top plate
prism_base = add_box('PrismBaseTrim', (PH_W + 0.02, PH_D + 0.02, 0.008),
                     loc=(0.05, 0.02, BH + 0.005),
                     bevel=0.002)
# Top angled "roof" - small chamfer block on top of prism
roof = add_box('PrismRoof', (PH_W * 0.85, PH_D * 0.7, 0.04),
               loc=(0.05, 0.02, BH + PH_H + 0.025),
               bevel=0.008)

# Eyepiece (back of pentaprism)
eyepiece_box = add_box('EyepieceBox', (0.22, 0.06, 0.22),
                       loc=(0.05, -PH_D / 2 - 0.03,
                            BH + PH_H - 0.07),
                       bevel=0.015)
# Eyecup - softer torus + a slightly bigger outer flange
eyecup = add_torus('EyeCup', 0.115, 0.025,
                   loc=(0.05, -PH_D / 2 - 0.060,
                        BH + PH_H - 0.07),
                   rot=(math.radians(90), 0, 0))

# Hot shoe
hot_shoe = add_box('HotShoe', (0.26, 0.22, 0.026),
                   loc=(0.05, 0.10, BH + PH_H + 0.018),
                   bevel=0.003)
hot_shoe_inner = add_box('HotShoeInner', (0.21, 0.15, 0.018),
                         loc=(0.05, 0.10, BH + PH_H + 0.019))
for i, ox in enumerate([-0.07, 0.0, 0.07]):
    add_box(f'HotContact{i}', (0.018, 0.005, 0.020),
            loc=(ox, 0.10, BH + PH_H + 0.018))

# Nameplate — slim, refined
nameplate = add_box('Nameplate', (0.48, 0.010, 0.085),
                    loc=(0.0, BD / 2 + 0.005, BH - 0.17),
                    bevel=0.004)
# Engraved line under nameplate
nameplate_line = add_box('NameplateLine', (0.48, 0.012, 0.002),
                         loc=(0.0, BD / 2 + 0.005, BH - 0.130))

# ---------------------------------------------------------------------------
# LENS
# ---------------------------------------------------------------------------
LZ = BH / 2

mount_ring = add_cyl('MountRing', 0.30, 0.045,
                     loc=(0, BD / 2 + 0.020, LZ),
                     rot=(math.radians(90), 0, 0),
                     bevel=0.005)
barrel_back = add_cyl('BarrelBack', 0.28, 0.06,
                      loc=(0, BD / 2 + 0.072, LZ),
                      rot=(math.radians(90), 0, 0))
focus_ring = add_cyl('FocusRing', 0.31, 0.18,
                     loc=(0, BD / 2 + 0.195, LZ),
                     rot=(math.radians(90), 0, 0))
aperture_ring = add_cyl('ApertureRing', 0.295, 0.075,
                        loc=(0, BD / 2 + 0.323, LZ),
                        rot=(math.radians(90), 0, 0))
marks_ring = add_cyl('MarksRing', 0.297, 0.007,
                     loc=(0, BD / 2 + 0.363, LZ),
                     rot=(math.radians(90), 0, 0))
front_rim = add_cyl('FrontRim', 0.31, 0.028,
                    loc=(0, BD / 2 + 0.382, LZ),
                    rot=(math.radians(90), 0, 0))
front_glass = add_cyl('FrontGlass', 0.26, 0.016,
                      loc=(0, BD / 2 + 0.392, LZ),
                      rot=(math.radians(90), 0, 0))

lens_tints = [
    (0.030, 0.20, (0.35, 0.50, 0.45)),
    (-0.020, 0.17, (0.30, 0.42, 0.38)),
    (-0.080, 0.15, (0.25, 0.35, 0.32)),
    (-0.140, 0.12, (0.15, 0.20, 0.22)),
    (-0.210, 0.10, (0.08, 0.10, 0.12)),
]
for i, (yoff, r, tint) in enumerate(lens_tints):
    add_cyl(f'LensDisc{i}', r, 0.010,
            loc=(0, BD / 2 + 0.382 - yoff, LZ),
            rot=(math.radians(90), 0, 0))

red_dot = add_torus('LensRedDot', 0.026, 0.005,
                    loc=(0, BD / 2 + 0.075, LZ + 0.32),
                    rot=(math.radians(90), 0, 0))

# Engraved tick marks on top of focus ring
for i, off in enumerate([-0.065, -0.030, 0.005, 0.045, 0.085]):
    add_cyl(f'FocusMark{i}', 0.004, 0.005,
            loc=(0, BD / 2 + 0.195 + off, LZ + 0.31),
            rot=(math.radians(90), 0, 0))
for i, off in enumerate([-0.025, 0.0, 0.025]):
    add_cyl(f'ApMark{i}', 0.003, 0.005,
            loc=(0, BD / 2 + 0.323 + off, LZ + 0.295),
            rot=(math.radians(90), 0, 0))

# ---------------------------------------------------------------------------
# Top controls
# ---------------------------------------------------------------------------
shutter_base = add_cyl('ShutterBase', 0.045, 0.022,
                       loc=(0.48, 0.18, BH + 0.012),
                       seg=32)
shutter_btn = add_cyl('ShutterBtn', 0.040, 0.038,
                      loc=(0.48, 0.18, BH + 0.042),
                      seg=32)
shutter_dot = add_cyl('ShutterDot', 0.013, 0.006,
                      loc=(0.48, 0.18, BH + 0.064),
                      seg=16)

# Lever
lever_base = add_cyl('LeverBase', 0.030, 0.055,
                     loc=(0.62, 0.18, BH + 0.029),
                     seg=32)
bpy.ops.mesh.primitive_cylinder_add(radius=0.014, depth=0.18,
                                    vertices=24,
                                    location=(0.62, 0.12,
                                              BH + 0.100),
                                    rotation=(math.radians(75), 0, 0))
lever_arm = bpy.context.active_object
lever_arm.name = 'LeverArm'
lever_knob = add_cyl('LeverKnob', 0.024, 0.030,
                     loc=(0.62, 0.050, BH + 0.155),
                     seg=24)

# Shutter speed dial (left of prism)
dial = add_cyl('ShutterDial', 0.075, 0.045,
               loc=(-0.36, 0.18, BH + 0.024),
               seg=32)
dial_notch = add_box('DialNotch', (0.006, 0.006, 0.006),
                     loc=(-0.36, 0.232, BH + 0.052))

# Film rewind knob
rewind_knob = add_cyl('RewindKnob', 0.050, 0.035,
                      loc=(-0.55, -0.12, BH + 0.014),
                      seg=24)
iso_dial = add_cyl('ISODial', 0.044, 0.028,
                   loc=(-0.30, -0.12, BH + 0.014),
                   seg=24)

strap_lug_l = add_torus('StrapLugL', 0.032, 0.009,
                        loc=(-BW / 2 - 0.005, 0.12, BH * 0.87),
                        rot=(0, math.radians(90), 0))
strap_lug_r = add_torus('StrapLugR', 0.032, 0.009,
                        loc=(BW / 2 + 0.005, 0.12, BH * 0.87),
                        rot=(0, math.radians(90), 0))

tripod = add_cyl('TripodSocket', 0.022, 0.012,
                 loc=(0, 0.0, -0.030), seg=24)

# ---------------------------------------------------------------------------
# MATERIALS
# ---------------------------------------------------------------------------
def make_leather(name, base_col=(0.045, 0.045, 0.048)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = base_col + (1.0,)
    bsdf.inputs['Roughness'].default_value = 0.55
    bsdf.inputs['Specular IOR Level'].default_value = 0.3

    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 180.0
    noise.inputs['Detail'].default_value = 8.0
    noise.inputs['Roughness'].default_value = 0.85
    noise.inputs['Distortion'].default_value = 2.5
    noise.location = (-500, 100)

    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.25
    ramp.color_ramp.elements[0].color = (0.002, 0.002, 0.002, 1.0)
    ramp.color_ramp.elements[1].position = 0.65
    ramp.color_ramp.elements[1].color = (0.10, 0.085, 0.075, 1.0)
    ramp.location = (-320, 100)

    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 1.8
    bump.inputs['Distance'].default_value = 0.006
    bump.location = (-320, -200)

    noise2 = nt.nodes.new('ShaderNodeTexNoise')
    noise2.inputs['Scale'].default_value = 55.0
    noise2.inputs['Detail'].default_value = 4.0
    noise2.inputs['Distortion'].default_value = 1.5
    noise2.location = (-500, -250)

    nt.links.new(noise.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(noise2.outputs['Color'], bump.inputs['Height'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

def make_brushed_metal(name, base_col=(0.78, 0.79, 0.83)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = base_col + (1.0,)
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.30

    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 600.0
    noise.inputs['Detail'].default_value = 3.0
    noise.inputs['Roughness'].default_value = 0.5
    noise.location = (-500, 200)

    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.40
    ramp.color_ramp.elements[0].color = (0.50, 0.55, 0.62, 1.0)
    ramp.color_ramp.elements[1].position = 0.60
    ramp.color_ramp.elements[1].color = (0.96, 0.96, 0.98, 1.0)
    ramp.location = (-320, 200)

    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.50
    bump.inputs['Distance'].default_value = 0.0025
    bump.location = (-320, -100)

    noise2 = nt.nodes.new('ShaderNodeTexNoise')
    noise2.inputs['Scale'].default_value = 1500.0
    noise2.inputs['Detail'].default_value = 1.0
    noise2.location = (-500, -50)

    nt.links.new(noise.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    nt.links.new(noise2.outputs['Color'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

def make_knurled_metal(name, base_col=(0.78, 0.79, 0.83)):
    mat = make_brushed_metal(name, base_col)
    nt = mat.node_tree
    for n in nt.nodes:
        if n.type == 'BUMP':
            n.inputs['Strength'].default_value = 0.85
            n.inputs['Distance'].default_value = 0.0050
    return mat

def make_glass(name, tint=(0.35, 0.55, 0.50)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = tint + (1.0,)
    bsdf.inputs['Roughness'].default_value = 0.04
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Alpha'].default_value = 0.7
    bsdf.inputs['Transmission Weight'].default_value = 0.85
    bsdf.inputs['IOR'].default_value = 1.55
    bsdf.inputs['Coat Weight'].default_value = 1.0
    bsdf.inputs['Coat Roughness'].default_value = 0.04
    bsdf.inputs['Coat IOR'].default_value = 1.6
    bsdf.inputs['Coat Tint'].default_value = (0.6, 0.85, 1.0, 1.0)
    mat.blend_method = 'OPAQUE'
    return mat

def make_dark_glass(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (0.08, 0.10, 0.12, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.05
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Alpha'].default_value = 0.85
    bsdf.inputs['Transmission Weight'].default_value = 0.6
    bsdf.inputs['IOR'].default_value = 1.55
    bsdf.inputs['Coat Weight'].default_value = 1.0
    bsdf.inputs['Coat Roughness'].default_value = 0.04
    bsdf.inputs['Coat IOR'].default_value = 1.6
    bsdf.inputs['Coat Tint'].default_value = (0.5, 0.85, 0.7, 1.0)
    mat.blend_method = 'OPAQUE'
    return mat

def make_rubber(name, col=(0.05, 0.05, 0.05)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = col + (1.0,)
    bsdf.inputs['Roughness'].default_value = 0.78
    bsdf.inputs['Specular IOR Level'].default_value = 0.2
    noise = nt.nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 350.0
    noise.inputs['Detail'].default_value = 6.0
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.5
    bump.inputs['Distance'].default_value = 0.001
    nt.links.new(noise.outputs['Color'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat

def make_red(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (0.78, 0.06, 0.06, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.4
    bsdf.inputs['Coat Weight'].default_value = 0.8
    bsdf.inputs['Coat Roughness'].default_value = 0.1
    bsdf.inputs['Coat IOR'].default_value = 1.5
    return mat

def make_gold(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = (0.85, 0.65, 0.30, 1.0)
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.20
    return mat

def make_dark_metal(name, col=(0.10, 0.10, 0.11)):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    bsdf.inputs['Base Color'].default_value = col + (1.0,)
    bsdf.inputs['Metallic'].default_value = 0.85
    bsdf.inputs['Roughness'].default_value = 0.40
    return mat

mat_leather = make_leather('Leather')
mat_brushed = make_brushed_metal('BrushedSilver', (0.78, 0.79, 0.83))
mat_brushed_dark = make_brushed_metal('BrushedDark', (0.30, 0.30, 0.32))
mat_knurled = make_knurled_metal('KnurledSilver')
mat_glass = make_glass('LensGlass', (0.35, 0.55, 0.50))
mat_dark_glass = make_dark_glass('LensDarkGlass')
mat_rubber = make_rubber('Rubber')
mat_red = make_red('RedAccent')
mat_gold = make_gold('GoldContact')
mat_dark = make_dark_metal('DarkMetal')
mat_chrome = make_brushed_metal('Chrome', (0.90, 0.91, 0.93))

mat_assignments = {
    'Body': mat_leather,
    'TopPlate': mat_brushed,
    'BasePlate': mat_brushed,
    'Pentaprism': mat_brushed,
    'PrismBaseTrim': mat_dark,
    'PrismRoof': mat_brushed_dark,
    'EyepieceBox': mat_dark,
    'EyeCup': mat_rubber,
    'Nameplate': mat_chrome,
    'NameplateLine': mat_dark,
    'MountRing': mat_brushed,
    'BarrelBack': mat_brushed_dark,
    'FocusRing': mat_knurled,
    'ApertureRing': mat_knurled,
    'FrontRim': mat_brushed,
    'MarksRing': mat_brushed_dark,
    'FrontGlass': mat_glass,
    'LensDisc0': mat_glass, 'LensDisc1': mat_glass,
    'LensDisc2': mat_dark_glass, 'LensDisc3': mat_dark_glass,
    'LensDisc4': mat_dark_glass,
    'LensRedDot': mat_red,
    'FocusMark0': mat_dark, 'FocusMark1': mat_dark,
    'FocusMark2': mat_dark, 'FocusMark3': mat_dark, 'FocusMark4': mat_dark,
    'ApMark0': mat_dark, 'ApMark1': mat_dark, 'ApMark2': mat_dark,
    'ShutterBase': mat_brushed, 'ShutterBtn': mat_brushed,
    'ShutterDot': mat_red,
    'LeverBase': mat_brushed, 'LeverArm': mat_brushed,
    'LeverKnob': mat_brushed,
    'ShutterDial': mat_knurled, 'DialNotch': mat_red,
    'RewindKnob': mat_brushed_dark, 'ISODial': mat_brushed_dark,
    'HotShoe': mat_brushed, 'HotShoeInner': mat_brushed_dark,
    'HotContact0': mat_gold, 'HotContact1': mat_gold, 'HotContact2': mat_gold,
    'StrapLugL': mat_brushed, 'StrapLugR': mat_brushed,
    'TripodSocket': mat_dark,
}
for obj in bpy.data.objects:
    if obj.name in mat_assignments:
        obj.data.materials.clear()
        obj.data.materials.append(mat_assignments[obj.name])

for name in ['FocusRing', 'ApertureRing', 'FrontRim', 'MarksRing',
             'FrontGlass', 'MountRing', 'BarrelBack',
             'LensDisc0', 'LensDisc1', 'LensDisc2', 'LensDisc3',
             'LensDisc4', 'ShutterBase', 'ShutterBtn', 'ShutterDot',
             'LeverBase', 'LeverArm', 'LeverKnob', 'LensRedDot',
             'StrapLugL', 'StrapLugR', 'EyeCup', 'TripodSocket',
             'ShutterDial', 'DialNotch', 'RewindKnob', 'ISODial',
             'FocusMark0', 'FocusMark1', 'FocusMark2', 'FocusMark3',
             'FocusMark4', 'ApMark0', 'ApMark1', 'ApMark2']:
    if name in bpy.data.objects:
        shade_smooth(bpy.data.objects[name])

# ---------------------------------------------------------------------------
# Backdrop
# ---------------------------------------------------------------------------
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -0.06))
backdrop = bpy.context.active_object
backdrop.name = 'Backdrop'
backdrop.is_shadow_catcher = True
mat_bg = bpy.data.materials.new('BackdropMat')
mat_bg.use_nodes = True
bnt = mat_bg.node_tree
bnt.nodes.clear()
bout = bnt.nodes.new('ShaderNodeOutputMaterial')
bbsdf = bnt.nodes.new('ShaderNodeBsdfPrincipled')
bnt.links.new(bbsdf.outputs['BSDF'], bout.inputs['Surface'])
bbsdf.inputs['Base Color'].default_value = (0.910, 0.910, 0.910, 1.0)
bbsdf.inputs['Roughness'].default_value = 0.95
backdrop.data.materials.append(mat_bg)

# ---------------------------------------------------------------------------
# Three-point lighting — magazine-style dramatic contrast
# ---------------------------------------------------------------------------
# KEY light — strong, warm, from upper-right
bpy.ops.object.light_add(type='AREA', location=(2.6, 2.4, 3.0),
                         rotation=(math.radians(50), 0, math.radians(-35)))
key = bpy.context.active_object
key.name = 'Key'
key.data.energy = 580
key.data.color = (1.0, 0.97, 0.92)
key.data.size = 1.5

# FILL — softer, slightly cooler, fills shadows
bpy.ops.object.light_add(type='AREA', location=(-2.4, 1.6, 1.6),
                         rotation=(math.radians(60), 0, math.radians(35)))
fill = bpy.context.active_object
fill.name = 'Fill'
fill.data.energy = 180
fill.data.color = (0.82, 0.88, 1.0)
fill.data.size = 1.8

# RIM — strong, separates subject from background
bpy.ops.object.light_add(type='AREA', location=(-0.4, -2.4, 2.8),
                         rotation=(math.radians(35), 0, math.radians(180)))
rim = bpy.context.active_object
rim.name = 'Rim'
rim.data.energy = 360
rim.data.color = (1.0, 0.97, 0.93)
rim.data.size = 0.7

# TOP — bounce light from above to soften the upper surfaces
bpy.ops.object.light_add(type='AREA', location=(0.0, 0.6, 3.5),
                         rotation=(0, 0, 0))
top_light = bpy.context.active_object
top_light.name = 'TopBounce'
top_light.data.energy = 200
top_light.data.color = (1.0, 0.99, 0.96)
top_light.data.size = 2.0

# ---------------------------------------------------------------------------
# VIEWER CAMERA
# ---------------------------------------------------------------------------
viewer = bpy.data.cameras.new('ViewerCam')
viewer.lens = 60
viewer.sensor_width = 36
cam_obj = bpy.data.objects.new('ViewerCamera', viewer)
bpy.context.scene.collection.objects.link(cam_obj)
cam_obj.location = Vector((2.3, 2.7, 1.8))
look_at(cam_obj, Vector((0, 0.30, 0.55)))
scene.camera = cam_obj

# ---------------------------------------------------------------------------
# Save & render
# ---------------------------------------------------------------------------
import os
base_dir = 'C:/Users/whales/AppData/Roaming/slimory-team/agents/none4/storage/camera'
os.makedirs(base_dir, exist_ok=True)
out_png = f'{base_dir}/render_final.png'
blend_path = f'{base_dir}/camera_final.blend'

scene.render.filepath = out_png
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'

bpy.ops.wm.save_as_mainfile(filepath=blend_path)
bpy.ops.render.render(write_still=True)
print('Rendered to', out_png)