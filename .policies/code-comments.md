# Code Comments Policy (Strict)

This document defines the strict policy for writing comments in source code.

## Core Principle

**A comment must say something the code cannot.** If the code, its names, or a policy already says it, delete the comment.

> **Note:** This policy is about comments addressed to the next contributor. For docs addressed to users of a package — JSDoc, examples, changelogs — see [Documentation Is Part of the API](./documentation.md).

## The Rule

| Situation                                             | Required behavior                                          |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| Comment narrates what the adjacent code does          | Delete it                                                   |
| Comment restates a rule from `.policies/`             | Delete it; the policy is the source of truth                |
| Constraint whose violation fails silently             | Comment, leading with the instruction                       |
| Deliberate deviation from a policy                    | Comment saying it is deliberate, and why                    |
| Use of another package's private or untyped internals | Comment saying the omission is deliberate on their side     |

## The Four Questions

Before keeping a comment, answer all four:

1. What is happening around the comment?
2. What does the comment say now?
3. What should it communicate?
4. **Why do we need this comment at all?**

The fourth question removes most comments. If the honest answer is "so the reader understands the code", the code should be clearer instead — see [Naming and Consistency](./naming-consistency.md). Keep the comment only when the answer names something outside the file: another package's behavior, an ordering constraint, a failure with no signal.

## Writing Rules

- **Lead with the instruction, not the mechanism.** A reader who must derive "so don't do X" from a paragraph of machinery will not derive it.
- **State the consequence**, especially when the failure is silent — no type error, no exception, tests failing in a distant package.
- **Prefer why over when.** Version numbers rot. They earn their place only when tied to a live constraint in the same package, such as its own peer dependency range, so the comment becomes deletable when that range moves.
- **Verify before you assert.** If a comment claims something breaks, break it and confirm.
- **Do not overstate.** An inflated blast radius reads as false to anyone who knows the system, and buries the accurate warning.

## Examples

### Non-Compliant: Mechanism without instruction

```typescript
// `step()` reads the iterator from a closure variable that only this setter
// writes. Shadowing the property with a getter type checks, runs and does
// nothing.
data.iterator = new InlineIterator(operation, current);
```

### Compliant: Instruction first, mechanism behind it

```typescript
// Don't turn this back into a `defineProperty`. `step()` reads the iterator
// from a closure variable that only this setter writes, so a getter type
// checks, runs, and silently does nothing.
data.iterator = new InlineIterator(operation, current);
```

### Non-Compliant: Says when, not why

```typescript
/**
 * Still present at runtime, but dropped from Effection's public `Coroutine`
 * type in 4.0.3.
 */
```

### Compliant: Says why, and implies the risk

```typescript
/**
 * Still present at runtime but intentionally omitted from Effection's public
 * `Coroutine` because it's considered a private API.
 */
```

### Non-Compliant: Restates a policy at the call site

```typescript
// async teardown goes in ensure(), never in finally — a `yield*` inside a
// `finally` disarms halt propagation for the frame
yield* ensure(function* () {
  yield* conn.close();
});
```

Covered by [Async Teardown](./async-teardown.md). The code already uses `ensure()`; repeating the rationale at every call site means it must be corrected in every call site.

### Compliant: A local fact no policy can know

```typescript
// Don't hoist this above the spawns — teardown would hang waiting on `closed`.
yield* ensure(function* () {
  socket.close(1000, "released");
  yield* closed;
});
```

### Compliant: A deliberate deviation from a policy

```typescript
// We can't use `scoped` here to prevent losing the halt on effection
// older than 4.1, where its own async teardown has that bug.
finally: (fn) => from(/* ... spawn + ensure ... */),
```

Without this, the deviation reads as an oversight and the "fix" is a silent regression.

## Verification Checklist

Before marking a review complete, verify:

- [ ] No comment restates what the adjacent code does
- [ ] No comment repeats a rule that lives in `.policies/`
- [ ] Comments guarding silent failures lead with the instruction
- [ ] Version numbers appear only when tied to a constraint in the same package
- [ ] Claims about what breaks have been verified, not reasoned
- [ ] Every surviving comment survives question 4

## Common Mistakes

| Mistake                                  | Fix                                                    |
| ---------------------------------------- | ------------------------------------------------------ |
| Narrating the next line                  | Delete it                                              |
| Repeating a policy at the call site      | Delete it; link the policy only when the code deviates |
| Mechanism with no instruction            | Lead with what not to do                               |
| "dropped in 4.0.3"                       | Say why it is absent, not when it happened             |
| Overstating the blast radius             | State what actually happens                            |
| Commenting to explain a confusing name   | Rename it                                              |

## Related Policies

- [Documentation Is Part of the API](./documentation.md) - Outward-facing docs; this policy governs inward comments
- [Async Teardown](./async-teardown.md) - An example of a policy that comments must not repeat
- [Naming and Consistency](./naming-consistency.md) - A better name usually removes the need for a comment
- [Start With Why](./start-with-why.md) - Ask what a comment is for before rewriting it
- [Policies Index](./index.md) - Add your new policy to the Policy Documents table
