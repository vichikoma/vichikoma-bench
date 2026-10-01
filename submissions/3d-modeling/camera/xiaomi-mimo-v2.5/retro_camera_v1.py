import bpy
import math
import os

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
bpy.context.scene.render.filepath = "//render_output.png"
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
    principled.inputs['Base Color'].default_value = (0.08, 0.07, 0.06, 1)  # 深灰/黑色
    principled.inputs['Roughness'].default_value = 0.85
    principled.inputs['Specular IOR Level'].default_value = 0.3
    
    # 添加噪波纹理制作皮革纹理
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 0)
    noise.inputs['Scale'].default_value = 50.0
    noise.inputs['Detail'].default_value = 10.0
    
    # 添加颜色渐变控制对比度
    color_ramp = nodes.new('ShaderNodeValToRGB')
    color_ramp.location = (-200, 0)
    color_ramp.color_ramp.elements[0].position = 0.4
    color_ramp.color_ramp.elements[1].position = 0.6
    
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
    principled.inputs['Base Color'].default_value = (0.8, 0.8, 0.85, 1)  # 银色
    principled.inputs['Metallic'].default_value = 1.0
    principled.inputs['Roughness'].default_value = 0.2
    principled.inputs['Specular IOR Level'].default_value = 0.8
    
    # 添加拉丝纹理
    noise = nodes.new('ShaderNodeTexNoise')
    noise.location = (-400, 0)
    noise.inputs['Scale'].default_value = 100.0
    noise.inputs['Detail'].default_value = 5.0
    
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
    principled.inputs['Base Color'].default_value = (0.9, 0.95, 1.0, 1)  # 轻微蓝色
    principled.inputs['Roughness'].default_value = 0.05
    principled.inputs['IOR'].default_value = 1.52  # 玻璃折射率
    principled.inputs['Alpha'].default_value = 0.9
    
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
    principled.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1)  # 黑色
    principled.inputs['Roughness'].default_value = 0.95
    principled.inputs['Specular IOR Level'].default_value = 0.1
    
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
    body.scale = (1.8, 0.9, 0.8)  # 长宽高比例
    bpy.ops.object.transform_apply(scale=True)
    
    # 应用皮革材质
    leather_mat = create_leather_material()
    body.data.materials.append(leather_mat)
    
    # 圆角处理
    bpy.ops.object.modifier_add(type='BEVEL')
    body.modifiers["Bevel"].width = 0.05
    body.modifiers["Bevel"].segments = 4
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    return body

def create_top_cover():
    """创建银色金属顶盖"""
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.45))
    top = bpy.context.active_object
    top.name = "Top_Cover"
    top.scale = (1.7, 0.85, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    
    # 应用金属材质
    metal_mat = create_metal_material()
    top.data.materials.append(metal_mat)
    
    # 圆角
    bpy.ops.object.modifier_add(type='BEVEL')
    top.modifiers["Bevel"].width = 0.03
    top.modifiers["Bevel"].segments = 3
    bpy.ops.object.modifier_apply(modifier="Bevel")
    
    return top

def create_lens():
    """创建镜头 - 多层镜片组"""
    lens_parts = []
    
    # 镜头外筒
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=1.2, location=(-1.8, 0, 0))
    lens_outer = bpy.context.active_object
    lens_outer.name = "Lens_Outer"
    lens_outer.rotation_euler = (0, math.pi/2, 0)
    metal_mat = create_metal_material()
    lens_outer.data.materials.append(metal_mat)
    lens_parts.append(lens_outer)
    
    # 对焦环
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.15, location=(-1.5, 0, 0))
    focus_ring = bpy.context.active_object
    focus_ring.name = "Focus_Ring"
    focus_ring.rotation_euler = (0, math.pi/2, 0)
    rubber_mat = create_rubber_material()
    focus_ring.data.materials.append(rubber_mat)
    lens_parts.append(focus_ring)
    
    # 光圈环
    bpy.ops.mesh.primitive_cylinder_add(radius=0.42, depth=0.12, location=(-1.3, 0, 0))
    aperture_ring = bpy.context.active_object
    aperture_ring.name = "Aperture_Ring"
    aperture_ring.rotation_euler = (0, math.pi/2, 0)
    metal_mat2 = create_metal_material()
    aperture_ring.data.materials.append(metal_mat2)
    lens_parts.append(aperture_ring)
    
    # 前镜片玻璃
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.05, location=(-2.1, 0, 0))
    front_lens = bpy.context.active_object
    front_lens.name = "Front_Lens_Glass"
    front_lens.rotation_euler = (0, math.pi/2, 0)
    glass_mat = create_glass_material()
    front_lens.data.materials.append(glass_mat)
    lens_parts.append(front_lens)
    
    # 内部镜片组（模拟多层镜片）
    for i in range(3):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.3 - i*0.03, depth=0.08, location=(-1.9 - i*0.15, 0, 0))
        inner_lens = bpy.context.active_object
        inner_lens.name = f"Inner_Lens_{i+1}"
        inner_lens.rotation_euler = (0, math.pi/2, 0)
        glass_mat2 = create_glass_material()
        inner_lens.data.materials.append(glass_mat2)
        lens_parts.append(inner_lens)
    
    # 镜头后卡口
    bpy.ops.mesh.primitive_cylinder_add(radius=0.38, depth=0.1, location=(-1.0, 0, 0))
    lens_mount = bpy.context.active_object
    lens_mount.name = "Lens_Mount"
    lens_mount.rotation_euler = (0, math.pi/2, 0)
    metal_mat3 = create_metal_material()
    lens_mount.data.materials.append(metal_mat3)
    lens_parts.append(lens_mount)
    
    return lens_parts

