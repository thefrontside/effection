# @bigtest/effection-express

## 0.9.3

### Patch Changes

- 08b07d78: Update effection to 0.8.0 and update subpackages
- Updated dependencies [08b07d78]
  - @bigtest/effection@0.6.2

## 0.9.2

### Patch Changes

- 4d7c43f9: enable eslint rules from the latest @typescript-eslint/recommended
- d85e5e95: upgrade eslint, typescript and @frontside packages
- Updated dependencies [4d7c43f9]
- Updated dependencies [d85e5e95]
  - @bigtest/effection@0.6.1

## 0.9.1

### Patch Changes

- c2c4bd11: Upgrade @frontside/typescript to v1.1.0

## 0.9.0

### Minor Changes

- afd5bcf5: server websocket handlers can now explicitly handle socket exit codes

### Patch Changes

- 5d7e6e85: Modernize and test proxy server

## 0.8.0

### Minor Changes

- 837a4630: Remove Mailbox based API from effection-express and use agent handler in server

### Patch Changes

- 804210f6: Upgraded @effection/subscription and applied new chainability

## 0.7.0

### Minor Changes

- 8afb1cee: add ability to consume websockets as a subscription alongside the
  Mailbox based API

### Patch Changes

- 3e95a130: Annotate type declaration of `Socket.send()` as `Operation<void>`
- 83153e3f: Upgrade effection dependencies to latest versions, upgrade to new style of subscriptions

## 0.6.0

### Minor Changes

- d671a894: Better wrapping of middleware as effection context, and exposing underlying raw
  express application.

## 0.5.1

### Patch Changes

- d2d50a5b: upgrade effection

## 0.5.0

### Minor Changes

- 154b93a1: Introduce changesets for simpler release management

### Patch Changes

- 1b7fa0f1: upgrade version of @effection/events to 0.7.1
