import { describe, expect, expectType, it } from "./suite.ts";

import { Err, Ok, type Result, unbox } from "../mod.ts";

describe("Result", () => {
  it("constructs successful results with Ok()", () => {
    expect(Ok("hello")).toEqual({ ok: true, value: "hello" });
  });

  it("preserves Error instances passed to Err()", () => {
    let error = new Error("oh no");

    expect(Err(error)).toEqual({ ok: false, error });
  });

  it("wraps non-Error causes passed to Err()", () => {
    let result = Err("oh no");

    if (result.ok) {
      throw new Error("expected Err() to produce a failed result");
    }

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.name).toEqual("ThrownValueError");
    expect(result.error.message).toEqual("oh no");
    expect(result.error.cause).toEqual("oh no");
    expect(result.reason).toBe(result.error);
  });

  it("aliases reason to error without changing the v4 object shape", () => {
    let error = new Error("oh no");
    let result = Err(error);

    if (result.ok) {
      throw new Error("expected a failed result");
    }

    expect(result.reason).toBe(error);
    expect({ ...result }).toEqual({ ok: false, error });
    expectType<Error>(result.error);
    expectType<Error | undefined>(result.reason);
  });

  it("reflects updates to error through reason", () => {
    let result = Err(new Error("original"));

    if (result.ok) {
      throw new Error("expected a failed result");
    }

    let error = new Error("changed via error");
    result.error = error;
    expect(result.reason).toBe(error);

    expect(() => unbox(result)).toThrow(error);
  });

  it("accepts existing hand-written results without reason", () => {
    let error = new Error("oh no");
    let result: Result<string> = { ok: false, error };

    expect(result.reason).toBeUndefined();
    expect(() => unbox(result)).toThrow(error);
  });

  it("unboxes non-Error causes", () => {
    let cause = { message: "oh no" };

    try {
      unbox(Err(cause));
      throw new Error("expected unbox() to throw");
    } catch (error) {
      expect(error).toBe(cause);
    }
  });
});
