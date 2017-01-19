var router = require('express').Router();
var url = require('url');
var fs = require('fs.extra');
var path = require('path');
var exec = require('child_process').exec;
var tmp = require('tmp');
var multiparty = require('multiparty');

var tSystem = require('../lib/translationSystem');
var testSet = require('../lib/testSet');
var testOutput = require('../lib/testOutput');
var User = require('../lib/user.js');

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
          tsData.map(function (ts) {
            // Add scores from output collection
            ts.scores = toData.filter(function (to) {
              return to.systemId == ts._id;
            }).map(function (to) {
              return to.scores;
            })[0];
            // TODO - take test file into account
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
    console.log(error);
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
            calculateScores(outputId, fileId, hypothesis);
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
    // TODO map evalTool to cmd
    var multibleu = path.resolve('./lib/multi-bleu.perl'); // path to tool might be changed...
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
    console.log('Scores successfully added to database');
  })
  .catch(function (error) {
    console.log(error);
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
