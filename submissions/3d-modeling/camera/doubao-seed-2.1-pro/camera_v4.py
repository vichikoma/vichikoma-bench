import bpy
import math
import os

# CLEAR
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for m in list(bpy.data.materials):
    if m.users == 0:
        bpy.data.materials.remove(m)

def add_bevel(o, w=0.02, seg=3):
    md = o.modifiers.new("bv", 'BEVEL'); md.width=w; md.segments=seg; md.limit_method='ANGLE'
def add_sub(o, lv=2):
    md = o.modifiers.new("ss", 'SUBSURF'); md.levels=lv; md.render_levels=lv+1

# ---------- MATERIALS ----------
def mat_leather():
    m = bpy.data.materials.new("Leather"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial')
    b=nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value=(0.05,0.048,0.045,1); b.inputs['Roughness'].default_value=0.92; b.inputs['Specular IOR Level'].default_value=0.15
    c=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(1,1,1)
    v=nt.nodes.new('ShaderNodeTexVoronoi'); v.voronoi_dimensions='3D'; v.inputs['Scale'].default_value=55
    n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=250; n.inputs['Detail'].default_value=12
    bm=nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.13
    mx=nt.nodes.new('ShaderNodeMixRGB'); mx.blend_type='MULTIPLY'; mx.inputs['Fac'].default_value=0.5
    nt.links.new(c.outputs['Generated'],mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'],v.inputs['Vector']); nt.links.new(mp.outputs['Vector'],n.inputs['Vector'])
    nt.links.new(v.outputs['Distance'],mx.inputs[1]); nt.links.new(n.outputs['Fac'],mx.inputs[2])
    nt.links.new(mx.outputs['Color'],bm.inputs['Height']); nt.links.new(bm.outputs['Normal'],b.inputs['Normal'])
    nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

def mat_chrome():
    m = bpy.data.materials.new("Chrome"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial')
    b=nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value=(0.83,0.81,0.78,1); b.inputs['Metallic'].default_value=1.0; b.inputs['Roughness'].default_value=0.18
    c=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(15,1,2)
    n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=60; n.inputs['Detail'].default_value=2
    r=nt.nodes.new('ShaderNodeValToRGB'); r.color_ramp.elements[0].position=0.43; r.color_ramp.elements[1].position=0.57
    bm=nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.035
    nt.links.new(c.outputs['Generated'],mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'],n.inputs['Vector'])
    nt.links.new(n.outputs['Fac'],r.inputs['Fac']); nt.links.new(r.outputs['Color'],bm.inputs['Height'])
    nt.links.new(bm.outputs['Normal'],b.inputs['Normal']); nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

def mat_dark():
    m = bpy.data.materials.new("Dark"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial'); b=nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value=(0.07,0.07,0.065,1); b.inputs['Metallic'].default_value=0.6; b.inputs['Roughness'].default_value=0.4
    n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=400
    bm=nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.02
    nt.links.new(n.outputs['Fac'],bm.inputs['Height']); nt.links.new(bm.outputs['Normal'],b.inputs['Normal'])
    nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

def mat_glass():
    m = bpy.data.materials.new("Glass"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial')
    # Use Glass BSDF for proper refraction in EEVEE
    b=nt.nodes.new('ShaderNodeBsdfGlass')
    b.inputs['Color'].default_value=(0.98,0.99,1.0,1)
    b.inputs['Roughness'].default_value=0.0
    b.inputs['IOR'].default_value=1.5
    nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

def mat_rubber():
    m = bpy.data.materials.new("Rubber"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial'); b=nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value=(0.02,0.02,0.02,1); b.inputs['Roughness'].default_value=0.95; b.inputs['Specular IOR Level'].default_value=0.05
    n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=500
    bm=nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.03
    nt.links.new(n.outputs['Fac'],bm.inputs['Height']); nt.links.new(bm.outputs['Normal'],b.inputs['Normal'])
    nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

def mat_ground():
    m = bpy.data.materials.new("Ground"); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial'); b=nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value=(0.91,0.91,0.91,1); b.inputs['Roughness'].default_value=0.97; b.inputs['Specular IOR Level'].default_value=0
    nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

ML, MC, MD, MG, MR, MGR = mat_leather(), mat_chrome(), mat_dark(), mat_glass(), mat_rubber(), mat_ground()

# ---------- GROUND ----------
bpy.ops.mesh.primitive_plane_add(size=30, location=(0,0,0))
G = bpy.context.active_object; G.name="Ground"; G.data.materials.append(MGR); G.is_shadow_catcher=True

# ============================================================
# BODY (center ~ (0,0,0.49), +Y=front/lens)
# ============================================================
Bcx,Bcy,Bcz = 0,0,0.49
bpy.ops.mesh.primitive_cube_add(size=1, location=(Bcx,Bcy,Bcz))
B = bpy.context.active_object; B.name="Body"; B.scale=(0.68,0.42,0.40)
bpy.ops.object.transform_apply(scale=True); add_bevel(B,0.022,4); add_sub(B,2); B.data.materials.append(ML)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0.885))
T = bpy.context.active_object; T.name="Top"; T.scale=(0.69,0.43,0.035)
bpy.ops.object.transform_apply(scale=True); add_bevel(T,0.012,3); add_sub(T,1); T.data.materials.append(MC)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0.075))
BT = bpy.context.active_object; BT.name="Bot"; BT.scale=(0.69,0.43,0.055)
bpy.ops.object.transform_apply(scale=True); add_bevel(BT,0.012,3); BT.data.materials.append(MC)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0.215,0.49))
F = bpy.context.active_object; F.name="Front"; F.scale=(0.64,0.02,0.38)
bpy.ops.object.transform_apply(scale=True); add_bevel(F,0.008,2); F.data.materials.append(MC)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,-0.225,0.49))
BK = bpy.context.active_object; BK.name="Back"; BK.scale=(0.66,0.015,0.39); BK.data.materials.append(MD)

