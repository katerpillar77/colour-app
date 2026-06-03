from app import db
from flask import jsonify, flash
from flask_login import current_user
from models import Brand, Paint, Colour, SavedColour, SavedPaint, User, Workspace, sa
from sqlalchemy import func
from colour_functions import getColourID

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
    db.session.add(row)
    db.session.commit()
    return

def add_paint_to_workspace(data):
    #adds a saved paint to a workspace
    #get id from Colour table
    print(data)
    print(data['paint_id'])
    #check if paint is already saved
    query = sa.select(SavedPaint.id).where(SavedPaint.paint_id==data['paint_id']).where(SavedPaint.workspace_id==data['workspace_id'])
    print(query)
    results = db.session.scalar(query)
    # convert to list of dictionaries because had to use execute
    print(results)
    if results!=None:
        return False
        
    #add row to SavedPaint table
    row = SavedPaint(
        workspace_id=data['workspace_id'],
        paint_id=data['paint_id'],
        notes=data['paint_notes']
    )
    db.session.add(row)
    db.session.commit()
    return True

def obj_to_dict(results):
    # takes scalars object as input
    if not results:
        return {}
    results_list = []
    try:
        for r in results.mappings():
            results_list.append(dict(r))
    except:
        print('Could not convert to dictionary.')
        return {}
    return results_list

