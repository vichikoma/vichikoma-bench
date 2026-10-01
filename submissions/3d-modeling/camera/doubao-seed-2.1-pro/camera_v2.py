import bpy
import math
import os

# Clear all objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ============================================================
# MATERIALS
# ============================================================

def make_leather():
    mat = bpy.data.materials.new("Leather")
    mat.use_nodes = True
    n = mat.node_tree.nodes
    l = mat.node_tree.links
    n.clear()
    
    out = n.new('ShaderNodeOutputMaterial')
    bsdf = n.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.06, 0.055, 0.05, 1)
    bsdf.inputs['Roughness'].default_value = 0.9
    bsdf.inputs['Specular IOR Level'].default_value = 0.2
    
    # Leather grain via Voronoi + noise
    coord = n.new('ShaderNodeTexCoord')
    map1 = n.new('ShaderNodeMapping')
    map1.inputs['Scale'].default_value = (1, 1, 1)
    
    vor = n.new('ShaderNodeTexVoronoi')
    vor.voronoi_dimensions = '3D'
    vor.inputs['Scale'].default_value = 60.0
    vor.feature = 'SMOOTH_F1'
    
    noise = n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 200.0
    noise.inputs['Detail'].default_value = 10.0
    noise.inputs['Roughness'].default_value = 0.5
    
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.12
    bump.inputs['Distance'].default_value = 0.03
    
    mixrgb = n.new('ShaderNodeMixRGB')
    mixrgb.blend_type = 'MULTIPLY'
    mixrgb.inputs['Fac'].default_value = 0.5
    
    l.new(coord.outputs['Generated'], map1.inputs['Vector'])
    l.new(map1.outputs['Vector'], vor.inputs['Vector'])
    l.new(map1.outputs['Vector'], noise.inputs['Vector'])
    l.new(vor.outputs['Distance'], mixrgb.inputs[1])
    l.new(noise.outputs['Fac'], mixrgb.inputs[2])
    l.new(mixrgb.outputs['Color'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    l.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def make_chrome():
    mat = bpy.data.materials.new("Chrome")
    mat.use_nodes = True
    n = mat.node_tree.nodes
    l = mat.node_tree.links
    n.clear()
    
    out = n.new('ShaderNodeOutputMaterial')
    bsdf = n.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.82, 0.80, 0.77, 1)
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.22
    
    # Brushed metal
    coord = n.new('ShaderNodeTexCoord')
    map1 = n.new('ShaderNodeMapping')
    map1.inputs['Scale'].default_value = (20, 1, 2)
    
    noise = n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 80.0
    noise.inputs['Detail'].default_value = 3.0
    noise.inputs['Roughness'].default_value = 0.2
    
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.45
    ramp.color_ramp.elements[1].position = 0.55
    
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.04
    
    l.new(coord.outputs['Generated'], map1.inputs['Vector'])
    l.new(map1.outputs['Vector'], noise.inputs['Vector'])
    l.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    l.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def make_dark_metal():
    mat = bpy.data.materials.new("DarkMetal")
    mat.use_nodes = True
    n = mat.node_tree.nodes
    l = mat.node_tree.links
    n.clear()
    
    out = n.new('ShaderNodeOutputMaterial')
    bsdf = n.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.08, 0.08, 0.075, 1)
    bsdf.inputs['Metallic'].default_value = 0.7
    bsdf.inputs['Roughness'].default_value = 0.35
    
    noise = n.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 300.0
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.02
    l.new(noise.outputs['Fac'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    l.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def make_glass():
    mat = bpy.data.materials.new("Glass")
    mat.use_nodes = True
    n = mat.node_tree.nodes
    l = mat.node_tree.links
    n.clear()
    
    out = n.new('ShaderNodeOutputMaterial')
    bsdf = n.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 0.05)
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.01
    bsdf.inputs['Transmission Weight'].default_value = 1.0
    bsdf.inputs['IOR'].default_value = 1.52
    
    # Add slight reflection tint
    l.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

def make_black_rubber():
    mat = bpy.data.materials.new("BlackRubber")
    mat.use_nodes = True
    n = mat.node_tree.nodes
    l = mat.node_tree.links
    n.clear()
    
    out = n.new('ShaderNodeOutputMaterial')
    bsdf = n.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.03, 0.03, 0.03, 1)
    bsdf.inputs['Roughness'].default_value = 0.95
    l.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    return mat

