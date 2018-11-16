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
const defaultPre = require('../src/sitemap_xml.pre.js');

const loggerMock = {
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  silly: () => {},
};

describe('Testing pre requirements for main function', () => {
  it('Exports pre', () => {
    assert.ok(defaultPre.pre);
  });

  it('pre is a function', () => {
    assert.equal('function', typeof defaultPre.pre);
  });
});

describe('Testing createSitemap', () => {
  it('Create correct sitemap from markdown with links ', () => {
    const mdast = remark().parse(`
* [Overview](README.md)
* [Tutorials](contributing/README.md)
  * [Adapters](contributing/adapters.md)
  * [Companies](contributing/companies.md)
  * [Data Elements](contributing/data-elements.md)
`);
    const urlPrefix = 'https://www.project-helix.io/bla/';
    const output = defaultPre.createSitemap(mdast, urlPrefix, loggerMock);

    assert.deepEqual(output, [
      '<url><loc>https://www.project-helix.io/bla/README.md</loc></url>',
      '<url><loc>https://www.project-helix.io/bla/contributing/README.md</loc></url>',
      '<url><loc>https://www.project-helix.io/bla/contributing/adapters.md</loc></url>',
      '<url><loc>https://www.project-helix.io/bla/contributing/companies.md</loc></url>',
      '<url><loc>https://www.project-helix.io/bla/contributing/data-elements.md</loc></url>',
    ]);
  });

  it('Create empty sitemap for markdown without links ', () => {
    const mdast = remark().parse(`
* No link
* Not a link either
  * Still no link
`);
    const output = defaultPre.createSitemap(mdast, '', loggerMock);

    assert.deepEqual(output, []);
  });
});
