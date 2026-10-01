"""Winter Diorama v2 — Curly-Roof Fairy Tale Cottage."""
import bpy, sys, os, math, random, mathutils, bmesh
from mathutils import Vector
random.seed(42)

argv = sys.argv[sys.argv.index("--") + 1:]
BLEND_PATH = argv[0]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.film_transparent = False
scene.render.resolution_x = 1600
scene.render.resolution_y = 1600
ee = scene.eevee
ee.use_shadows = True; ee.shadow_ray_count=4; ee.shadow_step_count=8
ee.taa_render_samples = 96

# Compositor Glare (soft halo)
scene.use_nodes = True
ct = scene.node_tree
for n in list(ct.nodes): ct.nodes.remove(n)
rl = ct.nodes.new('CompositorNodeRLayers')
glare = ct.nodes.new('CompositorNodeGlare')
glare.glare_type='FOG_GLOW'; glare.quality='HIGH'
glare.threshold=3.0; glare.size=7; glare.fade=0.85
comp = ct.nodes.new('CompositorNodeComposite')
ct.links.new(rl.outputs['Image'], glare.inputs['Image'])
ct.links.new(glare.outputs['Image'], comp.inputs['Image'])

# World sky — winter dusk (view-direction gradient)
# In Blender, Geometry.Incoming points TO the camera FROM the surface,
# so when looking STRAIGHT UP, Incoming points down → Z ≈ -1.
# When looking at horizon, Incoming is horizontal → Z ≈ 0.
# We map Z from [-1,0] → [0,1] (zenith→0 deep blue, horizon→1 warm), clamp.
world = bpy.data.worlds.new("World"); scene.world = world
world.use_nodes = True
wn = world.node_tree.nodes; wl = world.node_tree.links
for n in list(wn): wn.remove(n)
geom = wn.new('ShaderNodeNewGeometry')
sep = wn.new('ShaderNodeSeparateXYZ')
# fac = clamp(-z, 0, 1): zenith z=-1 → fac=1 (deep blue), horizon z=0 → fac=0 (warm)
neg = wn.new('ShaderNodeMath'); neg.operation='MULTIPLY'; neg.inputs[1].default_value=-1.0
cl_lo = wn.new('ShaderNodeMath'); cl_lo.operation='MAXIMUM'; cl_lo.inputs[1].default_value=0.0
cl_hi = wn.new('ShaderNodeMath'); cl_hi.operation='MINIMUM'; cl_hi.inputs[1].default_value=1.0
# flip again so horizon is warm (we'll put warm at fac=1 by swapping ramp positions)
flip = wn.new('ShaderNodeMath'); flip.operation='SUBTRACT'; flip.inputs[0].default_value=1.0
rampw = wn.new('ShaderNodeValToRGB')
rampw.color_ramp.elements[0].position=0.0
rampw.color_ramp.elements[0].color=(0.03,0.05,0.15,1)  # zenith deep navy
rampw.color_ramp.elements[1].position=1.0
rampw.color_ramp.elements[1].color=(0.85,0.40,0.30,1) # horizon warm
mid = rampw.color_ramp.elements.new(0.55)
mid.color=(0.20,0.22,0.45,1)
bgw = wn.new('ShaderNodeBackground'); bgw.inputs['Strength'].default_value=5.0
outw = wn.new('ShaderNodeOutputWorld')
wl.new(geom.outputs['Incoming'], sep.inputs['Vector'])
wl.new(sep.outputs['Z'], neg.inputs[0])
wl.new(neg.outputs['Value'], cl_lo.inputs[0])
wl.new(cl_lo.outputs['Value'], cl_hi.inputs[0])
wl.new(cl_hi.outputs['Value'], flip.inputs[1])
wl.new(flip.outputs['Value'], rampw.inputs['Fac'])
wl.new(rampw.outputs['Color'], bgw.inputs['Color'])
wl.new(bgw.outputs['Background'], outw.inputs['Surface'])

# ---------- Material helpers ----------
def new_mat(name, bc=(0.8,0.8,0.8,1), rough=0.8, spec=0.2, em=None, ems=0.0):
    m = bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    b.inputs['Base Color'].default_value=bc
    b.inputs['Roughness'].default_value=rough
    b.inputs['Specular IOR Level'].default_value=spec
    if em is not None:
        b.inputs['Emission Color'].default_value=em
        b.inputs['Emission Strength'].default_value=ems
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(b.outputs['BSDF'], o.inputs['Surface'])
    return m

