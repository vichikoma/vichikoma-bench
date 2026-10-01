# -*- coding: utf-8 -*-
"""1970s 复古胶片单反相机 - 程序化建模 + Eevee 渲染
用法: blender --background --factory-startup --python build_camera.py -- <blend路径> <png路径>
"""
import bpy, sys, os, math
from math import radians, pi, sin, cos, atan2

argv = sys.argv[sys.argv.index("--") + 1:]
blend_path, png_path = argv[0], argv[1]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------- 材质 ----------------
def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m

def mat_leather():
    m = new_mat("Leather")
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 160.0
    noise.inputs["Detail"].default_value = 4.0
    noise.inputs["Roughness"].default_value = 0.85
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.55
    bump.inputs["Distance"].default_value = 0.12
    bs.inputs["Base Color"].default_value = (0.012, 0.012, 0.014, 1)
    bs.inputs["Roughness"].default_value = 0.55
    bs.inputs["Metallic"].default_value = 0.0
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], bs.inputs["Normal"])
    nt.links.new(bs.outputs[0], out.inputs[0])
    return m

def mat_metal(name, color, rough, aniso=0.0, brushed=False):
    m = new_mat(name)
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bs.inputs["Base Color"].default_value = color
    bs.inputs["Metallic"].default_value = 1.0
    bs.inputs["Roughness"].default_value = rough
    if aniso:
        for nm in ("Anisotropic IOR Level", "Anisotropic"):
            if nm in bs.inputs:
                bs.inputs[nm].default_value = aniso
                break
    if brushed:
        noise = nt.nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 6.0
        noise.inputs["Detail"].default_value = 2.0
        mapping = nt.nodes.new("ShaderNodeMapping")
        tex = nt.nodes.new("ShaderNodeTexCoord")
        mapping.inputs["Scale"].default_value = (1.0, 1.0, 80.0)
        bump = nt.nodes.new("ShaderNodeBump")
        bump.inputs["Strength"].default_value = 0.12
        bump.inputs["Distance"].default_value = 0.05
        nt.links.new(tex.outputs["Generated"], mapping.inputs["Vector"])
        nt.links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
        nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bs.inputs["Normal"])
    nt.links.new(bs.outputs[0], out.inputs[0])
    return m

def mat_simple(name, color, rough, metallic=0.0):
    m = new_mat(name)
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = color
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = metallic
    return m

def mat_glass(name, tint, rough=0.04):
    m = new_mat(name)
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = tint
    bs.inputs["Roughness"].default_value = rough
    bs.inputs["Metallic"].default_value = 0.0
    bs.inputs["Transmission Weight"].default_value = 1.0
    bs.inputs["IOR"].default_value = 1.52
    return m

LEATHER = mat_leather()
SILVER  = mat_metal("Silver", (0.72, 0.73, 0.75, 1), 0.24, aniso=0.35, brushed=True)
CHROME  = mat_metal("Chrome", (0.85, 0.86, 0.88, 1), 0.08)
BLACKMET= mat_metal("BlackMetal", (0.015, 0.015, 0.018, 1), 0.32)
DARK    = mat_simple("DarkInside", (0.004, 0.004, 0.005, 1), 0.85)
RUBBER  = mat_simple("Rubber", (0.02, 0.02, 0.022, 1), 0.7)
WHITE   = mat_simple("EngraveWhite", (0.85, 0.85, 0.85, 1), 0.5)
RED     = mat_simple("RedDot", (0.55, 0.015, 0.01, 1), 0.4)
def mat_coated(name, base, emit, estr):
    """镀膜镜片质感：深色高光面 + 微弱内发光，不依赖折射"""
    m = new_mat(name)
    bs = m.node_tree.nodes["Principled BSDF"]
    bs.inputs["Base Color"].default_value = base
    bs.inputs["Roughness"].default_value = 0.06
    bs.inputs["Metallic"].default_value = 0.15
    bs.inputs["IOR"].default_value = 1.5
    if "Coat Weight" in bs.inputs:
        bs.inputs["Coat Weight"].default_value = 1.0
        bs.inputs["Coat Roughness"].default_value = 0.04
    bs.inputs["Emission Color"].default_value = emit
    bs.inputs["Emission Strength"].default_value = estr
    return m

