---
"@effection/atom": patch
"@effection/channel": patch
"@effection/core": patch
"effection": patch
"@effection/events": patch
"@effection/fetch": patch
"@effection/inspect": patch
"@effection/inspect-server": patch
"@effection/inspect-utils": patch
"@effection/inspect-ui": patch
"@effection/main": patch
"@effection/mocha": patch
"@effection/node": patch
"@effection/process": patch
"@effection/react": patch
"@effection/subscription": patch
"@effection/websocket-client": patch
"@effection/websocket-server": patch
---

The `dist` directory didn't contain the `esm` and `cjs` directory. We copy the `package.json` for reference into the dist, and this broke the `files` resolution. Switch to using `dist-cjs` and `dist-esm` which allows us to avoid copying `package.json`.
