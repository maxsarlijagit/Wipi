from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path

out = Path(__file__).resolve().parent.parent / 'assets'
out.mkdir(exist_ok=True)
S = 512
image = Image.new('RGBA', (S, S), (0, 0, 0, 0))
shadow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((54, 60, 458, 464), radius=120, fill=(65, 34, 37, 110))
image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))
face = Image.new('RGBA', (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(face)
for y in range(55, 449):
    t = (y - 55) / 394
    color = (int(250 - t*30), int(205 - t*60), int(171 - t*44), 255)
    d.line((56, y, 456, y), fill=color, width=1)
mask = Image.new('L', (S, S))
ImageDraw.Draw(mask).rounded_rectangle((56, 55, 456, 455), radius=116, fill=255)
face.putalpha(mask)
image.alpha_composite(face)
d = ImageDraw.Draw(image)
d.rounded_rectangle((118, 206, 335, 373), radius=55, fill=(83, 55, 62, 255))
d.arc((306, 217, 410, 345), 270, 90, fill=(83, 55, 62, 255), width=25)
d.line((122, 389, 367, 389), fill=(83, 55, 62, 255), width=15)
d.arc((123, 219, 332, 257), 4, 176, fill=(255, 223, 191, 255), width=12)
for x, shift in [(174, 0), (232, 12), (290, 0)]:
    points = [(x, 184), (x-11, 165-shift), (x+6, 146-shift), (x-4, 122-shift)]
    d.line(points, fill=(255, 246, 224, 238), width=13, joint='curve')
image.save(out / 'wipi.png')
image.save(out / 'wipi.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
