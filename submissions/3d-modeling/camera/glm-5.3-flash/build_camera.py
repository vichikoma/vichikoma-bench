# 1970s vintage SLR camera - fully procedural bpy build + Eevee render
# usage: blender --background --factory-startup --python build_camera.py -- <out.blend> <out.png>
import bpy, math, os, sys

argv = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else ["private://camera.blend", "private://camera.png"]
BLEND = os.path.abspath(argv[0])
PNG = os.path.abspath(argv[1])

TAU = math.tau
R90 = math.pi / 2

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
COL = bpy.context.collection

def link(o):
    COL.objects.link(o)

# ---------------- helpers ----------------
def set_in(node, name, val):
    try:
        node.inputs[name].default_value = val
    except Exception:
        pass

def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes["Principled BSDF"], m.node_tree

def bevel_mod(obj, w, segs=3, angle=48):
    b = obj.modifiers.new("Bevel", 'BEVEL')
    b.width = w
    b.segments = segs
    b.limit_method = 'ANGLE'
    b.angle_limit = math.radians(angle)

def smooth_obj(obj, angle=40):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    try:
        bpy.ops.object.shade_auto_smooth(angle=math.radians(angle))
    except Exception:
        bpy.ops.object.shade_smooth()

def make_box(name, w, h, d, x=0, y=0, z=0, mat=None, bevel=0.0, segs=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, d, h)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        bevel_mod(o, bevel, segs)
    if mat:
        o.data.materials.append(mat)
    return o

def make_cyl(name, r, depth, x=0, y=0, z=0, mat=None, verts=48, rot=(0, 0, 0), bevel=0.0, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts, location=(x, y, z), rotation=rot)
    o = bpy.context.active_object
    o.name = name
    if bevel > 0:
        bevel_mod(o, bevel, 2)
    if mat:
        o.data.materials.append(mat)
    if smooth:
        smooth_obj(o)
    return o

def make_sphere(name, r, x, y, z, scale, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=48, ring_count=24, location=(x, y, z))
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    if mat:
        o.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return o

def make_teeth(name, n, r, tan, rad, ax, axis='Y', mat=None, cx=0.0, cy=0.0, cz=0.0):
    parts = []
    for i in range(n):
        a = TAU * i / n
        if axis == 'Y':
            bpy.ops.mesh.primitive_cube_add(size=1, location=(cx + r*math.cos(a), cy, cz + r*math.sin(a)), rotation=(0, R90 - a, 0))
            o = bpy.context.active_object
            o.scale = (tan, ax, rad)
        else:
            bpy.ops.mesh.primitive_cube_add(size=1, location=(cx + r*math.cos(a), cy + r*math.sin(a), cz), rotation=(0, 0, a))
            o = bpy.context.active_object
            o.scale = (tan, rad, ax)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        parts.append(o)
    bpy.ops.object.select_all(action='DESELECT')
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    if mat:
        o.data.materials.append(mat)
    return o

def add_text(name, body, size, x, y, z, mat, rot=(R90, 0, 0), extrude=0.003):
    crv = bpy.data.curves.new(name, 'FONT')
    crv.body = body
    crv.size = size
    crv.align_x = 'CENTER'
    crv.align_y = 'CENTER'
    crv.extrude = extrude
    crv.bevel_depth = 0.0006
    crv.bevel_resolution = 1
    o = bpy.data.objects.new(name, crv)
    o.location = (x, y, z)
    o.rotation_euler = rot
    link(o)
    o.data.materials.append(mat)
    return o

