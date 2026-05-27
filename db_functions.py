from app import app, db
from models import Paint, Colour, Brand
import sqlalchemy as sa
from helpers import apology
from app import db
from helpers import hex_to_rgb

se= db.session

def get_all_paints():
    ##get list of all paints in the database
    query=sa.select(Paint)
    results=se.scalars(query)
 ##   for item in items:
  ##      print(item.name, item.colour.G, item.brand.name)
    return results

def add_colour(brand="", name="", colour={}):
    #must have run sanitise_colour_input first
    #convert rgb to hsl
    #TODO

    #check if brand already exists
    #TODO add brand

    #check if colour already exists
    #TODO
        #return message and show colour
        #TODO

    #if not, add to database
    #TODO still need to add brand

    ##TOTO convert to HSL
    colour=Colour( R=colour['r'], G= colour['g'], B=colour['b'], H=0, S=0, L=0)
    se.add(colour)
    se.commit()
    paint=Paint(name = name, brand_id=1, colour_id=colour.id)
    se.add(paint)
    se.commit()

    return True