mat_leather = make_leather()
mat_chrome = make_chrome()
mat_dark = make_dark_metal()
mat_glass = make_glass()
mat_rubber = make_black_rubber()

# ============================================================
# HELPERS
# ============================================================

def bevel_obj(obj, width=0.03, seg=3):
    m = obj.modifiers.new("Bvl", 'BEVEL')
    m.width = width
    m.segments = seg
    m.limit_method = 'ANGLE'

def subsurf(obj, lvl=2):
    m = obj.modifiers.new("Sub", 'SUBSURF')
    m.levels = lvl
    m.render_levels = lvl+1

def knurl_cylinder(radius, depth, loc, rot, num_grooves, mat_rubber, mat_base):
    """Create knurled ring by cutting grooves into cylinder"""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth,
        location=loc, rotation=rot, vertices=128
    )
    obj = bpy.context.active_object
    
    # Create grooves as small cylinders and bool
    groove_r = radius * 1.02
    groove_d = depth * 1.05
    for i in range(num_grooves):
        angle = 2 * math.pi * i / num_grooves
        # Position around circumference
        cx = loc[0] + (radius - 0.015) * math.cos(angle + math.pi/2)
        cz = loc[2] + (radius - 0.015) * math.sin(angle + math.pi/2)
        
        bpy.ops.mesh.primitive_cube_add(
            size=1, location=(cx, loc[1], cz)
        )
        g = bpy.context.active_object
        g.scale = (0.02, groove_d/2, 0.012)
        g.rotation_euler = (rot[0], angle + math.pi/2, rot[2])
        
        # Boolean subtract
        mod = obj.modifiers.new("Bool", 'BOOLEAN')
        mod.operation = 'DIFFERENCE'
        mod.object = g
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(g)
    
    obj.data.materials.append(mat_base)
    obj.data.materials.append(mat_rubber)
    return obj

# ============================================================
# GROUND PLANE
# ============================================================

bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Ground"

mat_ground = bpy.data.materials.new("Ground")
mat_ground.use_nodes = True
ng = mat_ground.node_tree.nodes
lg = mat_ground.node_tree.links
ng.clear()
outg = ng.new('ShaderNodeOutputMaterial')
bg = ng.new('ShaderNodeBsdfPrincipled')
bg.inputs['Base Color'].default_value = (0.91, 0.91, 0.91, 1)
bg.inputs['Roughness'].default_value = 0.95
lg.new(bg.outputs['BSDF'], outg.inputs['Surface'])
ground.data.materials.append(mat_ground)

# ============================================================
# CAMERA BODY - Pentax K1000 / Nikon FM2 style proportions
# Units: meters. Body roughly W=14cm x H=9cm x D=5cm
# ============================================================

# Let's build camera sitting on ground plane, lens pointing toward +Y

# Main leather-wrapped body core
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.48))
body = bpy.context.active_object
body.scale = (0.68, 0.42, 0.42)
body.name = "Body"
bpy.ops.object.transform_apply(scale=True)
bevel_obj(body, 0.025, 4)
subsurf(body, 2)
body.data.materials.append(mat_leather)

# Top chrome plate
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.87))
top = bpy.context.active_object
top.scale = (0.69, 0.43, 0.045)
top.name = "TopPlate"
bpy.ops.object.transform_apply(scale=True)
bevel_obj(top, 0.015, 3)
subsurf(top, 2)
top.data.materials.append(mat_chrome)

# Bottom chrome plate
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.08))
bot = bpy.context.active_object
bot.scale = (0.69, 0.43, 0.06)
bot.name = "BotPlate"
bpy.ops.object.transform_apply(scale=True)
bevel_obj(bot, 0.015, 3)
bot.data.materials.append(mat_chrome)

# Front plate (around lens mount) - chrome
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.40, 0.48))
front = bpy.context.active_object
front.scale = (0.66, 0.03, 0.40)
front.name = "FrontPlate"
bpy.ops.object.transform_apply(scale=True)
bevel_obj(front, 0.01, 2)
front.data.materials.append(mat_chrome)

# Back plate
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.41, 0.48))
back = bpy.context.active_object
back.scale = (0.67, 0.02, 0.41)
back.name = "BackPlate"
back.data.materials.append(mat_dark)

