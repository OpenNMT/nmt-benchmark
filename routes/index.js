var router = require('express').Router();
var url = require('url');
var tSystem = require('../lib/translationSystem');
var testOutput = require('../lib/testOutput');
var multiparty = require('multiparty');
var fs = require('fs');

router.get('/', function(req, res, next) {
  res.render('index', {
    alert: ''
  });
});

router.get('/translationSystem/view', function (req, res, next) {
  var systemId = url.parse(req.url, true).query.systemId;
  if (systemId) {
    gatherTS(systemId, function (err, data) {
      if (err) {
        res.redirect('/')  // message: err
      } else {
        data.mode = 'view';
        data.allSrc = uniq(res.locals.languagePairs, 'sourceLanguage');
        data.allTgt = uniq(res.locals.languagePairs, 'targetLanguage');
        // console.log('we still have file id', data.TOdata[0].fileId)
        // console.log('send to client', JSON.stringify(data, false, 2))
        res.render('translationSystem', data);
      }
    });
  } else {
    console.log(systemId, 'system not found')
    res.redirect('/') // message: system not found
  }
});

router.get('/translationSystem/edit', function (req, res, next) {
  var systemId = url.parse(req.url, true).query.systemId;
  if (systemId) {
    gatherTS(systemId, function (err, data) {
      if (err) {
        res.redirect('/')  // message: system not found
      } else {
        data.mode = 'edit';
        data.allSrc = uniq(res.locals.languagePairs, 'sourceLanguage');
        data.allTgt = uniq(res.locals.languagePairs, 'targetLanguage');
        res.render('translationSystem', data);
      }
    });
  } else {
    console.log(systemId, 'system not found')
    res.redirect('/') // message: system not found
  }
});

router.get('/translationSystem/add', function (req, res, next) {
  // if (!authenticated) { res.json({error: 'No rights to create/update systems', data: null}); } else {}
  var lp = url.parse(req.url, true).query.lp || 'enfr';
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

// TODO
router.get('/userSystems', function (req, res, next) {
  res.render('userSystems', {testSets: res.locals.testSets});
});

// add test file to database
router.get('/addTestSet', function (req, res, next) {
  var buf = [
    '<form action="/addTestSetR" method="POST" enctype="multipart/form-data" >',
    '<input name="lp" placeholder="lp"><br />',
    '<input name="file" type="file"><br />',
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
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystem({_id: systemId}, function (err, TSdata) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        }
        else {
          TSdata = TSdata.toObject();
          // console.log('TSdata', JSON.stringify(TSdata, false, 2))
          resolve(TSdata);
        }
      });
    });
  })()
  .then(function getTO (TSdata) {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutput({systemId: systemId}, function (err, TOdata) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          // console.log('TOdata', JSON.stringify(TOdata, false, 2))
          /*TOdata = TOdata.map(function (to) {
            return to.toObject();
          });*/
          // TOdata = TOdata.toArray();
          // TOdata = TOdata.toObject();
          // console.log(TOdata.length, 'we have file id', TOdata[0].fileId)
          resolve({
            systemId: systemId,
            TSdata: TSdata,
            TOdata: TOdata
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
