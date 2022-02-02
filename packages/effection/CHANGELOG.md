# Changelog

## \[2.0.4]

- Allow pass object with `Symbol.operation` as an operation
  - Bumped due to a bump in @effection/main.
  - [3e7daa8](https://github.com/thefrontside/effection/commit/3e7daa82cce974ea6b4ff90764343594ae7cba13) add changelog on 2022-01-26
  - [c623a84](https://github.com/thefrontside/effection/commit/c623a8448dfef764a03b3af6a6b0afa9ee834ba9) remove fetch and process packages from changes list on 2022-01-26

## \[2.0.3]

- Remove redundant node-fetch from dependencies
  - Bumped due to a bump in @effection/fetch.
  - [b4a87d5](https://github.com/thefrontside/effection/commit/b4a87d525d270e53b92543676c9fb10c7fd1edd7) Add change file for covector on 2022-01-24

## \[2.0.2]

- Extract `AbortSignal` from `@effection/fetch` to `@effection/core` as a resource
  - Bumped due to a bump in @effection/fetch.
  - [8ac2e85](https://github.com/thefrontside/effection/commit/8ac2e8515ac2cb1ee6ed5a200f31d28024bfdae2) Add covector change file on 2021-11-18
  - [b6d0e15](https://github.com/thefrontside/effection/commit/b6d0e1502ca8345bf488aef695b16fe7a5a5945d) Patch for fetch and not minor on 2021-11-19

## \[2.0.1]

- workaround borked 2.0 release https://status.npmjs.org/incidents/wy4002vc8ryc
  - Bumped due to a bump in @effection/core.
  - [97711a7](https://github.com/thefrontside/effection/commit/97711a77419c8e539bff3060a9f3c1bae947f9b8) Work around borked NPM release on 2021-10-12

## \[2.0.0]

- Release Effection 2.0.0
  - [8bd89ad](https://github.com/thefrontside/effection/commit/8bd89ad40e42805ab6da0fd1b7a49beed9769865) Add 2.0 changeset on %as

## \[2.0.0-beta.22]

- Yielding to something which is not an operation no longer throws an internal error, but properly rejects the task.
  - Bumped due to a bump in @effection/core.
  - [a3ad19a](https://github.com/thefrontside/effection/commit/a3ad19a3177a731fee5cd2389ab898dee7b1788e) Fix yielding non operation bug on 2021-10-07

## \[2.0.0-beta.21]

- Fix a bug when using blockParent where the children are not getting halt on an explicit halt.
  - Bumped due to a bump in @effection/core.
  - [1cd9803](https://github.com/thefrontside/effection/commit/1cd98033d2641989114f9589c7d887954fa66781) Fix halting children for blockParent tasks on 2021-09-30

## \[2.0.0-beta.20]

- Add Stream `toBuffer` and Stream `buffered` so we have both options on either accessing the buffer directly or returning the stream.
  - Bumped due to a bump in @effection/stream.
  - [fe60532](https://github.com/thefrontside/effection/commit/fe60532c3f8cfdd8b53c324b7ea8e38e437f080f) Add both toBuffer and buffered to Stream on 2021-09-30

## \[2.0.0-beta.19]

- Stream `buffer` returns the actual buffer and gives direct access to it
  - Bumped due to a bump in @effection/stream.
  - [07c8f83](https://github.com/thefrontside/effection/commit/07c8f83b5968f347ca72795c447be411e66274ed) Stream `buffer` returns the actual buffer on 2021-09-30

## \[2.0.0-beta.18]

- - [0248d79](https://github.com/thefrontside/effection/commit/0248d79a33dcfc4200b0832aba975c9cad08981e) Add package readmes on 2021-09-28
- Split off `Stream` from subscription package into its own `@effection/stream` package
  - [248de1d](https://github.com/thefrontside/effection/commit/248de1dd31d172762d9601a2b5acd983dce61ab0) Split `Stream` into its own package on 2021-09-27

## \[2.0.0-beta.17]

- Adjust the propagation of errors for resources to make it possible to catch errors from `init`
  - Bumped due to a bump in @effection/core.
  - [75a7248](https://github.com/thefrontside/effection/commit/75a7248ae13d1126bbcaf9b6223f348168e987d0) Catch errors thrown during resource init on 2021-09-21
- Enable support for resources in higher order operations `all`, `race` and `withTimeout`.
  - Bumped due to a bump in @effection/core.
  - [bbe6cdc](https://github.com/thefrontside/effection/commit/bbe6cdc44184a7669278d0d01ad23a2a79a69e52) Enable resource support for higher order operations on 2021-09-09

## \[2.0.0-beta.16]

- Add shortcuts to create resolved/rejected/halted futures via Future.resolve(123), etc...
  - Bumped due to a bump in @effection/core.
  - [9599dde](https://github.com/thefrontside/effection/commit/9599dde14e9bc3ba4ac7ea473e8624164727be0c) Add shortcuts for resolves/rejected/halted future on 2021-09-08

## \[2.0.0-beta.15]

- Fix dependency versions
  - Bumped due to a bump in @effection/fetch.
  - [5054ac0](https://github.com/thefrontside/effection/commit/5054ac0f10970bb5654e05545375c5349f18d43a) Add changeset on 2021-09-07

## \[2.0.0-beta.14]

- Add @effection/fetch as a dependency and reexport it
  - Bumped due to a bump in @effection/core.
  - [5ab5d06](https://github.com/thefrontside/effection/commit/5ab5d0691af75f3583de97402b5aac12325e2918) Reexport @effection/fetch from effection package on 2021-08-26
- Share internal run loop among task, task future and task controller. Prevents race conditions which cause internal errors.
  - Bumped due to a bump in @effection/core.
  - [222d511](https://github.com/thefrontside/effection/commit/222d5116c388c5b597cc3ec5e0fb64b4d22b273a) Share event loop among controller, task and future on 2021-09-01
- Introduce task scope as an alternative to resources for being able to access the outer scope of an operation
  - Bumped due to a bump in @effection/core.
  - [3ed11bd](https://github.com/thefrontside/effection/commit/3ed11bd4f5d980cd130ea894a63acb57450c5aac) Make resource task accessible through init task on 2021-08-27
- Add `toString()` method to task for nicely formatted rendering of task structure
  - Bumped due to a bump in @effection/core.
  - [9a63928](https://github.com/thefrontside/effection/commit/9a6392836704ad527d6da5195f5736462d69bef8) Add toString output for tasks on 2021-08-31

## \[2.0.0-beta.13]

- Allow channels to be named so their internal stream gets named
  - Bumped due to a bump in @effection/channel.
  - [c52018a](https://github.com/thefrontside/effection/commit/c52018a1035d551cef76a757d1dc29781b59c851) Allow channels to be named on 2021-08-27

## \[2.0.0-beta.12]

- Update core dependency
  - Bumped due to a bump in @effection/channel.
  - [d92eee5](https://github.com/thefrontside/effection/commit/d92eee594fdb8dc6d8ab6a37b6aa362122e63f6e) Update core dependency on 2021-08-16

## \[2.0.0-beta.11]

- Copy down monorepo readme explicitly
  - [39ee89f](https://github.com/thefrontside/effection/commit/39ee89f61508f3bf786fb7d9f41ca752415f2508) Copy down README into effection package explicitly on 2021-08-13

## \[2.0.0-beta.10]

- Add README from github repo to main effection package
  - [e3482e8](https://github.com/thefrontside/effection/commit/e3482e806df75d43f1936189e7b6afe023e35237) Add changfile on 2021-08-13
- add `Task#spawn` operation to spawn new task with a specific scope
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
  - Bumped due to a bump in @effection/channel.
  - [f0f0023](https://github.com/thefrontside/effection/commit/f0f002354743ae6d6f69bfe6df28ddc11d0f8be0) add changefile on 2021-07-26

## \[2.0.0-beta.5]

- Upgrade typescript to 4.3.5 and replace tsdx with tsc
  - [121bd40](https://github.com/thefrontside/effection/commit/121bd40e17609a82bce649c5fed34ee0754681b7) Add change file for typescript bump on 2021-07-23

## 2.0.0-beta.4

### Patch Changes

- e297c86: rename Task.spawn() -> Task.run()
- Updated dependencies \[e297c86]
  - @effection/core@2.0.0-beta.4
  - @effection/channel@2.0.0-beta.4
  - @effection/events@2.0.0-beta.4
  - @effection/main@2.0.0-beta.4
  - @effection/subscription@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- 3e77f29: - label events for visual inspection
  - label stream and queue operations
- 5d95e6d: label the "suspend" operation that is created with a bare `yield` statement;
- Updated dependencies \[248b0a6]
- Updated dependencies \[3e77f29]
- Updated dependencies \[5d95e6d]
- Updated dependencies \[9700b45]
- Updated dependencies \[9700b45]
  - @effection/main@2.0.0-beta.3
  - @effection/subscription@2.0.0-beta.3
  - @effection/events@2.0.0-beta.3
  - @effection/core@2.0.0-beta.3
  - @effection/channel@2.0.0-beta.3

## 2.0.0-beta.2

### Minor Changes

- 19414f0: Add label to root task
- 26a86cb: Increase max listeners on task
- 9c76cc5: Add `yieldingTo` property to task
- ac7c1ce: Add toJSON method to Task

### Patch Changes

- f7e3344: Name in interface should be yieldingTo and not subTask
- Updated dependencies \[19414f0]
- Updated dependencies \[26a86cb]
- Updated dependencies \[9c76cc5]
- Updated dependencies \[f7e3344]
- Updated dependencies \[ac7c1ce]
  - @effection/core@2.0.0-beta.2
  - @effection/channel@2.0.0-beta.2
  - @effection/events@2.0.0-beta.2
  - @effection/main@2.0.0-beta.2
  - @effection/subscription@2.0.0-beta.2

## 2.0.0-beta.1

### Patch Changes

- 0c6e263: release 2.0.0-beta
- Updated dependencies \[0c6e263]
  - @effection/channel@2.0.0-beta.1
  - @effection/core@2.0.0-beta.1
  - @effection/events@2.0.0-beta.1
  - @effection/main@2.0.0-beta.1
  - @effection/subscription@2.0.0-beta.1

## 2.0.0-preview.16

### Minor Changes

- 9998088: Spawn operation can accept task options
- d7c0eb1: Do not require implementation of full EventEmitter interface
- 2bce454: Simplify EventEmitter types on Controls.
- 1981b35: Collect trace of effection operations and propagate them along with the raised error
- 88dc59a: Remove `verbose` option from MainError
- 88dc59a: Improve error output by including an Effection trace

### Patch Changes

- Updated dependencies \[9998088]
- Updated dependencies \[d7c0eb1]
- Updated dependencies \[2bce454]
- Updated dependencies \[1981b35]
- Updated dependencies \[88dc59a]
- Updated dependencies \[88dc59a]
  - @effection/core@2.0.0-preview.12
  - @effection/events@2.0.0-preview.13
  - @effection/main@2.0.0-preview.3
  - @effection/channel@2.0.0-preview.15
  - @effection/subscription@2.0.0-preview.14

## 2.0.0-preview.15

### Minor Changes

- 88eca21: Add type to task
- 8bb4514: Add support for labels
- 44c354d: Make task options public
- ef1f164: Reexport main package

### Patch Changes

- ae8d090: Sleeping for zero milliseconds should not suspend indefinitely
- Updated dependencies \[88eca21]
- Updated dependencies \[ae8d090]
- Updated dependencies \[8bb4514]
- Updated dependencies \[44c354d]
  - @effection/core@2.0.0-preview.11
  - @effection/channel@2.0.0-preview.14
  - @effection/events@2.0.0-preview.12
  - @effection/main@2.0.0-preview.2
  - @effection/subscription@2.0.0-preview.13

## 2.0.0-preview.14

### Minor Changes

- 625b521: Sleep operation can suspend indefinitely when called without duration
- a06c679: Add spawn as an operation via resources
- 625b521: Add ensure, timeout and withTimeout combinators

### Patch Changes

- Updated dependencies \[625b521]
- Updated dependencies \[a06c679]
- Updated dependencies \[4d04159]
- Updated dependencies \[625b521]
  - @effection/core@2.0.0-preview.10
  - @effection/channel@2.0.0-preview.13
  - @effection/events@2.0.0-preview.11
  - @effection/subscription@2.0.0-preview.12

## 2.0.0-preview.13

### Minor Changes

- 92f921e: Turn streams into resources which return a subscription

### Patch Changes

- Updated dependencies \[92f921e]
  - @effection/subscription@2.0.0-preview.11
  - @effection/channel@2.0.0-preview.12
  - @effection/events@2.0.0-preview.10

## 2.0.0-preview.12

### Minor Changes

- 110a2cd: Add ignoreError option to prevent a task from propagating its errors to the parent
- 7216a21: Turn throwOnErrorEvent into an operation
- e2545b2: Remove delay on starting iterator/generator
- 2b92370: Prevent race condition in promise controller if promise resolves in the same tick as halt signal
- 00562fd: Fix race condition when halting a task while in between yield points
- 110a2cd: When yielded to an asynchronously halting task, wait for the task to be fully halted before proceeding
- 110a2cd: The sub task created by iterators is now linked to the parent task
- 02446ad: Add Resource to create an option for spawning tasks in the background in an operation

### Patch Changes

- Updated dependencies \[110a2cd]
- Updated dependencies \[7216a21]
- Updated dependencies \[e2545b2]
- Updated dependencies \[2b92370]
- Updated dependencies \[00562fd]
- Updated dependencies \[110a2cd]
- Updated dependencies \[110a2cd]
- Updated dependencies \[02446ad]
- Updated dependencies \[da86a9c]
  - @effection/core@2.0.0-preview.9
  - @effection/events@2.0.0-preview.9
  - @effection/channel@2.0.0-preview.11
  - @effection/subscription@2.0.0-preview.10

## 2.0.0-preview.11

### Patch Changes

- Updated dependencies \[a13987f]
  - @effection/core@2.0.0-preview.8
  - @effection/subscription@2.0.0-preview.9
  - @effection/events@2.0.0-preview.8
  - @effection/channel@2.0.0-preview.10

## 2.0.0-preview.10

### Patch Changes

- Updated dependencies \[91ade6c]
  - @effection/channel@2.0.0-preview.9

## 2.0.0-preview.9

### Minor Changes

- 2bad074: Run destructors in reverse order and in series

### Patch Changes

- Updated dependencies \[2bad074]
  - @effection/core@2.0.0-preview.7
  - @effection/channel@2.0.0-preview.8
  - @effection/events@2.0.0-preview.7
  - @effection/subscription@2.0.0-preview.8

## 2.0.0-preview.8

### Minor Changes

- 3db7270: Make Queue a first class citizen

### Patch Changes

- 9a6a6e3: Make atom more reentrant
- Updated dependencies \[3db7270]
  - @effection/subscription@2.0.0-preview.7
  - @effection/channel@2.0.0-preview.7
  - @effection/events@2.0.0-preview.6

## 2.0.0-preview.7

### Minor Changes

- 0dca571: Filter with a type predicate can narrow type of stream

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode
- Updated dependencies \[0dca571]
- Updated dependencies \[1222756]
  - @effection/subscription@2.0.0-preview.6
  - @effection/channel@2.0.0-preview.6
  - @effection/events@2.0.0-preview.5
  - @effection/core@2.0.0-preview.6

## 2.0.0-preview.6

### Minor Changes

- 9cf6053: Increase default value of max subscribers on channel
- 0b24415: Add WritableStream interface and implement it for channels
- 442f220: New API for exec and daemon which does not take scope directly
- 22e5230: Add `join` method on stream to return stream result
- 70c358f: Store root in a global variable
- 3983202: Add `stringBuffer` method to stream which buffers stream to a string
- 2c2749d: Add a `buffer` method on Stream to buffer stream contents for later replay

### Patch Changes

- Updated dependencies \[9cf6053]
- Updated dependencies \[0b24415]
- Updated dependencies \[22e5230]
- Updated dependencies \[70c358f]
- Updated dependencies \[3983202]
- Updated dependencies \[2c2749d]
  - @effection/channel@2.0.0-preview.5
  - @effection/subscription@2.0.0-preview.5
  - @effection/core@2.0.0-preview.5

## 2.0.0-preview.5

### Minor Changes

- ab41f6a: Rename `Subscribable` to `Stream`
- ce76f15: Make channel splittable into send and stream ends
- 72f743c: Add `halt` method on `Effection` to halt root task
- 53661b7: Reexport blessed packages from `effection` package

### Patch Changes

- 7b6ba05: `once()` only yields the first argument passed to `emit()` which
  accounts for 99.9% of the use cases. For the cases where all the
  arguments are required, use `onceEmit()`

  `on()` produces a stream of the first arguments passed to `emit()`
  which accounts for 99.9% of the use cases. For the cases where all the
  arguments are required, use `onEmit()`.

- Updated dependencies \[7b6ba05]

- Updated dependencies \[ab41f6a]

- Updated dependencies \[ce76f15]

- Updated dependencies \[72f743c]
  - @effection/events@2.0.0-preview.4
  - @effection/subscription@2.0.0-preview.4
  - @effection/channel@2.0.0-preview.4
  - @effection/core@2.0.0-preview.4

## 2.0.0-preview.4

### Minor Changes

- 3ca4cd4: Change `on` to return subscribable, rather than taking scope
- 3ca4cd4: Add `createSubscribable` and `Subscribable` interface
- 3ca4cd4: Make Channel subscribable and add all subscribable methods
- 3ca4cd4: Change channel interface from `new Channel()` to `createChannel()`

### Patch Changes

- 2bf5ef4: Make iterator controllers reentrant so they can e.g. halt themselves
- Updated dependencies \[bdedf68]
- Updated dependencies \[2bf5ef4]
  - @effection/core@2.0.0-preview.3

## 2.0.0-preview.3

### Patch Changes

- 93ec0d6: Include CHANGELOGS and src with all packages
- Updated dependencies \[93ec0d6]
  - @effection/core@2.0.0-preview.2

## 2.0.0-preview.2

### Patch Changes

- 80143d5: Fix packaging
- Updated dependencies \[80143d5]
  - @effection/core@2.0.0-preview.1

## 2.0.0-preview.1

### Minor Changes

- f6f223c: Fix packaging

## 2.0.0-preview.0

### Major Changes

- Version 2

## 1.0.0

### Major Changes

- b988025: Release effection 1.0.0

## 0.8.0

### Minor Changes

- f851981: Rename `main` to `run` and deprecate `main`

## 0.7.0

### Minor Changes

- 0e8951f: Use unique symbol for effection resources

## 0.6.4

### Patch Changes

- 68c4dab: include typescript sources with package in order for sourcemaps to work.

## 0.6.3

### Patch Changes

- 60ed704: ## Fix sourcemaps and types entrypoint
  We saw strange errors while installing Effection from BigTest. One of the problems was that sourcemaps were not working. This was happening because sourcemaps referenced ts file which were not being included in the package.
  https://github.com/thefrontside/effection/pull/119
  ## Distribute node packages without transpiling generators
  We made a decision to ship generators in our distribution bundles because IE11 compatibility is not important to us. It's surprisingly difficult to get this to work. We tried using microbundle but that turned out to be even more complicated because their [modern and cjs formats have mutually conflicting configuration](https://github.com/developit/microbundle/issues/618).
  https://github.com/thefrontside/effection/pull/120
  All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## \[Unreleased]

## \[0.6.2] - 2020-04-24

## Changed

- fix bug where typescript type declarations were not being referenced
  properly as part of the migration to
  `microbundle`. https://github.com/thefrontside/effection.js/pull/107

## \[0.6.1] - 2020-04-24

### Changed

- fix bug where operations that returned `null` was causing effection
  to crash: https://github.com/thefrontside/effection.js/pull/98
- `effection` is now compiled with microbundle instead of
  pika. https://github.com/thefrontside/effection.js/pull/100
- removed custom publish scripts in order to fix releases 🙏

## \[0.6.0] - 2020-04-15

### Changed

- Returning a context from a context passes links it to the parent context
  rather than halting it.
  https://github.com/thefrontside/effection.js/pull/89

### Added

- Resources are a new feature in Effection which allow you to tie a context
  to any JavaScript object.
  https://github.com/thefrontside/effection.js/pull/89

## \[0.5.2] - 2020-03-09

### Added

- Make Typescript Operation type generic over the returned value. Enables
  better type checking in Typescript.
  https://github.com/thefrontside/effection.js/pull/81

### Changed

- Catch errors raised in ensure blocks and print nasty warning
  https://github.com/thefrontside/effection.js/pull/80

## \[0.5.1] - 2020-02-24

### Changed

- For runtimes that do not use native generators, the code to
  recognize generator functions was broken which prevented effection
  from working in those environments. This was addressed with
  https://github.com/thefrontside/effection.js/pull/77

## \[0.5.0] - 2020-02-10

### Added

- `join` to synchronize on a currently executing context.
- `monitor` operation to propagate failures
- `spawn` control function to create a "detached" process.

### Changed

- Refactored the `fork` method to be an operation instead of a static
  function

- Introduced a `main` function to enter a brand new context

## \[0.4.0] - 2019-11-20

### Added

- add a monotonic `id` field to every fork to help with debugging
  https://github.com/thefrontside/effection.js/pull/32

### Changed

- (fix) do not swallow some errors that are thrown inside of a yield
  point destructor: https://github.com/thefrontside/effection.js/pull/37

- Make every fork conform to the Promises A+
  API. E.g. `fork(operation).then()`
  https://github.com/thefrontside/effection.js/pull/38

## \[0.3.3] - 2019-11-04

### Added

- type signature for Exceution.halt() which is necessary in the
  construction of non-trivial async processes like servers.
  https://github.com/thefrontside/effection.js/pull/24

## \[0.3.2] - 2019-10-30

### Changed

- (fix) in certain cases, execution forks were being marked as
  completed when they actually were not.
  https://github.com/thefrontside/effection.js/pull/21
- (fix) sometimes halted children were being kept around unecessarily,
  and while not running will cause memory leaks long-term
  https://github.com/thefrontside/effection.js/pull/22

## \[0.3.1] - 2019-10-23

### Changed

- unroll continuation and state classes in execution. This makes stack
  traces much smaller and easier to debug:
  https://github.com/thefrontside/effection.js/pull/19
- remove some dead files that were not contributing to the API
  https://github.com/thefrontside/effection.js/pull/18

## \[0.3.0] - 2019-10-18

### Changed

- unify the fork() and execute() methods. There is now a single API
  for initiating asynchronous execution, fork() which makes the mental
  model much simpler and the learning curve smaller.
  https://github.com/thefrontside/effection.js/pull/14

- make the fork() function static. Prior to this, `fork()` was a
  method on the `Execution` class which made the API awkward and
  non-functional.
  https://github.com/thefrontside/effection.js/pull/12

- make generators (not just generator functions) valid
  operations. Before this change, you needed to use a utility function
  `call()` in order to pass arguments to generator based
  operations. This lets you invoke generator functions directly and
  pass the resulting generator to `yield` and `fork` directly thus
  simplifying code greatly.
  https://github.com/thefrontside/effection.js/pull/13

## \[0.2.0] - 2019-10-17

### Added

- Typescript typings: Effection now officially supports TypeScript!
  From here on out, the project is committed to shipping precise and
  up-to-date typing information for its entire public API
  https://github.com/thefrontside/effection.js/pull/8

## \[0.1.0] - 2019-10-05

### Added

- Test Suite, and functioning structured concurrency model
