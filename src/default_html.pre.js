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

  const body = c.document.body;
  body.querySelectorAll('a').forEach((anchor) => {
    anchor.classList.add('spectrum-Link');
  });
  body.querySelectorAll('p').forEach((paragraph) => {
    paragraph.classList.add('spectrum-Body3');
  });
  [1, 2, 3, 4, 5].forEach((i) => {
    body.querySelectorAll(`h${i}`).forEach((heading) => {
      heading.classList.add(`spectrum-Heading${i}`);
    });
  });
  body.querySelectorAll('code').forEach((code) => {
    code.classList.add('spectrum-Code3');
  });
  body.querySelectorAll('li').forEach((li) => {
    li.classList.add('spectrum-Body3');
    li.style.marginBottom = '0';
  });


  c.sectionsDocuments = [];

  let previous;

  c.sections.forEach((element, index) => {
    const transformer = new VDOM(element, secrets);
    const body = transformer.getDocument().body;
    const node = body.firstChild;
    `section index${index} ${index % 2 ? 'even' : 'odd'} ${element.types.join(' ')} spectrum-grid-col-sm-12 spectrum-grid-col-md-6`.split(' ').forEach((className) => {
      node.classList.add(className);
    });
    const types = element.types.slice();
    types.push(`index${index}`);
    console.log(types);

    body.querySelectorAll('a').forEach((anchor) => {
      anchor.classList.add('spectrum-Link');
    });
    body.querySelectorAll('p').forEach((paragraph) => {
      paragraph.classList.add('spectrum-Body3');
    });
    [1, 2, 3, 4, 5].forEach((i) => {
      body.querySelectorAll(`h${i}`).forEach((heading) => {
        heading.classList.add(`spectrum-Heading${i}`);
      });
    });
    body.querySelectorAll('code').forEach((code) => {
      code.classList.add('spectrum-Code3');
    });
    body.querySelectorAll('li').forEach((li) => {
      li.classList.add('spectrum-Body3');
      li.style.marginBottom = '0';
    });


    if (node.className.includes('index0')) {
      // append the search bar to the end of the first section
      const searchDiv = transformer.getDocument().createElement('div');
      searchDiv.classList.add('search-control');
      searchDiv.innerHTML = '<form class="spectrum-Search"><input type="search" placeholder="Search our products and Documentation" name="search" value="" class="spectrum-Textfield spectrum-Search-input search-bar"><svg class="spectrum-Icon spectrum-UIIcon-Magnifier spectrum-Search-icon" focusable="false" aria-hidden="true"><use xlink:href="#spectrum-css-icon-Magnifier" /></svg><button type="reset" class="spectrum-ClearButton"><svg class="spectrum-Icon spectrum-UIIcon-CrossSmall" focusable="false" aria-hidden="true"><use xlink:href="#spectrum-css-icon-CrossSmall" /></svg></button></form>';
      node.appendChild(searchDiv);

      // bold and underline links in first section
      body.querySelectorAll('a').forEach((anchor) => {
        anchor.classList.add('index0-links');
      });
    }

    if (node.className.includes('index1')) {
      // grab last link and style it like a button
      const links = body.querySelectorAll('a');
      links[links.length - 1].classList.add('spectrum-Button', 'spectrum-Button--primary');
    }

    if (node.className.includes('index2')) {
      // grab last link and style it like a button
      const list = body.querySelectorAll('ul');
      list.forEach((ul) => {
        ul.classList.add('removeStyle');
      })
      const links = body.querySelectorAll('a');
      links.forEach((link, index) => {
        if(index === 0 || index === 2){
          link.classList.add('spectrum-Button', 'spectrum-Button--cta','button-read');
        } else {
          link.classList.add('spectrum-Button', 'spectrum-Button--primary', 'list-button');
        }
        
      })
      //links[links.length - 1].classList.add('spectrum-Button', 'spectrum-Button--primary');
    }


    // "state machine"
    if (previous) {

      // if 2 consecutive paragraphs contain an (image and a paragraph) OR (2 images), put them on the same "row"
      if (
        !types.includes('index0') &&
        (types.includes('has-paragraph') || types.includes('nb-image-2')) &&
        types.includes('has-image') &&
        (previous.className.includes('has-paragraph') || previous.className.includes('nb-image-2')) &&
        previous.className.includes('has-image') &&
        !previous.className.includes('left')) {

        // do nothing
        console.log('nothing')

      } else {
        if (
          // if list only and no heading -> carousel
          types.includes('is-list-only') &&
          !types.includes('has-heading')) {

          //node.classList.add('carousel');

          const carousel = node;

          node = transformer.getDocument().createElement('div');
          node.classList.add('carousel');

          node.innerHTML = carousel.outerHTML;

          const controlDiv = transformer.getDocument().createElement('div');
          controlDiv.classList.add('carousel-control');
          controlDiv.innerHTML = '<i class ="fa fa-angle-left fa-2x" id="carousel-l"></i><i class = "fa fa-angle-right fa-2x" id="carousel-r"></i>';

          node.appendChild(controlDiv);
        } else {

        }
      }



    }

    types.push('section');
    // add types as css class
    types.forEach(t => {
      node.classList.add(t);
    });

    previous = node;
    c.sectionsDocuments.push(node);
  });
}

module.exports.pre = pre;