import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect';

import { EventEmitter } from 'events';

import { World } from './helpers';

import { createEventChannel, Subscription, EventChannel } from '../src/index';

describe('createEventChannel', () => {
  describe('subscribe', () => {
    let emitter: EventEmitter;
    let channel: EventChannel;
    let subscription: Subscription<unknown[]>;

    beforeEach(async () => {
      emitter = new EventEmitter();
      channel = createEventChannel(emitter, 'foo');
      subscription = await World.spawn(channel.subscribe());
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        emitter.emit('foo', 'hello', 123);
      });

      it('receives message on subscription', async () => {
        let result = await World.spawn(subscription.next());
        expect(result).toEqual(['hello', 123]);
      });
    });
  });
});
