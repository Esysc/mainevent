'use strict';

(function() {
  window.diana = window.diana || {};
  window.diana.views = window.diana.views || {};
  var diana = window.diana;

  // View of an individual event.
  diana.views.Event = Backbone.View.extend({
    // Modal sub-views.
    searchView: null,

    initialize: function(options) {
      this.initKeyEvents({
        'Search': {
          keyChar: 's',
          callback: this.findSimilar
        }
      });

      this.model = new diana.models.Event({id: options.id});
      this.model.bind('change', this.render, this);

      // Bubble up the model error.
      diana.helpers.Event.on('EventSyncError', function(response) {
        diana.helpers.Event.trigger('CritFetchError', response);
      });

      this.model.fetch();
    },

    events: {
      'click #event-find-similar': 'findSimilar'
    },

    onClose: function() {
      this.model.unbind('change', this.render);
    },

    /**
     * Open search modal seeded with this event's properties.
     *
     * @param event {Object} jQuery event object.
     */
    findSimilar: function(event) {
      event.preventDefault();

      var modal = $('#timeline-search-modal');

      if (modal.is(':visible')) {
        return;
      }

      if (this.searchView) {
        modal.modal('show');
      } else {
        var searchArgs = this.model.toJSON();
        _.each(searchArgs, function(value, key) {
          if ('_' == key[0] || '' == value || key.match(/^(previewAttr|time|id)$/)) {
            delete searchArgs[key];
          }
        });
        this.searchView = new diana.views.TimelineSearch({
          el: modal,
          searchArgs: searchArgs
        });
      }
    },

    render: function() {
      var event = this.model.toJSON();
      if (Object.keys(event).length < 3) {
        return;
      }

      var context = {};

      // Attributes are in an array of key/value pair objects, ex. from json parser.
      if (event.__list) {
        event.__list = _.filter(event.__list, function(pair) {
          // Omit database ID.
          if (pair.key == '_id') {
            return false;
          } else if (pair.key == 'tags') {
            context.tags = pair.value;
            return false;
          }
          // Ex. avoid rendering empty 'tags' lists.
          if (pair.value === null) {
            return false;
          }
          return true;
        });

        context.list = event.__list;
        context.parser = event.parser;

        // Ex. format the time attribute.
        context.list = _.map(context.list, function(pair, index) {
          if ('time' == pair.key) {
            context.time = diana.shared.Date.formatTime(pair.value);
            context.timeFromNow = moment(pair.value * 1000).fromNow();
          }
          return pair;
        });

        // Ex. remove internal attributes for display.
        context.list = _.filter(context.list, function(pair, index) {
          var blacklist = ['parser', 'previewAttr', 'time'];
          return -1 == blacklist.indexOf(pair.key);
        });

      // Attributes are in a one-dimensional object, ex. from nginx_access parser.
      } else {
        var context = event;
        context.timeFromNow = moment(context.time * 1000).fromNow();
        context.time = diana.shared.Date.formatTime(context.time);
        delete context.previewAttr;
      }

      context.tags = _.map(context.tags, function(value) {
        return {name: value};
      });

      context.intReferer = this.options.intReferer;

      var view = this;
      dust.render(
        // ex. 'event_nginx_access'
        'event_' + this.model.attributes.parser,
        context,
        function(err, out) {
          view.$el.html(out);
        }
      );
    }
  });
})();
