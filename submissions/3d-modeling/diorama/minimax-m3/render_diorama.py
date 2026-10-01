"""render_diorama.py — 给冬日 diorama 出渲染图。

开 .blend → 配置 Eevee Next + 合成器 Glare（bloom）→ 多角度相机 → 出图 + 拼图。

调用: blender --background --factory-startup --python render_diorama.py -- <BLEND> [OUT_DIR]
默认 BLEND = 同目录 diorama_winter.blend，OUT_DIR = 同目录 renders/。
"""
import math
import os
import sys
import mathutils
import bpy

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
BLEND = argv[0] if argv else os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                          "diorama_winter.blend")
OUT_DIR = argv[1] if len(argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders")
os.makedirs(OUT_DIR, exist_ok=True)

# ---------------- 打开 .blend（默认会用它当前的场景，导入是多余的） ----------------
bpy.ops.wm.open_mainfile(filepath=BLEND)

# ---------------- 删除默认相机和默认灯，重新摆 ----------------
for o in list(bpy.data.objects):
    if o.type in ("CAMERA", "LIGHT") and o.name.startswith(("Default", "Cam", "Sun")):
        bpy.data.objects.remove(o, do_unlink=True)

scene = bpy.context.scene

# ---------------- 渲染设置：Eevee Next + bloom 合成 ----------------
scene.render.engine = "BLENDER_EEVEE_NEXT"
scene.render.resolution_x = 1280
scene.render.resolution_y = 1280
scene.render.film_transparent = False
scene.eevee.taa_render_samples = 64
# 4.x 没有 use_bloom，bloom 走合成器 Glare 节点
scene.eevee.use_gtao = True
scene.eevee.gtao_distance = 0.2
scene.eevee.use_shadows = True
scene.eevee.shadow_ray_count = 8

# View Transform：Filmic + Medium Contrast（保留中间调）
scene.view_settings.view_transform = "Filmic"
scene.view_settings.look = "Medium Contrast"
scene.view_settings.exposure = 1.0
scene.view_settings.gamma = 1.0

# 色彩管理：sRGB 输出
scene.display_settings.display_device = "sRGB"

# ---------------- 合成器：RenderLayer → Glare (FogGlow) → Composite ----------------
scene.use_nodes = True
nt = scene.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)

rl = nt.nodes.new("CompositorNodeRLayers")
glare = nt.nodes.new("CompositorNodeGlare")
glare.glare_type = "FOG_GLOW"
glare.quality = "HIGH"
glare.size = 7
glare.threshold = 0.85
glare.mix = 0.9
composite = nt.nodes.new("CompositorNodeComposite")
viewer = nt.nodes.new("CompositorNodeViewer")

nt.links.new(rl.outputs["Image"], glare.inputs["Image"])
nt.links.new(glare.outputs["Image"], composite.inputs["Image"])
nt.links.new(glare.outputs["Image"], viewer.inputs["Image"])

# ---------------- World：深邃的暮色蓝紫（提供强 IBL 但天色深沉） ----------------
world = scene.world
if world and world.use_nodes:
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Strength"].default_value = 1.3
        bg.inputs["Color"].default_value = (0.32, 0.40, 0.62, 1.0)  # 深暮色蓝紫

# ---------------- 灯光：太阳 + 冷补 + 暖窗光 + 灯笼点光 ----------------
def add_light(name, type_, loc, energy, color, rot=None):
    obj = bpy.data.objects.new(name, bpy.data.lights.new(name, type=type_))
    scene.collection.objects.link(obj)
    obj.location = loc
    obj.data.energy = energy
    obj.data.color = color
    if rot is not None:
        obj.rotation_euler = rot
    return obj

# 主光：低角度暖太阳（金时刻黄昏），从相机斜对侧照亮小屋可见面
add_light("Sun_Main", "SUN",
          loc=(5.0, -5.0, 3.0),
          energy=4.5,
          color=(1.00, 0.78, 0.48),
          rot=(math.radians(60), 0, math.radians(-135)))

# 天空补光：冷蓝高角度（弱一些当环境）
add_light("Sky_Fill", "SUN",
          loc=(0, 0, 8),
          energy=1.2,
          color=(0.55, 0.72, 0.95),
          rot=(0, 0, 0))  # 直射向下当 ambient

# 窗户处点光（强化暖光洒在雪面的效果）
add_light("Window_Point", "POINT",
          loc=(0.0, 1.7, 1.2),
          energy=22.0,
          color=(1.00, 0.72, 0.40))

# 灯笼处点光（让灯罩附近更亮、雪地染上暖光）
add_light("Lantern_Point", "POINT",
          loc=(0.05, 1.85, 1.6),
          energy=20.0,
          color=(1.00, 0.66, 0.28))

