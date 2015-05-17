// ==UserScript==
// @name          Lagou jobs map
// @author        murchik <mixturchik@gmail.com>
// @description   Fuck endless lists, find a job on a map.
// @homepage      http://github.com/moorchegue
// @match         *://*.lagou.com/jobs/list*
// @version       0.0.1
// @require       http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

var bmap;
var checkBMap;
var checkMap = {};

function getPageOpenings(page) {
    var links = [];
    var openings = page.getElementsByClassName('hot_pos_l');
    for (var i = 0; i < openings.length; i++) {
        var link = openings[i].getElementsByTagName('a').item(0).href;
        links.push(link);
    }
    return links;
}

function getPagesCount() {
    var pages = document.querySelectorAll('.Pagination a');
    if (pages.length == 0) {
        return 0;
    }
    var last_page = pages.item(--pages.length);
    return parseInt(last_page.title);
}

function fetchOpening(url) {
    //url = 'http://www.lagou.com/jobs/598412.html'
    console.log('fetching opening ' + url);
    var id = url.match(/jobs\/([0-9]+)\.html/)[1];
    $.ajax({url: url}).done( function (output) {
        var page = $(output);
        addToMap(id, page);
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
    console.log('getting coords');
    var lng = page.find('input[id=positionLng]').first().val();
    var lat = page.find('input[id=positionLat]').first().val();
    console.log(lng + ', ' + lat);
    return { lng: lng, lat: lat }
}

function getAddress(page) {
    console.log('getting address');
    var address = page.find('dl[class=job_company] dd div').first().text()
    console.log(address);
    return address
}

function getCity(page) {
    return '北京';
}

function getCompanyName(page) {
    var company = page.find('dl[class=job_company] h2.fl').first().text();
    return company;
}

function getMapScript(page) {
    var script = page.find('script');
}

function addToMap(id, page) {
    console.log('page fetched!');
    window.fuck = page
    initializeMap();
    var coordinates = getCoordinates(page);
    var address = getAddress(page);
    var city = getCity(page);
    var company = getCompanyName(page);

    checkMap[id] = window.setInterval(function() {
        console.log('check if map is ready');
        if (typeof bmap != 'undefined') {
            window.clearInterval(checkMap[id]);
            console.log('map is ready for ' + id + ': ' + checkMap[id]);
            if (coordinates.lat && coordinates.lng) {
                addByCoordinates(coordinates, company, address, city);
            } else {
                addByAddress(company, address, city);
            }
        }
    }, 1000);

}

function addPoint(point, company, address, city) {
    //var icon = new BMap.Icon("markers.png", new BMap.Size(23, 25), {    
        //offset: new BMap.Size(10, 25),    
        //imageOffset: new BMap.Size(0, 0 - index * 25)
    //});
    marker = new BMap.Marker(point);
    bmap.addOverlay(marker);

    var tooltip = '<h4>' + company + '</h4>' + '<p>' + address + ' (' + city + ')</p>';
    var infoWindow = new BMap.InfoWindow(tooltip);

    marker.addEventListener("click", function() {
        marker.openInfoWindow(infoWindow);
    });
}

function addByCoordinates(coordinates, company, address, city) {
    console.log('add by coords' + coordinates.lng + ', ' + coordinates.lat)
    var point = new BMap.Point(coordinates.lng, coordinates.lat);
    bmap.centerAndZoom(point, 11);
    addPoint(point, company, address, city);
    return point;
}

function addByAddress(company, address, city) {
    console.log('add by address' + address + ', ' + city);
    var gc = new BMap.Geocoder();
    gc.getPoint(address, function(point) {
        if (point) {
            p = addByCoordinates(point, company, address, city);
            setTimeout(function() {
                bmap.centerAndZoom(p, 11);
            }, 1000);
            bmap.setZoom(11);
      }
    }, city);
}

function initializeMap() {
    // do this only once
    if (document.getElementById('map')) {
        console.log('map was already initialized');
        return;
    }

    // wrapper required by baidu map api
    console.log('adding div');
    var map_div = document.createElement('div');
    map_div.id = 'map';
    //map_div.setAttribute('style', 'position: absolute; top: 0px; left: 0px; height: 500px; width: 600px; background: #333; border: dotted 1px #A00;');
    map_div.setAttribute('style', 'height: 500px; width: 100%; background: #333; border: dotted 1px #A00;');
    $('#workplaceSelect').append(map_div);

    // injecting script
    console.log('adding script');
    var script = document.createElement('script');
    script.id = 'baidu-map'
    script.type = 'text/javascript';
    script.src = 'http://api.map.baidu.com/getscript?v=2.0&ak=6605604a7755e5d4f1216b19d8dda1b1&services=&t=20150514110922';
    $('body').append(script);

    // FIX Somehow onload event is not supported for injected scripts
    checkBMap = window.setInterval(function() {
        if (typeof BMap != 'undefined') {
            window.clearInterval(checkBMap);
            console.log('making a map!');
            bmap = new BMap.Map('map');
            bmap.addControl(new BMap.NavigationControl());
            bmap.addControl(new BMap.MapTypeControl());
            bmap.addControl(new BMap.OverviewMapControl());
            bmap.enableScrollWheelZoom(true);
        }
    }, 1000);

    console.log('map done');
}

function makeMap() {
    console.log('>>>>>>>>>>>>>>>>>>>>>');

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