# ---------------- materials ----------------
def mat_leather():
    m, b, nt = new_mat("leather")
    set_in(b, "Roughness", 0.42)
    set_in(b, "Specular IOR Level", 0.5)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    n1 = nt.nodes.new('ShaderNodeTexNoise')   # fine grain
    n1.inputs['Scale'].default_value = 480
    n1.inputs['Detail'].default_value = 6
    n1.inputs['Roughness'].default_value = 0.62
    n2 = nt.nodes.new('ShaderNodeTexNoise')   # low freq mottling
    n2.inputs['Scale'].default_value = 6
    n2.inputs['Detail'].default_value = 3
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.012, 0.011, 0.01, 1)
    ramp.color_ramp.elements[1].color = (0.048, 0.044, 0.04, 1)
    bump1 = nt.nodes.new('ShaderNodeBump')
    bump1.inputs['Strength'].default_value = 1.0
    bump1.inputs['Distance'].default_value = 0.0035
    bump2 = nt.nodes.new('ShaderNodeBump')
    bump2.inputs['Strength'].default_value = 0.45
    bump2.inputs['Distance'].default_value = 0.006
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], n1.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], n2.inputs['Vector'])
    nt.links.new(n1.outputs['Fac'], bump1.inputs['Height'])
    nt.links.new(n2.outputs['Fac'], bump2.inputs['Height'])
    nt.links.new(bump1.outputs['Normal'], bump2.inputs['Normal'])
    nt.links.new(bump2.outputs['Normal'], b.inputs['Normal'])
    nt.links.new(n2.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    return m

def mat_silver(name="silver", base=(0.6, 0.61, 0.63), lo=0.2, hi=0.38, aniso=0.35):
    m, b, nt = new_mat(name)
    set_in(b, "Base Color", (*base, 1))
    set_in(b, "Metallic", 1.0)
    set_in(b, "Anisotropic", aniso)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (0.05, 1, 0.05)
    n1 = nt.nodes.new('ShaderNodeTexNoise')
    n1.inputs['Scale'].default_value = 200
    n1.inputs['Detail'].default_value = 2
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['To Min'].default_value = lo
    mr.inputs['To Max'].default_value = hi
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], n1.inputs['Vector'])
    nt.links.new(n1.outputs['Fac'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], b.inputs['Roughness'])
    return m

def mat_simple(name, base, rough=0.5, metal=0.0, coat=0.0, spec=0.5):
    m, b, nt = new_mat(name)
    set_in(b, "Base Color", (*base, 1))
    set_in(b, "Roughness", rough)
    set_in(b, "Metallic", metal)
    set_in(b, "Coat Weight", coat)
    set_in(b, "Specular IOR Level", spec)
    return m

def mat_glass(name, tint, rough=0.03):
    m, b, nt = new_mat(name)
    set_in(b, "Base Color", (*tint, 1))
    set_in(b, "Roughness", rough)
    set_in(b, "Transmission Weight", 0.9)
    set_in(b, "IOR", 1.52)
    set_in(b, "Coat Weight", 0.5)
    set_in(b, "Coat Roughness", 0.03)
    return m

M = {}
M['leather'] = mat_leather()
M['silver'] = mat_silver()
M['silver_bright'] = mat_silver("silver_bright", (0.78, 0.79, 0.81), 0.12, 0.22, 0.45)
M['dark_metal'] = mat_simple("dark_metal", (0.08, 0.08, 0.09), 0.42, metal=0.6)
M['black_plastic'] = mat_simple("black_plastic", (0.02, 0.02, 0.021), 0.38, coat=0.25)
M['rubber'] = mat_simple("rubber", (0.022, 0.021, 0.02), 0.78)
M['inner_dark'] = mat_simple("inner_dark", (0.008, 0.008, 0.009), 0.55)
M['glass'] = mat_glass("glass", (0.75, 0.85, 0.95))
M['glass_blue'] = mat_glass("glass_blue", (0.35, 0.5, 0.72), 0.05)
M['text_black'] = mat_simple("text_black", (0.015, 0.015, 0.015), 0.4)
M['text_silver'] = mat_simple("text_silver", (0.75, 0.76, 0.78), 0.3, metal=1.0)
M['floor'] = mat_simple("floor", (1.0, 1.0, 1.0), 0.96, spec=0.0)

