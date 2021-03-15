import { Deferred } from '@effection/core';
import { describe, it, beforeEach } from '@effection/mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import { exec, Process } from '../src';

describe('exec()', () => {
  describe('a process that fails to start', () => {
    describe('calling join()', () => {
      it('reports the failed status', function*(task) {
        let error: unknown;
        let proc = exec(task, "argle", { arguments: ['bargle'] });
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
        let proc = exec(task, "argle", { arguments: ['bargle'] });
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

      proc = exec(task, "node './fixtures/echo-server.js'", {
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
        buffered: true,
      });

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
