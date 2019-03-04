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

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const VDOM = require('@adobe/helix-pipeline').utils.vdom;
const RSSParser = require('rss-parser');
const moment = require('moment');
const DOMUtil = require('./DOM_munging.js');

const rss = new RSSParser();

// module.exports.pre is a function (taking next as an argument)
// that returns a function (with payload, config, logger as arguments)
// that calls next (after modifying the payload a bit)
async function pre(payload, action) {
  const {
    logger,
    secrets,
  } = action;

  if (!payload.content) {
    logger.debug('html-pre.js - Payload has no resource, nothing we can do');
    return payload;
  }
  let feed = null;
  try {
    feed = await rss.parseURL('https://medium.com/feed/adobetech');
  } catch (e) {
    console.error('error durring parsing adobetech blog rss feed!', e);
  }

  const c = payload.content;
  const documentBody = c.document.body;

  DOMUtil.spectrumify(documentBody);

  c.sectionsDocuments = [];

  c.sections.forEach((element, index) => {
    console.log('processing section with index', index);
    if (!element.children.length) {
      console.warn('skipping childless node');
      return;
    }
    const transformer = new VDOM(element, secrets);
    const document = transformer.getDocument();
    const { body } = document;
    const node = document.createElement('div');
    node.innerHTML = body.innerHTML;
    `section index${index} ${index % 2 ? 'even' : 'odd'} ${element.types.join(' ')} spectrum-grid-col-sm-12 spectrum-grid-col-md-6`.split(' ').forEach((className) => {
      node.classList.add(className);
    });
    const types = element.types.slice();
    types.push(`index${index}`);

    DOMUtil.spectrumify(node);

    if (node.className.includes('index0')) {
      node.classList.add('spectrum--dark');
      // DOMUtil.addClass(body, 'div:nth-of-type(1)', 'spectrum--dark');

      // append the search bar to the end of the first section
      const searchDiv = document.createElement('div');
      searchDiv.classList.add('search-control');
      searchDiv.innerHTML = `<div class="spectrum-DecoratedTextfield is-decorated">
  <label for="search-input" class="spectrum-FieldLabel">Search our products and documentation</label>
  <svg class="spectrum-Icon spectrum-UIIcon-Magnifier spectrum-Icon--sizeS spectrum-DecoratedTextfield-icon" focusable="false" aria-hidden="true" style="color: rgb(75, 75, 75);transform: rotate(90deg);margin-left:10px;">
    <use xlink:href="#spectrum-css-icon-Magnifier" />
  </svg>
  <input id="search-input" class="spectrum-Textfield spectrum-DecoratedTextfield-field" aria-invalid="false" type="text" style="background-color: rgb(255, 255, 255);border-color: rgb(225, 225, 225);color: rgb(75, 75, 75); border-radius: 30px;">
</div>`;
      node.appendChild(searchDiv);

      // bold and underline links in first section
      DOMUtil.addClass(node, 'a', 'index0-links');
    }

    if (node.className.includes('index1')) {
      DOMUtil.addClass(node, 'p:last-of-type a', 'spectrum-Button spectrum-Button--primary');
    }

    if (node.className.includes('index2')) {
      node.classList.add('spectrum--dark');
      // DOMUtil.addClass(node, 'div:nth-of-type(1)', 'spectrum--dark');
      // grab last link and style it like a button
      DOMUtil.addClass(node, 'ul', 'removeStyle');

      const links = node.querySelectorAll('a');
      links.forEach((link, i) => {
        if (i === 0 || i === 2) {
          link.classList.add('spectrum-Button', 'spectrum-Button--cta', 'button-read');
        } else {
          link.classList.add('spectrum-Button', 'spectrum-Button--primary');
        }
      });
    }

    if (node.className.includes('index3')) {
      // grab last link and style it like a button
      DOMUtil.addClass(node, 'p:last-of-type a', 'spectrum-Button spectrum-Button--cta');
    }
    if (node.className.includes('index4')) {
      node.appendChild(document.createElement('hr'));
      // this is the medium blog feed
      feed.items.slice(0, 3).forEach((item) => {
        const pubMoment = moment(item.pubDate);
        const ps = item['content:encoded'].split('<p>');
        const firstStart = ps[1];
        const firstParagraphContent = firstStart.split('</p>')[0];
        const secondParagraphContent = (ps[2] ? ps[2].split('</p>')[0] : '');
        let caption = `${firstParagraphContent} ${secondParagraphContent}`;
        if (caption.length > 340) {
          // TODO: this may cut content that is mid-html-tag. the
          // `content:encoded` field contains html, too.
          caption = caption.substring(0, 340);
          caption = caption.replace(/\w+$/, '...');
        }
        const div = document.createElement('div');
        div.innerHTML = `<p class="spectrum-Body3"><strong>${item.creator}</strong></p>
<code class="spectrum-Code5">${pubMoment.format('MMM Do')} ${(moment().year() !== pubMoment.year() ? moment.year() : '')}</code>
<h4 class="spectrum-Heading4">${item.title}</h4>
<p class="spectrum-Body3">${caption}</p>
<a href="${item.link}" class="spectrum-Button spectrum-Button--primary" style="margin: 20px 0;">Read On</a>
<hr class="spectrum-Rule spectrum-Rule--medium">`;
        div.classList.add('spectrum-Article');
        node.appendChild(div);
      });
    }

    types.push('section');
    // add types as css class
    types.forEach((t) => {
      node.classList.add(t);
    });

    c.sectionsDocuments.push(node);
  });
  return payload;
}

module.exports.pre = pre;
