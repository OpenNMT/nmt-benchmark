var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');
var uniq = require('mongoose-unique-validator');

var translationSystemDb;

var translationSystemSchema = mongoose.Schema({
  systemName: {
    type: String,
    required: true,
    unique: true
  },
  version: String,
  type: {
    type: String,
    required: true
    // enum: ['NMT', 'SMT', Rulebased', 'Hybrid']
  },
  date: Date,
  url: String,
  framework: String,
  recipe: String,
  sourceLanguage: {
    type: String, // array for multiway systems
    require: true
  },
  targetLanguage: {
    type: String, // array for multiway systems
    required: true
  },
  user: String,
  constraint: String, // either constraint or trainSet is required
  trainSet: String, // either constraint or trainSet is required
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

translationSystemSchema.plugin(uniq);
var TranslationSystem = mongoose.model('translationsystems', translationSystemSchema);

function createTranslationSystem (ts, cb) {
  TranslationSystem.create(ts, function (err, data) {
    if (err) {
      console.error('Fail to create translation system:', err);
    }
    if (cb) {
      cb(err, data);
    }
  });
}

function saveTranslationSystems (translationSystems, cb) {
  async.each(translationSystems, function (ts, cb) {
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
      cb(null);
    }
  });
}

exports.TranslationSystem = TranslationSystem;
exports.createTranslationSystem = createTranslationSystem;
exports.saveTranslationSystems = saveTranslationSystems;
exports.getTranslationSystems = getTranslationSystems;
exports.getTranslationSystem = getTranslationSystem;
exports.deleteTranslationSystem = deleteTranslationSystem;
