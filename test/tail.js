/**
 * Test the tail.js CLI tool.
 */

'use strict';

var fs = require('fs');
var testutil = require(__dirname + '/modules/testutil.js');
var fork = require('child_process').fork;
var exec = require('child_process').exec;
var storage = diana.requireModule('storage/storage').load();

var testConfigFile = __dirname + '/fixtures/tail-config.js';
var testConfig = diana.getConfig(testConfigFile);
var path = testConfig.sources[0].path;

exports.testMonitoring = function(test) {
  var run = testutil.getRandHash();
  var log = JSON.stringify({path: path, run: run});
  var fd = fs.openSync(path, 'a');

  // -t will enable test mode and force exit after 1 line.
  var tailJs = fork(__dirname + '/../app/tail.js', [
    '-c', testConfigFile,
    '-t', 1
  ], {env: process.env});

  tailJs.on('exit', function(code) {
    storage.getTimeline({run: run}, function(err, docs) {
      test.equal(docs[0].run, run);
      test.done();
    });
  });

  // Wait until we know tail.js has started watching 'path' to add a line.
  tailJs.on('message', function(message) {
    if ('MONITORS_STARTED' == message) {
      test.expect(1);
      fs.writeSync(fd, log);
      fs.closeSync(fd);
    }
  });

  tailJs.send('START_TEST');
};

exports.testAutoRestart = function(test) {
  var run = testutil.getRandHash();
  var log = JSON.stringify({path: path, run: run});
  var pgrepCmd = 'pgrep -f "tail --bytes=0 -F ' + path + '"';

  test.expect(2);

  // -t will enable test mode and force exit after 1 line.
  var tailJs = fork(__dirname + '/../app/tail.js', [
    '-c', testConfigFile,
    '-t', 1
  ], {env: process.env});

  tailJs.on('message', function(message) {
    // Wait until we know tail.js has started watching 'path' to add a line.
    if ('MONITORS_STARTED' == message) {
      exec(pgrepCmd, [], function(code, pid) {
        exec('env kill -9 ' + pid.toString(), [], function(code, stdout) {
          test.equal(stdout.toString(), '');
        });
      });

    // Wait until we know tail.js should have restarted `tail`.
    } else if ('MONITOR_RESTART' == message) {
      exec(pgrepCmd, [], function(code, stdout, stderr) {
        // Force tail.js to exit.
        var fd = fs.openSync(path, 'a');
        fs.writeSync(fd, log);
        fs.closeSync(fd);

        test.ok(parseInt(stdout.toString(), 10) > 0);
        test.done();
      });
    }
  });

  tailJs.send('START_TEST');
};