def new_mat_tex(name, bc=(0.8,0.8,0.8,1), rough=0.8, ns=3.0, nstr=0.15):
    m = bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    tc=nt.nodes.new('ShaderNodeTexCoord')
    no=nt.nodes.new('ShaderNodeTexNoise'); no.inputs['Scale'].default_value=ns; no.inputs['Detail'].default_value=4
    rp=nt.nodes.new('ShaderNodeValToRGB')
    rp.color_ramp.elements[0].position=0.4; rp.color_ramp.elements[1].position=0.6
    rp.color_ramp.elements[0].color=(max(0,1-nstr),)*3+(1,)
    rp.color_ramp.elements[1].color=(min(2,1+nstr),)*3+(1,)
    mx=nt.nodes.new('ShaderNodeMixRGB'); mx.blend_type='MULTIPLY'
    mx.inputs['Color1'].default_value=bc; mx.inputs['Fac'].default_value=1.0
    bs=nt.nodes.new('ShaderNodeBsdfPrincipled'); bs.inputs['Roughness'].default_value=rough
    o=nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(tc.outputs['Generated'], no.inputs['Vector'])
    nt.links.new(no.outputs['Fac'], rp.inputs['Fac'])
    nt.links.new(rp.outputs['Color'], mx.inputs['Color2'])
    nt.links.new(mx.outputs['Color'], bs.inputs['Base Color'])
    nt.links.new(bs.outputs['BSDF'], o.inputs['Surface'])
    return m

# Materials (warmer, more storybook color palette)
M_DARK   = new_mat_tex("WDark",(0.28,0.15,0.08,1),0.75,6,0.25)
M_MED    = new_mat_tex("WMed",(0.60,0.38,0.20,1),0.8,5,0.2)
M_WALL   = new_mat_tex("Wall",(0.96,0.83,0.58,1),0.9,9,0.08)    # warm cream
M_WALLD  = new_mat_tex("WallD",(0.70,0.52,0.28,1),0.92,9,0.12)  # darker wood trim
M_ROOF   = new_mat_tex("Roof",(0.55,0.22,0.15,1),0.80,10,0.20)  # rich terracotta-brown thatch
M_SNOW   = new_mat_tex("Snow",(0.93,0.96,1.00,1),0.18,25,0.04)  # cool white
M_STONE  = new_mat_tex("Stone",(0.50,0.48,0.52,1),0.95,18,0.22)
M_PINE   = new_mat_tex("Pine",(0.08,0.25,0.14,1),0.9,8,0.20)
M_CHIM   = new_mat_tex("Chim",(0.72,0.40,0.25,1),0.85,10,0.18)
M_DOOR   = new_mat_tex("Door",(0.35,0.15,0.08,1),0.65,6,0.18)
M_GLASS  = new_mat("Glass",(1.0,0.72,0.30,1),0.12,0.9,em=(1.0,0.65,0.20,1),ems=25.0)
M_ICI    = new_mat("Ici",(0.85,0.94,1.0,0.55),0.05,1.0)
M_BASE   = new_mat_tex("Base",(0.20,0.12,0.06,1),0.55,4,0.30)
M_PATH   = new_mat_tex("Path",(0.48,0.46,0.44,1),0.9,22,0.22)
M_CARROT = new_mat("Carrot",(0.95,0.45,0.10,1),0.7)
M_COAL   = new_mat("Coal",(0.05,0.05,0.05,1),0.55,0.4)
M_SCARF  = new_mat_tex("Scarf",(0.88,0.12,0.18,1),0.85,18,0.12)
M_SMOKE  = new_mat("Smoke",(0.85,0.85,0.90,0.28),1.0)
M_FENCE  = new_mat_tex("Fence",(0.55,0.38,0.22,1),0.85,7,0.20)
M_FIRE   = new_mat("Fire",(1.0,0.55,0.15,1),0.4,em=(1.0,0.55,0.18,1),ems=35.0)
M_WFR    = new_mat_tex("WFr",(0.22,0.11,0.05,1),0.65,4,0.10)
M_BRASS  = new_mat("Brass",(0.85,0.62,0.22,1),0.25,1.0)
M_GOLD   = new_mat("Gold",(0.98,0.78,0.30,1),0.25,1.0,em=(1.0,0.78,0.25,1),ems=1.5)
M_ROPE   = new_mat("Rope",(0.55,0.35,0.18,1),0.9)

# ---------- Helpers ----------
def link(o): bpy.context.collection.objects.link(o); return o
def ofm(n,m): return link(bpy.data.objects.new(n,m))
def smooth(o):
    for p in o.data.polygons: p.use_smooth=True
def bev(o,w=0.02,s=2,ang=True):
    m=o.modifiers.new("B","BEVEL"); m.width=w; m.segments=s
    if ang: m.limit_method='ANGLE'; m.angle_limit=math.radians(35)
    return m

def add_sun(loc, e=8.0, col=(1,0.95,0.85), ang=2.0):
    s = bpy.data.objects.new("S",bpy.data.lights.new("S","SUN"))
    s.data.energy=e; s.data.color=col; s.data.angle=math.radians(ang); link(s); s.location=loc
    s.rotation_euler=(Vector((0,0,0.4))-Vector(loc)).to_track_quat('-Z','Y').to_euler(); return s
def add_pt(loc, col=(1,0.8,0.5), e=300, sz=0.3):
    p = bpy.data.objects.new("P",bpy.data.lights.new("P","POINT"))
    p.data.energy=e; p.data.color=col; p.data.shadow_soft_size=sz; p.data.use_shadow=True
    link(p); p.location=loc; return p
def add_area(loc, rot, sz=2.0, e=200, col=(1,1,1)):
    a = bpy.data.objects.new("A",bpy.data.lights.new("A","AREA"))
    a.data.energy=e; a.data.color=col; a.data.size=sz; a.data.size_y=sz
    link(a); a.location=loc; a.rotation_euler=rot; return a

