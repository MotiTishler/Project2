/***************
 * Crypto Object
 ***************/
class Crypto {
    constructor(id, symbol, name) {
        this.id = id;
        this.symbol = symbol;
        this.name = name;
        this.canBeSelected = false;
        this.isSelected = false;
        this.myDiv = null;
    }
    SetSelected(val) {
        this.isSelected = val;
    }
    CanSelected(val) {
        this.canBeSelected = val;
    }
    DisplayToggleSwitch() {
        let checked = `${this.isSelected ? 'checked' : ''}`;
        if (this.canBeSelected)
            return `<label><input type="checkbox" class="switch" ${checked}><span class="slider"></span></label>`;
        return '';
    }
    /*GetCryptoContent(){
        return `<div class="card-body">
        <h3 class="card-title">${this.symbol}</h3>
        <p class="card-text">${this.id}</p>
        <button class="moreinfo btn btn-primary mb-5">More Info</button>
        ${  this.DisplayToggleSwitch() }
        <div class="card-text info-here "></div>
        </div>`
    }*/
    DrawCrypto() {
        //create the div
        let divtext = `
        <div class="col-lg-3 col-sm-4">
            <div class="card bg-dark text-warning border-white">
                <div class="card-body">
                    <h3 class="card-title">${this.symbol}</h3>
                    <p class="card-text">${this.id}</p>
                    <button class="moreinfo btn btn-warning text-dark mb-5">More Info</button>
                    ${this.DisplayToggleSwitch()}
                    <div class="card-text info-here "></div>
                </div>
            </div>
        </div>
    `;
        //let div = $("<div>" ,{ "class":"col-lg-3 col-sm-4"}).append($("<div>" ,{ "class":"card"})).append(this.GetCryptoContent())
        let div = $(divtext);
        //add event listeners to more-info button and toggle switch
        $(div).find(".moreinfo").click(e => OnMoreInfo(e));
        $(div).find(".switch").change(e => OnToggleSwitchChanged(e));
        return div;
    }
}
/*******************
 * common variables
 *******************/
const currenciesAPI = ' https://api.coingecko.com/api/v3/coins/list';
const coinInfoAPI = 'https://api.coingecko.com/api/v3/coins/{id}';
const reportsCoinsListAPI = 'https://min-api.cryptocompare.com/data/all/coinlist';
const exchangeRatesAPI = 'https://min-api.cryptocompare.com/data/pricemulti?fsyms={list}&tsyms=USD';
let cList = [];
let selected = [];
let chart;
/************************
 * On init - basic query
 ************************/
$(e => {
    $(".ctnr").html(`<div class="d-flex justify-content-center"><div class="spinner-border text-warning etext-cnter m-5" style="width: 5rem; height: 5rem;">Loading ...</div></div>`);
    AskForCurrencies();
});
function AskForCurrencies() {
    $.ajax({
        url: currenciesAPI,
        type: "GET",
        success: resp => {
            //console.log(resp.slice(0,100))
            //create and fill Crypto's array
            // The slice is for development only.   for production - don't slice the response
            for (let crypt of resp.slice(0, 200)) {
                //for (let crypt of resp){
                let c = new Crypto(crypt.id, crypt.symbol, crypt.name);
                cList.push(c);
            }
            //console.log(cList)
            //check for currencies with reports avivable
            $.get(reportsCoinsListAPI, ans => {
                console.log(ans.Data.BTC);
                for (let coin in ans.Data) {
                    cList.filter(c => c.symbol.toLowerCase() == ans.Data[coin].Symbol.toLowerCase()).map(c1 => c1.CanSelected(true));
                }
                console.log(cList.filter(c => c.canBeSelected == true).length, "currencies can be selected");
                //console.log(cList.filter(c=>c.canBeSelected == true))
                console.log(cList.filter(c => c.symbol.toLowerCase() == 'btc'));
                DisplayCurrencies(cList);
            });
        },
        error: (jqXHR, status, err) => {
            console.log(status, err);
        }
    });
}
function DisplayCurrencies(theList) {
    if (!$(".ctnr").hasClass("card-deck"))
        $(".ctnr").addClass("card-deck");
    if (!$(".ctnr").hasClass("row"))
        $(".ctnr").addClass("row");
    $(".ctnr").empty();
    for (let c of theList) {
        let div = c.DrawCrypto();
        $(".ctnr").append(div);
        c.myDiv = div;
    }
}
/********************************
 * Currencies List (Home button)
 ********************************/
