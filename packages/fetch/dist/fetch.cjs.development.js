'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var nativeFetch = require('node-fetch');
var nativeFetch__default = _interopDefault(nativeFetch);
var abortController = require('abort-controller');

function* fetch(resource, init = {}) {
  let controller = new abortController.AbortController();
  init.signal = controller.signal;

  try {
    return yield nativeFetch__default(resource, init);
  } finally {
    controller.abort();
  }
}

Object.defineProperty(exports, 'Response', {
  enumerable: true,
  get: function () {
    return nativeFetch.Response;
  }
});
Object.defineProperty(exports, 'AbortController', {
  enumerable: true,
  get: function () {
    return abortController.AbortController;
  }
});
exports.fetch = fetch;
//# sourceMappingURL=fetch.cjs.development.js.map
