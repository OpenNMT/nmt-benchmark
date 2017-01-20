var router = require('express').Router();
var nconf = require('nconf');

router.use('/', function (req, res, next) {
  res.locals.visitor = req.user || '';
  next();
});

module.exports = router;
