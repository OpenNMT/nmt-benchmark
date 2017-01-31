var crypto = require('crypto');

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

  app.get(callbackPath,
    passport.authenticate('github', {
      successRedirect: '/',
      failureRedirect: '/',
    })
  );
}

exports.init = init;
