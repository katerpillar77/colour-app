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
    document.querySelectorAll('.add-saved-colour').forEach((button) => {
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
        document.querySelectorAll('.add-saved-colour').forEach((button) => {
            button.removeAttribute('hidden');
            //add event listeners as well
            button.addEventListener('click', function() {
                //display modal
                const modalAddColour = new bootstrap.Modal(document.getElementById('add-saved-colour-modal')).show();
                //populate modal to allow user to select workspace to save colour into
                let colour=this.getAttribute('colour');                
                if (colour=="") {
                    return;
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
    document.getElementById('saturation').addEventListener('change', function() {
        saturation_slider.value([0, this.value]);
       // adjustColour();
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
    document.getElementById('luminance').addEventListener('change', function() {
        luminance_slider.value([0, this.value]);
        //adjustColour();
    });
    document.getElementById('hue').addEventListener('change', function() {
        adjustColour();
    });

    
    //define weights for ranking
    WEIGHTS = {};
    WEIGHTS['hue'] = 3;
    WEIGHTS['saturation'] = 1
    WEIGHTS['luminance'] = 2;

    //sliders/inputs for settings modal
    let hue_weight = document.getElementById('hue-weight');
    hue_weight.value=WEIGHTS['hue'];
    hue_weight.setAttribute('default', WEIGHTS['hue']);
    hue_weight.addEventListener('change', function() {
        hue_weight_slider.value([0, this.value]);
        WEIGHTS['hue']=this.value;

    });
    hue_weight_slider = rangeSlider(document.getElementById('hue-weight-slider'), {
        min: 0,
        max: hue_weight.getAttribute('max'),
        step: hue_weight.getAttribute('step'),
        thumbsDisabled: [true, false],
        value: [0, hue_weight.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            hue_weight.value = value[1];
            WEIGHTS['hue']=value[1];
            adjustColour();
        }
    });
    let sat_weight = document.getElementById('saturation-weight');
    sat_weight.value=WEIGHTS['saturation'];
    sat_weight.setAttribute('default', WEIGHTS['saturation']);
    sat_weight.addEventListener('change', function() {
        saturation_weight_slider.value([0, this.value]);

    });
    saturation_weight_slider = rangeSlider(document.getElementById('saturation-weight-slider'), {
        min: 0,
        max: sat_weight.getAttribute('max'),
        step: sat_weight.getAttribute('step'),
        thumbsDisabled: [true, false],
        value: [0, sat_weight.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            sat_weight.value = value[1];
            WEIGHTS['saturation']=value[1];
            adjustColour();
        }
    });
    let lum_weight = document.getElementById('luminance-weight');
    lum_weight.value=WEIGHTS['luminance'];
    lum_weight.setAttribute('default', WEIGHTS['luminance']);
    lum_weight.addEventListener('change', function() {
        luminance_weight_slider.value([0, this.value]);
    });
    luminance_weight_slider = rangeSlider(document.getElementById('luminance-weight-slider'), {
        min: 0,
        max: lum_weight.getAttribute('max'),
        step: lum_weight.getAttribute('step'),
        thumbsDisabled: [true, false],
        value: [0, lum_weight.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            lum_weight.value = value[1];
            WEIGHTS['luminance']=value[1];
            adjustColour();
        }
    });
    document.getElementById('reset-weights').addEventListener('click', function() {
        console.log('resetting weights');
        hue_weight.value=hue_weight.getAttribute('default');
        hue_weight_slider.value([0, hue_weight.value]);
        sat_weight.value=sat_weight.getAttribute('default');
        saturation_weight_slider.value([0, sat_weight.value]);
        lum_weight.value=lum_weight.getAttribute('default');
        luminance_weight_slider.value([0, lum_weight.value]);
        adjustColour();
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

    //button to open compare colours modal
    document.querySelectorAll('.compare').forEach((button) => {
        button.addEventListener('click', function() {
            //display modal
            const modalCompare = new bootstrap.Modal(document.getElementById('compare-modal')).show();
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
    if (!!select_saved_colour) {
        select_saved_colour.addEventListener('click', function() {
            //display modal
            const modalSelect = new bootstrap.Modal(document.getElementById('select-saved-colour-modal')).show();
            //populate modal to allow user to select from saved colours
            displayColoursInWorkspaces(document.getElementById('modal-select-colour'), 'select');
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
                return;
            }
            //display modal
            const modalSavePaint = new bootstrap.Modal(document.getElementById('add-saved-paint-modal')).show();
            //populate modal to allow user to select workspace to save paint into
            displayPaintsInWorkspaces(document.getElementById('modal-add-paint'), paint);
        });
    });

    const modal_select_colour = document.getElementById('select-saved-colour-modal');
    modal_select_colour.addEventListener('hidden.bs.modal', event => {
        destroyModalAccordion(modal_select_colour);
    });
    const modal_add_colour = document.getElementById('add-saved-colour-modal');
    modal_add_colour.addEventListener('hidden.bs.modal', event => {
        destroyModalAccordion(modal_add_colour);
    });
    const modal_add_paint = document.getElementById('add-saved-paint-modal');
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

 // THIS NEEDS UPDATING  
 // There are too many paints to load them all every time
 // Need to load only paints with a similar hue when the colour is chosen, and then filter them here
 // Reload paints when the hue is changed

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
        //distances['hue'] = hue_distance_input.value;
       // distances['saturation'] = saturation_distance_input.value;
        //distances['luminance'] = luminance_distance_input.value;
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
        //distance = distances['hue'];
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
            rankings = get_ranking(references, attributes);
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
function get_ranking(references, attributes) {
    //gets an array of rankings based on distances between reference colour and attributes of an element

    const HUE_THRESHOLD = 30;

    var distances = {};

    //get min distance between reference hue and element hues
    const hue_distances = [];
    for (let index = 0; index < references['hue'].length; ++index) {
        hue_distances[index] = getHueDifference(references['hue'][index], attributes['hue']);
    }
    distances['hue'] = Math.min(...hue_distances);

    let rankings = {};
    rankings['total'] = 0;
    //only display and calculate ranking if within the maximum hue distance (otherwise irrelevant)
    if (distances['hue'] > HUE_THRESHOLD) {
        return rankings;
    }
    //get distance between reference saturation and element saturation, then for luminance
    distances['saturation'] = getSatDifference(references['saturation'], attributes['saturation']);
    distances['luminance'] = getSatDifference(references['luminance'], attributes['luminance']);
    //create rankings
    
    const NAMES = ['hue', 'saturation', 'luminance'];
    NAMES.forEach(name => {
        //not doing max distances any more
   //     if (distances[name] - max_distances[name] < 0) {
   //         rankings[name] = 0;
   //     } else {
   //         rankings[name] = distances[name] * WEIGHTS[name];
   //     }
        rankings[name] = distances[name] * WEIGHTS[name];
        rankings['total'] += rankings[name];
    });
    //normalise total
    max_total = WEIGHTS['hue'] * 50 + WEIGHTS['saturation'] * 20 + WEIGHTS['luminance'] * 20;
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
