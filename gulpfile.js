'use strict'

const gulp = require('gulp'),
      concat = require('gulp-concat'),
      rename = require('gulp-rename'),
      csso = require('gulp-csso'),
      autoprefixer = require('gulp-autoprefixer'),
      sass = require('gulp-sass'),
      uncss = require('gulp-uncss'),
      rev = require('gulp-rev-append'),
      useref = require('gulp-useref'),
      gulpif = require('gulp-if'),
      uglify = require('gulp-uglify'),
      clean = require('gulp-clean'),
      gulpSequence = require('gulp-sequence'),
      csscomb = require('gulp-csscomb'),
      browserSync = require('browser-sync').create(),
      sftp = require('gulp-sftp'),
      mainBowerFiles = require('main-bower-files'),
      spritesmith = require('gulp.spritesmith'),
      imagemin = require('gulp-imagemin'),
      pngquant = require('imagemin-pngquant'),
      jade = require('gulp-jade'),
      postcss = require("gulp-postcss"),
      cssnext = require("postcss-cssnext"),
      svgo = require("postcss-svgo"),
      inlineSVG = require("postcss-inline-svg");

// Наблюдатель за изменениями в scss и html
gulp.task('start-watch', ['serve']);

gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./src"
    });

    gulp.watch("src/**/*.scss", ['sass']);
    gulp.watch("src/**/*.jade", ['jade']);
    gulp.watch("src/images/", ['move-img']);
    gulp.watch("src/*.html").on('change', browserSync.reload);
});

gulp.task('sass', function() {
    return gulp.src("src/scss/main.scss")
        .pipe(sass())
        .pipe(autoprefixer({ browsers: ['last 2 versions', '> 1%', 'IE 7']}))
        .pipe(csscomb())
        .pipe(uncss({html: ['src/*.html']}))
        .pipe(gulp.dest("src/css"))
        .pipe(browserSync.stream());
});

gulp.task('jade', function () {
  return gulp.src('src/**/*.jade')
    .pipe(jade({
      pretty: true
    }))
    .pipe(gulp.dest('src/'))
});

// svg в стили
gulp.task("svg-background", function() {
  return gulp.src("src/vendors/background.css")
    .pipe(postcss([
      cssnext,
      inlineSVG,
      svgo
    ]))
    .pipe(gulp.dest("src/vendors/dist"));
});

// Объединяет и минифицирует css и js в html
gulp.task('html-useref', function () {
    return gulp.src('src/*.html')
        .pipe(useref())
        .pipe(gulpif('*.css', csso()))
        .pipe(gulpif('*.js', uglify()))
        .pipe(gulp.dest('build/'));
});

gulp.task('clean', function () {
    return gulp.src('build/', {read: false})
        .pipe(clean());
});

gulp.task('main-js', function() {
    return gulp.src(mainBowerFiles('**/*.js'))
        .pipe(gulp.dest('src/vendors/js'))
});

gulp.task('main-css', function() {
    return gulp.src(mainBowerFiles('**/*.css'))
        .pipe(gulp.dest('src/vendors/css'))
});

// Переносит файлы из bower в src каталог vendor
gulp.task('mvbower', function (cb) {
  gulpSequence('main-css', 'main-js', cb);
});

// Сшить png в спрайт
gulp.task('sprite-png', function () {
  var spriteData = gulp.src('src/images/sprite/*.png').pipe(spritesmith({
    retinaSrcFilter: ['src/images/sprite/*@2x.png'],
    imgName: 'sprite.png',
    retinaImgName: 'sprite@2x.png',
    cssName: 'sprite.css'
  }))
  .pipe(clean())
  return spriteData.pipe(gulp.dest('src/images/'));
});

// Оптимизировать изображения
gulp.task('img-optimize', () => {
  return gulp.src('src/images/*.{jpg,jpeg,gif,png,svg}')
    .pipe(imagemin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        use: [pngquant()]
    }))
    .pipe(gulp.dest('build/images/'));
});

// Build
gulp.task('build', function (cb) {
  gulpSequence('clean', 'html-useref', 'img-optimize', cb);
});

// Отправка билда на сервер
gulp.task('send-ftp', function () {
  return gulp.src('build/*')
    .pipe(sftp({
      host: 'website.com',
      user: 'johndoe',
      pass: '1234',
      remotePath:'/'
    }));
});
