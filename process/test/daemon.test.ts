import process from "node:process";
import { platform } from "node:os";
import { beforeEach, describe, it } from "@effectionx/vitest";
import {
  type Operation,
  type Task,
  scoped,
  sleep,
  spawn,
  suspend,
  until,
  withResolvers,
} from "effection";
import { expect } from "expect";

import { lines } from "@effectionx/stream-helpers";
import { daemon, DaemonExitError, type Process, ProcessApi } from "../mod.ts";
import { captureError, expectMatch, fetchText } from "./helpers.ts";

const SystemRoot = process.env.SystemRoot;

function* waitForProcessExit(pid: number): Operation<void> {
  while (true) {
    try {
      process.kill(pid, 0);
      yield* sleep(0);
    } catch {
      return;
    }
  }
}

describe("daemon", () => {
  describe("controlling from outside", () => {
    let task: Task<void>;
    let proc: Process;
    beforeEach(function* () {
      const result = withResolvers<Process>();
      task = yield* spawn<void>(function* () {
        proc = yield* daemon("node", {
          arguments: [
            "--experimental-strip-types",
            "./fixtures/echo-server.ts",
          ],
          env: {
            PORT: "29002",
            PATH: process.env.PATH as string,
            ...(SystemRoot ? { SystemRoot } : {}),
          },
          cwd: import.meta.dirname,
        });
        result.resolve(proc);
        yield* suspend();
      });

      proc = yield* result.operation;

      const listening = yield* expectMatch(/listening/, lines()(proc.stdout));
      expect(listening).toBe(true);
    });

    it("starts the given child", function* () {
      const response = yield* fetchText("http://localhost:29002", {
        method: "POST",
        body: "hello",
      });

      expect(response.status).toEqual(200);
      expect(response.text).toEqual("hello");
    });

    describe("halting the daemon task", () => {
      beforeEach(function* () {
        yield* until(task.halt());
      });
      it("kills the process", function* () {
        expect(
          yield* captureError(
            fetchText("http://localhost:29002", {
              method: "POST",
              body: "hello",
            }),
          ),
        ).toMatchObject({
          message: expect.stringContaining("FetchError"),
        });
      });
    });
  });

  describe.skipIf(platform() === "win32")(
    "shutting down the daemon process prematurely",
    () => {
      let sibling: Process;
      let error: DaemonExitError;

      beforeEach(function* () {
        const commands: string[] = [];

        yield* ProcessApi.around({
          *exec(args, next) {
            commands.push(args[0]);
            return yield* next(...args);
          },
        });

        error = (yield* captureError(
          scoped(function* () {
            const failing = yield* daemon("node", {
              arguments: ["-e", "setInterval(() => {}, 1000)"],
            });
            sibling = yield* daemon("node", {
              arguments: ["-e", "setInterval(() => {}, 1000)"],
            });

            process.kill(failing.pid, "SIGTERM");
            yield* suspend();
          }),
        )) as DaemonExitError;

        expect(commands).toEqual(["node", "node"]);
      });

      it("propagates the exit and terminates sibling daemons", function* () {
        expect(error).toBeInstanceOf(DaemonExitError);
        expect(error.status).toMatchObject({ signal: "SIGTERM" });

        yield* waitForProcessExit(sibling.pid);
        expect(() => process.kill(sibling.pid, 0)).toThrow();
      });
    },
  );

  describe("shutting down an effection-based daemon process prematurely", () => {
    let task: Task<void>;
    let proc: Process;
    beforeEach(function* () {
      const ready = withResolvers<void>();
      task = yield* spawn(function* () {
        try {
          proc = yield* daemon("node", {
            arguments: ["--experimental-strip-types", "fixtures/forever.ts"],
            cwd: import.meta.dirname,
          });
          ready.resolve();
          yield* suspend();
        } catch (e) {
          // ignore the error from the process exiting
          //  we just want to check that the finally block runs
        }
      });

      yield* ready.operation;
      const suspending = yield* expectMatch(/suspending/, lines()(proc.stdout));
      expect(suspending).toBe(true);
    });

    it("still executes process finally block on kill", function* () {
      const finallyCheck = yield* spawn(() =>
        expectMatch(/shutting/, lines()(proc.stdout)),
      );
      // ensure that spawn has kicked off
      yield* sleep(0);
      yield* task.halt();
      const completed = yield* finallyCheck;
      expect(completed).toBe(true);
    });
  });
});
