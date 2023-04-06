import { describe, expect, it } from "./suite.ts";

import { action, run, suspend } from "../mod.ts";

describe("action", () => {
  it("can resolve", async () => {
    let didClear = false;
    let task = run(() =>
      action<number>(function* (resolve) {
        let timeout = setTimeout(() => resolve(42), 5);
        try {
          yield* suspend();
        } finally {
          didClear = true;
          clearTimeout(timeout);
        }
      })
    );

    await expect(task).resolves.toEqual(42);
    expect(didClear).toEqual(true);
  });

  it("can reject", async () => {
    let didClear = false;
    let error = new Error("boom");
    let task = run(() =>
      action<number>(function* (_, reject) {
        let timeout = setTimeout(() => reject(error), 5);
        try {
          yield* suspend();
        } finally {
          didClear = true;
          clearTimeout(timeout);
        }
      })
    );

    await expect(task).rejects.toEqual(error);
    expect(didClear).toEqual(true);
  });

  it("can resolve without ever suspending", async () => {
    let result = await run(() =>
      action<string>(function* (resolve) {
        resolve("hello");
      })
    );

    expect(result).toEqual("hello");
  });

  it("can reject without ever suspending", async () => {
    let error = new Error("boom");
    let task = run(() =>
      action(function* (_, reject) {
        reject(error);
      })
    );
    await expect(task).rejects.toEqual(error);
  });

  it("can resolve before it suspends", async () => {
    expect(
      await run(() =>
        action<string>(function* (resolve) {
          resolve("hello");
          yield* suspend();
        })
      ),
    ).toEqual("hello");
  });

  it("can reject before it suspends", async () => {
    let error = new Error("boom");
    let task = run(() =>
      action(function* (_, reject) {
        reject(error);
        yield* suspend();
      })
    );
    await expect(task).rejects.toEqual(error);
  });

  it("fails if the operation fails", async () => {
    let task = run(() =>
      action(function* () {
        throw new Error("boom");
      })
    );
    await expect(task).rejects.toHaveProperty("message", "boom");
  });

  it("fails if the shutdown fails", async () => {
    let error = new Error("boom");
    let task = run(() =>
      action(function* (resolve) {
        let timeout = setTimeout(resolve, 5);
        try {
          yield* suspend();
        } finally {
          clearTimeout(timeout);
          // deno-lint-ignore no-unsafe-finally
          throw error;
        }
      })
    );
    await expect(task).rejects.toEqual(error);
  });

  it("does not reach code that should be aborted", async () => {
    let didReach = false;
    await run(function Main() {
      return action<number>(function* MyAction(resolve) {
        resolve(10);
        yield* suspend();
        didReach = true;
      });
    });
    expect(didReach).toEqual(false);
  });
});
