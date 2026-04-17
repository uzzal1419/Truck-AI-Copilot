let map, marker, routeLine;

// INIT MAP
function initMap() {
  map = L.map('map').setView([23.81, 90.41], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(map);

  marker = L.marker([23.81, 90.41]).addTo(map);
}

// ROUTE FIND
async function findRoute() {

  let start = document.getElementById("start").value;
  let end = document.getElementById("end").value;
  let mode = document.getElementById("mode").value;

  if (!start || !end) {
    alert("Enter start & end");
    return;
  }

  saveRoute(start, end);

  let s = await geo(start);
  let e = await geo(end);

  let url = `https://router.project-osrm.org/route/v1/driving/${s.lng},${s.lat};${e.lng},${e.lat}?overview=full&geometries=geojson`;

  let res = await fetch(url);
  let data = await res.json();

  let coords = data.routes[0].geometry.coordinates;
  let latlngs = coords.map(c => [c[1], c[0]]);

  if (routeLine) map.removeLayer(routeLine);

  routeLine = L.polyline(latlngs).addTo(map);
  map.fitBounds(routeLine.getBounds());

  let d = (data.routes[0].distance / 1000).toFixed(2);
  let t = (data.routes[0].duration / 60).toFixed(0);

  let warning = "";

  if (mode === "highway") {
    warning += "<br>🚚 Highway Mode ON";
  }

  if (d < 50) {
    warning += "<br>⚠️ Possible narrow roads";
  }

  let fuelRate = 4;
  let fuelUsed = (d / fuelRate).toFixed(1);

  saveTrip(d, t);

  document.getElementById("info").innerHTML =
    `📏 ${d} km | ⏱️ ${t} min<br>⛽ Fuel: ${fuelUsed} L ${warning}`;
}

// GEO
async function geo(place) {
  let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${place}`);
  let data = await res.json();

  if (!data[0]) {
    alert("Location not found");
    throw new Error("No location");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon)
  };
}

// LIVE GPS
function startTracking() {
  navigator.geolocation.watchPosition(pos => {

    let lat = pos.coords.latitude;
    let lng = pos.coords.longitude;

    map.setView([lat, lng], 15);
    marker.setLatLng([lat, lng]);

    document.getElementById("info").innerHTML =
      `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  });
}

// OFFLINE GPS
let lastPos = null;
let total = 0;

function startOfflineGPS() {
  navigator.geolocation.watchPosition(pos => {

    let lat = pos.coords.latitude;
    let lng = pos.coords.longitude;

    if (lastPos) {
      total += getDistance(lastPos.lat, lastPos.lng, lat, lng);
    }

    lastPos = { lat, lng };

    document.getElementById("info").innerHTML =
      `📡 Distance: ${total.toFixed(2)} km`;
  });
}

// DISTANCE
function getDistance(a, b, c, d) {
  let R = 6371;

  let dLat = (c - a) * Math.PI / 180;
  let dLon = (d - b) * Math.PI / 180;

  let x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a * Math.PI / 180) *
    Math.cos(c * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ROUTE MEMORY
function saveRoute(start, end) {
  let routes = JSON.parse(localStorage.getItem("routes")) || [];
  routes.push({ start, end });
  localStorage.setItem("routes", JSON.stringify(routes));
}

function suggestRoute() {
  let routes = JSON.parse(localStorage.getItem("routes")) || [];
  if (!routes.length) return;

  let last = routes[routes.length - 1];

  document.getElementById("start").value = last.start;
  document.getElementById("end").value = last.end;
}

// TRIP HISTORY
function saveTrip(d, t) {
  let trips = JSON.parse(localStorage.getItem("trips")) || [];

  trips.push({
    distance: d,
    time: t,
    date: new Date().toLocaleString()
  });

  localStorage.setItem("trips", JSON.stringify(trips));
}

function showTrips() {
  let trips = JSON.parse(localStorage.getItem("trips")) || [];

  let text = "📊 Trip History<br>";

  trips.forEach(trip => {
    text += `${trip.distance} km | ${trip.time} min<br>`;
  });

  document.getElementById("info").innerHTML = text;
}

// VOICE AI
function startVoice() {

  let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

  recognition.lang = "en-US";
  recognition.start();

  document.getElementById("voiceText").innerHTML = "🎤 Listening...";

  recognition.onresult = function(event) {

    let text = event.results[0][0].transcript;
    document.getElementById("voiceText").innerHTML = "You said: " + text;

    handleVoice(text.toLowerCase());
  };
}

function handleVoice(text) {

  let reply = "";

  if (text.includes("route")) {
    reply = "Finding route";
    findRoute();
  }
  else if (text.includes("location")) {
    reply = "Showing location";
    startTracking();
  }
  else if (text.includes("offline")) {
    reply = "Offline mode started";
    startOfflineGPS();
  }
  else if (text.includes("history")) {
    reply = "Showing history";
    showTrips();
  }
  else {
    reply = "Truck assistant ready";
  }

  speak(reply);
}

function speak(text) {
  let speech = new SpeechSynthesisUtterance(text);
  speech.lang = "en-US";
  window.speechSynthesis.speak(speech);
}

// INIT
window.onload = initMap;
// 🌐 ONLINE/OFFLINE STATUS
function updateStatus() {
  let status = document.getElementById("status");

  if (navigator.onLine) {
    status.innerHTML = "🟢 Online";
    status.className = "status online";
  } else {
    status.innerHTML = "🔴 Offline";
    status.className = "status offline";
  }
}

window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);

updateStatus();