# ============================================================
# PENTAPRISM HUMP
# ============================================================

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.02, 0.96))
prism = bpy.context.active_object
prism.scale = (0.34, 0.34, 0.08)
prism.name = "Pentaprism"
bpy.ops.object.transform_apply(scale=True)

# Taper top: edit mode scale top vertices
bpy.context.view_layer.objects.active = prism
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')
# Apply a taper via simple deform instead
tap = prism.modifiers.new("Taper", 'SIMPLE_DEFORM')
tap.deform_method = 'TAPER'
tap.factor = -0.25
tap.deform_axis = 'Z'
bevel_obj(prism, 0.02, 3)
subsurf(prism, 2)
prism.data.materials.append(mat_chrome)

# Viewfinder eyepiece (rear of prism)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.28, 0.95))
eyepiece = bpy.context.active_object
eyepiece.scale = (0.16, 0.04, 0.06)
eyepiece.name = "Eyepiece"
eyepiece.data.materials.append(mat_glass)

# Viewfinder window bezel
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.25, 0.95))
eyepiece_bezel = bpy.context.active_object
eyepiece_bezel.scale = (0.18, 0.02, 0.08)
eyepiece_bezel.name = "EyepieceBezel"
eyepiece_bezel.data.materials.append(mat_chrome)

# ============================================================
# HOT SHOE on top of prism
# ============================================================

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.12, 1.07))
hs_base = bpy.context.active_object
hs_base.scale = (0.12, 0.16, 0.015)
hs_base.name = "HotShoeBase"
hs_base.data.materials.append(mat_chrome)

# Two rails
for dx in (-0.07, 0.07):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(dx, 0.12, 1.095))
    r = bpy.context.active_object
    r.scale = (0.018, 0.17, 0.015)
    r.data.materials.append(mat_chrome)

# Center contact pin
bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=0.015, location=(0, 0.12, 1.088))
pin = bpy.context.active_object
pin.data.materials.append(mat_dark)

# ============================================================
# LENS ASSEMBLY - protruding forward (+Y)
# ============================================================

lens_cy = 0.48  # center Y of body
lens_cz = 0.48

# Lens mount ring (at body)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.28, depth=0.06,
    location=(0, lens_cy + 0.05, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
mount = bpy.context.active_object
mount.name = "LensMount"
mount.data.materials.append(mat_chrome)

# Lens barrel section 1 (rear, chrome)
y_pos = lens_cy + 0.05 + 0.04
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.26, depth=0.12,
    location=(0, y_pos + 0.06, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
b1 = bpy.context.active_object
b1.name = "Barrel1"
b1.data.materials.append(mat_chrome)

# Focus ring (wider, knurled rubber)
y_pos += 0.12
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.27, depth=0.14,
    location=(0, y_pos + 0.07, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=96
)
focus = bpy.context.active_object
focus.name = "FocusRing"
# Add subtle knurl ridges using solidify approach
for i in range(72):
    ang = 2*math.pi*i/72
    r_pos = 0.27
    rx = r_pos * math.cos(ang)
    rz = r_pos * math.sin(ang)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(rx, y_pos + 0.07, lens_cz + rz))
    ridge = bpy.context.active_object
    ridge.scale = (0.008, 0.15, 0.006)
    ridge.rotation_euler = (0, ang, 0)
    ridge.data.materials.append(mat_rubber)

focus.data.materials.append(mat_rubber)

# Mid barrel chrome
y_pos += 0.14
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.25, depth=0.10,
    location=(0, y_pos + 0.05, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
b2 = bpy.context.active_object
b2.name = "Barrel2"
b2.data.materials.append(mat_chrome)

# Aperture ring
y_pos += 0.10
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.26, depth=0.08,
    location=(0, y_pos + 0.04, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=96
)
aperture = bpy.context.active_object
aperture.name = "ApertureRing"
for i in range(60):
    ang = 2*math.pi*i/60
    r_pos = 0.26
    rx = r_pos * math.cos(ang)
    rz = r_pos * math.sin(ang)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(rx, y_pos + 0.04, lens_cz + rz))
    ridge = bpy.context.active_object
    ridge.scale = (0.007, 0.09, 0.005)
    ridge.rotation_euler = (0, ang, 0)
    ridge.data.materials.append(mat_rubber)
aperture.data.materials.append(mat_rubber)

# Front barrel
y_pos += 0.08
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.27, depth=0.08,
    location=(0, y_pos + 0.04, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
b3 = bpy.context.active_object
b3.name = "BarrelFront"
b3.data.materials.append(mat_chrome)

# Lens rim / filter ring
y_pos += 0.08
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.25, minor_radius=0.022,
    location=(0, y_pos, lens_cz),
    rotation=(math.radians(90), 0, 0),
    major_segments=64, minor_segments=12
)
rim = bpy.context.active_object
rim.name = "LensRim"
rim.data.materials.append(mat_chrome)

# Front glass element
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.22, depth=0.02,
    location=(0, y_pos + 0.015, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
glass1 = bpy.context.active_object
glass1.name = "FrontGlass"
glass1.data.materials.append(mat_glass)

# Internal lens dark ring behind glass
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.23, depth=0.01,
    location=(0, y_pos - 0.005, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
dark_ring = bpy.context.active_object
dark_ring.name = "InnerDarkRing"
dark_ring.data.materials.append(mat_dark)

# Highlight reflection element (glass convex look)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.20, depth=0.005,
    location=(0, y_pos + 0.025, lens_cz),
    rotation=(math.radians(90), 0, 0), vertices=64
)
glass2 = bpy.context.active_object
glass2.name = "GlassHighlight"
glass2.data.materials.append(mat_glass)

# ============================================================
# SHUTTER BUTTON - right side top (classic position)
# ============================================================

# Shutter collar
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.055, depth=0.03,
    location=(0.50, -0.18, 0.93), vertices=32
)
sc = bpy.context.active_object
sc.name = "ShutterCollar"
sc.data.materials.append(mat_chrome)

# Shutter button
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.042, depth=0.03,
    location=(0.50, -0.18, 0.96), vertices=32
)
sb = bpy.context.active_object
sb.name = "ShutterButton"
sb.data.materials.append(mat_chrome)

