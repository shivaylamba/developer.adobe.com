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

describe('helix site smoke tests', function suite() {
  this.timeout(30000);

  it('should load homepage', async () => {
    await browser.url('/');

    const title = await browser.getTitle();
    assert.equal(title, 'Do More with Adobe');
  });
  it('should load xd docs substrain', async () => {
    await browser.url('/xd/docs');

    const title = await browser.getTitle();
    // TODO: this test should not assert based on document contents, see https://github.com/adobe/developer.adobe.com/issues/142
    assert.equal(title, 'An overview of creating Adobe XD plugins');
  });
});
