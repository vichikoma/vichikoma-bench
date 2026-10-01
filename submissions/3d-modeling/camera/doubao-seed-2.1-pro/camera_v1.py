import bpy
import math
import os

# Clear all objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ============================================================
# MATERIALS - Procedural only
# ============================================================

def create_leather_material():
    """Black leather texture with procedural noise"""
    mat = bpy.data.materials.new(name="Leather")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # Output
    output = nodes.new('ShaderNodeOutputMaterial')
    
    # Principled BSDF
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.08, 0.07, 0.06, 1)
    bsdf.inputs['Roughness'].default_value = 0.85
    bsdf.inputs['Specular IOR Level'].default_value = 0.3
    
    # Noise for leather grain
    noise1 = nodes.new('ShaderNodeTexNoise')
    noise1.inputs['Scale'].default_value = 120.0
    noise1.inputs['Detail'].default_value = 8.0
    noise1.inputs['Roughness'].default_value = 0.6
    
    noise2 = nodes.new('ShaderNodeTexNoise')
    noise2.inputs['Scale'].default_value = 300.0
    noise2.inputs['Detail'].default_value = 15.0
    
    # Voronoi for leather cell pattern
    voronoi = nodes.new('ShaderNodeTexVoronoi')
    voronoi.voronoi_dimensions = '3D'
    voronoi.inputs['Scale'].default_value = 80.0
    
    # Mix noises
    mix1 = nodes.new('ShaderNodeMixRGB')
    mix1.blend_type = 'MULTIPLY'
    mix1.inputs['Fac'].default_value = 0.4
    
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.15
    bump.inputs['Distance'].default_value = 0.02
    
    # Color ramp for bump depth
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.3
    ramp.color_ramp.elements[1].position = 0.7
    
    # Links
    links.new(voronoi.outputs['Distance'], mix1.inputs[1])
    links.new(noise2.outputs['Fac'], mix1.inputs[2])
    links.new(mix1.outputs['Color'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_chrome_material():
    """Brushed silver metal"""
    mat = bpy.data.materials.new(name="Chrome")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.75, 0.73, 0.70, 1)
    bsdf.inputs['Metallic'].default_value = 1.0
    bsdf.inputs['Roughness'].default_value = 0.25
    bsdf.inputs['Specular IOR Level'].default_value = 0.9
    
    # Brushed metal texture
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 500.0
    noise.inputs['Detail'].default_value = 2.0
    noise.inputs['Roughness'].default_value = 0.3
    
    # Mapping for anisotropic direction
    mapping = nodes.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (10.0, 1.0, 1.0)
    
    texcoord = nodes.new('ShaderNodeTexCoord')
    
    # Bump for brush lines
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.05
    
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.4
    ramp.color_ramp.elements[1].position = 0.6
    
    links.new(texcoord.outputs['Generated'], mapping.inputs['Vector'])
    links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_black_metal_material():
    """Black painted metal"""
    mat = bpy.data.materials.new(name="BlackMetal")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.12, 0.11, 0.10, 1)
    bsdf.inputs['Metallic'].default_value = 0.8
    bsdf.inputs['Roughness'].default_value = 0.4
    
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 200.0
    noise.inputs['Detail'].default_value = 5.0
    
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.03
    
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_glass_material():
    """Glass lens material"""
    mat = bpy.data.materials.new(name="Glass")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.95, 0.97, 1.0, 0.1)
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.02
    bsdf.inputs['Transmission Weight'].default_value = 1.0
    bsdf.inputs['IOR'].default_value = 1.5
    bsdf.inputs['Specular IOR Level'].default_value = 1.0
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_black_plastic_material():
    """Black plastic/rubber for rings"""
    mat = bpy.data.materials.new(name="BlackPlastic")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1)
    bsdf.inputs['Roughness'].default_value = 0.9
    bsdf.inputs['Specular IOR Level'].default_value = 0.1
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_nameplate_material():
    """Black nameplate with slight texture"""
    mat = bpy.data.materials.new(name="Nameplate")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    output = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1)
    bsdf.inputs['Roughness'].default_value = 0.5
    bsdf.inputs['Metallic'].default_value = 0.3
    
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 50.0
    
    links.new(noise.outputs['Fac'], bsdf.inputs['Roughness'])
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

