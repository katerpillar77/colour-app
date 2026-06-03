from flask import Flask, render_template
from dotenv import load_dotenv
from config import Config
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config.from_object(Config)
db = SQLAlchemy(app)
migrate = Migrate(app, db)

import models
import routes

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
