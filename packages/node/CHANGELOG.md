# Changelog

## 2.0.0-preview.3

### Patch Changes

- 4703d0b: Upgrade ctrlc-windows to 1.0.3
- 3ca4cd4: Use new channel and subscription interfaces internally
- Updated dependencies [3ca4cd4]
- Updated dependencies [3ca4cd4]
- Updated dependencies [3ca4cd4]
- Updated dependencies [bdedf68]
- Updated dependencies [2bf5ef4]
- Updated dependencies [3ca4cd4]
- Updated dependencies [3ca4cd4]
  - @effection/events@2.0.0-preview.3
  - @effection/subscription@2.0.0-preview.3
  - @effection/channel@2.0.0-preview.3
  - @effection/core@2.0.0-preview.3

## 2.0.0-preview.2

### Patch Changes

- 93ec0d6: Include CHANGELOGS and src with all packages
- Updated dependencies [93ec0d6]
  - @effection/channel@2.0.0-preview.2
  - @effection/core@2.0.0-preview.2
  - @effection/events@2.0.0-preview.2
  - @effection/subscription@2.0.0-preview.2

## 2.0.0-preview.1

### Patch Changes

- 80143d5: Fix packaging
- Updated dependencies [80143d5]
  - @effection/channel@2.0.0-preview.1
  - @effection/core@2.0.0-preview.1
  - @effection/events@2.0.0-preview.1
  - @effection/subscription@2.0.0-preview.1

## 2.0.0-preview.0

### Major Changes

- Version 2

### Patch Changes

- Updated dependencies [undefined]
  - @effection/channel@2.0.0-preview.0
  - effection@2.0.0-preview.0
  - @effection/events@2.0.0-preview.0
  - @effection/subscription@2.0.0-preview.0

## 1.0.0

### Major Changes

- b988025: Release effection 1.0.0

### Patch Changes

- Updated dependencies [b988025]
  - @effection/channel@1.0.0
  - effection@1.0.0
  - @effection/events@1.0.0
  - @effection/subscription@1.0.0

## 0.9.2

### Patch Changes

- 9ce3ab7: Bump ctrlc-windows on node to skip building on non-windows
- Updated dependencies [f851981]
- Updated dependencies [d3d3b64]
  - effection@0.8.0
  - @effection/subscription@0.12.0
  - @effection/channel@0.6.8
  - @effection/events@0.7.9

## 0.9.1

### Patch Changes

- c9b2558: windows support. fixes https://github.com/thefrontside/effection/issues/182

## 0.9.0

### Minor Changes

- 9cd88e5: add `pid` field to the `Process` API
- 12c97da: ChildProcess.spawn() and ChildProcess.fork() are now deprecated in
  favor of `exec()` and `daemon()`
- 1da1f8c: add `exec()` method for creating resource-oriented API for spawning
  processes. e.g.

  ```js
  let { stdout, stderr } = yield exec("ls -al");
  yield subcribe(stdout).forEach(function*(chunk) {
    console.log(chunk);
  });
  ```

  add `dameon()` method which fails if the called process ever quits.

### Patch Changes

- Updated dependencies [649ec8d]
  - @effection/subscription@0.11.1

## 0.8.0

### Minor Changes

- 16c3038: Can set custom exit code and silence error printing on exceptions for cleaner exit.

## 0.7.0

### Minor Changes

- a414d68: Remove shell default and only force detached as that is a requirement.

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
