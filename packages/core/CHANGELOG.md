# @effection/core

## \[2.2.0]

- Allow pass object with `Symbol.operation` as an operation
  - [3e7daa8](https://github.com/thefrontside/effection/commit/3e7daa82cce974ea6b4ff90764343594ae7cba13) add changelog on 2022-01-26
  - [c623a84](https://github.com/thefrontside/effection/commit/c623a8448dfef764a03b3af6a6b0afa9ee834ba9) remove fetch and process packages from changes list on 2022-01-26

## \[2.1.0]

- Extract `AbortSignal` from `@effection/fetch` to `@effection/core` as a resource
  - [8ac2e85](https://github.com/thefrontside/effection/commit/8ac2e8515ac2cb1ee6ed5a200f31d28024bfdae2) Add covector change file on 2021-11-18
  - [b6d0e15](https://github.com/thefrontside/effection/commit/b6d0e1502ca8345bf488aef695b16fe7a5a5945d) Patch for fetch and not minor on 2021-11-19

## \[2.0.1]

- workaround borked 2.0 release https://status.npmjs.org/incidents/wy4002vc8ryc
  - [97711a7](https://github.com/thefrontside/effection/commit/97711a77419c8e539bff3060a9f3c1bae947f9b8) Work around borked NPM release on 2021-10-12

## \[2.0.0]

- Release Effection 2.0.0
  - [8bd89ad](https://github.com/thefrontside/effection/commit/8bd89ad40e42805ab6da0fd1b7a49beed9769865) Add 2.0 changeset on %as

## \[2.0.0-beta.17]

- Yielding to something which is not an operation no longer throws an internal error, but properly rejects the task.
  - [a3ad19a](https://github.com/thefrontside/effection/commit/a3ad19a3177a731fee5cd2389ab898dee7b1788e) Fix yielding non operation bug on 2021-10-07

## \[2.0.0-beta.16]

- Fix a bug when using blockParent where the children are not getting halt on an explicit halt.
  - [1cd9803](https://github.com/thefrontside/effection/commit/1cd98033d2641989114f9589c7d887954fa66781) Fix halting children for blockParent tasks on 2021-09-30

## \[2.0.0-beta.15]

- - [0248d79](https://github.com/thefrontside/effection/commit/0248d79a33dcfc4200b0832aba975c9cad08981e) Add package readmes on 2021-09-28
- Remove operation resolutions entirely, use Future instead
  - [5f67d61](https://github.com/thefrontside/effection/commit/5f67d610324af158eba67be5600d413fc1f2ace1) Add changeset on 2021-09-29

## \[2.0.0-beta.14]

- Adjust the propagation of errors for resources to make it possible to catch errors from `init`
  - [75a7248](https://github.com/thefrontside/effection/commit/75a7248ae13d1126bbcaf9b6223f348168e987d0) Catch errors thrown during resource init on 2021-09-21
- Enable support for resources in higher order operations `all`, `race` and `withTimeout`.
  - [bbe6cdc](https://github.com/thefrontside/effection/commit/bbe6cdc44184a7669278d0d01ad23a2a79a69e52) Enable resource support for higher order operations on 2021-09-09

## \[2.0.0-beta.13]

- Add shortcuts to create resolved/rejected/halted futures via Future.resolve(123), etc...
  - [9599dde](https://github.com/thefrontside/effection/commit/9599dde14e9bc3ba4ac7ea473e8624164727be0c) Add shortcuts for resolves/rejected/halted future on 2021-09-08

## \[2.0.0-beta.12]

- Add @effection/fetch as a dependency and reexport it
  - [5ab5d06](https://github.com/thefrontside/effection/commit/5ab5d0691af75f3583de97402b5aac12325e2918) Reexport @effection/fetch from effection package on 2021-08-26
- Share internal run loop among task, task future and task controller. Prevents race conditions which cause internal errors.
  - [222d511](https://github.com/thefrontside/effection/commit/222d5116c388c5b597cc3ec5e0fb64b4d22b273a) Share event loop among controller, task and future on 2021-09-01
- Introduce task scope as an alternative to resources for being able to access the outer scope of an operation
  - [3ed11bd](https://github.com/thefrontside/effection/commit/3ed11bd4f5d980cd130ea894a63acb57450c5aac) Make resource task accessible through init task on 2021-08-27
- Add `toString()` method to task for nicely formatted rendering of task structure
  - [9a63928](https://github.com/thefrontside/effection/commit/9a6392836704ad527d6da5195f5736462d69bef8) Add toString output for tasks on 2021-08-31

## \[2.0.0-beta.11]

- Change named import from a package.json file to default
  - [65a856a](https://github.com/thefrontside/effection/commit/65a856a8d498205c27de00432fd43bc11bbb0e37) Change named import from a package.json file to default. ([#490](https://github.com/thefrontside/effection/pull/490)) on 2021-08-25

## \[2.0.0-beta.10]

- Use Object.create to wrap error objects rather than copying properties
  - [a56ae2a](https://github.com/thefrontside/effection/commit/a56ae2af8a6247697b8b6253bd35b6d9e569613d) Use Object.create to create error object with trace on 2021-08-16

## \[2.0.0-beta.9]

- add `Task#spawn` operation to spawn new task with a specific scope
  - [a71d65b](https://github.com/thefrontside/effection/commit/a71d65b77df5c337a78b7934edd181080eacf5bf) Add changefile on 2021-07-27

## \[2.0.0-beta.8]

- remove eslint-plugin-treeshaking
  - [2779056](https://github.com/thefrontside/effection/commit/27790562cfc672d1c047b0860433b8986f7a7f5e) remove eslint-plugin-treeshaking ([#472](https://github.com/thefrontside/effection/pull/472)) on 2021-08-06
- Add sideEffects field to package.json
  - [383141d](https://github.com/thefrontside/effection/commit/383141dc556c6a781d98087f3b68085d5eb31173) Add sideEffects field to package.json ([#470](https://github.com/thefrontside/effection/pull/470)) on 2021-08-05

## \[2.0.0-beta.7]

- The `dist` directory didn't contain the `esm` and `cjs` directory. We copy the `package.json` for reference into the dist, and this broke the `files` resolution. Switch to using `dist-cjs` and `dist-esm` which allows us to avoid copying `package.json`.
  - [63fbcfb](https://github.com/thefrontside/effection/commit/63fbcfb8151bb7434f1cb8c58bfed25012ad2727) fix: @effection/core to ship dist/esm and dist/cjs on 2021-08-03
  - [7788e24](https://github.com/thefrontside/effection/commit/7788e2408bcff8180b24ce497043283c97b6dbaa) fix: @effection/core to ship dist-esm and dist-cjs on 2021-08-03
  - [6923a0f](https://github.com/thefrontside/effection/commit/6923a0fa1a84cd0788f8c9c1600ccf7539b08bbf) update change file with everything patched on 2021-08-03

## \[2.0.0-beta.6]

- Add esm builds
  - [6660a46](https://github.com/thefrontside/effection/commit/6660a466a50c9b9c36829c2d52448ebbc0e7e6fb) Add esm build ([#462](https://github.com/thefrontside/effection/pull/462)) on 2021-08-03

## \[2.0.0-beta.5]

- Deprecate Future#resolve in favour of Future#produce.
  - [7b8ce8e](https://github.com/thefrontside/effection/commit/7b8ce8ef1d46ddf10806d51b3f0ed1ef14e8f9cd) Depreacte Future#resolve in favour of Future#produce ([#437](https://github.com/thefrontside/effection/pull/437)) on 2021-07-22
  - [63f6424](https://github.com/thefrontside/effection/commit/63f64243373ae6c320b9a7564db666ca7efbb597) Replace covector files and delete changesets to trigger publish on 2021-07-23
  - [1bb643c](https://github.com/thefrontside/effection/commit/1bb643c0f1cfac5b849e3622c274ef0c04a93717) Re-add covector change file on 2021-07-23
- Upgrade typescript to 4.3.5 and replace tsdx with tsc
  - [121bd40](https://github.com/thefrontside/effection/commit/121bd40e17609a82bce649c5fed34ee0754681b7) Add change file for typescript bump on 2021-07-23

## 2.0.0-beta.4

### Patch Changes

- e297c86: rename Task.spawn() -> Task.run()

## 2.0.0-beta.3

### Patch Changes

- 5d95e6d: label the "suspend" operation that is created with a bare `yield` statement;
- 9700b45: function operations can now also return function operations, and not
  just value operations

## 2.0.0-beta.2

### Minor Changes

- 19414f0: Add label to root task
- 26a86cb: Increase max listeners on task
- 9c76cc5: Add `yieldingTo` property to task
- ac7c1ce: Add toJSON method to Task

### Patch Changes

- f7e3344: Name in interface should be yieldingTo and not subTask

## 2.0.0-beta.1

### Patch Changes

- 0c6e263: release 2.0.0-beta

## 2.0.0-preview.12

### Minor Changes

- 9998088: Spawn operation can accept task options
- 2bce454: Simplify EventEmitter types on Controls.
- 1981b35: Collect trace of effection operations and propagate them along with the raised error
- 88dc59a: Improve error output by including an Effection trace

## 2.0.0-preview.11

### Minor Changes

- 88eca21: Add type to task
- 8bb4514: Add support for labels
- 44c354d: Make task options public

### Patch Changes

- ae8d090: Sleeping for zero milliseconds should not suspend indefinitely

## 2.0.0-preview.10

### Minor Changes

- 625b521: Sleep operation can suspend indefinitely when called without duration
- a06c679: Add spawn as an operation via resources
- 4d04159: add race() combinator
- 625b521: Add ensure, timeout and withTimeout combinators

## 2.0.0-preview.9

### Minor Changes

- 110a2cd: Add ignoreError option to prevent a task from propagating its errors to the parent
- e2545b2: Remove delay on starting iterator/generator
- 2b92370: Prevent race condition in promise controller if promise resolves in the same tick as halt signal
- 00562fd: Fix race condition when halting a task while in between yield points
- 110a2cd: When yielded to an asynchronously halting task, wait for the task to be fully halted before proceeding
- 110a2cd: The sub task created by iterators is now linked to the parent task
- 02446ad: Add Resource to create an option for spawning tasks in the background in an operation
- da86a9c: Convert controllers into functions

## 2.0.0-preview.8

### Minor Changes

- a13987f: make operation resolution an interface. Make operation iterators
  an operation.

## 2.0.0-preview.7

### Minor Changes

- 2bad074: Run destructors in reverse order and in series

## 2.0.0-preview.6

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode

## 2.0.0-preview.5

### Minor Changes

- 70c358f: Store root in a global variable

## 2.0.0-preview.4

### Minor Changes

- 72f743c: Add `halt` method on `Effection` to halt root task

## 2.0.0-preview.3

### Patch Changes

- bdedf68: Simplify sleep method
- 2bf5ef4: Make iterator controllers reentrant so they can e.g. halt themselves

## 2.0.0-preview.2

### Patch Changes

- 93ec0d6: Include CHANGELOGS and src with all packages

## 2.0.0-preview.1

### Patch Changes

- 80143d5: Fix packaging
