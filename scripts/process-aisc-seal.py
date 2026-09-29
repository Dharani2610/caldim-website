import os
import base64
import io
from PIL import Image, ImageOps, ImageEnhance

src_path = r"C:\Users\USER\.gemini\antigravity-ide\brain\1234bb04-5d44-44e8-89ce-4d6a70d83b9b\.user_uploaded\media_1790232494163.png"

# Load image
im = Image.open(src_path)
gray = ImageOps.grayscale(im.convert("RGB"))

# Invert to find non-white bounding box
inv = ImageOps.invert(gray)
thresh = inv.point(lambda p: 255 if p > 30 else 0)
bbox = thresh.getbbox()

cx = (bbox[0] + bbox[2]) / 2.0
cy = (bbox[1] + bbox[3]) / 2.0
r = max(bbox[2] - bbox[0], bbox[3] - bbox[1]) / 2.0 + 3
crop_box = (int(cx - r), int(cy - r), int(cx + r), int(cy + r))
cropped = im.crop(crop_box)

# High-resolution 600x600
high_res = cropped.resize((600, 600), Image.Resampling.LANCZOS)
high_gray = ImageOps.grayscale(high_res.convert("RGB"))

# Clean threshold / alpha mapping
# Pure black lines in original: gray ~ 0..40
# Pure white background: gray ~ 240..255
def map_alpha(p):
    if p <= 60:
        return 255
    elif p >= 220:
        return 0
    else:
        return int((220 - p) / (220 - 60) * 255)

alpha = high_gray.point(map_alpha)

# Create crisp transparent white image (for mask or direct use)
white_solid = Image.new("RGB", (600, 600), (255, 255, 255))
white_img = Image.merge("RGBA", (*white_solid.split(), alpha))

os.makedirs("public/images/certifications", exist_ok=True)
white_img.save("public/images/certifications/aisc-seal-white.png", format="PNG")

# Dark transparent version for light backgrounds
dark_solid = Image.new("RGB", (600, 600), (15, 23, 32))
dark_img = Image.merge("RGBA", (*dark_solid.split(), alpha))
dark_img.save("public/images/certifications/aisc-seal-dark.png", format="PNG")

# Base64 string for SVG embedding
buffered = io.BytesIO()
white_img.save(buffered, format="PNG")
b64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")

svg_content = f'''<svg viewBox="0 0 600 600" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-label="American Institute of Steel Construction Seal">
  <defs>
    <mask id="aisc-seal-mask">
      <image href="data:image/png;base64,{b64_str}" width="600" height="600" />
    </mask>
  </defs>
  <rect width="600" height="600" fill="currentColor" mask="url(#aisc-seal-mask)" />
</svg>
'''

with open("public/images/certifications/aisc-seal.svg", "w", encoding="utf-8") as f:
    f.write(svg_content)

print("SUCCESS: AISC Seal generated cleanly in PNG and SVG formats!")
