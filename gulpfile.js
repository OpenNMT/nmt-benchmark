const gulp = require('gulp');
const uglify = require('gulp-uglify');
const jshint = require('gulp-jshint');
const jshintStylish = require('jshint-stylish');
const jscs = require('gulp-jscs');
const jscsStylish = require('gulp-jscs-stylish');
const puglint = require('gulp-pug-lint');
const spawn = require('child_process').spawn;
const log = require('gulp-util').log;
const cached = require('gulp-cached');
const remember = require('gulp-remember');
const rename = require('gulp-rename');

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
    templates: 'views/*.pug'
  }
};

/**
 * Build browser resources: javascript files, stylesheets
 */
gulp.task('browser:jslint', function () {
  return gulp.src([path.browser.config, path.browser.js])
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish))
    .pipe(jshint.reporter('fail', {ignoreWarning: false}));
});
gulp.task('browser:jscs', ['browser:jslint'], function () {
  return gulp.src(path.browser.js)
    // only changed files
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
gulp.task('build:browser', ['browser:minify'], function () {});

/**
 * Lint pug templates
 */
gulp.task('browser:puglint', function () {
  gulp.src(path.browser.templates)
    .pipe(cached('templates'))
    .pipe(puglint())
    .pipe(remember('templates'));
});

/**
 * Related to server
 */
gulp.task('server:lint', function () {
  return gulp.src([path.server.config, ...path.server.app])
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish))
    .pipe(jshint.reporter('fail', {ignoreWarning: false}));
});
gulp.task('server:jscs', function () {
  return gulp.src(path.server.app)
    // only changed files
    .pipe(jscs())
    .pipe(jscsStylish())
    .pipe(jscs.reporter('failImmediately'));
});
gulp.task('server:start', ['server:lint', 'server:jscs'], function () {
  log('Reload server...');
  killServer();
  server = spawn('node', ['./bin/www'], {stdio: 'inherit'});
  server.on('close', function (code) {
    if (code === 8) {
      log('Server error');
    }
  });
});

/**
 * Entry point
 */
gulp.task('default', ['server:start'], function () {
  var watch = {
    browser: {},
    server: {}
  };
  watch.browser.js = gulp.watch(path.browser.js, ['build:browser']);
  // watch.browser.css = gulp.watch(path.browser.css, ['browser']); - TODO

  // Lint pug templates watcher
  watch.browser.templates = gulp.watch(path.browser.templates, ['browser:puglint']);
  watch.browser.templates.on('change', function (e) {
    if (e.type === 'deleted') {
      delete cached.caches.templates[e.path];
      remember.forget('templates', e.path);
    }
  });

  // Server livereload
  watch.server = gulp.watch(path.server.app, ['server:start']);

  // Browser livereload - TODO
  watch.browser.js.on('change', function (e) {
    if (e.type === 'deleted') {
      delete cached.caches.scripts[e.path];
      remember.forget('scripts', e.path);
    }
  });
});


process.on('SIGINT', function () {
  killServer();
  process.exit();
});

process.on('SIGTERM', function () {
  killServer();
  process.exit();
});

function killServer () {
  if (server) {
    server.kill();
  }
}
