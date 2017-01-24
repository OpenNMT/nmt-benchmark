var router = require('express').Router();
var url = require('url');
var fs = require('fs.extra');
var path = require('path');
var exec = require('child_process').exec;
var tmp = require('tmp');
var multiparty = require('multiparty');
var winston = require('winston');
var http = require('http');

var tSystem = require('../lib/translationSystem');
var testSet = require('../lib/testSet');
var testOutput = require('../lib/testOutput');
var User = require('../lib/user.js');

// TODO ?
router.post('/translationSystem/update', function (req, res, next) {
  res.redirect('/translationSystem/view');
  /*
  if (!req.user) {
    res.json({error: 'Log in to edit translation systems', data: null});
  } else {
    tSystem.getTranslationSystem({_id: req.body.system_id}, function (err, data) {
      if (err) {
        winston.warn('Unable to update translation system:', err);
        res.json({error: err, data: null});
      } else {
        res.json({error: null, data: data});
      }
    });
  }
  */
});

router.get('/getDataTable', function (req, res, next) {
  var languagePair = url.parse(req.url, true).query || {};

  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystems(languagePair, function (err, tsData) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        } else {
          resolve(tsData);
        }
      });
    });
  })()
  .then(function getUser (tsData) {
    return new Promise(function (resolve, reject) {
      User.getUsers(function (err, uData) {
        if (err) {
          reject('Unable to retrieve user list:', err);
        } else {
          tsData.map(function (ts) {
            // Replace user id by user rich object
            ts.user = uData.filter(function (user) {
              return user.githubId == ts.user;
            })[0];
          });
          resolve(tsData);
        }
      });
    });
  })
  .then(function getTO (tsData) {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutputs(function (err, toData) {
        if (err) {
          reject(err);
        } else {
          tsData.forEach(function (ts) {
            // Add scores from output collection
            var scores = scores || {};
            toData.filter(function (to) {
              return to.systemId == ts._id;
            }).forEach(function (to) {
              scores[to.fileId] = to.scores;
            });
            ts.scores = scores;
          });
          resolve(tsData);
        }
      });
    });
  })
  .then(function (response) {
    res.json({data: response});
  })
  .catch(function (error) {
    winston.error(error);
  });
});

router.post('/translationSystem/create', function (req, res, next) {
  if (!req.user) {
    res.json({error: 'Log in to submit translation systems', data: null});
  } else {
    tSystem.createTranslationSystem(req.body, function (err, data) {
      if (err) {
        winston.warn('Unable to create translation system', err);
        res.json(JSON.stringify({error: err, data: null}));
      } else {
        res.json(JSON.stringify({error: null, data: data}));
      }
    });
  }
});

router.post('/translationSystem/delete/:systemId', function (req, res, next) {
  if (!req.user) {
    res.json({error: 'Log in to remove your translation systems', data: null});
  } else {
    var systemId = req.params.systemId;
    tSystem.deleteTranslationSystem(systemId, function (err) {
      if (err) {
        winston.warn('Unable to delete translation system', err);
        res.json({error: err});
      } else {
        // TODO - delete all related test outputs
        testOutput.deleteTestOutput({systemId: systemId}, function (err) {
          if (err) {
            winston.warn('Unable to delete output', err);
          }
          res.json({error: err});
        });
      }
    });
  }
});

router.post('/testOutput/upload', function (req, res, next) {
  if (!req.user) {
    res.json({error: 'Log in to upload test outputs', data: null});
  } else {
    var form = new multiparty.Form();
    var systemId = url.parse(req.url, true).query.systemId;
    var query = {};

    form.on('error', function(err) {
      winston.warn('Error parsing form: ' + err.stack);
      // res.send('error');
      res.redirect('/translationSystem/view/' + systemId); // flash err
    });

    form.parse(req, function (err, fields, files) {
      for (f in fields) {
        query[f] = fields[f][0];
      }
      for (f in files) {
        fs.readFile(files[f][0].path, function (err, content) {
          if (err) {
            winston.warn('Cannot read file:', err);
          } else {
            query.content = content;
            query.fileName = files[f][0].originalFilename;
            query.date = new Date();
            testOutput.saveTestOutputs(query, function (err, data) {
              var outputId = data[0]._id;
              var fileId = query.fileId;
              var hypothesis = files[f][0].path;
              calculateScores(outputId, fileId, hypothesis);
              res.redirect('/translationSystem/view/' + query.systemId);
            });
          }
        });
      }
    });
  }
});

