var router = require('express').Router();
var url = require('url');
var tSystem = require('../lib/translationSystem');
var testSet = require('../lib/testSet');
var testOutput = require('../lib/testOutput');
var multiparty = require('multiparty');
var fs = require('fs');
var exec = require('child_process').exec;
var User = require('../lib/user.js');
var tmp = require('tmp');

// TODO ?
router.post('/translationSystem/update', function (req, res, next) {
  // if (!authenticated) { res.redirect('/'); } else {}
  // if current user not author
  tSystem.getTranslationSystem({_id: req.body.system_id}, function (err, data) { // id undefined should be handled by default?
    if (err) {
      console.log('Unable to update translation system:', err);
      res.json({error: err, data: null});
    } else {
      console.log('Translation system updated:', data);
      res.json({error: null, data: data});
    }
  });
});

router.get('/getDataTable', function (req, res, next) {
  var languagePair = url.parse(req.url, true).query || {};
  tSystem.getTranslationSystems(languagePair, function (err, tsData) {
    if (err) {
      console.log('Unable to retrieve translation systems:', err);
    }
    User.getUsers(function (err, uData) {
      if (err) {
        console.log('Unable to retrieve user list:', err);
      }
      tsData.map(function (ts) {
        ts.user = uData.filter(function (user) {
          return user.githubId == ts.user;
        })[0];
      });
      res.json({data: tsData});
    });
  });
});

router.post('/translationSystem/create', function (req, res, next) {
  // if (!authenticated) { res.json({error: 'No rights to create/update systems', data: null}); } else {}
  tSystem.createTranslationSystem(req.body, function (err, data) {
    if (err) {
      console.log('Unable to create translation system', err)
      res.json(JSON.stringify({error: err, data: null}));
    } else {
      res.json(JSON.stringify({error: null, data: data}));
    }
  });
});

router.post('/translationSystem/delete/:systemId', function (req, res, next) {
  // if (!authenticated) { res.redirect('/'); } else {}
  // TODO - delete all related test outputs
  var systemId = req.params.systemId;
  tSystem.deleteTranslationSystem(systemId, function (err) {
    if (err) {
      console.log('Unable to delete translation system');
    }
    res.json({error: err});
  });
});

// upload output file
router.post('/testOutput/upload', function (req, res, next) {
  // if (!authenticated) { res.redirect('/'); } else {}

  var form = new multiparty.Form();
  var systemId = url.parse(req.url, true).query.systemId;
  var query = {};

  form.on('error', function(err) {
    console.log('Error parsing form: ' + err.stack);
    res.send('error');
    res.redirect('/translationSystem/view/' + systemId);
  });

  form.parse(req, function (err, fields, files) {
    for (f in fields) {
      query[f] = fields[f][0];
    }
    for (f in files) {
      fs.readFile(files[f][0].path, function (err, content) {
        if (err) {
          console.log('Cannot read file:', err);
        } else {
          query.content = content;
          query.fileName = files[f][0].originalFilename;
          query.date = new Date();
          testOutput.saveTestOutputs(query, function (err, data) {
            var outputId = data[0]._id;
            var fileId = query.fileId;
            var hypothesis = files[f][0].path;
            // calculateScores(outputId, fileId, hypothesis);
            res.redirect('/translationSystem/view/' + query.systemId);
          });
        }
      })
    }
  });
});

// remove output file
router.get('/testOutput/delete/:testOutputId', function (req, res, next) {
  // if (!authenticated) { res.redirect('/'); } else {}
  var toId = req.params.testOutputId;
  testOutput.deleteTestOutput(toId, function (err) {
    if (err) {
      console.log('Unable to delete test output');
    }
    res.json({error: err});
  });
});

// get test file source
router.get('/download/:fileId', function (req, res, next) {
  var fileId = req.params.fileId;
  testSet.getTestSet({_id: fileId}, function (err, data) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.setHeader('Content-disposition', 'attachment; filename=' + data.source.fileName);
      res.setHeader('Content-type', 'text/plain');
      res.send(data.source.content);
    }
  });

  /*
    var request = require('request');
    var winston = require('winston');
    var nconf = require('nconf');

    request.get(url)
      .on('error', function (err) {
        winston.error('Error on retrieving corpus: ' + err);
      })
      .on('response', function (response) {
        serverStatus = response.statusCode;
        winston.info('Retrieving corpus - Status: ', response.statusCode);
      })
      .on('data', function (data) {
        if (serverStatus !== 200) {
          try {
            winston.error('Unable to retrieve corpus. Server complains: ', JSON.parse(data));
          } catch (err) {
            winston.info('Server response contains binary data');
          }
        }
      })
      .pipe(res);
  */

});

// add test file to mongodb
router.post('/addTestSetR', function (req, res, next) {
  var form = new multiparty.Form();
  var query = {};
  form.parse(req, function (err, fields, files) {
    for (f in fields) {
      if (f.match(/_/)) {
        var side = f.split('_')[0];
        var field = f.split('_')[1];
        query[side] = query[side] || {};
        query[side][field] = fields[f][0];
      } else {
        query[f] = fields[f][0];
      }
    }
    var readFiles = [];
    for (f in files) {
      var side = f.replace(/_.*$/, '');
      query[side] = query[side] || {};
      query[side].fileName = files[f][0].originalFilename;
      (function (side, path) {
        readFiles.push(new Promise(function (resolve, reject) {
          fs.readFile(path, function (err, content) {
            if (err) {
              reject('Cannot read file:', err);
            } else {
              query[side].content = content;
              resolve();
            }
          });
        }));
      })(side, files[f][0].path);
    }
    Promise.all(readFiles).then(function (result) {
      testSet.saveTestSets(query, function (err, data) {
        res.redirect('/addTestSet');
      });
    }).catch(function (error) {
      console.log(error);
      res.redirect('/addTestSet');
    })
  });
  form.on('error', function(err) {
    console.log('Error parsing form: ' + err.stack);
    res.redirect('/addTestSet');
  });
});

module.exports = router;


function calculateScores (outputId, fileId, hypothesis) {

  var tmpName
  getSource(fileId)
  fs.write(reference, function () {

  })
  var cmd = 'perl ../lib/multi-bleu.perl ' + reference + ' < ' + hypothesis
  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      console.log(err);
    } else {
      var score = stdout;
      testOutput.update({score: score});
      rm temp file
    }
  });
}
