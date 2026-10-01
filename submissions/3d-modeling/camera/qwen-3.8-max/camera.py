# -*- coding: utf-8 -*-
"""
1970s 复古胶片单反相机 - 程序化建模 + Eevee 渲染 (Blender 4.3 headless)
所有几何体 bpy 生成，材质全程序化节点，无外部资源。
用法: blender --background --factory-startup --python camera.py
输出: camera/camera.png, camera/camera.blend (脚本同目录)
"""
import bpy, math, os

DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PNG = os.path.join(DIR, "camera.png")
OUT_BLEND = os.path.join(DIR, "camera.blend")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# ============================================================
# 材质 (全程序化)
# ============================================================
def base_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    return m, nt, bsdf

def set_bsdf(bsdf, **kw):
    for k, v in kw.items():
        if k in bsdf.inputs:
            bsdf.inputs[k].default_value = v

# --- 荔枝纹皮革(黑) ---
m_leather, nt, bsdf = base_mat("Leatherette")
set_bsdf(bsdf, **{'Base Color': (0.014, 0.013, 0.013, 1), 'Roughness': 0.70,
                  'Specular IOR Level': 0.06})
tex = nt.nodes.new('ShaderNodeTexNoise')
tex.inputs['Scale'].default_value = 1400.0
tex.inputs['Detail'].default_value = 10.0
tex.inputs['Roughness'].default_value = 0.55
bump = nt.nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = 0.003
bump.inputs['Distance'].default_value = 0.0015
nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
nt.links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
ramp = nt.nodes.new('ShaderNodeValToRGB')
cr = ramp.color_ramp
cr.elements[0].position = 0.35
cr.elements[1].position = 0.68
cr.elements[0].color = (0.010, 0.0095, 0.0095, 1)
cr.elements[1].color = (0.030, 0.029, 0.028, 1)
nt.links.new(tex.outputs['Fac'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])

# --- 银色拉丝金属(顶盖) ---
m_silver, nt, bsdf = base_mat("SilverBrushed")
set_bsdf(bsdf, **{'Base Color': (0.82, 0.82, 0.85, 1), 'Metallic': 1.0, 'Roughness': 0.28})
tex = nt.nodes.new('ShaderNodeTexNoise')
tex.inputs['Scale'].default_value = 4.0
tex.inputs['Detail'].default_value = 6.0
mp = nt.nodes.new('ShaderNodeMapping')
mp.inputs['Scale'].default_value = (60.0, 1500.0, 60.0)  # 沿X拉伸的刷纹
coord = nt.nodes.new('ShaderNodeTexCoord')
nt.links.new(coord.outputs['Object'], mp.inputs['Vector'])
nt.links.new(mp.outputs['Vector'], tex.inputs['Vector'])
mr = nt.nodes.new('ShaderNodeMapRange')
mr.inputs['From Min'].default_value = 0.3
mr.inputs['From Max'].default_value = 0.7
mr.inputs['To Min'].default_value = 0.28
mr.inputs['To Max'].default_value = 0.50
nt.links.new(tex.outputs['Fac'], mr.inputs['Value'])
nt.links.new(mr.outputs['Result'], bsdf.inputs['Roughness'])
bump2 = nt.nodes.new('ShaderNodeBump')
bump2.inputs['Strength'].default_value = 0.00012
nt.links.new(tex.outputs['Fac'], bump2.inputs['Height'])
nt.links.new(bump2.outputs['Normal'], bsdf.inputs['Normal'])

# --- 抛光铬银(饰圈/小件) ---
m_chrome, nt, bsdf = base_mat("Chrome")
set_bsdf(bsdf, **{'Base Color': (0.90, 0.90, 0.92, 1), 'Metallic': 1.0, 'Roughness': 0.10})

# --- 黑色阳极氧化铝(镜筒) ---
m_black, nt, bsdf = base_mat("BlackMetal")
set_bsdf(bsdf, **{'Base Color': (0.020, 0.020, 0.021, 1), 'Metallic': 0.55,
                  'Roughness': 0.34, 'Coat Weight': 0.25, 'Coat Roughness': 0.2})

