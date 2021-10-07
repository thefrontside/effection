# @effection/atom

## \[2.0.0-beta.21]

- Yielding to something which is not an operation no longer throws an internal error, but properly rejects the task.
  - Bumped due to a bump in @effection/core.
  - [a3ad19a](https://github.com/thefrontside/effection/commit/a3ad19a3177a731fee5cd2389ab898dee7b1788e) Fix yielding non operation bug on 2021-10-07

## \[2.0.0-beta.20]

- Fix a bug when using blockParent where the children are not getting halt on an explicit halt.
  - Bumped due to a bump in @effection/core.
  - [1cd9803](https://github.com/thefrontside/effection/commit/1cd98033d2641989114f9589c7d887954fa66781) Fix halting children for blockParent tasks on 2021-09-30

## \[2.0.0-beta.19]

- Add Stream `toBuffer` and Stream `buffered` so we have both options on either accessing the buffer directly or returning the stream.
  - Bumped due to a bump in @effection/stream.
  - [fe60532](https://github.com/thefrontside/effection/commit/fe60532c3f8cfdd8b53c324b7ea8e38e437f080f) Add both toBuffer and buffered to Stream on 2021-09-30

## \[2.0.0-beta.18]

- Stream `buffer` returns the actual buffer and gives direct access to it
  - Bumped due to a bump in @effection/stream.
  - [07c8f83](https://github.com/thefrontside/effection/commit/07c8f83b5968f347ca72795c447be411e66274ed) Stream `buffer` returns the actual buffer on 2021-09-30

## \[2.0.0-beta.17]

- - [0248d79](https://github.com/thefrontside/effection/commit/0248d79a33dcfc4200b0832aba975c9cad08981e) Add package readmes on 2021-09-28
- Split off `Stream` from subscription package into its own `@effection/stream` package
  - [248de1d](https://github.com/thefrontside/effection/commit/248de1dd31d172762d9601a2b5acd983dce61ab0) Split `Stream` into its own package on 2021-09-27

## \[2.0.0-beta.16]

- Remove deprecated `once` from atom
  - [9bfb22d](https://github.com/thefrontside/effection/commit/9bfb22dfb9e52697678e7af8a78308232cc9a441) Remove deprecated `once` from atom on 2021-09-08

## \[2.0.0-beta.15]

- Add shortcuts to create resolved/rejected/halted futures via Future.resolve(123), etc...
  - Bumped due to a bump in @effection/core.
  - [9599dde](https://github.com/thefrontside/effection/commit/9599dde14e9bc3ba4ac7ea473e8624164727be0c) Add shortcuts for resolves/rejected/halted future on 2021-09-08

## \[2.0.0-beta.14]

- Add labels for atom streams
  - [d6cbbf4](https://github.com/thefrontside/effection/commit/d6cbbf4efed3c3c6b7e08a4c9c220eabd7630277) Add labels for atom streams on 2021-09-06

## \[2.0.0-beta.13]

- Allow channels to be named so their internal stream gets named
  - Bumped due to a bump in @effection/channel.
  - [c52018a](https://github.com/thefrontside/effection/commit/c52018a1035d551cef76a757d1dc29781b59c851) Allow channels to be named on 2021-08-27

## \[2.0.0-beta.12]

- Update core dependency
  - Bumped due to a bump in @effection/mocha.
  - [d92eee5](https://github.com/thefrontside/effection/commit/d92eee594fdb8dc6d8ab6a37b6aa362122e63f6e) Update core dependency on 2021-08-16

## \[2.0.0-beta.11]

- Use Object.create to wrap error objects rather than copying properties
  - Bumped due to a bump in @effection/core.
  - [a56ae2a](https://github.com/thefrontside/effection/commit/a56ae2af8a6247697b8b6253bd35b6d9e569613d) Use Object.create to create error object with trace on 2021-08-16

## \[2.0.0-beta.10]

- add `Task#spawn` operation to spawn new task with a specific scope
  - Bumped due to a bump in @effection/core.
  - [a71d65b](https://github.com/thefrontside/effection/commit/a71d65b77df5c337a78b7934edd181080eacf5bf) Add changefile on 2021-07-27

## \[2.0.0-beta.9]

- Add sideEffects field to package.json
  - [383141d](https://github.com/thefrontside/effection/commit/383141dc556c6a781d98087f3b68085d5eb31173) Add sideEffects field to package.json ([#470](https://github.com/thefrontside/effection/pull/470)) on 2021-08-05

## \[2.0.0-beta.8]

- The `dist` directory didn't contain the `esm` and `cjs` directory. We copy the `package.json` for reference into the dist, and this broke the `files` resolution. Switch to using `dist-cjs` and `dist-esm` which allows us to avoid copying `package.json`.
  - [63fbcfb](https://github.com/thefrontside/effection/commit/63fbcfb8151bb7434f1cb8c58bfed25012ad2727) fix: @effection/core to ship dist/esm and dist/cjs on 2021-08-03
  - [7788e24](https://github.com/thefrontside/effection/commit/7788e2408bcff8180b24ce497043283c97b6dbaa) fix: @effection/core to ship dist-esm and dist-cjs on 2021-08-03
  - [6923a0f](https://github.com/thefrontside/effection/commit/6923a0fa1a84cd0788f8c9c1600ccf7539b08bbf) update change file with everything patched on 2021-08-03

## \[2.0.0-beta.7]

- Add esm builds
  - Bumped due to a bump in @effection/core.
  - [6660a46](https://github.com/thefrontside/effection/commit/6660a466a50c9b9c36829c2d52448ebbc0e7e6fb) Add esm build ([#462](https://github.com/thefrontside/effection/pull/462)) on 2021-08-03

## \[2.0.0-beta.6]

- remove accidentally compiled .js files from distributed sources
  - Bumped due to a bump in @effection/mocha.
  - [f0f0023](https://github.com/thefrontside/effection/commit/f0f002354743ae6d6f69bfe6df28ddc11d0f8be0) add changefile on 2021-07-26

## \[2.0.0-beta.5]

- Upgrade typescript to 4.3.5 and replace tsdx with tsc
  - [121bd40](https://github.com/thefrontside/effection/commit/121bd40e17609a82bce649c5fed34ee0754681b7) Add change file for typescript bump on 2021-07-23

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies \[e297c86]
  - @effection/core@2.0.0-beta.4
  - @effection/channel@2.0.0-beta.4
  - @effection/subscription@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies \[3e77f29]
- Updated dependencies \[5d95e6d]
- Updated dependencies \[9700b45]
- Updated dependencies \[9700b45]
  - @effection/subscription@2.0.0-beta.3
  - @effection/core@2.0.0-beta.3
  - @effection/channel@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies \[19414f0]
- Updated dependencies \[26a86cb]
- Updated dependencies \[9c76cc5]
- Updated dependencies \[f7e3344]
- Updated dependencies \[ac7c1ce]
  - @effection/core@2.0.0-beta.2
  - @effection/channel@2.0.0-beta.2
  - @effection/subscription@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- 0c6e263: release 2.0.0-beta
- Updated dependencies \[0c6e263]
  - @effection/channel@2.0.0-beta.1
  - @effection/core@2.0.0-beta.1
  - @effection/subscription@2.0.0-beta.1

## 2.0.0-preview.15

### Patch Changes

- Updated dependencies \[9998088]
- Updated dependencies \[2bce454]
- Updated dependencies \[1981b35]
- Updated dependencies \[88dc59a]
  - @effection/core@2.0.0-preview.12
  - @effection/channel@2.0.0-preview.15
  - @effection/subscription@2.0.0-preview.14

## 2.0.0-preview.14

### Patch Changes

- b46434a: Use the generic monocle-ts import and not the commonjs import
- Updated dependencies \[88eca21]
- Updated dependencies \[ae8d090]
- Updated dependencies \[8bb4514]
- Updated dependencies \[44c354d]
  - @effection/core@2.0.0-preview.11
  - @effection/channel@2.0.0-preview.14
  - @effection/subscription@2.0.0-preview.13

## 2.0.0-preview.13

### Patch Changes

- a7d24eb: Lock dependency versions

## 2.0.0-preview.12

### Patch Changes

- Updated dependencies \[625b521]
- Updated dependencies \[a06c679]
- Updated dependencies \[4d04159]
- Updated dependencies \[625b521]
  - @effection/core@2.0.0-preview.10
  - @effection/channel@2.0.0-preview.13
  - @effection/subscription@2.0.0-preview.12

## 2.0.0-preview.11

### Patch Changes

- Updated dependencies \[92f921e]
  - @effection/subscription@2.0.0-preview.11
  - @effection/channel@2.0.0-preview.12

## 2.0.0-preview.10

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
  - @effection/channel@2.0.0-preview.11
  - @effection/subscription@2.0.0-preview.10

## 2.0.0-preview.9

### Patch Changes

- Updated dependencies \[a13987f]
  - @effection/core@2.0.0-preview.8
  - @effection/subscription@2.0.0-preview.9
  - @effection/channel@2.0.0-preview.10

## 2.0.0-preview.8

### Patch Changes

- 91ade6c: Add missing dependency on @effection/channel which could cause incorrect module resolution
- Updated dependencies \[91ade6c]
  - @effection/channel@2.0.0-preview.9

## 2.0.0-preview.7

### Patch Changes

- Updated dependencies \[2bad074]
  - @effection/core@2.0.0-preview.7
  - @effection/subscription@2.0.0-preview.8

## 2.0.0-preview.6

### Patch Changes

- 9a6a6e3: Make atom more reentrant
- Updated dependencies \[3db7270]
  - @effection/subscription@2.0.0-preview.7

## 2.0.0-preview.5

### Patch Changes

- 6a0f093: subscribing to an atom now always includes its current state as the
  first item in the stream. Depreacet the `once()` method as it is now
  redundant with `filter().expect()`

## 2.0.0-preview.4

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode
- Updated dependencies \[0dca571]
- Updated dependencies \[1222756]
  - @effection/subscription@2.0.0-preview.6
  - @effection/core@2.0.0-preview.6

## 2.0.0-preview.3

### Major Changes

- Import from bigtest
