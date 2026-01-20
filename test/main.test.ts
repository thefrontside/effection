import { describe, expect, it, x } from "./suite.ts";
import { each, run, type Stream } from "../mod.ts";

function* detect(stream: Stream<string, void>, text: string) {
  for (let line of yield* each(stream)) {
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

      yield* detect(proc.lines, "started");

      let { exitCode, stdout } = yield* proc.kill("SIGINT");

      expect(stdout).toContain("gracefully stopped");

      expect(exitCode).toBe(130);
    });
  });

  if (Deno.build.os !== "windows") {
    it("gracefully shuts down on SIGTERM", async () => {
      await run(function* () {
        let proc = yield* x("deno", ["run", "test/main/ok.daemon.ts"]);

        yield* detect(proc.lines, "started");

        let { exitCode, stdout } = yield* proc.kill("SIGTERM");

        expect(stdout).toContain("gracefully stopped");

        expect(exitCode).toBe(143);
      });
    });
  }

  it("exits gracefully on explicit exit()", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/ok.exit.ts"]);

      yield* detect(proc.lines, "goodbye.");
      yield* detect(proc.lines, "Ok, computer.");
    });
  });

  it("exits gracefully with 0 on implicit exit", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/ok.implicit.ts"]);

      yield* detect(proc.lines, "goodbye.");

      let { exitCode } = yield* proc;

      expect(exitCode).toEqual(0);
    });
  });

  it("exits gracefully on explicit exit failure exit()", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/fail.exit.ts"]);

      let { stderr, exitCode, stdout } = yield* proc;

      expect(stdout).toContain("graceful goodbye");
      expect(stderr).toContain("It all went horribly wrong");
      expect(exitCode).toEqual(23);
    });
  });

  it("error exits gracefully on unexpected errors", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/fail.unexpected.ts"]);

      let { stderr, stdout, exitCode } = yield* proc;

      expect(stdout).toContain("graceful goodbye");
      expect(stderr).toContain("Error: moo");
      expect(exitCode).toEqual(1);
    });
  });

  it("works even if suspend is the only operation", async () => {
    await run(function* () {
      let proc = yield* x("deno", ["run", "test/main/just.suspend.ts"]);

      yield* detect(proc.lines, "started");

      let { exitCode, stdout } = yield* proc.kill("SIGINT");

      expect(exitCode).toBe(130);
      expect(stdout).toContain("gracefully stopped");
    });
  });
});
