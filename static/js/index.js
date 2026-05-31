// initialise everything
document.addEventListener('DOMContentLoaded', function() {
    initiated = false;
    let selected_colour = document.getElementById('selected-colour');
    initial_colour = window.getComputedStyle(selected_colour).backgroundColor;
    initiatePicker(initial_colour);
    initiateSliders();
    initiateButtons();
    filterList();
});


//Initiate the color picker
function initiatePicker(initial_colour) {

    //Initiate picker
    picker = new ColorPicker('#picker', {
        submitMode: 'confirm',
        showClearButton: true,
        enableAlpha: false,
        toggleStyle: 'input',
        color: initial_colour,
        dialogPlacement: 'bottom'
    });
    //save colour in global variable
    current_colour = picker.color;
    //Action when colour is chosen
    picker.on('pick', colour => {
        //save colour in global variable
        current_colour = colour;
        changeColour();
    });
}

function changeColour() {
    //called whenever the reference colour is set
    //apply selected colour to both boxes and save-colour buttons
    document.querySelectorAll('.colour-ref').forEach((elem) => {
        applyColor(elem, current_colour)
    });
    document.querySelectorAll('.add-saved').forEach((button) => {
        button.setAttribute('colour', current_colour);
    });
    //show everything if hidden (only on first run)
    if (initiated == false) {
        const nodeList = document.querySelectorAll(".hide-initial");
        for (let i = 0; i < nodeList.length; i++) {
            nodeList[i].style.display = "block";
        }
        let elementExists = document.getElementById("login-for-fav");
        if (elementExists) {
            document.getElementById('login-for-fav').setAttribute('hidden', 'true');
        }
        document.querySelectorAll('.add-saved').forEach((button) => {
            button.removeAttribute('hidden');
            //add event listeners as well
            button.addEventListener('click', function() {
                //populate modal to allow user to select workspace to save colour into
                let colour=this.getAttribute('colour');                
                if (colour=="") {
                    //trigger close of modal
                    document.getElementById('add-colour-modal-close').click() 
                }
                let modalElement = document.getElementById('modal-add-colour');
                displayColoursInWorkspaces(modalElement, 'add', colour);
            });
        });

        initiated = true;
    }
    //change the adjustment sliders
    setAdjustments(current_colour);

    //trigger change event so filter runs
    createEvent('select');
}

function initiateSliders() {

    saturation_slider = rangeSlider(document.getElementById('saturation-slider'), {
        min: 0,
        max: 100,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            document.getElementById('saturation').value = value[1];
            adjustColour();
        }
    });
    luminance_slider = rangeSlider(document.getElementById('luminance-slider'), {
        min: 0,
        max: 100,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            document.getElementById('luminance').value = value[1];
            adjustColour();
        }
    });
    let hue_dist = document.getElementById('hue-distance');
    hue_distance_slider = rangeSlider(document.getElementById('hue-distance-slider'), {
        min: 0,
        max: 180,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, hue_dist.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            hue_dist.value = value[1];
            adjustColour();
        }
    });
    let sat_dist = document.getElementById('saturation-distance');
    saturation_distance_slider = rangeSlider(document.getElementById(
    'saturation-distance-slider'), {
        min: 0,
        max: 100,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, sat_dist.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            sat_dist.value = value[1];
            adjustColour();
        }
    });
    let lum_dist = document.getElementById('luminance-distance');
    luminance_distance_slider = rangeSlider(document.getElementById('luminance-distance-slider'), {
        min: 0,
        max: 100,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, lum_dist.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            lum_dist.value = value[1];
            adjustColour();
        }
    });
}

function setAdjustments(colour) {
    //set HSL inputs when reference colour changes
    hsl = tinycolor(colour.string('rgb')).toHsl();
    document.getElementById('hue').value = Math.round(hsl['h']);
    s = Math.round(100 * hsl['s']);
    saturation_slider.value([0, s]);
    document.getElementById('saturation').value = s;
    l = Math.round(100 * hsl['l']);
    luminance_slider.value([0, l]);
    document.getElementById('luminance').value = l;
}

