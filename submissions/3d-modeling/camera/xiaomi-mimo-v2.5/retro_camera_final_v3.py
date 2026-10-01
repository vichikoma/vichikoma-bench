import bpy
import math

# 清除场景
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# 设置渲染引擎为Eevee
bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'

# 设置输出分辨率 800x800
bpy.context.scene.render.resolution_x = 800
bpy.context.scene.render.resolution_y = 800
bpy.context.scene.render.resolution_percentage = 100

# 设置输出路径
bpy.context.scene.render.filepath = "//render_output_final.png"
bpy.context.scene.render.image_settings.file_format = 'PNG'

# ==================== 材质创建函数 ====================

def create_leather_material():
    """创建皮革材质 - 黑色/深灰色"""
    mat = bpy.data.materials.new(name="Leather_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # 清除默认节点
    for node in nodes:
        nodes.remove(node)
    
    # 创建 Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = (0.05, 0.04, 0.03, 1)  # 深灰/黑色
    principled.inputs['Roughness'].default_value = 0.85
    principled.inputs['Specular IOR Level'].default_value = 0.3
    
    # 添加噪波纹理制作皮革纹理
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 0)
    noise.inputs['Scale'].default_value = 100.0
    noise.inputs['Detail'].default_value = 20.0
    
    # 添加颜色渐变控制对比度
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.location = (-200, 0)
    color_ramp.color_ramp.elements[0].position = 0.35
    color_ramp.color_ramp.elements[1].position = 0.65
    
    # 连接节点
    links.new(noise.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], principled.inputs['Roughness'])
    
    # 输出节点
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_metal_material():
    """创建银色金属材质"""
    mat = bpy.data.materials.new(name="Metal_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # 清除默认节点
    for node in nodes:
        nodes.remove(node)
    
    # 创建 Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = (0.88, 0.88, 0.92, 1)  # 银色
    principled.inputs['Metallic'].default_value = 1.0
    principled.inputs['Roughness'].default_value = 0.12
    principled.inputs['Specular IOR Level'].default_value = 0.95
    
    # 添加拉丝纹理
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 0)
    noise.inputs['Scale'].default_value = 150.0
    noise.inputs['Detail'].default_value = 8.0
    
    # 输出节点
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_glass_material():
    """创建玻璃材质"""
    mat = bpy.data.materials.new(name="Glass_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # 清除默认节点
    for node in nodes:
        nodes.remove(node)
    
    # 创建 Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = (0.92, 0.96, 1.0, 1)  # 轻微蓝色
    principled.inputs['Roughness'].default_value = 0.02
    principled.inputs['IOR'].default_value = 1.52  # 玻璃折射率
    principled.inputs['Alpha'].default_value = 0.95
    
    # 输出节点
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_rubber_material():
    """创建橡胶材质 - 用于对焦环纹路"""
    mat = bpy.data.materials.new(name="Rubber_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # 清除默认节点
    for node in nodes:
        nodes.remove(node)
    
    # 创建 Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = (0.02, 0.02, 0.02, 1)  # 黑色
    principled.inputs['Roughness'].default_value = 0.98
    principled.inputs['Specular IOR Level'].default_value = 0.03
    
    # 输出节点
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

def create_dark_metal_material():
    """创建深色金属材质 - 用于镜头环"""
    mat = bpy.data.materials.new(name="Dark_Metal_Material")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    
    # 清除默认节点
    for node in nodes:
        nodes.remove(node)
    
    # 创建 Principled BSDF
    principled = nodes.new('ShaderNodeBsdfPrincipled')
    principled.location = (0, 0)
    principled.inputs['Base Color'].default_value = (0.15, 0.15, 0.18, 1)  # 深灰色
    principled.inputs['Metallic'].default_value = 1.0
    principled.inputs['Roughness'].default_value = 0.25
    principled.inputs['Specular IOR Level'].default_value = 0.75
    
    # 输出节点
    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (300, 0)
    links.new(principled.outputs['BSDF'], output.inputs['Surface'])
    
    return mat

# ==================== 相机部件创建函数 ====================

def create_camera_body():
    """创建相机机身"""
    # 主机身
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    body = bpy.context.active_object
    body.name = "Camera_Body"
    body.scale = (1.6, 0.85, 0.75)  # 长宽高比例
    bpy.ops.object.transform_apply(scale=True)
    
    # 应用皮革材质
    leather_mat = create_leather_material()
    body.data.materials.append(leather_mat)
    
    # 圆角处理
    bpy.ops.object.modifier_add(type='BEVEL')
    body.modifiers["Bevel"].width = 0.04
    body.modifiers["Bevel"].segments = 5
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    return body

def create_top_cover():
    """创建银色金属顶盖"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.42))
    top = bpy.context.active_object
    top.name = "Top_Cover"
    top.scale = (1.55, 0.82, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    
    # 应用金属材质
    metal_mat = create_metal_material()
    top.data.materials.append(metal_mat)
    
    # 圆角
    bpy.ops.object.modifier_add(type='BEVEL')
    top.modifiers["Bevel"].width = 0.025
    top.modifiers["Bevel"].segments = 4
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    return top

def create_lens():
    """创建镜头 - 多层镜片组"""
    lens_parts = []
    dark_metal_mat = create_dark_metal_material()
    metal_mat = create_metal_material()
    
    # 镜头外筒（主筒）
    bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=1.0, location=(-1.6, 0, 0))
    lens_outer = bpy.context.active_object
    lens_outer.name = "Lens_Outer"
    lens_outer.rotation_euler = (0, math.pi/2, 0)
    lens_outer.data.materials.append(metal_mat)
    lens_parts.append(lens_outer)
    
    # 对焦环 - 带纹路
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=0.12, location=(-1.35, 0, 0))
    focus_ring = bpy.context.active_object
    focus_ring.name = "Focus_Ring"
    focus_ring.rotation_euler = (0, math.pi/2, 0)
    focus_ring.data.materials.append(dark_metal_mat)
    lens_parts.append(focus_ring)
    
    # 对焦环纹路（小凹槽）
    for i in range(24):
        angle = i * math.pi * 2 / 24
        x = -1.35
        y = 0.41 * math.cos(angle)
        z = 0.41 * math.sin(angle)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
        groove = bpy.context.active_object
        groove.name = f"Focus_Groove_{i}"
        groove.scale = (0.02, 0.015, 0.015)
        bpy.ops.object.transform_apply(scale=True)
        groove.rotation_euler = (0, 0, angle)
        groove.data.materials.append(create_rubber_material())
    
    # 光圈环
    bpy.ops.mesh.primitive_cylinder_add(radius=0.40, depth=0.10, location=(-1.20, 0, 0))
    aperture_ring = bpy.context.active_object
    aperture_ring.name = "Aperture_Ring"
    aperture_ring.rotation_euler = (0, math.pi/2, 0)
    aperture_ring.data.materials.append(metal_mat)
    lens_parts.append(aperture_ring)
    
    # 镜头前组
    bpy.ops.mesh.primitive_cylinder_add(radius=0.36, depth=0.08, location=(-1.10, 0, 0))
    front_group = bpy.context.active_object
    front_group.name = "Lens_Front_Group"
    front_group.rotation_euler = (0, math.pi/2, 0)
    front_group.data.materials.append(metal_mat)
    lens_parts.append(front_group)
    
    # 前镜片玻璃
    bpy.ops.mesh.primitive_cylinder_add(radius=0.32, depth=0.03, location=(-1.95, 0, 0))
    front_lens = bpy.context.active_object
    front_lens.name = "Front_Lens_Glass"
    front_lens.rotation_euler = (0, math.pi/2, 0)
    glass_mat = create_glass_material()
    front_lens.data.materials.append(glass_mat)
    lens_parts.append(front_lens)
    
    # 内部镜片组（模拟多层镜片）
    for i in range(3):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.28 - i*0.02, depth=0.05, location=(-1.5 - i*0.12, 0, 0))
        inner_lens = bpy.context.active_object
        inner_lens.name = f"Inner_Lens_{i+1}"
        inner_lens.rotation_euler = (0, math.pi/2, 0)
        inner_lens.data.materials.append(glass_mat)
        lens_parts.append(inner_lens)
    
    # 镜头后卡口
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.08, location=(-0.85, 0, 0))
    lens_mount = bpy.context.active_object
    lens_mount.name = "Lens_Mount"
    lens_mount.rotation_euler = (0, math.pi/2, 0)
    lens_mount.data.materials.append(metal_mat)
    lens_parts.append(lens_mount)
    
    return lens_parts

def create_viewfinder():
    """创建取景器"""
    metal_mat = create_metal_material()
    glass_mat = create_glass_material()
    
    # 取景器主体
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.25, 0, 0.52))
    viewfinder = bpy.context.active_object
    viewfinder.name = "Viewfinder"
    viewfinder.scale = (0.35, 0.28, 0.12)
    bpy.ops.object.transform_apply(scale=True)
    viewfinder.data.materials.append(metal_mat)
    
    # 取景器玻璃
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.25, 0.15, 0.52))
    vf_glass = bpy.context.active_object
    vf_glass.name = "Viewfinder_Glass"
    vf_glass.scale = (0.30, 0.04, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    vf_glass.data.materials.append(glass_mat)
    
    # 取景器目镜
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.06, location=(0.25, -0.18, 0.52))
    eyepiece = bpy.context.active_object
    eyepiece.name = "Eyepiece"
    eyepiece.rotation_euler = (math.pi/2, 0, 0)
    eyepiece.data.materials.append(metal_mat)
    
    return viewfinder, vf_glass, eyepiece

def create_shutter_button():
    """创建快门按钮"""
    metal_mat = create_metal_material()
    rubber_mat = create_rubber_material()
    
    # 快门按钮主体
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.06, location=(0.45, 0.32, 0.50))
    shutter = bpy.context.active_object
    shutter.name = "Shutter_Button"
    shutter.data.materials.append(metal_mat)
    
    # 快门按钮顶部（橡胶垫）
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.02, location=(0.45, 0.32, 0.54))
    shutter_top = bpy.context.active_object
    shutter_top.name = "Shutter_Top"
    shutter_top.data.materials.append(rubber_mat)
    
    return shutter, shutter_top

def create_advance_lever():
    """创建过片扳手"""
    metal_mat = create_metal_material()
    rubber_mat = create_rubber_material()
    
    # 扳手主体
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.65, 0.28, 0.50))
    lever = bpy.context.active_object
    lever.name = "Advance_Lever"
    lever.scale = (0.25, 0.12, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    lever.data.materials.append(metal_mat)
    
    # 扳手手柄（弧形）
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.20, location=(0.78, 0.28, 0.50))
    lever_handle = bpy.context.active_object
    lever_handle.name = "Lever_Handle"
    lever_handle.rotation_euler = (0, 0, math.pi/2)
    lever_handle.data.materials.append(rubber_mat)
    
    return lever, lever_handle

def create_hot_shoe():
    """创建热靴"""
    metal_mat = create_metal_material()
    
    # 热靴底座
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.54))
    hot_shoe = bpy.context.active_object
    hot_shoe.name = "Hot_Shoe"
    hot_shoe.scale = (0.28, 0.22, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    hot_shoe.data.materials.append(metal_mat)
    
    # 热靴导轨
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.52))
    rail = bpy.context.active_object
    rail.name = "Hot_Shoe_Rail"
    rail.scale = (0.32, 0.18, 0.02)
    bpy.ops.object.transform_apply(scale=True)
    rail.data.materials.append(metal_mat)
    
    # 热靴触点
    for i in range(3):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.015, depth=0.02, location=(-0.06 + i*0.06, 0, 0.56))
        contact = bpy.context.active_object
        contact.name = f"Hot_Shoe_Contact_{i+1}"
        contact.data.materials.append(metal_mat)
    
    return hot_shoe

def create_brand_plate():
    """创建品牌铭牌区域"""
    metal_mat = create_metal_material()
    leather_mat = create_leather_material()
    
    # 铭牌基座
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.32))
    plate = bpy.context.active_object
    plate.name = "Brand_Plate"
    plate.scale = (0.5, 0.02, 0.06)
    bpy.ops.object.transform_apply(scale=True)
    plate.data.materials.append(metal_mat)
    
    # 铭牌文字区域（用几何体模拟品牌名）
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.02, 0.33))
    plate_text = bpy.context.active_object
    plate_text.name = "Brand_Text"
    plate_text.scale = (0.35, 0.01, 0.03)
    bpy.ops.object.transform_apply(scale=True)
    plate_text.data.materials.append(leather_mat)
    
    return plate, plate_text

def create_camera_details():
    """创建相机细节"""
    metal_mat = create_metal_material()
    dark_metal_mat = create_dark_metal_material()
    
    # 倒片旋钮
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.12, location=(-0.7, 0.28, 0.50))
    rewind_knob = bpy.context.active_object
    rewind_knob.name = "Rewind_Knob"
    rewind_knob.data.materials.append(metal_mat)
    
    # 倒片旋钮顶部
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.03, location=(-0.7, 0.28, 0.58))
    rewind_top = bpy.context.active_object
    rewind_top.name = "Rewind_Top"
    rewind_top.data.materials.append(dark_metal_mat)
    
    # ISO/ASA 盘
    bpy.ops.mesh.primitive_cylinder_add(radius=0.07, depth=0.04, location=(-0.7, 0.28, 0.60))
    iso_dial = bpy.context.active_object
    iso_dial.name = "ISO_Dial"
    iso_dial.data.materials.append(metal_mat)
    
    # 速度转盘
    bpy.ops.mesh.primitive_cylinder_add(radius=0.10, depth=0.06, location=(0.45, -0.28, 0.50))
    speed_dial = bpy.context.active_object
    speed_dial.name = "Speed_Dial"
    speed_dial.data.materials.append(metal_mat)
    
    # 速度转盘刻度（用小圆柱模拟）
    for i in range(12):
        angle = i * math.pi * 2 / 12
        x = 0.45 + 0.08 * math.cos(angle)
        y = -0.28 + 0.08 * math.sin(angle)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.005, depth=0.02, location=(x, y, 0.53))
        mark = bpy.context.active_object
        mark.name = f"Speed_Mark_{i}"
        mark.data.materials.append(dark_metal_mat)
    
    # 三脚架接口
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.08, location=(0, 0, -0.42))
    tripod_mount = bpy.context.active_object
    tripod_mount.name = "Tripod_Mount"
    tripod_mount.data.materials.append(metal_mat)
    
    # 自拍拨杆
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.15, location=(0.75, -0.3, 0.25))
    self_timer = bpy.context.active_object
    self_timer.name = "Self_Timer"
    self_timer.rotation_euler = (math.pi/2, 0, 0)
    self_timer.data.materials.append(metal_mat)
    
    # 镜头释放按钮
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=0.04, location=(-0.9, 0.35, 0))
    lens_release = bpy.context.active_object
    lens_release.name = "Lens_Release"
    lens_release.rotation_euler = (math.pi/2, 0, 0)
    lens_release.data.materials.append(metal_mat)
    
    return [rewind_knob, rewind_top, iso_dial, speed_dial, tripod_mount, self_timer, lens_release]

def create_strap_lugs():
    """创建背带环"""
    metal_mat = create_metal_material()
    lugs = []
    
    # 左侧背带环
    bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.012, location=(-0.75, 0.43, 0))
    lug1 = bpy.context.active_object
    lug1.name = "Strap_Lug_Left"
    lug1.data.materials.append(metal_mat)
    lugs.append(lug1)
    
    # 右侧背带环
    bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.012, location=(-0.75, -0.43, 0))
    lug2 = bpy.context.active_object
    lug2.name = "Strap_Lug_Right"
    lug2.data.materials.append(metal_mat)
    lugs.append(lug2)
    
    return lugs

def create_ground_plane():
    """创建地面平面用于阴影"""
    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -0.42))
    ground = bpy.context.active_object
    ground.name = "Ground"
    
    # 创建地面材质
    mat = bpy.data.materials.new(name="Ground_Material")
    mat.use_nodes = True
    principled = mat.node_tree.nodes["Principled BSDF"]
    principled.inputs['Base Color'].default_value = (0.91, 0.91, 0.91, 1)  # #E8E8E8
    principled.inputs['Roughness'].default_value = 0.8
    
    ground.data.materials.append(mat)
    
    return ground

# ==================== 主函数 ====================

def create_retro_camera():
    """创建完整的复古相机"""
    print("开始创建复古胶片单反相机 最终版...")
    
    # 创建所有部件
    body = create_camera_body()
    top_cover = create_top_cover()
    lens_parts = create_lens()
    viewfinder, vf_glass, eyepiece = create_viewfinder()
    shutter, shutter_top = create_shutter_button()
    lever, lever_handle = create_advance_lever()
    hot_shoe = create_hot_shoe()
    brand_plate, brand_text = create_brand_plate()
    details = create_camera_details()
    lugs = create_strap_lugs()
    ground = create_ground_plane()
    
    print("相机部件创建完成！")
    return {
        'body': body,
        'top_cover': top_cover,
        'lens': lens_parts,
        'viewfinder': (viewfinder, vf_glass, eyepiece),
        'shutter': (shutter, shutter_top),
        'lever': (lever, lever_handle),
        'hot_shoe': hot_shoe,
        'brand': (brand_plate, brand_text),
        'details': details,
        'lugs': lugs,
        'ground': ground
    }

# 执行创建
camera = create_retro_camera()

# ==================== 灯光设置 ====================

def setup_lighting():
    """设置三点照明"""
    # 主灯 - 前上方
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 5))
    key_light = bpy.context.active_object
    key_light.name = "Key_Light"
    key_light.data.energy = 5
    key_light.rotation_euler = (math.radians(45), 0, math.radians(-45))
    
    # 填充灯 - 右侧
    bpy.ops.object.light_add(type='SUN', location=(-3, 3, 3))
    fill_light = bpy.context.active_object
    fill_light.name = "Fill_Light"
    fill_light.data.energy = 3
    fill_light.rotation_euler = (math.radians(30), 0, math.radians(60))
    
    # 背光/轮廓灯
    bpy.ops.object.light_add(type='SUN', location=(0, -5, 4))
    rim_light = bpy.context.active_object
    rim_light.name = "Rim_Light"
    rim_light.data.energy = 4
    rim_light.rotation_euler = (math.radians(30), 0, math.radians(180))
    
    # 环境光
    bpy.context.scene.world = bpy.data.worlds.new("World")
    bpy.context.scene.world.use_nodes = True
    bg_node = bpy.context.scene.world.node_tree.nodes["Background"]
    bg_node.inputs['Color'].default_value = (0.91, 0.91, 0.91, 1)  # #E8E8E8
    bg_node.inputs['Strength'].default_value = 0.5
    
    print("灯光设置完成！")

# ==================== 相机设置 ====================

def setup_camera():
    """设置渲染相机"""
    cam_data = bpy.data.cameras.new("Render_Camera")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("Render_Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    
    # 设置相机位置和朝向（三分之四视角，从前侧上方约30~45°俯视）
    cam_obj.location = (4, -4, 3)
    cam_obj.rotation_euler = (math.radians(60), 0, math.radians(45))
    
    # 设置为活动相机
    bpy.context.scene.camera = cam_obj
    
    print("渲染相机设置完成！")
    return cam_obj

# ==================== 执行设置 ====================

setup_lighting()
render_cam = setup_camera()

print("\n=============================")
print("1970年代复古胶片单反相机 最终版 创建完成！")
print("=============================\n")
print("最终版改进：")
print("1. 优化皮革纹理参数，增加细节")
print("2. 添加对焦环纹路细节")
print("3. 优化金属材质光泽度")
print("4. 添加镜头释放按钮")
print("5. 整体比例和位置微调")
print("\n准备渲染...")

# 渲染
bpy.ops.render.render(write_still=True)
print("渲染完成！")

# 保存blend文件
bpy.ops.wm.save_as_mainfile(filepath="//camera_model_final.blend")
print("Blend文件已保存！")