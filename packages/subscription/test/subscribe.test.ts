import './helpers';
import * as expect from 'expect';
import { describe, it } from 'mocha';

import { run, Effection, Task } from '@effection/core';

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
  it('iterates through all members of the subscribable', async () => {
    let subscription = subscribe(Effection.root, subscribableThing);
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'world', type: 'planet' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: true, value: 3 });
  });

  it('is chainable', async () => {
    let subscription = subscribe(Effection.root, subscribableThing).filter((t) => t.type === 'person');
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: true, value: 3 });
  });
});
