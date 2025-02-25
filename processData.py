# source myenv/bin/activate & deactivate

import cdsapi

dataset = "reanalysis-era5-pressure-levels"
request = {
    "product_type": ["reanalysis"],
    'year': ['2019'],  # Change year to 2025
    'month': ['04'],   # Change month to 02 (February)
    'day': ['20'],     # Change day to 20 (valid date)
    "data_format": "grib",
    "download_format": "unarchived"
}

client = cdsapi.Client()
client.retrieve(dataset, request).download()