// look for *.raw.htl and process the contents into `/src`
//      + postprocess and inline linked css 
//      + inline references svg files 
//      + 

const {
    src,
    dest,
    parallel
} = require('gulp');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');

function clean() {
    // body omitted
    return {};
}

function htl() {
    return src('./src/*.raw.htl')
        .pipe(rename(function(path){
            path.basename = path.basename.replace('.raw','')
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
    return src(['./src/pages/**/*.css', './src/shared/**/*.css'])
        .pipe(postcss())
        .pipe(dest('./htdocs/'));
}

// Avoid minifying spectrum on every build, as it rarely changes.
function spectrum() {
    return src('./src/spectrum/**/*.css')
        .pipe(postcss())
        .pipe(dest('./htdocs/spectrum/'));
}

// function svg(cb) {
//     // body omitted
//     cb();
// }

exports.spectrum = spectrum;
exports.default = exports.build = parallel(css, htl);