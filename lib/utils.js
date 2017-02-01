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
        }
        else {
          ts = tsData;
          resolve();
        }
      });
    });
  })()
  .then(function getTO () {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutputs(function (err, toData) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          to = toData;
          ts.forEach(function (ts) {
            var scores = scores || {};
            toData.forEach(function (to) {
              if (to.systemId == ts._id) {
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
  .then(function(data) {
    cb(null, data);
  })
  .catch(function (err) {
    logger.error(err);
    cb(err);
  });
}

function gatherTS (systemId, cb) {
  var ts;
  var to;
  (function getTS () {
    return new Promise(function (resolve, reject) {
      tSystem.getTranslationSystem({_id: systemId}, function (err, tsData) {
        if (err) {
          reject('Unable to retrieve translation system data: ' + err);
        }
        else {
          ts = tsData;
          resolve();
        }
      });
    });
  })()
  .then(function getTO () {
    return new Promise(function (resolve, reject) {
      testOutput.getTestOutput({systemId: systemId}, function (err, toData) {
        if (err) {
          reject('Unable to retrieve test outputs data: ' + err);
        } else {
          to = toData;
          resolve();
        }
      });
    });
  })
  .then(function getUser () {
    return new Promise(function (resolve, reject) {
      User.getUser({githubId: ts.user}, function (err, uData) {
        if (err) {
          reject('Unable to retrieve user: ' + err);
        } else {
          resolve({
            systemId: systemId,
            tsData: ts,
            toData: to,
            uData: uData
          });
        }
      });
    });
  })
  .then(function(data) {
    cb(null, data);
  })
  .catch(function (err) {
    logger.error(err);
    cb(err);
  });
}

module.exports = {
  uniq: uniq,
  gatherUS: gatherUS,
  gatherTS: gatherTS
};
