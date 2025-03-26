import xarray as xr
from flask import jsonify

ds = xr.open_dataset('./downloads/era5_cloud_structure_2020.nc')


def getWeatherData():
    # Cloud Liquid on January 2020
    clwc = ds['clwc'].sel(valid_time='2020-09-01')
    ciwc = ds['ciwc'].sel(valid_time='2020-09-01')

    print(ds['clwc'].dims)
    # Now we downsample the data into blocks of 8x8, which are perfect to send to the front-end
    clwc_down = clwc.coarsen(pressure_level=2, latitude=8, longitude=8, boundary='trim').mean()
    ciwc_down = ciwc.coarsen(pressure_level=2, latitude=8, longitude=8, boundary='trim').mean()

    #THREE.Data3DTexture expects 3D data as a flattened 1D array, so we convert to a numpyarray and then flatten. Also WebGL supports float32
    clwc_array = clwc_down.values.astype('float32').flatten().tolist()
    ciwc_array = ciwc_down.values.astype('float32').flatten().tolist()

    # Preserve the shape of the 3D array
    shape = clwc_down.shape
    return jsonify({
        "clwc": clwc_array,
        "ciwc": ciwc_array,
        "shape": shape
    }) # Jsonify internally handles conversion of common types like datetime objects automatically