def create_viewfinder():
    """创建取景器"""
    # 取景器主体
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.3, 0, 0.55))
    viewfinder = bpy.context.active_object
    viewfinder.name = "Viewfinder"
    viewfinder.scale = (0.4, 0.3, 0.15)
    bpy.ops.object.transform_apply(scale=True)
    
    metal_mat = create_metal_material()
    viewfinder.data.materials.append(metal_mat)
    
    # 取景器玻璃
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.3, 0.2, 0.55))
    vf_glass = bpy.context.active_object
    vf_glass.name = "Viewfinder_Glass"
    vf_glass.scale = (0.35, 0.05, 0.1)
    bpy.ops.object.transform_apply(scale=True)
    
    glass_mat = create_glass_material()
    vf_glass.data.materials.append(glass_mat)
    
    return viewfinder, vf_glass

def create_shutter_button():
    """创建快门按钮"""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.08, location=(0.5, 0.35, 0.55))
    shutter = bpy.context.active_object
    shutter.name = "Shutter_Button"
    metal_mat = create_metal_material()
    shutter.data.materials.append(metal_mat)
    
    # 快门按钮顶部凹陷
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.03, location=(0.5, 0.35, 0.59))
    shutter_indent = bpy.context.active_object
    shutter_indent.name = "Shutter_Indent"
    leather_mat = create_leather_material()
    shutter_indent.data.materials.append(leather_mat)
    
    return shutter, shutter_indent

def create_advance_lever():
    """创建过片扳手"""
    # 扳手主体
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.7, 0.3, 0.55))
    lever = bpy.context.active_object
    lever.name = "Advance_Lever"
    lever.scale = (0.3, 0.15, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    
    metal_mat = create_metal_material()
    lever.data.materials.append(metal_mat)
    
    # 扳手手柄
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.25, location=(0.85, 0.3, 0.55))
    lever_handle = bpy.context.active_object
    lever_handle.name = "Lever_Handle"
    lever_handle.rotation_euler = (0, 0, math.pi/2)
    rubber_mat = create_rubber_material()
    lever_handle.data.materials.append(rubber_mat)
    
    return lever, lever_handle

def create_hot_shoe():
    """创建热靴"""
    # 热靴底座
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.6))
    hot_shoe = bpy.context.active_object
    hot_shoe.name = "Hot_Shoe"
    hot_shoe.scale = (0.3, 0.25, 0.05)
    bpy.ops.object.transform_apply(scale=True)
    
    metal_mat = create_metal_material()
    hot_shoe.data.materials.append(metal_mat)
    
    # 热靴触点
    for i in range(3):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.03, location=(-0.08 + i*0.08, 0, 0.63))
        contact = bpy.context.active_object
        contact.name = f"Hot_Shoe_Contact_{i+1}"
        contact.data.materials.append(metal_mat)
    
    return hot_shoe

def create_brand_plate():
    """创建品牌铭牌区域"""
    # 铭牌基座
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.35))
    plate = bpy.context.active_object
    plate.name = "Brand_Plate"
    plate.scale = (0.6, 0.02, 0.08)
    bpy.ops.object.transform_apply(scale=True)
    
    metal_mat = create_metal_material()
    plate.data.materials.append(metal_mat)
    
    # 可以添加文字，这里用简单几何体模拟
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.02, 0.36))
    plate_text = bpy.context.active_object
    plate_text.name = "Brand_Text"
    plate_text.scale = (0.4, 0.01, 0.04)
    bpy.ops.object.transform_apply(scale=True)
    
    leather_mat = create_leather_material()
    plate_text.data.materials.append(leather_mat)
    
    return plate, plate_text

