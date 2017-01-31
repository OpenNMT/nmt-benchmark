const router = require('express').Router();
const url = require('url');
const fs = require('fs.extra');
const path = require('path');
const exec = require('child_process').exec;
const tmp = require('tmp');
const multiparty = require('multiparty');
const winston = require('winston');
const http = require('http');

const calculateScores = require('../lib/calculateScores');
const tSystem = require('../lib/translationSystem');
const testSet = require('../lib/testSet');
const testOutput = require('../lib/testOutput');
const User = require('../lib/user.js');

/* TODO
router.post('/translationSystem/update', function (req, res, next) {
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
});
*/

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
    winston.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: '<a href="/auth/github">Log in</a> to submit translation systems', data: null});
  } else {
    tSystem.createTranslationSystem(req.body, function (err, data) {
      if (err) {
        winston.warn('Unable to create translation system', err);
        res.json(JSON.stringify({error: err, data: null}));
      } else {
        winston.info(
          'Translation system',
          data.systemName,
          '(' + data.sourceLanguage + data.targetLanguage + ')',
          'successfully submitted by',
          req.user.displayName,
          '(' + req.user.id + ')'
        );
        res.json(JSON.stringify({error: null, data: data}));
      }
    });
  }
});

router.get('/translationSystem/delete/:systemId', function (req, res, next) {
  if (!req.user) {
    winston.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: '<a href="/auth/github">Log in</a> to delete your translation systems', data: null});
  } else {
    var systemId = req.params.systemId;
    tSystem.deleteTranslationSystem(systemId, function (err) {
      if (err) {
        winston.warn('Unable to delete translation system', err);
        res.json({error: err});
      } else {
        testOutput.deleteTestOutput({systemId: systemId}, function (err) {
          if (err) {
            winston.warn('Unable to delete translation file', err);
          }
          winston.info(
            'User',
            req.user.displayName,
            '(' + req.user.id + ')',
            'deleted his translation system',
            systemId
          );
          req.flash('info', 'Translation system successfully deleted');
          res.json({error: err});
        });
      }
    });
  }
});

router.post('/testOutput/upload', function (req, res, next) {
  if (!req.user) {
    winston.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: '<a href="/auth/github">Log in</a> to upload test outputs', data: null});
  } else {
    var form = new multiparty.Form();
    var systemId = url.parse(req.url, true).query.systemId;
    var query = {};

    form.on('error', function (err) {
      winston.warn('Error parsing test output form: ' + err.stack);
      req.flash('warn', 'Server was unable to parse submitted data');
      res.redirect('/translationSystem/view/' + systemId);
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
              if (err) {
                winston.warn('Unable to save output content to database', err);
                // Already handled by form.on.error ?
                // req.flash('warning', 'A database error occured. Unable to save file content.');
                // res.redirect('/translationSystem/view/' + query.systemId);
              } else {
                var outputId = data[0]._id;
                var fileId = query.fileId;
                var hypothesis = files[f][0].path;
                calculateScores(outputId, fileId, hypothesis);
                req.flash('info', 'Translation output successfully uploaded');
                winston.info(
                  'User',
                  req.user.displayName,
                  '(' + req.user.id + ')',
                  'successfully uploaded a translation output'
                );
                res.redirect('/translationSystem/view/' + query.systemId);
              }
            });
          }
        });
      }
    });
  }
});

router.get('/testOutput/delete/:testOutputId', function (req, res, next) {
  if (!req.user) {
    winston.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: '<a href="/auth/github">Log in</a> to remove test outputs', data: null});
  } else {
    var toId = req.params.testOutputId;
    testOutput.deleteTestOutput({_id: toId}, function (err) {
      if (err) {
        winston.warn('Unable to delete translation output', err);
      } else {
        req.flash('info', 'Translation output successfully removed');
        winston.info(
          'User',
          req.user.displayName,
          '(' + req.user.id + ')',
          'successfully removed a translation output'
        );
      }
      res.json({error: err});
    });
  }
});

router.get('/download/test/:fileId', function (req, res, next) {
  var fileId = req.params.fileId;
  testSet.getTestSet({_id: fileId}, function (err, data) {
    if (err) {
      winston.warn('Unable to download test file', fileId, err);
      res.sendStatus(500);
    } else {
      winston.info('Downloading test file', fileId)
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
  winston.info('Downloading training data', fileId);
  var file = fs.createWriteStream(fileName);
  http.get(path2file, function () {
    res.pipe(file);
  });
});

module.exports = router;
