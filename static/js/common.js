import {myModal } from "/static/js/main.min.js";

//common JS - exported
    export function docSetup (){
        //remove focus from buttons that open modals to avoid aria warning
        document.querySelectorAll('.modal').forEach((modal) => {
            modal.addEventListener('hide.bs.modal', () => {
                document.activeElement.blur();
            });
        });

        //add event listener to the save button for add workspace modal
        let modal_add_workspace= document.getElementById('add-workspace-modal');
        modal_add_workspace.querySelector('#add-workspace-modal-save').addEventListener ('click', function() {
            saveWorkspace(modal_add_workspace);
        });

        //initiate tooltips
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(
            tooltipTriggerEl));
    }

 
//user functions

    //initiates modal for adding workspace
    export async function initiateSaveWorkspaceModal(destElem, modal_type) {
    
        //hide error messages in modal
        destElem.querySelectorAll('.error').forEach(function(element) {
            element.setAttribute('hidden', 'true');
        });             
    }
    
 //saves a new workspace using notes entered in a modal
    export async function saveWorkspace(modal) {   
        
        //check if name is filled in
        //first hide error messages 
        modal.querySelectorAll('.error').forEach(function(element) {
            element.setAttribute('hidden', 'true');
        });

        //get form data and show error if required
        let ws_name = document.getElementById('add-workspace-name');
        let workspace_name = ws_name.value;
        if (workspace_name==""){
            modal.querySelector('.ws-name-required').removeAttribute('hidden');
            return;
        }

        let workspace_notes = document.getElementById('add-workspace-notes').value;
        const response=await fetch('/add-workspace', {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=utf-8'},
                body: JSON.stringify({
                    workspace_name: workspace_name,
                    workspace_notes: workspace_notes,
                })
        });
        if (!response.ok) {
            console.log('Response status: ' + response.status);
            return false;
        }

        const data = await response.json();
        if (data.result=='99'){
            //workspace with this name is already saved for this user
            let display_error=modal.querySelector('.error');
            display_error.removeAttribute('hidden');
            display_error.innerHTML="This workspace name has already been used.";
            return;
        }
        if (data.result==false){
            console.log('No data returned - server-side error with adding workspace.');
            return;
        }

        //empty form
        document.getElementById("workspace-input").reset();
        
        //trigger close of modal
        document.getElementById('add-workspace-modal-close').click() ;
        
        //behaviour to show workspace varies depending on page
        //get page
        let docTitle = document.querySelector("meta[name='page-identifier']")
                      .getAttribute("content");
        if (docTitle=='workspaces') {
            //for workspaces page, just reload page
            window.location.reload();
        } else if (docTitle == 'main'){
            myModal.show();
        } else {
            //shouldn't be anything else; do nothing
        }     
    }
//HELPERS

    //return json object from a route
    export async function loadData(route) {
        
        //return false if failure
        const response = await fetch(route);
        if (!response.ok) {
            console.log('Route ' + route + '; Response status: ' + response.status);
            return false;
        }
        const data = await response.json();
        //control for empty data - it gets processed as False
        if (data.length==0){
            data.push(0);
        }
        //console.log(data);
        return data;
    }

    //displays or removes a spinner inside a ".spinner" element
    export function showSpinner(destElem, show) {
        
        let spinnerHTML = "";
        if (show == true) {
            spinnerHTML =
                "<div class='spinner-border text-primary' role='status'><span class='visually-hidden'>Loading...</span></div>";
        }
        destElem.querySelector(".spinner").innerHTML = spinnerHTML;
    }
    //removes spinner and inserts content into .content class
    export function insert_text(destElem, destHTML) {
        
        showSpinner(destElem, false);
        destElem.querySelector('.content').innerText = destHTML;
    }

    //display a modal with a message
    export function displayMessage(message=""){
        if (message!="") {        
            document.getElementById('confirmation-message').innerHTML=message;
            const modalMessage = new bootstrap.Modal(document.getElementById('confirmModal'));
            modalMessage.show();
        }
    }

    //remove inserted accordion content from a modal
    export function destroyModalAccordion(destElem) {
        let elements=destElem.querySelectorAll('.accordion-item');
        elements.forEach(function(element) {
            if (!element.classList.contains("template-accordion")){
                element.remove();
            }
        });
    }

    //fire an event when needed
    //not referred to anywhere?
    function createEvent(id, eventType) {
        //fire an event for input boxes that are programmatically changed
        document.querySelector(id).dispatchEvent(new Event('eventType'));
    }

