import numpy as np
import xarray as xr
from PIL import Image

def generate_cloud_texture():
    # Load dataset
    ds = xr.open_dataset('./downloads/ERA5_L1_monthly_2001.nc')
    
    # Slice and select total cloud cover data
    subset = ds.sel(time='2001-01-01', longitude=slice(-180, 180), latitude=slice(90, -90))
    cloud_data = subset['tcc'].values
    
    # Normalize data between 0-255 for image representation
    cloud_data = (cloud_data - np.min(cloud_data)) / (np.max(cloud_data) - np.min(cloud_data)) * 255
    cloud_data = cloud_data.astype(np.uint8)  # Convert to uint8 format
    
    # Create image
    img = Image.fromarray(cloud_data)
    img = img.convert('L')  # Grayscale mode
    
    # Save the image as a texture
    img.save('./src/images/cloud-texture.png')
    print("Cloud texture saved successfully!")

if __name__ == "__main__":
    generate_cloud_texture()
