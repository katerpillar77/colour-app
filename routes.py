from flask import render_template, redirect, request, flash, url_for, jsonify
from flask_login import current_user, login_user, logout_user, login_required
from functools import wraps
from app import app
from colour_functions import *
from user_functions import *
from models import User
from forms import *
from urllib.parse import urlsplit, urlunsplit
from import_database import import_json_to_database

# Custom decorator to check if user is verified
def verified_required():
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_verified():                
                return redirect(url_for('account'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.context_processor
def inject_login_link():
    return dict(current_user=current_user)

#Icons

@app.context_processor
def inject_heart_icon():
    return dict(heart='/static/images/heart.svg')

@app.context_processor
def inject_heart_fill_icon():
    return dict(heart_fill='/static/images/heart-fill.svg')

@app.context_processor
def inject_question_icon():
    return dict(question='/static/images/question-lg.svg')

@app.context_processor
def inject_cross_icon():
    return dict(cross='/static/images/x-lg.svg')

#Pages

@app.route('/')
def index():
    if current_user.is_anonymous:
        verified = False
    else:
        verified = current_user.is_verified()
    return render_template('index.html', verified=verified) #, paints=get_all_paints(10))

#temporary database import
@app.route('/import-json')
def import_json():
    result= import_json_to_database(4, 'import_json/lick.json')
    flash (result, 'primary')
    return redirect('/')

@app.route('/return-paints-hue',methods=["POST"])
def return_paints_hue():
    return get_paints_hue(request.get_json() )

@app.route('/add', methods=["GET", "POST"])
@login_required
@verified_required()
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
            flash('Paint brand is missing','warning')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page
        if not name:
            flash('Paint name is missing','warning')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page
        if not hexcode:
            flash('Colour is missing','warning')
            return render_template("add.html", brands=brands)
            # TODO handle this with JS to avoid reloading page

        # add to database
        colour = {}
        colour['hex'] = hexcode
        if not add_paint(brand, name, colour):
            flash('Could not add paint to database', 'danger')
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

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    formLogin = LoginForm()
    formRegister = NavigateToRegistrationForm()
    formChange = NavigateToPasswordResetRequestForm()
    if formLogin.submitLogin.data and formLogin.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == formLogin.username.data))
        if user is None or not user.check_password(formLogin.password.data):
            flash('Invalid email or password', 'danger')
            return redirect(url_for('login'))
        
        login_user(user, remember=formLogin.remember_me.data)
        if user.verified == False:
            flash('Your email address must be verified before you can access features for logged in users.', 'warning')
            return redirect(url_for('email_not_verified', user=user.username))
        next_page = request.args.get('next')
        if not next_page or urlsplit(next_page).netloc != '':
            next_page = url_for('index')
        return redirect(next_page)
    if formRegister.submitRegister.data and formRegister.validate():
        return redirect(url_for('register'))
    if formChange.submitChange.data and formChange.validate():
        return redirect(url_for('reset_password_request'))
    return render_template('users/login.html', formLogin=formLogin, formRegister=formRegister, formChange=formChange)


