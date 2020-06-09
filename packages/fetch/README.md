# @effection/fetch

Use `fetch` as an effection operation.

## Synopsis

This implements the `fetch` api exactly as it appears in the JavaScript spec. However, an abort signal is automatically connected to the underlying call so that whenever the `fetch` operation passes out of scope, it is automatically cancelled. That way, it is impossible to leave an http request dangling.

``` js
let response = yield fetch('https://bigtestjs.io');
```
