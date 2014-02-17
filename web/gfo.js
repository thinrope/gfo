//
// gfo.js : Google Fusion Tables JaveScript visualizer
// Originally coded 2011-07-11 by Kalin KOZHUHAROV <kalin@thinrope.net> for http://thinrope.net/
// Later moved to http://gamma.tar.bz/
//
// No part of this code can be copied or reused on other sites, unless written permission was obtaind by the author.
// Copyright (c) 2011-2012 by Kalin KOZHUHAROV <kalin@thinrope.net> All rights reserved.
//

var tables_0		= new Array(
				"Last_updated","grid", "lat_lon",
				"100km", "100km", "100km", "100km", "100km",
				"50km", "50km",
				"10km", "10km",
				"5km", "5km",
				"1km", "1km",
				"500m", "500m", "500m", "500m", "500m", "500m", "500m", "500m");
var tables_M		= new Array(
				"2012-01-23", "grid", "lat_lon",
//				"2172062", "2172062", "2172062", "2172062", "2172062",	// 0..4
				"17zpmtENRfWxpkKO0B_ohVRT9DovhIGsbyMwXY10", "17zpmtENRfWxpkKO0B_ohVRT9DovhIGsbyMwXY10","17zpmtENRfWxpkKO0B_ohVRT9DovhIGsbyMwXY10","17zpmtENRfWxpkKO0B_ohVRT9DovhIGsbyMwXY10", //enc
				"2168823", "2168823",	//  5..6
				"2168931", "2168931",	//  7..8
				"2172158", "2172158",	//  9..10
				"2168932", "2168932",	// 11..12
				"2084852", "2084852", "2084852", "2084852", "2084852", "2084852", "2084852", "2084852"); // 13..20
var tables		= tables_M;

var coverage		= new Object();
coverage['jp:Hokkaido']	= new Array(+42.0, +46.0, +140.0, +146.0);
coverage['jp:North']	= new Array(+34.0, +42.0, +137.0, +143.0);
coverage['jp:South']	= new Array(+32.0, +36.0, +130.0, +137.0);
coverage['hk']		= new Array(+22.0, +23.0, +113.0, +115.0);
coverage['us:CA']	= new Array(+33.0, +37.0, -122.0, -114.0);
coverage['us:HI']	= new Array(+18.0, +23.0, -161.0, -154.0);
coverage['us:MA']	= new Array(+42.0, +44.0,  -72.0,  -70.0);
coverage['us:FL']	= new Array(+27.0, +29.0,  -83.0,  -81.0);
coverage['us:NJ']	= new Array(+40.0, +42.0,  -74.0,  -73.0);
coverage['kr']		= new Array(+37.0, +38.0, +126.0, +128.0);
coverage['Dubai']	= new Array(+25.0, +26.0,  +55.0,  +57.0);
coverage['at']		= new Array(+48.0, +49.0,  +14.0,  +15.0);
coverage['Norway']	= new Array(+62.0, +63.0,  +22.0,  +24.0);
coverage['Beijing']	= new Array(+39.0, +41.0, +116.0, +117.0);
coverage['au']		= new Array(-29.0, -16.0, +145.0, +154.0);
coverage['Ireland']	= new Array(+52.0, +54.0,   -9.0,   -6.0);


var map			= null;
var zoom		= null;
var layers		= new Object(); layers['l_census'] = null; layers['l_squares'] = null; layers['l_dots'] = null;
var listeners		= new Array('l_census', "l_squares", "l_dots");
var grid_layer		= null;
var table		= tables[0];
var geocoder		= null;

var params = {
	l_grid: 0,				// 0: no grid, 1: show grid
	l_census: 0,				// layer for census data
	l_squares: 0,				// layer for radiation data, average as square
	l_dots: 0,				// layer for radiation data, average as dot
	h: '100%', w: '100%',			// for embedding, not used now
	z: 6,					// initial zoom, 1 .. 16
	lat: undefined, lon: undefined,		// set a marker
	llr: undefined,				// draw radius around the marker in meters
	c: undefined,				// go to location
	loc: undefined,				// go to location and auto zoom
	follow: 1				// 1: follow the GPS
	};
// Examples:
//(geoloc)	http://gamma.tar.bz/maps/main?l_grid=1&lat=35.862&lon=139.97&z=13
//(Japnese ZIP)	http://gamma.tar.bz/maps/main?l_grid=1&loc=108-0073
//(address)	http://gamma.tar.bz/maps/main?l_grid=1&loc=Ireland
//

