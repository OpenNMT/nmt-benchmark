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

function createTestSet (ts, cb) {
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
  async.each(testSets, function (testSet, cb) {
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

function getTestSetHeaders (query, cb) {
  query = query || {};
  TestSet.find(query, {
    'source.content': 0,
    'target.content': 0,
    'comment': 0,
    'evalTool': 0
  }).lean().exec(function (err, result) {
    if (err) {
      console.log('Fail to list test sets', err);
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

function getTestSets (cb) {
  TestSet.find().lean().exec(function (err, result) {
    if (err) {
      console.log('Fail to list test sets', err);
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

function getTestSet (query, cb) {
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
exports.createTestSet = createTestSet;
exports.saveTestSets = saveTestSets;
exports.getTestSets = getTestSets;
exports.getTestSet = getTestSet;
exports.deleteTestSet = deleteTestSet;
exports.getTestSetHeaders = getTestSetHeaders;
