import bpy
import math
import mathutils
import os

# ============================================================
# CLEAN SCENE
# ============================================================
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
for m in list(bpy.data.materials):
    if m.users == 0:
        bpy.data.materials.remove(m)

# ============================================================
# HELPERS
# ============================================================
def bev(o, w=0.02, s=3):
    md=o.modifiers.new("b",'BEVEL'); md.width=w; md.segments=s; md.limit_method='ANGLE'
def sub(o, lv=2):
    md=o.modifiers.new("s",'SUBSURF'); md.levels=lv; md.render_levels=lv+1

# ============================================================
# MATERIALS
# ============================================================
def mat(name, color, rough=0.5, metal=0.0, transmission=0.0, ior=1.5, bump_str=0.0, noise_scale=100.0, glass=False):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; nt.nodes.clear()
    o=nt.nodes.new('ShaderNodeOutputMaterial')
    if glass:
        b=nt.nodes.new('ShaderNodeBsdfGlass')
        b.inputs['Color'].default_value=color
        b.inputs['Roughness'].default_value=rough
        b.inputs['IOR'].default_value=ior
    else:
        b=nt.nodes.new('ShaderNodeBsdfPrincipled')
        b.inputs['Base Color'].default_value=color
        b.inputs['Roughness'].default_value=rough
        b.inputs['Metallic'].default_value=metal
        if transmission>0:
            b.inputs['Transmission Weight'].default_value=transmission
            b.inputs['IOR'].default_value=ior
    if bump_str>0:
        n=nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value=noise_scale
        bm=nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value=bump_str
        nt.links.new(n.outputs['Fac'],bm.inputs['Height'])
        nt.links.new(bm.outputs['Normal'],b.inputs['Normal'])
    nt.links.new(b.outputs['BSDF'],o.inputs['Surface'])
    return m

# Leather: black with grain
M_L = mat("Leather",(0.05,0.045,0.04,1),rough=0.9,bump_str=0.08,noise_scale=150)
# Add voronoi for leather grain in a separate step
nt=M_L.node_tree
coord=nt.nodes.new('ShaderNodeTexCoord')
mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(1,1,1)
vor=nt.nodes.new('ShaderNodeTexVoronoi'); vor.voronoi_dimensions='3D'; vor.inputs['Scale'].default_value=50
# Connect
nt.links.new(coord.outputs['Generated'],mp.inputs['Vector'])
nt.links.new(mp.outputs['Vector'],vor.inputs['Vector'])

# Chrome silver
M_C = mat("Chrome",(0.85,0.83,0.8,1),rough=0.2,metal=1.0,bump_str=0.03,noise_scale=80)

# Dark metal
M_D = mat("DarkMetal",(0.08,0.08,0.075,1),rough=0.35,metal=0.6,bump_str=0.01,noise_scale=300)

# Glass (front lens)
M_G = mat("Glass",(0.97,0.98,1.0,1),rough=0.0,ior=1.52,glass=True)

# Rubber
M_R = mat("Rubber",(0.02,0.02,0.02,1),rough=0.95,bump_str=0.02,noise_scale=400)

# Ground
M_GR = mat("Ground",(0.91,0.91,0.91,1),rough=0.98)

# ============================================================
# GROUND PLANE (Z=0)
# ============================================================
bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,0))
ground=bpy.context.active_object; ground.name="Ground"; ground.data.materials.append(M_GR)
ground.is_shadow_catcher=True

# ============================================================
# BODY - Positioned so bottom sits just above ground
# Camera convention:
#   +Y = lens points forward (toward viewer in 3/4 shot)
#   +X = camera's right (shutter side)
#   +Z = up
# Body center: (0, 0, 0.5), W=140mm X=±0.7, D=50mm Y=±0.25, H=90mm Z=0.1~1.0
# ============================================================
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0.50))
body=bpy.context.active_object; body.name="Body"; body.scale=(0.70,0.44,0.40)
bpy.ops.object.transform_apply(scale=True); bev(body,0.025,4); sub(body,2); body.data.materials.append(M_L)

# Top plate (chrome) - sits on body (body top at Z=0.5+0.4=0.9), plate from Z=0.865 to Z=0.935
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0.885))
top=bpy.context.active_object; top.name="Top"; top.scale=(0.71,0.45,0.05)
bpy.ops.object.transform_apply(scale=True); bev(top,0.012,3); sub(top,1); top.data.materials.append(M_C)

