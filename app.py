
import os
from flask import Flask, render_template
from dotenv import load_dotenv
import sqlite3

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

DATABASE = '/finance.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

    
@app.route('/')
def index():
    return render_template('index.html')

# Custom 404 error handler
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
