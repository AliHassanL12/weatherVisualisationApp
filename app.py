from flask import Flask
from view_data import getWeatherData  # Import from views.py
from view_data import getWeatherDataBinary
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
CORS(app, expose_headers=['X-Shape'])
# Register route from views.py (this is the URL path that my flask application will listen to)
app.add_url_rule('/getWeatherData', 'getWeatherData', getWeatherData)
app.add_url_rule('/getWeatherDataBinary', 'getWeatherDataBinary', getWeatherDataBinary)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)