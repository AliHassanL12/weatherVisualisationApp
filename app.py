from flask import Flask
from view_data import getWeatherData  # Import from views.py

app = Flask(__name__)

# Register route from views.py (this is the URL path that my flask application will listen to)
app.add_url_rule('/getWeatherData', 'getWeatherData', getWeatherData)

if __name__ == '__main__':
    app.run(debug=True)