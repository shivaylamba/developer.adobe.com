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
const posthtml = require('gulp-posthtml');
const expressions = require('posthtml-expressions');
const include = require('posthtml-include')
const imagemin = require('gulp-imagemin');
const fs = require('fs');
// const ejs = require('gulp-ejs');
const MediumUtil = require('./src/utils/MediumUtil.js');

// eslint-disable-next-line import/no-unresolved
const browserSync = require('browser-sync').create();

const DISTRIBUTION = './dist';
const STATIC_SRC = './dist/static';

const PATHS = {
  css: ['./src/**/*.css', '!./src/spectrum/**/*.css'],
  images: ['./src/**/*.jpg', './src/**/*.png', './src/**/*.svg'],
  spectrum: ['./src/spectrum/**/*.css'],
  vendor: ['./src/vendor/**/*.*'],
  html: ['./src/pages/**/*.html'],
};

const svgSrc = [
  new JSDOM(fs.readFileSync('./src/spectrum/spectrum-icons.svg', 'utf8')),
  new JSDOM(fs.readFileSync('./src/spectrum/spectrum-css-icons.svg', 'utf8')),
];

function clean(cb) {
  del.sync([DISTRIBUTION]);
  cb();
}

function vendor() {
  return src(PATHS.vendor)
    .pipe(dest(`${STATIC_SRC}/vendor`));
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

async function html() {

  // get open page blog data
  const openPagePosts = await MediumUtil.getPostsAsHTML('https://medium.com/feed/adobetech/tagged/open-source', 5);

  // eslint-disable-next-line global-require
  const plugins = [
    include({
      root: './src',
    }),
    expressions({
      locals: {
        openPage: {
          heroPost: openPagePosts[0],
          otherPosts: openPagePosts.slice(1),
        },
      },
    }),
  ];
  const options = {};

  return src(PATHS.html)
    .pipe(through.obj(inlineSpectrumIcons, 'utf8'))
    .pipe(posthtml(plugins, options))
    .pipe(htmlmin({
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      minifyCSS: true,
    }))
    .pipe(dest(DISTRIBUTION));
}

function css() {
  return src(PATHS.css)
    .pipe(postcss())
    .pipe(dest(STATIC_SRC));
}

function images() {
  return src(PATHS.images)
    .pipe(imagemin())
    .pipe(dest(STATIC_SRC));
}

// Avoid minifying spectrum on every build, as it rarely changes.
function spectrumCSS() {
  return src(PATHS.spectrum)
    .pipe(postcss())
    .pipe(dest(`${STATIC_SRC}/spectrum/`));
}

function injectCSS() {
  return src(`${STATIC_SRC}/**/*.css`)
    .pipe(browserSync.stream());
}

function livereload() {
  watch(PATHS.images).on('all', images);
  watch(PATHS.css).on('all', css);
  watch(PATHS.vendor).on('all', vendor);
  watch(`${STATIC_SRC}/**/*.css`).on('all', injectCSS);
  browserSync.init({
    server: {
      baseDir: DISTRIBUTION,
    },
  });
  watch(PATHS.html).on('all', html);
  watch(`${DISTRIBUTION}/**/*.*`).on('all', browserSync.reload);
}

exports.build = series(clean, parallel(css, vendor, html, images, spectrumCSS));
exports.develop = series(exports.build, livereload);
exports.clean = clean;
exports.default = exports.build;
