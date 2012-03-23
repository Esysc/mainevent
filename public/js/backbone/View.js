Backbone.View.prototype.prefs = {};
Backbone.View.prototype.prefsNs = '';

/**
 * Seed a view's preference map.
 *
 * - Pulls saved preferences from localStorage to override defaults.
 *
 * @param ns {String} Namespace, ex. view name.
 * @param defaults {Object} Default map.
 */
Backbone.View.prototype.initPrefs = function(ns, defaults) {
  var saved = diana.helpers.Prefs.get(ns + 'View');
  this.prefs = _.extend(defaults, saved);
  this.prefsNs = ns;
};

/**
 * Read a preference key.
 *
 * @param key {String}
 * @return {mixed} Preference value; null if key unknown.
 * @throws Error On missing namespace (to avoid cross-view conflicts.)
 */
Backbone.View.prototype.getPref = function(key) {
  if (!this.prefsNs) { throw new Error('Preferences namespace missing.'); }
  return _.has(this.prefs, key) ? this.prefs[key] : null;
};

/**
 * Write a preference key.
 *
 * - Save preferences to localStorage.
 *
 * @param key {String}
 * @param value {mixed}
 * @return {mixed} Saved value.
 * @throws Error On missing namespace (to avoid cross-view conflicts.)
 */
Backbone.View.prototype.setPref = function(key, value) {
  if (!this.prefsNs) { throw new Error('Preferences namespace missing.'); }
  this.prefs[key] = value;
  diana.helpers.Prefs.set(this.prefsNs + 'View', this.prefs);
  return value;
};

/**
 * Add default shutdown/GC to all views.
 *
 * - Called by index.js router when a new 'main' view is about to load.
 *
 * @author Derick Bailey http://goo.gl/JD3DQ
 */
Backbone.View.prototype.close = function() {
  this.remove();
  this.unbind();
  if (this.onKeyEvent) {
    this.disableKeyEvents();
    diana.helpers.Event.off('ModalOpen', this.disableKeyEvents);
    diana.helpers.Event.off('ModalClose', this.enableKeyEvents);
    $('#keyboard-shortcuts').off('click', this.onKeyboardShortcutsClick);
  }
  if (this.onClose){
    this.onClose();
  }
};

/**
 * Key codes mapped to event handler.
 *
 * Example:
 * {
 *   16: function(event) { ... },
 *   83: function(event) { ... },
 *   ...
 * }
 */
Backbone.View.prototype.keyEventConfig = {};

/**
 * 'keyup' handler customized by each view's keyEventConfig map.
 */
Backbone.View.prototype.onKeyEvent = null;

/**
 * Click handler for 'Keyboard shortcuts available' link, customized by each
 * view's keyEventConfig map.
 */
Backbone.View.prototype.onKeyboardShortcutsClick = null;

/**
 * Optionally call from initialize() to configure and start key event handling.
 *
 * @param config {Object} View's new keyEventConfig value.
 */
Backbone.View.prototype.initKeyEvents = function(config) {
  var view = this;
  this.keyEventConfig = {};

  // Group handlers by key code.
  _.each(config, function(handler) {
    var keyCode = handler.keyCode || parseInt(handler.keyChar.toUpperCase().charCodeAt(0), 10);
    if (!_.has(view.keyEventConfig, keyCode)) {
      view.keyEventConfig[keyCode] = [];
    }
    delete handler.keyCode;
    delete handler.keyChar;
    view.keyEventConfig[keyCode].push(handler);
  });

  // Trigger all handlers in the matching key code group.
  this.onKeyEvent = function(event) {
    if (!view.keyEventConfig[event.keyCode]) {
      return;
    }
    _.each(view.keyEventConfig[event.keyCode], function(handler) {
      if (handler.shiftKey && !event.shiftKey) { return; }
      if (handler.ctrlKey && !event.ctrlKey) { return; }
      if (handler.metaKey && !event.metaKey) { return; }
      if (handler.altKey && !event.altKey) { return; }
      handler.callback.call(view, event);
    });
  };

  this.enableKeyEvents();

  // Suspend key event handling when sub-view modals are open.
  diana.helpers.Event.on('ModalOpen', view.disableKeyEvents);
  diana.helpers.Event.on('ModalClose', view.enableKeyEvents);

  // Display keyboard shortcuts modal with help content based on keyEventConfig.
  this.onKeyboardShortcutsClick = function() {
    new diana.views.KeyboardShortcuts({keyEventConfig: view.keyEventConfig});
  };
  diana.helpers.Event.on('KeyboardShortcutsHelp', this.onKeyboardShortcutsClick);
};

Backbone.View.prototype.enableKeyEvents = function() {
  if (this.onKeyEvent) {
    $(document).on('keyup', this.onKeyEvent);
  }
};

Backbone.View.prototype.disableKeyEvents = function() {
  if (this.onKeyEvent) {
    $(document).off('keyup', this.onKeyEvent);
  }
};

/**
 * Build a fragment URL.
 *
 * @param fragment {String} Ex. 'timeline', w/out trailing slash.
 * @param args {Object}
 * @return {String}
 */
Backbone.View.prototype.buildUrl = function (fragment, args) {
  var pairs = [];
  _.each(args, function(value, key) {
    if (!key.toString().length || !value.toString().length || _.isNaN(value)) {
      return;
    }
    pairs.push(key + '=' + value);
  });
  pairs = pairs.join('&');
  return '#' + fragment + (pairs ? '/' + pairs : '');
};

/**
 * Build and navigate to a fragment URL.
 *
 * @param fragment {String} Ex. 'timeline', w/out trailing slash.
 * @param args {Object}
 * @param options {Object} Backbone.History.navigate() options.
 */
Backbone.View.prototype.navigate = function (fragment, args, options) {
  options = options || {};
  options.trigger = _.has(options, 'trigger') ? options.trigger : true;
  Backbone.history.navigate(this.buildUrl(fragment, args), options);
};