# ============== BASE ==============
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0.12))
base = bpy.context.active_object; base.name="Base"
base.scale=(3.2,3.2,0.35); bpy.ops.object.transform_apply(scale=True,location=True)
bev(base,0.28,6,False); smooth(base); base.data.materials.append(M_BASE)

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0.36))
gsnow = bpy.context.active_object; gsnow.name="GSnow"
gsnow.scale=(3.0,3.0,0.18); bpy.ops.object.transform_apply(scale=True,location=True)
bev(gsnow,0.20,4,False); 
d=gsnow.modifiers.new("D","DISPLACE")
tx=bpy.data.textures.new("D","CLOUDS"); tx.noise_scale=1.5; tx.noise_depth=3
d.texture=tx; d.strength=0.025
smooth(gsnow); gsnow.data.materials.append(M_SNOW)

# ============== CABIN BODY ==============
CY = 0.20; WH = 0.90; HWX = 1.0; HWY = 0.90; BZ = 0.37 + WH/2

bpy.ops.mesh.primitive_cube_add(size=1, location=(0,CY,BZ))
body = bpy.context.active_object; body.name="Body"
body.scale=(HWX,HWY,WH/2); bpy.ops.object.transform_apply(scale=True,location=True)
bev(body,0.05,3); smooth(body); body.data.materials.append(M_WALL)

# front/back trim strips
for (dy,name) in [(-HWY-0.005,"TrimF"),(HWY+0.005,"TrimB")]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,CY+dy,BZ))
    t=bpy.context.active_object; t.name=name
    t.scale=(HWX+0.04,0.025,WH/2+0.02); bpy.ops.object.transform_apply(scale=True,location=True)
    t.data.materials.append(M_WALLD)
# vertical log lines (decorative)
for sx in [-0.5,0,0.5]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(sx,CY-HWY-0.02,BZ))
    ll=bpy.context.active_object
    ll.scale=(0.012,0.005,WH/2+0.01); bpy.ops.object.transform_apply(scale=True,location=True)
    ll.data.materials.append(M_WALLD)

# ============== ROOF: Storybook gable (pitched) roof with sagging ridge ==============
def build_roof_mesh():
    """Triangular gable roof with slightly sagging ridge and curling eaves.
    Ridge runs along X (side to side); gables face front/back."""
    NX, NY = 28, 24
    OX, OY = 0.18, 0.30
    SX = HWX*2 + OX*2
    SY = HWY*2 + OY*2
    hx, hy = SX/2, SY/2
    PEAK = 0.78
    ZE = 0.37 + WH
    tv=[]; bv=[]
    for j in range(NY+1):
        for i in range(NX+1):
            x=-hx+(i/NX)*SX; y=-hy+(j/NY)*SY
            dr=abs(y); ty=dr/hy
            sag = -0.12*(1 - (x/hx)**2)          # ridge sags in middle
            corner = max(0,abs(x)/hx-0.7)/0.3 * max(0,ty-0.75)/0.25
            curl = -0.08*corner*corner
            z = ZE + PEAK*(1-ty) + sag*(1-ty*0.5) + curl
            tv.append((x, y+CY, z))
    for v in tv:
        x,y,z=v; xn=abs(x)/HWX; yn=abs(y-CY)/HWY
        zb = ZE-0.02 if (xn<1 and yn<1) else z-0.04
        bv.append((x,y,zb))
    off=len(tv); verts=tv+bv; faces=[]
    for j in range(NY):
        for i in range(NX):
            a=j*(NX+1)+i;b=a+1;c=a+(NX+1)+1;d=a+(NX+1); faces.append((a,b,c,d))
    for j in range(NY):
        for i in range(NX):
            a=off+j*(NX+1)+i;b=a+1;c=a+(NX+1)+1;d=a+(NX+1); faces.append((a,d,c,b))
    for i in range(NX):
        t1=i;t2=i+1;b1=off+i;b2=off+i+1;faces.append((t1,t2,b2,b1))
    for i in range(NX):
        t1=NY*(NX+1)+i;t2=t1+1;b1=off+NY*(NX+1)+i;b2=b1+1;faces.append((t1,b1,b2,t2))
    for j in range(NY):
        t1=j*(NX+1);t2=t1+(NX+1);b1=off+j*(NX+1);b2=b1+(NX+1);faces.append((t1,b1,b2,t2))
    for j in range(NY):
        t1=j*(NX+1)+NX;t2=t1+(NX+1);b1=off+j*(NX+1)+NX;b2=b1+(NX+1);faces.append((t1,t2,b2,b1))
    return verts, faces, tv, NX, NY, hx, hy, ZE, PEAK, SX, SY

rv, rf, rtop, rNX, rNY, rhx, rhy, rZ0, rPEAK, rSX, rSY = build_roof_mesh()
me=bpy.data.meshes.new("Roof"); me.from_pydata(rv,[],rf); me.update()
roof=ofm("Roof",me); smooth(roof); bev(roof,0.01,2); roof.data.materials.append(M_ROOF)

