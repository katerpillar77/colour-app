//common JS
document.addEventListener('DOMContentLoaded', function() {
    //remove focus from buttons that open modals to avoid aria warning
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.addEventListener('hide.bs.modal', () => {
            document.activeElement.blur();
        });
    });

    //initiate tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(
        tooltipTriggerEl))

});



//user functions

async function displayPaintsInWorkspaces(destElem, paint={}) {
    //inserts list of saved paints nested inside workspaces into modal for adding saved paints
 
    showSpinner(destElem, true);

    //hide error messages in modal
    destElem.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });

    //add details of paint to be saved
    colour_holder=destElem.querySelector('#paint-details .colour-holder');
    const p_col = paint['colour'] ?? "#ffffff";
    colour_holder.style.backgroundColor=p_col;
    colour_holder.setAttribute('title', p_col);
    destElem.querySelector('.paint-name').innerHTML = paint['name'] ?? "";
    
    //get data
    const [paints, workspaces] = await Promise.all([loadData('/return-saved-paints'),
        loadData('/return-workspaces')]);

    //get template for workspace
    let content=destElem.querySelector('#template');
    for (const w of workspaces) {
        //clone accordion-item template
        let new_content=content.cloneNode(true);
        new_content.id="workspace-" + w.id;
        let ws = content.parentNode.appendChild(new_content);
        //add workspace details to accordion
        ws.removeAttribute("hidden");
        let accordion_button=ws.querySelector('.accordion-button');
        accordion_button.setAttribute('data-bs-target', '#collapse'+w.id);
        accordion_button.setAttribute('aria-controls', 'collapse'+w.id);
        accordion_button.innerHTML = w.name;
        ws.querySelector('.workspace-notes').innerHTML = w.notes;
        accordion_collapse=ws.querySelector('.accordion-collapse');
        accordion_collapse.id='collapse'+w.id;
        //uncollapse if the first accordion item
                  
        //add event listener to the "choose" button
        ws.querySelector('.choose-workspace').addEventListener ('click', function() {
            savePaint(destElem, paint, ws, {id:w.id, name:w.name});
        });
        
        //add paints
        addPaintCol(paints, w, ws);
    }
    //push template to end to prevent accordion styling issues
    content.parentNode.appendChild(content);
    showSpinner(destElem, false);
    return;
}

function addPaintCol( paint_list, w, ws, modalAction) {
    //adds additional details for paint modal for a workspace

    //add colours to workspaces
    let col=ws.querySelector('#col-template');
    let i =0;
    for (const p of paint_list) {
        //if the colour belongs in this workspace
        if (p.workspace_id == w.id) {
            i+=1;
            //clone column template
            let new_col=col.cloneNode(true);
            new_col.id="paint-" + p.saved_paint_id;            
            let paint = col.parentNode.appendChild(new_col);
            //add paint details to column
            paint.removeAttribute("hidden");
            paint.querySelector('.paint-name').innerHTML = p.brand_name + " "+ p.paint_name;
            let colour_holder=paint.querySelector('.saved-paint');
            colour_holder.style.backgroundColor = "#" + p.hex;
            //add name and notes to element's title
            colour_holder.setAttribute('title', p.saved_paint_notes);
        }
    }
    if (i==0 ){
        //no paints
        ws.querySelector('.already-saved').innerHTML="No paints saved in this workspace yet."
    }
}

async function savePaint(modal, paint, ws, workspace) {
    //saves a chosen paint to a chosen workspace using notes entered in a modal

    //hide error messages in modal
    modal.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });

    let paint_notes = document.getElementById('paint-notes').value;
    const response=await fetch('/add-saved-paint', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                paint_id: paint['id'],
                workspace_id: workspace['id'],
                paint_notes: paint_notes
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    if (data['result']==false){
        //paint is already saved in this workspace
        let display_error=ws.querySelector('.error');
        display_error.removeAttribute('hidden');
        display_error.innerHTML="This paint is already saved in this workspace."
        return;
    }
    
    //empty form
    document.getElementById("paint-input").reset();
    
    //trigger close of modal
    document.getElementById('add-paint-modal-close').click() ;
    //display confirmation message
    displayMessage("The paint '" + paint['name'] + "' has been saved in your workspace '" + workspace['name'] + "'.");  
}


