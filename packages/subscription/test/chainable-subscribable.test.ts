import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { spawn } from './helpers';

import { Operation } from 'effection';
import { subscribe, createSubscription, ChainableSubscription, Subscribable, SymbolSubscribable, forEach } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

function* stuff(): Operation<ChainableSubscription<Thing, number>> {
  return yield createSubscription(function*(publish) {
    publish({name: 'bob', type: 'person' });
    publish({name: 'alice', type: 'person' });
    publish({name: 'world', type: 'planet' });
    return 3;
  })
}

function* emptySubscription(): Operation<ChainableSubscription<Thing, number>> {
  return yield createSubscription(function*() {
    return 12;
  })
}

describe('chaining subscriptions', () => {
  describe('forEach', () => {
    let values: Thing[];
    let result: number;
    beforeEach(async () => {
      values = [];
      result = await spawn(subscribe(stuff).forEach(function*(item) { values.push(item); }));
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
      let mapped = await spawn(subscribe(stuff).map(item => `hello ${item.name}`));
      await expect(spawn(mapped.next())).resolves.toEqual({ done: false, value: 'hello bob' });
      await expect(spawn(mapped.next())).resolves.toEqual({ done: false, value: 'hello alice' });
      await expect(spawn(mapped.next())).resolves.toEqual({ done: false, value: 'hello world' });
      await expect(spawn(mapped.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('filter', () => {
    it('filters the values', async () => {
      let filtered = await spawn(subscribe(stuff).filter(item => item.type === 'person'));
      await expect(spawn(filtered.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      await expect(spawn(filtered.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      await expect(spawn(filtered.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('match', () => {
    it('filters the values based on the given pattern', async () => {
      let matched = await spawn(subscribe(stuff).match({ type: 'person' }));
      await expect(spawn(matched.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      await expect(spawn(matched.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      await expect(spawn(matched.next())).resolves.toEqual({ done: true, value: 3 });
    });

    it('can work on nested items', async () => {
      let matched = await spawn(subscribe(stuff).map(item => ({ thing: item })).match({ thing: { type: 'person' } }));
      await expect(spawn(matched.next())).resolves.toEqual({ done: false, value: { thing: { name: 'bob', type: 'person' } } });
      await expect(spawn(matched.next())).resolves.toEqual({ done: false, value: { thing: { name: 'alice', type: 'person' } } });
      await expect(spawn(matched.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('first', () => {
    it('returns the first item in the subscription', async () => {
      await expect(spawn(subscribe(stuff).first())).resolves.toEqual({ name: 'bob', type: 'person' });
    });

    it('returns undefined if the subscription is empty', async () => {
      await expect(spawn(subscribe(emptySubscription).first())).resolves.toEqual(undefined);
    });
  });

  describe('expect', () => {
    it('returns the first item in the subscription', async () => {
      await expect(spawn(subscribe(stuff).expect())).resolves.toEqual({ name: 'bob', type: 'person' });
    });

    it('throws an error if the subscription is empty', async () => {
      await spawn(function*() {
        try {
          yield subscribe(emptySubscription).expect();
          throw new Error('unreachable');
        } catch(e) {
          expect(e.message).toEqual('expected subscription to contain a value');
        }
      });
    });
  });
});
