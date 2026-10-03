/*jshint esversion: 11 */
import * as commonjs from "/static/js/common.min.js";
export var myModal;
     
var picker;
var saturation_slider;
var luminance_slider;      
var current_colour;
var paramsObject = {};
var colourParams= new URLSearchParams(window.location.search);
 //set border width by relevance: 100% gives 0.2 rem, 60% gives 0.01 rem
const BORDER_WIDTH_WEIGHT = 0.00475;
const BORDER_WIDTH_CONSTANT = 0.275;

const HUE_THRESHOLD=5;

const RELEVANCE_THRESHOLDS=[];
    document.querySelectorAll('#filter-options .select-relevance').forEach (r => {
        //console.log(RELEVANCE_THRESHOLDS);
        RELEVANCE_THRESHOLDS.push(r.dataset.threshold);
    });
let CALCULATED_HUE=[{'type':'1', 'hue':'0'}];
let FILTERS= {};
let SORT_TYPE = '1';


//indicates that there is no selected colour yet
    //will change to true on the first run of changeColour
let colour_initiated = false;

// initialise everything
document.addEventListener('DOMContentLoaded', function() {
    
    setup();
    commonjs.docSetup();
});

function setup() {   
    //guard clause to stop this running on any except the main page (we will get errors related to the colour picker otherwise)
    const requiredElement = document.getElementById('selected-colour');
    
    // If the element doesn't exist, stop execution immediately
    if (!requiredElement) {
        return; 
    } 
        
    //initiate everything
    //initiate colour picker to the background colour of the reference colour
    initiatePicker(window.getComputedStyle(document.getElementById('selected-colour')).backgroundColor);
    //set reference/adjusted colours to the colours in params if they exist
    initiateSliders();
    initiateButtons();
    initiateFilters();
    getParams();
}

//seems like this isn't needed
//get parameters from URL and set the reference colour
function getParams() {  
    const urlParams = new URLSearchParams(window.location.search);
    const referenceColour = urlParams.get('r');
    const adjustedColour = urlParams.get('a');
    //console.log(adjustedColour);
    if (referenceColour) {
        //set the reference colour
        console.log(referenceColour);
        //picker.setColor(referenceColour, true);
       // changeColour();
        //don't set adjusted colour without reference colour even if it's passed
        if (adjustedColour) {
        // Set the adjusted colour
       // changeAdjustedColour(adjustedColour);
        }
    }   
}

function addParams(cols) {
   // paramsObject.referenceColour = cols.ref;
   // paramsObject.adjustedColour = cols.adjustedColour;
    const params = new URLSearchParams(cols);
   // console.log(params.toString());
    // Update the URL with the new parameters without reloading the page
  //  window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
}

//initiate the colour picker used to select the reference colour
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
        //add parameters to URL
        let hex1 = tinycolor(colour.string('rgb')).toHexString();
        addParams({'r': hex1, 'a': hex1});
        changeColour();
    });
}

//initiate all sliders
function initiateSliders() {
    saturation_slider = rangeSlider(document.getElementById('saturation-slider'), {
        min: 0,
        max: 100,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            //console.log('saturation_slider_onInput');
            document.getElementById('saturation').value = value[1];
            if (userInteraction==true) {
                adjustColour();
            }
        }
    });
    document.getElementById('saturation').addEventListener('change', function() {
        //console.log('saturation_change');
        saturation_slider.value([0, this.value]);
        adjustColour();
    });
    luminance_slider = rangeSlider(document.getElementById('luminance-slider'), {
        min: 0,
        max: 100,
        step: 1,
        thumbsDisabled: [true, false],
        value: [0, 100],
        rangeSlideDisabled: true,
        onInput: (value, userInteraction) => {
            //console.log('luminance_slider_onInput');
            document.getElementById('luminance').value = value[1];
            if (userInteraction==true) {
                adjustColour();
            }
        }
    });
    document.getElementById('luminance').addEventListener('change', function() {
        console.log('luminance_change');
        luminance_slider.value([0, this.value]);
        adjustColour();
    });
    document.getElementById('hue').addEventListener('change', function() {
        adjustColour();
        refreshPaintList(this.value);
    });

    function adjustColour() {
    //changes adjusted colour and filters when sliders are moved
        //console.log('adjustColour');
        let h = document.getElementById('hue').value;
        let s = saturation_slider.value()[1];
        let l = luminance_slider.value()[1];
        let new_colour = tinycolor('hsl(' + h + "," + s + "%," + l + "%)").toHexString();
        applyColor(document.getElementById('adjusted-colour'), new_colour);
        document.getElementById('save-adjusted-colour').dataset.colour= new_colour;        
        //recalculate rankings (no change in hue, don't need to refresh paint list)
        calculateRankings();
        //filter and sort the list
        filterList(true);
    }
}

