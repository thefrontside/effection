import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { spawn } from './helpers';

import { EventEmitter } from 'events';
import { Operation } from '@effection/core';
import { on } from '@effection/events';

import { subscribe, ChainableSubscription, Subscription, createSubscription, Subscribable, SymbolSubscribable, forEach } from '../src/index';

interface Thing {
  name: string;
  type: string;
}
const subscribableWithSymbol = {
  *[SymbolSubscribable](): Operation<Subscription<Thing, number>> {
    return yield createSubscription(function*(publish) {
      publish({name: 'bob', type: 'person' });
      publish({name: 'alice', type: 'person' });
      publish({name: 'world', type: 'planet' });
      return 3;
    });
  }
};

function* subscribableAsOperation(): Operation<Subscription<Thing, number>> {
  return yield createSubscription(function*(publish) {
    publish({name: 'sally', type: 'person' });
    publish({name: 'jupiter', type: 'planet' });
    return 12;
  });
}

let emitter = new EventEmitter();

const subscribableWithResource = {
  *[SymbolSubscribable](): Operation<Subscription<[number], void>> {
    return yield on(emitter, 'message');
  }
};

describe('subscribe', () => {
  describe('with symbol subscribable', () => {
    let subscription: ChainableSubscription<Thing, number>;

    beforeEach(async () => {
      subscription = await spawn(subscribe(subscribableWithSymbol));
    });

    it('iterates through all members of the subscribable', async () => {
      await expect(spawn(subscription.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      await expect(spawn(subscription.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      await expect(spawn(subscription.next())).resolves.toEqual({ done: false, value: { name: 'world', type: 'planet' } });
      await expect(spawn(subscription.next())).resolves.toEqual({ done: true, value: 3 });
    });

    it('is chainable', async () => {
      let filteredSubscription = subscription.filter((t) => t.type === 'person');
      await expect(spawn(filteredSubscription.next())).resolves.toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      await expect(spawn(filteredSubscription.next())).resolves.toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      await expect(spawn(filteredSubscription.next())).resolves.toEqual({ done: true, value: 3 });
    });
  });

  describe('with operation subscribable', () => {
    let subscription: ChainableSubscription<Thing, number>;

    beforeEach(async () => {
      subscription = await spawn(subscribe(subscribableAsOperation));
    });

    it('iterates through all members of the subscribable', async () => {
      await expect(spawn(subscription.next())).resolves.toEqual({ done: false, value: { name: 'sally', type: 'person' } });
      await expect(spawn(subscription.next())).resolves.toEqual({ done: false, value: { name: 'jupiter', type: 'planet' } });
      await expect(spawn(subscription.next())).resolves.toEqual({ done: true, value: 12 });
    });

    it('is chainable', async () => {
      let filteredSubscription = subscription.filter((t) => t.type === 'person');
      await expect(spawn(filteredSubscription.next())).resolves.toEqual({ done: false, value: { name: 'sally', type: 'person' } });
      await expect(spawn(filteredSubscription.next())).resolves.toEqual({ done: true, value: 12 });
    });
  });

  describe('with resource subscribable', () => {
    let subscription: ChainableSubscription<[number], void>;

    beforeEach(async () => {
      subscription = await spawn(subscribe(subscribableWithResource));
    });

    it('retains resource', async () => {
      emitter.emit('message', 123);
      await expect(spawn(subscription.next())).resolves.toEqual({ done: false, value: [123] });
    });
  });
});
