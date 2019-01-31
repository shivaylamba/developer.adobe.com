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
* The 'pre' function that is executed before the HTML is rendered
 * @param payload The current payload of processing pipeline
 * @param payload.content The content
 */

function pre(payload) {
  console.log(payload.request);
  payload.dispatch = {};
<<<<<<< HEAD

  if (!payload.request.url){
    payload.request.url = "/index.html";
  }

  if (payload.request.url.indexOf('/docs') !== -1) {
    payload.dispatch.url = payload.request.url.replace(/\.html/, '.docs.html');
  }
  else {
    payload.dispatch.url = payload.request.url.replace(/\.html/, '.default.html');
  }

=======
  console.log(payload.request.url);
  if (payload.request.url){
    if (payload.request.url.indexOf('/docs') !== -1) {
      payload.dispatch.url = payload.request.url.replace(/\.html/, '.docs.html');
      return;
    }
  }
  payload.dispatch.url = '/index.homepage.html';
>>>>>>> test 11
}

module.exports.pre = pre;
