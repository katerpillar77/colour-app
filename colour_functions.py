from app import app, db
from flask import flash
from models import Paint, Colour, Brand, sa, User
from sqlalchemy import func
from werkzeug.security import generate_password_hash
from helpers import apology, hex_to_rgb
import colorsys

def get_all_paints():
    print (generate_password_hash('password'))
    ##get list of all paints in the database
    query=sa.select(Paint)
    results=db.session.scalars(query)
    return results

def add_colour(brand="", name="", colour={}):
    #must have run sanitise_colour_input first
    #create string for use in messages
    colour_details= name + " - RGB(" + str(colour['r']) +", " + str(colour['g']) + ", " + str(colour['b']) +")"
    #convert rgb to hsl
    h, l, s = colorsys.rgb_to_hls(colour['r']/255, colour['g']/255, colour['b']/255)

    #check if brand already exists
    #TODO add brand
    ##no-form should have list of existing brands, with a button to add new

    #check if colour already exists
    query_col=sa.select(Colour.id).where(Colour.R == colour['r'],Colour.G == colour['g'],Colour.B == colour['b'])
    try:
        result_col=db.session.execute(query_col).first()
    except:
        print('error in finding colour id')
        result_col=None

    if result_col==None:
        #no matching colour or error, add new
        colour=Colour( R=colour['r'], G= colour['g'], B=colour['b'], H=round(360*h), S=round(100*s), L=round(100*l))
        db.session.add(colour)
        db.session.commit()
        colourid=colour.id
    else:
        #matching colour found, use it
        colourid=result_col[0]
        #check if same name and colourid already appear in the database
        query_paint=sa.select(Paint.id).where(Paint.colour_id == colourid, func.lower(Paint.name) ==func.lower(name))
        try:
            result_paint=db.session.execute(query_paint).first()
        except:
            print('error in finding existing paint')
            result_paint=None
        if result_paint!=None:
            #paint already exists
            flash('Paint is already in database - ' + colour_details)
            return True

    #TODO still need to add brand

    #add paint to database
    paint=Paint(name = name, brand_id=1, colour_id=colourid)
    db.session.add(paint)
    db.session.commit()

    flash('Colour added to database - ' + colour_details)
    return True
