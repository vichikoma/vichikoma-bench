"""
Vintage 1970s SLR camera - final version
All geometry procedural, all materials procedural, Eevee render
"""
import bpy
import math
import mathutils
import os

# ============================================================
# CLEAN
# ============================================================
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for m in list(bpy.data.materials):
    if m.users == 0:
        bpy.data.materials.remove(m)

# ============================================================
# UNIT CONVENTION (in Blender units / meters)
# Camera body dimensions (approx Nikon FM2 / Pentax K1000 class):
#   Width (X): 14cm = 0.14
#   Depth (Y):  5cm = 0.05 (body only, lens extends forward)
#   Height (Z): 9cm = 0.09
# I'll scale up by ~3 for easier modeling: 1 BU ≈ 4.7cm
# Body final: W=3.0, D=1.5, H=2.0  (so width ~14cm, scale factor ~21)
# Actually let's keep it simple: body 3x1.4x2 BU, lens extends +2BU forward
# This way numbers are friendlier
# ============================================================

BW, BD, BH = 3.0, 1.4, 2.0  # body width/depth/height
BX, BY, BZ = 0, 0, 1.0      # body center (bottom at Z=0)

# ============================================================
# MATERIALS
# ============================================================
def new_mat(name):
    m=bpy.data.materials.new(name); m.use_nodes=True
    m.node_tree.nodes.clear(); return m, m.node_tree.nodes, m.node_tree.links

def link(L, out, inp): L.new(out, inp)

# ---- Leather (black with grain) ----
ML, n, L = new_mat("Leather")
bsdf=n.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value=(0.045,0.042,0.04,1)
bsdf.inputs['Roughness'].default_value=0.92; bsdf.inputs['Specular IOR Level'].default_value=0.15
coord=n.new('ShaderNodeTexCoord'); mp=n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(1.2,0.8,1.0)
vor=n.new('ShaderNodeTexVoronoi'); vor.voronoi_dimensions='3D'; vor.inputs['Scale'].default_value=45
nz=n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=200; nz.inputs['Detail'].default_value=10
bm=n.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.10
mx=n.new('ShaderNodeMixRGB'); mx.blend_type='MULTIPLY'; mx.inputs['Fac'].default_value=0.55
o=n.new('ShaderNodeOutputMaterial')
link(L,coord.outputs['Generated'],mp.inputs['Vector'])
link(L,mp.outputs['Vector'],vor.inputs['Vector']); link(L,mp.outputs['Vector'],nz.inputs['Vector'])
link(L,vor.outputs['Distance'],mx.inputs[1]); link(L,nz.outputs['Fac'],mx.inputs[2])
link(L,mx.outputs['Color'],bm.inputs['Height']); link(L,bm.outputs['Normal'],bsdf.inputs['Normal'])
link(L,bsdf.outputs['BSDF'],o.inputs['Surface'])

# ---- Brushed Chrome ----
MC, n, L = new_mat("Chrome")
bsdf=n.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value=(0.84,0.82,0.79,1)
bsdf.inputs['Metallic'].default_value=1.0; bsdf.inputs['Roughness'].default_value=0.18
coord=n.new('ShaderNodeTexCoord'); mp=n.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(20,1,3)
nz=n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=80; nz.inputs['Detail'].default_value=2.0
rmp=n.new('ShaderNodeValToRGB'); rmp.color_ramp.elements[0].position=0.45; rmp.color_ramp.elements[1].position=0.55
bm=n.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.04
o=n.new('ShaderNodeOutputMaterial')
link(L,coord.outputs['Generated'],mp.inputs['Vector']); link(L,mp.outputs['Vector'],nz.inputs['Vector'])
link(L,nz.outputs['Fac'],rmp.inputs['Fac']); link(L,rmp.outputs['Color'],bm.inputs['Height'])
link(L,bm.outputs['Normal'],bsdf.inputs['Normal']); link(L,bsdf.outputs['BSDF'],o.inputs['Surface'])

# ---- Black painted metal ----
MD, n, L = new_mat("DarkMetal")
bsdf=n.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value=(0.07,0.07,0.065,1)
bsdf.inputs['Metallic'].default_value=0.5; bsdf.inputs['Roughness'].default_value=0.45
nz=n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=400
bm=n.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.015
o=n.new('ShaderNodeOutputMaterial')
link(L,nz.outputs['Fac'],bm.inputs['Height']); link(L,bm.outputs['Normal'],bsdf.inputs['Normal'])
link(L,bsdf.outputs['BSDF'],o.inputs['Surface'])

