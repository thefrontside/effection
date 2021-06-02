# @effection/core

## 2.0.0-preview.12

### Minor Changes

- 9998088: Spawn operation can accept task options
- 2bce454: Simplify EventEmitter types on Controls.
- 1981b35: Collect trace of effection operations and propagate them along with the raised error
- 88dc59a: Improve error output by including an Effection trace

## 2.0.0-preview.11

### Minor Changes

- 88eca21: Add type to task
- 8bb4514: Add support for labels
- 44c354d: Make task options public

### Patch Changes

- ae8d090: Sleeping for zero milliseconds should not suspend indefinitely

## 2.0.0-preview.10

### Minor Changes

- 625b521: Sleep operation can suspend indefinitely when called without duration
- a06c679: Add spawn as an operation via resources
- 4d04159: add race() combinator
- 625b521: Add ensure, timeout and withTimeout combinators

## 2.0.0-preview.9

### Minor Changes

- 110a2cd: Add ignoreError option to prevent a task from propagating its errors to the parent
- e2545b2: Remove delay on starting iterator/generator
- 2b92370: Prevent race condition in promise controller if promise resolves in the same tick as halt signal
- 00562fd: Fix race condition when halting a task while in between yield points
- 110a2cd: When yielded to an asynchronously halting task, wait for the task to be fully halted before proceeding
- 110a2cd: The sub task created by iterators is now linked to the parent task
- 02446ad: Add Resource to create an option for spawning tasks in the background in an operation
- da86a9c: Convert controllers into functions

## 2.0.0-preview.8

### Minor Changes

- a13987f: make operation resolution an interface. Make operation iterators
  an operation.

## 2.0.0-preview.7

### Minor Changes

- 2bad074: Run destructors in reverse order and in series

## 2.0.0-preview.6

### Patch Changes

- 1222756: Use strict dependency requirements for internal dependencies while in prerelease mode

## 2.0.0-preview.5

### Minor Changes

- 70c358f: Store root in a global variable

## 2.0.0-preview.4

### Minor Changes

- 72f743c: Add `halt` method on `Effection` to halt root task

## 2.0.0-preview.3

### Patch Changes

- bdedf68: Simplify sleep method
- 2bf5ef4: Make iterator controllers reentrant so they can e.g. halt themselves

## 2.0.0-preview.2

### Patch Changes

- 93ec0d6: Include CHANGELOGS and src with all packages

## 2.0.0-preview.1

### Patch Changes

- 80143d5: Fix packaging
