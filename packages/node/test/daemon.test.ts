import { describe, it, beforeEach, afterEach } from '@effection/mocha';
import * as expect from 'expect';
import fetch from 'node-fetch';

import '@effection/mocha';
import { run, Task, Deferred } from '@effection/core';

import { daemon, Process } from '../src';

describe('daemon', () => {
  let task: Task;
  let proc: Process;

  beforeEach(function*() {
    let deferred = Deferred<Process>();
    task = run(function*(inner) {
      deferred.resolve(yield inner.spawn(daemon('node', {
        arguments: ['./fixtures/echo-server.js'],
        env: { PORT: '29000', PATH: process.env.PATH as string },
        cwd: __dirname,
      })));
      yield
    });
    proc = yield deferred.promise;

    yield proc.stdout.filter((v) => v.includes('listening')).expect();
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
