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
/* global describe, it */
const assert = require('assert');
const remark = require('remark');
const defaultMain = require('../../src/sitemap_xml.js');

const loggerMock = {
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  silly: () => {},
};

const urlPrefix = 'https://www.project-helix.io/bla/';
const extension = 'html';

const mdastLinks = remark.parse(`
* [Overview](README.md)
* [Tutorials](contributing/README.md)
  * [Adapters](contributing/adapters.md)
  * [Companies](contributing/companies.md)
  * [Data Elements](contributing/data-elements.md)
`);

const mdastNoLinks = remark.parse(`
* No link
* Not a link either
  * Still no link
`);

const expectedOutput = {
  urlset: {
    url: [
      {
        loc: 'https://www.project-helix.io/bla/README.html',
      },
      {
        loc: 'https://www.project-helix.io/bla/contributing/README.html',
      },
      {
        loc: 'https://www.project-helix.io/bla/contributing/adapters.html',
      },
      {
        loc: 'https://www.project-helix.io/bla/contributing/companies.html',
      },
      {
        loc: 'https://www.project-helix.io/bla/contributing/data-elements.html',
      },
    ],
  },
};

describe('Testing pre requirements for main function', () => {
  it('Exports main', () => {
    assert.ok(defaultMain.main);
  });

  it('main is a function', () => {
    assert.equal('function', typeof defaultMain.main);
  });
});

describe('Testing createSitemap', () => {
  it('Create correct sitemap from markdown with links', () => {
    const output = defaultMain.createSitemap(mdastLinks, urlPrefix, extension, loggerMock);
    assert.deepEqual(output, expectedOutput);
  });

  it('Create empty sitemap for markdown without links', () => {
    const output = defaultMain.createSitemap(mdastNoLinks, urlPrefix, extension, loggerMock);
    assert.deepEqual(output, { urlset: { url: [] } });
  });

  it('Deal with empty extension', () => {
    const output = defaultMain.createSitemap(mdastLinks, urlPrefix, undefined, loggerMock);
    assert.deepEqual(output, expectedOutput);
  });
});
