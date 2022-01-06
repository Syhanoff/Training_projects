const {src, dest, watch, parallel, series} = require('gulp');
const browserSync = require('browser-sync').create();
const include = require('gulp-file-include');
const htmlmin = require('gulp-htmlmin');
const webpHtml = require('gulp-webp-html-fix');
const gulpif = require('gulp-if');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass')(require('sass'));
const notify = require("gulp-notify");
const rename = require("gulp-rename");
const autoprefixer = require('gulp-autoprefixer');
const group = require('gulp-group-css-media-queries');
const webpCSS = require("gulp-webpcss");
const cleanCSS = require('gulp-clean-css');
const ttf2woff = require('gulp-ttf2woff');
const ttf2woff2 = require('gulp-ttf2woff2');
const fonter = require('gulp-fonter');
const fs = require('fs');
const changed = require('gulp-changed');
const tiny = require('gulp-tinypng-compress');
const imagemin = require('gulp-imagemin');
const webp = require('imagemin-webp');
const svgSprite = require('gulp-svg-sprite');
const realFavicon = require ('gulp-real-favicon');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const concat = require('gulp-concat');
const del = require('del');

const app = 'src/';
const dist = 'dist/';
const configPath = {
   app : {
         html : app + '*.html',
         style : [app + 'scss/**/*.+(scss|sass)', '!' + app + 'scss/libs/*.*', '!' + app + 'scss/libs.scss'],
         styleLibs : app + 'scss/libs.scss',
         fonts : app + 'fonts/*.ttf',
         styleFonts : app + 'scss/base/_fonts.scss',
         fontsOld : app + 'fonts/*.eot',
         img : [app + 'img/**/*.+(jpeg|jpg|png|svg|gif)', '!' + app + 'img/svg/*.svg'],
         imgWebp : [app + 'img/**/*.+(jpeg|jpg|png|gif)', '!' + app + 'img/svg/*.svg'],
         svg : app + 'img/svg/*.svg',
         fav : app + 'assets/favicon/*.png',
         favCode : app + 'parts/favicon.html',
         js : [app + 'js/**/*.js', '!' + app + 'js/libs/*.js'],
         jsLibs : app + 'js/libs/*.js',
         assets : [app + 'assets/**/*.*','!' + app + 'assets/favicon/*.*']
   },
   dist : {
         html : dist,
         style : dist + 'css/',
         fonts : dist + 'fonts/',
         fontsOld : app + 'fonts/',
         img : dist + 'img/',
         svg : dist + 'img/svg/',
         fav: app + 'assets/favicon/',
         favCode : app + 'parts/',
         js : dist + 'js/',
         assets : dist
   },
   watch : {
         html : app + '**/*.html',
         style : app + 'scss/**/*.+(scss|sass)',
         fonts : app + 'fonts/*.ttf',
         fontsOld : app + 'fonts/*.eot',
         img : [app + 'img/**/*.+(jpeg|jpg|png|svg|gif)', "!" + app + 'img/svg/*.svg'], 
         imgWebp : [app + 'img/**/*.+(jpeg|jpg|png|gif)', '!' + app + 'img/svg/*.svg'],
         svg : app + 'img/svg/*.svg',
         js : app + 'js/**/*.js',
         assets : [app + 'assets/**/*.*','!' + app + 'assets/favicon/*.*'],
   }
}

function webServer () {
   browserSync.init({
      server: {
         baseDir: "dist"
         },
         notify: false,
   })
   watch((configPath.watch.html), series(htmlTask)).on('change', browserSync.reload)
   watch((configPath.watch.style), series(stylesTask))
   watch((configPath.watch.fonts), series(fontsTask)).on('change', browserSync.reload)
   watch((configPath.watch.fontsOld), series(fontsOldTask)).on('change', browserSync.reload)
   watch((configPath.dist.fonts), series(fontStyleTask)).on('change', browserSync.reload)
   watch((configPath.watch.img), series(imgTask)).on('change', browserSync.reload)
   watch((configPath.watch.imgWebp), series(imgTask)).on('change', browserSync.reload)
   watch((configPath.watch.svg), series(svgTask)).on('change', browserSync.reload)
   watch((configPath.watch.js), series(scriptsTask)).on('change', browserSync.reload)
   watch((configPath.watch.assets), series(assetsTask)).on('change', browserSync.reload)
}

