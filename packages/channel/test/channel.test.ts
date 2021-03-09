import { describe, it, beforeEach } from '@effection/mocha';
import * as expect from 'expect';

import { sleep } from '@effection/core';
import { createChannel, Channel } from '../src/index';

describe('Channel', () => {
  describe('subscribe', () => {
    let channel: Channel<string>;

    beforeEach(function*() {
      channel = createChannel();
    });

    describe('sending a message', () => {
      it('receives message on subscription', function*(task) {
        let subscription = channel.subscribe(task);
        channel.send('hello');
        let result = yield subscription.next();
        expect(result.done).toEqual(false);
        expect(result.value).toEqual('hello');
      });
    });

    describe('blocking on next', () => {
      it('receives message on subscription done', function*(task) {
        let subscription = channel.subscribe(task);
        let result = task.spawn(subscription.next());
        yield sleep(10);
        channel.send('hello');
        expect(yield result).toHaveProperty('value', 'hello');
      });
    });

    describe('sending multiple messages', () => {
      it('receives messages in order', function*(task) {
        let subscription = channel.subscribe(task);
        channel.send('hello');
        channel.send('foo');
        channel.send('bar');
        expect(yield subscription.next()).toHaveProperty('value', 'hello');
        expect(yield subscription.next()).toHaveProperty('value', 'foo');
        expect(yield subscription.next()).toHaveProperty('value', 'bar');
      });
    });
  });

  describe('close', () => {
    describe('without argument', () => {
      it('closes subscriptions', function*(task) {
        let channel = createChannel();
        let subscription = channel.subscribe(task);
        channel.send('foo');
        channel.close();
        expect(yield subscription.next()).toEqual({ done: false, value: 'foo' });
        expect(yield subscription.next()).toEqual({ done: true, value: undefined });
      });
    });

    describe('with close argument', () => {
      it('closes subscriptions with the argument', function*(task) {
        let channel = createChannel<string, number>();
        let subscription = channel.subscribe(task);
        channel.send('foo');
        channel.close(12);
        expect(yield subscription.next()).toEqual({ done: false, value: 'foo' });
        expect(yield subscription.next()).toEqual({ done: true, value: 12 });
      });
    });
  });
});
