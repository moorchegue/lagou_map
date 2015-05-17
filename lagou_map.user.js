// ==UserScript==
// @name          Lagou jobs map
// @author        murchik <mixturchik@gmail.com>
// @description   Fuck endless lists, find a job on a map.
// @homepage      http://github.com/moorchegue
// @match         *://*.lagou.com/jobs/list*
// @version       0.0.1
// @require       http://code.jquery.com/jquery-latest.min.js
// ==/UserScript==

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
    url = 'http://www.lagou.com/jobs/598412.html'
    console.log('fetching opening ' + url);
    $.ajax({url: url}).done( function (output) {
        var page = $(output);
        addToMap(page);
    });
}

function fetchAllOpenings(page) {
    var openings = getPageOpenings(page);
    for (var i = 0; i < openings.length; i++) {
        fetchOpening(openings[i]);
    }
}

function fetchPage(url) {
    $.ajax({ url: url, callback: fetchAllOpenings(page)});
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

function getMapScript(page) {
    var script = page.find('script');
}

function addToMap(page) {
    console.log('page fetched!');
    initializeMap();
    window.fuck = page
    coordinates = getCoordinates(page);
    if (coordinates.lat && coordinates.lng) {
        addByCoordinates(coordinates);
    } else {
        address = getAddress(page);
        addByAddress(address);
    }
}

function addByCoordinates(coordinates) {
}

function addByAddress(address) {
}

function initializeMap() {
    if (document.getElementById('map')) {
        console.log('map was already initialized');
        return;
    }
    console.log('adding div');
    var map_div = document.createElement('div');
    map_div.id = 'map';
    map_div.setAttribute('style', 'position: absolute; top: 0px; left: 0px; height: 500px; width: 600px; background: #333; border: solid 2px #A00;');
    $('body').append(map_div);

    console.log('adding script');
    var script = document.createElement('script');
    script.id = 'baidu-map'
    script.type = 'text/javascript';
    script.src = 'http://api.map.baidu.com/getscript?v=2.0&ak=6605604a7755e5d4f1216b19d8dda1b1&services=&t=20150514110922';
    $('body').append(script);

    var checkMap = window.setInterval(function() {
        console.log('checking map');
        if (typeof BMap !== undefined) {
            console.log('making a map!');
            map = new BMap.Map('map');
            window.clearInterval(checkMap);
        }
    }, 1);

    console.log('map done');
}

function makeMap() {
    console.log('>>>>>>>>>>>>>>>>>>>>>');

    var openings = getPageOpenings(document);
    console.log(openings);

    var pages = getPagesCount();
    console.log(pages);

    fetchOpening(openings[2]);

    console.log('----------------------');
}


if (this.window) {
	makeMap();
} else {
	test();
}
