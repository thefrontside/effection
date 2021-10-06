import { describe, it } from '@effection/mocha';
import expect from 'expect'

import { Task, sleep, spawn } from '@effection/core';
import { Slice } from '@effection/atom';
import { inspect, InspectTree } from '../src/index';

describe("inspect()", () => {
  it('returns a slice of the task tree', function*() {
    let task: Task<void> = yield spawn();

    let tree: Slice<InspectTree> = yield inspect(task);

    let child = yield task.spawn(function*() {
      yield spawn();
      yield spawn(function*() { /* no op */});
      yield sleep();
    }, { labels: { name: 'root' } });

    yield sleep(10);

    let result = tree.get().children[child.id];

    expect(result.id).toEqual(child.id);
    expect(result.state).toEqual('running');

    let children = Object.values(result.children);
    expect(children.length).toEqual(2);

    expect(children[0].state).toEqual('running');
    expect(children[1].state).toEqual('completed');
  });
});
