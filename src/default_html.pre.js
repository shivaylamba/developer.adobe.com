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

function getSection(sections, layout) {
  const ret = sections.filter(section => section.meta && section.meta.layout === layout);
  return ret && ret.length > 0 ? ret[0] : null;
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
  DOMUtil.applyTypesToCSSClasses(content.sections);

  const heading = getSection(content.sections, 'heading');
  if (heading) {
    content.heading = {
      title: DOMUtil.getElement(action, heading, 'h2'),
      code: DOMUtil.getElement(action, heading, 'code'),
      description: DOMUtil.getElement(action, heading, 'p.is-text'),
      label: DOMUtil.getElement(action, heading, 'p.is-text', 1),
    };
  }

  const featured = getSection(content.sections, 'featured');
  if (featured) {
    content.featured = {
      title: DOMUtil.getElement(action, featured, 'h2'),
      code: DOMUtil.getElement(action, featured, 'code'),
      content1: DOMUtil.getElement(action, featured, 'p.is-text'),
      content2: DOMUtil.getElement(action, featured, 'p.is-text', 1),
      img: DOMUtil.getImage(action, featured),
      link: DOMUtil.getLink(action, featured, 'last'),
    };
  }

  const auth = getSection(content.sections, 'auth');
  if (auth) {
    content.auth = {
      title: DOMUtil.getElement(action, auth, 'h2'),
      part1: {
        title: DOMUtil.getElement(action, auth, 'h2', 1),
        description: DOMUtil.getElement(action, auth, 'p.is-text'),
        link1: DOMUtil.getLink(action, auth),
        link2: DOMUtil.getLink(action, auth, 1),
      },
      part2: {
        title: DOMUtil.getElement(action, auth, 'h2', 2),
        description: DOMUtil.getElement(action, auth, 'p.is-text', 1),
        link1: DOMUtil.getLink(action, auth, 2),
        link2: DOMUtil.getLink(action, auth, 3),
      },
    };
  }

  const spotlight = getSection(content.sections, 'spotlight');
  if (spotlight) {
    content.spotlight = {
      title: DOMUtil.getElement(action, spotlight, 'h2'),
      code: DOMUtil.getElement(action, spotlight, 'code'),
      description: DOMUtil.getElement(action, spotlight, 'p.is-text'),
      img: DOMUtil.getImage(action, spotlight),
      link: DOMUtil.getLink(action, spotlight),
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

    const medium = getSection(content.sections, 'medium');
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

  const signup = getSection(content.sections, 'signup');
  if (signup) {
    content.signup = {
      title: DOMUtil.getElement(action, signup, 'h2'),
      label: DOMUtil.getElement(action, signup, 'p'),
      action: DOMUtil.getElement(action, signup, 'p', 1),
    };
  }

  return payload;
}

module.exports.pre = pre;
