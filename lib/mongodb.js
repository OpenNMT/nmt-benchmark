var mongoose = require ('mongoose');
mongoose.Promise = global.Promise;

var config;
var login;
var password;
var addUserToDb;

function init (dbConfig) {
  config = dbConfig;
  if (config.User) {
    login = config.User.login;
    password = config.User.password;
    addUserToDb = config.addUser;
  }
}

function open (dbName, callback) {
  console.log('Try to open db ' + dbName);

  var url = 'mongodb://';

  if (login && password) {
    url += login + ':' + password + '@';
  }

  var first = true;
  config.hosts.forEach(function (host) {
    if (! first) {
      url += ',';
    } else {
      first = false;
    }
    url += host.host + ':' + (host.port || 27017);
  });

  url += '/' + dbName;

  if (config.replicaSet) {
    url += '?replicaSet=' + config.replicaSet;
  }

  console.log('DB URL', url);

  var opts = {
    db: {
      retryMilliSeconds: 2000,
      w: 1 
    }
  };

  if (config.replicaSet) {
    opts.replSet = {
      poolSize: config.poolSize
    };
    opts.server = {
      poolSize: config.poolSize || 15,
      autoReconnect: false
    };
    opts.replSet.ssl = config.ssl;
    opts.replSet.sslValidate = config.sslValidate;
    opts.replSet.sslCA = config.sslCA;
    opts.replSet.sslCert = config.sslCert;
    opts.replSet.sslKey = config.sslKey;
    opts.replSet.sslPass = config.sslPass;
  } else {
    opts.server = {
      poolSize: config.poolSize || 15,
      autoReconnect: true
    };
    opts.server.ssl = config.ssl;
    opts.server.sslValidate = config.sslValidate;
    opts.server.sslCA = config.sslCA;
    opts.server.sslCert = config.sslCert;
    opts.server.sslKey = config.sslKey;
    opts.server.sslPass = config.sslPass;
  }

  mongoose.connect(url, opts, function (err) {
    if (err) {
      console.error('db.open connection error:', err);
      callback(err);
    }
  });
  var db = mongoose.connection;
  db.on('error', function (err) {
    console.log('Error while opening db', dbName, ':', err);
  });
  db.on('open', function () {
    console.log('DB', dbName, 'opened');

    callback(null, db);
  });
}

function close (database) {
  if (database) {
    database.close();
  }
}

exports.init = init;
exports.open = open;
exports.close = close;
