var async = require('async');
var db = require('./mongodb');
var mongoose = require('mongoose');

var outputDb;

var outputSchema = mongoose.Schema(
{
  id: {type: String, index: true},
  testSrc: String,
  system: String,
  score: mongoose.Schema.Types.Mixed,
  content: mongoose.Schema.Types.Mixed,
  user: String,
  status: String
});
outputSchema.index({from: -1});
outputSchema.index({to: -1});

var Output = mongoose.model('output', outputSchema);

function init (c) {
  db.init(c);
}

function open (callback) {
  if (!outputDb) {
    db.open('output', function (err, dbOpened) {
      if (!err) {
        outputDb = dbOpened;
      }
      callback(err);
    });
  }
}

function close () {
  if (outputDb) {
    outputDb.close();
  }
}

// TODO

function prepareOutput (fields) {
  var d = fields || {};
  if (d.from)
    d.from = date.toDate(d.from);
  if (d.to)
    d.to = date.toDate(d.to);
  d.insertedAt = new Date();
  if (d.location && d.location.coordinates) {
    if (typeof d.location.coordinates[0] === 'string')
      d.location.coordinates[0] = parseFloat(d.location.coordinates[0]);
    if (typeof d.location.coordinates[1] === 'string')
      d.location.coordinates[1] = parseFloat(d.location.coordinates[1]);
  }
  return d;
}

function createOutput (fields, cb) {
  var output = prepareOutput(fields);
  Output.create(output, function (err, data) {
    if (err) {
      console.error('Fail to create output:', err);
    }
    if (cb) {
      cb(err, data);
    }
  });
}

function saveOutputs (outputs, callback) {
  async.each(outputs, function (output, cb) {
    output = prepareOutput(output);
    cb();
  }, function (err) {
    if (err) {
      console.error('Fail to create output:', err);
      callback(err);
      return;
    }
    Output.insertMany(outputs, callback);
  });
}


function getOutputs (cb) {
  open(function (e) { //?
    console.log(e)
  })

  Output.find({}, function (err, result) {
    if (err) {
      console.log('Fail to list outputs', err);
      cb(err);
    } else {
      cb(null, result);
    }
  });
}

function getOutput (query, cb) {
  Output.findOne(query, function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, data);
    }
  });
}

function deleteOutput (id, cb) {
  var query = {_id: id};
  Output.find(query).remove(function (err) {
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
exports.createOutput = createOutput;//upload
exports.saveOutputs = saveOutputs;//upload
exports.getOutputs = getOutputs;
exports.getOutput = getOutput;
exports.deleteOutput = deleteOutput;

