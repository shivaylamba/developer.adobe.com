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

/* eslint-disable no-param-reassign */

/**
* The 'pre' function that is executed before the HTML is rendered
 * @param payload The current payload of processing pipeline
 * @param payload.content The content
 */
function pre(payload, action) {
  payload.dispatch = {};

  // payload.dispatch.headers = action.headers;

  if (!payload.request.url) {
    payload.request.url = '/index.html';
  }

  console.log('request url', payload.request.url);
  console.log('request path', payload.request.path);
  console.log('action path', action.request.params.path);
  console.log('action rootPath', action.request.params.rootPath);
  console.log(payload.request.headers['x-strain']);

  if (!action.request.params.rootPath) {
    console.log('no root path');
    // home page
    payload.dispatch.url = payload.request.url.replace(/\.html/, '.default.html');
  } else if (action.request.params.rootPath.match('/docs')) {
    payload.dispatch.url = payload.request.path.replace(/\.html/, '.docs.html');
    console.log(payload.dispatch.url);
  } else {
    // TODO: Create new template for marketing pages
    // use homepage for now
    payload.dispatch.url = payload.request.url.replace(/\.html/, '.default.html');
  }
}

module.exports.pre = pre;
