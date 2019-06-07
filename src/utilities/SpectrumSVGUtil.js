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

const fs = require('fs');
const { JSDOM } = require('jsdom');

let iconContainer = null;
let iconReferences = null;
const src = {};

function findOrCreateIconContainer(document) {
  iconContainer = createElement(document,'svg');
  iconContainer.style.display = 'none';
  document.prepend(iconContainer);
}

function createElement(document, elementDefinition) {
  if (document.createElement) {
    return document.createElement(elementDefinition);
  } else {
    return document.ownerDocument.createElement(elementDefinition);
  }
}

function loadIconSourceFiles() {
  src.workflow = new JSDOM(fs.readFileSync('./htdocs/spectrum/icons/spectrum-icons.svg', 'utf8'));
  src.cssRegular = new JSDOM(fs.readFileSync('./htdocs/spectrum/icons/spectrum-css-icons.svg', 'utf8'));
  src.cssMedium = new JSDOM(fs.readFileSync('./htdocs/spectrum/icons/spectrum-css-icons-medium.svg', 'utf8'));
  src.cssLarge = new JSDOM(fs.readFileSync('./htdocs/spectrum/icons/spectrum-css-icons-large.svg', 'utf8'));
}

function findIconInSource(iconID) {
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

function injectIcons() {
  for (let i = 0; i < iconReferences.length; i += 1) {
    const iconID = iconReferences[i].getAttribute('xlink:href');
    const icon = findIconInSource(iconID);
    if (icon) {
      iconContainer.appendChild(icon);
    }
  };
}

async function injectSpectrumIconsAsSVG(context, action) {
  const {
    logger,
  } = action;
  const {
    document,
  } = context.response;
  const {
    path,
  } = context.request;
  iconReferences = document.querySelectorAll('.spectrum-Icon use');
  if (iconReferences && iconReferences.length <= 0) {
    logger.info('   > No Icons Found');
  } else {
    logger.info(`   > Found ${iconReferences.length} Spectrum Icons in ${path}`);
    loadIconSourceFiles();
    findOrCreateIconContainer(document);
    injectIcons();
  }
}

const SpectrumSVGUtil = {
  injectSpectrumIconsAsSVG,
};
module.exports = SpectrumSVGUtil;
