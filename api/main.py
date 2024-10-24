# main.py

from flask import Flask
from flask_cors import CORS
from dog.main import api1  # Import the blueprint from api1.py
from trainer.main import api2  # Import the blueprint from api1.py
from track.main import api3  # Import the blueprint from api1.py
from meetings.main import api4  # Import the blueprint from api1.py

# from api2 import api2  # Import the blueprint from api2.py

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Register the blueprints
app.register_blueprint(api1)
app.register_blueprint(api2)
app.register_blueprint(api3)
app.register_blueprint(api4)

if __name__ == '__main__':
    app.run(debug=True)
