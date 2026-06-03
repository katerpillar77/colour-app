from app import db
from flask import jsonify
from models import Brand, Paint, sa
from sqlalchemy import func
from colour_functions import getColourID
import json

def import_json_to_database(brand, input):

    try:
        with open(input, "r") as jsonfile: 
            data = json.load(jsonfile)
    except FileNotFoundError:
        print("File not found")
        return False
    except:
        print("Some other error")
        return False

    for row in data:
        name=row.get('name')
        colour={'hex': row.get('hex'), 'H': row.get('hue'), 'S': row.get('saturation'), 'L': row.get('lightness')}

        if not brand:
            print('Paint brand is missing - ' + name)
            continue
        if not name:
            print('Paint name is missing - ' + colour['hex'])
            continue
        if not colour['hex']:
            print('Colour is missing - ' + name)
            continue
        #print(colour)
        result= add_paint_import(brand, name, colour)
    print('Import complete')
    return True

def add_paint_import(brand="", name="", colour={}):
    #add a paint to the paints table

    #strip # from hex if it's there
    colour['hex']=colour['hex'].lstrip('#')

    #Remove Â if it appears - issue with circleR when used in paint name
    name = name.replace('Â', '')

    #get id of colour in colours table
    colourid=getColourID(colour)

    #check if same brand and name already appear in the paints table with a different colour_id
    query_paint_2=sa.select(Paint.id).where(Paint.brand_id==brand, func.lower(Paint.name) ==func.lower(name)).where(Paint.colour_id != colourid)
    try:
        result_paint_2=db.session.execute(query_paint_2).first()
    except:
        print('error in finding existing paint')
        result_paint_2=None
    if result_paint_2!=None:
        #paint name already exists for a different colour 
        print('Paint name is already in database with a different colour - ' + name)
        name = name + '|updated'
        print('Renaming to ' + name )

    #check if same brand, name and colourid already appear in the paints table
    query_paint=sa.select(Paint.id).where(Paint.brand_id==brand, Paint.colour_id == colourid, func.lower(Paint.name) ==func.lower(name))
    try:
        result_paint=db.session.execute(query_paint).first()
    except:
        print('error in finding existing paint')
        result_paint=None
    if result_paint!=None:
        #paint already exists
        #print('Paint is already in database - ' + name)
        return True
 
    #add paint to paints table
    paint=Paint(name = name, brand_id=brand, colour_id=colourid)
    db.session.add(paint)
    db.session.commit()

    #print('Paint added to database - ' + name)
    return True

