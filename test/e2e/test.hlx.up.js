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
const { spawn } = require('child_process');
const { sleep } = require('./utils');

const HLX_SMOKE_EXEC = process.env.HLX_SMOKE_EXEC || 'hlx';
console.debug(`Running smoke test using: ${HLX_SMOKE_EXEC}`);

describe('local helix instance of site renders properly', function suite() {
  this.timeout(30000);

  let hlxup;

  before((done) => {
    hlxup = spawn(`${HLX_SMOKE_EXEC}`, ['up', '--open', 'false'], { shell: true });
    hlxup.stdout.on('data', (stdout) => {
      const msg = stdout.toString();
      if (msg.includes('Helix Dev server up and running')) {
        done();
      }
    });
    hlxup.stderr.on('data', (stderr) => {
      const msg = stderr.toString();
      assert.ok(!msg.includes('[hlx] error'), 'No helix error messages allowed!');
    });
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
