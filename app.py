
import os
from flask import Flask, render_template, g
from dotenv import load_dotenv
import sqlite3

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

DATABASE = 'finance.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

@app.route('/')
def index():
    users = query_db('select * from users')
    for user in users:
        print(user['username'], 'has the id', user['id'])
    return render_template('index.html', users=users)

# Custom 404 error handler
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