//add event listeners to all buttons that are already visible/loaded
function initiateButtons() {

    //add event listeners to radio buttons in modals
    document.getElementById('compare-adj').addEventListener('click', function() {
        document.getElementById('compare-reference-colour').setAttribute("hidden", true);
        document.getElementById('compare-adjusted-colour').removeAttribute("hidden");
    });
    document.getElementById('compare-ref').addEventListener('click', function() {
        document.getElementById('compare-adjusted-colour').setAttribute("hidden", true);
        document.getElementById('compare-reference-colour').removeAttribute("hidden");
    });

    //reset button sets adjusted colour back to reference colour
    document.getElementById('reset').addEventListener('click', function() {
        applyColor(document.getElementById('adjusted-colour'), current_colour);
        setAdjustments(current_colour);
        //hue may be changed so get new paints and filter 
        refreshPaintList();
    });

    //button to allow user to select colour from saved colours
    const select_saved_colour = document.getElementById('select-saved-colour');
    if (!!select_saved_colour) {
        select_saved_colour.addEventListener('click', function() {
            //display modal
            const modalSelect = new bootstrap.Modal(document.getElementById('select-saved-colour-modal')).show();
            //populate modal to allow user to select from saved colours
            initiateSaveColourModal(document.getElementById('modal-select-colour'), 'select');
        });
    }              
    

    //when certain modals are closed, their content should be removed
    const modal_select_colour = document.getElementById('select-saved-colour-modal');
    modal_select_colour.addEventListener('hidden.bs.modal', event => {
        commonjs.destroyModalAccordion(modal_select_colour);
    });
    const modal_add_colour = document.getElementById('add-saved-colour-modal');
    modal_add_colour.addEventListener('hidden.bs.modal', event => {
        commonjs.destroyModalAccordion(modal_add_colour);
    });
    modal_add_colour.querySelector('.add-workspace').addEventListener('click',  _ => addWorkspace('colour') );
    const modal_add_paint = document.getElementById('add-saved-paint-modal');
    modal_add_paint.addEventListener('hidden.bs.modal', event => {
        commonjs.destroyModalAccordion(modal_add_paint);
    });
    modal_add_paint.querySelector('.add-workspace').addEventListener('click', _ => addWorkspace('paint') );
        
}

function addWorkspace(modal_type){
    //close calling modal (we don't need to know which is open, they're called the same thing)
    document.querySelectorAll('.modal').forEach(function(modalElem) {
        myModal.hide();
    });
    //display modal
    const modalWorkspace = new bootstrap.Modal(document.getElementById('add-workspace-modal')).show();
    //populate modal to allow user to select workspace to save paint into
    commonjs.initiateSaveWorkspaceModal(document.getElementById('modal-add-workspace'), modal_type);
}

function showHiddenModal(){
    myModal.show();
}

//load filters
async function initiateFilters(){    
    const filters=document.getElementById('filter-options');

    //add event listeners to the preset filters        
    filters.querySelectorAll('.hue-select-type').forEach(e => {
        //if another/different hue type is chosen, need to refresh the paint list
        e.addEventListener("change", function() {     
            refreshPaintList();
        });
    });

    //populate FILTERS 
    FILTERS.hue=[];
    filters.querySelectorAll('.hue-select-type').forEach(e => {
        let label1 = filters.querySelector('#hue-select-type-'+e.value);
        FILTERS.hue.push({'option': e.value, 'name': label1.dataset.text, 'checked':false, 'found': false});
    }); 
    FILTERS.relevance=[];
    filters.querySelectorAll('.select-relevance').forEach(e => {
        //only show results above a relevance threshold
        FILTERS.relevance.push({'option': e.value, 'name':'>' + e.value + '%', 'checked':false, 'found': false});
        e.addEventListener("change", function() {
            filterList();
        });
    });        

    //add filter options to the filters that aren't preset
    let filter_list = filters.querySelectorAll('.filter-dynamic');
    for (const f of filter_list){
        let filter_details={};
        switch (f.id) {
            case 'filter-brand':
                filter_details={
                    route:'/return-brands-with-paints',
                    id_name: 'brand',
                    label: 'name'
                };
                break;
            default:
                break;
        }
        
        if (!("route" in filter_details)) {
            console.log('There is no switch case for ' + f.id);
            continue;
        }
        
        //initiate item for this filter in FILTERS
        FILTERS[filter_details.id_name]=[];
        //get li template
        const template=f.querySelector('li.template');
        if (!template) {
            continue;
        }
        //get the list of filter options
        const data = await commonjs.loadData(filter_details.route);  
        if (!data) {
            continue;
        }
        //console.log(data);
        //create a li for each item in data
        for (const d of data) {
            //clone li template
            let new_li=template.cloneNode(true);
            new_li.id=filter_list.id_name + d.id;
            let e = template.parentNode.appendChild(new_li);
            e.removeAttribute("hidden");
            e.classList.remove('template');
            let i=e.querySelector('input');
            i.classList.remove('template');
            let l=e.querySelector('label');
            i.value=d.id;
            let li_id=filter_details.id_name + "-" + d.id;
            i.setAttribute('id', li_id);
            l.setAttribute('for', li_id);
            l.innerHTML=d[filter_details.label];
            //add this option to FILTERS
            FILTERS[filter_details.id_name].push({'option': i.value, 'name':d[filter_details.label], 'checked':false, 'found': false});
            e.addEventListener('click', function() {
                filterList();
            });
        }
    }
    //console.log(FILTERS);
}

