from PIL import Image;

tiff_image = Image.open('./src/images/bm-earth.tif')
tiff_image.save('earth.png', 'PNG')