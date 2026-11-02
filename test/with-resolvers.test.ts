import { run, withResolvers } from "../mod.ts";
import { describe, expect, it } from "./suite.ts";

describe("withResolvers()", () => {
  it("resolves", async () => {
    let { operation, resolve } = withResolvers<string>();
    resolve("hello");
    await expect(run(() => operation)).resolves.toEqual("hello");
  });
  it("resolves only once", async () => {
    let { operation, resolve, reject } = withResolvers<string>();
    resolve("hello");
    reject(new Error("boom!"));
    resolve("goodbye");
    await expect(run(() => operation)).resolves.toEqual("hello");
  });
  it("rejects", async () => {
    let { operation, reject } = withResolvers<string>();
    reject(new Error("boom!"));
    await expect(run(() => operation)).rejects.toMatchObject({
      message: "boom!",
    });
  });
  it("rejects only once", async () => {
    let { operation, reject } = withResolvers<string>();
    reject(new Error("boom!"));
    reject(new Error("bam!"));
    await expect(run(() => operation)).rejects.toMatchObject({
      message: "boom!",
    });
  });
  it("preserves non-Error rejections", async () => {
    let cause = { message: "boom" };
    let { operation, reject } = withResolvers<string>();
    reject(cause);

    await expect(run(() => operation)).rejects.toBe(cause);
    await expect(run(() => operation)).rejects.toBe(cause);
  });
});
