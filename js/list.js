const resultContainer = "[data-instant-search-output=\"results\"]";
const priceContainer = "search-result-price";
const similarContainer = "search-result-similar";
const promoTextContainer = "search-promo-text";
const promoLabelContainer = "search-promolabel";
const promoClass = "search-result-main-promo";
const promoResult = "promo";
const promoLabels = "search-result-header-labels-col";
const uitgelichtClass = "top-position";
const makelaarContainer = "search-result-makelaar";
const woonOppervlakteContainer = "[title=\"Gebruiksoppervlakte wonen\"]";
const perceelOppervlakteContainer = "[title=\"Perceeloppervlakte\"]";
const searchContainer = "search-content-toggle";
const userObject = "user-save-object";
const addObject = "[data-save-object-handle=\"add\"]";
const removeObject = "[data-save-object-handle=\"remove\"]";
const itemAttributes = [{"naam": "price","weergave" : "Vraagprijs"},{"naam":"woon","weergave":"Woonoppervlakte"},{"naam":"woonprice","weergave":"Woonoppervlakte Prijs"},{"naam":"perceel","weergave":"Perceeloppervlakte"},{"naam":"perceelprice","weergave":"Perceeloppervlakte Prijs"},{"naam":"kamers","weergave":"Kamers"},{"naam":"plaats","weergave":"Plaats"},{"naam":"postcode","weergave":"Postcode"},{"naam":"adres","weergave":"Adres"}];

let currentPage = 1;
let parameters = new FormData();
let results =[];
let nextPage = true;
let locatie = "";

optionItems = {similar:false,promo:false,woon:false,perceel:false,sort:false};

chrome.storage.sync.get({
    removeSimilar: false,
    removePromo: false,
    showWoon: true,
    showPerceel: false,
    showCustomSort: true,
}, function(items) {
    if(items.removeSimilar){
        optionItems.similar = true;
    }
    if(items.removePromo){
        optionItems.promo = true;
    }
    if(items.showWoon){
        optionItems.woon = true;
    }
    if(items.showPerceel){
        optionItems.perceel = true;
    }
    if(items.showCustomSort){
        optionItems.sort = true;
    }
});

if(window.location.href.includes("huur")){
    locatie = "huur"
} else if(window.location.href.includes("koop")){
    locatie = "koop";
}

function prepAlternateSort(){
    let searchType = document.getElementsByClassName(searchContainer)[0];
    $(searchType).prepend("<a class=\"search-content-toggle__view-type\" id='extend'>" +
        "<span style='.search-content-toggle__view-type.is-active {display:table-cell;color:#0071b3;border-bottom-color:#0071b3;background-color:#e6f2f7;}' class=\"icon icon-list-blue\"></span>" +
            "Extend" +
        "</a>");
    document.getElementById('extend').addEventListener('click', initAlternateSort);
}

function initAlternateSort(){
    if(!$('#extend').hasClass("is-active")){
        $(".search-content-toggle__view-type:nth-child(2)").removeClass("is-active");
        $("#extend").addClass("is-active");
        $(resultContainer).hide();
        $(".search-content-output-extend").show();
        $(".result-sorting").hide();
        $(".map__type-select").hide();

        let style = document.createElement('style');
        document.head.appendChild(style);
        style.sheet.insertRule('.paginationjs-page {display: inline}');
        style.sheet.insertRule('.paginationjs-page.active a {color: #fff; background: #f7a100}');

        $(".search-scroll-notify").attr("style","");

        let selection = "";
        itemAttributes.forEach(function(element) {
            selection += "<option value=\"" + element["naam"] +"\">" + element["weergave"] + "</option>";
        });

        $(".search-content-header-bottom").prepend("<fieldset class='result-sorting'>" +
                                                                "<label class='result-sorting-label'>Sorteer op: </label>" +
                                                                "<select class='result-sorting-select' id='sortResults'>" +
                                                                     selection +
                                                                "</select>" +
                                                            "</fieldset>");

        document.getElementById('sortResults').addEventListener('change', onChange);

        $(resultContainer).after("<div class='search-content-output-extend' data-instant-search-output='results'></div>");
        $(".search-content-output-extend").attr("id","data-container");

        $("nav.pagination").replaceWith("<nav class=\"pagination\">" +
                                            "<div class=\"pagination-pages\" id=\"pagination-container\">" +
                                            "</div>" +
                                        "</nav>");
        getAlternateSort(locatie);

        $('#pagination-container').pagination({
            dataSource: results,
            pageSize: 15,
            showPrevious: false,
            showNext: false,
            callback: function(data, pagination) {
                let html = fillAlternateSort(data);
                $('#data-container').html(html);
            }
        });

        $(".search-content").append("<div class=\"search-scroll-notify\" data-component=\"search-scroll-notify\" data-search-scroll-notify=\"\">" +
                                        "<div class=\"search-scroll-notify-notification is-active\" data-search-scroll-notification=\"\">" +
                                            "<h3 data-instant-search-output=\"total\">" +
                                                (results.length === 1 ? results.length + " resultaat" : results.length + " resultaten") +
                                            "</h3>" +
                                            "<a href=\"#content\" class=\"search-scroll-notify-anchor\" search-scroll-notify-anchor=\"\">↑ Naar bovenkant van de pagina</a>" +
                                        "</div>" +
                                    "</div>");
    }
}

