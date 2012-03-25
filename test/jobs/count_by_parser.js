'use strict';

var testutil = require(__dirname + '/../modules/testutil.js');
var job = require(__dirname + '/../modules/job.js');

requirejs(['shared/Date'], function(DateShared) {
  var strtotime = DateShared.strtotime;

  exports.testCountByParser = function(test) {
    test.expect(1);
    var run = testutil.getRandHash();
    var logs = [
      {
      source: {parser: 'json'},
      lines: ['{"time":"3/12/2012 09:00:00","message":"' + run + '"}']
    },
    {
      source: {parser: 'php'},
      lines: [
        '[12-Mar-2012 10:00:00 UTC] ' + run,
        '[12-Mar-2012 11:00:00 UTC] ' + run
      ]
    }
    ];
    var expected = {php: {count: 2}, json: {count: 1}};
    job.verifyTimeRange(
      test,
      __filename,
      run,
      strtotime('3/12/2012 09:00:00'),
      strtotime('3/12/2012 12:00:00'),
      logs,
      expected
    );
  };
});