function parse_params()
{
	var floats = new Array("lat", "lon", "llr");
	var ints = new Array("z");
	var toggles = new Array("l_grid", "l_census", "l_squares", "l_dots", "follow");

	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) { params[key] = value; });
	for (i=0; i<floats.length; i++)
	{
		if (params[floats[i]])
			{ params[floats[i]] = parseFloat(params[floats[i]]); }
	}
	for (i=0; i<ints.length; i++)
	{
		if (params[ints[i]])
			{
				params[ints[i]] = parseFloat(params[ints[i]]);
				params[ints[i]].toFixed(0);
			}
	}
	for (i=0; i<toggles.length; i++)
	{
		if (params[toggles[i]])
		{
			params[toggles[i]] =  (params[toggles[i]] == 1) ? 1 : 0;
		}
	}
	// display squares only, if nothing was selected
	// FIXME: explicit turning off is thus ignored l_dots=0&l_squares=0
	if (!(params['l_dots'] || params['l_squares']))
	{
		params['l_squares'] = 1;
	}
	return true;
}

var draw_current_location = function (pos)
{
	var radius = position.coords.accuracy || 10000;
	var ll = new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
    	marker_was_visible = car_marker && car_marker.getMap() ? true: false;
	if (car_marker)
	{
    	car_marker.setMap(map);
		car_marker.setPosition(ll);
		car_marker.setRadius(radius);
	}
	else
	{
		car_marker = new google.maps.Circle( { map: map, clickable: false, center: ll, fillColor: '#0000ff', fillOpacity: 0.05, strokeColor: '#0000ff', strokeOpacity: 0.8, strokeWeight: 1, radius: radius });
	}
    if (!marker_was_visible)
	{
		map.panTo(ll);
	}
}

function use_GPS()
{
	var watcher;

	if (navigator && navigator.geolocation)
	{
		watcher = navigator.geolocation.watchPosition
		(
			draw_current_location,
			function(err){},
			{ timeout: 5000, maximumAge: 0, enableHighAccuracy: true}
		);
	}
	else
	{
		watcher = null;		// FIXME: more cleanup needed
	}
}

function initialize_map()
{
	parse_params();
	map = new google.maps.Map(
		document.getElementById('fusion_canvas'),
		{
			//center: new google.maps.LatLng(36.94111143010772, 140.60302734375),
			center: new google.maps.LatLng(36.94111143010772 + 10, 140.60302734375),
			zoom: params['z'],
			minZoom: 3,		// grid screwed at <3 
			maxZoom: 17,		// don't show too much
			zoomControl: true,
			panControl: false,
			scaleControl: true,
			scaleControlOptions: { position: google.maps.ControlPosition.TOP_CENTER },
			mapTypeControl: true,
			streetViewControl: false,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		});
	geocoder = new google.maps.Geocoder();
	var style = [{ featureType: 'all', elementType: 'all', stylers: [ { saturation: -60 } ]}];
	var styledMapType = new google.maps.StyledMapType(style, { map: map, name: 'Styled Map' });
	map.mapTypes.set('map-style', styledMapType);
	map.setMapTypeId('map-style');

	draw_coverage(map, coverage);

	document.getElementById('safecast_map').style.height = params['h'];
	document.getElementById('safecast_map').style.width = params['w'];
	var lat_lon_center;
	if ((params['lat']) && (params['lon']))
	{
		lat_lon_center = new google.maps.LatLng(params['lat'], params['lon']);
		var center_marker = new google.maps.Marker({ map: map, draggable: false, title: 'LOC: ' + params['lat'] + ' ' + params['lon'], icon: '/inc/arrow.png', animation: google.maps.Animation.DROP, position: lat_lon_center });
		if (params['llr'])
		{
			var llr_radius = new google.maps.Circle( { map: map, center: lat_lon_center, fillColor: '#00aa99', fillOpacity: 0.1, strokeColor: '#00aaaa', strokeOpacity: 0.8, strokeWeight: 1, radius: params['llr'] });
		}
	}

	// now determine the center of the map by loc, c, lat+lon
	if (params['c'])
		{go_to(params['c'], params['z']);}
	else if (params['loc'])
		{go_to(params['loc'], 0);}
	else if ((params['lat']) && (params['lon']))
		{ map.setCenter(lat_lon_center); change_map(); }
	else
		{change_map();}

	if (params['follow'])
	{
		use_GPS();
	}
	google.maps.event.addListener(map, 'zoom_changed', function() { if (zoom != map.getZoom()) { change_map(); }; });
	return true;
}

