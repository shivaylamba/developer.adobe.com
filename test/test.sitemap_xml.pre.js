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
const defaultPre = require('../src/sitemap_xml.pre.js');

const loggerMock = {
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  silly: () => {},
};

const requestMock = {
  params: {
    path: '/path/to/file.html',
  },
  headers: {
    host: 'www.project-helix.io',
  },
};

describe('Testing pre requirements for main function', () => {
  it('Exports pre', () => {
    assert.ok(defaultPre.pre);
  });

  it('pre is a function', () => {
    assert.equal('function', typeof defaultPre.pre);
  });
});

describe('Testing extractAbsoluteLink', () => {
  it('returns absolute link if markdown has link', () => {
    const output = defaultPre.extractAbsoluteLink(
      '* [This is a link](otherfile.md)',
      requestMock,
      loggerMock,
    );

    assert.equal(output, 'https://www.project-helix.io/path/to/otherfile.html');
  });

  it('returns null if markdown has no link', () => {
    const output = defaultPre.extractAbsoluteLink(
      '* This is not (a link)',
      requestMock,
      loggerMock,
    );

    assert.equal(output, null);
  });
});

describe('Testing getParent', () => {
  it('returns parent path', () => {
    const output = defaultPre.getParent(
      requestMock.params.path,
      loggerMock,
    );

    assert.equal(output, '/path/to/');
  });

  it('returns null if no path specified', () => {
    assert.equal(defaultPre.getParent(
      null,
    ), null);
    assert.equal(defaultPre.getParent(
      {},
      loggerMock,
    ), null);
  });
});

describe('Testing createSitemap', () => {
  it('returns correct sitemap from markdown with links ', () => {
    const output = defaultPre.createSitemap(
      [
        '* [This is a link](file.md)',
        '* [This is a link](otherfile.md)',
        '* [This is a link](yet/another/file.md)',
        '* This is not (a link)',
      ].join('\n'),
      requestMock,
      loggerMock,
    );

    assert.deepEqual(output, [
      '<url><loc>https://www.project-helix.io/path/to/file.html</loc></url>',
      '<url><loc>https://www.project-helix.io/path/to/otherfile.html</loc></url>',
      '<url><loc>https://www.project-helix.io/path/to/yet/another/file.html</loc></url>',
    ]);
  });

  it('returns empty sitemap from markdown without links ', () => {
    const output = defaultPre.createSitemap(
      [
        '* This is not (a link)',
        '* Neither is this one',
        '* Nope',
      ].join('\n'),
      requestMock,
      loggerMock,
    );

    assert.deepEqual(output, []);
  });
});
