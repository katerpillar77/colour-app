
//js for account page
document.addEventListener('DOMContentLoaded', function() {

    let field_name = document.getElementById('field-name').querySelector('.form-control');
    let field_email = document.getElementById('field-email').querySelector('.form-control');
    let field_name_orig = field_name.value;
    let field_email_orig = field_email.value;
    let button_name = document.getElementById('button-name').querySelector('.btn');
    let button_email = document.getElementById('button-email').querySelector('.btn');
    button_name.disabled = true;
    button_email.disabled = true;
    field_name.addEventListener('input', () => { 
        if (field_name.value != field_name_orig) {
            //console.log (field_name.value);
            button_name.disabled = false;
        } else{
            button_name.disabled = true;
        }
    });
    field_email.addEventListener('input', () => { 
        if (field_email.value != field_email_orig) {
            //console.log (field_name.value);
            button_email.disabled = false;
        } else{
            button_email.disabled = true;
        }
    });
    
})