let noBuild = false;
function toBuild (done) {
   noBuild = true;
   done();
};

function htmlTask () {
   return src(configPath.app.html)
      .pipe(include())
      .pipe(webpHtml())
      .pipe(gulpif(noBuild, htmlmin({
         collapseWhitespace: true,
         removeComments: true
      })))
      .pipe(dest(configPath.dist.html))
}

function stylesTask () {
      src(configPath.app.styleLibs)
      .pipe(sass.sync({outputStyle: 'expanded'}).on('error', notify.onError()))
      .pipe(rename({
         suffix: ".min"
      }))
      .pipe(gulpif(noBuild, cleanCSS({
         level: 2
      })))
      .pipe(dest(configPath.dist.style))
   return src(configPath.app.style)
      .pipe(gulpif(!noBuild, sourcemaps.init()))
      .pipe(sass.sync({outputStyle: 'expanded'}).on('error', notify.onError()))
      .pipe(rename({
         basename: "style",
         prefix: "",
         suffix: ".min"
      }))
      .pipe(autoprefixer({	
         cascade: false,
         grid: true
      }))
      .pipe(webpCSS({
         webpClass: '',
         noWebpClass: '.no-webp'
      }))
      .pipe(group())
      .pipe(gulpif(noBuild, cleanCSS({
			level: 2,
         compatibility: 'ie8'
		})))
      .pipe(gulpif(!noBuild, sourcemaps.write('.')))
      .pipe(dest(configPath.dist.style))
      .pipe(browserSync.stream());
}

function fontsTask () {
   src(configPath.app.fonts)
		.pipe(ttf2woff())
		.pipe(dest(configPath.dist.fonts))
	return src(configPath.app.fonts)
		.pipe(ttf2woff2())
		.pipe(dest(configPath.dist.fonts))
}

function fontsOldTask () {
   return src(configPath.app.fontsOld)
      .pipe(fonter({
         formats: ['ttf']
      }))
      .pipe(changed(configPath.dist.fontsOld))
      .pipe(dest(configPath.dist.fontsOld))
}

function checkWeight (fontname) {
   let weight = 400;
   switch (true) {
      case/Thin/.test(fontname):
         weight = 100;
         break;
      case/100/.test(fontname):
         weight = 100;
         break;
      case/ExtraLight/.test(fontname):
         weight = 200;
         break;
      case/200/.test(fontname):
         weight = 200;
         break;
      case/Light/.test(fontname):
         weight = 300;
         break;
      case/300/.test(fontname):
         weight = 300;
         break;
      case/Regular/.test(fontname):
         weight = 400;
         break;
      case/400/.test(fontname):
         weight = 400;
         break;
      case/Medium/.test(fontname):
         weight = 500;
         break;
      case/500/.test(fontname):
         weight = 500;
         break;
      case/SemiBold/.test(fontname):
         weight = 600;
         break;
      case/600/.test(fontname):
         weight = 600;
         break;
      case/Bold/.test(fontname):
         weight = 700;
         break;
      case/700/.test(fontname):
         weight = 700;
         break;
      case/ExtraBold/.test(fontname):
         weight = 800;
         break;
      case/800/.test(fontname):
         weight = 800;
         break;
      case/Black/.test(fontname):
         weight = 900;
         break;
      case/900/.test(fontname):
         weight = 900;
         break;
      default:
         weight = 400;
   }
   return weight;
}

function checkStyle (fontname) {
   let style = 'normal';
   switch (true) {
      case/italic/.test(fontname):
         style = 'italic';
         break;
      default:
         style = 'normal';
   }
   return style;
}

function cb () {}

function fontStyleTask (done) {
	let file_content = fs.readFileSync(configPath.app.styleFonts);
	fs.writeFile((configPath.app.styleFonts), '', cb);
	fs.readdir((configPath.dist.fonts), function (err, items) {
		if (items) {
			let c_fontname;
			for (var i = 0; i < items.length; i++) {
				let fontname = items[i].split('.');
				fontname = fontname[0];
            let font = fontname.split('-')[0];
            let weight = checkWeight(fontname);
            let style = checkStyle(fontname);
				if (c_fontname != fontname) {
					fs.appendFile((configPath.app.styleFonts), '@include font-face("' + font + '", "' + fontname + '", "' + weight + '", "' + style + '");\r\n', cb);
				}
				c_fontname = fontname;
			}
		}
	})
	done();
}

