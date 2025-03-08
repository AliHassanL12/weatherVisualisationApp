from PIL import Image;

tiff_image = Image.open('./src/images/america-earth.tif')
tiff_image.save('america-earth.png', 'PNG')