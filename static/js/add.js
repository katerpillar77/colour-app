
// initialise everything
document.addEventListener('DOMContentLoaded', function() {
    initiatePicker();
});


//Initiate the color picker
function initiatePicker(current_colour) {

    //Initiate picker
    const picker = new ColorPicker('#picker', {
        showClearButton: true,
        enableAlpha: false,
        submitMode: 'instant',
        dialogPlacement: 'bottom'
    });
    //open picker
     picker.prompt();
    //Action when colour is chosen
    picker.on('pick', colour => {
        //put hexcode in hidden hex field
        document.getElementById('hex').value=colour.toString();
    });
    //prevent picker from closing
    picker.on('close', () => {
        picker.open();
    });
}
