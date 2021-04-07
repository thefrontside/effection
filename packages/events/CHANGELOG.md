# Changelog

## 2.0.0-preview.7

### Patch Changes

- Updated dependencies [2bad074]
  - @effection/core@2.0.0-preview.7
  - @effection/subscription@2.0.0-preview.8

## 2.0.0-preview.6

### Patch Changes

- Updated dependencies [3db7270]
  - @effection/subscription@2.0.0-preview.7

## 2.0.0-preview.5

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode
- Updated dependencies [0dca571]
- Updated dependencies [1222756]
  - @effection/subscription@2.0.0-preview.6
  - @effection/core@2.0.0-preview.6

## 2.0.0-preview.4

### Patch Changes

- 7b6ba05: `once()` only yields the first argument passed to `emit()` which
  accounts for 99.9% of the use cases. For the cases where all the
  arguments are required, use `onceEmit()`

  `on()` produces a stream of the first arguments passed to `emit()`
  which accounts for 99.9% of the use cases. For the cases where all the
  arguments are required, use `onEmit()`.

- Updated dependencies [7b6ba05]
- Updated dependencies [ab41f6a]
- Updated dependencies [ce76f15]
- Updated dependencies [72f743c]
- Updated dependencies [53661b7]
  - effection@2.0.0-preview.5
  - @effection/subscription@2.0.0-preview.4

## 2.0.0-preview.3

### Minor Changes

- 3ca4cd4: Change `on` to return subscribable, rather than taking scope

### Patch Changes

- Updated dependencies [3ca4cd4]
- Updated dependencies [3ca4cd4]
- Updated dependencies [3ca4cd4]
- Updated dependencies [2bf5ef4]
- Updated dependencies [3ca4cd4]
  - effection@2.0.0-preview.4
  - @effection/subscription@2.0.0-preview.3

## 2.0.0-preview.2

### Patch Changes

- 93ec0d6: Include CHANGELOGS and src with all packages
- Updated dependencies [93ec0d6]
  - effection@2.0.0-preview.3
  - @effection/subscription@2.0.0-preview.2

## 2.0.0-preview.1

### Patch Changes

- 80143d5: Fix packaging
- Updated dependencies [80143d5]
  - effection@2.0.0-preview.2
  - @effection/subscription@2.0.0-preview.1

## 2.0.0-preview.0

### Major Changes

- Version 2

### Patch Changes

- Updated dependencies [undefined]
  - effection@2.0.0-preview.0
  - @effection/subscription@2.0.0-preview.0

## 1.0.0

### Major Changes

- b988025: Release effection 1.0.0

### Patch Changes

- Updated dependencies [b988025]
  - effection@1.0.0
  - @effection/subscription@1.0.0

## 0.7.9

### Patch Changes

- Updated dependencies [f851981]
- Updated dependencies [d3d3b64]
  - effection@0.8.0
  - @effection/subscription@0.12.0

## 0.7.8

### Patch Changes

- 25b68eb: Subscriptions created via `createSubscription` are chainable on both sides of the yield
- Updated dependencies [25b68eb]
  - @effection/subscription@0.11.0

## 0.7.7

### Patch Changes

- Updated dependencies [5d118ee]
  - @effection/subscription@0.10.0

## 0.7.6

### Patch Changes

- Updated dependencies [786b20e]
  - @effection/subscription@0.9.0

## 0.7.5

### Patch Changes

- Updated dependencies [8303e92]
  - @effection/subscription@0.8.0

## 0.7.4

### Patch Changes

- db11b3f: convert `effection` dependency into normal, non-peer dependency
- 3688203: Only require EventTarget-like objects for the `on()` method to
  implement the `addEventListener` and `removeEventlistener` functions,
  not `dispatchEvent`
- Updated dependencies [db11b3f]
- Updated dependencies [0e8951f]
  - @effection/subscription@0.7.2
  - effection@0.7.0

## 0.7.3

### Patch Changes

- 68c4dab: include typescript sources with package in order for sourcemaps to work.
- Updated dependencies [68c4dab]
  - effection@0.6.4
  - @effection/subscription@0.7.1

## 0.7.2

### Patch Changes

- Updated dependencies [ad0d7e2]
- Updated dependencies [3336949]
  - @effection/subscription@0.7.0

## 0.7.1

### Patch Changes

- c624e41: as of 0.7.0 @effection/events depends on @effection/subscription for
  its implementation. This allows higher order functions over event
  streams via `Subscribeable`.

## 0.7.0

### Minor Changes

- 70ac8e3: create the `@effection/subscription` package with the
  `createSubscription` operation.

  Refactor `on()` operation from `@effection/events` to use
  createSubscription()

### Patch Changes

- 60ed704: ## Fix sourcemaps and types entrypoint

  We saw strange errors while installing Effection from BigTest. One of the problems was that sourcemaps were not working. This was happening because sourcemaps referenced ts file which were not being included in the package.

  https://github.com/thefrontside/effection/pull/119

  ## Distribute node packages without transpiling generators

  We made a decision to ship generators in our distribution bundles because IE11 compatibility is not important to us. It's surprisingly difficult to get this to work. We tried using microbundle but that turned out to be even more complicated because their [modern and cjs formats have mutually conflicting configuration](https://github.com/developit/microbundle/issues/618).

  https://github.com/thefrontside/effection/pull/120

- Updated dependencies [60ed704]
  - effection@0.6.3

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.1] - 2020-04-29

## Changed

- Event dispatch of `once` is asynchronous, to avoid problems with
  misbehaving event emitters.
  https://github.com/thefrontside/effection.js/pull/107

## Added

- EventSource type is exported.
  https://github.com/thefrontside/effection/pull/102