# Bottom plate - under body (body bottom at Z=0.5-0.4=0.1)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0.09))
bot=bpy.context.active_object; bot.name="Bot"; bot.scale=(0.71,0.45,0.07)
bpy.ops.object.transform_apply(scale=True); bev(bot,0.015,3); bot.data.materials.append(M_C)

# Front chrome fascia
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0.235,0.50))
fr=bpy.context.active_object; fr.name="Front"; fr.scale=(0.65,0.02,0.38)
bpy.ops.object.transform_apply(scale=True); bev(fr,0.008,2); fr.data.materials.append(M_C)

# Back plate
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-0.24,0.50))
bk=bpy.context.active_object; bk.name="Back"; bk.scale=(0.66,0.015,0.39); bk.data.materials.append(M_D)

# ============================================================
# PENTAPRISM - raised block on top, tapered
# Top plate top surface at Z = 0.885+0.05/2 = 0.91 (after scale applied: from 0.86 to 0.91)
# Pentaprism sits on top plate
# ============================================================
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0.98))
pr=bpy.context.active_object; pr.name="Prism"; pr.scale=(0.32,0.32,0.07)
bpy.ops.object.transform_apply(scale=True)
tap=pr.modifiers.new("t",'SIMPLE_DEFORM'); tap.deform_method='TAPER'; tap.factor=-0.30; tap.deform_axis='Z'
bev(pr,0.015,3); sub(pr,2); pr.data.materials.append(M_C)

# Eyepiece (back of prism)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-0.24,0.97))
ep=bpy.context.active_object; ep.name="Eyepiece"; ep.scale=(0.14,0.03,0.06); ep.data.materials.append(M_G)
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,-0.22,0.97))
epb=bpy.context.active_object; epb.name="EyeBezel"; epb.scale=(0.16,0.015,0.07); epb.data.materials.append(M_C)

# ============================================================
# HOT SHOE on top plate, in front of prism
# ============================================================
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0.12,0.935))
hs=bpy.context.active_object; hs.name="HotShoe"; hs.scale=(0.10,0.14,0.01); hs.data.materials.append(M_C)
for dx in (-0.06,0.06):
    bpy.ops.mesh.primitive_cube_add(size=1,location=(dx,0.12,0.955))
    r=bpy.context.active_object; r.scale=(0.013,0.15,0.01); r.data.materials.append(M_C)
bpy.ops.mesh.primitive_cylinder_add(radius=0.009,depth=0.008,location=(0,0.12,0.945))
bpy.context.active_object.data.materials.append(M_D)

# ============================================================
# LENS (extends +Y from front of body at Y=0.25)
# ============================================================
Ly=0.25  # start Y of lens
Lz=0.50  # center height of lens

def cyl(r,d,y,mat,v=64):
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=d,location=(0,y+d/2,Lz),rotation=(math.radians(90),0,0),vertices=v)
    o=bpy.context.active_object; o.data.materials.append(mat); return o

# Mount ring
cyl(0.28,0.04,Ly,M_C); Ly+=0.04
# Rear chrome barrel
cyl(0.26,0.10,Ly,M_C); Ly+=0.10

# Focus ring (rubber)
cyl(0.27,0.12,Ly,M_R,80)
# Fine ridges
for i in range(72):
    a=2*math.pi*i/72
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0.27*math.cos(a),Ly+0.06,Lz+0.27*math.sin(a)))
    rr=bpy.context.active_object; rr.scale=(0.005,0.125,0.004); rr.rotation_euler=(0,a,0); rr.data.materials.append(M_C)
Ly+=0.12

# Middle chrome barrel
cyl(0.25,0.07,Ly,M_C); Ly+=0.07

# Aperture ring (rubber)
cyl(0.26,0.06,Ly,M_R,80)
for i in range(60):
    a=2*math.pi*i/60
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0.26*math.cos(a),Ly+0.03,Lz+0.26*math.sin(a)))
    rr=bpy.context.active_object; rr.scale=(0.004,0.065,0.0035); rr.rotation_euler=(0,a,0); rr.data.materials.append(M_C)
Ly+=0.06

# Front chrome barrel
cyl(0.27,0.05,Ly,M_C); Ly+=0.05

# Filter rim (torus)
bpy.ops.mesh.primitive_torus_add(major_radius=0.25,minor_radius=0.015,location=(0,Ly,Lz),rotation=(math.radians(90),0,0),major_segments=64,minor_segments=10)
bpy.context.active_object.data.materials.append(M_C)

# Inner dark ring
cyl(0.23,0.01,Ly-0.005,M_D)

# Front glass
cyl(0.21,0.012,Ly+0.008,M_G)

