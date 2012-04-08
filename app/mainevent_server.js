#!/usr/bin/env node

/**
 * Serve HTTP requests for the backbone.js powered frontend, assets, and log JSON.
 *
 * Example usage: supervisor --extensions 'css|js|html' app/mainevent_server.js
 *
 * Example flow:
 *   browser - GET /#event/4f44bc7ea679dd8866000002
 *   backbone.js - GET /event/4f44bc7ea679dd8866000002
 *   backbone.js - Update view based on returned JSON.
 */

'use strict';

require(__dirname + '/modules/mainevent.js');

var express = require('express'),
    app = express.createServer(),
    io = require('socket.io').listen(app),
    build = mainevent.requireModule('build');

build.compileViews();
build.staticDir();
build.mongoDbIndexes();

// Required for using *.html with res.render().
app.register('.html', {
  compile: function(str, options) {
    return function() {
      return _.template(str)(options);
    };
  }
});

// Make assets accessible to clients.
app.use(express.static(__dirname + '/../static'));

// Prepended to relative paths given to res.render().
app.set('views', __dirname + '/views');
app.set('view options', {layout: false});

// Route patterns mapped to app/controllers/*.js modules.
var routes = {
  '/': 'index',
  '/event/:id': 'event',
  '/graph/:name': 'graph',
  '/timeline': 'timeline'
};
_.each(routes, function(controller, route) {
  app.get(route, function(req, res) {
    requirejs([__dirname + '/controllers/' + controller + '.js'], function(controller) {
      controller(req, res);
    });
  });
});

// Load all socket controllers under app/sockets/.
io.sockets.on('connection', function (socket) {
  var dir = __dirname + '/sockets',
      fs = require('fs');
  fs.readdir(dir, function(err, files) {
    _.each(files, function(socketController) {
      requirejs([dir + '/' + socketController], function(addEventHandlers) {
        addEventHandlers(socket);
      });
    });
  });
});

app.error(function(err, req, res, next) {
  console.log(err, err.stack, req.query, req.params);
  res.send({__error: err.message}, 500);
});

app.listen(8080, '127.0.0.1');