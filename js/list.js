try{
    function editPage(){
        // Get the container for the search results, with the ol containers that hold the individual results.
        let container = Array.prototype.slice.call(document.querySelectorAll('[data-instant-search-output="results"]')[0]['children']);
        for(let i = 0; i < container.length;i++){
            // Only the ol elements contain results, so lets get rid of the divs and uls containing ads and "recommendations".
            if(container[i].localName === "div" || container[i].localName === "ul"){
                chrome.storage.sync.get({
                    removeAdverts: false
                }, function(item) {
                    if(item.removeAdverts === true){
                        container[i].remove();
                    }
                });
            } else {
                // Loop through the individual search results, being the houses.
                for(let x = 0; x < container[i]['children'].length;x++){
                    let searchResult = container[i]['children'][x];

                    // Extract the price.
                    let price = searchResult.getElementsByClassName('search-result-price')[0].innerText.replace(/\./g,'').replace(/€/g,'').replace(/kk/g,'').replace(/\/mnd/g,'').replace(/von/g,'');
                    //let adres = searchResult.getElementsByClassName('search-result-title')[0].innerText;

                    if(window.location.href.includes("huur")){
                        try{
                            let prices = price.match(/.*\s(\d{1,})\stot.*/);
                            price = prices[1];
                        }
                        catch{
                            //console.log("Geen variable kosten gevonden.");
                        }
                    }

                    function removeSimilar(){
                        try{
                            let similar = searchResult.getElementsByClassName("search-result-similar")[0];
                            similar.remove();
                        }
                        catch{
                            //console.log("No similar results found.");
                        }
                    }

                    function removePromo(){
                        try{
                            let promotext = searchResult.getElementsByClassName("search-promo-text")[0];
                            let promolabel = searchResult.getElementsByClassName("search-promolabel")[0];

                            promotext.remove();
                            promolabel.remove();
                        }
                        catch{
                            //console.log("No promo materials found.");
                        }

                        let makelaar = searchResult.getElementsByClassName("search-result-makelaar")[0];
                        makelaar.remove();
                    }

                    function showWoon(){
                        let woonoppervlakte = "";

                        try{
                            woonoppervlakte = searchResult.querySelector('[title="Woonoppervlakte"]').innerText.replace(" m²","").replace(".","");
                            // Create the result elements
                            let gemiddelde = document.createElement("ul");
                            gemiddelde.setAttribute("class","search-result-kenmerken");
                            let gemiddeldeTekst = document.createTextNode("Woonoppervlakte prijs per m²: €" + Number(Math.round(price / woonoppervlakte)).toLocaleString('nl-NL'));
                            gemiddelde.appendChild(gemiddeldeTekst);
                            searchResult.children[1].children[1].children[0].children[2].appendChild(gemiddelde);
                        }
                        catch (err) {
                            //console.log("Geen woonoppervlakte voor deze advertentie gevonden: " + adres);
                        }
                    }

                    function showPerceel(){
                        let perceeloppervlakte = "";

                        try{
                            perceeloppervlakte = searchResult.querySelector('[title="Perceeloppervlakte"]').innerText.replace(" m²","").replace(".","");
                            // Create the result elements
                            let gemiddelde = document.createElement("ul");
                            gemiddelde.setAttribute("class","search-result-kenmerken");
                            let gemiddeldeTekst = document.createTextNode("Perceeloppervlakte prijs per m²: €" + Number(Math.round(price / perceeloppervlakte)).toLocaleString('nl-NL'));
                            gemiddelde.appendChild(gemiddeldeTekst);
                            searchResult.children[1].children[1].children[0].children[2].appendChild(gemiddelde);
                        }
                        catch (err) {
                            //console.log("Geen perceeloppervlakte voor deze advertentie gevonden: " + adres);
                        }
                    }

                    chrome.storage.sync.get({
                        removeSimilar: false,
                        removePromo: false,
                        showWoon: true,
                        showPerceel: false,
                    }, function(items) {
                        if(items.removeSimilar){
                            removeSimilar();
                        }
                        if(items.removePromo){
                            removePromo();
                        }
                        if(items.showWoon){
                            showWoon();
                        }
                        if(items.showPerceel){
                            showPerceel()
                        }
                    });
                }
            }
        }
    }

//First execution, the next ones will be activated by the mutation observer
    editPage();
    let waiting = false;

// Select the node that will be observed for mutations
    let targetNode = document.getElementsByClassName("search-content-output")[0];

// Options for the observer (which mutations to observe)
    let config = {childList: true};

// Callback function to execute when mutations are observed
    let callback = function(mutationsList) {
        for(let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                if(!waiting){
                    waiting = true;
                    editPage();
                    observer.disconnect();
                    window.setTimeout(function(){
                        observer.observe(targetNode, config);
                        waiting = false;
                    },1000);
                }
            }
        }
    };

// Create an observer instance linked to the callback function
    let observer = new MutationObserver(callback);