//called whenever the colour in the colour picker is changed
//adds event listeners to save colour buttons, refreshes paint list
function changeColour() {    

    //apply selected colour to both boxes and save-colour buttons
    document.querySelectorAll('.colour-ref').forEach((elem) => {
        applyColor(elem, current_colour);
    });
    document.querySelectorAll('.add-saved-colour').forEach((button) => {
        button.dataset.colour= current_colour;
    });

    //change the adjustment sliders
    setAdjustments(current_colour);
    //get paints with the reference colour's hue
    refreshPaintList();
    
    //initiate everything that was hidden before (only on first run)
    if (colour_initiated == false) {
        //show the rest of the page that was hidden
        const nodeList = document.querySelectorAll(".hide-initial");
        for (let i = 0; i < nodeList.length; i++) {
            nodeList[i].style.display = "block";
        }
        //hide the button encouraging login, it will just get in the way if the user has no account
        let elementExists = document.getElementById("login-for-fav");
        if (elementExists) {
            document.getElementById('login-for-fav').setAttribute('hidden', 'true');
        }
        //initiate buttons to save the reference/adjusted colours
        document.querySelectorAll('.add-saved-colour').forEach((button) => {
            button.removeAttribute('hidden');
            //add event listeners as well
            button.addEventListener('click', function() {
                //display modal                    
                //use var because only one modal is open at a time, but we don't know which one
                myModal = new bootstrap.Modal(document.getElementById('add-saved-colour-modal'));
                myModal.show();
                //populate modal to allow user to select workspace to save colour into
                let colour=this.dataset.colour;                
                if (colour=="") {
                    return;
                }
                let modalElement = document.getElementById('modal-add-colour');
                initiateSaveColourModal(modalElement, 'add', colour);
                        
                //this won't run again
                colour_initiated = true;
            });
        });

        //initiate sort order buttons
        document.querySelectorAll('.sort-option').forEach((button) => {
            button.addEventListener('click', function(){
                SORT_TYPE = button.id.substr(5);
                //console.log(document.getElementById('sort-button'));
                //console.log(button.innerHTML);
                document.getElementById('sort-button').innerHTML = button.innerHTML;
                sortList();
            });                
        });

    }

}

//sets HSL inputs when reference colour changes
function setAdjustments(colour) {

    //console.log('setAdjustments');
    let hsl = tinycolor(colour.string('rgb')).toHsl();
    document.getElementById('hue').value = Math.round(hsl.h);
    let s = Math.round(100 * hsl.s);
    saturation_slider.value([0, s]);
    document.getElementById('saturation').value = s;
    let l = Math.round(100 * hsl.l);
    luminance_slider.value([0, l]);
    document.getElementById('luminance').value = l;
}

