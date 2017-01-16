var router = require('express').Router();
var winston = require('winston');
var fs = require('fs');
var nconf = require('nconf');
var path = require('path');
var testSet = require('../lib/testSet');

/*
router.use('/', function (req, res, next) {
  var dataPath = path.resolve(nconf.get('OpenNMTBenchmark:Datapath'));
  fs.readdir(dataPath, function (err, lps) {
    if (err) {
      winston.error('Unable to retrieve test sets:', err);
      res.locals.testSets = [];
    } else {
      var testSets = [];
      lps.filter(function (lp) {
        return fs.statSync(path.resolve(dataPath, lp)).isDirectory();
      }).forEach(function (lp) {
        var files = fs.readdirSync(path.resolve(dataPath, lp)); // Could be folder -> domain
        files = files.map(function (f) {
          return {
            fileName: f.slice(0,-5),
            sourceLanguage: lp.substring(0,2),
            targetLanguage: lp.substring(2)
          }
        })
        testSets = testSets.concat(files);
      });
      res.locals.testSets = testSets;
    }
    next();
  });
});
*/

router.use('/', function (req, res, next) {

  testSet.getTestSets(function (err, data) {
    if (err) {
      winston.error('Unable to retrieve test sets:', err);
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
