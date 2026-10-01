"""Winter Stargazer Cottage diorama - build script (Blender 4.3 headless).
Usage: blender -b --factory-startup --python build_diorama.py -- <output.blend>
"""
import bpy, bmesh, math, random, os, sys

argv = sys.argv[sys.argv.index("--") + 1:]
blend_out = os.path.abspath(argv[0])
random.seed(7)
TAU = math.tau

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0

# ---------------- helpers ----------------
def link_mat(obj, mat):
    if mat is not None:
        obj.data.materials.append(mat)

def _smooth(obj):
    if obj.type == 'MESH':
        bpy.ops.object.shade_smooth()

def make(t, name, loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1), mat=None,
         bevel=0.0, bev_seg=3, verts=32, smooth=True):
    """primitive factory: t in cube|sphere|ico|cyl|cone|torus|plane"""
    loc = tuple(loc); rot = tuple(rot); scale = tuple(scale)
    if t == 'cube':
        bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    elif t == 'sphere':
        bpy.ops.mesh.primitive_uv_sphere_add(segments=verts, ring_count=max(8, verts // 2),
                                             radius=1, location=loc, rotation=rot)
    elif t == 'ico':
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1, location=loc, rotation=rot)
    elif t == 'cyl':
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=1, depth=1,
                                            location=loc, rotation=rot)
    elif t == 'cone':
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=1, radius2=0, depth=1,
                                        location=loc, rotation=rot)
    elif t == 'torus':
        bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.25,
                                         major_segments=verts, minor_segments=12,
                                         location=loc, rotation=rot)
    elif t == 'plane':
        bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    else:
        raise ValueError(t)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    if bevel > 0:
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        b = o.modifiers.new("Bevel", 'BEVEL')
        b.width = bevel
        b.segments = bev_seg
        b.limit_method = 'ANGLE'
        b.angle_limit = math.radians(50)
    elif any(abs(s - 1) > 1e-6 for s in scale):
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    link_mat(o, mat)
    if smooth and t in ('sphere', 'ico', 'cyl', 'cone', 'torus'):
        _smooth(o)
    return o