# ---------- PENTAPRISM ----------
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,-0.02,0.99))
P = bpy.context.active_object; P.name="Prism"; P.scale=(0.32,0.30,0.07)
bpy.ops.object.transform_apply(scale=True)
tp = P.modifiers.new("tap",'SIMPLE_DEFORM'); tp.deform_method='TAPER'; tp.factor=-0.35; tp.deform_axis='Z'
add_bevel(P,0.015,3); add_sub(P,2); P.data.materials.append(MC)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,-0.26,0.97))
E = bpy.context.active_object; E.name="Eyepiece"; E.scale=(0.15,0.03,0.06); E.data.materials.append(MG)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,-0.24,0.97))
EB = bpy.context.active_object; EB.name="EyeBezel"; EB.scale=(0.17,0.015,0.07); EB.data.materials.append(MC)

# ---------- HOT SHOE ----------
HSz=1.09; HSy=0.08
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,HSy,HSz)); HSB=bpy.context.active_object
HSB.scale=(0.11,0.14,0.012); HSB.data.materials.append(MC)
for dx in (-0.065,0.065):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(dx,HSy,HSz+0.022))
    r=bpy.context.active_object; r.scale=(0.015,0.15,0.012); r.data.materials.append(MC)
bpy.ops.mesh.primitive_cylinder_add(radius=0.01,depth=0.012,location=(0,HSy,HSz+0.012))
bpy.context.active_object.data.materials.append(MD)

# ---------- LENS (extending +Y from front face at Y~0.235) ----------
Ly = 0.235; Lz = 0.49
def cyl(r,d,y,mat,v=72):
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=d,location=(0,y+d/2,Lz),rotation=(math.radians(90),0,0),vertices=v)
    o=bpy.context.active_object; o.data.materials.append(mat); return o

cyl(0.29,0.04,Ly,MC); Ly+=0.04                         # mount
cyl(0.27,0.11,Ly,MC); Ly+=0.11                         # rear barrel

# Focus ring (rubber)
fc = cyl(0.28,0.13,Ly,MR,96)
for i in range(80):
    a=2*math.pi*i/80
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0.28*math.cos(a),Ly+0.065,Lz+0.28*math.sin(a)))
    rr=bpy.context.active_object; rr.scale=(0.005,0.135,0.004); rr.rotation_euler=(0,a,0); rr.data.materials.append(MC)
