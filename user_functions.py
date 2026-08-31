
from flask import render_template, url_for
from flask_login import current_user
from sqlalchemy import func, delete
from app import db
from config import Config
from models import Brand, Paint, Colour, SavedColour, SavedPaint, User, Workspace, sa
from colour_functions import getColourID
from helpers import obj_to_dict
import resend

resend.api_key = Config.RESEND_API
print (resend.api_key)

def get_user_details():
    # get user's details
    query = sa.select(User).where(User.id == current_user.id)
    return db.session.scalars(query).first()


def get_workspaces():
    # get all workspaces for the current user
    query = sa.select(Workspace.id, Workspace.name, Workspace.notes).where(Workspace.user_id == current_user.id).order_by(Workspace.id)
    results = db.session.execute(query)
    # convert to list of dictionaries because had to use execute
    return obj_to_dict(results)


def get_workspaces_with_colours():
    # get all workspaces that have saved colours for the current user
    query = sa.select(Workspace.id, Workspace.name, Workspace.notes).join(SavedColour.workspace).where(Workspace.user_id==current_user.id).order_by(Workspace.id).distinct()
    results = db.session.execute(query)
    # convert to list of dictionaries because had to use execute
    return obj_to_dict(results)


def get_saved_colours():
    # get all saved colours for the current user
    favourites = sa.select(Colour.hex, Colour.H, Colour.S, Colour.L, SavedColour.id.label('saved_colour_id'), SavedColour.name.label(
        'saved_colour_name'), SavedColour.notes.label('saved_colour_notes'), SavedColour.workspace_id, ).join(Colour.saved_colours).subquery()
    #print(favourites);
    query = sa.select(favourites, Workspace.name.label('workspace_name'), Workspace.notes.label('workspace_notes')).join(
        favourites, Workspace.id == favourites.c.workspace_id).where(Workspace.user_id == current_user.id)
    #print(query);
    results = db.session.execute(query)
    # convert to list of dictionaries because had to use execute
    return obj_to_dict(results)

def get_saved_paints():
    # get all saved paints for the current user
    paint_colours = sa.select(Paint.id.label('paintid'), Paint.name.label(
        'paint_name'), Colour.hex, Colour.H, Colour.S, Colour.L, Paint.brand_id).join(Colour.paints).subquery()
    paints = sa.select(paint_colours, Brand.name.label('brand_name')).join(
        Brand, Brand.id == paint_colours.c.brand_id).subquery()
    favourites = sa.select(paints, SavedPaint.id.label('saved_paint_id'), SavedPaint.notes.label(
        'saved_paint_notes'), SavedPaint.workspace_id).join(paints, SavedPaint.paint_id == paints.c.paintid).subquery()
    query = sa.select(favourites, Workspace.name.label('workspace_name'), Workspace.notes.label('workspace_notes')).join(
        favourites, Workspace.id == favourites.c.workspace_id).where(Workspace.user_id == current_user.id)
    results = db.session.execute(query)
    # convert to list of dictionaries because had to use execute
    return obj_to_dict(results)


def get_saved_paint_details(data):
    # get details of one saved paint
    paint_colours = sa.select(Paint.id.label('paintid'), Paint.name.label(
        'paint_name'), Colour.hex, Paint.brand_id).join(Colour.paints).subquery()
    paints = sa.select(paint_colours, Brand.name.label('brand_name')).join(
        Brand, Brand.id == paint_colours.c.brand_id).subquery()
    query= sa.select(paints, SavedPaint.id.label('saved_paint_id'), SavedPaint.notes.label(
        'saved_paint_notes')).join(paints, SavedPaint.paint_id == paints.c.paintid).where(SavedPaint.id == data['saved_paint_id'])
    results = db.session.execute(query)
    # convert to list of dictionaries because had to use execute
    return obj_to_dict(results)

def get_saved_colour_details(data):
    # get details of one saved colour
    #print(data)
    query = sa.select(Colour.hex, SavedColour.id.label('saved_colour_id'), SavedColour.name.label(
        'saved_colour_name'), SavedColour.notes.label('saved_colour_notes')).join(Colour.saved_colours).where(SavedColour.id == data['saved_colour_id'])
    #print(query)
    results = db.session.execute(query)
    # convert to list of dictionaries because had to use execute
    return obj_to_dict(results)

def add_colour_to_workspace(data):
    #adds a saved colour to a workspace
    #get id from Colour table
    colour={}
    colour['hex']=data['colour_hex'].lstrip('#')
    colour_id=getColourID(colour)
    
    #TODO prevent same colour being saved twice
    
    #add row to SavedColour table
    row = SavedColour(
        workspace_id=data['workspace_id'],
        colour_id=colour_id,
        name=data['colour_name'],
        notes=data['colour_notes']
    )
    try:
        db.session.add(row)
        db.session.commit()
    except: 
        print('Error adding paint to workspace.')
        return False
    return True

