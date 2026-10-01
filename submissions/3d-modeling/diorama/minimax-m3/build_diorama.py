"""build_diorama.py — 冬日 diorama 主建造脚本。

设计：「冬日暮光小屋」
- 圆角方形深色木质底座 + 雪面
- 中心：一间独特的「六边形小屋」—— 六边棱柱主体 + 倾斜圆锥屋顶 +
         飘烟的石砌烟囱 + 凸出的飘窗 + 圆形舷窗 + 暖光窗户
- 院落：3-4 棵针叶松（雪顶）+ 踏脚石小径 + 一段木栅栏 +
         小冰湖 + 灯笼（暖光）+ 柴火垛 + 雪堆
- 黄昏蓝色暮光，暖光窗户/灯笼自发光 → 冷暖对比

调用: blender --background --factory-startup --python build_diorama.py -- <OUT_DIR>
OUT_DIR 默认 = 脚本同目录。
"""
import math
import os
import sys

import bpy

# 让脚本目录可被 import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import diorama_lib as dl  # noqa: E402

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT_DIR = argv[0] if argv else os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT_DIR, exist_ok=True)
OUT_BLEND = os.path.join(OUT_DIR, "diorama_winter.blend")
OUT_GLB = os.path.join(OUT_DIR, "diorama_winter.glb")

# ====================================================================
# 1) 重置场景 + 基础设置
# ====================================================================
dl.reset_scene()
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0

# World：黄昏冷蓝天空
world = bpy.data.worlds.new("World")
world.use_nodes = True
scene.world = world
nt = world.node_tree
bg = nt.nodes.get("Background") or nt.nodes.new("Background")
bg.inputs["Color"].default_value = (0.52, 0.66, 0.82, 1.0)
bg.inputs["Strength"].default_value = 0.7

# 视角默认相机/灯留着后面替换

mats = dl.make_all_mats()

# ====================================================================
# 2) 底座（圆角方形）+ 雪面
# ====================================================================
print("[1/6] 底座 …")
coll_base = dl.coll("Base")
coll_snow = dl.coll("SnowSurface")

base = dl.add_box("Base", size=(3.8, 3.8, 0.42), loc=(0, 0, 0),
                  mat=mats["wood_dark"], bevel_w=0.22)
dl.add_bevel(base, width=0.22, segments=6)  # 再次保险
dl.link(base, coll_base)

# 雪面 — 略凹陷，比底座稍小，叠加在底座顶面之上
snow_top = dl.add_box("SnowTop", size=(3.65, 3.65, 0.04),
                      loc=(0, 0, 0.235), mat=mats["snow"], bevel_w=0.06)
dl.link(snow_top, coll_snow)

# 底座侧面再叠一层"木刻纹"窄条（深浅两色），增加层次
trim = dl.add_box("BaseTrim", size=(3.85, 3.85, 0.06),
                  loc=(0, 0, -0.05), mat=mats["wood_warm"], bevel_w=0.20)
dl.link(trim, coll_base)

# ====================================================================
# 3) 小屋（核心）
# ====================================================================
print("[2/6] 小屋 …")
coll_cabin = dl.coll("Cabin")

# ---- 主体：六边形棱柱（微旋转一点避免棱正对镜头）----
# 六边形的"宽"用 radius=1.0 表示；实际直径约 2.0
body = dl.add_cyl("CabinBody", verts=6, r=1.05, depth=1.7,
                  loc=(0, 0, 0.235 + 0.85),
                  rot=(0, 0, math.radians(20)),
                  mat=mats["wood_warm"])
# 给六边形棱柱加 bevel 让棱角柔和
dl.add_bevel(body, width=0.04, segments=3)
dl.link(body, coll_cabin)

