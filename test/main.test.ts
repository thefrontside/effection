import { describe, expect, it, useCommand } from "./suite.ts";
import { type Operation, resource, run, sleep, spawn } from "../mod.ts";

describe("main", () => {
  it("gracefully shuts down on SIGINT", async () => {
    await run(function* () {
      let daemon = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "test/main/ok.daemon.ts"],
      });
      let stdout = yield* buffer(daemon.stdout);
      yield* detect(stdout, "started");

      daemon.kill("SIGINT");

      let status = yield* daemon.status;

      expect(status.code).toBe(130);

      yield* detect(stdout, "gracefully stopped");
    });
  });

  it("gracefully shuts down on SIGTERM", async () => {
    await run(function* () {
      let daemon = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "test/main/ok.daemon.ts"],
      });
      let stdout = yield* buffer(daemon.stdout);
      yield* detect(stdout, "started");

      daemon.kill("SIGTERM");

      let status = yield* daemon.status;

      expect(status.code).toBe(143);

      yield* detect(stdout, "gracefully stopped");
    });
  });

  it("exits gracefully on explicit exit()", async () => {
    await run(function* () {
      let cmd = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "test/main/ok.exit.ts"],
      });

      let stdout = yield* buffer(cmd.stdout);

      yield* detect(stdout, "goodbye.\nOk, computer.");
    });
  });

  it("exits gracefully with 0 on implicit exit", async () => {
    await run(function* () {
      let cmd = yield* useCommand("deno", {
        stdout: "piped",
        args: ["run", "test/main/ok.implicit.ts"],
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
        args: ["run", "test/main/fail.exit.ts"],
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
        args: ["run", "test/main/fail.unexpected.ts"],
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
        args: ["run", "test/main/just.suspend.ts"],
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

interface Buffer {
  content: string;
}

function buffer(stream: ReadableStream<Uint8Array>): Operation<Buffer> {
  return resource<{ content: string }>(function* (provide) {
    let buff = { content: " " };
    yield* spawn(function* () {
      let decoder = new TextDecoder();
      let reader = stream.getReader();

      try {
        let next = yield* reader.read();
        while (!next.done) {
          buff.content += decoder.decode(next.value);
          next = yield* reader.read();
        }
      } finally {
        yield* reader.cancel();
      }
    });

    yield* provide(buff);
  });
}

function* detect(
  buffer: Buffer,
  text: string,
  options: { timeout: number } = { timeout: 1000 },
): Operation<void> {
  let start = new Date().getTime();

  while ((new Date().getTime() - start) < options.timeout) {
    if (buffer.content.includes(text)) {
      return;
    }
    yield* sleep(10);
  }
  expect(buffer.content).toContain(text);
}
