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

 const VDOM = require('@adobe/helix-pipeline').utils.vdom;

// module.exports.pre is a function (taking next as an argument)
// that returns a function (with payload, config, logger as arguments)
// that calls next (after modifying the payload a bit)
async function pre(payload, action) {
  const {
    logger,
    secrets,
    request: actionReq,
  } = action;

  if (!payload.content) {
    logger.debug('html-pre.js - Payload has no resource, nothing we can do');
    return payload;
  }

  const c = payload.content;
  c.sectionsDocuments = [];

  c.sections.forEach((element, index) => {
    const transformer = new VDOM(element, secrets);
    const node = transformer.process();
    node.classList.add(`section index${index} ${index%2 ? 'even' : 'odd'} ${element.types.join(' ')}`);

    // missing in pipeline, need to be moved there
    if (node.innerHTML.includes('<img')) {
      node.classList.add('has-image');
    }

    c.sectionsDocuments.push(node);
  });
}

module.exports.pre = pre;
