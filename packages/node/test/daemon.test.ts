import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import { Context, spawn } from 'effection';
import { subscribe } from '@effection/subscription';

import { World, converge } from './helpers';

import { daemon, StdIO } from '../src';

describe('daemon()', () => {
  let io: StdIO;
  let output: string;
  let errput: string;
  let context: Context;
  let error: Error;

  beforeEach(async () => {
    output = '';
    context = World.spawn(function*() {
      try {
        yield function*() {
          io = yield daemon('node', {
            arguments: ['./fixtures/echo-server.js'],
            env: { PORT: '29000', PATH: process.env.PATH as string },
            cwd: __dirname,
          });

          yield spawn(subscribe(io.stdout).forEach(function*(chunk) {
            output += chunk;
          }))

          yield spawn(subscribe(io.stderr).forEach(function*(chunk) {
            errput += chunk;
          }));

          yield;
        }
      } catch (e) {
        error = e;
      }
    });

    await converge(() => expect(output).toContain("listening"));
  });

  it('starts the given child', async () => {
    let result = await fetch('http://localhost:29000', { method: "POST", body: "hello" });
    let text = await result.text();

    expect(result.status).toEqual(200);
    expect(text).toEqual("hello");
  });

  describe('halting the daemon context', () => {
    beforeEach(() => {
      context.halt();
    });

    it('kills the process', async () => {
      try {
        await fetch(`http://localhost:29000`, { method: "POST", body: "hello" });
        throw new Error('daemon process did not shut down');
      } catch (error) {
        expect(error.name).toEqual('FetchError');
      }
    });
  });

  describe('shutting down the daemon process prematurely', () => {
    beforeEach(async () => {
      await fetch('http://localhost:29000', { method: "POST", body: "exit" });
      await converge(() => expect(error).toBeDefined());
    });

    it('throw an error because it was not expected to close', () => {
      expect(error.name).toEqual('DaemonExitError');
    });
  });
});
