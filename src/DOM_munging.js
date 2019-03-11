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
// eslint-disable-next-line import/no-extraneous-dependencies
const VDOM = require('@adobe/helix-pipeline').utils.vdom;
const visit = require('unist-util-visit');

module.exports = {
  addClass(document, selector, classNames) {
    document.querySelectorAll(selector).forEach((element) => {
      classNames.split(' ').forEach(className => element.classList.add(className));
    });
  },
  spectrumify(body) {
    module.exports.addClass(body, 'a', 'spectrum-Link');
    module.exports.addClass(body, 'p', 'spectrum-Body3');
    [1, 2, 3, 4, 5].forEach((i) => {
      module.exports.addClass(body, `h${i}`, `spectrum-Heading${i}`);
    });
    module.exports.addClass(body, 'code', 'spectrum-Code3');
    module.exports.addClass(body, 'li', 'spectrum-Body3 li-no-margin-bottom');
    // TODO: tables, what else?
    /*
     * TODO: cant do this as content.document is the entire document, not just
     * the bit being rendered
    p.content.document.querySelectorAll('p').forEach((paragraph) => {
      if (!paragraph.className.includes('spectrum-Body1')) paragraph.className += ' spectrum-Body1';
    });
    */
  },
  replaceLinks(body, mountPoint) {
    if (mountPoint) {
      body.querySelectorAll('a[href]:not([href=""])').forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (!href.match(/^https?:\/\//i)) {
          anchor.setAttribute('href', `${mountPoint}/${href}`);
        }
      });
      body.querySelectorAll('img[src]:not([src=""])').forEach((img) => {
        const src = img.getAttribute('src');
        if (!src.match(/^https?:\/\//i)) {
          img.setAttribute('src', `${mountPoint}/${src}`);
        }
      });
    }
  },

  getElement(action, section, tag, index = 0) {
    const node = new VDOM(section, action.secrets).getNode();
    const elements = node.querySelectorAll(tag);
    const i = index === 'last' ? elements.length - 1 : index;
    if (elements.length > i) {
      return elements[i].innerHTML;
    }
    return '';
  },

  getLink(action, section, index = 0) {
    let href = '';
    let label = '';
    const node = new VDOM(section, action.secrets).getNode();
    const elements = node.getElementsByTagName('a');
    const i = index === 'last' ? elements.length - 1 : index;
    if (elements.length > i) {
      ({ href } = elements[i]);
      label = elements[i].innerHTML;
    }

    return { label, href };
  },

  getImage(action, section, index = 0) {
    const node = new VDOM(section, action.secrets).getNode();
    const elements = node.getElementsByTagName('img');
    const i = index === 'last' ? elements.length - 1 : index;
    if (elements.length > i) {
      return elements[i].outerHTML;
    }

    return '';
  },

  applyTypesToCSSClasses(sections) {
    // allow fine-grain search on the DOM
    sections.forEach((section) => {
      visit(section, (child) => {
        if (child && child.data && child.data.types) {
          // assign the child types to the child className so that they get rendered
          // eslint-disable-next-line no-param-reassign
          child.data = Object.assign({
            hProperties: {
              className: child.data.types,
            },
          }, child.data || {});
        }
      });
    });
  },
};
