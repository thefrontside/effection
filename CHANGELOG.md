# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
