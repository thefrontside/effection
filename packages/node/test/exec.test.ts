import { describe, it, beforeEach, captureError } from '@effection/mocha';
import * as expect from 'expect';

import { Deferred } from '@effection/core';
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

  describe('.run', () => {
    describe('a process that fails to start', () => {
      describe('calling join()', () => {
        it('reports the failed status', function*(task) {
          let error: unknown;
          let proc = exec("argle", { arguments: ['bargle'] }).run(task);
          try {
            yield proc.join();
          } catch(e) {
            error = e;
          }
          expect(error).toBeInstanceOf(Error);
        });
      });

      describe('calling expect()', () => {
        it('fails', function*(task) {
          let error: unknown;
          let proc = exec("argle", { arguments: ['bargle'] }).run(task);
          try {
            yield proc.expect()
          } catch (e) { error = e; }

          expect(error).toBeDefined();
        });
      });
    });

    describe('a process that starts successfully', () => {
      let proc: Process;
      let didCloseStdout: Deferred<boolean>;
      let didCloseStderr: Deferred<boolean>;

      beforeEach(function*(task) {
        didCloseStdout = Deferred<boolean>();
        didCloseStderr = Deferred<boolean>();

        proc = exec("node './fixtures/echo-server.js'", {
          env: { PORT: '29000', PATH: process.env.PATH as string },
          cwd: __dirname,
          buffered: true,
        }).run(task);

        task.spawn(function*() {
          yield proc.stdout.join();
          didCloseStdout.resolve(true);
        });

        task.spawn(function*() {
          yield proc.stderr.join();
          didCloseStderr.resolve(true);
        });

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
          expect(yield didCloseStdout.promise).toEqual(true);
          expect(yield didCloseStderr.promise).toEqual(true);
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
          expect(yield didCloseStdout.promise).toEqual(true);
          expect(yield didCloseStderr.promise).toEqual(true);
        });
      });
    });
  });
});
