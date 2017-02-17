var async = require('async');
var mongoose = require('mongoose');
var db = require('./mongodb');

var userDb;

var userSchema = mongoose.Schema({
  githubId: String,
  avatarURL: String,
  gitProfile: String,
  apiKey: String,
  name: String
});

var User = mongoose.model('users', userSchema);

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

function updateUser (query, user, cb) {
  User.findOne(query, function (err, found) {
    if (err) {
      console.error('Fail to retrieve user list:', err);
      cb(err);
    }
    if (!found) {
      User.findOneAndUpdate(query, user, {upsert: true}, function (err, user) {
        if (err) {
          console.log('Fail to update user');
          cb(err);
        }
        cb(err, user);
      });
    } else {
      cb(err, found);
    }
  });
}

function saveUsers (users, cb) {
  async.each(users, function (user, cb) {
    cb();
  }, function (err) {
    if (err) {
      console.error('Fail to save users:', err);
      cb(err);
      return;
    }
    User.insertMany(users, cb);
  });
}

function getUsers (cb) {
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
  User.find(query).remove().lean().exec(function (err) {
    if (err) {
      cb(err);
    } else {
      cb(null);
    }
  });
}

exports.User = User;
exports.createUser = createUser;
exports.saveUsers = saveUsers;
exports.getUsers = getUsers;
exports.getUser = getUser;
exports.deleteUser = deleteUser;
exports.updateUser = updateUser;
