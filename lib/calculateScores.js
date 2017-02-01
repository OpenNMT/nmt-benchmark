const tmp = require('tmp');
const fs = require('fs.extra');
const exec = require('child_process').exec;
const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true
    })
  ]
});
const path = require('path');

const Test = require('./testSet.js');
const Output = require('./testOutput.js');

function calculateScores (outputId, referenceId, hypothesis, done) {

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
      Output.setScores(query, scores, function (err, output) {
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
    if (typeof done === 'function') {
      done(null, scores);
    }
    logger.info('Scores successfully added to database');
  })
  .catch(function (error) {
    if (typeof done === 'function') {
      done(error);
    }
    logger.error(error);
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
      Test.getTestSet(query, function (err, result) {
        if (err) {
          reject('Unable to retrive reference file content: ' + err);
        } else {
          if (!result) {
            reject('Test file not found: ' + referenceId);
          } else {
            referenceContent = result.toObject().target.content;
            // referenceContent = result.target.content;
            evalTool = result.toObject().evalTool;
            resolve();
          }
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

module.exports = calculateScores;
