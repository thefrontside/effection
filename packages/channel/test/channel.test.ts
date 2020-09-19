import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';

import { sleep, run, Task, Effection } from '@effection/core';
import { Subscription, subscribe } from '@effection/subscription';

import { Channel } from '../src/index';

describe('Channel', () => {
  beforeEach(async () => {
    await Effection.reset();
  });

  describe('subscribe', () => {
    let channel: Channel<string>;
    let subscription: Subscription<string, undefined>;

    beforeEach(async () => {
      channel = new Channel();
      subscription = channel.subscribe(Effection.root);
    });

    describe('sending a message', () => {
      beforeEach(() => {
        channel.send('hello');
      });

      it('receives message on subscription', async () => {
        let result = await run(subscription.next());
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('hello');
      });
    });

    describe('blocking on next', () => {
      let result: Task<IteratorResult<string, undefined>>;

      beforeEach(async () => {
        result = run(subscription.next());
        await run(sleep(10));
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
        expect(await run(subscription.next())).toHaveProperty('value', 'hello');
        expect(await run(subscription.next())).toHaveProperty('value', 'foo');
        expect(await run(subscription.next())).toHaveProperty('value', 'bar');
      });
    });
  });

  describe('subscribe free function', () => {
    let channel: Channel<string>;
    let subscription: Subscription<string, undefined>;

    beforeEach(async () => {
      channel = new Channel();
      subscription = subscribe(Effection.root, channel);
    });

    describe('sending a message', () => {
      beforeEach(() => {
        channel.send('hello');
      });

      it('receives message on subscription', async () => {
        let result = await run(subscription.next());
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
        subscription = subscribe(Effection.root, channel);
        channel.send('foo');
        channel.close();
      });

      it('closes subscriptions', async () => {
        await expect(run(subscription.next())).resolves.toEqual({ done: false, value: 'foo' });
        await expect(run(subscription.next())).resolves.toEqual({ done: true, value: undefined });
      });
    });

    describe('with close argument', () => {
      let channel: Channel<string, number>;
      let subscription: Subscription<string, number>;

      beforeEach(async () => {
        channel = new Channel();
        subscription = subscribe(Effection.root, channel);
        channel.send('foo');
        channel.close(12);
      });

      it('closes subscriptions with the argument', async () => {
        await expect(run(subscription.next())).resolves.toEqual({ done: false, value: 'foo' });
        await expect(run(subscription.next())).resolves.toEqual({ done: true, value: 12 });
      });
    });
  });
});
