import xarray as xr
from flask import jsonify, request

ds = xr.open_dataset('./downloads/era5_cloud_structure_2020.nc')

print(ds['valid_time'].values)

def getWeatherData():

    month = request.args.get('month', '2020-09-01')
    # Cloud Liquid on January 2020
    clwc = ds['clwc'].sel(valid_time=month)
    ciwc = ds['ciwc'].sel(valid_time=month)

    clwc = clwc.roll(longitude=clwc.sizes['longitude'] // 2, roll_coords=True)
    ciwc = ciwc.roll(longitude=ciwc.sizes['longitude'] // 2, roll_coords=True)

    clwc['longitude'] = (clwc['longitude'] + 180) % 360 - 180
    ciwc['longitude'] = (ciwc['longitude'] + 180) % 360 - 180
   
    # Now we downsample the data into blocks of 8x8, which are perfect to send to the front-end
    clwc_down = clwc.coarsen(pressure_level=3, latitude=12, longitude=12, boundary='pad').mean()
    ciwc_down = ciwc.coarsen(pressure_level=3, latitude=12, longitude=12, boundary='pad').mean()

    clwc = clwc.sortby('longitude')
    ciwc = ciwc.sortby('longitude')

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


