import { describe, expect, it } from "./suite.ts";

import { Err, Ok, unbox } from "../mod.ts";

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
