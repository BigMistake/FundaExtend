function addPrice(){
    // Get the container for the search results, with the ol containers that hold the individual results.
    let container = Array.prototype.slice.call(document.querySelectorAll('[data-instant-search-output="results"]')[0]['children']);
    for(let i = 0; i < container.length;i++){
        // Only the ol elements contain results, so lets get rid of the divs and uls containing ads and "recommendations".
        if(container[i].localName === "div" || container[i].localName === "ul"){
            container[i].remove();
        } else {
            // Loop through the individual search results, being the houses.
            for(let x = 0; x < container[i]['children'].length;x++){
                let searchResult = container[i]['children'][x];
                let type;

                // Extract the price.
                let price = searchResult.getElementsByClassName('search-result-price')[0].innerText.replace(/\./g,'').replace(/€/g,'').replace(/kk/g,'').replace(/\/mnd/g,'').replace(/v\.o\.n\./g,'');

                if(type === "huur"){
                    try{
                        let prices = price.match(/.*\s(\d{1,})\stot.*/);
                        price = prices[1];
                    }
                    catch{
                        //console.log("Geen variable kosten gevonden.");
                    }
                }

                //let adres = searchResult.getElementsByClassName('search-result-title')[0].innerText;
                let perceeloppervlakte = "";
                let woonoppervlakte = "";

                try{
                    woonoppervlakte = searchResult.querySelector('[title="Woonoppervlakte"]').innerText.replace(" m²","").replace(".","");
                    // Create the result elements
                    let gemiddelde = document.createElement("ul");
                    gemiddelde.setAttribute("class","search-result-kenmerken");
                    let gemiddeldeTekst = document.createTextNode("Woonoppervlakte prijs per m²: €" + Math.round(price / woonoppervlakte));
                    gemiddelde.appendChild(gemiddeldeTekst);
                    searchResult.children[1].children[1].children[0].children[2].appendChild(gemiddelde);
                }
                catch (err) {
                    //console.log("Geen woonoppervlakte voor deze advertentie gevonden: " + adres);
                }

                try{
                    perceeloppervlakte = searchResult.querySelector('[title="Perceeloppervlakte"]').innerText.replace(" m²","").replace(".","");
                    // Create the result elements
                    let gemiddelde = document.createElement("ul");
                    gemiddelde.setAttribute("class","search-result-kenmerken");
                    let gemiddeldeTekst = document.createTextNode("Perceeloppervlakte prijs per m²: €" + Math.round(price / perceeloppervlakte));
                    gemiddelde.appendChild(gemiddeldeTekst);
                    searchResult.children[1].children[1].children[0].children[2].appendChild(gemiddelde);
                }
                catch (err) {
                    //console.log("Geen perceeloppervlakte voor deze advertentie gevonden: " + adres);
                }
            }
        }
    }
}

let type;

//First execution, the next ones will be activated by the mutation observer
addPrice();

// Select the node that will be observed for mutations
let targetNode = document.getElementsByClassName("search-content-output")[0];

// Options for the observer (which mutations to observe)
let config = { attributes: true, childList: true, subtree: true };

// Callback function to execute when mutations are observed
let callback = function(mutationsList) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            //setTimeout(addPrice(),5000);
        }
    }
};

// Create an observer instance linked to the callback function
let observer = new MutationObserver(callback);

// Start observing the target node for configured mutations
observer.observe(targetNode, config);