# Gable wall triangles (fill wall under roof slope on front/back)
def _gable(front=True):
    sign = -1 if front else 1
    yw = CY + sign*HWY
    # top edge points along roof at wall plane
    pts=[]
    for i in range(rNX+1):
        x=-rhx+(i/rNX)*rSX
        if abs(x) > HWX: continue
        dr=HWY; ty=dr/rhy
        sag=-0.12*(1-(x/rhx)**2)
        z=rZ0+rPEAK*(1-ty)+sag*(1-ty*0.5)
        pts.append((x,z))
    verts_g=[]; faces_g=[]
    for (x,z) in pts: verts_g.append((x,yw+0.002,z))
    ntop=len(pts)
    xmin=min(p[0] for p in pts); xmax=max(p[0] for p in pts)
    verts_g.append((xmin,yw+0.002,rZ0))
    verts_g.append((xmax,yw+0.002,rZ0))
    for i in range(ntop-1):
        xi=pts[i][0]; xi1=pts[i+1][0]
        bi=ntop+2+(i*2); bi1=bi+1
        verts_g.append((xi,yw+0.002,rZ0))
        verts_g.append((xi1,yw+0.002,rZ0))
        faces_g.append((i,i+1,bi1,bi))
    mg=bpy.data.meshes.new("Gb"); mg.from_pydata(verts_g,[],faces_g); mg.update()
    go=ofm("Gable"+("F" if front else "B"),mg); smooth(go); go.data.materials.append(M_WALLD)
_gable(True); _gable(False)

# Snow on roof — accumulates on upper slopes near ridge, thins toward eaves
def rz_(xr,yr):
    dr=abs(yr*rhy); ty=dr/rhy
    sag=-0.12*(1-xr*xr)
    corner=max(0,abs(xr)-0.7)/0.3 * max(0,ty-0.75)/0.25
    curl=-0.08*corner*corner
    return rZ0+rPEAK*(1-ty)+sag*(1-ty*0.5)+curl

sv=[]; sb=[]
for j in range(rNY+1):
    for i in range(rNX+1):
        x=-rhx+(i/rNX)*rSX; y=-rhy+(j/rNY)*rSY
        xr=x/rhx; yr=y/rhy; dr=abs(y)/rhy
        th = 0.14*max(0,1-dr*1.05)**1.2
        if y<0: th *= 1.10
        if dr > 0.92: th = 0.015  # thin dusting near eave edge
        # snow top = roof surface + thickness
        z_base = rz_(xr,yr)
        z = z_base + th + random.uniform(-0.003,0.012)
        sv.append((x+random.uniform(-0.006,0.006),
                   y+CY+random.uniform(-0.006,0.006), z))
        # snow bottom = follows roof exactly (no gaps!)
        sb.append((x,y+CY,z_base - 0.001))
soff=len(sv); sverts=sv+sb; sfaces=[]
for j in range(rNY):
    for i in range(rNX):
        a=j*(rNX+1)+i;b=a+1;c=a+(rNX+1)+1;d=a+(rNX+1);sfaces.append((a,b,c,d))
for j in range(rNY):
    for i in range(rNX):
        a=soff+j*(rNX+1)+i;b=a+1;c=a+(rNX+1)+1;d=a+(rNX+1);sfaces.append((a,d,c,b))
for i in range(rNX):
    t1=i;t2=i+1;b1=soff+i;b2=soff+i+1;sfaces.append((t1,t2,b2,b1))
for i in range(rNX):
    t1=rNY*(rNX+1)+i;t2=t1+1;b1=soff+rNY*(rNX+1)+i;b2=b1+1;sfaces.append((t1,b1,b2,t2))
for j in range(rNY):
    t1=j*(rNX+1);t2=t1+(rNX+1);b1=soff+j*(rNX+1);b2=b1+(rNX+1);sfaces.append((t1,b1,b2,t2))
for j in range(rNY):
    t1=j*(rNX+1)+rNX;t2=t1+(rNX+1);b1=soff+j*(rNX+1)+rNX;b2=b1+(rNX+1);sfaces.append((t1,t2,b2,b1))
me2=bpy.data.meshes.new("RSnow"); me2.from_pydata(sverts,[],sfaces); me2.update()
rs=ofm("RSnow",me2); smooth(rs); rs.data.materials.append(M_SNOW)

# Ridge finial at center of ridge
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.06, radius2=0.025, depth=0.25,
                                location=(0,CY,rZ0+rPEAK-0.10+0.10))
sp=bpy.context.active_object; sp.name="Spire"; sp.data.materials.append(M_CHIM)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.04, location=(0,CY,rZ0+rPEAK-0.10+0.25))
orb=bpy.context.active_object; orb.name="Orb"; orb.data.materials.append(M_GOLD)

# ============== DOOR ==============
DY = CY - HWY - 0.005
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,DY,0.37+0.36))
door=bpy.context.active_object; door.name="Door"
door.scale=(0.22,0.05,0.36); bpy.ops.object.transform_apply(scale=True,location=True)
bev(door,0.01,2); door.data.materials.append(M_DOOR)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.02, location=(0.08,DY-0.04,0.37+0.38))
knob=bpy.context.active_object; knob.data.materials.append(M_BRASS)
# Arch
bpy.ops.mesh.primitive_torus_add(major_radius=0.14, minor_radius=0.022,
                                  location=(0,DY-0.01,0.37+0.72), rotation=(math.pi/2,0,0))