# Create materials
mat_leather = create_leather_material()
mat_chrome = create_chrome_material()
mat_black_metal = create_black_metal_material()
mat_glass = create_glass_material()
mat_black_plastic = create_black_plastic_material()
mat_nameplate = create_nameplate_material()

# ============================================================
# CAMERA BODY
# ============================================================

def create_body():
    # Main body - slightly rounded rectangular prism
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    body = bpy.context.active_object
    body.scale = (1.4, 0.9, 0.85)
    body.name = "Body"
    
    # Apply scale and add bevel
    bpy.ops.object.transform_apply(scale=True)
    
    # Bevel modifier for rounded edges
    bevel = body.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = 0.06
    bevel.segments = 5
    
    # Subdivision surface for smoothness
    sub = body.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 2
    sub.render_levels = 3
    
    body.data.materials.append(mat_leather)
    return body

body = create_body()

# Top plate - silver chrome
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.02, 0.75))
top_plate = bpy.context.active_object
top_plate.scale = (1.38, 0.88, 0.18)
top_plate.name = "TopPlate"
bpy.ops.object.transform_apply(scale=True)

bevel = top_plate.modifiers.new(name="Bevel", type='BEVEL')
bevel.width = 0.03
bevel.segments = 4
sub = top_plate.modifiers.new(name="Subsurf", type='SUBSURF')
sub.levels = 2
sub.render_levels = 3
top_plate.data.materials.append(mat_chrome)

# Bottom plate
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.02, -0.75))
bot_plate = bpy.context.active_object
bot_plate.scale = (1.38, 0.88, 0.08)
bot_plate.name = "BottomPlate"
bpy.ops.object.transform_apply(scale=True)
bevel = bot_plate.modifiers.new(name="Bevel", type='BEVEL')
bevel.width = 0.02
bevel.segments = 3
bot_plate.data.materials.append(mat_chrome)

# Front chrome trim around lens mount area
bpy.ops.mesh.primitive_cylinder_add(radius=0.65, depth=0.1, location=(0, 0.85, 0.05))
lens_mount_ring = bpy.context.active_object
lens_mount_ring.rotation_euler = (math.radians(90), 0, 0)
lens_mount_ring.name = "LensMountRing"
lens_mount_ring.data.materials.append(mat_chrome)

# ============================================================
# LENS ASSEMBLY
# ============================================================

def create_grip_ring(radius, depth, loc_z, segments=72):
    """Create a focus/aperture ring with knurled texture"""
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, 
        location=(0, 0.85 + depth/2 + loc_z, 0.05),
        rotation=(math.radians(90), 0, 0),
        vertices=segments
    )
    ring = bpy.context.active_object
    
    # Add knurling via displacement modifier
    # First create knurl pattern
    bpy.ops.object.transform_apply(rotation=True)
    
    # Use screw-like approach - add vertical ridges
    # Create a base cylinder with slight bumps
    mod = ring.modifiers.new(name="Knurl", type='DISPLACE')
    
    # Create a new mesh for knurl
    # Actually let's use array + boolean for ridges
    return ring

# Lens barrel base (extends forward)
lens_z = 0.05

