# Paint chooser app

## The idea of this web app is to allow users to find a paint colour that goes with a colour they already have, such as another paint colour, or a colour taken from a wallpaper, tile, furniture etc.

On the main page, a user chooses a reference colour and paint colours are displayed that match that colour, ordered by similarity. The user can adjust the hue, saturation and luminance of the colour, and can filter the paints by brand. The user can also choose to see complementary and/or tertiary colours. By clicking on the paint colour, they can compare it with the reference/adjusted colour.

The user can save colours and paints to workspaces. In the Workspaces page, the user can manage saved paints and colours, by editing or removing them. Workspaces can also be edited and deleted.

I made this web app because this is a functionality I actually wanted, as I was previously using an Excel spreadsheet to compare paints and colours. I did not originally intend to add full user functionality to the app, but I decided that it would be useful to host the app on the internet so that I can use it all the time. Without requiring users to be logged in and verified, the database of paints would be vulnerable to corruption. I could have made myself the only user, but I thought it would be interesting to add proper user functions. It turned out to be very time-consuming, but I now have a login system that could easily be imported into another project if I want.

## Technology

The web app is written in Flask, with client-side operations handled by Javascript. The back-end database is in SQLlite, and the app uses SQLAlchemy to interface with the database. I made this choice so that the app would be database-agnostic; I do regret it a bit as SQLAlchemy is difficult to use.

I relied heavily on the Mega Flask Tutorial by Miguel Grinberg for user login and session management, SQLAlchemy, and WTForms (including using his bootstrap_wtf.html).

I used Bootstrap for most of the styling, so style.css is minimal. I also used Bootstrap for JS actions such as modals and accordions.

In summary, I used:

- Python and Flask for the web application (including Flask-Login for user login and session management, Flask-WTF for forms) 
- SQLite for the database
- SQLAlchemy for database access
- JavaScript for interactive page behaviour
- Bootstrap for layout and styling
- Resend for email delivery

## Home page

The main page presents a “Reference colour” box and an “Adjusted colour” box. The user can choose a reference colour using a visual colour picker, or select a saved colour from their workspaces. The adjusted colour is set to the same colour as the reference colour. The user can change the adjusted colour using sliders or numeric fields for hue, saturation and luminance. The displayed adjusted colour updates live and is used as the basis for matching paint colours.

The page also displays matching paints underneath the controls, with results ranked by similarity to the selected colour. The results are displayed with the brand and paint name, a colour swatch, the HSL values, and a relevance (similarity) score.

Filters are provided for brand and minimum similarity. I wrote the JS for filtering so it could be easily expanded to add more filters if I want in the future, by using a global variable holding the filter options rather than hardcoding them into the JS. Filter options for brands are dynamically created rather than being hardcoded into the HTML. 

Sorting can be by overall similarity, or by similar hue, luminance or saturation. The user can also choose to see paints that are similar to the complementary or triadic colours of the adjusted colour, ie the same saturation and luminance but different hue.

My JS code provides the following functionality:

* colouring the reference/adjusted colour boxes
* populating a modal to select user's saved colours using a GET request
* fetching paints that match the adjusted colour using a GET request
* filtering the paints and sorting them in accordance with user selections
* populating modals to save colours and paints using GET requests, and sending POST requests to add entries to the database

I needed to find a way to measure distance between colour. At first I assumed that hue was the most important metric, and I only fetched paints within a certain distance of the hue of the adjusted colour, then did a weighted sum in JS of the distances between the hues, saturations and luminances. However, this did not capture the situation where low saturation or low luminance means that a greater deviation in hue is tolerated. I changed to calculating the E76 delta in CIELab which is a better way of measuring distance between colour. The newer E2000 delta is considered more accurate, but it is extremely computationally expensive and overkill for this use case. 

I also moved the calculations from JS to the backend, so that the server calculates the distance for all the paints and only returns those with a small delta. This increases computation on the backend but decreases network use and client-side calculation. Overall I think it's faster, and returns more relevant results. I also decided to store the Lab values in the database so they are only calculated once per colour.

### Third-party libraries

The colour picker is from jscolorpicker.com. I wanted a picker that enabled multiple input (RGB, HSL, hex) and that also has a dropper so the user can pick a colour from a webpage. I don't like the way the colour picker opens and closes, but it was the best I could find as I did not want to make my own. 

The sliders for luminance and saturation are from by jsdelivr.com/package/npm/range-slider-input. The standard HTML slider can't be set by JS, which I needed. I don't like the aesthetics of the sliders much but it's low on the priority list to make nicer.

I used  github.com/bgrins/tinycolor for basic transformations between RGB, HLS and hexcode, but that's all I use it for so I might add those functions in to my own code instead.

## Database

The database contains the following tables:

- User
- Workspace
- Colour
- Brand
- Paint
- SavedColour
- SavedPaint

