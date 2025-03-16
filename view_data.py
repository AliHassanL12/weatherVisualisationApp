import xarray as xr
from flask import jsonify

ds = xr.open_dataset('./downloads/ERA5_L1_monthly_2001.nc')



# Fetches a subset of the weather dataset and returns it as a JSON 
def getWeatherData():
    subset = ds.sel(
    time=slice('2001-01-01', '2001-03-30'), 
    longitude=slice(10, 15),   
    latitude=slice(10,5)
    )
    # Convert dataset variables to a dictionary format 

    dataDict = {
        'latitudes': subset['latitude'].values.tolist(),  
        'longitudes': subset['longitude'].values.tolist(), 
        't2m': subset['t2m'].values.tolist(),
        'e': subset['e'].values.tolist(),
        'd2m': subset['d2m'].values.tolist(),
        'tcc': subset['tcc'].values.tolist(),
        'tp': subset['tp'].values.tolist(),
        'tcwv': subset['tcwv'].values.tolist()
        }
    return jsonify(dataDict) # Jsonify internally handles conversion of common types like datetime objects automatically


