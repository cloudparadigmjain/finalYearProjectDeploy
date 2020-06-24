
function initialize() {
var input = document.getElementById('searchTextField');
new google.maps.places.Autocomplete(input);
var input1 = document.getElementById('searchTextField2');
new google.maps.places.Autocomplete(input1);
}

google.maps.event.addDomListener(window, 'load', initialize);