def add_paint_to_workspace(data):
    #adds a saved paint to a workspace
    #get id from Colour table
    
    #check if paint is already saved
    query = sa.select(SavedPaint.id).where(SavedPaint.paint_id==data['paint_id']).where(SavedPaint.workspace_id==data['workspace_id'])
    results = db.session.scalar(query)
    # convert to list of dictionaries because had to use execute
    if results!=None:
        return False
        
    #add row to SavedPaint table
    row = SavedPaint(
        workspace_id=data['workspace_id'],
        paint_id=data['paint_id'],
        notes=data['paint_notes']
    )
    try:
        db.session.add(row)
        db.session.commit()
    except: 
        print('Error adding paint to workspace.')
        return False

    return True

def remove_colour_from_workspace(data):
    #print(data)
    query = sa.delete(SavedColour).where(SavedColour.id == data['saved_colour_id'])
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error removing colour from workspace.')
        return False
    return True

def remove_paint_from_workspace(data):
    #print(data)
    query = sa.delete(SavedPaint).where(SavedPaint.id == data['saved_paint_id'])
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error removing paint from workspace.')
        return False
    return True

def edit_saved_paint_row(data):
    # update the notes for a saved paint
    query = sa.update(SavedPaint).where(SavedPaint.id == data['saved_paint_id']).values(notes=data['saved_paint_notes'])
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error editing saved paint.')
        return False
    return True

def edit_saved_colour_row(data):
    print(data)
    # update the name and notes for a saved colour
    query = sa.update(SavedColour).where(SavedColour.id == data['saved_colour_id']).values(name=data['saved_colour_name'], notes=data['saved_colour_notes'])
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error editing saved colour.')
        return False
    return True


def edit_user_details(data):
    # update user details that aren't email address
    # only name at the moment    
    print(data)
    query = sa.update(User).where(User.id == current_user.id).values(name=data.name)
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error editing user details.')
        return False
    
    return True

def edit_username(data):
    # update email address - will require re-verification of email address    
    query = sa.update(User).where(User.id == current_user.id).values(username=data.username, verified = False)
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error editing username.')
        return False
    return True

def send_password_reset_email(user):
    token = user.get_reset_password_token()
    resend.Emails.send({
        "from": "reset@paintcolours.app",
        "to": [user.username],
        "subject": "Reset your password for Paint Colour Comparison Tool",              
        "html": render_template('email/reset_password.html', user=user, token=token)
    })

def send_password_reset_confirmation_email(user):
    resend.Emails.send({
        "from": "reset@paintcolours.app",
        "to": [user.username],
        "subject": "Password reset for Paint Colour Comparison Tool",              
        "html": render_template('email/reset_password_confirmation.html', user=user)
    })

def send_verification_email(user):
    token = user.get_verify_email_token()
    resend.Emails.send({
        "from": "hello@paintcolours.app",
        "to": [user.username],
        "subject": "Verify email address for Paint Colour Comparison Tool",              
        "html": render_template('email/verify_email.html', user=user, token=token)
    })

def send_registration_confirmation_email(user):
    resend.Emails.send({
        "from": "hello@paintcolours.app",
        "to": [user.username],
        "subject": "Email address verified for Paint Colour Comparison Tool",              
        "html": render_template('email/registration_confirmation.html', user=user)
    })

def send_delete_email(user):
    token = user.get_delete_account_token()
    resend.Emails.send({
        "from": "delete@paintcolours.app",
        "to": [user.username],
        "subject": "Account deletion requested for Paint Colour Comparison Tool",              
        "html": render_template('email/delete_account.html', user=user, token=token)
    })
    
def send_delete_confirmation_email(user):
    resend.Emails.send({
        "from": "delete@paintcolours.app",
        "to": [user.username],
        "subject": "Account deleted at Paint Colour Comparison Tool",              
        "html": render_template('email/delete_account_confirmation.html', user=user)
    })

def setup_user_account(user):
    #user has verified email address, so verify the user
    #also create a default workspace for the user if they have no workspaces 
    #(verification can take place because the email address changed)
    query = sa.update(User).where(User.id == user.id).values(verified=True)
    try:
        db.session.execute(query)
        db.session.commit()
    except:
        print('Error verifying user email address.')
        return False
    
    # create a default workspace for the user if they don't have one yet
    if len(get_workspaces())==0:
        row = Workspace(
            name='Default Workspace',
            notes='This is your default workspace where you can save colours and paints. You can also create additional workspaces to organise your saved colours and paints.',
            user_id=user.id
        )
        try:
            db.session.add(row)
            db.session.commit()
        except: 
            print('Error creating default workspace for user.')
            # don't want to return False here because the user has been verified, so just log the error and continue

    return True

def delete_user_account(user):
    # delete the user account and all associated data
    ##query = sa.delete(User).where(User.id == current_user.id)
   # user = sa.select(User).where(User.id == current_user.id)
    userid = current_user.id
    user = db.session.query(User).filter_by(id = userid).first()
    try:
        db.session.delete(user)
        db.session.commit()
    except:
        print('Error deleting user account.')
        return False
    return True

