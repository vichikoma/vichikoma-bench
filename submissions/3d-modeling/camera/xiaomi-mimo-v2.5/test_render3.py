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

# 创建灯光
bpy.ops.object.light_add(type='SUN', location=(5, -5, 5))
light = bpy.context.active_object
light.name = "Test_Light"
light.data.energy = 5
light.rotation_euler = (math.radians(45), 0, math.radians(45))

# 创建相机 - 使用更简单的方法
cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 50
cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)

# 设置相机位置和朝向
cam_obj.location = (3, -3, 2)
cam_obj.rotation_euler = (math.radians(60), 0, math.radians(45))

# 设置为活动相机
bpy.context.scene.camera = cam_obj

# 设置世界背景
bpy.context.scene.world = bpy.data.worlds.new("World")
bpy.context.scene.world.use_nodes = True
bg_node = bpy.context.scene.world.node_tree.nodes["Background"]
bg_node.inputs['Color'].default_value = (0.8, 0.8, 0.8, 1)  # 浅灰色背景
bg_node.inputs['Strength'].default_value = 1.0

print("测试场景创建完成！")
print(f"相机位置: {cam_obj.location}")
print(f"相机旋转: {cam_obj.rotation_euler}")

# 渲染
bpy.ops.render.render(write_still=True)
print("渲染完成！")