function getAlternateSort(locatie){
    parameters.append("previousState","");
    parameters.append("filter_location",$("[name=filter_location]")[0]["value"]);
    parameters.append("autocomplete-identifier",$("[name=autocomplete-identifier]")[0]["value"]);
    parameters.append("filter_Straal",$("option:selected",$("[name=filter_Straal]")[0])[0]["value"]);
    parameters.append("filter_ZoekType",$("[name=filter_ZoekType]")[0]["value"]);
    parameters.append("sort",$("[name=sort]")[0]["value"]);
    parameters.append("search-map-type-control-top",$("[name=search-map-type-control-top]")[0]["value"]);

    if(locatie === "koop"){
        parameters.append("filter_KoopprijsVan",$("option:selected",$("[name=filter_KoopprijsVan]")[0])[0]["value"]);
        parameters.append("filter_KoopprijsVan","");
        parameters.append("filter_KoopprijsTot",$("option:selected",$("[name=filter_KoopprijsTot]")[0])[0]["value"]);
        parameters.append("filter_KoopprijsTot","");
        parameters.append("filter_SoortObject",$("[name=filter_SoortObject]:checked")[0]["value"]);

        parameters.append("filter_WoningSoort","active");
        let woningSoorten = $("[name=filter_WoningSoort]:checked");
        if(woningSoorten.length){
            for(let i = 0; i < woningSoorten.length; i++){
                parameters.append("filter_WoningSoort",woningSoorten[i]["value"]);
            }
        }

        parameters.append("filter_WoningType","active");
        let woningTypes = $("[name=filter_WoningType]:checked");
        if(woningTypes.length){
            for(let i = 0; i < woningTypes.length; i++){
                parameters.append("filter_WoningType",woningTypes[i]["value"]);
            }
        }

        parameters.append("filter_SoortAppartementId","active");
        let appartementSoorten = $("[name=filter_SoortAppartementId]:checked");
        if(appartementSoorten.length){
            for(let i = 0; i < appartementSoorten.length; i++){
                parameters.append("filter_SoortAppartementId",appartementSoorten[i]["value"]);
            }
        }

        parameters.append("filter_AppartementType","active");
        let appartementTypes = $("[name=filter_AppartementType]:checked");
        if(appartementTypes.length){
            for(let i = 0; i < appartementTypes.length; i++){
                parameters.append("filter_AppartementType",appartementTypes[i]["value"]);
            }
        }

        parameters.append("filter_SoortParkeergelegenheidId","active");
        let parkeerTypes = $("[name=filter_SoortParkeergelegenheidId]:checked");
        if(parkeerTypes.length){
            for(let i = 0; i < parkeerTypes.length; i++){
                parameters.append("filter_SoortParkeergelegenheidId",parkeerTypes[i]["value"]);
            }
        }

        parameters.append("filter_AutoCapaciteitParkeergelegenheid",$("[name=filter_AutoCapaciteitParkeergelegenheid]:checked")[0]["value"]);

        let filter_IndBouwrijp = "";
        let bouwrijp = $("[name=filter_IndBouwrijp]:checked");
        if(bouwrijp.length){
            filter_IndBouwrijp = bouwrijp[0]["value"];
        }
        parameters.append("filter_IndBouwrijp",filter_IndBouwrijp);

        let filter_PublicatieDatum = "";
        let publicatie = $("[name=filter_PublicatieDatum]:checked");
        if(publicatie.length){
            filter_PublicatieDatum = publicatie[0]["value"];
        }
        parameters.append("filter_PublicatieDatum",filter_PublicatieDatum);

        let filter_AantalKamers = "";
        let kamers = $("[name=filter_AantalKamers]:checked");
        if(kamers.length){
            filter_AantalKamers = kamers[0]["value"];
        }
        parameters.append("filter_AantalKamers",filter_AantalKamers);

        parameters.append("filter_AantalKamers-range-min",$("[name=filter_AantalKamers-range-min]")[0]["value"]);
        parameters.append("filter_AantalKamers-range-max",$("[name=filter_AantalKamers-range-max]")[0]["value"]);

        let filter_WoonOppervlakte = "";
        let woonoppervlakte = $("[name=filter_WoonOppervlakte]:checked");
        if(woonoppervlakte.length){
            filter_WoonOppervlakte = woonoppervlakte[0]["value"];
        }
        parameters.append("filter_WoonOppervlakte",filter_WoonOppervlakte);

        parameters.append("filter_WoonOppervlakte-range-min",$("[name=filter_WoonOppervlakte-range-min]")[0]["value"]);
        parameters.append("filter_WoonOppervlakte-range-max",$("[name=filter_WoonOppervlakte-range-max]")[0]["value"]);

        let filter_PerceelOppervlakte = "";
        let perceeloppervlakte = $("[name=filter_PerceelOppervlakte]:checked");
        if(perceeloppervlakte.length){
            filter_PerceelOppervlakte = perceeloppervlakte[0]["value"];
        }
        parameters.append("filter_PerceelOppervlakte",filter_PerceelOppervlakte);

        parameters.append("filter_PerceelOppervlakte-range-min",$("[name=filter_PerceelOppervlakte-range-min]")[0]["value"]);
        parameters.append("filter_PerceelOppervlakte-range-max",$("[name=filter_PerceelOppervlakte-range-max]")[0]["value"]);

        parameters.append("filter_Buitenruimte",$("[name=filter_Buitenruimte]:checked")[0]["value"]);

        parameters.append("filter_LiggingTuin","active");
        let liggingtuin = $("[name=filter_LiggingTuin]:checked");
        if(liggingtuin.length){
            for(let i = 0; i < liggingtuin.length; i++){
                parameters.append("filter_LiggingTuin",liggingtuin[i]["value"]);
            }
        }

        parameters.append("filter_Tuinoppervlakte", $("[name=filter_Tuinoppervlakte]:checked")[0]["value"]);
        parameters.append("filter_BouwvormId", $("[name=filter_BouwvormId]:checked")[0]["value"]);

        parameters.append("filter_BouwPeriodeId","active");
        let bouwperiode = $("[name=filter_BouwPeriodeId]:checked");
        if(bouwperiode.length){
            for(let i = 0; i < bouwperiode.length; i++){
                parameters.append("filter_BouwPeriodeId",bouwperiode[i]["value"]);
            }
        }

        parameters.append("filter_Ligging","active");
        let ligging = $("[name=filter_Ligging]:checked");
        if(ligging.length){
            for(let i = 0; i < ligging.length; i++){
                parameters.append("filter_Ligging",ligging[i]["value"]);
            }
        }

        parameters.append("filter_AanwezigheidVan","active");
        let aanwezigheid = $("[name=filter_AanwezigheidVan]:checked");
        if(aanwezigheid.length !== 0){
            for(let i = 0; i < aanwezigheid.length; i++){
                parameters.append("filter_AanwezigheidVan",aanwezigheid[i]["value"]);
            }
        }

        parameters.append("filter_SoortGarage","active");
        let soortgarage = $("[name=filter_SoortGarage]:checked");
        if(soortgarage.length !== 0){
            for(let i = 0; i < soortgarage.length; i++){
                parameters.append("filter_SoortGarage",soortgarage[i]["value"]);
            }
        }

        parameters.append("filter_AutoCapaciteitGarage", $("[name=filter_AutoCapaciteitGarage]:checked")[0]["value"]);

        parameters.append("filter_Energielabel","active");
        let energielabel = $("[name=filter_Energielabel]:checked");
        if(energielabel.length !== 0){
            for(let i = 0; i < energielabel.length; i++){
                parameters.append("filter_SoortGarage",energielabel[i]["value"]);
            }
        }

        parameters.append("filter_AantalSlaapkamers",$("[name=filter_AantalSlaapkamers]:checked")[0]["value"]);

        parameters.append("filter_Toegankelijkheid","active");
        let toegankelijkheid = $("[name=filter_Toegankelijkheid]:checked");
        if(toegankelijkheid.length !== 0){
            for(let i = 0; i < toegankelijkheid.length; i++){
                parameters.append("filter_Toegankelijkheid",toegankelijkheid[i]["value"]);
            }
        }

        parameters.append("filter_OpenHuizen",$("[name=filter_OpenHuizen]:checked")[0]["value"]);
        parameters.append("filter_VeilingDatum",$("[name=filter_VeilingDatum]:checked")[0]["value"]);
        parameters.append("filter_IndicatiePDF","active");
        parameters.append("filter_ObjectBeschikbaarheid",$("[name=filter_ObjectBeschikbaarheid]:checked")[0]["value"]);
        parameters.append("pagination-page-number-next", currentPage.toString());
    } else if(locatie === "huur"){
        parameters.append("filter_HuurprijsVan",$("option:selected",$("[name=filter_HuurprijsVan]")[0])[0]["value"]);
        parameters.append("filter_HuurprijsVan","");
        parameters.append("filter_HuurprijsTot",$("option:selected",$("[name=filter_HuurprijsTot]")[0])[0]["value"]);
        parameters.append("filter_HuurprijsTot","");

        let filter_IndGeenBemiddelingskosten = "";
        let bemiddeling = $("[name=filter_IndGeenBemiddelingskosten]:checked");
        if(bemiddeling.length){
            filter_IndGeenBemiddelingskosten = bemiddeling[0]["value"];
        }
        parameters.append("filter_IndGeenBemiddelingskosten",filter_IndGeenBemiddelingskosten);

        let filter_Huurovereenkomst = "";
        let overeenkomst = $("[name=filter_Huurovereenkomst]:checked");
        if(overeenkomst.length){
            filter_Huurovereenkomst = overeenkomst[0]["value"];
        }
        parameters.append("filter_Huurovereenkomst",filter_Huurovereenkomst);

        parameters.append("filter_Huurcondities","active");
        let condities = $("[name=filter_Huurcondities]:checked");
        if(condities.length){
            for(let i = 0; i < condities.length; i++){
                parameters.append("filter_Huurcondities",condities[i]["value"]);
            }
        }

        let filter_DatumAanvaarding = "";
        let aanvaarding = $("[name=filter_DatumAanvaarding]:checked");
        if(aanvaarding.length){
            filter_DatumAanvaarding = aanvaarding[0]["value"];
        }
        parameters.append("filter_DatumAanvaarding",filter_DatumAanvaarding);

        parameters.append("filter_SoortObject",$("[name=filter_SoortObject]:checked")[0]["value"]);

        parameters.append("filter_WoningSoort","active");
        let woningSoorten = $("[name=filter_WoningSoort]:checked");
        if(woningSoorten.length){
            for(let i = 0; i < woningSoorten.length; i++){
                parameters.append("filter_WoningSoort",woningSoorten[i]["value"]);
            }
        }

        parameters.append("filter_WoningType","active");
        let woningTypes = $("[name=filter_WoningType]:checked");
        if(woningTypes.length){
            for(let i = 0; i < woningTypes.length; i++){
                parameters.append("filter_WoningType",woningTypes[i]["value"]);
            }
        }

        parameters.append("filter_SoortAppartementId","active");
        let appartementSoorten = $("[name=filter_SoortAppartementId]:checked");
        if(appartementSoorten.length){
            for(let i = 0; i < appartementSoorten.length; i++){
                parameters.append("filter_SoortAppartementId",appartementSoorten[i]["value"]);
            }
        }

        parameters.append("filter_AppartementType","active");
        let appartementTypes = $("[name=filter_AppartementType]:checked");
        if(appartementTypes.length){
            for(let i = 0; i < appartementTypes.length; i++){
                parameters.append("filter_AppartementType",appartementTypes[i]["value"]);
            }
        }

        parameters.append("filter_SoortParkeergelegenheidId","active");
        let parkeerTypes = $("[name=filter_SoortParkeergelegenheidId]:checked");
        if(parkeerTypes.length){
            for(let i = 0; i < parkeerTypes.length; i++){
                parameters.append("filter_SoortParkeergelegenheidId",parkeerTypes[i]["value"]);
            }
        }

        parameters.append("filter_AutoCapaciteitParkeergelegenheid",$("[name=filter_AutoCapaciteitParkeergelegenheid]:checked")[0]["value"]);

        let filter_IndBouwrijp = "";
        let bouwrijp = $("[name=filter_IndBouwrijp]:checked");
        if(bouwrijp.length){
            filter_IndBouwrijp = bouwrijp[0]["value"];
        }
        parameters.append("filter_IndBouwrijp",filter_IndBouwrijp);

        let filter_PublicatieDatum = "";
        let publicatie = $("[name=filter_PublicatieDatum]:checked");
        if(publicatie.length){
            filter_PublicatieDatum = publicatie[0]["value"];
        }
        parameters.append("filter_PublicatieDatum",filter_PublicatieDatum);

        let filter_AantalKamers = "";
        let kamers = $("[name=filter_AantalKamers]:checked");
        if(kamers.length){
            filter_AantalKamers = kamers[0]["value"];
        }
        parameters.append("filter_AantalKamers",filter_AantalKamers);

        parameters.append("filter_AantalKamers-range-min",$("[name=filter_AantalKamers-range-min]")[0]["value"]);
        parameters.append("filter_AantalKamers-range-max",$("[name=filter_AantalKamers-range-max]")[0]["value"]);

        let filter_WoonOppervlakte = "";
        let woonoppervlakte = $("[name=filter_WoonOppervlakte]:checked");
        if(woonoppervlakte.length){
            filter_WoonOppervlakte = woonoppervlakte[0]["value"];
        }
        parameters.append("filter_WoonOppervlakte",filter_WoonOppervlakte);

        parameters.append("filter_WoonOppervlakte-range-min",$("[name=filter_WoonOppervlakte-range-min]")[0]["value"]);
        parameters.append("filter_WoonOppervlakte-range-max",$("[name=filter_WoonOppervlakte-range-max]")[0]["value"]);

        let filter_PerceelOppervlakte = "";
        let perceeloppervlakte = $("[name=filter_PerceelOppervlakte]:checked");
        if(perceeloppervlakte.length){
            filter_PerceelOppervlakte = perceeloppervlakte[0]["value"];
        }
        parameters.append("filter_PerceelOppervlakte",filter_PerceelOppervlakte);

        parameters.append("filter_PerceelOppervlakte-range-min",$("[name=filter_PerceelOppervlakte-range-min]")[0]["value"]);
        parameters.append("filter_PerceelOppervlakte-range-max",$("[name=filter_PerceelOppervlakte-range-max]")[0]["value"]);

        parameters.append("filter_Buitenruimte",$("[name=filter_Buitenruimte]:checked")[0]["value"]);

        parameters.append("filter_LiggingTuin","active");
        let liggingtuin = $("[name=filter_LiggingTuin]:checked");
        if(liggingtuin.length){
            for(let i = 0; i < liggingtuin.length; i++){
                parameters.append("filter_LiggingTuin",liggingtuin[i]["value"]);
            }
        }

        parameters.append("filter_Tuinoppervlakte", $("[name=filter_Tuinoppervlakte]:checked")[0]["value"]);
        parameters.append("filter_BouwvormId", $("[name=filter_BouwvormId]:checked")[0]["value"]);

        parameters.append("filter_BouwPeriodeId","active");
        let bouwperiode = $("[name=filter_BouwPeriodeId]:checked");
        if(bouwperiode.length){
            for(let i = 0; i < bouwperiode.length; i++){
                parameters.append("filter_BouwPeriodeId",bouwperiode[i]["value"]);
            }
        }

        parameters.append("filter_Ligging","active");
        let ligging = $("[name=filter_Ligging]:checked");
        if(ligging.length){
            for(let i = 0; i < ligging.length; i++){
                parameters.append("filter_Ligging",ligging[i]["value"]);
            }
        }

        parameters.append("filter_AanwezigheidVan","active");
        let aanwezigheid = $("[name=filter_AanwezigheidVan]:checked");
        if(aanwezigheid.length !== 0){
            for(let i = 0; i < aanwezigheid.length; i++){
                parameters.append("filter_AanwezigheidVan",aanwezigheid[i]["value"]);
            }
        }

        parameters.append("filter_SoortGarage","active");
        let soortgarage = $("[name=filter_SoortGarage]:checked");
        if(soortgarage.length !== 0){
            for(let i = 0; i < soortgarage.length; i++){
                parameters.append("filter_SoortGarage",soortgarage[i]["value"]);
            }
        }

        parameters.append("filter_AutoCapaciteitGarage", $("[name=filter_AutoCapaciteitGarage]:checked")[0]["value"]);

        parameters.append("filter_Energielabel","active");
        let energielabel = $("[name=filter_Energielabel]:checked");
        if(energielabel.length !== 0){
            for(let i = 0; i < energielabel.length; i++){
                parameters.append("filter_SoortGarage",energielabel[i]["value"]);
            }
        }

        parameters.append("filter_AantalSlaapkamers",$("[name=filter_AantalSlaapkamers]:checked")[0]["value"]);

        parameters.append("filter_Toegankelijkheid","active");
        let toegankelijkheid = $("[name=filter_Toegankelijkheid]:checked");
        if(toegankelijkheid.length !== 0){
            for(let i = 0; i < toegankelijkheid.length; i++){
                parameters.append("filter_Toegankelijkheid",toegankelijkheid[i]["value"]);
            }
        }

        parameters.append("filter_OpenHuizen",$("[name=filter_OpenHuizen]:checked")[0]["value"]);
        parameters.append("filter_IndicatiePDF","active");
        parameters.append("filter_ObjectBeschikbaarheid",$("[name=filter_ObjectBeschikbaarheid]:checked")[0]["value"]);
        parameters.append("pagination-page-number-next", currentPage.toString());
    }

    for(let x = 0; x < 9999; x++){
        $.ajax({
            url: window.location.href + "?ajax=true",
            async: false,
            type: 'POST',
            data: parameters,
            processData: false,
            contentType: false,
            success: function(result) {
                results = results.concat(editPage("request",result["content"]["results"]));
                nextPage = result["content"]["pagination"].includes('rel="next"');
                if(nextPage){
                    currentPage +=1;
                    parameters.set("pagination-page-number-next", currentPage.toString());
                }
            },
            error: function(jqxhr, status, exception) {
            }
        });

        if(!nextPage){
            break;
        }
    }
}

