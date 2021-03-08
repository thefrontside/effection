import * as expect from 'expect';
import { describe, it, captureError } from '@effection/mocha';

import { createStream, Stream } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

const stuff: Stream<Thing, number> = createStream((publish) => function*() {
  publish({name: 'bob', type: 'person' });
  publish({name: 'alice', type: 'person' });
  publish({name: 'world', type: 'planet' });
  return 3;
});

const emptyStream: Stream<Thing, number> = createStream(() => function*() {
  return 12;
});

describe('chaining subscribable', () => {
  describe('forEach', () => {
    it('iterates through all members of the subscribable', function*() {
      let values: Thing[] = [];
      yield stuff.forEach((item) => function*() { values.push(item); });
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
        {name: 'world', type: 'planet' },
      ])
    });

    it('can iterate with regular function', function*() {
      let values: Thing[] = [];
      yield stuff.forEach((item) => { values.push(item); });
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
        {name: 'world', type: 'planet' },
      ])
    });

    it('returns the original result', function*() {
      let result = yield stuff.forEach(() => function*() { /* no op */ });
      expect(result).toEqual(3);
    });
  });

  describe('collect', () => {
    it('collects values into a synchronous iterator', function*() {
      let iterator: Iterator<Thing, number> = yield stuff.collect();
      expect(iterator.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'world', type: 'planet' } });
      expect(iterator.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('toArray', () => {
    it('collects values into an array', function*() {
      let result = yield stuff.toArray();
      expect(result).toEqual([
        { name: 'bob', type: 'person' },
        { name: 'alice', type: 'person' },
        { name: 'world', type: 'planet' },
      ]);
    });
  });

  describe('map', () => {
    it('maps over the values', function*() {
      let mapped = yield stuff.map(item => `hello ${item.name}`).collect();
      expect(mapped.next()).toEqual({ done: false, value: 'hello bob' });
      expect(mapped.next()).toEqual({ done: false, value: 'hello alice' });
      expect(mapped.next()).toEqual({ done: false, value: 'hello world' });
      expect(mapped.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('filter', () => {
    it('filters the values', function*() {
      let filtered = yield stuff.filter(item => item.type === 'person').collect();
      expect(filtered.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(filtered.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(filtered.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('match', () => {
    it('filters the values based on the given pattern', function*() {
      let matched = yield stuff.match({ type: 'person' }).collect();
      expect(matched.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(matched.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(matched.next()).toEqual({ done: true, value: 3 });
    });

    it('can work on nested items', function*() {
      let matched = yield stuff.map(item => ({ thing: item })).match({ thing: { type: 'person' } }).collect();
      expect(matched.next()).toEqual({ done: false, value: { thing: { name: 'bob', type: 'person' } } });
      expect(matched.next()).toEqual({ done: false, value: { thing: { name: 'alice', type: 'person' } } });
      expect(matched.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('first', () => {
    it('returns the first item in the subscription', function*() {
      expect(yield stuff.first()).toEqual({ name: 'bob', type: 'person' });
    });

    it('returns undefined if the subscription is empty', function*() {
      expect(yield emptyStream.first()).toEqual(undefined);
    });
  });

  describe('expect', () => {
    it('returns the first item in the subscription', function*() {
      expect(yield stuff.expect()).toEqual({ name: 'bob', type: 'person' });
    });

    it('throws an error if the subscription is empty', function*() {
      expect(yield captureError(emptyStream.expect())).toHaveProperty('message', 'expected subscription to contain a value');
    });
  });
});
