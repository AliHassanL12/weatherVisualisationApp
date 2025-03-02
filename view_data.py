import xarray as xr
import json
import datetime as datetime
import numpy as np
from flask import jsonify

ds = xr.open_dataset('./downloads/ERA5_L1_2001.nc')

# Fetches a subset of the weather dataset and returns it as a JSON 

def getWeatherData():
    subset = ds.sel(
    time=slice('2001-01-01', '2001-03-30'),
    latitude=slice(40, 50),   
    longitude=slice(10, 20)   
    )

    # Convert dataset variables to a dictionary format 

    dataDict = {
        't2m': subset['t2m'].to_dict(),
        'e': subset['e'].to_dict(),
        'd2m': subset['d2m'].to_dict(),
        'tcc': subset['tcc'].to_dict(),
        'tp': subset['tp'].to_dict(),
        'tcwv': subset['tcwv'].to_dict()
        }
    return jsonify(dataDict) # Jsonify internally handles conversion of common types like datetime objects automatically



