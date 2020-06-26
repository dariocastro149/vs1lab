/**
 * Template für Übungsaufgabe VS1lab/Aufgabe3
 * Das Skript soll die Serverseite der gegebenen Client Komponenten im
 * Verzeichnisbaum implementieren. Dazu müssen die TODOs erledigt werden.
 */

/**
 * Definiere Modul Abhängigkeiten und erzeuge Express app.
 */

var http = require('http');
//var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var express = require('express');

var app;
app = express();
app.use(logger('dev'));
/*app.use(bodyParser.urlencoded({
    extended: false
}));*/
app.use(bodyParser.json());
app.disable('etag');

// Setze ejs als View Engine
app.set('view engine', 'ejs');

/**
 * Konfiguriere den Pfad für statische Dateien.
 * Teste das Ergebnis im Browser unter 'http://localhost:3000/'.
 */

app.use(express.static(__dirname + '/public'));

/**
 * Konstruktor für GeoTag Objekte.
 * GeoTag Objekte sollen min. alle Felder des 'tag-form' Formulars aufnehmen.
 */

function GeoTag(latitude, longitude, name, hashtag) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.hashtag = hashtag;
}

/**
 * Modul für 'In-Memory'-Speicherung von GeoTags mit folgenden Komponenten:
 * - Array als Speicher für Geo Tags.
 * - Funktion zur Suche von Geo Tags in einem Radius um eine Koordinate.
 * - Funktion zur Suche von Geo Tags nach Suchbegriff.
 * - Funktion zum hinzufügen eines Geo Tags.
 * - Funktion zum Löschen eines Geo Tags.
 */

var Modul = {

    geotags: [],

    searchRadius: function (latitude, longitude, radius) {
        return this.geotags.filter((item) => Math.pow(item.latitude - latitude, 2) + Math.pow(item.longitude - longitude, 2) <= Math.pow(radius, 2));
    },
    searchNameandHashtag: function (searchTerm) {
        return this.geotags.filter((item) => item.name.includes(searchTerm) || item.hashtag.includes(searchTerm));
    },
    searchName: function (name) {
        return this.geotags.filter((item) => item.name === name);
    },

    addGeoTag: function (geotag) {
        this.geotags.push(geotag);
    },
    removeGeoTag: function (name) {
        this.geotags = this.geotags.filter(item => item.name !== name);
    },
    updateGeoTag: function(name,lat,lon,hashtag) {
        var foundIndex = this.geotags.findIndex(item => item.name === name);

        if(lat) this.geotags[foundIndex].latitude = lat;
        if(lon) this.geotags[foundIndex].longitude = lon;
        if(hashtag) this.geotags[foundIndex].hashtag = hashtag;
    }


};


/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function (req, res) {
    res.render('gta', {
        latinput: null,
        longinput: null
    });
});

/**
 * Route mit Pfad '/tagging' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'tag-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Mit den Formulardaten wird ein neuer Geo Tag erstellt und gespeichert.
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 */
var radius = 10;
app.post('/tagging', function (req, res) {

    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var name = req.body.name;
    var hashtag = req.body.hashtag;

    var search = Modul.searchName(name);

    if (!search.length) {
        Modul.addGeoTag(new GeoTag(
            latitude,
            longitude,
            name,
            hashtag));
        search = Modul.searchName(name);
        res.sendStatus(201);
        res.send(JSON.stringify({
            "latitude": latitude,
            "longitude": longitude,
            "geotags": search,
            "newTag": newTag
        }));
    } else {
        res.sendStatus(409);
    }
});


/**
 * Route mit Pfad '/discovery' für HTTP 'POST' Requests.
 * (http://expressjs.com/de/4x/api.html#app.post.method)
 *
 * Requests enthalten im Body die Felder des 'filter-form' Formulars.
 * (http://expressjs.com/de/4x/api.html#req.body)
 *
 * Als Response wird das ejs-Template mit Geo Tag Objekten gerendert.
 * Die Objekte liegen in einem Standard Radius um die Koordinate (lat, lon).
 * Falls 'term' vorhanden ist, wird nach Suchwort gefiltert.
 */

app.get('/discovery', function (req, res) {
    var name = req.query.q;

    var search = Modul.searchNameandHashtag(name);
    var exists = false;
    var lat = undefined;
    var lon = undefined;

    if (search.length) {
        lat = search[0].latitude;
        lon = search[0].longitude;
        exists = true;
    }
    res.send(JSON.stringify({
        "latitude": lat,
        "longitude": lon,
        "geotags": search,
        "exists": exists
    }));
});


//API

app.get('/geotags', function (req, res) {

    if (Object.keys(req.query).length !== 0) {
        var filter = req.query.q;
        if (filter) {
            if (/^([0-9]+)$/.test(filter)) {
                let lon = req.query.lon;
                let lat = req.query.lat;
                res.json(Modul.searchRadius(lat, lon, filter));
            } else if (/^([A-Za-z]{1,10})$/.test(filter)) {
                res.json(Modul.searchNameandHashtag(filter));
            }
        } else {
            res.sendStatus(404);
        }
    } else {
        res.json(Modul.geotags);
    }


});
app.post('/geotags', function (req, res) {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var name = req.body.name;
    var hashtag = req.body.hashtag;

    var search = Modul.searchName(name);
    if (!search.length) {
        Modul.addGeoTag(new GeoTag(
            latitude,
            longitude,
            name,
            hashtag));
        search = Modul.searchName(name);
        let uri = "geotags/" + name;
        res.set({
            "Location": uri,
        });
        res.sendStatus(201);
    } else {
        res.sendStatus(409);
    }
});

app.put('/geotags/:id', function (req, res) {
    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var hashtag = req.body.hashtag;

    let name = req.params.id;
    let gtag = Modul.searchName(name);
    if (gtag.length) {
        console.log("updating");
        Modul.updateGeoTag(name,latitude,longitude,hashtag);
        console.log(Modul.searchName(name));
        res.sendStatus("200");
    } else {
        res.sendStatus("404");
    }


});

app.delete('/geotags/:id', function (req, res) {
    let name = req.params.id;
    let gtag = Modul.searchName(name);
    if (gtag.length) {
        Modul.removeGeoTag(name);
        res.json(Modul.searchName(name));
    } else {
        res.sendStatus("404");
    }

});
app.get('/geotags/:id', function (req, res) {
    let name = req.params.id;
    let gtag = Modul.searchName(name);
    if (gtag.length) {
        res.json(gtag);
    } else {
        res.sendStatus("404");
    }


});

/**
 * Setze Port und speichere in Express.
 */

var port = 3000;
app.set('port', port);

/**
 * Erstelle HTTP Server
 */

var server = http.createServer(app);

/**
 * Horche auf dem Port an allen Netzwerk-Interfaces
 */

server.listen(port);
