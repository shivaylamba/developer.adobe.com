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
const visit = require('unist-util-visit');
const DOMUtil = require('./DOM_munging.js');

const rss = new RSSParser();

// Given a DOM node, recurse over its children and extract just text nodes
// Used for estimating read length
function getAllWords(node) {
  let allText = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      // node is text node
      allText = allText.concat(child.textContent.split(' '));
    } else {
      // node is an element, recurse
      allText = allText.concat(getAllWords(child));
    }
  });
  return allText.filter(word => word.length && word.match(/^\w+\W?$/i));
}

function getSection(sections, index) {
  if (sections && sections.length > index) {
    return sections[index];
  }
  return null;
}

function getElement(action, section, tag, index = 0) {
  const node = new VDOM(section, action.secrets).getNode();
  const elements = node.querySelectorAll(tag);
  const i = index === 'last' ? elements.length - 1 : index;
  if (elements.length > i) {
    return elements[i].innerHTML;
  }
  return '';
}

function getLink(action, section, index = 0) {
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
}

function getImage(action, section, index = 0) {
  const node = new VDOM(section, action.secrets).getNode();
  const elements = node.getElementsByTagName('img');
  const i = index === 'last' ? elements.length - 1 : index;
  if (elements.length > i) {
    return elements[i].outerHTML;
  }

  return '';
}

// module.exports.pre is a function (taking next as an argument)
// that returns a function (with payload, config, logger as arguments)
// that calls next (after modifying the payload a bit)
async function pre(payload, action) {
  const {
    logger,
    secrets,
  } = action;

  let feed = null;
  try {
    feed = await rss.parseURL('https://medium.com/feed/adobetech');
  } catch (e) {
    logger.warn('error durring parsing adobetech blog rss feed!', e);
  }
  const { content } = payload;

  // allow fine-grain search on the DOM
  content.sections.forEach((section) => {
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

  const heading = getSection(content.sections, 0);
  if (heading) {
    content.heading = {
      title: getElement(action, heading, 'h2'),
      code: getElement(action, heading, 'code'),
      description: getElement(action, heading, 'p.is-paragraph'),
      label: getElement(action, heading, 'p.is-paragraph', 1),
    };
  }

  const featured = getSection(content.sections, 1);
  if (featured) {
    content.featured = {
      title: getElement(action, featured, 'h2'),
      code: getElement(action, featured, 'code'),
      content1: getElement(action, featured, 'p.is-paragraph'),
      content2: getElement(action, featured, 'p.is-paragraph', 1),
      img: getImage(action, featured),
      link: getLink(action, featured, 'last'),
    };
  }

  const auth = getSection(content.sections, 2);
  if (auth) {
    content.auth = {
      title: getElement(action, auth, 'h2'),
      part1: {
        title: getElement(action, auth, 'h2', 1),
        description: getElement(action, auth, 'p.is-paragraph'),
        link1: getLink(action, auth),
        link2: getLink(action, auth, 1),
      },
      part2: {
        title: getElement(action, auth, 'h2', 2),
        description: getElement(action, auth, 'p.is-paragraph', 1),
        link1: getLink(action, auth, 2),
        link2: getLink(action, auth, 3),
      },
    };
  }

  const spotlight = getSection(content.sections, 3);
  if (spotlight) {
    content.spotlight = {
      title: getElement(action, spotlight, 'h2'),
      code: getElement(action, spotlight, 'code'),
      description: getElement(action, spotlight, 'p.is-paragraph'),
      img: getImage(action, spotlight),
      link: getLink(action, spotlight),
    };
  }

  content.medium = false;

  // pull recent blog posts from medium
  if (feed) {
    const transformer = new VDOM(payload.content.sections[0], secrets);
    const document = transformer.getDocument();
    const meta = {
      title: 'Some Default Title',
    };

    const medium = getSection(content.sections, 4);
    if (medium) {
      meta.title = medium.title;
    }

    content.medium = {
      articles: feed.items.slice(0, 3).map((item) => {
        const pubMoment = moment(item.pubDate);
        const temp = document.createElement('p');
        temp.innerHTML = item['content:encoded'];
        const articleWords = getAllWords(temp);
        // brief googling yields a rough math of 265 words per minute read time
        const minuteLength = Math.ceil(articleWords.length / 265);
        const ps = item['content:encoded'].split('<p>');
        const firstStart = ps[1];
        const firstParagraphContent = firstStart.split('</p>')[0];
        const secondParagraphContent = (ps[2] ? ps[2].split('</p>')[0] : '');
        let caption = `${firstParagraphContent} ${secondParagraphContent}`;
        if (caption.length > 340) {
          // chop up caption into a tl;dr
          caption = caption.substring(0, 340);
          caption = caption.replace(/\w+$/, '...');
        }
        // let the virtual dom handle chopping up elements appropriately,
        // otherwise we risk severing content mid-html-tag
        temp.innerHTML = caption;
        DOMUtil.spectrumify(temp);
        caption = temp.innerHTML;
        return {
          pubDate: `${pubMoment.format('MMM Do')} ${(moment().year() !== pubMoment.year() ? moment.year() : '')}`,
          creator: item.creator,
          title: item.title,
          caption,
          minuteLength,
          link: item.link,
        };
      }),
      meta,
    };
  }

  const signup = getSection(content.sections, 5);
  if (signup) {
    content.signup = {
      title: getElement(action, signup, 'h2'),
      label: getElement(action, signup, 'p'),
      action: getElement(action, signup, 'p', 1),
    };
  }

  return payload;
}

module.exports.pre = pre;
