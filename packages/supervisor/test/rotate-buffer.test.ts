/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { describe, it } from "@effection/mocha";
import expect from "expect";

import { RotateBuffer } from "../src/rotate-buffer";

describe("RotateBuffer", () => {
  it("can push in new children and rotate out old ones", function* () {
    let buffer = new RotateBuffer<string>(3);

    expect(buffer.push("foo")).toEqual(undefined);
    expect(buffer.push("bar")).toEqual(undefined);
    expect(buffer.push("baz")).toEqual(undefined);
    expect(buffer.push("quox")).toEqual("foo");
    expect(buffer.push("mox")).toEqual("bar");
    expect(buffer.push("tox")).toEqual("baz");
    expect(buffer.push("blorb")).toEqual("quox");
  });
});
