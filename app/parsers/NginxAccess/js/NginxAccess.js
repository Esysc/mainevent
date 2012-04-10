'use strict';

var Parser = require(__dirname + '/../../prototype.js').Parser;

var NginxAccessParser = function() {
  Parser.apply(this, arguments);

  this.name = 'NginxAccess';
};

mainevent.shared.Lang.inheritPrototype(NginxAccessParser, Parser);

NginxAccessParser.prototype.parse = function(log) {
  return this.namedCapture(
    log,
    ['host', 'user', 'time', 'method', 'path', 'code', 'size', 'referer', 'agent'],
    // From fluentd-0.10.9/lib/fluent/parser.rb:
    /^([^ ]*) [^ ]* ([^ ]*) \[([^\]]*)\] "(\S+)(?: +([^ ]*) +\S*)?" ([^ ]*) ([^ ]*)(?: "([^\"]*)" "([^\"]*)")?$/
  );
};

NginxAccessParser.prototype.addPreviewContext = function(log) {
  if (log.code) {
    switch (log.code.toString()[0]) {
      case '2': log.__codeClass = 'success'; break;
      case '3': log.__codeClass = 'info'; break;
      case '4': log.__codeClass = 'important'; break;
      case '5': log.__codeClass = 'important'; break;
    }
  }

  if (log.referer) {
    log.referer = '-' == log.referer ? '' : log.referer;
    log.__refererMin = log.referer.replace(/^http(s)?:\/\//, '');
  }
    return log;
};

NginxAccessParser.prototype.decorateFullContext = function(log) {
  return this.addPreviewContext(log);
};

NginxAccessParser.prototype.extractTime = function(date) {
  var matches = date.match(/(\d+)\/([A-Za-z]+)\/(\d{4}):(\d{2}:\d{2}:\d{2} \+\d{4})/);
  if (!matches) {
    return NaN;
  }

  var parsable = util.format(
    '%d/%d/%d %s',
    mainevent.shared.Date.monthNameToNum(matches[2]),
    matches[1],
    matches[3],
    matches[4]
  );
  return Date.parse(parsable);
};

exports.NginxAccessParser = NginxAccessParser;
