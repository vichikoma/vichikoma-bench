"""冬日微缩展示台 diorama — v1
歪斜童话塔屋 + 冰面小池 + 雪松 + 雪人 + 路灯 + 栅栏 + 飘雪
用法: blender --background --factory-startup --python build_diorama.py
输出: 脚本同目录下 diorama_winter.blend / render_v1.png
"""
import bpy, os, math, random
from mathutils import Vector

random.seed(20260910)
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
BLEND = os.path.join(OUT_DIR, "diorama_winter.blend")
PNG = os.path.join(OUT_DIR, "render_preview.png")

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# ---------------- 材质工具 ----------------
def mat(name, color, rough=0.8, metal=0.0, emis=None, es=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Alpha'].default_value = alpha
    if emis:
        b.inputs['Emission Color'].default_value = (*emis, 1)
        b.inputs['Emission Strength'].default_value = es
    return m

M_SNOW   = mat("Snow", (0.93, 0.95, 1.0), rough=0.55)
M_SLAB   = mat("Slab", (0.10, 0.12, 0.18), rough=0.55, metal=0.1)
M_BODY   = mat("HouseBody", (0.11, 0.38, 0.42), rough=0.7)
M_WOOD   = mat("Wood", (0.26, 0.16, 0.10), rough=0.8)
M_ROOF   = mat("Roof", (0.52, 0.12, 0.26), rough=0.6)
M_BRICK  = mat("Brick", (0.42, 0.22, 0.18), rough=0.85)
M_GLOW   = mat("Glow", (1.0, 0.72, 0.35, ), rough=0.4, emis=(1.0, 0.58, 0.25), es=6.0)
M_GOLD   = mat("Gold", (0.9, 0.65, 0.2), rough=0.3, metal=0.9)
M_IRON   = mat("Iron", (0.08, 0.09, 0.12), rough=0.45, metal=0.6)
M_ICE    = mat("Ice", (0.55, 0.74, 0.88), rough=0.08, metal=0.0)
M_PINE   = mat("Pine", (0.07, 0.22, 0.13), rough=0.85)
M_STONE  = mat("Stone", (0.22, 0.24, 0.30), rough=0.9)
M_ORANGE = mat("Carrot", (0.9, 0.42, 0.08), rough=0.6)
M_RED    = mat("Red", (0.65, 0.1, 0.12), rough=0.7)
M_PURPLE = mat("Purple", (0.25, 0.13, 0.35), rough=0.7)
M_BLACK  = mat("Black", (0.03, 0.03, 0.04), rough=0.4)
M_SMOKE  = mat("Smoke", (0.85, 0.87, 0.92), rough=0.95, alpha=0.55)

def smooth(obj):
    for p in obj.data.polygons:
        p.use_smooth = True

def put(obj, material=None):
    if material:
        obj.data.materials.append(material)
    smooth(obj)
    return obj

def cube(loc, size, m, rot=(0, 0, 0), bevel=0.0, bseg=4):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot, size=1)
    o = bpy.context.active_object
    o.scale = (size[0], size[1], size[2])
    if bevel > 0:
        b = o.modifiers.new("Bevel", 'BEVEL')
        b.width = bevel
        b.segments = bseg
        b.limit_method = 'ANGLE'
    return put(o, m)

def cyl(loc, r, d, m, rot=(0, 0, 0), verts=20, scale=(1, 1, 1), r2=None):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=d, location=loc,
                                        rotation=rot, vertices=verts)
    o = bpy.context.active_object
    o.scale = scale
    return put(o, m)

