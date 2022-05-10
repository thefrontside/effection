---
"@effection/inspect-ui": minor
"@effection/inspect-server": minor
---

`@effection/inspect-server` is now responsible for resolving the path of `@effection/inspect-ui/dist-app/index.html`.
This allows us to remove Node.js specific code from the `@effection/inspect-ui` package and make sure that exports only
include the code that will be used in the browser.