//refresh the list of paints when the hue selection or hue_input changes
//adds event listeners for save paint buttons
async function refreshPaintList(changed_type){
    
    //only populate the list with paints within a threshold of the hue
    
    //get required hues from the filter list
    setCalculatedHue();
    
    //get paints section
    const section=document.getElementById('paints');
    commonjs.showSpinner(section, true);
    //keep height to stop page jumping around
    let temp_height=section.offsetHeight;        
    section.style.minHeight=temp_height+'px';

    const paints_list=section.querySelector('#paints-list');
    //hide paints list until done to avoid visual artifacts
    paints_list.setAttribute('hidden', 'true');
    //clear the current list to just template        
    const template=paints_list.querySelector('#template-item-card');
    paints_list.innerHTML="";
    paints_list.appendChild(template);

    //for each entry in calculated_hue
    for (let i=0; i<CALCULATED_HUE.length; i++) {
        
        //get the paints 
        //returns false on error 
        let paints = await fetchPaints(CALCULATED_HUE[i]);   
        if (!paints){
            return;
        }
        
        //create an element for each paint
        for (const p of paints) {
            //create a new '.item-card' element for this paint
            let e= create_row(p, CALCULATED_HUE[i]);                                
            if (e) {
                //add differences and rankings to the element
                setPaintRanking(e, {'saturation': document.getElementById('saturation').value, 'luminance': document.getElementById('luminance').value});
                //add event listeners 
                setButtons(e, p);
            }                
        }
    }

    //once all the paints are loaded, filter and sort the list
    filterList(true);

    //show the list again
    commonjs.showSpinner(section, false);
    section.style.minHeight='';
    paints_list.removeAttribute('hidden');

    //initiate tool tips for all buttons
    const tooltipTriggerList = paints_list.querySelectorAll('[data-bs-toggle="tooltip"]');
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(
        tooltipTriggerEl));

    //curate the list of dictionaries calculated_hue
    function setCalculatedHue() {
        //curate the list of dictionaries calculated_hue  
        const base_hue=document.getElementById('hue').value;
        CALCULATED_HUE=[];
        document.querySelectorAll('.hue-select-type').forEach (e =>{            
            let hue;
            switch(e.value) {
                case "1":
                    hue=base_hue;                    
                    break;
                case "2":
                    hue= (+base_hue + 180) % 360;
                    break;
                case "3":
                    hue= (+base_hue + 120) % 360;
                    break;
                case "4":
                    hue= (+base_hue + 240) % 360;
                    break;
                default:
                // code block
            }
            //add text to select for filter, also add to FILTERS
            let label1 = document.getElementById('hue-select-type-'+ e.value);
            let hue_label=label1.dataset.text + " - hue " + hue;
            label1.innerHTML = hue_label;
            let result=FILTERS.hue.find(x => x.option === e.value);
            //console.log(result);
            result.name=hue_label;
            if (e.checked==true) {
                CALCULATED_HUE.push({'type':e.value, 'hue':hue.toString()});
                result.checked=true;
            }
        });
        //console.log(CALCULATED_HUE);
    }
    
    //get paints within HUE_THRESHOLD of the specified hue
    async function fetchPaints(this_hue){            
        const response=await fetch('/return-paints-hue', {
            method: 'POST',
            headers: {'Content-Type': 'application/json; charset=utf-8'},
                body: JSON.stringify({
                    hue: this_hue.hue,
                    threshold: HUE_THRESHOLD,
                })
        });
        //return false if failure
        const data = await response.json();
        //control for empty data - it gets processed as False
        if (data.length==0){
            data.push(0);
        }
        if (data[0]==0){
            //no paints returned
            return false;
        }            
        if (data == false) {
            //error has occurred
            commonjs.insert_text(paints_list, "Could not load saved paints.");
            return false;
        }
        return data;
    }

    //creates a new '.item-card' element for paint p
    function create_row(p, this_hue) {        
        //clone item-card template
        let new_row=template.cloneNode(true);
        new_row.id="paint-" + p.id;
        let item_card = template.parentNode.appendChild(new_row);
        //add paint details to item_card
        item_card.removeAttribute("hidden");
        item_card.classList.remove('template');
        item_card.dataset.hue=p.H;
        item_card.dataset.saturation=p.S;
        item_card.dataset.luminance=p.L;
        item_card.dataset.hue_orig=this_hue.hue;
        //item_card.dataset.hueDiff=p.difference;
        item_card.dataset.brand=p.brand_id;
        item_card.querySelector('.brand-name').innerHTML=p.brand_name;
        item_card.querySelector('.paint-name').innerHTML=p.paint_name;
        item_card.querySelector('.colour-holder').style.backgroundColor='#'+p.hex;
        item_card.querySelector('.hsl').innerHTML="HSL(" + p.H + ", " + p.S +"%, " + p.L +"%)";
        let type_text="";
        switch (this_hue.type){
            case "1":
                type_text="Analogous";
                break;
            case "2":
                type_text="Comple&shy;mentary";
                break;
            case "3":
                type_text="Triadic 1";
                break;
            case "4":
                type_text="Triadic 2";
                break;
            default:
        }
        item_card.querySelector('.hue-type').innerHTML=type_text;
        return item_card;
    }        

        //add event listeners to buttons in the row
    function setButtons(e, p){       
        let button=e.querySelector('.save-paint');
        if (!!button) {
            //button to save paint in a workspace
            button.dataset.paintId=p.id;
            button.dataset.paintName=p.brand_name + " " + p.paint_name;
            button.dataset.paintColour='#' + p.hex;      
            button.addEventListener('click', function() {
                let paint = {
                    'id': this.dataset.paintId,
                    'name': this.dataset.paintName,
                    'colour': this.dataset.paintColour
                };
                if (paint.id=="") {
                    return; 
                }
                //display modal
                //use var because only one modal is open at a time, but we don't know which one
                myModal = new bootstrap.Modal(document.getElementById('add-saved-paint-modal'));
                myModal.show();
                //console.log(myModal);
                //populate modal to allow user to select workspace to save paint into
                initiateSavePaintModal(document.getElementById('modal-add-paint'), paint);
            });
        }
        let compare=e.querySelector('.compare');
        if (!!compare) {   
            //button to open compare colours modal
            compare.addEventListener('click', function() {
                //display modal
                const modalCompare = new bootstrap.Modal(document.getElementById('compare-modal'));
                modalCompare.show();
                document.getElementById('chosen-colour').style.backgroundColor = this
                    .style.backgroundColor;
                document.getElementById('compare-reference-colour').style
                    .backgroundColor = document.getElementById('selected-colour').style
                    .backgroundColor;
                document.getElementById('compare-adjusted-colour').style
                    .backgroundColor = document.getElementById('adjusted-colour').style
                    .backgroundColor;
            });  
        }
    }
}

//recalculate all rankings when saturation/luminance/hue changes
function calculateRankings(){
    //recalculate ranking for every paint item
    const items = document.querySelectorAll("#paints-list .item-card");
    for (const e of items) {            
        setPaintRanking(e, {'saturation': document.getElementById('saturation').value, 'luminance': document.getElementById('luminance').value});
    } 
}

