# @effectionx/bdd

A BDD (Behavior-Driven Development) testing harness that integrates
seamlessly with [Effection](https://github.com/thefrontside/effection)
operations. This package provides a familiar `describe`/`it`/`beforeEach` API
that works natively with Effection's generator-based operations.

Supports both **Node.js** and **Deno** runtimes.

## Features

- 🔄 **Native Effection Support**: Test functions can be generator functions
  that yield operations
- 🏗️ **Familiar BDD API**: Uses the standard `describe`, `it`, and `beforeEach`
  functions you know and love
- 🧹 **Automatic Cleanup**: Proper resource management and cleanup for Effection
  operations
- 🎯 **Skip and Only**: Full support for `.skip` and `.only` modifiers
- 📦 **Zero Configuration**: Works out of the box with your runtime's testing
  framework

## Installation

### Node.js (npm)

```bash
npm install @effectionx/bdd
```

### Deno (JSR)

Add to your `deno.json` imports:

```json
{
  "imports": {
    "@effectionx/bdd": "jsr:@effectionx/bdd"
  }
}
```

## Entry Points

This package provides multiple entry points for different runtimes:

- `@effectionx/bdd` - Auto-detects runtime (Node.js or Deno)
- `@effectionx/bdd/node` - Explicit Node.js entry (uses `node:test`)
- `@effectionx/bdd/deno` - Explicit Deno entry (uses `@std/testing/bdd`)

### Deno via npm

If you're using the npm package in Deno (not JSR), you'll need to add `@std/testing` to your import map:

```json
{
  "imports": {
    "@std/testing": "jsr:@std/testing@^1",
    "@effectionx/bdd": "npm:@effectionx/bdd"
  }
}
```

## Basic Usage

```typescript
import { beforeEach, describe, it } from "@effectionx/bdd";
import { expect } from "@std/expect";
import { sleep, spawn } from "effection";
import { createSignal, is } from "@effectionx/signals";

describe("My async operations", () => {
  let counter: ReturnType<typeof createSignal<number, void>>;

  beforeEach(function* () {
    // Setup that runs before each test
    counter = yield* createSignal(0);
    yield* sleep(10); // Can use Effection operations in setup
  });

  it("should increment counter", function* () {
    // Test function is a generator that can yield operations
    counter.update((n) => n + 1);
    yield* is(counter, (value) => value === 1);
    expect(counter.valueOf()).toBe(1);
  });
});
```

## Real-World Examples

The following packages have been migrated to use `@effectionx/bdd` and provide
excellent examples of testing patterns:

- **stream-helpers**: See [`batch.test.ts`](../stream-helpers/batch.test.ts) for
  testing stream batching with time and size limits
- **signals**: See [`array.test.ts`](../signals/array.test.ts) for testing array
  signal operations like push, set, and update
- **timebox**: See [`timebox.test.ts`](../timebox/timebox.test.ts) for testing
  timeout scenarios with both success and timeout cases
- **task-buffer**: See
  [`task-buffer.test.ts`](../task-buffer/task-buffer.test.ts) for testing task
  queuing and buffer management
- **websocket**: See [`websocket.test.ts`](../websocket/websocket.test.ts) for
  testing bidirectional WebSocket communication and connection lifecycle
- **worker**: See [`worker.test.ts`](../worker/worker.test.ts) for testing web
  worker communication, error handling, and lifecycle management

### Common Patterns Demonstrated

These test files show how to:

- **Handle async operations** without `run()` wrappers
- **Test error scenarios** using try/catch blocks instead of Promise rejections
- **Use `beforeEach`** for test setup with Effection operations
- **Wait for signal changes** using the `is` helper
- **Test resource cleanup** and proper teardown
- **Handle timeouts and concurrent operations**

## API Reference

### `describe(name: string, body: () => void)`

Creates a test suite with the given name. Test suites can be nested.

**Options:**

- `describe.skip()` - Skip this test suite
- `describe.only()` - Run only this test suite

### `it(desc: string, body?: () => Operation<void>)`

Creates a test case with the given description. The body function should be a
generator function that can yield Effection operations.

**Options:**

- `it.skip()` - Skip this test case
- `it.only()` - Run only this test case

**Parameters:**

- `desc` - Description of what the test should do
- `body` - Generator function containing the test logic (optional for pending
  tests)

### `beforeEach(body: () => Operation<void>)`

Registers a setup function that runs before each test in the current suite. The
body function should be a generator function that can yield Effection
operations.

### ~~`afterEach`~~

This package doesn't include `afterEach` because it's typically used for clean
up. With Effection, clean up is part of the resource: synchronous cleanup can go
in a `finally` block, and anything that needs `yield*` belongs in `ensure()`.
Consider creating a resource in beforeEach if you encounter a need for
`afterEach`.

### `beforeAll`

Is not implemented yet.

## Migration from Standard Deno Testing

If you're migrating from standard Deno testing with Effection, the changes are
minimal:

**Before:**

```typescript
import { describe, it } from "@std/testing/bdd";
import { run } from "effection";

describe("my tests", () => {
  it("should work", async () => {
    await run(function* () {
      const result = yield* someOperation();
      expect(result).toBe("success");
    });
  });
});
```

**After:**

```typescript
import { describe, it } from "@effectionx/bdd";
// No need to import 'run'

describe("my tests", () => {
  it("should work", function* () {
    const result = yield* someOperation();
    expect(result).toBe("success");
  });
});
```

## Contributing

This package is part of the
[Effection](https://github.com/thefrontside/effection) ecosystem. Contributions
are welcome!
