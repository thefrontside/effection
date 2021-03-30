# @effection/atom

## 2.0.0-preview.5

### Patch Changes

- 6a0f093: subscribing to an atom now always includes its current state as the
  first item in the stream. Depreacet the `once()` method as it is now
  redundant with `filter().expect()`

## 2.0.0-preview.4

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode
- Updated dependencies [0dca571]
- Updated dependencies [1222756]
  - @effection/subscription@2.0.0-preview.6
  - @effection/core@2.0.0-preview.6

## 2.0.0-preview.3

### Major Changes

- Import from bigtest
