import { $await, describe, expect, it, x } from "./suite.ts";
import { each, type Operation, resource, run, sleep, spawn, type Stream } from "../mod.ts";

function* until(stream: Stream<string, void>, text: string) {
  for (const line of yield* each(stream)) {
    if (line.includes(text)) {
      return;
    }
    yield* each.next();
  }
}

describe("main", () => {
  it("gracefully shuts down on SIGINT", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/ok.daemon.ts"]);

      yield* until(proc.lines, "started");

      const { exitCode, stdout } = yield* proc.kill("SIGINT");
      
      expect(stdout).toContain("gracefully stopped");

      expect(exitCode).toBe(130);
    });
  });

  it("gracefully shuts down on SIGTERM", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/ok.daemon.ts"]);

      yield* until(proc.lines, "started");

      const { exitCode, stdout } = yield* proc.kill("SIGTERM");

      expect(stdout).toContain("gracefully stopped");
      
      expect(exitCode).toBe(143);
    });
  });

  it("exits gracefully on explicit exit()", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/ok.exit.ts"]);

      yield* until(proc.lines, "goodbye.");
      yield* until(proc.lines, "Ok, computer.");
    });
  });

  it("exits gracefully with 0 on implicit exit", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/ok.implicit.ts"]);

      yield* until(proc.lines, "goodbye.");

      const { exitCode } = yield* proc;

      expect(exitCode).toEqual(0);
    });
  });

  it("exits gracefully on explicit exit failure exit()", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/fail.exit.ts"]);

      const { stderr, exitCode, stdout } = yield* proc;

      expect(stdout).toContain("graceful goodbye");
      expect(stderr).toContain("It all went horribly wrong");
      expect(exitCode).toEqual(23);
    });
  });

  it("error exits gracefully on unexpected errors", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/fail.unexpected.ts"]);

      const { stderr, stdout, exitCode } = yield* proc;

      expect(stdout).toContain("graceful goodbye");
      expect(stderr).toContain("Error: moo");
      expect(exitCode).toEqual(1);
    });
  });

  it("works even if suspend is the only operation", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/just.suspend.ts"]);

      yield* until(proc.lines, "started");

      const { exitCode, stdout } = yield* proc.kill("SIGINT");
      
      expect(exitCode).toBe(130);
      expect(stdout).toContain("gracefully stopped");
    });
  });
});

