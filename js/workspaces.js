/*jshint esversion: 11 */

import {docSetup, displayMessage} from "/static/js/common.min.js";
import * as commonjs from "/static/js/common.min.js";

//js for workspaces page
document.addEventListener('DOMContentLoaded', function() {

    docSetup();
    initiateButtons();
    
});

function initiateButtons() {
    document.querySelectorAll('.edit-workspace').forEach((button) => {
        button.addEventListener('click', () => { 
            editWorkspace(button.dataset.workspaceId);           
        });   
    });
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
    document.querySelector('.add-workspace').addEventListener('click',  function() {
        //display modal
        const modalWorkspace = new bootstrap.Modal(document.getElementById('add-workspace-modal')).show();
        //populate modal to allow user to select workspace to save paint into
        commonjs.initiateSaveWorkspaceModal(document.getElementById('modal-add-workspace'), modal_type);
    });

    //modals

    document.getElementById('edit-workspace-modal-save').addEventListener('click', async () => {
        saveEditedWorkspace();
    });
    document.querySelector('#modal-edit-workspace #edit-workspace-name').addEventListener('input', () => {
        enableSaveEditWorkspaceButton();
    });
    document.querySelector('#modal-edit-workspace #edit-workspace-notes').addEventListener('input', () => {
        enableSaveEditWorkspaceButton();
    });
    document.getElementById('edit-paint-modal-save').addEventListener('click', async () => {
        saveEditedPaint();
    });
    document.getElementById('edit-paint-modal-copy').addEventListener('click', async () => {
        copyPaint();
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
    document.getElementById('edit-colour-modal-copy').addEventListener('click', async () => {
        copyColour();
    });
    document.querySelector('#modal-edit-colour #edit-colour-name').addEventListener('input', () => {
        enableSaveEditColourButton();
    });
    document.querySelector('#modal-edit-colour #edit-colour-notes').addEventListener('input', () => {
        enableSaveEditColourButton();
    });
    document.getElementById('edit-workspace-modal-delete').addEventListener('click', async () => {
        removeWorkspace();
    });
 
    document.getElementById('confirm-delete-modal-delete').addEventListener('click', async () => {
        //the confirm delete modal is used for workspaces, colours and paints
        //pick up which one it is and call the right function
        const workspace = {id: document.getElementById('modal-delete').dataset.workspaceId};
        switch (document.getElementById('modal-delete').dataset.deleteType) {
            case 'paint':
                const paint = {id: document.getElementById('modal-delete').dataset.paintId }; //, name: document.getElementById('confirmDeleteModal').dataset.paintName}; 
                removeSavedPaintConfirmed(paint, workspace);                        
                break;  
            case 'colour':
                const colour = {id: document.getElementById('modal-delete').dataset.colourId}; //, name: document.getElementById('modal-delete').dataset.colourName}; 
                removeSavedColourConfirmed(colour, workspace);
                break;  
            case 'workspace':
                const workspace2 = {id: document.getElementById('modal-delete').dataset.workspaceId, name: document.getElementById('modal-delete').dataset.workspaceName};
                removeWorkspaceConfirmed(workspace2);
                break;            
        }                 
    }); 
}

//EDIT WORKSPACE  

//edit name and notes of a workspace by opening a modal 
async function editWorkspace(workspace_id) {
    
    //open the edit workspace modal     
    const modal = new bootstrap.Modal(document.getElementById('editWorkspaceModal'));
    modal.show();

    //hide error messages 
    const destElem=document.getElementById('modal-edit-workspace');
    destElem.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });
    
    // populate it with the name and notes
    //send a request to the server to get paint notes and workspace info to populate the modal
    const response=await fetch('/return-workspace-details', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                workspace_id: workspace_id,
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    if (!data[0]) {
        return false;
    }
    destElem.querySelector('#edit-workspace-current-name').innerHTML = data[0].name;
    const input_name=destElem.querySelector('#edit-workspace-name');
    input_name.value = data[0].name;
    input_name.dataset.orig = data[0].name;
    const input_notes=destElem.querySelector('#edit-workspace-notes');
    input_notes.value = data[0].notes;
    input_notes.dataset.orig = data[0].notes;
    input_notes.dataset.workspaceId= workspace_id;
    document.querySelector('#edit-workspace-name').textContent = data[0].name;
    document.querySelector('#edit-workspace-notes').textContent = data[0].notes;
    document.getElementById('edit-workspace-modal-save').disabled=true;
    return true;
}       

//save edit made to workspace in the edit workspace modal
async function saveEditedWorkspace() {        

    //check if name is filled in
    let modal= document.getElementById('modal-edit-workspace');
    //first hide error messages 
    modal.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });

    //get form data and show error if required
    let ws_name = document.getElementById('edit-workspace-name');
    let workspace_name = ws_name.value;
    if (workspace_name==""){
        modal.querySelector('.ws-name-required').removeAttribute('hidden');
        return;
    }
    
    let ws_notes= document.getElementById('edit-workspace-notes');
    let workspace_id=ws_notes.dataset.workspaceId;
    let workspace_notes= ws_notes.value;
    const response=await fetch('/edit-workspace', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                workspace_id: workspace_id,
                workspace_name: workspace_name,
                workspace_notes: workspace_notes,
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

    
    if (data.result==true) {
        //update the workspace details in the accordion
        let this_workspace = document.querySelector('#workspace-' + workspace_id);
        this_workspace.querySelector('.ws-name').innerHTML = workspace_name;
        const ws_notes_elem=this_workspace.querySelector('.ws-notes');
        if (workspace_notes=="") {
            ws_notes_elem.innerHTML = "";
        } else {
            ws_notes_elem.innerHTML = "Notes: " + workspace_notes;            
        }
    }   else {   
        if (data.result=='99'){
            //did not save, duplicate
            modal.querySelector('.ws-name-duplicate').removeAttribute('hidden');
            return;
        } else {      
            displayMessage("Error saving changes. Please try again.");   
        }
    }
    //close the modal
    document.getElementById('edit-workspace-modal-close').click();

}

