const gulp = require('gulp');
const uglify = require('gulp-uglify');
const jshint = require('gulp-jshint');
const jscs = require('gulp-jscs');
const jscsStylish = require('gulp-jscs-stylish');
const jshintStylish = require('jshint-stylish');
const cached = require('gulp-cached');
const remember = require('gulp-remember');
const rename = require("gulp-rename");
const spawn = require('child_process').spawn;
const log = require('gulp-util').log;

var server;
const path = {
  server: {
    config: '.jshintrc',
    app: ['bin/www', 'app.js', 'routes/**/*.js', 'lib/*.js', 'config/*.js']
  },
  browser: {
    config: './source/.jshintrc',
    js: 'source/javascripts/*.js',
    css: 'source/stylesheets',
    pug: 'view/*.pug'
  }
};

/**
 * Build browser resources: javascript files, stylesheets, jade templates
 */
gulp.task('browser:lint', function () {
  return gulp.src([path.browser.config, path.browser.js])
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish))
    .pipe(jshint.reporter('fail', {ignoreWarning: false}));
});
gulp.task('browser:jscs', ['browser:lint'], function () {
  return gulp.src(path.browser.js)
    .pipe(jscs())
    .pipe(jscsStylish())
    .pipe(jscs.reporter('failImmediately'))
});
gulp.task('browser:minify', ['browser:jscs'], function () {
  return gulp.src(path.browser.js)
    .pipe(cached('scripts'))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./public/javascripts'))
    .pipe(remember('scripts'));
});
gulp.task('build:browser', ['browser:minify'], function () {
  log('Javascript files linted and minified');
});

/**
 * Lint server code
 */
gulp.task('server:lint', function () {
  return gulp.src([path.server.config, ...path.server.app])
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish))
    .pipe(jshint.reporter('fail', {ignoreWarning: false}));
});
gulp.task('server:jscs', ['server:lint'], function () {
  return gulp.src(path.server.app)
    .pipe(jscs())
    .pipe(jscsStylish())
    .pipe(jscs.reporter('failImmediately'));
});
gulp.task('build:server', ['server:jscs'], function () {
  log('Server linted');
});

gulp.task('watch', ['server'], function () {
  var watch = {
    browser: {},
    server: {}
  };
  watch.browser.js = gulp.watch(path.browser.js, ['build:browser']); // css + jade
  // var watch.browser.css = gulp.watch(path.browser.css, ['browser']);
  // var watch.browser.pug = gulp.watch(path.browser.pug, ['browser']);

  // Server livereload
  watch.server = gulp.watch(path.server.app, ['server']);

  // Browser livereload
  watch.browser.js.on('change', function (e) {
    if (e.type === 'deleted') {
      delete cached.caches.scripts[e.path];
      remember.forget('scripts', e.path);
    }
  });
});

gulp.task('server', ['build:server'], function () {
  log('Reload server...');
  killServer();
  server = spawn('node', ['./bin/www'], {stdio: 'inherit'});
  server.on('close', function (code) {
    if (code === 8) {
      log('Server error');
    }
  });
});

process.on('SIGINT', function () {
  killServer();
});

process.on('SIGTERM', function () {
  killServer();
});

function killServer () {
  if (server) {
    server.kill();
  }
}
