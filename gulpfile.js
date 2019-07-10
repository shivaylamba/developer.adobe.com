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
const { JSDOM } = require('jsdom');
const through = require('through2');
const rename = require('gulp-rename');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');
const fs = require('fs');
// eslint-disable-next-line import/no-unresolved
const browserSync = require('browser-sync').create();

const PATHS = {
  htl: './src/*.raw.htl',
  css: ['./src/**/*.css', '!./src/spectrum/**'],
  images: ['./src/**/*.jpg', './src/**/*.png', './src/**/*.svg'],
  spectrum: './src/spectrum/**/*.css',
  helix: ['./.hlx/build'],
};

const WATCHERS = {
  htl: watch(PATHS.htl),
  css: watch(PATHS.css),
  images: watch(PATHS.images),
  helix: watch(PATHS.helix),
};

const svgSrc = [
  new JSDOM(fs.readFileSync('./src/spectrum/spectrum-icons.svg', 'utf8')),
  new JSDOM(fs.readFileSync('./src/spectrum/spectrum-css-icons.svg', 'utf8')),
];

// function clean() {
//   // body omitted
//   return {};
// }

function findIconInSource(src, iconID) {
  let iconNode = null;
  const iconSources = Object.values(src);
  for (let i = 0; i < iconSources.length; i += 1) {
    iconNode = iconSources[i].window.document.querySelector(iconID);
    if (iconNode) {
      break;
    }
  }
  return iconNode;
}

function inlineSpectrumIcons(chunk, enc, cb) {
  const dom = new JSDOM(chunk.contents.toString(enc));
  console.log(dom);
  const iconReferences = Array.from(dom.window.document.querySelectorAll('.spectrum-Icon use'));
  const iconIDs = Array.from(new Set(iconReferences.map(el => el.getAttribute('xlink:href'))));
  if (iconReferences && iconReferences.length > 0) {
    console.log(`   > Found ${iconIDs.length} Spectrum Icons in ${chunk.path}`);
    const iconContainer = dom.window.document.createElement('svg');
    iconContainer.style.display = 'none';
    dom.window.document.body.appendChild(iconContainer);
    for (let i = 0; i < iconIDs.length; i += 1) {
      const icon = findIconInSource(svgSrc, iconIDs[i]);
      if (icon) {
        iconContainer.appendChild(icon);
      }
    }
    chunk.contents = Buffer.from(dom.serialize());
  }
  cb(null, chunk);
}

function renameFile(path) {
  // eslint-disable-next-line no-param-reassign
  path.basename = path.basename.replace('.raw', '');
}

function htl() {
  return src(PATHS.htl)
    .pipe(rename(renameFile))
    .pipe(through.obj(inlineSpectrumIcons))
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
function spectrumCSS() {
  return src(PATHS.spectrum)
    .pipe(postcss())
    .pipe(dest('./htdocs/spectrum/'));
}

function injectCSS() {
  return src('./htdocs/**/*.css')
    .pipe(browserSync.stream());
}

function develop() {
  WATCHERS.css.on('all', css);
  WATCHERS.htl.on('all', htl);
  WATCHERS.images.on('all', images);

  browserSync.init({
    proxy: 'localhost:3000',
  });

  watch('./htdocs/**/*.css').on('all', injectCSS);
  WATCHERS.helix.on('all', browserSync.reload);
}

exports.build = parallel(css, htl, images, spectrumCSS);
exports.htl = htl;
exports.develop = develop;
exports.default = exports.build;