# ---------------- body ----------------
LEA, SIL, SILB = M['leather'], M['silver'], M['silver_bright']

make_box("baseplate", 1.34, 0.09, 0.40, z=0.045, mat=SIL, bevel=0.015)
make_box("body", 1.34, 0.50, 0.38, z=0.34, mat=LEA, bevel=0.045, segs=4)
make_box("topplate", 1.36, 0.10, 0.40, z=0.64, mat=SIL, bevel=0.025, segs=4)
make_box("pad_front_L", 0.34, 0.30, 0.016, x=-0.44, y=-0.191, z=0.34, mat=LEA, bevel=0.006)
make_box("pad_front_R", 0.34, 0.30, 0.016, x=0.44, y=-0.191, z=0.34, mat=LEA, bevel=0.006)

# pentaprism housing (top face narrowed on X and Y)
pent = make_box("pentaprism", 0.52, 0.26, 0.42, x=0.08, z=0.82, mat=SIL, bevel=0.02, segs=4)
for v in pent.data.vertices:
    if v.co.z > 0.1299:
        v.co.x *= 0.40 / 0.52
        v.co.y *= 0.30 / 0.42

# strap lugs
for sx in (-1, 1):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.035, minor_radius=0.009,
        location=(sx*0.675, 0.0, 0.60), rotation=(0, R90, 0))
    lug = bpy.context.active_object
    lug.name = "strap_lug"
    lug.data.materials.append(SILB)
    smooth_obj(lug)

# feet
for sx in (-1, 1):
    make_cyl("foot", 0.035, 0.02, x=sx*0.45, z=0.01, mat=M['black_plastic'], smooth=False)

# ---------------- lens (axis along -Y, center x=0.08, z=0.34) ----------------
LX, LZ = 0.08, 0.34
rotY = (R90, 0, 0)
make_cyl("mount_ring", 0.25, 0.05, LX, -0.215, LZ, mat=SIL, rot=rotY, bevel=0.006)
make_cyl("barrel_base", 0.205, 0.09, LX, -0.285, LZ, mat=M['black_plastic'], rot=rotY)
make_cyl("depth_ring", 0.207, 0.02, LX, -0.34, LZ, mat=SILB, rot=rotY)
make_cyl("focus_ring", 0.222, 0.16, LX, -0.44, LZ, mat=M['rubber'], rot=rotY)
make_teeth("focus_teeth", 110, 0.229, 0.009, 0.007, 0.14, 'Y', mat=M['rubber'], cx=LX, cy=-0.44, cz=LZ)
make_cyl("aperture_ring", 0.205, 0.07, LX, -0.555, LZ, mat=M['dark_metal'], rot=rotY)
make_teeth("aperture_teeth", 64, 0.208, 0.004, 0.0035, 0.055, 'Y', mat=M['dark_metal'], cx=LX, cy=-0.555, cz=LZ)
make_cyl("barrel_front", 0.192, 0.10, LX, -0.64, LZ, mat=M['black_plastic'], rot=rotY)
make_cyl("inner_tube", 0.16, 0.06, LX, -0.665, LZ, mat=M['inner_dark'], rot=rotY)
make_sphere("lens_front", 0.17, LX, -0.685, LZ, (1, 0.30, 1), M['glass'])
make_sphere("lens_inner", 0.115, LX, -0.575, LZ, (1, 0.3, 1), M['glass_blue'])
make_cyl("aperture_hint", 0.14, 0.005, LX, -0.70, LZ, mat=mat_simple("blue_deep", (0.03, 0.05, 0.10), 0.15), rot=rotY, smooth=False)

# lens release button + self-timer lever on front face
make_cyl("lens_release", 0.032, 0.028, 0.33, -0.20, 0.20, mat=SILB, rot=rotY, bevel=0.004)
make_cyl("timer_base", 0.02, 0.02, -0.32, -0.196, 0.26, mat=SIL, rot=rotY)
make_cyl("timer_lever", 0.009, 0.055, -0.32, -0.225, 0.245, mat=SILB, rot=(R90 + 0.15, 0, 0))

