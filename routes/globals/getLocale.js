var router = require('express').Router();
var nconf = require('nconf');

router.use('/', function (req, res, next) {
  res.locals.locale = nconf.get('OpenNMTBenchmark:default:locale');
  next();
});

module.exports = router;
