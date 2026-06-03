from flask import  render_template, redirect, request, flash
from helpers import apology, sanitise_colour_input
from app import app
from db_functions import *

@app.route('/')
def index():
    paints =get_all_paints()
    return render_template('index.html', paints=paints)

@app.route('/add', methods=["GET", "POST"])
def add():
    #Form to add a new colour to the database

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        #get data from form
        name = request.form.get("name")
        r = request.form.get("R")
        g = request.form.get("G")
        b = request.form.get("B")
        hex=request.form.get("hex")

        if not name:
            flash('Colour name is missing')
            return render_template("add.html")
            #TODO handle this with JS to avoid reloading page

        #test data
        #returns RGB dictionary or False
        colour = sanitise_colour_input(r,g,b,hex)
        if not colour:
            flash('Colour is missing or invalid')
            return render_template("add.html")
            #TODO handle this with JS to avoid reloading page

        #add to database
        if not add_colour("", name, colour):
            flash('Could not add colour to database')
            return render_template("add.html")
            #TODO handle this with JS to avoid reloading page

        return render_template("add.html")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("add.html")

# Custom 404 error handler
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404
