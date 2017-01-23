var testSet = require('../../lib/testSet');
var router = require('express').Router();
var winston = require('winston');
var fs = require('fs');
var nconf = require('nconf');
var path = require('path');

router.use('/', function (req, res, next) {
  testSet.getTestSets(function (err, data) {
    if (err) {
      winston.warn('Unable to retrieve test sets:', err);
      res.locals.languagePairs = [];
    } else {
      res.locals.languagePairs = getUniqueLPs(data);
    }
    next();
  });
});

module.exports = router;

function getUniqueLPs (array) {
  var tmp = {};
  return array.map(function (file) {
    return file.toObject().source.language + file.toObject().target.language;
  }).filter(function (lp) {
    if (!tmp.hasOwnProperty(lp)) {
      tmp[lp] = 1;
      return true;
    }
  }).map(function (lp) {
    return {
      sourceLanguage: lp.substring(0,2),
      targetLanguage: lp.substring(2)
    }
  });
}