//enable or disable save button in edit workspace modal
function enableSaveEditWorkspaceButton(){
    const input_notes=document.querySelector('#modal-edit-workspace #edit-workspace-notes');
    const input_name=document.querySelector('#modal-edit-workspace #edit-workspace-name');
    if (input_notes.value != input_notes.dataset.orig || input_name.value != input_name.dataset.orig  ) {
        document.getElementById('edit-workspace-modal-save').disabled = false;
    } else {
        document.getElementById('edit-workspace-modal-save').disabled = true;
    }
}


//EDIT SAVED COLOURS AND PAINTS

//edit notes about a saved paint by opening a modal
async function editSavedPaint(paint_id) {
    //can't edit its name or colour, that is inherent to the paint
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
        return false;
    }
    const data = await response.json();
    //console.log(data);
    if (!data[0]) {
        return false;
    }
    const input_notes=destElem.querySelector('#edit-paint-notes');
    input_notes.value = data[0].saved_paint_notes;
    input_notes.dataset.savedNotes = data[0].saved_paint_notes;
    input_notes.dataset.savedPaintId= paint_id;
    document.querySelector('#edit-paint-colour').style.backgroundColor = "#" + data[0].hex;
    document.querySelector('#edit-paint-name').textContent = data[0].brand_name + " " + data[0].paint_name;
    document.getElementById('edit-paint-modal-save').disabled = true;
    return true;
}       

