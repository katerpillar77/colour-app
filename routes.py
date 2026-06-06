from flask import render_template, redirect, request, flash, url_for, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from app import app
from colour_functions import *
from user_functions import *
from models import User
from forms import LoginForm, RegistrationForm
from urllib.parse import urlsplit, urlunsplit
from import_database import import_json_to_database



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
    return render_template('index.html') #, paints=get_all_paints(10))

#temporary database import
@app.route('/import-json')
def import_json():
    result= import_json_to_database(4, 'import_json/lick.json')
    flash (result)
    return redirect('/')

@app.route('/return-paints-hue',methods=["POST"])
def return_paints_hue():
    return get_paints_hue(request.get_json() )

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

@app.route('/return-brands-with-paints', methods=["GET"])
def returnBrandsWithPaints():
    return get_brands_with_paints()


@app.route('/return-workspaces', methods=["GET"])
@login_required
def returnWorkspaces():
    return get_workspaces()


@app.route('/return-workspaces-with-colours', methods=["GET"])
@login_required
def returnWorkspacesWithColours():
    return get_workspaces_with_colours()


@app.route('/return-saved-colours', methods=["GET"])
@login_required
def returnSavedColours():
    return get_saved_colours()


@app.route('/return-saved-paints', methods=["GET"])
@login_required
def returnSavedPaints():
    return get_saved_paints()


@app.route('/add-saved-colour', methods=["POST"])
@login_required
def add_saved_colour():
    return {'result' : add_colour_to_workspace(request.get_json() )}
  

@app.route('/add-saved-paint', methods=["POST"])
@login_required
def add_saved_paint(): 
    return {'result' : add_paint_to_workspace(request.get_json() )}


@app.route('/edit-saved-paint', methods=["POST"])
@login_required
def edit_saved_paint():
    return {'result' : edit_saved_paint_row(request.get_json())}


@app.route('/edit-saved-colour', methods=["POST"])
@login_required
def edit_saved_colour():  
    return {'result' : edit_saved_colour_row(request.get_json())}


@app.route('/remove-saved-paint', methods=["POST"])
@login_required
def remove_saved_paint():  
    return {'result' : remove_paint_from_workspace(request.get_json())}


@app.route('/remove-saved-colour', methods=["POST"])
@login_required
def remove_saved_colour():   
    return {'result' : remove_colour_from_workspace(request.get_json())}


@app.route('/return-saved-paint-details', methods=["POST"])
@login_required
def return_saved_paint_details():
    return get_saved_paint_details(request.get_json())


@app.route('/return-saved-colour-details', methods=["POST"])
@login_required
def return_saved_colour_details():   
    return get_saved_colour_details(request.get_json())

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