//calculate and set ranking for a paint based on the calculated hue relevant to that input
//works in CIELch colour space
function setPaintRanking(e, inputs) { 
//runs when the whole paint list is refreshed, or when the hue/saturation/luminance inputs are changed   
//e is element with HSL colour
//inputs is saturation and luminance for adjusted colour
//hue is stored in constant HUE
    let colours= [{'H': e.dataset.hue_orig, 'S':inputs.saturation, 'L': inputs.luminance}, {'H':e.dataset.hue, 'S':e.dataset.saturation, 'L': e.dataset.luminance} ];
    for (let col of colours) {
        //convert HSL to RGB
        let col1 = tinycolor('hsl(' + col.H + "," + col.S + "%," + col.L + "%)").toRgb();
        col.R = col1.r;
        col.G = col1.g;
        col.B = col1.b;
        //convert RGB to XYZ
        col = RGBToXYZ(col);
        //convert XYZ to CIELab
        col = XYZToCIELab(col);
        //convert CIELab to CIELch
        col = LabToLCh(col);
    }

    //get distance between two colours
    let distance = deltaE76_LCh(colours[0], colours[1]);
    //console.log(distance);

    //normalise and set as ranking
    const MAX_DISTANCE=100;
    let ranking = Math.round(100 * (MAX_DISTANCE - distance) / MAX_DISTANCE);
            
    //apply ranking to element
    e.dataset.distance = distance;
    e.dataset.ranking= ranking;
    e.querySelector('.relevance').innerHTML = ranking + "%";
                            
    //set element border width by ranking
    //let border_width = BORDER_WIDTH_WEIGHT * ranking - BORDER_WIDTH_CONSTANT
    e.style.borderWidth = (BORDER_WIDTH_WEIGHT * ranking - BORDER_WIDTH_CONSTANT) + "rem";

    function RGBToXYZ(colour) {
        //let vars = [colour.R / 255, colour.G / 255, colour.B / 255]
        let rLinear  = ( colour.R / 255 );
        let gLinear  = ( colour.G / 255 );
        let bLinear  = ( colour.B / 255 );
        const XYZ_THRESHOLD = 0.04045;
        const XYZ_ADD = 0.055;
        const XYZ_DIV1 = 1.055;
        const XYZ_POWER = 2.4;
        const XYZ_DIV2 = 12.92;
        rLinear = rLinear > XYZ_THRESHOLD ? Math.pow((rLinear + XYZ_ADD) / XYZ_DIV1, XYZ_POWER) : rLinear / XYZ_DIV2;
        gLinear = gLinear > XYZ_THRESHOLD ? Math.pow((gLinear + XYZ_ADD) / XYZ_DIV1, XYZ_POWER) : gLinear / XYZ_DIV2;
        bLinear = bLinear > XYZ_THRESHOLD ? Math.pow((bLinear + XYZ_ADD) / XYZ_DIV1, XYZ_POWER) : bLinear / XYZ_DIV2;
        colour.X = 100*(rLinear * 0.4124 + gLinear * 0.3576 + bLinear * 0.1805);
        colour.Y = 100*(rLinear * 0.2126 + gLinear * 0.7152 + bLinear * 0.0722);
        colour.Z = 100*(rLinear * 0.0193 + gLinear * 0.1192 + bLinear * 0.9505);

        return colour;
    }

    function XYZToCIELab(colour) {
        // 1. Normalize by D65 reference white points
        // (Xn = 95.047, Yn = 100.0, Zn = 108.883)
        let xN = colour.X / 95.047;
        let yN = colour.Y / 100.0;
        let zN = colour.Z / 108.883;

        // 2. Apply the CIELAB transformation function f(t)
        const delta = 6 / 29; // 0.2068965...
        
        const f = (t) => {
            return t > Math.pow(delta, 3) ? Math.cbrt(t) : (t / (3 * Math.pow(delta, 2))) + (4 / 29);
        };

        const fx = f(xN);
        const fy = f(yN);
        const fz = f(zN);

        // 3. Calculate L*, a*, b*
        colour.Lstar = (116 * fy) - 16;
        colour.Astar= 500 * (fx - fy);
        colour.Bstar = 200 * (fy - fz);

        return colour;
    }

    function LabToLCh (colour) {
        // Lightness remains exactly the same
        // Chroma is the Euclidean distance from the origin
        const C = Math.hypot(colour.Astar, colour.Bstar);

        // Hue angle in radians, converted to degrees
        let h = Math.atan2(colour.Bstar, colour.Astar) * (180 / Math.PI);

        // Ensure the hue angle is always positive (between 0 and 360 degrees)
        if (h < 0) {
            h += 360;
        }
        colour.Lstar =  Number(colour.Lstar.toFixed(2));
        colour.Ch = Number(C.toFixed(2));
        colour.Hangle = Number(h.toFixed(2));
        return colour;
    }

    function deltaE76_LCh(colour1, colour2){
        
        // 1. Lightness Difference
        const dL = colour1.Lstar - colour2.Lstar;

        // 2. Chroma Difference
        const dC = colour1.Ch - colour2.Ch;

        // 3. Shortest Hue Angle Difference
        let dh = colour1.Hangle - colour2.Hangle;
        if (dh > 180) {
            dh -= 360;
        } else if (dh < -180) {
            dh += 360;
        }

        // Convert dh from degrees to radians for JS Math functions
        const dhRad = dh * (Math.PI / 180);

        // 4. Metric Hue Difference
        // (Math.max handles edge cases where rounding results in slightly negative numbers under the sqrt)
        const dH = 2 * Math.sqrt(Math.max(0, colour1.Ch * colour2.Ch)) * Math.sin(dhRad / 2);

        // 5. Total CIE76 Euclidean Distance
        const deltaE = Math.sqrt(dL * dL + dC * dC + dH * dH);

        return Number(deltaE.toFixed(2));
    } 
}

