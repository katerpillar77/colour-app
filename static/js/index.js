
// initialise everything
document.addEventListener('DOMContentLoaded', function() {
    let selected_colour = document.querySelector('#selected-colour');
    let current_colour = window.getComputedStyle(selected_colour).backgroundColor;
    initiatePicker(current_colour);
    initiateSliders();
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
        applyColor(document.querySelector('#selected-colour'), colour)
        applyColor(document.querySelector('#adjusted-colour'), colour)
        //show everything if hidden (only on first run)
        const nodeList = document.querySelectorAll(".hide-initial");
        for (let i = 0; i < nodeList.length; i++) {
            nodeList[i].style.display = "block";
        }
        //change the adjustment sliders
        setAdjustments(colour);
        //apply colour to reset event
        document.querySelector('#reset').addEventListener('click', function() {
            applyColor(document.querySelector('#adjusted-colour'), colour)
            setAdjustments(colour);
            createEvent('select');
        });
        //trigger change event so filter runs
        createEvent('select');
    });
}

function initiateSliders() {

    saturation_slider = rangeSlider(document.querySelector('#saturation-slider'), {
        min:0,
        max:100,
        step:1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            document.querySelector('#saturation').value=value[1];

            adjustColour();
        }
    });
    luminance_slider=rangeSlider(document.querySelector('#luminance-slider'), {
        min:0,
        max:100,
        step:1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            document.querySelector('#luminance').value=value[1];
            adjustColour();
        }
    });
    let hue_dist = document.querySelector('#hue-distance');
    hue_distance_slider=rangeSlider(document.querySelector('#hue-distance-slider'), {
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
    let sat_dist = document.querySelector('#saturation-distance');
    saturation_distance_slider=rangeSlider(document.querySelector('#saturation-distance-slider'), {
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
    let lum_dist = document.querySelector('#luminance-distance');
    luminance_distance_slider=rangeSlider(document.querySelector('#luminance-distance-slider'), {
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
    hsl = tinycolor(colour.string('rgb')).toHsl();
    document.querySelector('#hue').value=Math.round(hsl['h']);
    s = Math.round(100 * hsl['s']);
    saturation_slider.value([0, s]);
    document.querySelector('#saturation').value=s;
    l = Math.round(100 * hsl['l']);
    luminance_slider.value([0, l]);
    document.querySelector('#luminance').value=l;
}

function adjustColour () {
    h = document.querySelector('#hue').value;
    s = saturation_slider.value()[1];
    l = luminance_slider.value()[1];
    new_colour = tinycolor('hsl(' + h + "," + s + "%," + l + "%)").toHexString();
    applyColor(document.querySelector('#adjusted-colour'), new_colour);
    createEvent('select');
}

//Helper function: fires event when needed
function createEvent(id){
    //fire an event for input boxes that are programmatically changed
    const changeEvent = new Event('change');
    document.querySelector(id).dispatchEvent(changeEvent);
}

function filterList() {
    //get sections with filterable lists
    const sections = document.querySelectorAll(".list-section");
    sections.forEach(section => {
        // Get list of all list items
        const items = section.querySelectorAll(".item-card");
        // Get the filter inputs and add listeners for the change event
        const select = section.querySelector("select");
        select.addEventListener("change", filter);
        const hue_distance_input = section.querySelector('#hue-distance');
        hue_distance_input.addEventListener("input", filter);
        const saturation_distance_input = section.querySelector('#saturation-distance');
        saturation_distance_input.addEventListener("input", filter);
        const luminance_distance_input = section.querySelector('#luminance-distance');
        luminance_distance_input.addEventListener("input", filter);
        const hue_input = document.querySelector('#hue');
        const saturation_input = document.querySelector('#saturation');
        const luminance_input = document.querySelector('#luminance');
        const no_results=document.querySelector('#no-results');
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
                hues=getTertiaryHues(hues[0]);
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
                const RANKING_THRESHOLD = 100;

                if (rankings['total']<=RANKING_THRESHOLD | select.value == "0") {
                      element.removeAttribute("hidden");
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
                    return a.getAttribute("ranking")-b.getAttribute("ranking");
                });
                // Append the sorted items back to the wrapper
                elements.forEach(function(element) {
                    section.appendChild(element);
                });
            } else {
                no_results.removeAttribute("hidden");
            }

        };
        filter();
    });
}
//get ranking for element
function get_ranking(references, max_distances, attributes){
    //gets an array of rankings based on distance between reference colour and attributes of an element
    var distances={};
    const WEIGHTS={}
    WEIGHTS['hue']=2
    WEIGHTS['saturation']=1
    WEIGHTS['luminance']=1
    //get min distance between reference hue and element hues
    const hue_distances=[];
    for (let index = 0; index < references['hue'].length; ++index) {
        hue_distances[index]=getHueDifference(references['hue'][index], attributes['hue']);
    }
    distances['hue']=Math.min(...hue_distances);
    //get distance between reference saturation and element saturation, then for luminance
    distances['saturation']=getSatDifference(references['saturation'], attributes['saturation']);
    distances['luminance']=getSatDifference(references['luminance'], attributes['luminance']);
    console.log(distances);
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
    console.log(rankings);
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

function getTertiaryHues(hue) {
  let h1= (+hue + 120) % 360;
  let h2=(+hue + 240) % 360;
  return [h1, h2];
}

// Helper function: change background colour of an element
const applyColor = (el, color) => {
    if (color) {
        el.style.backgroundColor = color
    } else {
        el.style.backgroundColor = ''
    }
}