# ---- 木板纹（在 6 个面上叠一条条竖向窄条模拟壁板）----
# 每面 4 条窄板，绕一圈。直接从顶视算角度。
sides = 6
rot0 = math.radians(20)
for i in range(sides):
    a = rot0 + (i + 0.5) * (2 * math.pi / sides)  # 每面中心角
    face_normal_dist = 1.05 * math.cos(math.pi / sides)  # 中心到面
    cx = math.cos(a) * face_normal_dist
    cy = math.sin(a) * face_normal_dist
    # 3 条窄竖板
    for j, off in enumerate([-0.30, 0.0, 0.30]):
        # 沿切线方向偏移
        tx = math.cos(a + math.pi / 2) * off
        ty = math.sin(a + math.pi / 2) * off
        plank = dl.add_box(f"Plank_{i}_{j}",
                           size=(0.16, 0.03, 1.55),
                           loc=(cx + tx, cy + ty, 0.235 + 0.85),
                           rot=(0, 0, a),
                           mat=mats["wood_dark"])
        dl.link(plank, coll_cabin)

# ---- 屋顶：倾斜的圆锥（带 8 段平滑），白雪覆盖 ----
roof = dl.add_cone("CabinRoof", verts=12, r1=1.45, r2=0.0, depth=1.55,
                   loc=(0, 0, 0.235 + 1.70 + 0.10),
                   rot=(math.radians(7), 0, math.radians(20) + math.radians(-15)),
                   mat=mats["roof"])
dl.add_bevel(roof, width=0.05, segments=4)
dl.link(roof, coll_cabin)

# 屋顶的雪顶：稍大的同形白锥，与红色屋顶轻微错开形成"挂雪"
roof_snow = dl.add_cone("RoofSnow", verts=12, r1=1.20, r2=0.0, depth=1.30,
                        loc=(0.05, -0.04, 0.235 + 1.70 + 0.30),
                        rot=(math.radians(7), 0, math.radians(20) + math.radians(-15)),
                        mat=mats["roof_snow"])
dl.add_bevel(roof_snow, width=0.04, segments=4)
dl.link(roof_snow, coll_cabin)

# 屋顶飘雪（几个小雪球悬挂在屋檐）
for i in range(7):
    a = math.radians(20) + i * (2 * math.pi / 7)
    r = 1.30
    dx = math.cos(a) * r
    dy = math.sin(a) * r
    cap = dl.add_sphere(f"RoofCap_{i}", r=0.10,
                         loc=(dx, dy, 0.235 + 1.70 + 0.05),
                         scale=(1.3, 0.6, 0.5),
                         mat=mats["snow"])
    dl.link(cap, coll_cabin)

# ---- 飘窗（凸出的多面体小房间）----
# 放在前向，朝向 +Y
bay_base = dl.add_box("BayBase", size=(0.85, 0.45, 0.85),
                      loc=(0, 1.45, 0.235 + 0.45),
                      rot=(0, 0, math.radians(15)),
                      mat=mats["wood_light"])
dl.add_bevel(bay_base, width=0.03, segments=3)
dl.link(bay_base, coll_cabin)

# 飘窗的屋顶（小斜板）
bay_roof = dl.add_cone("BayRoof", verts=4, r1=0.55, r2=0.0, depth=0.25,
                       loc=(0.05, 1.45, 0.235 + 0.95),
                       rot=(math.radians(15), 0, math.radians(15) + math.radians(45)),
                       mat=mats["roof"])
dl.link(bay_roof, coll_cabin)
# 飘窗顶雪
bay_snow = dl.add_cone("BayRoofSnow", verts=4, r1=0.40, r2=0.0, depth=0.18,
                       loc=(0.10, 1.42, 0.235 + 1.05),
                       rot=(math.radians(15), 0, math.radians(15) + math.radians(45)),
                       mat=mats["snow"])
dl.link(bay_snow, coll_cabin)

