import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { timeout } from 'effection';
import { EventEmitter } from 'events';

import { World } from './helpers';

import { on, Subscription } from '../src/index';
import { FakeEventEmitter, FakeEvent } from './fake-event-target';

describe("on", () => {
  describe('subscribe to an EventEmitter', () => {
    let emitter: EventEmitter;
    let subscription: Subscription<[string]>;

    beforeEach(async () => {
      emitter = new EventEmitter();
      subscription = await World.spawn(on(emitter, "thing"));
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        emitter.emit("thing", 123, true);
      });

      it('receives event', async () => {
        let args = await World.spawn(subscription.next());
        expect(args).toEqual([123, true]);
      });
    });

    describe('emitting an event efter subscribing', () => {
      beforeEach(() => {
        World.spawn(function*() {
          yield timeout(5);
          emitter.emit("thing", 123, true);
        });
      });

      it('receives event', async () => {
        let args = await World.spawn(subscription.next());
        expect(args).toEqual([123, true]);
      });
    });

    describe('emitting multiple events', () => {
      beforeEach(() => {
        World.spawn(function*() {
          yield timeout(5);
          emitter.emit("thing", "foo");
          emitter.emit("thing", "bar");
        });
      });

      it('receives all of them', async () => {
        expect(await World.spawn(subscription.next())).toEqual(["foo"]);
        expect(await World.spawn(subscription.next())).toEqual(["bar"]);
      });
    });
  });

  describe('subscribing to an EventTarget', () => {
    let target: FakeEventEmitter;
    let subscription: Subscription<[string]>;
    let thingEvent: FakeEvent;

    beforeEach(async () => {
      target = new FakeEventEmitter();
      subscription = await World.spawn(on(target, "thing"));
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        thingEvent = new FakeEvent("thing");
        target.dispatchEvent(thingEvent);
      });

      it('receives event', async () => {
        let args = await World.spawn(subscription.next());
        expect(args).toEqual([thingEvent]);
      });
    });
  });
});