@app.route('/logout')
def logout():
    logout_user()
    flash('You have been logged out of your account.', 'primary')
    return redirect(url_for('index'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, name=form.name.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()    
        send_verification_email(user)
        return redirect(url_for('email_not_verified', user=user))
    return render_template('users/register.html', form=form)

@app.route('/email_not_verified', methods=['GET', 'POST'])
@login_required
def email_not_verified():
    if current_user.is_verified():
        #don't show this page if the user is already verified
        return redirect(url_for('account'))    
    form = VerifyEmailForm()
    if form.validate_on_submit():
        #send new verification email
        send_verification_email(current_user)
        flash('A new verification email has been sent to your email address. Please wait at least 5 minutes before requesting another verification email.', 'primary')
        return redirect(url_for('email_not_verified'))    
    return render_template('users/email_not_verified.html', form=form )

@app.route('/verify_email/<token>', methods=['GET', 'POST'])
@login_required
def verify_email(token):
    if current_user.is_verified():
        flash ('Your email address is already verified.', 'warning')
        return redirect(url_for('account'))
    user = User.verify_verify_email_token(token)
    if not user:
        flash('That token is invalid or has expired. Please request a new verification email.', 'danger')
        return redirect(url_for('email_not_verified'))    
    if setup_user_account(user):  
        send_registration_confirmation_email(user)
        flash('Email address successfully verified. You can now use all features of the website.','primary')
    else:
        flash('Error verifying email address. Please try resending the verification email.', 'danger')
        return redirect(url_for('email_not_verified'))
    return redirect(url_for('index'))

@app.route('/workspaces', methods=['GET', 'POST'])
@login_required
@verified_required()
def workspaces():
    return render_template('workspaces.html',  workspaces=get_workspaces(), colours=get_saved_colours(), paints=get_saved_paints())

@app.route('/account', methods=['GET', 'POST'])
@login_required
def account(): 
    setup_user_account(current_user)
    verified = current_user.is_verified()   
    formVerify = NavigateToVerifyEmailForm()
    formEdit = EditUserDetails(name=current_user.name)
    formEditU = EditUsername(username=current_user.username)
    formChangePassword = NavigateToPasswordResetRequestForm()
    formDelete = NavigateToDeleteAccountRequestForm()
    if formEdit.submitEdit.data and formEdit.validate():
        data = User(name=formEdit.name.data)
        if edit_user_details(data):
            flash('User details updated.', 'primary')
        else:
            flash('Error updating user details.', 'danger')
        return redirect(url_for('account'))
    elif formEditU.submitEditU.data and formEditU.validate():
        data = User(username=formEditU.username.data)
        if edit_username(data):
            send_verification_email(current_user)
            return redirect(url_for('email_not_verified', user=current_user))
        else:
            flash('Error updating email address.', 'danger')
            return redirect(url_for('account'))
    elif formChangePassword.submitChange.data and formChangePassword.validate():
        return redirect(url_for('reset_password_request'))
    elif formDelete.submitDelete.data and formDelete.validate():
        return redirect(url_for('delete_account_request'))    
    elif formVerify.submitVerify.data and formVerify.validate():
        send_verification_email(current_user)
        flash('A new verification email has been sent to your email address. Please wait at least 5 minutes before requesting another verification email.', 'primary')
        return redirect(url_for('email_not_verified'))
    if not verified:
        flash('Your email address must be verified before you can access features for logged in users.', 'warning')    
    return render_template('users/account.html', verified=verified, formVerify=formVerify, formEdit=formEdit, formEditU=formEditU, formChangePassword=formChangePassword, formDelete=formDelete) 
    

@app.route('/reset_password_request', methods=['GET', 'POST'])
def reset_password_request():
    if current_user.is_authenticated:   
        form = ResetPasswordRequestForm(username=current_user.username)
    else:
        form = ResetPasswordRequestForm()
    if form.validate_on_submit():
        user = db.session.scalar(
            sa.select(User).where(User.username == form.username.data))
        if user:
            send_password_reset_email(user)
        flash('Check your email for the instructions to reset your password', 'primary')
        return redirect(url_for('reset_password_request'))
    return render_template('users/reset_password_request.html', form=form)

@app.route('/reset_password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    user = User.verify_reset_password_token(token)
    if not user:
        flash('That token is invalid or has expired. Please request a new password reset email.', 'danger')
        return redirect(url_for('reset_password_request'))
    form = ResetPasswordForm(username=user.username)
    if form.validate_on_submit():
        user.set_password(form.password.data)
        db.session.commit()
        flash('Your password has been reset.', 'primary')
        send_password_reset_confirmation_email(user)
        return redirect(url_for('login'))
    return render_template('users/reset_password.html', form=form)

@app.route('/delete_account_request', methods=['GET', 'POST'])
@login_required
def delete_account_request():      
    form = DeleteAccountRequestForm()
    if form.validate_on_submit():
        #send confirmation email to user
        send_delete_email(current_user)
        flash('A confirmation email has been sent to your email address. Please check your inbox and click the link to confirm account deletion.', 'primary')
        return redirect(url_for('delete_account_request'))
    return render_template('users/delete_account_request.html', form=form, user=current_user )

@app.route('/delete_account/<token>', methods=['GET', 'POST'])
@login_required
def delete_account(token):
    user = User.verify_delete_account_token(token)
    if not user:
        flash('That delete account token is invalid or has expired. Please request a new delete account email.', 'danger')
        return redirect(url_for('delete_account_request'))
    form = DeleteAccountForm()
    if form.validate_on_submit():
        if delete_user_account(user):
            flash('Your account has been deleted.', 'warning')
            send_delete_confirmation_email(user)
            return redirect(url_for('logout'))
        else:
            flash('Error deleting user.', 'danger')
            return redirect(url_for('account'))
    return render_template('users/delete_account.html', form=form, user=user)


## Errors

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404
