# -*- coding: utf-8 -*-
"""Winter diorama library — materials, primitives, and scene parts.

Design: "裂光小屋 / Cleft-Light House"
  * 圆角方形石质底座 + 厚雪毯
  * 主体：向外倾斜的木屋（上宽下窄，gable 山墙），屋面覆盖厚雪（带雪檐下垂）
  * 一座独立玻璃灯塔（楼梯塔）从屋后右侧拔起，暖光通亮 -> 视觉焦点
  * 冬季院落：冰湖、雪径、火塘、柴堆、灯笼、雪松、白桦、雪橇、脚印
"""
import bpy
import bmesh
import math
import random
from math import radians as R
from mathutils import Vector, Euler, Matrix

# ---------------------------------------------------------------- tuning
GROUND = 0.10          # 雪面名义高度
SNOW_TOP = 0.14        # 雪毯上表面
PLINTH_W = 12.4        # 底座边长
PLINTH_T = 1.15        # 底座厚度（上表面 z = 0）
PLINTH_BEV = 0.80      # 圆角半径（底座）

HOUSE_POS = (-0.35, 0.55)
HOUSE_ROT = -18.0      # 平面内旋转（度）
PAD_W, PAD_D = 5.60, 5.20    # 屋脚石台（雪面上的窄石台）

BW, BD = 4.00, 3.60    # 墙体底部宽/深
TW, TD = 5.40, 5.00    # 墙体顶部（明显外倾，这是造型重点）
WALL_H = 3.00          # 墙高
RISE = 2.10            # 屋脊相对墙顶高
RIDGE_X = -0.70        # 屋脊偏移（不对称双坡屋面）
EAVE_P = 0.68          # +X 侧出檐（面向英雄机位）
EAVE_M = 0.44          # -X 侧出檐
MAT = {}


# ---------------------------------------------------------------- scene
def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scn = bpy.context.scene
    scn.unit_settings.system = 'METRIC'
    scn.unit_settings.scale_length = 1.0
    return scn


def link(obj):
    bpy.context.collection.objects.link(obj)
    return obj


def activate(obj):
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    return obj


def apply_scale(obj):
    activate(obj)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


# ---------------------------------------------------------------- materials
def pbr(name, color, rough=0.6, metal=0.0, emis=None, emis_str=0.0,
        alpha=None, ior=1.45, spec=None, sheen=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")

    def st(k, v):
        if k in b.inputs:
            b.inputs[k].default_value = v

    st("Base Color", (color[0], color[1], color[2], 1.0))
    st("Roughness", rough)
    st("Metallic", metal)
    st("IOR", ior)
    if spec is not None:
        st("Specular IOR Level", spec)
    if sheen is not None:
        st("Sheen Weight", sheen)
    if emis is not None:
        st("Emission Color", (emis[0], emis[1], emis[2], 1.0))
        st("Emission Strength", emis_str)
    if alpha is not None:
        st("Alpha", alpha)
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            try:
                m.blend_method = 'BLEND'
            except Exception:
                pass
    m.diffuse_color = (color[0], color[1], color[2], 1.0)  # workbench fallback
    m.roughness = rough
    return m


def noise_bump(m, scale=22.0, strength=0.22):
    """给材质加一层程序化噪波凹凸（雪/石头表面细节）。"""
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    tex = nt.nodes.new('ShaderNodeTexNoise')
    tex.inputs['Scale'].default_value = scale
    tex.inputs['Detail'].default_value = 6.0
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = strength
    nt.links.new(tex.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def build_materials():
    MAT.clear()
    MAT['snow'] = noise_bump(pbr("Snow", (0.905, 0.935, 1.0), rough=0.62, spec=0.32,
                                sheen=0.35), 30.0, 0.25)
    MAT['snow_soft'] = pbr("SnowSoft", (0.93, 0.95, 1.0), rough=0.7, spec=0.25, sheen=0.5)
    MAT['snow_packed'] = noise_bump(pbr("SnowPacked", (0.74, 0.79, 0.90), rough=0.5,
                                        spec=0.35), 60.0, 0.18)
    MAT['stone'] = noise_bump(pbr("Stone", (0.155, 0.163, 0.185), rough=0.78, spec=0.3),
                              8.0, 0.12)
    MAT['stone_face'] = noise_bump(pbr("StoneFace", (0.255, 0.252, 0.248), rough=0.85,
                                       spec=0.28), 14.0, 0.16)
    MAT['rock'] = noise_bump(pbr("Rock", (0.30, 0.31, 0.335), rough=0.9, spec=0.3), 9.0, 0.2)
    MAT['timber'] = noise_bump(pbr("TimberDark", (0.215, 0.150, 0.108), rough=0.60,
                                   spec=0.32), 40.0, 0.13)
    MAT['timber_warm'] = noise_bump(pbr("TimberWarm", (0.30, 0.165, 0.082), rough=0.58,
                                        spec=0.35), 24.0, 0.1)
    MAT['timber_pale'] = pbr("TimberPale", (0.52, 0.36, 0.21), rough=0.7, spec=0.3)
    MAT['metal'] = pbr("MetalDark", (0.055, 0.058, 0.065), rough=0.42, metal=0.75, spec=0.5)
    MAT['ice'] = pbr("Ice", (0.105, 0.205, 0.285), rough=0.055, spec=0.72, ior=1.31)
    MAT['ice_pale'] = pbr("IcePale", (0.35, 0.50, 0.62), rough=0.10, spec=0.7, ior=1.31)
    MAT['glow'] = pbr("GlowWarm", (1.0, 0.60, 0.26), rough=0.4,
                      emis=(1.0, 0.42, 0.10), emis_str=1.9)
    MAT['glow_soft'] = pbr("GlowSoft", (1.0, 0.66, 0.32), rough=0.4,
                           emis=(1.0, 0.57, 0.24), emis_str=1.15)
    MAT['ember'] = pbr("Ember", (1.0, 0.30, 0.06), rough=0.5,
                       emis=(1.0, 0.32, 0.07), emis_str=6.5)
    MAT['fir'] = noise_bump(pbr("Fir", (0.062, 0.105, 0.098), rough=0.85, spec=0.25),
                            45.0, 0.2)
    MAT['fir_dark'] = pbr("FirDark", (0.035, 0.070, 0.055), rough=0.88, spec=0.2)
    MAT['birch'] = pbr("Birch", (0.66, 0.645, 0.60), rough=0.72, spec=0.28)
    MAT['ember_wood'] = pbr("CharWood", (0.075, 0.055, 0.045), rough=0.82, spec=0.25)
    MAT['brick'] = noise_bump(pbr("Chimney", (0.30, 0.245, 0.215), rough=0.88,
                                  spec=0.22), 14.0, 0.22)
    MAT['smoke'] = pbr("Smoke", (0.90, 0.92, 0.97), rough=1.0, alpha=0.125, spec=0.0)
    MAT['accent'] = noise_bump(pbr("AccentRed", (0.30, 0.098, 0.072), rough=0.52,
                                   spec=0.35), 30.0, 0.09)
    return MAT


# ---------------------------------------------------------------- primitives
def box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), mat=None,
        bevel=0.0, seg=3, limit='ANGLE', angle=40.0, smooth_angle=None):
    """轴对齐长方体（半尺寸由 size/2 决定），可选倒角修改器。"""
    rot, mat = _fix_rot_mat(rot, mat)
    sx, sy, sz = size[0] / 2.0, size[1] / 2.0, size[2] / 2.0
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o)
    o.location = loc
    o.rotation_euler = Euler([R(a) for a in rot], 'XYZ')
    if mat:
        o.data.materials.append(mat)
    if bevel > 0:
        m = o.modifiers.new("Bevel", 'BEVEL')
        m.width = bevel
        m.segments = seg
        m.limit_method = limit
        if limit == 'ANGLE':
            m.angle_limit = R(angle)
    if smooth_angle:
        smooth(o, smooth_angle)
    return o


