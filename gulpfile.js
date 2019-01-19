'use strict';

var del = require('del');
var pump = require('pump');
var gulp = require('gulp');
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

const _e = { // filesystem tasks extensions hierarchy >> regex style
  _scripts : "js",
  _tpl : "html|php",
  _img : "png|jpg|gif|svg",
  _styles : "sass|scss|sass",
  _dt : "xml|json|txt|csv|dat",
  _fonts : "woff|woff2|otf|ttf|eot",
  scripts() { return ('.+(' + this._scripts + ')'); },
  tpl() { return ('.+(' + this._tpl + ')'); },
  img() { return ('.+(' + this._img + ')'); },
  styles() { return ('.+(' + this._styles + ')'); },
  dt() { return ('.+(' + this._dt + ')'); },
  fonts() { return ('.+(' + this._fonts + ')'); },
  assets() { return ('.+(' + this._img + '|' + this._fonts + '|' + this._dt + ')'); },
  all() {
    for (let i in this) {
      if (i[0] == "_" && this.hasOwnProperty(i) && i != "_all" && i != "_assets") {
        this._all = this._all ? this._all += "|" + this[i] : this[i];
      }
    }
    return ('.+(' + this._all + ')');
  }
}

gulp.task('min:php:templates', function(cb){
	pump([
  		gulp.src('src/php/page-templates/*' + _e.tpl()), // can do list ['src/*.html','src/*' + _e.tpl()])
      	htmlmin({
        	collapseWhitespace: true,
          removeComments: true,
        	ignoreCustomFragments: [ /<%[\s\S]*?%>/, /<\?[=|php]?[\s\S]*?\?>/ ]
      	}),
    	gulp.dest('page-templates'),
      size()
    ], cb);
});

gulp.task('min:php:index', function(cb){
  pump([
      gulp.src('src/php/index' + _e.tpl()), // can do list ['src/*.html','src/*' + _e.tpl()])
        htmlmin({
          collapseWhitespace: true,
          removeComments: true,
          ignoreCustomFragments: [ /<%[\s\S]*?%>/, /<\?[=|php]?[\s\S]*?\?>/ ]
        }),
      gulp.dest('./'),
      size()
    ], cb);
});

gulp.task('min:php:partials', function(cb){
  pump([
      gulp.src('src/php/partials/*' + _e.tpl()), // can do list ['src/*.html','src/*' + _e.tpl()])
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
		gulp.src('src/sass/styles' + _e.styles()), // include all sass recursively??
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
  		gulp.src('src/js/**/*' + _e.scripts()),
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
		gulp.src('src/assets/img/**/*' + _e.img()),
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
    	gulp.src('src/assets/fonts/*' + _e.fonts()),
      gulp.dest('dist/assets/fonts'),
      size()
  ], cb);
});

gulp.task('mv:data', function (cb) {
  pump([
      gulp.src('src/assets/data/*' + _e.dt()),
      gulp.dest('dist/assets/data'),
      size()
  ], cb);
});

gulp.task('watch:php', function(){
    livereload.listen();
    gulp.watch('src/php/page-templates/*' + _e.tpl(), gulp.series('min:php:templates'));
    gulp.watch('src/php/partials/*' + _e.tpl(), gulp.series('min:php:partials'));
    gulp.watch('src/php/index' + _e.tpl(), gulp.series('min:php:index'));
    gulp.watch(['dist/**/*' + _e.tpl(), 'page-templates/*' + _e.tpl()], function (files){
        livereload.changed(files)
    });
});

gulp.task('watch:assets', function(){
    livereload.listen();
    gulp.watch('src/assets/fonts/*' + _e.fonts(), gulp.series('mv:fonts'));
    gulp.watch('src/assets/img/*' + _e.img(), gulp.series('min:img'));
    gulp.watch('src/assets/data/*' + _e.data(), gulp.series('mv:data'));
    gulp.watch(['dist/**/*' + _e.assets()], function (files){
        livereload.changed(files)
    });
});

gulp.task('watch:php', function(){
    livereload.listen();
    gulp.watch('src/php/page-templates/*' + _e.tpl(), gulp.series('min:php:templates'));
    gulp.watch('src/php/partials/*' + _e.tpl(), gulp.series('min:php:partials'));
    gulp.watch('src/php/index' + _e.tpl(), gulp.series('min:php:index'));
    gulp.watch(['dist/**/*' + _e.tpl(), 'page-templates/*' + _e.tpl()], function (files){
        livereload.changed(files)
    });
});

gulp.task('watch:all', function(){
    livereload.listen();
    gulp.watch('src/sass/**/*' + _e.styles(), gulp.series('min:css'));
    gulp.watch('src/js/**/*' + _e.scripts(), gulp.series('min:js'));
    gulp.watch('src/php/page-templates/*' + _e.tpl(), gulp.series('min:php:templates'));
    gulp.watch('src/php/partials/*' + _e.tpl(), gulp.series('min:php:partials'));
    gulp.watch('src/php/index' + _e.tpl(), gulp.series('min:php:index'));
    gulp.watch('src/assets/fonts/*', gulp.series('mv:fonts'));
    gulp.watch('src/assets/img/*', gulp.series('min:img'));
    gulp.watch(['dist/**/*' + _e.all(), 'page-templates/*' + _e.tpl()], function (files){
        livereload.changed(files)
    });
});

gulp.task('clean:dist', () => del(['dist']));
gulp.task('clean:assets', () => del(['assets']));
gulp.task('clean:js', () => del(['dist/js']));
gulp.task('clean:css', () => del(['dist/css']));
gulp.task('clean:html', () => del(['dist/php']));
gulp.task('clean:templates', () => del(['page-templates']));
gulp.task('clean:all', gulp.parallel('clean:dist','clean:templates'));// can use gulp.parallel

gulp.task('build:dev',
  gulp.series(
    'clean:all',
    'min:php:templates',
    'min:php:partials',
    'min:php:index',
    'min:css', // templates / partials / styles.css all in one
    'min:js',
    'min:img',
    'mv:data',
    'mv:fonts'
  )
);

gulp.task('default', gulp.series('build:dev', 'watch:all'));