# --- 滚花齿用黑金属(略粗糙) ---
m_knurl, nt, bsdf = base_mat("KnurlMetal")
set_bsdf(bsdf, **{'Base Color': (0.024, 0.024, 0.025, 1), 'Metallic': 0.6, 'Roughness': 0.42})

# --- 前组玻璃(带蓝镀膜感) ---
m_glass, nt, bsdf = base_mat("LensGlass")
set_bsdf(bsdf, **{'Base Color': (0.62, 0.70, 0.88, 1), 'Metallic': 0.0, 'Roughness': 0.03,
                  'IOR': 1.8, 'Transmission Weight': 1.0,
                  'Coat Weight': 0.3, 'Coat Roughness': 0.03, 'Coat IOR': 1.4})

# --- 镜筒内部深色玻璃/镜片 ---
m_inner_glass, nt, bsdf = base_mat("InnerGlass")
set_bsdf(bsdf, **{'Base Color': (0.10, 0.14, 0.28, 1), 'Metallic': 0.2, 'Roughness': 0.08,
                  'Specular IOR Level': 1.0})

# --- 取景器目镜黑玻璃 ---
m_dark, nt, bsdf = base_mat("DarkGlass")
set_bsdf(bsdf, **{'Base Color': (0.01, 0.01, 0.012, 1), 'Metallic': 0.0, 'Roughness': 0.06,
                  'Specular IOR Level': 1.0})

# --- 红点 / 橙色索引 ---
m_red, nt, bsdf = base_mat("RedDot")
set_bsdf(bsdf, **{'Base Color': (0.65, 0.02, 0.015, 1), 'Roughness': 0.25,
                  'Coat Weight': 1.0, 'Coat Roughness': 0.05})
m_orange, nt, bsdf = base_mat("OrangeMark")
set_bsdf(bsdf, **{'Base Color': (0.9, 0.30, 0.01, 1), 'Roughness': 0.4})

# --- 白色刻度 ---
m_white, nt, bsdf = base_mat("WhitePaint")
set_bsdf(bsdf, **{'Base Color': (0.85, 0.85, 0.83, 1), 'Roughness': 0.4})

# --- 地面/背景灰 ---
# --- 影棚地台: 近处漫反射(承接接触阴影), 远处平滑过渡到自发光 #E8E8E8 ---
m_sweep = bpy.data.materials.new("Sweep")
m_sweep.use_nodes = True
nt = m_sweep.node_tree
nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputMaterial')
dif = nt.nodes.new('ShaderNodeBsdfDiffuse')
dif.inputs['Color'].default_value = (0.806, 0.806, 0.806, 1)
emi = nt.nodes.new('ShaderNodeEmission')
emi.inputs['Color'].default_value = (0.806, 0.806, 0.806, 1)
emi.inputs['Strength'].default_value = 1.0
mixsh = nt.nodes.new('ShaderNodeMixShader')
geo = nt.nodes.new('ShaderNodeNewGeometry')
sep = nt.nodes.new('ShaderNodeSeparateXYZ')
mrs = nt.nodes.new('ShaderNodeMapRange')
mrs.interpolation_type = 'SMOOTHSTEP'
mrs.inputs['From Min'].default_value = 0.35
mrs.inputs['From Max'].default_value = 0.90
nt.links.new(geo.outputs['Position'], sep.inputs['Vector'])
nt.links.new(sep.outputs['Y'], mrs.inputs['Value'])
nt.links.new(mrs.outputs['Result'], mixsh.inputs['Fac'])
nt.links.new(dif.outputs['BSDF'], mixsh.inputs[1])
nt.links.new(emi.outputs['Emission'], mixsh.inputs[2])
nt.links.new(mixsh.outputs['Shader'], out.inputs['Surface'])

# ============================================================
# 几何辅助
# ============================================================
def shade_smooth(o):
    try:
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_smooth_by_angle()
    except Exception:
        for p in o.data.polygons:
            p.use_smooth = True