# ---- Glass ----
MG, n, L = new_mat("Glass")
g=n.new('ShaderNodeBsdfGlass'); g.inputs['Color'].default_value=(0.92,0.96,1.0,1)
g.inputs['Roughness'].default_value=0.02; g.inputs['IOR'].default_value=1.5
o=n.new('ShaderNodeOutputMaterial')
link(L,g.outputs['BSDF'],o.inputs['Surface'])

# ---- Black rubber ----
MR, n, L = new_mat("Rubber")
bsdf=n.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value=(0.015,0.015,0.015,1)
bsdf.inputs['Roughness'].default_value=0.95; bsdf.inputs['Specular IOR Level'].default_value=0.05
nz=n.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=500
bm=n.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=0.02
o=n.new('ShaderNodeOutputMaterial')
link(L,nz.outputs['Fac'],bm.inputs['Height']); link(L,bm.outputs['Normal'],bsdf.inputs['Normal'])
link(L,bsdf.outputs['BSDF'],o.inputs['Surface'])

# ---- Ground ----
MGR, n, L = new_mat("Ground")
bsdf=n.new('ShaderNodeBsdfPrincipled'); bsdf.inputs['Base Color'].default_value=(0.91,0.91,0.91,1)
bsdf.inputs['Roughness'].default_value=0.97; bsdf.inputs['Specular IOR Level'].default_value=0
o=n.new('ShaderNodeOutputMaterial')
link(L,bsdf.outputs['BSDF'],o.inputs['Surface'])

# ============================================================
# HELPERS
# ============================================================
def bev(o, w=0.04, seg=3):
    m=o.modifiers.new("b",'BEVEL'); m.width=w; m.segments=seg; m.limit_method='ANGLE'
def ssub(o, lv=2):
    m=o.modifiers.new("s",'SUBSURF'); m.levels=lv; m.render_levels=lv+1

def C(sx,sy,sz,cx,cy,cz,mat,bevel_w=0.04,sub_lvl=2):
    """Add a cube with given half-scales (sx,sy,sz) at center (cx,cy,cz), apply transforms, add bevel+subsurf"""
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,cy,cz))
    o=bpy.context.active_object
    o.scale=(sx,sy,sz)
    bpy.ops.object.transform_apply(scale=True)
    if bevel_w>0: bev(o,bevel_w,3)
    if sub_lvl>0: ssub(o,sub_lvl)
    o.data.materials.append(mat)
    return o

def CY(r,d,cx,cy,cz,mat,v=64,rot=(math.radians(90),0,0)):
    """Add a cylinder (default Y-axis for lens use)"""
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=d,location=(cx,cy,cz),rotation=rot,vertices=v)
    o=bpy.context.active_object; o.data.materials.append(mat)
    return o

# ============================================================
# GROUND
# ============================================================
bpy.ops.mesh.primitive_plane_add(size=40,location=(0,0,0))
G=bpy.context.active_object; G.name="Ground"; G.data.materials.append(MGR); G.is_shadow_catcher=True

# ============================================================
# BODY
# Body: W=3.0, D=1.4, H=2.0, center at (0,0,1.0). Bottom at Z=0, top at Z=2.0
# ============================================================
body = C(BW/2, BD/2, BH/2, 0,0,BZ, ML, bevel_w=0.06, sub_lvl=2)
body.name="Body"

# Top chrome plate: thin plate inset slightly from body
top = C(BW/2-0.02, BD/2-0.01, 0.10, 0,0,2.0-0.02, MC, bevel_w=0.025, sub_lvl=1)
top.name="TopPlate"

# Bottom chrome plate
bot = C(BW/2-0.02, BD/2-0.01, 0.08, 0,0,0+0.04, MC, bevel_w=0.025, sub_lvl=0)
bot.name="BottomPlate"

# Front chrome fascia (Y+ side): thin plate
front = C(BW/2-0.06, 0.03, BH/2-0.08, 0, BD/2+0.00, 1.0, MC, bevel_w=0.015, sub_lvl=0)
front.name="FrontPlate"

# Back dark plate
back = C(BW/2-0.04, 0.02, BH/2-0.04, 0,-BD/2-0.005, 1.0, MD, bevel_w=0, sub_lvl=0)
back.name="BackPlate"

# ============================================================
# PENTAPRISM (on top plate, slightly forward)
# Top plate top at Z=2.0-0.02+0.10 = 2.08
# ============================================================
prism = C(0.60, 0.55, 0.25, 0, -0.05, 2.08+0.125-0.02, MC, bevel_w=0.04, sub_lvl=2)
prism.name="Prism"
# Taper top
t=prism.modifiers.new("t",'SIMPLE_DEFORM'); t.deform_method='TAPER'; t.factor=-0.45; t.deform_axis='Z'

