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
const $ = require('shelljs');

const { sleep } = require('./utils');

const HLX_SMOKE_EXEC = process.env.HLX_SMOKE_EXEC || 'hlx';
console.debug(`Running smoke test using: ${HLX_SMOKE_EXEC}`);

describe('local helix instance of site renders properly', function suite() {
  this.timeout(10000);

  let hlxup;

  before(async () => {
    // TODO: instead of callback for shelling out, can we have this use
    // async/await?
    hlxup = $.exec(`${HLX_SMOKE_EXEC} up --open false`, {
      async: true,
    }, (code, stdout) => {
      assert.ok(!stdout.includes('[hlx] error'), 'No error message allowed');
      assert.ok(!stdout.includes('[hlx] warn'), 'No warning message allowed');
    });

    // wait for server to properly start and hlx build to be completed
    // TODO: instead of sleep, lets inspect the stdout to ensure the server is
    // up and listening
    await sleep(5000);
  });

  after(async () => {
    hlxup.kill();
    hlxup = null;
    await sleep(1000);
    await browser.deleteSession();
  });
  it('should load homepage', async () => {
    await browser.url('/');

    const title = await browser.getTitle();
    assert.equal(title, 'Do More with Adobe', 'home page title matches expectation');
  });
  it('should load xd docs substrain', async () => {
    await browser.url('/xd/docs');

    const title = await browser.getTitle();
    // TODO: this test should not assert based on document contents, see https://github.com/adobe/developer.adobe.com/issues/142
    assert.equal(title, 'An overview of creating Adobe XD plugins', 'xd docs title matches expectation');
  });
});