def pmat(name, color, rough=0.8, metal=0.0, emit=None, es=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit is not None:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = es
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        try:
            m.blend_method = 'BLEND'
        except Exception:
            pass
        m.node_tree.nodes["Principled BSDF"].inputs['Transmission Weight'].default_value = 0.0
    return m

def half_sphere(t, name, loc, rot, r, mat, axis='z', keep='+', verts=32):
    """uv sphere cut in half along axis (keep '+' or '-' side)."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=verts, ring_count=verts // 2,
                                         radius=r, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bm = bmesh.new()
    bm.from_mesh(o.data)
    idx = {'x': 0, 'y': 1, 'z': 2}[axis]
    kill = [v for v in bm.verts if (v.co[idx] < 0) == (keep == '+')]
    bmesh.ops.delete(bm, geom=kill, context='VERTS')
    bm.to_mesh(o.data)
    bm.free()
    link_mat(o, mat)
    _smooth(o)
    return o

def az_rot(dx, dy):
    """rotation for a +Z-pointing cone to point horizontally toward (dx, dy)"""
    return (math.pi / 2, 0, math.atan2(dx, -dy))

# ---------------- materials ----------------
M_SNOW   = pmat("snow",   (0.93, 0.95, 0.99), rough=0.55)
M_SNOW2  = pmat("snow2",  (0.88, 0.92, 0.98), rough=0.7)
M_WOOD_D = pmat("wood_d", (0.28, 0.16, 0.09), rough=0.75)   # dark walnut base
M_SOIL   = pmat("soil",   (0.23, 0.15, 0.11), rough=0.9)
M_PLAST  = pmat("plaster", (0.66, 0.58, 0.49), rough=0.85)  # warm stone wall
M_STONE  = pmat("stone",  (0.47, 0.45, 0.43), rough=0.88)
M_BARK   = pmat("bark",   (0.42, 0.31, 0.2), rough=0.9)
M_ROOF   = pmat("roof_snow", (0.90, 0.93, 0.99), rough=0.5)
M_COPPER = pmat("copper", (0.25, 0.52, 0.44), rough=0.45, metal=0.35)  # oxidized copper dome
M_BRASS  = pmat("brass",  (0.72, 0.55, 0.25), rough=0.3, metal=1.0)
M_IRON   = pmat("iron",   (0.09, 0.10, 0.12), rough=0.5, metal=0.8)
M_WIN    = pmat("window", (1.0, 0.72, 0.35), rough=0.4, emit=(1.0, 0.62, 0.24), es=9)
M_WIN2   = pmat("window2", (1.0, 0.75, 0.4), rough=0.4, emit=(1.0, 0.66, 0.3), es=9)
M_LAMP   = pmat("lampglow", (1.0, 0.8, 0.45), rough=0.4, emit=(1.0, 0.75, 0.4), es=18)
M_BULB   = pmat("bulb", (1.0, 0.85, 0.55), rough=0.4, emit=(1.0, 0.8, 0.5), es=20)
M_PINE   = pmat("pine", (0.13, 0.26, 0.16), rough=0.85)
M_PATH   = pmat("pathstone", (0.55, 0.52, 0.48), rough=0.9)
M_SLIT   = pmat("slitglow", (1.0, 0.7, 0.35), rough=0.5, emit=(1.0, 0.68, 0.32), es=5)
M_SMOKE  = pmat("smoke", (0.9, 0.92, 0.96), rough=1.0, emit=(0.78, 0.82, 0.9), es=0.55, alpha=0.5)
M_SMOKE2 = pmat("smoke2", (0.9, 0.92, 0.96), rough=1.0, emit=(0.78, 0.82, 0.9), es=0.3, alpha=0.3)
M_ICE    = pmat("ice", (0.78, 0.9, 0.97), rough=0.04, emit=(0.55, 0.75, 0.9), es=0.12)
M_GLASS  = pmat("glass", (0.8, 0.88, 0.95), rough=0.05, alpha=0.12)
M_ICICLE = pmat("icicle", (0.82, 0.92, 0.99), rough=0.15, alpha=0.85)
M_DOOR   = pmat("door", (0.47, 0.27, 0.14), rough=0.7)
M_DOOR_G = pmat("door_g", (0.16, 0.34, 0.18), rough=0.6)  # door frame green
M_SCARF  = pmat("scarf", (0.75, 0.15, 0.14), rough=0.8)
M_HAT    = pmat("hat", (0.05, 0.05, 0.06), rough=0.5)
M_COAL   = pmat("coal", (0.02, 0.02, 0.02), rough=0.4)
M_CARROT = pmat("carrot", (0.9, 0.45, 0.1), rough=0.6)
M_FOX    = pmat("fox", (0.85, 0.42, 0.14), rough=0.75)
M_FOX_W  = pmat("foxw", (0.93, 0.9, 0.86), rough=0.8)
M_MOSS   = pmat("moss", (0.2, 0.3, 0.16), rough=0.9)
M_FLAG   = pmat("flag", (0.8, 0.2, 0.15), rough=0.7)

# ---------------- base: rounded-square layered platform ----------------
BT = 1.15  # top of snow slab (snow_skin top = 1.12 + 0.03)
b1 = make('cube', "base_bottom", (0, 0, 0.30), scale=(10.0, 10.0, 0.6), mat=M_WOOD_D, bevel=0.5, bev_seg=8)
b2 = make('cube', "base_mid",    (0, 0, 0.72), scale=(9.4, 9.4, 0.44), mat=M_SOIL, bevel=0.42, bev_seg=8)
b3 = make('cube', "base_top",    (0, 0, 0.93), scale=(8.9, 8.9, 0.36), mat=M_SNOW2, bevel=0.45, bev_seg=8)
snow_skin = make('cube', "snow_skin", (0, 0, 1.12), scale=(8.55, 8.55, 0.06), mat=M_SNOW, bevel=0.28, bev_seg=6)

# snow drifts around edges
drifts = [(-3.7, 3.6, 1.5, 0.9), (3.6, 3.8, 1.2, 0.8), (-4.0, -1.4, 1.1, 0.7),
          (4.0, 1.2, 1.3, 0.8), (-1.6, 4.1, 1.0, 0.6), (1.6, -4.15, 1.0, 0.6),
          (-3.2, -3.9, 0.9, 0.6), (4.25, -3.2, 0.8, 0.5)]
for i, (dx, dy, sx, sy) in enumerate(drifts):
    make('sphere', f"drift_{i}", (dx, dy, BT - 0.02), scale=(sx, sy, 0.24), mat=M_SNOW)

# little snow pines
def pine(px, py, s=1.0):
    make('cyl', f"pine_trunk_{px}_{py}", (px, py, BT + 0.1 * s), scale=(0.07 * s, 0.07 * s, 0.22 * s), mat=M_BARK, verts=10)
    make('cone', f"pine_t1_{px}_{py}", (px, py, BT + 0.68 * s), scale=(0.4 * s, 0.4 * s, 1.15 * s), mat=M_PINE, verts=18)
    make('cone', f"pine_s1_{px}_{py}", (px, py, BT + 1.02 * s), scale=(0.42 * s, 0.42 * s, 0.4 * s), mat=M_SNOW, verts=18)
    make('cone', f"pine_t2_{px}_{py}", (px, py, BT + 1.5 * s), scale=(0.25 * s, 0.25 * s, 0.55 * s), mat=M_PINE, verts=16)
    make('cone', f"pine_s2_{px}_{py}", (px, py, BT + 1.72 * s), scale=(0.26 * s, 0.26 * s, 0.2 * s), mat=M_SNOW, verts=16)
pine(-3.5, 2.7, 0.95)
pine(-3.9, 0.35, 0.7)
pine(4.0, 0.2, 0.75)

# ---------------- cottage (front faces -Y, rotated for composition) ----------------
HZ = -0.2  # house yaw
HX, HY = -1.15, 0.75
cosH, sinH = math.cos(HZ), math.sin(HZ)
def hloc(lx, ly, lz):
    """house-local (lx,ly at z=0 ground) -> world"""
    return (HX + lx * cosH - ly * sinH, HY + lx * sinH + ly * cosH, lz)

WALL_H = 2.1
walls = make('cube', "walls", hloc(0, 0, BT + WALL_H / 2), rot=(0, 0, HZ),
             scale=(3.3, 2.5, WALL_H), mat=M_PLAST, bevel=0.07, bev_seg=2)

# curved marshmallow-snow roof (squashed sphere, gentle overhang)
roof = make('sphere', "roof", hloc(0, 0, BT + WALL_H + 0.26), rot=(0, 0, HZ),
            scale=(1.85, 1.5, 0.95), mat=M_ROOF)
make('sphere', "roof_bulge_front", hloc(0, -1.0, BT + WALL_H - 0.38),
     rot=(0, 0, HZ), scale=(0.55, 0.4, 0.28), mat=M_ROOF)

# brass trim ring peeking out under the snow overhang
rim = make('torus', "roof_rim", hloc(0, 0, BT + WALL_H - 0.04), rot=(0, 0, HZ),
           scale=(1.74, 1.74, 0.3), mat=M_BRASS)

# door (arched) + green frame + wreath
make('cube', "door_frame", hloc(0.62, -1.24, BT + 0.62), rot=(0, 0, HZ),
     scale=(0.62, 0.12, 1.24), mat=M_DOOR_G, bevel=0.02)
make('cube', "door", hloc(0.62, -1.27, BT + 0.55), rot=(0, 0, HZ),
     scale=(0.48, 0.1, 1.02), mat=M_DOOR)
doortop = half_sphere('sphere', "door_arch", hloc(0.62, -1.27, BT + 1.06),
                      rot=(0, 0, HZ), r=0.21, mat=M_DOOR_G)
make('torus', "wreath", hloc(0.62, -1.35, BT + 0.78), rot=(math.pi / 2, 0, HZ),
     scale=(0.16, 0.16, 0.5), mat=M_MOSS)
for ba in (0.4, 2.1, 3.7, 5.3):
    wx = 0.62 + 0.16 * math.cos(ba); wy = -1.36 - 0.08 * math.sin(ba)
    make('ico', f"berry_{int(math.degrees(ba))}", hloc(wx, wy, BT + 0.78 + 0.08 * math.cos(ba)),
         scale=(0.035, 0.035, 0.035), mat=M_FLAG)
make('cube', "door_step", hloc(0.62, -1.62, BT + 0.05), rot=(0, 0, HZ),
     scale=(0.8, 0.42, 0.12), mat=M_STONE, bevel=0.03)
make('sphere', "step_snow", hloc(0.62, -1.66, BT + 0.13), rot=(0, 0, HZ),
     scale=(0.42, 0.22, 0.06), mat=M_SNOW)

# front window (warm) + mullions
make('cube', "win_frame", hloc(-0.75, -1.26, BT + 1.15), rot=(0, 0, HZ),
     scale=(0.72, 0.1, 0.9), mat=M_DOOR_G, bevel=0.02)
make('cube', "win_glow", hloc(-0.75, -1.28, BT + 1.15), rot=(0, 0, HZ),
     scale=(0.56, 0.08, 0.74), mat=M_WIN)
make('cube', "win_mull_h", hloc(-0.75, -1.33, BT + 1.15), rot=(0, 0, HZ),
     scale=(0.6, 0.03, 0.05), mat=M_DOOR_G)
make('cube', "win_mull_v", hloc(-0.75, -1.33, BT + 1.15), rot=(0, 0, HZ),
     scale=(0.05, 0.03, 0.78), mat=M_DOOR_G)

# round owl-eye porthole window up high
make('torus', "porthole_ring", hloc(-0.75, -1.27, BT + 1.62), rot=(math.pi / 2, 0, HZ),
     scale=(0.26, 0.26, 0.55), mat=M_BRASS)
make('cyl', "porthole_glow", hloc(-0.75, -1.3, BT + 1.62), rot=(math.pi / 2, 0, HZ),
     scale=(0.21, 0.21, 0.06), mat=M_WIN2)

# side window on +X wall (clear of the tower)
make('cube', "side_win_frame", hloc(1.63, -0.6, BT + 1.15), rot=(0, 0, HZ),
     scale=(0.12, 0.66, 0.82), mat=M_DOOR_G, bevel=0.02)
make('cube', "side_win_glow", hloc(1.66, -0.6, BT + 1.15), rot=(0, 0, HZ),
     scale=(0.1, 0.5, 0.66), mat=M_WIN)

# crooked stone chimney (stacked tilted blocks)
ch_loc = (-1.0, 0.8)
chz = BT + 2.2
for i in range(4):
    s = 0.5 - i * 0.04
    jx = ch_loc[0] + 0.03 * math.sin(i * 1.7)
    jy = ch_loc[1] + 0.03 * math.cos(i * 2.1)
    make('cube', f"chim_{i}", hloc(jx, jy, chz + 0.22 + i * 0.42),
         rot=(0.02 * math.sin(i), 0.02 * math.cos(i * 1.3), HZ + 0.06 * math.sin(i * 2.7)),
         scale=(s, s, 0.44), mat=M_STONE, bevel=0.03)
make('sphere', "chim_snow", hloc(ch_loc[0], ch_loc[1], chz + 1.75),
     scale=(0.22, 0.22, 0.07), mat=M_SNOW)

# smoke puffs drifting up
for i, (pz, r, dy) in enumerate([(0.35, 0.09, 0.02), (0.72, 0.14, 0.06), (1.15, 0.2, 0.12),
                                 (1.68, 0.27, 0.2), (2.35, 0.36, 0.3)]):
    make('sphere', f"smoke_{i}", hloc(ch_loc[0] + 0.06 * i, ch_loc[1] + dy, chz + 1.95 + pz),
         scale=(r * 1.25, r, r), mat=M_SMOKE if i % 2 == 0 else M_SMOKE2)

# ---------------- observatory tower (oxidized copper dome) ----------------
TX, TY = 1.55, 0.95
make('cyl', "tower", hloc(TX, TY, BT + 1.55), rot=(0, 0, HZ),
     scale=(0.78, 0.78, 3.1), mat=M_STONE, verts=40)
make('torus', "tower_ring", hloc(TX, TY, BT + 2.95), rot=(0, 0, HZ),
     scale=(0.82, 0.82, 0.3), mat=M_BRASS)
dome = half_sphere('sphere', "dome", hloc(TX, TY, BT + 3.1), rot=(0, 0, HZ),
                   r=0.86, mat=M_COPPER, verts=40)
make('sphere', "dome_finial", hloc(TX, TY - 0.05, BT + 4.05), scale=(0.05, 0.05, 0.12), mat=M_BRASS)
# glowing shutter slit on the camera-facing side of the dome
AZ = (0.735, -0.677)  # horizontal direction toward main camera
DC = hloc(TX, TY, BT + 3.1)  # dome center
slit = make('cube', "slit", (DC[0] + AZ[0] * 0.74, DC[1] + AZ[1] * 0.74, DC[2] + 0.28),
            rot=(0, 0, math.atan2(-AZ[0], AZ[1])), scale=(0.16, 0.28, 0.55), mat=M_SLIT)
# telescope pointing up toward the viewer
elev = 0.55
e3 = (AZ[0] * math.cos(elev), AZ[1] * math.cos(elev), math.sin(elev))
mouth = (DC[0] + AZ[0] * 0.8, DC[1] + AZ[1] * 0.8, DC[2] + 0.38)
make('cyl', "telescope", (mouth[0] + e3[0] * 0.5, mouth[1] + e3[1] * 0.5, mouth[2] + e3[2] * 0.5),
     rot=(math.pi / 2 - elev, 0, math.atan2(AZ[0], AZ[1])), scale=(0.095, 0.095, 1.15), mat=M_BRASS, verts=20)
make('cyl', "telescope_eyepiece",
     (mouth[0] - e3[0] * 0.3, mouth[1] - e3[1] * 0.3, mouth[2] - e3[2] * 0.3),
     rot=(math.pi / 2 - elev, 0, math.atan2(AZ[0], AZ[1])), scale=(0.05, 0.05, 0.24), mat=M_IRON, verts=16)
# tower arched window (also camera-facing)
TW = hloc(TX, TY, 0)
make('cube', "tower_win", (TW[0] + AZ[0] * 0.785, TW[1] + AZ[1] * 0.785, BT + 2.15),
     rot=(0, 0, math.atan2(-AZ[0], AZ[1])), scale=(0.22, 0.06, 0.4), mat=M_WIN2, bevel=0.015)

# string lights along front roof edge
for i in range(12):
    a = math.radians(-64 + i * 11.6)
    lx = 1.7 * math.sin(a)
    ly = -1.34 * math.cos(a) - 0.06
    make('ico', f"bulb_{i}", hloc(lx, ly, BT + 1.91 - 0.04 * math.cos(i * 1.9)),
         scale=(0.06, 0.06, 0.06), mat=M_BULB)

# icicles under the front overhang
for i in range(9):
    a = math.radians(-58 + i * 14.5)
    lx = 1.72 * math.sin(a)
    ly = -1.36 * math.cos(a)
    L = 0.16 + 0.28 * abs(math.sin(i * 2.3))
    make('cone', f"icicle_{i}", hloc(lx, ly, BT + 1.94 - L / 2),
         rot=(math.pi, 0, 0), scale=(0.045, 0.045, L), mat=M_ICICLE, verts=10)

# ---------------- frozen pond ----------------
PX, PY = 2.45, -2.2
make('cyl', "pond_snow_rim", (PX, PY, BT + 0.02), scale=(1.4, 1.15, 0.09), mat=M_SNOW, verts=40)
make('cyl', "pond_ice", (PX, PY, BT + 0.075), scale=(1.2, 0.96, 0.07), mat=M_ICE, verts=40)
make('torus', "pond_edge", (PX, PY, BT + 0.06), rot=(0, 0, 0),
     scale=(1.22, 0.98, 0.5), mat=M_SNOW)

# ---------------- snowman ----------------
SX, SY, SYAW = -2.65, -2.15, 0.64
cSX, sSX = math.cos(SYAW), math.sin(SYAW)
def sloc(lx, ly, lz):
    return (SX + lx * cSX - ly * sSX, SY + lx * sSX + ly * cSX, lz)
make('sphere', "sm_b", sloc(0, 0, BT + 0.34), scale=(0.44, 0.44, 0.4), mat=M_SNOW)
make('sphere', "sm_m", sloc(0, 0, BT + 0.92), scale=(0.31, 0.31, 0.29), mat=M_SNOW)
make('sphere', "sm_h", sloc(0, 0, BT + 1.36), scale=(0.22, 0.22, 0.21), mat=M_SNOW)
for bi, bz in ((0, BT + 0.86), (1, BT + 1.02), (2, BT + 1.18)):
    make('ico', f"sm_btn{bi}", sloc(0, -0.3, bz), scale=(0.03, 0.03, 0.03), mat=M_COAL)
make('ico', "sm_eye_l", sloc(-0.08, -0.19, BT + 1.42), scale=(0.024, 0.024, 0.024), mat=M_COAL)
make('ico', "sm_eye_r", sloc(0.08, -0.19, BT + 1.42), scale=(0.024, 0.024, 0.024), mat=M_COAL)
make('cone', "sm_nose", sloc(0, -0.28, BT + 1.36), rot=az_rot(0, -1), scale=(0.035, 0.035, 0.2), mat=M_CARROT)
make('torus', "sm_scarf", sloc(0, 0, BT + 1.17), rot=(math.pi / 2, 0, SYAW),
     scale=(0.23, 0.23, 0.55), mat=M_SCARF)
make('cube', "sm_scarf_tail", sloc(0.12, -0.2, BT + 0.98), rot=(0.1, 0.2, SYAW),
     scale=(0.09, 0.03, 0.3), mat=M_SCARF, bevel=0.01)
make('cyl', "sm_hat_brim", sloc(0, 0, BT + 1.53), scale=(0.27, 0.27, 0.03), mat=M_HAT, verts=24)
make('cyl', "sm_hat_top", sloc(0, 0, BT + 1.66), scale=(0.18, 0.18, 0.28), mat=M_HAT, verts=24)
make('cyl', "sm_hat_band", sloc(0, 0, BT + 1.56), scale=(0.19, 0.19, 0.05), mat=M_SCARF, verts=24)
for ai, sgn in ((0, -1), (1, 1)):
    arm = make('cyl', f"sm_arm{ai}", sloc(sgn * 0.42, 0.05, BT + 0.98),
               rot=(0, sgn * 0.9, sgn * 0.5), scale=(0.016, 0.016, 0.5), mat=M_BARK, verts=8)
    make('sphere', f"sm_mitten{ai}", sloc(sgn * 0.63, 0.05, BT + 1.18), scale=(0.05, 0.05, 0.06), mat=M_SCARF)

# ---------------- bare old tree ----------------
TRX, TRY = 3.3, 1.8
make('cone', "trunk", (TRX, TRY, BT + 1.2), rot=(0.05, -0.07, 0), scale=(0.34, 0.34, 2.4), mat=M_BARK, verts=14)
branches = [(0.6, 2.5, 0.62), (2.2, 2.75, 0.58), (3.4, 3.0, 0.52), (4.6, 2.25, 0.7), (5.6, 1.9, 0.5)]
for bi, (yaw, bz, tilt) in enumerate(branches):
    L = 0.72 + 0.2 * math.sin(bi * 1.3)
    d = (math.sin(tilt) * math.cos(yaw), math.sin(tilt) * math.sin(yaw), math.cos(tilt))
    base = (TRX + d[0] * 0.28, TRY + d[1] * 0.28, BT + bz)
    ctr = (base[0] + d[0] * L / 2, base[1] + d[1] * L / 2, base[2] + d[2] * L / 2)
    make('cone', f"branch_{bi}", ctr, rot=(tilt, 0, math.atan2(d[0], -d[1])),
         scale=(0.11, 0.11, L), mat=M_BARK, verts=10)
    tip = (base[0] + d[0] * L * 0.95, base[1] + d[1] * L * 0.95, base[2] + d[2] * L * 0.95 + 0.02)
    make('sphere', f"branch_snow_{bi}", tip, scale=(0.24, 0.18, 0.07), mat=M_SNOW)
make('sphere', "trunk_snow", (TRX, TRY, BT + 2.42), scale=(0.22, 0.22, 0.07), mat=M_SNOW)
make('cyl', "stump", (2.2, 2.9, BT + 0.16), scale=(0.22, 0.22, 0.32), mat=M_BARK, verts=16)
make('sphere', "stump_snow", (2.2, 2.9, BT + 0.33), scale=(0.22, 0.22, 0.06), mat=M_SNOW)

# ---------------- lamp posts ----------------
def lamp(lx, ly, h=1.75):
    make('cyl', f"lamp_pole_{lx}_{ly}", (lx, ly, BT + h / 2), scale=(0.035, 0.035, h), mat=M_IRON, verts=12)
    make('cyl', f"lamp_cap_{lx}_{ly}", (lx, ly, BT + h + 0.06), scale=(0.1, 0.1, 0.03), mat=M_IRON, verts=12)
    make('cone', f"lamp_roof_{lx}_{ly}", (lx, ly, BT + h + 0.2), scale=(0.13, 0.13, 0.18), mat=M_IRON, verts=12)
    make('cube', f"lamp_case_{lx}_{ly}", (lx, ly, BT + h - 0.14), scale=(0.15, 0.15, 0.34), mat=M_GLASS, bevel=0.01)
    make('ico', f"lamp_core_{lx}_{ly}", (lx, ly, BT + h - 0.16), scale=(0.075, 0.075, 0.075), mat=M_LAMP)
    make('sphere', f"lamp_snow_{lx}_{ly}", (lx, ly, BT + h + 0.31), scale=(0.11, 0.11, 0.04), mat=M_SNOW)
    bpy.ops.object.light_add(type='POINT', location=(lx, ly, BT + h - 0.18))
    L = bpy.context.active_object
    L.data.energy = 22; L.data.color = (1.0, 0.72, 0.42); L.data.shadow_soft_size = 0.12
    L.name = f"lamp_light_{lx}_{ly}"
lamp(1.5, -1.05)
lamp(-3.45, -3.1, h=1.55)

# ---------------- stepping-stone path ----------------
path_pts = [(0.5, -1.95), (0.6, -2.4), (0.85, -2.85), (1.2, -3.2), (1.65, -3.45), (2.15, -3.6)]
for pi, (px, py) in enumerate(path_pts):
    r = 0.18 + 0.05 * math.sin(pi * 2.2)
    make('cyl', f"stone_{pi}", (px, py, BT + 0.045), rot=(0, 0, math.sin(pi) * 0.4),
         scale=(r, r * 0.8, 0.09), mat=M_PATH, verts=14)
    make('sphere', f"stone_snow_{pi}", (px + r * 0.4, py + 0.04, BT + 0.12),
         scale=(r * 0.6, r * 0.45, 0.035), mat=M_SNOW)

# ---------------- fence runs ----------------
def fence_run(p1, p2, n):
    x1, y1 = p1; x2, y2 = p2
    dx, dy = x2 - x1, y2 - y1
    dist = math.hypot(dx, dy)
    ang = math.atan2(dy, dx)
    for i in range(n):
        t = i / (n - 1)
        px, py = x1 + dx * t, y1 + dy * t
        make('cyl', f"fpost_{px}_{py}", (px, py, BT + 0.26), scale=(0.04, 0.04, 0.52), mat=M_DOOR, verts=10)
        make('sphere', f"fpost_snow_{px}_{py}", (px, py, BT + 0.545), scale=(0.055, 0.055, 0.028), mat=M_SNOW)
    for hz in (0.2, 0.38):
        make('cube', f"frail_{px}_{py}_{hz}", ((x1 + x2) / 2, (y1 + y2) / 2, BT + hz),
             rot=(0, 0, ang), scale=(dist, 0.03, 0.035), mat=M_DOOR)
        make('cube', f"frail_snow_{px}_{py}_{hz}", ((x1 + x2) / 2, (y1 + y2) / 2, BT + hz + 0.032),
             rot=(0, 0, ang), scale=(dist, 0.034, 0.014), mat=M_SNOW)
fence_run((-4.05, -1.1), (-2.2, -3.75), 6)
fence_run((3.75, -3.55), (4.2, -1.6), 5)

# ---------------- firewood stack ----------------
for li, (ly_off, lz) in enumerate([(-0.09, BT + 0.09), (0.09, BT + 0.09), (0.0, BT + 0.24)]):
    make('cyl', f"log_{li}", hloc(-1.85, 0.35 + ly_off, lz), rot=(math.pi / 2, 0, HZ + math.pi / 2),
         scale=(0.075, 0.075, 0.55), mat=M_BARK, verts=12)
make('sphere', "log_snow", hloc(-1.85, 0.35, BT + 0.34), scale=(0.3, 0.14, 0.05), mat=M_SNOW)

# ---------------- mailbox + fox walking to it ----------------
MBX, MBY = 0.9, -3.5
make('cyl', "mail_post", (MBX, MBY, BT + 0.375), scale=(0.03, 0.03, 0.75), mat=M_DOOR, verts=10)
make('cube', "mail_box", (MBX + 0.1, MBY, BT + 0.72), rot=(0, 0, 0.5),
     scale=(0.3, 0.18, 0.2), mat=M_FLAG, bevel=0.03, bev_seg=2)
make('cyl', "mail_box_top", (MBX + 0.1, MBY, BT + 0.82), rot=(0, 0, 0.5),
     scale=(0.15, 0.09, 0.16), mat=M_FLAG, verts=16)
make('cube', "mail_flag", (MBX + 0.02, MBY + 0.1, BT + 0.9), rot=(0, 0, 0.5),
     scale=(0.02, 0.09, 0.12), mat=M_HAT)
make('sphere', "mail_snow", (MBX + 0.1, MBY, BT + 0.95), scale=(0.14, 0.1, 0.04), mat=M_SNOW)

FX, FY, FZ = 1.3, -3.22, BT
FAW = -2.52  # fox faces the mailbox across the path
cF, sF = math.cos(FAW), math.sin(FAW)
def floc(lx, ly, lz):
    return (FX + lx * cF - ly * sF, FY + lx * sF + ly * cF, lz)
make('sphere', "fox_body", floc(0, 0, FZ + 0.26), rot=(0, 0, FAW), scale=(0.34, 0.15, 0.16), mat=M_FOX)
make('sphere', "fox_chest", floc(0.24, 0, FZ + 0.22), rot=(0, 0, FAW), scale=(0.14, 0.13, 0.12), mat=M_FOX_W)
make('sphere', "fox_head", floc(0.3, 0, FZ + 0.46), rot=(0, 0, FAW), scale=(0.14, 0.12, 0.11), mat=M_FOX)
make('cone', "fox_snout", floc(0.44, 0, FZ + 0.43), rot=az_rot(cF, sF), scale=(0.045, 0.045, 0.14), mat=M_FOX_W)
for ei, sgn in ((0, -1), (1, 1)):
    make('cone', f"fox_ear{ei}", floc(0.26, sgn * 0.06, FZ + 0.6), rot=(0.15 * sgn, 0, FAW),
         scale=(0.035, 0.03, 0.09), mat=M_FOX)
for li, (lx, ly) in enumerate([(0.18, -0.08), (0.18, 0.08), (-0.18, -0.08), (-0.18, 0.08)]):
    make('cyl', f"fox_leg{li}", floc(lx, ly, FZ + 0.09), scale=(0.028, 0.028, 0.18), mat=M_FOX, verts=8)
tail = make('sphere', "fox_tail", floc(-0.42, 0, FZ + 0.34), rot=(0, 0.5, FAW),
            scale=(0.26, 0.09, 0.09), mat=M_FOX)
make('sphere', "fox_tail_tip", floc(-0.62, 0, FZ + 0.44), scale=(0.07, 0.06, 0.06), mat=M_FOX_W)
make('ico', "fox_nose", floc(0.51, 0, FZ + 0.43), scale=(0.02, 0.02, 0.02), mat=M_COAL)

# ---------------- snow-dusted bench by the front wall ----------------
BX, BY, BAW = -0.7, -2.05, 0.9
cB, sB = math.cos(BAW), math.sin(BAW)
def bloc(lx, ly, lz):
    return (BX + lx * cB - ly * sB, BY + lx * sB + ly * cB, lz)
make('cube', "bench_seat", bloc(0, 0, BT + 0.4), rot=(0, 0, BAW), scale=(0.72, 0.3, 0.06), mat=M_DOOR, bevel=0.015)
make('cube', "bench_back", bloc(-0.3, 0.13, BT + 0.62), rot=(-0.25, 0, BAW), scale=(0.72, 0.05, 0.4), mat=M_DOOR, bevel=0.015)
for li, sgn in ((0, -1), (1, 1)):
    make('cube', f"bench_leg{li}", bloc(sgn * 0.28, 0, BT + 0.18), rot=(0, 0, BAW),
         scale=(0.06, 0.26, 0.36), mat=M_DOOR)
make('sphere', "bench_snow", bloc(0, -0.02, BT + 0.47), rot=(0, 0, BAW), scale=(0.38, 0.17, 0.045), mat=M_SNOW)

# ---------------- moon ----------------
make('sphere', "moon", (-10.5, 6.5, 4.5), scale=(0.8, 0.8, 0.8),
     mat=pmat("moonmat", (0.95, 0.97, 1.0), rough=1.0, emit=(0.92, 0.96, 1.0), es=5.5))

# ---------------- falling snow ----------------
CAM_SAFE = [(9.9, -9.1, 6.4), (5.1, -6.3, 3.9), (-9.3, -6.8, 5.6)]
for i in range(210):
    fx, fy, fz = 0, 0, 0
    for _ in range(25):
        fx = random.uniform(-5.6, 5.6)
        fy = random.uniform(-5.6, 5.6)
        fz = random.uniform(1.5, 7.4)
        if all(math.dist((fx, fy, fz), c) > 2.6 for c in CAM_SAFE):
            break
    r = random.uniform(0.016, 0.036)
    make('ico', f"flake_{i}", (fx, fy, fz), scale=(r, r, r), mat=M_SNOW, verts=1, smooth=False)

# ---------------- world & lighting ----------------
world = bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs['Color'].default_value = (0.012, 0.022, 0.052, 1)
bg.inputs['Strength'].default_value = 1.25
bpy.context.scene.world = world

bpy.ops.object.light_add(type='SUN', location=(4, 6, 10))
sun = bpy.context.active_object
sun.rotation_euler = (math.radians(50), 0, math.radians(200))
sun.data.energy = 3.4
sun.data.color = (0.62, 0.72, 1.0)
sun.data.angle = math.radians(4)

bpy.ops.object.light_add(type='AREA', location=(6.5, -7.5, 5.5))
fill = bpy.context.active_object
fill.data.energy = 380
fill.data.size = 7
fill.data.color = (0.55, 0.66, 0.95)
fill.rotation_euler = (math.radians(48), 0, math.radians(38))

bpy.ops.object.light_add(type='POINT', location=(0.35, -1.7, 1.7))
porch = bpy.context.active_object
porch.data.energy = 18
porch.data.color = (1.0, 0.62, 0.3)
porch.data.shadow_soft_size = 0.5

# ---------------- cameras ----------------
def add_cam(name, loc, target, lens=58, fstop=4.0):
    bpy.ops.object.empty_add(location=target)
    tgt = bpy.context.active_object
    tgt.name = name + "_target"
    bpy.ops.object.camera_add(location=loc)
    cam = bpy.context.active_object
    cam.name = name
    cam.data.lens = lens
    cam.data.dof.use_dof = True
    cam.data.dof.focus_object = tgt
    cam.data.dof.aperture_fstop = fstop
    con = cam.constraints.new(type='TRACK_TO')
    con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Y'
    return cam

cam_main = add_cam("CAM_MAIN", (9.9, -9.1, 5.4), (0, 0, 1.25), lens=56, fstop=4.5)
cam_close = add_cam("CAM_CLOSE", (5.1, -6.3, 3.9), (-0.5, 0.2, 1.9), lens=60, fstop=3.5)
cam_side = add_cam("CAM_SIDE", (-9.3, -6.8, 5.6), (0.2, 0.3, 1.1), lens=55, fstop=4.0)
bpy.context.scene.camera = cam_main

# ---------------- render settings & compositor glare ----------------
scn = bpy.context.scene
scn.render.engine = 'BLENDER_EEVEE_NEXT'
scn.eevee.taa_render_samples = 128
scn.eevee.use_shadows = True
scn.eevee.shadow_ray_count = 4
scn.eevee.use_gtao = True
scn.eevee.use_raytracing = False
scn.render.resolution_x = 1600
scn.render.resolution_y = 1600
scn.render.film_transparent = False
try:
    scn.view_settings.view_transform = 'AgX'
    scn.view_settings.look = 'AgX - Punchy'
    scn.view_settings.exposure = 0.62
except Exception as e:
    print("view_settings warn:", e)

scn.use_nodes = True
ct = scn.node_tree
ct.nodes.clear()
rl = ct.nodes.new('CompositorNodeRLayers')
glare = ct.nodes.new('CompositorNodeGlare')
glare.glare_type = 'FOG_GLOW'
glare.quality = 'HIGH'
glare.threshold = 0.85
glare.size = 9
comp = ct.nodes.new('CompositorNodeComposite')
ct.links.new(rl.outputs['Image'], glare.inputs['Image'])
ct.links.new(glare.outputs['Image'], comp.inputs['Image'])

# ---------------- save ----------------
bpy.ops.wm.save_as_mainfile(filepath=blend_out)
print("BUILD_OK:", blend_out, "objects:", len(bpy.data.objects))
