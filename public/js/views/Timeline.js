'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  // Reuse the socket if the view is reopened w/out a page refresh.
  var socket = null;

  //var newestEventId = null;

  /**
   * Displays the <table> into which result sets are rendered. Automatically
   * fetches the result set based on router options passed via initialize().
   */
  diana.views.Timeline = Backbone.View.extend({
    el: $(diana.viewContainer),

    // Track the most recent event ID seen by initial fetch() and automatic updates.
    newestEventId: null,

    initialize: function(options) {
      var view = this;

      // Fires after dust.render() builds the empty <table>.
      var onTemplateRendered = function(err, out) {
        // Display the empty table.
        $(diana.viewContainer).html(out);

        // Supply search filters/options for the collection's URL generation.
        view.collection = new diana.collections.Timeline(
          null, {searchArgs: options.searchArgs}
        );

        view.collection.fetch({
          success: function(collection, response) {
            if (!response.length) {
              dust.render('timeline_no_results', null, function(err, out) {
                $(diana.viewContainer).html(out);
              });
              return;
            }

            // Append a new <tr> for each event.
            _.each(response, function(event) {
              var model = new diana.models.Event(event);
              view.collection.add(model);
              (new diana.views.TimelineEvent({model: model})).render();
            });

            view.startTimelineUpdate.call(view, response[0]._id);
          },

          error: function(collection, response) {
            diana.helpers.Event.onFetchError(response);
          }
        });
      };

      dust.render('timeline_table', null, onTemplateRendered);
    },

    startTimelineUpdate: function(initialId) {
      // On the first run, create a socket for automatic updates.
      if (!socket) {
        var view = this;
        view.newestEventId = initialId;

        socket = diana.helpers.Socket.reuse({
          event: {
            connect: function() {
              // Start/restart automatic updates.
              socket.emit('startTimelineUpdate', view.newestEventId);
            }
          }
        });

        // Update the view with events fresher than newestEventId.
        socket.on('timelineUpdate', function(data) {
          view.onTimelineUpdate.call(view, data);
        });
      }
    },

    onTimelineUpdate: function(data) {
      if (!data) {
        return;
      }
      if (data.__socket_error) {
        // TODO: Display a fading alert and continue waiting.
      } else if (data.length) {
        // Advance the manual cursor.
        this.newestEventId = data[0]._id;

        // Same steps as for the initial payload except events are prepended
        // to the <table> via render(true).
        var view = this;
        _.each(data, function(event) {
          var model = new diana.models.Event(event);
          view.collection.add(model);
          (new diana.views.TimelineEvent({model: model})).render(true);
        });
      }
    }
  });
})();
