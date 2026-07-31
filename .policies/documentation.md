# Documentation Is Part of the API Policy (Experimental)

This document defines the experimental policy for treating documentation as a first-class API surface.

## Core Principle

**Invest in a narrative that helps the next reader/user understand the system and its tradeoffs.** Any user-visible behavior change must come with corresponding docs/examples.

> **Note:** For breaking changes and deprecation documentation, see [Backwards Compatibility](./backwards-compatibility.md).

## The Rule

| Change Type                     | Documentation Required              |
| ------------------------------- | ----------------------------------- |
| New exported function/type      | JSDoc with description and example  |
| Behavior change                 | Update existing docs + changelog    |
| Cancellation/teardown semantics | Explicit documentation of lifecycle |
| Breaking change                 | Migration guide with before/after   |
| Surprising edge cases           | Prominent warning in docs           |

## Examples

### Compliant: Documented export with lifecycle semantics

````typescript
/**
 * Returns the first operation to complete and halts all others.
 *
 * @remarks
 * Losing operations are halted immediately when the winner completes.
 * If the winner throws, losers are still halted before the error propagates.
 *
 * @example
 * ```typescript
 * let result = yield* race([
 *   fetchFromPrimary(),
 *   fetchFromFallback(),
 * ]);
 * // Only one fetch completes; the other is cancelled
 * ```
 */
export function race<T>(ops: Operation<T>[]): Operation<T> {
  // ...
}
````

### Compliant: Generator example in docs

````typescript
/**
 * Polls an endpoint at the specified interval.
 *
 * @example
 * ```typescript
 * function* main(): Operation<void> {
 *   // Poll runs until scope exits or task is halted
 *   yield* spawn(poll("/health", { interval: 5000 }));
 *   yield* sleep(30000);
 * }
 * ```
 */
export function poll(url: string, options?: PollOptions): Operation<void> {
  // ...
}
````

### Non-Compliant: Behavior change without docs update

```typescript
// Changed from "wait all" to "first wins" semantics
// but docs still say "waits for all operations"
export function first<T>(ops: Operation<T>[]): Operation<T> {
  return race(ops); // BAD: docs don't reflect new behavior
}
```

### Non-Compliant: Missing lifecycle documentation

```typescript
// BAD: No indication of cleanup behavior or halt semantics
export function useConnection(url: string): Operation<Connection> {
  // Does connection close on halt? On scope exit? Unclear.
}
```

## Verification Checklist

Before marking a review complete, verify:

- [ ] New exports have JSDoc with description
- [ ] At least one example showing `yield*` usage in generator context
- [ ] Cancellation/teardown behavior is documented
- [ ] Breaking changes have migration notes
- [ ] README/package description updated if needed

## Common Mistakes

| Mistake                           | Fix                                    |
| --------------------------------- | -------------------------------------- |
| `// TODO: add docs` shipped       | Write docs before merge                |
| Example without generator context | Show `function*` and `yield*` usage    |
| Silent behavior change            | Add changelog entry and update docs    |
| Complex API without examples      | Add 2-3 examples covering common cases |

## Related Policies

- [Package.json Metadata](./package-json-metadata.md) - Package description requirements
- [Backwards Compatibility](./backwards-compatibility.md) - Documenting breaking changes
- [Code Comments](./code-comments.md) - Inward comments, which are held to the opposite standard
- [Policies Index](./index.md) - Add your new policy to the Policy Documents table
