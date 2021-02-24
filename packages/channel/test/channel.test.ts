import { timeout, Context } from '@effection/core';
import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';

import { Subscription, subscribe } from '@effection/subscription';

import { World } from './helpers';

import { Channel } from '../src/index';

describe('Channel', () => {
  describe('subscribe', () => {
    let channel: Channel<string>;
    let subscription: Subscription<string, undefined>;

    beforeEach(async () => {
      channel = new Channel();
      subscription = await World.spawn(subscribe(channel));
    });

    describe('sending a message', () => {
      beforeEach(() => {
        channel.send('hello');
      });

      it('receives message on subscription', async () => {
        let result = await World.spawn(subscription.next());
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('hello');
      });
    });

    describe('blocking on next', () => {
      let result: Context<IteratorResult<string, undefined>>;

      beforeEach(async () => {
        result = World.spawn(subscription.next());
        await World.spawn(timeout(10));
        channel.send('hello');
      });

      it('receives message on subscription done', async () => {
        await expect(result).resolves.toHaveProperty('value', 'hello');
      });
    });

    describe('sending multiple messages', () => {
      beforeEach(() => {
        channel.send('hello');
        channel.send('foo');
        channel.send('bar');
      });

      it('receives messages in order', async () => {
        expect(await World.spawn(subscription.next())).toHaveProperty('value', 'hello');
        expect(await World.spawn(subscription.next())).toHaveProperty('value', 'foo');
        expect(await World.spawn(subscription.next())).toHaveProperty('value', 'bar');
      });
    });
  });

  describe('subscribe free function', () => {
    let channel: Channel<string>;
    let subscription: Subscription<string, undefined>;

    beforeEach(async () => {
      channel = new Channel();
      subscription = await World.spawn(subscribe(channel));
    });

    describe('sending a message', () => {
      beforeEach(() => {
        channel.send('hello');
      });

      it('receives message on subscription', async () => {
        let result = await World.spawn(subscription.next());
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('hello');
      });
    });
  });

  describe('close', () => {
    describe('without argument', () => {
      let channel: Channel<string>;
      let subscription: Subscription<string, undefined>;

      beforeEach(async () => {
        channel = new Channel();
        subscription = await World.spawn(subscribe(channel));
        channel.send('foo');
        channel.close();
      });

      it('closes subscriptions', async () => {
        await expect(World.spawn(subscription.next())).resolves.toEqual({ done: false, value: 'foo' });
        await expect(World.spawn(subscription.next())).resolves.toEqual({ done: true, value: undefined });
      });
    });

    describe('with close argument', () => {
      let channel: Channel<string, number>;
      let subscription: Subscription<string, number>;

      beforeEach(async () => {
        channel = new Channel();
        subscription = await World.spawn(subscribe(channel));
        channel.send('foo');
        channel.close(12);
      });

      it('closes subscriptions with the argument', async () => {
        await expect(World.spawn(subscription.next())).resolves.toEqual({ done: false, value: 'foo' });
        await expect(World.spawn(subscription.next())).resolves.toEqual({ done: true, value: 12 });
      });
    });
  });
});
