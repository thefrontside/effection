import { main } from "../../build/npm/esm/mod.js";

await main(function* ([hello, world]) {
  if (hello !== "hello" && world !== "world") {
    throw new Error("arguments were not properly passed to main operation");
  }
  console.log("hello world");
});
