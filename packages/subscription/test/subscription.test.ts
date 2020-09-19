import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { run, World } from './helpers';

import { Operation, Task } from 'effection';
import { createOperationIterator, Subscription, OperationIterator } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

function stuff(task: Task<unknown>): OperationIterator<Thing, number> {
  return createOperationIterator(task, function*(publish) {
    publish({name: 'bob', type: 'person' });
    publish({name: 'alice', type: 'person' });
    publish({name: 'world', type: 'planet' });
    return 3;
  })
}

function emptySubscription(task: Task<unknown>): OperationIterator<Thing, number> {
  return createOperationIterator(task, function*(publish) {
    return 12;
  })
}

describe('chaining subscriptions', () => {
  let subscription: Subscription<Thing, number>;

  beforeEach(() => {
    subscription = new Subscription(stuff(World));
  });

  describe('forEach', () => {
    let values: Thing[];
    let result: number;
    beforeEach(async () => {
      values = [];
      result = await run(subscription.forEach(function*(item) { values.push(item); }));
    });

    it('iterates through all members of the subscribable', () => {
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
        {name: 'world', type: 'planet' },
      ])
    });

    it('returns the original result', () => {
      expect(result).toEqual(3);
    });
  });

  describe('map', () => {
    it('maps over the values', async () => {
      let mapped = subscription.map(item => `hello ${item.name}`);
      await expect(run(mapped.next())).resolves.toEqual({ done: false, value: 'hello bob' });
      await expect(run(mapped.next())).resolves.toEqual({ done: false, value: 'hello alice' });
      await expect(run(mapped.next())).resolves.toEqual({ done: false, value: 'hello world' });
      await expect(run(mapped.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('filter', () => {
    it('filters the values', async () => {
      let filtered = subscription.filter(item => item.type === 'person');
      await expect(run(filtered.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      await expect(run(filtered.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      await expect(run(filtered.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('match', () => {
    it('filters the values based on the given pattern', async () => {
      let matched = subscription.match({ type: 'person' });
      await expect(run(matched.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      await expect(run(matched.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      await expect(run(matched.next())).resolves.toEqual({ done: true, value: 3 });
    });

    it('can work on nested items', async () => {
      let matched = subscription.map(item => ({ thing: item })).match({ thing: { type: 'person' } });
      await expect(run(matched.next())).resolves.toEqual({ done: false, value: { thing: { name: 'bob', type: 'person' } } });
      await expect(run(matched.next())).resolves.toEqual({ done: false, value: { thing: { name: 'alice', type: 'person' } } });
      await expect(run(matched.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('first', () => {
    it('returns the first item in the subscription', async () => {
      await expect(run(subscription.first())).resolves.toEqual({ name: 'bob', type: 'person' });
    });

    // it('returns undefined if the subscription is empty', async () => {
    //   let subscription = await run(emptySubscription);
    //   await expect(run(subscription.first())).resolves.toEqual(undefined);
    // });
  });

  describe('expect', () => {
    it('returns the first item in the subscription', async () => {
      await expect(run(subscription.expect())).resolves.toEqual({ name: 'bob', type: 'person' });
    });

    // it('throws an error if the subscription is empty', async () => {
    //   let subscription = await run(emptySubscription);
    //   await run(function*() {
    //     try {
    //       yield subscription.expect();
    //       throw new Error('unreachable');
    //     } catch(e) {
    //       expect(e.message).toEqual('expected subscription to contain a value');
    //     }
    //   });
    // });
  });
});