# Rear lens barrel
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.55, depth=0.4,
    location=(0, 1.15, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
lens_barrel1 = bpy.context.active_object
lens_barrel1.name = "LensBarrelRear"
lens_barrel1.data.materials.append(mat_chrome)

# Focus ring (with knurling)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.58, depth=0.25,
    location=(0, 1.48, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
focus_ring = bpy.context.active_object
focus_ring.name = "FocusRing"

# Create knurled bumps via array of small cylinders
knurl_parent = focus_ring
knurls = []
num_knurls = 60
for i in range(num_knurls):
    angle = 2 * math.pi * i / num_knurls
    x = 0.58 * math.cos(angle)
    y = 1.48
    z = lens_z + 0.58 * math.sin(angle)
    
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.012, depth=0.28,
        location=(x, y, z),
        rotation=(math.radians(90), 0, angle),
        vertices=8
    )
    knurl = bpy.context.active_object
    knurl.data.materials.append(mat_black_plastic)
    knurls.append(knurl)

# Join all knurls to focus ring
bpy.ops.object.select_all(action='DESELECT')
for k in knurls:
    k.select_set(True)
focus_ring.select_set(True)
bpy.context.view_layer.objects.active = focus_ring
bpy.ops.object.join()
focus_ring.data.materials.append(mat_black_plastic)

# Mid lens barrel
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.54, depth=0.3,
    location=(0, 1.76, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
lens_barrel2 = bpy.context.active_object
lens_barrel2.name = "LensBarrelMid"
lens_barrel2.data.materials.append(mat_chrome)

# Aperture ring (also knurled, thinner)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.56, depth=0.15,
    location=(0, 1.99, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
aperture_ring = bpy.context.active_object
aperture_ring.name = "ApertureRing"

num_knurls2 = 50
knurls2 = []
for i in range(num_knurls2):
    angle = 2 * math.pi * i / num_knurls2
    x = 0.56 * math.cos(angle)
    y = 1.99
    z = lens_z + 0.56 * math.sin(angle)
    
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.01, depth=0.17,
        location=(x, y, z),
        rotation=(math.radians(90), 0, angle),
        vertices=6
    )
    k = bpy.context.active_object
    k.data.materials.append(mat_black_plastic)
    knurls2.append(k)

# Join aperture ring knurls
bpy.ops.object.select_all(action='DESELECT')
for k in knurls2:
    k.select_set(True)
aperture_ring.select_set(True)
bpy.context.view_layer.objects.active = aperture_ring
bpy.ops.object.join()
aperture_ring.data.materials.append(mat_black_plastic)

# Front lens barrel
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.57, depth=0.2,
    location=(0, 2.17, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
lens_barrel3 = bpy.context.active_object
lens_barrel3.name = "LensBarrelFront"
lens_barrel3.data.materials.append(mat_chrome)

# Front glass element
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.48, depth=0.05,
    location=(0, 2.29, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
front_glass = bpy.context.active_object
front_glass.name = "FrontGlass"
front_glass.data.materials.append(mat_glass)

# Inner lens reflection ring
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.46, depth=0.02,
    location=(0, 2.26, lens_z),
    rotation=(math.radians(90), 0, 0),
    vertices=72
)
inner_ring = bpy.context.active_object
inner_ring.name = "InnerLensRing"
inner_ring.data.materials.append(mat_black_metal)

# Lens hood rim (chrome ring around glass)
bpy.ops.mesh.primitive_torus_add(
    major_radius=0.52, minor_radius=0.03,
    location=(0, 2.26, lens_z),
    rotation=(math.radians(90), 0, 0),
    major_segments=72, minor_segments=12
)
lens_rim = bpy.context.active_object
lens_rim.name = "LensRim"
lens_rim.data.materials.append(mat_chrome)

# ============================================================
# TOP CONTROLS
# ============================================================

# Pentaprism hump (viewfinder) - centered
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.1, 0.98))
prism = bpy.context.active_object
prism.scale = (0.6, 0.55, 0.18)
prism.name = "Pentaprism"
bpy.ops.object.transform_apply(scale=True)

# Taper the prism - top narrower
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='DESELECT')
bpy.ops.object.mode_set(mode='OBJECT')
# Use a simple approach - bevel + scale top
bevel = prism.modifiers.new(name="Bevel", type='BEVEL')
bevel.width = 0.08
bevel.segments = 4
sub = prism.modifiers.new(name="Subsurf", type='SUBSURF')
sub.levels = 2
prism.data.materials.append(mat_chrome)

# Viewfinder window (rear of pentaprism)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -0.25, 0.95))
vf_window = bpy.context.active_object
vf_window.scale = (0.25, 0.05, 0.08)
vf_window.name = "ViewfinderWindow"
vf_window.data.materials.append(mat_glass)

# Hot shoe mount - on top of pentaprism area
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.25, 1.15))
hotshoe_base = bpy.context.active_object
hotshoe_base.scale = (0.22, 0.3, 0.04)
hotshoe_base.name = "HotShoeBase"
bpy.ops.object.transform_apply(scale=True)
bevel = hotshoe_base.modifiers.new(name="Bevel", type='BEVEL')
bevel.width = 0.01
hotshoe_base.data.materials.append(mat_chrome)

# Hot shoe rails
for dx in [-0.12, 0.12]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(dx, 0.25, 1.2))
    rail = bpy.context.active_object
    rail.scale = (0.04, 0.32, 0.025)
    rail.name = f"HotShoeRail_{dx}"
    rail.data.materials.append(mat_chrome)

