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
const assert = require('assert');
const sinon = require('sinon');
const RSSParser = require('rss-parser');
const feed = require('../../src-actual/helix/feed_html.pre.js');

// Fake mdast etc to use for content
const context = {
  content: {
    sections: [{
      type: 'root',
      children: [{
        type: 'paragraph',
        children: [{
          type: 'inlineCode',
          value: 'Find what you\'re looking for',
          position: [1],
        }],
        position: {
          start: { line: 1, column: 1, offset: 0 },
          end: { line: 1, column: 31, offset: 30 },
          indent: [],
        },
        data: { types: ['has-inlineCode'] },
      }],
      intro: 'Recent Blog Articles',
      types: ['has-heading', 'nb-heading-1', 'has-only-heading'],
      title: 'Recent Blog Articles',
      meta: {},
    }],
  },
};
// Fake action to pass into pipeline
const action = { logger: console, secrets: { IMAGES_SIZES: '100w' } };

describe('feed_html.pre.js', () => {
  beforeEach(() => {
    sinon.stub(RSSParser.prototype, 'parseURL').returns({
      items: [{
        pubDate: '2019-04-10T08:30:43.608Z',
        'content:encoded': '<p>hey its an article</p>',
        creator: 'Batman',
        title: 'Batman\'s Twelve Secrets To Success',
        link: 'https://batman.com',
      }],
    });
  });
  afterEach(() => {
    sinon.restore();
  });
  it('should add to content with medium article summary for most recent three articles', async () => {
    await feed.pre(context, action);
    assert.equal(context.content.mediumArticles.length, 1);
  });
  it('should set maxage cache header to 15 minutes', () => {
    assert.equal(feed.after.html().response.headers['Cache-Control'], 'max-age=900');
  });
});
