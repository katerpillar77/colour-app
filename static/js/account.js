
//js for account page
document.addEventListener('DOMContentLoaded', function() {

    initiateButtons();

})

function initiateButtons() {
    document.querySelectorAll('.edit-saved-paint').forEach((button) => {
        button.addEventListener('click', () => { 
            editSavedPaint(button.dataset.savedPaint);           
        });   
    });
    document.querySelectorAll('.edit-saved-colour').forEach((button) => {
        button.addEventListener('click', () => { 
            editSavedColour(button.dataset.savedColour);            
        });   
    });
    document.querySelectorAll('.remove-saved-paint').forEach((button) => {
        button.addEventListener('click', () => { 
            removeSavedPaint({id: button.dataset.savedPaint, name: button.dataset.paintName}, {name: button.dataset.workspaceName});           
        });   
    });
    document.querySelectorAll('.remove-saved-colour').forEach((button) => {
        button.addEventListener('click', () => { 
            removeSavedColour({id: button.dataset.savedColour, name: button.dataset.savedColourName}, {name: button.dataset.workspaceName});            
        });   
    });

    //modals
    document.getElementById('edit-paint-modal-save').addEventListener('click', async () => {
        saveEditedPaint();
    });
    document.querySelector('#modal-edit-paint #edit-paint-notes').addEventListener('input', () => {
        const input_notes=document.querySelector('#modal-edit-paint #edit-paint-notes');
        if (input_notes.value !== input_notes.dataset.savedNotes) {
            document.getElementById('edit-paint-modal-save').disabled = false;
        } else {
            document.getElementById('edit-paint-modal-save').disabled = true;
        }
    });
    document.getElementById('edit-colour-modal-save').addEventListener('click', async () => {
        saveEditedColour();
    });
    document.querySelector('#modal-edit-colour #edit-colour-name').addEventListener('input', () => {
        enableSaveEditColourButton();
    });
    document.querySelector('#modal-edit-colour #edit-colour-notes').addEventListener('input', () => {
        enableSaveEditColourButton();
    });
}
    
function enableSaveEditColourButton(){
    const input_notes=document.querySelector('#modal-edit-colour #edit-colour-notes');
    const input_name=document.querySelector('#modal-edit-colour #edit-colour-name');
    if (input_notes.value != input_notes.dataset.savedNotes || (input_name.value != input_name.dataset.savedName && input_name.value.trim() !== "")) {
        document.getElementById('edit-colour-modal-save').disabled = false;
    } else {
        document.getElementById('edit-colour-modal-save').disabled = true;
    }
}
    

async function editSavedPaint(paint_id) {
    //edit notes about a saved paint (can't edit its name or colour, that is inherent to the paint)
    //open the edit paint modal and populate it with the paint and workspace info    
    const modal = new bootstrap.Modal(document.getElementById('editSavedPaintModal'));
    modal.show();
    const destElem=document.getElementById('modal-edit-paint');
    //send a request to the server to get paint notes and workspace info to populate the modal
    const response=await fetch('/return-saved-paint-details', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_paint_id: paint_id,
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //console.log(data);
    if (!data[0]) {
        return false;
    }
    const input_notes=destElem.querySelector('#edit-paint-notes');
    input_notes.value = data[0]['saved_paint_notes'];
    input_notes.dataset.savedNotes = data[0]['saved_paint_notes'];
    input_notes.dataset.savedPaintId= paint_id;
    document.querySelector('#edit-paint-colour').style.backgroundColor = "#" + data[0]['hex'];
    document.querySelector('#edit-paint-name').textContent = data[0]['brand_name'] + " " + data[0]['paint_name'];
    return true;
}       

async function saveEditedPaint() {
    //save edit made to paint notes in the edit paint modal
    saved_paint_id=document.querySelector('#modal-edit-paint #edit-paint-notes').getAttribute('data-saved-paint-id');
    saved_paint_notes= document.querySelector('#modal-edit-paint #edit-paint-notes').value;
    const response=await fetch('/edit-saved-paint', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_paint_id: saved_paint_id,
                saved_paint_notes: saved_paint_notes,
            })
    }); 
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    if (!data) {
        return false;
    }
    if (data['result']==true) {
        //update the paint notes in the paint row
        const paint_notes_elem=document.querySelector('#saved-paint-' + saved_paint_id + ' .saved-paint-notes');
        if (saved_paint_notes=="") {
            paint_notes_elem.innerHTML = "";
        } else {
            paint_notes_elem.innerHTML = "Notes: " + saved_paint_notes;            
        }
    }   else {         
         displayMessage("Error saving changes. Please try again.");   
    }
     //close the modal
     document.getElementById('edit-paint-modal-close').click();

}

