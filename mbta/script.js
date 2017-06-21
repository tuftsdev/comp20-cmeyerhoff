function init(){
	var southStation = new google.maps.LatLng(42.352271, -71.05524200000001);
	var userLocation;
	var closestStop = {"station":"nostation", "lat":0, "lng":0, "distance":100000000000000000000};

	// Each object is ordered by when the stops occur during tranist. This aids in line drawing.
	// Two separate arrays/lists used to represent the "main" line of the red line (alewife -> braintree)
	// and the other split-off line (JFK/UMass -> Ashmont)
	var jsonString = '[[{"station":"Alewife","lat":42.395428,"lng":-71.142483},' +
	 '{"station":"Davis","lat":42.39674,"lng":-71.121815},' +
	 '{"station":"Porter Square","lat":42.3884,"lng":-71.11914899999999},' +
	 '{"station":"Harvard Square","lat":42.373362,"lng":-71.118956},' +
	 '{"station":"Central Square","lat":42.365486,"lng":-71.103802},' +
	 '{"station":"Kendall/MIT","lat":42.36249079,"lng":-71.08617653},' +
	 '{"station":"Charles/MGH","lat":42.361166,"lng":-71.070628},' +
	 '{"station":"Park Street","lat":42.35639457,"lng":-71.0624242},' +
	 '{"station":"Downtown Crossing","lat":42.355518,"lng":-71.060225},' +
	 '{"station":"South Station","lat":42.352271,"lng":-71.05524200000001},' +
	 '{"station":"Broadway","lat":42.342622,"lng":-71.056967},' +
	 '{"station":"Andrew","lat":42.330154,"lng":-71.057655},' +
	 '{"station":"JFK/UMass","lat":42.320685,"lng":-71.052391},' +
	 '{"station":"North Quincy","lat":42.275275,"lng":-71.029583},' +
	 '{"station":"Wollaston","lat":42.2665139,"lng":-71.0203369},' +
	 '{"station":"Quincy Center","lat":42.251809,"lng":-71.005409},' +
	 '{"station":"Quincy Adams","lat":42.233391,"lng":-71.007153},' +
	 '{"station":"Braintree","lat":42.2078543,"lng":-71.0011385}],'+

	 '[{"station":"Savin Hill","lat":42.31129,"lng":-71.053331},' +
	 '{"station":"Fields Corner","lat":42.300093,"lng":-71.061667},' +
	 '{"station":"Shawmut","lat":42.29312583,"lng":-71.06573796000001},' +
	 '{"station":"Ashmont","lat":42.284652,"lng":-71.06448899999999}]]';

	var parsedData = JSON.parse(jsonString);
	var iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
	var altpin = 'pin.png'; // pin image source: https://d30y9cdsu7xlg0.cloudfront.net/png/5091-200.png

	var map = new google.maps.Map(document.getElementById("map"), {
		zoom: 12, 
		center: southStation,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});


	
	


	//Triplist.Trips[i]

	// referenced geolocation_map.html in examples

	// this setup takes time and holds up putting other markers/stations on the map, but it allows the processing
	// of data/looping through all the station JSON data once, as opposed to multiple times (once to populate the page,
	// and another to calculate the distance from the user to every station. Could be changed for user experience, but 
	// would be slightly less efficient resource wise - unless the time waiting is wasted anyway...)
	if(navigator.geolocation){
		navigator.geolocation.getCurrentPosition(function(position){  // change position name to make sure you understand
			// for whatever reason, setting externally created variable in here did not work. Guessing becuase
			// how javascripts garbage collection works (used new keyword inside if statement - deleted after?)
			userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			var tempMarker = new google.maps.Marker({ // Add marker
					position: userLocation,
					title: "This is me."
				});
			tempMarker.setMap(map);
			map.panTo(userLocation);

			
			// Adding info winow with good data and draw polyline on callback from processData()
			processData(function(){
				var info = new google.maps.InfoWindow();
				google.maps.event.addListener(tempMarker, 'click', function() {
					// source for conversion: https://stackoverflow.com/questions/20674439/how-to-convert-meter-to-miles
					// random comment suggested good method for getting decimal places:
					// https://stackoverflow.com/questions/1726630/formatting-a-number-with-exactly-two-decimals-in-javascript
					var temp = closestStop.station + " - distance: " + Math.round((closestStop.distance/1609.344)*100)/100 + " miles";
					info.setContent(temp); // this needs to display distance to nearest stop (and name)
					info.open(map, tempMarker); // switch to this?
				});
				var polyline = new google.maps.Polyline({
		          path: [userLocation,{lat: closestStop.lat, lng: closestStop.lng}],
		          geodesic: true,
		          strokeColor: '#FF00FF',
		          strokeOpacity: 1.0,
		          strokeWeight: 2
		        });
		        polyline.setMap(map);

			}); 
			// partial reason, this request takes time, and things proceed BEFORE response is recieved.
			// Asynchronous! duh!
			/*userLat = position.coords.latitude;
			userLng = position.coords.longitude;
			console.log(userLat);
			console.log(userLng);*/

			
		});
	} 


	else {
		alert("Geolocation not supported/unavailable.");
	}

	
	function processData(callback){
	// Do the same thing for both of the separate lists of stations within the larger array
		for(n = 0; n < 2; n++){
			var latLongPairs = [];

			// calculate smallest distance in this loop! - dont need to modfy latLongPairs that way
			// Add markers and prepare data for polylines
			for(i = 0; i < parsedData[n].length; i++){
				var tempStation = new google.maps.LatLng(parsedData[n][i].lat, parsedData[n][i].lng);
				// Add markers for each station
				var tempMarker = new google.maps.Marker({
						position: tempStation,
						title: parsedData[n][i].station,
						icon: altpin
					});
				tempMarker.setMap(map);


			// inside creating each infobow for all the stops
				var info = new google.maps.InfoWindow();
				google.maps.event.addListener(tempMarker, 'click', function() {	
					var infoWindowData;
					var request = new XMLHttpRequest();
					request.open("GET", "https://defense-in-derpth.herokuapp.com/redline.json", true);
					request.onreadystatechange = function() { 
						if (request.readyState = 4 && request.status == 200){
							var response = request.responseText;
							var parsedReponse = JSON.parse(response);
							for (i = 0; i < parsedReponse.Triplist.Trips.length; i++){
								for(j = 0; j < parsedReponse.Triplist.Trips[i].Predictions.length; j++){
									console.log("im out here!");
									if(parsedReponse.Triplist.Trips[i].Predictions[j].Stop == tempMarker.title){
									// set destination and time to arrival to the station
									infoWindowData =+ parsedReponse.Triplist.Trips[i].Predictions[j].Stop + ": " + (parsedReponse.Triplist.Trips[i].Predictions[j].Seconds)/60 + " min";
									console.log(infoWindowData);
									console.log("im in here!");
									}
								}	
							}
						}
					}


					info.setContent(infoWindowData); // this needs to display distance to nearest stop (and name)
					info.open(map, this); // switch to this?
				});


				// Add lat-long pairs to another object in correct format for polyline drawing
				latLongPairs[i] = {lat:parsedData[n][i].lat, lng:parsedData[n][i].lng};
				// calculate distance between current stop and userLocation to find shortest distance
				var distanceToStop = google.maps.geometry.spherical.computeDistanceBetween(userLocation, tempStation);
				//console.log(distanceToStop);
				//console.log(closestStop.distance);
				if (distanceToStop < closestStop.distance){
					closestStop.distance = distanceToStop;
					closestStop.station = parsedData[n][i].station;
					closestStop.lat = parsedData[n][i].lat;
					closestStop.lng = parsedData[n][i].lng;
				}
			}

			

			// for the first stop on the second line, add JFK/UMass where the lines split.
			// Done here so it is included in line draw, but not above where a duplicate marker would be added.
			if(n == 1){
				latLongPairs.unshift({lat:42.320685, lng:-71.052391});
			}

			// Draw a line through the ordered lat long pairs (for both segments of the Red Line)
			var polyline = new google.maps.Polyline({
		          path: latLongPairs,
		          geodesic: true,
		          strokeColor: '#FF0000',
		          strokeOpacity: 1.0,
		          strokeWeight: 2
		        });

			polyline.setMap(map);

		}
	callback();
	}

}
