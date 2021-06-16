/* eslint-disable @typescript-eslint/no-var-requires */

const { existsSync } = require('fs');
const { join } = require('path');
const { strict: assert } = require('assert');

module.exports = {
  appDir() {
    let path = join(__dirname, 'dist');
    assert(existsSync(join(path, "index.html")), "the @effection/debug-ui app has gone missing! Either the package is malformed, or you're in development mode and haven't built it yet.");
    return path;
  }
};
