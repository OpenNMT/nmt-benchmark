var router = require('express').Router();
var url = require('url');
var tSystem = require('../lib/translationSystem');
var testSet = require('../lib/testSet');
var testOutput = require('../lib/testOutput');
var multiparty = require('multiparty');
var fs = require('fs');
var exec = require('child_process').exec;

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
  var languagePair = url.parse(req.url, true).query || {sourceLanguage: 'en', targetLanguage: 'fr'};
  tSystem.getTranslationSystems(languagePair, function (err, data) {
    if (err) {
      console.log('Unable to retrieve translation systems:', err);
    }
    res.json({data: data});
  });
});

router.post('/translationSystem/add', function (req, res, next) {
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

router.post('/translationSystem/delete', function (req, res, next) {
  // if (!authenticated) { res.redirect('/'); } else {}
  // delete all related test outputs
  tSystem.deleteTranslationSystem(req.body.system_id, function (err) {
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
    res.redirect('/translationSystem/view?systemId=' + systemId);
  });

  form.on('field', function (name, value) {
    query[name] = value;
  });

  form.on('file', function (name, file) {
    fs.readFile(file.path, function (err, content) {
      if (err) {
        console.log('cannot read file:', err);
      } else {
        query.content = content.toString();
        query.fileName = file.originalFilename;
        testOutput.saveTestOutputs(query, function (err, data) {
          var outputId = data[0]._id;
          var fileId = query.fileId;
          var hypothesis = file.path;
          // calculateScores(outputId, fileId, hypothesis);
          res.redirect('/translationSystem/view?systemId=' + query.systemId);
        });
      }
    });
  });

  form.parse(req, function (err, fields, files) {});
});

// remove output file
router.post('/testOutput/delete', function (req, res, next) {
  // if (!authenticated) { res.redirect('/'); } else {}
  var toId = req.body.testOutputId; // get?
  testOutput.deleteTestOutput(toId, function (err) {
    if (err) {
      console.log('Unable to delete test output');
    }
    res.json({error: err});
  });
});

// get test file source
router.get('/download', function (req, res, next) {
  var fileId = url.parse(req.url, true).query.fileId;

  testSet.getTestSet({_id: fileId}, function (err, data) {
    if (err) {
      res.sendStatus(500);
    } else {
      res.setHeader('Content-disposition', 'attachment; filename=' + data.fileName);
      res.setHeader('Content-type', 'text/plain');
      res.send(data.sourceContent);
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
  form.parse(req, function (err, fields, files) {});
  form.on('error', function(err) {
    console.log('Error parsing form: ' + err.stack);
    res.redirect('/addTestSet');
  });
  form.on('field', function (name, value) {
    console.log('field', name, value)
    query[name] = value;
  });
  form.on('file', function (name, file) {
    console.log('file', file)
    fs.readFile(file.path, function (err, content) {
      if (err) {
        console.log('cannot read file:', err);
      } else {
        var sourceContent = content.toString()
          .split('\n')
          .map(function (bitext) {
            return bitext.split('\t')[0];
          })
          .join('\n');
        var targetContent = content.toString()
          .split('\n')
          .map(function (bitext) {
            return bitext.split('\t')[1];
          })
          .join('\n');
        if (!targetContent) {
          console.log('not a bitext!')
          res.redirect('/addTestSet');
        } else {
          query.label = file.originalFilename.replace(/\..*$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
          query.fileName = file.originalFilename;
          query.sourceContent = sourceContent;
          query.targetContent = targetContent;
          query.sourceLanguage = query.lp.substring(0, 2);
          query.targetLanguage = query.lp.substring(2);
          console.log('exec query', JSON.stringify(query))
          testSet.saveTestSets(query, function (err, data) {
            console.log('done')
            res.redirect('/addTestSet');
          });
        }
      }
    });
  });
});

module.exports = router;

/*
function calculateScores (outputId, fileId, hypothesis) {
  var reference = '../data/reference'
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
*/
