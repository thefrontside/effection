import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { withLabels, run, sleep, label, Labels, Operation } from '../src/index';

describe('labels', () => {
  describe('withLabels', () => {
    it('applies labels to an operation', async () => {
      let someOperation = withLabels(function*() { /* no op */ }, { bar: "baz" });

      await expect(someOperation?.labels).toEqual({ bar: "baz" });
    });

    it('merges with existing labels', async () => {
      let someOperation = withLabels(
        withLabels(
          function*() { /* no op */ },
          { foo: "foo", bar: "bar" }
        ),
        { foo: "quox", blah: "blah" }
      );

      await expect(someOperation?.labels).toEqual({ foo: "quox", bar: "bar", blah: "blah" });
    });

    it('applies labels on task', async () => {
      let task = run(withLabels(
        function*() { yield },
        { foo: "bar" }
      ));

      await expect(task.labels).toEqual({ foo: "bar" });
    });
  });

  it('can apply labels when spawning', async () => {
    let task = run(function*() { yield }, { labels: { foo: "bar" } });

    await expect(task.labels).toEqual({ foo: "bar" });
  });

  it('applies name label from function name', async () => {
    let task = run(function* blahBlah() { /* no op */ });

    await expect(task.labels).toEqual({ name: "blahBlah" });
  });

  it('can change labels dynamically', async () => {
    let task = run(function*() {
      yield sleep(5);
      yield label({ foo: "bar" });
      yield sleep(10);
      yield label({ quox: "quox" });
    });

    let events: Labels[] = []

    task.on('labels', (labels) => events.push(labels));

    expect(task.labels).toEqual({});

    await run(sleep(10));

    expect(task.labels).toEqual({ foo: "bar" });
    expect(events).toEqual([{ foo: "bar" }]);

    await run(sleep(10));

    expect(task.labels).toEqual({ foo: "bar", quox: "quox" });
    expect(events).toEqual([{ foo: "bar" }, { foo: "bar", quox: "quox" }]);
  });

  it('applies labels of the resolved operation to a function operation', async () => {
    let task = run((() => () => () => withLabels(sleep(), { one: 1 })) as Operation<void>);

    task.consume(value => console.log({ value }));

    expect(task.labels).toMatchObject({
      name: 'sleep',
      one: 1
    });
  });

  it('can change labels of a resolved function operation dynamically', async () => {
    let task = run(() => function*() {
      yield label({ foo: 'bar' });
    });

    await task;

    expect(task.labels).toMatchObject({ foo: 'bar' });
  })
});
