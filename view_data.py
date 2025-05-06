import xarray as xr
from flask import jsonify, request

ds = xr.open_dataset('./downloads/era5_cloud_structure_2020.nc')

print(ds)

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
    clwc_down = clwc.coarsen(latitude=9, longitude=9, boundary='pad').mean()
    ciwc_down = ciwc.coarsen(latitude=9, longitude=9, boundary='pad').mean()

    clwc = clwc.sortby('longitude')
    ciwc = ciwc.sortby('longitude')

    #THREE.Data3DTexture expects 3D data as a flattened 1D array, so we convert to a numpyarray and then flatten. Also WebGL supports float32
    clwc_array = clwc_down.values.astype('float32').flatten().tolist()
    ciwc_array = ciwc_down.values.astype('float32').flatten().tolist()

    # Preserve the shape of the 3D array
    shape = clwc_down.shape

    temperature = ds['t'].sel(valid_time=month)
    temperature_down = temperature.coarsen(latitude=12, longitude=12, boundary='pad').mean()
    temperature_array = temperature_down.values.astype('float32').flatten().tolist()

    print("✅ Temp shape:", temperature_down.shape)
    print("✅ Temp flattened length:", len(temperature_array))

    # extracting u and v component of wind

    u = ds['u'].sel(valid_time=month, pressure_level=500)
    v = ds['v'].sel(valid_time=month, pressure_level=500)

    u = u.roll(longitude=u.sizes['longitude'] // 2, roll_coords=True)
    v = v.roll(longitude=v.sizes['longitude'] // 2, roll_coords=True)

    u['longitude'] = (u['longitude'] + 180) % 360 - 180
    v['longitude'] = (v['longitude'] + 180) % 360 - 180

    u = u.sortby('longitude')
    v = v.sortby('longitude')

    u_down = u.coarsen(latitude=3, longitude=3, boundary='pad').mean()
    v_down = v.coarsen(latitude=3, longitude=3, boundary='pad').mean()

    u_vals = u_down.values.astype('float32').flatten().tolist()
    v_vals = v_down.values.astype('float32').flatten().tolist()

    shape_2d = u_down.shape
    return jsonify({
        "clwc": clwc_array,
        "ciwc": ciwc_array,
        "shape": shape,
        "temperature": temperature_array,
        "temperature_shape": temperature_down.shape,
        "wind_u": u_vals,
        "wind_v": v_vals,
        "wind_shape": shape_2d
    }) # Jsonify internally handles conversion of common types like datetime objects automatically