def cone(loc, r1, r2, d, m, rot=(0, 0, 0), verts=20, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=d,
                                    location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object
    o.scale = scale
    return put(o, m)

def ball(loc, r, m, scale=(1, 1, 1), seg=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=seg, radius=r, location=loc)
    o = bpy.context.active_object
    o.scale = scale
    return put(o, m)

def torus(loc, r, tube, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(location=loc, rotation=rot,
                                     major_radius=r, minor_radius=tube,
                                     major_segments=28, minor_segments=10)
    return put(bpy.context.active_object, m)

def beam(p1, p2, r, m, verts=8):
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    cyl(tuple((p1 + p2) / 2), r, d.length, m,
        rot=d.to_track_quat('Z', 'Y').to_euler(), verts=verts)

R = math.radians

# ================= 展示底座 =================
cube((0, 0, -0.45), (6.6, 6.6, 0.7), M_SLAB, bevel=0.30, bseg=8)      # 深色底座
cube((0, 0, -0.075), (6.0, 6.0, 0.30), M_SNOW, bevel=0.14, bseg=6)    # 雪面
# 地面积雪丘
for _ in range(9):
    a = random.uniform(0, math.tau)
    rr = random.uniform(1.6, 2.7)
    x, y = rr * math.cos(a), rr * math.sin(a)
    if abs(x + 1.0) < 1.5 and abs(y - 0.6) < 1.5:   # 避开房子
        continue
    if abs(x - 1.4) < 1.1 and abs(y + 1.0) < 1.1:   # 避开池塘
        continue
    ball((x, y, 0.06), random.uniform(0.3, 0.55), M_SNOW,
         scale=(1, random.uniform(0.8, 1.2), 0.35))

# ================= 小屋（歪斜童话塔屋） =================
HOUSE_POS = (-1.0, 0.6, 0.0)
HOUSE_ROT = (0, 0, R(-135))   # 门（局部+Y）朝向相机
house = bpy.data.objects.new("HouseGroup", None)
scene.collection.objects.link(house)
house.location = HOUSE_POS
house.rotation_euler = HOUSE_ROT

H = []  # 房子部件（局部坐标，稍后挂到 house 空物体）
# 塔身（下宽上窄）
H.append(cone((0, 0, 0.95), 1.15, 0.92, 1.9, M_BODY, verts=16))
# 三道木箍
for z, r in ((0.12, 1.17), (0.95, 1.07), (1.78, 0.97)):
    H.append(cyl((0, 0, z), r, 0.09, M_WOOD, verts=16))
# 歪斜屋顶
ROOF_TILT = (R(5.5), R(-6.5), 0)
H.append(cone((0, 0, 2.68), 1.40, 0.0, 1.6, M_ROOF, rot=ROOF_TILT, verts=16))
# 檐口积雪 + 顶部雪帽
H.append(cyl((0, 0, 1.96), 1.42, 0.10, M_SNOW, rot=ROOF_TILT, verts=16))
H.append(cone((0.07, -0.08, 3.10), 0.78, 0.0, 0.88, M_SNOW, rot=ROOF_TILT, verts=16))
# 屋顶尖饰 + 风向标
H.append(ball((0.13, -0.15, 3.52), 0.09, M_GOLD))
H.append(cyl((0.13, -0.15, 3.80), 0.02, 0.5, M_IRON, verts=6))
H.append(cyl((0.13, -0.15, 3.95), 0.015, 0.34, M_IRON, rot=(0, R(90), 0), verts=6))
H.append(ball((0.13, -0.15, 4.06), 0.045, M_GOLD))
# 圆拱门（局部 +Y 朝向）：更凸出、暖木色、带门灯/台阶/门楣雪
M_DOOR = mat("Door", (0.48, 0.30, 0.15), rough=0.65)
H.append(cyl((0, 1.10, 0.52), 0.30, 0.12, M_DOOR, rot=(R(90), 0, 0), scale=(1, 1.45, 1)))
H.append(torus((0, 1.14, 0.52), 0.315, 0.045, M_WOOD, rot=(R(90), 0, 0)))
H.append(ball((0.18, 1.22, 0.50), 0.035, M_GOLD))          # 门把手
H.append(cyl((0, 1.20, 0.95), 0.09, 0.10, M_GLOW, rot=(R(90), 0, 0), verts=12))  # 门上圆窗
H.append(ball((0.42, 1.16, 1.10), 0.06, M_GLOW))           # 门旁小灯
H.append(cyl((0.42, 1.08, 1.10), 0.02, 0.18, M_IRON, rot=(R(90), 0, 0), verts=6))
H.append(cyl((0, 1.25, 0.05), 0.42, 0.10, M_STONE, verts=14, scale=(1, 0.8, 1)))  # 台阶
H.append(ball((0, 1.12, 1.00), 0.28, M_SNOW, scale=(0.9, 0.35, 0.14)))  # 门楣积雪
# 两扇圆形亮窗（正面）+ 一扇侧窗
for wx in (-0.52, 0.52):
    H.append(cyl((wx, 1.00, 1.32), 0.21, 0.10, M_GLOW, rot=(R(90), 0, 0), verts=14))
    H.append(torus((wx, 1.00, 1.32), 0.235, 0.04, M_WOOD, rot=(R(90), 0, 0)))
H.append(cyl((0, -1.00, 1.45), 0.18, 0.10, M_GLOW, rot=(R(90), 0, 0), verts=14))
H.append(torus((0, -1.00, 1.45), 0.205, 0.035, M_WOOD, rot=(R(90), 0, 0)))
# 烟囱 + 炊烟（门上方屋面穿出，朝相机）
CH_TILT = (R(-14), R(8), 0)
H.append(cyl((0.28, 0.42, 2.45), 0.17, 1.1, M_BRICK, rot=CH_TILT, verts=12))
H.append(cyl((0.36, 0.56, 3.02), 0.21, 0.08, M_BRICK, rot=CH_TILT, verts=12))
H.append(cyl((0.37, 0.58, 3.10), 0.22, 0.10, M_SNOW, rot=CH_TILT, verts=12))
smoke_p = [(0.42, 0.68, 3.40, 0.13), (0.46, 0.78, 3.72, 0.17),
           (0.52, 0.92, 4.08, 0.21), (0.60, 1.10, 4.48, 0.26)]
for sx, sy, sz, sr in smoke_p:
    H.append(ball((sx, sy, sz), sr, M_SMOKE, scale=(1, 1, 0.85)))
# 房根积雪
for i in range(10):
    a = i / 10 * math.tau + 0.3
    H.append(ball((1.12 * math.cos(a), 1.12 * math.sin(a), 0.07),
                  random.uniform(0.16, 0.24), M_SNOW, scale=(1, 1, 0.45)))
# 屋檐冰棱
for i in range(16):
    a = i / 16 * math.tau + 0.15
    L = random.uniform(0.12, 0.30)
    H.append(cone((1.40 * math.cos(a), 1.40 * math.sin(a), 1.88 - L / 2),
                  0.030, 0.0, L, M_ICE, rot=(R(180), 0, 0), verts=6))
# 门口礼物盒
H.append(cube((-0.55, 1.42, 0.12), (0.24, 0.24, 0.22), M_RED, rot=(0, 0, R(20))))
H.append(cube((-0.55, 1.42, 0.12), (0.26, 0.06, 0.24), M_SNOW, rot=(0, 0, R(20))))
H.append(cube((-0.82, 1.30, 0.09), (0.17, 0.17, 0.16), M_GOLD, rot=(0, 0, R(-15))))
H.append(cube((-0.82, 1.30, 0.09), (0.19, 0.05, 0.18), M_RED, rot=(0, 0, R(-15))))
# 挂到 house 空物体下（不设 matrix_parent_inverse，局部坐标才会跟随空物体变换）
for o in H:
    o.parent = house

# ================= 院落 =================
# 冰面池塘（右前）
POND = (1.45, -1.05)
cyl((*POND, 0.05), 0.88, 0.06, M_ICE, verts=28)
torus((*POND, 0.08), 0.90, 0.055, M_SNOW)
for i in range(11):   # 池边雪堆
    a = i / 11 * math.tau
    ball((POND[0] + 0.98 * math.cos(a), POND[1] + 0.98 * math.sin(a), 0.07),
         random.uniform(0.13, 0.2), M_SNOW, scale=(1, 1, 0.5))

# 雪松（右后三棵）
def pine(x, y, s):
    cyl((x, y, 0.22 * s), 0.08 * s, 0.45 * s, M_WOOD, verts=8)
    tiers = [(0.72, 0.95, 0.72), (0.56, 0.88, 1.24), (0.38, 0.82, 1.74)]
    for r, d, z in tiers:
        cone((x, y, z * s), r * s, 0.0, d * s, M_PINE, verts=12)
        cone((x, y, (z + d * 0.33) * s), r * 0.82 * s, 0.0, d * 0.55 * s,
             M_SNOW, verts=12)
pine(1.70, 1.80, 1.15)
pine(2.35, 1.00, 0.80)
pine(0.85, 2.35, 0.60)

# 雪人（左前）
SX, SY = -0.55, -1.75
ball((SX, SY, 0.32), 0.38, M_SNOW, scale=(1, 1, 0.95))
ball((SX, SY, 0.82), 0.28, M_SNOW, scale=(1, 1, 0.95))
ball((SX, SY, 1.22), 0.20, M_SNOW)
ball((SX + 0.10, SY - 0.12, 1.20), 0.055, M_ORANGE, scale=(1, 2.2, 1))   # 胡萝卜鼻
ball((SX + 0.06, SY - 0.17, 1.28), 0.022, M_BLACK)                        # 眼睛
ball((SX - 0.05, SY - 0.18, 1.28), 0.022, M_BLACK)
torus((SX, SY, 1.05), 0.15, 0.035, M_RED)                                 # 围巾
cyl((SX, SY, 1.40), 0.24, 0.03, M_PURPLE, verts=14)                       # 帽檐
cyl((SX, SY, 1.51), 0.14, 0.22, M_PURPLE, verts=14)                       # 帽顶
beam((SX - 0.25, SY, 0.85), (SX - 0.68, SY - 0.10, 1.15), 0.018, M_WOOD)  # 手臂
beam((SX + 0.25, SY, 0.85), (SX + 0.66, SY - 0.14, 1.20), 0.018, M_WOOD)
for bz in (0.70, 0.82, 0.94):   # 纽扣
    ball((SX, SY - 0.27, bz), 0.025, M_BLACK)

# 路灯（小径旁，前景不挡屋）
LX, LY = 2.60, -0.35
cyl((LX, LY, 0.70), 0.035, 1.40, M_IRON, verts=8)
cyl((LX, LY, 0.05), 0.12, 0.10, M_IRON, verts=8)
ball((LX, LY, 1.48), 0.10, M_GLOW)
cone((LX, LY, 1.64), 0.16, 0.0, 0.12, M_IRON, verts=10)

# 信箱（小径起点旁）
BX, BY = -0.10, -0.75
cyl((BX, BY, 0.28), 0.03, 0.56, M_WOOD, verts=8)
cube((BX, BY, 0.62), (0.22, 0.34, 0.18), M_RED, bevel=0.05, bseg=3)
cube((BX, BY, 0.72), (0.23, 0.35, 0.03), M_SNOW)
cyl((BX + 0.12, BY + 0.10, 0.80), 0.015, 0.16, M_IRON, verts=6)   # 小旗杆
cube((BX + 0.12, BY + 0.14, 0.86), (0.02, 0.10, 0.06), M_GOLD)

# 踏石小径：从门口通向前缘
p0 = Vector((-0.22, -0.18, 0.0))
p1 = Vector((2.05, -2.15, 0.0))
for i in range(6):
    t = (i + 0.5) / 6
    pos = p0.lerp(p1, t)
    pos.x += random.uniform(-0.12, 0.12)
    pos.y += random.uniform(-0.12, 0.12)
    ball((pos.x, pos.y, 0.045), random.uniform(0.16, 0.22), M_STONE,
         scale=(1, random.uniform(0.8, 1.15), 0.28))

# 白色尖桩栅栏（前缘弧线）
posts = []
for i in range(6):
    a = R(-55 - i * 12)
    posts.append((2.52 * math.cos(a), 2.52 * math.sin(a)))
for i, (px, py) in enumerate(posts):
    cyl((px, py, 0.24), 0.035, 0.50, M_SNOW, verts=8)
    cone((px, py, 0.55), 0.045, 0.0, 0.12, M_SNOW, verts=8)
    if i < len(posts) - 1:
        q = posts[i + 1]
        beam((px, py, 0.34), (q[0], q[1], 0.34), 0.022, M_SNOW)
        beam((px, py, 0.16), (q[0], q[1], 0.16), 0.022, M_SNOW)

# 漫天飘雪（一个小球一个雪花，稍后合并成单个对象）
flakes = []
for i in range(220):
    a = random.uniform(0, math.tau)
    rr = random.uniform(0.2, 3.1)
    x, y = rr * math.cos(a), rr * math.sin(a)
    z = random.uniform(0.5, 4.6)
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=1, radius=random.uniform(0.014, 0.028), location=(x, y, z))
    flakes.append(bpy.context.active_object)
bpy.ops.object.select_all(action='DESELECT')
for o in flakes:
    o.select_set(True)
bpy.context.view_layer.objects.active = flakes[0]
bpy.ops.object.join()
flakes[0].name = "SnowFall"
put(flakes[0], M_SNOW)

# ================= 世界 · 灯光 =================
world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
nt = world.node_tree
bg = nt.nodes['Background']
# 蓝调黄昏渐变天空（比 Nishita 可控）
tcw = nt.nodes.new('ShaderNodeTexCoord')
sep = nt.nodes.new('ShaderNodeSeparateXYZ')
mr = nt.nodes.new('ShaderNodeMapRange')
mr.inputs['From Min'].default_value = -0.75
mr.inputs['From Max'].default_value = -0.08
ramp = nt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].color = (0.008, 0.014, 0.035, 1)  # 画面下缘 暗夜
ramp.color_ramp.elements[1].color = (0.015, 0.030, 0.080, 1)  # 画面上缘 深蓝
e = ramp.color_ramp.elements.new(0.5)
e.color = (0.055, 0.10, 0.22, 1)                              # 主体背后 光晕带
nt.links.new(tcw.outputs['Generated'], sep.inputs['Vector'])
nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
nt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
bg.inputs['Strength'].default_value = 1.2