//filter and sort the list of paints
function filterList(sort=false) {  
    
    let results = false;
    
    //get required ranking threshold from filter list
    let ranking_threshold=0;
    const data = new FormData(document.getElementById('filter-relevance'));
    for (const entry of data) {
        ranking_threshold =entry[1];
    }

    //update FILTERS with which options are checked, and reinitialise found to false
    updateFilterVariable();
    const paints_list = document.getElementById('paints-list');
    //check every paint item
    const items = paints_list.querySelectorAll(".item-card");
    for (const e of items) {
        //ignore the template 
        if (e.id == 'template-item-card'){
            continue;    
        }  
        if (applyFilters(e)==true){
            results=true;
        }            
    }    
    
    //display no results if none
    const no_results = document.getElementById('no-results');
    if (results == true) {
        no_results.setAttribute("hidden", true);    
        //if required, sort the list by specified sort order
        if (sort) {
            sortList(items); 
        }           
    } else {
        no_results.removeAttribute("hidden");
    }
    
    //grey out unavailable options
    updateFilters();
    
    //update the variable FILTERS with selected/not selected filter options
    function updateFilterVariable(){        
    //also show selected options
    //also initiate found to false
        
    //clear #selected-options and get ready to add updated ones
        //clear the current list to just template 
        const d = document.getElementById('selected-options'); 
        //get the template
        const template=d.querySelector('.template');  
        d.innerHTML="";
        d.appendChild(template);   
        let filters_all=document.getElementById('accordion-filter');
        for (const [filter_name]  of Object.entries(FILTERS)){
            let one_checked=false;
            let none_means_one = false;
            switch (filter_name) {
                case 'relevance', 'hue':                         
                    break;  
                default:
                    none_means_one=true;                                                                 
            }
            
            for ( let i = 0; i < FILTERS[filter_name].length; i++ ) {
                let o = FILTERS[filter_name][i];  
                //re-initialise found
                o.found=false;
                //note whether the option is checked 
                o.checked=filters_all.querySelector('#filter-'+ filter_name).querySelector('#' + filter_name + '-' + o.option).checked;  
                if (o.checked ){
                    one_checked=true;
                    displaySelectedOption(filter_name, o, template);
                }
            } 
            //for some filters, if none of the options were checked, consider them all checked 
            if (!one_checked && none_means_one) {
                for ( let i = 0; i < FILTERS[filter_name].length; i++ ) {
                    FILTERS[filter_name][i].checked=true;
                }
            } 
        }
        //console.log(FILTERS);
    }

    //hide an element as required by selected filter options
    function applyFilters(e){
        
        let matches=0;
        let num_filters=Object.entries(FILTERS).length-1;
        
        //iterate through filters
        for (const [filter_name, options]  of Object.entries(FILTERS)){
            switch(filter_name) {
                case 'relevance':
                    //filter by ranking threshold            
                    if (Number(e.dataset.ranking) >= Number(ranking_threshold))  {
                        //it's a match       
                        matches++;  
                    }
                    break;
                case 'hue':
                    break;
                default:
                    //get option for this filter from the element              
                    let element_option = e.dataset[filter_name];
                    //find the option in the array
                    let result=options.find(x => x.option === element_option);
                    //if this option is checked, it's a match
                    if (result.checked==true) {
                        matches++;                                            
                    }  
                    //note that the option exists in the list
                    result.found=true;                      
            }
        }
        //check number of matches against number of filters
        if( matches == num_filters){
            //all matches, show the element
            e.removeAttribute("hidden");
            return true;
        } else {
            e.setAttribute("hidden", true);
            return false;
        }            
    }   

    //add a button displaying the selected option above the filters
    function displaySelectedOption(f, o, template) {
                    
        //clone the template
        const new_button=template.cloneNode(true);
        new_button.id="selected-" + f + '-' + o.option;
        let b;
        if (f=="relevance") {
            b = template.parentNode.prependChild(new_button);
        } else {
            b = template.parentNode.appendChild(new_button);
        }
        //add details to button
        b.removeAttribute("hidden");
        b.classList.remove('template');
        b.classList.add('d-inline-block');
        b.dataset.filter=f;
        b.dataset.option=o.option;
        const s= b.querySelector('.option-name');
        s.innerHTML= o.name;            
        
        //add an event listener to remove the filter option
        const filters=document.getElementById('accordion-filter');
        b.addEventListener('click', function() {
            const filter_name=b.dataset.filter;
            //uncheck the relevant filter option              
            const input_option=filters.querySelector('#filter-'+filter_name + ' #' + filter_name + '-' + b.dataset.option).checked=false;
            //apply the filters
            if (filter_name=="hue") {
                refreshPaintList();
            } else {
                filterList();
            }
        });
        //initialise the tooltip
        let tooltip = new bootstrap.Tooltip(b);
    }   

    function updateFilters(){
        //grey out options in the filters that aren't available
        const filters=document.getElementById('filter-options');
        for (const [filter_name, options]  of Object.entries(FILTERS)){
            if (filter_name != 'relevance'){
                for (const e of filters.querySelectorAll('.select-' + filter_name)) {
                    if (!(e.classList.contains ('template'))) {                        
                        //get value for this option from the element              
                        let result=options.find(x => x.option === e.value);
                        //for each option input, grey it out if 'found' is not true
                        e.disabled=!result.found;
                    }
                } 
            } else {
                //TODO finish this off for relevance as well
            }
        }            
    }
}

