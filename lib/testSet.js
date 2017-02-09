var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var testSetDb;

var testSetSchema = mongoose.Schema({
  source: {
    fileName: String,
    content: String,
    language: String
  },
  target: {
    fileName: String,
    content: String,
    language: String
  },
  domain: String,
  origin: String,
  comment: String,
  primary: Boolean,
  evalTool: String // mteval-13a.pl, multi-bleu.pl
});

var TestSet = mongoose.model('testsets', testSetSchema);

function createTestSet (ts, done) {
  TestSet.create(ts, function (err, data) {
    if (err) {
      console.error('Fail to create test set:', err);
    }
    if (done) {
      done(err, data);
    }
  });
}

function saveTestSets (testSets, done) {
  async.each(testSets, function (testSet, done) {
    done();
  }, function (err) {
    if (err) {
      console.error('Fail to save test sets:', err);
      done(err);
      return;
    }
    TestSet.insertMany(testSets, done);
  });
}

function getTestSets (query, projection, done) {
  query = query || {};
  projection = projection || {};
  TestSet.find(query, projection).lean().exec(function (err, result) {
    if (err) {
      console.log('Fail to list test sets', err);
      done(err);
    } else {
      done(null, result);
    }
  });
}

function getTestSet (query, done) {
  TestSet.findOne(query, function (err, data) {
    if (err) {
      done(err);
    } else {
      done(null, data);
    }
  });
}

function deleteTestSet (id, done) {
  var query = {_id: id};
  TestSet.find(query).remove(function (err) {
    if (err) {
      done(err);
    } else {
      done(null);
    }
  });
}

exports.TestSet = TestSet;
exports.createTestSet = createTestSet;
exports.saveTestSets = saveTestSets;
exports.getTestSets = getTestSets;
exports.getTestSet = getTestSet;
exports.deleteTestSet = deleteTestSet;
