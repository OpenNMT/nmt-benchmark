var router = require('express').Router();

const url = require('url');
const multiparty = require('multiparty');
const fs = require('fs.extra');
const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true
    })
  ]
});

const System = require('./translationSystem.js');
const Test = require('./testSet.js');
const User = require('./user.js');
const Output = require('./testOutput.js');
const calculateScores = require('./calculateScores');

// Responses
var UNATHORIZED = {
  code: 401,
  responseText: 'Unathorized'
};
var DATABASE_ERROR = {
  code: 500,
  responseText: 'Internal server error'
};
var REQ_MISSING = {
  code: 500,
  responseText: 'Required parameters missing'
};

/**
 * List existent systems
 *
 * @returns json
 *
 * @example curl -X GET "localhost:3000/system/list/500ab"
 */
router.get('/system/list/:apiKey', function (req, res, next) {
  var apiKey = req.params.apiKey;
  userExists(apiKey, req)
  .then(function () {
    System.getTranslationSystems({}, function (err, systemList) {
      if (err) {
        logger.error(err);
        res.status(DATABASE_ERROR.code).send({error: DATABASE_ERROR.responseText});
      } else {
        logger.info(
          'User',
          req.user.name,
          '(' + req.user.githubId + ')',
          'read translation system list - via API'
        );
        res.status(200).send(systemList);
      }
    });
  }).catch(function (error) {
    res.status(error.code).send({error: error.responseText});
  });
});

/**
 * Upload a system description
 *
 * @params json
 *
 * @returns system id
 *
 * @example curl -X POST "localhost:3000/system/upload/" --
 */
router.post('/system/upload/:apiKey', function (req, res, next) {
  var apiKey = req.params.apiKey;
  userExists(apiKey, req)
  .then(function parseForm (userId) {
    return new Promise(function (resolve, reject) {
      var requiredFields = require('../config/systemSubmitForm').systemDescription;
      requiredFields = requiredFields.filter(function (option) {
        return option.required;
      }).map(function (option) {
        return {'name': option.name};
      });
      var form = new multiparty.Form();
      form.on('error', function (err) {
        logger.error('Error parsing form: ' + err.stack);
        reject({code: 500, responseText: err});
      });
      form.parse(req, function (err, fields, files) {
        if (files.length === 0) {
          logger.error('System description not provided');
          reject(REQ_MISSING);
        } else {
          resolve({
            files: files,
            requiredFields: requiredFields,
            userId: userId
          });
        }
      });
    });
  }).then(function readOptions (form) {
    return new Promise(function (resolve, reject) {
      for (var f in form.files) {
        if (form.files.hasOwnProperty(f)) {
          fs.readFile(form.files[f][0].path, function (err, content) {
            var options = JSON.parse(content);
            var req_missing = form.requiredFields.map(function (option) {
              return options[option.name] ? false : true;
            }).reduce(function (a, b) {
              return a || b;
            }, false);
            if (req_missing) {
              logger.error('Required parameters missing');
              reject(REQ_MISSING);
            } else {
              options.user = form.userId;
              resolve(options);
            }
          });
        }
      }
    });
  }).then(function saveSystem (options) {
    return new Promise(function (resolve, reject) {
      System.createTranslationSystem(options, function (err, data) {
        if (err) {
          logger.error(err);
          reject(DATABASE_ERROR);
        } else {
          resolve(data);
        }
      });
    });
  }).then(function (data) {
    logger.info(
      'User',
      req.user.name,
      '(' + req.user.githubId + ')',
      'successfully uploaded a translation system',
      data._id,
      ' - via API'
    );
    res.status(200).send(data);
  }).catch(function (error) {
    res.status(error.code).send(error.responseText);
  });
});

/**
 * List existent test files associated with a given language pair
 *
 * @params src - ISO language code, e.g. xx
 * tgt - ISO language code, e.g. xx
 *
 * @returns json
 *
 * @example curl -X GET "localhost:3000/test/list/500ab" --data "src=en&tgt=ru"
 */
router.get('/test/list/:apiKey', function (req, res, next) {
  var apiKey = req.params.apiKey;
  var query = {};
  var src = url.parse(req.url, true).query.src || req.body.src || '';
  var tgt = url.parse(req.url, true).query.tgt || req.body.tgt || '';
  if (src) {
    query['source.language'] = src;
  }
  if (tgt) {
    query['target.language'] = tgt;
  }
  userExists(apiKey, req)
  .then(function () {
    Test.getTestSetHeaders(query, function (err, testSetList) {
      if (err) {
        logger.error(err);
        res.status(DATABASE_ERROR.code).send({error: DATABASE_ERROR.responseText});
      } else {
        logger.info(
          'User',
          req.user.name,
          '(' + req.user.githubId + ')',
          'read test file list - via API'
        );
        res.status(200).send(testSetList);
      }
    });
  }).catch(function (error) {
    res.status(error.code).send({error: error.responseText});
  });
});

/**
 * Download test file source text
 *
 * @params test id
 *
 * @returns test file source
 */
router.get('/test/download/:apiKey', function (req, res, next) {
  var apiKey = req.params.apiKey;
  userExists(apiKey, req)
  .then(function () {
    return new Promise(function (resolve, reject) {
      var testId = url.parse(req.url, true).query.fileId || req.body.fileId;
      if (!testId) {
        logger.error('Required parameters missing');
        reject(REQ_MISSING);
      } else {
        var query = {_id: testId};
        Test.getTestSet(query, function (err, data) {
          if (err) {
            logger.error(err);
            reject(DATABASE_ERROR);
          } else {
            logger.info(
              'User',
              req.user.name,
              '(' + req.user.githubId + ')',
              'successfully downloaded test file',
              data.source.fileName,
              ' - via API'
            );
            resolve(data.source.content);
          }
        });
      }
    });
  }).then(function (content) {
    res.status(200).send(content);
  }).catch(function (error) {
    res.status(error.code).send({error: error.responseText});
  });
});

