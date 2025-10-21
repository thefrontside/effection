import { buffer, describe, detect, expect, it, useCommand } from "./suite.ts";
import { run } from "../mod.ts";

describe("main", () => {
  it("gracefully shuts down on SIGINT", async () => {
    await run(function* () {
      let daemon = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "--allow-env", "test/main/ok.daemon.ts"],
      });
      let stdout = yield* buffer(daemon.stdout);
      yield* detect(stdout, "started");

      daemon.kill("SIGINT");

      let status = yield* daemon.status;

      expect(status.code).toBe(130);

      yield* detect(stdout, "gracefully stopped");
    });
  });

  if (Deno.build.os !== "windows") {
    it("gracefully shuts down on SIGTERM", async () => {
      await run(function* () {
        let daemon = yield* useCommand("deno", {
          stdout: "piped",
          args: ["run", "--allow-env", "test/main/ok.daemon.ts"],
        });
        let stdout = yield* buffer(daemon.stdout);
        yield* detect(stdout, "started");

        daemon.kill("SIGTERM");

        let status = yield* daemon.status;

        expect(status.code).toBe(143);

        yield* detect(stdout, "gracefully stopped");
      });
    });
  }

  it("exits gracefully on explicit exit()", async () => {
    await run(function* () {
      let cmd = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "--allow-env", "test/main/ok.exit.ts"],
      });

      let stdout = yield* buffer(cmd.stdout);

      yield* detect(stdout, "goodbye.\nOk, computer.");
    });
  });

  it("exits gracefully with 0 on implicit exit", async () => {
    await run(function* () {
      let cmd = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "--allow-env", "test/main/ok.implicit.ts"],
      });

      let stdout = yield* buffer(cmd.stdout);
      let status = yield* cmd.status;

      yield* detect(stdout, "goodbye.");
      expect(status.code).toEqual(0);
    });
  });

  it("exits gracefully on explicit exit failure exit()", async () => {
    await run(function* () {
      let cmd = yield* useCommand("deno", {
        stdout: "piped",
        stderr: "piped",
        args: ["run", "--allow-env", "test/main/fail.exit.ts"],
      });
      let stdout = yield* buffer(cmd.stdout);
      let stderr = yield* buffer(cmd.stderr);
      let status = yield* cmd.status;

      yield* detect(stdout, "graceful goodbye");
      yield* detect(stderr, "It all went horribly wrong");
      expect(status.code).toEqual(23);
    });
  });

  it("error exits gracefully on unexpected errors", async () => {
    await run(function* () {
      let cmd = yield* useCommand("deno", {
        stdout: "piped",
        stderr: "piped",
        args: ["run", "--allow-env", "test/main/fail.unexpected.ts"],
      });

      let stdout = yield* buffer(cmd.stdout);
      let stderr = yield* buffer(cmd.stderr);
      let status = yield* cmd.status;

      yield* detect(stdout, "graceful goodbye");
      yield* detect(stderr, "Error: moo");
      expect(status.code).toEqual(1);
    });
  });

  it("works even if suspend is the only operation", async () => {
    await run(function* () {
      let process = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "--allow-env", "test/main/just.suspend.ts"],
      });
      let stdout = yield* buffer(process.stdout);
      yield* detect(stdout, "started");

      process.kill("SIGINT");

      let status = yield* process.status;

      expect(status.code).toBe(130);

      yield* detect(stdout, "gracefully stopped");
    });
  });
});
