var GitHubStrategy = require('passport-github2').Strategy;
var nconf = require('nconf');

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
    console.log('...tick...');
    // store user in db or create new one
    process.nextTick(function () {
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