$("#home").click(e => {
    e.preventDefault();
    //SetActive(e.target.parentElement)
    //ShowSearch(true)
    $(".input-group").show();
    $(".ctnr").empty();
    //display currencies
    DisplayCurrencies(cList);
});
//Event listener for Search button - find exact match
$("#searchBtn").click(e => {
    let coin = $("#searchinp").val().toString();
    console.log(coin);
    DisplayCurrencies(coin == '' ? cList : cList.filter(c => c.symbol.toLowerCase() == coin.toLowerCase()));
});
//advanced event listener - find all coins that contains the name typed
$("#searchinp").keyup(e => {
    let coin = $("#searchinp").val().toString();
    DisplayCurrencies(coin == '' ? cList : cList.filter(c => c.symbol.toLowerCase().indexOf(coin.toLowerCase()) >= 0));
});
//Event listener for more-info button
function OnMoreInfo(e) {
    let infodiv = $(e.target.parentElement).find(".info-here");
    if ($(infodiv).is(':empty')) {
        //ask for more info:
        let theCoin = $(e.target.parentElement).find(".card-text").text();
        let key = theCoin + '-INFO';
        let info = sessionStorage.getItem(key) || "";
        if (info.length > 0) {
            //session storage exists
            $(infodiv).html(info);
        }
        else {
            //start spinner
            $(infodiv).html(`<div class="spinner-border text-warning"></div>`);
            //ask for info
            $.ajax({
                url: coinInfoAPI.replace('{id}', theCoin),
                method: "GET",
                success: resp => {
                    //stop spinner
                    $(infodiv).empty();
                    //Format response and display formatted info
                    //console.log(resp.market_data.current_price)
                    let moreinfo = `<p>Exchange rates:</p>
<ul>
<li>${resp.market_data.current_price.usd} $</li>
<li>${resp.market_data.current_price.eur} &#8364;</li>
<li>${resp.market_data.current_price.ils} &#8362;</li>
</ul>`;
                    $(infodiv).html(moreinfo);
                    //update session storage
                    sessionStorage.setItem(key, moreinfo);
                    //set timeout to clean session storage after 2 minutes
                    setTimeout(() => {
                        //console.log("Two minutes passed for", key)
                        sessionStorage.removeItem(key);
                    }, 1000 * 60 * 2);
                },
                error: (jqXHR, status, err) => {
                    //stop spinner
                    $(infodiv).empty();
                    //Show error message
                    $(infodiv).text(`Ooooops. Something went wrong. 
${status} - ${err}`);
                }
            });
            //success: 1. end spinner 2. display info 3. update session storage 4. set timeout for 2 minutes, then clean sesion storage
        }
    }
    else {
        // info is already displayed - empty the div
        $(infodiv).empty();
    }
}
$(".moreinfo").click(e => OnMoreInfo(e));
//event listener for toggle switch
function OnToggleSwitchChanged(e) {
    let theCoin = $(e.target.parentElement.parentElement).find(".card-title").text();
    let i = selected.indexOf(theCoin);
    //console.log(e.target.parentElement.parentElement)
    if (e.target.checked) {
        //push coin to list
        if (selected.length < 5) {
            //push immediately
            if (i < 0)
                selected.push(theCoin);
            cList.filter(c => c.symbol.toLowerCase() == theCoin.toLowerCase()).map(coin => coin.SetSelected(true));
        }
        else {
            console.log(selected);
            //update modal 
            $("#myModal").find("span").text(theCoin);
            $("#myModal").find("input:checkbox").prop('checked', true);
            $("#myModal").find("#l1").text(selected[0]);
            $("#myModal").find("#l2").text(selected[1]);
            $("#myModal").find("#l3").text(selected[2]);
            $("#myModal").find("#l4").text(selected[3]);
            $("#myModal").find("#l5").text(selected[4]);
            //display modal 
            $("#myModal").modal();
            //continue process according to the modal
        }
    }
    else {
        //remove coin from list
        if (i >= 0)
            selected.splice(i, 1);
        cList.filter(c => c.symbol.toLowerCase() == theCoin.toLowerCase()).map(coin => coin.SetSelected(false));
    }
    //console.log(selected)
}
$(".switch").change(e => OnToggleSwitchChanged(e));
//event listener for modal's OK
$("#modalOK").click(e => {
    let newCoin = $("#myModal").find("span").text();
    let checked = $("#myModal").find("input:checkbox:checked");
    let unchecked = $("#myModal").find("input:checkbox:not(:checked)");
    if (checked.length >= 5) {
        //no coin was unchecked. cancel the new coin
        RedrawCoin(newCoin, false);
    }
    else {
        console.log(selected);
        //checked coins - no change is needed
        //add the new coin to selected array
        selected.push(newCoin);
        //RedrawCoin(newCoin, true)
        cList.filter(c => c.symbol.toLowerCase() == newCoin.toLowerCase()).map(coin => coin.SetSelected(true));
        //console.log(selected)
        //unchecked coins - uncheck the toggle switch and remove from selected array
        unchecked.each((index, value) => {
            let uncheckedCoin = $(value.parentElement.children[1]).text();
            RedrawCoin(uncheckedCoin, false);
            selected.splice(selected.indexOf(uncheckedCoin), 1);
        });
        //console.log(selected)
    }
});
//event listener for modal's Cancel
$("#modalCancel").click(e => {
    let canceledCoin = $("#myModal").find("span").text();
    RedrawCoin(canceledCoin, false);
});
function RedrawCoin(coinName, isChecked) {
    cList.filter(c => c.symbol.toLowerCase() == coinName.toLowerCase())
        .map(coin => {
        coin.SetSelected(isChecked);
        //Redraw the toggle switch        
        $(coin.myDiv).find(".switch").prop("checked", isChecked);
    });
}
/******************
 * About
 ******************/
