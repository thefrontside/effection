# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2019-10-18

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
