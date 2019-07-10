/*
 * Copyright 2018 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const {
  src,
  dest,
  parallel,
  watch,
} = require('gulp');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');

const PATHS = {
  htl: './src/*.raw.htl',
  css: ['./src/pages/**/*.css', './src/shared/**/*.css'],
  images: ['./src/**/*.jpg', './src/**/*.png', './src/**/*.svg'],
  spectrum: './src/spectrum/**/*.css',
};

const WATCHERS = {
  htl: watch(PATHS.htl),
  css: watch(PATHS.css),
  images: watch(PATHS.images),
};

// function clean() {
//   // body omitted
//   return {};
// }

function htl() {
  function renameFile(path) {
    // eslint-disable-next-line no-param-reassign
    path.basename = path.basename.replace('.raw', '');
  }
  return src(PATHS.htl)
    .pipe(rename(renameFile))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    }))
    .pipe(dest('./src/'));
}

function css() {
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

function develop() {
  WATCHERS.css.on('all', css);
  WATCHERS.htl.on('all', htl);
  WATCHERS.images.on('all', images);
}

// function svg(cb) {
//     // body omitted
//     cb();
// }

exports.build = parallel(css, htl, images, spectrum);
exports.develop = develop;
exports.default = exports.build;
