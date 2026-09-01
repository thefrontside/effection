import { describe, expect, it } from "./suite.ts";

import { run, until } from "../mod.ts";

describe("until", () => {
  it("resolves on success", async () => {
    expect.assertions(1);
    await run(function* () {
      expect(yield* until(Promise.resolve(42))).toEqual(42);
    });
  });
  it("resolves promise-like values", async () => {
    let promiseLike = {
      then(resolve: (value: number) => void) {
        resolve(42);
        return promiseLike;
      },
    } as PromiseLike<number>;

    await expect(run(() => until(promiseLike))).resolves.toEqual(42);
  });
  it("preserves non-Error promise rejections", async () => {
    let cause = { message: "error" };

    await expect(run(function* () {
      yield* until(Promise.reject(cause));
    })).rejects.toBe(cause);
  });
});
