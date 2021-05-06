# @effection/atom

## 2.0.0-preview.10

### Patch Changes

- Updated dependencies [110a2cd]
- Updated dependencies [e2545b2]
- Updated dependencies [2b92370]
- Updated dependencies [00562fd]
- Updated dependencies [110a2cd]
- Updated dependencies [110a2cd]
- Updated dependencies [02446ad]
- Updated dependencies [da86a9c]
  - @effection/core@2.0.0-preview.9
  - @effection/channel@2.0.0-preview.11
  - @effection/subscription@2.0.0-preview.10

## 2.0.0-preview.9

### Patch Changes

- Updated dependencies [a13987f]
  - @effection/core@2.0.0-preview.8
  - @effection/subscription@2.0.0-preview.9
  - @effection/channel@2.0.0-preview.10

## 2.0.0-preview.8

### Patch Changes

- 91ade6c: Add missing dependency on @effection/channel which could cause incorrect module resolution
- Updated dependencies [91ade6c]
  - @effection/channel@2.0.0-preview.9

## 2.0.0-preview.7

### Patch Changes

- Updated dependencies [2bad074]
  - @effection/core@2.0.0-preview.7
  - @effection/subscription@2.0.0-preview.8

## 2.0.0-preview.6

### Patch Changes

- 9a6a6e3: Make atom more reentrant
- Updated dependencies [3db7270]
  - @effection/subscription@2.0.0-preview.7

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
