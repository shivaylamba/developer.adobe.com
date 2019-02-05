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
const mountPointResolution = require('./mountpoint_resolution.js');

function anchorItem(a, path, close = true) {
  const { href } = a;
  let isSelected = '';
  if (path === href) isSelected = 'is-selected';
  return `<li class="spectrum-SideNav-item ${isSelected}">${a.outerHTML.replace(/spectrum-Link/, 'spectrum-SideNav-itemLink')}${(close ? '</li>' : '')}`;
}

function buildSideNavFromList(list, path) {
  // console.log('list children', list.children);
  let html = '';
  Array.from(list.children).forEach((li) => {
    // console.log('children of list item', li.children);
    Array.from(li.children).forEach((paOrUl, index, sublist) => {
      // console.log(paOrUl.tagName, paOrUl.children);
      if (paOrUl.tagName === 'A') {
        if (sublist[index + 1] && sublist[index + 1].tagName === 'UL') {
          html += anchorItem(paOrUl, path, false);
        } else {
          html += anchorItem(paOrUl, path);
        }
      } else if (paOrUl.tagName === 'UL') {
        html += '<ul class="spectrum-SideNav" style="padding-left:12px;">';
        html += buildSideNavFromList(paOrUl, path);
        html += '</ul></li>';
      } else {
        Array.from(paOrUl.children).forEach((aOrLi, idx, sbl) => {
          if (aOrLi.tagName === 'A') {
          // anchor tag, add the list item w/ a link
            if (sbl[idx + 1] && sbl[idx + 1].tagName === 'UL') {
              html += anchorItem(aOrLi, path, false);
            } else {
              html += anchorItem(aOrLi, path);
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
        final += buildSideNavFromList(el, path);
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
    const mountPoint = mountPointResolution(payload.request.headers['x-strain']);

    // clean up the resource
    p.content.nav = filterNav(p.content.document, action.request.params.path, logger, mountPoint);

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