def box(size, loc, rot=(0, 0, 0), mat=None, name="box"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    if mat: o.data.materials.append(mat)
    return o

def bevel(o, width, seg=4):
    m = o.modifiers.new("Bevel", 'BEVEL')
    m.width = width
    m.segments = seg
    m.limit_method = 'ANGLE'
    m.angle_limit = math.radians(35)
    return m

def cyl(r, depth, loc, mat=None, verts=64, name="cyl", rot=(math.radians(90), 0, 0)):
    """圆柱, 默认轴向 Y (相机前后方向)"""
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, vertices=verts,
                                        location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    if mat: o.data.materials.append(mat)
    shade_smooth(o)
    return o

def knurl(radius, a0, length, count, tooth_h=0.0011, tooth_w=0.0010, mat=None,
          axis='Y', c2=0.0):
    """环形滚花齿。axis='Y': 绕Y轴环, y=a0, 环心z=c2; axis='Z': 绕Z轴环, z=a0, 环心x=c2"""
    for i in range(count):
        t = i / count * math.tau
        if axis == 'Y':
            loc = (radius * math.cos(t), a0, c2 + radius * math.sin(t))
            rot = (0, -t, 0)
            sc = (tooth_h, length, tooth_w)
        else:
            loc = (c2 + radius * math.cos(t), radius * math.sin(t), a0)
            rot = (0, 0, t)
            sc = (tooth_h, tooth_w, length)
        box(sc, loc, rot=rot, mat=mat, name="knurl")

def tapered_box(sx, sy, sz, kx, ky, loc, mat=None, name="taper"):
    """上窄下宽的截锥盒"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object
    o.name = name
    for v in o.data.vertices:
        if v.co.z > 0:
            v.co.x *= kx
            v.co.y *= ky
    o.scale = (sx, sy, sz)
    if mat: o.data.materials.append(mat)
    return o

# ============================================================
# 机身
# ============================================================
# 主体: 140 x 50 x 92 mm, 底面在 z=0
body = box((0.140, 0.050, 0.092), (0, 0, 0.046), mat=m_leather, name="Body")
bevel(body, 0.0055, seg=5)
shade_smooth(body)

# 银色顶盖
top = box((0.1415, 0.0515, 0.0235), (0, 0, 0.0808), mat=m_silver, name="TopPlate")
bevel(top, 0.0035, seg=4)
shade_smooth(top)

# 银色底座沿
bot = box((0.1415, 0.0515, 0.005), (0, 0, 0.0025), mat=m_silver, name="BasePlate")
bevel(bot, 0.0018, seg=3)
shade_smooth(bot)

# 前脸/两侧皮革饰板(微凸, 增加层次)
fp = box((0.128, 0.0018, 0.050), (0, -0.0253, 0.040), mat=m_leather, name="FrontLeather")
bevel(fp, 0.0012, seg=3)
for sx in (-1, 1):
    sp = box((0.0018, 0.044, 0.050), (sx * 0.0703, 0, 0.040), mat=m_leather, name="SideLeather")
    bevel(sp, 0.0012, seg=3)

# 五棱镜取景器凸台
prism = tapered_box(0.046, 0.044, 0.021, 0.62, 0.55, (0, -0.004, 0.1028),
                    mat=m_silver, name="Prism")
bevel(prism, 0.003, seg=4)
shade_smooth(prism)
# 棱镜前脸黑色饰条
pf = box((0.024, 0.002, 0.008), (0, -0.0225, 0.0975), mat=m_black, name="PrismFront")
bevel(pf, 0.0008, seg=2)

# 热靴 (棱镜顶)
hs_y = -0.004
hs = box((0.019, 0.017, 0.0016), (0, hs_y, 0.1142), mat=m_chrome, name="HotShoe")
bevel(hs, 0.0004, seg=2)
for sx in (-1, 1):
    rail = box((0.0028, 0.017, 0.0032), (sx * 0.0095, hs_y, 0.1166), mat=m_black, name="ShoeRail")
    bevel(rail, 0.0006, seg=2)
contact = cyl(0.0026, 0.0012, (0, hs_y, 0.1155), mat=m_chrome, verts=32,
              name="ShoeContact", rot=(0, 0, 0))

# 目镜 (机背)
eye_ring = cyl(0.0095, 0.005, (0, 0.0268, 0.0775), mat=m_black, verts=48, name="EyepieceRing")
eye_glass = cyl(0.0078, 0.002, (0, 0.0292, 0.0775), mat=m_dark, verts=48, name="EyepieceGlass")

# ---- 顶部控件 ----
sb_x, sb_z = 0.0525, 0.0925
collar = cyl(0.0088, 0.008, (sb_x, 0, sb_z + 0.004), mat=m_chrome, verts=48, name="ShutterCollar")
knurl(0.0093, sb_z + 0.002, 0.0035, 28, 0.0008, 0.0008, mat=m_chrome, axis='Z', c2=sb_x)
btn = cyl(0.0060, 0.0055, (sb_x, 0, sb_z + 0.0062), mat=m_chrome, verts=48, name="ShutterBtn")
btn_top = cyl(0.0052, 0.0012, (sb_x, 0, sb_z + 0.0105), mat=m_silver, verts=48, name="BtnTop")

# 过片扳手 (右肩, 朝右前伸出)
lev_base = cyl(0.0115, 0.0045, (sb_x, 0, sb_z + 0.0075), mat=m_chrome, verts=48, name="LeverBase")
arm_ang = math.radians(-28)
dx, dy = math.cos(arm_ang), math.sin(arm_ang)
arm_len = 0.030
arm_z = sb_z + 0.0075
arm = box((arm_len, 0.0085, 0.0032),
          (sb_x + dx * arm_len * 0.45, dy * arm_len * 0.45, arm_z),
          rot=(0, 0, -arm_ang), mat=m_chrome, name="LeverArm")
bevel(arm, 0.0014, seg=3)
shade_smooth(arm)
tip = box((0.013, 0.0105, 0.0034),
          (sb_x + dx * arm_len * 0.88, dy * arm_len * 0.88, arm_z),
          rot=(0, 0, -arm_ang), mat=m_black, name="LeverTip")
bevel(tip, 0.0014, seg=3)
shade_smooth(tip)

# 倒片旋钮 (左肩)
rw_x, rw_z = -0.0525, 0.0925
rw = cyl(0.0105, 0.007, (rw_x, 0, rw_z + 0.0035), mat=m_chrome, verts=48, name="RewindKnob")
knurl(0.0106, rw_z + 0.0035, 0.006, 36, 0.0005, 0.0007, mat=m_chrome, axis='Z', c2=rw_x)
rw_cap = cyl(0.0085, 0.002, (rw_x, 0, rw_z + 0.0080), mat=m_silver, verts=48, name="RewindCap")
crank = box((0.012, 0.005, 0.0022), (rw_x + 0.002, 0, rw_z + 0.0101),
            rot=(0, math.radians(-8), 0), mat=m_chrome, name="RewindCrank")
bevel(crank, 0.0008, seg=2)

# 背带环 (两侧)
for sx in (-1, 1):
    lug = cyl(0.0032, 0.004, (sx * 0.0725, 0.0, 0.0845), mat=m_chrome, verts=24,
              name="StrapLug", rot=(0, math.radians(90), 0))
    ring = bpy.data.objects.new("StrapRing", None)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.0045, minor_radius=0.0009,
                                     major_segments=32, minor_segments=10,
                                     location=(sx * 0.0755, 0, 0.0845),
                                     rotation=(0, math.radians(90), 0))
    tor = bpy.context.active_object
    tor.name = "StrapRing"
    tor.data.materials.append(m_chrome)
    shade_smooth(tor)

# ---- 前脸: 品牌铭牌 + 红点 + 细节 ----
plate = box((0.034, 0.0016, 0.0085), (0.0455, -0.0268, 0.0555), mat=m_chrome, name="NamePlate")
bevel(plate, 0.0006, seg=2)

bpy.ops.object.text_add(location=(0.0455, -0.0280, 0.0555),
                        rotation=(math.radians(90), 0, 0))
txt = bpy.context.active_object
txt.name = "BrandText"
txt.data.body = "RETROLUX"
txt.data.size = 0.0052
txt.data.align_x = 'CENTER'
txt.data.align_y = 'CENTER'
txt.data.extrude = 0.0004
txt.data.materials.append(m_black)

# 自拍杆红点
red = cyl(0.0032, 0.0012, (-0.0455, -0.0272, 0.0555), mat=m_red, verts=32, name="RedDot")
red_ring = cyl(0.0042, 0.0008, (-0.0455, -0.0270, 0.0553), mat=m_chrome, verts=32, name="RedRing")
# 自拍杆
stl = box((0.004, 0.0022, 0.016), (-0.0455, -0.0278, 0.0455),
          rot=(math.radians(-18), 0, 0), mat=m_chrome, name="SelfTimerLever")
bevel(stl, 0.0008, seg=2)

# PC 同步端子
pc = cyl(0.0048, 0.003, (-0.058, -0.0263, 0.030), mat=m_black, verts=32, name="PCSync")
pc_in = cyl(0.0028, 0.002, (-0.058, -0.0282, 0.030), mat=m_dark, verts=32, name="PCSyncIn")

# ---- 镜头 (轴向 -Y, 光轴高度 LZ) ----
LZ = 0.044
# 1 卡口银环
cyl(0.034, 0.005, (0, -0.027, LZ), mat=m_chrome, name="LensMount")
# 2 光圈环(滚花)
cyl(0.030, 0.012, (0, -0.0355, LZ), mat=m_black, name="ApertureRing")
knurl(0.0303, -0.0355, 0.010, 64, 0.0011, 0.0009, mat=m_knurl, axis='Y', c2=LZ)
# 3 银色刻度带 + 橙色索引点
cyl(0.0295, 0.004, (0, -0.0435, LZ), mat=m_silver, name="ScaleBand")
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.0013, segments=16, ring_count=8,
                                     location=(0, -0.0442, LZ + 0.0293))
od = bpy.context.active_object
od.name = "IndexDot"
od.scale = (1, 0.5, 1)
od.data.materials.append(m_orange)
shade_smooth(od)
# 4 对焦环(滚花, 更宽)
cyl(0.0305, 0.015, (0, -0.053, LZ), mat=m_black, name="FocusRing")
knurl(0.0308, -0.053, 0.013, 72, 0.0012, 0.0009, mat=m_knurl, axis='Y', c2=LZ)
# 5 滤镜银环 + 前黑圈
cyl(0.028, 0.003, (0, -0.063, LZ), mat=m_chrome, name="FilterRing")
cyl(0.0272, 0.0017, (0, -0.06535, LZ), mat=m_black, name="FrontRim")
# 6 镜筒内部
cyl(0.0235, 0.0135, (0, -0.05075, LZ), mat=m_black, name="InnerBarrel")
cyl(0.023, 0.002, (0, -0.0585, LZ), mat=m_dark, name="Baffle")
cyl(0.016, 0.004, (0, -0.0615, LZ), mat=m_inner_glass, verts=48, name="MidElement")
cyl(0.0115, 0.0008, (0, -0.0637, LZ), mat=m_chrome, verts=48, name="DeepGlint")
# 7 前组玻璃(凸面)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.025, segments=64, ring_count=32,
                                     location=(0, -0.0615, LZ))
glass = bpy.context.active_object
glass.name = "FrontGlass"
glass.scale = (1, 0.38, 1)
glass.data.materials.append(m_glass)
shade_smooth(glass)

# ============================================================
# 场景: 地面 / 背景 / 三点光 / 相机
# ============================================================
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "Sweep"
ground.data.materials.append(m_sweep)

# 世界背景: 浅灰 #E8E8E8 (Standard 视图变换下用线性值)
world = bpy.data.worlds.new("StudioWorld")
scene.world = world
world.use_nodes = True
wnt = world.node_tree
bg = wnt.nodes['Background']
bg.inputs['Strength'].default_value = 0.25
lp = wnt.nodes.new('ShaderNodeLightPath')
mixc = wnt.nodes.new('ShaderNodeMix')
mixc.data_type = 'RGBA'
mixc.inputs[6].default_value = (0.12, 0.12, 0.12, 1)     # 非相机射线: 弱环境光
mixc.inputs[7].default_value = (0.806, 0.806, 0.806, 1)  # 相机射线: 背景 #E8E8E8
wnt.links.new(lp.outputs['Is Camera Ray'], mixc.inputs[0])
wnt.links.new(mixc.outputs[2], bg.inputs['Color'])

target = bpy.data.objects.new("Target", None)
scene.collection.objects.link(target)
target.location = (0, -0.01, 0.052)

def add_area(name, loc, energy, size, shadow=False):
    ld = bpy.data.lights.new(name, type='AREA')
    ld.energy = energy
    ld.size = size
    ld.use_shadow = shadow
    o = bpy.data.objects.new(name, ld)
    scene.collection.objects.link(o)
    o.location = loc
    c = o.constraints.new('TRACK_TO')
    c.target = target
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'
    return o

# 主光(右前上, 柔和大面积, 投影) / 补光(左前, 弱) / 轮廓光(后上)
add_area("KeyLight", (0.42, -0.38, 0.55), 6, 0.90, shadow=True)
add_area("FillLight", (-0.52, -0.30, 0.30), 5, 0.75, shadow=False)
add_area("RimLight", (-0.10, 0.55, 0.45), 8, 0.30, shadow=False)

# 暗色挡光板(画框外): 给金属顶盖/铬件提供暗-亮反射渐变, 增强金属感
m_flag = bpy.data.materials.new("DarkFlag")
m_flag.use_nodes = True
fb = m_flag.node_tree.nodes.get('Principled BSDF')
fb.inputs['Base Color'].default_value = (0.04, 0.04, 0.04, 1)
fb.inputs['Roughness'].default_value = 0.9
flag = box((1.6, 1.6, 0.01), (0.75, 0.85, 0.90), mat=m_flag, name="DarkFlag")
fc = flag.constraints.new('TRACK_TO')
fc.target = target
fc.track_axis = 'TRACK_Z'
fc.up_axis = 'UP_Y'

# 渲染相机: 前侧上方 ~32° 俯视, 3/4 视角
cam_data = bpy.data.cameras.new("RenderCam")
cam_data.lens = 68
cam = bpy.data.objects.new("RenderCam", cam_data)
scene.collection.objects.link(cam)
cam.location = (-0.252, -0.300, 0.262)
c = cam.constraints.new('TRACK_TO')
c.target = target
c.track_axis = 'TRACK_NEGATIVE_Z'
c.up_axis = 'UP_Y'
scene.camera = cam

# ---- Eevee 渲染设置 ----
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 800
scene.render.resolution_y = 800
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = OUT_PNG

ee = scene.eevee
ee.taa_render_samples = 128
ee.use_shadows = True
ee.shadow_ray_count = 4
ee.shadow_step_count = 16
ee.use_gtao = True
ee.gtao_distance = 0.2
try:
    ee.use_raytracing = True
    ee.ray_tracing_options.use_denoise = True
except Exception:
    pass
for _m in (m_glass, m_inner_glass):
    for _a in ("use_raytrace_refraction", "use_screen_refraction"):
        if hasattr(_m, _a):
            setattr(_m, _a, True)
            break

# 色彩管理: Standard, 便于精确控制背景灰
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.display_settings.display_device = 'sRGB'

# ---- 保存 blend ----
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)

# ---- 渲染 ----
bpy.ops.render.render(write_still=True)
print("RENDER_OK:", OUT_PNG)
