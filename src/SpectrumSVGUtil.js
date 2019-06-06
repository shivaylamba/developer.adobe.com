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

const s = require('hastscript/svg');
const vfile = require('to-vfile');
const parse5 = require('parse5');
// const inspect = require('unist-util-inspect');
const fromParse5 = require('hast-util-from-parse5');
const {
  selectAll,
  select,
} = require('hast-util-select');

let iconContainer = null;
let svgNodes = [];
const icons = {};

function findSVGNodes(hast) {
  return selectAll('.spectrum-Icon use', hast);
}

function findOrCreateIconContainer(hast) {
  const containerID = '#spectrum-svg-icons-container';
  iconContainer = select(containerID, hast);
  if (!iconContainer) {
    iconContainer = s(`svg${containerID}`);
    hast.children.push(iconContainer);
  }
}

function svgFileToHAST(url) {
  const doc = vfile.readSync(url);
  const ast = parse5.parse(String(doc), {
    sourceCodeLocationInfo: true,
  });
  return fromParse5(ast, doc);
}

function loadIconSourceFiles() {
  icons.workflow = svgFileToHAST('./htdocs/spectrum/icons/spectrum-icons.svg');
  icons.cssRegular = svgFileToHAST('./htdocs/spectrum/icons/spectrum-css-icons.svg');
  icons.cssMedium = svgFileToHAST('./htdocs/spectrum/icons/spectrum-css-icons-medium.svg');
  icons.cssLarge = svgFileToHAST('./htdocs/spectrum/icons/spectrum-css-icons-large.svg');
}

function getIconFromSourceFiles(iconID) {
  let iconNode = null;
  const iconSets = Object.values(icons);
  for (let i = 0; i < iconSets.length; i += 1) {
    const result = select(iconID, iconSets[i]);
    if (result) iconNode = result;
  }
  return iconNode;
}

function injectIcons() {
  for (let i = 0; i < svgNodes.length; i += 1) {
    const icon = getIconFromSourceFiles(svgNodes[i].properties.xLinkHref);
    if (icon) {
      iconContainer.children.push(icon);
    }
  }
}

async function injectSpectrumIconsAsSVG(context, action) {
  const {
    logger,
  } = action;
  const {
    hast,
  } = context.response;
  const {
    path,
  } = context.request;
  svgNodes = findSVGNodes(hast);
  if (svgNodes && svgNodes.length <= 0) {
    logger.info('   > No Icons Found');
  } else {
    logger.info(`   > Found ${svgNodes.length} Spectrum Icons in ${path}`);
    loadIconSourceFiles();
    findOrCreateIconContainer(hast);
    injectIcons();
  }
}

const SpectrumSVGUtil = {
  injectSpectrumIconsAsSVG,
};
module.exports = SpectrumSVGUtil;
