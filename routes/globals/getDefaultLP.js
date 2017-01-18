var router = require('express').Router();
var nconf = require('nconf');

router.use('/', function (req, res, next) {
  res.locals.defaultLP = nconf.get('OpenNMTBenchmark:default:LP');
  next();
});

module.exports = router;