# Soft shutter release top (black)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.038, depth=0.01,
    location=(0.50, -0.18, 0.98), vertices=32
)
sbt = bpy.context.active_object
sbt.name = "ShutterTop"
sbt.data.materials.append(mat_rubber)

# ============================================================
# FILM ADVANCE LEVER - left top (classic SLR)
# ============================================================

# Advance lever base
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.08, depth=0.04,
    location=(-0.52, -0.15, 0.93), vertices=32
)
ab = bpy.context.active_object
ab.name = "AdvanceBase"
ab.data.materials.append(mat_chrome)

# Lever arm (angled outward, ready position)
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.72, -0.02, 0.99))
arm = bpy.context.active_object
arm.scale = (0.22, 0.025, 0.02)
arm.rotation_euler = (0, 0, math.radians(-25))
arm.name = "AdvanceArm"
bevel_obj(arm, 0.008, 2)
arm.data.materials.append(mat_chrome)

# Tip (black plastic)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.018, depth=0.04,
    location=(-0.89, 0.06, 1.01),
    rotation=(math.radians(90), 0, math.radians(-25)), vertices=16
)
tip = bpy.context.active_object
tip.name = "AdvanceTip"
tip.data.materials.append(mat_rubber)

# ============================================================
# REWIND KNOB - left top
# ============================================================

bpy.ops.mesh.primitive_cylinder_add(
    radius=0.075, depth=0.05,
    location=(-0.55, 0.18, 0.94), vertices=32
)
rw = bpy.context.active_object
rw.name = "RewindKnob"
rw.data.materials.append(mat_chrome)

# Rewind crank (folding)
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.55, 0.18, 0.98))
crank = bpy.context.active_object
crank.scale = (0.06, 0.015, 0.01)
crank.rotation_euler = (0, 0, math.radians(30))
crank.data.materials.append(mat_chrome)

# ============================================================
# SHUTTER SPEED / ISO DIAL - right top near shutter
# ============================================================

bpy.ops.mesh.primitive_cylinder_add(
    radius=0.08, depth=0.03,
    location=(0.50, 0.05, 0.93), vertices=32
)
dial = bpy.context.active_object
dial.name = "SpeedDial"
dial.data.materials.append(mat_chrome)

# ============================================================
# SELF-TIMER LEVER - front left
# ============================================================

