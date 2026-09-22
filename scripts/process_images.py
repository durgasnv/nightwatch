import os
from PIL import Image, ImageDraw
import numpy as np

INPUT_DIR = 'batman_images'
OUTPUT_DIR = os.path.join('assets', 'characters')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def remove_background_flood(im, thresh=45):
    im = im.convert('RGBA')
    w, h = im.size
    
    # Step across perimeter to floodfill background connected to borders
    step = 10
    # Top and bottom borders
    for x in range(0, w, step):
        for y in [0, h - 1]:
            if im.getpixel((x, y))[3] > 0:
                ImageDraw.floodfill(im, (x, y), (0, 0, 0, 0), thresh=thresh)
    # Left and right borders
    for y in range(0, h, step):
        for x in [0, w - 1]:
            if im.getpixel((x, y))[3] > 0:
                ImageDraw.floodfill(im, (x, y), (0, 0, 0, 0), thresh=thresh)

    # Trim empty transparent edges
    bbox = im.getbbox()
    if bbox:
        margin = 12
        crop_box = (
            max(0, bbox[0] - margin),
            max(0, bbox[1] - margin),
            min(w, bbox[2] + margin),
            min(h, bbox[3] + margin)
        )
        im = im.crop(crop_box)
    return im

def process_all():
    configs = [
        ('break.jpg', 'break.png', 45, None),
        ('good.jpg', 'mood.png', 40, None),
        ('happy.jpg', 'celebrate.png', 45, None),
        ('sad.jpg', 'escalate.png', 45, None),
        ('wait.jpg', 'hydrate.png', 45, None),
        ('hello.jpg', 'idle.png', 40, (0, 200, 675, 990))
    ]

    for src_name, dst_name, thresh, crop_box in configs:
        src_path = os.path.join(INPUT_DIR, src_name)
        dst_path = os.path.join(OUTPUT_DIR, dst_name)
        if not os.path.exists(src_path):
            print(f"Skipping {src_path}: not found")
            continue
        
        im = Image.open(src_path)
        if crop_box:
            im = im.crop(crop_box)
            
        cutout = remove_background_flood(im, thresh=thresh)

        # Special case: clean inner halo loop for celebrate.png
        if dst_name == 'celebrate.png':
            arr = np.array(cutout)
            yellow = (arr[:,:,0] > 200) & (arr[:,:,1] > 200) & (arr[:,:,2] < 150) & (arr[:,:,3] > 0)
            ys, xs = np.where(yellow)
            if len(ys) > 0:
                center_y = int(np.mean(ys))
                center_x = int(np.mean(xs))
                if arr[center_y, center_x, 0] > 240 and arr[center_y, center_x, 3] > 0:
                    ImageDraw.floodfill(cutout, (center_x, center_y), (0, 0, 0, 0), thresh=45)

        cutout.save(dst_path, format='PNG')
        print(f"Generated {dst_name}: size {cutout.size}")

    # Generate tray icon from idle.png
    idle_path = os.path.join(OUTPUT_DIR, 'idle.png')
    if os.path.exists(idle_path):
        idle_im = Image.open(idle_path)
        icon_size = (64, 64)
        tray_canvas = Image.new('RGBA', icon_size, (0, 0, 0, 0))
        aspect = idle_im.width / idle_im.height
        if aspect > 1:
            new_w = 60
            new_h = int(60 / aspect)
        else:
            new_h = 60
            new_w = int(60 * aspect)
        resized = idle_im.resize((new_w, new_h), Image.Resampling.LANCZOS)
        offset = ((64 - new_w) // 2, (64 - new_h) // 2)
        tray_canvas.paste(resized, offset, mask=resized)
        
        tray_png = os.path.join(OUTPUT_DIR, 'tray-icon.png')
        tray_ico = os.path.join(OUTPUT_DIR, 'tray-icon.ico')
        tray_canvas.save(tray_png)
        tray_canvas.save(tray_ico, format='ICO', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
        print(f"Generated {tray_png} and {tray_ico}")

if __name__ == '__main__':
    process_all()
