import { describe, it } from '@effection/mocha';
import expect from 'expect'

import { Subscription, Task, sleep, spawn } from 'effection';
import { inspect, InspectMessage } from '../src/index';

function expectContainsObject<R>(actual: R, matching: Record<string, unknown>) {
  expect(actual).toEqual(expect.arrayContaining([expect.objectContaining(matching)]));
}

describe("inspect()", () => {
  it('returns a slice of the task tree', function*() {
    let task: Task<void> = yield spawn();

    let buffer: Iterable<InspectMessage> = yield inspect(task).toBuffer();

    let child = yield task.spawn(function*() {
      yield spawn();
      yield spawn(function*() { /* no op */});
      yield sleep();
    }, { labels: { name: 'root' } });

    expectContainsObject(buffer, {
      type: 'link',
      id: task.id,
      child: expect.objectContaining({
        id: child.id
      })
    });
  });
});