function fillAlternateSort(data){
    let html = "<ol class='search-results'>";

    data.forEach(function(element){
        html += "<li class='search-result'>" +
                                            "<div class='search-result-main'>" +
                                                "<div class='search-result-thumbnail-container'>" +
                                                    "<div class=\"" + userObject + "\" data-save-object=\"\">" +
                                                        "<a href=\"" + element.saveobject + "\" class=\"user-save-object__handle user-save-object__handle--add user-save-object__handle--transparent  \" data-save-object-handle=\"add\">" +
                                                            "<span class=\"user-save-object__handle-icon icon-heart-semi-filled\"></span>" +
                                                            "<span class=\"user-save-object__handle-label sr-only\">Bewaren</span>" +
                                                        "</a>" +
                                                        "<a href=\"" + element.removeobject + "\" class=\"user-save-object__handle user-save-object__handle--remove user-save-object__handle--transparent  \" data-save-object-handle=\"remove\">" +
                                                            "<span class=\"user-save-object__handle-icon icon-heart-filled-white\"></span>" +
                                                            "<span class=\"user-save-object__handle-label sr-only\">Bewaard</span>" +
                                                        "</a>" +
                                                    "</div>" +
                                                    "<div class='search-result-media'>" +
                                                        "<a href='" + element["url"] + "'>" +
                                                            "<div class='search-result-image'>" +
                                                                "<img src='" + element["foto"] + "' alt='" + element["adres"] + "'>" +
                                                                "<div class='search-result-media-icons'>" +
                                                                    (element.plattegrond ? "<span class=\"search-result-media-icon icon-floorplan-white\" title=\"Plattegrond beschikbaar\"></span>" : "") +
                                                                    (element.panorama ? "<span class=\"search-result-media-icon icon-360-white\" title=\"360° foto's beschikbaar\"></span>" : "") +
                                                                    (element.video ? "<span class=\"search-result-media-icon icon-video-white\" title=\"Video beschikbaar\"></span>" : "") +
                                                                "</div>" +
                                                            "</div>" +
                                                        "</a>" +
                                                    "</div>" +
                                                "</div>" +
                                                "<div class='search-result-content'>" +
                                                    "<div class='search-result-content-inner'>" +
                                                        "<div class='search-result-header'>" +
                                                            "<div class='search-result-header-title-col'>" +
                                                                "<a href='" + element["url"] + "'>" +
                                                                    "<h3 class='search-result-title'>" +
                                                                        element["adres"] +
                                                                    "</h3>" +
                                                                "</a>" +
                                                                "<a href='" + element["url"] + "'>" +
                                                                    "<small class='search-result-subtitle'>" +
                                                                        element["postcode"] + " " + element["plaats"] +
                                                                    "</small>" +
                                                                "</a>" +
                                                            "</div>" +
                                                        "</div>" +
                                                        "<div class='search-result-info search-result-info-price'>" +
                                                            "<span class='search-result-price'>" +
                                                                "€ " + parseInt(element["price"]).toLocaleString('nl-NL') +
                                                            "</span>" +
                                                        "</div>" +
                                                        "<div class='search-result-info'>" +
                                                            "<ul class='search-result-kenmerken'>" +
                                                                "<li>" +
                                                                    "<span title='Gebruiksoppervlakte wonen'>" +
                                                                        (element["woon"] === undefined ? 0 : element["woon"]) + " m²" +
                                                                    "</span>" +
                                                                    " / " +
                                                                    "<span title='Perceeloppervlakte'>" +
                                                                        (element["perceel"] === undefined ? 0 : element["perceel"]) + " m²" +
                                                                    "</span>" +
                                                                "</li>" +
                                                                (element["kamers"] === undefined ? "" : "<li>" + element["kamers"] + " kamers</li>") +
                                                            "</ul>" +
                                                            ((optionItems.woon && element["woonprice"] !== undefined) ? "<ul class='search-result-kenmerken'>Woonoppervlakte prijs per m²: € " + parseInt(element["woonprice"]).toLocaleString('nl-NL') + "</ul>" : "") +
                                                            ((optionItems.perceel && element["perceelprice"] !== undefined) ? "<ul class='search-result-kenmerken'>Perceeloppervlakte prijs per m²: € " + parseInt(element["perceelprice"]).toLocaleString('nl-NL') + "</ul>" : "") +
                                                        "</div>" +
                                                    "</div>" +
                                                "</div>" +
                                            "</div>" +
                                        "</li>";
    });

    html += "</ol>";
    return html
}

