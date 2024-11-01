let map, marker, geocoder;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -26.2041, lng: 28.0473 }, // Johannesburg coordinates
    zoom: 12
  });

  marker = new google.maps.Marker({
    map: map,
    draggable: true
  });

  geocoder = new google.maps.Geocoder();

  document.getElementById('find-location').addEventListener('click', () => {
    const street = document.getElementById('street').value;
    const city = document.getElementById('city').value;
    const zip = document.getElementById('zip').value;
    const country = document.getElementById('country').value;
    
    const address = `${street}, ${city}, ${zip}, ${country}`;
    
    if (address) {
      geocodeAddress(address);
    } else {
      alert('Please enter a complete address.');
    }
  });

  document.getElementById('confirm-location').addEventListener('click', () => {
    const position = marker.getPosition();
    const street = document.getElementById('street').value;
    const city = document.getElementById('city').value;
    const zip = document.getElementById('zip').value;
    const country = document.getElementById('country').value;

    const finalAddress = `${street}, ${city}, ${zip}, ${country}`;

    if (finalAddress && position) {
      if (typeof(Storage) !== 'undefined') {
        localStorage.setItem('selectedStreet', street);
        localStorage.setItem('selectedCity', city);
        localStorage.setItem('selectedZip', zip);
        localStorage.setItem('selectedCountry', country);
        localStorage.setItem('selectedLat', position.lat());
        localStorage.setItem('selectedLng', position.lng());
        
        window.location.href = 'deliveryinfo.html';
      } else {
        alert('Local Storage is not supported in this browser.');
      }
    } else {
      alert('Please select a valid address.');
    }
  });
}

function geocodeAddress(address) {
  geocoder.geocode({ 'address': address }, (results, status) => {
    if (status === 'OK') {
      if (results.length > 0) {
        map.setCenter(results[0].geometry.location);
        marker.setPosition(results[0].geometry.location);
        map.setZoom(15);
        document.getElementById('street').value = results[0].address_components.find(comp => comp.types.includes('street_number'))?.long_name + ' ' + results[0].address_components.find(comp => comp.types.includes('route'))?.long_name || '';
        document.getElementById('city').value = results[0].address_components.find(comp => comp.types.includes('locality'))?.long_name || '';
        document.getElementById('zip').value = results[0].address_components.find(comp => comp.types.includes('postal_code'))?.long_name || '';
        document.getElementById('country').value = results[0].address_components.find(comp => comp.types.includes('country'))?.long_name || '';
      } else {
        alert('No results found for the provided address.');
      }
    } else {
      console.error('Geocode was not successful for the following reason: ' + status);
      alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

window.onload = initMap;
