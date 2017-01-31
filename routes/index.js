const router = require('express').Router();
const url = require('url');
const multiparty = require('multiparty');
const fs = require('fs');
const nconf = require('nconf');
const winston = require('winston');

const utils = require('../lib/utils');

const tSystem = require('../lib/translationSystem');
const testOutput = require('../lib/testOutput');
const User = require('../lib/user.js');

const fieldSet = require('../config/systemSubmitForm').systemDescription;
const trainingSets = require('../lib/trainingSets').list;

router.get('/', function (req, res, next) {
  res.render('index', {
    messages: {
      info: req.flash('info')[0],
      warning: req.flash('warning')[0],
      error: req.flash('error')[0]
    }
  });
});

router.get('/info', function (req, res, next) {
  res.render('info', {
    messages: {
      info: req.flash('info')[0],
      warning: req.flash('warning')[0],
      error: req.flash('error')[0]
    }
  });
});

/* TODO
router.get('/about', function (req, res, next) {
  res.render('about', {
    messages: {
      info: req.flash('info')[0],
      warning: req.flash('warning')[0],
      error: req.flash('error')[0]
    }
  });
});
*/

router.get('/api', function (req, res, next) {
  var api = require('../config/api.js').api;
  var githubId = req.user ? req.user.id : undefined;
  User.getUser({githubId: githubId}, function (err, user) {
    var apiKey = user ? user.apiKey : '';
    var server = nconf.get('OpenNMTBenchmark:URL');
    api.map(function (entry) {
      if (entry.method === 'GET' && entry.params.length) {
        entry.getParams = '?' + entry.params.map(function (p) { return p + '={' + p + '}'; }).join('&');
      }
      if (entry.endpoint === '/system/upload/') {
        entry.fieldSet = fieldSet;
      }
    });
    res.render('api', {
      messages: {
        info: req.flash('info')[0],
        warning: req.flash('warning')[0],
        error: req.flash('error')[0]
      },
      user: user,
      api: api,
      apiKey: apiKey,
      server: server
    });
  });
});

router.get('/translationSystem/view/:systemId', function (req, res, next) {
  var systemId = req.params.systemId;
  if (systemId) {
    utils.gatherTS(systemId, function (err, data) {
      if (err) {
        winston.warn(systemId, ' - Translation system systemId not found');
        req.flash('warning', 'Required translation system not found');
        res.redirect('/');
      } else {
        data.mode = 'view';
        data.fieldSet = fieldSet;
        data.trainingSets = trainingSets;
        data.allSrc = utils.uniq(res.locals.languagePairs, 'sourceLanguage');
        data.allTgt = utils.uniq(res.locals.languagePairs, 'targetLanguage');
        data.messages = {
          info: req.flash('info')[0],
          warning: req.flash('warning')[0],
          error: req.flash('error')[0]
        };
        res.render('translationSystem', data);
      }
    });
  } else {
    winston.warn(systemId, ' - Translation system systemId not found');
    req.flash('warning', 'Required translation system not found');
    res.redirect('/');
  }
});

/*
router.get('/translationSystem/edit/:systemId', function (req, res, next) {
  if (!req.user) {
    winston.warn('Unauthenticated user tried to access ' + req.url);
    req.flash('warning', 'You cannot edit translation systems submitted by other users');
    res.redirect('/');
  } else {
    var systemId = req.params.systemId;
    if (systemId) {
      utils.gatherTS(systemId, function (err, data) {
        if (err) {
          winston.warn(systemId, ' - Translation system not found');
          req.flash('warning', 'Translation system ' + systemId + ' not found.');
          res.redirect('/');
        } else {
          data.mode = 'edit';
          data.fieldSet = fieldSet;
          data.allSrc = utils.uniq(res.locals.languagePairs, 'sourceLanguage');
          data.allTgt = utils.uniq(res.locals.languagePairs, 'targetLanguage');
          res.render('translationSystem', data);
        }
      });
    } else {
      winston.warn(systemId, ' - Translation system not found');
      req.flash('warning', 'Translation system not found.');
      res.redirect('/');
    }
  }
});
*/

router.post('/translationSystem/add', function (req, res, next) {
  if (!req.user) {
    winston.warn('Unauthenticated user tried to access ' + req.url);
    req.flash('warning', '<a href="/auth/github">Log in</a> to submit translation systems');
    res.redirect('/');
  } else {
    var lp = req.body.languagePair || nconf.get('OpenNMTBenchmark:default:LP');
    res.render('translationSystem', {
      trainingSets: trainingSets,
      fieldSet: fieldSet,
      src: lp.substring(0,2),
      tgt: lp.substring(2),
      allSrc: utils.uniq(res.locals.languagePairs, 'sourceLanguage'),
      allTgt: utils.uniq(res.locals.languagePairs, 'targetLanguage'),
      mode: 'create',
      tsData: {dummy: true},
      toData: {dummy: true},
      uData: req.user || {},
      messages: {
        info: req.flash('info')[0],
        warning: req.flash('warning')[0],
        error: req.flash('error')[0]
      }
    });
  }
});

router.get('/testSets', function (req, res, next) {
  res.render('testSets', {
    messages: {
      info: req.flash('info')[0],
      warning: req.flash('warning')[0],
      error: req.flash('error')[0]
    }
  });
});

/* TODO
  For instance, training sets are hard-coded rather than retrieved from Amazon bucket
*/
router.get('/trainingSets', function (req, res, next) {
  res.render('trainingSets', {
    trainingSets: trainingSets,
    messages: {
      info: req.flash('info')[0],
      warning: req.flash('warning')[0],
      error: req.flash('error')[0]
    }
  });
});

router.get('/userSystems/:userId', function (req, res, next) {
  var userId = req.params.userId;
  utils.gatherUS(userId, function (err, data) {
    if (err) {
      winston.warning('Unable to gather user system data');
      req.flash('warning', 'Unable to gather user system data');
      res.redirect('/');
    } else {
      data.messages = {
        info: req.flash('info')[0],
        warning: req.flash('warning')[0],
        error: req.flash('error')[0]
      };
      res.render('userSystems', data);
    }
  });
});

module.exports = router;
