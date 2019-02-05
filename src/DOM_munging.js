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
};
