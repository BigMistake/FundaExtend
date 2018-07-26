function editPage(){
    let container = "";

    try{
        container = Array.prototype.slice.call(document.getElementsByClassName('slick-track')[0]['children']);
    }
    catch{
        container = Array.prototype.slice.call(document.getElementsByClassName('search-map-infowindow__list')[0]['children']);
    }

    for(let i = 0; i < container.length;i++){

        // Extract the price.
        let price = container[i].getElementsByClassName('search-result-price')[0].innerText.replace(/\./g,'').replace(/€/g,'').replace(/kk/g,'').replace(/\/mnd/g,'').replace(/von/g,'');

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
                let similar = container[i].getElementsByClassName("search-result-similar")[0];
                similar.remove();
            }
            catch{
                //console.log("No similar results found.");
            }
        }

        function addWoon(){
            let woonoppervlakte = "";

            try{
                woonoppervlakte = container[i].querySelector('[title="Woonoppervlakte"]').innerText.replace(" m²","").replace(".","");
                // Create the result elements
                let gemiddelde = document.createElement("ul");
                gemiddelde.setAttribute("class","search-result-kenmerken");
                let gemiddeldeTekst = document.createTextNode("Woonoppervlakte prijs per m²: €" + Number(Math.round(price / woonoppervlakte)).toLocaleString('nl-NL'));
                gemiddelde.appendChild(gemiddeldeTekst);
                container[i].children[1].children[1].children[0].children[2].appendChild(gemiddelde);
            }
            catch (err) {
                //console.log("Geen woonoppervlakte voor deze advertentie gevonden: " + adres);
            }
        }

        function addPerceel(){
            //let adres = container[i].getElementsByClassName('search-result-title')[0].innerText;
            let perceeloppervlakte = "";

            try{
                perceeloppervlakte = container[i].querySelector('[title="Perceeloppervlakte"]').innerText.replace(" m²","").replace(".","");
                // Create the result elements
                let gemiddelde = document.createElement("ul");
                gemiddelde.setAttribute("class","search-result-kenmerken");
                let gemiddeldeTekst = document.createTextNode("Perceeloppervlakte prijs per m²: €" + Number(Math.round(price / perceeloppervlakte)).toLocaleString('nl-NL'));
                gemiddelde.appendChild(gemiddeldeTekst);
                container[i].children[1].children[1].children[0].children[2].appendChild(gemiddelde);
            }
            catch (err) {
                //console.log("Geen perceeloppervlakte voor deze advertentie gevonden: " + adres);
            }
        }

        chrome.storage.sync.get({
            removeSimilar: false,
            showWoon: true,
            showPerceel: false,
        }, function(items) {
            if(items.removeSimilar){
                removeSimilar();
            }
            if(items.showWoon){
                addWoon();
            }
            if(items.showPerceel){
                addPerceel()
            }
        });
    }
}

let waiting = false;
// Select the node that will be observed for mutations
let targetNode = document.getElementsByClassName("search-map-infowindow__list")[0];

// Options for the observer (which mutations to observe)
let config = { attributes: true, childList: true, subtree: true };

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

// Start observing the target node for configured mutations
observer.observe(targetNode, config);