/**
 * List existent system outputs
 *
 * @params system id ?
 *
 * @returns json
 *
 * @example curl -X GET "localhost:3000/output/list/500ab" --data "systemId=123456789"
 */
router.get('/output/list/:apiKey', function (req, res, next) {
  var apiKey = req.params.apiKey;
  var systemId = url.parse(req.url, true).query.systemId || req.body.systemId;
  var query = systemId ? {systemId: systemId} : {};
  userExists(apiKey, req)
  .then(function () {
    Output.getTestOutputHeaders(query, function (err, outputList) {
      if (err) {
        logger.error(err);
        res.status(DATABASE_ERROR.code).send({error: DATABASE_ERROR.responseText});
      } else {
        logger.info(
          'User',
          req.user.name,
          '(' + req.user.githubId + ')',
          'read output file list - via API'
        );
        res.status(200).send(outputList);
      }
    });
  }).catch(function (error) {
    res.status(error.code).send({error: error.responseText});
  });
});

/**
 * Upload an output for a given system and test file
 *
 * @params test id, system id, output file
 *
 * @returns bleu score for uploaded file
 *
 * @example curl --form "outputFile=@data/enru/generic_test.google" --form systemId=587e1c4577bb3d55277209d6 --form fileId=587f7c3b7ce77b4131bf92a4 -X POST "looutput/upload/500ab"
 */
router.post('/output/upload/:apiKey', function (req, res, next) {
  var apiKey = req.params.apiKey;
  userExists(apiKey, req)
  .then(function parseForm (userId) {
    return new Promise(function (resolve, reject) {
      var form = new multiparty.Form();
      form.on('error', function (err) {
        logger.error('Error parsing form: ' + err.stack);
        res.status(500).send(err);
      });
      form.parse(req, function (err, fields, files) {
        if (files.length === 0) {
          logger.error('Translation file not provided');
          reject(REQ_MISSING);
        } else {
          resolve({
            files: files,
            fields: fields,
            requiredFields: [
              {'name': 'fileId'},
              {'name': 'systemId'}
            ],
            userId: userId
          });
        }
      });
    });
  }).then(function readTranslation (form) {
    return new Promise(function (resolve, reject) {
      var query = {};
      for (var field in form.fields) {
        if (form.fields.hasOwnProperty(field)) {
          query[field] = form.fields[field][0];
        }
      }
      var req_missing = form.requiredFields.map(function (option) {
        return query[option.name] ? false : true;
      }).reduce(function (a, b) {
        return a || b;
      }, false);
      if (req_missing) {
        reject(REQ_MISSING);
      } else {
        for (var file in form.files) {
          if (form.files.hasOwnProperty(file)) {
            fs.readFile(form.files[file][0].path, function (err, content) {
              if (err) {
                logger.warn('Cannot read file:', err);
                reject({code: 500, responseText: err});
              } else {
                query.content = content;
                query.fileName = form.files[file][0].originalFilename;
                query.date = new Date();
                query.hypothesis = form.files[file][0].path;
                query.userId = form.userId;
                resolve(query);
              }
            });
          }
        }
      }
    });
  }).then(function checkAuthor (query) {
    return new Promise(function (resolve, reject) {
      System.getTranslationSystem({_id: query.systemId}, function (err, system) {
        if (err) {
          logger.error(err);
          reject({code: 500, responseText: err});
        } else {
          if (system.user === query.userId) {
            resolve(query);
          } else {
            logger.error('Trying to upload an output to a system of another user');
            reject(UNATHORIZED);
          }
        }
      });
    });
  }).then(function getEvalTool (query) {
    return new Promise(function (resolve, reject) {
      Test.getTestSet({_id: query.fileId}, function (err, testSet) {
        if (err) {
          reject(err);
        } else {
          query.evalTool = testSet.toObject().evalTool;
          resolve(query);
        }
      });
    });
  }).then(function saveOutput (query) {
    return new Promise(function (resolve, reject) {
      Output.saveTestOutputs(query, function (err, data) {
        if (err) {
          logger.warn('Cannot save test outputs:', err);
          reject({code: 500, responseText: err});
        } else {
          var outputId = data[0]._id;
          var fileId = query.fileId;
          var hypothesis = query.hypothesis;
          var params = {
            outputId: outputId,
            referenceId: fileId,
            hypothesis: hypothesis,
            evalTool: query.evalTool
          };
          calculateScores(params, function (err, score) {
            if (err) {
              logger.error('Unable to get scores', err);
              reject({code: 500, responseText: err});
            } else {
              resolve({
                score: score,
                systemId: query.systemId
              });
            }
          });
        }
      });
    });
  }).then(function (data) {
    logger.info(
      'User',
      req.user.name,
      '(' + req.user.githubId + ')',
      'successfully uploaded a translation output to system',
      data.systemId,
      ' - via API'
    );
    res.status(200).send(data.score);
  }).catch(function (error) {
    logger.error(error);
    res.status(error.code).send({error: error.responseText});
  });
});

module.exports = router;

/**
 * Check if user with the provided apiKey exists in database
 */
function userExists (apiKey, req) {
  return new Promise(function (resolve, reject) {
    var query = {apiKey: apiKey};
    User.getUser(query, function (err, user) {
      if (err) {
        logger.error(err);
        reject({code: 500, responseText: err});
      } else if (user) {
        req.user = user;
        resolve(user.githubId);
      } else {
        logger.error('Unathorized to access server API');
        reject(UNATHORIZED);
      }
    });
  });
}
