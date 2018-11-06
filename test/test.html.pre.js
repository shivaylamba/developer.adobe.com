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
const nock = require('nock');
const defaultPre = require('../src/html.pre.js');

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

describe('Testing removeFirstTitle', () => {
  it('Empty children', () => {
    const children = [];
    const output = defaultPre.removeFirstTitle(children, loggerMock);
    assert.deepEqual(output, []);
  });

  it('Remove first child', () => {
    const children = ['a', 'b', 'c'];
    const output = defaultPre.removeFirstTitle(children, loggerMock);
    assert.deepEqual(output, ['b', 'c']);
  });
});

describe('Testing fetchCommitsHistory', () => {
  it('Collect commits', async () => {
    const expectedCommits = {
      p1: 1,
      p2: 2,
    };
    nock('http://localhost').get('/repos/owner/repo/commits?path=resourcePath.md&sha=ref').reply(200, expectedCommits);

    const metadata =
      await defaultPre.fetchCommitsHistory('http://localhost/', 'owner', 'repo', 'ref', 'resourcePath.md', loggerMock);

    assert.deepEqual(metadata, expectedCommits);
  });
});

describe('Testing extractCommittersFromCommitsHistory', () => {
  it('Extract committers', () => {
    const output = defaultPre.extractCommittersFromCommitsHistory([{
      author: {
        avatar_url: 'a1_url',
      },
      commit: {
        author: {
          email: 'a1_email',
          name: 'a1',
        },
      },
    }, {
      author: {
        avatar_url: 'a2_url',
      },
      commit: {
        author: {
          email: 'a2_email',
          name: 'a2',
        },
      },
    }, {
      author: {
        avatar_url: 'a2_url',
      },
      commit: {
        author: {
          email: 'a2_email_different',
          name: 'a2_different',
        },
      },
    }], loggerMock);

    assert.deepEqual(output, [{
      avatar_url: 'a1_url',
      display: 'a1 | a1_email',
    }, {
      avatar_url: 'a2_url',
      display: 'a2 | a2_email',
    }]);
  });
});

describe('Testing extractLastModifiedFromCommitsHistory', () => {
  it('Extract last modified', () => {
    const output = defaultPre.extractLastModifiedFromCommitsHistory([{
      commit: {
        author: {
          name: 'a1',
          date: '01 Jan 2018 00:01:00 GMT',
        },
      },
    }, {
      author: {
        commit: {
          name: 'a2',
          date: '01 Jan 2018 00:00:00 GMT',
        },
      },
    }], loggerMock);

    assert.equal(output.raw, '01 Jan 2018 00:01:00 GMT');
  });
});

describe('Testing computeNavPath', () => {
  it('Compute dev nav path', () => {
    const output = defaultPre.computeNavPath(
      true,
      loggerMock,
    );

    assert.deepEqual(output, '/SUMMARY');
  });

  it('Compute prod nav path', () => {
    const output = defaultPre.computeNavPath(
      false,
      loggerMock,
    );

    assert.deepEqual(output, 'https://www.project-helix.io/SUMMARY');
  });
});

describe('Testing assembleEditUrl', () => {
  it('Assemble edit URL', () => {
    const output = defaultPre.assembleEditUrl(
      "test-owner",
      "test-repo",
      "test-branch",
      "/test-file.md",
      loggerMock,
    );

    assert.equal(output, 'https://github.com/test-owner/test-repo/edit/test-branch/test-file.md');
  });
});

describe('Testing createTOC', () => {
  it('Create 3-level TOC from HTML with various headings', () => {
    let childrenBefore = [
      '<h1>Heading 1</h1>',
      '<h2>Heading 2</h2>',
      '<p>Some text</p>',
      '<h3>Heading 3</h3>',
      '<h4>Heading 4</h4>'
    ];
    const childrenAfter = [
      '<h1 id="0_Heading%201">Heading 1</h1>',
      '<h2 id="1_Heading%202">Heading 2</h2>',
      '<p>Some text</p>',
      '<h3 id="3_Heading%203">Heading 3</h3>',
      '<h4>Heading 4</h4>'
    ];
    const expectedTOC = [
      '<li class="level-1"><a href="#0_Heading%201">Heading 1</a></li>',
      '<li class="level-2"><a href="#1_Heading%202">Heading 2</a></li>',
      '<li class="level-3"><a href="#3_Heading%203">Heading 3</a></li>'
    ];
    const output = defaultPre.createTOC(childrenBefore, 3, loggerMock);

    assert.deepEqual(output, expectedTOC);
    assert.deepEqual(childrenBefore, childrenAfter);
  });

  it('Create 2-level TOC from headings level 2 to 4', () => {
    let childrenBefore = [
      '<h2>Heading 2</h2>',
      '<p>Some text</p>',
      '<h3>Heading 3</h3>',
      '<h4>Heading 4</h4>'
    ];
    const childrenAfter = [
      '<h2 id="0_Heading%202">Heading 2</h2>',
      '<p>Some text</p>',
      '<h3>Heading 3</h3>',
      '<h4>Heading 4</h4>'
    ];
    const expectedTOC = [
      '<li class="level-2"><a href="#0_Heading%202">Heading 2</a></li>'
    ];

    const output = defaultPre.createTOC(childrenBefore, 2, loggerMock);

    assert.deepEqual(output, expectedTOC);
    assert.deepEqual(childrenBefore, childrenAfter);
  });

  it('Create TOC from HTML without headings', () => {
    let childrenBefore = [
      '<p>Some text</p>',
      '<p>Some more text</p>',
      '<p>Even more text</p>'
    ];
    const childrenAfter = [
      '<p>Some text</p>',
      '<p>Some more text</p>',
      '<p>Even more text</p>'
    ];
    const expectedTOC = [];

    const output = defaultPre.createTOC(childrenBefore, 3, loggerMock);

    assert.deepEqual(output, expectedTOC);
    assert.deepEqual(childrenBefore, childrenAfter);
  });

  it('Create TOC from null and empty array', () => {

    // null check
    const nullOutput = defaultPre.createTOC(null, 3, loggerMock);

    assert.equal(nullOutput, null);

    // empty array check
    let childrenBefore = [];
    const childrenAfter = [];
    const expectedTOC = [];

    const emptyOutput = defaultPre.createTOC(childrenBefore, 3, loggerMock);

    assert.deepEqual(emptyOutput, expectedTOC);
    assert.deepEqual(childrenBefore, childrenAfter);
  });
});
