# Changelog

## 0.6.5

### Patch Changes

- db11b3f: convert `effection` dependency into normal, non-peer dependency
- Updated dependencies [db11b3f]
- Updated dependencies [3688203]
- Updated dependencies [0e8951f]
  - @effection/events@0.7.4
  - effection@0.7.0

## 0.6.4

### Patch Changes

- 68c4dab: include typescript sources with package in order for sourcemaps to work.
- Updated dependencies [68c4dab]
  - effection@0.6.4
  - @effection/events@0.7.3

## 0.6.3

### Patch Changes

- 60ed704: ## Fix sourcemaps and types entrypoint

  We saw strange errors while installing Effection from BigTest. One of the problems was that sourcemaps were not working. This was happening because sourcemaps referenced ts file which were not being included in the package.

  https://github.com/thefrontside/effection/pull/119

  ## Distribute node packages without transpiling generators

  We made a decision to ship generators in our distribution bundles because IE11 compatibility is not important to us. It's surprisingly difficult to get this to work. We tried using microbundle but that turned out to be even more complicated because their [modern and cjs formats have mutually conflicting configuration](https://github.com/developit/microbundle/issues/618).

  https://github.com/thefrontside/effection/pull/120

- Updated dependencies [70ac8e3]
- Updated dependencies [60ed704]
  - @effection/events@0.7.0
  - effection@0.6.3
    All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.2] - 2020-05-04

### Changed

- cancel main context upon SIGTERM
  https://github.com/thefrontside/effection/pull/116

## [0.6.1] - 2020-04-29

### Added

- ChildProcess helpers
  https://github.com/thefrontside/effection.js/pull/101
