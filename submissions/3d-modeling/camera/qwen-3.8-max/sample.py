import bpy, sys
p = sys.argv[sys.argv.index("--") + 1]
img = bpy.data.images.load(p)
w, h = img.size
px = list(img.pixels[:])
def sample(u, v):
    x = int(u * (w - 1)); y = int(v * (h - 1))
    i = (y * w + x) * 4
    return [round(c, 3) for c in px[i:i + 3]]
print("SIZE", w, h)
print("BG_topright", sample(0.95, 0.95))
print("BG_left", sample(0.05, 0.5))
print("body_side", sample(0.25, 0.35))
print("topplate", sample(0.35, 0.62))
print("ground_bottom", sample(0.5, 0.05))
print("lens_barrel", sample(0.55, 0.45))
