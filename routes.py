from flask import  render_template, redirect, request
from helpers import apology, sanitise_colour_input
from app import app
from db_functions import *

@app.route('/')
def index():
    paints =get_all_paints();
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
            return apology("must provide paint name", 400)
            #TODO handle this more gracefully

        #test data
        #returns RGB dictionary or False
        colour = sanitise_colour_input(r,g,b,hex)
        if not colour:
            return apology("must provide paint colour", 400)
            #TODO handle this more gracefully

        #add to database
        if not add_colour("", name, colour):
            return apology("could not add colour to database", 400)
            #TODO handle this more gracefully

        #TODO confirm colour has been added
        #refresh page
        return render_template("add.html")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("add.html")

# Custom 404 error handler
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404