# Eyepiece (back of prism, Y- side)
ep = C(0.28,0.05,0.12, 0,-BD/2-0.10-0.04, 2.08+0.05, MG, bevel_w=0.01, sub_lvl=0)
ep.name="Eyepiece"
epb = C(0.32,0.03,0.14, 0,-BD/2-0.06, 2.08+0.05, MC, bevel_w=0.008, sub_lvl=0)
epb.name="EyepieceBezel"

# ============================================================
# HOT SHOE (on top plate, in front of prism, Y+)
# ============================================================
hs_base = C(0.22,0.28,0.025, 0, 0.30, 2.08+0.015, MC, bevel_w=0.008, sub_lvl=0)
hs_base.name="HotShoeBase"
# Rails
C(0.025,0.30,0.020, -0.13,0.30,2.08+0.04, MC, bevel_w=0.005, sub_lvl=0)
C(0.025,0.30,0.020,  0.13,0.30,2.08+0.04, MC, bevel_w=0.005, sub_lvl=0)
# Center contact
CY(0.02,0.02, 0,0.30,2.08+0.035, MD, v=12, rot=(0,0,0))

# ============================================================
# LENS (extends +Y from front of body, which is at Y=BD/2 = 0.70)
# Lens center Z = BZ = 1.0 (slightly above center for SLR mirror box look)
# ============================================================
LY = BD/2 + 0.02    # lens starts at front face
LZ = BZ

def lens_cyl(r,d,mat,v=64):
    global LY
    o=CY(r,d, 0,LY+d/2,LZ, mat,v)
    LY += d
    return o

# Mount ring
lens_cyl(0.55,0.10,MC)
# Rear barrel
lens_cyl(0.50,0.25,MC)
# Focus ring (rubber, wider)
fr=lens_cyl(0.52,0.30,MR,80)
# Knurl ridges
for i in range(80):
    a=2*math.pi*i/80
    cx=0.52*math.cos(a); cz=0.52*math.sin(a)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,LY-0.30/2,LZ+cz))
    rr=bpy.context.active_object; rr.scale=(0.008,0.31,0.006); rr.rotation_euler=(0,a,0); rr.data.materials.append(MC)
# Mid barrel
lens_cyl(0.48,0.18,MC)
# Aperture ring
ar=lens_cyl(0.50,0.15,MR,80)
for i in range(60):
    a=2*math.pi*i/60
    cx=0.50*math.cos(a); cz=0.50*math.sin(a)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,LY-0.15/2,LZ+cz))
    rr=bpy.context.active_object; rr.scale=(0.007,0.16,0.005); rr.rotation_euler=(0,a,0); rr.data.materials.append(MC)
# Front barrel
lens_cyl(0.52,0.12,MC)
# Filter rim torus
bpy.ops.mesh.primitive_torus_add(major_radius=0.49,minor_radius=0.03,location=(0,LY,LZ),rotation=(math.radians(90),0,0),major_segments=64,minor_segments=12)
bpy.context.active_object.data.materials.append(MC)
# Inner dark ring
CY(0.45,0.025, 0,LY-0.02,LZ, MD, 64)
# Front glass element
CY(0.42,0.025, 0,LY+0.02,LZ, MG, 64)
# Second glass (inner reflection)
CY(0.32,0.015, 0,LY-0.05,LZ, MG, 64)

# ============================================================
# SHUTTER BUTTON + SPEED DIAL - camera's RIGHT (+X) on top plate
# Top plate top at ~2.08
# ============================================================
TZ = 2.08  # top of top plate
# Shutter collar
CY(0.11,0.05, 1.15,-0.20,TZ+0.025, MC, 32, rot=(0,0,0))
# Shutter button
CY(0.085,0.05, 1.15,-0.20,TZ+0.075, MC, 32, rot=(0,0,0))
# Shutter soft top
CY(0.075,0.015, 1.15,-0.20,TZ+0.108, MR, 32, rot=(0,0,0))

# Speed dial
CY(0.15,0.05, 1.10,0.20,TZ+0.025, MC, 32, rot=(0,0,0))
# Dial knurls
for i in range(36):
    a=2*math.pi*i/36
    cx=1.10+0.15*math.cos(a); cz=TZ+0.025+0.15*math.sin(a)
    bpy.ops.mesh.primitive_cube_add(size=1,location=(cx,0.20,cz))
    rr=bpy.context.active_object; rr.scale=(0.008,0.055,0.005); rr.rotation_euler=(0,a,0); rr.data.materials.append(MC)

# ============================================================
# REWIND KNOB + FILM ADVANCE - camera's LEFT (-X)
# ============================================================
# Rewind knob
CY(0.14,0.06,-1.18,0.22,TZ+0.03, MC, 32, rot=(0,0,0))
# Rewind crank
rc=C(0.10,0.02,0.012,-1.18,0.22,TZ+0.065, MC, bevel_w=0.005, sub_lvl=0)
rc.rotation_euler=(0,0,math.radians(35))

