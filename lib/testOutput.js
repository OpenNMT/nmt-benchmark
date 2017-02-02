var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var testOutputDb;

var testOutputSchema = mongoose.Schema({
  fileId: String,
  fileName: String,
  systemId: String,
  content: String,
  date: Date,
  scores: Object
});

var TestOutput = mongoose.model('outputs', testOutputSchema);

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

function setScores (id, scores, cb) {
  var query = {_id: id};
  TestOutput.findOne(query, function (err, output) {
    if (err) {
      console.error('Fail to update output scores:', err);
    } else {
      output.scores = scores;
      output.save();
      if (cb) {
        cb(err, output);
      }
    }
  });
}

function getTestOutputHeaders (query, cb) {
  query = query || {};
  TestOutput.find(query, {
    'content': 0
  }).lean().exec(function (err, result) {
    if (err) {
      console.log('Fail to list test outputs', err);
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

function getTestOutputs (cb) {
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
  TestOutput.find(query).lean().exec(function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, data);
    }
  });
}

function deleteTestOutput (query, cb) {
  TestOutput.find(query).remove(function (err) {
    if (err) {
      cb(err);
    } else {
      cb(null);
    }
  });
}

exports.TestOutput = TestOutput;
exports.createTestOutput = createTestOutput;
exports.saveTestOutputs = saveTestOutputs;
exports.getTestOutputs = getTestOutputs;
exports.getTestOutput = getTestOutput;
exports.deleteTestOutput = deleteTestOutput;
exports.setScores = setScores;
exports.getTestOutputHeaders = getTestOutputHeaders;
