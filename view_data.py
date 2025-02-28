import xarray as xr
import matplotlib.pyplot as plt

ds = xr.open_dataset('./downloads/ERA5_L1_2001.nc')

# Select a subset by selecting a specific time and pressure level

subset = ds.sel(
    time=slice('2001-01-01', '2001-03-30'),
    latitude=slice(40, 50),   
    longitude=slice(10, 20)   
)

'''
Front-end requires data in a serializable format. The netCDF file we have loaded,
and the subset of it that we have chosen contains multidimensional arrays and 
coordinates, which are not able to be directly translated to JSON format. 

Hence we convert the object to a dictionary format, and then serialise that into JSON
and send it over HTTP to the front-end, for parsing and handling.
'''
t2mSubset = subset['t2m']
e_subset = subset['e']
subsetDict = subset.to_dict()

print(t2mSubset)
print(e_subset)

