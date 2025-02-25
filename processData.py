# source myenv/bin/activate & deactivate

import cdsapi

dataset = "reanalysis-era5-pressure-levels"
request = {
    "product_type": ["reanalysis"],
    'year': ['2019'],  
    'month': ['04'],   
    'day': ['20'],    
    "data_format": "grib",
    "download_format": "unarchived"
}

client = cdsapi.Client()
client.retrieve(dataset, request).download()