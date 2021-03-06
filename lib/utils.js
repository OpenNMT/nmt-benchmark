const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true
    })
  ]
});
const tSystem = require('../lib/translationSystem');
const testOutput = require('../lib/testOutput');
const testSet = require('../lib/testSet');
const User = require('../lib/user.js');

function uniq (array, column) {
  var tmp = {};
  var uniq = [];
  for (var i = 0, l = array.length; i < l; ++i) {
    if (tmp.hasOwnProperty(array[i][column])) {
      continue;
    }
    uniq.push(array[i][column]);
    tmp[array[i][column]] = 1;
  }
  return uniq;
}

function gatherUS (userId, cb) {
  var ts;
  var to;
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystems({user: userId}, function (err, tsData) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        } else {
          ts = tsData;
          resolve();
        }
      });
    });
  })()
  .then(function getTO () {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutputs({}, {}, function (err, toData) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          to = toData;
          ts.forEach(function (ts) {
            var scores = scores || {};
            toData.forEach(function (to) {
              if (to.systemId === ts._id.toString()) {
                scores[to.fileId] = to.scores;
              }
            });
            ts.scores = scores;
          });
          resolve();
        }
      });
    });
  })
  .then(function getUser () {
    return new Promise(function (resolve, reject) {
      User.getUser({githubId: userId}, function (err, uData) {
        if (err) {
          reject('Unable to retrieve user: ' + err);
        } else {
          resolve({
            tsData: ts,
            uData: uData,
            toData: to
          });
        }
      });
    });
  })
  .then(function (data) {
    cb(null, data);
  })
  .catch(function (err) {
    logger.error(err);
    cb(err);
  });
}

function gatherTS (systemId, cb) {
  var ts;
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystem({_id: systemId}, function (err, tsData) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        } else {
          ts = tsData;
          resolve();
        }
      });
    });
  })()
  .then(function getUser () {
    return new Promise(function (resolve, reject) {
      User.getUser({githubId: ts.user}, function (err, uData) {
        if (err) {
          reject('Unable to retrieve user: ' + err);
        } else {
          resolve({
            systemId: systemId,
            tsData: ts,
            uData: uData
          });
        }
      });
    });
  })
  .then(function (data) {
    cb(null, data);
  })
  .catch(function (err) {
    logger.error(err);
    cb(err);
  });
}

function checkFormat (id, content, done) {
  new Promise(function (resolve, reject) {
    testSet.getTestSet({_id: id}, function (err, testFile) {
      if (err) {
        reject(err);
      } else {
        if (testFile.evalTool === 'mteval-13a.pl') {
          if (content.toString().match(/^<tstset /)) {
            resolve();
          } else {
            reject('Unsupported xml format');
          }
        } else { // multibleu
          if (testFile.target.content.split(/\n/).length === content.toString().split(/\n/).length) {
            resolve();
          } else {
            reject('Discrepancy in line numbers between source and translation output');
          }
        }
      }
    });
  }).then(function () {
    done();
  }).catch(function (error) {
    done(error);
  });
}

function getUniqueLPs (array) {
  var tmp = {};
  return array.map(function (file) {
    return file.source.language + file.target.language;
  }).filter(function (lp) {
    if (!tmp.hasOwnProperty(lp)) {
      tmp[lp] = 1;
      return true;
    }
  }).map(function (lp) {
    return {
      src: lp.substring(0, 2),
      tgt: lp.substring(2)
    };
  });
}

/**
 * Retrieve test set list - should be asynchronous
 *
 * @return Promise
 *
 */
function getTestsSets () {
  var query = {};
  var projection = {
    'source.content': 0,
    'target.content': 0,
    'comment': 0,
    'evalTool': 0
  };
  return new Promise(function (resolve, reject) {
    testSet.getTestSets(query, projection, function (err, tsData) {
      if (err) {
        reject('Unable to retrieve test sets: ' + err);
      } else {
        resolve(tsData);
      }
    });
  }).then(function (tsData) {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutputHeaders({}, function (err, toData) {
        if (err) {
          logger.warn('Unable to retrieve output data: ' + err);
        } else {
          tsData.forEach(function (ts) {
            ts.nbOutputs = toData.filter(function (to) {
              return to.fileId === ts._id.toString();
            }).length;
          });
        }
        resolve(tsData);
      });
    });
  });
}

module.exports = {
  uniq: uniq,
  gatherUS: gatherUS,
  gatherTS: gatherTS,
  checkFormat: checkFormat,
  getUniqueLPs: getUniqueLPs,
  getTestsSets: getTestsSets
};
