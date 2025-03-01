import xarray as xr
import json
import datetime as datetime
import numpy as np

ds = xr.open_dataset('./downloads/ERA5_L1_2001.nc')

# Select a subset by selecting a specific time and pressure level

subset = ds.sel(
    time=slice('2001-01-01', '2001-03-30'),
    latitude=slice(40, 50),   
    longitude=slice(10, 20)   
)

print(type(ds['time'].values[0]))  # Check the type of the first time value



'''
Front-end requires data in a serializable format. The netCDF file we have loaded,
and the subset of it that we have chosen contains multidimensional arrays and 
coordinates, which are not able to be directly translated to JSON format. 

Hence we convert the object to a dictionary format, and then serialise that into JSON
and send it over HTTP to the front-end, for parsing and handling.
'''


# Extract individual variables of interest from subset dataset 

t2mSubset = subset['t2m']
eSubset = subset['e']
d2mSubset = subset['d2m']
tccSubset = subset['tcc']
tpSubset = subset['tp']
tcwvSubset = subset['tcwv']
subsetDict = subset.to_dict()


# Convert to a serializable format

t2mDict = t2mSubset.to_dict()
eDict = eSubset.to_dict()
d2mDict = d2mSubset.to_dict()
tccDict = tccSubset.to_dict()
tpDict = tpSubset.to_dict()
tcwvDict = tcwvSubset.to_dict()

# Combine into one dictionary

dataDict = {
    't2m': t2mDict,
    'e': eDict,
    'd2m': d2mDict,
    'tcc': tccDict,
    'tp': tpDict,
    'tcwv': tcwvDict
}

#Method to serialise datetime64 and datetime objects, by converting them to a standardised format

def dateTimeSerializer(obj):
    if isinstance(obj, np.datetime64):
        return str(obj)
    elif isinstance(obj, datetime.datetime):
        return obj.isoformat()
    raise TypeError(f'type {type(obj)} is not serializable.')


# Serialize data dictionary and now we can send this dataJson object over as a part of an HTTP response

dataJson = json.dumps(dataDict, default=dateTimeSerializer)

