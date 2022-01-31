# Changelog

## \[2.0.4]

- Allow pass object with `Symbol.operation` as an operation
  - Bumped due to a bump in effection.
  - [3e7daa8](https://github.com/thefrontside/effection/commit/3e7daa82cce974ea6b4ff90764343594ae7cba13) add changelog on 2022-01-26
  - [c623a84](https://github.com/thefrontside/effection/commit/c623a8448dfef764a03b3af6a6b0afa9ee834ba9) remove fetch and process packages from changes list on 2022-01-26

## \[2.0.3]

- Remove redundant node-fetch from dependencies
  - Bumped due to a bump in effection.
  - [b4a87d5](https://github.com/thefrontside/effection/commit/b4a87d525d270e53b92543676c9fb10c7fd1edd7) Add change file for covector on 2022-01-24

## \[2.0.2]

- Extract `AbortSignal` from `@effection/fetch` to `@effection/core` as a resource
  - Bumped due to a bump in effection.
  - [8ac2e85](https://github.com/thefrontside/effection/commit/8ac2e8515ac2cb1ee6ed5a200f31d28024bfdae2) Add covector change file on 2021-11-18
  - [b6d0e15](https://github.com/thefrontside/effection/commit/b6d0e1502ca8345bf488aef695b16fe7a5a5945d) Patch for fetch and not minor on 2021-11-19

## \[2.0.1]

- workaround borked 2.0 release https://status.npmjs.org/incidents/wy4002vc8ryc
  - Bumped due to a bump in effection.
  - [97711a7](https://github.com/thefrontside/effection/commit/97711a77419c8e539bff3060a9f3c1bae947f9b8) Work around borked NPM release on 2021-10-12

## \[2.0.0]

- Release Effection 2.0.0
  - [8bd89ad](https://github.com/thefrontside/effection/commit/8bd89ad40e42805ab6da0fd1b7a49beed9769865) Add 2.0 changeset on %as

## \[2.0.0-beta.8]

- Yielding to something which is not an operation no longer throws an internal error, but properly rejects the task.
  - Bumped due to a bump in @effection/core.
  - [a3ad19a](https://github.com/thefrontside/effection/commit/a3ad19a3177a731fee5cd2389ab898dee7b1788e) Fix yielding non operation bug on 2021-10-07

## \[2.0.0-beta.7]

- Fix a bug when using blockParent where the children are not getting halt on an explicit halt.
  - Bumped due to a bump in @effection/core.
  - [1cd9803](https://github.com/thefrontside/effection/commit/1cd98033d2641989114f9589c7d887954fa66781) Fix halting children for blockParent tasks on 2021-09-30

## \[2.0.0-beta.6]

- Add Stream `toBuffer` and Stream `buffered` so we have both options on either accessing the buffer directly or returning the stream.
  - Bumped due to a bump in @effection/stream.
  - [fe60532](https://github.com/thefrontside/effection/commit/fe60532c3f8cfdd8b53c324b7ea8e38e437f080f) Add both toBuffer and buffered to Stream on 2021-09-30

## \[2.0.0-beta.5]

- Stream `buffer` returns the actual buffer and gives direct access to it
  - Bumped due to a bump in @effection/stream.
  - [07c8f83](https://github.com/thefrontside/effection/commit/07c8f83b5968f347ca72795c447be411e66274ed) Stream `buffer` returns the actual buffer on 2021-09-30

## \[2.0.0-beta.4]

- - [0248d79](https://github.com/thefrontside/effection/commit/0248d79a33dcfc4200b0832aba975c9cad08981e) Add package readmes on 2021-09-28
- Split off `Stream` from subscription package into its own `@effection/stream` package
  - [248de1d](https://github.com/thefrontside/effection/commit/248de1dd31d172762d9601a2b5acd983dce61ab0) Split `Stream` into its own package on 2021-09-27

## \[2.0.0-beta.3]

- Adjust the propagation of errors for resources to make it possible to catch errors from `init`
  - Bumped due to a bump in @effection/core.
  - [75a7248](https://github.com/thefrontside/effection/commit/75a7248ae13d1126bbcaf9b6223f348168e987d0) Catch errors thrown during resource init on 2021-09-21
- Enable support for resources in higher order operations `all`, `race` and `withTimeout`.
  - Bumped due to a bump in @effection/core.
  - [bbe6cdc](https://github.com/thefrontside/effection/commit/bbe6cdc44184a7669278d0d01ad23a2a79a69e52) Enable resource support for higher order operations on 2021-09-09

## \[2.0.0-beta.2]

- Add shortcuts to create resolved/rejected/halted futures via Future.resolve(123), etc...
  - Bumped due to a bump in @effection/core.
  - [9599dde](https://github.com/thefrontside/effection/commit/9599dde14e9bc3ba4ac7ea473e8624164727be0c) Add shortcuts for resolves/rejected/halted future on 2021-09-08
