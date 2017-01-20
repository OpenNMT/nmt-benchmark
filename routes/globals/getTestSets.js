var router = require('express').Router();
var winston = require('winston');
var fs = require('fs');
var nconf = require('nconf');
var path = require('path');
var testSet = require('../../lib/testSet');

router.use('/', function (req, res, next) {
  testSet.getTestSets(function (err, data) {
    if (err) {
      winston.warn('Unable to retrieve test sets:', err);
      res.locals.testSets = [];
    } else {
      res.locals.testSets = data.map(function (file) {
        return file.toObject();
      });
    }
    next();
  });
});

module.exports = router;
