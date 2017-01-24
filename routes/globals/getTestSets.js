var router = require('express').Router();
var winston = require('winston');
var fs = require('fs');
var nconf = require('nconf');
var path = require('path');
var testSet = require('../../lib/testSet');
var Output = require('../../lib/testOutput');

router.use('/', function (req, res, next) {
  testSet.getTestSetHeaders(function (err, tsData) {
    if (err) {
      winston.warn('Unable to retrieve test sets: ' + err);
      res.locals.testSets = [];
    } else {
      Output.getTestOutputHeaders(function (err, toData) {
        if (err) {
          winston.warn('Unable to retrieve output data: ' + err);
        }
        tsData.forEach(function (ts) {
          ts.nbOutputs = toData.filter(function (to) {
            return to.fileId == ts._id;
          }).length;
        });
        res.locals.testSets = tsData;
      });
    }
    next();
  });
});

module.exports = router;