Each Colour is stored as both hex and HSL values. I went through a few options of how to store the colours, since hex can just be converted to HSL and vice versa. However, the hexcode and HSL are used on every display of a paint, which is refreshed each time the user changes the adjusted colour, so I decided to do a single conversion on saving the colour rather than multiple conversions every time the colour is fetched. Colours are saved as they are required by the user saving either a colour or a paint to a workspace (colours are not deleted). 

Each Workspace is linked to a User. Each Paint is linked to a Colour and a Brand. Each SavedColour is linked to a workspace and a Colour, and has a name and optional notes. Each Saved Paint is linked to a Workspace and a Paint, and has an optional name and notes. The database includes constraints (eg cannot have two workspaces with the same name for a user, cannot save the same paint twice in one workspace, etc), and the POST requests are handled to check for potential errors and return a code rather than fail.

## Account system and verification

The app includes a full user authentication flow using Flask-Login:

  - registration
  - login
  - logout
  - password reset
  - email verification
  - account deletion

The account page lets a user manage their details, reset their password or delete their account. Changing their email address requires re-verification. I signed up to Resend.com for an SMTP server - it is overkill to pay for it when I expect to be the only user of the web app, but you never know.

## User features

If a user is logged in and verified, they can create workspaces (a Default workspace is created for a new user) and save colours and paints to workspaces. Each saved item can include a custom name and notes, making it practical for organising ideas by room, style, or project.

On the Workspaces page a user can edit or delete workspaces, and edit or remove paints and colours.

## Populating the paints database

I used Github Copilot to write a webscraper, to scrape paint colours from various paint retailer websites. This is not included in the project as Copilot has to adapt it for every different website. This was very useful to me as writing a webscraper would have been very time consuming. I will not need to rerun the scraper very often as retailers do not alter their colours much.

I added a route in the app for importing JSON data into the database. 

Verified users can add paints one by one to the database using the Add Paint page, which allows a user to pick a colour (using the same colour picker as the main page) and specify the brand and paint name. This is sent with a POST request and added to the database if it doesn't already exist. 

## List of files

### Python files

* app.py - the main Flask file
* config.py - defines secrets
* models.py - defines the SQLAlchemy models
* routes.py - defines Flask routes and decorators
* forms.py - form definitions for WTForms
* helpers.py - helper functions
* colour_functions.py - functions to query or modify the database for colours and paints
* user_functions.py - login and session functions, plus functions to query or modify the database for workspaces and colours/paints saved in workspaces

### HTML templates

I split up some of the html templates as they were unwieldy, and it was easier to find my way around them when they were split up.

* layout.html - includes common html elements (header, navbar, message flash area, footer, some modals), and blocks for page title, additional js/css to include, and main content
* app-modals.html - modals used on more than one page
* index.html - the main page, which includes blocks for additional pages
* index-filter.html - filter options
* index-sort.html - sort options
* index-modal.html - modals for the main page
* workspaces.html - the page where users can edit workspaces and the saved paints/colours
* workspace-modals.html - modals for the workspaces page
* add.html - a page allowing users to add new paints to the database
* bootstrap_wtf.html - html for WTForms that uses Bootstrap styling

The following templates relate to users, and are in the /users folder; their names are mainly self-explanatory.

* login.html
* register.html
* reset_password_request.html
* reset_password.html
* delete_account_request.html
* delete_account.html
* email_not_verified.html - resend email verification
* account.html - manage account

Email templates are used in managing a user's account and are in the /emails folder; again the names are self-explanatory. In all cases an initial email contains a link to be clicked to confirm that the user wishes to take the action, following which a confirmation email is sent. :

* verify_email.html
* registration_confirmation.html
* reset_password.html
* reset_password_confirmation.html
* delete_account.html
* delete_account_confirmation.html

### Javascript files

I split the JS up so that it doesn't all have to be loaded for every page. I now think perhaps I should have kept it in one file, but it was so hard to find my way around it.

* common.js - loaded by layout.html and imported into the other JS files as necessary
* main.js - loaded by index.hmtl
* workspaces.js - loaded by workspaces.html
* account.js - loaded by account.html
* add.js - loaded by add.js

## Further work

Since I intend to actually use this web app, I will keep developing it. Proposed improvements and work are:

* functionality to compare more than one colour and paint, both on the main page and the workspaces page
* adding drag and drop functionality to the workspaces, so that colours and paints can be dragged between workspaces, or dragged to a delete area, rather than the button clicks and modals that are now used
* creating a contact/support page and cookie policy, just in case other people want to use the app
* add a "copy" button to the paints so the hexcode or similar information can be easily input to somewhere else, like an interior design website
* functionality to remember the most-recently-used workspace and open it automatically when the user is choosing or saving colours/paints
