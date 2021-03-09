import { describe, it, beforeEach } from '@effection/mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import { subscribe } from '@effection/subscription';

import { converge } from './helpers';

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
    let output: string;
    let errput: string;
    let didClose: {stdout: boolean; stderr: boolean };

    beforeEach(function*(task) {
      output = '';
      errput = '';
      didClose = { stdout: false, stderr: false };

      proc = exec(task, "node './fixtures/echo-server.js'", {
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
      });

      task.spawn(function*() {
        yield proc.stdout.forEach((chunk) => function*() {
          output += chunk;
        });
        didClose.stdout = true;
      });

      task.spawn(function*() {
        yield proc.stderr.forEach((chunk) => function*() {
          errput += chunk;
        });
        didClose.stderr = true;
      });

      yield converge(() => expect(output).toContain("listening"));
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
        expect(output).toContain('exit(0)');
        expect(errput).toContain('got request');
        yield converge(() => expect(didClose).toEqual({ stdout: true, stderr: true }));
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
        yield converge(() => expect(didClose).toEqual({ stdout: true, stderr: true }));
      });
    });
  });
});
