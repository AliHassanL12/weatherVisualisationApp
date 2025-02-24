# source myenv/bin/activate & deactivate

import cdsapi

client = cdsapi.Client()
client.retrieve("reanalysis-era5-land",
    {
        "variable": "2m_temperature",
        "year": "2024",
        "month": "01",
        "day": "01",
        "time": "12:00",
        "format": "netcdf"
    },
    "test.nc"
)

print("Download complete!")
