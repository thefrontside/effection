# @effection/mocha

## \[2.0.0-beta.11]

- Add shortcuts to create resolved/rejected/halted futures via Future.resolve(123), etc...
  - Bumped due to a bump in @effection/core.
  - [9599dde](https://github.com/thefrontside/effection/commit/9599dde14e9bc3ba4ac7ea473e8624164727be0c) Add shortcuts for resolves/rejected/halted future on 2021-09-08

## \[2.0.0-beta.10]

- Fix dependency versions
  - [5054ac0](https://github.com/thefrontside/effection/commit/5054ac0f10970bb5654e05545375c5349f18d43a) Add changeset on 2021-09-07

## \[2.0.0-beta.9]

- Update core dependency
  - [d92eee5](https://github.com/thefrontside/effection/commit/d92eee594fdb8dc6d8ab6a37b6aa362122e63f6e) Update core dependency on 2021-08-16

## \[2.0.0-beta.8]

- Add sideEffects field to package.json
  - [383141d](https://github.com/thefrontside/effection/commit/383141dc556c6a781d98087f3b68085d5eb31173) Add sideEffects field to package.json ([#470](https://github.com/thefrontside/effection/pull/470)) on 2021-08-05

## \[2.0.0-beta.7]

- The `dist` directory didn't contain the `esm` and `cjs` directory. We copy the `package.json` for reference into the dist, and this broke the `files` resolution. Switch to using `dist-cjs` and `dist-esm` which allows us to avoid copying `package.json`.
  - [63fbcfb](https://github.com/thefrontside/effection/commit/63fbcfb8151bb7434f1cb8c58bfed25012ad2727) fix: @effection/core to ship dist/esm and dist/cjs on 2021-08-03
  - [7788e24](https://github.com/thefrontside/effection/commit/7788e2408bcff8180b24ce497043283c97b6dbaa) fix: @effection/core to ship dist-esm and dist-cjs on 2021-08-03
  - [6923a0f](https://github.com/thefrontside/effection/commit/6923a0fa1a84cd0788f8c9c1600ccf7539b08bbf) update change file with everything patched on 2021-08-03

## \[2.0.0-beta.6]

- remove accidentally compiled .js files from distributed sources
  - [f0f0023](https://github.com/thefrontside/effection/commit/f0f002354743ae6d6f69bfe6df28ddc11d0f8be0) add changefile on 2021-07-26

## \[2.0.0-beta.5]

- Upgrade typescript to 4.3.5 and replace tsdx with tsc
  - [121bd40](https://github.com/thefrontside/effection/commit/121bd40e17609a82bce649c5fed34ee0754681b7) Add change file for typescript bump on 2021-07-23

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies \[e297c86]
  - @effection/core@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies \[5d95e6d]
- Updated dependencies \[9700b45]
  - @effection/core@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies \[19414f0]
- Updated dependencies \[26a86cb]
- Updated dependencies \[9c76cc5]
- Updated dependencies \[f7e3344]
- Updated dependencies \[ac7c1ce]
  - @effection/core@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- 0c6e263: release 2.0.0-beta
- Updated dependencies \[0c6e263]
  - @effection/core@2.0.0-beta.1

## 2.0.0-preview.13

### Patch Changes

- Updated dependencies \[9998088]
- Updated dependencies \[2bce454]
- Updated dependencies \[1981b35]
- Updated dependencies \[88dc59a]
  - @effection/core@2.0.0-preview.12

## 2.0.0-preview.12

### Patch Changes

- Updated dependencies \[88eca21]
- Updated dependencies \[ae8d090]
- Updated dependencies \[8bb4514]
- Updated dependencies \[44c354d]
  - @effection/core@2.0.0-preview.11

## 2.0.0-preview.11

### Patch Changes

- Updated dependencies \[625b521]
- Updated dependencies \[a06c679]
- Updated dependencies \[4d04159]
- Updated dependencies \[625b521]
  - @effection/core@2.0.0-preview.10

## 2.0.0-preview.10

### Minor Changes

- be759c1: Add support for resources

## 2.0.0-preview.9

### Patch Changes

- Updated dependencies \[110a2cd]
- Updated dependencies \[e2545b2]
- Updated dependencies \[2b92370]
- Updated dependencies \[00562fd]
- Updated dependencies \[110a2cd]
- Updated dependencies \[110a2cd]
- Updated dependencies \[02446ad]
- Updated dependencies \[da86a9c]
  - @effection/core@2.0.0-preview.9

## 2.0.0-preview.8

### Patch Changes

- 91f7f6b: Allow "pending" it blocks that don't yet have a body. E.g.
  `it('will do this')`;
- Updated dependencies \[a13987f]
  - @effection/core@2.0.0-preview.8

## 2.0.0-preview.7

### Patch Changes

- 81a2101: Add `it.only()` and `it.skip()` methods

## 2.0.0-preview.6

### Patch Changes

- Updated dependencies \[2bad074]
  - @effection/core@2.0.0-preview.7

## 2.0.0-preview.5

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode
- Updated dependencies \[1222756]
  - @effection/core@2.0.0-preview.6

## 2.0.0-preview.4

### Minor Changes

- 395cb3e: Add it.only and it.skip

### Patch Changes

- Updated dependencies \[70c358f]
  - @effection/core@2.0.0-preview.5

## 2.0.0-preview.3

### Patch Changes

- c91a177: remove hard dependency on `mocha` and use a peer dependency instead
- Updated dependencies \[72f743c]
  - @effection/core@2.0.0-preview.4