async function displayColoursInWorkspaces(destElem, modalAction, colour_to_add="") {
    //inserts list of saved colours nested inside workspaces into modal for adding/selecting saved colours
    showSpinner(destElem, true);

    //get data
    let with_colours=false;
    if (modalAction=="select") {
        //get only workspaces with saved colours
        with_colours=true;        
    } 
    
    const [colours, workspaces] = await Promise.all([loadData('/return-saved-colours'),
        loadData('/return-workspaces-with-colours')]);

    if (modalAction=="select" && workspaces[0]==0){
        //no workspaces with colours returned
        insert_text(destElem, "No saved colours.");
        return;
    }
    if (colours == false || workspaces == false) {
        //error has occurred
        insert_text(destElem, "Could not load saved colours.");
        return;
    }
    if (modalAction=="add") {
        //add details of colour to be saved
        colour_holder=destElem.querySelector('#colour-details .colour-holder');
        colour_holder.style.backgroundColor=colour_to_add;
        colour_holder.setAttribute('title', colour_to_add);
        destElem.querySelector('.colour-code').innerHTML =colour_to_add;
    }
    //get template for workspace
    let content=destElem.querySelector('#template');
   // let i=0;
    for (const w of workspaces) {
        //clone accordion-item template
        let new_content=content.cloneNode(true);
        new_content.id="workspace-" + w.id;
        let ws = content.parentNode.appendChild(new_content);
        //let ws = content.parentNode.insertBefore(new_content, content.nextSibling);
        //add workspace details to accordion
        ws.removeAttribute("hidden");
        let accordion_button=ws.querySelector('.accordion-button');
        accordion_button.dataset.bsTarget='#collapse'+w.id;
        accordion_button.setAttribute('aria-controls', 'collapse'+w.id);
        accordion_button.innerHTML = w.name;
        ws.querySelector('.workspace-notes').innerHTML = w.notes;
        accordion_collapse=ws.querySelector('.accordion-collapse');
        accordion_collapse.id='collapse'+w.id;
        //uncollapse if the first accordion item
      //  if (i==0){
         //   accordion_button.classList.remove('collapsed');
         //   accordion_button.setAttribute('aria-expanded', "True");
          //  accordion_collapse.classList.add('show');
      //  }
            
        if (modalAction=='add') {
            //add event listener to the "choose" button
            ws.querySelector('.choose-workspace').addEventListener ('click', function() {
                saveColour(colour_holder.getAttribute('title'), {id: w.id, name: w.name});
            });
        }

        //add colours
        addColourCol(colours, w, ws, modalAction);
      //  i=+1;
    }
    //push template to end to prevent accordion styling issues
    content.parentNode.appendChild(content);
    showSpinner(destElem, false);
    return;
}

function addColourCol( colour_list, w, ws, modalAction) {
    //adds a column for each matching colour

    //add colours to workspaces
    let col=ws.querySelector('#col-template');
    let i=0;
    for (const c of colour_list) {
        //if the colour belongs in this workspace
        if (c.workspace_id == w.id) {
            i+=1;
            //clone column template
            let new_col=col.cloneNode(true);
            new_col.id="colour-" + c.saved_colour_id;
            new_col.setAttribute('colour', c.hex);
            //let colour = col.parentNode.insertBefore(new_col, col.nextSibling);
            let colour = col.parentNode.appendChild(new_col);
            //add colour details to column
            colour.removeAttribute("hidden");
            colour.querySelector('.colour-name').innerHTML = c.saved_colour_name;
            let colour_holder=colour.querySelector('.saved-colour');
            colour_holder.style.backgroundColor = "#" + c.hex;
            let notes_text="";
            if(c.saved_colour_notes !="") {
                notes_text=" - " + c.saved_colour_notes;
            }
            if (modalAction=="select") {
                //add colour and notes to element's title
                colour_holder.setAttribute('title', "#" + c.hex + notes_text);
                //add event listener to allow selection of colour
                colour_holder.addEventListener ('click', function() {
                    picker.setColor(c.hex, true);
                    document.getElementById('select-saved-modal-close').click();
                });
            } else if (modalAction=="add") {
                //add name and notes to element's title
                colour_holder.setAttribute('title', c.saved_colour_name + notes_text);
            }
        }
    }
    if (i==0 ){
        //no paints
        ws.querySelector('.already-saved').innerHTML="No paints saved in this workspace yet."
    }   
}

async function saveColour(colour_hex, workspace){
    //saves a chosen colour to a chosen workspace
    
    //hide error messages 
    name_required=document.getElementById('name-required');
    name_required.setAttribute('hidden', 'True');

    //get form data
    let colour_name = document.getElementById('colour-name').value;
    if (colour_name==""){
        name_required.removeAttribute('hidden');
        return;
    }
    let colour_notes = document.getElementById('colour-notes').value;
    
    //add colour to workspace
    const response=await fetch('/add-saved-colour', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                colour_hex: colour_hex,
                workspace_id: workspace['id'],
                colour_name: colour_name,
                colour_notes: colour_notes
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //console.log(data);

    let message = "An error occurred while saving the colour. Please try again.";
    if (data['result']==true) {
        message = "The colour " + colour_hex + " has been saved with the name '" + colour_name + "' in your workspace '" + workspace['name'] + "'.";
    } 

    //empty form
    document.getElementById("colour-input").reset();
    
    //trigger close of modal
    document.getElementById('add-colour-modal-close').click();
    
    //display confirmation message
    displayMessage(message);      
}

async function loadData(route) {
    //return json object from route
    //return false if failure
    const response = await fetch(route);
    if (!response.ok) {
        console.log('Route ' + route + '; Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //control for empty data - it gets processed as False
    if (data.length==0){
        data.push(0);
    }
    //console.log(data);
    return data;
}

function showSpinner(destElem, show) {
    //displays or removes a spinner inside a ".spinner" element
    let spinnerHTML = "";
    if (show == true) {
        spinnerHTML =
            "<div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Loading...</span></div>";
    }
    destElem.querySelector(".spinner").innerHTML = spinnerHTML;
}

function insert_text(destElem, destHTML) {
    //remove spinner and insert content into .content class
    showSpinner(destElem, false);
    destElem.querySelector('.content').innerText = destHTML;
}

function displayMessage(message=""){
    //display a modal with a message
    if (message!="") {        
        document.getElementById('confirmation-message').innerHTML=message;
        const modalMessage = new bootstrap.Modal(document.getElementById('confirmModal'));
        modalMessage.show();
    }
}

function destroyModalAccordion(destElem) {
    //remove inserted accordion content from a modal
    let elements=destElem.querySelectorAll('.accordion-item');
    elements.forEach(function(element) {
        if (element.id!="template"){
            element.remove();
        }
    });
}

//Helper function: fire an event when needed
function createEvent(id, eventType) {
    //fire an event for input boxes that are programmatically changed
    document.querySelector(id).dispatchEvent(new Event('eventType'));
}