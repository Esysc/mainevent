/**
 * Common requirement for all test modules.
 */

'use strict';

var parsers = diana.requireModule('parsers/parsers');

/**
 * Verify the job results for a given interval and log set.
 *
 * @param test {Object} Test instance.
 * @param jobName {String}
 * @param logs {Array} Event objects.
 * @param expected {Object} Reduce results indexed by their _id values.
 * @param options {Object} Job-specific options.
 *
 * Additional arguments are passed to the job's run() function.
 */
exports.verifyJob = function(test, jobName, logs, expected, options) {
  var job = new (diana.requireJob(jobName).getClass());
  test.expect(1);
  parsers.parseAndInsert(logs, function() {
    job.run(options, function(err, results) {
      // Remove non-verified attribute.
      _.each(results, function(result, key) {
        delete results[key]._id;
      });
      test.deepEqual(results, expected);
      test.done();
    });
  });
};