arch=bpy.context.active_object; arch.name="Arch"
bm=bmesh.new(); bm.from_mesh(arch.data)
for v in bm.verts: v.select = v.co.z < -0.005
bm.select_flush(True)
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.select], context='VERTS')
bm.to_mesh(arch.data); bm.free()
arch.data.materials.append(M_WFR)
for dx in [-0.15,0.15]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(dx,DY-0.01,0.37+0.40))
    p=bpy.context.active_object; p.scale=(0.03,0.03,0.36)
    bpy.ops.object.transform_apply(scale=True,location=True); p.data.materials.append(M_WFR)
# ============== PORCH (small overhang above door) ==============
eave_z_mid = rz_(0, -1.0)  # front eave at x=0 (yr=-1 is front edge)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, DY-0.25, eave_z_mid-0.10))
po=bpy.context.active_object; po.name="Porch"
po.scale=(0.50,0.22,0.035); bpy.ops.object.transform_apply(scale=True,location=True)
po.data.materials.append(M_ROOF)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, DY-0.25, eave_z_mid-0.06))
pos=bpy.context.active_object; pos.name="PorchS"
pos.scale=(0.52,0.24,0.03); bpy.ops.object.transform_apply(scale=True,location=True)
pos.data.materials.append(M_SNOW)
for dx in [-0.22,0.22]:
    pz_top=eave_z_mid-0.10-0.02; pz_bot=0.46; ph=(pz_top-pz_bot)/2
    bpy.ops.mesh.primitive_cube_add(size=1, location=(dx, DY-0.38, pz_bot+ph))
    pp=bpy.context.active_object
    pp.scale=(0.022,0.022,ph); bpy.ops.object.transform_apply(scale=True,location=True)
    pp.data.materials.append(M_WFR)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,DY-0.28,0.405))
st=bpy.context.active_object; st.name="Step"
st.scale=(0.30,0.14,0.07); bpy.ops.object.transform_apply(scale=True,location=True)
bev(st,0.015,2); st.data.materials.append(M_STONE)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0,DY-0.18,0.465))
st2=bpy.context.active_object; st2.name="Step2"
st2.scale=(0.36,0.08,0.06); bpy.ops.object.transform_apply(scale=True,location=True)
bev(st2,0.015,2); st2.data.materials.append(M_STONE)

# ============== WINDOWS ==============
def win(cx, cy, cz, w=0.20, h=0.20, face='front'):
    if face in ('front','back'):
        sgn=-1 if face=='front' else 1
        th=(w+0.04,0.04,h+0.04); gth=(w*0.88,0.02,h*0.88)
        mth=(0.012,0.05,h); mht=(w,0.05,0.012); rot=0
        gl_off = (0, sgn*0.02, 0)
    else:
        sgn=-1 if face=='left' else 1
        th=(0.04,w+0.04,h+0.04); gth=(0.02,w*0.88,h*0.88)
        mth=(0.05,0.012,h); mht=(0.05,w,0.012); rot=math.pi/2
        gl_off = (sgn*0.02, 0, 0)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx,cy,cz))
    fr=bpy.context.active_object; fr.scale=th
    bpy.ops.object.transform_apply(scale=True,location=True)
    if rot: fr.rotation_euler.z=rot; bpy.ops.object.transform_apply(rotation=True)
    fr.data.materials.append(M_WFR)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx+gl_off[0],cy+gl_off[1],cz))
    gl=bpy.context.active_object; gl.scale=gth
    bpy.ops.object.transform_apply(scale=True,location=True)
    if rot: gl.rotation_euler.z=rot; bpy.ops.object.transform_apply(rotation=True)
    gl.data.materials.append(M_GLASS)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx,cy,cz))
    mv=bpy.context.active_object; mv.scale=mth
    bpy.ops.object.transform_apply(scale=True,location=True)
    if rot: mv.rotation_euler.z=rot; bpy.ops.object.transform_apply(rotation=True)
    mv.data.materials.append(M_WFR)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx,cy,cz))
    mh=bpy.context.active_object; mh.scale=mht
    bpy.ops.object.transform_apply(scale=True,location=True)
    if rot: mh.rotation_euler.z=rot; bpy.ops.object.transform_apply(rotation=True)
    mh.data.materials.append(M_WFR)

# front windows (two)
win(-0.55, CY-HWY+0.005, 0.37+0.55, face='front')
win( 0.55, CY-HWY+0.005, 0.37+0.55, face='front')
# side windows
win(-HWX+0.005, CY, 0.37+0.55, face='left')
win( HWX-0.005, CY, 0.37+0.55, face='right')
# back window
win(0, CY+HWY-0.005, 0.37+0.55, face='back')

