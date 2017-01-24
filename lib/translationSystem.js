var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var translationSystemDb;

var translationSystemSchema = mongoose.Schema({
  systemName: String,
  version: String,
  type: String,
  date: Date,
  url: String,
  recipe: String,
  sourceLanguage: String,
  targetLanguage: String,
  user: String,
  constraint: String,
  trainSet: String,
  architecture: String,
  features: String,
  tokenization: String,
  vocabulary: String,
  layers: String,
  rnnType: String,
  dropout: String,
  embedding: String,
  encoder: String,
  decoder: String,
  attention: String,
  generator: String,
  oov: String,
  optimization: String,
  training: String
});

var TranslationSystem = mongoose.model('translationsystems', translationSystemSchema);

function init (c) {
  db.init(c);
}

function open (cb) {
  if (!translationSystemDb) {
    db.open('opennmtbenchmark', function (err, dbOpened) {
      if (!err) {
        translationSystemDb = dbOpened;
      }
      cb(err);
    });
  }
}

function close () {
  if (translationSystemDb) {
    translationSystemDb.close();
  }
}

function prepareTranslationSystem (fields) {
  /*if (fields.description.date) {
    fields.description.date = date.toDate(fields.description.date);
  }*/
  return fields || {};
}

function createTranslationSystem (ts, cb) {
  // var ts = prepareTranslationSystem(ts);
  TranslationSystem.create(ts, function (err, data) {
    if (err) {
      console.error('Fail to create translation system:', err);
    }
    if (cb) {
      cb(err, data);
    }
  });
}

// update system
function saveTranslationSystems (translationSystems, cb) {
  async.each(translationSystems, function (ts, cb) {
    ts = prepareTranslationSystem(ts);
    cb();
  }, function (err) {
    if (err) {
      console.error('Fail to save translation system:', err);
      cb(err);
      return;
    }
    TranslationSystem.insertMany(translationSystems, cb);
  });
}

function getTranslationSystems (query, cb) {
  open(function (){}) // =/
  query = query || {};
  TranslationSystem.find(query).lean().exec(function (err, results) {
    if (err) {
      console.log('Fail to list translation systems:', err);
      cb(err);
    } else {
      cb(null, results);
    }
  });
}

function getTranslationSystem (query, cb) {
  TranslationSystem.findOne(query).lean().exec(function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(null, data);
    }
  });
}

function deleteTranslationSystem (id, cb) {
  var query = {_id: id};
  TranslationSystem.find(query).remove(function (err) {
    if (err) {
      cb(err);
    } else {
      cb (null);
    }
  });
}

exports.TranslationSystem = TranslationSystem;
exports.init = init;
exports.open = open;
exports.close = close;
exports.createTranslationSystem = createTranslationSystem;//upload
exports.saveTranslationSystems = saveTranslationSystems;//upload
exports.getTranslationSystems = getTranslationSystems;
exports.getTranslationSystem = getTranslationSystem;
exports.deleteTranslationSystem = deleteTranslationSystem;