def _fix_rot_mat(rot, mat):
    """容错：允许调用时把材质写在 rot 位（box(n, size, loc, MAT[...])）。"""
    if mat is None and hasattr(rot, 'node_tree'):
        return (0.0, 0.0, 0.0), rot
    return rot, mat


def smooth(obj, angle=40.0):
    try:
        activate(obj)
        bpy.ops.object.shade_auto_smooth(angle=R(angle))
    except Exception:
        try:
            activate(obj)
            bpy.ops.object.shade_smooth()
        except Exception:
            pass
    return obj


def cyl(name, radius, depth, loc=(0, 0, 0), rot=(0, 0, 0), mat=None,
        verts=28, cap='NGON', bevel=0.0, seg=2):
    rot, mat = _fix_rot_mat(rot, mat)
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth,
                                        end_fill_type=cap, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = Euler([R(a) for a in rot], 'XYZ')
    if mat:
        o.data.materials.append(mat)
    if bevel > 0:
        m = o.modifiers.new("Bevel", 'BEVEL')
        m.width = bevel
        m.segments = seg
        m.limit_method = 'ANGLE'
        m.angle_limit = R(40)
    return o


def cone(name, r1, r2, depth, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, verts=28):
    rot, mat = _fix_rot_mat(rot, mat)
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r1, radius2=r2,
                                    depth=depth, location=loc)
    o = bpy.context.active_object
    o.name = name
    o.rotation_euler = Euler([R(a) for a in rot], 'XYZ')
    if mat:
        o.data.materials.append(mat)
    return o


def sphere(name, radius, loc=(0, 0, 0), scale=(1, 1, 1), mat=None,
           seg=24, ring=14, smooth_it=True, rot=(0, 0, 0)):
    rot, mat = _fix_rot_mat(rot, mat)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=radius,
                                         location=loc)
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.rotation_euler = Euler([R(a) for a in rot], 'XYZ')
    if mat:
        o.data.materials.append(mat)
    apply_scale(o)
    if smooth_it:
        smooth(o)
    return o


