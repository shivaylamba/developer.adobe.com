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

// eslint-disable-next-line import/no-extraneous-dependencies, import/no-unresolved
const MediumUtil = require('./MediumUtil.js');

async function pre(context, action) {
  const { logger } = action;
  const { content } = context;
  content.mediumArticles = await MediumUtil.getPostsAsHTML('https://medium.com/feed/adobetech');
  logger.info(content.mediumArticles);
  return context;
}

module.exports.pre = pre;
module.exports.after = {
  html: () => ({ // this function also gets a context argument (if needed)
    response: {
      headers: {
        'Cache-Control': 'max-age=900',
      },
    },
  }),
};
