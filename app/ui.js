/**
 * Serve HTTP requests for the backbone.js powered frontend, assets, and log JSON.
 *
 * Example usage: supervisor app/ui.js
 *
 * Example flow:
 *   browser - GET /#event/4f44bc7ea679dd8866000002
 *   backbone.js - GET /event/4f44bc7ea679dd8866000002
 *   backbone.js - Update view based on returned JSON.
 */

'use strict';

var express = require('express');
var app = express.createServer();
GLOBAL.helpers = require(__dirname + '/modules/helpers.js');

// Make dust.js templates available to clientside JS.
require(__dirname + '/modules/views.js').compile();

// Required for using *.html with res.render().
app.register('.html', {
  compile: function(str, options) {
    return function() { return str; };
  }
});

// Make assets accessible to clients.
app.use(express.static(__dirname + '/../public'));

// Prepended to relative paths given to res.render().
app.set('views', __dirname + '/views');
app.set('view options', { layout: false });

// Serve the backbone.js MVC app.
app.get('/', function(req, res) {
  res.render('index.html');
});

app.get('/timeline', function(req, res) {
  var storage = helpers.requireModule('storage/mongodb');
  storage.get_timeline(req.query, function(err, documents) {
    if (err) {
      res.send({error: err});
    } else if (documents.length) {
      var parsers = require(__dirname + '/modules/parsers/parsers.js');
      parsers.addPreview(documents, function(updated) {
        res.send(updated);
      });
    } else {
      res.send([]);
    }
  });
});

app.get('/event/:id', function(req, res) {
  if (req.params.id.match(/^[a-z0-9]{24}$/)) {
    var storage = helpers.requireModule('storage/mongodb');
    storage.get_log(req.params.id, function(err, document) {
      if (err) {
        res.send({error: err});
      } else {
        res.send(document);
      }
    });
  } else {
    res.send(null);
  }
});

app.listen(8080, '127.0.0.1');
