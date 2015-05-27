// ==UserScript==
// @name          Lagou jobs map
// @author        murchik <mixturchik@gmail.com>
// @description   Fuck endless lists, find a job on a map.
// @homepage      http://github.com/moorchegue
// @match         *://*.lagou.com/jobs/list*
// @version       0.0.2
// @require       http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

var bmap;
var checkBMap;
var checkMap = {};

function getOpeningUrl(opening) {
    //return 'http://www.lagou.com/jobs/598412.html'
    return opening.getElementsByTagName('a').item(0).href;
}

function getPageOpenings(page) {
    return page.querySelectorAll('.hot_pos_l');
}

function getPagesCount() {
    var pages = document.querySelectorAll('.Pagination a');
    if (pages.length == 0) {
        return 0;
    }
    var last_page = pages.item(--pages.length);
    return parseInt(last_page.title);
}

function fetchOpening(opening) {
    url = getOpeningUrl(opening);
    console.log('fetching opening ' + url);
    $.ajax({url: url}).done( function (output) {
        var page = $(output);
        addToMap(opening, page);
    });
}

function fetchPageOpenings(page) {
    var openings = getPageOpenings(page);
    for (var i = 0; i < openings.length; i++) {
        fetchOpening(openings[i]);
    }
}

function fetchPage(url) {
    $.ajax({ url: url, callback: fetchPageOpenings(page)});
}

function getCoordinates(page) {
    return {
        lng: page.find('input[id=positionLng]').first().val(),
        lat: page.find('input[id=positionLat]').first().val()
    }
}

function getAddress(page) {
    return page.find('dl[class=job_company] dd div').first().text()
}

function getCity(url) {
    return decodeURI(url).match(/(\?|\&)city=([^\&]+)/)[2];
}

function getCompanyName(page) {
    return page.find('dl[class=job_company] h2.fl').first().contents().get(0).nodeValue;
}

function getOpeningId(opening) {
    url = getOpeningUrl(opening);
    return url.match(/jobs\/([0-9]+)\.html/)[1];
}

function getMapScript(page) {
    var scripts = page.find('script');
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src.match('map\.baidu\.com')) {
            return scripts[i].src;
        }
    }
}

function addToMap(opening, page) {
    console.log('page fetched!');

    initializeMap(page);

    var coordinates = getCoordinates(page);
    var address = getAddress(page);
    var city = getCity(location);
    var company = getCompanyName(page);
    var id = getOpeningId(opening);

    checkMap[id] = window.setInterval(function() {
        console.log('check if map is ready');
        if (typeof bmap != 'undefined') {
            window.clearInterval(checkMap[id]);
            console.log('map is ready for ' + id + ': ' + checkMap[id]);
            if (coordinates.lat && coordinates.lng) {
                addByCoordinates(coordinates, opening, company, address, city);
            } else {
                addByAddress(company, opening, address, city);
            }
        }
    }, 1000);

}

function addPoint(point, opening, company, address, city) {
    //var icon = new BMap.Icon("markers.png", new BMap.Size(23, 25), {    
        //offset: new BMap.Size(10, 25),    
        //imageOffset: new BMap.Size(0, 0 - index * 25)
    //});
    marker = new BMap.Marker(point);
    bmap.addOverlay(marker);

    var header = '<h4>' + company + '</h4>';
    var tooltip = $(opening).clone().html();
    var infoWindow = new BMap.InfoWindow(header + tooltip);

    marker.addEventListener("click", function() {
        marker.openInfoWindow(infoWindow);
    });
}

function addByCoordinates(coordinates, opening, company, address, city) {
    console.log('add by coords' + coordinates.lng + ', ' + coordinates.lat)
    var point = new BMap.Point(coordinates.lng, coordinates.lat);
    bmap.centerAndZoom(point, 11);
    addPoint(point, opening, company, address, city);
}

function addByAddress(company, opening, address, city) {
    console.log('add by address' + address + ', ' + city);
    var gc = new BMap.Geocoder();
    gc.getPoint(address, function(point) {
        if (point) {
            addByCoordinates(point, opening, company, address, city);
        }
    }, city);
}

function initializeMap(page) {
    // do this only once
    if (document.getElementById('map')) {
        console.log('map was already initialized');
        return;
    }

    // wrapper required by baidu map api
    console.log('adding div');
    var map_div = document.createElement('div');
    map_div.id = 'map';
    map_div.setAttribute('style', 'height: 500px; width: 100%;');
    $('#workplaceSelect').after(map_div);

    // smartass proxying script
    var proxy_script_url = getMapScript(page);
    console.log(proxy_script_url);

    // jsonp magic
    $.ajax({url: proxy_script_url, dataType: 'jsonp'});

    // XXX jsonpCallback only runs after result is loaded, not the code executed
    checkBMap = window.setInterval(function() {
        if (typeof BMap != 'undefined') {
            window.clearInterval(checkBMap);
            console.log('making a map!');
            // HACK delay is for webkit
            setTimeout(function() {
                bmap = new BMap.Map('map');
                bmap.addControl(new BMap.NavigationControl());
                bmap.addControl(new BMap.MapTypeControl());
                bmap.addControl(new BMap.OverviewMapControl());
                bmap.enableScrollWheelZoom(true);
            }, 2000);
        }
    }, 1000);

    console.log('map done');
}

function makeMap() {
    console.log('>>>>>>>>>>>>>>>>>>>>>');

    this.$ = this.jQuery = jQuery.noConflict(true);

    //var openings = getPageOpenings(document);
    //fetchOpening(openings[0]);
    fetchPageOpenings(document);

    var pages = getPagesCount();
    console.log(pages);

    console.log('----------------------');
}

function test() {
    console.log('Passed.');
}

if (this.window) {
	makeMap();
} else {
	test();
}