# Advance lever base
CY(0.12,0.04,-1.15,-0.20,TZ+0.02, MC, 32, rot=(0,0,0))
# Lever arm
arm=C(0.40,0.035,0.025,-1.45,-0.45,TZ+0.10, MC, bevel_w=0.01, sub_lvl=0)
arm.rotation_euler=(math.radians(15),0,math.radians(-30))
# Tip
CY(0.025,0.08,-1.75,-0.62,TZ+0.16, MR, 12, rot=(math.radians(90),math.radians(15),math.radians(-30)))

# ============================================================
# FRONT DETAILS (Y+ face)
# ============================================================
# Self timer lever (-X side)
CY(0.045,0.03,-0.85,BD/2+0.015,0.45, MC, 16)
stl=C(0.02,0.08,0.015,-0.85,BD/2+0.07,0.50, MC, 0,0)
# PC sync terminal
CY(0.025,0.02,-0.70,BD/2+0.01,1.50, MC, 12)
# Brand nameplate
C(0.40,0.008,0.07,0,BD/2+0.018,1.45, MD, 0.005,0)
# Focus distance scale window
C(0.20,0.008,0.05,0,BD/2+0.018,1.0, MC, 0.003,0)

# ============================================================
# STRAP LUGS
# ============================================================
for sx in (-BW/2+0.05, BW/2-0.05):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.05,minor_radius=0.01,
        location=(sx,0.20,1.70),rotation=(math.radians(90),0,0),major_segments=12,minor_segments=6)
    bpy.context.active_object.data.materials.append(MC)

# ============================================================
# LIGHTING - three point
# ============================================================
def add_light(pos, tgt, eng, sz, col):
    bpy.ops.object.light_add(type='AREA',location=pos); l=bpy.context.active_object
    l.data.energy=eng; l.data.size=sz; l.data.color=col
    d=mathutils.Vector(tgt)-mathutils.Vector(pos)
    l.rotation_euler=d.to_track_quat('-Z','Y').to_euler()

TGT=(0,0.8,1.1)  # aim lights at lens/body center
add_light((-4,4,4),    TGT, 900, 4, (1.0,0.96,0.92))   # key
add_light((5,2,2),     TGT, 250, 6, (0.92,0.95,1.0))   # fill
add_light((0,-4,3),    TGT, 350, 3, (1,1,1))           # rim
add_light((0,1,6),     TGT, 100, 8, (1,1,1))           # top

# ============================================================
# RENDER CAMERA
# 3/4 view: from front-right-top (viewer sees front + camera's right side + top)
# Camera at (+X, +Y, +Z) octant, looking back at subject center
# Subject extents roughly X:[-1.5,1.5], Y:[-0.7,~2.5], Z:[0,~2.3]
# Subject center ~(0,0.8,1.1). Bounding radius ~2.5
# For subject to occupy ~70% of 800x800 frame at portrait focal length:
# place camera ~8 units away, 85mm lens gives appropriate framing
# ============================================================
cam_pos = mathutils.Vector((7.5, -6.0, 4.2))
cam_tgt = mathutils.Vector((0, 0.8, 1.1))
bpy.ops.object.camera_add(location=cam_pos)
rcam=bpy.context.active_object; rcam.name="RenderCam"
bpy.context.scene.camera=rcam
d=cam_tgt-cam_pos
rcam.rotation_euler=d.to_track_quat('-Z','Y').to_euler()
rcam.data.lens=85
rcam.data.dof.use_dof=True
rcam.data.dof.focus_distance=d.length
rcam.data.dof.aperture_fstop=5.6

# ============================================================
# WORLD & RENDER
# ============================================================
sc=bpy.context.scene
sc.render.engine='BLENDER_EEVEE_NEXT'
sc.render.resolution_x=800; sc.render.resolution_y=800; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.eevee.taa_render_samples=256
sc.eevee.use_raytracing=True

w=sc.world; w.use_nodes=True; wn=w.node_tree.nodes; wl=w.node_tree.links
wn.clear(); wo=wn.new('ShaderNodeOutputWorld'); wb=wn.new('ShaderNodeBackground')
wb.inputs['Color'].default_value=(0.91,0.91,0.91,1); wb.inputs['Strength'].default_value=0.5
wl.new(wb.outputs['Background'],wo.inputs['Surface'])

out=os.path.dirname(os.path.abspath(__file__))
if not out: out='.'
sc.render.filepath=os.path.join(out,'camera_final.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'camera_final.blend'))
# Also save a versioned copy
sc.render.filepath=os.path.join(out,'camera_v5.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'camera_v5.blend'))
print("Render complete!")