
# [mainevent](http://codeactual.github.com/mainevent)

mainevent provides a suite of tools to gain insight into your log files.

* Collect, parse and store log updates from local and SSH-accessible log files.
* Easily write new parser modules for any file format.
* Searchable timeline with optional real-time updates.
* Dashboard analytics generated by MongoDB MapReduce, Redis and jqPlot.
* Write custom Pub/Sub listeners to real-time updates.
* [more ...](http://codeactual.github.com/mainevent)

<a href="http://codeactual.github.com/mainevent"><img alt="3-screenshot set" src="http://codeactual.github.com/mainevent/img/screenshot-set.png" /></a>

## Use Cases

* Search development/production environment logs, whether they're syslog, JSON, nginx or proprietary.
* Produce dashboard data and graphs specific to your insight needs.
* Filter and replicate real-time updates into additional systems for specialized processing or alerting.

## Components

### Frontend

#### [mainevent_server.js](https://github.com/codeactual/mainevent/blob/master/bin/mainevent_server.js)

`$ bin/mainevent_server.js`

Has three responsibilities:

1. &nbsp;`/` serves the backbone.js MVC app.
1. &nbsp;`/api` serves JSON data including graph points, event objects and timeline pages.
1. &nbsp;`/socket.io` serves real-time timelime updates.

Triggers `public/build.js` on startup to build the `static/` directory.

#### public/build.js

`$ public/build.js`

* Combines and compresses JS/CSS files located in `public/`.
* Relies on `public/js/app.build.js` for RequireJS configuration.
* Triggers `public/js/templates.build.js`.

Outputs all files into `static/`.

#### public/js/templates.build.js

Compiles dust.js templates in `app/views` and `app/parsers/*/templates`.

#### public/js/app.build.js

RequireJS configuration for client-side dependencies.

### Backend

### Background

#### [tail.js](https://github.com/codeactual/mainevent/blob/master/bin/tail.js)

`$ bin/tail.js`

Spawns `tail` instances for each source described in `[config/app.js](https://github.com/codeactual/mainevent/blob/master/config/app.js.dist)`.

#### [import.js](https://github.com/codeactual/mainevent/blob/master/bin/import.js)

`$ bin/import.js --parser json --path /var/log/myApp/prod.json --tags myApp,import`

Like `tail.js` except it processes the entire file. (The file does not need to be described in `config/app.js`.)

### Testing

#### [test.js](https://github.com/codeactual/mainevent/blob/master/bin/test.js)

`$ bin/test.js`

Serves the YUI Test runner page, `app/view/test.html` and `test/browser/*.js` test cases.

## How To

### Create a new parser for an unsupported log format

Each parser lives in a separate directory under `[app/parsers](https://github.com/codeactual/mainevent/tree/master/app/parsers)` which holds its JS, CSS, templates and tests.

All parser classes extend a [base](https://github.com/codeactual/mainevent/blob/master/app/parsers/prototype.js) and only need to implement a small number of interfaces.

* Required
  * `parse(log)`: Accepts a log line string, returns an object of parsed fields.
* Optional
  * `buildTemplateContext(template, log)`: Modify the context object sent to dust.js based on the type of template. Currently there are two types: `preview` and `event`. See the [extension example](http://codeactual.github.com/mainevent/#extension-example) to see them in action.
  * `buildPreviewText(log)`: Skip defining a preview template and just build and return the preview string manually.
  * `extractTime(log)`: The default implementation will detect millisecond/second timestamps and `Date.parse()`-able strings in `log.time` values. For incompatible formats, define this function to extract the millisecond timestamp manually.
* Utilities
  * `namedCapture(subject, regex)`: Wrapper around [XRegExp](https://github.com/slevithan/XRegExp) named capture expression handling.
  * `candidateCapture(subject, candidates)`: Wrapper around `namedCapture` that lets you define multiple potential patterns and the first match wins.

See [app/parsers/prototype.js](https://github.com/codeactual/mainevent/blob/master/app/parsers/prototype.js) for more interface details.

Extending the base class is a simple one-call process via a backbone.js-like `extend()` function. See the [extension example](http://codeactual.github.com/mainevent/#extension-example) for a working implementation and screenshots of the output content. Or browse any of the modules under `[app/parsers](https://github.com/codeactual/mainevent/tree/master/app/parsers)`.

### Create a Pub/Sub listener for log updates

1. Create a module that exports an `on` function that receives an array of one or more log objects.
1. Perform any non-native tasks you need.
1. Find the `[config/app.js](https://github.com/codeactual/mainevent/blob/master/config/app.js.dist)` section that looks like:

```javascript
{
  // ...
  mongodb: {
    // ...
    listeners: [
      {
        // Customize this event but do not remove.
        event: 'InsertLog',
        enabled: true,
        subscribers: [
          'app/modules/redis/InsertLogPubSub.js'
        ],
      }
    ],
    // ...
  },
  // ...
}
```

1. Add the location of your listener module to the `subscribers` list.

## Configuration

`$ cp config/app.js.dist config/app.js`

Notes about the main properties:

* sources
  * path: Absolute path to the log file.
  * parser: Parser class/class-file name, e.g. `Json` or `NginxAccess`.
  * tags: (Optional) One or more tags to automatically attach to every event.
  * timeAttr: (Optional) By default a `time` property is used for the event's timestamp. Select a different property name here.
  * previewAttr: (Optional) Allows parsers like `Json`, which do not have preview templates, to know which properties should be included in preview text.
* mongodb
  * Customize name in `collections.event`.
  * Select a different pagination maximum in `maxResultSize` if needed.
  * Add additional indexes if needed. Future versions may automate that process based on metrics.
* redis
  * host/port/options: Passed to createClient() in [node_redis](https://github.com/mranney/node_redis).

## File Layout Notes

* `app` : Holds most server-side modules and classes.
  * `controllers`: Handlers for express.js routes defined in `bin/mainevent_server.js`.
  * `graphs`: Background scripts which run at intervals to cache point data in Redis.
  * `jobs`: Classes used by `graphs` scripts which define the MapReduce logic.
  * `modules`: Covers MongoDB, Redis, static builds and global objects like `mainevent`.
  * `parsers`: Self-contained parser modules, their prototype, and a test utility module.
  * `sockets`: Like `controllers` except for socket messages rather than routes.
  * `views`: All non-parser dust.js templates.
* `bin`: All HTTP servers and background processes like `tail.js`.
* `public`
  * js
    * `backbone`: Additions to backbone.js prototypes like `Backbone.View.prototype`.
    * `collections`: backbone.js collections.
    * `controllers`: Handlers for backbone.js routes.
    * `helpers`: Ex. `mainevent.helpers.Socket` for creating new socket.io connections.
    * `models`: backbone.js models.
    * `observers`: Global listeners of custom events like `ContentPreRender`.
    * `shared`: Modules/classes available server-side and client-side, ex. `mainevent.shared.Date`.
    * `views`: backbone.js views.
* `static`: JS/CSS/images from `public/` processed by `public/build.js`.
* `test`
  * `browser`: Client-side tests processed by app/views/test.html.
  * `modules`: Test helpers.

## Testing

Server-side tests rely on [nodeunit](https://github.com/caolan/nodeunit). Example:

`$ nodeunit test/redis.js`

### Components

* `app/parsers/testutil.js`: TODO
* `test/modules/testutil.js`: TODO
* `test/modules/job.js`: TODO
* `$test/all.js`: Runs all tests found under `app/parsers` and `test/`.

Client-side tests under `test/browser` rely on YUI Test. `bin/test.js` will serve the runner page.

### Remote Logs

`$ cp test/fixtures/tail-config.js test/fixtures/tail-config-remote.js`

Update `ssh*` configuration values in `test/fixtures/tail-config-remote.js`.

## Events

### Server-side

* InsertLog: TODO

### Client-side

* LinkClick: TODO
* DataFetchError: TODO
* ContentPreRender: TODO

### Bundled dependencies and their licenses

* backbone.js (MIT)
* clientsiiide (MIT)
* dust.js (MIT)
* Glyphicons Free (CC BY 3.0)
* jqPlot (MIT/GPLv2)
* jQuery (MIT/GPLv2)
* jQuery UI (MIT/GPLv2)
* jQuery-Timepicker-Addon (MIT/GPLv2)
* moment.js (MIT)
* RequireJS (MIT/New BSD)
* socket.io (MIT)
* Twitter Bootstrap (Apachev2)
* underscore.js (MIT)
* XRegExp (MIT)
* YUI Test (BSD)

### Copyright and license (MIT)

Copyright (c) 2012 David Smith, codeactual@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
