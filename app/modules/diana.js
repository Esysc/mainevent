/**
 * Supply common/stateless helpers and module instances.
 *
 * All entry points (ui.js, app/tail.js, test runners, etc) must require()
 * this module. Modules like parsers/parsers.js assume its presence.
 */

'use strict';

GLOBAL._ = require('underscore');
GLOBAL.util = require('util');

GLOBAL.requirejs = require('requirejs');
requirejs.config({
  baseUrl: __dirname + '/../../public/js'
});

GLOBAL.diana = {
  /**
   * Load core module.
   *
   * @param name {String} Path relative to app/modules. No trailing '.js'.
   * @return {Object}
   */
  requireModule: function(name) {
    return require(__dirname + '/' + name + '.js');
  },

  /**
   * Load job module.
   *
   * @param name {String} Path relative to app/modules. No trailing '.js'.
   * @return {Object}
   */
  requireJob: function(name) {
    name = diana.extractJobName(name);
    return require(__dirname + '/../jobs/' + name + '.js');
  },

  /**
   * Convert a job script's absolute path into its base name.
   *
   * @param name {String}
   * @return {String}
   */
  extractJobName: function(name) {
    if (name[0] == '/') {
      name = require('path').basename(name, '.js');
    }
    return name;
  },

  /**
   * Read the app configuration file.
   *
   * @return {Object}
  */
  getConfig: function(file) {
    if (file) {
      file = require('fs').realpathSync(file);
    } else {
      file = __dirname + '/../../config/app.js';
    }
    return require(file).read();
  }
};
