var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var testSetDb;

var testSetSchema = mongoose.Schema({
  label: String,
  fileName: String,
  sourceContent: String,
  targetContent: String,
  sourceLanguage: String,
  targetLanguage: String
});

var TestSet = mongoose.model('testsets', testSetSchema);

function init (c) {
  db.init(c);
}

function open (cb) {
  if (!testSetDb) { // ?
    db.open('opennmtbenchmark', function (err, dbOpened) {
      if (!err) {
        testSetDb = dbOpened;
      }
      cb(err);
    });
  }
}

function close () {
  if (testSetDb) {
    testSetDb.close();
  }
}

function prepareTestSet (fields) {
  return fields || {};
}

function createTestSet (fields, cb) {
  var ts = prepareTestSet(fields);
  TestSet.create(ts, function (err, data) {
    if (err) {
      console.error('Fail to create test set:', err);
    }
    if (cb) {
      cb(err, data);
    }
  });
}

function saveTestSets (testSets, cb) {
  open(function () {})
  async.each(testSets, function (testSet, cb) {
    testSet = prepareTestSet(testSet);
    cb();
  }, function (err) {
    if (err) {
      console.error('Fail to save test sets:', err);
      cb(err);
      return;
    }
    TestSet.insertMany(testSets, cb);
  });

}

function getTestSets (cb) {
  open(function (e) { //?
    console.log(e)
  })

  TestSet.find({}, function (err, result) {
    if (err) {
      console.log('Fail to list test sets', err);
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

function getTestSet (query, cb) {
  open(function () {})
  TestSet.findOne(query, function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, data);
    }
  });
}

function deleteTestSet (id, cb) {
  var query = {_id: id};
  TestSet.find(query).remove(function (err) {
    if (err) {
      cb(err);
    } else {
      cb (null);
    }
  });
}

exports.TestSet = TestSet;
exports.init = init;
exports.open = open;
exports.close = close;
exports.createTestSet = createTestSet;//upload
exports.saveTestSets = saveTestSets;//upload
exports.getTestSets = getTestSets;
exports.getTestSet = getTestSet;
exports.deleteTestSet = deleteTestSet;
