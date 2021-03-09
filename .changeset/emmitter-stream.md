---
"@effection/events": patch
"effection": patch
---
`once()` only yields the first argument passed to `emit()` which
accounts for 99.9% of the use cases. For the cases where all the
arguments are required, use `onceEmit()`

`on()` produces a stream of the first arguments passed to `emit()`
which accounts for 99.9% of the use cases. For the cases where all the
arguments are required, use `onEmit()`.
