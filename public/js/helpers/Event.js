'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.helpers = window.diana.helpers || {};
  var diana = window.diana;

  /**
   * Global dispatch object.
   *
   * @author SendHub http://goo.gl/mEMwr
   */
  diana.event = _.extend({}, Backbone.Events);

  diana.helpers.Event = {
    /**
     * Common error handler for all fetch/sync operations.
     */
    onFetchError: function(response) {
      var context = {message: JSON.parse(response.responseText).__error};
      dust.render('error', context, function(err, out) {
        $(diana.viewContainer).html(out);
      });
    }
  };
})();