function onChange(){
    let dropdown = document.getElementById("sortResults");
    let optionIndex  = dropdown.selectedIndex;
    let optionValue = dropdown.options[optionIndex].value;
    console.log(optionValue);
}

function editPage(type,data){
    let results = [];
    let specialresults = [];
    // Get the container for the search results, with the ol containers that hold the individual results.
    let container;
    if(type === "page"){
        container = Array.prototype.slice.call(document.querySelectorAll(resultContainer)[0]['children']);

        chrome.storage.sync.get({
            showCustomSort: true
        }, function(item) {
            if(item.showCustomSort === true){
                prepAlternateSort()
            }
        });
    } else if(type === "request"){
        let results = $(data);
        container = Array.prototype.slice.call(results);
    }

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
        } else if(container[i].nodeName === "#text"){
            container[i].remove();
        } else {
            // Loop through the individual search results, being the houses.
            for(let x = 0; x < container[i]['children'].length;x++){
                let searchResult = container[i]['children'][x];
                let result = {};
                let promo = false;
                if($(searchResult).hasClass(promoResult)){
                    promo = true;
                }

                chrome.storage.sync.get({
                    removeSimilar: false,
                    removePromo: false,
                    showWoon: true,
                    showPerceel: false,
                    showCustomSort: true,
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

                result.url = searchResult.getElementsByClassName("search-result-header-title-col")[0]["children"][0].href;
                result.adres = searchResult.getElementsByClassName('search-result-title')[0].innerText;

                let price = searchResult.getElementsByClassName(priceContainer)[0].innerText;
                if(!price.includes("Van €")){
                    result.price = price.replace(/\./g,'').replace(/€/g,'').replace(/kk/g,'').replace(/\/mnd/g,'').replace(/von/g,'');

                    if($(searchResult.querySelector(woonOppervlakteContainer)).length !== 0){
                        result.woon = searchResult.querySelector(woonOppervlakteContainer).innerText.replace(" m²","").replace(".","");
                        result.woonprice = Number(Math.round(result.price / result.woon));
                    }

                    if($(searchResult.querySelector(perceelOppervlakteContainer)).length !== 0){
                        result.perceel = searchResult.querySelector(perceelOppervlakteContainer).innerText.replace(" m²","").replace(".","");
                        result.perceelprice = Number(Math.round(result.price / result.perceel));
                    }
                }

                try {
                    result.plaats= searchResult.getElementsByClassName("search-result-subtitle")[0].innerText.match(/\d{4} (?:\w{2} )?(.*)/)[1];
                    result.postcode = searchResult.getElementsByClassName("search-result-subtitle")[0].innerText.replace(result.plaats,'').trim();
                } catch {
                    result.gegevens = searchResult.getElementsByClassName("search-result-subtitle")[0].innerText;
                }

                try{ result.foto = searchResult.getElementsByClassName("search-result-image")[0]["children"][0].src;} catch{}
                try{ result.kamers = searchResult.getElementsByClassName("search-result-kenmerken")[0]["children"][1].innerText.match(/(\d+) kamer./)[1];} catch{}

                if(searchResult.outerHTML.includes("icon-floorplan-white")){
                    result.plattegrond = true;
                }
                if(searchResult.outerHTML.toString().includes("icon-360-white")){
                    result.panorama = true;
                }
                if(searchResult.outerHTML.toString().includes("icon-video-white")){
                    result.video = true;
                }

                let save = $(searchResult).find(addObject)[0];
                let remove = $(searchResult).find(removeObject)[0];
                result.saveobject = save.href.replace(/^.*\/\/[^\/]+/, '');
                result.removeobject = remove.href.replace(/^.*\/\/[^\/]+/, '');

                if(window.location.href.includes("huur")){
                    try{
                        let prices = result.price.match(/.*\s(\d+)\stot.*/);
                        result.price = prices[1];
                    } catch{}
                }

                function removeSimilar(){
                    try{
                        let similar = searchResult.getElementsByClassName(similarContainer)[0];
                        similar.remove();
                    }
                    catch{}
                }

                function removePromo(){
                    if(promo){
                        searchResult.remove();
                    }

                    try{
                        let promotext = searchResult.getElementsByClassName(promoTextContainer)[0];
                        let promolabel = searchResult.getElementsByClassName(promoLabelContainer)[0];

                        promotext.remove();
                        promolabel.remove();
                    } catch{}

                    try{
                        let blikvanger = searchResult.getElementsByClassName(promoClass)[0];

                        blikvanger.remove();
                    } catch{}

                    try{
                        let makelaar = searchResult.getElementsByClassName(makelaarContainer)[0];

                        makelaar.remove();
                    } catch{}

                    try{
                        let labels = searchResult.getElementsByClassName(promoLabels)[0];
                        labels.remove();
                    } catch{}
                }

                function showWoon(){
                    if(result.woon && parseInt(result.woon) !== 0 ){
                        if(!promo){
                            // Create the result elements
                            let gemiddelde = document.createElement("ul");
                            gemiddelde.setAttribute("class","search-result-kenmerken");
                            let gemiddeldeTekst = document.createTextNode("Woonoppervlakte prijs per m²: € " + Number(Math.round(result.price / result.woon)).toLocaleString('nl-NL'));
                            gemiddelde.appendChild(gemiddeldeTekst);
                            searchResult.lastElementChild.lastElementChild.lastElementChild.lastElementChild.appendChild(gemiddelde);
                        }
                    }
                }

                function showPerceel(){
                    if(result.perceel && parseInt(result.perceel) !== 0){
                        if(!promo){
                            // Create the result elements
                            let gemiddelde = document.createElement("ul");
                            gemiddelde.setAttribute("class","search-result-kenmerken");
                            let gemiddeldeTekst = document.createTextNode("Perceeloppervlakte prijs per m²: € " + Number(Math.round(result.price / result.perceel)).toLocaleString('nl-NL'));
                            gemiddelde.appendChild(gemiddeldeTekst);
                            searchResult.lastElementChild.lastElementChild.lastElementChild.lastElementChild.appendChild(gemiddelde);
                        }
                    }
                }
                results.push(result)
            }
        }
    }
    return results
}

if (document.getElementsByClassName("search").length ) {
    //First execution, the next ones will be activated by the mutation observer
    editPage("page");

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
                    editPage("page");
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
    },1000);
} else {
    let price = document.getElementsByClassName("object-header__price")[0].innerText.replace(/\./g,"").replace(/€/g,"").replace(/kk/g,"").replace(/\/mnd/g,"").replace(/von/g,"");
    let adres = document.getElementsByClassName("object-header__address")[0].innerText;

    if(type === "huur"){
        try{
            let prices = price.match(/.*\s(\d+)\stot.*!/);
            price = prices[1];
        } catch{}
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
        } catch{}
    }

    chrome.storage.sync.get({
        getWOZ: false
    }, function(items) {
        if(items.getWOZ){
            getWOZ();
        }
    });
}