# Hot shoe center contact
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.02, depth=0.03,
    location=(0, 0.25, 1.19),
    rotation=(0, 0, 0)
)
hs_contact = bpy.context.active_object
hs_contact.name = "HotShoeContact"
hs_contact.data.materials.append(mat_black_metal)

# Shutter button - angled, on right side of top plate (classic SLR position)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.08, depth=0.06,
    location=(0.9, -0.4, 0.95),
    vertices=32
)
shutter_base = bpy.context.active_object
shutter_base.name = "ShutterBase"
shutter_base.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cylinder_add(
    radius=0.06, depth=0.05,
    location=(0.9, -0.4, 1.0),
    vertices=32
)
shutter_btn = bpy.context.active_object
shutter_btn.name = "ShutterButton"
shutter_btn.data.materials.append(mat_chrome)

# Shutter button top (darker)
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.055, depth=0.02,
    location=(0.9, -0.4, 1.035),
    vertices=32
)
shutter_top = bpy.context.active_object
shutter_top.name = "ShutterTop"
shutter_top.data.materials.append(mat_black_plastic)

# Film advance lever - on the left top
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.9, -0.2, 0.92))
lever_base = bpy.context.active_object
lever_base.scale = (0.22, 0.22, 0.08)
lever_base.name = "LeverBase"
bpy.ops.object.transform_apply(scale=True)
bevel = lever_base.modifiers.new(name="Bevel", type='BEVEL')
bevel.width = 0.02
lever_base.data.materials.append(mat_chrome)

# Lever arm
bpy.ops.mesh.primitive_cube_add(size=1, location=(-1.15, 0.0, 1.0))
lever_arm = bpy.context.active_object
lever_arm.scale = (0.35, 0.06, 0.04)
lever_arm.rotation_euler = (0, 0, math.radians(-20))
lever_arm.name = "LeverArm"
lever_arm.data.materials.append(mat_chrome)

# Lever tip
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.035, depth=0.08,
    location=(-1.35, 0.08, 1.03),
    rotation=(math.radians(90), 0, math.radians(-20))
)
lever_tip = bpy.context.active_object
lever_tip.name = "LeverTip"
lever_tip.data.materials.append(mat_black_plastic)

# Film rewind knob - left side
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.15, depth=0.1,
    location=(-0.9, 0.2, 0.92),
    vertices=32
)
rewind_knob = bpy.context.active_object
rewind_knob.name = "RewindKnob"
rewind_knob.data.materials.append(mat_chrome)

# Knurled edge on rewind knob
for i in range(24):
    angle = 2 * math.pi * i / 24
    x = -0.9 + 0.15 * math.cos(angle)
    y = 0.2 + 0.15 * math.sin(angle)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, 0.92))
    k = bpy.context.active_object
    k.scale = (0.015, 0.015, 0.12)
    k.rotation_euler = (0, 0, angle)
    k.data.materials.append(mat_black_plastic)

# Shutter speed dial - right side near shutter
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.16, depth=0.08,
    location=(0.75, -0.15, 0.92),
    vertices=32
)
speed_dial = bpy.context.active_object
speed_dial.name = "SpeedDial"
speed_dial.data.materials.append(mat_chrome)

# ============================================================
# FRONT DETAILS
# ============================================================

# Brand nameplate - front top
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.78, 0.45))
nameplate = bpy.context.active_object
nameplate.scale = (0.5, 0.02, 0.08)
nameplate.name = "Nameplate"
nameplate.data.materials.append(mat_nameplate)

# Self-timer lever - front left
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.06, depth=0.05,
    location=(-0.7, 0.8, -0.1),
    rotation=(math.radians(90), 0, 0)
)
timer_base = bpy.context.active_object
timer_base.name = "TimerBase"
timer_base.data.materials.append(mat_chrome)

bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.7, 0.88, -0.05))
timer_lever = bpy.context.active_object
timer_lever.scale = (0.04, 0.1, 0.02)
timer_lever.name = "TimerLever"
timer_lever.data.materials.append(mat_chrome)

# PC sync terminal - front
bpy.ops.mesh.primitive_cylinder_add(
    radius=0.03, depth=0.04,
    location=(-0.5, 0.8, -0.3),
    rotation=(math.radians(90), 0, 0)
)
pc_terminal = bpy.context.active_object
pc_terminal.name = "PCTerminal"
pc_terminal.data.materials.append(mat_chrome)

