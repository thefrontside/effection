import * as expect from 'expect';
import { describe, it } from '@effection/mocha';
import { Task } from '@effection/core';

import { subscribe, createOperationIterator, OperationIterator, SymbolOperationIterable } from '../src/index';

interface Thing {
  name: string;
  type: string;
}
const subscribableThing = {
  [SymbolOperationIterable](task: Task<unknown>): OperationIterator<Thing, number> {
    return createOperationIterator(task, (publish) => function*() {
      publish({name: 'bob', type: 'person' });
      publish({name: 'alice', type: 'person' });
      publish({name: 'world', type: 'planet' });
      return 3;
    });
  }
};

describe('subscribe', () => {
  it('iterates through all members of the subscribable', function*(task) {
    let subscription = subscribe(task, subscribableThing);
    expect(yield subscription.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
    expect(yield subscription.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
    expect(yield subscription.next()).toEqual({ done: false, value: { name: 'world', type: 'planet' } });
    expect(yield subscription.next()).toEqual({ done: true, value: 3 });
  });

  it('is chainable', function*(task) {
    let subscription = subscribe(task, subscribableThing).filter((t) => t.type === 'person');
    expect(yield subscription.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
    expect(yield subscription.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
    expect(yield subscription.next()).toEqual({ done: true, value: 3 });
  });
});
