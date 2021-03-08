import { describe, it, beforeEach, afterEach } from '@effection/mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import '@effection/mocha';
import { run, Task } from '@effection/core';

import { converge } from './helpers';

import { daemon, StdIO } from '../src';

describe('daemon()', () => {
  let output: string;
  let task: Task;
  let error: Error;

  beforeEach(function*(t) {
    output = '';

    task = run(function*(inner) {
      let io = daemon(inner, 'node', {
        arguments: ['./fixtures/echo-server.js'],
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
      });

      inner.spawn(io.stdout.forEach((chunk) => { output += chunk; }));

      yield
    });

    yield converge(() => expect(output).toContain("listening"));
  });

  afterEach(function*() {
    yield task.halt();
  });

  it('starts the given child', function*() {
    let result = yield fetch('http://localhost:29000', { method: "POST", body: "hello" });
    let text = yield result.text();

    expect(result.status).toEqual(200);
    expect(text).toEqual("hello");
  });

  describe('halting the daemon task', () => {
    beforeEach(function*() {
      task.halt();
    });

    it('kills the process', function*() {
      yield expect(fetch(`http://localhost:29000`, { method: "POST", body: "hello" })).rejects.toHaveProperty('name', 'FetchError');
    });
  });

  describe('shutting down the daemon process prematurely', () => {
    beforeEach(function*() {
      yield fetch('http://localhost:29000', { method: "POST", body: "exit" });
    });

    it('throw an error because it was not expected to close', function*() {
      yield expect(task).rejects.toHaveProperty('name', 'DaemonExitError');
    });
  });
});
