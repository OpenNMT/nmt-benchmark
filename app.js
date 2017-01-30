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
var passport = require('passport');
var flash = require('connect-flash');
var nconf = require('nconf');
nconf.file({
  file: './config/default.yaml',
  format: {
    parse: yaml.safeLoad,
    stringify: yaml.safeDump,
  }
});

var app = express();

app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.resolve(__dirname, 'public', 'favicon.ico')));
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
app.use(flash());

// GitHub authentication
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

var github = require('./lib/githubPassport');

app.use(passport.initialize());
app.use(passport.session());
github.init(app, passport);

// Log out
app.get('/logout', function (req, res){
  req.logout();
  req.flash('info', "You've been succesfully logged out");
  res.redirect('/');
});

// i18n
i18n.configure({
  locales: nconf.get('OpenNMTBenchmark:locales'),
  defaultLocale: nconf.get('OpenNMTBenchmark:default:locale'),
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
app.use(require('./routes/globals/getTestSets'));
// Get language pairs
app.use(require('./routes/globals/getLanguagePairs'));
// Get default language pair
app.use(require('./routes/globals/getDefaultLP'));
// Languages in human-readable format
app.use(require('./routes/globals/langList'));
// User, if authenicated
app.use(require('./routes/globals/getUser'));

// Paths
app.use('/', require('./routes/index'));
app.use('/', require('./routes/api'));
app.use('/', require('./lib/rest'));

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
