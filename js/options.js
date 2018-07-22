console.log("Test");
function save_options() {
    let removeAdverts = document.getElementById('adverts').checked;
    let removeSimilar = document.getElementById('similar').checked;
    let showWoon = document.getElementById('woon').checked;
    let showPerceel = document.getElementById('perceel').checked;
    let getWOZ = document.getElementById('woz').checked;

    chrome.storage.sync.set({
        removeAdverts: removeAdverts,
        removeSimilar: removeSimilar,
        showWoon: showWoon,
        showPerceel: showPerceel,
        getWOZ: getWOZ
    }, function() {
        let status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
            window.close();
        }, 750);
    });
}

function restore_options() {
    chrome.storage.sync.get({
        removeAdverts: true,
        removeSimilar: false,
        showWoon: true,
        showPerceel: true,
        getWOZ: false
    }, function(items) {
        document.getElementById('adverts').checked = items.removeAdverts;
        document.getElementById('similar').checked = items.removeSimilar;
        document.getElementById('woon').checked = items.showWoon;
        document.getElementById('perceel').checked = items.showPerceel;
        document.getElementById('woz').checked = items.getWOZ;
    });
}
document.addEventListener('DOMContentLoaded', function () {
    restore_options();
    document.querySelector('#save').addEventListener('click', save_options);
});