import requests
from flask import redirect, render_template, session
from functools import wraps


def apology(message, code=400):
    """Render message as an apology to user."""

    def escape(s):
        """
        Escape special characters.

        https://github.com/jacebrowning/memegen#special-characters
        """
        for old, new in [
            ("-", "--"),
            (" ", "-"),
            ("_", "__"),
            ("?", "~q"),
            ("%", "~p"),
            ("#", "~h"),
            ("/", "~s"),
            ('"', "''"),
        ]:
            s = s.replace(old, new)
        return s

    return render_template("apology.html", top=code, bottom=escape(message)), code


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


def hex_to_rgb(input=""):
    if input == "":
        return ""
    h = input.lstrip('#')
    print('RGB =', tuple(int(h[i:i+2], 16) for i in (0, 2, 4)))


def login_required(f):
    """
    Decorate routes to require login.

    https://flask.palletsprojects.com/en/latest/patterns/viewdecorators/
    """

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)

    return decorated_function