# ---------------- 相机 ----------------
cam_data = bpy.data.cameras.new("RenderCam")
cam_data.lens = 35
cam_data.clip_end = 50
cam = bpy.data.objects.new("RenderCam", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam


def point_cam(az_deg, elev_deg, target=(0, 0, 0.6), dist=6.5):
    """绕 target 的球坐标摆相机。"""
    a = math.radians(az_deg)
    e = math.radians(elev_deg)
    x = target[0] + dist * math.cos(e) * math.cos(a)
    y = target[1] + dist * math.cos(e) * math.sin(a)
    z = target[2] + dist * math.sin(e)
    cam.location = (x, y, z)
    direction = mathutils.Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


# ---------------- 包围盒用于取景 ----------------
min_v = [float("inf")] * 3
max_v = [float("-inf")] * 3
for obj in bpy.data.objects:
    if obj.type == "MESH":
        for corner in obj.bound_box:
            wc = obj.matrix_world @ mathutils.Vector(corner)
            for k in range(3):
                min_v[k] = min(min_v[k], wc[k])
                max_v[k] = max(max_v[k], wc[k])
center = mathutils.Vector([(min_v[k] + max_v[k]) / 2 for k in range(3)])
size = max(max_v[k] - min_v[k] for k in range(3))
print(f"[INFO] bbox center={center} size={size}")

# ---------------- 视图预设 ----------------
VIEWS = [
    ("hero",     55, 14),   # 主视角：低角度戏剧
    ("front",    90, 12),
    ("side",    315, 12),
    ("topish",   55, 38),
    ("back",      0, 14),
    ("low",      55,  5),   # 低角度
]


def render_one(name, az, elev):
    point_cam(az, elev, target=center, dist=size * 1.8)
    path = os.path.join(OUT_DIR, f"render_{name}.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"RENDER_OK: {path} ({name})")
    return path


# 单独出一张主图（高清 1920）
def render_hero():
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1920
    scene.eevee.taa_render_samples = 128   # 主图提高采样
    p = render_one("hero", 55, 14)
    scene.eevee.taa_render_samples = 64
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 1280
    return p


paths = [render_hero()]
for name, az, elev in VIEWS[1:]:
    paths.append(render_one(name, az, elev))

# ---------------- 拼图（缩到 640px 每格以便一次性 read） ----------------
import numpy as np

TARGET_TILE = 640

tiles = []
for p in paths:
    img = bpy.data.images.load(p)
    w, h = img.size
    buf = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    t = buf.reshape(h, w, 4)
    # 缩到 TARGET_TILE（用 np 简单线性缩放，headless Blender 无 PIL）
    sx = TARGET_TILE / w
    sy = TARGET_TILE / h
    new_w = TARGET_TILE
    new_h = TARGET_TILE
    # numpy 不直接支持 resize，用切片近似（每行/每列采样）
    rs_idx = (np.arange(new_h) * h / new_h).astype(int)
    cs_idx = (np.arange(new_w) * w / new_w).astype(int)
    t = t[rs_idx][:, cs_idx]
    tiles.append(t)
    bpy.data.images.remove(img)

h, w = tiles[0].shape[0], tiles[0].shape[1]

n = len(tiles)
cols = 2
rows = math.ceil(n / cols)
gutter = 8
h, w = tiles[0].shape[0], tiles[0].shape[1]
bg = tiles[0][0, 0].copy()
bg[3] = 1.0
gut = np.array([0.45, 0.45, 0.45, 1.0], dtype=np.float32)
H = rows * h + (rows - 1) * gutter
W = cols * w + (cols - 1) * gutter
sheet = np.tile(gut, (H, W, 1)).astype(np.float32)
for idx in range(rows * cols):
    r, c = divmod(idx, cols)
    rr = rows - 1 - r
    y0 = rr * (h + gutter)
    x0 = c * (w + gutter)
    sheet[y0:y0 + h, x0:x0 + w, :] = tiles[idx] if idx < n else bg
sheet[..., 3] = 1.0
out = bpy.data.images.new("sheet", width=W, height=H, alpha=True)
out.colorspace_settings.name = "sRGB"
out.pixels.foreach_set(np.ascontiguousarray(sheet).reshape(-1))
sheet_path = os.path.join(OUT_DIR, "sheet.png")
out.filepath_raw = sheet_path
out.file_format = "PNG"
out.save()
bpy.data.images.remove(out)
print(f"SHEET_OK: {sheet_path} cols={cols} rows={rows} order={','.join(p.split('_')[-1].split('.')[0] for p in paths)}")