def create_camera_details():
    """创建相机细节"""
    # 倒片旋钮
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.15, location=(-0.8, 0.3, 0.55))
    rewind_knob = bpy.context.active_object
    rewind_knob.name = "Rewind_Knob"
    metal_mat = create_metal_material()
    rewind_knob.data.materials.append(metal_mat)
    
    # ISO/ASA 盘
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.05, location=(-0.8, 0.3, 0.65))
    iso_dial = bpy.context.active_object
    iso_dial.name = "ISO_Dial"
    iso_dial.data.materials.append(metal_mat)
    
    # 速度转盘
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.08, location=(0.5, -0.3, 0.55))
    speed_dial = bpy.context.active_object
    speed_dial.name = "Speed_Dial"
    speed_dial.data.materials.append(metal_mat)
    
    # 三脚架接口
    bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.1, location=(0, 0, -0.45))
    tripod_mount = bpy.context.active_object
    tripod_mount.name = "Tripod_Mount"
    tripod_mount.data.materials.append(metal_mat)
    
    return [rewind_knob, iso_dial, speed_dial, tripod_mount]

def create_strap_lugs():
    """创建背带环"""
    lug_mat = create_metal_material()
    lugs = []
    
    # 左侧背带环
    bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.015, location=(-0.8, 0.45, 0))
    lug1 = bpy.context.active_object
    lug1.name = "Strap_Lug_Left"
    lug1.data.materials.append(lug_mat)
    lugs.append(lug1)
    
    # 右侧背带环
    bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.015, location=(-0.8, -0.45, 0))
    lug2 = bpy.context.active_object
    lug2.name = "Strap_Lug_Right"
    lug2.data.materials.append(lug_mat)
    lugs.append(lug2)
    
    return lugs

# ==================== 主函数 ====================

def create_retro_camera():
    """创建完整的复古相机"""
    print("开始创建复古胶片单反相机...")
    
    # 创建所有部件
    body = create_camera_body()
    top_cover = create_top_cover()
    lens_parts = create_lens()
    viewfinder, vf_glass = create_viewfinder()
    shutter, shutter_indent = create_shutter_button()
    lever, lever_handle = create_advance_lever()
    hot_shoe = create_hot_shoe()
    brand_plate, brand_text = create_brand_plate()
    details = create_camera_details()
    lugs = create_strap_lugs()
    
    print("相机部件创建完成！")
    return {
        'body': body,
        'top_cover': top_cover,
        'lens': lens_parts,
        'viewfinder': (viewfinder, vf_glass),
        'shutter': (shutter, shutter_indent),
        'lever': (lever, lever_handle),
        'hot_shoe': hot_shoe,
        'brand': (brand_plate, brand_text),
        'details': details,
        'lugs': lugs
    }

# 执行创建
camera = create_retro_camera()

# ==================== 灯光设置 ====================

def setup_lighting():
    """设置三点照明"""
    # 主灯 - 前上方
    bpy.ops.object.light_add(type='AREA', location=(3, -3, 4))
    key_light = bpy.context.active_object
    key_light.name = "Key_Light"
    key_light.data.energy = 200
    key_light.data.size = 3
    key_light.rotation_euler = (math.radians(-45), 0, math.radians(-45))
    
    # 填充灯 - 右侧
    bpy.ops.object.light_add(type='AREA', location=(-2, 3, 2))
    fill_light = bpy.context.active_object
    fill_light.name = "Fill_Light"
    fill_light.data.energy = 100
    fill_light.data.size = 2
    fill_light.rotation_euler = (math.radians(-30), 0, math.radians(60))
    
    # 背光/轮廓灯
    bpy.ops.object.light_add(type='AREA', location=(0, -4, 3))
    rim_light = bpy.context.active_object
    rim_light.name = "Rim_Light"
    rim_light.data.energy = 150
    rim_light.data.size = 2
    rim_light.rotation_euler = (math.radians(-30), 0, math.radians(180))
    
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
    bpy.ops.object.camera_add(location=(4, -4, 3))
    cam = bpy.context.active_object
    cam.name = "Render_Camera"
    
    # 设置相机朝向原点
    direction = cam.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam.rotation_euler = rot_quat.to_euler()
    
    # 设置为活动相机
    bpy.context.scene.camera = cam
    
    # 设置焦距
    cam.data.lens = 50
    cam.data.clip_end = 100
    
    print("渲染相机设置完成！")
    return cam

# ==================== 执行设置 ====================

setup_lighting()
render_cam = setup_camera()

print("\n=============================")
print("1970年代复古胶片单反相机创建完成！")
print("=============================\n")
print("部件列表：")
print("1. 皮革纹理机身 (黑色/深灰)")
print("2. 银色金属顶盖")
print("3. 多层镜片组镜头 (含玻璃材质)")
print("4. 对焦环/光圈环 (带纹路)")
print("5. 快门按钮")
print("6. 过片扳手")
print("7. 热靴")
print("8. 取景器")
print("9. 品牌铭牌区域")
print("10. 各种细节旋钮")
print("11. 背带环")
print("\n准备渲染...")

# 渲染
bpy.ops.render.render(write_still=True)
print("渲染完成！")