Ly += 0.13

cyl(0.26,0.08,Ly,MC); Ly+=0.08                         # mid barrel

# Aperture ring
ac = cyl(0.27,0.07,Ly,MR,96)
for i in range(64):
    a=2*math.pi*i/64
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0.27*math.cos(a),Ly+0.035,Lz+0.27*math.sin(a)))
    rr=bpy.context.active_object; rr.scale=(0.004,0.075,0.0035); rr.rotation_euler=(0,a,0); rr.data.materials.append(MC)
Ly += 0.07

cyl(0.28,0.06,Ly,MC); Ly+=0.06                         # front barrel

bpy.ops.mesh.primitive_torus_add(major_radius=0.26,minor_radius=0.018,location=(0,Ly,Lz),rotation=(math.radians(90),0,0),major_segments=72,minor_segments=12)
bpy.context.active_object.data.materials.append(MC)
cyl(0.24,0.015,Ly-0.005,MD)                            # inner dark
cyl(0.22,0.015,Ly+0.005,MG)                            # front glass
cyl(0.18,0.008,Ly-0.02,MG)                             # inner glass

# ---------- SHUTTER (right +X) ----------
bpy.ops.mesh.primitive_cylinder_add(radius=0.05,depth=0.025,location=(0.50,-0.10,0.925),vertices=32); bpy.context.active_object.data.materials.append(MC)
bpy.ops.mesh.primitive_cylinder_add(radius=0.038,depth=0.025,location=(0.50,-0.10,0.95),vertices=32); bpy.context.active_object.data.materials.append(MC)
bpy.ops.mesh.primitive_cylinder_add(radius=0.035,depth=0.008,location=(0.50,-0.10,0.966),vertices=32); bpy.context.active_object.data.materials.append(MR)

# Speed dial
bpy.ops.mesh.primitive_cylinder_add(radius=0.075,depth=0.025,location=(0.50,0.12,0.925),vertices=32); bpy.context.active_object.data.materials.append(MC)
for i in range(36):
    a=2*math.pi*i/36
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0.50+0.075*math.cos(a),0.12,0.925+0.075*math.sin(a)))
    rr=bpy.context.active_object; rr.scale=(0.005,0.028,0.003); rr.rotation_euler=(a,0,0); rr.data.materials.append(MC)

# ---------- REWIND + ADVANCE (left -X) ----------
bpy.ops.mesh.primitive_cylinder_add(radius=0.07,depth=0.035,location=(-0.52,0.15,0.93),vertices=32); bpy.context.active_object.data.materials.append(MC)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-0.52,0.15,0.96)); cr=bpy.context.active_object
cr.scale=(0.055,0.012,0.008); cr.rotation_euler=(0,0,math.radians(35)); cr.data.materials.append(MC)

bpy.ops.mesh.primitive_cylinder_add(radius=0.07,depth=0.025,location=(-0.50,-0.12,0.925),vertices=32); bpy.context.active_object.data.materials.append(MC)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-0.70,-0.24,0.97)); ar=bpy.context.active_object
ar.scale=(0.24,0.022,0.018); ar.rotation_euler=(math.radians(15),0,math.radians(-30)); add_bevel(ar,0.005,2); ar.data.materials.append(MC)
bpy.ops.mesh.primitive_cylinder_add(radius=0.014,depth=0.035,location=(-0.87,-0.34,0.995),rotation=(math.radians(90),math.radians(15),math.radians(-30)),vertices=12); bpy.context.active_object.data.materials.append(MR)

# ---------- FRONT DETAILS ----------
bpy.ops.mesh.primitive_cylinder_add(radius=0.022,depth=0.015,location=(-0.42,0.24,0.28),rotation=(math.radians(90),0,0),vertices=16); bpy.context.active_object.data.materials.append(MC)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-0.42,0.265,0.30)); stl=bpy.context.active_object
stl.scale=(0.012,0.04,0.008); stl.data.materials.append(MC)

