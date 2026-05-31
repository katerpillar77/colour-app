
document.addEventListener('DOMContentLoaded', function() {
    //remove focus from buttons that open modals to avoid aria warning
    document.querySelectorAll('.modal').forEach((modal) => {
        modal.addEventListener('hide.bs.modal', () => {
            document.activeElement.blur();
        });
    });
    //initiate tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(
        tooltipTriggerEl))
})