# ============== CHIMNEY (offset on roof, tilted whimsically) ==============
# Place at (-0.55, CY+0.45) → on back half of roof slope
chx, chy = -0.55, CY + 0.40
ctx = chx/rhx; cty = (chy-CY)/rhy
# roof surface + snow thickness at this point (matches snow formula)
dr=abs(cty*rhy)/rhy
ch_th = 0.14*max(0,1-dr*1.05)**1.2
if cty<0: ch_th *= 1.10
if dr>0.92: ch_th=0.015
chz = rz_(ctx,cty) + ch_th

bpy.ops.mesh.primitive_cube_add(size=1, location=(chx, chy, chz+0.16))
ch=bpy.context.active_object; ch.name="Chim"
ch.scale=(0.14,0.14,0.32); ch.rotation_euler=(0.06,-0.03,0.08)
bpy.ops.object.transform_apply(scale=True,location=True,rotation=True)
bev(ch,0.01,2); ch.data.materials.append(M_CHIM)
bpy.ops.mesh.primitive_cube_add(size=1, location=(chx-0.01,chy-0.01,chz+0.32+0.16+0.02))
cc=bpy.context.active_object; cc.name="ChimCap"
cc.scale=(0.20,0.20,0.035); bpy.ops.object.transform_apply(scale=True,location=True)
cc.data.materials.append(M_STONE)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(chx-0.01,chy-0.01,chz+0.32+0.16+0.06))
cs=bpy.context.active_object; cs.name="ChimSnow"
cs.scale=(1.1,1.1,0.35); bpy.ops.object.transform_apply(scale=True,location=True)
cs.data.materials.append(M_SNOW)
smoke_top = chz+0.32+0.16+0.08
for i in range(5):
    r = 0.045 + i*0.02
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r,
        location=(chx-0.01+random.uniform(-0.01,0.01),
                  chy-0.01+random.uniform(-0.01,0.01)+i*0.05,
                  smoke_top+i*0.09))
    sm=bpy.context.active_object; sm.name="Smoke"
    sm.data.materials.append(M_SMOKE)

# ============== ICICLES hanging from eaves ==============
def icicle(x,y,z,l=0.18):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.014+random.uniform(0,0.008),
        radius2=0.002, depth=l, location=(x,y,z-l/2))
    ic=bpy.context.active_object; ic.name="Ici"; ic.data.materials.append(M_ICI)

def roof_z_at(x, y):
    """Return z of roof top at world (x, y) using new gable formula."""
    xr = x/rhx; yr = (y-CY)/rhy
    return rz_(xr, yr)

eaves_pts=[]
# Front eaves
for i in range(15):
    t=i/14; x=-rhx+0.02+t*(rSX-0.04); y=CY-rhy+0.05
    if abs(x)<0.28: continue
    z = roof_z_at(x, y) - 0.02
    eaves_pts.append((x,y,z))
# Back eaves
for i in range(13):
    t=i/12; x=-rhx+0.02+t*(rSX-0.04); y=CY+rhy-0.05
    z = roof_z_at(x, y) - 0.02
    eaves_pts.append((x,y,z))
# Left eaves
for i in range(9):
    t=i/8; x=-rhx+0.05; y=CY-rhy+0.05+t*(rSY-0.10)
    z = roof_z_at(x, y) - 0.02
    eaves_pts.append((x,y,z))
# Right eaves
for i in range(9):
    t=i/8; x=rhx-0.05; y=CY-rhy+0.05+t*(rSY-0.10)
    z = roof_z_at(x, y) - 0.02
    eaves_pts.append((x,y,z))
for (x,y,z) in eaves_pts:
    icicle(x,y,z, random.uniform(0.07,0.18))

# ============== FENCE (simple pickets) ==============
def picket(x,y,z=0.52):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,y,z))
    p=bpy.context.active_object; p.name="Picket"
    p.scale=(0.04,0.04,0.22); bpy.ops.object.transform_apply(scale=True,location=True)
    bev(p,0.008,2); p.data.materials.append(M_FENCE)
def rail(p1,p2,z):
    dx=p2[0]-p1[0]; dy=p2[1]-p1[1]; l=math.hypot(dx,dy)
    if l<0.01: return
    bpy.ops.mesh.primitive_cube_add(size=1, location=((p1[0]+p2[0])/2,(p1[1]+p2[1])/2,z))
    r=bpy.context.active_object; r.name="Rail"
    r.scale=(l/2,0.025,0.02); r.rotation_euler.z=math.atan2(dy,dx)
    bpy.ops.object.transform_apply(scale=True,location=True,rotation=True)
    r.data.materials.append(M_FENCE)

posts=[]
# Front line (gate gap middle)
for i in range(15):
    t=i/14; x=-1.4+t*2.8; y=-1.55
    if abs(x)<0.23: continue
    posts.append((x,y)); picket(x,y)
posts.append((-0.23,-1.55,0.55)); picket(-0.23,-1.55,0.55)
posts.append(( 0.23,-1.55,0.55)); picket( 0.23,-1.55,0.55)
# sides
for i in range(1,8):
    t=i/7; y=-1.55+t*1.75; posts.append((-1.4,y)); picket(-1.4,y)
for i in range(1,8):
    t=i/7; y=-1.55+t*1.75; posts.append(( 1.4,y)); picket( 1.4,y)
