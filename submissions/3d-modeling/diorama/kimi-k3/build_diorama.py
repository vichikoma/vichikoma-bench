# -*- coding: utf-8 -*-
"""冬日微缩展示台：冬靴小屋 + 院落 + 蓝调雪夜。
用法: blender --background --factory-startup --python build_diorama.py -- <输出目录绝对路径>
产物: <输出目录>/diorama-winter.blend 与 <输出目录>/render.png
"""
import bpy, sys, os, math, random
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
OUT_DIR = argv[0]
os.makedirs(OUT_DIR, exist_ok=True)
random.seed(20261211)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'

# ---------------- 材质 ----------------
def new_mat(name, color, rough=0.7, metallic=0.0, emission=None, estr=0.0, subsurf=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1.0)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    if subsurf > 0:
        b.inputs["Subsurface Weight"].default_value = subsurf
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1.0)
        b.inputs["Emission Strength"].default_value = estr
    return m

SNOW   = new_mat("Snow",   (0.92, 0.94, 1.00), rough=0.85, subsurf=0.08)
WOOD_D = new_mat("WoodDark",(0.14, 0.08, 0.045), rough=0.5)
BRASS  = new_mat("Brass",  (0.80, 0.55, 0.20), rough=0.3, metallic=0.9)
LEATH  = new_mat("Leather",(0.39, 0.22, 0.11), rough=0.5)
LEATH_D= new_mat("Sole",   (0.11, 0.06, 0.035), rough=0.6)
CUFF   = new_mat("Cuff",   (0.86, 0.76, 0.60), rough=0.95)
BRICK  = new_mat("Brick",  (0.46, 0.17, 0.12), rough=0.8)
DOOR   = new_mat("Door",   (0.36, 0.10, 0.07), rough=0.6)
FRAME  = new_mat("Frame",  (0.20, 0.11, 0.05), rough=0.6)
GLASS  = new_mat("GlassWarm", (0.25, 0.12, 0.04), rough=0.4,
                 emission=(1.0, 0.55, 0.16), estr=7.0)
PINE   = new_mat("Pine",   (0.075, 0.21, 0.115), rough=0.9)
TRUNK  = new_mat("Trunk",  (0.20, 0.11, 0.06), rough=0.9)
ICE    = new_mat("Ice",    (0.52, 0.76, 0.94), rough=0.1, metallic=0.15)
STONE  = new_mat("Stone",  (0.44, 0.45, 0.50), rough=0.85)
CARROT = new_mat("Carrot", (0.90, 0.34, 0.05), rough=0.6)
COAL   = new_mat("Coal",   (0.02, 0.02, 0.025), rough=0.4)
SCARF  = new_mat("Scarf",  (0.72, 0.07, 0.10), rough=0.9)
FENCE  = new_mat("Fence",  (0.50, 0.34, 0.19), rough=0.85)
METAL  = new_mat("Metal",  (0.09, 0.09, 0.11), rough=0.4, metallic=0.8)
LANT   = new_mat("Lantern", (0.3, 0.15, 0.05), rough=0.4,
                 emission=(1.0, 0.60, 0.20), estr=9.0)
MOON   = new_mat("Moon",   (0.85, 0.90, 1.00), rough=1.0,
                 emission=(0.85, 0.92, 1.00), estr=3.2)
FLAKE  = new_mat("Flake",  (1.0, 1.0, 1.0), rough=1.0,
                 emission=(1.0, 1.0, 1.0), estr=1.2)
SMOKE  = new_mat("Smoke",  (0.78, 0.82, 0.90), rough=1.0,
                 emission=(0.85, 0.90, 1.00), estr=0.8)
GIFT1  = new_mat("Gift1",  (0.62, 0.10, 0.12), rough=0.5)
GIFT2  = new_mat("Gift2",  (0.10, 0.42, 0.46), rough=0.5)
BULB_W = new_mat("BulbW", (1.0, 0.8, 0.4), rough=0.5, emission=(1.0, 0.72, 0.28), estr=9.0)
BULB_R = new_mat("BulbR", (1.0, 0.3, 0.2), rough=0.5, emission=(1.0, 0.28, 0.18), estr=9.0)
BULB_G = new_mat("BulbG", (0.5, 1.0, 0.6), rough=0.5, emission=(0.45, 1.0, 0.55), estr=9.0)

# ---------------- 建模助手 ----------------
def _apply(obj, m):
    if m: obj.data.materials.append(m)
    return obj

def _smooth(obj):
    for p in obj.data.polygons: p.use_smooth = True

