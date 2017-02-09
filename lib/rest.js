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
const prefix = 'API  reports -';
const UNATHORIZED = {
  code: 401,
  responseText: 'Unathorized'
};
const DATABASE_ERROR = {
  code: 500,
  responseText: 'Database error'
};
const REQ_MISSING = {
  code: 500,
  responseText: 'Required parameters missing'
};
const REQ_INVALID = {
  code: 500,
  responseText: 'Invalid system name',
  details: 'System name should start with an organization name followed by a colon'
};
const SERVER_ERROR = {
  code: 500,
  responseText: 'Internal server error'
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
    return new Promise(function (resolve, reject) {
      System.getTranslationSystems({}, function (err, systemList) {
        if (err) {
          logger.error(err);
          var error = DATABASE_ERROR;
          error.details = err;
          reject(error);
        } else {
          logger.info(
            'User',
            req.user.name,
            '(' + req.user.githubId + ')',
            'read translation system list - via API'
          );
          resolve(systemList);
        }
      });
    });
  }).then(function done (systemList) {
    res.status(200).send(systemList);
  }).catch(function fail (error) {
    var message = error.responseText + (error.details ? (': ' + error.details) : '');
    logger.error(prefix, message);
    res.status(error.code).send({error: message});
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
  var error;
  userExists(apiKey, req)
  .then(function parseForm (userId) {
    return new Promise(function (resolve, reject) {
      var requiredFields = require('../config/systemSubmitForm').systemDescription;
      requiredFields = requiredFields.filter(function (option) {
        return option.required;
      }).map(function (option) {
        return option.name;
      });
      var form = new multiparty.Form();
      form.on('error', function (err) {
        error = SERVER_ERROR;
        error.details = 'Error on parsing submitted data: ' + err;
        reject(error);
      });
      form.parse(req, function (err, fields, files) {
        if (files.length === 0) {
          error = REQ_MISSING;
          error.details = 'System description file is required';
          reject(error);
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
            if (err) {
              error = SERVER_ERROR;
              error.details = err;
              reject(error);
            } else {
              try {
                var options = JSON.parse(content);
                var missingRequiredFields = form.requiredFields.filter(function (field) {
                  return !options[field];
                });
                if (missingRequiredFields.length > 0) {
                  error = REQ_MISSING;
                  error.details = missingRequiredFields.join(', ');
                  reject(error);
                } else if (!options.systemName.match(/^[^:]+:[^:]/)) {
                  reject(REQ_INVALID);
                } else {
                  options.user = form.userId;
                  resolve(options);
                }
              } catch (e) {
                error = SERVER_ERROR;
                error.details = 'Unable to parse .json file, ' + e;
                reject(error);
              }
            }
          });
        }
      }
    });
  }).then(function saveSystem (options) {
    return new Promise(function (resolve, reject) {
      System.createTranslationSystem(options, function (err, data) {
        if (err) {
          error = DATABASE_ERROR;
          error.details = err;
          reject(error);
        } else {
          logger.info(
            'User',
            req.user.name,
            '(' + req.user.githubId + ')',
            'successfully uploaded a translation system',
            data._id,
            ' - via API'
          );
          resolve(data);
        }
      });
    });
  }).then(function done (data) {
    res.status(200).send(data);
  }).catch(function fail (error) {
    var message = error.responseText + (error.details ? (': ' + error.details) : '');
    logger.error(prefix, message);
    res.status(error.code).send({error: message});
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
    return new Promise(function (resolve, reject) {
      Test.getTestSetHeaders(query, function (err, testSetList) {
        if (err) {
          logger.error(err);
          var error = DATABASE_ERROR;
          error.details = err;
          reject(error);
        } else {
          logger.info(
            'User',
            req.user.name,
            '(' + req.user.githubId + ')',
            'read test file list - via API'
          );
          resolve(testSetList);
        }
      });
    });
  }).then(function done (testSetList) {
    res.status(200).send(testSetList);
  }).catch(function fail (error) {
    var message = error.responseText + (error.details ? (': ' + error.details) : '');
    logger.error(prefix, message);
    res.status(error.code).send({error: message});
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
      var fileId = url.parse(req.url, true).query.fileId || req.body.fileId;
      if (!fileId) {
        logger.error('Required parameters missing');
        var error = REQ_MISSING;
        error.details = 'fileId';
        reject(error);
      } else {
        var query = {_id: fileId};
        Test.getTestSet(query, function (err, data) {
          if (err) {
            logger.error(err);
            var error = DATABASE_ERROR;
            error.details = err;
            reject(error);
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
  }).then(function done (content) {
    res.status(200).send(content);
  }).catch(function fail (error) {
    var message = error.responseText + (error.details ? (': ' + error.details) : '');
    logger.error(prefix, message);
    res.status(error.code).send({error: message});
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
    return new Promise(function (resolve, reject) {
      Output.getTestOutputHeaders(query, function (err, outputList) {
        if (err) {
          logger.error(err);
          var error = DATABASE_ERROR;
          error.details = err;
          reject(error);
        } else {
          logger.info(
            'User',
            req.user.name,
            '(' + req.user.githubId + ')',
            'read output file list - via API'
          );
          resolve(outputList);
        }
      });
    });
  }).then(function done (outputList) {
    res.status(200).send(outputList);
  }).catch(function fail (error) {
    var message = error.responseText + (error.details ? (': ' + error.details) : '');
    logger.error(prefix, message);
    res.status(error.code).send({error: message});
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
  var error;
  userExists(apiKey, req)
  .then(function parseForm (userId) {
    return new Promise(function (resolve, reject) {
      var form = new multiparty.Form();
      form.on('error', function (err) {
        error = SERVER_ERROR;
        error.details = 'Error on parsing submitted data: ' + err;
        reject(error);
      });
      form.parse(req, function (err, fields, files) {
        if (files.length === 0) {
          error = REQ_MISSING;
          error.details = 'Translation file is required';
          reject(error);
        } else {
          resolve({
            files: files,
            fields: fields,
            requiredFields: ['fileId', 'systemId'],
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
      var missingRequiredFields = form.requiredFields.filter(function (field) {
        return !query[field];
      });
      if (missingRequiredFields.length > 0) {
        error = REQ_MISSING;
        error.details = missingRequiredFields.join(', ');
        reject(error);
      } else {
        for (var file in form.files) {
          if (form.files.hasOwnProperty(file)) {
            fs.readFile(form.files[file][0].path, function (err, content) {
              if (err) {
                error = SERVER_ERROR;
                error.details = 'Cannot read file: ' + err;
                reject(error);
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
          error = DATABASE_ERROR;
          error.details = err;
          reject(error);
        } else {
          if (system.user === query.userId) {
            resolve(query);
          } else {
            error = UNATHORIZED;
            error.details = 'Trying to upload an output to a system created by another user';
            reject(UNATHORIZED);
          }
        }
      });
    });
  }).then(function getEvalTool (query) {
    return new Promise(function (resolve, reject) {
      Test.getTestSet({_id: query.fileId}, function (err, testSet) {
        if (err) {
          error = DATABASE_ERROR;
          error.details = err;
          reject(error);
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
          error = DATABASE_ERROR;
          error.details = err;
          reject(error);
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
              error = SERVER_ERROR;
              error.details = err;
              reject(error);
            } else {
              logger.info(
                'User',
                req.user.name,
                '(' + req.user.githubId + ')',
                'successfully uploaded a translation output to system',
                query.systemId,
                ' - via API'
              );
              resolve(score);
            }
          });
        }
      });
    });
  }).then(function done (score) {
    res.status(200).send(score);
  }).catch(function fail (error) {
    var message = error.responseText + (error.details ? (': ' + error.details) : '');
    logger.error(prefix, message);
    res.status(error.code).send({error: message});
  });
});

module.exports = router;

/**
 * Check if user with the provided apiKey exists in database
 */
function userExists (apiKey, req) {
  return new Promise(function (resolve, reject) {
    var query = {apiKey: apiKey};
    var error;
    User.getUser(query, function (err, user) {
      if (err) {
        logger.error(err);
        error = DATABASE_ERROR;
        error.details = err;
        reject(error);
      } else if (user) {
        req.user = user;
        resolve(user.githubId);
      } else {
        error = UNATHORIZED;
        error.details = 'Invalid API key';
        reject(error);
      }
    });
  });
}
