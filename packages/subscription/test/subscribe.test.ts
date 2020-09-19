import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { run, World } from './helpers';

import { EventEmitter } from 'events';
import { Operation, Task } from 'effection';

import { subscribe, createOperationIterator, Subscription, OperationIterator, SymbolOperationIterable } from '../src/index';

interface Thing {
  name: string;
  type: string;
}
const subscribableThing = {
  [SymbolOperationIterable](task: Task<unknown>): OperationIterator<Thing, number> {
    return createOperationIterator(task, function*(publish) {
      publish({name: 'bob', type: 'person' });
      publish({name: 'alice', type: 'person' });
      publish({name: 'world', type: 'planet' });
      return 3;
    });
  }
};

let emitter = new EventEmitter();

describe('subscribe', () => {
  it('iterates through all members of the subscribable', async () => {
    let subscription = subscribe(World, subscribableThing);
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'world', type: 'planet' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: true, value: 3 });
  });

  it('is chainable', async () => {
    let subscription = subscribe(World, subscribableThing).filter((t) => t.type === 'person');
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
    await expect(run(subscription.next())).resolves.toEqual({ done: true, value: 3 });
  });
});