def cube(name, loc, dims, m=None, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    o.scale = (dims[0] / 2, dims[1] / 2, dims[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel > 0:
        md = o.modifiers.new("Bevel", 'BEVEL'); md.width = bevel; md.segments = 3
    return _apply(o, m)

def sph(name, loc, scale, m=None, seg=32, ring=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, location=loc)
    o = bpy.context.active_object; o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    _smooth(o)
    return _apply(o, m)

def cone(name, loc, r1, r2, depth, m=None, rot=(0, 0, 0), verts=32):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2,
                                    depth=depth, location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    _smooth(o)
    return _apply(o, m)

def cyl(name, loc, r, depth, m=None, rot=(0, 0, 0), verts=24):
    return cone(name, loc, r, r, depth, m, rot, verts)

def torus(name, loc, R, r, m=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r,
                                     major_segments=32, minor_segments=12,
                                     location=loc, rotation=rot)
    o = bpy.context.active_object; o.name = name
    _smooth(o)
    return _apply(o, m)

def ico(name, loc, r, m=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r, location=loc)
    o = bpy.context.active_object; o.name = name
    return _apply(o, m)

def parent_keep(child, parent):
    mw = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = mw

G = 1.9   # 雪面高度（院落地面）

# ---------------- 展示底座 ----------------
cube("Plinth", (0, 0, 0.70), (15.0, 15.0, 1.40), WOOD_D, bevel=0.9)
cube("BrassBand", (0, 0, 0.26), (15.5, 15.5, 0.30), BRASS, bevel=0.10)
cube("SnowSlab", (0, 0, 1.65), (14.2, 14.2, 0.50), SNOW, bevel=0.8)

# 铭牌
cube("Plate", (0, -7.55, 0.85), (3.4, 0.16, 0.72), BRASS, bevel=0.06)
bpy.ops.object.text_add(location=(0, -7.66, 0.85), rotation=(math.pi / 2, 0, 0))
txt = bpy.context.active_object; txt.name = "PlateText"
txt.data.body = "WINTER  TALE"
txt.data.align_x = 'CENTER'; txt.data.align_y = 'CENTER'
txt.data.size = 0.42; txt.data.extrude = 0.02
_apply(txt, WOOD_D)

# ---------------- 冬靴小屋 ----------------
hx, hy = -1.8, 0.9     # 小屋中心

# 鞋底 + 靴头
cube("Sole", (hx, hy, G + 0.27), (4.6, 2.5, 0.55), LEATH_D, bevel=0.28)
sph("Toe", (hx - 1.55, hy, G + 1.00), (1.75, 1.20, 1.05), LEATH)
# 靴头缝线装饰（一圈浅钉）
for i in range(9):
    a = math.radians(-60 + i * 15)
    sph("Stitch", (hx - 1.55 + 1.55 * math.cos(a), hy - 1.02 * math.sin(a) - 0.15, G + 1.35),
        (0.055, 0.055, 0.055), CUFF, seg=12, ring=8)
# 靴头雪帽
sph("ToeSnow", (hx - 1.55, hy, G + 1.88), (1.45, 1.02, 0.48), SNOW)

# 靴筒（微倾，连顶部整体挂到空物体上）
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(hx + 1.25, hy, G + 0.50))
tilt = bpy.context.active_object; tilt.name = "ShaftTilt"

shaft = cone("Shaft", (hx + 1.25, hy, G + 2.30), 1.30, 1.02, 3.60, LEATH)
cuff  = torus("CuffRing", (hx + 1.25, hy, G + 4.02), 1.06, 0.26, CUFF)
roof  = sph("RoofSnow", (hx + 1.25, hy, G + 4.55), (1.72, 1.72, 0.62), SNOW)
chim  = cyl("Chimney", (hx + 1.90, hy + 0.30, G + 5.05), 0.26, 1.50, BRICK, rot=(0, 0.12, 0))
chnow = torus("ChimSnow", (hx + 1.99, hy + 0.30, G + 5.72), 0.27, 0.10, SNOW, rot=(0, 0.12, 0))
for o in (shaft, cuff, roof, chim, chnow):
    parent_keep(o, tilt)
# 屋顶冰凌（尖朝下）
for i in range(9):
    a = math.radians(i * 40 + 12)
    r = 1.58
    ic = cone("Icicle", (hx + 1.25 + r * math.cos(a), hy + r * math.sin(a), G + 4.28),
              0.0, 0.075, 0.42 + 0.18 * (i % 3), ICE, verts=10)
    parent_keep(ic, tilt)
# 靴头雪帽冰凌
for i in range(4):
    a = math.radians(150 + i * 35)
    cone("IcicleT", (hx - 1.55 + 1.28 * math.cos(a), hy + 0.92 * math.sin(a), G + 1.62),
         0.0, 0.06, 0.32, ICE, verts=10)
tilt.rotation_euler = (0, math.radians(4), 0)   # 微倾，俏皮感

# 屋沿彩灯串（前檐一排）
for i in range(7):
    a = math.radians(215 + i * 18)
    bm = (BULB_W, BULB_R, BULB_G)[i % 3]
    bb = sph("Bulb", (hx + 1.25 + 1.60 * math.cos(a), hy + 1.60 * math.sin(a),
                      G + 4.10 - 0.10 * math.sin(math.pi * i / 6)),
             (0.075, 0.075, 0.075), bm, seg=12, ring=8)
    parent_keep(bb, tilt)

# 炊烟（不随倾斜，竖直上升）
sph("Smoke1", (hx + 2.05, hy + 0.30, G + 6.25), (0.30, 0.30, 0.30), SMOKE)
sph("Smoke2", (hx + 2.32, hy + 0.36, G + 6.85), (0.42, 0.42, 0.42), SMOKE)
sph("Smoke3", (hx + 2.68, hy + 0.42, G + 7.55), (0.56, 0.56, 0.56), SMOKE)

# 靴筒正面两扇圆窗（随筒倾斜）
for (wx, wz) in ((-1.05, G + 2.95), (-0.02, G + 3.55)):
    fr = cyl("WinFrame", (wx, -0.24, wz), 0.34, 0.20, FRAME, rot=(math.pi / 2, 0, 0))
    gl = cyl("WinGlass", (wx, -0.26, wz), 0.26, 0.22, GLASS, rot=(math.pi / 2, 0, 0))
    parent_keep(fr, tilt); parent_keep(gl, tilt)
# 靴头圆窗（朝 -X）
cyl("ToeWinFrame", (hx - 3.18, hy, G + 1.15), 0.50, 0.22, FRAME, rot=(0, math.pi / 2, 0))
cyl("ToeWinGlass", (hx - 3.20, hy, G + 1.15), 0.40, 0.24, GLASS, rot=(0, math.pi / 2, 0))

# 门（拱形，在靴筒正面底部）
cube("DoorBody", (hx + 1.25, -0.36, G + 0.72), (0.85, 0.18, 1.45), DOOR, bevel=0.06)
cyl("DoorArch", (hx + 1.25, -0.36, G + 1.44), 0.425, 0.18, DOOR, rot=(math.pi / 2, 0, 0))
cyl("DoorWin", (hx + 1.25, -0.47, G + 1.05), 0.11, 0.06, GLASS, rot=(math.pi / 2, 0, 0))
sph("DoorKnob", (hx + 1.55, -0.48, G + 0.75), (0.05, 0.05, 0.05), BRASS, seg=12, ring=8)
# 门楣雪条 + 门前石阶
cube("DoorSnow", (hx + 1.25, -0.36, G + 1.92), (1.10, 0.30, 0.16), SNOW, bevel=0.07)
cube("Step1", (hx + 1.25, -0.75, G + 0.10), (1.10, 0.55, 0.20), STONE, bevel=0.05)
cube("Step2", (hx + 1.25, -1.10, G + 0.05), (1.35, 0.55, 0.12), STONE, bevel=0.05)

# ---------------- 院落 ----------------
# 石板小径（门口通向前缘）
for i in range(5):
    sx = hx + 1.25 + random.uniform(-0.18, 0.18)
    sy = -1.55 - i * 1.02 + random.uniform(-0.10, 0.10)
    cyl("Path", (sx, sy, G + 0.05), random.uniform(0.34, 0.44), 0.12, STONE, verts=9)

# 木栅栏（前缘，小径处留门洞；右侧一段）
def picket(x, y, along_x=True):
    rot = (0, 0, 0) if along_x else (0, 0, math.pi / 2)
    cube("Picket", (x, y, G + 0.42), (0.16, 0.09, 0.85), FENCE, rot=rot)
    cone("PicketTip", (x, y, G + 0.93), 0.11, 0.0, 0.18, FENCE, rot=rot, verts=4)
    sph("PicketSnow", (x, y, G + 1.02), (0.09, 0.09, 0.05), SNOW, seg=12, ring=8)

px = -6.0
while px <= 6.01:
    if abs(px - (hx + 1.25)) > 0.95:
        picket(px, -6.30)
    px += 0.55
for zr in (G + 0.32, G + 0.66):
    cube("RailF", (-3.35, -6.33, zr), (5.5, 0.06, 0.10), FENCE)
    cube("RailF", (3.05, -6.33, zr), (6.2, 0.06, 0.10), FENCE)
py = -6.0
while py <= 1.51:
    picket(6.30, py, along_x=False)
    py += 0.55
for zr in (G + 0.32, G + 0.66):
    cube("RailR", (6.33, -2.25, zr), (0.06, 8.1, 0.10), FENCE)

# 雪人
smx, smy = 3.9, -2.6
sph("SnBase", (smx, smy, G + 0.55), (0.60, 0.60, 0.58), SNOW)
sph("SnMid",  (smx, smy, G + 1.38), (0.45, 0.45, 0.44), SNOW)
sph("SnHead", (smx, smy, G + 2.08), (0.32, 0.32, 0.32), SNOW)
for ex in (-0.11, 0.11):
    sph("SnEye", (smx + ex, smy - 0.28, G + 2.16), (0.045, 0.045, 0.045), COAL, seg=12, ring=8)
cone("SnNose", (smx, smy - 0.42, G + 2.06), 0.065, 0.0, 0.38, CARROT, rot=(math.pi / 2, 0, 0), verts=12)
for bz in (G + 1.20, G + 1.42, G + 1.62):
    sph("SnBtn", (smx, smy - 0.42, bz), (0.05, 0.05, 0.05), COAL, seg=12, ring=8)
cyl("SnArmL", (smx - 0.62, smy, G + 1.55), 0.035, 1.0, TRUNK, rot=(0, 1.15, 0), verts=10)
cyl("SnArmR", (smx + 0.62, smy, G + 1.55), 0.035, 1.0, TRUNK, rot=(0, -1.15, 0), verts=10)
torus("SnScarf", (smx, smy, G + 1.76), 0.30, 0.10, SCARF)
cube("SnScarfTail", (smx + 0.22, smy - 0.30, G + 1.52), (0.16, 0.06, 0.45), SCARF, rot=(0, 0.15, 0))
torus("SnHatBrim", (smx, smy, G + 2.36), 0.24, 0.055, COAL)
cyl("SnHat", (smx, smy, G + 2.52), 0.18, 0.30, COAL)
sph("SnHatSnow", (smx, smy, G + 2.68), (0.16, 0.16, 0.06), SNOW, seg=12, ring=8)

# 雪松（分层绿锥 + 雪顶）
def pine(x, y, s):
    cyl("PineTrunk", (x, y, G + 0.35 * s), 0.16 * s, 0.8 * s, TRUNK)
    for i in range(3):
        cz = G + (0.85 + 0.78 * i) * s
        cr = (1.15 - 0.28 * i) * s
        cone("PineTier", (x, y, cz), cr, 0.05 * s, 1.05 * s, PINE, verts=16)
        cone("PineSnow", (x, y, cz + 0.42 * s), cr * 0.62, 0.02 * s, 0.34 * s, SNOW, verts=16)
pine(-4.9, 3.6, 1.35)
pine(5.0, 3.9, 1.10)
pine(5.7, 0.6, 0.80)
pine(-5.6, -1.6, 0.70)

# 冰湖
cyl("Pond", (2.7, 2.9, G + 0.04), 1.45, 0.10, ICE, verts=40)
torus("PondRim", (2.7, 2.9, G + 0.06), 1.48, 0.15, SNOW)
sph("PondStone", (4.05, 3.6, G + 0.18), (0.30, 0.26, 0.22), STONE, seg=16, ring=12)

# 路灯 ×2（夹着小径）
def lantern(x, y):
    cyl("LantPost", (x, y, G + 0.55), 0.05, 1.10, METAL)
    cube("LantBox", (x, y, G + 1.24), (0.24, 0.24, 0.28), LANT, bevel=0.03)
    cone("LantCap", (x, y, G + 1.45), 0.20, 0.05, 0.16, METAL, verts=4)
    sph("LantSnow", (x, y, G + 1.55), (0.08, 0.08, 0.045), SNOW, seg=12, ring=8)
lantern(-1.95, -2.25)
lantern(0.45, -3.75)

# 柴堆（屋侧）
for i, (lx, lz) in enumerate([(0, 0), (0.22, 0), (-0.22, 0), (0.11, 0.19), (-0.11, 0.19)]):
    cyl("Log", (1.15 + lx, 1.55, G + 0.12 + lz), 0.095, 0.72, TRUNK, rot=(math.pi / 2, 0, 0), verts=12)

# 礼物盒（前院左侧）
def gift(x, y, s, boxm, ribm, rotz=0.0):
    cube("Gift", (x, y, G + 0.25 * s), (0.9 * s, 0.9 * s, 0.5 * s), boxm, bevel=0.06, rot=(0, 0, rotz))
    cube("GiftRib1", (x, y, G + 0.52 * s), (0.94 * s, 0.16 * s, 0.07 * s), ribm, rot=(0, 0, rotz))
    cube("GiftRib2", (x, y, G + 0.52 * s), (0.16 * s, 0.94 * s, 0.07 * s), ribm, rot=(0, 0, rotz))
    torus("GiftBow", (x, y, G + 0.58 * s), 0.10 * s, 0.045 * s, ribm)
gift(-3.60, -4.25, 1.00, GIFT1, BRASS, rotz=0.4)
gift(-2.55, -4.65, 0.72, GIFT2, SCARF, rotz=-0.3)

# 雪堆
for (mx, my, ms) in [(5.9, -4.7, 0.9), (-5.9, -3.4, 0.7), (-2.9, 5.4, 0.8),
                     (1.6, 5.6, 0.65), (-5.7, 1.2, 0.55), (3.6, -5.6, 0.6)]:
    sph("Mound", (mx, my, G + 0.10 * ms), (ms, ms * 0.9, 0.38 * ms), SNOW)

# 飘雪
n = 0
while n < 90:
    fx, fy = random.uniform(-6.6, 6.6), random.uniform(-6.6, 6.6)
    fz = random.uniform(G + 0.4, 9.8)
    if abs(fx - hx) < 3.0 and abs(fy - hy) < 2.4 and fz < G + 5.5:
        continue
    ico("Flake", (fx, fy, fz), random.uniform(0.028, 0.05), FLAKE)
    n += 1

# 月亮
sph("Moon", (-8.5, 14.0, 8.6), (1.60, 1.60, 1.60), MOON)

# ---------------- 灯光 ----------------
bpy.ops.object.light_add(type='SUN', location=(0, 0, 12))
sun = bpy.context.active_object; sun.name = "MoonLight"
sun.data.energy = 2.6; sun.data.color = (0.62, 0.74, 1.0); sun.data.angle = 0.35
sun.rotation_euler = (math.radians(28), math.radians(18), math.radians(125))

bpy.ops.object.light_add(type='POINT', location=(hx + 1.25, -1.7, G + 1.9))
pl = bpy.context.active_object; pl.name = "DoorLight"
pl.data.energy = 70; pl.data.color = (1.0, 0.55, 0.25); pl.data.shadow_soft_size = 0.4

bpy.ops.object.light_add(type='POINT', location=(3.9, -4.0, G + 2.2))
pl2 = bpy.context.active_object; pl2.name = "SnowmanLight"
pl2.data.energy = 30; pl2.data.color = (1.0, 0.65, 0.35); pl2.data.shadow_soft_size = 0.3

world = bpy.data.worlds.new("World"); scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (0.010, 0.018, 0.045, 1.0)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

# ---------------- 相机 ----------------
bpy.ops.object.camera_add(location=(16.5, -17.5, 12.8))
cam = bpy.context.active_object; cam.name = "Camera"
target = Vector((0, 0.2, 3.1))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 52
scene.camera = cam

# ---------------- 渲染设置 ----------------
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = 1100
scene.render.resolution_y = 1100
ee = scene.eevee
ee.taa_render_samples = 64
ee.shadow_ray_count = 4
ee.shadow_step_count = 8
scene.view_settings.look = 'AgX - Medium High Contrast'

# 泛光（合成器 Glare）
scene.use_nodes = True
ct = scene.node_tree; ct.nodes.clear()
rl = ct.nodes.new('CompositorNodeRLayers')
gl = ct.nodes.new('CompositorNodeGlare')
gl.glare_type = 'FOG_GLOW'; gl.quality = 'HIGH'; gl.threshold = 1.0; gl.size = 7
cp = ct.nodes.new('CompositorNodeComposite')
ct.links.new(rl.outputs['Image'], gl.inputs['Image'])
ct.links.new(gl.outputs['Image'], cp.inputs['Image'])

# ---------------- 保存 + 渲染 ----------------
blend_path = os.path.join(OUT_DIR, "diorama-winter.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("EXPORT_OK:", blend_path, "objects:", len(bpy.data.objects))

scene.render.filepath = os.path.join(OUT_DIR, "render.png")
scene.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(write_still=True)
print("RENDER_OK:", scene.render.filepath)
