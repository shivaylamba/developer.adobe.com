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

function filterNav(document, path, logger) {
  logger.debug('summary_html.pre.js - Extracting nav');
  if (document.body.children[0].children && document.body.children[0].children.length > 0) {
    /*
    document.body.querySelectorAll('a[href]:not([href=""])').forEach((anchor) => {
      const href = anchor.getAttribute('href');
      if (!href.match(/^https?:\/\//i)) {
        logger.debug('summary_html.pre.js - Setting href to absolute url in nav');
        anchor.setAttribute('href', `/${href}`);
      }
    });
    */
    document.body.querySelectorAll('ul').forEach((ul) => {
      ul.classList.add('spectrum-TreeView');
    });
    document.body.querySelectorAll('li').forEach((ul) => {
      ul.classList.add('spectrum-TreeView-item');
    });
    document.body.querySelectorAll('li > a').forEach((a) => {
      a.classList.add('spectrum-TreeView-itemLink');
      a.innerHTML = `<svg class="spectrum-Icon spectrum-UIIcon-ChevronRightMedium spectrum-TreeView-indicator" focusable="false" aria-hidden="true">
  <use xlink:href="#spectrum-css-icon-ChevronRightMedium" />
</svg>${a.innerHTML}`;
    });
    let nav = Array.from(document.body.children[0].children);

    // remove first title
    if (nav && nav.length > 0) {
      nav = nav.slice(1);
    }

    logger.debug(`summary_html.pre.js - Managed to collect some content for the nav: ${nav.length}`);
    return nav;
  }

  logger.debug('summary_html.pre.js - Navigation payload has no children');
  return [];
}

// module.exports.pre is a function (taking next as an argument)
// that returns a function (with payload, config, logger as arguments)
// that calls next (after modifying the payload a bit)
async function pre(payload, action) {
  const {
    logger,
  } = action;

  logger.debug(`summary_html.pre.js - Requested path: ${action.request.params.path}`);

  try {
    if (!payload.content) {
      logger.debug('summary_html.pre.js - Payload has no resource, nothing we can do');
      return payload;
    }

    const p = payload;

    // clean up the resource
    p.content.nav = filterNav(p.content.document, action.request.params.path, logger);

    return p;
  } catch (e) {
    logger.error(`summary_html.pre.js - Error while executing pre.js: ${e.stack || e}`);
    return {
      error: e,
    };
  }
}

module.exports.pre = pre;

// exports for testing purpose only
module.exports.filterNav = filterNav;