# Glass reflection highlight element (very thin, slightly convex look)
cyl(0.16,0.005,Ly-0.015,M_G)

# ============================================================
# SHUTTER BUTTON + SPEED DIAL (camera's right side, +X) — sit on top plate at Z=0.91
# ============================================================
# Shutter
bpy.ops.mesh.primitive_cylinder_add(radius=0.05,depth=0.025,location=(0.52,-0.10,0.925),vertices=32); bpy.context.active_object.data.materials.append(M_C)
bpy.ops.mesh.primitive_cylinder_add(radius=0.04,depth=0.02,location=(0.52,-0.10,0.948),vertices=32); bpy.context.active_object.data.materials.append(M_C)
bpy.ops.mesh.primitive_cylinder_add(radius=0.036,depth=0.008,location=(0.52,-0.10,0.962),vertices=32); bpy.context.active_object.data.materials.append(M_R)

# Speed dial
bpy.ops.mesh.primitive_cylinder_add(radius=0.075,depth=0.025,location=(0.52,0.12,0.925),vertices=32); bpy.context.active_object.data.materials.append(M_C)
for i in range(30):
    a=2*math.pi*i/30
    bpy.ops.mesh.primitive_cube_add(size=1,location=(0.52+0.075*math.cos(a),0.12,0.925+0.075*math.sin(a)))
    rr=bpy.context.active_object; rr.scale=(0.005,0.028,0.003); rr.rotation_euler=(a,0,0); rr.data.materials.append(M_C)

# ============================================================
# REWIND + ADVANCE LEVER (camera's left, -X)
# ============================================================
bpy.ops.mesh.primitive_cylinder_add(radius=0.07,depth=0.03,location=(-0.54,0.15,0.925),vertices=32); bpy.context.active_object.data.materials.append(M_C)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-0.54,0.15,0.955)); cr=bpy.context.active_object
cr.scale=(0.05,0.012,0.008); cr.rotation_euler=(0,0,math.radians(40)); cr.data.materials.append(M_C)

bpy.ops.mesh.primitive_cylinder_add(radius=0.07,depth=0.025,location=(-0.52,-0.12,0.925),vertices=32); bpy.context.active_object.data.materials.append(M_C)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-0.70,-0.22,0.96)); arm=bpy.context.active_object
arm.scale=(0.22,0.020,0.016); arm.rotation_euler=(math.radians(20),0,math.radians(-30)); bev(arm,0.005,2); arm.data.materials.append(M_C)
bpy.ops.mesh.primitive_cylinder_add(radius=0.013,depth=0.03,location=(-0.85,-0.30,0.98),rotation=(math.radians(90),math.radians(20),math.radians(-30)),vertices=12); bpy.context.active_object.data.materials.append(M_R)

# ============================================================
# FRONT DETAILS
# ============================================================
# Self timer lever (front left, -X)
bpy.ops.mesh.primitive_cylinder_add(radius=0.02,depth=0.015,location=(-0.44,0.255,0.28),rotation=(math.radians(90),0,0),vertices=16); bpy.context.active_object.data.materials.append(M_C)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-0.44,0.28,0.30)); stl=bpy.context.active_object
stl.scale=(0.01,0.035,0.007); stl.data.materials.append(M_C)

# PC terminal
bpy.ops.mesh.primitive_cylinder_add(radius=0.013,depth=0.01,location=(-0.35,0.255,0.72),rotation=(math.radians(90),0,0),vertices=12); bpy.context.active_object.data.materials.append(M_C)

# Nameplate
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0.26,0.70)); np=bpy.context.active_object
np.scale=(0.22,0.003,0.03); np.data.materials.append(M_D)

# Strap lugs
for sx in (-0.68,0.68):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.02,minor_radius=0.004,location=(sx,0.10,0.82),rotation=(math.radians(90),0,0),major_segments=10,minor_segments=5)
    bpy.context.active_object.data.materials.append(M_C)
    # Move lug attachment points up slightly so they connect to top plate

# ============================================================
# LIGHTING (three-point studio)
# Key: from front-upper-RIGHT (viewer's left) - because camera is at +X,+Y,+Z
#   Actually viewer looks from direction that shows front(+Y) and camera's right(+X),
#   which means viewer is at positive X, positive Y.
#   So key light from viewer's upper left = camera's upper right? Let's just place by feel.
# ============================================================
def light(loc, energy, size, color, target=(0,0.5,0.55)):
    bpy.ops.object.light_add(type='AREA',location=loc); l=bpy.context.active_object
    l.data.energy=energy; l.data.size=size; l.data.color=color
    d=mathutils.Vector(target)-mathutils.Vector(loc)
    l.rotation_euler=d.to_track_quat('-Z','Y').to_euler()

