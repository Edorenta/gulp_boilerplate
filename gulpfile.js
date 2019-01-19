'use strict';

var del = require('del');
var pump = require('pump');
var gulp = require('gulp');
var runSequence = require('run-sequence');
var babel = require('gulp-babel'); // could use gulp-babel-minify instead
var sass = require('gulp-sass');
var csso = require('gulp-csso');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var cache = require('gulp-cache');
var size = require('gulp-filesize');
// var autoprefixer = require('gulp-autoprefixer');
var livereload = require('gulp-livereload');

const AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

gulp.task('min:php:templates', function(cb){
	pump([
  		gulp.src('src/php/page-templates/*.+(php|html)'), // can do list ['src/*.html','src/*.php'])
      	htmlmin({
        	collapseWhitespace: true,
          removeComments: true,
        	ignoreCustomFragments: [ /<%[\s\S]*?%>/, /<\?[=|php]?[\s\S]*?\?>/ ]
      	}),
    	gulp.dest('page-templates'),
      size()
    ], cb);
});

gulp.task('min:php', function(cb){
  pump([
      gulp.src('src/php/*.+(php|html)'), // can do list ['src/*.html','src/*.php'])
        htmlmin({
          collapseWhitespace: true,
          removeComments: true,
          ignoreCustomFragments: [ /<%[\s\S]*?%>/, /<\?[=|php]?[\s\S]*?\?>/ ]
        }),
      gulp.dest('dist/php'),
      size()
    ], cb);
});

gulp.task('min:css', function(cb){
	pump([
		gulp.src('src/sass/styles.scss'), // include all sass recursively??
			sass({ // Compile SASS files
			outputStyle: 'nested',
			precision: 10,
			includePaths: ['.'],
			onError: console.error.bind(console, 'Sass error:')
		}),
		// .pipe(autoprefixer({browsers: AUTOPREFIXER_BROWSERS})) // Auto-prefix css styles for cross browser compatibility
		csso({outputStyle: 'compressed'}).on('error', sass.logError), // Minify the CSS compiled file
		gulp.dest('dist/css'),
    size()
	], cb);
});

gulp.task('min:js', function(cb) {
	pump([
  		gulp.src('src/js/**/*.js'),
      babel({
        presets: ['@babel/env'] //make backward compatible (automatic preset-env)
      }),
      uglify(), // Minify the file
    	gulp.dest('dist/js'),
      size()
    ], cb);
});

gulp.task('min:img', function(cb){
	pump([
		gulp.src('src/assets/img/**/*.+(png|jpg|gif|svg)'),
		// imagemin(), // very slow >> need to be cached not to run every time
    cache(imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    })),
		gulp.dest('dist/assets/img'),
    size()
	], cb);
});

gulp.task('mv:fonts', function (cb) {
	pump([
    	gulp.src('src/assets/fonts/*'),
      gulp.dest('dist/assets/fonts'),
      size()
  ], cb);
});

gulp.task('watch', function(){
    livereload.listen();
    gulp.watch('src/sass/**/*.scss', gulp.series('min:css'));
    gulp.watch('src/js/**/*.js', gulp.series('min:js'));
    gulp.watch('src/php/page-templates/*.php', gulp.series('min:php:templates'));
    gulp.watch('src/php/*.php', gulp.series('min:php'));
    gulp.watch('src/assets/fonts/*', gulp.series('mv:fonts'));
    gulp.watch('src/assets/img/*', gulp.series('min:img'));
    gulp.watch(['dist/**/*.+(php|html|js|css|png|jpg|gif|svg|xml|json|csv)', 'page-templates/*.+(php|html)'], function (files){
        livereload.changed(files)
    });
});

gulp.task('clean:dist', () => del(['dist']));
gulp.task('clean:assets', () => del(['assets']));
gulp.task('clean:js', () => del(['dist/js']));
gulp.task('clean:css', () => del(['dist/css']));
gulp.task('clean:html', () => del(['dist/php']));
gulp.task('clean:templates', () => del(['page-templates']));
gulp.task('clean:all', gulp.series('clean:dist','clean:templates'));// can use gulp.parallel

gulp.task('build:dev',
  gulp.series(
    'clean:all',
    'min:php:templates',
    'min:php',
    'min:css',
    'min:js',
    'min:img',
    'mv:fonts'
  )
);

gulp.task('default', gulp.series('build:dev', 'watch'));
