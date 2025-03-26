import xarray as xr
from flask import jsonify

ds = xr.open_dataset('./downloads/era5_cloud_structure_2020.nc')

def getWeatherData():
    # Cloud Liquid on January 2020
    data = ds['clwc'].sel(valid_time='2020-01-01')

    # Now we downsample the data into blocks of 8x8, which are perfect to send to the front-end
    downsampled = data.coarsen(latitude=8, longitude=8, boundary='trim').mean()

    # Now convert the downsample xarray.DataArray to a NumpyArray and then turn it into a python list of lists
    array = downsampled.values.tolist()
    return jsonify(array) # Jsonify internally handles conversion of common types like datetime objects automatically