// Start observing the target node for configured mutations after initial load
    window.setTimeout(function(){
        observer.observe(targetNode, config);
    },2000);
}
catch{
    let price = document.getElementsByClassName("object-header__price")[0].innerText.replace(/\./g,"").replace(/€/g,"").replace(/kk/g,"").replace(/\/mnd/g,"").replace(/von/g,"");
    let adres = document.getElementsByClassName("object-header__address")[0].innerText;

    if(window.location.href.includes("huur")){
        try{
            let prices = price.match(/.*\s(\d{1,})\stot.*/);
            price = prices[1];
        }
        catch{
            //console.log("Geen variable kosten gevonden.");
        }
    }

    function showWoon(){
        let woonoppervlakte = "";

        try{
            woonoppervlakte = document.querySelector('[title="Woonoppervlakte"]').innerText.replace(" m²","").replace(".","");
            // Create the result elements
            let gemiddelde = document.createElement("ul");
            gemiddelde.setAttribute("class","search-result-kenmerken");
            let gemiddeldeTekst = document.createTextNode("Woonoppervlakte prijs per m²: €" + Number(Math.round(price / woonoppervlakte)).toLocaleString('nl-NL'));
            gemiddelde.appendChild(gemiddeldeTekst);
            searchResult.children[1].children[1].children[0].children[2].appendChild(gemiddelde);
        }
        catch (err) {
            //console.log("Geen woonoppervlakte voor deze advertentie gevonden: " + adres);
        }
    }

    function getWOZ(){
        let url = "https://www.wozwaardeloket.nl/api/geocoder/v2/suggest?query=" + encodeURI(adres);
        let kenmerken = document.getElementsByClassName("object-kenmerken-group-list")[1].children[0];

        let waardeTitel = document.createElement("dt");
        let waardeTitelTekst = document.createTextNode("WOZ Waarde");
        waardeTitel.appendChild(waardeTitelTekst);
        let waardeInhoud = document.createElement("dd");
        waardeInhoud.setAttribute("id", "woz-waarde");
        let waardeInhoudTekst = document.createTextNode("Klik hier");
        waardeInhoud.appendChild(waardeInhoudTekst);

        let meetdatum = document.createElement("dt");
        let meetdatumTekst = document.createTextNode("Meetdatum");
        meetdatum.appendChild(meetdatumTekst);
        let meetdatumInhoud = document.createElement("dd");
        meetdatumInhoud.setAttribute("id", "woz-meet");
        let meetdatumInhoudTekst = document.createTextNode(" - ");
        meetdatumInhoud.appendChild(meetdatumInhoudTekst);

        let ingangsdatum = document.createElement("dt");
        let ingangsdatumTekst = document.createTextNode("Ingangsdatum");
        ingangsdatum.appendChild(ingangsdatumTekst);
        let ingangsdatumInhoud = document.createElement("dd");
        ingangsdatum.setAttribute("id", "woz-ingang");
        let ingangsdatumInhoudTekst = document.createTextNode(" - ");
        ingangsdatumInhoud.appendChild(ingangsdatumInhoudTekst);

        kenmerken.appendChild(waardeTitel);
        kenmerken.appendChild(waardeInhoud);
        kenmerken.appendChild(meetdatum);
        kenmerken.appendChild(meetdatumInhoud);
        kenmerken.appendChild(ingangsdatum);
        kenmerken.appendChild(ingangsdatumInhoud);

        /*$.get(url, function(data) {
            let id = data["docs"][0]["id"];
            let adres = data["docs"][0]["weergavenaam"];

            url = "https://www.wozwaardeloket.nl/api/geocoder/v2/lookup?id=" + encodeURI(id);

            window.setTimeout(function(){
                $.get(url, function(details) {
                    window.setTimeout(function(){
                        $.ajax({
                            type: "POST",
                            url: "https://www.wozwaardeloket.nl/woz-proxy/wozloket",
                            data: '<?xml version="1.0" encoding="UTF-8"?><wfs:GetFeature xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" service="WFS" version="1.1.0" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">' +
                                    '<wfs:Query xmlns:WozViewer="http://WozViewer.geonovum.nl" xmlns:ogc="http://www.opengis.net/ogc" typeName="wozloket:woz_woz_object" srsName="EPSG:28992">' +
                                        '<ogc:Filter>' +
                                            '<ogc:PropertyIsEqualTo matchCase="true">' +
                                                '<ogc:PropertyName>wobj_bag_obj_id</ogc:PropertyName>' +
                                                '<ogc:Literal>' + details["adresseerbaarobject_id"].substr(1) + '</ogc:Literal>' +
                                            '</ogc:PropertyIsEqualTo>' +
                                        '</ogc:Filter>' +
                                    '</wfs:Query>' +
                                '</wfs:GetFeature>',
                            success: function(data){
                                let date = "00-00-0000";
                                let element = 0;

                                for(let i=0;i<data["features"].length;i++){
                                    let entry = data["features"][i]["properties"];
                                    if(entry["wobj_wrd_ingangsdatum"] > date){
                                        date = entry["wobj_wrd_peildatum"];
                                        element = i;
                                    }
                                }

                                let entry = data["features"][element]["properties"];
                                console.log("Voor " +  adres + " is vanaf " + entry["wobj_wrd_ingangsdatum"] + " de WOZ waarde: €" + Number(entry["wobj_wrd_woz_waarde"]).toLocaleString('nl-NL'));
                            }
                        });
                    },2000)
                });
            },2000);
        });*/
    }

    chrome.storage.sync.get({
        removeSimilar: false,
        removePromo: false,
        showWoon: true,
        showPerceel: false,
        getWOZ: false
    }, function(items) {
        if(items.removeSimilar){
            //removeSimilar();
        }
        if(items.removePromo){
            //removePromo();
        }
        if(items.showWoon){
            showWoon();
        }
        if(items.showPerceel){
            //showPerceel()
        }
        if(items.getWOZ){
            getWOZ();
        }
    });
}