async function editSavedColour(colour_id) {
    //edit name and notes of a saved colour (can't edit its actual colour, that is inherent to the colour)
    //open the edit colour modal and populate it with the colour and workspace info    
    const modal = new bootstrap.Modal(document.getElementById('editSavedColourModal'));
    modal.show();
    const destElem=document.getElementById('modal-edit-colour');
    //send a request to the server to get colour details and workspace info to populate the modal
    const response=await fetch('/return-saved-colour-details', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_colour_id: colour_id,
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    if (!data[0]) {
        return false;
    }
    const input_name=destElem.querySelector('#edit-colour-name');
    input_name.value = data[0]['saved_colour_name'];
    input_name.dataset.savedName = data[0]['saved_colour_name'];
    const input_notes=destElem.querySelector('#edit-colour-notes');
    input_notes.value = data[0]['saved_colour_notes'];
    input_notes.dataset.savedNotes = data[0]['saved_colour_notes'];
    input_notes.dataset.savedColourId= colour_id;
    document.querySelector('#edit-colour-colour').style.backgroundColor = "#" + data[0]['hex'];
    document.querySelector('#edit-colour-name').textContent = data[0]['brand_name'] + " " + data[0]['saved_colour_name'];
    document.querySelector('#edit-colour-notes').textContent = data[0]['saved_colour_notes'];
    return true;
}       

async function saveEditedColour() {
    //save edit made to colour name and notes in the edit colour modal
    saved_colour_id=document.querySelector('#modal-edit-colour #edit-colour-notes').dataset.savedColourId;
    saved_colour_name= document.querySelector('#modal-edit-colour #edit-colour-name').value;
    saved_colour_notes= document.querySelector('#modal-edit-colour #edit-colour-notes').value;
    const response=await fetch('/edit-saved-colour', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_colour_id: saved_colour_id,
                saved_colour_name: saved_colour_name,
                saved_colour_notes: saved_colour_notes
            })
    }); 
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    if (!data) {
        return false;
    }
    if (data['result']==true) {
        //update the colour row
        document.querySelector('#saved-colour-' + saved_colour_id + ' .saved-colour-name').innerHTML = saved_colour_name;
        const colour_notes_elem=document.querySelector('#saved-colour-' + saved_colour_id + ' .saved-colour-notes');
        if (saved_colour_notes=="") {
            colour_notes_elem.innerHTML = "";
        } else {
            colour_notes_elem.innerHTML = "Notes: " + saved_colour_notes;            
        }
    }   else {         
         displayMessage("Error saving changes. Please try again.");   
    }
     //close the modal
     document.getElementById('edit-colour-modal-close').click();

}


async function removeSavedPaint(paint, workspace) {
    //TODO add "are you sure?" confirmation step before deleting

    //delete a saved paint 
    //console.log(paint, workspace);
    //send the request to the server to remove the paint from the workspace
    const response=await fetch('/remove-saved-paint', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_paint_id: paint['id']
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //console.log(data);

    let message = "An error occurred while removing the paint. Please try again.";
    if (data['result']==true) {
        message = "The paint '" + paint['name'] + "' has been removed from your workspace '" + workspace['name'] + "'.";
    } 

    //hide the paint row
    //should probably reload paints instead
    document.getElementById('saved-paint-' + paint['id']).style.display = 'none';

    //display confirmation message
    displayMessage(message);      
}

async function removeSavedColour(colour, workspace) {
    //remove a saved colour from a workspace
    //console.log(colour, workspace);
    //send the request to the server to remove the paint from the workspace
    const response=await fetch('/remove-saved-colour', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_colour_id: colour['id'],
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //console.log(data);

    let message = "An error occurred while removing the colour. Please try again.";
    if (data['result']==true) {
        message = "The colour saved as '" + colour['name'] + "' has been removed from your workspace '" + workspace['name'] + "'.";
    } 

    //hide the colour row
    //should probably reload colours instead
    document.getElementById('saved-colour-' + colour['id']).style.display = 'none';
    
    //display confirmation message
    displayMessage(message);   
}