//save edit made to paint notes in the edit paint modal
async function saveEditedPaint() {        
    let saved_paint_id=document.querySelector('#modal-edit-paint #edit-paint-notes').getAttribute('data-saved-paint-id');
    let saved_paint_notes= document.querySelector('#modal-edit-paint #edit-paint-notes').value;
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
    if (data.result==true) {
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

//edit name and notes of a saved colour by opening a modal
async function editSavedColour(colour_id) {
    ///can't edit its actual colour, that is inherent to the colour
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
        return false;
    }
    const data = await response.json();
    if (!data[0]) {
        return false;
    }
    const colour = data[0];
    const input_name=destElem.querySelector('#edit-colour-name');
    input_name.value = colour.saved_colour_name;
    input_name.dataset.savedName = colour.saved_colour_name;
    const input_notes=destElem.querySelector('#edit-colour-notes');
    input_notes.value = colour.saved_colour_notes;
    input_notes.dataset.savedNotes = colour.saved_colour_notes;
    input_notes.dataset.savedColourId= colour_id;
    document.querySelector('#edit-colour-colour').style.backgroundColor = "#" + colour.hex;
    document.querySelector('#edit-colour-name').textContent = colour.saved_colour_name;
    document.querySelector('#edit-colour-notes').textContent = colour.saved_colour_notes;
    document.getElementById('edit-colour-modal-save').disabled = true;
    document.getElementById('colour-name-required').setAttribute('hidden', 'True');
    
    return true;
}       

//save edit made to colour name and notes in the edit colour modal
async function saveEditedColour() {      
    
    //check if name is filled in
    //first hide error message
    let name_required=document.getElementById('colour-name-required');
    name_required.setAttribute('hidden', 'True');

    //get form data and show error if required
    let saved_colour_name = document.getElementById('edit-colour-name').value;
    if (saved_colour_name==""){
        name_required.removeAttribute('hidden');
        return;
    }        
    
    let saved_colour_id=document.querySelector('#modal-edit-colour #edit-colour-notes').dataset.savedColourId;
    let saved_colour_notes= document.querySelector('#modal-edit-colour #edit-colour-notes').value;
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
    if (data.result==true) {
        //update the colour row
        let this_colour = document.querySelector('#saved-colour-' + saved_colour_id);
        this_colour.querySelector('.saved-colour-name').innerHTML = saved_colour_name;
        let colour_notes_elem=this_colour.querySelector('.saved-colour-notes');
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

//enable or disable save button in edit colour modal
function enableSaveEditColourButton(){
    const input_notes=document.querySelector('#modal-edit-colour #edit-colour-notes');
    const input_name=document.querySelector('#modal-edit-colour #edit-colour-name');
    if (input_notes.value != input_notes.dataset.savedNotes || input_name.value != input_name.dataset.savedName) {
        document.getElementById('edit-colour-modal-save').disabled = false;
    } else {
        document.getElementById('edit-colour-modal-save').disabled = true;
    }
}

//REMOVE WORKSPACES, COLOURS AND PAINTS

//"are you sure?" confirmation step before deleting a workspace
function removeWorkspace() {  
    //show the confirm delete workspace modal and populate it with the workspace details
    //the edit workspace modal has been closed but it's still in the DOM
    const modal = document.getElementById('modal-edit-workspace'); 
    const workspace= {'id': modal.querySelector('#edit-workspace-notes').dataset.workspaceId, name: modal.querySelector('#edit-workspace-name').dataset.orig};
    const message_confirm = "your workspace <span class='fst-italic'>" + workspace.name + "</span>? This will also remove all saved paints and colours in the workspace.<br><p class='text-danger fw-bold'>Removing a workspace cannot be undone.</p>";
  //  const modal_confirm = document.getElementById('confirmDeleteWSModal');
    const modal_confirm = document.getElementById('confirmDeleteModal');
    const modal_confirm_details = modal_confirm.querySelector('#modal-delete');
    modal_confirm_details.dataset.workspaceId = workspace.id;
    modal_confirm_details.dataset.workspaceName = workspace.name;
    modal_confirm_details.dataset.deleteType = 'workspace';
    modal_confirm_details.querySelector('#delete-confirm-details').innerHTML=message_confirm;

  //  modal_confirm.querySelector('#delete-WS-confirm-details').innerHTML=message_confirm;
  //  modal_confirm.querySelector('#modal-delete-WS').dataset.workspaceId = workspace.id;
    const modalConfirm = new bootstrap.Modal(modal_confirm).show();
}

//remove a workspace
async function removeWorkspaceConfirmed(workspace) {        
    //console.log(workspace);
    //send the request to the server to remove the workspace
    //cascade delete will remove the saved paints and colours
    
   // let modal=document.getElementById('confirmDeleteWSModal');
    //let workspace_id=modal.querySelector('#modal-delete-WS').dataset.workspaceId;
    const response=await fetch('/remove-workspace', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                workspace_id: workspace.id,
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    
    if (data.result!=true) {
        let message = "An error occurred while removing the workspace. Please try again.";
        displayMessage(message);         
    
    } else {
        //fade out the accordion item
        removeRow(document.getElementById('workspace-' + workspace.id));                   
    }
    //close the modal
    document.querySelector('#confirmDeleteModal #confirm-delete-modal-close').click();
   // modal.querySelector('#confirm-delete-WS-modal-close').click();
}

//"are you sure?" confirmation step before deleting a paint
function removeSavedPaint(paint, workspace) {  

    const message_confirm = "the paint <span class='fst-italic'>" + paint.name + "</span> from your workspace <span class='fst-italic'>" + workspace.name + "</span>?";
    const modal_confirm = document.getElementById('confirmDeleteModal');
    const modal_confirm_details = modal_confirm.querySelector('#modal-delete');
    modal_confirm_details.dataset.paintId = paint.id;
    modal_confirm_details.dataset.workspaceId = workspace.id;
    modal_confirm_details.dataset.deleteType = 'paint';
    modal_confirm_details.querySelector('#delete-confirm-details').innerHTML=message_confirm;
    const modalConfirm = new bootstrap.Modal(modal_confirm).show();
}

//delete a saved paint 
async function removeSavedPaintConfirmed(paint, workspace) {

    //console.log(paint, workspace);
    //send the request to the server to remove the paint from the workspace
    const response=await fetch('/remove-saved-paint', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_paint_id: paint.id
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    
    if (data.result!=true) {
        let message = "An error occurred while removing the paint. Please try again.";
        displayMessage(message);  
        //message = "The paint '" + paint.name + "' has been removed from your workspace '" + workspace['name'] + "'.";
    } else {
        //fade out the paint row
        removeRow(document.getElementById('saved-paint-' + paint.id));      
        //TODO - show "no paints" if that was the last one             
    }

    //close the modal
    document.querySelector('#confirmDeleteModal #confirm-delete-modal-close').click();
}

function copyPaint() {
}

//"are you sure?" confirmation step before deleting a colour
function removeSavedColour(colour, workspace) {  

    const message_confirm = "the colour saved as <span class='fst-italic'>" + colour.name + "</span> from your workspace <span class='fst-italic'>" + workspace.name + "</span>?";
    const modal_confirm = document.getElementById('confirmDeleteModal');
    const modal_confirm_details = modal_confirm.querySelector('#modal-delete');
    modal_confirm_details.dataset.colourId = colour.id;
    modal_confirm_details.dataset.workspaceId = workspace.id;
    modal_confirm_details.dataset.deleteType = 'colour';
    modal_confirm_details.querySelector('#delete-confirm-details').innerHTML=message_confirm;
    const modalConfirm = new bootstrap.Modal(modal_confirm).show();
}
//remove a saved colour from a workspace
async function removeSavedColourConfirmed(colour, workspace) {        
    //console.log(colour, workspace);
    //send the request to the server to remove the paint from the workspace
    const response=await fetch('/remove-saved-colour', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                saved_colour_id: colour.id,
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    
    if (data.result!=true) {
        let message = "An error occurred while removing the colour. Please try again.";
        displayMessage(message);  
        //message = "The colour saved as '" + colour['name'] + "' has been removed from your workspace '" + workspace['name'] + "'.";
    } else {
        //fade out the colour row
        removeRow(document.getElementById('saved-colour-' + colour.id));      
        //TODO - show "no colours" if that was the last one             
    }
    //close the modal
    document.querySelector('#confirmDeleteModal #confirm-delete-modal-close').click();
}

function copyColour() {
}

//fades out and removes an element
async function removeRow(e){
    e.style.transition = '1.5s';
    e.style.opacity = '0';            
    e.addEventListener("transitionend", () => {
        e.style.display='none';
    });   
}
