
// initialise everything
document.addEventListener('DOMContentLoaded', function() {
    let selected_colour = document.getElementById('selected-colour');
    let current_colour = window.getComputedStyle(selected_colour).backgroundColor;
    initiatePicker(current_colour);
    initiateSliders();
    initiatePaintButtons();
    filterList();
});


//Initiate the color picker
function initiatePicker(current_colour) {

    //Initiate picker
    const picker = new ColorPicker('#picker', {
        submitMode: 'confirm',
        showClearButton: true,
        enableAlpha: false,
        color: current_colour
    });

    //Action when colour is chosen
    picker.on('pick', colour => {
        //apply selected colour to both boxes
        applyColor(document.getElementById('selected-colour'), colour)
        applyColor(document.getElementById('adjusted-colour'), colour)
        //show everything if hidden (only on first run)
        const nodeList = document.querySelectorAll(".hide-initial");
        for (let i = 0; i < nodeList.length; i++) {
            nodeList[i].style.display = "block";
        }
        //change the adjustment sliders
        setAdjustments(colour);
        //apply colour to reset event
        document.getElementById('reset').addEventListener('click', function() {
            applyColor(document.getElementById('adjusted-colour'), colour)
            setAdjustments(colour);
            createEvent('select');
        });
        //trigger change event so filter runs
        createEvent('select');
    });
}

function initiateSliders() {

    saturation_slider = rangeSlider(document.getElementById('saturation-slider'), {
        min:0,
        max:100,
        step:1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            document.getElementById('saturation').value=value[1];

            adjustColour();
        }
    });
    luminance_slider=rangeSlider(document.getElementById('luminance-slider'), {
        min:0,
        max:100,
        step:1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            document.getElementById('luminance').value=value[1];
            adjustColour();
        }
    });
    let hue_dist = document.getElementById('hue-distance');
    hue_distance_slider=rangeSlider(document.getElementById('hue-distance-slider'), {
        min:0,
        max:180,
        step:1,
        thumbsDisabled: [true, false],
        value: [0, hue_dist.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            hue_dist.value=value[1];
            adjustColour();
        }
    });
    let sat_dist = document.getElementById('saturation-distance');
    saturation_distance_slider=rangeSlider(document.getElementById('saturation-distance-slider'), {
        min:0,
        max:100,
        step:1,
        thumbsDisabled: [true, false],
        value: [0, sat_dist.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            sat_dist.value=value[1];
            adjustColour();
        }
    });
    let lum_dist = document.getElementById('luminance-distance');
    luminance_distance_slider=rangeSlider(document.getElementById('luminance-distance-slider'), {
        min:0,
        max:100,
        step:1,
        thumbsDisabled: [true, false],
        value: [0,lum_dist.value],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            lum_dist.value=value[1];
            adjustColour();
        }
    });
}

function setAdjustments (colour) {
    //set HSL inputs when reference colour changes
    hsl = tinycolor(colour.string('rgb')).toHsl();
    document.getElementById('hue').value=Math.round(hsl['h']);
    s = Math.round(100 * hsl['s']);
    saturation_slider.value([0, s]);
    document.getElementById('saturation').value=s;
    l = Math.round(100 * hsl['l']);
    luminance_slider.value([0, l]);
    document.getElementById('luminance').value=l;
}

function adjustColour () {
    //change adjusted colour and filters when sliders are moved
    let h = document.getElementById('hue').value;
    let s = saturation_slider.value()[1];
    let l = luminance_slider.value()[1];
    let new_colour = tinycolor('hsl(' + h + "," + s + "%," + l + "%)").toHexString();
    applyColor(document.getElementById('adjusted-colour'), new_colour);
    //add text to select for filter
    document.getElementById('analogous-hue').innerHTML=" - hue " + h;
    document.getElementById('complementary-hue').innerHTML=" - hue " + getComplementaryHue(h);
    let triad=getTriadicHues(h);
    document.getElementById('triadic-hues').innerHTML=" - hues " + triad[0] + ", " + triad[1];
    //fire event to trigger filtering
    createEvent('select');
}

