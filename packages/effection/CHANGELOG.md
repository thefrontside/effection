# Changelog

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

## [Unreleased]

## [0.6.2] - 2020-04-24

## Changed

- fix bug where typescript type declarations were not being referenced
  properly as part of the migration to
  `microbundle`. https://github.com/thefrontside/effection.js/pull/107

## [0.6.1] - 2020-04-24

### Changed

- fix bug where operations that returned `null` was causing effection
  to crash: https://github.com/thefrontside/effection.js/pull/98
- `effection` is now compiled with microbundle instead of
  pika. https://github.com/thefrontside/effection.js/pull/100
- removed custom publish scripts in order to fix releases 🙏

## [0.6.0] - 2020-04-15

### Changed

- Returning a context from a context passes links it to the parent context
  rather than halting it.
  https://github.com/thefrontside/effection.js/pull/89

### Added

- Resources are a new feature in Effection which allow you to tie a context
  to any JavaScript object.
  https://github.com/thefrontside/effection.js/pull/89

## [0.5.2] - 2020-03-09

### Added

- Make Typescript Operation type generic over the returned value. Enables
  better type checking in Typescript.
  https://github.com/thefrontside/effection.js/pull/81

### Changed

- Catch errors raised in ensure blocks and print nasty warning
  https://github.com/thefrontside/effection.js/pull/80

## [0.5.1] - 2020-02-24

### Changed

- For runtimes that do not use native generators, the code to
  recognize generator functions was broken which prevented effection
  from working in those environments. This was addressed with
  https://github.com/thefrontside/effection.js/pull/77

## [0.5.0] - 2020-02-10

### Added

- `join` to synchronize on a currently executing context.
- `monitor` operation to propagate failures
- `spawn` control function to create a "detached" process.

### Changed

- Refactored the `fork` method to be an operation instead of a static
  function

- Introduced a `main` function to enter a brand new context

## [0.4.0] - 2019-11-20

### Added

- add a monotonic `id` field to every fork to help with debugging
  https://github.com/thefrontside/effection.js/pull/32

### Changed

- (fix) do not swallow some errors that are thrown inside of a yield
  point destructor: https://github.com/thefrontside/effection.js/pull/37

- Make every fork conform to the Promises A+
  API. E.g. `fork(operation).then()`
  https://github.com/thefrontside/effection.js/pull/38

## [0.3.3] - 2019-11-04

### Added

- type signature for Exceution.halt() which is necessary in the
  construction of non-trivial async processes like servers.
  https://github.com/thefrontside/effection.js/pull/24

## [0.3.2] - 2019-10-30

### Changed

- (fix) in certain cases, execution forks were being marked as
  completed when they actually were not.
  https://github.com/thefrontside/effection.js/pull/21
- (fix) sometimes halted children were being kept around unecessarily,
  and while not running will cause memory leaks long-term
  https://github.com/thefrontside/effection.js/pull/22

## [0.3.1] - 2019-10-23

### Changed

- unroll continuation and state classes in execution. This makes stack
  traces much smaller and easier to debug:
  https://github.com/thefrontside/effection.js/pull/19
- remove some dead files that were not contributing to the API
  https://github.com/thefrontside/effection.js/pull/18

## [0.3.0] - 2019-10-18

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

## [0.2.0] - 2019-10-17

### Added

- Typescript typings: Effection now officially supports TypeScript!
  From here on out, the project is committed to shipping precise and
  up-to-date typing information for its entire public API
  https://github.com/thefrontside/effection.js/pull/8

## [0.1.0] - 2019-10-05

### Added

- Test Suite, and functioning structured concurrency model
