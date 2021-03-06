/* eslint-disable */
export const displayMap = locations => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoiaXp1bmEtODk0IiwiYSI6ImNqemVnNXlmMTAyMXUzbXQ2MzQ3cWlpYXgifQ.5J-jQfhtF71FNHw4YjK-9Q";

  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/izuna-894/ckcay60ii5ma11iqhn1sh3f6p",
    scrollZoom: false
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach(loc => {
    // Create marker
    const el = document.createElement("div");
    el.className = "marker";

    // Add marker
    new mapboxgl.Marker({
      element: el,
      anchor: "bottom"
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add popup
    new mapboxgl.Popup({
      offset: 30
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extend map bounds to include current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100
    }
  });
};
