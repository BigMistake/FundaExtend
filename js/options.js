function save_options() {
    let removeAdverts = document.getElementById('adverts').checked;
    let removeSimilar = document.getElementById('similar').checked;
    let removePromo = document.getElementById('promo').checked;
    let showWoon = document.getElementById('woon').checked;
    let showPerceel = document.getElementById('perceel').checked;
    let showCustomSort = document.getElementById('customsort').checked;

    chrome.storage.sync.set({
        removeAdverts: removeAdverts,
        removeSimilar: removeSimilar,
        removePromo: removePromo,
        showWoon: showWoon,
        showPerceel: showPerceel,
        showCustomSort: showCustomSort
    }, function() {
        let status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
            window.close();
        }, 750);
    });
}

function editPermissions(){
    function requestPermission(){
        chrome.permissions.request({
            origins: ["https://www.wozwaardeloket.nl/"]
        }, function(granted) {
            if (granted) {
                //console.log("Toestemming verlenen is gelukt");
                chrome.storage.sync.set({
                    getWOZ: true
                });
            } else {
                //console.log("Toestemming verlenen is niet gelukt.");
                document.getElementById("woz").checked = false;
            }
        });
    }

    function removePermission(){
        chrome.permissions.remove({
            origins: ["https://www.wozwaardeloket.nl/"]
        }, function(removed) {
            if (removed) {
                //console.log("Toestemming intrekken is gelukt.");
                chrome.storage.sync.set({
                    getWOZ: false
                });
            } else {
                //console.log("Toestemming intrekken is niet gelukt.");
                document.getElementById("woz").checked = true;
            }
        });
    }

    if(document.getElementById("woz").checked){
        //console.log("Toestemming moet nu gevraagd worden.");
        requestPermission();
    }
    else {
        //console.log("Toestemming moet nu verwijderd worden.");
        removePermission();
    }
}

function checkPermissions(){
    chrome.permissions.contains({
        origins: ["https://www.wozwaardeloket.nl/"]
    }, function(result) {
        if (result) {
            document.getElementById("woz").checked = true;
            console.log("Toestemming gevonden.");
        } else {
            document.getElementById("woz").checked = false;
            console.log("Toestemming niet gevonden.");
        }
    });
}

function restore_options() {
    chrome.storage.sync.get({
        removeAdverts: true,
        removeSimilar: true,
        removePromo: false,
        showWoon: true,
        showPerceel: false,
        showCustomSort: true,
    }, function(items) {
        document.getElementById('adverts').checked = items.removeAdverts;
        document.getElementById('similar').checked = items.removeSimilar;
        document.getElementById('promo').checked = items.removePromo;
        document.getElementById('woon').checked = items.showWoon;
        document.getElementById('perceel').checked = items.showPerceel;
        document.getElementById('customsort').checked = items.showCustomSort;
    });
}

document.addEventListener('DOMContentLoaded', function () {
    restore_options();
    checkPermissions();
    document.querySelector('#woz').addEventListener('click', editPermissions);
    document.querySelector('#save').addEventListener('click', save_options);
});