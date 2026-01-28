import { describe, expect, it } from "./suite.ts";
import {
  resource,
  run,
  spawn,
  suspend,
  withResolvers,
} from "../mod.ts";

// Helper to add timeout to async operations
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: number;
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    new Promise<T>((_, reject) => {
      timeoutId = setTimeout(
        () => reject(new Error(`Timeout after ${ms}ms - cleanup deadlocked`)),
        ms
      );
    }),
  ]);
}

describe("cleanup regression (4.0.1)", () => {
  // This pattern mirrors @effectionx/websocket's useWebSocket:
  // 1. Resource with a spawned consumer task
  // 2. Finally block signals the consumer to close (like socket.close())
  // 3. Finally block waits for consumer to confirm it processed the close
  //
  // This worked in 4.0.0 but deadlocks in 4.0.1 due to changes in
  // task finalization order (PRs #1081 and #1085)

  it("finally block can signal spawned task and wait for response (sleep)", async () => {
    let cleanupCompleted = false;
    let consumerSawClose = false;

    let task = run(function* () {
      yield* resource(function* (provide) {
        let { resolve: closeStream, operation: streamClosed } =
          withResolvers<void>();
        let { resolve: confirmClosed, operation: closed } =
          withResolvers<void>();

        // Spawned consumer task - like the message consumer in useWebSocket
        yield* spawn(function* () {
          // Simulate draining a stream until it closes
          yield* streamClosed;
          consumerSawClose = true;
          confirmClosed();
        });

        try {
          yield* provide(undefined);
        } finally {
          // Close the stream (like socket.close() in useWebSocket)
          closeStream();
          // Wait for consumer to confirm it saw the close
          yield* closed;
          cleanupCompleted = true;
        }
      });

      yield* suspend();
    });

    // Timing gap before halt - this is important to reproduce the bug
    await new Promise((r) => setTimeout(r, 50));
    await withTimeout(task.halt(), 1000);

    expect(consumerSawClose).toBe(true);
    expect(cleanupCompleted).toBe(true);
  });

  it("finally block can signal spawned task and wait for response (no sleep)", async () => {
    let cleanupCompleted = false;
    let consumerSawClose = false;

    let task = run(function* () {
      yield* resource(function* (provide) {
        let { resolve: closeStream, operation: streamClosed } =
          withResolvers<void>();
        let { resolve: confirmClosed, operation: closed } =
          withResolvers<void>();

        yield* spawn(function* () {
          yield* streamClosed;
          consumerSawClose = true;
          confirmClosed();
        });

        try {
          yield* provide(undefined);
        } finally {
          closeStream();
          yield* closed;
          cleanupCompleted = true;
        }
      });

      yield* suspend();
    });

    // No timing gap - halt immediately
    await withTimeout(task.halt(), 1000);

    expect(consumerSawClose).toBe(true);
    expect(cleanupCompleted).toBe(true);
  });
});
