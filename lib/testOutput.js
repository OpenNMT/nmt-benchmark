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

function createTestOutput (fields, done) {
  var ts = prepareTestOutput(fields);
  TestOutput.create(ts, function (err, data) {
    if (err) {
      console.error('Fail to create test output:', err);
    }
    if (done) {
      done(err, data);
    }
  });
}

function saveTestOutputs (TestOutputs, done) {
  async.each(TestOutputs, function (TestOutput, done) {
    TestOutput = prepareTestOutput(TestOutput);
    done();
  }, function (err) {
    if (err) {
      console.error('Fail to save test outputs:', err);
      done(err);
      return;
    }
    TestOutput.insertMany(TestOutputs, done);
  });
}

function setScores (id, scores, done) {
  var query = {_id: id};
  TestOutput.findOne(query, function (err, output) {
    if (err) {
      console.error('Fail to update output scores:', err);
    } else {
      output.scores = scores;
      output.save();
      if (typeof done === 'function') {
        done(err, output);
      }
    }
  });
}

function getTestOutputs (query, projection, done) {
  query = query || {};
  projection = projection || {};
  TestOutput.find(query, projection).lean().exec(function (err, result) {
    if (err) {
      console.log('Fail to list test outputs', err);
      done(err);
    } else {
      done(null, result);
    }
  });
}

function getTestOutput (query, done) {
  TestOutput.find(query).lean().exec(function (err, data) {
    if (err) {
      done(err);
    } else {
      done(null, data);
    }
  });
}

function deleteTestOutput (query, done) {
  TestOutput.find(query).remove().lean().exec(function (err) {
    if (err) {
      done(err);
    } else {
      done(null);
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
