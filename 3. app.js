body {
  font-family: Arial;
  margin:0;
  padding:10px;
  background:#f2f2f2;
}

h2, h3 {
  text-align:center;
}

input, select, button {
  width:100%;
  padding:10px;
  margin:5px 0;
  font-size:16px;
}

button {
  background:green;
  color:white;
  border:none;
}

#map {
  height:45vh;
  width:100%;
}

#chatBox {
  height:150px;
  overflow-y:auto;
  background:white;
  padding:10px;
}

#info {
  background:white;
  padding:10px;
  margin-top:10px;
}let map, dirService, dirRenderer, marker;

// INIT MAP
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: { lat: 23.81, lng: 90.41 }
  });

  dirService = new google.maps.DirectionsService();
  dirRenderer = new google.maps.DirectionsRenderer();
  dirRenderer.setMap(map);

  marker = new google.maps.Marker({
    position: { lat: 23.81, lng: 90.41 },
    map: map
  });
}

// ROUTE + SAVE
function findRoute() {

  let start = document.getElementById("start").value;
  let end = document.getElementById("end").value;

  saveRoute(start, end);

  dirService.route({
    origin: start,
    destination: end,
    travelMode: "DRIVING"
  }, function(result, status) {

    if (status !== "OK") return;

    dirRenderer.setDirections(result);

    let best = result.routes[0];

    document.getElementById("info").innerHTML =
      best.legs[0].distance.text + " | " +
      best.legs[0].duration.text;
  });
}

// SAVE ROUTE
function saveRoute(start, end) {

  let routes = JSON.parse(localStorage.getItem("routes")) || [];

  routes.push({ start, end });

  localStorage.setItem("routes", JSON.stringify(routes));
}

// SUGGEST ROUTE
function suggestRoute() {

  let routes = JSON.parse(localStorage.getItem("routes")) || [];

  if (routes.length === 0) return;

  let last = routes[routes.length - 1];

  document.getElementById("start").value = last.start;
  document.getElementById("end").value = last.end;
}

// GPS TRACK
function startTracking() {

  navigator.geolocation.watchPosition(function(pos) {

    let lat = pos.coords.latitude;
    let lng = pos.coords.longitude;

    let p = { lat, lng };

    map.setCenter(p);
    marker.setPosition(p);
  });
}

// OFFLINE GPS
let lastPos = null, total = 0;

function startOfflineGPS() {

  navigator.geolocation.watchPosition(function(pos) {

    let lat = pos.coords.latitude;
    let lng = pos.coords.longitude;

    if (lastPos) {
      total += getDistance(lastPos.lat, lastPos.lng, lat, lng);
    }

    lastPos = { lat, lng };

    document.getElementById("info").innerHTML =
      "Distance: " + total.toFixed(2) + " km";
  });
}

function getDistance(a,b,c,d){
  let R=6371;
  let dLat=(c-a)*Math.PI/180;
  let dLon=(d-b)*Math.PI/180;
  let x=Math.sin(dLat/2)**2+
    Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*
    Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

// AI CHAT
function sendMsg() {
  let input = userInput.value.toLowerCase();
  chatBox.innerHTML += "<p>You: "+input+"</p>";

  let reply = "Truck AI ready";

  if(input.includes("safe")) reply="Use highway";
  if(input.includes("fuel")) reply="Fuel depends distance";

  chatBox.innerHTML += "<p>AI: "+reply+"</p>";
}

// VOICE
function startVoice(){
  let r=new (webkitSpeechRecognition)();
  r.start();
  r.onresult=e=>{
    speak(e.results[0][0].transcript);
  }
}

function speak(t){
  speechSynthesis.speak(new SpeechSynthesisUtterance(t));
}