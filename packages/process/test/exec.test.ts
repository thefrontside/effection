import { Task, spawn, fetch, Labels } from 'effection';
import { describe, it, beforeEach, captureError } from '@effection/mocha';
import expect from 'expect';

// delete this once we see to test difference
import { default as execaCommand } from 'execa';

import { exec, Process, ProcessResult } from '../src';

describe('exec', () => {
  describe('.join', () => {
    it('runs successfully to completion', function*() {
      let result: ProcessResult = yield exec("node './test/fixtures/hello-world.js'").join();

      expect(result.code).toEqual(0);
      expect(result.stdout).toEqual('hello\nworld\n');
      expect(result.stderr).toEqual('boom\n');
    });

    it('runs failed process to completion', function*() {
      let result: ProcessResult = yield exec("node './test/fixtures/hello-world-failed.js'").join();

      expect(result.code).toEqual(37);
      expect(result.stdout).toEqual('hello world\n');
      expect(result.stderr).toEqual('boom\n');
    });

    it('applies labels', function*() {
      expect((exec("foo").join()?.labels as Labels)?.name).toEqual('exec("foo").join()');
    });
  });

  describe('.expect', () => {
    it('runs successfully to completion', function*() {
      let result: ProcessResult = yield exec("node './test/fixtures/hello-world.js'").expect();

      expect(result.code).toEqual(0);
      expect(result.stdout).toEqual('hello\nworld\n');
      expect(result.stderr).toEqual('boom\n');
    });

    it('throws an error if process fails', function*() {
      let error: Error = yield captureError(exec("node './test/fixtures/hello-world-failed.js'").expect());

      expect(error.name).toEqual('ExecError');
    });

    it('applies labels', function*() {
      expect((exec("foo").expect()?.labels as Labels)?.name).toEqual('exec("foo").expect()');
    });
  });

  it('applies labels to resource', function*() {
    expect(exec("foo").name).toEqual('exec("foo")');
  });

  describe('spawning', () => {
    describe('a process that fails to start', () => {
      describe('calling join()', () => {
        it('reports the failed status', function*() {
          let error: unknown;
          let proc = yield exec("argle", { arguments: ['bargle'] });
          try {
            yield proc.join();
          } catch(e) {
            error = e;
          }
          expect(error).toBeInstanceOf(Error);
        });
      });

      describe('calling expect()', () => {
        it('fails', function*() {
          let error: unknown;
          let proc = yield exec("argle", { arguments: ['bargle'] });
          try {
            yield proc.expect()
          } catch (e) { error = e; }

          expect(error).toBeDefined();
        });
      });
    });

    describe('a process that starts successfully', () => {
      let proc: Process;
      let joinStdout: Task;
      let joinStderr: Task;

      beforeEach(function*() {
        proc = yield exec("node './fixtures/echo-server.js'", {
          env: { PORT: '29000', PATH: process.env.PATH as string },
          cwd: __dirname,
        });

        joinStdout = yield spawn(proc.stdout.join());
        joinStderr = yield spawn(proc.stderr.join());

        yield proc.stdout.lines().filter((v) => v.includes('listening')).expect();
      });

      it('has a pid', function*() {
        expect(typeof proc.pid).toBe('number');
        expect(proc.pid).not.toBeNaN();
      });

      describe('when it succeeds', () => {
        beforeEach(function*() {
          yield fetch('http://localhost:29000', { method: "POST", body: "exit" });
        });

        it('joins successfully', function*() {
          let status = yield proc.join();
          expect(status.code).toEqual(0);
        });

        it('expects successfully', function*() {
          let status = yield proc.expect();
          expect(status.code).toEqual(0);
        });

        it('closes stdout and stderr', function*() {
          yield proc.expect();
          expect(yield joinStdout).toEqual(undefined);
          expect(yield joinStderr).toEqual(undefined);
        });
      });

      describe('when it fails', () => {
        let error: Error
        beforeEach(function*() {
          yield fetch('http://localhost:29000', { method: "POST", body: "fail" });
        });

        it('joins successfully', function*() {
          let status = yield proc.join();
          expect(status.code).not.toEqual(0);
        });

        it('expects unsuccessfully', function*() {
          yield function* () {
            try {
              yield proc.expect();
            } catch (e) {
              error = e;
            }
          };
          expect(error).toBeDefined()
        });

        it('closes stdout and stderr', function*() {
          expect(yield joinStdout).toEqual(undefined);
          expect(yield joinStderr).toEqual(undefined);
        });
      });
    });
  });

  // running shell scripts in windows is not well supported, our windows
  // process stuff sets shell to `false` and so you probably shouldn't do this
  // in windows at all.
  if (process.platform !== 'win32') {
    describe('when the `shell` option is true', () => {
      it('lets the shell do all of the shellword parsing', function*() {
        let proc = exec('echo "first" | echo "second"', {
          shell: true
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("second\n");
      })
    });
  }

  describe("when the `shell` option is `false`", () => {
    it("automatically parses the command arguments using shellwords", function* () {
      let proc = exec('echo "first" | echo "second"', {
        shell: false,
      });
      let { stdout }: ProcessResult = yield proc.expect();

      expect(stdout).toEqual("first | echo second\n");
    });
  });

  describe("handles env vars", () => {
    describe("env as option - shell: bash", () => {
      it("echo env", function* () {
        let proc = exec("echo $EFFECTION_TEST_ENV_VAL", {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          shell: "bash",
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });

      it("echo curly env", function* () {
        let proc = exec("echo ${EFFECTION_TEST_ENV_VAL}", {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          shell: "bash",
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });
    });

    describe("env as option - shell: true", () => {
      it("echo env", function* () {
        let proc = exec("echo $EFFECTION_TEST_ENV_VAL", {
          shell: true,
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });

      it("echo curly env", function* () {
        let proc = exec("echo ${EFFECTION_TEST_ENV_VAL}", {
          shell: true,
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });
    });

    describe("env as option - shell: false", () => {
      it("echo env", function* () {
        let proc = exec("echo $EFFECTION_TEST_ENV_VAL", {
          shell: false,
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });

      it("echo curly env", function* () {
        let proc = exec("echo ${EFFECTION_TEST_ENV_VAL}", {
          shell: false,
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });
    });

    describe.only("env as option - shell: process.env.shell", () => {
      it("echo env", function* () {
        let proc = exec("echo $EFFECTION_TEST_ENV_VAL", {
          shell: process.env.shell,
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });

      it("echo curly env", function* () {
        let proc = exec("echo ${EFFECTION_TEST_ENV_VAL}", {
          shell: process.env.shell,
          env: { EFFECTION_TEST_ENV_VAL: "boop" },
        });
        let { stdout }: ProcessResult = yield proc.expect();

        expect(stdout).toEqual("boop\n");
      });
    });

    describe("execa@5 handles env vars", () => {
      describe("env as option - shell: bash", () => {
        it("echo env", function* () {
          let { stdout } = yield execaCommand("echo $EFFECTION_TEST_ENV_VAL", {
            shell: "bash",
            env: { EFFECTION_TEST_ENV_VAL: "boop" },
          });

          expect(stdout).toEqual("boop");
        });

        it("echo curly env", function* () {
          let { stdout } = yield execaCommand(
            "echo ${EFFECTION_TEST_ENV_VAL}",
            {
              shell: "bash",
              env: { EFFECTION_TEST_ENV_VAL: "boop" },
            }
          );

          expect(stdout).toEqual("boop");
        });
      });

      describe("env as option - shell: true", () => {
        it("echo env", function* () {
          let { stdout } = yield execaCommand("echo $EFFECTION_TEST_ENV_VAL", {
            shell: true,
            env: { EFFECTION_TEST_ENV_VAL: "boop" },
          });

          expect(stdout).toEqual("boop");
        });

        it("echo curly env", function* () {
          let { stdout } = yield execaCommand(
            "echo ${EFFECTION_TEST_ENV_VAL}",
            {
              shell: true,
              env: { EFFECTION_TEST_ENV_VAL: "boop" },
            }
          );

          expect(stdout).toEqual("boop");
        });
      });

      describe("env as option - shell: false", () => {
        it("echo env", function* () {
          let { stdout } = yield execaCommand("echo $EFFECTION_TEST_ENV_VAL", {
            shell: false,
            env: { EFFECTION_TEST_ENV_VAL: "boop" },
          });

          expect(stdout).toEqual("boop");
        });

        it("echo curly env", function* () {
          let { stdout } = yield execaCommand(
            "echo ${EFFECTION_TEST_ENV_VAL}",
            {
              shell: false,
              env: { EFFECTION_TEST_ENV_VAL: "boop" },
            }
          );

          expect(stdout).toEqual("boop");
        });
      });

      describe("env that exists through yarn/npm - shell: bash", () => {
        it("echo env", function* () {
          let { stdout } = yield execaCommand("echo $npm_lifecycle_event", {
            shell: "bash",
          });

          expect(stdout).toEqual("test");
        });

        it("echo curly env", function* () {
          let { stdout } = yield execaCommand("echo ${npm_lifecycle_event}", {
            shell: "bash",
          });

          expect(stdout).toEqual("test");
        });
      });

      describe("env that exists through yarn/npm - shell: true", () => {
        it("echo env", function* () {
          let { stdout } = yield execaCommand("echo $npm_lifecycle_event", {
            shell: true,
          });

          expect(stdout).toEqual("test");
        });

        it("echo curly env", function* () {
          let { stdout } = yield execaCommand("echo ${npm_lifecycle_event}", {
            shell: true,
          });

          expect(stdout).toEqual("test");
        });
      });

      describe("env that exists through yarn/npm - shell: false", () => {
        it("echo env", function* () {
          let { stdout } = yield execaCommand("echo $npm_lifecycle_event", {
            shell: false,
          });

          expect(stdout).toEqual("test");
        });

        it("echo curly env", function* () {
          let { stdout } = yield execaCommand("echo ${npm_lifecycle_event}", {
            shell: false,
          });

          expect(stdout).toEqual("test");
        });
      });
    });
  });

});