router.get('/testOutput/delete/:testOutputId', function (req, res, next) {
  if (!req.user) {
    res.json({error: 'Log in to remove test outputs', data: null});
  } else {
    var toId = req.params.testOutputId;
    testOutput.deleteTestOutput({_id: toId}, function (err) {
      if (err) {
        winston.warn('Unable to delete test output', err);
      }
      res.json({error: err});
    });
  }
});

router.get('/download/test/:fileId', function (req, res, next) {
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
});

router.get('/download/training/:fileId', function (req, res, next) {
  var fileId = req.params.fileId;
  var fileName = fileId + '.tgz'
  var path2file = 'https://s3.amazonaws.com/opennmt-trainingdata/' + fileName;

  var file = fs.createWriteStream(fileName);
  http.get(path2file, function () {
    res.pipe(file);
  });
});

module.exports = router;

function calculateScores (outputId, referenceId, hypothesis) {

  var tmpDir;
  var evalTool;
  var referenceContent;
  var reference;
  var scores = {};

  (function createDir () {
    // Create temporary folder for this particular output
    return new Promise(function (resolve, reject) {
      tmp.dir({template: '/tmp/XXXXXXXX'}, function (err, path) {
        if (err) {
          reject('Unable to create folder in /tmp: ' + err);
        } else {
          tmpDir = path;
          resolve();
        }
      });
    });
  })()
  .then(function () {
    return Promise.all([createHypothesis(), createReference()]);
  })
  .then(function runScorer() {
    // Run evaluation tool
    // TODO - map evalTool to cmd
    var multibleu = path.resolve('./scripts/multi-bleu.perl'); // path to tool might be changed...
    var cmd = ['perl', multibleu, reference, '<', hypothesis].join(' ');
    return new Promise(function (resolve, reject) {
      exec(cmd, function (err, stdout, stderr) {
        if (err) {
          reject('Unable to run evalTool: ' + err);
        } else {
          // TODO - map to evalTool
          scores.BLEU = (function () {
            var list = stdout.match(/([0-9.]+)/g); // Propably a bug of multi-bleu, inversigating
            return parseFloat(list[0]) + parseFloat(list[1]);
          })();
          resolve();
        }
      });
    });
  })
  .then(function saveScores () {
    // Store scores in database
    var query = {_id: outputId};
    return new Promise(function (resolve, reject) {
      testOutput.setScores(query, scores, function (err, output) {
        if (err) {
          reject('Unable to update scores: ' + err);
        } else {
          resolve();
        }
      });
    });
  })
  .then(function cleanUp() {
    // Remove tmp dir
    return new Promise(function (resolve, reject) {
      fs.rmrf(tmpDir, function (err) {
        if (err) {
          reject('Unable to remove temporary folder: ' + err);
        } else {
          resolve();
        }
      });
    });
  })
  .then(function () {
    winston.info('Scores successfully added to database');
  })
  .catch(function (error) {
    winston.error(error);
  });

  function createHypothesis () {
    // Create link to uploaded hypothesis file in tmp folder
    return new Promise(function (resolve, reject) {
      fs.rename(hypothesis, tmpDir + '/hypothesis', function (err, data) {
        if (err) {
          reject('Unable to move hypothesis file: ' + err);
        } else {
          hypothesis = tmpDir + '/hypothesis';
          resolve();
        }
      });
    });
  }

  function createReference () {
    // Retrive evalTool and reference content
    var query = {_id: referenceId};
    return new Promise(function (resolve, reject) {
      testSet.getTestSet(query, function (err, result) {
        if (err) {
          reject('Unable to retrive reference file content: ' + err);
        } else {
          referenceContent = result.toObject().target.content;
          evalTool = result.toObject().evalTool;
          resolve();
        }
      });
    }).then(function () {
      // Write reference content to file
      reference = tmpDir + '/reference';
      return new Promise(function (resolve, reject) {
        fs.writeFile(reference, referenceContent, function (err) {
          if (err) {
            reject('Unable to write reference content to file: ' + err);
          } else {
            resolve();
          }
        });
      });
    });
  }
}
