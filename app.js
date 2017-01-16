var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var winston = require('winston');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var i18n = require('i18n');
var session = require('express-session');
var yaml = require('js-yaml');

var mongoose = require('mongoose');
var nconf = require('nconf');
nconf.file({
  file: './config/default.yaml',
  format: {
    parse: yaml.safeLoad,
    stringify: yaml.safeDump,
  }
});

var testSets = require('./lib/testSet');
testSets.init(nconf.get('OpenNMTBenchmark:Database'));

var app = express();

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(path.resolve(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));
// app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(session({
  secret: 'one of these days i\'m gonna cut you into little pieces',
  resave: true,
  saveUninitialized: true
}));

// GitHub auth
var passport = require('passport');
var GitHubStrategy = require('passport-github').Strategy;
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GitHubStrategy({
  clientID: '8ceac28889c3d476304b',
  clientSecret: '029d68fab478110f6a1db541f96978919233a317',
  callbackURL: 'http://www.opennmtbenchmark.com:3000/auth/github/callback'
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    done(null, profile);
  });
}));
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
app.use('/auth/github', function (req, res, next) {
  console.log('goto github');//
  next();
});
app.use('/auth/github/callback', function (req, res, next) {
  console.log('here we go again');//
  next();
});
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback', passport.authenticate('github', {
  successRedirect: '/logsuccess',
  failureRedirect: '/logerror'
}));
app.get('/logsuccess', function(req, res, next) {
  res.send('logged in', req.isAuthenticated());
  next();
});
app.get('/logerror', function(req, res, next) {
  res.send('logging in.');
  next();
});

// Log out
app.get('/logout', function (req, res){
  req.logout();
  res.redirect('/');
});

// i18n
i18n.configure({
  locales: ['en'],
  defaultLocale: 'en',
  cookie: 'locale',
  directory: path.resolve(__dirname, 'locales')
});
app.use(function (req, res, next) {
  res.locals.__ = res.__ = function () {
    return i18n.__.apply(req, arguments);
  };
  next();
});
app.use(i18n.init);

// Get available test files
app.use(require('./routes/getTestSets'));
// Get language pairs
app.use(require('./routes/getLanguagePairs'));


// Paths
app.use('/', require('./routes/index'));
app.use('/', require('./routes/userSystems'));//api

app.use(function (req, res, next) {
  var err = new Error(req.url + ' not found');
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
