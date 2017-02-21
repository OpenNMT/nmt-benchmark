const router = require('express').Router();
const url = require('url');
const fs = require('fs.extra');
const path = require('path');
const exec = require('child_process').exec;
const tmp = require('tmp');
const multiparty = require('multiparty');
const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true
    })
  ]
});
const http = require('http');

const calculateScores = require('../lib/calculateScores');
const tSystem = require('../lib/translationSystem');
const testSet = require('../lib/testSet');
const testOutput = require('../lib/testOutput');
const User = require('../lib/user.js');
const checkFormat = require('../lib/utils.js').checkFormat;
const uniq = require('../lib/utils.js').getUniqueLPs;
const trainingSets = require('../lib/trainingSets').list;

/* TODO
router.post('/translationSystem/update', function (req, res, next) {
  if (!req.user) {
    res.json({error: res.__('Log in to edit translation systems'), data: null});
  } else {
    tSystem.getTranslationSystem({_id: req.body.system_id}, function (err, data) {
      if (err) {
        logger.warn('Unable to update translation system:', err);
        res.json({error: err, data: null});
      } else {
        res.json({error: null, data: data});
      }
    });
  }
});
*/

router.get('/getDataTable', function (req, res, next) {
  var query = url.parse(req.url, true).query || {};

  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystems(query, function (err, tsData) {
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
              return user.githubId === ts.user;
            })[0];
          });
          resolve(tsData);
        }
      });
    });
  })
  .then(function getTO (tsData) {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutputs({}, {}, function (err, toData) {
        if (err) {
          reject(err);
        } else {
          tsData.forEach(function (ts) {
            // Add scores from output collection
            var scores = scores || {};
            toData.filter(function (to) {
              return to.systemId === ts._id.toString();
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
    logger.error(error);
  });
});

router.get('/getLanguagePairs', function (req, res, next) {
  var restricted = url.parse(req.url, true).query.restricted;
  var query = {'primary': true};
  var projection = {
    'source.content': 0,
    'target.content': 0,
    'comment': 0,
    'evalTool': 0
  };
  testSet.getTestSets(query, projection, function (err, TSdata) {
    if (err) {
      res.json(JSON.stringify({error: err, data: null}));
    } else {
      if (restricted) {
        query = {
          'fileId': {
            '$in': TSdata.map(function (d) {
              return d._id;
            })}
        };
        projection = {
          'fileId': 1
        };
        testOutput.getTestOutputs(query, projection, function (err, TOdata) {
          if (err) {
            res.json(JSON.stringify({error: err, data: null}));
          } else {
            var data = uniq(TSdata.filter(function (ts) {
              return TOdata.map(function (d) {
                return d.fileId;
              }).some(function (el) {
                return el === ts._id;
              });
            }));
            res.json({data: data});
          }
        });
      } else {
        res.json({data: uniq(TSdata)});
      }
    }
  });
});

router.get('/getTestSets', function (req, res, next) {
  var src = url.parse(req.url, true).query.src;
  var tgt = url.parse(req.url, true).query.tgt;
  var query = {};
  if (src) {
    query['source.language'] = {'$in': src.split(',')};
  }
  if (tgt) {
    query['target.language'] = {'$in': tgt.split(',')};
  }
  var projection = {
    'source.content': 0,
    'target.content': 0,
    'comment': 0,
    'evalTool': 0
  };
  testSet.getTestSets(query, projection, function (err, data) {
    if (err) {
      res.json(JSON.stringify({error: err, data: null}));
    } else {
      res.json({data: data});
    }
  });
});

router.get('/getTranslationOutputs', function (req, res, next) {
  var systemId = url.parse(req.url, true).query.systemId;
  var query = {systemId: systemId};
  var projection = {content: 0};
  testOutput.getTestOutputs(query, projection, function (err, data) {
    if (err) {
      res.json(JSON.stringify({error: err, data: null}));
    } else {
      res.json({data: data});
    }
  });
});

router.post('/translationSystem/create', function (req, res, next) {
  if (!req.user) {
    logger.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: res.__('<a href="/auth/github">Log in</a> to submit translation systems'), data: null});
  } else {
    // Check if training data exist for a system trained on internal data
    if (req.body.constraint === 'true') {
      var sourceLangExists = req.body.sourceLanguage.every(function (code) {
        return trainingSets.map(function (file) {
          return file.source.language;
        }).some(function (lang) {
          return lang === code;
        });
      });
      var targetLangExists = req.body.targetLanguage.every(function (code) {
        return trainingSets.map(function (file) {
          return file.target.language;
        }).some(function (lang) {
          return lang === code;
        });
      });
      if (!sourceLangExists || !targetLangExists) {
        logger.warn('Cannot create a constrainted translation system with no available data');
        res.json({error: res.__('No training data is available for selected languages. Switch "Constraint" option to "No" and try again.'), data: null});
        return;
      }
    }

    tSystem.createTranslationSystem(req.body, function (err, data) {
      if (err) {
        logger.warn('Unable to create translation system', err);
        res.json(JSON.stringify({error: err, data: null}));
      } else {
        logger.info(
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
    logger.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: res.__('<a href="/auth/github">Log in</a> to delete your translation systems'), data: null});
  } else {
    var systemId = req.params.systemId;
    tSystem.deleteTranslationSystem(systemId, function (err) {
      if (err) {
        logger.warn('Unable to delete translation system', err);
        res.json({error: err});
      } else {
        testOutput.deleteTestOutput({systemId: systemId}, function (err) {
          if (err) {
            logger.warn('Unable to delete translation file', err);
          }
          logger.info(
            'User',
            req.user.displayName,
            '(' + req.user.id + ')',
            'deleted his translation system',
            systemId
          );
          req.flash('info', res.__('Translation system successfully deleted'));
          res.json({error: err});
        });
      }
    });
  }
});

router.post('/testOutput/upload', function (req, res, next) {
  if (!req.user) {
    logger.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: res.__('<a href="/auth/github">Log in</a> to upload test outputs'), data: null});
  } else {
    var form = new multiparty.Form();
    var systemId = url.parse(req.url, true).query.systemId;
    var query = {};

    form.on('error', function (err) {
      logger.warn('Error parsing test output form: ' + err.stack);
      req.flash('warn', res.__('Server was unable to parse submitted data'));
      res.redirect('/translationSystem/view/' + systemId);
    });

    form.parse(req, function (err, fields, files) {
      for (var field in fields) {
        if (fields.hasOwnProperty(field)) {
          query[field] = fields[field][0];
        }
      }
      for (var file in files) {
        if (files.hasOwnProperty(file)) {
          fs.readFile(files[file][0].path, function (err, content) {
            if (err) {
              logger.warn('Cannot read file:', err);
            } else {
              checkFormat(query.fileId, content, function (err) {
                if (err) {
                  req.flash('warning', err);
                  res.redirect('/translationSystem/view/' + query.systemId);
                } else {
                  query.content = content;
                  query.fileName = files[file][0].originalFilename;
                  query.date = new Date();
                  testOutput.saveTestOutputs(query, function (err, data) {
                    if (err) {
                      logger.warn('Unable to save output content to database', err);
                      // Already handled by form.on.error ?
                      // req.flash('warning', res.__('A database error occured. Unable to save file content.'));
                      // res.redirect('/translationSystem/view/' + query.systemId);
                    } else {
                      var outputId = data[0]._id;
                      var fileId = query.fileId;
                      var hypothesis = files[file][0].path;
                      var params = {
                        outputId: outputId,
                        referenceId: fileId,
                        hypothesis: hypothesis
                      };
                      calculateScores(params, function (err, scores) {
                        if (err) {
                          req.flash('error', err);
                          res.redirect('/translationSystem/view/' + query.systemId);
                        } else {
                          req.flash('info', res.__('Translation output successfully uploaded'));
                          logger.info(
                            'User',
                            req.user.displayName,
                            '(' + req.user.id + ')',
                            'successfully uploaded a translation output to system',
                            query.systemId
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
        }
      }
    });
  }
});

router.get('/testOutput/delete/:testOutputId', function (req, res, next) {
  if (!req.user) {
    logger.warn('Unauthenticated user tried to access ' + req.url);
    res.json({error: res.__('<a href="/auth/github">Log in</a> to remove test outputs'), data: null});
  } else {
    var toId = req.params.testOutputId;
    testOutput.deleteTestOutput({_id: toId}, function (err) {
      if (err) {
        logger.warn('Unable to delete translation output', err);
      } else {
        req.flash('info', res.__('Translation output successfully removed'));
        logger.info(
          'User',
          req.user.displayName,
          '(' + req.user.id + ')',
          'successfully removed a translation output',
          toId
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
      logger.warn('Unable to download test file', fileId, err);
      res.sendStatus(500);
    } else {
      logger.info('Downloading test file', fileId);
      res.setHeader('Content-disposition', 'attachment; filename=' + data.source.fileName);
      res.setHeader('Content-type', 'text/plain');
      res.send(data.source.content);
    }
  });
});

module.exports = router;