# ---------------- top deck (right: shutter dial+advance lever, left: rewind) ----------------
DX, DY = 0.52, -0.02   # shutter dial axis
make_cyl("shutter_dial", 0.13, 0.045, DX, DY, 0.7125, mat=SIL)
make_teeth("dial_teeth", 60, 0.133, 0.008, 0.01, 0.045, 'Z', mat=SIL, cx=DX, cy=DY, cz=0.7125)
# shutter button (concentric silver ring + black core)
make_cyl("shutter_ring", 0.062, 0.058, DX, DY, 0.764, mat=SILB, bevel=0.006)
make_cyl("shutter_core", 0.042, 0.07, DX, DY, 0.768, mat=M['black_plastic'])
make_cyl("shutter_dot", 0.016, 0.075, DX, DY, 0.77, mat=SILB)
# film advance lever (sweeps back, tilted up)
arm = make_box("advance_arm", 0.07, 0.02, 0.24, DX, 0.14, 0.732, mat=SILB, bevel=0.005)
arm.rotation_euler = (math.radians(14), 0, 0)
make_cyl("advance_tip", 0.03, 0.055, DX, 0.24, 0.778, mat=M['black_plastic'])
# rewind knob with knurl + fold-out crank
RX = -0.50
make_cyl("rewind_knob", 0.085, 0.075, RX, 0.02, 0.7275, mat=SIL)
make_teeth("rewind_teeth", 48, 0.0875, 0.006, 0.011, 0.062, 'Z', mat=SIL, cx=RX, cy=0.02, cz=0.7275)
make_cyl("rewind_cap", 0.042, 0.02, RX, 0.02, 0.775, mat=SILB)
make_cyl("crank_post", 0.012, 0.05, RX, 0.02, 0.79, mat=SILB)
make_box("crank_arm", 0.05, 0.028, 0.014, RX-0.02, 0.055, 0.81, mat=SILB, bevel=0.004)

# nameplate + model badge
make_box("nameplate", 0.26, 0.05, 0.012, -0.26, -0.204, 0.655, mat=SILB, bevel=0.005)
add_text("brand_text", "MERIDIAN", 0.036, -0.26, -0.2115, 0.655, M['text_black'])
add_text("model_text", "MX-70", 0.024, 0.44, -0.2035, 0.32, M['text_silver'])

# frame counter window on top-left deck
cwx = -0.60
make_cyl("counter_ring", 0.033, 0.014, cwx, -0.152, 0.696, mat=SILB)
make_cyl("counter_glass", 0.021, 0.018, cwx, -0.152, 0.697, mat=M['inner_dark'])

# eyepiece on the back
make_box("eyepiece_frame", 0.17, 0.07, 0.12, 0.08, 0.245, 0.80, mat=SIL, bevel=0.008)
make_box("eyepiece_glass", 0.13, 0.018, 0.085, 0.08, 0.265, 0.80, mat=M['glass_blue'])

# accessory hot shoe on pentaprism top
make_box("shoe_plate", 0.18, 0.012, 0.24, 0.08, 0.01, 0.956, mat=SIL, bevel=0.004)
for sx in (-1, 1):
    make_box("shoe_rail", 0.024, 0.045, 0.24, 0.08 + sx*0.078, 0.01, 0.9755, mat=SIL, bevel=0.003)
make_box("shoe_contact", 0.045, 0.008, 0.055, 0.08, 0.01, 0.966, mat=M['black_plastic'])

# ---------------- floor / world / lights ----------------
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
floor = bpy.context.active_object
floor.name = "floor"
floor.data.materials.append(M['floor'])

world = bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs['Color'].default_value = (0.909, 0.909, 0.909, 1)   # #E8E8E8
bg.inputs['Strength'].default_value = 1.0
scene.world = world

