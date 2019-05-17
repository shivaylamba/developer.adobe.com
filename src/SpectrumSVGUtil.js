const s = require('hastscript/svg');
const vfile = require('to-vfile');
const parse5 = require('parse5');
const inspect = require('unist-util-inspect');
const fromParse5 = require('hast-util-from-parse5');
const { selectAll, select } = require('hast-util-select');

let iconContainer = null;
let svgNodes = [];
let icons = {};
let logger = null;

async function injectSpectrumIconsAsSVG(context, action) {
  logger = action.logger;
  let {
    hast
  } = context.response;
  const {
    path
  } = context.request;
  svgNodes = findSVGNodes(hast);
  if (svgNodes && svgNodes.length <= 0) {
    logger.info(`   > No Icons Found`);
  } else {
    logger.info(`   > Found ${svgNodes.length} Spectrum Icons in ${path}`);
    loadIconSourceFiles();
    findOrCreateIconContainer(hast);
    injectIcons();
  }
}

function findOrCreateIconContainer(hast) {
  logger.info(`   > findOrCreateIconContainer`);
  let containerID = '#spectrum-svg-icons-container';
  iconContainer = select(containerID, hast);
  if (!iconContainer) {
    iconContainer = s('svg'+containerID);
    hast.children.push(iconContainer);
  }
}

function findSVGNodes(hast) {
  logger.info(`   > findSVGNodes`);
  return selectAll('.spectrum-Icon use', hast);
}

function svgFileToHAST(url) {
  logger.info(`   > svgFileToHAST: ${url}`);
  const doc = vfile.readSync(url);
  const ast = parse5.parse(String(doc), {sourceCodeLocationInfo: true});
  return fromParse5(ast, doc);
}

function loadIconSourceFiles() {
  logger.info(`   > loadIconSource`);
  icons.workflow = svgFileToHAST('./htdocs/spectrum/icons/spectrum-icons.svg');
  icons.cssRegular = svgFileToHAST('./htdocs/spectrum/icons/spectrum-css-icons.svg');
  icons.cssMedium = svgFileToHAST('./htdocs/spectrum/icons/spectrum-css-icons-medium.svg');
  icons.cssLarge = svgFileToHAST('./htdocs/spectrum/icons/spectrum-css-icons-large.svg');
}

function getIconFromSourceFiles(iconID) {
  let iconNode = null;
  for (let hast in icons) {
    let tree = icons[hast];
    let result = select(iconID, tree);
    if (result) iconNode = result;
    console.log(result);
  }
  return iconNode;
}

function injectIcons() {
  logger.info(`   > injectIcons`);
  // for each icon, run getIconFromSourceFiles()
  // and then push it into the container
  for (let i = 0; i < svgNodes.length; i++) {
    let icon = getIconFromSourceFiles(svgNodes[i].properties.xLinkHref);
    if (icon) {
      iconContainer.children.push(icon);
    }
  }
}

const SpectrumSVGUtil = {
  injectSpectrumIconsAsSVG
};
module.exports = SpectrumSVGUtil;
