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
  series,
  watch,
} = require('gulp');
const {
  JSDOM,
} = require('jsdom');
const he = require('he');
const del = require('del');
const through = require('through2');
const htmlmin = require('gulp-htmlmin');
const postcss = require('gulp-postcss');
const imagemin = require('gulp-imagemin');
const fs = require('fs');
// eslint-disable-next-line import/no-unresolved
const browserSync = require('browser-sync').create();

const HELIX_SRC = './src';
const PATHS = {
  css: ['./src-actual/**/*.css', '!./src-actual/spectrum/**/*.css'],
  images: ['./src-actual/**/*.jpg', './src-actual/**/*.png', './src-actual/**/*.svg'],
  spectrum: ['./src-actual/spectrum/**/*.css'],
  vendor: ['./src-actual/vendor/**/*.*'],
  helix: {
    htl: ['./src-actual/helix/**/*.htl'],
    nonHtl: ['./src-actual/helix/**/*.*', '!./src-actual/helix/**/*.htl'],
    build: './.hlx/build',
  },
};

const svgSrc = [
  new JSDOM(fs.readFileSync('./src-actual/spectrum/spectrum-icons.svg', 'utf8')),
  new JSDOM(fs.readFileSync('./src-actual/spectrum/spectrum-css-icons.svg', 'utf8')),
];

function clean(cb) {
  del.sync(['./src', './htdocs']);
  cb();
}

function vendor() {
  return src(PATHS.vendor)
    .pipe(dest('./htdocs/vendor'));
}

function findIconInSource(iconSrc, iconID) {
  let iconNode = null;
  const iconSources = Object.values(iconSrc);
  for (let i = 0; i < iconSources.length; i += 1) {
    iconNode = iconSources[i].window.document.querySelector(iconID);
    if (iconNode) {
      break;
    }
  }
  return iconNode;
}

function inlineSpectrumIcons(chunk, enc, cb) {
  const dom = new JSDOM(chunk.contents);
  const iconReferences = Array.from(dom.window.document.querySelectorAll('.spectrum-Icon use'));
  const iconIDs = Array.from(new Set(iconReferences.map(el => el.getAttribute('xlink:href'))));
  if (iconReferences && iconReferences.length > 0) {
    const iconContainer = dom.window.document.createElement('svg');
    iconContainer.style.display = 'none';
    dom.window.document.body.appendChild(iconContainer);
    for (let i = 0; i < iconIDs.length; i += 1) {
      const icon = findIconInSource(svgSrc, iconIDs[i]);
      if (icon) {
        iconContainer.appendChild(icon.cloneNode(true));
      }
    }
    let serializedDOM = dom.serialize();
    // decode entities because Helix's HTL takes care of encoding later
    serializedDOM = he.decode(serializedDOM);
    // eslint-disable-next-line no-param-reassign
    chunk.contents = Buffer.from(serializedDOM, enc);
  }
  cb(null, chunk);
}

function helixHtl() {
  return src(PATHS.helix.htl)
    .pipe(through.obj(inlineSpectrumIcons, 'utf8'))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
    }))
    .pipe(dest(HELIX_SRC));
}

function helixOther() {
  return src(PATHS.helix.nonHtl)
    .pipe(dest(HELIX_SRC));
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
  watch(PATHS.images).on('all', images);
  watch(PATHS.css).on('all', css);
  watch(PATHS.vendor).on('all', vendor);
  watch('./htdocs/**/*.css').on('all', injectCSS);
  browserSync.init({
    proxy: 'localhost:3000',
  });
  watch(PATHS.helix.htl).on('all', helixHtl);
  watch(PATHS.helix.nonHtl).on('all', helixOther);
  watch(PATHS.helix.build, { delay: 200 }).on('all', browserSync.reload);
}

exports.build = series(clean, parallel(css, vendor, helixHtl, helixOther, images, spectrumCSS));
exports.develop = develop;
exports.clean = clean;
exports.default = exports.build;
