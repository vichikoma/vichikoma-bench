"""diorama_lib.py — 冬日 diorama 共用函数与材质。

与 build_diorama.py 在同一 Blender 进程内运行，共享 bpy 场景数据。
"""
import math
import random
from mathutils import Vector

import bpy

# ----------------------------------------------------------------- 通用工具
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def coll(name):
    """拿/建一个 collection，链接到当前 Scene。"""
    if name in bpy.data.collections:
        c = bpy.data.collections[name]
    else:
        c = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(c)
    return c


def link(obj, c=None):
    """把当前活动物体 link 进指定 collection（默认根 collection）。"""
    if c is None:
        c = bpy.context.scene.collection
    if obj.name not in c.objects:
        c.objects.link(obj)


def assign_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def add_bevel(obj, width=0.04, segments=3, limit_method='ANGLE'):
    """加 bevel 修改器并立即 apply（headless 中 active_object 是 primitive_*_add 后的物体）。"""
    m = obj.modifiers.new("Bevel", 'BEVEL')
    m.width = width
    m.segments = segments
    m.limit_method = limit_method
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier="Bevel")


def place(obj, loc, rot=(0, 0, 0), scale=(1, 1, 1)):
    obj.location = loc
    obj.rotation_euler = rot
    obj.scale = scale