# Strap lugs
for sx in [-1.35, 1.35]:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=0.06, minor_radius=0.012,
        location=(sx, 0.5, 0.3),
        rotation=(0, math.radians(90), 0),
        major_segments=16, minor_segments=6
    )
    lug = bpy.context.active_object
    lug.name = f"StrapLug_{sx}"
    lug.data.materials.append(mat_chrome)

# ============================================================
# LIGHTING - Three-point studio lighting
# ============================================================

# Key light - main warm light from front-left-top
bpy.ops.object.light_add(type='AREA', location=(-3, -3, 4))
key_light = bpy.context.active_object
key_light.data.energy = 400
key_light.data.size = 3
key_light.data.color = (1.0, 0.97, 0.93)
key_light.rotation_euler = (math.radians(45), 0, math.radians(-135))
key_light.name = "KeyLight"

# Fill light - softer from right
bpy.ops.object.light_add(type='AREA', location=(3, -2, 2))
fill_light = bpy.context.active_object
fill_light.data.energy = 150
fill_light.data.size = 4
fill_light.data.color = (0.93, 0.95, 1.0)
fill_light.rotation_euler = (math.radians(30), 0, math.radians(135))
fill_light.name = "FillLight"

# Rim/back light - from behind for edge highlight
bpy.ops.object.light_add(type='AREA', location=(0, 4, 2))
rim_light = bpy.context.active_object
rim_light.data.energy = 200
rim_light.data.size = 2
rim_light.data.color = (1.0, 1.0, 1.0)
rim_light.rotation_euler = (math.radians(-30), 0, math.radians(180))
rim_light.name = "RimLight"

# Ground plane for contact shadow
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -1.0))
ground = bpy.context.active_object
ground.name = "Ground"

# Ground material - light gray studio
mat_ground = bpy.data.materials.new(name="Ground")
mat_ground.use_nodes = True
nodes = mat_ground.node_tree.nodes
links = mat_ground.node_tree.links
nodes.clear()
output = nodes.new('ShaderNodeOutputMaterial')
bsdf = nodes.new('ShaderNodeBsdfPrincipled')
bsdf.inputs['Base Color'].default_value = (0.91, 0.91, 0.91, 1)  # #E8E8E8
bsdf.inputs['Roughness'].default_value = 0.9
bsdf.inputs['Specular IOR Level'].default_value = 0.0
links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
ground.data.materials.append(mat_ground)

# ============================================================
# CAMERA SETUP - 3/4 view from front-top-side
# ============================================================

bpy.ops.object.camera_add(location=(-3.2, -3.8, 2.5))
render_cam = bpy.context.active_object
render_cam.name = "RenderCam"
bpy.context.scene.camera = render_cam

# Point camera at subject center
target_loc = (0, 1.0, 0.3)
track = render_cam.constraints.new(type='TRACK_TO')
track.target = bpy.data.objects.new("CameraTarget", None)
bpy.context.collection.objects.link(track.target)
track.target.location = target_loc
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

# Set camera to orthographic-like via appropriate focal length
render_cam.data.lens = 85
render_cam.data.dof.use_dof = True
render_cam.data.dof.aperture_fstop = 4.0

# Set render engine to Eevee (Blender 4.3 uses EEVEE_NEXT)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.eevee.taa_render_samples = 64

# World background - light gray
world = bpy.context.scene.world
world.use_nodes = True
world_nodes = world.node_tree.nodes
world_links = world.node_tree.links
world_nodes.clear()
bg_out = world_nodes.new('ShaderNodeOutputWorld')
bg = world_nodes.new('ShaderNodeBackground')
bg.inputs['Color'].default_value = (0.91, 0.91, 0.91, 1)
bg.inputs['Strength'].default_value = 1.0
world_links.new(bg.outputs['Background'], bg_out.inputs['Surface'])

# ============================================================
# RENDER
# ============================================================

output_dir = os.path.dirname(os.path.abspath(__file__))
if not output_dir:
    output_dir = '.'
scene.render.filepath = os.path.join(output_dir, 'camera_v1.png')
bpy.ops.render.render(write_still=True)

# Save blend file
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(output_dir, 'camera_v1.blend'))
print("Render complete!")