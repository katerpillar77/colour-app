from app import app, db
from flask import flash
from models import Paint, Colour, Brand, sa
from sqlalchemy import func
import colorsys

def get_all_paints():
    ##get list of all paints in the database
    query=sa.select(Paint)
    return db.session.scalars(query)

def get_all_brands():
    ##get list of brands in the database
    query=sa.select(Brand).order_by(Brand.name)
    return db.session.scalars(query)

def add_paint(brand="", name="", colour={}):
    #add a paint to the paints table

    #check hexcode was passed
    if colour.get('hex')=="":
        print('no hexcode passed')
        return False

    #create string for use in messages
    paint_details= name + " - " + colour['hex']

    #strip # from hex
    colour['hex']=colour['hex'].lstrip('#')

    #get id of colour in colours table
    colourid=getColourID(colour)

    #check if same brand, name and colourid already appear in the paints table
    query_paint=sa.select(Paint.id).where(Paint.brand_id==brand, Paint.colour_id == colourid, func.lower(Paint.name) ==func.lower(name))
    try:
        result_paint=db.session.execute(query_paint).first()
    except:
        print('error in finding existing paint')
        result_paint=None
    if result_paint!=None:
        #paint already exists
        flash('Paint is already in database - ' + paint_details)
        return True

    #add paint to paints table
    paint=Paint(name = name, brand_id=brand, colour_id=colourid)
    db.session.add(paint)
    db.session.commit()

    flash('Paint added to database - ' + paint_details)
    return True

def getColourID(colour):
    #add a colour to the database if it doesn't exist

    #colour is a dictionary, should include key 'hex'
    if colour.get('hex')=="":
        print('no hexcode passed')
        return False

    #check if colour already exists
    query_col=sa.select(Colour.id).where(Colour.hex == colour['hex'])
    try:
        result_col=db.session.execute(query_col).first()
    except:
        print('error in finding colour id')
        result_col=None

    if result_col==None:
        #no matching colour or error, add new
        #convert to hsl
        rgb=hex_to_rgb(colour['hex'])
        if rgb==False:
            print('could not convert hex to rgb')
            return False
        colour['h'], colour['l'], colour['s'] = colorsys.rgb_to_hls(rgb['r']/255, rgb['g']/255, rgb['b']/255)
        colour=Colour( hex=colour['hex'], H=round(360*colour['h']), S=round(100*colour['s']), L=round(100*colour['l']))
        db.session.add(colour)
        db.session.commit()
        colourid=colour.id
    else:
        #matching colour found, use it
        colourid=result_col[0]

    return colourid

def hex_to_rgb(h=""):

    if h == "":
        return False

    #check length
    if len(h) != 6:
        print("hex length not 6")
        return False

    #turn hex into three base-10 values
    try:
        r=int(h[0:2],16)
        g=int(h[2:4],16)
        b=int(h[4:6],16)
    except:
        print("hexcode does not contain integers")
        return False
    return {"r":r, "g":g, "b":b}

def rgb_to_hex(red, green, blue):
    """Return color as #rrggbb for the given color values."""
    return '#%02x%02x%02x' % (red, green, blue)

##not needed any more, using colour picker
def sanitise_colour_input(r="", g="", b="", hex=""):
    # returns a dictionary of RGB values as strings, or False if cannot be created
    print("sanitise_colour_input")
    #TODO instead of returning false, display alert
    #TODO alternatively move this to Javascript so can display html alert

    # must receive at least RGB or hexcode
    # supplied RGB values take precedence over hex
    if r == "" or g == "" or b == "":
        #incomplete RGB values, try hex
        if hex=="":
            #no values provided at all
            print("no values at all")
            return False
        else:
            #turn hex into RGB
            #check length
            if len(hex) != 6:
                print("hex length not 6")
                return False
            #turn hex into three base-10 values
            try:
                r=int(hex[0:2],16)
                g=int(hex[2:4],16)
                b=int(hex[4:6],16)
            except:
                print("hexcode does not contain integers")
                return False
    else:
        # check RGB values are integers
        try:
            r = int(r)
            g = int(g)
            b = int(b)
        except:
            print("RGB values are not integers")
            return False

    #now we've got three integers
    #check they are valid colour values
    if r<0 or g <0 or b<0 or r>255 or g>255 or b>255:
        print("numbers are not valid colour values")
        return False
    else:
        #OK, return dictionary
        return {"r":r, "g":g, "b":b}



