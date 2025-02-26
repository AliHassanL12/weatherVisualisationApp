import cfgrib
import pprint
import xarray as xr
import matplotlib.pyplot as plt

ds = xr.open_dataset('./downloads/ERA5_L1_2001.nc')

# Select a subset by selecting a specific time and pressure level

subset = ds.sel(time=slice('2001-01-01', '2001-03-30'))

'''
Front-end requires data in a serializable format. The netCDF file we have loaded,
and the subset of it that we have chosen contains multidimensional arrays and 
coordinates, which are not able to be directly translated to JSON format. 

Hence we convert the object to a dictionary format, and then serialise that into JSON
and set it over HTTP to the front-end, for parsing and handling.
'''

subset_dict = subset.to_dict()
