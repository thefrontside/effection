import { run, spawn, useAttributes, useScope } from "@effection/effection";
import { describe, expect, it } from "./suite.ts";
import { getAttributes } from "../lib/attributes-internal.ts";

describe("useAttributes", () => {
  it("adds attributes to the current scope", async () => {
    let scope = await run(function* main() {
      yield* useAttributes({ name: "Main", awesome: true });

      return yield* useScope();
    });

    let attrs = getAttributes(scope);

    expect(attrs).toEqual({ name: "Main", awesome: true });
  });

  it("does not cause any attributes to be inherited from the parent", async () => {
    let scope = await run(function* main() {
      yield* useAttributes({ awesome: true });
      let child = yield* spawn(function* () {
        yield* useAttributes({ name: "Child" });
        return yield* useScope();
      });

      return yield* child;
    });

    let attrs = getAttributes(scope);

    expect(attrs).toEqual({ name: "Child" });
  });

  it("adds new attributes to existing ones", async () => {
    let scope = await run(function* main() {
      yield* useAttributes({ name: "Main" });
      yield* useAttributes({ awesome: true });
      return yield* useScope();
    });

    let attrs = getAttributes(scope);

    expect(attrs).toEqual({ name: "Main", awesome: true });
  });
});