function initiatePaintButtons() {
    //initiates the modal for the paint colours
    //initiate tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    //add additional event to button that opens modal
    document.querySelectorAll('.compare').forEach((button) => {
        button.addEventListener('click', function() {
            document.getElementById('chosen-colour').style.backgroundColor = this.style.backgroundColor;
            document.getElementById('compare-reference-colour').style.backgroundColor = document.getElementById('selected-colour').style.backgroundColor;
            document.getElementById('compare-adjusted-colour').style.backgroundColor = document.getElementById('adjusted-colour').style.backgroundColor;
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
}

//Helper function: fires event when needed
function createEvent(id){
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
    const no_results=document.getElementById('no-results');
    let results=false;

    function filter() {

        let distances={};
        distances['hue']=hue_distance_input.value;
        distances['saturation']=saturation_distance_input.value;
        distances['luminance'] = luminance_distance_input.value;
        let references={};
        let hues=[];
        hues[0] = hue_input.value;
        if (select.value == "2" ){
            hues[0]=getComplementaryHue(hues[0]);
        } else if (select.value == "3") {
            hues=getTriadicHues(hues[0]);
        }
        //set title by selected option
        document.querySelector('#paints-list-title').innerHTML=select.selectedOptions[0].getAttribute("text");
        references['hue']=hues;
        references['saturation']=saturation_input.value
        references['luminance']=luminance_input.value
        hue=hues[0];
        distance=distances['hue'];
        results=false;
        // Look at each item in the array
        console.log(items);
        items.forEach(element => {
            // Remove the "hidden" attribute if the item has a ranking within the range or if the selection is "All"
            // Otherwise, add the hidden attribute to the element
            let attributes={};
            attributes["hue"]=element.getAttribute("custom-h");
            attributes["saturation"]=element.getAttribute("custom-s");
            attributes["luminance"]=element.getAttribute("custom-l");
            //work out the ranking value for this element
            rankings=get_ranking(references, distances, attributes);
            element.setAttribute("ranking", rankings['total']);
            //filter by ranking threshold
            const RANKING_THRESHOLD = 60;
            if (rankings['total']>=RANKING_THRESHOLD | select.value == "0") {
                    element.removeAttribute("hidden");
                    element.querySelector('#relevance').innerHTML=rankings['total'] +"%";
                    results=true;
            } else {
                element.setAttribute("hidden", true);
            }

        });
        //display no results if none
        if (results==true){
            no_results.setAttribute("hidden", true);
            //then sort by ranking
            elements = Array.from(items);
            elements.sort(function(a, b) {
                return b.getAttribute("ranking")-a.getAttribute("ranking");
            });
            // Append the sorted items back to the wrapper
            section=document.getElementById('paints-list');
            elements.forEach(function(element) {
                section.appendChild(element);
            });
        } else {
            no_results.setAttribute("hidden",false);
        }

    };
    filter();
}

//get ranking for element
function get_ranking(references, max_distances, attributes){
    //gets an array of rankings based on distance between reference colour and attributes of an element
    var distances={};
    const WEIGHTS={}
    WEIGHTS['hue']=3
    WEIGHTS['saturation']=0.5
    WEIGHTS['luminance']=0.5
    //get min distance between reference hue and element hues
    const hue_distances=[];
    for (let index = 0; index < references['hue'].length; ++index) {
        hue_distances[index]=getHueDifference(references['hue'][index], attributes['hue']);
    }
    distances['hue']=Math.min(...hue_distances);
    //get distance between reference saturation and element saturation, then for luminance
    distances['saturation']=getSatDifference(references['saturation'], attributes['saturation']);
    distances['luminance']=getSatDifference(references['luminance'], attributes['luminance']);
    //create rankings
    let rankings={};
    rankings['total']=0;
    const NAMES=['hue', 'saturation', 'luminance'];
    NAMES.forEach(name => {
        if (distances[name]-max_distances[name]<0) {
            rankings[name]=0;
        } else {
            rankings[name]=distances[name]*WEIGHTS[name];
        }
        rankings['total']+=rankings[name];
    });
    //normalise total
    max_total=WEIGHTS['hue']*180 + WEIGHTS['saturation']*100 + WEIGHTS['luminance']*100;
    rankings['total']=Math.round(100*(max_total-rankings['total'])/max_total);
    return rankings;
}
//Helper functions for saturation/luminance
function getSatDifference(sat1, sat2){
    const diff = Math.abs(sat1-sat2);
    if (diff<0){diff=0}
    if (diff>100){diff=100}
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
function areHuesSimilar(hue1, hue2, threshold =0) {
    return getHueDifference(hue1, hue2) <= threshold;
}

function getComplementaryHue(hue) {
  return (+hue + 180) % 360;
}

function getTriadicHues(hue) {
  let h1= (+hue + 120) % 360;
  let h2=(+hue + 240) % 360;
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