function adjustColour() {
    //change adjusted colour and filters when sliders are moved
    let h = document.getElementById('hue').value;
    let s = saturation_slider.value()[1];
    let l = luminance_slider.value()[1];
    let new_colour = tinycolor('hsl(' + h + "," + s + "%," + l + "%)").toHexString();
    applyColor(document.getElementById('adjusted-colour'), new_colour);
    document.getElementById('save-adjusted-colour').setAttribute('colour', new_colour);
    //add text to select for filter
    document.getElementById('analogous-hue').innerHTML = " - hue " + h;
    document.getElementById('complementary-hue').innerHTML = " - hue " + getComplementaryHue(h);
    let triad = getTriadicHues(h);
    document.getElementById('triadic-hues').innerHTML = " - hues " + triad[0] + ", " + triad[1];
    //fire event to trigger filtering
    createEvent('select');
}

function initiateButtons() {

    //add additional event to button that opens modal
    document.querySelectorAll('.compare').forEach((button) => {
        button.addEventListener('click', function() {
            document.getElementById('chosen-colour').style.backgroundColor = this
                .style.backgroundColor;
            document.getElementById('compare-reference-colour').style
                .backgroundColor = document.getElementById('selected-colour').style
                .backgroundColor;
            document.getElementById('compare-adjusted-colour').style
                .backgroundColor = document.getElementById('adjusted-colour').style
                .backgroundColor;
        });
    });
    //add event listeners to radio buttons in modal
    document.getElementById('compare-adj').addEventListener('click', function() {
        document.getElementById('compare-reference-colour').setAttribute("hidden", true);
        document.getElementById('compare-adjusted-colour').removeAttribute("hidden");
    });
    document.getElementById('compare-ref').addEventListener('click', function() {
        document.getElementById('compare-adjusted-colour').setAttribute("hidden", true);
        document.getElementById('compare-reference-colour').removeAttribute("hidden");
    });

    //create listeners on buttons
    document.getElementById('reset').addEventListener('click', function() {
        applyColor(document.getElementById('adjusted-colour'), current_colour)
        setAdjustments(current_colour);
        createEvent('select');
    });

    const select_saved_colour = document.getElementById('select-saved-colour');
    if (select_saved_colour) {
        select_saved_colour.addEventListener('click', function() {
            //populate modal to allow user to select from saved colours
            let modalElement = document.getElementById('modal-select-colour');
            displayColoursInWorkspaces(modalElement, 'select');
        });
    }

    document.querySelectorAll('.save-paint').forEach((button) => {
        button.addEventListener('click', function() {
            let paint = {
                'id': this.getAttribute('paint-id'),
                'name': this.getAttribute('paint-name'),
                'colour': this.getAttribute('paint-colour')
            };
            if (paint['id']=="") {
                //trigger close of modal - doesn't work
                document.getElementById('add-paint-modal-close').click() 
            }
            //populate modal to allow user to select workspace to save paint into
            let modalElement = document.getElementById('modal-add-paint');
            displayPaintsInWorkspaces(modalElement, paint);
        });
    });

    //undo changes to modals when they close
    const modal_select_colour = document.getElementById('selectSavedColModal');
    modal_select_colour.addEventListener('hidden.bs.modal', event => {
        destroyModalAccordion(modal_select_colour);
    });
    const modal_add_colour = document.getElementById('addSavedColModal');
    modal_add_colour.addEventListener('hidden.bs.modal', event => {
        destroyModalAccordion(modal_add_colour);
    });
    const modal_add_paint = document.getElementById('addSavedPaintModal');
    modal_add_paint.addEventListener('hidden.bs.modal', event => {
        destroyModalAccordion(modal_add_paint);
    });

}

//Helper function: fires event when needed
function createEvent(id) {
    //fire an event for input boxes that are programmatically changed
    const changeEvent = new Event('change');
    document.querySelector(id).dispatchEvent(changeEvent);
}

