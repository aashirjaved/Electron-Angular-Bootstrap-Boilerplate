'use strict';

var pathUtil = require('path');
var Q = require('q');
var gulp = require('gulp');
var rollup = require('rollup');
var sass = require('gulp-sass');
var jetpack = require('fs-jetpack');
var livereload = require('gulp-livereload');
var inject = require('gulp-inject');
var series = require('stream-series');
var utils = require('./utils');
var generateSpecsImportFile = require('./generate_specs_import');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

var paths = {
    devDir: [
        // './renderer/**/*.js',
        './**/*.html'  
    ],
    copyFromAppDir: [
        './node_modules/**',
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


var copyTask = function () {
    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: paths.copyFromAppDir
    });
};
gulp.task('copy', ['clean'], copyTask);
gulp.task('copy-watch', copyTask);


var bundle = function (src, dest) {
    var deferred = Q.defer();

    rollup.rollup({
        entry: src,
    }).then(function (bundle) {
        var jsFile = pathUtil.basename(dest);
        var result = bundle.generate({
            format: 'cjs',
            sourceMap: true,
            sourceMapFile: jsFile,
        });
        // Wrap code in self invoking function so the variables don't
        // pollute the global namespace.
        var isolatedCode = '(function () {' + result.code + '\n}());';
        return Q.all([
            destDir.writeAsync(dest, isolatedCode + '\n//# sourceMappingURL=' + jsFile + '.map'),
            destDir.writeAsync(dest + '.map', result.map.toString()),
        ]);
    }).then(function () {
        deferred.resolve();
    }).catch(function (err) {
        console.error('Build: Error during rollup', err.stack);
    });

    return deferred.promise;
};

var bundleApplication = function () {
    return Q.all([
        bundle(srcDir.path('background.js'), destDir.path('background.js')),
        bundle(srcDir.path('app.js'), destDir.path('app.js')),
    ]);
};

var bundleSpecs = function () {
    generateSpecsImportFile().then(function (specEntryPointPath) {
        return Q.all([
            bundle(srcDir.path('background.js'), destDir.path('background.js')),
            bundle(specEntryPointPath, destDir.path('spec.js')),
        ]);
    });
};

var bundleTask = function () {
    if (utils.getEnvName() === 'test') {
        return bundleSpecs();
    }
    return bundleApplication();
};
gulp.task('bundle', ['clean'], bundleTask);
gulp.task('bundle-watch', bundleTask);


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




var sassTask = function () {
    // return gulp.src('app/renderer/**/*.scss')//**
    return gulp.src('app/stylesheets/**/*.scss')
    .pipe(sass())
    .pipe(gulp.dest(function() {
        return destDir.path('stylesheets');//**
        // return destDir.path('renderer/');//**
    }));
};
var sassTaskDev = function () {
    return sassTask()
    .pipe(livereload());
};
gulp.task('sass', ['clean'], sassTask);
gulp.task('sass-watch', sassTaskDev);


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
    gulp.watch('app/**/*.js', ['bundle-watch']);
    gulp.watch(paths.copyFromAppDir, { cwd: 'app' }, ['copy-watch']);
    gulp.watch('app/**/*.scss', ['sass-watch']);
});


gulp.task('build', ['bundle', 'sass', 'copy', 'finalize']);
