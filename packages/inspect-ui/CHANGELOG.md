# @effection/inspect-ui

## \[2.0.0-beta.15]

- fix files array in inspect package.json
  - [183958d](https://github.com/thefrontside/effection/commit/183958d92c9f056bd916b2acf172436da5f858a7) Fix inspect files export ([#528](https://github.com/thefrontside/effection/pull/528)) on 2021-09-10

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

- Add support for special `expand` label which controls whether a given task is shown as expanded or collapsed in the inspector.
  - [db79c9b](https://github.com/thefrontside/effection/commit/db79c9b0fb571fc4cb45b71fb0cbdc5b5950ec3d) Add support for `expand` label on 2021-08-27
- Fix tree shaking being to aggressive by using sideEffects:true
  - [aa78ef8](https://github.com/thefrontside/effection/commit/aa78ef8eadba2bf4ea50a280c945d54c51e8723b) Enable side effects in inspect-ui package on 2021-08-27

## \[2.0.0-beta.12]

- Update core dependency
  - Bumped due to a bump in @effection/mocha.
  - [d92eee5](https://github.com/thefrontside/effection/commit/d92eee594fdb8dc6d8ab6a37b6aa362122e63f6e) Update core dependency on 2021-08-16

## \[2.0.0-beta.11]

- Use Object.create to wrap error objects rather than copying properties
  - Bumped due to a bump in @effection/core.
  - [a56ae2a](https://github.com/thefrontside/effection/commit/a56ae2af8a6247697b8b6253bd35b6d9e569613d) Use Object.create to create error object with trace on 2021-08-16

## \[2.0.0-beta.10]

- Expand and collapse tasks in inspector
  - [c7c1c55](https://github.com/thefrontside/effection/commit/c7c1c553fe2760ad5fdfe11aac04fa664977675e) Hide Expand/Collapse button when task has no children on 2021-08-10

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

- Deprecate Future#resolve in favour of Future#produce.
  - Bumped due to a bump in @effection/core.
  - [7b8ce8e](https://github.com/thefrontside/effection/commit/7b8ce8ef1d46ddf10806d51b3f0ed1ef14e8f9cd) Depreacte Future#resolve in favour of Future#produce ([#437](https://github.com/thefrontside/effection/pull/437)) on 2021-07-22
  - [63f6424](https://github.com/thefrontside/effection/commit/63f64243373ae6c320b9a7564db666ca7efbb597) Replace covector files and delete changesets to trigger publish on 2021-07-23
  - [1bb643c](https://github.com/thefrontside/effection/commit/1bb643c0f1cfac5b849e3622c274ef0c04a93717) Re-add covector change file on 2021-07-23
- Upgrade typescript to 4.3.5 and replace tsdx with tsc
  - Bumped due to a bump in @effection/core.
  - [121bd40](https://github.com/thefrontside/effection/commit/121bd40e17609a82bce649c5fed34ee0754681b7) Add change file for typescript bump on 2021-07-23

## 2.0.0-beta.4

### Patch Changes

- Updated dependencies \[e297c86]
  - @effection/core@2.0.0-beta.4
  - @effection/events@2.0.0-beta.4
  - @effection/inspect-utils@2.0.0-beta.4
  - @effection/main@2.0.0-beta.4
  - @effection/subscription@2.0.0-beta.4

## 2.0.0-beta.3

### Patch Changes

- Updated dependencies \[248b0a6]
- Updated dependencies \[3e77f29]
- Updated dependencies \[5d95e6d]
- Updated dependencies \[9700b45]
- Updated dependencies \[9700b45]
  - @effection/main@2.0.0-beta.3
  - @effection/subscription@2.0.0-beta.3
  - @effection/events@2.0.0-beta.3
  - @effection/core@2.0.0-beta.3
  - @effection/inspect-utils@2.0.0-beta.3

## 2.0.0-beta.2

### Patch Changes

- Updated dependencies \[19414f0]
- Updated dependencies \[26a86cb]
- Updated dependencies \[9c76cc5]
- Updated dependencies \[f7e3344]
- Updated dependencies \[ac7c1ce]
  - @effection/core@2.0.0-beta.2
  - @effection/events@2.0.0-beta.2
  - @effection/inspect-utils@2.0.0-beta.2
  - @effection/main@2.0.0-beta.2
  - @effection/subscription@2.0.0-beta.2
