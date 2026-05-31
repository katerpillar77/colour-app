from flask import render_template, redirect, request, flash, url_for, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from app import app
from colour_functions import *
from user_functions import *
from models import User
from forms import LoginForm, RegistrationForm
from urllib.parse import urlsplit, urlunsplit


@app.context_processor
def inject_login_link():
    return dict(current_user=current_user)


@app.context_processor
def inject_heart_icon():
    return dict(heart='/static/images/heart-fill.svg')


@app.context_processor
def inject_question_icon():
    return dict(question='/static/images/question-lg.svg')

#Pages

@app.route('/')
def index():
    return render_template('index.html', paints=get_all_paints())

@app.route('/add', methods=["GET", "POST"])
@login_required
def add():
    # Form to add a new paint to the database
    # only for logged in users
    brands = get_all_brands()
    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # get data from form
        brand = request.form.get("brand")
        name = request.form.get("name")
        hexcode = request.form.get("hex")

        if not brand:
            flash('Paint brand is missing')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page
        if not name:
            flash('Paint name is missing')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page
        if not hexcode:
            flash('Colour is missing')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page

        # add to database
        colour = {}
        colour['hex'] = hexcode
        if not add_paint(brand, name, colour):
            flash('Could not add paint to database')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page

        return render_template("add.html", brands=brands)

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("add.html", brands=brands)


#JS requests

@app.route('/returnWorkspaces', methods=["GET"])
@login_required
def returnWorkspaces():
    return get_workspaces()


@app.route('/returnWorkspacesWithColours', methods=["GET"])
@login_required
def returnWorkspacesWithColours():
    return get_workspaces_with_colours()


@app.route('/returnSavedColours', methods=["GET"])
@login_required
def returnSavedColours():
    return get_saved_colours()


@app.route('/returnSavedPaints', methods=["GET"])
@login_required
def returnSavedPaints():
    return get_saved_paints()


@app.route('/addSavedColour', methods=["POST"])
@login_required
def add_saved_colours():
    data=request.get_json()    
    add_colour_to_workspace(data)
    return {'result' : True}
  

@app.route('/addSavedPaint', methods=["POST"])
@login_required
def add_saved_paints():
    data=request.get_json()      
    return {'result' : add_paint_to_workspace(data)}


# Users

@app.route('/account')
@login_required
def account():
    return render_template('account.html', user=get_user_details(), workspaces=get_workspaces(), colours=get_saved_colours(), paints=get_saved_paints())


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
    return render_template('login.html', form=form)


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
        # TODO every user needs a default workspace
        flash('Congratulations, you are now a registered user!')
        return redirect(url_for('login'))
    return render_template('register.html', form=form)


@app.route('/change', methods=['GET', 'POST'])
@login_required
def change():
    # change password
    # TODO add template and form
    return render_template('change.html')



@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404