GLASS_F = mat_glass("GlassFront", (0.008, 0.015, 0.02, 1), 0.04)
COAT_P = mat_coated("CoatPurple", (0.012, 0.003, 0.045, 1), (0.08, 0.008, 0.22, 1), 0.22)
COAT_A = mat_coated("CoatAmber", (0.05, 0.012, 0.004, 1), (0.16, 0.05, 0.008, 1), 0.3)
GROUND  = mat_simple("Ground", (0.807, 0.807, 0.807, 1), 0.92)
PLATE_BK= mat_simple("PlateBlack", (0.01, 0.01, 0.012, 1), 0.45)

def assign(obj, mat):
    if mat: obj.data.materials.append(mat)

# ---------------- 几何助手 ----------------
def add_bevel(obj, width=0.25, segments=3):
    mod = obj.modifiers.new("Bevel", 'BEVEL')
    mod.width = width; mod.segments = segments
    mod.limit_method = 'ANGLE'
    try:
        wn = obj.modifiers.new("WNormal", 'WEIGHTED_NORMAL')
        wn.keep_sharp = True
    except Exception:
        pass
    for p in obj.data.polygons: p.use_smooth = True

def box(name, dims, loc, mat, bevel=0.2, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    o.scale = (dims[0]/2, dims[1]/2, dims[2]/2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel: add_bevel(o, bevel)
    assign(o, mat)
    return o

def cyl(name, r, depth, loc, mat, axis='Y', verts=64, smooth_side=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.active_object; o.name = name
    if axis == 'Y': o.rotation_euler = (pi/2, 0, 0)
    elif axis == 'X': o.rotation_euler = (0, pi/2, 0)
    for p in o.data.polygons:
        p.use_smooth = smooth_side and abs(p.normal.z) < 0.5
    assign(o, mat)
    return o

def knurl(name, r, depth, loc, mat, flutes=72, groove=0.09, axis='Y'):
    """滚花环：交替半径的齿轮状圆柱"""
    n = flutes * 2
    verts, faces = [], []
    for z in (-depth/2, depth/2):
        for i in range(n):
            a = 2*pi*i/n
            rr = r if i % 2 == 0 else r - groove
            verts.append((rr*cos(a), rr*sin(a), z))
    for i in range(n):
        j = (i+1) % n
        faces.append((i, j, j+n, i+n))
    faces.append(tuple(range(n-1, -1, -1)))
    faces.append(tuple(range(n, 2*n)))
    me = bpy.data.meshes.new(name+"Mesh"); me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.location = loc
    if axis == 'Y': o.rotation_euler = (pi/2, 0, 0)
    assign(o, mat)
    return o

def tube(name, r_out, r_in, depth, loc, mat, axis='Y', n=64):
    verts, faces = [], []
    for z in (-depth/2, depth/2):
        for rr in (r_out, r_in):
            for i in range(n):
                a = 2*pi*i/n
                verts.append((rr*cos(a), rr*sin(a), z))
    # 索引: 外前0..n-1, 内前n..2n-1, 外后2n..3n-1, 内后3n..4n-1
    for i in range(n):
        j = (i+1) % n
        faces.append((i, j, j+2*n, i+2*n))               # 外壁
        faces.append((n+j, n+i, n+i+2*n, n+j+2*n))       # 内壁
        faces.append((j, i, n+i, n+j))                   # 前环面
        faces.append((2*n+i, 2*n+j, 3*n+j, 3*n+i))       # 后环面
    me = bpy.data.meshes.new(name+"Mesh"); me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.location = loc
    if axis == 'Y': o.rotation_euler = (pi/2, 0, 0)
    for p in me.polygons: p.use_smooth = True
    assign(o, mat)
    return o

def torus(name, R, r, loc, mat, rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
        major_segments=48, minor_segments=12, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    for p in o.data.polygons: p.use_smooth = True
    assign(o, mat)
    return o

def sphere(name, r, loc, mat, scale=(1,1,1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=64, ring_count=32, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    for p in o.data.polygons: p.use_smooth = True
    assign(o, mat)
    return o

# ---------------- 机身 ----------------
# 主体（皮革）: x±7.2, y±3, z 0.8..9.3
box("BodyCore", (14.4, 6.0, 8.5), (0, 0, 5.05), LEATHER, bevel=0.7)
# 前面皮革贴片
box("FrontLeather", (13.6, 0.35, 7.8), (0, -3.05, 5.05), LEATHER, bevel=0.25)
# 顶盖（银）
box("TopPlate", (14.55, 6.15, 1.7), (0, 0, 10.05), SILVER, bevel=0.4)
# 底盖（银）
box("BottomPlate", (14.55, 6.15, 0.9), (0, 0, 0.55), SILVER, bevel=0.35)

# ---------------- 五棱镜取景器（梯形楔块） ----------------
def wedge(name, half_x, profile_yz, mat, bevel=0.28):
    verts = []
    for x in (-half_x, half_x):
        for (y, z) in profile_yz:
            verts.append((x, y, z))
    # 每侧 4 点，顺序与 profile 一致
    faces = [(0,1,2,3), (7,6,5,4)]
    for i in range(4):
        j = (i+1) % 4
        faces.append((i, j, j+4, i+4))
    me = bpy.data.meshes.new(name+"Mesh"); me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    if bevel: add_bevel(o, bevel)
    assign(o, mat)
    return o

# 截面: 前缘从 (y=-2.7,z=10.9) 斜升到 (y=-0.55,z=14.3)
PRISM_PROFILE = [(-2.7, 10.9), (2.7, 10.9), (1.9, 14.3), (-0.55, 14.3)]
wedge("Prism", 3.05, PRISM_PROFILE, SILVER, bevel=0.3)

# 棱镜前斜面参数
SLOPE = atan2(2.7-0.55, 14.3-10.9)  # ~32.3°
NZ = sin(SLOPE); NY = -cos(SLOPE)   # 斜面外法线 (0, NY, NZ)
fc = (0, -1.625, 12.6)              # 斜面中心

# 品牌铭牌（黑色小板 + 银色文字）
pl = box("NamePlate", (3.4, 0.28, 2.3),
         (0, fc[1]+NY*0.16, fc[2]+NZ*0.16), PLATE_BK, bevel=0.08,
         rot=(radians(-math.degrees(SLOPE)), 0, 0))

bpy.ops.object.text_add(location=(0, fc[1]+NY*0.36, fc[2]+NZ*0.36),
                        rotation=(radians(90-math.degrees(SLOPE)), 0, 0))
txt = bpy.context.active_object; txt.name = "BrandText"
txt.data.body = "NONE6"
txt.data.align_x = 'CENTER'; txt.data.align_y = 'CENTER'
txt.data.size = 0.85; txt.data.space_character = 1.1
txt.data.extrude = 0.025; txt.data.bevel_depth = 0.008
assign(txt, SILVER)

# 取景器目镜（背面）
cyl("Eyepiece", 1.05, 0.5, (0, 2.85, 12.7), RUBBER, axis='Y')
cyl("EyepieceGlass", 0.75, 0.15, (0, 3.05, 12.7), GLASS_F, axis='Y')

# ---------------- 热靴 ----------------
box("ShoeBase", (2.5, 1.9, 0.22), (0, 0.9, 14.42), PLATE_BK, bevel=0.05)
box("ShoeRailL", (0.32, 1.7, 0.16), (-0.92, 0.9, 14.56), CHROME, bevel=0.04)
box("ShoeRailR", (0.32, 1.7, 0.16), ( 0.92, 0.9, 14.56), CHROME, bevel=0.04)
box("ShoeSpring", (1.4, 1.4, 0.06), (0, 0.9, 14.56), CHROME, bevel=0.02)

# ---------------- 顶部控件 ----------------
# 快门速度盘（右）
knurl("SpeedDial", 1.3, 0.55, (5.1, 0.7, 11.15), BLACKMET, flutes=36, groove=0.07, axis='Z')
cyl("SpeedDialCap", 1.1, 0.12, (5.1, 0.7, 11.45), BLACKMET, axis='Z')
box("DialIndex", (0.1, 0.35, 0.05), (5.1, 0.0, 11.52), WHITE, bevel=0.02)
# 快门按钮（右前缘）
cyl("ShutterCollar", 0.68, 0.18, (5.9, -1.9, 10.95), PLATE_BK, axis='Z')
cyl("ShutterBtn", 0.46, 0.34, (5.9, -1.9, 11.12), CHROME, axis='Z')
# 过片扳手（右后，扳手尖指向右后）
cyl("LeverBase", 1.3, 0.4, (5.2, 1.9, 11.05), BLACKMET, axis='Z')
LEV_A = radians(38)
arm = box("AdvanceLever", (3.1, 0.9, 0.3), (0, 0, 0), BLACKMET, bevel=0.14)
arm.location = (5.2 + 1.35*cos(LEV_A), 1.9 + 1.35*sin(LEV_A), 11.38)
arm.rotation_euler = (0, 0, LEV_A)
cyl("LeverThumb", 0.48, 0.45,
    (5.2 + 2.85*cos(LEV_A), 1.9 + 2.85*sin(LEV_A), 11.42), SILVER, axis='Z')
# 倒片旋钮（左）
knurl("RewindKnob", 1.25, 0.85, (-5.2, 0.7, 11.3), BLACKMET, flutes=30, groove=0.08, axis='Z')
cyl("RewindFork", 0.45, 0.25, (-5.2, 0.7, 11.8), CHROME, axis='Z')
cyl("RewindBase", 1.0, 0.25, (-5.2, 0.7, 10.85), SILVER, axis='Z')

# 背带挂耳
torus("StrapLugL", 0.42, 0.12, (-7.2, 0.6, 8.4), CHROME, rot=(0, pi/2, 0))
torus("StrapLugR", 0.42, 0.12, ( 7.2, 0.6, 8.4), CHROME, rot=(0, pi/2, 0))

# ---------------- 前脸细节 ----------------
# 自拍机拨杆
st = box("SelfTimer", (0.42, 0.22, 1.7), (-4.6, -3.2, 6.0), BLACKMET, bevel=0.1)
st.rotation_euler = (0, 0, radians(-18))
# PC 同步插孔
cyl("PCSocket", 0.32, 0.2, (-5.9, -3.18, 8.0), CHROME, axis='Y')
cyl("PCSocketIn", 0.18, 0.24, (-5.9, -3.2, 8.0), DARK, axis='Y')
# 红点标记
cyl("RedDot", 0.14, 0.1, (3.2, -3.22, 7.6), RED, axis='Y')
# 景深预览按钮
cyl("DOFBtn", 0.3, 0.25, (4.0, -3.1, 3.6), PLATE_BK, axis='Y')

# ---------------- 镜头组 ----------------
LX, LZ = 0.0, 5.0
cyl("MountRing", 3.62, 0.5, (LX, -3.35, LZ), SILVER, axis='Y')
cyl("RearBarrel", 3.3, 1.0, (LX, -4.1, LZ), BLACKMET, axis='Y')
# 光圈环（滚花 + 银线）
knurl("ApertureRing", 3.36, 0.85, (LX, -5.0, LZ), BLACKMET, flutes=56, groove=0.08)
cyl("ApertureLine", 3.37, 0.1, (LX, -5.48, LZ), CHROME, axis='Y')
# 中环（带白色指标线）
cyl("MidBarrel", 3.24, 0.55, (LX, -5.8, LZ), BLACKMET, axis='Y')
box("IndexLine", (0.13, 0.5, 0.06), (LX, -5.8, LZ+3.22), WHITE, bevel=0.02)
# 对焦环（宽滚花）
knurl("FocusRing", 3.45, 1.7, (LX, -6.95, LZ), BLACKMET, flutes=64, groove=0.1)
# 前筒
cyl("FrontBarrel", 3.34, 0.7, (LX, -8.15, LZ), BLACKMET, axis='Y')
# 前压圈（环形）
tube("FrontBezel", 3.38, 2.75, 0.75, (LX, -8.85, LZ), BLACKMET)
# 压圈内镀铬装饰环
torus("BezelChrome", 2.68, 0.09, (LX, -9.18, LZ), CHROME, rot=(pi/2, 0, 0))
# 内部暗筒
tube("InnerTube", 2.8, 2.55, 1.6, (LX, -8.3, LZ), DARK)
# 第二片镜组（深处，琥珀色镀膜反光）
sphere("InnerLens2", 1.7, (LX, -8.55, LZ), COAT_A, scale=(1, 0.25, 1))
# 底部挡板
cyl("LensBack", 2.75, 0.15, (LX, -8.05, LZ), DARK, axis='Y')
# 视觉前片：凸面镀膜镜片（紫青色膜反）
sphere("FrontLens", 2.5, (LX, -9.05, LZ), COAT_P, scale=(1, 0.2, 1))

# ---------------- 地面 / 背景 ----------------
bpy.ops.mesh.primitive_plane_add(size=600, location=(0, 0, 0))
gnd = bpy.context.active_object; gnd.name = "Ground"
assign(gnd, GROUND)

# ---------------- 灯光（三点） ----------------
def area_light(name, energy, size, loc, color, target):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = energy; data.shape = 'DISK'; data.size = size
    data.color = color
    o = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(o)
    o.location = loc
    con = o.constraints.new('TRACK_TO')
    con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
    tgt = bpy.data.objects.get("AimTarget")
    con.target = tgt
    return o

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, -1.0, 6.0))
bpy.context.active_object.name = "AimTarget"

area_light("Key", 1500, 12, (20, -26, 32), (1.0, 0.96, 0.92), None)
area_light("Fill", 550, 14, (-24, -16, 14), (0.92, 0.95, 1.0), None)
area_light("Rim", 800, 14, (-4, 18, 28), (1.0, 1.0, 1.0), None)

# 反射卡（给镜片/金属一个高光形状，仅在反射中可见）
mc = new_mat("RefCard")
bs = mc.node_tree.nodes["Principled BSDF"]
bs.inputs["Emission Color"].default_value = (1, 1, 1, 1)
bs.inputs["Emission Strength"].default_value = 6.0
card = box("RefCardObj", (8, 0.1, 5), (0, -30, 42), mc, bevel=0)
card.rotation_euler = (radians(-50), 0, 0)
# 专用小灯：在前镜片凸起上打出一个点状高光
area_light("LensKick", 600, 2.5, (4, -16, 12), (1.0, 1.0, 1.0), None)

# ---------------- 世界 ----------------
world = bpy.data.worlds.new("World"); scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.807, 0.807, 0.807, 1)
bg.inputs[1].default_value = 0.6

# ---------------- 相机 ----------------
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 60
cam = bpy.data.objects.new("Cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (16.5, -27.5, 26.0)
con = cam.constraints.new('TRACK_TO')
con.track_axis = 'TRACK_NEGATIVE_Z'; con.up_axis = 'UP_Y'
con.target = bpy.data.objects["AimTarget"]
scene.camera = cam

# ---------------- 渲染设置 ----------------
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.filepath = png_path
scene.render.film_transparent = False
try:
    scene.eevee.taa_render_samples = 64
    scene.eevee.use_raytracing = True
    scene.eevee.use_gtao = True
    scene.eevee.gtao_distance = 2.5
    scene.eevee.gtao_factor = 1.3
except Exception as e:
    print("eevee opt warn:", e)
try:
    scene.view_settings.look = 'AgX - Medium High Contrast'
    scene.view_settings.exposure = 0.65
except Exception as e:
    print("look warn:", e)

bpy.ops.wm.save_as_mainfile(filepath=blend_path)
bpy.ops.render.render(write_still=True)
print("RENDER_OK:", png_path)
print("BLEND_OK:", blend_path)
