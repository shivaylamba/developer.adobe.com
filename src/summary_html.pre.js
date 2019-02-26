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
const DOMUtil = require('./DOM_munging.js');

function anchorItem(a, close = true) {
  return `<li class="spectrum-SideNav-item">${a.outerHTML.replace(/spectrum-Link/, 'spectrum-SideNav-itemLink')}${(close ? '</li>' : '')}`;
}

function buildSideNavFromList(list) {
  let html = '';
  // The way spectrum sidenav works is that, for nested lists, you need to
  // embed the sublist into the parent list item (<li>). we control this by
  // passing in the close (default true) parameter to the `anchorItem` method
  // above.
  // The first level of child elements in summary lists are list items (<li> elements)
  Array.from(list.children).forEach((li) => {
    // The second level of child elements, the ones inside list items (<li>) are
    // either paragraph <p>, anchor <a> or unordered list <ul> elements (thus
    // the variable name `paOrUl`).
    Array.from(li.children).forEach((paOrUl, index, sublist) => {
      // In the case the tag is an anchor tag at this level, we can generated a
      // sidenav item immediately. Sometimes, anchor tags are embedded inside
      // paragraph tags (which is why we have the final loop near the end of
      // this function, to go one level deeper).
      if (paOrUl.tagName === 'A') {
        // We check if the element _after_ the anchor tag is an unordered list,
        // if it is, we need to keep the current sidenav item element open to
        // embded the sublist in next.
        if (sublist[index + 1] && sublist[index + 1].tagName === 'UL') {
          html += anchorItem(paOrUl, false);
        } else {
          html += anchorItem(paOrUl);
        }
      } else if (paOrUl.tagName === 'UL') {
        // Every time we recurse to generate a sublist sidenav, we pad the left
        // side of the sidenav with 12 pixels, to create the indent.
        html += '<ul class="spectrum-SideNav" style="padding-left:12px;">';
        html += buildSideNavFromList(paOrUl);
        html += '</ul></li>';
      } else {
        Array.from(paOrUl.children).forEach((anchor, idx, sbl) => {
          if (anchor.tagName === 'A') {
            // Same code as above, we need to keep anchor <a> closing tags
            // optionally open depending on if a sublist follows the anchor.
            if (sbl[idx + 1] && sbl[idx + 1].tagName === 'UL') {
              html += anchorItem(anchor, false);
            } else {
              html += anchorItem(anchor);
            }
          }
        });
      }
    });
  });
  return html;
}

/* eslint-disable no-param-reassign */
function filterNav(document, path, logger, mountPoint) {
  logger.debug('summary_html.pre.js - Extracting nav');
  if (document.body.children[0].children && document.body.children[0].children.length > 0) {
    // rewrite the links to abolsute with the mountPoint
    DOMUtil.replaceLinks(document.body, mountPoint);
    DOMUtil.spectrumify(document.body);
    let nav = Array.from(document.body.children[0].children);

    // remove first title
    if (nav && nav.length > 0) {
      nav = nav.slice(1);
    }
    let firstHeading = true;
    let final = '';
    nav.forEach((el) => {
      if (el.tagName === 'H2') {
        if (!firstHeading) {
          final += '</ul></li>';
        } else firstHeading = false;
        const heading = el.innerHTML;
        const slug = heading.replace(/\s/gi, '-').replace(/[^a-zA-Z0-9_-]/gi, '');
        final += `<li class="spectrum-SideNav-item"><h2 class="spectrum-SideNav-heading" id="nav-heading-${slug}">${heading}</h2><ul class="spectrum-SideNav" aria-labelledby="nav-heading-${slug}">`;
      } else if (el.tagName === 'UL') {
        final += buildSideNavFromList(el);
      }
    });
    final = `<div>${final}</div>`;
    document.body.children[0].outerHTML = final;
    // console.log(Array.from(document.body.children[0].children)[0].innerHTML);

    logger.debug(`summary_html.pre.js - Managed to collect some content for the nav: ${nav.length}`);
    return Array.from(document.body.children[0].children);
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
    p.content.nav = filterNav(p.content.document,
      action.request.params.path,
      logger,
      action.request.params.rootPath);
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
