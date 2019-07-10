// look for *.raw.htl and process the contents into `/src`
//      + postprocess and inline linked css 
//      + inline references svg files 
//      + 

const {
    src,
    dest,
    parallel,
    watch
} = require('gulp');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');

const PATHS = {
    htl: './src/*.raw.htl',
    css: ['./src/pages/**/*.css', './src/shared/**/*.css'],
    images: ['./src/**/*.jpg', './src/**/*.png', './src/**/*.svg'],
    spectrum: './src/spectrum/**/*.css'
}

const WATCHERS = {
    htl: watch(PATHS.htl),
    css: watch(PATHS.css),
    images: watch(PATHS.images)
}

function clean() {
    // body omitted
    return {};
}

function htl() {
    return src(PATHS.htl)
        .pipe(rename(function (path) {
            path.basename = path.basename.replace('.raw', '')
        }))
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true
        }))
        .pipe(dest('./src/'));
}

function css() {
    console.log('hey')
    return src(PATHS.css)
        .pipe(postcss())
        .pipe(dest('./htdocs/'));
}

function images() {
    return src(PATHS.images)
        .pipe(imagemin())
        .pipe(dest('./htdocs/'));
}

// Avoid minifying spectrum on every build, as it rarely changes.
function spectrum() {
    return src(PATHS.spectrum)
        .pipe(postcss())
        .pipe(dest('./htdocs/spectrum/'));
}

// function svg(cb) {
//     // body omitted
//     cb();
// }

exports.default = exports.build = parallel(css, htl, images, spectrum);
exports.develop = function () {
    console.log('what');
    WATCHERS.css.on('all', css);
    WATCHERS.htl.on('all', htl);
    WATCHERS.images.on('all', images);
}