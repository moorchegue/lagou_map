// ==UserScript==
// @name          Lagou jobs map
// @author        murchik <mixturchik@gmail.com>
// @description   Fuck endless lists, find a job on a map.
// @homepage      http://github.com/moorchegue
// @match         *://*.lagou.com/jobs/list*
// @match         *://*.neitui.me/index.php?*
// @version       0.0.2
// @require       http://code.jquery.com/jquery-latest.min.js
// @grant         GM_log
// ==/UserScript==

var HRWebsite = function() {
    this.bmap = undefined;
    this.checkBMap = undefined;
    this.checkMap = {};
    //this.$ = this.jQuery = jQuery.noConflict(true);
}

HRWebsite.prototype.getPageOpenings = function(page) {
    var links = [];
    var openings = page.getElementsByClassName('hot_pos_l');
    for (var i = 0; i < openings.length; i++) {
        var link = openings[i].getElementsByTagName('a').item(0).href;
        links.push(link);
    }
    return links;
}

HRWebsite.prototype.getPagesCount = function() {
    var pages = document.querySelectorAll('.Pagination a');
    if (pages.length == 0) {
        return 0;
    }
    var last_page = pages.item(--pages.length);
    return parseInt(last_page.title);
}

HRWebsite.prototype.fetchOpening = function(url) {
    //url = 'http://www.lagou.com/jobs/598412.html'
    console.log('fetching opening ' + url);
    this.$.ajax({url: url}).done( function (output) {
        var page = this.$(output);
        this.addToMap(url, page);
        //this.appendLogo(url, page);
    });
}

HRWebsite.prototype.fetchPageOpenings = function(page) {
    var openings = this.getPageOpenings(page);
    for (var i = 0; i < openings.length; i++) {
        this.fetchOpening(openings[i]);
    }
}

HRWebsite.prototype.fetchPage = function(url) {
    this.$.ajax({ url: url, callback: this.fetchPageOpenings(page)});
}

HRWebsite.prototype.getCoordinates = function(page) {
    return {
        lng: page.find('input[id=positionLng]').first().val(),
        lat: page.find('input[id=positionLat]').first().val()
    }
}

HRWebsite.prototype.getAddress = function(page) {
    return page.find('dl[class=job_company] dd div').first().text()
}

HRWebsite.prototype.getCity = function(url) {
    return decodeURI(url).match(/(\?|\&)city=([^\&]+)/)[2];
}

HRWebsite.prototype.getCompanyName = function(page) {
    return page.find('dl[class=job_company] h2.fl').first().contents().get(0).nodeValue;
}

HRWebsite.prototype.getLogo = function(page) {
    return page.find('dl[class=job_company] a img.b2').first()
}

HRWebsite.prototype.getOpeningId = function(url) {
    return url.match(/jobs\/([0-9]+)\.html/)[1];
}

HRWebsite.prototype.getMapScript = function(page) {
    var scripts = page.find('script');
    for (var i = 0; i < scripts.length; i++) {
        if (scripts[i].src.match('map\.baidu\.com')) {
            return scripts[i].src;
        }
    }
}

HRWebsite.prototype.addToMap = function(url, page) {
    console.log('page fetched!');

    this.initializeMap(page);

    var coordinates = this.getCoordinates(page);
    var address = this.getAddress(page);
    var city = this.getCity(location);
    var company = this.getCompanyName(page);
    var id = this.getOpeningId(url);

    this.checkMap[id] = window.setInterval(function() {
        console.log('check if map is ready');
        if (typeof this.bmap != 'undefined') {
            window.clearInterval(checkMap[id]);
            console.log('map is ready for ' + id + ': ' + this.checkMap[id]);
            if (coordinates.lat && coordinates.lng) {
                addByCoordinates(coordinates, company, address, city);
            } else {
                this.addByAddress(company, address, city);
            }
        }
    }, 1000);
}

HRWebsite.prototype.addPoint = function(point, company, address, city) {
    //var icon = new BMap.Icon("markers.png", new BMap.Size(23, 25), {    
        //offset: new BMap.Size(10, 25),    
        //imageOffset: new BMap.Size(0, 0 - index * 25)
    //});
    var marker = new BMap.Marker(point);
    this.bmap.addOverlay(marker);

    var tooltip = '<h4>' + company + '</h4>' + '<p>' + address + ' (' + city + ')</p>';
    var infoWindow = new BMap.InfoWindow(tooltip);

    marker.addEventListener("click", function() {
        marker.openInfoWindow(infoWindow);
    });
}

HRWebsite.prototype.addByCoordinates = function(coordinates, company, address, city) {
    console.log('add by coords' + coordinates.lng + ', ' + coordinates.lat)
    var point = new BMap.Point(coordinates.lng, coordinates.lat);
    this.bmap.centerAndZoom(point, 11);
    this.addPoint(point, company, address, city);
}

HRWebsite.prototype.addByAddress = function(company, address, city) {
    console.log('add by address' + address + ', ' + city);
    var gc = new BMap.Geocoder();
    gc.getPoint(address, function(point) {
        if (point) {
            this.addByCoordinates(point, company, address, city);
        }
    }, city);
}

HRWebsite.prototype.initializeMap = function(page) {
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
    this.$('#workplaceSelect').after(map_div);

    // smartass proxying script
    var proxy_script_url = this.getMapScript(page);
    console.log(proxy_script_url);

    // jsonp magic
    this.$.ajax({url: proxy_script_url, dataType: 'jsonp'});

    // XXX jsonpCallback only runs after result is loaded, not the code executed
    this.checkBMap = window.setInterval(function() {
        if (typeof BMap != 'undefined') {
            window.clearInterval(this.checkBMap);
            console.log('making a map!');
            // HACK delay is for webkit
            setTimeout(function() {
                this.bmap = new BMap.Map('map');
                this.bmap.addControl(new BMap.NavigationControl());
                this.bmap.addControl(new BMap.MapTypeControl());
                this.bmap.addControl(new BMap.OverviewMapControl());
                this.bmap.enableScrollWheelZoom(true);
            }, 2000);
        }
    }, 1000);

    console.log('map done');
}


var LaGou = function() {
    HRWebsite.call(this);
}
LaGou.prototype = new HRWebsite();

var NeiTui = function() {
    HRWebsite.call(this);
}
NeiTui.prototype = new HRWebsite();


function makeMap() {
    console.log('>>>>>>>>>>>>>>>>>>>>>');

    this.$ = jQuery = jQuery.noConflict(true);

    console.log('000000000000000000000');
    lagou = new Lagou();
    console.log('111111111111111111111');
    //var openings = lagou.getPageOpenings(document);
    //lagou.fetchOpening(openings[0]);
    lagou.fetchPageOpenings(document);
    console.log('22222222222222222222');

    var pages = lagou.getPagesCount();
    console.log(pages);

    console.log('----------------------');
}

function test() {
    console.log('Passed.');
}

if (window) {
	makeMap();
} else {
	test();
}
