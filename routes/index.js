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
});

router.post('/translationSystem/add', function (req, res, next) {
  // if (!authenticated) { res.json({error: 'No rights to create/update systems', data: null}); } else {}
  var lp = req.body.languagePair || nconf.get('OpenNMTBenchmark:default:LP');
  res.render('translationSystem', {
    src: lp.substring(0,2),
    tgt: lp.substring(2),
    allSrc: uniq(res.locals.languagePairs, 'sourceLanguage'),
    allTgt: uniq(res.locals.languagePairs, 'targetLanguage'),
    mode: 'create',
    TSdata: {},
    TOdata: {}
  });
});

router.get('/testFiles', function (req, res, next) {
  res.render('testFiles');
});

router.get('/userSystems/:userId', function (req, res, next) {
  var author = true;
  var userId = req.params.userId;
  tSystem.getTranslationSystems({user: userId}, function (err, tsData) {
    User.getUser({githubId: userId}, function (err, uData) {
      // TODO - author
      res.render('userSystems', {systemList: tsData, author: author, user: uData});
    });
  });
});

// add test file to database - TURN OFF IN PRODUCTION
router.get('/addTestSet', function (req, res, next) {
  var buf = [
    '<form action="/addTestSetR" method="POST" enctype="multipart/form-data" >',
      'Domain*: <input name="domain"value="Generic"><br />',
      'By*: <input name="by" value="WMT"><br />',
      'Eval tool: <input name="evalTool"><br />',
      'Comment: <input name="comment"><br />',
      '<h1>Source</h1>',
      '<input name="source_file" type="file"><br />',
      'Language: <input name="source_language"><br />',
      '<h1>Target</h1>',
      'Language: <input name="target_language"><br />',
      '<input name="target_file" type="file"><br />',
      '<input type="submit">',
    '</form>'
  ];
  res.send(buf.join(''));
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

function gatherTS (systemId, cb) {
  var ts;
  var to;
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystem({_id: systemId}, function (err, TSdata) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        }
        else {
          ts = TSdata;
          resolve();
        }
      });
    });
  })()
  .then(function getTO () {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutput({systemId: systemId}, function (err, TOdata) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          to = TOdata;
          resolve();
        }
      });
    });
  })
  .then(function getUser () {
    return new Promise(function (resolve, reject) {
      User.getUser({githubId: ts.user}, function (err, Udata) {
        if (err) {
          reject('Unable to retrieve user: ' + err);
        } else {
          resolve({
            systemId: systemId,
            TSdata: ts,
            TOdata: to,
            uData: Udata
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