//sort list of paints by selected order
function sortList(items=""){
    
    const destElem = document.getElementById('paints-list');
    //if items not passed, get it
    if (items=="" ){
        items = destElem.querySelectorAll(".item-card");
    }
    
    //sort by selected option
    let elements = Array.from(items);
    let sortFunc;
    //get sort function for selected option
    switch (SORT_TYPE){
        case '1':
            sortFunc=function(a, b){
                let diff = b.dataset.ranking - a.dataset.ranking;
                return diff;
            };                
            break;
        case '2':
            sortFunc=function(a, b) {
                return a.dataset.hueDiff - b.dataset.hueDiff;
            };
            break;
        case '3':
            sortFunc=function(a, b) {
                return a.dataset.satDiff - b.dataset.satDiff;
            };
            break;
        case '4':
            sortFunc=function(a, b) {
                return a.dataset.lumDiff - b.dataset.lumDiff;
            };
            break;
        default:                    
    }

    if (sortFunc) {
        elements.sort(sortFunc);
        // Append the sorted items back to the wrapper
        elements.forEach(function(element) {
            destElem.appendChild(element);
        });
    }
}  

//add/edit colour/paint functions
//opens modal for adding saved paints
async function initiateSavePaintModal(destElem, paint={}) {

    commonjs.showSpinner(destElem, true);

    //hide error messages in modal
    destElem.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });

    //add details of paint to be saved
    const colour_holder=destElem.querySelector('#paint-details .colour-holder');
    const p_col = paint.colour ?? "#ffffff";
    colour_holder.style.backgroundColor=p_col;
    colour_holder.setAttribute('title', p_col);
    destElem.querySelector('.paint-name').innerHTML = paint.name ?? "";
    
    //get data
    const [paints, colours, workspaces] = await Promise.all([
        commonjs.loadData('/return-saved-paints'), 
        commonjs.loadData('/return-saved-colours'),
        commonjs.loadData('/return-workspaces'),
    ]);

    //get template for workspace
    let content=destElem.querySelector('.template-accordion');
    for (const w of workspaces) {
        //clone accordion-item template
        let new_content=content.cloneNode(true);
        new_content.id="workspace-" + w.id;
        let ws = content.parentNode.appendChild(new_content);
        //add workspace details to accordion
        ws.removeAttribute("hidden");
        ws.classList.remove("template-accordion");
        let accordion_button=ws.querySelector('.accordion-button');
        accordion_button.setAttribute('data-bs-target', '#collapse'+w.id);
        accordion_button.setAttribute('aria-controls', 'collapse'+w.id);
        accordion_button.innerHTML = w.name;
        ws.querySelector('.workspace-notes').innerHTML = w.notes;
        let accordion_collapse=ws.querySelector('.accordion-collapse');
        accordion_collapse.id='collapse'+w.id;
        //uncollapse if the first accordion item
                
        //add event listener to the "choose" button
        ws.querySelector('.choose-workspace').addEventListener ('click', function() {
            savePaint(destElem, paint, ws, {id:w.id, name:w.name});
        });
        
        //add colours
        addColourCol(colours, w, ws, 'add');
        //add paints
        addPaintCol(paints, w, ws);
        
    }
    //push template to end to prevent accordion styling issues
    content.parentNode.appendChild(content);
    commonjs.showSpinner(destElem, false);
    return;
}

