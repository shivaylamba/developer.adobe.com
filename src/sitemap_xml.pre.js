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

/**
 * Returns the path to the parent directory.
 * @param {String} path Request path
 * @return {String} Parent path (or null if no request path provided)
 */
function getParent(path) {
  return path && typeof path === 'string' ? `${path.substring(0, path.lastIndexOf('/') + 1)}` : null;
}

/**
 * Extracts a link from Markdown and makes it absolute.
 * @param {String} md Markdown
 * @param {Object} request Request
 * @param {Object} logger Logger
 * @return {String} Absolute link (or null if no link or request parameters found)
 */
function extractAbsoluteLink(md, request, logger) {
  if (!md || typeof md !== 'string') {
    logger.error('sitemap_xml.pre.js - missing markdown');
    return null;
  }
  if (!request || typeof request !== 'object') {
    logger.error('sitemap_xml.pre.js - missing request');
    return null;
  }
  // extract link from markdown
  const match = /\[.*\]\((.*)\)/g.exec(md);
  if (match && match.length === 2) {
    const link = match[1].replace(/\.md/g, '.html');
    return `https://${request.headers.host}${getParent(request.params.path)}${link}`;
  }
  return null;
}

/**
 * Creates a sitemap from the markdown and request path
 * @param {Array} md Markdown
 * @param {Object} request Request
 * @param {Object} logger Logger
 */
function createSitemap(md, request, logger) {
  logger.debug('sitemap_xml.pre.js - Creating sitemap');
  const sitemap = [];
  const rows = md.split('\n');
  rows.forEach((row) => {
    const link = extractAbsoluteLink(row, request, logger);
    if (link) {
      sitemap.push(`<url><loc>${link}</loc></url>`);
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

    p.content.sitemap = createSitemap(p.content.body, action.request, logger);

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
module.exports.extractAbsoluteLink = extractAbsoluteLink;
module.exports.getParent = getParent;
