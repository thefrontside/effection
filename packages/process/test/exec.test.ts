import { Task } from '@effection/core';
import { describe, it, beforeEach, captureError } from '@effection/mocha';
import * as expect from 'expect';

import { exec, Process, ProcessResult } from '../src';
import fetch from 'node-fetch';

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

      beforeEach(function*(task) {
        proc = yield exec("node './fixtures/echo-server.js'", {
          env: { PORT: '29000', PATH: process.env.PATH as string },
          cwd: __dirname,
          buffered: true,
        });

        joinStdout = task.spawn(proc.stdout.join());
        joinStderr = task.spawn(proc.stderr.join());

        yield proc.stdout.filter((v) => v.includes('listening')).expect();
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
          let output = yield proc.stdout.expect();
          let errput = yield proc.stderr.expect();
          expect(output).toContain('exit(0)');
          expect(errput).toContain('got request');
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

      describe('when it fails', () => {
        let error: Error
        beforeEach(function*() {
          yield fetch('http://localhost:29000', { method: "POST", body: "fail" });
        });

        it('joins successfully', function*() {
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

  describe('when the `shell` option is `false`', () => {
    it('automatically parses the command argumens using shellwords', function*() {
      let proc = exec('echo "first" | echo "second"', {
        shell: false
      });
      let { stdout }: ProcessResult = yield proc.expect();

      expect(stdout).toEqual("first | echo second\n");
    })
  });

});