//adds a column within a modal for each paint in a workspace
function addPaintCol( paint_list, w, ws, modalAction) {
    //adds additional details for paint modal for a workspace

    //add colours to workspaces
    let col=ws.querySelector('.col-template-paint');
    let i =0;
    for (const p of paint_list) {
        //if the colour belongs in this workspace
        if (p.workspace_id == w.id) {
            i+=1;
            //clone column template
            let new_col=col.cloneNode(true);
            new_col.id="paint-" + p.saved_paint_id; 
            new_col.classList.remove("col-template-paint");           
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
        ws.querySelector('.already-saved').innerHTML="No paints saved in this workspace yet.";
    }
}

//saves a chosen paint to a chosen workspace using notes entered in a modal
async function savePaint(modal, paint, ws, workspace) {   

    //hide error messages in modal
    modal.querySelectorAll('.error').forEach(function(element) {
        element.setAttribute('hidden', 'true');
    });

    let paint_notes = document.getElementById('paint-notes').value;
    const response=await fetch('/add-saved-paint', {
        method: 'POST',
        headers: {'Content-Type': 'application/json; charset=utf-8'},
            body: JSON.stringify({
                paint_id: paint.id,
                workspace_id: workspace.id,
                paint_notes: paint_notes
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    if (data.result=='99'){
        //paint is already saved in this workspace
        let display_error=ws.querySelector('.error');
        display_error.removeAttribute('hidden');
        display_error.innerHTML="This paint is already saved in this workspace.";
        return;
    }
    if (data.result==false){
        console.log('No data returned - server-side error with adding paint to workspace.');
        return;
    }

    //empty form
    document.getElementById("paint-input").reset();
    
    //trigger close of modal
    document.getElementById('add-paint-modal-close').click() ;
    //display confirmation message
    commonjs.displayMessage("The paint <span class='fst-italic'>" + paint.name + "</span> has been saved in your workspace <span class='fst-italic'>" + workspace.name + "</span>.");  
}

//opens modal for adding/selecting saved colours
async function initiateSaveColourModal(destElem, modalAction, colour_to_add="" ) {
    
    commonjs.showSpinner(destElem, true);

    //get data
// let with_colours=false;
    //if (modalAction=="select") {
//     //get only workspaces with saved colours
//     with_colours=true;        
// } 

    let [colours, paints, workspaces] =[];
    if (modalAction=="select"){
        [colours, workspaces] = await Promise.all([
            commonjs.loadData('/return-saved-colours'),
            commonjs.loadData('/return-workspaces-with-colours'),
        ]);
    } else {
        [colours, paints, workspaces] = await Promise.all([
            commonjs.loadData('/return-saved-colours'),
            commonjs.loadData('/return-saved-paints'),
            commonjs.loadData('/return-workspaces'),
        ]);
    }
    if (modalAction=="select" && workspaces[0]==0){
        //no workspaces with colours returned
        commonjs.insert_text(destElem, "No saved colours.");
        return;
    }

    if (colours === false || workspaces === false) {
        //error has occurred
        commonjs.insert_text(destElem, "Could not load saved colours.");
        return;
    }
    let colour_holder;
    if (modalAction=="add") {
        //add details of colour to be saved
        colour_holder=destElem.querySelector('#colour-details .colour-holder');
        colour_holder.style.backgroundColor=colour_to_add;
        colour_holder.setAttribute('title', colour_to_add);
        destElem.querySelector('.colour-code').innerHTML =colour_to_add;
    }
    //get template for workspace
    let content=destElem.querySelector('.template-accordion');
// let i=0;
    for (const w of workspaces) {
        //clone accordion-item template
        let new_content=content.cloneNode(true);
        new_content.id="workspace-" + w.id;
        let ws = content.parentNode.appendChild(new_content);
        //let ws = content.parentNode.insertBefore(new_content, content.nextSibling);
        //add workspace details to accordion
        ws.removeAttribute("hidden");
        ws.classList.remove("template-accordion");
        let accordion_button=ws.querySelector('.accordion-button');
        accordion_button.dataset.bsTarget='#collapse'+w.id;
        accordion_button.setAttribute('aria-controls', 'collapse'+w.id);
        accordion_button.innerHTML = w.name;
        ws.querySelector('.workspace-notes').innerHTML = w.notes;
        let accordion_collapse=ws.querySelector('.accordion-collapse');
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
                saveColour(colour_holder.getAttribute('title'), ws, {id: w.id, name: w.name});
            });
        }

        //add colours
        addColourCol(colours, w, ws, modalAction);
        if (modalAction=="add") {
            //add paints
            addPaintCol(paints, w, ws);
        }
    }
    //push template to end to prevent accordion styling issues
    content.parentNode.appendChild(content);
    commonjs.showSpinner(destElem, false);
    return;
}

//adds a column within a modal for each colour in a workspace
function addColourCol( colour_list, w, ws, modalAction) {   

    //add colours to workspaces
    let col=ws.querySelector('.col-template-colour');
    let i=0;
    for (const c of colour_list) {
        //if the colour belongs in this workspace
        if (c.workspace_id == w.id) {
            i+=1;
            //clone column template
            const new_col=col.cloneNode(true);
            new_col.id="colour-" + c.saved_colour_id;
            new_col.setAttribute('colour', c.hex);
            new_col.classList.remove("col-template-colour");
            //let colour = col.parentNode.insertBefore(new_col, col.nextSibling);
            const colour = col.parentNode.appendChild(new_col);
            //add colour details to column
            colour.removeAttribute("hidden");
            colour.querySelector('.colour-name').innerHTML = c.saved_colour_name;
            const colour_holder=colour.querySelector('.saved-colour');
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
        ws.querySelector('.already-saved').innerHTML="No paints saved in this workspace yet.";
    }   
}

//saves a chosen colour to a chosen workspace using name and notes entered in a modal
async function saveColour(colour_hex, ws, workspace){
    //saves a chosen colour to a chosen workspace
    
    //check if name is filled in
    //first hide error messages 
    const name_required=document.getElementById('name-required');
    name_required.setAttribute('hidden', 'True');

    //get form data and show error if required
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
                workspace_id: workspace.id,
                colour_name: colour_name,
                colour_notes: colour_notes
            })
    });
    if (!response.ok) {
        console.log('Response status: ' + response.status);
        return false;
    }
    const data = await response.json();
    //console.log(data);
    if (data.result=='99'){
        //colour is already saved in this workspace
        let display_error=ws.querySelector('.error');
        display_error.removeAttribute('hidden');
        display_error.innerHTML="A colour with this name is already saved in this workspace.";
        return;
    }
    let message = "An error occurred while saving the colour. Please try again.";
    if (data.result==true) {
        message = "The colour " + colour_hex + " has been saved with the name <span class='fst-italic'>" +colour_name + "</span> in your workspace <span class='fst-italic'>" + workspace.name + "</span>.";
    } 

    //empty form
    document.getElementById("colour-input").reset();
    
    //trigger close of modal
    document.getElementById('add-colour-modal-close').click();
    
    //display confirmation message
    commonjs.displayMessage(message);      
}

// Helper function: change background colour of an element
const applyColor = (el, colour) => {
    if (colour) {
        el.style.backgroundColor = colour;
    } else {
        el.style.backgroundColor = '';
    }
};

Element.prototype.prependChild = function(newElement) {
    return this.insertBefore(newElement, this.firstChild);
};


