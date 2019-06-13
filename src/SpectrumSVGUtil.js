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
const { JSDOM } = require('jsdom');
const svgSrc = [
  new JSDOM(require('./spectrum/spectrum-icons.svg.js')),
  new JSDOM(require('./spectrum/spectrum-css-icons.svg.js')),
];

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

async function injectSpectrumIconsAsSVG(context, action) {
  const {
    logger,
  } = action;
  const {
    document,
  } = context.response;
  const iconReferences = Array.from(document.querySelectorAll('.spectrum-Icon use'));
  const iconIDs = Array.from(new Set(iconReferences.map(el => el.getAttribute('xlink:href'))));
  if (iconReferences && iconReferences.length <= 0) {
    logger.info('   > No Icons Found');
  } else {
    logger.info(`   > Found ${iconIDs.length} Spectrum Icons in ${context.request.path}`);
    const iconContainer = document.ownerDocument.createElement('svg');
    iconContainer.style.display = 'none';
    document.prepend(iconContainer);
    for (let i = 0; i < iconIDs.length; i += 1) {
      const icon = findIconInSource(svgSrc, iconIDs[i]);
      if (icon) {
        iconContainer.appendChild(icon);
      }
    }
  }
}

const SpectrumSVGUtil = {
  injectSpectrumIconsAsSVG,
};
module.exports = SpectrumSVGUtil;
