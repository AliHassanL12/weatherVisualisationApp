import cfgrib

data = cfgrib.open_file('download.grib')

print(data)

print(data.variables)

