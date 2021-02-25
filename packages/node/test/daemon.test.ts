import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import { Task, run } from '@effection/core';
import { subscribe } from '@effection/subscription';

import { converge } from './helpers';

import { daemon, StdIO } from '../src';

describe('daemon()', () => {
  let io: StdIO;
  let output: string;
  let errput: string;
  let task: Task;
  let error: Error;

  beforeEach(async () => {
    output = '';
    task = run(function*(task) {
      io = daemon(task, 'node', {
        arguments: ['./fixtures/echo-server.js'],
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
      });

      task.spawn(subscribe(task, io.stdout).forEach((chunk) => function*() {
        output += chunk;
      }))

      task.spawn(subscribe(task, io.stderr).forEach((chunk) => function*() {
        errput += chunk;
      }));

      yield;
    });

    await converge(() => expect(output).toContain("listening"));
  });

  it('starts the given child', async () => {
    let result = await fetch('http://localhost:29000', { method: "POST", body: "hello" });
    let text = await result.text();

    expect(result.status).toEqual(200);
    expect(text).toEqual("hello");
  });

  describe('halting the daemon task', () => {
    beforeEach(() => {
      task.halt();
    });

    it('kills the process', async () => {
      await expect(fetch(`http://localhost:29000`, { method: "POST", body: "hello" })).rejects.toHaveProperty('name', 'FetchError');
    });
  });

  describe('shutting down the daemon process prematurely', () => {
    beforeEach(async () => {
      await fetch('http://localhost:29000', { method: "POST", body: "exit" });
    });

    it('throw an error because it was not expected to close', async () => {
      await expect(task).rejects.toHaveProperty('name', 'DaemonExitError');
    });
  });
});
