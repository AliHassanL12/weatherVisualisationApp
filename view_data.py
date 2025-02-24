import xarray as xr
import matplotlib.pyplot as plt

# Load the NetCDF file
ds = xr.open_dataset("/Users/admin/third-year-uni/project/weatherVisualisationApp/test.nc")
 # Replace with the path to your downloaded file

# Print dataset info to explore variables, dimensions, etc.
print(ds)

# List available variables
print(ds.variables)

# Visualize a variable (e.g., 2m temperature, replace 't2m' with the correct variable)
ds["t2m"].isel(time=0).plot()  # You can adjust `time=0` based on the variable dimension
plt.show()