# 飘窗的大玻璃（暖光窗） — 3 块，窗框靠后让玻璃凸出可见
for j, xx in enumerate([-0.22, 0.0, 0.22]):
    pane = dl.add_box(f"BayPane_{j}", size=(0.22, 0.04, 0.42),
                      loc=(xx, 1.72, 0.235 + 0.45),
                      rot=(0, 0, math.radians(15)),
                      mat=mats["window_glow"])
    dl.link(pane, coll_cabin)
    # 窗框（缩到玻璃四边外圈，不盖住玻璃）
    frame = dl.add_box(f"BayFrame_{j}", size=(0.26, 0.03, 0.46),
                       loc=(xx, 1.69, 0.235 + 0.45),
                       rot=(0, 0, math.radians(15)),
                       mat=mats["wood_dark"])
    dl.link(frame, coll_cabin)

# ---- 主门（在背向，留给相机看到的那一面不挡视线）----
# 朝 -Y 的面；门口放在主门旁边的角度上
door_angle = math.radians(20) + 3.5 * (2 * math.pi / 6)  # 绕到一侧
door_x = math.cos(door_angle) * 1.06
door_y = math.sin(door_angle) * 1.06
door = dl.add_box("Door", size=(0.36, 0.05, 0.62),
                  loc=(door_x, door_y, 0.235 + 0.31),
                  rot=(0, 0, door_angle + math.pi / 2),
                  mat=mats["wood_dark"])
dl.link(door, coll_cabin)
# 门把（小铜点）
handle = dl.add_sphere("DoorHandle", r=0.025,
                       loc=(door_x + math.cos(door_angle) * 0.16,
                            door_y + math.sin(door_angle) * 0.16,
                            0.235 + 0.30),
                       mat=mats["metal_dark"])
dl.link(handle, coll_cabin)

# ---- 圆形舷窗（向 +X 那一面）----
porthole_angle = math.radians(20) - 1.0 * (2 * math.pi / 6)
porthole_x = math.cos(porthole_angle) * 1.07
porthole_y = math.sin(porthole_angle) * 1.07
# 玻璃（更靠外）
glass = dl.add_cyl("PortholeGlass", verts=24, r=0.20, depth=0.03,
                   loc=(porthole_x + math.cos(porthole_angle) * 0.03,
                        porthole_y + math.sin(porthole_angle) * 0.03,
                        0.235 + 0.85),
                   rot=(math.pi / 2, 0, porthole_angle + math.pi / 2),
                   mat=mats["window_glow"])
dl.link(glass, coll_cabin)
# 金属圈（缩窄一点让玻璃露出）
ring = dl.add_cyl("PortholeRing", verts=24, r=0.22, depth=0.04,
                  loc=(porthole_x, porthole_y, 0.235 + 0.85),
                  rot=(math.pi / 2, 0, porthole_angle + math.pi / 2),
                  mat=mats["metal_dark"])
dl.link(ring, coll_cabin)

# ---- 二楼小窗（屋顶下沿开的小三角窗）----
triwin = dl.add_box("TriWindow", size=(0.18, 0.04, 0.30),
                    loc=(-0.30, -0.85, 0.235 + 1.30),
                    rot=(0, 0, math.radians(-5)),
                    mat=mats["window_glow"])
dl.link(triwin, coll_cabin)
# 窗框（细窄一圈）
triwin_frame = dl.add_box("TriWindowFrame", size=(0.21, 0.05, 0.33),
                          loc=(-0.30, -0.87, 0.235 + 1.30),
                          rot=(0, 0, math.radians(-5)),
                          mat=mats["wood_dark"])
dl.link(triwin_frame, coll_cabin)

# ---- 石砌烟囱（粗短高）----
chim_x, chim_y = 0.78, 0.55  # 屋顶右后方
# 主体
chim = dl.add_cyl("Chimney", verts=10, r=0.20, depth=1.10,
                  loc=(chim_x, chim_y, 0.235 + 1.70 + 0.80),
                  mat=mats["stone"])
