import xarray as xr
from flask import jsonify, request, Response
import numpy as np

ds = xr.open_dataset('./downloads/era5_cloud_structure_2020.nc')

def getWeatherData():

    month = request.args.get('month', '2020-09-01')
    # Cloud Liquid on January 2020
    clwc = ds['clwc'].sel(valid_time=month)
    clwc = clwc.sortby('latitude')
    ciwc = ds['ciwc'].sel(valid_time=month)
    ciwc = ciwc.sortby('latitude')

    #align clouds by longitude
    clwc = clwc.roll(longitude=clwc.sizes['longitude'] // 2, roll_coords=True)
    ciwc = ciwc.roll(longitude=ciwc.sizes['longitude'] // 2, roll_coords=True)
    clwc['longitude'] = (clwc['longitude'] + 180) % 360 - 180
    ciwc['longitude'] = (ciwc['longitude'] + 180) % 360 - 180
    clwc = clwc.sortby('longitude')
    ciwc = ciwc.sortby('longitude')

   
    # Now we downsample the data into blocks of 9x9, which are perfect to send to the front-end
    clwc_down = clwc.coarsen(latitude=9, longitude=9, boundary='pad').mean()
    ciwc_down = ciwc.coarsen(latitude=9, longitude=9, boundary='pad').mean()

    clwc_np = clwc_down.values
    ciwc_np = ciwc_down.values
    clwc_padded = np.concatenate([clwc_np, clwc_np[:, :, :1]], axis=2)
    ciwc_padded = np.concatenate([ciwc_np, ciwc_np[:, :, :1]], axis=2)
    # compute MAX value for both
    combined = clwc_down + ciwc_down
    max_cloud_value = float(combined.max().values)
    #THREE.Data3DTexture expects 3D data as a flattened 1D array, so we convert to a numpyarray and then flatten. Also WebGL supports float32
    clwc_array = clwc_padded.astype('float32').flatten().tolist()
    ciwc_array = ciwc_padded.astype('float32').flatten().tolist()
    # Preserve the shape of the 3D array
    shape = clwc_padded.shape

    # Temperature
    temperature = ds['t'].sel(valid_time=month)
    temperature = temperature.sortby('latitude')
    temperature = temperature.roll(
        longitude=temperature.sizes['longitude'] // 2,
        roll_coords=True
        )
    temperature['longitude'] = (temperature['longitude'] + 180) % 360 - 180
    temperature = temperature.sortby('longitude')
    temperature_down = temperature.coarsen(latitude=4, longitude=4, boundary='pad').mean()
    temperature_down = temperature_down.sortby('pressure_level', ascending=False)
    temp_np = temperature_down.values
    temp_padded = np.concatenate([temp_np, temp_np[:, :, :1]], axis=2)
    padded_temp_shape = temp_padded.shape
    temperature_array = temp_padded.astype('float32').flatten().tolist()
    min_per_level = temperature_down.min(dim=('latitude', 'longitude')).values.tolist()
    max_per_level = temperature_down.max(dim=('latitude', 'longitude')).values.tolist()

    # wind at 500 hPa
    u = ds['u'].sel(valid_time=month, pressure_level=500)
    u = u.sortby('latitude')
    v = ds['v'].sel(valid_time=month, pressure_level=500)
    v = v.sortby('latitude')
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
        "temperature_shape": padded_temp_shape,
        "wind_u": u_vals,
        "wind_v": v_vals,
        "wind_shape": shape_2d,
        "max_cloud_value": max_cloud_value,
        "min_temps": min_per_level,
        "max_temps": max_per_level,
    }) # Jsonify internally handles conversion of common types like datetime objects automatically


def getWeatherDataBinary():
    month = request.args.get('month', '2020-09-01')
    temperature = ds['t'].sel(valid_time=month)
    temperature = temperature.sortby('latitude')
    temperature = temperature.roll(
        longitude=temperature.sizes['longitude'] // 2,
        roll_coords=True
    )
    temperature['longitude'] = (temperature['longitude'] + 180) % 360 - 180
    temperature = temperature.sortby('longitude')

    temperature_down = (
      temperature
      .coarsen(latitude=4, longitude=4, boundary='pad')
      .mean()
      .sortby('pressure_level', ascending=False)
    )
    arr = temperature_down.transpose('pressure_level','latitude','longitude').values.astype('float32')
    data_bytes = arr.tobytes()
    resp = Response(data_bytes, mimetype='application/octet-stream')
    resp.headers['X-Shape'] = f"{arr.shape[0]},{arr.shape[1]},{arr.shape[2]}"
    return resp
