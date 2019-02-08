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

const { assertHttp, sleep } = require('./utils');

const HLX_SMOKE_EXEC = process.env.HLX_SMOKE_EXEC || 'hlx';
console.debug(`Running smoke test using: ${HLX_SMOKE_EXEC}`);

describe('local helix instance of site renders properly', function suite() {
  this.timeout(10000);

  let hlxup;

  before(async () => {
    hlxup = $.exec(`${HLX_SMOKE_EXEC} up --open false`, {
      async: true,
    }, (code, stdout) => {
      assert.ok(!stdout.includes('[hlx] error'), 'No error message allowed');
      assert.ok(!stdout.includes('[hlx] warn'), 'No warning message allowed');
    });

    // wait for server to properly start and hlx build to be completed
    await sleep(5000);
  });

  after(async () => {
    hlxup.kill();
    hlxup = null;
    await sleep(1000);
  });

  it('Root ("/" / index.html) is rendered using project htl scripts', async () => {
    // test for root request
    const html = (await assertHttp('http://localhost:3000', 200)).toLowerCase();

    console.log(html);
    assert.ok(html.includes('<body class="spectrum spectrum--light spectrum-typography">'), 'index page is rendered - at least contains a body tag');
    assert.ok(html.includes('<div class="container spectrum-grid-row'), 'default content in index (default_html.htl) is included via ESI include');
  });

  it('Test various urls', async () => {
    let html = (await assertHttp('http://localhost:3000/launch/docs', 200)).toLowerCase();
    assert.ok(html.includes('<body class="spectrum spectrum--light spectrum-typography">'), '/launch/docs page is rendered - at least contains a body tag');

    const dochtml = (await assertHttp('http://localhost:3000/launch/docs/README.html', 200)).toLowerCase();
    assert.ok(html.includes('<body class="spectrum spectrum--light spectrum-typography">'), '/launch/docs/README.html page is rendered - at least contains a body tag');
    assert.equal(html, dochtml, '/launch/docs and /launch/docs/README.html are the same');

    html = (await assertHttp('http://localhost:3000/launch/docs/getting-started/README.html', 200)).toLowerCase();
    assert.ok(html.includes('<body class="spectrum spectrum--light spectrum-typography">'), '/launch/docs/getting-started/README.html page is rendered - at least contains a body tag');

    // TODO enable when author branch will be created in AdobeXD/plugin-docs
    // html = (await assertHttp('http://localhost:3000/xd', 200)).toLowerCase();
    // assert.ok(
    //   html.includes('<body class="spectrum spectrum--light spectrum-Typography">'),
    //   '/xd page is rendered - at least contains a body tag',
    // );
  });
});
