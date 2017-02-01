const crypto = require('crypto');
const winston = require('winston');
const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      'timestamp': true,
      'colorize': true
    })
  ]
});

const GitHubStrategy = require('passport-github2').Strategy;
const nconf = require('nconf');
const User = require('./user.js');

const clientID = nconf.get('OpenNMTBenchmark:passport:clientID');
const clientSecret = nconf.get('OpenNMTBenchmark:passport:clientSecret');
const callbackPath = nconf.get('OpenNMTBenchmark:passport:callbackPath');
const callbackURL = nconf.get('OpenNMTBenchmark:URL') + callbackPath;

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
    };
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
        logger.info('Unable to authenticate user', err);
        req.flash('error', 'Authentication issue, unable to log in');
        return next(err);
      } else {
        if (user) {
          req.logIn(user, function (err) {
            if (err) {
              logger.warn('Unable to log in', err);
              req.flash('error', 'Authentication issue, unable to log in');
              return next(err);
            } else {
              logger.info(
                'User',
                user.displayName,
                '(' + user.id + ')',
                'logged in'
              );
              return  res.redirect('/');
            }
          });
        } else {
          logger.warn('Github returned null user', info);
          req.flash('error', 'Authentication issue, unable to log in');
          return res.redirect('/');
        }
      }
    })(req, res, next);
  });
}

exports.init = init;
