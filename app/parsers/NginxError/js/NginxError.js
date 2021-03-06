'use strict';

var extend = require(__dirname + '/../../prototype.js').extend;

exports.NginxErrorParser = extend({name: 'NginxError', humanName: 'nginx error'}, {

  parse: function(log) {
    return this.candidateCapture(log, [
      {
        // Ex. 2012/02/05 00:19:34 [error] 13816#0: *1 recv() failed (104: Connection reset by peer) while reading response header from upstream, client: 127.0.0.1, server: mainevent, request: "GET / HTTP/1.1", upstream: "fastcgi://unix:/path/to/php-fpm.sock:", host: "mainevent"
        regex: '^(?<time>\\d{4}\\/\\d{2}\\/\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(?<level>[^\\]]*)\\] (?<errno>[0-9#]*): (?<errstr>.*), client: (?<client>.*), server: (?<server>.*), request: "(?<method>\\S+) (?<path>[^ ]*) +\\S*".*upstream: "(?<upstream>[^\\"]*)", host: "(?<host>[^\\"]*)"$',
        subtype: 'standard'
      },
      {
        // Ex. 2012/02/05 00:26:21 [error] 18242#0: *1 access forbidden by rule, client: 127.0.0.1, server: mainevent, request: "GET /.htaccess HTTP/1.1", host: "mainevent"
        regex: '^(?<time>\\d{4}\\/\\d{2}\\/\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(?<level>[^\\]]+)\\] (?<errno>[0-9#]+): (?<errstr>.*), client: (?<client>.*), server: (?<server>.*), request: "(?<method>\\S+) (?<path>[^ ]+) \\S+".*host: "(?<host>[^\\"]+)"$',
        subtype: 'no_upstream'
      },
      {
        // Ex. 2012/02/05 00:25:54 [emerg] 18108#0: invalid number of arguments in "server_tokens" directive in /path/to/config:9
        regex: '^(?<time>\\d{4}\\/\\d{2}\\/\\d{2} \\d{2}:\\d{2}:\\d{2}) \\[(?<level>[^\\]]*)\\] (?<errno>[0-9#]*): (?<errstr>.*)$',
        subtype: 'internal'
      }
    ]);
  },

  buildTemplateContext: function(template, log) {
    if ('full' === template) {
      return log;
    }

    if (log.level) {
      switch (log.level) {
        case 'debug': log.__levelClass = 'info'; break;
        case 'info': log.__levelClass = 'info'; break;
        case 'warn': log.__levelClass = 'warning'; break;
        default: log.__levelClass = 'important'; break;
      }
    }
    return log;
  },

  extractTime: function(log) {
    return Date.parse(log.time);
  }
});