$("#about").click(e => {
    e.preventDefault();
    //SetActive(e.target.parentElement)
    //ShowSearch(false)
    $(".input-group").hide();
    $(".ctnr").empty();
    //diplay about
    $(".ctnr").append(`
    <div class="card bg-dark text-warning w-100">
        <div class="row">
            <div class="col-sm-3"></div>
            <div class="col-sm-4 ">
                <h4>
                    <p>This is project #2 in the Full Stack Web Development course at John Bryce - Jerusalem branch.</p>
                    <p>The site displays a list of cryptocurrencies, such as Bitcoin, and their exchange rates in US dollars, euros and new israeli shekels, using JQuery and Bootstrap.</p>
                    <p>Made by Moti Tishler.</p>
                </h4>
            </div>
            <div class="col-sm-2">
                <img src="./project2/87.jpg" alt="an image" class="img-thumbnail">
            </div>        
        </div>
    </div>
    `);
});
/******************
 * Live reports
 ******************/
let timer;
let chartObj; //= {}
$("#live").click(e => {
    e.preventDefault();
    //SetActive(e.target.parentElement)
    //ShowSearch(false)    
    $(".input-group").hide();
    $(".ctnr").empty();
    //display reports
    $(".ctnr").append(`<div id="chartContainer" class="text-warning text-center w-100" style="height: 300px; "></div>`);
    if (selected.length == 0) {
        //no coin was selected. 
        $("#chartContainer").append(`<h2>No coin was selected.</h2>`);
    }
    else {
        //create objects array according to selected array
        chartObj = {
            animationEnabled: true,
            title: {
                text: "Current exchange rates"
            },
            axisX: {
                valueFormatString: "HH:mm:ss"
            },
            axisY: {
                title: "Exchange Rate (in $)",
                includeZero: false,
                suffix: " $"
            },
            legend: {
                cursor: "pointer",
                fontSize: 16 //,
                //itemclick: toggleDataSeries
            },
            toolTip: {
                shared: true
            },
            data: []
        };
        //chartObj = {}
        for (let coin of selected) {
            chartObj.data.push({
                name: coin.toUpperCase(),
                type: "spline",
                yValueFormatString: "#.# $",
                showInLegend: true,
                dataPoints: []
            });
        }
        //start spinner
        $(".spnr").html(`<div class="spinner-border text-warning"></div>`);
        //first query
        AskForExchangeRates();
        //start timer: query every 2 seconds
        timer = setInterval(AskForExchangeRates, 1000 * 2);
    }
});
function AskForExchangeRates() {
    console.log("query at", new Date().toString());
    let div = $(".ctnr").find("#chartContainer");
    if (div.length == 0) {
        //user have changed the page. chart div was closed
        clearInterval(timer);
    }
    else {
        //execute ajax
        $.ajax({
            url: exchangeRatesAPI.replace('{list}', selected.join(',').toUpperCase()),
            type: "GET",
            success: resp => {
                $(".spnr").empty();
                console.log(resp);
                //update object according to response
                for (let key of Object.keys(resp)) {
                    console.log(key, resp[key]);
                    chartObj.data.filter(c => c.name == key).map(d => d.dataPoints.push({ x: new Date(), y: resp[key].USD }));
                }
                console.log(chartObj);
                RenderChart();
            },
            error: (jqXHR, status, err) => {
                $(".spnr").empty();
                $(div).append(`<h2>Ooooops. ${status} - ${err}</h2>`);
            }
        });
    }
}
//render chart function
function RenderChart() {
    chart = new CanvasJS.Chart("chartContainer", chartObj);
    chart.render();
}
/******************
 * Other functions
 ******************/
/*function SetActive(li){
    $("li").removeClass("active")
    $(li).addClass("active")
}

function ShowSearch(bool:boolean){
    if (bool){
        $(".input-group").show()
    }else{
        $(".input-group").hide()
    }
}
*/ 
