/* eslint-disable @typescript-eslint/no-var-requires */

const { existsSync } = require('fs');
const { join } = require('path');
const { strict: assert } = require('assert');

module.exports = {
  appDir() {
    let path = join(__dirname, 'dist-app');
    let index = join(path, "index.html");
    assert(existsSync(index), `the @effection/inspect-ui app has gone missing!
Expected ${index} to exist, but it did not.

Either the @effection/inspect-ui package is corrupted, or your are in development mode and haven't built it yet.`);
    return path;
  }
};
