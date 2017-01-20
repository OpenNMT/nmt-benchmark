var router = require('express').Router();
var url = require('url');
var multiparty = require('multiparty');
var fs = require('fs');
var nconf = require('nconf');

var tSystem = require('../lib/translationSystem');
var testOutput = require('../lib/testOutput');
var User = require('../lib/user.js');

router.get('/', function(req, res, next) {
  res.render('index', {
    alert: '' // flash
  });
});

router.get('/translationSystem/view/:systemId', function (req, res, next) {
  var systemId = req.params.systemId;
  if (systemId) {
    gatherTS(systemId, function (err, data) {
      if (err) {
        res.redirect('/'); // flash: err
      } else {
        data.mode = 'view';
        data.allSrc = uniq(res.locals.languagePairs, 'sourceLanguage');
        data.allTgt = uniq(res.locals.languagePairs, 'targetLanguage');
        res.render('translationSystem', data);
      }
    });
  } else {
    console.log(systemId, 'system not found');
    res.redirect('/'); // flash: system not found
  }
});

router.get('/translationSystem/edit/:systemId', function (req, res, next) {
  if (!req.user) {
    console.log('Authentication issue');
    res.redirect('/'); // flash: you don't have permission 
  } else {
    var systemId = req.params.systemId;
    if (systemId) {
      gatherTS(systemId, function (err, data) {
        if (err) {
          res.redirect('/'); // flash: system not found
        } else {
          data.mode = 'edit';
          data.allSrc = uniq(res.locals.languagePairs, 'sourceLanguage');
          data.allTgt = uniq(res.locals.languagePairs, 'targetLanguage');
          res.render('translationSystem', data);
        }
      });
    } else {
      console.log(systemId, 'system not found');
      res.redirect('/'); // flash: system not found
    }
  }
});

router.post('/translationSystem/add', function (req, res, next) {
  if (!req.user) {
    console.log('Authentication issue');
    res.redirect('/'); // flash: you don't have permission 
  } else {
    var lp = req.body.languagePair || nconf.get('OpenNMTBenchmark:default:LP');
    res.render('translationSystem', {
      src: lp.substring(0,2),
      tgt: lp.substring(2),
      allSrc: uniq(res.locals.languagePairs, 'sourceLanguage'),
      allTgt: uniq(res.locals.languagePairs, 'targetLanguage'),
      mode: 'create',
      tsData: {dummy: true},
      toData: {dummy: true},
      uData: req.user || {}
    });
  }
});

router.get('/testFiles', function (req, res, next) {
  res.render('testFiles');
});

router.get('/userSystems/:userId', function (req, res, next) {
  var userId = req.params.userId;
  gatherUS(userId, function (err, data) {
    if (err) {
      res.redirect('/'); // flash: err
    } else {
      res.render('userSystems', data);
    }
  });
});

module.exports = router;

function uniq (array, column) {
  var tmp = {};
  var uniq = [];
  for (var i = 0, l = array.length; i < l; ++i) {
    if (tmp.hasOwnProperty(array[i][column])) {
      continue;
    }
    uniq.push(array[i][column]);
    tmp[array[i][column]] = 1;
  }
  return uniq;
}

function gatherUS (userId, cb) {
  var ts;
  var to;
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystems({user: userId}, function (err, tsData) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        }
        else {
          ts = tsData;
          resolve();
        }
      });
    });
  })()
  .then(function getTO () {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutputs(function (err, toData) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          to = toData;

          ts.forEach(function (ts) {
            var scores = scores || {};
            toData.forEach(function (to) {
              if (to.systemId == ts._id) {
                scores[to.fileId] = to.scores;
              }
            });
            ts.scores = scores;
          });
          resolve();
        }
      });
    });
  })
  .then(function getUser () {
    return new Promise(function (resolve, reject) {
      User.getUser({githubId: userId}, function (err, uData) {
        if (err) {
          reject('Unable to retrieve user: ' + err);
        } else {
          resolve({
            tsData: ts,
            uData: uData,
            toData: to
          });
        }
      });
    });
  })
  .then(function(data) {
    cb(null, data);
  })
  .catch(function (err) {
    console.log(err)
    cb(err);
  });
}

function gatherTS (systemId, cb) {
  var ts;
  var to;
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystem({_id: systemId}, function (err, tsData) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        }
        else {
          ts = tsData;
          resolve();
        }
      });
    });
  })()
  .then(function getTO () {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutput({systemId: systemId}, function (err, toData) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          to = toData;
          resolve();
        }
      });
    });
  })
  .then(function getUser () {
    return new Promise(function (resolve, reject) {
      User.getUser({githubId: ts.user}, function (err, uData) {
        if (err) {
          reject('Unable to retrieve user: ' + err);
        } else {
          resolve({
            systemId: systemId,
            tsData: ts,
            toData: to,
            uData: uData
          });
        }
      });
    });
  })
  .then(function(data) {
    cb(null, data);
  })
  .catch(function (err) {
    console.log(err)
    cb(err);
  });
}