# ----------------------------------------------------------------- 材质
def make_mat(name, rgba, rough=0.5, metal=0.0, emission=None, emission_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    if len(rgba) == 3:
        rgba = (*rgba, 1.0)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    if emission is not None:
        if len(emission) == 3:
            emission = (*emission, 1.0)
        bsdf.inputs["Emission Color"].default_value = emission
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    return m


def make_all_mats():
    """集中创建本场景所有材质，命名便于复用。"""
    return {
        "snow":        make_mat("Mat_Snow",        (0.94, 0.96, 0.98), rough=0.85),
        "snow_shadow": make_mat("Mat_SnowShadow",  (0.84, 0.87, 0.92), rough=0.92),
        "wood_warm":   make_mat("Mat_WoodWarm",    (0.72, 0.45, 0.22), rough=0.70),
        "wood_dark":   make_mat("Mat_WoodDark",    (0.42, 0.26, 0.14), rough=0.78),
        "wood_light":  make_mat("Mat_WoodLight",   (0.86, 0.66, 0.42), rough=0.70),
        "stone":       make_mat("Mat_Stone",       (0.62, 0.58, 0.54), rough=0.85),
        "stone_dark":  make_mat("Mat_StoneDark",   (0.42, 0.38, 0.34), rough=0.90),
        "roof":        make_mat("Mat_Roof",        (0.62, 0.30, 0.22), rough=0.55),
        "roof_snow":   make_mat("Mat_RoofSnow",    (0.93, 0.95, 0.98), rough=0.85),
        "window_glow": make_mat("Mat_WindowGlow",  (1.00, 0.82, 0.45), rough=0.30,
                                emission=(1.00, 0.78, 0.38), emission_strength=30.0),
        "glass":       make_mat("Mat_Glass",       (0.75, 0.85, 0.90), rough=0.10),
        "pine":        make_mat("Mat_Pine",        (0.16, 0.32, 0.18), rough=0.90),
        "pine_dust":   make_mat("Mat_PineDust",    (0.26, 0.42, 0.26), rough=0.90),
        "ice":         make_mat("Mat_Ice",         (0.62, 0.78, 0.85), rough=0.15, metal=0.05),
        "lantern":     make_mat("Mat_LanternGlow", (1.00, 0.72, 0.32), rough=0.30,
                                emission=(1.00, 0.65, 0.28), emission_strength=50.0),
        "smoke":       make_mat("Mat_Smoke",       (0.88, 0.89, 0.91), rough=1.00),
        "metal_dark":  make_mat("Mat_MetalDark",   (0.28, 0.28, 0.30), rough=0.40, metal=0.70),
    }


# ----------------------------------------------------------------- 几何构件
def add_box(name, size=(1, 1, 1), loc=(0, 0, 0), rot=(0, 0, 0), mat=None, bevel_w=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    o.location = loc
    o.rotation_euler = rot
    if mat is not None:
        assign_mat(o, mat)
    if bevel_w > 0:
        add_bevel(o, width=bevel_w, segments=4)
    return o


def add_cyl(name, verts=12, r=1.0, depth=1.0, loc=(0, 0, 0), rot=(0, 0, 0),
            mat=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = rot
    o.scale = scale
    if mat is not None:
        assign_mat(o, mat)
    return o


def add_cone(name, verts=12, r1=1.0, r2=0.0, depth=1.0, loc=(0, 0, 0), rot=(0, 0, 0),
             mat=None):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2, depth=depth, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = rot
    if mat is not None:
        assign_mat(o, mat)
    return o


def add_sphere(name, r=0.5, loc=(0, 0, 0), scale=(1, 1, 1), mat=None):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if mat is not None:
        assign_mat(o, mat)
    return o


# ----------------------------------------------------------------- 复合构件
def make_tree(loc, scale=1.0, mats=None, coll_name="Trees", seed=None):
    """单棵针叶树：3 段圆锥 + 短树干。"""
    if mats is None:
        mats = make_all_mats()
    rng = random.Random(seed if seed is not None else hash(tuple(loc)) & 0xFFFF)
    c = coll(coll_name)
    s = scale

    # 树干
    trunk = add_cyl(f"Tree_{loc[0]:.2f}_{loc[1]:.2f}_trunk",
                    verts=6, r=0.06 * s, depth=0.45 * s,
                    loc=(loc[0], loc[1], loc[2] + 0.225 * s), mat=mats["wood_dark"])
    link(trunk, c)

    # 3 段树冠，圆锥叠加
    layers = [
        (0.55 * s, 0.80 * s, 0.40 * s),
        (0.42 * s, 0.72 * s, 0.85 * s),
        (0.30 * s, 0.65 * s, 1.28 * s),
    ]
    for i, (r, h, z) in enumerate(layers):
        # 浅偏移让树看着自然
        ox = rng.uniform(-0.03, 0.03) * s
        oy = rng.uniform(-0.03, 0.03) * s
        cone = add_cone(f"Tree_{loc[0]:.2f}_{loc[1]:.2f}_L{i}",
                        verts=8, r1=r, r2=0, depth=h,
                        loc=(loc[0] + ox, loc[1] + oy, loc[2] + z), mat=mats["pine"])
        link(cone, c)
        # 顶部一点白雪
        if i == len(layers) - 1:
            cap = add_cone(f"Tree_{loc[0]:.2f}_{loc[1]:.2f}_snow",
                           verts=8, r1=r * 0.45, r2=0, depth=h * 0.45,
                           loc=(loc[0] + ox, loc[1] + oy, loc[2] + z + h * 0.32),
                           mat=mats["snow"])
            link(cap, c)
        # 每层下方一圈"挂雪"小凸起
        bump = add_sphere(f"Tree_{loc[0]:.2f}_{loc[1]:.2f}_L{i}_snow",
                          r=r * 0.10,
                          loc=(loc[0] + ox - r * 0.6, loc[1] + oy + r * 0.05, loc[2] + z + h * 0.05),
                          scale=(1, 0.7, 0.5),
                          mat=mats["snow"])
        link(bump, c)


def make_pine_forest(positions, mats=None, coll_name="Trees"):
    for p in positions:
        make_tree(p, scale=p[3] if len(p) > 3 else 1.0, mats=mats, coll_name=coll_name)


def make_stone_path(start_xy, end_xy, z=0.235, n=6, mats=None, coll_name="Courtyard"):
    """起点到终点的踏脚石。xy = (x, y)。"""
    if mats is None:
        mats = make_all_mats()
    c = coll(coll_name)
    sx, sy = start_xy
    ex, ey = end_xy
    for i in range(n):
        t = i / max(n - 1, 1)
        x = sx + (ex - sx) * t
        y = sy + (ey - sy) * t
        wob = 0.04
        ox = random.uniform(-wob, wob)
        oy = random.uniform(-wob, wob)
        sx_size = random.uniform(0.20, 0.28)
        sy_size = random.uniform(0.16, 0.22)
        stone = add_cyl(f"Stone_{i}", verts=10, r=0.5, depth=0.04,
                        loc=(x + ox, y + oy, z - 0.005),
                        scale=(sx_size, sy_size, 1),
                        mat=mats["stone"])
        add_bevel(stone, width=0.015, segments=2)
        link(stone, c)


def make_fence(start, end, z=0.23, n=10, mats=None, coll_name="Courtyard"):
    """一段木栅栏：n 根立柱 + 一根横梁。"""
    if mats is None:
        mats = make_all_mats()
    c = coll(coll_name)
    sx, sy = start
    ex, ey = end
    # 横梁（略上方）
    dx = ex - sx
    dy = ey - sy
    length = math.hypot(dx, dy) + 0.1
    angle = math.atan2(dy, dx)
    rail = add_box("FenceRail", size=(length, 0.05, 0.05),
                   loc=((sx + ex) / 2, (sy + ey) / 2, z + 0.20),
                   rot=(0, 0, angle), mat=mats["wood_warm"])
    add_bevel(rail, width=0.008, segments=2)
    link(rail, c)

    # 立柱
    for i in range(n + 1):
        t = i / n
        x = sx + dx * t
        y = sy + dy * t
        post = add_box(f"FencePost_{i}", size=(0.04, 0.04, 0.42),
                       loc=(x, y, z + 0.21), mat=mats["wood_warm"])
        add_bevel(post, width=0.006, segments=2)
        link(post, c)
        # 柱头小雪帽
        cap = add_sphere(f"FenceCap_{i}", r=0.04,
                         loc=(x, y, z + 0.43), scale=(1, 1, 0.5),
                         mat=mats["snow"])
        link(cap, c)


def make_snowdrift(loc, radius=0.5, mats=None, coll_name="Props", seed=None):
    """一个扁平的雪堆（半球）。"""
    if mats is None:
        mats = make_all_mats()
    rng = random.Random(seed if seed is not None else hash(loc) & 0xFFFF)
    c = coll(coll_name)
    # 用 sphere 压扁做成雪堆
    sd = add_sphere("Snowdrift", r=radius,
                    loc=loc, scale=(radius * 1.4, radius * 1.2, radius * 0.45),
                    mat=mats["snow"])
    # 轻微倾斜
    sd.rotation_euler = (rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), rng.uniform(-0.2, 0.2))
    link(sd, c)
    return sd


def make_smoke_trail(start, n=7, mats=None, coll_name="Cabin", drift=(0.15, 0.0)):
    """从 start 位置向上飘的烟雾链：n 个递增大球。"""
    if mats is None:
        mats = make_all_mats()
    c = coll(coll_name)
    x, y, z = start
    dx, dy = drift
    rng = random.Random(0)
    for i in range(n):
        t = i / max(n - 1, 1)
        px = x + dx * i * 0.55 + rng.uniform(-0.05, 0.05)
        py = y + dy * i * 0.55 + rng.uniform(-0.05, 0.05)
        pz = z + 0.18 * (i + 1) + 0.10 * i * i * 0.05
        r = 0.08 + 0.06 * i
        s = add_sphere(f"Smoke_{i}", r=r, loc=(px, py, pz),
                       scale=(1.0, 1.0, 0.85), mat=mats["smoke"])
        link(s, c)


def make_lantern(loc, mats=None, coll_name="Props", with_glow=True):
    """灯笼：金属灯框（4 根细柱）+ 大号暖光立方体（让光溢出可见）。"""
    if mats is None:
        mats = make_all_mats()
    c = coll(coll_name)
    x, y, z = loc
    # 杆
    post = add_cyl("LanternPost", verts=8, r=0.025, depth=1.0,
                   loc=(x, y, z + 0.5), mat=mats["metal_dark"])
    link(post, c)
    # 灯笼外框：仅 4 根细柱 + 上下两片薄板（让中间的发光立方体可见）
    top_plate = add_box("LanternTop", size=(0.22, 0.22, 0.03),
                        loc=(x, y, z + 1.18), mat=mats["metal_dark"])
    link(top_plate, c)
    bot_plate = add_box("LanternBot", size=(0.22, 0.22, 0.03),
                        loc=(x, y, z + 0.92), mat=mats["metal_dark"])
    link(bot_plate, c)
    for sx, sy in [(-0.10, 0), (0.10, 0), (0, -0.10), (0, 0.10)]:
        leg = add_box(f"LanternLeg_{sx}_{sy}", size=(0.02, 0.02, 0.26),
                      loc=(x + sx, y + sy, z + 1.05), mat=mats["metal_dark"])
        link(leg, c)
    # 顶部尖帽
    cap = add_cone("LanternCap", verts=4, r1=0.14, r2=0, depth=0.10,
                   loc=(x, y, z + 1.24), mat=mats["metal_dark"])
    link(cap, c)
    # 蜡烛/灯芯（细竖杆）
    wick = add_cyl("LanternWick", verts=6, r=0.02, depth=0.20,
                   loc=(x, y, z + 1.05), mat=mats["metal_dark"])
    link(wick, c)
    if with_glow:
        glow = add_box("LanternGlow", size=(0.18, 0.18, 0.22),
                       loc=(x, y, z + 1.05),
                       mat=mats["lantern"])
        link(glow, c)


def make_firewood_stack(loc, mats=None, coll_name="Props"):
    """小柴火堆：6 根圆木交错。"""
    if mats is None:
        mats = make_all_mats()
    c = coll(coll_name)
    x, y, z = loc
    # 底层 3 根
    for i, off in enumerate([-0.10, 0.0, 0.10]):
        log = add_cyl(f"Log_B{i}", verts=8, r=0.045, depth=0.32,
                      loc=(x + off, y, z + 0.05),
                      rot=(math.pi / 2, 0, 0),
                      mat=mats["wood_warm"])
        link(log, c)
    # 上层 2 根（垂直底）
    for i, off in enumerate([-0.05, 0.05]):
        log = add_cyl(f"Log_T{i}", verts=8, r=0.045, depth=0.32,
                      loc=(x + off, y, z + 0.16),
                      rot=(0, 0, math.pi / 2),
                      mat=mats["wood_light"])
        link(log, c)
    # 顶上一根
    log = add_cyl("Log_Top", verts=8, r=0.045, depth=0.32,
                  loc=(x, y, z + 0.27),
                  rot=(math.pi / 2, 0, 0),
                  mat=mats["wood_warm"])
    link(log, c)