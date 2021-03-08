import * as expect from 'expect';
import { describe, it, beforeEach, captureError } from '@effection/mocha';

import { Task, sleep } from '@effection/core';
import { createOperationIterator, Subscription, OperationIterator } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

function stuff(task: Task<unknown>): OperationIterator<Thing, number> {
  return createOperationIterator(task, (publish) => function*() {
    publish({name: 'bob', type: 'person' });
    publish({name: 'alice', type: 'person' });
    publish({name: 'world', type: 'planet' });
    return 3;
  })
}

function emptySubscription(task: Task<unknown>): OperationIterator<Thing, number> {
  return createOperationIterator(task, () => function*() {
    return 12;
  })
}

describe('chaining subscriptions', () => {
  let subscription: Subscription<Thing, number>;

  beforeEach(function*(task) {
    subscription = new Subscription(stuff(task));
  });

  describe('forEach', () => {
    let values: Thing[];    let result: number;
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

  describe('map', () => {
    it('maps over the values', function*() {
      let mapped = subscription.map(item => `hello ${item.name}`);
      expect(yield mapped.next()).toEqual({ done: false, value: 'hello bob' });
      expect(yield mapped.next()).toEqual({ done: false, value: 'hello alice' });
      expect(yield mapped.next()).toEqual({ done: false, value: 'hello world' });
      expect(yield mapped.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('filter', () => {
    it('filters the values', function*() {
      let filtered = subscription.filter(item => item.type === 'person');
      expect(yield filtered.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(yield filtered.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(yield filtered.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('match', () => {
    it('filters the values based on the given pattern', function*() {
      let matched = subscription.match({ type: 'person' });
      expect(yield matched.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(yield matched.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(yield matched.next()).toEqual({ done: true, value: 3 });
    });

    it('can work on nested items', function*() {
      let matched = subscription.map(item => ({ thing: item })).match({ thing: { type: 'person' } });
      expect(yield matched.next()).toEqual({ done: false, value: { thing: { name: 'bob', type: 'person' } } });
      expect(yield matched.next()).toEqual({ done: false, value: { thing: { name: 'alice', type: 'person' } } });
      expect(yield matched.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('first', () => {
    it('returns the first item in the subscription', function*() {
      expect(yield subscription.first()).toEqual({ name: 'bob', type: 'person' });
    });

    it('returns undefined if the subscription is empty', function*(task) {
      let subscription = new Subscription(emptySubscription(task));
      expect(yield subscription.first()).toEqual(undefined);
    });
  });

  describe('expect', () => {
    it('returns the first item in the subscription', function*() {
      expect(yield subscription.expect()).toEqual({ name: 'bob', type: 'person' });
    });

    it('throws an error if the subscription is empty', function*(task) {
      let subscription = new Subscription(emptySubscription(task));
      expect(yield captureError(subscription.expect())).toHaveProperty('message', 'expected subscription to contain a value');
    });
  });
});
