from flask import  render_template, redirect, request, flash, url_for
from helpers import apology, sanitise_colour_input
from flask_login import current_user, login_user, logout_user, login_required
from app import app
from colour_functions import *
from models import User
from forms import LoginForm, RegistrationForm

@app.context_processor
def inject_login_link():
    return dict(current_user=current_user)

@app.route('/')
def index():
    paints =get_all_paints()
    return render_template('index.html', paints=paints)

@app.route('/add', methods=["GET", "POST"])
@login_required
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

##User login/registration
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = LoginForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == form.username.data))
        if user is None or not user.check_password(form.password.data):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or urlsplit(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    return render_template('login.html', title='Sign In', form=form)


@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)

# Custom 404 error handler
@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404
