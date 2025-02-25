import cfgrib
import pprint
import xarray as xr
import matplotlib.pyplot as plt

data = xr.open_dataset('download.grib', engine='cfgrib')

z_data = data['z']

plt.figure(figsize=(10, 6))
plt.contourf(data['longitude'], data['latitude'], z_data, cmap='viridis')
plt.colorbar(label='Geopotential')
plt.xlabel('Longitude')
plt.ylabel('Latitude')
plt.title('Geopotential')
plt.show()