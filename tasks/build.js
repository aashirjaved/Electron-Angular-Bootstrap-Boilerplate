'use strict';

var pathUtil = require('path');
var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var jetpack = require('fs-jetpack');
var livereload = require('gulp-livereload');
var wiredep = require('wiredep').stream;
var series = require('stream-series');
var utils = require('./utils');
var generateSpecsImportFile = require('./generate_specs_import');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

var paths = {
    devDir: [
        './**/*.html'
    ],
    copyFromAppDir: [
        './node_modules/**',
        './bower_components/**',
        './vendor/**',
        './**/*.html',
        './**/*.+(jpg|png|svg)'
    ],
}

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function (callback) {
    return destDir.dirAsync('.', { empty: true });
});

/**
 * BOWER INJECT TASKS
 */
var injectBowerTask = function () {
    return gulp.src(srcDir.path('app.html'))
    .pipe(wiredep({ cwd: 'app' }))
    .pipe(gulp.dest(srcDir.path()));
}
gulp.task('inject-bower', injectBowerTask);


var copyTask = function () {
    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: paths.copyFromAppDir
    });
};
gulp.task('copy', ['clean', 'inject-bower'], copyTask);
gulp.task('copy-watch', copyTask);


/**
 * LIVERELOAD TASKS
 */
var srcTask = function () {
    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: paths.devDir
    });
};
gulp.task('src-watch', srcTask);

var livereloadTask = function () {
    console.log('reload***')
    return gulp.src([
        // destDir.path('renderer/**/*.js'), 
        destDir.path('**/*.html')
    ])
    .pipe(livereload());
};
gulp.task('livereload-watch', ['src-watch'], livereloadTask);



/**
 * SASS TASKS
 */
var sassTask = function () {
    return gulp.src([
        srcDir.path('**/*.scss')
    ])
    .pipe(sass())
    .pipe(concat('main.css'))
    .pipe(gulp.dest(function() {
        return destDir.path('css');
    }));
};
var sassTaskDev = function () {
    return sassTask()
    .pipe(livereload());
};
gulp.task('sass', ['clean'], sassTask);
gulp.task('sass-watch', sassTaskDev);


/**
 * JAVASCRIPT RELOACTION
 */
var javascriptTask = function () {
    return gulp.src('app/**/*.js')
    .pipe(gulp.dest(function() {
        return destDir.path();
    }));
};
var javascriptTaskDev = function () {
    return javascriptTask()
    .pipe(livereload());
};
gulp.task('javascript', ['clean'], javascriptTask);
gulp.task('javascript-watch', javascriptTaskDev);


gulp.task('finalize', ['clean'], function () {
    var manifest = srcDir.read('package.json', 'json');

    // Add "dev" or "test" suffix to name, so Electron will write all data
    // like cookies and localStorage in separate places for each environment.
    switch (utils.getEnvName()) {
        case 'development':
            manifest.name += '-dev';
            manifest.productName += ' Dev';
            break;
        case 'test':
            manifest.name += '-test';
            manifest.productName += ' Test';
            break;
    }

    // Copy environment variables to package.json file for easy use
    // in the running application. This is not official way of doing
    // things, but also isn't prohibited ;)
    manifest.env = projectDir.read('config/env_' + utils.getEnvName() + '.json', 'json');

    destDir.write('package.json', manifest);
});


gulp.task('watch', function () {
    // TODO: figure out how to start app w/out 404 on livereload.js
    livereload.listen({ reloadPage: 'app.html' });
    gulp.watch(paths.devDir, { cwd: 'app' }, ['livereload-watch']);
    gulp.watch('app/**/*.js', ['javascript-watch']);
    gulp.watch(paths.copyFromAppDir, { cwd: 'app' }, ['copy-watch']);
    gulp.watch('app/**/*.scss', ['sass-watch']); 
});


gulp.task('build', ['javascript', 'sass', 'copy', 'finalize']);
