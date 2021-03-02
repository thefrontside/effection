import './helpers';
import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';

import { run, Task, Effection } from '@effection/core';
import { createSubscribable, Subscribable, OperationIterator } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

const stuff: Subscribable<Thing, number> = createSubscribable((publish) => function*() {
  publish({name: 'bob', type: 'person' });
  publish({name: 'alice', type: 'person' });
  publish({name: 'world', type: 'planet' });
  return 3;
});

const emptySubscribable: Subscribable<Thing, number> = createSubscribable(() => function*() {
  return 12;
});

describe('chaining subscribable', () => {
  describe('forEach', () => {
    let values: Thing[];
    let result: number;
    beforeEach(async () => {
      values = [];
      result = await run(stuff.forEach((item) => function*() { values.push(item); }));
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

  describe('collect', () => {
    it('collects values into a synchronous iterator', async () => {
      let iterator = await run(stuff.collect());
      expect(iterator.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'world', type: 'planet' } });
      expect(iterator.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('toArray', () => {
    it('collects values into an array', async () => {
      let result = await run(stuff.toArray());
      expect(result).toEqual([
        { name: 'bob', type: 'person' },
        { name: 'alice', type: 'person' },
        { name: 'world', type: 'planet' },
      ]);
    });
  });

  describe('map', () => {
    it('maps over the values', async () => {
      let mapped = await run(stuff.map(item => `hello ${item.name}`).collect());
      expect(mapped.next()).toEqual({ done: false, value: 'hello bob' });
      expect(mapped.next()).toEqual({ done: false, value: 'hello alice' });
      expect(mapped.next()).toEqual({ done: false, value: 'hello world' });
      expect(mapped.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('filter', () => {
    it('filters the values', async () => {
      let filtered = await run(stuff.filter(item => item.type === 'person').collect());
      expect(filtered.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(filtered.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(filtered.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('match', () => {
    it('filters the values based on the given pattern', async () => {
      let matched = await run(stuff.match({ type: 'person' }).collect());
      expect(matched.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(matched.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(matched.next()).toEqual({ done: true, value: 3 });
    });

    it('can work on nested items', async () => {
      let matched = await run(stuff.map(item => ({ thing: item })).match({ thing: { type: 'person' } }).collect());
      expect(matched.next()).toEqual({ done: false, value: { thing: { name: 'bob', type: 'person' } } });
      expect(matched.next()).toEqual({ done: false, value: { thing: { name: 'alice', type: 'person' } } });
      expect(matched.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('first', () => {
    it('returns the first item in the subscription', async () => {
      await expect(run(stuff.first())).resolves.toEqual({ name: 'bob', type: 'person' });
    });

    it('returns undefined if the subscription is empty', async () => {
      await expect(run(emptySubscribable.first())).resolves.toEqual(undefined);
    });
  });

  describe('expect', () => {
    it('returns the first item in the subscription', async () => {
      await expect(run(stuff.expect())).resolves.toEqual({ name: 'bob', type: 'person' });
    });

    it('throws an error if the subscription is empty', async () => {
      await expect(run(emptySubscribable.expect())).rejects.toHaveProperty('message', 'expected subscription to contain a value');
    });
  });
});
