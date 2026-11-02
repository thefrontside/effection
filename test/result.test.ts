import { describe, expect, it } from "./suite.ts";

import { Err, Ok, unbox } from "../mod.ts";

describe("Result", () => {
  it("constructs successful results with Ok()", () => {
    expect(Ok("hello")).toEqual({ ok: true, value: "hello" });
  });

  it("preserves Error instances passed to Err()", () => {
    let error = new Error("oh no");

    expect(Err(error)).toEqual({ ok: false, cause: error });
  });

  it("preserves non-Error causes passed to Err()", () => {
    for (
      let cause of [
        { message: "oh no" },
        "oh no",
        null,
        undefined,
        Symbol("oh no"),
      ]
    ) {
      let result = Err(cause);
      if (result.ok) {
        throw new Error("expected Err() to produce a failed result");
      }
      expect(result.cause).toBe(cause);
      expect(result).toEqual({ ok: false, cause });
    }
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
