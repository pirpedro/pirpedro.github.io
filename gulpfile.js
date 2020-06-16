'use strict';
const gulp = require('gulp');
const del = require('del');
const debug = require('gulp-debug');
const merge2 = require('merge2');
const fs = require('fs');
const YAML = require('yaml')
var pkg = require('./package.json')
const exec = require('child_process').exec;
const log = require("fancy-log");
const path = require('path')
const $ = require('gulp-load-plugins')({
  rename: {
    'gulp-hub': 'HubRegistry',
    'gulp-image-resize': 'resize',
    'gulp-header-comment': 'comment'
  }
});
const assets_prefix = 'assets/'
const public_prefix = 'public/'
const private_prefix = 'private/'
const src_prefix = private_prefix +'img/'
const dest_prefix = public_prefix +'img/'

const _config = YAML.parse(fs.readFileSync('./_config.yml', 'utf8'))

// var hub = new $.HubRegistry(['./tasks/favicon.js']);
// gulp.registry(hub);

gulp.task('clean:private', function(){
  return del([private_prefix+'**', '!'+ private_prefix])
});

gulp.task('clean:public', function(){
  return del([public_prefix+'**', '!'+ public_prefix])
});

gulp.task('build:img:private', function(){
  return gulp.src(assets_prefix + 'img/**/*.{jpg,jpeg,png,gif}')
    .pipe($.newer(src_prefix))
    .pipe($.rename(function(path){
      if(path.extname === '.jpeg'){
        path.extname = ".jpg"
      }
    }))
    .pipe($.resize({
      width : 1920,
      height : 1080,
    }))
    .pipe($.imagemin([
      $.imagemin.gifsicle({interlaced: true}),
      $.imagemin.mozjpeg({quality: 100, progressive: true}),
      $.imagemin.optipng({optimizationLevel: 6}),
      $.imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ], {verbose: true }))
    .pipe(gulp.dest(src_prefix)) 
});

gulp.task('build:img:avatar', function() {
  return gulp.src(src_prefix+ 'avatar/**/*.{jpg,jpeg,png}')
    .pipe($.newer({dest:dest_prefix+'a',
                   map: function(pathdir){
                     return path.join(path.dirname(pathdir), path.basename(pathdir, path.extname(pathdir))+ '-bio.jpg');
                   }}))
    .pipe($.cached('responsive'))
    .pipe(
      $.responsive({
        '**/*': [
          {
            width:110,
            height:110,
            grayscale: true,
            rename: {
              suffix: '-gray-bio',
              extname: '.jpg'
            }
          },
          {
            width: 18,
            height: 18,
            grayscale: true,
            rename: {
              suffix: '-gray-bio-18w',
              extname: '.jpg'
            }
          },
          {
            width:110,
            height:110,
            rename: {
              suffix: '-bio',
              extname: '.jpg'
            }
          },
          {
            width: 18,
            height: 18,
            rename: {
              suffix: '-bio-18w',
              extname: '.jpg'
            }
          }

        ]

      },
      {
        progressive: true,
        withMetadata: false,
        skipOnEnlargement: true,
        errorOnUnusedConfig: false,
        errorOnUnusedImage: false,
        errorOnEnlargement: false
      })
    )
    .pipe(gulp.dest(dest_prefix+'a'))
});

gulp.task('build:img:logo', function() {
  return gulp.src(src_prefix+ 'logo/**/*.{jpg,jpeg,png}')
  .pipe($.newer({dest:dest_prefix+'l',
                  map: function(pathdir){
                    return path.join(path.dirname(pathdir), path.basename(pathdir, path.extname(pathdir))+ '-logo.png');
                  }}))
    .pipe($.cached('responsive'))
    .pipe(
      $.responsive({
        '**/*': [
          {
            width:88,
            height:88,
            rename: {
              suffix: '-logo',
              extname: '.png'
            }
          },
        ]
      },
      {
        progressive: true,
        withMetadata: false,
        skipOnEnlargement: true,
        errorOnUnusedConfig: false,
        errorOnUnusedImage: false,
        errorOnEnlargement: false
      })
    )
    .pipe(gulp.dest(dest_prefix+'l'));  
});

gulp.task('build:favicon', gulp.series('build:img:logo', function () {
  return gulp.src(src_prefix + "logo/**/favicon.{jpg,jpeg,png}")
    .pipe($.newer(dest_prefix +"l"))
    .pipe($.favicons({
    appName: _config.title,
    appShortName: _config.name,
    appDescription: _config.description,
    developerName: _config.author.name,
    developerURL: _config.author.site,
    background: "#020307",
    path: _config.cdn +"/img/l",
    url: _config.url,
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/?homescreen=1",
    version: 1.0,
    logging: false,
    html: "_includes/head/custom.html",
    replace: false
}))
.on("error", log)
.pipe(gulp.dest(dest_prefix +"l"));

}));

