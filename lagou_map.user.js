// ==UserScript==
// @name          Lagou jobs map
// @author        murchik <mixturchik@gmail.com>
// @description   Fuck endless lists, find a job at the map.
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
    console.log('fetching opening ' + url);
    $.ajax({ url: url }).done( function (output) {
        var page = $(output);
        addToMap(page);
    });
    console.log('ajax added');
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
    var lng = page.getElementById('positionLng').value;
    var lat = page.getElementById('positionLat').value;
    return { lng: lng, lat: lat }
}

function addToMap(page) {
    console.log('page fetched!');
    console.log(page);
    coordinates = getCoordinates(page);
    console.log(coordinates);
}

function makeMap() {
    console.log('>>>>>>>>>>>>>>>>>>>>>');

    console.log($.ajax());

    var openings = getPageOpenings(document);
    console.log(openings);

    var pages = getPagesCount();
    console.log(pages);

    fetchOpening(openings[0]);


    console.log('----------------------');
}


if (this.window) {
	makeMap();
} else {
	test();
}