bpy.ops.object.empty_add(location=(0.08, -0.06, 0.47))
target = bpy.context.active_object
target.name = "aim_target"

def add_light(name, loc, energy, size, color=(1, 1, 1), shadow=True):
    ld = bpy.data.lights.new(name, 'AREA')
    ld.energy = energy
    ld.size = size
    ld.color = color
    try:
        ld.use_shadow = shadow
    except Exception:
        pass
    lo = bpy.data.objects.new(name, ld)
    lo.location = loc
    link(lo)
    con = lo.constraints.new('TRACK_TO')
    con.target = target
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Y'
    return lo

add_light("key", (-1.9, -2.1, 2.5), 150, 3.2, (1.0, 0.98, 0.95))
add_light("fill", (2.7, -1.2, 0.8), 45, 2.6, (0.93, 0.96, 1.0))
add_light("rim", (0.3, 2.5, 2.3), 240, 1.8, (1.0, 1.0, 1.0), shadow=False)
add_light("kicker", (-0.9, -3.2, 2.0), 70, 1.2, (0.95, 0.97, 1.0), shadow=False)

# ---------------- camera: 3/4 view from front-right, ~33 deg elevation ----------------
cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 50
cam_data.clip_start = 0.05
cam_data.clip_end = 100
cam = bpy.data.objects.new("cam", cam_data)
az, el, R = math.radians(40), math.radians(32), 2.95
cam.location = (R*math.cos(el)*math.sin(az), -R*math.cos(el)*math.cos(az), R*math.sin(el))
link(cam)
con = cam.constraints.new('TRACK_TO')
con.target = target
con.track_axis = 'TRACK_NEGATIVE_Z'
con.up_axis = 'UP_Y'
scene.camera = cam

# ---------------- render settings ----------------
scene.render.engine = 'BLENDER_EEVEE_NEXT'
ee = scene.eevee
ee.taa_render_samples = 192
ee.use_shadows = True
ee.shadow_ray_count = 10
ee.shadow_step_count = 14
try:
    ee.use_denoise = True
except Exception:
    pass
try:
    ee.use_raytracing = True
    ro = ee.ray_tracing_options
    ro.use_denoise = True
    ro.trace_max_roughness = 0.5
    print("RT_ON: raytracing enabled")
except Exception as e:
    print("RT_OFF:", e)
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'Standard'
scene.render.film_transparent = False

# subtle vignette for magazine-style focus
scene.use_nodes = True
vnt = scene.node_tree
vnt.nodes.clear()
rl = vnt.nodes.new('CompositorNodeRLayers')
ell = vnt.nodes.new('CompositorNodeEllipseMask')
ell.width = 0.9
ell.height = 0.9
vblur = vnt.nodes.new('CompositorNodeBlur')
vblur.size_x = 260
vblur.size_y = 260
lift = vnt.nodes.new('CompositorNodeMixRGB')
lift.blend_type = 'ADD'
lift.inputs['Fac'].default_value = 1.0
lift.inputs[2].default_value = (0.84, 0.84, 0.84, 1)
vmul = vnt.nodes.new('CompositorNodeMixRGB')
vmul.blend_type = 'MULTIPLY'
vmul.inputs['Fac'].default_value = 1.0
comp = vnt.nodes.new('CompositorNodeComposite')
vnt.links.new(rl.outputs['Image'], vmul.inputs[1])
vnt.links.new(ell.outputs['Mask'], vblur.inputs['Image'])
vnt.links.new(vblur.outputs['Image'], lift.inputs[1])
vnt.links.new(lift.outputs['Image'], vmul.inputs[2])
vnt.links.new(vmul.outputs['Image'], comp.inputs['Image'])

print("BUILD_OK: objects =", len(bpy.data.objects))

bpy.ops.wm.save_as_mainfile(filepath=BLEND)
scene.render.filepath = PNG
bpy.ops.render.render(write_still=True)
print("RENDER_OK:", PNG)