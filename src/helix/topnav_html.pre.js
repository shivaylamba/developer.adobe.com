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

// module.exports.pre is a function (taking next as an argument)
// that returns a function (with context, config, logger as arguments)
// that calls next (after modifying the context a bit)
async function pre(context, action) {
  const { logger } = action;
  logger.info('topnav pre.js');
  return context;
}

module.exports.pre = pre;
