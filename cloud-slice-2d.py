import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cfeature
import numpy as np

ds = xr.open_dataset('./downloads/era5_cloud_structure_2020.nc')

month = '2020-06-01'
pressure_level = 600

# Selecting data at pressure level 
clwc = ds['clwc'].sel(valid_time=month, pressure_level=pressure_level)
ciwc = ds['ciwc'].sel(valid_time=month, pressure_level=pressure_level)
cloud_combined = clwc + ciwc


fig = plt.figure(figsize=(12,6))
ax = plt.axes(projection=ccrs.PlateCarree())

# Contour levels to show clouds clearly
contour_levels = np.linspace(0, cloud_combined.max().values, 20)

cloud_contour = cloud_combined.plot.contourf(
    ax=ax,
    levels=contour_levels,
    cmap='Blues',
    transform=ccrs.PlateCarree(),
    cbar_kwargs={'label':'Cloud Water Content (kg/kg)'}
)

ax.coastlines(resolution='110m')
ax.add_feature(cfeature.BORDERS, linestyle=':')
ax.gridlines(draw_labels=True, linestyle='--')

ax.set_title(f'Cloud Water Content at {pressure_level} hPa - {month}')

plt.savefig('2d_cloud_contour.png', dpi=200)
plt.show()
