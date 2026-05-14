import { Nothing } from "../lib/maybe.ts";
import { describe, expect, it } from "./suite.ts";

describe("Maybe", () => {
  it("uses the same value all instances of nothing", () => {
    expect(Nothing()).toEqual(Nothing());
  });
});
