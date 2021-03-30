---
"@effection/atom": patch
---
subscribing to an atom now always includes its current state as the
first item in the stream. Depreacet the `once()` method as it is now
redundant with `filter().expect()`