bpy.ops.mesh.primitive_cylinder_add(
    radius=0.025, depth=0.02,
    location=(-0.45, 0.43, 0.25),
    rotation=(math.radians(90), 0, 0), vertices=16
)
st = bpy.context.active_object
st.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.45, 0.47, 0.27))
stl = bpy.context.active_object
stl.scale = (0.015, 0.05, 0.01)
stl.data.materials.append(mat_chrome)

# ============================================================
# NAMEPLATE - front top
# ============================================================

bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.42, 0.68))
np = bpy.context.active_object
np.scale = (0.22, 0.005, 0.035)
np.name = "Nameplate"
np.data.materials.append(mat_dark)

# Lens distance scale window
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.52, 0.48))
scalewin = bpy.context.active_object
scalewin.scale = (0.10, 0.005, 0.03)
scalewin.data.materials.append(mat_chrome)

# ============================================================
# STRAP LUGS
# ============================================================

for sx in (-0.67, 0.67):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.025, minor_radius=0.005,
        location=(sx, 0.25, 0.82),
        rotation=(math.radians(90), 0, 0),
        major_segments=12, minor_segments=6
    )
    lug = bpy.context.active_object
    lug.data.materials.append(mat_chrome)

# ============================================================
# LIGHTING - Three-point studio
# ============================================================

# Key light (front-upper-left) - warm
bpy.ops.object.light_add(type='AREA', location=(-2.0, -2.5, 2.8))
key = bpy.context.active_object
key.data.energy = 600
key.data.size = 2.5
key.data.color = (1.0, 0.96, 0.92)
key.rotation_euler = (math.radians(50), 0, math.radians(-140))

# Fill light (right side, softer, cooler)
bpy.ops.object.light_add(type='AREA', location=(2.2, -1.5, 1.5))
fill = bpy.context.active_object
fill.data.energy = 200
fill.data.size = 3.0
fill.data.color = (0.92, 0.95, 1.0)
fill.rotation_euler = (math.radians(30), 0, math.radians(130))

# Rim / back light
bpy.ops.object.light_add(type='AREA', location=(0.5, 3.0, 1.5))
rim = bpy.context.active_object
rim.data.energy = 300
rim.data.size = 1.5
rim.data.color = (1.0, 1.0, 1.0)
rim.rotation_euler = (math.radians(-20), 0, math.radians(180))

# Top soft light for top plate highlights
bpy.ops.object.light_add(type='AREA', location=(0, -0.5, 3.5))
top_light = bpy.context.active_object
top_light.data.energy = 100
top_light.data.size = 3.0
top_light.data.color = (1, 1, 1)
top_light.rotation_euler = (0, 0, 0)

# ============================================================
# CAMERA - 3/4 view, front-top-side, subject ~70% of frame
# ============================================================

bpy.ops.object.camera_add(location=(-2.0, -2.2, 1.6))
cam = bpy.context.active_object
cam.name = "RenderCam"
bpy.context.scene.camera = cam

# Target the center of the camera body
target = bpy.data.objects.new("CamTarget", None)
bpy.context.collection.objects.link(target)
target.location = (0, 0.6, 0.55)

track = cam.constraints.new(type='TRACK_TO')
track.target = target
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

cam.data.lens = 100  # portrait lens, less distortion
cam.data.dof.use_dof = True
cam.data.dof.focus_object = target
cam.data.dof.aperture_fstop = 5.6

# ============================================================
# RENDER SETTINGS
# ============================================================

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.eevee.taa_render_samples = 128

# World - flat gray studio
world = scene.world
world.use_nodes = True
wn = world.node_tree.nodes
wl = world.node_tree.links
wn.clear()
wout = wn.new('ShaderNodeOutputWorld')
wbg = wn.new('ShaderNodeBackground')
wbg.inputs['Color'].default_value = (0.91, 0.91, 0.91, 1)
wbg.inputs['Strength'].default_value = 0.8
wl.new(wbg.outputs['Background'], wout.inputs['Surface'])

# Contact shadow: use shadow catcher
ground.is_shadow_catcher = True
# In EEVEE we rely on AO; enable raytracing in EEVEE Next
scene.eevee.use_raytracing = True

# Render
out_dir = os.path.dirname(os.path.abspath(__file__))
if not out_dir:
    out_dir = '.'
scene.render.filepath = os.path.join(out_dir, 'camera_v2.png')
bpy.ops.render.render(write_still=True)

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir, 'camera_v2.blend'))
print("V2 render complete!")