function filterList() {
    // Get list of all list items
    const items = document.querySelectorAll(".item-card");
    // Get the filter inputs and add listeners for the change event
    const select = document.querySelector("select#filter");
    select.addEventListener("change", filter);
    const hue_distance_input = document.getElementById('hue-distance');
    hue_distance_input.addEventListener("input", filter);
    const saturation_distance_input = document.getElementById('saturation-distance');
    saturation_distance_input.addEventListener("input", filter);
    const luminance_distance_input = document.getElementById('luminance-distance');
    luminance_distance_input.addEventListener("input", filter);
    const hue_input = document.getElementById('hue');
    const saturation_input = document.getElementById('saturation');
    const luminance_input = document.getElementById('luminance');
    const no_results = document.getElementById('no-results');
    let results = false;

    function filter() {

        let distances = {};
        distances['hue'] = hue_distance_input.value;
        distances['saturation'] = saturation_distance_input.value;
        distances['luminance'] = luminance_distance_input.value;
        let references = {};
        let hues = [];
        hues[0] = hue_input.value;
        if (select.value == "2") {
            hues[0] = getComplementaryHue(hues[0]);
        } else if (select.value == "3") {
            hues = getTriadicHues(hues[0]);
        }
        //set title by selected option
        document.querySelector('#paints-list-title').innerHTML = select.selectedOptions[0]
            .getAttribute("text");
        references['hue'] = hues;
        references['saturation'] = saturation_input.value
        references['luminance'] = luminance_input.value
        hue = hues[0];
        distance = distances['hue'];
        results = false;
        // Look at each item in the array
        items.forEach(element => {
            // Remove the "hidden" attribute if the item has a ranking within the range or if the selection is "All"
            // Otherwise, add the hidden attribute to the element
            let attributes = {};
            attributes["hue"] = element.getAttribute("custom-h");
            attributes["saturation"] = element.getAttribute("custom-s");
            attributes["luminance"] = element.getAttribute("custom-l");
            //work out the ranking value for this element
            rankings = get_ranking(references, distances, attributes);
            element.setAttribute("ranking", rankings['total']);
            //filter by ranking threshold
            const RANKING_THRESHOLD = 60;
            if (rankings['total'] >= RANKING_THRESHOLD | select.value == "0") {
                element.removeAttribute("hidden");
                element.querySelector('#relevance').innerHTML = rankings['total'] + "%";
                //set border width by relevance: 100% gives 0.2 rem, 60% gives 0.01 rem
                let border_width = 0.00475 * rankings['total'] - 0.275
                element.style.borderWidth = border_width + "rem";
                results = true;
            } else {
                element.setAttribute("hidden", true);
            }

        });
        //display no results if none
        if (results == true) {
            no_results.setAttribute("hidden", true);
            //then sort by ranking
            elements = Array.from(items);
            elements.sort(function(a, b) {
                return b.getAttribute("ranking") - a.getAttribute("ranking");
            });
            // Append the sorted items back to the wrapper
            section = document.getElementById('paints-list');
            elements.forEach(function(element) {
                section.appendChild(element);
            });
        } else {
            no_results.removeAttribute("hidden");
        }

    };
    filter();
}

//get ranking for element
function get_ranking(references, max_distances, attributes) {
    //gets an array of rankings based on distance between reference colour and attributes of an element
    var distances = {};
    const WEIGHTS = {}
    WEIGHTS['hue'] = 3
    WEIGHTS['saturation'] = 0.5
    WEIGHTS['luminance'] = 0.5
    //get min distance between reference hue and element hues
    const hue_distances = [];
    for (let index = 0; index < references['hue'].length; ++index) {
        hue_distances[index] = getHueDifference(references['hue'][index], attributes['hue']);
    }
    distances['hue'] = Math.min(...hue_distances);
    //get distance between reference saturation and element saturation, then for luminance
    distances['saturation'] = getSatDifference(references['saturation'], attributes['saturation']);
    distances['luminance'] = getSatDifference(references['luminance'], attributes['luminance']);
    //create rankings
    let rankings = {};
    rankings['total'] = 0;
    const NAMES = ['hue', 'saturation', 'luminance'];
    NAMES.forEach(name => {
        if (distances[name] - max_distances[name] < 0) {
            rankings[name] = 0;
        } else {
            rankings[name] = distances[name] * WEIGHTS[name];
        }
        rankings['total'] += rankings[name];
    });
    //normalise total
    max_total = WEIGHTS['hue'] * 180 + WEIGHTS['saturation'] * 100 + WEIGHTS['luminance'] * 100;
    rankings['total'] = Math.round(100 * (max_total - rankings['total']) / max_total);
    return rankings;
}
//Helper functions for saturation/luminance
function getSatDifference(sat1, sat2) {
    const diff = Math.abs(sat1 - sat2);
    if (diff < 0) { diff = 0 }
    if (diff > 100) { diff = 100 }
    return diff;
}

