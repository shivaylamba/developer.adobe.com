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

const { spawn } = require('child_process');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run `npm start` and dont start the tests until the dev server is up and running
function startAndWaitForHlxUp(hlx) {
  return new Promise((resolve) => {
    /* eslint-disable no-param-reassign */
    hlx.process = spawn('npm start', ['--', '--open', 'false'], { shell: true });
    hlx.process.stdout.on('data', (stdout) => {
      const msg = stdout.toString();
      if (msg.includes('[hlx]') && msg.includes('error')) console.error(msg);
      if (msg.includes('Helix Dev server up and running')) resolve();
    });
    hlx.process.stderr.on('data', (stderr) => {
      console.error(stderr.toString());
    });
  });
}

module.exports.sleep = sleep;
module.exports.startAndWaitForHlxUp = startAndWaitForHlxUp;
