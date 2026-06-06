// initialise everything
document.addEventListener('DOMContentLoaded', function() {
    
    //set global variables
    const HUE_THRESHOLD=5;
    let WEIGHTS = {
        'hue': 3,
        'saturation': 1,
        'luminance': 2,
    };
    const RELEVANCE_THRESHOLDS=[];
        document.querySelectorAll('#filter-options .select-relevance').forEach (r => {
            //console.log(RELEVANCE_THRESHOLDS);
            RELEVANCE_THRESHOLDS.push(r.dataset.threshold);
        });
    let CALCULATED_HUE=[{'type':'1', 'hue':'0'}];
    let FILTERS= {};

    //indicates that there is no selected colour yet
        //will change to true on the first run of changeColour
    colour_initiated = false;

    //initiate everything
    //initiate colour picker to the background colour of the reference colour (default white)
    initiatePicker(window.getComputedStyle(document.getElementById('selected-colour')).backgroundColor);
    initiateSliders();
    initiateButtons();
    initiateFilters();

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
                if (userInteraction==true) {
                    adjustColour();
                }
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
                if (userInteraction==true) {
                    adjustColour();
                }
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
                if (userInteraction==true) {
                    adjustColour();
                }
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

        function adjustColour() {
        //changes adjusted colour and filters when sliders are moved
            //console.log('adjustColour');
            let h = document.getElementById('hue').value;
            let s = saturation_slider.value()[1];
            let l = luminance_slider.value()[1];
            let new_colour = tinycolor('hsl(' + h + "," + s + "%," + l + "%)").toHexString();
            applyColor(document.getElementById('adjusted-colour'), new_colour);
            document.getElementById('save-adjusted-colour').setAttribute('colour', new_colour);        
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
            applyColor(document.getElementById('adjusted-colour'), current_colour)
            setAdjustments(current_colour);
            //hue may be changed so get new paints and filter 
            refreshPaintList();
        });

        //button to allow use to select colour from saved colours
        const select_saved_colour = document.getElementById('select-saved-colour');
        if (!!select_saved_colour) {
            select_saved_colour.addEventListener('click', function() {
                //display modal
                const modalSelect = new bootstrap.Modal(document.getElementById('select-saved-colour-modal')).show();
                //populate modal to allow user to select from saved colours
                displayColoursInWorkspaces(document.getElementById('modal-select-colour'), 'select');
            });
        }              
        

        //when certain modals are closed, their content should be removed
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

        FILTERS['relevance']=[];
        filters.querySelectorAll('.select-relevance').forEach(e => {
            //only show results above a relevance threshold
            FILTERS['relevance'].push({option: e.value, checked:false, found: false});
            e.addEventListener("change", function() {
                filterList();
            });
        });        

        //add filter options to the filters that aren't preset
        filter_list = filters.querySelectorAll('.filter-dynamic');
        for (destElem of filter_list){
            let filter_details={};
            switch (destElem.id) {
                case 'filter-brand':
                    filter_details={
                        route:'/return-brands-with-paints',
                        id_name: 'brand',
                        label: 'name'
                    }
                    break;
                default:
                    break;
            }
            
            if (!("route" in filter_details)) {
                console.log('There is no switch case for ' + destElem.id);
                continue;
            }
            
            //initiate item for this filter in FILTERS
            FILTERS[filter_details.id_name]=[];
            //get li template
            const template=destElem.querySelector('li.template');
            if (!template) {
                continue;
            }
            //get the list of filter options
            const data = await loadData(filter_details.route);  
            if (!data) {
                continue;
            }
            //create a li for each item in data
            for (const d of data) {
                //clone li template
                let new_li=template.cloneNode(true);
                new_li.id=filter_list.id_name + d.id;
                let e = template.parentNode.appendChild(new_li);
                e.removeAttribute("hidden");
                e.classList.remove('template');
                i=e.querySelector('input');
                i.classList.remove('template');
                l=e.querySelector('label');
                i.value=d.id;
                li_id=filter_details.id_name + "-" + d.id
                i.setAttribute('id', li_id);
                l.setAttribute('for', li_id);
                l.innerHTML=d[filter_details.label];
                //add this option to FILTERS
                FILTERS[filter_details.id_name].push({option: i.value, checked:false, found: false});
                e.addEventListener('click', function() {
                    filterList();
                });
            }
        }
        //console.log(FILTERS);
    }

    //called whenever the colour in the colour picker is changed
    function changeColour() {    
        //apply selected colour to both boxes and save-colour buttons
        document.querySelectorAll('.colour-ref').forEach((elem) => {
            applyColor(elem, current_colour)
        });
        document.querySelectorAll('.add-saved-colour').forEach((button) => {
            button.setAttribute('colour', current_colour);
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
            //this won't run again
            colour_initiated = true;
        }

    }

    //sets HSL inputs when reference colour changes
    function setAdjustments(colour) {
    
        //console.log('setAdjustments');
        hsl = tinycolor(colour.string('rgb')).toHsl();
        document.getElementById('hue').value = Math.round(hsl['h']);
        s = Math.round(100 * hsl['s']);
        saturation_slider.value([0, s]);
        document.getElementById('saturation').value = s;
        l = Math.round(100 * hsl['l']);
        luminance_slider.value([0, l]);
        document.getElementById('luminance').value = l;
    }
    
    //refresh the list of paints when the hue selection or hue_input changes
    async function refreshPaintList(changed_type){
        
        //only populate the list with paints within a threshold of the hue
     
        //get required hues from the filter list
        setCalculatedHue();
        
        //get paints section
        const section=document.getElementById('paints');
        showSpinner(section, true);
        //keep height to stop page jumping around
        temp_height=section.offsetHeight;        
        section.style.minHeight=temp_height+'px';

        const destElem=section.querySelector('#paints-list');
        //hide paints list until done to avoid visual artifacts
        destElem.setAttribute('hidden', 'true');
        //clear the current list to just template        
        const template=destElem.querySelector('#template');
        destElem.innerHTML="";
        destElem.appendChild(template);

        //for each entry in calculated_hue
        for (let i=0; i<CALCULATED_HUE.length; i++) {
           
            //get the paints 
            //returns false on error 
            let paints = await fetchPaints(CALCULATED_HUE[i]);   
            if (!paints){
                return;
            };
            
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
        showSpinner(section, false);
        section.style.minHeight='';
        destElem.removeAttribute('hidden');

        //initiate tool tips for all buttons
        const tooltipTriggerList = destElem.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(
            tooltipTriggerEl))   

        //curate the list of dictionaries calculated_hue
        function setCalculatedHue() {
            //curate the list of dictionaries calculated_hue  
            const base_hue=document.getElementById('hue').value
            CALCULATED_HUE=[];
            document.querySelectorAll('.hue-select-type').forEach (e =>{            
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
                //add text to select for filter
                document.getElementById('hue-select-type-'+ e.value).innerHTML = " - hue " + hue;
                if (e.checked==true) {
                    CALCULATED_HUE.push({'type':e.value, 'hue':hue.toString()});
                }
            });
            //console.log(CALCULATED_HUE);
        }
        
        async function fetchPaints(this_hue){
            //get paints within HUE_THRESHOLD of the specified hue
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
                insert_text(destElem, "Could not load saved paints.");
                return false;
            }
            return data;
        }

        function create_row(p, this_hue) {
        //creates a new '.item-card' element for paint p
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
            item_card.dataset.hueDiff=p.difference;
            item_card.dataset.brand=p.brand_id;
            item_card.querySelector('.brand-name').innerHTML=p.brand_name;
            item_card.querySelector('.paint-name').innerHTML=p.paint_name;
            item_card.querySelector('.colour-holder').style.backgroundColor='#'+p.hex;
            item_card.querySelector('.hsl').innerHTML="HSL(" + p.H + ", " + p.S +"%, " + p.L +"%)"
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

        function setButtons(e, p){
        //add event listeners to buttons in the row
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
                    if (paint['id']=="") {
                        return; 
                    }
                    //display modal
                    const modalSavePaint = new bootstrap.Modal(document.getElementById('add-saved-paint-modal')).show();
                    //populate modal to allow user to select workspace to save paint into
                    displayPaintsInWorkspaces(document.getElementById('modal-add-paint'), paint);
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

    //recalculate all rankings when saturation/hue changes
    function calculateRankings(){
        //recalculate ranking for every paint item
        const items = destElem.querySelectorAll("#paints-list .item-card");
        for (e of items) {
            setPaintRanking(e, {'saturation': document.getElementById('saturation').value, 'luminance': document.getElementById('luminance').value})
        } 
    }

    //calculate and set ranking for a paint based on the calculated hue relevant to that input
    function setPaintRanking(e, inputs) {    
    //runs when the whole paint list is refreshed, or when the saturation/luminance inputs are changed
        let distances = {};
        //get distances between the element's attributes and the adjusted colour (for this specific calculated hue)
        distances['hue']=e.dataset.hueDiff;
        distances['saturation'] = getSatDifference(inputs.saturation, e.dataset.saturation);
        distances['luminance'] = getSatDifference(inputs.luminance, e.dataset.luminance);
        e.dataset.satDiff=distances['saturation'];
        e.dataset.lumDiff=distances['luminance'];
        
        //calculate the ranking value for this element
        let ranking=0;
        const NAMES = ['hue', 'saturation', 'luminance'];
        NAMES.forEach(name => {
            ranking += distances[name] * WEIGHTS[name];
        });
        //normalise total
        max_total = WEIGHTS['hue'] * 50 + WEIGHTS['saturation'] * 20 + WEIGHTS['luminance'] * 20;
        ranking = Math.round(100 * (max_total - ranking) / max_total);
        
        e.dataset.ranking= ranking;
        e.querySelector('.relevance').innerHTML = ranking + "%";
                                
        //set border width by relevance: 100% gives 0.2 rem, 60% gives 0.01 rem
        let border_width = 0.00475 * ranking - 0.275
        e.style.borderWidth = border_width + "rem";

        function getSatDifference(sat1, sat2) {
            const diff = Math.abs(sat1 - sat2);
            if (diff < 0) { diff = 0 }
            if (diff > 100) { diff = 100 }
            return diff;   
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

        //update FILTERS with which options are checked
        updateFilterVariable();

        destElem = document.getElementById('paints-list');
        //check every paint item
        const items = destElem.querySelectorAll(".item-card");
        for (e of items) {
            //ignore the template 
            if (e.id == 'template'){
                continue;    
            }  
            if (applyFilters(e)==true){
                results=true;
            };              
        };      
        console.log(FILTERS);
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


        function updateFilterVariable(){
        //update the variable FILTERS with selected/not selected filter options
            for (const [filter_name]  of Object.entries(FILTERS)){
                let one_checked=false;
                //don't need to do it for relevance
                if (filter_name != 'relevance') {
                    let filter_section=document.getElementById('filter-'+ filter_name);
                    for ( let i = 0; i < FILTERS[filter_name].length; i++ ) {
                        let o = FILTERS[filter_name][i];  
                        //re-initialise found
                        o.found=false; 
                        //note whether the option is checked 
                        o.checked=filter_section.querySelector('#' + filter_name + '-' + o.option).checked;  
                        if (o.checked ){
                            //note that at least one option in the filter is checked
                            one_checked=true;
                        }
                    } 
                    //if none of the options were checked, consider them all checked
                    if (!one_checked) {
                        for ( let i = 0; i < FILTERS[filter_name].length; i++ ) {
                            FILTERS[filter_name][i].checked=true;
                        }
                    }
                }
            }
        }

        //hide an element as required by selected filter options
        function applyFilters(e){
           
            let matches=0;
            let num_filters=Object.entries(FILTERS).length;
            
            //iterate through filters
            for (const [filter_name, options]  of Object.entries(FILTERS)){
                if (filter_name != 'relevance') {  
                    //get option for this filter from the element              
                    let element_option = e.dataset[filter_name];
                    //find the option in the array
                    result=options.find(x => x.option === element_option);
                    //if this option is checked, it's a match
                    if (result.checked==true) {
                        matches++;                        
                    }  
                    //note that the option exists in the list
                    result.found=true;                  
                } else {
                    //filter by ranking threshold            
                    if (Number(e.dataset.ranking) >= Number(ranking_threshold))  {
                        //it's a match       
                        matches++;  
                    }
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

        function sortList(items){
            //TODO add other sort options

            //sort by ranking
            elements = Array.from(items);
            elements.sort(function(a, b) {
                return b.dataset.ranking - a.dataset.ranking;
            });
            // Append the sorted items back to the wrapper
            elements.forEach(function(element) {
                destElem.appendChild(element);
            });
        }   
        
        function updateFilters(){
            //grey out options in the filters that aren't available
            const filters=document.getElementById('filter-options');
            for (const [filter_name, options]  of Object.entries(FILTERS)){
                if (filter_name != 'relevance'){
                    for (e of filters.querySelectorAll('.select-' + filter_name)) {
                        if (!(e.classList.contains ('template'))) {                        
                            //get value for this option from the element              
                            result=options.find(x => x.option === e.value);
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

// Helper function: change background colour of an element
    const applyColor = (el, colour) => {
        if (colour) {
            el.style.backgroundColor = colour
        } else {
            el.style.backgroundColor = ''
        }
    }

});