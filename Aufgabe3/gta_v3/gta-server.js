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
app.use(bodyParser.urlencoded({
    extended: false
}));

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

function GeoTag(latitude, longitude, name, hashtag){
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
    searchRadius: function(latitude, longitude, radius){
        var taglist = [];
        this.geotags.forEach(function (item) {
            var distance = Math.pow(item.latitude - latitude, 2) + Math.pow(item.latitude - latitude, 2);
            if (distance <= Math.pow(radius, 2)){
                taglist.push(item);
            }
        })
        return taglist;
    },
    searchName: function(name){
        var taglist = [];
        this.geotags.forEach(function (item) {
            if (item.name === name){
                taglist.push(item);
            }
            else if (item.hashtag === '#' + name){
                taglist.push(item);
            }
        })
        return taglist;
    },
    addGeoTag: function (geotag){
        this.geotags.push(geotag);
    },
    removeGeoTag: function (geotag) {
        this.geotags.forEach(function (item) {
          if (item.name === geotag.name){
              this.geotags.pop(item);
          }
        })
    }
};
Modul.addGeoTag(new GeoTag(49.013987,8.406670,"test","#test"));
Modul.addGeoTag(new GeoTag( 49.007733,8.399960,"testen","#testen"));
console.log(Modul.geotags);
/**
 * Route mit Pfad '/' für HTTP 'GET' Requests.
 * (http://expressjs.com/de/4x/api.html#app.get.method)
 *
 * Requests enthalten keine Parameter
 *
 * Als Response wird das ejs-Template ohne Geo Tag Objekte gerendert.
 */

app.get('/', function(req, res) {
    res.render('gta', {
        taglist: Modul.geotags,
        latinput: undefined,
        longinput: undefined
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
app.post('/tagging', function(req, res) {

    var latitude = req.body.latitude;
    var longitude = req.body.longitude;
    var name = req.body.name;
    var hashtag = req.body.hashtag;

    Modul.addGeoTag(new GeoTag(
            latitude,
            longitude,
            name,
            hashtag));

    res.render('gta', {
        taglist: Modul.searchRadius(latitude, longitude, radius),
        latinput: latitude,
        longinput: longitude,
        name: name,
        hashtag: hashtag
    });

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

app.post('/discovery', function(req, res) {

    if (req.body.name !== undefined){
        res.render('gta', {
            taglist: Modul.searchName(req.body.name),
            latinput: 40,
            longinput: 8
        });
    }
    else {
        res.render('gta', {
            taglist: [],
            latinput: 40,
            longinput: 8
        });
    };




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
