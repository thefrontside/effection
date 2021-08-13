# @effection/core

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
