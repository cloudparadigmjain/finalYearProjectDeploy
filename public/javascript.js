var map;

function createMap () {
  var options = {
    center: { lat: 12.9716, lng: 77.5946 },
    zoom: 12
  };

  var limits = {
    componentRestrictions: {country: "in"}
  };

  map = new google.maps.Map(document.getElementById('map'), options);

  var input = document.getElementById('search');
  var searchBox = new google.maps.places.SearchBox(input,limits);

	var input2 = document.getElementById('search2');
  var searchBox2 = new google.maps.places.SearchBox(input2,limits);

  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
	var markers2= [];

  searchBox.addListener('places_changed', function () {
    var places = searchBox.getPlaces();

    if (places.length == 0)
      return;

    markers.forEach(function (m) { m.setMap(null); });
    markers = [];

    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(p) {
      if (!p.geometry)
        return;

      markers.push(new google.maps.Marker({
        map: map,
        title: p.name,
        position: p.geometry.location
      }));

      if (p.geometry.viewport)
        bounds.union(p.geometry.viewport);
      else
        bounds.extend(p.geometry.location);
    });

    map.fitBounds(bounds);
  });

	searchBox2.addListener('places_changed', function () {
    var places2 = searchBox2.getPlaces();

    if (places2.length == 0)
      return;

    markers2.forEach(function (m2) { m2.setMap(null); });
    markers2 = [];

    var bounds2 = new google.maps.LatLngBounds();
    places2.forEach(function(p2) {
      if (!p2.geometry)
        return;

      markers2.push(new google.maps.Marker({
        map: map,
        title: p2.name,
        position: p2.geometry.location
      }));

      if (p2.geometry.viewport)
        bounds2.union(p2.geometry.viewport);
      else
        bounds2.extend(p2.geometry.location);
    });

    map.fitBounds(bounds2);
  });
}
