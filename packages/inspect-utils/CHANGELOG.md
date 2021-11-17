# @effection/inspect-utils

## \[2.1.1]

- Add missing dependency on @effection/dispatch
  - [90ca47d](https://github.com/thefrontside/effection/commit/90ca47d73e1d49826aa0248082689a3501d2aac0) Add dependency on dispatch on 2021-11-16

## \[2.1.0]

- Improve the internal communication protocol of the inspector for better efficiency
  - [eec3b77](https://github.com/thefrontside/effection/commit/eec3b77f0d252507d8e432dfab6bb6ce5f94db6b) Rewrite and improve inspector protocol on 2021-10-21
- Redesign inspector with a fresh new design and added functionality, including navigation, settings and stack traces
  - [f1ca2ed](https://github.com/thefrontside/effection/commit/f1ca2edecd3a22bbc9c40fc35d7f9908587d8ddf) Add changeset on 2021-11-08

## \[2.0.1]

- workaround borked 2.0 release https://status.npmjs.org/incidents/wy4002vc8ryc
  - Bumped due to a bump in effection.
  - [97711a7](https://github.com/thefrontside/effection/commit/97711a77419c8e539bff3060a9f3c1bae947f9b8) Work around borked NPM release on 2021-10-12

## \[2.0.0]

- Release Effection 2.0.0
  - [8bd89ad](https://github.com/thefrontside/effection/commit/8bd89ad40e42805ab6da0fd1b7a49beed9769865) Add 2.0 changeset on %as

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
  - Bumped due to a bump in @effection/channel.
  - [fe60532](https://github.com/thefrontside/effection/commit/fe60532c3f8cfdd8b53c324b7ea8e38e437f080f) Add both toBuffer and buffered to Stream on 2021-09-30

## \[2.0.0-beta.18]

- Stream `buffer` returns the actual buffer and gives direct access to it
  - Bumped due to a bump in @effection/channel.
  - [07c8f83](https://github.com/thefrontside/effection/commit/07c8f83b5968f347ca72795c447be411e66274ed) Stream `buffer` returns the actual buffer on 2021-09-30

## \[2.0.0-beta.17]

- - [0248d79](https://github.com/thefrontside/effection/commit/0248d79a33dcfc4200b0832aba975c9cad08981e) Add package readmes on 2021-09-28

## \[2.0.0-beta.16]

- Remove deprecated `once` from atom
  - Bumped due to a bump in @effection/atom.
  - [9bfb22d](https://github.com/thefrontside/effection/commit/9bfb22dfb9e52697678e7af8a78308232cc9a441) Remove deprecated `once` from atom on 2021-09-08

## \[2.0.0-beta.15]

- fix files array in inspect package.json
  - [183958d](https://github.com/thefrontside/effection/commit/183958d92c9f056bd916b2acf172436da5f858a7) Fix inspect files export ([#528](https://github.com/thefrontside/effection/pull/528)) on 2021-09-10

## \[2.0.0-beta.14]

- Add labels for atom streams
  - Bumped due to a bump in @effection/atom.
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
  - @effection/atom@2.0.0-beta.4
  - @effection/channel@2.0.0-beta.4
  - @effection/events@2.0.0-beta.4
  - @effection/subscription@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies \[3e77f29]
- Updated dependencies \[5d95e6d]
- Updated dependencies \[9700b45]
- Updated dependencies \[9700b45]
  - @effection/subscription@2.0.0-beta.3
  - @effection/events@2.0.0-beta.3
  - @effection/core@2.0.0-beta.3
  - @effection/atom@2.0.0-beta.3
  - @effection/channel@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies \[19414f0]
- Updated dependencies \[26a86cb]
- Updated dependencies \[9c76cc5]
- Updated dependencies \[f7e3344]
- Updated dependencies \[ac7c1ce]
  - @effection/core@2.0.0-beta.2
  - @effection/atom@2.0.0-beta.2
  - @effection/channel@2.0.0-beta.2
  - @effection/events@2.0.0-beta.2
  - @effection/subscription@2.0.0-beta.2
