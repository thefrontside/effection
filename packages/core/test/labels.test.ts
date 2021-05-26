import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { withLabels, run, getControls, sleep, setLabels, Labels } from '../src/index';

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

  it('applies name label from other name', async () => {
    let task = run({ perform: () => { /* no op */ }, name: "doSomething" });

    await expect(task.labels).toEqual({ name: "doSomething" });
  });

  it('can change labels dynamically', async () => {
    let task = run(function*() {
      yield sleep(5);
      yield setLabels({ foo: "bar" });
      yield sleep(10);
      yield setLabels({ quox: "quox" });
    });

    let events: Labels[] = []

    getControls(task).on('labels', (labels) => events.push(labels));

    expect(task.labels).toEqual({});

    await run(sleep(10));

    expect(task.labels).toEqual({ foo: "bar" });
    expect(events).toEqual([{ foo: "bar" }]);

    await run(sleep(10));

    expect(task.labels).toEqual({ foo: "bar", quox: "quox" });
    expect(events).toEqual([{ foo: "bar" }, { foo: "bar", quox: "quox" }]);
  });
});
