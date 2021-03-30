import * as expect from 'expect';
import { describe, it, beforeEach, captureError } from '@effection/mocha';

import { createSubscription, Subscription } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

describe('chaining subscriptions', () => {
  let subscription: Subscription<Thing, number>;
  let emptySubscription: Subscription<Thing, number>;

  beforeEach(function*(world) {
    subscription = createSubscription(world, (publish) => function*() {
      publish({name: 'bob', type: 'person' });
      publish({name: 'alice', type: 'person' });
      publish({name: 'world', type: 'planet' });
      return 3;
    });
    emptySubscription = createSubscription(world, () => function*() {
      return 12;
    });
  });

  describe('first', () => {
    it('returns the first item in the subscription', function*() {
      expect(yield subscription.first()).toEqual({ name: 'bob', type: 'person' });
    });

    it('returns undefined if the subscription is empty', function*() {
      expect(yield emptySubscription.first()).toEqual(undefined);
    });
  });

  describe('expect', () => {
    it('returns the first item in the subscription', function*() {
      expect(yield subscription.expect()).toEqual({ name: 'bob', type: 'person' });
    });

    it('throws an error if the subscription is empty', function*() {
      expect(yield captureError(emptySubscription.expect())).toHaveProperty('message', 'expected to contain a value');
    });
  });

  describe('forEach', () => {
    let values: Thing[];
    let result: number;

    beforeEach(function*() {
      values = [];
      result = yield subscription.forEach((item) => function*() { values.push(item); });
    });

    it('iterates through all members of the subscribable', function*() {
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
        {name: 'world', type: 'planet' },
      ])
    });

    it('returns the original result', function*() {
      expect(result).toEqual(3);
    });
  });

  describe('join', () => {
    let result: number;

    beforeEach(function*() {
      result = yield subscription.join();
    });

    it('returns the original result', function*() {
      expect(result).toEqual(3);
    });
  });

  describe('collect', () => {
    it('collects values into a synchronous iterator', function*() {
      let iterator: Iterator<Thing, number> = yield subscription.collect();
      expect(iterator.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'world', type: 'planet' } });
      expect(iterator.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('toArray', () => {
    it('collects values into an array', function*() {
      let result = yield subscription.toArray();
      expect(result).toEqual([
        { name: 'bob', type: 'person' },
        { name: 'alice', type: 'person' },
        { name: 'world', type: 'planet' },
      ]);
    });
  });
});