gulp.task('build:img:default', function() {
  return gulp.src([src_prefix + 'default/**/*.{jpg,jpeg,png}'])
  .pipe($.newer({dest: dest_prefix + 'p', ext: '.jpg'}))
  .pipe($.cached('responsive'))
  .pipe($.responsive({
		'**/*': [{
			width: 1920,
      height: 400,
			rename: { suffix: '-overlay' }
    },{
      width: 1200, height: 630,
      rename: { suffix: '-og' }
    },{
      width: 965,
      rename: { suffix: '-featured' }
    },{
			width: 200,
			rename: { suffix: '-teaser' }  
		},{
      width: 640
    }],
	}, {
    extname: '.jpg',
		quality: 80,
		progressive: true,
		withMetadata: false,
		skipOnEnlargement: false,
		errorOnUnusedConfig: false,
		errorOnUnusedImage: false,
		errorOnEnlargement: false
	}))
	.pipe(gulp.dest(dest_prefix + 'p'))
});

gulp.task('build:img:site', gulp.parallel('build:img:default', function() {
  return gulp.src(src_prefix + 'page/**/*.{jpg,jpeg,png,gif}')
  .pipe($.newer(dest_prefix+'page'))
  .pipe($.imagemin([
    $.imagemin.gifsicle({interlaced: true}),
    $.imagemin.mozjpeg({quality: 80, progressive: true}),
    $.imagemin.optipng({optimizationLevel: 7}),
    $.imagemin.svgo({
      plugins: [
        {removeViewBox: true},
        {cleanupIDs: false}
      ]
    })
  ], {verbose: true }))
  .pipe(gulp.dest(dest_prefix+'page')) 
}));

gulp.task('build:img:header', function() {
  return gulp.src([src_prefix + 'post/**/*-header.{jpg,jpeg,png}'])
  .pipe($.newer({dest: dest_prefix + 'p', ext:".jpg"}))
  .pipe($.cached('responsive'))
  .pipe($.responsive({
		'**/*': [{
			width: 1920,
      height: 400,
      rename: { suffix: '-overlay' }
    },{
      width: 1200, height: 630,
      rename: { suffix: '-og' }
    },{
      width: 965,
      rename: { suffix: '-featured' }
    },{
			width: 200,
			rename: { suffix: '-teaser' }  
		},{
      width: 640
    }]
	}, {
    format: 'jpg',
		quality: 80,
		progressive: true,
		withMetadata: false,
		skipOnEnlargement: true,
		errorOnUnusedConfig: false,
		errorOnUnusedImage: false,
		errorOnEnlargement: false
	}))
	.pipe(gulp.dest(dest_prefix + 'p'))
});

gulp.task('build:img:posts', gulp.parallel('build:img:header',function() {
  return gulp.src([src_prefix + 'post/**/*.{jpg,jpeg,png}',
                      '!'+src_prefix + 'post/**/*-header.{jpg,jpeg,png}'])
  .pipe($.newer(dest_prefix + 'p'))
  .pipe($.cached('responsive'))
  .pipe($.responsive({
		'**/*': [{
			width: 640,
			rename: { suffix: '-small' }
    },{
			width: 916,
    },{
			width: 1030,
			rename: { suffix: '-large' }  
		}],
	}, {
    format: 'jpg',
		quality: 80,
		progressive: true,
		withMetadata: false,
		skipOnEnlargement: false,
		errorOnUnusedConfig: false,
		errorOnUnusedImage: false,
		errorOnEnlargement: false
	}))
	.pipe(gulp.dest(dest_prefix + 'p'))
}));

gulp.task('build:img', gulp.series('build:img:private',gulp.parallel('build:img:avatar', 'build:img:logo', 'build:img:site', 'build:img:posts')));

gulp.task('build:js', function(){
  return gulp.src([assets_prefix+'js/vendor/**/*.js',
                    assets_prefix+'js/plugins/*.js',
                   assets_prefix+'js/_main.js'])
  .pipe($.concat('tmp.js'))
  // .pipe(gulp.dest(assets_prefix+'js'))
  .pipe($.rename('main.min.js'))
  .pipe($.uglify())
  .pipe($.comment(`
    Theme <%=pkg.version %> by <%= pkg.author %>
    Copyright 2019-<%= moment().format('YYYY') %> <%= pkg.author %> - <%= pkg.homepage %> | @pirpedro
    Licensed under <%= pkg.license %> 
  `))
  .pipe(gulp.dest(assets_prefix+'js'));
});

gulp.task('watch:img', function(){
  return gulp.watch(assets_prefix+'img/**/*', gulp.series('build:img'));
});

gulp.task('aws:sync', function(cb){
  exec('aws s3 sync public/ s3://psrandom --profile wasabi && exit', function(err, stdout, stderr){
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

gulp.task('default',gulp.series(['watch:img', 'aws:sync']));

