var crypto = require('crypto');
var winston = require('winston');

var GitHubStrategy = require('passport-github2').Strategy;
var nconf = require('nconf');
var User = require('./user.js');

var clientID = nconf.get('OpenNMTBenchmark:passport:clientID');
var clientSecret = nconf.get('OpenNMTBenchmark:passport:clientSecret');
var callbackPath = nconf.get('OpenNMTBenchmark:passport:callbackPath');
var callbackURL = nconf.get('OpenNMTBenchmark:URL') + callbackPath;

function init (app, passport) {
  passport.use(new GitHubStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: callbackURL,
  }, function (accessToken, refreshToken, profile, done) {
    var user = {
      githubId: profile.id,
      avatarURL: profile._json.avatar_url,
      gitProfile: profile.profileUrl,
      apiKey: crypto.randomBytes(10).toString('hex'),
      name: profile.displayName
    }
    User.updateUser({githubId: profile.id}, user, function (err, user) {
      return done(null, profile);
    });
  }));

  app.get('/auth/github',
    passport.authenticate('github', {scope: ['user:email']})
  );

  app.get(callbackPath, function (req, res, next) {
    passport.authenticate('github', function (err, user, info) {
      if (err) {
        winston.info('Unable to log in', err);
        req.flash('error', 'Authentication issue, unable to log in');
        res.redirect('/');
      } else {
        winston.info(
          'User',
          user.displayName,
          '(' + user.id + ')',
          'logged in'
        );
        res.redirect('/');
      }
    })(req, res, next);
  });
}

exports.init = init;