# rails front (two heights), skipping gate
front_left=[p for p in posts if abs(p[1]+1.55)<0.02 and p[0]<-0.2]
front_right=[p for p in posts if abs(p[1]+1.55)<0.02 and p[0]>0.2]
front_left.sort(); front_right.sort()
for ps in [front_left, front_right]:
    for i in range(len(ps)-1):
        rail(ps[i],ps[i+1],0.45); rail(ps[i],ps[i+1],0.58)
# sides
left=[p for p in posts if abs(p[0]+1.4)<0.02 and p[1]>-1.5]; left.sort(key=lambda x:x[1])
right=[p for p in posts if abs(p[0]-1.4)<0.02 and p[1]>-1.5]; right.sort(key=lambda x:x[1])
for ps in [left,right]:
    for i in range(len(ps)-1):
        rail(ps[i],ps[i+1],0.45); rail(ps[i],ps[i+1],0.58)

# ============== STONE PATH ==============
for i in range(14):
    t=i/13; y=-1.5+t*1.45
    x=0.10*math.sin(t*math.pi*1.2)
    sx=random.uniform(0.08,0.13); sy=random.uniform(0.07,0.11)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,y,0.41))
    st=bpy.context.active_object; st.name="Stone"
    st.scale=(sx,sy,0.025); st.rotation_euler.z=random.uniform(-0.4,0.4)
    bpy.ops.object.transform_apply(scale=True,location=True,rotation=True)
    bev(st,0.008,2); st.data.materials.append(M_PATH)

# ============== PINE TREES (all inside plinth!) ==============
def pine(x,y,scl=1.0,seed=0):
    random.seed(seed)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.06*scl, radius2=0.09*scl,
                                     depth=0.22*scl, location=(x,y,0.37+0.11*scl))
    tk=bpy.context.active_object; tk.data.materials.append(M_DARK)
    tiers=4
    for i in range(tiers):
        r=(0.28-0.05*i)*scl; h=0.34*scl
        z=0.37+0.22*scl + i*0.16*scl
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r, radius2=r*0.2, depth=h,
                                         location=(x+random.uniform(-0.015,0.015),
                                                   y+random.uniform(-0.015,0.015),z))
        c=bpy.context.active_object; c.data.materials.append(M_PINE)
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r*0.92, radius2=r*0.18,
                                         depth=0.04*scl, location=(x,y,z+h/2-0.005))
        sn=bpy.context.active_object; sn.data.materials.append(M_SNOW)
    random.seed(42)
pine(-2.0, 0.4, 1.15, 1)
pine( 2.0, 0.6, 1.00, 2)
pine(-1.7, 1.4, 0.75, 3)
pine( 1.7, 1.5, 0.70, 4)
pine(-2.1,-0.8, 0.55, 5)
pine( 2.1,-0.9, 0.60, 6)
pine(-0.9, 1.8, 0.50, 7)
pine( 0.9, 1.9, 0.48, 8)

# ============== SNOWMAN ==============
def snowman(x,y):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(x,y,0.37+0.22))
    b1=bpy.context.active_object; b1.data.materials.append(M_SNOW)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.16, location=(x,y,0.37+0.55))
    b2=bpy.context.active_object; b2.data.materials.append(M_SNOW)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, location=(x,y,0.37+0.80))
    hd=bpy.context.active_object; hd.data.materials.append(M_SNOW)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.02, location=(x,y,0.37+0.92))
    br=bpy.context.active_object; br.data.materials.append(M_COAL)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.12, location=(x,y,0.37+0.99))
    tp=bpy.context.active_object; tp.data.materials.append(M_COAL)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.071, depth=0.02, location=(x,y,0.37+0.95))
    bd=bpy.context.active_object; bd.data.materials.append(M_SCARF)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.04, location=(x,y,0.37+0.70))
    sc=bpy.context.active_object; sc.data.materials.append(M_SCARF)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.015, radius2=0.03, depth=0.07,
                                     location=(x,y+0.10,0.37+0.80), rotation=(math.pi/2,0,0))
    ns=bpy.context.active_object; ns.data.materials.append(M_CARROT)
    for dx in [-0.035,0.035]:
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.01, location=(x+dx,y+0.10,0.37+0.84))
        e=bpy.context.active_object; e.data.materials.append(M_COAL)
    for i in range(3):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.01, location=(x,y+0.02,0.37+0.60-i*0.06))
        bt=bpy.context.active_object; bt.data.materials.append(M_COAL)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.30,
                                         location=(x-0.20,y,0.37+0.60),
                                         rotation=(0,math.pi/3,-math.pi/6))
    a1=bpy.context.active_object; a1.data.materials.append(M_DARK)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.01, depth=0.30,
                                         location=(x+0.20,y,0.37+0.60),
                                         rotation=(0,-math.pi/3,math.pi/6))
    a2=bpy.context.active_object; a2.data.materials.append(M_DARK)
snowman(0.95,-0.70)

