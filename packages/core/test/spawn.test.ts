import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep, Task } from '../src/index';

describe('spawn', () => {
  it('can spawn a new child task', async () => {
    let root = run(function*(context: Task) {
      let child = context.spawn(function*() {
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
      child = context.spawn(function*() {
        yield;
      });

      yield;
    });

    await root.halt();

    await expect(child).rejects.toHaveProperty('message', 'halted')
    expect(root.state).toEqual('halted');
    expect(child && child.state).toEqual('halted');
  });

  it('halts child when finishing normally', async () => {
    let child: Task<void> | undefined;
    let root = run(function*(context: Task) {
      child = context.spawn(function*() {
        yield;
      });

      return 1;
    });

    await expect(root).resolves.toEqual(1);
    await expect(child).rejects.toHaveProperty('message', 'halted')
    expect(root.state).toEqual('completed');
    expect(child && child.state).toEqual('halted');
  });

  it('halts child when errored', async () => {
    let child;
    let root = run(function*(context: Task) {
      child = context.spawn(function*() {
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
      child = context.spawn(function*() {
        throw error;
      });

      yield;
    });

    await expect(root).rejects.toEqual(error);
    await expect(child).rejects.toEqual(error);
    expect(root.state).toEqual('errored');
  });

  it('finishes normally when child halts', async () => {
    let child;
    let root = run(function*(context: Task<string>) {
      child = context.spawn();
      yield child.halt();

      return "foo";
    });

    await expect(root).resolves.toEqual("foo");
    await expect(child).rejects.toHaveProperty('message', 'halted');
    expect(root.state).toEqual('completed');
  });

  it('rejects when child errors during completing', async () => {
    let child;
    let root = run(function*(context: Task<string>) {
      child = context.spawn(function*() {
        try {
          yield
        } finally {
          throw new Error("moo");
        }
      });
      return "foo";
    });

    await expect(root).rejects.toHaveProperty('message', 'moo');
    await expect(child).rejects.toHaveProperty('message', 'moo');
    expect(root.state).toEqual('errored');
  });

  it('rejects when child errors during halting', async () => {
    let child;
    let root = run(function*(context: Task<string>) {
      child = context.spawn(function*() {
        try {
          yield
        } finally {
          throw new Error("moo");
        }
      });
      yield;
      return "foo";
    });

    await root.halt();

    await expect(root).rejects.toHaveProperty('message', 'moo');
    await expect(child).rejects.toHaveProperty('message', 'moo');
    expect(root.state).toEqual('errored');
  });

  it('throws an error when called after controller finishes', async () => {
    let root = run(function*(context: Task) {
      context.spawn(sleep(100), { blockParent: true });

      yield sleep(10);
    });

    await run(sleep(20));

    expect(() => root.spawn()).toThrowError('cannot spawn a child on a task which is not running');
  });

  it('halts when child finishes during asynchronous halt', async () => {
    let didFinish = false;
    let root = run(function*(context: Task) {
      context.spawn(function*() {
        yield sleep(5)
      });
      try {
        yield;
      } finally {
        yield sleep(20);
        didFinish = true;
      }
    });

    await root.halt();

    expect(didFinish).toEqual(true);
  });

  it('runs destructors in reverse order and in series', async () => {
    let result: string[] = [];
    let root = run(function*(context: Task) {
      context.spawn(function*() {
        try {
          yield
        } finally {
          result.push('first start');
          yield sleep(5);
          result.push('first done');
        }
      });
      context.spawn(function*() {
        try {
          yield
        } finally {
          result.push('second start');
          yield sleep(10);
          result.push('second done');
        }
      });
    });

    await root;

    expect(result).toEqual(['second start', 'second done', 'first start', 'first done']);
  });

  describe('with blockParent: true', () => {
    it('blocks on child when finishing normally', async () => {
      let child: Task<string> | undefined;
      let root = run(function*(context: Task) {
        child = context.spawn(function*() {
          yield sleep(5);
          return 'foo';
        }, { blockParent: true });

        return 1;
      });

      await expect(root).resolves.toEqual(1);
      await expect(child).resolves.toEqual('foo');
      expect(root.state).toEqual('completed');
      expect(child && child.state).toEqual('completed');
    });
  });
});
