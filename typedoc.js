// eslint-disable-next-line @typescript-eslint/no-var-requires
const Handlebars = require('handlebars');

const BASE_URL="https://frontside.com/effection/api/"; // for css

Handlebars.registerHelper('relativeURL', function(url) {
  return BASE_URL + url;
});

module.exports = {
  "name": "effection",
  "out": "docs/api/v2",
  "hideGenerator": true,
  "readme": "API.md",
  "customCss": "typedoc.css",
  "name": "Effection API Reference",
  "entryPointStrategy": "packages",
  "entryPoints": [
    "packages/atom",
    "packages/effection",
    "packages/fetch",
    "packages/mocha",
    "packages/process",
    "packages/react",
    "packages/websocket-client",
    "packages/websocket-server"
  ]
};