# ============== FIREWOOD + FIREFIT ==============
def firewood(x,y):
    random.seed(9)
    for i in range(7):
        r=random.uniform(0.03,0.05); l=random.uniform(0.16,0.25)
        bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=l,
            location=(x+random.uniform(-0.06,0.06),y+random.uniform(-0.02,0.02),0.37+r+i*0.005),
            rotation=(random.uniform(-0.2,0.2), math.pi/2+random.uniform(-0.2,0.2), random.uniform(-0.3,0.3)))
        lg=bpy.context.active_object; lg.name="Log"; lg.data.materials.append(M_DARK)
    random.seed(42)
firewood(-1.05,-0.85)

def firepit(x,y):
    for i in range(8):
        a=i/8*2*math.pi
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, location=(x+math.cos(a)*0.16, y+math.sin(a)*0.16, 0.40))
        st=bpy.context.active_object; st.scale=(1,1,0.55)
        bpy.ops.object.transform_apply(scale=True); st.data.materials.append(M_STONE)
    for i in range(3):
        a=i/3*2*math.pi
        bpy.ops.mesh.primitive_cylinder_add(radius=0.025, depth=0.18,
                                             location=(x,y,0.43), rotation=(0,math.pi/2,a))
        lg=bpy.context.active_object; lg.data.materials.append(M_CHIM)
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=0.10, radius2=0.02, depth=0.20,
                                     location=(x,y,0.54))
    fl=bpy.context.active_object; fl.data.materials.append(M_FIRE)
    add_pt((x,y,0.55), col=(1.0,0.5,0.15), e=150, sz=0.3)
firepit(-0.85,-0.95)

# ============== SLEDS ==============
def sled(x,y):
    for dx in [-0.07,0.07]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x+dx,y,0.40))
        rn=bpy.context.active_object; rn.scale=(0.012,0.16,0.012)
        bpy.ops.object.transform_apply(scale=True,location=True); rn.data.materials.append(M_DARK)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,y,0.44))
    pf=bpy.context.active_object; pf.scale=(0.15,0.12,0.012)
    bpy.ops.object.transform_apply(scale=True,location=True); pf.data.materials.append(M_MED)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=0.18,
                                         location=(x,y-0.15,0.47),
                                         rotation=(math.pi/3,0,0))
    rp=bpy.context.active_object; rp.data.materials.append(M_ROPE)
sled(1.25,-0.70)

# ============== BUSHES ==============
def bush(x,y,scl=1.0,seed=0):
    random.seed(seed)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.18*scl, location=(x,y,0.37+0.10*scl))
    b=bpy.context.active_object; b.scale=(1,1,0.7)
    bpy.ops.object.transform_apply(scale=True); b.data.materials.append(M_PINE)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.20*scl, location=(x,y,0.37+0.18*scl))
    s=bpy.context.active_object; s.scale=(1,1,0.35)
    bpy.ops.object.transform_apply(scale=True); s.data.materials.append(M_SNOW)
    random.seed(42)
bush(0.30,0.0,0.65,10)
bush(-0.30,-0.05,0.50,11)
bush(1.05,1.15,0.45,12)

# ============== LANTERNS ==============
def lantern(x,y):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.022, depth=0.50, location=(x,y,0.62))
    po=bpy.context.active_object; po.data.materials.append(M_FENCE)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,y,0.92))
    lb=bpy.context.active_object; lb.scale=(0.07,0.07,0.10)
    bpy.ops.object.transform_apply(scale=True,location=True); lb.data.materials.append(M_GLASS)
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.06, radius2=0.02, depth=0.05,
                                     location=(x,y,1.00), rotation=(0,0,math.pi/4))
    cp=bpy.context.active_object; cp.data.materials.append(M_WFR)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x,y,0.86))
    bs=bpy.context.active_object; bs.scale=(0.08,0.08,0.015)
    bpy.ops.object.transform_apply(scale=True,location=True); bs.data.materials.append(M_WFR)
    add_pt((x,y,0.92), col=(1.0,0.7,0.3), e=60, sz=0.15)
lantern(-0.38,-0.85)
lantern( 0.38,-0.85)

# ============== LIGHTING (cinematic winter dusk) ==============
# Warm sunset rim from back-left (catches ridge, creates highlights)
add_sun((-7,5,5), e=8.0, col=(1.0,0.55,0.28), ang=2.0)
# Cool moonlight front-fill (reads snow blue)
add_sun((4,-6,6), e=6.0, col=(0.55,0.65,1.0), ang=2.0)
# Warm interior glow
add_pt((0,CY,0.80), col=(1.0,0.60,0.20), e=300, sz=0.5)
add_pt((0,CY,1.10), col=(1.0,0.70,0.30), e=70, sz=0.2)
# Ambient cool fill
add_area((0,0,10), (0,0,0), sz=10, e=40, col=(0.50,0.60,0.95))

# ============== CAMERA ==============
cam = bpy.data.objects.new("Cam", bpy.data.cameras.new("Cam"))
bpy.context.collection.objects.link(cam); scene.camera=cam
cam.data.lens=58; cam.data.sensor_width=36
cam.location=(4.5,-5.5,3.2)
tgt=Vector((0,-0.3,0.9))
cam.rotation_euler=(tgt-cam.location).to_track_quat('-Z','Y').to_euler()

# ============== SAVE ==============
bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
print("SAVE_OK:", BLEND_PATH)
