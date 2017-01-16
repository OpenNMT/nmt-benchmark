var testSet = require('../lib/testSet');
var router = require('express').Router();
var winston = require('winston');
var fs = require('fs');
var nconf = require('nconf');
var path = require('path');

/*
router.use('/', function (req, res, next) {
  var dataPath = path.resolve(nconf.get('OpenNMTBenchmark:Datapath'));
  fs.readdir(dataPath, function (err, lps) {
    if (err) {
      winston.error('Unable to retrieve language pairs:', err);
      res.locals.languagePairs = [];
    } else {
      res.locals.languagePairs = lps.filter(function (lp) {
        return fs.statSync(path.resolve(dataPath, lp)).isDirectory();
      }).map(function (lp) {
        return {
          sourceLanguage: lp.substring(0, 2),
          targetLanguage: lp.substring(2)
        }
      }); // sort alphabetically
    }
    next();
  });
});
*/

router.use('/', function (req, res, next) {
  testSet.getTestSets(function (err, data) {
    if (err) {
      winston.error('Unable to retrieve test sets:', err);
      res.locals.languagePairs = [];
    } else {
      res.locals.languagePairs = data.map(function (file) {
        return {
          sourceLanguage: file.toObject().sourceLanguage,
          targetLanguage: file.toObject().targetLanguage
        }
      });
    }
    next();
  });
});

module.exports = router;
