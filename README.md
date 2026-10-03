# Paint chooser app

## The idea of this web app is to allow users to find a paint colour that goes with a colour they already have, such as another paint colour, or a colour taken from a wallpaper, tile or carpet.

On the main page, a user chooses a reference colour and paint colours are displayed that match that colour, ordered by similarity. The user can adjust the hue, saturation and luminance of the colour, and can filter by brand. The user can also choose to see complementary and/or tertiary colours. By clicking on the paint colour, they can compare it with the reference/adjusted colour.

The user can save colours and paints to workspaces. In the Workspaces page, the user can manage saved paints and colours, by editing or deleting them. Workspaces can also be deleted.

## Contents of the project

The web app is written in Flask, with client-side operations handled by Javascript. The back-end database is in SQLlite, and the app uses SQLAlchemy to interface with the database. I made this choice so that a different type database of could be used in the future if required; I do regret the choice though as SQLAlchemy is difficult to use. 

I relied heavily on the Mega Flask Tutorial by Miguel Grinberg for user login and session management, SQLAlchemy, and WTForms (including using his 

I needed an email server to send emails to registered users, so 

### Python files

* app.py - the main Flask file
* config.py - defines secrets
* models.py - defines the SQLAlchemy models
* routes.py - defines Flask routes and decorators
* forms.py - I used WTForms and this file holds the form definitions
* helpers.py - helper functions
* colour_functions.py - functions to query or modify the database for colours and paints
* user_functions.py - login and session functions, plus functions to query or modify the database for workspaces and colours/paints saved in workspaces

## Templates

I split up some of the html templates as they were unwieldy, and it was easier to find my way around them when they were split up.

* layout.html - includes common html elements (header, navbar, message flash area, footer, some modals), and blocks for page title, additional js/css to include, and main content.
* index.html - the main page, which includes blocks for additional pages
* index-filter.html - filter options
* index-sort.html - sort options
* index-modal.html - modals for the main page
* workspaces.html - the page where users can edit workspaces and the saved paints/colours
* workspace-modals.html - modals for the workspaces page
* add.html - a page allowing users to add new paints to the database

The following templates relate to users, and are in the /users folder.

* login.html - log in page
* register.html - page to register a new user
* reset_password_request.html - page to request a new password (send 
* account.html - The user account page



