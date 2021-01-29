import { describe, beforeEach, it } from 'mocha';
import * as expect from 'expect';

import { run, Task } from '../src/index';
import { Deferred } from '../src/deferred';

function* sleep(ms: number) {
  let timeout;
  let deferred = Deferred();
  try {
    timeout = setTimeout(deferred.resolve, ms);
    yield deferred.promise;
  } finally {
    timeout && clearTimeout(timeout);
  }
};

describe('fork', () => {
  it('can fork a new child task', async () => {
    let root = run(function*(context: Task) {
      let child = context.fork(function*() {
        let one: number = yield Promise.resolve(12);
        let two: number = yield Promise.resolve(55);

        return one + two;
      });

      return yield child;
    });
    await expect(root).resolves.toEqual(67);
    expect(root.state).toEqual('completed');
  });

  it('halts child when halted', async () => {
    let child: Task<void> | undefined;
    let root = run(function*(context: Task) {
      child = context.fork(function*() {
        yield;
      });

      yield;
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty('message', 'halted')
    expect(root.state).toEqual('halted');
    expect(child && child.state).toEqual('halted');
  });

  it('blocks on child when finishing normally', async () => {
    let child: Task<string> | undefined;
    let root = run(function*(context: Task) {
      child = context.fork(function*() {
        yield sleep(5);
        return 'foo';
      });

      return 1;
    });

    await expect(root).resolves.toEqual(1);
    await expect(child).resolves.toEqual('foo');
    expect(root.state).toEqual('completed');
    expect(child && child.state).toEqual('completed');
  });

  it('halts child when errored', async () => {
    let child;
    let root = run(function*(context: Task) {
      child = context.fork(function*() {
        yield;
      });

      throw new Error('boom');
    });

    await expect(root).rejects.toHaveProperty('message', 'boom');
    await expect(child).rejects.toHaveProperty('message', 'halted');
  });

  it('rejects parent when child errors', async () => {
    let child;
    let error = new Error("moo");
    let root = run(function*(context: Task) {
      child = context.fork(function*() {
        throw error;
      });

      yield;
    });

    await expect(child).rejects.toEqual(error);
    await expect(root).rejects.toEqual(error);
    expect(root.state).toEqual('errored');
  });

  it('finishes normally when child halts', async () => {
    let child;
    let root = run(function*(context: Task<string>) {
      child = context.fork();
      yield child.halt();

      return "foo";
    });

    await expect(child).rejects.toHaveProperty('message', 'halted');
    await expect(root).resolves.toEqual("foo");
    expect(root.state).toEqual('completed');
  });

  it('rejects when child errors during completing', async () => {
    let child;
    let root = run(function*(context: Task<string>) {
      child = context.fork(function*() {
        try {
          yield sleep(5);
        } finally {
          throw new Error("moo");
        }
      });
      return "foo";
    });

    await expect(root).rejects.toHaveProperty('message', 'moo');
    expect(root.state).toEqual('errored');
  });

  it('rejects when child errors during halting', async () => {
    let child;
    let root = run(function*(context: Task<string>) {
      child = context.fork(function*(foo) {
        try {
          yield
        } finally {
          throw new Error("moo");
        }
      });
      yield;
      return "foo";
    });

    root.halt();

    await expect(root).rejects.toHaveProperty('message', 'moo');
    expect(root.state).toEqual('errored');
  });

  it('throws an error when called after controller finishes', async () => {
    let child;
    let root = run(function*(context: Task) {
      child = context.fork(function*() {
        try {
          yield sleep(1);
        } finally {
          yield sleep(100);
        }
      });

      yield sleep(10);
    });

    await run(sleep(20));

    expect(() => root.fork()).toThrowError('cannot fork a child on a task which is not running');
  });
});