def lamp(kind, loc, rot, energy, color, radius=0.1):
    bpy.ops.object.light_add(type=kind, location=loc, rotation=rot)
    lt = bpy.context.active_object.data
    lt.energy = energy
    lt.color = color
    lt.use_shadow = True
    if kind == 'POINT':
        lt.shadow_soft_size = radius
    return lt

# 冷调主光（黄昏残阳方向）+ 微弱补光
lamp('SUN', (0, 0, 5), (R(24), R(12), R(35)), 1.6, (0.50, 0.62, 1.0))
lamp('AREA', (-3.5, -3.5, 3.0), (R(55), 0, R(-45)), 60, (0.50, 0.58, 0.9), 3.0)
# 屋内暖光 + 路灯光
lamp('POINT', (-0.08, -0.32, 1.30), (0, 0, 0), 60, (1.0, 0.68, 0.38), 0.5)  # 屋前暖光洗墙
lamp('POINT', (LX, LY, 1.48), (0, 0, 0), 90, (1.0, 0.72, 0.42), 0.3)
lamp('POINT', (-0.48, -0.52, 1.10), (0, 0, 0), 40, (1.0, 0.70, 0.40), 0.2)  # 门灯补光

# ================= 相机 =================
bpy.ops.object.empty_add(location=(0, 0, 1.15))
target = bpy.context.active_object
target.name = "CamTarget"
bpy.ops.object.camera_add(location=(9.4, -9.4, 4.4))
cam = bpy.context.active_object
cam.data.lens = 50
scene.camera = cam
tc = cam.constraints.new(type='TRACK_TO')
tc.target = target
tc.track_axis = 'TRACK_NEGATIVE_Z'
tc.up_axis = 'UP_Y'
target.location = (0, 0, 0.95)

# ================= 渲染设置（Eevee Next） =================
scene.render.engine = 'BLENDER_EEVEE_NEXT'
ee = scene.eevee
ee.use_shadows = True
ee.shadow_ray_count = 4
ee.taa_render_samples = 128
ee.use_gtao = True
ee.use_raytracing = False
scene.render.resolution_x = 1300
scene.render.resolution_y = 1300
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = PNG

# 合成器泛光：窗/灯暖光晕
scene.use_nodes = True
ct = scene.node_tree
ct.nodes.clear()
rl = ct.nodes.new('CompositorNodeRLayers')
glare = ct.nodes.new('CompositorNodeGlare')
glare.glare_type = 'FOG_GLOW'
glare.quality = 'HIGH'
glare.threshold = 0.7
glare.size = 9
comp = ct.nodes.new('CompositorNodeComposite')
ct.links.new(rl.outputs['Image'], glare.inputs['Image'])
ct.links.new(glare.outputs['Image'], comp.inputs['Image'])

# ================= 保存 + 渲染 =================
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
scene.frame_set(1)
bpy.ops.render.render(write_still=True)
print("RENDER_OK:", PNG)
print("BLEND_OK:", BLEND)