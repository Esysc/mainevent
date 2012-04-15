#!/usr/bin/env node

/**
 * `tail` source files listed in app/config.js.
 *
 * Usage:
 * - To use config/config.js source list: app/tail.js
 * - To use external source list: app/tail.js path/to/config.js
 *
 * process.send() is occasionally used to coordinate flow with test scripts.
 */

'use strict';

(function() {
  var program = require('commander');
  program
    .option('-c, --config <file>', '/path/to/config.js', null)
    .option('-t, --test <#>', 'Exit after # expected lines for unit tests', Number, 0)
    .option('-q, --quiet')
    .option('-v, --verbose')
    .parse(process.argv);

  require(__dirname + '/../app/modules/mainevent.js');
  var spawn = require('child_process').spawn,
      exec = require('child_process').exec,
      config = mainevent.getConfig(program.config),
      parsers = mainevent.requireModule('parsers'),
      procLog = mainevent.createUtilLogger('tail.js');

  // To support maximum line count for --test.
  var lineCount = 0;

  /**
   * Configure the monitor.
   */
  var Monitor = function(source) {
    // Log source attribute object from config/app.js 'sources' list.
    this.source = _.clone(source);

    // ChildProcess object.
    this.tail = null;

    // stdout logger.
    this.log = mainevent.createUtilLogger(this.source.path, program.quiet);

    // MongoDB instance.
    this.mongodb = mainevent.requireModule('mongodb').createInstance();

    // For use in spawn() or exec().
    this.tailArgs = ['--bytes=0', '-F', this.source.path];
    if (program.test) {
      this.tailArgs.push('-v');  // Header output will trigger MONITORS_STARTED.
    }

    // Remote `tail` PID.
    this.remotePid = null;
  };

  /**
   * Build an SSH command argument list.
   *
   * - For use with spawn() or exec().
   *
   * @param cmdArgs {Array} Remote command arguments.
   * @return {Array}
   */
  Monitor.prototype.buildSshCmd = function(cmdArgs) {
    return [
      '-t',
      '-p', this.source.sshPort,
      '-i', this.source.sshKey,
      this.source.sshUser + '@' + this.source.sshHost,
    ].concat(cmdArgs);
  };

  /**
   * Run `pgrep` to save the remote monitor's PID.
   */
  Monitor.prototype.saveRemotePid = function(callback) {
    callback = callback || function() {};
    var cmd = this.buildSshCmd(['\'pgrep -f "^tail ' + this.tailArgs.join(' ') + '"\'']),
        monitor = this;
    exec('ssh ' + cmd.join(' '), {}, function(code, stdout) {
      monitor.remotePid = parseInt(stdout.toString(), 10);
      if (program.verbose) {
        monitor.log('remote pid %d', monitor.remotePid);
      };
      callback();
    });
  };

  /**
   * Start a new `tail` instance and attach event handlers.
   */
  Monitor.prototype.start = function() {
    this.log('spawning tail');

    if (this.source.sshKey) {
      this.tail = spawn('ssh', this.buildSshCmd(['tail'].concat(this.tailArgs)));
      if (!program.test) {
        this.saveRemotePid();
      }
    } else {
      this.tail = spawn('tail', this.tailArgs);
    }

    var monitor = this;

    this.tail.stdout.on('data', function(data) {
      data = data.toString();

      // Use -v header output to detect tail readiness (for remote invocation).
      if (program.test && data.match(/^==>/)) {
        if (monitor.source.sshKey) {
          monitor.saveRemotePid(function() {
            process.send('MONITORS_STARTED');
          });
        } else {
          process.send('MONITORS_STARTED');
        }
        return;
      }

      var lines = parsers.splitString(data);
      lineCount += lines.length;

      if (program.verbose) {
        monitor.log('data=[%s] length={%d]', data, lines.length);
      }

      var sourceLines = {source: monitor.source, lines: lines}, bulk = true;
      parsers.parseAndInsert(monitor.mongodb, sourceLines, function() {
        // Support maximum line count for --test.
        if (program.test > 0 && lineCount >= program.test) {
          process.exit();
        }
      }, bulk);
    });

    this.tail.on('exit', function(code, signal) {
      monitor.log("tail exited with code %d, signal %s", code, signal);

      // Auto-restart.
      monitor.start();

      if (program.test) {
        process.send('MONITOR_RESTART');
      }
    });

    // Kill `tail` before parent process exits.
    var killTail = function() {
      process.removeListener('END_MONITOR', killTail);
      if (monitor.tail) {
        monitor.mongodb.dbClose();
        monitor.tail.kill('SIGKILL');
        monitor.log('killed local pid %d ...', monitor.tail.pid);
        monitor.tail = null;

        monitor.log('killing remote pid %d ...', monitor.remotePid);
        if (monitor.remotePid) { // Manually kill -- `ssh -t` approach hasn't worked.
          spawn('ssh', monitor.buildSshCmd(['kill -9 ' + monitor.remotePid]));
          monitor.log('killed remote pid %d ...', monitor.remotePid);
          monitor.remotePid = null;
        }
      }

      if (program.test) {
        if (!process.listeners('END_MONITOR').length) {
          process.send('MONITORS_ENDED');
        }
      }
    };
    process.on('END_MONITOR', killTail);

    this.log('local pid %d', this.tail.pid);
  };

  /**
   * Seed initial `tail` set based on config/app.js 'sources' list.
   */
  var startAllMonitors = function() {
    var maxListeners = config.sources.length;

    if (program.test) {   // Tests add 'message' and 'exit' listeners.
      maxListeners += 2;
    }

    // Avoid EventEmitter mem leak false alarms about count > 10.
    process.setMaxListeners(maxListeners);

    _.each(config.sources, function(source) {
      (new Monitor(source)).start();
    });
  };

  /**
   * Trigger monitors to clean up their `tail` instances.
   */
  var endAllMonitors = function() {
    process.emit('END_MONITOR');
  };
  process.on('exit', endAllMonitors);
  process.on('SIGINT', function() {
    procLog('SIGINT received');
    process.exit();
  });
  process.on('SIGTERM', function() {
    procLog('SIGTERM received');
    process.exit();
  });
  process.on('uncaughtException', function(err) {
    procLog('uncaught exception: %s', err.stack ? err.stack : '');
    process.exit();
  });

  // Test mode -- wait until instructed by parent process.
  if (program.test) {
    process.on('message', function(message) {
      if ('START_TEST' == message) {
        startAllMonitors();
      }
    });
  // Normal mode -- start immediately.
  } else {
    startAllMonitors();
  }
})();
