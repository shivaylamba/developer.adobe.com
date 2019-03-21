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
const blc = require('broken-link-checker');
const request = require('request');
const jsdom = require('jsdom');

const { JSDOM } = jsdom;

const AUTHOR = 'adobeio-prod.adobemsbasic.com';
let links = 0;
let broken = 0;
let badEnv = 0;
const notFoundCache = {};
const badEnvCache = {};
const url = process.argv && process.argv[2] ? process.argv[2] : 'https://adobedevsite.helix-demo.xyz';

// When we find a bad URL, record it and update our stats
function bomb(resp, result) {
  const key = `${result.url.resolved}|${result.base.resolved}`;
  if (!notFoundCache[key]) {
    notFoundCache[key] = true;
    broken += 1;
    console.error('☠️ ', resp.statusCode || 'err', result.url.resolved, 'via', result.base.resolved);
  }
}
//
function waitForKirby(virtualConsole, dom) {
  return new Promise((resolve, reject) => {
    virtualConsole.on('log', (log1, log2) => {
      if (log1 === 'Getting remote content from' && log2.includes('404.md')) {
        reject(dom);
      } else if (log1 === 'Getting remote content from' && !log2.includes('404.md')) {
        resolve(dom);
      }
    });
  });
}
const siteChecker = new blc.SiteChecker({
  excludedKeywords: ['medium.com', 'www.adobe.com', 'github.com', AUTHOR],
  excludeExternal: true,
  excludeLinksToSamePage: false,
  filterLevel: 0,
  honorRobotExclusions: false,
  maxSocketsPerHost: 10,
}, {
  // robots(robots, customData) {},
  // html(tree, robots, response, pageUrl, customData) {},
  junk(result) {
    if (!result.url.resolved) return;
    if (result.url.resolved.includes(AUTHOR) && !result.base.resolved.includes(AUTHOR)) {
      const key = `${result.url.resolved}|${result.base.resolved}`;
      if (!badEnvCache[key]) {
        badEnv += 1;
        badEnvCache[key] = true;
        console.error('🙅‍♀️', result.url.resolved, 'via', result.base.resolved);
      }
    }
  },
  link(result) {
    links += 1;
    if (result.broken) {
      // Double check the broken result by issuing an extra HEAD request, just
      // to be sure.
      request.head({
        url: result.url.resolved,
        headers: {
          Accept: '*/*',
        },
      }, (error, response) => {
        if (error) bomb(error, result);
        else if (response.statusCode > 399) bomb(response, result);
      });
    } else if (result.url.resolved.includes('#!')) {
      // We may get a false negative for links containing the hash bang, which
      // we use to identify kirby links
      // For these, we load the page into jsdom, wait for the page to finish
      // loading and then pull out the <title>, and if it says 'Page not found'
      // then we found a bad Kirby link!
      const virtualConsole = new jsdom.VirtualConsole();
      JSDOM.fromURL(result.url.resolved, {
        virtualConsole,
        runScripts: 'dangerously',
        resources: 'usable',
      }).then(dom => waitForKirby(virtualConsole, dom)).then((dom) => {
        dom.window.close();
      }).catch((dom) => {
        bomb({ statusCode: 'Kirby 404' }, result);
        dom.window.close();
      });
    }
  },
  page(error, pageUrl) {
    if (error) {
      console.log(`❗️ ${pageUrl} parsed with error! ${JSON.stringify(error)}`);
    }
  },
  // site(error, siteUrl) { console.log('site done', siteUrl, 'error?', error); },
  end() {
    console.log(`${url} crawled, ${broken} broken links and ${badEnv} wrong environment links identified out of ${links} links total.`);
    process.exit(broken);
  },
});
siteChecker.enqueue(url);
