import { expect, run } from "effection";
import { useCommand } from "freejack/use-command.ts";

await run(function* () {
  let process = yield* useCommand("deno", { args: ["task", "build"] });
  let status = yield* expect(process.status);
  if (!status.success) {
    throw new Error("build failed");
  }
  yield* expect(import("./main.ts"));
});