function imgTask () {
	return src(configPath.app.imgWebp)
      .pipe(changed(configPath.dist.img))
      .pipe(imagemin([webp({ 
         quality: 70,
      })])) 
      .pipe(rename({
         extname: '.webp'
      }))
      .pipe(dest(configPath.dist.img))
      .pipe(src(configPath.app.img))
      .pipe(gulpif(noBuild, tiny({
         key: '.',
         sigFile: 'images/.tinypng-sigs',
         parallel: true,
         parallelMax: 50,
         log: true,
      })))
      .pipe(dest(configPath.dist.img))
}

function svgTask () {
	return src(configPath.app.svg)
		.pipe(svgSprite({
			mode: {
				stack: {
					sprite: "../sprite.svg"
				}
			}
		}))
		.pipe(dest(configPath.dist.svg))
}

var FAVICON_DATA_FILE = 'faviconData.json';

function nameFavicon () {
   return src(configPath.app.fav)
   .pipe(rename({
      basename: "favicon"
   }))
   .pipe(dest(configPath.dist.fav))
}

function genFavicon (done) {
   realFavicon.generateFavicon({
      masterPicture: './src/assets/favicon/favicon.png',
      dest: './dist/favicon',
      iconsPath: './favicon/',
      design: {
         ios: {
            pictureAspect: 'noChange',
            assets: {
               ios6AndPriorIcons: false,
               ios7AndLaterIcons: false,
               precomposedIcons: false,
               declareOnlyDefaultIcon: true
            } 
         },
         desktopBrowser: {
            design: 'raw'
         },
         windows: {
            pictureAspect: 'noChange',
            backgroundColor: '#ffffff',
            onConflict: 'override',
            assets: {
               windows80Ie10Tile: false,
               windows10Ie11EdgeTiles: {
                  small: false,
                  medium: true,
                  big: false,
                  rectangle: false
               }
            }
         },
         androidChrome: {
            pictureAspect: 'noChange',
            themeColor: '#ffffff',
            manifest: {
               display: 'standalone',
               orientation: 'notSet',
               onConflict: 'override',
               declared: true
            },
            assets: {
               legacyIcon: false,
               lowResolutionIcons: false
            }
         },
         safariPinnedTab: {
            pictureAspect: 'silhouette',
            themeColor: '#ffffff'
         }
      },
      settings: {
         scalingAlgorithm: 'Mitchell',
         errorOnImageTooSmall: false,
         readmeFile: false,
         htmlCodeFile: false,
         usePathAsIs: false
      },
      markupFile: FAVICON_DATA_FILE
   })
   done();
}

function insertFavicon (done) {
      src(configPath.app.favCode)
      .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
      .pipe(dest(configPath.dist.favCode))
   done();
}

function scriptsTask () {
   src(configPath.app.jsLibs)
   .pipe(concat('libs.min.js'))
   .pipe(gulpif(noBuild, uglify().on("error", notify.onError())))
   .pipe(dest(configPath.dist.js))
return src(configPath.app.js)
   .pipe(gulpif(!noBuild, sourcemaps.init()))
   .pipe(babel({
      presets: ['@babel/env']
   }))
   .pipe(concat('main.min.js'))
   .pipe(gulpif(noBuild, uglify().on("error", notify.onError())))
   .pipe(gulpif(!noBuild, sourcemaps.write('.')))
   .pipe(dest(configPath.dist.js))
}

function assetsTask () {
	return src(configPath.app.assets)
		.pipe(dest(configPath.dist.assets))
}

function clear () {
   return del(dist)
}

exports.clear = clear
exports.newFavicon = series(nameFavicon, genFavicon, insertFavicon)
exports.default = series(clear, parallel(htmlTask, imgTask, svgTask, fontsOldTask, fontsTask, assetsTask, scriptsTask), fontStyleTask, stylesTask, webServer);
exports.build = series(toBuild, clear, parallel(htmlTask, imgTask, svgTask, fontsOldTask, fontsTask, assetsTask, scriptsTask), fontStyleTask, stylesTask);