var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var testOutputDb;

var testOutputSchema = mongoose.Schema({
  fileId: String,
  fileName: String,
  systemId: String,
  content: String,
  score: String
});

var TestOutput = mongoose.model('outputs', testOutputSchema);

function init (c) {
  db.init(c);
}

function open (cb) {
  if (!testOutputDb) { // ?
    db.open('opennmtbenchmark', function (err, dbOpened) {
      if (!err) {
        testOutputDb = dbOpened;
      }
      cb(err);
    });
  }
}

function close () {
  if (testOutputDb) {
    testOutputDb.close();
  }
}

function prepareTestOutput (fields) {
  return fields || {};
}

function createTestOutput (fields, cb) {
  var ts = prepareTestOutput(fields);
  TestOutput.create(ts, function (err, data) {
    if (err) {
      console.error('Fail to create test output:', err);
    }
    if (cb) {
      cb(err, data);
    }
  });
}

function saveTestOutputs (TestOutputs, cb) {
  async.each(TestOutputs, function (TestOutput, cb) {
    TestOutput = prepareTestOutput(TestOutput);
    cb();
  }, function (err) {
    if (err) {
      console.error('Fail to save test outputs:', err);
      cb(err);
      return;
    }
    TestOutput.insertMany(TestOutputs, cb);
  });
}

function getTestOutputs (cb) {
  open(function (e) { //?
    console.log(e)
  })

  TestOutput.find({}, function (err, result) {
    if (err) {
      console.log('Fail to list test outputs', err);
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

function getTestOutput (query, cb) {
  open(function () {})
  TestOutput.find(query).lean().exec(function (err, data) {
  // TestOutput.findOne(query, function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, data);
    }
  });
}

function deleteTestOutput (id, cb) {
  var query = {_id: id};
  TestOutput.find(query).remove(function (err) {
    if (err) {
      cb(err);
    } else {
      cb (null);
    }
  });
}

exports.TestOutput = TestOutput;
exports.init = init;
exports.open = open;
exports.close = close;
exports.createTestOutput = createTestOutput; // upload
exports.saveTestOutputs = saveTestOutputs; // upload
exports.getTestOutputs = getTestOutputs;
exports.getTestOutput = getTestOutput;
exports.deleteTestOutput = deleteTestOutput;
