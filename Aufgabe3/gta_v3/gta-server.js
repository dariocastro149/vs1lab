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
var radius = 10;
app = express();
app.use(logger('dev'));
app.use(bodyParser.json());// for parsing application/json
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

    searchRadius: function (latitude, longitude, radius, tagList) {
        let myTagList = tagList ? tagList : this.geotags;
        return myTagList.filter((item) => Math.pow(item.latitude - latitude, 2) + Math.pow(item.longitude - longitude, 2) <= Math.pow(radius, 2));
    },

    searchNameFuzzy: function (name, tagList) {
        let myTagList = tagList ? tagList : this.geotags;
        return myTagList.filter((item) => item.name.includes(name) || item.hashtag.includes(name));
    },

    searchName: function (name, tagList) {
        let myTagList = tagList ? tagList : this.geotags;
        myTagList = myTagList.filter((item) => item.name === name);
        myTagList = myTagList.length > 0 ? myTagList[0] : null;
        return myTagList;
    },

    deleteByName: function (name) {
        let len = this.geotags.length;
        this.geotags = this.geotags.filter((item) => item.name !== name);
        return len !== this.geotags.length;
    },

    changeGeoTag: function (geotag, currentName) {
        let index = this.geotags.map((listTag) => listTag.name).indexOf(currentName);
        if (index >= 0) {
            this.geotags[index] = geotag;
            return true;
        }
        return false;
    },

    addGeoTag: function (geotag) {
        if (this.geotags.filter((listTag) => listTag.name === geotag.name).length > 0) {
            return false;
        } else {
            this.geotags.push(geotag);
            return true;
        }

    },
    removeGeoTag: function (geotag) {
        this.geotags = this.geotags.filter(item.name !== geotag.name);
    }

};

// Modul.addGeoTag(new GeoTag(49.013987,8.406670,"test","#test"));
// Modul.addGeoTag(new GeoTag( 49.007733,8.399960,"testen","#testen"));
//console.log(Modul.geotags);

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
        taglist: Modul.geotags,
        latinput: null,
        longinput: null
    });
});


//---------------------------REST-API------------------------------------
app.get('/geotags', function (req, res) {
    let returnTags = Modul.geotags;
    if (req.query.name) {
        returnTags = Modul.searchNameFuzzy(req.query.name, returnTags)
    }
    if (req.query.radius) {
        returnTags = Modul.searchRadius(req.query.radius, returnTags)
    }
    return res.status(200).send(returnTags);
});

app.post('/geotags', function (req, res) {
    let newTag = req.body;
    if (Modul.addGeoTag(newTag)) {
        return res.status(201).send(newTag);
    } else {
        return res.status(400).send("Duplicate Name");
    }
});

app.get('/geotags/:name', function (req, res) {
    let returnTag;
    if (req.params.name) {
        returnTag = Modul.searchName(req.params.name, returnTag);
        if (returnTag) {
            return res.status(200).send(returnTag);
        } else {
            return res.status(400).send("No Element with this ID");
        }
    } else {
        return res.status(400).send("No name given");
    }
});

app.delete('/geotags/:name', function (req, res) {
    if (req.params.name) {
        if (Modul.deleteByName(req.params.name)) {
            return res.status(200).send();
        }
    }
    return res.status(400).send("No name given");
});

app.put('/geotags/:name', function (req, res) {
    let newTag = req.body;
    if (req.params.name) {
        if (Modul.changeGeoTag(newTag, req.params.name)) {
            return res.status(200).send(newTag);
        } else {
            return res.status(400).send("Name not found");
        }
    } else {
        return res.status(400).send("No name given");
    }

});
//---------------------------END-REST-API------------------------------------

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
app.post('/tagging', function (req, res) {

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

app.post('/discovery', function (req, res) {

    if (req.body.name !== undefined) {
        res.render('gta', {
            taglist: Modul.searchNameFuzzy(req.body.name),
            latinput: req.body.latitude,
            longinput: req.body.longitude
        });
    }
    else {
        res.render('gta', {
            taglist: Modul.geotags,
            latinput: req.body.latitude,
            longinput: req.body.longitude
        });
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
