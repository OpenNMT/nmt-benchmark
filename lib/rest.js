var router = require('express').Router();
var url = require('url');
var multiparty = require('multiparty');
var fs = require('fs.extra');
var winston = require('winston');

var System = require('./translationSystem.js');
var Test = require('./testSet.js');
var User = require('./user.js');
var Output = require('./testOutput.js');
var calculateScores = require('./calculateScores');

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
  userExists(apiKey)
  .then(function () {
    System.getTranslationSystems({}, function (err, systemList) {
      if (err) {
        res.status(DATABASE_ERROR.code).send({error: DATABASE_ERROR.responseText});
      } else {
        res.status(200).send(systemList);
      }
    })
  }).catch(function (error) {
    res.status(UNATHORIZED.code).send({error: error});
  });
});

/** TODO
 * Upload a system description
 *
 * @params json
 *
 * @returns system id
 */
router.post('/system/upload/:apiKey', function () {
  var apiKey = req.params.apiKey;
  // TODO
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
  var query = {}
  var src = req.body.src || '';
  var tgt = req.body.tgt || '';
  if (src) {
    query['source.language'] = src;
  }
  if (tgt) {
    query['target.language'] = tgt;
  }
  userExists(apiKey)
  .then(function () {
    Test.getTestSetHeaders(query, function (err, testSetList) {
      if (err) {
        res.status(DATABASE_ERROR.code).send({error: DATABASE_ERROR.responseText});
      } else {
        res.status(200).send(testSetList);
      }
    })
  }).catch(function (error) {
    res.status(UNATHORIZED.code).send({error: error});
  });
});

/** TODO
 * Download test file source text
 *
 * @params test id
 *
 * @returns test file source
 */
router.get('/test/download/:apiKey', function () {
  var apiKey = req.params.apiKey;
  //TODO
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
  var systemId = req.body.systemId;
  var query = systemId ? {systemId: systemId} : {};
  userExists(apiKey)
  .then(function () {
    Output.getTestOutputHeaders(query, function (err, outputList) {
      if (err) {
        res.status(DATABASE_ERROR.code).send({error: DATABASE_ERROR.responseText});
      } else {
        res.status(200).send(outputList);
      }
    })
  }).catch(function (error) {
    res.status(UNATHORIZED.code).send({error: error});
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
  userExists(apiKey)
  .then(function () {
    var query = {};
    var form = new multiparty.Form();
    form.on('error', function (err) {
      winston.error('Error parsing form: ' + err.stack);
      res.status(500).send(err);
    });

    form.parse(req, function (err, fields, files) {
      for (f in fields) {
        query[f] = fields[f][0];
      }
      if (files.length === 0) {
        res.status(REQ_MISSING.code).send(REQ_MISSING.responseText);
      } else if (!query.fileId || !query.systemId) {
        res.status(REQ_MISSING.code).send(REQ_MISSING.responseText);
      } else {
        for (f in files) {
          fs.readFile(files[f][0].path, function (err, content) {
            if (err) {
              winston.warn('Cannot read file:', err);
              res.status(500).send(err);
            } else {
              query.content = content;
              query.fileName = files[f][0].originalFilename;
              query.date = new Date();
              Output.saveTestOutputs(query, function (err, data) {
                if (err) {
                  winston.warn('Cannot save test outputs:', err);
                  res.status(500).send(err);
                } else {
                  var outputId = data[0]._id;
                  var fileId = query.fileId;
                  var hypothesis = files[f][0].path;
                  calculateScores(outputId, fileId, hypothesis, function (err, score) {
                    if (err) {
                      res.status(500).send(err);
                    } else {
                      res.status(200).send(score);
                    }
                  });
                }
              });
            }
          });
        }
      }
    });
  }).catch(function (error) {
    res.status(UNATHORIZED.code).send({error: error});
  });
});

module.exports = router;

/**
 * Check if user with the provided apiKey exists in database
 */
function userExists (apiKey) {
  return new Promise(function (resolve, reject) {
    var query  = {apiKey: apiKey};
    User.getUser(query, function (err, userList) {
      if (err) {
        reject(err);
      } else if (userList) {
        resolve(); // return user _id
      } else {
        reject(UNATHORIZED.responseText);
      }
    });
  });
}