dl.add_bevel(chim, width=0.02, segments=3)
dl.link(chim, coll_cabin)
# 帽沿
chim_cap = dl.add_cyl("ChimneyCap", verts=10, r=0.27, depth=0.08,
                      loc=(chim_x, chim_y, 0.235 + 1.70 + 1.42),
                      mat=mats["stone_dark"])
dl.link(chim_cap, coll_cabin)
# 烟囱边一圈小石头点缀
for i in range(5):
    a = math.radians(i * 60)
    bump = dl.add_sphere(f"ChimStone_{i}", r=0.04,
                         loc=(chim_x + math.cos(a) * 0.21,
                              chim_y + math.sin(a) * 0.21,
                              0.235 + 1.70 + 1.46),
                         scale=(1, 1, 0.6),
                         mat=mats["stone"])
    dl.link(bump, coll_cabin)

# ---- 烟雾：从烟囱顶部向上飘 ----
dl.make_smoke_trail(start=(chim_x, chim_y, 0.235 + 1.70 + 1.55),
                    n=10, mats=mats, drift=(0.30, -0.08))

# ---- 月亮：一颗远处的高亮球，融进暮色 ----
moon = dl.add_sphere("Moon", r=0.30,
                     loc=(3.5, -4.0, 4.5),
                     scale=(1.0, 1.0, 1.0),
                     mat=mats["snow"])
# 给月亮一点微微发光的暖白
moon_mat = dl.make_mat("Mat_Moon", (0.95, 0.92, 0.85), rough=0.6,
                       emission=(0.95, 0.90, 0.78), emission_strength=3.5)
dl.assign_mat(moon, moon_mat)
dl.link(moon, dl.coll("Props"))

# ---- 冰挂：沿屋檐一圈朝下的小锥 ----
for i in range(0, 360, 30):
    a = math.radians(i) + math.radians(20)
    r = 1.42
    dx = math.cos(a) * r
    dy = math.sin(a) * r
    icicle = dl.add_cone(f"Icicle_{i}", verts=6, r1=0.04, r2=0.0, depth=0.18,
                         loc=(dx, dy, 1.32),
                         rot=(math.pi, 0, math.radians(20) + math.radians(-15)),
                         mat=mats["ice"])
    dl.link(icicle, coll_cabin)

# ---- 小屋底座石阶 ----
for i, off in enumerate([-0.18, 0.18]):
    step = dl.add_box(f"Step_{i}", size=(0.40, 0.18, 0.04),
                      loc=(door_x + math.cos(door_angle) * 0.30 + off * 0.2,
                           door_y + math.sin(door_angle) * 0.30 + off * 0.2,
                           0.235 + 0.02),
                      rot=(0, 0, door_angle + math.pi / 2),
                      mat=mats["stone"])
    dl.link(step, coll_cabin)

# ====================================================================
# 4) 院落：树 / 小径 / 栅栏 / 冰湖 / 灯笼 / 柴火 / 雪堆
# ====================================================================
print("[3/6] 院落 …")
coll_yard = dl.coll("Yard")

# ---- 针叶松 — 4 棵，远近错落（避开门/灯笼方向） ----
trees = [
    # (x, y, z_base, scale)
    (-1.85,  1.55, 0.235, 1.25),
    (-2.05,  0.80, 0.235, 0.90),
    (-1.85, -0.30, 0.235, 1.05),
    ( 1.95,  1.55, 0.235, 1.20),
    ( 2.05,  0.40, 0.235, 1.00),
    ( 1.65, -1.60, 0.235, 0.95),
    (-1.65, -1.55, 0.235, 1.10),
]
for p in trees:
    dl.make_tree(p, mats=mats, coll_name="Trees")

# ---- 踏脚石小径 —— 从门的位置朝镜头方向（+Y）走向雪地 ----
dl.make_stone_path(start_xy=(door_x * 0.55, door_y * 0.55 + 0.40),
                   end_xy=(0, 1.95),
                   z=0.235, n=7, mats=mats)

