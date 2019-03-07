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

describe('aem site smoke tests', function suite() {
  this.timeout(30000);

  describe('homepage', () => {
    it('should have "Adobe I/O" in the title, adobe logo visible and an APIs link is visible in the viewport', async () => {
      await browser.url('/');

      // Wait until the adobe logo in the top right is visible
      await browser.waitUntil(async () => {
        const logo = await browser.$('.Gnav-logo-image');
        const logoExists = await logo.isExisting();
        const apisLink = await browser.$('a[href="https://adobe.io/apis.html"]');
        const linkExists = await apisLink.isExisting();
        return logoExists && linkExists;
      }, 10000, 'expected adobe logo and api link to exist after 10 seconds', 2000);

      const title = await browser.getTitle();
      assert.equal(title, 'Adobe I/O');

      const heroTextElement = await browser.$('.cmp-text h1');
      const heroText = await heroTextElement.getText();
      assert(heroText.indexOf('Adobe developers') > -1, 'hero text does not mention adobe developers');
    });
  });
});
