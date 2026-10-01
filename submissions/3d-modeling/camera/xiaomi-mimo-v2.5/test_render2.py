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
bpy.context.scene.render.filepath = "//render_output.png"
bpy.context.scene.render.image_settings.file_format = 'PNG'

# 创建一个简单的立方体
bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
cube = bpy.context.active_object
cube.name = "Test_Cube"

# 创建材质
mat = bpy.data.materials.new(name="Test_Material")
mat.use_nodes = True
principled = mat.node_tree.nodes["Principled BSDF"]
principled.inputs['Base Color'].default_value = (0.8, 0.2, 0.2, 1)  # 红色
principled.inputs['Roughness'].default_value = 0.5

cube.data.materials.append(mat)

# 创建多个灯光
# 主灯
bpy.ops.object.light_add(type='SUN', location=(3, -3, 5))
key_light = bpy.context.active_object
key_light.name = "Key_Light"
key_light.data.energy = 5
key_light.rotation_euler = (math.radians(45), 0, math.radians(45))

# 填充灯
bpy.ops.object.light_add(type='SUN', location=(-3, 3, 5))
fill_light = bpy.context.active_object
fill_light.name = "Fill_Light"
fill_light.data.energy = 3
fill_light.rotation_euler = (math.radians(45), 0, math.radians(-45))

# 创建相机 - 更靠近物体
bpy.ops.object.camera_add(location=(3, -3, 2))
cam = bpy.context.active_object
cam.name = "Test_Camera"

# 设置相机朝向原点
direction = cam.location
rot_quat = direction.to_track_quat('-Z', 'Y')
cam.rotation_euler = rot_quat.to_euler()

# 设置为活动相机
bpy.context.scene.camera = cam

# 设置世界背景
bpy.context.scene.world = bpy.data.worlds.new("World")
bpy.context.scene.world.use_nodes = True
bg_node = bpy.context.scene.world.node_tree.nodes["Background"]
bg_node.inputs['Color'].default_value = (0.8, 0.8, 0.8, 1)  # 浅灰色背景
bg_node.inputs['Strength'].default_value = 1.0

print("测试场景创建完成！")

# 渲染
bpy.ops.render.render(write_still=True)
print("渲染完成！")