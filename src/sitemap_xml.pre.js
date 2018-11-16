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

/**
 * Creates a sitemap from the MDAST and request path
 * @param {Object} mdast MDAST
 * @param {String} urlPrefix URL prefix to use
 * @param {Object} logger Logger
 */
function createSitemap(mdast, urlPrefix, logger) {
  logger.debug('sitemap_xml.pre.js - Creating sitemap');
  const sitemap = [];
  visit(mdast, null, (node) => {
    if (node.type === 'link' && node.url) {
      sitemap.push(`<url><loc>${urlPrefix}${node.url}</loc></url>`);
    }
  });
  return sitemap;
}

// module.exports.pre is a function (taking next as an argument)
// that returns a function (with payload, config, logger as arguments)
// that calls next (after modifying the payload a bit)
async function pre(payload, action) {
  const {
    logger,
  } = action;

  logger.debug(`sitemap_xml.pre.js - Requested path: ${action.request.params.path}`);

  try {
    if (!payload.content) {
      logger.debug('sitemap_xml.pre.js - Payload has no resource, nothing we can do');
      return payload;
    }

    const p = payload;
    const r = action.request;

    const urlPrefix = `https://${r.headers.host}${r.params.path.substring(0, r.params.path.lastIndexOf('/') + 1)}`;
    p.content.sitemap = createSitemap(p.content.mdast, urlPrefix, logger);

    return p;
  } catch (e) {
    logger.error(`sitemap_xml.pre.js - Error while executing pre.js: ${e.stack || e}`);
    return {
      error: e,
    };
  }
}

module.exports.pre = pre;
module.exports.createSitemap = createSitemap;