function change_map()
{
	update_info(null);	// grey-out the div initially
	zoom = map.getZoom();	// update current zoom
	table = tables[zoom + 3];
	document.getElementById('info').innerHTML = '<p style="text-align: center;">' +
		'<b>grid_size: ' + tables_0[zoom + 3] + '</b>, ' +
		'<b>zoom: ' + zoom + '</b><br />' +
		'dataset last_updated: <b>' + tables[0] + '</b><br />' +
		'<br />' +
		'Click on a square/marker to see its value.</p>';
	
	if (1) //TODO: update only on zoom that needs different table
	{
		// drop all layers FIXME: is this needed?
		for (var layer in layers)
		{
			if (layers[layer])
			{
				layers[layer].setMap(null);
				layers[layer] = null;
			}
		}
		var where_clause = '';
		if (params['l_census'])
		{
			layers['l_census'] = new google.maps.FusionTablesLayer({ query: {select: 'geometry', from: '2113296', where: where_clause} });
			//layers['l_census'].setOptions({ suppressInfoWindows : true});
			//listeners['l_census'] = google.maps.event.addListener(layers['l_census'], 'click', function(e) { update_info(e);});
			layers['l_census'].setMap(map);
		}

		if (params['l_squares'])
		{
			layers['l_squares'] = new google.maps.FusionTablesLayer({ query: {select: tables[1], from: table, where: where_clause} });
			layers['l_squares'].setOptions({ suppressInfoWindows : true});
			listeners['l_squares'] = google.maps.event.addListener(layers['l_squares'], 'click', function(e) { update_info(e);});
			layers['l_squares'].setMap(map);
		}

		if (params['l_dots'])
		{
			layers['l_dots'] = new google.maps.FusionTablesLayer({ query: {select: tables[2], from: table, where: where_clause} });
			layers['l_dots'].setOptions({ suppressInfoWindows : true});
			listeners['l_dots'] = google.maps.event.addListener(layers['l_dots'], 'click', function(e) { update_info(e);});
			layers['l_dots'].setMap(map);
		}

		if (params['l_grid'])
		{
			grid_layer = new LatLonGraticule();
			grid_layer.setMap(map);
		}
		else
		{
			if(grid_layer)
			{
				grid_layer.onRemove();
				grid_layer.setMap(null);
			}
			grid_layer = null;
		}
	}
	return true;
}

function update_info(e)
{
	//document.getElementById("addr").focus();
	var info_div = document.getElementById('info');
	var style = document.getElementById("info_under").style;
	if (e)
	{
		info_div.innerHTML = e.infoWindowHtml;
		var DRE = parseFloat(e.row.DRE.value);
		if (DRE <= 0.2) 
			{style.backgroundColor = '#99ff99';}
		else if (DRE <= 0.5)
			{style.backgroundColor = '#ffff99';}
		else if (DRE <= 1.0)
			{style.backgroundColor = '#ff99ff';}
		else if (DRE <= 5.0)
			{style.backgroundColor = '#9999ff';}
		else if (DRE <= 10.0)
			{style.backgroundColor = '#ff6666';}
		else
			{style.backgroundColor = 'red';}
	}	
	else
	{
		style.backgroundColor='gray';
		info_div.innerHTML = '';
	}
	return true;
}

function center_map()
{
	var addr = document.getElementById("addr").value;
	go_to(addr, 0);
	return true;
}

function go_to(place, zoom)
{
	geocoder.geocode( {'address': place, 'region': "jp"}, function (results, status)
		{
			if (status == google.maps.GeocoderStatus.OK)
			{
				//var marker = new google.maps.Marker( { map: map, position: results[0].geometry.location } );
				//map.setCenter(results[0].geometry.location);
				//map.setZoom(10);
				if (zoom >0)
				{
					map.setCenter(results[0].geometry.location);
					map.setZoom(zoom);
				}
				else
				{
					map.fitBounds(results[0].geometry.viewport);
				}
			 }
			else
				{ alert ("Cannot find " + addr + "! Status: " + status); }
		});
	return true;
}

function draw_coverage(map, coverage)
{
	var NPS = new google.maps.LatLng(37.425252, 141.033247);
	var area_30km = new google.maps.Circle( { map: map, clickable: false, center: NPS, fillColor: '#ff0000', fillOpacity: 0.05, strokeColor: '#ff0000', strokeOpacity: 0.8, strokeWeight: 1, radius: 30000 });
	var area_20km = new google.maps.Circle( { map: map, clickable: false, center: NPS, fillColor: '#ff0000', fillOpacity: 0.05, strokeColor: '#ff0000', strokeOpacity: 0.8, strokeWeight: 1, radius: 20000 });

	for (var area in coverage)
	{
		var map_NESW = new google.maps.LatLngBounds(google.maps.LatLng(coverage[area][0], coverage[area][2]), google.maps.LatLng(coverage[area][1], coverage[area][3]));
		var map_area = new google.maps.Rectangle( {map: map, clickable: false, bounds: map_NESW, fillColor: '#ffffff', fillOpacity: 0.0, strokeColor: '#006600', strokeOpacity: 0.8, strokeWeight: 2 } );
	}
	return true;
}

function bookmark_this()
{
	var tmp_params = params;
	var myURL = window.location.href.split("/")[0];
	tmp_params['z'] = map.getZoom();
	tmp_params['c'] = map.getCenter().toUrlValue();
	myURL += '?';
	for (var key in tmp_params)
	{
		if (tmp_params[key])
		{
			myURL += '&' + key + '=' + tmp_params[key];
		}
	}
	window.location = myURL;

	return false;
}

// vim: set tw=2000 ts=4 :
