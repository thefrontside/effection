---
"effection": patch
"@effection/events": patch
"@effection/node": patch
---

## Fix sourcemaps and types entrypoint

We saw strange errors while installing Effection from BigTest. One of the problems was that sourcemaps were not working. This was happening because sourcemaps referenced ts file which were not being included in the package.

https://github.com/thefrontside/effection/pull/119

## Distribute node packages without transpiling generators 

We made a decision to ship generators in our distribution bundles because IE11 compatibility is not important to us. It's surprisingly difficult to get this to work. We tried using microbundle but that turned out to be even more complicated because their [modern and cjs formats have mutually conflicting configuration](https://github.com/developit/microbundle/issues/618).

https://github.com/thefrontside/effection/pull/120