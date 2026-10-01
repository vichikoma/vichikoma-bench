"""Winter Diorama: Mushroom Cottage Scene
A whimsical mushroom-shaped cottage on a rounded square base with a winter courtyard.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
blend_path = argv[0]   # .blend output
glb_path   = argv[1]   # .glb output

# ── Reset ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0

# ── Helper functions ───────────────────────────────────────────────────
def new_mat(name, color, roughness=0.5, metallic=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if metallic > 0:
        bsdf.inputs["Metallic"].default_value = metallic
    if alpha < 1.0:
        mat.blend_method = 'BLEND' if hasattr(mat, 'blend_method') else None
        bsdf.inputs["Alpha"].default_value = alpha
    return mat

def assign_mat(obj, mat):
    obj.data.materials.append(mat)

def add_rounded_cube(name, size, radius=0.02, location=(0,0,0), mat=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (size[0], size[1], size[2])
    bpy.ops.object.transform_apply(scale=True)
    bev = obj.modifiers.new("Bevel", 'BEVEL')
    bev.width = min(radius, min(size)*0.4)
    bev.segments = 4
    bev.profile = 0.7
    bpy.ops.object.modifier_apply(modifier="Bevel")
    if mat:
        assign_mat(obj, mat)
    return obj

# ── Materials ──────────────────────────────────────────────────────────
# Base
mat_base        = new_mat("Base",       (0.75, 0.72, 0.68), roughness=0.6)
mat_base_edge   = new_mat("BaseEdge",   (0.55, 0.50, 0.45), roughness=0.7)
# Snow
mat_snow        = new_mat("Snow",       (0.95, 0.96, 0.98), roughness=0.35)
mat_snow_soft   = new_mat("SnowSoft",   (0.92, 0.94, 0.97), roughness=0.25)
# House - mushroom stem
mat_stem        = new_mat("Stem",       (0.92, 0.88, 0.82), roughness=0.65)
# House - mushroom cap roof
mat_cap         = new_mat("Cap",        (0.78, 0.22, 0.25), roughness=0.45)
mat_cap_white   = new_mat("CapWhite",   (0.95, 0.94, 0.92), roughness=0.4)
# Door & window
mat_door        = new_mat("Door",       (0.35, 0.22, 0.12), roughness=0.7)
mat_window      = new_mat("Window",     (0.95, 0.85, 0.40), roughness=0.15, metallic=0.1)
mat_window_frame= new_mat("WinFrame",   (0.45, 0.35, 0.25), roughness=0.6)
# Chimney
mat_chimney     = new_mat("Chimney",    (0.45, 0.42, 0.40), roughness=0.75)
mat_smoke       = new_mat("Smoke",      (0.85, 0.85, 0.87), roughness=0.9)
# Trees
mat_trunk       = new_mat("Trunk",      (0.35, 0.22, 0.12), roughness=0.8)
mat_pine        = new_mat("Pine",       (0.15, 0.32, 0.15), roughness=0.7)
mat_pine_snow   = new_mat("PineSnow",   (0.60, 0.72, 0.60), roughness=0.45)
# Fence
mat_fence       = new_mat("Fence",      (0.50, 0.38, 0.25), roughness=0.7)
# Pond
mat_pond        = new_mat("Pond",       (0.45, 0.62, 0.72), roughness=0.08, metallic=0.15)
mat_pond_edge   = new_mat("PondEdge",   (0.60, 0.58, 0.55), roughness=0.7)
# Snowman
mat_snowman     = new_mat("Snowman",    (0.97, 0.97, 0.99), roughness=0.3)
mat_carrot      = new_mat("Carrot",     (0.90, 0.45, 0.10), roughness=0.6)
mat_coal        = new_mat("Coal",       (0.08, 0.08, 0.08), roughness=0.9)
mat_scarf       = new_mat("Scarf",      (0.80, 0.15, 0.15), roughness=0.6)
# Path stones
mat_stone       = new_mat("Stone",      (0.55, 0.52, 0.48), roughness=0.75)
# Mailbox
mat_mailbox     = new_mat("Mailbox",    (0.20, 0.35, 0.60), roughness=0.5)
mat_mailbox_post= new_mat("MBPost",     (0.45, 0.35, 0.25), roughness=0.7)
# Lantern
mat_lantern     = new_mat("Lantern",    (0.30, 0.30, 0.30), roughness=0.4, metallic=0.6)
mat_lantern_glow= new_mat("LanternGlow",(0.98, 0.85, 0.40), roughness=0.1)

# ══════════════════════════════════════════════════════════════════════
# 1. BASE PLATFORM — rounded square with layered design
# ══════════════════════════════════════════════════════════════════════
# Bottom layer (darker edge)
base_bottom = add_rounded_cube("BaseBottom", (3.2, 3.2, 0.12), radius=0.3,
                               location=(0, 0, -0.06), mat=mat_base_edge)
# Top layer
base_top = add_rounded_cube("BaseTop", (3.0, 3.0, 0.08), radius=0.28,
                            location=(0, 0, 0.04), mat=mat_base)

# ══════════════════════════════════════════════════════════════════════
# 2. SNOW GROUND — slightly bumpy snow layer on base
# ══════════════════════════════════════════════════════════════════════
snow_ground = add_rounded_cube("SnowGround", (2.9, 2.9, 0.06), radius=0.25,
                               location=(0, 0, 0.09), mat=mat_snow)

# ══════════════════════════════════════════════════════════════════════
# 3. MUSHROOM HOUSE
# ══════════════════════════════════════════════════════════════════════
# --- Stem (cylinder, slightly tapered) ---
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=0.42, radius2=0.38,
                                 depth=0.85, location=(-0.3, 0.3, 0.52))
stem = bpy.context.active_object
stem.name = "MushroomStem"
assign_mat(stem, mat_stem)

# --- Cap (flattened sphere with snow on top) ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16,
                                      radius=0.70, location=(-0.3, 0.3, 1.10))
cap = bpy.context.active_object
cap.name = "MushroomCap"
cap.scale = (1.0, 1.0, 0.50)
bpy.ops.object.transform_apply(scale=True)
# Move top vertices up slightly for mushroom shape
bm = bmesh.new()
bm.from_mesh(cap.data)
bm.verts.ensure_lookup_table()
for v in bm.verts:
    if v.co.z > 0.05:
        v.co.z *= 1.15
bm.to_mesh(cap.data)
bm.free()
cap.data.update()
assign_mat(cap, mat_cap)

# --- Snow on cap ---
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12,
                                      radius=0.62, location=(-0.3, 0.3, 1.25))
cap_snow = bpy.context.active_object
cap_snow.name = "CapSnow"
cap_snow.scale = (1.0, 1.0, 0.30)
bpy.ops.object.transform_apply(scale=True)
# Flatten bottom
bm = bmesh.new()
bm.from_mesh(cap_snow.data)
bm.verts.ensure_lookup_table()
for v in bm.verts:
    if v.co.z < -0.05:
        v.co.z = -0.05
bm.to_mesh(cap_snow.data)
bm.free()
cap_snow.data.update()
assign_mat(cap_snow, mat_snow)

# --- Door (round!) ---
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.14, depth=0.04,
                                     location=(-0.3, -0.10, 0.42),
                                     rotation=(math.radians(90), 0, 0))
door = bpy.context.active_object
door.name = "Door"
assign_mat(door, mat_door)

# Door frame ring
bpy.ops.mesh.primitive_torus_add(major_radius=0.16, minor_radius=0.02,
                                  major_segments=24, minor_segments=8,
                                  location=(-0.3, -0.11, 0.42),
                                  rotation=(math.radians(90), 0, 0))
door_frame = bpy.context.active_object
door_frame.name = "DoorFrame"
assign_mat(door_frame, mat_window_frame)

# --- Round window (left side) ---
bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.10, depth=0.04,
                                     location=(-0.70, 0.3, 0.65),
                                     rotation=(0, math.radians(90), 0))
window_obj = bpy.context.active_object
window_obj.name = "Window"
assign_mat(window_obj, mat_window)

# Window frame
bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.015,
                                  major_segments=20, minor_segments=8,
                                  location=(-0.71, 0.3, 0.65),
                                  rotation=(0, math.radians(90), 0))
win_frame = bpy.context.active_object
win_frame.name = "WindowFrame"
assign_mat(win_frame, mat_window_frame)

# Window cross bars
for angle in [0, math.radians(90)]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.70, 0.3, 0.65))
    bar = bpy.context.active_object
    bar.scale = (0.01, 0.005, 0.09)
    bar.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    assign_mat(bar, mat_window_frame)

# --- Chimney (stone, on the side of cap) ---
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.10, 0.55, 1.25))
chimney = bpy.context.active_object
chimney.name = "Chimney"
chimney.scale = (0.10, 0.10, 0.22)
bpy.ops.object.transform_apply(scale=True)
assign_mat(chimney, mat_chimney)

# Chimney snow cap
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.10, 0.55, 1.48))
chimney_snow = bpy.context.active_object
chimney_snow.name = "ChimneySnow"
chimney_snow.scale = (0.13, 0.13, 0.03)
bpy.ops.object.transform_apply(scale=True)
assign_mat(chimney_snow, mat_snow)

# Smoke puffs
for i, (sz, h) in enumerate([(0.05, 1.56), (0.07, 1.66), (0.055, 1.75)]):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=sz,
        location=(-0.10 + i*0.02, 0.55 + i*0.01, h))
    puff = bpy.context.active_object
    puff.name = f"Smoke{i}"
    assign_mat(puff, mat_smoke)

# --- Small awning over door ---
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.3, -0.22, 0.55))
awning = bpy.context.active_object
awning.name = "Awning"
awning.scale = (0.25, 0.08, 0.02)
bpy.ops.object.transform_apply(scale=True)
awning.rotation_euler = (math.radians(-15), 0, 0)
assign_mat(awning, mat_cap)

# Awning snow
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.3, -0.22, 0.575))
awning_snow = bpy.context.active_object
awning_snow.name = "AwningSnow"
awning_snow.scale = (0.26, 0.09, 0.015)
bpy.ops.object.transform_apply(scale=True)
awning_snow.rotation_euler = (math.radians(-15), 0, 0)
assign_mat(awning_snow, mat_snow)

# ══════════════════════════════════════════════════════════════════════
# 4. PINE TREES
# ══════════════════════════════════════════════════════════════════════
def add_pine_tree(name, location, height=0.7, base_radius=0.20):
    """Create a layered pine tree with snow caps."""
    x, y, z_base = location
    # Trunk
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.03, depth=0.15,
                                         location=(x, y, z_base + 0.075))
    trunk = bpy.context.active_object
    trunk.name = name + "_Trunk"
    assign_mat(trunk, mat_trunk)

    # 3 cone layers
    for i, (r, h, zo) in enumerate([(base_radius, 0.30, 0.20),
                                     (base_radius*0.75, 0.25, 0.38),
                                     (base_radius*0.50, 0.20, 0.52)]):
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r, radius2=0.0,
                                         depth=h, location=(x, y, z_base + zo))
        layer = bpy.context.active_object
        layer.name = f"{name}_Layer{i}"
        assign_mat(layer, mat_pine)

        # Snow on each layer
        bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=r*0.85, radius2=0.0,
                                         depth=h*0.20, location=(x, y, z_base + zo + h*0.35))
        snow_cap = bpy.context.active_object
        snow_cap.name = f"{name}_Snow{i}"
        assign_mat(snow_cap, mat_pine_snow)

# Place trees
add_pine_tree("Tree1", (-1.0, 0.9, 0.12), height=0.8, base_radius=0.22)
add_pine_tree("Tree2", (0.9, 0.7, 0.12), height=0.6, base_radius=0.16)
add_pine_tree("Tree3", (-1.1, -0.5, 0.12), height=0.55, base_radius=0.14)
add_pine_tree("Tree4", (1.0, -0.3, 0.12), height=0.9, base_radius=0.24)
add_pine_tree("Tree5", (0.3, 1.1, 0.12), height=0.5, base_radius=0.13)

# ══════════════════════════════════════════════════════════════════════
# 5. FROZEN POND
# ══════════════════════════════════════════════════════════════════════
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.35, depth=0.02,
                                     location=(0.85, -0.75, 0.12))
pond = bpy.context.active_object
pond.name = "FrozenPond"
assign_mat(pond, mat_pond)

# Pond edge (raised ring)
bpy.ops.mesh.primitive_torus_add(major_radius=0.37, minor_radius=0.03,
                                  major_segments=32, minor_segments=8,
                                  location=(0.85, -0.75, 0.13))
pond_edge = bpy.context.active_object
pond_edge.name = "PondEdge"
assign_mat(pond_edge, mat_pond_edge)

# Ice crack lines (thin cubes on pond surface)
for angle, length in [(0, 0.25), (math.radians(60), 0.18), (math.radians(120), 0.22)]:
    bpy.ops.mesh.primitive_cube_add(size=1,
        location=(0.85, -0.75, 0.135))
    crack = bpy.context.active_object
    crack.scale = (length, 0.003, 0.001)
    crack.rotation_euler = (0, 0, angle)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    crack.data.materials.append(mat_snow_soft)

# ══════════════════════════════════════════════════════════════════════
# 6. SNOWMAN
# ══════════════════════════════════════════════════════════════════════
sm_x, sm_y, sm_z = 0.55, 0.95, 0.12
# Body spheres
for i, (r, zo) in enumerate([(0.10, 0.10), (0.07, 0.26), (0.05, 0.37)]):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r,
        location=(sm_x, sm_y, sm_z + zo))
    part = bpy.context.active_object
    part.name = f"Snowman_Body{i}"
    assign_mat(part, mat_snowman)

# Eyes (coal)
for dy in [-0.025, 0.025]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.008,
        location=(sm_x - 0.04, sm_y + dy, sm_z + 0.39))
    eye = bpy.context.active_object
    eye.name = "Snowman_Eye"
    assign_mat(eye, mat_coal)

# Nose (carrot)
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.012, radius2=0.0,
                                  depth=0.06, location=(sm_x - 0.06, sm_y, sm_z + 0.36),
                                  rotation=(0, math.radians(90), 0))
nose = bpy.context.active_object
nose.name = "Snowman_Nose"
assign_mat(nose, mat_carrot)

# Buttons
for zo in [0.22, 0.26, 0.30]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.006,
        location=(sm_x - 0.09, sm_y, sm_z + zo))
    btn = bpy.context.active_object
    btn.name = "Snowman_Button"
    assign_mat(btn, mat_coal)

# Scarf
bpy.ops.mesh.primitive_torus_add(major_radius=0.065, minor_radius=0.012,
                                  major_segments=16, minor_segments=6,
                                  location=(sm_x, sm_y, sm_z + 0.31),
                                  rotation=(math.radians(10), 0, 0))
scarf = bpy.context.active_object
scarf.name = "Snowman_Scarf"
assign_mat(scarf, mat_scarf)

# Hat (small top hat)
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.05, depth=0.008,
    location=(sm_x, sm_y, sm_z + 0.42))
hat_brim = bpy.context.active_object
hat_brim.name = "Hat_Brim"
assign_mat(hat_brim, mat_coal)

bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.035, depth=0.06,
    location=(sm_x, sm_y, sm_z + 0.455))
hat_top = bpy.context.active_object
hat_top.name = "Hat_Top"
assign_mat(hat_top, mat_coal)

# ══════════════════════════════════════════════════════════════════════
# 7. STONE PATH (stepping stones from door to edge)
# ══════════════════════════════════════════════════════════════════════
path_positions = [
    (-0.30, -0.28, 0.125),
    (-0.32, -0.45, 0.125),
    (-0.28, -0.62, 0.125),
    (-0.22, -0.78, 0.125),
    (-0.15, -0.92, 0.125),
    (-0.05, -1.05, 0.125),
]
for i, pos in enumerate(path_positions):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12,
        radius=0.06 + (0.01 if i % 2 == 0 else -0.005),
        depth=0.015, location=pos)
    stone = bpy.context.active_object
    stone.name = f"PathStone{i}"
    stone.rotation_euler = (0, 0, math.radians(i * 25))
    assign_mat(stone, mat_stone)

# ══════════════════════════════════════════════════════════════════════
# 8. SNOW FENCE (around back/sides)
# ══════════════════════════════════════════════════════════════════════
fence_angle_positions = []
for angle_deg in range(30, 340, 20):
    a = math.radians(angle_deg)
    r = 1.35
    fence_angle_positions.append((r * math.cos(a), r * math.sin(a), a))

for i, (fx, fy, fa) in enumerate(fence_angle_positions):
    # Post
    bpy.ops.mesh.primitive_cube_add(size=1, location=(fx, fy, 0.22))
    post = bpy.context.active_object
    post.name = f"FencePost{i}"
    post.scale = (0.02, 0.02, 0.10)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(post, mat_fence)
    # Snow on post
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.025,
        location=(fx, fy, 0.33))
    psnow = bpy.context.active_object
    psnow.name = f"FencePostSnow{i}"
    psnow.scale = (1.0, 1.0, 0.5)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(psnow, mat_snow)

# Horizontal rails between adjacent posts (every other pair)
for i in range(0, len(fence_angle_positions) - 1, 1):
    x1, y1, _ = fence_angle_positions[i]
    x2, y2, _ = fence_angle_positions[i + 1]
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    length = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
    angle = math.atan2(y2 - y1, x2 - x1)
    for h in [0.18, 0.26]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(mx, my, h))
        rail = bpy.context.active_object
        rail.name = f"Rail{i}_{h}"
        rail.scale = (length / 2, 0.008, 0.012)
        rail.rotation_euler = (0, 0, angle)
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        assign_mat(rail, mat_fence)

# ══════════════════════════════════════════════════════════════════════
# 9. MAILBOX
# ══════════════════════════════════════════════════════════════════════
mb_x, mb_y = -0.05, -1.15
# Post
bpy.ops.mesh.primitive_cube_add(size=1, location=(mb_x, mb_y, 0.25))
mb_post = bpy.context.active_object
mb_post.name = "MailboxPost"
mb_post.scale = (0.03, 0.03, 0.18)
bpy.ops.object.transform_apply(scale=True)
assign_mat(mb_post, mat_mailbox_post)
# Box
bpy.ops.mesh.primitive_cube_add(size=1, location=(mb_x, mb_y, 0.42))
mb_box = bpy.context.active_object
mb_box.name = "MailboxBox"
mb_box.scale = (0.06, 0.10, 0.04)
bpy.ops.object.transform_apply(scale=True)
assign_mat(mb_box, mat_mailbox)
# Snow on mailbox
bpy.ops.mesh.primitive_cube_add(size=1, location=(mb_x, mb_y, 0.465))
mb_snow = bpy.context.active_object
mb_snow.name = "MailboxSnow"
mb_snow.scale = (0.065, 0.105, 0.012)
bpy.ops.object.transform_apply(scale=True)
assign_mat(mb_snow, mat_snow)

# ══════════════════════════════════════════════════════════════════════
# 10. LANTERN (by the path)
# ══════════════════════════════════════════════════════════════════════
ln_x, ln_y = 0.15, -0.85
# Post
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.012, depth=0.30,
    location=(ln_x, ln_y, 0.27))
ln_post = bpy.context.active_object
ln_post.name = "LanternPost"
assign_mat(ln_post, mat_lantern)
# Lamp head
bpy.ops.mesh.primitive_cube_add(size=1, location=(ln_x, ln_y, 0.44))
ln_head = bpy.context.active_object
ln_head.name = "LanternHead"
ln_head.scale = (0.03, 0.03, 0.03)
bpy.ops.object.transform_apply(scale=True)
assign_mat(ln_head, mat_lantern_glow)

# ══════════════════════════════════════════════════════════════════════
# 11. SNOW MOUNDS (scattered)
# ══════════════════════════════════════════════════════════════════════
mound_positions = [
    (0.5, 0.4, 0.05, 0.10),
    (-0.8, -0.3, 0.04, 0.08),
    (1.1, 0.2, 0.06, 0.12),
    (-0.5, 1.0, 0.035, 0.07),
    (1.2, -0.9, 0.045, 0.09),
    (-1.2, -1.0, 0.04, 0.08),
]
for i, (mx, my, mz, mr) in enumerate(mound_positions):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8,
        radius=mr, location=(mx, my, mz + 0.12))
    mound = bpy.context.active_object
    mound.name = f"SnowMound{i}"
    mound.scale = (1.3, 1.3, 0.5)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(mound, mat_snow_soft)

# ══════════════════════════════════════════════════════════════════════
# 12. SCENE SETTINGS — Lighting & Camera
# ══════════════════════════════════════════════════════════════════════
# World (sky)
world = bpy.data.worlds.new("WinterWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    bg.inputs["Color"].default_value = (0.75, 0.80, 0.90, 1.0)
    bg.inputs["Strength"].default_value = 0.8

# Key light (warm sun low on horizon — winter feel)
sun = bpy.data.objects.new("KeySun", bpy.data.lights.new("KeySun", type="SUN"))
bpy.context.collection.objects.link(sun)
sun.data.energy = 3.5
sun.data.color = (1.0, 0.92, 0.80)
sun.rotation_euler = (math.radians(55), math.radians(10), math.radians(-30))

# Fill light (cool blue, from opposite side)
fill = bpy.data.objects.new("FillLight", bpy.data.lights.new("FillLight", type="AREA"))
bpy.context.collection.objects.link(fill)
fill.data.energy = 80
fill.data.size = 2.0
fill.data.color = (0.70, 0.80, 1.0)
fill.location = (2.5, -1.5, 2.0)
fill.rotation_euler = (math.radians(45), 0, math.radians(-150))

# Rim light (from behind)
rim = bpy.data.objects.new("RimLight", bpy.data.lights.new("RimLight", type="AREA"))
bpy.context.collection.objects.link(rim)
rim.data.energy = 60
rim.data.size = 1.5
rim.data.color = (0.85, 0.90, 1.0)
rim.location = (-2.0, 2.0, 1.8)
rim.rotation_euler = (math.radians(50), 0, math.radians(130))

# Camera (3/4 view, slightly elevated)
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
bpy.context.collection.objects.link(cam)
scene.camera = cam
cam.location = (3.0, -2.8, 2.5)
direction = Vector((-0.3, 0.3, 0.6)) - cam.location
cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()

# ══════════════════════════════════════════════════════════════════════
# 13. SAVE
# ══════════════════════════════════════════════════════════════════════
# Save .blend
bpy.ops.wm.save_as_mainfile(filepath=blend_path)

# Export GLB
bpy.ops.export_scene.gltf(filepath=glb_path, export_format='GLB', export_apply=True)

obj_count = len(bpy.data.objects)
mat_count = len(bpy.data.materials)
print(f"EXPORT_OK: blend={blend_path} glb={glb_path} objects={obj_count} materials={mat_count}")
