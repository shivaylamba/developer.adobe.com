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
const visit = require('unist-util-visit');
const uri = require('uri-js');

/**
 * Assembles a URL prefix based on the request
 * @param {Object} Request object
 */
function assembleUrlPrefix({ headers, params }) {
  const parent = params.path.substring(0, params.path.lastIndexOf('/') + 1);
  return `https://${headers.host}${parent}`;
}

/**
 * Creates a sitemap from the MDAST and request path
 * @param {Object} mdast MDAST
 * @param {String} urlPrefix URL prefix to use
 * @param {String} extension File extension to use (default: html)
 * @param {Object} logger Logger
 */
function createSitemap(mdast, urlPrefix, extension, logger) {
  logger.debug('Creating sitemap');
  const sitemap = {
    urlset: {
      url: [],
    },
  };
  visit(mdast, null, (node) => {
    if (node.type === 'link' && node.url) {
      const parts = uri.parse(node.url);
      if (!parts.scheme && !parts.host) {
        const path = parts.path.replace(/\.md$/i, `.${extension || 'html'}`);
        sitemap.urlset.url.push({
          loc: `${urlPrefix}${path}`,
          // lastmod,
          // changefreq,
        });
      }
    }
  });
  return sitemap;
}

// main function
async function main({ content, response = {} }, { logger, request }) {
  const c = content;
  // create sitemap xml
  const prefix = assembleUrlPrefix(request);
  c.xml = createSitemap(content.mdast, prefix, request.extension, logger);

  return {
    content: c,
    response,
  };
}

module.exports.main = main;
module.exports.createSitemap = createSitemap;
