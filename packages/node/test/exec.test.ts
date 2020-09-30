import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import { subscribe } from '@effection/subscription';

import { World, converge } from './helpers';

import { exec, Process, ExitStatus } from '../src';

describe('exec()', () => {
  let proc: Process;
  let status: ExitStatus;

  describe('a process that fails to start', () => {
    beforeEach(async () => {
      proc = await World.spawn(exec("argle", { arguments: ['bargle'] }));
    });

    describe('calling join()', () => {
      beforeEach(async () => {
        status = await World.spawn(proc.join());
      });

      it('reports the failed status', () => {
        expect(status.code).not.toEqual(0);
      });
    });

    describe('calling expect()', () => {
      let error: unknown;
      beforeEach(async () => {
        await World.spawn(function* () {
          try {
            yield proc.expect()
          } catch (e) { error = e; }
        });

      });

      it('fails', () => {
        expect(error).toBeDefined();
        expect(error).toMatchObject({ name: 'ExecError' });
      });
    });
  });

  describe('a process that starts successfully', () => {
    let proc: Process;
    let output: string;

    beforeEach(async () => {
      output = '';
      proc = await World.spawn(exec("node", {
        arguments: ['./fixtures/echo-server.js'],
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
      }));

      World.spawn(subscribe(proc.stdout).forEach(function*(chunk) {
        output += chunk;
      }));

      await converge(() => expect(output).toContain("listening"));
    });

    describe('when it succeeds', () => {
      beforeEach(async () => {
        await fetch('http://localhost:29000', { method: "POST", body: "exit" });
      });

      it('joins successfully', async () => {
        let status = await World.spawn(proc.join());
        expect(status.code).toEqual(0);
      });

      it('expects successfully', async () => {
        let status = await World.spawn(proc.expect());
        expect(status.code).toEqual(0);
      });
    });

    describe('when it fails', () => {
      let error: Error
      beforeEach(async () => {
        await fetch('http://localhost:29000', { method: "POST", body: "fail" });
      });

      it('joins successfully', async () => {
        let status = await World.spawn(proc.join());
        expect(status.code).not.toEqual(0);
      });

      it('expects unsuccessfully', async () => {
        await World.spawn(function* () {
          try {
            yield proc.expect();
          } catch (e) {
            error = e;
          }
        });
        expect(error).toBeDefined()
      });
    });
  });
});
