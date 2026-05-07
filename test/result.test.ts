import { describe, expect, it } from "./suite.ts";

import { Err, Ok } from "../mod.ts";

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
    expect(result.error.name).toEqual("ThrowValueError");
    expect(result.error.message).toEqual("oh no");
    expect(result.error.cause).toEqual("oh no");
  });
});