bpy.ops.mesh.primitive_cylinder_add(radius=0.015,depth=0.012,location=(-0.35,0.24,0.72),rotation=(math.radians(90),0,0),vertices=12); bpy.context.active_object.data.materials.append(MC)

bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0.245,0.70)); NP=bpy.context.active_object
NP.scale=(0.20,0.004,0.032); NP.data.materials.append(MD)

bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0.27,0.49)); FW=bpy.context.active_object
FW.scale=(0.10,0.005,0.025); FW.data.materials.append(MC)

# Strap lugs
for sx in (-0.66,0.66):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.022,minor_radius=0.005,location=(sx,0.12,0.80),rotation=(math.radians(90),0,0),major_segments=10,minor_segments=5)
    bpy.context.active_object.data.materials.append(MC)

# ---------- LIGHTING ----------
def mk_area(xyz, eng, sz, col, rot):
    bpy.ops.object.light_add(type='AREA', location=xyz); l=bpy.context.active_object
    l.data.energy=eng; l.data.size=sz; l.data.color=col; l.rotation_euler=rot; return l

# Key: front-left-top of subject (viewer's right-front-up)
# Key: main light from viewer's front-left-top (so highlights left-top of camera)
mk_area((-2.5, 2.0, 2.8), 600, 3, (1.0,0.97,0.94), (math.radians(-55),0,math.radians(50)))
# Fill: soft from right
mk_area((2.8, 1.5, 1.0), 180, 5, (0.93,0.96,1.0), (math.radians(-20),0,math.radians(120)))
# Rim: back light to separate from background
mk_area((0, -2.5, 1.8), 250, 2, (1,1,1), (math.radians(20),0,0))
# Top
mk_area((0, 0.5, 4), 80, 5, (1,1,1), (math.radians(180),0,0))

# ---------- RENDER CAMERA ----------
# 3/4 view: front-left-top from viewer perspective — shows front (+Y) of camera,
# camera's LEFT grip side (-X? No—wait: viewer sees camera's right side when viewer is on camera's left?)
# Actually: to see shutter/top controls which are at +X, we need viewer at -X side.
# Viewer at (-X, +Y, +Z) sees: lens front (+Y), camera's RIGHT side (+X face of camera is visible because...)
# Wait: if you stand at -X looking toward origin, you see the -X face of the camera.
# To see the side with shutter (+X), viewer must be at +X side. Let me flip sign.
# Camera position (+X, +Y, +Z): sees +Y face (front), +X face (shutter side). Good.
bpy.ops.object.camera_add(location=(3.2, 2.8, 2.0))
RC=bpy.context.active_object; RC.name="RenderCam"; bpy.context.scene.camera=RC
tgt=bpy.data.objects.new("Tgt",None); bpy.context.collection.objects.link(tgt); tgt.location=(0,0.5,0.55)
trk=RC.constraints.new(type='TRACK_TO'); trk.target=tgt; trk.track_axis='TRACK_NEGATIVE_Z'; trk.up_axis='UP_Y'
RC.data.lens=100
RC.data.dof.use_dof=True; RC.data.dof.focus_object=tgt; RC.data.dof.aperture_fstop=4.0

# ---------- RENDER ----------
sc=bpy.context.scene
sc.render.engine='BLENDER_EEVEE_NEXT'
sc.render.resolution_x=800; sc.render.resolution_y=800; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.eevee.taa_render_samples=128; sc.eevee.use_raytracing=True

w=sc.world; w.use_nodes=True; wn=w.node_tree.nodes; wl=w.node_tree.links
wn.clear(); wo=wn.new('ShaderNodeOutputWorld'); wb=wn.new('ShaderNodeBackground')
wb.inputs['Color'].default_value=(0.91,0.91,0.91,1); wb.inputs['Strength'].default_value=0.7
wl.new(wb.outputs['Background'],wo.inputs['Surface'])

out=os.path.dirname(os.path.abspath(__file__))
if not out: out='.'
sc.render.filepath=os.path.join(out,'camera_v4.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'camera_v4.blend'))
print("V4 done")
