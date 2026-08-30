from flask_login import current_user
from flask_wtf import FlaskForm
from wtforms import HiddenField, widgets, Field, StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import ValidationError, DataRequired, Email, EqualTo, ReadOnly, Disabled
import sqlalchemy as sa
from app import db
from models import User

class DangerField(BooleanField):
    ##A version of the SubmitField that uses the Bootstrap danger button style
    widget = widgets.SubmitInput()

class WarningField(BooleanField):
    ##A version of the SubmitField that uses the Bootstrap warning button style
    widget = widgets.SubmitInput()

class SecondaryField(BooleanField):
    ##A version of the SubmitField that uses the Bootstrap secondary button style
    widget = widgets.SubmitInput()

class LoginForm(FlaskForm):
    username = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submitLogin = SubmitField('Sign In')

class NavigateToRegistrationForm(FlaskForm):
    submitRegister = SecondaryField('Register new user')

class RegistrationForm(FlaskForm):    
    username = StringField('Email', validators=[DataRequired(), Email()])
    name = StringField('Name', validators=[DataRequired()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        user = db.session.scalar(sa.select(User).where(
            User.username == username.data))
        if user is not None:
            raise ValidationError('Email address already used as a username.')

class NavigateToVerifyEmailForm(FlaskForm):
    submitVerify = SubmitField('Verify email address')

class VerifyEmailForm(FlaskForm):
    submit = SubmitField('Resend verification email')

class NavigateToEditUserDetails(FlaskForm):
    submitEditUser = SecondaryField('Edit user details')

class EditUserDetails(FlaskForm):
    name = StringField('Name', validators=[DataRequired()])
    submitEdit = SubmitField('Update details')

class EditUsername(FlaskForm):
    username = StringField('Email', validators=[DataRequired(), Email()])
    submitEditU = SubmitField('Update email')

    def validate_username(self, username):
        user = db.session.scalar(sa.select(User).where(
            User.username == username.data))
        if user is not None:
            print(user.id, current_user.id)
            if user.id != current_user.id:
                raise ValidationError('Email address already used as a username.')


class NavigateToPasswordResetRequestForm(FlaskForm):
    submitChange = SecondaryField('Reset password')

class ResetPasswordRequestForm(FlaskForm):
    username = StringField('Email', validators=[DataRequired(), Email()])
    submit = SubmitField('Request password reset')

class ResetPasswordForm(FlaskForm):
    username =StringField('Email', validators=[ReadOnly()])
    password = PasswordField('Password', validators=[DataRequired()])
    password2 = PasswordField(
        'Repeat Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Reset password')


class NavigateToDeleteAccountRequestForm(FlaskForm):
    submitDelete = SecondaryField('Delete account')

class DeleteAccountRequestForm(FlaskForm):
    submit = WarningField('Send delete confirmation email')

class DeleteAccountForm(FlaskForm):
    submit = DangerField('Delete account')