//Helper functions for hues
//get distance between two hues
function getHueDifference(hue1, hue2) {
    const diff = Math.abs(hue1 - hue2);
    return Math.min(diff, 360 - diff);
}
/**
 * Checks if two hues are similar within a given threshold
 * @param {number} hue1 - Hue angle 1
 * @param {number} hue2 - Hue angle 2
 * @param {number} threshold - Maximum allowed difference (e.g., 15)
 * @returns {boolean} - True if similar, false otherwise
 */
function areHuesSimilar(hue1, hue2, threshold = 0) {
    return getHueDifference(hue1, hue2) <= threshold;
}

function getComplementaryHue(hue) {
    return (+hue + 180) % 360;
}

function getTriadicHues(hue) {
    let h1 = (+hue + 120) % 360;
    let h2 = (+hue + 240) % 360;
    return [h1, h2];
}

// Helper function: change background colour of an element
const applyColor = (el, colour) => {
    if (colour) {
        el.style.backgroundColor = colour
    } else {
        el.style.backgroundColor = ''
    }
}

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
    const [paints, workspaces] = await Promise.all([loadSavedPaints(),
        loadWorkspaces()]);

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
    //saves a chosen paint to a chosen workspace

    //hide error messages in modal
    modal.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });

    let paint_notes = document.getElementById('colour-notes').value;
    const response=await fetch('/addSavedPaint', {
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

function displayMessage(message=""){
    //display a modal with a message
    if (message!="") {        
        document.getElementById('confirmation-message').innerHTML=message;
        const modalMessage = new bootstrap.Modal(document.getElementById('confirmModal'));
        modalMessage.show();
    }
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
    
    const [colours, workspaces] = await Promise.all([loadSavedColours(),
        loadWorkspaces(with_colours)]);

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
        accordion_button.setAttribute('data-bs-target', '#collapse'+w.id);
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
    const response=await fetch('/addSavedColour', {
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
    
    //empty form
    document.getElementById("colour-input").reset();
    
    //trigger close of modal
    document.getElementById('add-colour-modal-close').click();
    
    //display confirmation message
    displayMessage("The colour " + colour_hex + " has been saved with the name '" + colour_name + "' in your workspace '" + workspace['name'] + "'.");      
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

function destroyModalAccordion(destElem) {
    //remove inserted accordion content from a modal
    let elements=destElem.querySelectorAll('.accordion-item');
    elements.forEach(function(element) {
        if (element.id!="template"){
            element.remove();
        }
    });
}


async function loadWorkspaces(with_colours=false) {
    //return json object of workspaces
    //return false if failure
   
    let response="";
    if (with_colours == true ){
        //only get workspaces that have colours saved to it
        response = await fetch('/returnWorkspacesWithColours');
        if (!response.ok) {
            console.log('Response status: ' + response.status);
            return false
        }
    } else {
        //get all workspaces
        response = await fetch('/returnWorkspaces');
        if (!response.ok) {
            console.log('Response status: ' + response.status);
            return false
        }
    }
       
    const data = await response.json();
    //control for empty data - it gets processed as False
    if (data.length==0){
        data.push(0);
    }
    return data;
}

async function loadSavedColours() {
    //return json object of saved colours
    //return false if failure
    const response = await fetch('/returnSavedColours');
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //control for empty data - it gets processed as False
    if (data.length==0){
        data.push(0);
    }
    return data;
}

async function loadSavedPaints() {
    //return json object of saved paints
    //return false if failure
    const response = await fetch('/returnSavedPaints');
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false
    }
    const data = await response.json();
    //control for empty data - it gets processed as False
    if (data.length==0){
        data.push(0);
    }
    return data;
}
