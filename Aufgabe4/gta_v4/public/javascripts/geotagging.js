/* Dieses Skript wird ausgeführt, wenn der Browser index.html lädt. */

// Befehle werden sequenziell abgearbeitet ...

/**
 * "console.log" schreibt auf die Konsole des Browsers
 * Das Konsolenfenster muss im Browser explizit geöffnet werden.
 */
console.log("The script is going to start...");

// Es folgen einige Deklarationen, die aber noch nicht ausgeführt werden ...

// Hier wird die verwendete API für Geolocations gewählt
// Die folgende Deklaration ist ein 'Mockup', das immer funktioniert und eine fixe Position liefert.
GEOLOCATIONAPI = {
    getCurrentPosition: function (onsuccess) {
        onsuccess({
            "coords": {
                "latitude": 49.013790,
                "longitude": 8.390071,
                "altitude": null,
                "accuracy": 39,
                "altitudeAccuracy": null,
                "heading": null,
                "speed": null
            },
            "timestamp": 1540282332239
        });
    }
};

// Die echte API ist diese.
// Falls es damit Probleme gibt, kommentieren Sie die Zeile aus.
GEOLOCATIONAPI = navigator.geolocation;

/**
 * GeoTagApp Locator Modul
 */
var gtaLocator = (function GtaLocator(geoLocationApi) {

    // Private Member

    /**
     * Funktion spricht Geolocation API an.
     * Bei Erfolg Callback 'onsuccess' mit Position.
     * Bei Fehler Callback 'onerror' mit Meldung.
     * Callback Funktionen als Parameter übergeben.
     */
    var tryLocate = function (onsuccess, onerror) {
        if (geoLocationApi) {
            geoLocationApi.getCurrentPosition(onsuccess, function (error) {
                var msg;
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        msg = "User denied the request for Geolocation.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        msg = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        msg = "The request to get user location timed out.";
                        break;
                    case error.UNKNOWN_ERROR:
                        msg = "An unknown error occurred.";
                        break;
                }
                onerror(msg);
            });
        } else {
            onerror("Geolocation is not supported by this browser.");
        }
    };

    // Auslesen Breitengrad aus der Position
    var getLatitude = function (position) {
        return position.coords.latitude;
    };

    // Auslesen Längengrad aus Position
    var getLongitude = function (position) {
        return position.coords.longitude;
    };

    // Hier Google Maps API Key eintragen
    var apiKey = "QTafwzVqTK3BhWeuo35UUqFX7TmyAMiv";

    /**
     * Funktion erzeugt eine URL, die auf die Karte verweist.
     * Falls die Karte geladen werden soll, muss oben ein API Key angegeben
     * sein.
     *
     * lat, lon : aktuelle Koordinaten (hier zentriert die Karte)
     * tags : Array mit Geotag Objekten, das auch leer bleiben kann
     * zoom: Zoomfaktor der Karte
     */
    var getLocationMapSrc = function (lat, lon, tags, zoom) {
        zoom = typeof zoom !== 'undefined' ? zoom : 10;

        if (apiKey === "API_KEY") {
            console.log("No API key provided.");
            return "images/mapview.jpg";
        }

        var tagList = "&pois=You," + lat + "," + lon;
        if (tags !== undefined) tags.forEach(function (tag) {
            tagList += "|" + tag.name + "," + tag.latitude + "," + tag.longitude;
        });

        var urlString = "https://www.mapquestapi.com/staticmap/v4/getmap?key=" +
            apiKey + "&size=600,400&zoom=" + zoom + "&center=" + lat + "," + lon + "&" + tagList;

        console.log("Generated Maps Url: " + urlString);
        return urlString;
    };

    return { // Start öffentlicher Teil des Moduls ...

        // Public Member

        readme: "Dieses Objekt enthält 'öffentliche' Teile des Moduls.",

        updateMap(latitude, longitude) {
            var list = JSON.parse(document.getElementById("result-img").dataset.tags);
            console.log(list);
            document.getElementById("result-img").src = getLocationMapSrc(latitude, longitude, list);
        },

        updateMapAndList(latitude, longitude, list) {
            var ul = document.getElementById("results");
            while (ul.firstChild) {
                ul.removeChild(ul.lastChild);
            }
            document.getElementById("result-img").src = getLocationMapSrc(latitude, longitude, list);
            document.getElementById("latitude-input").value = latitude;
            document.getElementById("latitude-user").value = latitude;
            document.getElementById("longitude-input").value = longitude;
            document.getElementById("longitude-user").value = longitude;

            list.forEach(gtag => {
                let li = document.createElement("li");
                li.appendChild(document.createTextNode(gtag.name + " (" + gtag.latitude + ", " + gtag.longitude + ") " + gtag.hashtag));
                ul.appendChild(li);
            });


        },

        updateLocation: function () {
            var onerror = function (error) {
                alert(error);
            };
            var onsuccess = function (position) {
                var latitude = getLatitude(position);
                var longitude = getLongitude(position);

                document.getElementById("latitude-input").value = latitude;
                document.getElementById("latitude-user").value = latitude;
                document.getElementById("longitude-input").value = longitude;
                document.getElementById("longitude-user").value = longitude;

                //add geotags list?
                this.updateMap(latitude, longitude);
            };
            tryLocate(onsuccess.bind(this), onerror);
        }

    }; // ... Ende öffentlicher Teil
})(GEOLOCATIONAPI);


/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTag(latitude, longitude, name, hashtag){
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.hashtag = hashtag;
}

function refreshTags(params){
    let url="/geotags";
    if(params){
        url+="?"+params;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
            if(this.status === 200) {
                let res = JSON.parse(this.responseText);
                let latitude = document.getElementById("latitude-input").value;
                let longitude = document.getElementById("longitude-input").value;
                gtaLocator.updateMapAndList(latitude,longitude,res);
            } else{
                alert("Something went wrong with the network request.")
            }
        }
    };
    xhttp.open("GET", url, true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send();
}


function taggingClick(event){
    event.preventDefault();
    let latitude = document.getElementById("latitude-input").value;
    let longitude = document.getElementById("longitude-input").value;
    let name = document.getElementById("name-input").value;
    let hashtag = document.getElementById("hashtag-input").value;
    let geoTag = new GeoTag(latitude,longitude,name,hashtag);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && !this.status.toString().startsWith("2")) {
            alert("Something went wrong with the network request.");
        } else if(this.readyState === XMLHttpRequest.DONE){
            refreshTags();
        }
    };
    xhttp.open("POST", "/geotags", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(geoTag));
}

function discoveryClick(event){
    event.preventDefault();
    let name = document.getElementById("searchterm-input").value;
    let params = "name="+name;
    refreshTags(params);
}

/**
 * $(function(){...}) wartet, bis die Seite komplett geladen wurde. Dann wird die
 * angegebene Funktion aufgerufen. An dieser Stelle beginnt die eigentliche Arbeit
 * des Skripts.
 */
$(function () {
    //alert("Please change the script 'geotagging.js'");
    var latinput = document.getElementById("latitude-input").value;
    var longinput = document.getElementById("longitude-input").value;

    if (!latinput && !longinput) {
        gtaLocator.updateLocation();
        console.log("location updated");
    } else {
        gtaLocator.updateMap(latinput, longinput)
    }
});