# ---- 木栅栏 — 在左后侧围一段 ----
dl.make_fence(start=(-2.50, -1.80), end=(-2.50, -0.55),
              z=0.235, n=8, mats=mats)

# ---- 小冰湖 —— 在右侧前部 ----
ice = dl.add_cyl("Pond", verts=20, r=0.55, depth=0.05,
                 loc=(1.45, -0.55, 0.235),
                 scale=(1.0, 0.85, 1.0),
                 mat=mats["ice"])
dl.add_bevel(ice, width=0.02, segments=3)
dl.link(ice, coll_yard)

# 冰湖边缘的雪
for a_deg in [10, 90, 170, 250]:
    a = math.radians(a_deg)
    dx = math.cos(a) * 0.55
    dy = math.sin(a) * 0.55
    bump = dl.add_sphere(f"PondSnow_{a_deg}", r=0.08,
                         loc=(1.45 + dx * 0.95, -0.55 + dy * 0.95, 0.245),
                         scale=(1.4, 1.0, 0.6),
                         mat=mats["snow"])
    dl.link(bump, coll_yard)

# ---- 灯笼 —— 放在小径起点附近 ----
dl.make_lantern(loc=(0.05, 1.85, 0.235), mats=mats)

# ---- 柴火垛 —— 小屋另一侧 ----
dl.make_firewood_stack(loc=(-0.95, 1.50, 0.235), mats=mats)

# ---- 几个雪堆，沿小屋基座四周散落 ----
dl.make_snowdrift(loc=(-1.25, 0.0, 0.235), radius=0.35, mats=mats, seed=1)
dl.make_snowdrift(loc=(1.20, 0.95, 0.235), radius=0.30, mats=mats, seed=2)
dl.make_snowdrift(loc=(0.85, -1.30, 0.235), radius=0.40, mats=mats, seed=3)
dl.make_snowdrift(loc=(-0.65, -1.50, 0.235), radius=0.32, mats=mats, seed=4)

# ---- 小屋基座一圈"堆雪"（防融雪痕迹）----
for a_deg in range(0, 360, 30):
    a = math.radians(a_deg)
    r = 1.15
    bump = dl.add_sphere(f"SnowRing_{a_deg}", r=0.10,
                         loc=(math.cos(a) * r, math.sin(a) * r, 0.235),
                         scale=(1.5, 1.0, 0.7),
                         mat=mats["snow"])
    dl.link(bump, coll_yard)

# ---- 一些零星飘落的雪（小颗粒）----
import random as _r
_r.seed(11)
for i in range(35):
    a = _r.uniform(0, 2 * math.pi)
    rr = _r.uniform(1.5, 2.6)
    zz = _r.uniform(0.6, 2.8)
    flake = dl.add_sphere(f"Snow_{i}", r=0.04,
                          loc=(math.cos(a) * rr, math.sin(a) * rr, zz),
                          mat=mats["snow"])
    dl.link(flake, coll_yard)

# ====================================================================
# 5) 保存 .blend + 导出 .glb
# ====================================================================
print("[4/6] 保存 …")

# 默认相机（后续渲染脚本会覆盖）
cam = bpy.data.objects.new("DefaultCam", bpy.data.cameras.new("DefaultCam"))
bpy.context.collection.objects.link(cam)
cam.location = (4.0, -4.0, 3.0)
cam.rotation_euler = (math.radians(60), 0, math.radians(45))
bpy.context.scene.camera = cam

# 默认 sun
sun = bpy.data.objects.new("DefaultSun", bpy.data.lights.new("DefaultSun", type="SUN"))
bpy.context.collection.objects.link(sun)
sun.data.energy = 2.5
sun.rotation_euler = (math.radians(45), math.radians(15), math.radians(30))

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
print(f"  blend: {OUT_BLEND}")

bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format="GLB", export_apply=True)
print(f"  glb:   {OUT_GLB}")

print("[DONE] 物体数:", len(bpy.data.objects))