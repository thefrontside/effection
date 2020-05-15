import { timeout, Context } from 'effection';
import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';

import { World } from './helpers';

import { createChannel, SendChannel, FilterChannel, MapChannel, Subscription } from '../src/index';

describe('createChannel', () => {
  describe('subscribe', () => {
    let channel: SendChannel<string>;
    let subscription: Subscription<string>;

    beforeEach(async () => {
      channel = createChannel();
      subscription = await World.spawn(channel.subscribe());
    });

    describe('sending a message', () => {
      beforeEach(() => {
        channel.send("hello");
      });

      it('receives message on subscription', async () => {
        let result = await World.spawn(subscription.next());
        expect(result).toEqual("hello");
      });
    });

    describe('blocking on next', () => {
      let result: Context<string>;

      beforeEach(async () => {
        result = World.spawn(subscription.next());
        await World.spawn(timeout(10));
        channel.send("hello");
      });

      it('receives message on subscription done', async () => {
        await expect(result).resolves.toEqual("hello");
      });
    });

    describe('sending multiple messages', () => {
      beforeEach(() => {
        channel.send("hello");
        channel.send("foo");
        channel.send("bar");
      });

      it('receives messages in order', async () => {
        expect(await World.spawn(subscription.next())).toEqual("hello");
        expect(await World.spawn(subscription.next())).toEqual("foo");
        expect(await World.spawn(subscription.next())).toEqual("bar");
      });
    });

    describe('can block on once', () => {
      let result: Context<string>;

      beforeEach(async () => {
        result = World.spawn(channel.once());
        await World.spawn(timeout(10));
        channel.send("hello");
      });

      it('receives message on subscription', async () => {
        await expect(result).resolves.toEqual("hello");
      });
    });
  });

  describe('filter', () => {
    let numbers: SendChannel<number>;
    let evenNumbers: FilterChannel<number>;

    let subscription: Subscription<number>;

    beforeEach(async () => {
      numbers = createChannel();
      evenNumbers = numbers.filter((v) => v % 2 === 0);

      subscription = await World.spawn(evenNumbers.subscribe());
    });

    describe('filters by predicate', () => {
      beforeEach(() => {
        numbers.send(1);
        numbers.send(2);
        numbers.send(3);
        numbers.send(4);
      });

      it('receives message on subscription', async () => {
        expect(await World.spawn(subscription.next())).toEqual(2);
        expect(await World.spawn(subscription.next())).toEqual(4);
      });
    });
  });

  describe('map', () => {
    let numbers: SendChannel<number>;
    let results: MapChannel<number, string>;

    let subscription: Subscription<string>;

    beforeEach(async () => {
      numbers = createChannel();
      results = numbers.map((v) => `foo${v}`);

      subscription = await World.spawn(results.subscribe());
    });

    describe('filters by predicate', () => {
      beforeEach(() => {
        numbers.send(1);
        numbers.send(2);
      });

      it('receives message on subscription', async () => {
        expect(await World.spawn(subscription.next())).toEqual("foo1");
        expect(await World.spawn(subscription.next())).toEqual("foo2");
      });
    });
  });

  describe('match', () => {
    let source: SendChannel<{ foo: string, bar: number }>;
    let filtered: FilterChannel<{ foo: string, bar: number }>;

    let subscription: Subscription<{ foo: string, bar: number }>;

    describe('with simple filter', () => {
      beforeEach(async () => {
        source = createChannel();
        filtered = source.match({ foo: "foo" });

        subscription = await World.spawn(filtered.subscribe());
      });

      it('receives message on subscription', async () => {
        source.send({ foo: "foo", bar: 1 });
        source.send({ foo: "bar", bar: 2 });
        source.send({ foo: "foo", bar: 3 });

        expect(await World.spawn(subscription.next())).toEqual({ foo: "foo", bar: 1 });
        expect(await World.spawn(subscription.next())).toEqual({ foo: "foo", bar: 3 });
      });
    });
  });
});
