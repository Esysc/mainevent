define([], function() {

  'use strict';

  /**
   * Holds events from a timeline search result set.
   */
  return Backbone.Collection.extend({
    url: '/api/timeline?',
    initialize: function(models, options) {
      this.url += $.param(options.searchArgs);
    }
  });
});