def prism(name, w, d, h, loc=(0, 0, 0), rot=(0, 0, 0), mat=None):
    """三棱柱（屋脊沿局部 Y 轴）：用于老虎窗/小坡顶。"""
    rot, mat = _fix_rot_mat(rot, mat)
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    hw, hd = w / 2.0, d / 2.0
    base = [bm.verts.new(v) for v in ((-hw, -hd, 0), (hw, -hd, 0), (hw, hd, 0), (-hw, hd, 0))]
    rt = [bm.verts.new(v) for v in ((0.0, -hd, h), (0.0, hd, h))]
    bm.faces.new(base[::-1])
    bm.faces.new((base[0], base[1], rt[0]))
    bm.faces.new((base[2], base[3], rt[1]))
    bm.faces.new((base[1], base[2], rt[1], rt[0]))
    bm.faces.new((base[3], base[0], rt[0], rt[1]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    o.location = loc
    o.rotation_euler = Euler([R(a) for a in rot], 'XYZ')
    link(o)
    if mat:
        o.data.materials.append(mat)
    return o


def drift(name, loc, size, mat=None, rot=(0, 0, 0), clamp=True):
    """雪堆：压扁的球（可非等比）。size = (x, y, z) 外形尺寸。

    clamp=True 时自动把雪堆收进底座范围内，避免出现"悬空的白色圆盘"。
    """
    x, y, z = loc
    hx = min(size[0] / 2.0, 4.0)
    hy = min(size[1] / 2.0, 4.0)
    lim = PLINTH_W / 2.0 - 0.35
    if clamp:
        x = max(-lim + hx, min(lim - hx, x))
        y = max(-lim + hy, min(lim - hy, y))
    o = sphere(name, 1.0, loc=(x, y, z), scale=(hx, hy, size[2] / 2.0),
               mat=mat or MAT['snow'], seg=20, ring=12, rot=rot)
    return o


def gable_body(name, bw, bd, tw, td, h, rise, ridge_x, mat):
    """上宽下窄 + 山墙（屋脊沿局部 Y 轴，可偏移）的封闭体。"""
    bm = bmesh.new()
    hb, hd, ht, htd = bw / 2, bd / 2, tw / 2, td / 2
    vs = [(-hb, -hd, 0), (hb, -hd, 0), (hb, hd, 0), (-hb, hd, 0),
          (-ht, -htd, h), (ht, -htd, h), (ht, htd, h), (-ht, htd, h)]
    vt = [bm.verts.new(v) for v in vs]
    r0 = bm.verts.new((ridge_x, -htd, h + rise))
    r1 = bm.verts.new((ridge_x, htd, h + rise))
    b, t = vt[:4], vt[4:]
    faces = [(b[0], b[1], t[1], t[0]), (b[1], b[2], t[2], t[1]),
             (b[2], b[3], t[3], t[2]), (b[3], b[0], t[0], t[3]),
             (t[0], t[1], t[2], t[3]), (t[0], t[1], r0), (t[2], t[3], r1)]
    for f in faces:
        bm.faces.new(f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    link(o)
    o.data.materials.append(mat)
    return o


def join(objs, name):
    objs = [o for o in objs if o and o.name in bpy.data.objects]
    if not objs:
        return None
    for o in bpy.context.selected_objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    return o


def parent_to(objs, empty_name, loc=(0, 0, 0), rot=(0, 0, 0)):
    e = bpy.data.objects.new(empty_name, None)
    link(e)
    e.location = loc
    e.rotation_euler = Euler([R(a) for a in rot], 'XYZ')
    for o in objs:
        if o.parent is None:
            o.parent = e
    return e


# ---------------------------------------------------------------- house walls
def _k():
    kx = (TW - BW) / 2.0 / WALL_H
    ky = (TD - BD) / 2.0 / WALL_H
    return kx, ky


def wall_pt(wall, z, u, off=0.0):
    """墙面上一点（局部坐标）：wall ∈ '-Y','+Y','+X','-X'，u 沿墙面水平轴，off 沿外法线。

    返回 (loc, rot_degrees)。坐标系约定：
      局部 X = 墙面水平轴（宽）
      局部 Y = 墙面外法线（含外倾；盒子深度方向）
      局部 Z = 向上（含外倾，盒子高度方向）
    用矩阵显式构造再转欧拉角，避免 ±X 面宽/深错位。
    """
    kx, ky = _k()
    if wall == '-Y':
        ax = (-1.0, 0.0, 0.0)
        nv = Vector((0.0, -1.0, -ky)).normalized()
        zv = Vector((0.0, -ky, 1.0)).normalized()
        sp = Vector((u, -(BD / 2.0 + ky * z), z))
    elif wall == '+Y':
        ax = (1.0, 0.0, 0.0)
        nv = Vector((0.0, 1.0, -ky)).normalized()
        zv = Vector((0.0, ky, 1.0)).normalized()
        sp = Vector((u, (BD / 2.0 + ky * z), z))
    elif wall == '+X':
        ax = (0.0, -1.0, 0.0)
        nv = Vector((1.0, 0.0, -kx)).normalized()
        zv = Vector((kx, 0.0, 1.0)).normalized()
        sp = Vector((BW / 2.0 + kx * z, u, z))
    elif wall == '-X':
        ax = (0.0, 1.0, 0.0)
        nv = Vector((-1.0, 0.0, -kx)).normalized()
        zv = Vector((-kx, 0.0, 1.0)).normalized()
        sp = Vector((-(BW / 2.0 + kx * z), u, z))
    else:
        raise ValueError("unknown wall %r" % (wall,))
    m = Matrix((ax, tuple(nv), tuple(zv))).transposed()
    rot = tuple(math.degrees(a) for a in m.to_euler('XYZ'))
    return tuple(sp + nv * off), rot


def window(name, wall, u, z, w, h, mull=(1, 1), glow=None, frame_mat=None, out=0.0):
    """带框的发光窗（贴在倾斜墙面上）。"""
    glow = glow or MAT['glow']
    frame_mat = frame_mat or MAT['timber']
    parts = []
    loc, rot = wall_pt(wall, z, u, out + 0.02)
    parts.append(box(name + "_frame", (w + 0.20, 0.16, h + 0.20), loc, rot, frame_mat,
                     bevel=0.03, seg=2))
    loc, rot = wall_pt(wall, z, u, out + 0.09)
    parts.append(box(name + "_glass", (w, 0.10, h), loc, rot, glow))
    nv, nh = mull
    for i in range(nv):
        uu = u - w / 2.0 + w * (i + 1) / (nv + 1.0)
        loc, rot = wall_pt(wall, z, uu, out + 0.135)
        parts.append(box(name + "_mv%d" % i, (0.055, 0.06, h), loc, rot, frame_mat))
    for j in range(nh):
        zz = z - h / 2.0 + h * (j + 1) / (nh + 1.0)
        loc, rot = wall_pt(wall, zz, u, out + 0.135)
        parts.append(box(name + "_mh%d" % j, (w, 0.06, 0.055), loc, rot, frame_mat))
    # 窗台积雪
    loc, rot = wall_pt(wall, z - h / 2.0 - 0.05, u, out + 0.12)
    parts.append(box(name + "_sill", (w + 0.16, 0.26, 0.12), loc, rot, MAT['snow'],
                     bevel=0.06, seg=3))
    return join(parts, name)


def build_house():
    """返回房屋局部坐标下的所有物体列表（局部原点＝石台上表面中心）。"""
    objs = []
    # ---- 屋脚窄石台（压在雪里，外倾体量悬在它上）
    objs.append(box("BasePad", (PAD_W, PAD_D, 0.50), (0, 0, -0.22),
                    mat=MAT['stone'], bevel=0.10, seg=2))
    objs.append(box("BasePadSnow", (PAD_W + 0.10, PAD_D + 0.10, 0.12), (0, 0, 0.05),
                    mat=MAT['snow'], bevel=0.10, seg=4, limit='NONE'))
    # 入口石阶（正面 -Y，朝院子）
    objs.append(box("StepStone", (2.35, 1.15, 0.34), (0.95, -(PAD_D / 2.0 + 0.30), 0.0),
                    mat=MAT['stone'], bevel=0.07, seg=2))
    objs.append(box("StepStoneSnow", (2.45, 1.25, 0.11), (0.95, -(PAD_D / 2.0 + 0.30), 0.145),
                    mat=MAT['snow'], bevel=0.06, seg=3, limit='NONE'))
    objs.append(box("StepSlab", (1.42, 0.86, 0.30), (0.95, -(PAD_D / 2.0 + 1.30), 0.02),
                    mat=MAT['stone_face'], bevel=0.06, seg=2))

    # ---- 主体：上宽下窄的木屋（屋脊偏移 → 不对称双坡）
    z0 = 0.0
    body = gable_body("HouseBody", BW, BD, TW, TD, WALL_H, RISE, RIDGE_X, MAT['timber'])
    body.location = (0, 0, z0)
    objs.append(body)

    # 墙脚浅色木裙线（把倾斜体量"收边"，也让倾斜看得更清楚）
    for wall, ln in (('-Y', TW), ('+Y', TW), ('+X', TD), ('-X', TD)):
        loc, rot = wall_pt(wall, 0.40, 0.0, 0.05)
        objs.append(box("Skirt" + wall, (ln * 0.97, 0.10, 0.18), loc, rot,
                        MAT['timber_warm']))

    z0 = 0.0  # 墙体基准高（＝雪面）

    # ---- 门窗
    # 正立面（-Y 山墙）：门 + 大窗 + 山尖高窗
    dw, dh, dz = 1.15, 2.00, 1.30
    loc, rot = wall_pt('-Y', dz, 0.95, 0.02)
    objs.append(box("Door", (dw, 0.20, dh), loc, rot, MAT['accent'], bevel=0.03))
    loc, rot = wall_pt('-Y', dz, 0.95, 0.12)
    objs.append(box("DoorSplit", (0.06, 0.06, dh * 0.96), loc, rot, MAT['timber']))
    loc, rot = wall_pt('-Y', dz + 0.35, 0.95 + dw / 2.0 + 0.20, 0.10)
    objs.append(box("DoorLamp", (0.16, 0.14, 0.42), loc, rot, MAT['glow']))
    loc, rot = wall_pt('-Y', dz + 0.62, 0.95 + dw / 2.0 + 0.20, 0.06)
    objs.append(box("DoorLampCap", (0.30, 0.26, 0.10), loc, rot, MAT['snow'],
                    bevel=0.04, seg=3))
    objs.append(window("WinFront", '-Y', -1.05, 1.85, 2.10, 1.55, (1, 1)))
    # 山尖高窗（山墙是竖直面，随脊线偏移居中）
    gx = RIDGE_X * 0.5
    objs.append(box("GableFrame", (1.70, 0.16, 1.15), (gx, -(TD / 2.0 + 0.02),
                                                       WALL_H + 0.78), (0, 0, 0),
                    MAT['timber'], bevel=0.04))
    objs.append(box("GableGlass", (1.46, 0.10, 0.91), (gx, -(TD / 2.0 + 0.09),
                                                       WALL_H + 0.78), (0, 0, 0),
                    MAT['glow_soft']))
    objs.append(box("GableMull", (0.07, 0.06, 0.91), (gx, -(TD / 2.0 + 0.15),
                                                      WALL_H + 0.78), (0, 0, 0),
                    MAT['timber']))
    objs.append(box("GableSill", (1.95, 0.30, 0.12), (gx, -(TD / 2.0 + 0.13),
                                                      WALL_H + 0.16), (0, 0, 0),
                    MAT['snow'], bevel=0.05, seg=3))
    # 侧立面（+X）两扇窗 + 高侧窗
    objs.append(window("WinR1", '+X', -1.15, 1.80, 1.55, 1.45, (1, 1)))
    objs.append(window("WinR2", '+X', 1.15, 1.80, 1.55, 1.45, (1, 1)))
    loc, rot = wall_pt('+X', 2.60, 0.0, 0.10)
    objs.append(box("Clerestory", (3.30, 0.12, 0.34), loc, rot, MAT['glow_soft']))
    loc, rot = wall_pt('+X', 2.60, 0.0, 0.16)
    objs.append(box("ClerestoryFrame", (3.46, 0.10, 0.50), loc, rot, MAT['timber']))
    # 背立面（+Y）
    objs.append(window("WinB1", '+Y', -1.05, 1.80, 1.35, 1.40, (1, 1)))
    objs.append(window("WinB2", '+Y', 1.05, 1.80, 1.35, 1.40, (1, 1)))
    # 左侧（-X）一扇小窗
    objs.append(window("WinL", '-X', 0.30, 2.00, 0.95, 1.30, (0, 1)))

    # ---- 屋面：不对称双坡（脊线偏移到 RIDGE_X）+ 厚雪 + 冰凌
    half = TW / 2.0
    ridge_z = z0 + WALL_H + RISE
    roof_y = TD + 1.10
    eave = {}
    for s, out in ((1, EAVE_P), (-1, EAVE_M)):
        x_w = s * half
        run = abs(x_w - RIDGE_X)
        k = RISE / run
        theta = math.atan(k)
        x_e = x_w + s * out
        z_e = z0 + WALL_H - out * k
        L = math.hypot(x_e - RIDGE_X, ridge_z - z_e)
        mid = ((RIDGE_X + x_e) / 2.0, 0.0, (ridge_z + z_e) / 2.0)
        nrm = (math.sin(theta) * s, 0.0, math.cos(theta))
        objs.append(box("RoofPlate%d" % s, (L, roof_y, 0.18), mid,
                        (0, s * math.degrees(theta), 0), MAT['metal']))
        cloc = (mid[0] + nrm[0] * 0.28, 0.0, mid[2] + nrm[2] * 0.28)
        objs.append(box("RoofSnow%d" % s, (L + 0.14, roof_y + 0.36, 0.32), cloc,
                        (0, s * math.degrees(theta), 0), MAT['snow'],
                        bevel=0.06, seg=3, limit='NONE'))
        eave[s] = (x_e, z_e, k)
    objs.append(box("RidgeSnow", (0.85, roof_y + 0.30, 0.34), (RIDGE_X, 0, ridge_z + 0.10),
                    MAT['snow'], bevel=0.06, seg=3, limit='NONE'))

    # ---- 老虎窗（打破大片白屋面的沉闷，同时给屋面添一个暖光点）
    xe_d, ze_d, k_d = eave[1]
    dx_, dy_ = 1.52, 1.42
    dz_ = ze_d + k_d * (xe_d - dx_)                # 该处屋面高度
    objs.append(box("DormerBody", (0.94, 1.12, 0.92), (dx_, dy_, dz_ + 0.30),
                    MAT['timber'], bevel=0.03))
    objs.append(box("DormerWinFrame", (0.11, 0.80, 0.66), (dx_ + 0.44, dy_, dz_ + 0.34),
                    MAT['timber']))
    objs.append(box("DormerWin", (0.09, 0.62, 0.50), (dx_ + 0.48, dy_, dz_ + 0.34),
                    MAT['glow']))
    objs.append(box("DormerWinSill", (0.26, 0.74, 0.11), (dx_ + 0.56, dy_, dz_ + 0.02),
                    MAT['snow'], bevel=0.04, seg=3, limit='NONE'))
    objs.append(prism("DormerRoof", 1.30, 1.34, 0.46, (dx_ + 0.06, dy_, dz_ + 0.74),
                      mat=MAT['timber']))
    objs.append(box("DormerSnowA", (0.92, 1.36, 0.16), (dx_ - 0.32, dy_, dz_ + 1.05),
                    (0, -35, 0), MAT['snow'], bevel=0.06, seg=3, limit='NONE'))
    objs.append(box("DormerSnowB", (0.92, 1.36, 0.16), (dx_ + 0.44, dy_, dz_ + 1.05),
                    (0, 35, 0), MAT['snow'], bevel=0.06, seg=3, limit='NONE'))

    # 檐口冰凌（深出檐侧 + 山墙檐口）
    rnd = random.Random(7)
    xe_p, ze_p, k_p = eave[1]
    for i in range(10):
        y = -roof_y / 2.0 + 0.40 + (roof_y - 0.8) * i / 9.0
        L = 0.20 + rnd.random() * 0.30
        objs.append(cone("IcicleR%d" % i, 0.048, 0.004, L,
                         (xe_p - 0.14, y, ze_p + 0.03 - L / 2.0), (180, 0, 0),
                         MAT['ice_pale'], verts=7))
    for i in range(5):
        xx = xe_p - 0.30 - 0.62 * i
        zz = ridge_z - k_p * (xx - RIDGE_X)
        L = 0.18 + rnd.random() * 0.26
        objs.append(cone("IcicleF%d" % i, 0.045, 0.004, L,
                         (xx, -(roof_y / 2.0 + 0.30), zz + 0.06 - L / 2.0), (180, 0, 0),
                         MAT['ice_pale'], verts=7))

    # ---- 烟囱 + 烟
    ch_x, ch_y = 1.50, -0.85
    objs.append(box("Chimney", (0.62, 0.62, 5.55), (ch_x, ch_y, 2.775 - 0.05),
                    MAT['brick'], bevel=0.04))
    objs.append(box("ChimneyCap", (0.88, 0.88, 0.22), (ch_x, ch_y, 5.58),
                    MAT['snow'], bevel=0.10, seg=4, limit='NONE'))
    for i, (dz, r, dx, dy) in enumerate([(0.30, 0.30, 0.0, 0.0),
                                         (0.75, 0.42, 0.10, -0.16),
                                         (1.30, 0.55, 0.24, -0.38),
                                         (1.95, 0.68, 0.44, -0.66),
                                         (2.70, 0.80, 0.70, -1.00)]):
        objs.append(sphere("Smoke%d" % i, r, (ch_x + dx, ch_y + dy, 5.72 + dz),
                           (1.0, 1.0, 0.85), MAT['smoke'], seg=16, ring=10))

    # ---- 门廊雨篷（只罩住入口，避免横扫整面墙）
    cw = 2.15
    cloc, crot = wall_pt('-Y', 2.42, 0.95, 0.0)
    cy = cloc[1] - 0.46
    objs.append(box("Canopy", (cw, 0.95, 0.13), (0.95, cy, 2.24), MAT['ember_wood'],
                    bevel=0.03))
    objs.append(box("CanopySnow", (cw + 0.10, 1.05, 0.24), (0.95, cy, 2.39),
                    MAT['snow'], bevel=0.11, seg=4, limit='NONE'))
    for u in (0.95 - cw / 2.0 + 0.16, 0.95 + cw / 2.0 - 0.16):
        objs.append(cyl("PorchPost%.1f" % u, 0.070, 2.30, (u, cy - 0.38, 1.17),
                        mat=MAT['ember_wood'], verts=10))
    # ---- 门边柴火堆
    for i in range(4):
        for j in range(3):
            objs.append(cyl("Log%d%d" % (i, j), 0.085, 0.95,
                            (2.55 + j * 0.17, -2.05, 0.30 + i * 0.16),
                            rot=(0, 90, 0), mat=MAT['ember_wood'], verts=7))
    objs.append(box("LogPileSnow", (1.15, 0.60, 0.16), (2.55, -2.05, 0.78),
                    MAT['snow'], bevel=0.07, seg=3, limit='NONE'))
    # ---- 屋脚雪堆
    for dx, dy, sx, sy in ((-2.55, -2.45, 3.0, 2.4), (2.65, -2.35, 2.8, 2.2),
                           (2.95, 2.55, 2.6, 2.2), (-2.85, 2.65, 3.0, 2.4),
                           (0.10, -2.95, 3.4, 1.8)):
        objs.append(drift("HouseDrift%.1f_%.1f" % (dx, dy), (dx, dy, 0.05),
                          (sx, sy, 0.13), MAT['snow']))
    return objs


def build_tower():
    """独立玻璃瞭望塔（院子里的发光体）局部坐标；原点＝石台上表面中心。"""
    objs = []
    cx, cy = 4.85, 2.35
    w = 1.45           # 玻璃体量宽
    base_top = 0.42
    h = 5.65           # 玻璃体量高
    top = base_top + h
    objs.append(box("TowerBase", (1.85, 1.85, 1.00), (cx, cy, base_top - 0.50),
                    MAT['stone_face'], bevel=0.06))
    objs.append(box("TowerGlass", (w, w, h), (cx, cy, base_top + h / 2.0),
                    MAT['glow_soft']))
    for sx in (-1, 1):
        for sy in (-1, 1):
            objs.append(box("TowerPost%d%d" % (sx, sy), (0.19, 0.19, h),
                            (cx + sx * w / 2.0, cy + sy * w / 2.0,
                             base_top + h / 2.0), (0, 0, 0), MAT['metal']))
    for k, zz in enumerate((base_top + 1.95, base_top + 3.95, top - 0.08)):
        objs.append(box("TowerBand%d" % k, (w + 0.20, w + 0.20, 0.16),
                        (cx, cy, zz), MAT['metal']))
    # 竖向分格（可见的 -Y / +X 两面）
    for u in (-0.38, 0.38):
        objs.append(box("TowerMullY%.2f" % u, (0.06, 0.10, h),
                        (cx + u, cy - w / 2.0 - 0.02, base_top + h / 2.0), (0, 0, 0),
                        MAT['metal']))
        objs.append(box("TowerMullX%.2f" % u, (0.10, 0.06, h),
                        (cx + w / 2.0 + 0.02, cy + u, base_top + h / 2.0), (0, 0, 0),
                        MAT['metal']))
    # 顶部单坡雪帽
    cap = (1.98, 1.98, 0.18)
    objs.append(box("TowerCap", cap, (cx, cy, top + 0.14), (0, 8, 0), MAT['metal']))
    objs.append(box("TowerCapSnow", (cap[0] + 0.10, cap[1] + 0.10, 0.32),
                    (cx, cy - 0.02, top + 0.38), (0, 8, 0), MAT['snow'],
                    bevel=0.15, seg=4, limit='NONE'))
    # 塔门 + 台阶 + 门口灯
    objs.append(box("TowerDoor", (0.85, 0.16, 1.55), (cx, cy - w / 2.0 - 0.04, 1.25),
                    (0, 0, 0), MAT['timber_warm'], bevel=0.03))
    objs.append(box("TowerStep", (1.10, 0.55, 0.30), (cx, cy - w / 2.0 - 0.45, 0.16),
                    MAT['stone'], bevel=0.05))
    objs.append(box("TowerStepSnow", (1.10, 0.55, 0.10), (cx, cy - w / 2.0 - 0.45, 0.32),
                    MAT['snow'], bevel=0.05, seg=3, limit='NONE'))
    objs.append(box("TowerLamp", (0.20, 0.16, 0.34), (cx - 0.62, cy - w / 2.0 - 0.04, 2.35),
                    MAT['glow']))
    objs.append(box("TowerLampCap", (0.34, 0.28, 0.10), (cx - 0.62, cy - w / 2.0 - 0.06, 2.58),
                    MAT['snow'], bevel=0.04, seg=3))
    for dx, dy, sx, sy in ((-1.05, -1.15, 1.9, 1.7), (1.15, -1.10, 1.8, 1.6),
                           (1.15, 1.20, 1.8, 1.7), (-1.10, 1.15, 1.9, 1.7)):
        objs.append(drift("TowerDrift%.1f_%.1f" % (dx, dy), (cx + dx, cy + dy, 0.05),
                          (sx, sy, 0.12), MAT['snow']))
    return objs


# ---------------------------------------------------------------- helpers
def rot_off(x, y, ang_deg, dx, dy):
    """在 (x,y) 处按 ang_deg 旋转的局部偏移 (dx,dy) → 世界坐标。"""
    a = R(ang_deg)
    c, s = math.cos(a), math.sin(a)
    return (x + dx * c - dy * s, y + dx * s + dy * c)


def house_world(p):
    return rot_off(HOUSE_POS[0], HOUSE_POS[1], HOUSE_ROT, p[0], p[1])


PATH_DIR = None
PATH_PER = None


def path_pt(t, side=0.0):
    """院落小径参数点：t ＝ 距门的距离（米），side ＝ 侧向偏移。"""
    d = PATH_DIR
    p = PATH_PER
    o = house_world((0.95, -(BD / 2.0 + 0.55)))
    return (o[0] + d[0] * t + p[0] * side, o[1] + d[1] * t + p[1] * side)


def init_path():
    global PATH_DIR, PATH_PER
    a = R(HOUSE_ROT)
    PATH_DIR = (-math.sin(a), -math.cos(a))                 # 局部 -Y 的世界方向
    PATH_PER = (-PATH_DIR[1], PATH_DIR[0])


# ---------------------------------------------------------------- trees
def fir(name, x, y, h, seed=0, tiers=5, base_r=None, ground=None):
    rnd = random.Random(seed)
    g = GROUND if ground is None else ground
    objs = []
    objs.append(cyl(name + "_trunk", 0.055 * h / 4.6, 0.9, (x, y, g - 0.10),
                    mat=MAT['ember_wood'], verts=8))
    base_r = base_r or h * 0.285
    zb0 = g - 0.28
    hh = h - zb0
    for i in range(tiers):
        f = i / (tiers - 1.0)
        r1 = base_r * (1.0 - 0.76 * f)
        zb = zb0 + hh * 0.60 * f
        dh = hh * 0.54 * (1.0 - 0.22 * f)
        objs.append(cone("%s_t%d" % (name, i), r1, r1 * 0.14, dh, (x, y, zb + dh / 2.0),
                         mat=MAT['fir'], verts=22))
        sr = r1 * (0.50 + 0.16 * f) * 1.05
        sd = dh * (0.50 + 0.16 * f)
        objs.append(cone("%s_s%d" % (name, i), sr, sr * 0.06, sd,
                         (x, y, zb + dh * (1.0 - (0.50 + 0.16 * f)) + sd / 2.0),
                         mat=MAT['snow'], verts=22))
    objs.append(drift(name + "_drift", (x, y, g - 0.06), (base_r * 2.3, base_r * 2.3, 0.30),
                      MAT['snow']))
    return join(objs, name)


def birch(name, x, y, h, seed=0, ground=None):
    """冬季白桦：细白主干 + 两级分枝 + 枝头小雪团（要"真正的树冠"，不能是天线）。"""
    rnd = random.Random(seed)
    g = GROUND if ground is None else ground
    objs = []
    lean = rnd.uniform(1.5, 4.0)
    objs.append(cone(name + "_trunk", 0.085, 0.045, h,
                     (x, y, g + h / 2.0 - 0.20), (rnd.uniform(-1, 1), rnd.uniform(-1, 1), 0),
                     MAT['birch'], verts=12))
    tips = []
    for i in range(5):
        f = 0.44 + 0.085 * i
        az = rnd.uniform(0, 360)
        el = rnd.uniform(42, 72)
        bl = h * rnd.uniform(0.30, 0.46)
        du = Vector((math.cos(R(az)) * math.cos(R(el)),
                     math.sin(R(az)) * math.cos(R(el)), math.sin(R(el))))
        start = Vector((x, y, g - 0.20 + h * f))
        b = cyl("%s_b%d" % (name, i), 0.030, bl, tuple(start + du * (bl / 2.0)),
                mat=MAT['birch'], verts=7)
        b.rotation_euler = du.to_track_quat('Z', 'Y').to_euler()
        tips.append((start + du * bl, du, bl))
        # 二级分枝
        for j in range(2):
            az2 = az + rnd.uniform(-70, 70)
            el2 = el * rnd.uniform(0.62, 0.95)
            sl = bl * rnd.uniform(0.36, 0.55)
            du2 = Vector((math.cos(R(az2)) * math.cos(R(el2)),
                          math.sin(R(az2)) * math.cos(R(el2)), math.sin(R(el2))))
            st2 = start + du * bl * rnd.uniform(0.45, 0.62)
            b2 = cyl("%s_b%d_%d" % (name, i, j), 0.017, sl, tuple(st2 + du2 * (sl / 2.0)),
                     mat=MAT['birch'], verts=7)
            b2.rotation_euler = du2.to_track_quat('Z', 'Y').to_euler()
            tips.append((st2 + du2 * sl, du2, sl))
    for k, (tip, du, bl) in enumerate(tips):
        r = 0.045 + rnd.random() * 0.03
        objs.append(sphere("%s_s%d" % (name, k), r,
                           (tip.x - du.x * 0.06, tip.y - du.y * 0.06, tip.z),
                           (1.6, 1.6, 0.55), MAT['snow'], seg=12, ring=8))
    objs.append(drift(name + "_drift", (x, y, g - 0.06), (1.5, 1.5, 0.16), MAT['snow']))
    return join(objs, name)


def snow_bush(name, x, y, r=0.75, seed=0, ground=None):
    """被雪盖住的灌木：几团雪堆 + 几根深色枝梢。"""
    rnd = random.Random(seed)
    g = GROUND if ground is None else ground
    objs = []
    for i in range(4):
        a, rr = rnd.uniform(0, 360), r * rnd.uniform(0.0, 0.5)
        objs.append(sphere("%s_m%d" % (name, i), r * rnd.uniform(0.42, 0.62),
                           (x + math.cos(R(a)) * rr, y + math.sin(R(a)) * rr,
                            g + r * rnd.uniform(0.16, 0.30)),
                           (1.25, 1.25, 0.85), MAT['snow'], seg=16, ring=10))
    for i in range(5):
        a = rnd.uniform(0, 360)
        el = rnd.uniform(45, 80)
        ln = r * rnd.uniform(0.5, 0.95)
        du = Vector((math.cos(R(a)) * math.cos(R(el)), math.sin(R(a)) * math.cos(R(el)),
                     math.sin(R(el))))
        st = Vector((x, y, g + r * 0.30))
        objs.append(cyl("%s_t%d" % (name, i), 0.016, ln, tuple(st + du * (ln / 2.0)),
                        mat=MAT['ember_wood'], verts=6))
    return join(objs, name)


# ---------------------------------------------------------------- ground
def build_ground():
    objs = []
    objs.append(box("PlinthFoot", (PLINTH_W + 0.55, PLINTH_W + 0.55, 0.22),
                    (0, 0, -PLINTH_T - 0.08), mat=MAT['stone'], bevel=0.28, seg=14,
                    limit='NONE', smooth_angle=48.0))
    objs.append(box("Plinth", (PLINTH_W, PLINTH_W, PLINTH_T), (0, 0, -PLINTH_T / 2.0),
                    mat=MAT['stone'], bevel=PLINTH_BEV, seg=22, limit='NONE',
                    smooth_angle=48.0))
    snow = box("SnowBlanket", (PLINTH_W - 0.55, PLINTH_W - 0.55, 0.30),
               (0, 0, -0.02), mat=MAT['snow'], bevel=0.44, seg=14, limit='NONE')
    # 雪面起伏：细分 + 噪声置换（只作用在顶面，避免把底座边缘也搞成波浪）
    sub = snow.modifiers.new("Sub", 'SUBSURF')
    sub.subdivision_type = 'SIMPLE'
    sub.levels = sub.render_levels = 3
    vg = snow.vertex_groups.new(name="SnowTop")
    vg.add([v.index for v in snow.data.vertices if v.co.z > 0.0], 1.0, 'REPLACE')
    tex = bpy.data.textures.new("SnowNoise", type='CLOUDS')
    tex.noise_scale = 3.4
    tex.noise_depth = 2
    dsp = snow.modifiers.new("Displace", 'DISPLACE')
    dsp.texture = tex
    dsp.texture_coords = 'GLOBAL'
    dsp.strength = 0.18
    dsp.mid_level = 0.5
    dsp.vertex_group = "SnowTop"
    smooth(snow, 62.0)
    objs.append(snow)
    rnd = random.Random(3)
    for i in range(0):
        a = 0.9 + 1.05 * i + rnd.uniform(-0.12, 0.12)
        rr = rnd.uniform(2.6, 4.4)
        sx = rnd.uniform(1.6, 2.6)
        sy = rnd.uniform(1.3, 2.1)
        objs.append(drift("Drift%d" % i, (rr * math.cos(a), rr * math.sin(a), 0.05),
                          (sx, sy, rnd.uniform(0.05, 0.09)), MAT['snow']))
    for i, (x, y, r) in enumerate([(-5.20, -4.60, 0.52), (5.05, -4.35, 0.42),
                                   (-1.90, 5.25, 0.46), (5.05, 4.65, 0.48),
                                   (1.10, -5.55, 0.38)]):
        objs.append(sphere("Rock%d" % i, r, (x, y, 0.02), (1.25, 0.95, 0.72),
                           MAT['rock'], seg=14, ring=10))
    return objs


# ---------------------------------------------------------------- yard
def build_yard():
    objs = []

    # ---- 冰湖
    px, py, prx, pry = -4.00, -3.90, 1.80, 1.45
    objs.append(cyl("PondRim", 1.0, 0.10, (px, py, SNOW_TOP - 0.02), mat=MAT['ice_pale'],
                    verts=48))
    objs[-1].scale = (prx * 1.05, pry * 1.05, 1.0)
    objs.append(cyl("Pond", 1.0, 0.06, (px, py, SNOW_TOP + 0.02), mat=MAT['ice'], verts=48))
    objs[-1].scale = (prx, pry, 1.0)
    for o in objs[-2:]:
        apply_scale(o)
    rnd = random.Random(11)
    for i in range(7):
        a = rnd.uniform(0, 6.28)
        rr = rnd.uniform(0.15, 0.8)
        L = rnd.uniform(0.9, 2.4)
        objs.append(box("Crack%d" % i, (L, 0.035, 0.02),
                        (px + math.cos(a) * rr * prx, py + math.sin(a) * rr * pry,
                         SNOW_TOP + 0.055), (0, 0, rnd.uniform(0, 180)), MAT['ice_pale']))
    objs.append(cyl("FishingHole", 0.24, 0.05, (px + 0.95, py - 0.35, SNOW_TOP + 0.05),
                    mat=MAT['stone'], verts=24))
    for i, (dx, dy, s) in enumerate([(-0.85, 0.50, 0.55), (0.55, -0.85, 0.42)]):
        objs.append(drift("PondSnow%d" % i, (px + dx, py + dy, SNOW_TOP + 0.05),
                          (s, s * 0.7, 0.10), MAT['snow']))

    # ---- 小径：踏步石 + 脚印
    for i in range(7):
        t = 1.00 + i * 0.52
        side = math.sin(i * 0.9) * 0.14
        x, y = path_pt(t, side)
        objs.append(cyl("Stone%d" % i, 0.40 - i * 0.012, 0.30, (x, y, SNOW_TOP - 0.06),
                        rot=(0, 0, i * 23.0), mat=MAT['stone_face'], verts=9, bevel=0.05))
        objs.append(drift("StoneSnow%d" % i, (x - 0.05, y - 0.04, SNOW_TOP + 0.15),
                          (0.30, 0.26, 0.06), MAT['snow']))
    for i in range(13):
        t = 1.15 + 0.30 * i
        side = (-0.17 if i % 2 else 0.17) + math.sin(i * 0.9) * 0.10
        x, y = path_pt(t, side)
        p = sphere("Foot%d" % i, 0.16, (x, y, SNOW_TOP + 0.01), (1.25, 1.7, 0.50),
                   MAT['snow_packed'], seg=12, ring=8,
                   rot=(0, 0, math.degrees(math.atan2(PATH_DIR[1], PATH_DIR[0])) + 90))
    # ---- 灯笼柱
    for i, (t, side) in enumerate(((2.30, 1.02), (3.70, -1.05))):
        x, y = path_pt(t, side)
        objs.append(cyl("LampPost%d" % i, 0.075, 2.35, (x, y, GROUND + 1.10),
                        mat=MAT['metal'], verts=10))
        objs.append(box("LampHead%d" % i, (0.32, 0.32, 0.42), (x, y, 2.42), MAT['glow']))
        objs.append(box("LampTop%d" % i, (0.44, 0.44, 0.12), (x, y, 2.68), MAT['metal']))
        objs.append(box("LampSnow%d" % i, (0.50, 0.50, 0.16), (x, y, 2.79), MAT['snow'],
                        bevel=0.07, seg=3, limit='NONE'))
        objs.append(drift("LampDrift%d" % i, (x, y, GROUND - 0.02), (1.0, 1.0, 0.20),
                          MAT['snow']))

    # ---- 火塘（石圈 + 炭 + 木柴）
    fx, fy = 2.90, -4.20
    for i in range(10):
        a = 2 * math.pi * i / 10.0
        objs.append(sphere("PitStone%d" % i, 0.155,
                           (fx + math.cos(a) * 0.66, fy + math.sin(a) * 0.66, 0.16),
                           (1.1, 1.0, 0.72), MAT['rock'], seg=12, ring=8,
                           rot=(0, 0, math.degrees(a))))
    for i in range(7):
        a = 2 * math.pi * i / 7.0 + 0.4
        objs.append(sphere("Ember%d" % i, 0.085,
                           (fx + math.cos(a) * 0.22, fy + math.sin(a) * 0.22, 0.15),
                           (1.0, 1.0, 0.6), MAT['ember'], seg=10, ring=6))
    for i, ang in enumerate((12, 78, 145)):
        objs.append(cyl("PitLog%d" % i, 0.085, 1.05, (fx, fy, 0.30), rot=(0, 90, ang),
                        mat=MAT['ember_wood'], verts=8))
    # ---- 木凳（火塘边）
    for i, (dx, dy, ang) in enumerate(((-1.10, -0.80, -30), (1.05, 0.85, 150))):
        bx, by = fx + dx, fy + dy
        objs.append(cyl("Bench%d" % i, 0.21, 1.75, (bx, by, 0.35), rot=(0, 90, ang),
                        mat=MAT['ember_wood'], verts=10))
        for s in (-0.62, 0.62):
            sx, sy = rot_off(bx, by, ang, 0.0, s)
            objs.append(box("BenchLeg%d_%.1f" % (i, s), (0.34, 0.22, 0.30),
                            (sx, sy, 0.15), (0, 0, ang), MAT['rock']))
        objs.append(box("BenchSnow%d" % i, (1.75, 0.30, 0.14), (bx, by, 0.50),
                        (0, 0, ang), MAT['snow'], bevel=0.06, seg=3, limit='NONE'))

    # ---- 柴垛 + 劈柴墩
    wx, wy = 4.15, -1.85
    for i in range(3):
        for j in range(4):
            objs.append(cyl("WP%d%d" % (i, j), 0.105, 1.15,
                            (wx + (j - 1.5) * 0.235, wy, GROUND + 0.12 + i * 0.20),
                            rot=(90, 0, 0), mat=MAT['ember_wood'], verts=7))
    objs.append(box("WPSnow", (1.05, 1.30, 0.16), (wx, wy, GROUND + 0.66), MAT['snow'],
                    bevel=0.07, seg=3, limit='NONE'))
    objs.append(drift("WPDrift", (wx, wy, GROUND - 0.02), (1.9, 1.7, 0.34), MAT['snow']))
    bx, by = 4.35, -5.30
    objs.append(cyl("Stump", 0.34, 0.72, (bx, by, GROUND + 0.30), mat=MAT['ember_wood'],
                    verts=16))
    objs.append(cyl("StumpSnow", 0.36, 0.10, (bx, by, GROUND + 0.70), mat=MAT['snow'],
                    verts=16))
    objs.append(box("AxeHandle", (0.055, 0.055, 0.86), (bx + 0.10, by + 0.04, GROUND + 0.98),
                    (0, -18, 0), MAT['timber_pale']))
    objs.append(box("AxeHead", (0.09, 0.26, 0.17), (bx + 0.23, by + 0.04, GROUND + 0.62),
                    (0, -18, 0), MAT['metal'], bevel=0.02))

    # ---- 雪橇（小径旁，英雄机位看得见）
    sx, sy, sa = 0.85, -4.30, 28.0

    def sled(part, size, dx, dy, dz, rot_extra=(0, 0, 0), mat=None):
        loc = rot_off(sx, sy, sa, dx, dy)
        return box("Sled" + part, size, (loc[0], loc[1], dz),
                   (rot_extra[0], rot_extra[1], sa + rot_extra[2]), mat)

    for k, dx in enumerate((-0.26, 0.26)):
        objs.append(sled("Run%d" % k, (0.07, 1.75, 0.12), dx, 0.0, GROUND + 0.06,
                         (0, 0, 0), MAT['ember_wood']))
    for k, dy in enumerate((-0.60, 0.0, 0.60)):
        objs.append(sled("Slat%d" % k, (0.64, 0.16, 0.06), 0.0, dy, GROUND + 0.16,
                         (0, 0, 0), MAT['accent']))
    for k, dy in enumerate((-0.82, 0.82)):
        objs.append(sled("Post%d" % k, (0.05, 0.05, 0.34), -0.26, dy, GROUND + 0.30,
                         (0, 0, 0), MAT['timber_pale']))
    objs.append(sled("Snow", (0.70, 1.45, 0.10), 0.0, 0.0, GROUND + 0.20,
                     (0, 0, 0), MAT['snow']))

    # ---- 倒木 + 树桩群（左前景）
    lx, ly, la = -2.85, -5.35, 8.0
    objs.append(cyl("FallenLog", 0.24, 2.4, (lx, ly, GROUND + 0.16), rot=(0, 90, la),
                    mat=MAT['ember_wood'], verts=12))
    objs.append(box("FallenLogSnow", (2.4, 0.42, 0.14), (lx, ly, GROUND + 0.36),
                    (0, 0, la), MAT['snow'], bevel=0.07, seg=3, limit='NONE'))
    objs.append(cyl("FallenLogEnd", 0.20, 0.05,
                    (lx + math.cos(R(la)) * 1.20, ly + math.sin(R(la)) * 1.20,
                     GROUND + 0.16), rot=(0, 90, la), mat=MAT['timber_pale'], verts=12))
    # ---- 篱笆（前沿，给院子"收边"，中间留出门洞给小径）
    fx0, fx1, fy = -5.55, 5.55, -5.75
    gap = (0.25, 2.25)
    xs = [fx0]
    while xs[-1] + 1.15 < fx1:
        xs.append(xs[-1] + 1.15)
    xs.append(fx1)
    xs = [x for x in xs if not (gap[0] <= x <= gap[1])]
    for i, x in enumerate(xs):
        gate = (abs(x - gap[0]) < 0.35 or abs(x - gap[1]) < 0.35)
        h = 1.35 if gate else 1.05
        objs.append(box("FencePost%d" % i, (0.115, 0.115, h), (x, fy, GROUND + h / 2.0),
                        (0, 0, 0), MAT['ember_wood']))
        objs.append(box("FencePostSnow%d" % i, (0.20, 0.20, 0.08), (x, fy, GROUND + h + 0.02),
                        (0, 0, 0), MAT['snow'], bevel=0.03, seg=3, limit='NONE'))
    for i in range(len(xs) - 1):
        if xs[i + 1] - xs[i] > 1.5 or (xs[i] < gap[0] < xs[i + 1]):
            continue
        cx = (xs[i] + xs[i + 1]) / 2.0
        ln = xs[i + 1] - xs[i] - 0.12
        for zz in (0.46, 0.86):
            objs.append(box("FenceRail%d_%.2f" % (i, zz), (ln, 0.075, 0.13),
                            (cx, fy, GROUND + zz), (0, 0, 0), MAT['ember_wood']))
        objs.append(box("FenceRailSnow%d" % i, (ln, 0.14, 0.07), (cx, fy, GROUND + 0.95),
                        (0, 0, 0), MAT['snow'], bevel=0.03, seg=3, limit='NONE'))
    for i, x in enumerate((gap[0], gap[1])):
        objs.append(drift("FenceDrift%d" % i, (x, fy, GROUND - 0.03), (1.2, 1.0, 0.26),
                          MAT['snow']))
    return objs


def build_yard_trees():
    objs = []
    fir("FirA", -4.30, 3.30, 4.5, seed=1)
    fir("FirB", -3.05, 4.90, 5.2, seed=2)
    fir("FirC", -5.25, 4.85, 3.1, seed=3)
    fir("FirD", -4.85, 1.35, 2.5, seed=4)
    fir("FirE", 3.70, 5.25, 4.7, seed=5)
    fir("FirF", 5.20, 3.90, 3.5, seed=6)
    fir("FirG", 2.30, 5.55, 2.9, seed=7)
    fir("FirH", 5.55, -3.35, 2.2, seed=8)
    fir("FirI", -5.30, 0.60, 2.6, seed=9)
    fir("FirJ", -1.45, 5.60, 2.4, seed=10)
    birch("BirchA", -5.45, -0.85, 3.8, seed=21)
    birch("BirchB", -1.85, -5.30, 4.2, seed=22)
    snow_bush("BushA", -3.05, -1.35, 0.80, seed=31)
    snow_bush("BushB", -5.15, -1.95, 0.62, seed=32)
    snow_bush("BushC", 1.95, 4.15, 0.70, seed=33)
    return objs


# ---------------------------------------------------------------- world / light / cam
def build_world(strength=0.26, top=(0.045, 0.075, 0.155), hor=(0.34, 0.42, 0.56)):
    """冬季天空：地平线亮带 + 天顶深蓝 + 主光方向的暖晕（避免平涂背景）。"""
    w = bpy.data.worlds.new("WinterSky")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = -1.0
    mr.inputs['From Max'].default_value = 1.0
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    cr = ramp.color_ramp
    cr.elements[0].position = 0.30
    cr.elements[0].color = (0.14, 0.17, 0.22, 1.0)     # 地平线以下（暗）
    cr.elements[1].position = 1.00
    cr.elements[1].color = (top[0], top[1], top[2], 1.0)
    for pos, col in ((0.485, hor), (0.560, (0.235, 0.310, 0.455)),
                     (0.680, (0.115, 0.170, 0.290))):
        el = cr.elements.new(pos)
        el.color = (col[0], col[1], col[2], 1.0)
    nt.links.new(geo.outputs['Incoming'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    nt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])

    # 太阳方向的暖晕
    dot = nt.nodes.new('ShaderNodeVectorMath')
    dot.operation = 'DOT_PRODUCT'
    dot.inputs[1].default_value = (0.52, -0.58, 0.63)
    glm = nt.nodes.new('ShaderNodeMapRange')
    glm.inputs['From Min'].default_value = 0.94
    glm.inputs['From Max'].default_value = 1.0
    glm.inputs['To Min'].default_value = 0.0
    glm.inputs['To Max'].default_value = 1.0
    glm.clamp = True
    gramp = nt.nodes.new('ShaderNodeValToRGB')
    ge = gramp.color_ramp.elements
    ge[0].position = 0.0
    ge[0].color = (0.0, 0.0, 0.0, 1.0)
    ge[1].position = 0.35
    ge[1].color = (0.30, 0.25, 0.27, 1.0)
    ge2 = gramp.color_ramp.elements.new(1.0)
    ge2.color = (1.0, 0.78, 0.50, 1.0)
    nt.links.new(geo.outputs['Incoming'], dot.inputs[0])
    nt.links.new(dot.outputs['Value'], glm.inputs['Value'])
    nt.links.new(glm.outputs['Result'], gramp.inputs['Fac'])

    mix = nt.nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'ADD'
    mix.inputs['Fac'].default_value = 0.55
    nt.links.new(ramp.outputs['Color'], mix.inputs['Color1'])
    nt.links.new(gramp.outputs['Color'], mix.inputs['Color2'])
    nt.links.new(mix.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return w


def sun(name, direction, energy, color, angle=2.0, shadow=True):
    d = Vector(direction).normalized()
    o = bpy.data.objects.new(name, bpy.data.lights.new(name, type='SUN'))
    link(o)
    o.data.energy = energy
    o.data.color = color
    o.data.angle = R(angle)
    o.data.use_shadow = shadow
    o.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return o


def point(name, loc, energy, color, radius=0.4):
    o = bpy.data.objects.new(name, bpy.data.lights.new(name, type='POINT'))
    link(o)
    o.location = loc
    o.data.energy = energy
    o.data.color = color
    o.data.shadow_soft_size = radius
    return o


def aim(obj, target):
    d = Vector(target) - Vector(obj.location)
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def build_lights():
    objs = []
    objs.append(sun("SunKey", (-0.52, 0.58, -0.44), 6.2, (1.0, 0.87, 0.68), angle=1.6))
    objs.append(sun("SunFill", (0.42, -0.30, -0.86), 0.80, (0.72, 0.84, 1.0), angle=25.0,
                    shadow=False))
    # 正面补光（-Y 山墙面正好背对主光，需要单独提亮，否则门脸发黑）
    objs.append(sun("SunFillFront", (-0.30, 0.92, -0.23), 1.05, (0.76, 0.85, 1.0),
                    angle=32.0, shadow=False))
    objs.append(sun("SunRim", (0.30, -0.85, -0.44), 1.4, (0.86, 0.92, 1.0), angle=8.0,
                    shadow=False))
    objs.append(point("FireLight", (2.90, -4.20, 0.62), 30.0, (1.0, 0.50, 0.16), 0.55))
    for i, (t, side) in enumerate(((2.30, 1.02), (3.70, -1.05))):
        p = path_pt(t, side)
        o = point("LampLight%d" % i, (p[0], p[1], 2.12), 11.0, (1.0, 0.66, 0.32), 0.30)
        o.data.use_shadow = False
        objs.append(o)
    tl = house_world((4.85, 0.60)) + (1.15,)
    o = point("TowerLight", tl, 22.0, (1.0, 0.68, 0.38), 0.6)
    o.data.use_shadow = False
    objs.append(o)
    # 窗口暖光在雪地上的 spill
    for i, (lp, e) in enumerate(((house_world((-1.05, -2.80)), 7.0),
                                 (house_world((2.95, -1.05)), 6.0))):
        o = point("Spill%d" % i, (lp[0], lp[1], GROUND + 0.65), e, (1.0, 0.56, 0.24), 0.5)
        o.data.use_shadow = False
        objs.append(o)
    return objs


def add_camera(loc, target, lens=52.0, name="Cam"):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    o = bpy.data.objects.new(name, cd)
    link(o)
    o.location = loc
    aim(o, target)
    bpy.context.scene.camera = o
    return o


def cam_from(az_deg, elev_deg, dist, target=(0, 0, 1.6)):
    a, e = R(az_deg), R(elev_deg)
    d = (math.cos(e) * math.cos(a), math.cos(e) * math.sin(a), math.sin(e))
    p = (target[0] + d[0] * dist, target[1] + d[1] * dist, target[2] + d[2] * dist)
    return p, target


# ---------------------------------------------------------------- assemble
def assemble():
    build_materials()
    init_path()
    root = bpy.data.objects.new("Scene", None)
    link(root)
    objs = {}
    objs['ground'] = build_ground()
    house = build_house() + build_tower()
    parent_to(house, "House", (HOUSE_POS[0], HOUSE_POS[1], SNOW_TOP), (0, 0, HOUSE_ROT))
    objs['house'] = house
    objs['yard'] = build_yard()
    objs['trees'] = build_yard_trees()
    objs['lights'] = build_lights()
    build_world()
    return objs


