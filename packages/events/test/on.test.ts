import './helpers';

import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { Effection, run, sleep } from '@effection/core';
import { Subscription } from '@effection/subscription';
import { EventEmitter } from 'events';

import { on } from '../src/index';
import { FakeEventEmitter, FakeEvent } from './fake-event-target';

describe("on", () => {
  describe('subscribe to an EventEmitter', () => {
    let emitter: EventEmitter;
    let subscription: Subscription<[string], void>;

    beforeEach(async () => {
      emitter = new EventEmitter();
      subscription = on(Effection.root, emitter, "thing");
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        emitter.emit("thing", 123, true);
      });

      it('receives event', async () => {
        let { value } = await run(subscription.next());
        expect(value).toEqual([123, true]);
      });
    });

    describe('emitting an event efter subscribing', () => {
      beforeEach(() => {
        run(function*() {
          yield sleep(5);
          emitter.emit("thing", 123, true);
        });
      });

      it('receives event', async () => {
        let { value } = await run(subscription.next());
        expect(value).toEqual([123, true]);
      });
    });

    describe('emitting multiple events', () => {
      beforeEach(() => {
        run(function*() {
          yield sleep(5);
          emitter.emit("thing", "foo");
          emitter.emit("thing", "bar");
        });
      });

      it('receives all of them', async () => {
        expect(await run(subscription.next())).toEqual({ done: false, value: ["foo"]});
        expect(await run(subscription.next())).toEqual({done: false, value: ["bar"] });
      });
    });
  });

  describe('subscribing to an EventTarget', () => {
    let target: FakeEventEmitter;
    let subscription: Subscription<[string], void>;
    let thingEvent: FakeEvent;

    beforeEach(async () => {
      target = new FakeEventEmitter();
      subscription = on(Effection.root, target, "thing");
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        thingEvent = new FakeEvent("thing");
        target.dispatchEvent(thingEvent);
      });

      it('receives event', async () => {
        let { value } = await run(subscription.next());
        expect(value).toEqual([thingEvent]);
      });
    });
  });

  describe('chaining', () => {
    let emitter: EventEmitter;
    let subscription: Subscription<number, void>;

    beforeEach(async () => {
      emitter = new EventEmitter();
      subscription = on(Effection.root, emitter, "thing").map(([value]) => (value as number) * 2);
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        emitter.emit("thing", 12);
      });

      it('receives event', async () => {
        let { value } = await run(subscription.next());
        expect(value).toEqual(24);
      });
    });
  });
});
