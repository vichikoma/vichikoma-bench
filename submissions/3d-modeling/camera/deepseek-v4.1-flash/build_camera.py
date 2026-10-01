"""1970s vintage film SLR camera — fully procedural build + Eevee studio render.

Usage:
  blender -b --factory-startup --python build_camera.py -- <out.blend> <out.png>

Everything (geometry + materials + lighting) is generated with bpy.
No external models / textures / HDRI are imported.
"""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:]
BLEND_PATH = os.path.abspath(argv[0])
PNG_PATH = os.path.abspath(argv[1])
LIGHT_SCALE = float(argv[2]) if len(argv) > 2 else 0.42

R = math.radians
SUBJECT = []          # objects that belong to the camera (used for auto framing)


# ----------------------------------------------------------------------------- scene
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0
    return sc


# ----------------------------------------------------------------------------- materials
def _base_mat(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    return mat, nt, bsdf


def _set(bsdf, key, value):
    if key in bsdf.inputs:
        bsdf.inputs[key].default_value = value


def mat_plain(name, base, metallic=0.0, rough=0.5, spec=0.5, coat=0.0):
    mat, nt, b = _base_mat(name)
    _set(b, 'Base Color', (*base, 1.0))
    _set(b, 'Metallic', metallic)
    _set(b, 'Roughness', rough)
    _set(b, 'Specular IOR Level', spec)
    _set(b, 'Coat Weight', coat)
    return mat


def mat_leather(name="Leather", base=(0.024, 0.024, 0.030), grain=1500.0,
                bump_lo=0.38, bump_hi=0.46, rough=(0.34, 0.60)):
    """Black pebbled leatherette: two-scale procedural bump + roughness variation."""
    mat, nt, b = _base_mat(name)
    _set(b, 'Base Color', (*base, 1.0))
    _set(b, 'Metallic', 0.0)
    _set(b, 'Roughness', 0.5)
    _set(b, 'Specular IOR Level', 0.48)
    _set(b, 'Sheen Weight', 0.18)
    _set(b, 'Sheen Roughness', 0.45)
    tc = nt.nodes.new('ShaderNodeTexCoord')

    # fine grain (noise)
    n1 = nt.nodes.new('ShaderNodeTexNoise')
    n1.inputs['Scale'].default_value = grain
    n1.inputs['Detail'].default_value = 8.0
    n1.inputs['Roughness'].default_value = 0.65
    nt.links.new(tc.outputs['Object'], n1.inputs['Vector'])

    # pebble cells (voronoi F1)
    vor = nt.nodes.new('ShaderNodeTexVoronoi')
    vor.feature = 'F1'
    vor.inputs['Scale'].default_value = grain * 0.60
    if 'Randomness' in vor.inputs:
        vor.inputs['Randomness'].default_value = 0.85
    nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])

    # roughness variation
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[0].color = (rough[0],) * 3 + (1,)
    ramp.color_ramp.elements[1].position = 0.72
    ramp.color_ramp.elements[1].color = (rough[1],) * 3 + (1,)
    nt.links.new(n1.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Roughness'])

    # bump chain: pebbles -> grain
    bp = nt.nodes.new('ShaderNodeBump')
    bp.inputs['Strength'].default_value = bump_hi
    bp.inputs['Distance'].default_value = 0.00030
    nt.links.new(vor.outputs['Distance'], bp.inputs['Height'])

    bg = nt.nodes.new('ShaderNodeBump')
    bg.inputs['Strength'].default_value = bump_lo
    bg.inputs['Distance'].default_value = 0.00010
    nt.links.new(n1.outputs['Fac'], bg.inputs['Height'])
    nt.links.new(bp.outputs['Normal'], bg.inputs['Normal'])
    nt.links.new(bg.outputs['Normal'], b.inputs['Normal'])

    # darken the valleys a touch so the grain reads even in deep shadow
    mix = nt.nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Fac'].default_value = 0.35
    mix.inputs['Color1'].default_value = (*base, 1.0)
    nt.links.new(vor.outputs['Distance'], mix.inputs['Color2'])
    nt.links.new(mix.outputs['Color'], b.inputs['Base Color'])
    return mat


def mat_metal(name, base=(0.78, 0.80, 0.83), rough=0.14, brushed=0.0,
              aniso=0.0, bump=0.0):
    """Chrome / satin metal. `brushed`>0 adds a stretched noise roughness variation."""
    mat, nt, b = _base_mat(name)
    _set(b, 'Base Color', (*base, 1.0))
    _set(b, 'Metallic', 1.0)
    _set(b, 'Roughness', rough)
    _set(b, 'Anisotropic', aniso)
    if brushed <= 0.0:
        return mat
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (1.0, 1.0, 0.02)   # stretch along local Z
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    n = nt.nodes.new('ShaderNodeTexNoise')
    n.inputs['Scale'].default_value = 240.0
    n.inputs['Detail'].default_value = 6.0
    nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (max(rough - brushed * 0.5, 0.03),) * 3 + (1,)
    ramp.color_ramp.elements[1].position = 0.70
    ramp.color_ramp.elements[1].color = (rough + brushed, ) * 3 + (1,)
    nt.links.new(n.outputs['Fac'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Roughness'])
    if bump > 0:
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = bump
        bp.inputs['Distance'].default_value = 0.00015
        nt.links.new(n.outputs['Fac'], bp.inputs['Height'])
        nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return mat


def mat_glass(name="LensGlass", tint=(0.55, 0.62, 1.0), ior=1.55, rough=0.015):
    """Transmissive optical glass with a faint coating tint on the specular."""
    mat, nt, b = _base_mat(name)
    _set(b, 'Base Color', (1.0, 1.0, 1.0, 1.0))
    _set(b, 'Metallic', 0.0)
    _set(b, 'Roughness', rough)
    _set(b, 'IOR', ior)
    _set(b, 'Transmission Weight', 1.0)
    _set(b, 'Specular IOR Level', 0.85)
    _set(b, 'Specular Tint', (*tint, 1.0))
    return mat


def mat_coating(name="LensCoating", col=(0.020, 0.036, 0.090)):
    """Dark blue/violet anti-reflective coating surface behind the front element."""
    mat, nt, b = _base_mat(name)
    _set(b, 'Base Color', (*col, 1.0))
    _set(b, 'Metallic', 0.45)
    _set(b, 'Roughness', 0.15)
    _set(b, 'Specular IOR Level', 0.7)
    _set(b, 'Specular Tint', (0.45, 0.55, 1.0, 1.0))
    return mat


# ----------------------------------------------------------------------------- geometry helpers
def _finish(obj, mat, bev=0.0, segs=2, smooth_axis=None, subject=True):
    if bev > 0:
        m = obj.modifiers.new("Bevel", 'BEVEL')
        m.width = bev
        m.segments = segs
        m.limit_method = 'ANGLE'
        m.angle_limit = R(40)
    if mat is not None:
        obj.data.materials.clear()
        obj.data.materials.append(mat)
    if smooth_axis:
        for p in obj.data.polygons:
            p.use_smooth = abs(getattr(p.normal, smooth_axis)) < 0.55
    if subject:
        SUBJECT.append(obj)
    return obj


def box(name, size, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, bev=0.0015, segs=3):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = (size[0], size[1], size[2])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return _finish(o, mat, bev, segs)


def cyl(name, r, depth, loc=(0, 0, 0), rot=(0, 0, 0), verts=64, mat=None,
        bev=0.0006, segs=2, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth,
                                        location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    return _finish(o, mat, bev, segs, 'z' if smooth else None)


def knurled(name, r, depth, ridges, tooth, loc=(0, 0, 0), rot=(0, 0, 0),
            mat=None, bevel_w=0.0003):
    """Cylinder with a square-wave radial profile = crisp machined knurling."""
    n = ridges * 4
    bpy.ops.mesh.primitive_cylinder_add(vertices=n, radius=r, depth=depth,
                                        location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    for v in o.data.vertices:
        if (v.index % 4) < 2:
            v.co.x *= (r + tooth) / r
            v.co.y *= (r + tooth) / r
    return _finish(o, mat, bevel_w, 1)


def mesh_from(name, verts, faces, loc=(0, 0, 0), mat=None, bev=0.0, segs=2,
              recalc=True, subject=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata([Vector(v) for v in verts], [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    if recalc:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
    return _finish(o, mat, bev, segs, subject=subject)


def prof_solid(name, profile, steps=72, loc=(0, 0, 0), rot=(0, 0, 0), mat=None, subject=True):
    """Revolve a closed 2D profile (r,z pairs) around local Z — rings, bezels, dials."""
    bm = bmesh.new()
    vs = [bm.verts.new((p[0], 0.0, p[1])) for p in profile]
    es = [bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    bmesh.ops.spin(bm, geom=es, axis=(0, 0, 1), cent=(0, 0, 0),
                   dvec=(0, 0, 0), angle=math.tau, steps=steps, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    for p in me.polygons:
        p.use_smooth = abs(p.normal.z) < 0.6 or abs(p.normal.x) < 0.6
    return _finish(o, mat, 0.0, subject=subject)


def lens_part(name, r, depth, y, z_axis, mat, verts=64, bev=0.0006, ring=None):
    """Cylinder whose axis runs along world -Y (the lens optical axis)."""
    return cyl(name, r, depth, loc=(0.0, y, z_axis), rot=(R(90), 0, 0),
               verts=verts, mat=mat, bev=bev)


def text_mesh(name, body, size, loc, rot, mat, extrude=0.00025, spacing=1.0):
    """Procedurally generated lettering (built-in font, converted to mesh)."""
    try:
        cur = bpy.data.curves.new(name, 'FONT')
        cur.body = body
        cur.size = size
        cur.extrude = extrude
        cur.align_x = 'CENTER'
        cur.align_y = 'CENTER'
        cur.space_character = spacing
        ob = bpy.data.objects.new(name, cur)
        bpy.context.collection.objects.link(ob)
        ob.location = loc
        ob.rotation_euler = rot
        for o in bpy.context.selected_objects:
            o.select_set(False)
        bpy.context.view_layer.objects.active = ob
        ob.select_set(True)
        bpy.ops.object.convert(target='MESH')
        ob = bpy.context.active_object
        ob.name = name
        ob.data.materials.append(mat)
        for p in ob.data.polygons:
            p.use_smooth = False
        SUBJECT.append(ob)
        return ob
    except Exception as e:
        print("TEXT_SKIP:", name, e)
        return None


def look_at(obj, target):
    fwd = (Vector(target) - obj.location)
    if fwd.length < 1e-6:
        return
    q = fwd.to_track_quat('-Z', 'Y')
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = q


# ----------------------------------------------------------------------------- build
# World axes:  X = camera width, Y = depth (lens points toward -Y), Z = up, z=0 = table
BODY_HX = 0.072        # body half width
BODY_HY = 0.024        # body half depth
TOP_Z = 0.078          # top surface of the chrome top plate
ZAX = 0.0375           # optical axis height


def build_camera():
    M = {}
    M['leather'] = mat_leather("Leatherette")
    M['chrome'] = mat_metal("Chrome", base=(0.80, 0.82, 0.86), rough=0.115)
    M['satin'] = mat_metal("SatinChrome", base=(0.72, 0.74, 0.78), rough=0.24,
                           brushed=0.09, aniso=0.4, bump=0.12)
    M['black'] = mat_plain("BlackPlastic", (0.023, 0.023, 0.028), 0.0, 0.42, 0.5)
    M['rubber'] = mat_plain("RubberRing", (0.028, 0.028, 0.032), 0.0, 0.66, 0.42)
    M['glass'] = mat_glass("LensGlass")
    M['coat'] = mat_coating("LensCoating")
    M['white'] = mat_plain("WhiteMark", (0.72, 0.72, 0.70), 0.0, 0.35)
    M['red'] = mat_plain("RedDot", (0.45, 0.035, 0.030), 0.0, 0.35)
    M['amber'] = mat_plain("AmberDot", (0.55, 0.32, 0.03), 0.0, 0.35)

    # ---------------------------------------------------------------- body shell
    box("BodyCore", (0.144, 0.048, 0.062), (0, 0, 0.031), mat=M['black'],
        bev=0.0020, segs=3)
    box("TopPlate", (0.146, 0.050, 0.016), (0, 0, 0.070), mat=M['chrome'],
        bev=0.0018, segs=3)
    box("BottomPlate", (0.146, 0.050, 0.009), (0, 0, 0.0045), mat=M['satin'],
        bev=0.0013, segs=3)
    # raised leatherette panels (front pair straddles the lens mount, plus wrap-around)
    for nm, sz, lc in (
        ("LeatherFrontL", (0.032, 0.0018, 0.040), (-0.052, -0.0243, 0.033)),
        ("LeatherFrontR", (0.032, 0.0018, 0.040), (0.052, -0.0243, 0.033)),
        ("LeatherBack", (0.126, 0.0018, 0.040), (0.0, 0.0243, 0.033)),
        ("LeatherSideL", (0.0018, 0.040, 0.040), (-0.0723, 0.0, 0.033)),
        ("LeatherSideR", (0.0018, 0.040, 0.040), (0.0723, 0.0, 0.033)),
    ):
        box(nm, sz, lc, mat=M['leather'], bev=0.0007, segs=2)

    # ---------------------------------------------------------------- lens
    # chrome mount flange
    prof_solid("LensMountFlange", [(0.0275, -0.0045), (0.0340, -0.0045),
                                   (0.0340, 0.0045), (0.0275, 0.0045)],
               steps=96, loc=(0, -0.0245, ZAX), rot=(R(90), 0, 0), mat=M['chrome'])
    lens_part("LensBaseBarrel", 0.0275, 0.0090, -0.0330, ZAX, M['satin'], bev=0.0008)
    knurled("ApertureRing", 0.0265, 0.0110, 64, 0.0011, loc=(0, -0.0435, ZAX),
            rot=(R(90), 0, 0), mat=M['rubber'])
    knurled("FocusRing", 0.0295, 0.0165, 72, 0.0015, loc=(0, -0.0565, ZAX),
            rot=(R(90), 0, 0), mat=M['rubber'])
    lens_part("FrontBarrel", 0.0258, 0.0090, -0.0695, ZAX, M['satin'], bev=0.0008)
    # chrome front bezel (annulus)
    prof_solid("FrontBezel", [(0.0200, -0.0028), (0.0258, -0.0028),
                              (0.0258, 0.0028), (0.0200, 0.0028)],
               steps=96, loc=(0, -0.0765, ZAX), rot=(R(90), 0, 0), mat=M['chrome'])
    prof_solid("BezelLip", [(0.0210, -0.0012), (0.0250, -0.0012),
                            (0.0250, 0.0012), (0.0210, 0.0012)],
               steps=96, loc=(0, -0.0785, ZAX), rot=(R(90), 0, 0), mat=M['satin'])
    # front optical element (convex meniscus) + inner elements seen through it
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=0.0192,
                                         location=(0, -0.0705, ZAX))
    g = bpy.context.active_object
    g.name = "FrontElement"
    g.scale = (1.0, 0.40, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for p in g.data.polygons:
        p.use_smooth = True
    g.data.materials.append(M['glass'])
    SUBJECT.append(g)
    lens_part("IrisRing", 0.0195, 0.0016, -0.0650, ZAX, M['black'], verts=48, bev=0.0002)
    prof_solid("IrisBlades", [(0.0105, -0.0007), (0.0180, -0.0007),
                              (0.0180, 0.0007), (0.0105, 0.0007)],
               steps=64, loc=(0, -0.0662, ZAX), rot=(R(90), 0, 0), mat=M['coat'])
    lens_part("InnerElement1", 0.0172, 0.0022, -0.0580, ZAX, M['coat'], verts=48, bev=0.0003)
    lens_part("InnerElement2", 0.0160, 0.0022, -0.0495, ZAX, M['coat'], verts=48, bev=0.0003)
    # focus index mark + DOF dots on top of the barrel
    box("IndexMark", (0.0016, 0.0075, 0.0008), (0.0, -0.0485, ZAX + 0.0299),
        mat=M['white'], bev=0.0001, segs=1)
    cyl("DotRed", 0.0016, 0.0008, (-0.0068, -0.0565, ZAX + 0.0306), mat=M['red'],
        verts=24, bev=0.0001, segs=1)
    cyl("DotAmber", 0.0016, 0.0008, (0.0068, -0.0565, ZAX + 0.0306), mat=M['amber'],
        verts=24, bev=0.0001, segs=1)

    # ---------------------------------------------------------------- pentaprism + hot shoe
    mesh_from("PrismHump",
              [(-0.023, -0.012, TOP_Z), (0.023, -0.012, TOP_Z),
               (0.023, 0.026, TOP_Z), (-0.023, 0.026, TOP_Z),
               (-0.0165, -0.004, 0.100), (0.0165, -0.004, 0.100),
               (0.0165, 0.021, 0.100), (-0.0165, 0.021, 0.100)],
              [(0, 1, 2, 3), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5),
               (2, 3, 7, 6), (3, 0, 4, 7)],
              mat=M['satin'], bev=0.0018, segs=3)
    # brand nameplate on the prism's slanted front face
    box("NameplatePrism", (0.028, 0.0014, 0.0112), (0, -0.0088, 0.0892),
        rot=(R(-20), 0, 0), mat=M['chrome'], bev=0.0004, segs=2)
    box("NameplateFront", (0.030, 0.0014, 0.0090), (0.0475, -0.0261, 0.0545),
        mat=M['chrome'], bev=0.0004, segs=2)
    # hot shoe: base plate + two rails + centre contact
    box("HotShoeBase", (0.024, 0.0170, 0.0022), (0, 0.0085, 0.1011),
        mat=M['satin'], bev=0.0005, segs=2)
    for sx in (-1, 1):
        box("HotShoeRail%d" % sx, (0.0035, 0.0170, 0.0038),
            (sx * 0.0092, 0.0085, 0.1025), mat=M['chrome'], bev=0.0006, segs=2)
        box("HotShoeLip%d" % sx, (0.0022, 0.0170, 0.0014),
            (sx * 0.0117, 0.0085, 0.1019), mat=M['chrome'], bev=0.0003, segs=1)
    box("HotShoeContact", (0.0060, 0.0085, 0.0014), (0, 0.0085, 0.1033),
        mat=M['chrome'], bev=0.0002, segs=1)

    # ---------------------------------------------------------------- eyepiece (viewfinder)
    box("EyepieceFrame", (0.0232, 0.0026, 0.0140), (0, 0.0238, 0.0882),
        rot=(R(-14), 0, 0), mat=M['satin'], bev=0.0008, segs=3)
    box("EyepieceGlass", (0.0166, 0.0016, 0.0094), (0, 0.0246, 0.0881),
        rot=(R(-14), 0, 0), mat=M['coat'], bev=0.0003, segs=2)
    box("EyepiecePad", (0.0256, 0.0032, 0.0164), (0, 0.0257, 0.0882),
        rot=(R(-14), 0, 0), mat=M['rubber'], bev=0.0014, segs=3)
    # de-smooth the eyecup's coarse facets
    for ob in bpy.data.objects:
        if ob.name == "Eyecup":
            for p in ob.data.polygons:
                p.use_smooth = True

    # brand lettering on the prism nameplate + model badge on the body front
    text_mesh("BrandPrism", "AUREX", 0.0050, (0, -0.0096, 0.0896), (R(70), 0, 0),
              M['black'], extrude=0.00022, spacing=1.12)
    text_mesh("ModelBadge", "FM-2", 0.0032, (0.0475, -0.0271, 0.0545), (R(90), 0, 0),
              M['black'], extrude=0.00018, spacing=1.0)

    # ---------------------------------------------------------------- top deck controls
    # (shutter + advance live on the operator's right = -X; rewind on +X)
    knurled("ShutterDial", 0.0160, 0.0055, 56, 0.0005, loc=(-0.050, 0.001, 0.0808),
            mat=M['chrome'], bevel_w=0.0004)
    cyl("ShutterDialTop", 0.0152, 0.0009, (-0.050, 0.001, 0.0840), mat=M['black'],
        verts=64, bev=0.0002, segs=2)
    cyl("ShutterButton", 0.0056, 0.0055, (-0.050, 0.001, 0.0868), mat=M['chrome'],
        verts=48, bev=0.0009, segs=3)
    cyl("ShutterCollar", 0.0078, 0.0016, (-0.050, 0.001, 0.0846), mat=M['chrome'],
        verts=48, bev=0.0003, segs=2)
    knob_ang = R(27)
    kd = Vector((-math.sin(knob_ang), math.cos(knob_ang)))
    piv = Vector((-0.050, 0.001))
    tip = piv + kd * 0.0385
    box("AdvanceLever", (0.0395, 0.0108, 0.0026),
        ((piv.x + tip.x) / 2, (piv.y + tip.y) / 2, 0.0859),
        rot=(0, R(-9), R(90) + knob_ang), mat=M['satin'], bev=0.0010, segs=3)
    cyl("AdvanceLeverHub", 0.0128, 0.0032, (-0.050, 0.001, 0.0854), mat=M['satin'],
        verts=64, bev=0.0006, segs=2)
    cyl("AdvanceLeverTip", 0.0048, 0.0024, (tip.x, tip.y, 0.0859), mat=M['rubber'],
        verts=32, bev=0.0006, segs=2)
    box("AdvanceLeverThumb", (0.0110, 0.0060, 0.0016),
        (tip.x + kd.x * 0.0085, tip.y + kd.y * 0.0085, 0.0872),
        rot=(0, 0, R(90) + knob_ang), mat=M['black'], bev=0.0004, segs=2)
    # engraved shutter-speed markings on the dial
    for i in range(11):
        a = R(-58.0 + i * 11.6)
        rr = 0.0134
        box("DialTick%d" % i, (0.0011, 0.0036, 0.0006),
            (-0.050 + rr * math.sin(a), 0.001 + rr * math.cos(a), 0.0842),
            rot=(0, 0, -a), mat=M['white'], bev=0.0001, segs=1)

    # rewind knob + folding crank
    knurled("RewindCollar", 0.0122, 0.0035, 48, 0.0006, loc=(0.060, 0.0, 0.0800),
            mat=M['chrome'], bevel_w=0.0003)
    knurled("RewindKnob", 0.0102, 0.0105, 40, 0.0008, loc=(0.060, 0.0, 0.0868),
            mat=M['chrome'], bevel_w=0.0005)
    box("RewindCrankWeb", (0.019, 0.0058, 0.0020), (0.0512, 0.0, 0.0925),
        mat=M['satin'], bev=0.0005, segs=2)
    cyl("RewindCrankGrip", 0.0042, 0.0026, (0.0415, 0.0, 0.0925), rot=(0, R(90), 0),
        mat=M['rubber'], verts=32, bev=0.0005, segs=2)

    # ASA / film-speed dial
    knurled("AsaDial", 0.0098, 0.0052, 40, 0.0006, loc=(0.036, 0.012, 0.0806),
            mat=M['chrome'], bevel_w=0.0003)
    cyl("AsaDialTop", 0.0092, 0.0010, (0.036, 0.012, 0.0836), mat=M['black'],
        verts=48, bev=0.0002, segs=2)
    box("AsaWindow", (0.0060, 0.0026, 0.0008), (0.036, 0.0046, 0.0837),
        mat=M['white'], bev=0.0001, segs=1)

    # frame counter window
    prof_solid("CounterRing", [(0.0058, -0.0009), (0.0080, -0.0009),
                               (0.0080, 0.0009), (0.0058, 0.0009)],
               steps=48, loc=(-0.033, -0.0165, TOP_Z + 0.0008), mat=M['chrome'])
    cyl("CounterGlass", 0.0062, 0.0012, (-0.033, -0.0165, TOP_Z + 0.0012),
        mat=M['black'], verts=48, bev=0.0002, segs=1)
    box("CounterMark", (0.0011, 0.0042, 0.0006), (-0.033, -0.0186, TOP_Z + 0.0022),
        mat=M['white'], bev=0.0001, segs=1)

    # strap lugs
    for sx in (-1, 1):
        cyl("Lug%d" % sx, 0.0042, 0.0038, (sx * 0.0740, 0.0, 0.0695),
            rot=(0, R(90), 0), mat=M['satin'], verts=32, bev=0.0006, segs=2)
        ring_prof = [(0.0044 + 0.0013 * math.cos(R(i * 30)),
                      0.0013 * math.sin(R(i * 30))) for i in range(12)]
        prof_solid("LugRing%d" % sx, ring_prof, steps=12,
                   loc=(sx * 0.0775, 0.0, 0.0695), rot=(0, R(90), 0),
                   mat=M['chrome'])

    # ---------------------------------------------------------------- front fittings
    cyl("PcSocket", 0.0044, 0.0050, (-0.056, -0.0272, 0.0500), rot=(R(90), 0, 0),
        mat=M['chrome'], verts=32, bev=0.0005, segs=2)
    cyl("PcSocketHole", 0.0033, 0.0012, (-0.056, -0.0299, 0.0500), rot=(R(90), 0, 0),
        mat=M['black'], verts=32, bev=0.0002, segs=1)
    box("SelfTimerLever", (0.0034, 0.0016, 0.0120), (0.0532, -0.0260, 0.0305),
        mat=M['satin'], bev=0.0005, segs=2)
    cyl("SelfTimerPivot", 0.0040, 0.0026, (0.0532, -0.0264, 0.0405),
        rot=(R(90), 0, 0), mat=M['chrome'], verts=32, bev=0.0005, segs=2)
    cyl("LensRelease", 0.0042, 0.0040, (-0.0405, -0.0262, 0.0560), rot=(R(90), 0, 0),
        mat=M['chrome'], verts=32, bev=0.0005, segs=2)
    return M


# ----------------------------------------------------------------------------- studio
def build_studio(shade=0.78):
    """Seamless cyclorama (floor + sweep + wall) in studio grey #E8E8E8."""
    mat = mat_plain("StudioGrey", (shade, shade, shade * 1.005), 0.0, 0.62, 0.35)
    prof = [(-2.6, 0.0)]
    flat = 0.42
    rad = 0.50
    prof.append((flat, 0.0))
    for i in range(1, 13):
        t = R(90.0 * i / 12.0)
        prof.append((flat + rad * math.sin(t), rad - rad * math.cos(t)))
    prof.append((flat + rad, 2.6))
    verts, faces = [], []
    for (y, z) in prof:
        verts.append((-2.6, y, z))
        verts.append((2.6, y, z))
    for i in range(len(prof) - 1):
        faces.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
    mesh_from("Cyclorama", verts, faces, mat=mat, subject=False)
    return mat


def add_area_light(name, size, power, az, elev, dist, target, color=(1, 1, 1)):
    d = Vector((math.sin(R(az)) * math.cos(R(elev)),
                -math.cos(R(az)) * math.cos(R(elev)),
                math.sin(R(elev))))
    data = bpy.data.lights.new(name, 'AREA')
    data.shape = 'SQUARE'
    data.size = size
    data.energy = power
    data.color = color
    data.spread = math.pi
    ob = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(ob)
    ob.location = Vector(target) + d * dist
    look_at(ob, target)
    return ob


def build_lights(key=34.0, wash=17.0, fill=6.0, rim=15.0, scale=1.0):
    aim = Vector((0.0, 0.0, 0.045))
    k = lambda v: v * scale
    add_area_light("Key", 0.34, k(key), -34.0, 36.0, 0.95, aim, (1.0, 0.985, 0.96))
    add_area_light("Wash", 0.55, k(wash), 7.0, 6.0, 1.05, Vector((0, -0.01, 0.05)),
                   (0.99, 0.99, 1.0))
    add_area_light("Fill", 0.60, k(fill), 68.0, 16.0, 1.15, aim, (0.97, 0.98, 1.0))
    add_area_light("Rim", 0.26, k(rim), 150.0, 42.0, 0.85, aim, (1.0, 0.99, 0.97))    # white bounce card: gives the chrome a soft, controlled reflection (out of frame)
    card = mat_plain("BounceCard", (0.86, 0.86, 0.86), 0.0, 0.75, 0.3)
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_plane_add(size=1.6, location=(sx * 0.75, 0.0, 0.45),
                                         rotation=(0, R(90), R(sx * 14.0)))
        o = bpy.context.active_object
        o.name = "BounceCard%d" % sx
        o.data.materials.append(card)
        SUBJECT.remove(o) if o in SUBJECT else None


def setup_world(strength=0.5, lo=(0.012, 0.013, 0.016), hi=(0.62, 0.64, 0.70)):
    """Vertical gradient environment: dark below, light above — gives chrome a horizon."""
    world = bpy.data.worlds.new("Studio")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld')
    bg = nt.nodes.new('ShaderNodeBackground')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    mr = nt.nodes.new('ShaderNodeMapRange')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    nt.links.new(geo.outputs['Incoming'], sep.inputs['Vector'])
    nt.links.new(sep.outputs['Z'], mr.inputs['Value'])
    mr.inputs['From Min'].default_value = -1.0
    mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Min'].default_value = 0.0
    mr.inputs['To Max'].default_value = 1.0
    nt.links.new(mr.outputs['Result'], ramp.inputs['Fac'])
    ramp.color_ramp.elements[0].position = 0.42
    ramp.color_ramp.elements[0].color = (*lo, 1.0)
    ramp.color_ramp.elements[1].position = 0.80
    ramp.color_ramp.elements[1].color = (*hi, 1.0)
    nt.links.new(ramp.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
    return world


# ----------------------------------------------------------------------------- camera
def subject_points():
    """World-space corner points of every subject object (accurate silhouette proxy)."""
    pts = []
    for o in SUBJECT:
        mw = o.matrix_world
        pts += [mw @ Vector(c) for c in o.bound_box]
    return pts


def bounds_of(pts):
    mn = Vector((1e9, 1e9, 1e9))
    mx = -mn
    for w in pts:
        for i in range(3):
            mn[i] = min(mn[i], w[i])
            mx[i] = max(mx[i], w[i])
    return mn, mx


def frame_camera(focal=70.0, az=38.0, elev=34.0, fill=0.70):
    sc = bpy.context.scene
    sc.render.resolution_x = sc.render.resolution_y = 800
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = focal
    cam_data.sensor_fit = 'AUTO'
    cam_data.sensor_width = 36.0
    cam = bpy.data.objects.new("Cam", cam_data)
    bpy.context.collection.objects.link(cam)
    sc.camera = cam

    mn, mx = bounds_of(subject_points())
    center = (mn + mx) * 0.5
    corners = subject_points()
    tan_half = (cam_data.sensor_width * 0.5) / focal
    target_ratio = fill
    direction = Vector((math.sin(R(az)) * math.cos(R(elev)),
                        -math.cos(R(az)) * math.cos(R(elev)),
                        math.sin(R(elev))))
    aim = center.copy()
    dist = 0.60
    for _ in range(8):
        cam.location = aim + direction * dist
        look_at(cam, aim)
        bpy.context.view_layer.update()
        inv = cam.matrix_world.inverted()
        dx = dy = 0.0
        ratio = 0.0
        nx0 = ny0 = 1e9
        nx1 = ny1 = -1e9
        for c in corners:
            lc = inv @ c
            z = max(-lc.z, 1e-4)
            nx, ny = lc.x / (z * tan_half), lc.y / (z * tan_half)
            nx0, nx1 = min(nx0, nx), max(nx1, nx)
            ny0, ny1 = min(ny0, ny), max(ny1, ny)
            ratio = max(ratio, abs(nx), abs(ny))
        dist *= ratio / target_ratio
        # re-centre the composition on the projected bounding box
        R3 = cam.matrix_world.to_3x3()
        aim += (R3 @ Vector((1, 0, 0))) * ((nx0 + nx1) * 0.5 * dist * tan_half) \
             + (R3 @ Vector((0, 1, 0))) * ((ny0 + ny1) * 0.5 * dist * tan_half)
    cam.location = aim + direction * dist
    look_at(cam, aim)
    bpy.context.view_layer.update()
    print("FRAME_OK: dist=%.4f aim=(%.4f,%.4f,%.4f) ratio=%.3f" %
          (dist, aim.x, aim.y, aim.z, ratio))
    return cam


# ----------------------------------------------------------------------------- render
def setup_render():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x = sc.render.resolution_y = 800
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.film_transparent = False
    sc.render.filepath = PNG_PATH
    ee = sc.eevee
    ee.taa_render_samples = 512
    ee.use_shadows = True
    ee.use_gtao = True
    ee.gtao_distance = 0.06
    ee.use_raytracing = True
    ee.ray_tracing_options.use_denoise = True
    ee.ray_tracing_options.screen_trace_quality = 0.5
    ee.ray_tracing_options.screen_trace_thickness = 0.02
    ee.ray_tracing_options.trace_max_roughness = 0.5
    for name in ('Khronos PBR Neutral', 'Standard'):
        try:
            sc.view_settings.view_transform = name
            break
        except TypeError:
            continue
    sc.view_settings.look = 'None'
    # subtle optical glow on the specular highlights (compositor Glare, Eevee has no bloom)
    try:
        sc.use_nodes = True
        nt = sc.node_tree
        nt.nodes.clear()
        rl = nt.nodes.new('CompositorNodeRLayers')
        gl = nt.nodes.new('CompositorNodeGlare')
        gl.glare_type = 'FOG_GLOW'
        gl.quality = 'HIGH'
        gl.size = 7
        gl.threshold = 0.80
        gl.mix = -0.80
        co = nt.nodes.new('CompositorNodeComposite')
        nt.links.new(rl.outputs['Image'], gl.inputs['Image'])
        nt.links.new(gl.outputs['Image'], co.inputs['Image'])
    except Exception as e:
        print("GLARE_SKIP:", e)
    return sc


# ----------------------------------------------------------------------------- QA report
def _load(path):
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'
    w, h = img.size
    a = np.array(img.pixels[:], dtype=np.float32).reshape(h, w, 4)
    bpy.data.images.remove(img)
    return a[::-1]                      # top-down


def report(final_png, tmp_png):
    sc = bpy.context.scene
    cyclo = bpy.data.objects.get("Cyclorama")
    hidden = []
    for o in bpy.context.scene.objects:
        if o.type == 'MESH' and o not in SUBJECT and o.visible_get():
            o.hide_render = True
            hidden.append(o)
    keep = (sc.render.resolution_x, sc.render.resolution_y, sc.eevee.taa_render_samples,
            sc.render.film_transparent, sc.render.image_settings.color_mode)
    cyclo.hide_render = True
    sc.render.film_transparent = True
    sc.render.image_settings.color_mode = 'RGBA'
    sc.render.resolution_x = sc.render.resolution_y = 400
    sc.eevee.taa_render_samples = 16
    sc.render.filepath = tmp_png
    bpy.ops.render.render(write_still=True)
    cyclo.hide_render = False
    for o in hidden:
        o.hide_render = False
    (sc.render.resolution_x, sc.render.resolution_y, sc.eevee.taa_render_samples,
     sc.render.film_transparent, sc.render.image_settings.color_mode) = keep

    fin = _load(final_png)[:, :, :3]
    lum = fin @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    mraw = _load(tmp_png)[:, :, 3] > 0.5
    H, W = fin.shape[0], fin.shape[1]
    iy = (np.arange(H) * mraw.shape[0] / H).astype(int)
    ix = (np.arange(W) * mraw.shape[1] / W).astype(int)
    m = mraw[np.ix_(iy, ix)]
    bg = float(np.median(fin[6:36, 6:36, 0]))
    ys, xs = np.nonzero(m)
    print("QA_BG: %.1f (255=white, target 232)  corner_bl=%.1f corner_tr=%.1f" % (
        bg * 255, float(np.median(fin[-36:-6, 6:36, 0])) * 255,
        float(np.median(fin[6:36, -36:-6, 0])) * 255))
    if len(xs):
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        print("QA_FRAME: fill_w=%.3f fill_h=%.3f centre=(%.3f, %.3f)" %
              ((x1 - x0) / W, (y1 - y0) / W, (x0 + x1) / 2 / W, (y0 + y1) / 2 / W))
        v = lum[m]
        q = np.percentile(v, [5, 25, 50, 75, 95]) * 255
        print("QA_TONE: p5=%.0f p25=%.0f p50=%.0f p75=%.0f p95=%.0f  clamp_hi=%.3f%% "
              "clamp_lo=%.3f%%" % (q[0], q[1], q[2], q[3], q[4],
                                   100 * float((v > 0.98).mean()),
                                   100 * float((v < 0.015).mean())))
        band = lum[min(y1 + 10, W - 1):min(y1 + 55, W), x0:x1 + 1]
        if band.size:
            print("QA_SHADOW: floor_min=%.1f p5=%.1f -> depth %.0f%% of bg" % (
                band.min() * 255, np.percentile(band, 5) * 255,
                100 * (1 - np.percentile(band, 5) / max(bg, 1e-6))))


# ----------------------------------------------------------------------------- main
def main():
    reset_scene()
    build_studio()
    build_camera()
    build_lights(scale=LIGHT_SCALE)
    setup_world()
    frame_camera()
    setup_render()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print("BUILD_OK: objects=%d subj=%d" % (len(bpy.data.objects), len(SUBJECT)))
    bpy.ops.render.render(write_still=True)
    print("RENDER_OK: %s" % PNG_PATH)
    report(PNG_PATH, os.path.join(os.path.dirname(PNG_PATH), "_mask.png"))


main()
