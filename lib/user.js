var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var userDb;

var userSchema = mongoose.Schema({
  githubId: String, // 24807785
  avatarURL: String, // https://avatars0.githubusercontent.com/u/24807785
  gitProfile: String, // https://github.com/kemi-kemi
  name: String // kemi-kemi
});

var User = mongoose.model('users', userSchema);

function init (c) {
  db.init(c);
}

function open (cb) {
  if (!userDb) { // ?
    db.open('opennmtbenchmark', function (err, dbOpened) {
      if (!err) {
        userDb = dbOpened;
      }
      cb(err);
    });
  }
}

function close () {
  if (userDb) {
    userDb.close();
  }
}

function createUser (user, cb) {
  User.create(user, function (err, data) {
    if (err) {
      console.error('Fail to create user:', err);
    }
    if (cb) {
      cb(err, data);
    }
  });
}

function saveUsers (users, cb) {
  open(function () {})
  async.each(users, function (user, cb) {
    cb();
  }, function (err) {
    if (err) {
      console.error('Fail to save users:', err);
      cb(err);
      return;
    }
    User.insertMany(user, cb);
  });
}

function getUsers (cb) {
  open(function (e) { //?
    console.log(e)
  })

  User.find().lean().exec(function (err, userList) {
    if (err) {
      console.log('Fail to list users', err);
      cb(err);
    } else {
      cb(null, userList);
    }
  });
}

function getUser (query, cb) {
  open(function () {})
  User.findOne(query).lean().exec(function (err, userList) {
    if (err) {
      cb(err);
    } else {
      cb(null, userList);
    }
  });
}

function deleteUser (id, cb) {
  var query = {_id: id};
  User.find(query).remove(function (err) {
    if (err) {
      cb(err);
    } else {
      cb (null);
    }
  });
}

exports.User = User;
exports.init = init;
exports.open = open;
exports.close = close;
exports.createUser = createUser;
exports.saveUsers = saveUsers;
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