# Subject center ≈ (0, 0.5, 0.55)
# Viewer camera is at (+X, +Y, +Z) looking at center.
# Key light: from viewer's front-left-upper = subject's (-X, +Y, +Z) quadrant (camera right)
light((-2.2, 2.0, 2.6), 700, 2.5, (1.0,0.96,0.92))
# Fill: viewer's right side = subject's (+X, +Y, +Z) quadrant (camera left)
light((2.8, 1.2, 1.0), 180, 4.5, (0.93,0.96,1.0))
# Rim: from behind subject (-Y side)
light((0,-2.8,1.8), 250, 2.0, (1,1,1))
# Top soft fill
light((0,0.5,4.0), 80, 5.0, (1,1,1))

# ============================================================
# RENDER CAMERA
# Classic 3/4 product shot: position at (-X? +X?, +Y, +Z),
# rotated to look at subject center (0, ~0.5, ~0.55)
#
# To show: lens (front +Y), camera's right side (where shutter is at +X), top (+Z).
# So viewer needs to be in the +X, +Y, +Z octant, looking toward origin.
# But we also want it slightly offset so we see some of the top AND the right side.
# We'll aim camera at center manually.
# ============================================================
import mathutils
cam_loc = mathutils.Vector((3.0, -3.5, 2.3))   # wait no! If lens points +Y (forward), then +Y should be toward viewer for a front shot.
# Let me re-derive carefully:
# - We want the FRONT of lens to face toward viewer. Lens extends in +Y direction, end at Ly ~ 0.75.
# - So viewer must be on the +Y side of the camera (not -Y!).
# - We want to see the camera's RIGHT side (+X face has shutter) → viewer must be on -X side
#   (if you stand on -X side looking toward center, you see the +X face on the right of the subject).
#   Wait no. If subject is at origin, camera at (-X, ...), and you look along +X direction,
#   you see the -X face of the subject. To see the +X face, camera must be at +X, looking -X.
# - To see TOP, camera must be at +Z looking -Z.
#
# So: to see FRONT(+Y face) + RIGHT SIDE(+X face) + TOP(+Z face):
#   Front(+Y face) → camera at +Y, looking -Y
#   Right side(+X face) → camera at +X, looking -X
#   Top → camera at +Z, looking -Z
# So camera is in (+X, +Y, +Z) octant, looking back toward (-X,-Y,-Z) direction.
# But that shows the RIGHT side from viewer's left? Let me just position empirically:
# camera at (+X, +Y, +Z), rotation points toward center.

# Camera location
cam_pos = mathutils.Vector((2.6, 2.6, 1.9))
look_at = mathutils.Vector((0, 0.4, 0.55))

bpy.ops.object.camera_add(location=cam_pos)
rcam=bpy.context.active_object; rcam.name="RenderCam"
bpy.context.scene.camera=rcam

# Point camera at look_at
direction = look_at - cam_pos
rot_quat = direction.to_track_quat('-Z', 'Y')
rcam.rotation_euler = rot_quat.to_euler()

rcam.data.lens=90
rcam.data.dof.use_dof=True
rcam.data.dof.focus_distance=(cam_pos-look_at).length
rcam.data.dof.aperture_fstop=4.5

# ============================================================
# WORLD & RENDER SETTINGS
# ============================================================
sc=bpy.context.scene
sc.render.engine='BLENDER_EEVEE_NEXT'
sc.render.resolution_x=800; sc.render.resolution_y=800; sc.render.resolution_percentage=100
sc.render.image_settings.file_format='PNG'; sc.render.image_settings.color_mode='RGBA'
sc.eevee.taa_render_samples=256
sc.eevee.use_raytracing=True

w=sc.world; w.use_nodes=True; wn=w.node_tree.nodes; wl=w.node_tree.links
wn.clear(); wo=wn.new('ShaderNodeOutputWorld'); wb=wn.new('ShaderNodeBackground')
wb.inputs['Color'].default_value=(0.91,0.91,0.91,1); wb.inputs['Strength'].default_value=0.6
wl.new(wb.outputs['Background'],wo.inputs['Surface'])

out_dir=os.path.dirname(os.path.abspath(__file__))
if not out_dir: out_dir='.'
sc.render.filepath=os.path.join(out_dir,'camera_final.png')
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out_dir,'camera_final.blend'))
print("Final render complete!")