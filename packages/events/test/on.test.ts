import './helpers';

import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { Effection, run, sleep } from '@effection/core';
import { OperationIterator } from '@effection/subscription';
import { EventEmitter } from 'events';

import { on } from '../src/index';
import { FakeEventEmitter, FakeEvent } from './fake-event-target';

describe("on", () => {
  describe('subscribe to an EventEmitter', () => {
    let emitter: EventEmitter;
    let iterator: OperationIterator<[string], void>;

    beforeEach(async () => {
      emitter = new EventEmitter();
      iterator = on<[string]>(emitter, "thing").subscribe(Effection.root);
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        emitter.emit("thing", 123, true);
      });

      it('receives event', async () => {
        let { value } = await run(iterator.next());
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
        let { value } = await run(iterator.next());
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
        expect(await run(iterator.next())).toEqual({ done: false, value: ["foo"]});
        expect(await run(iterator.next())).toEqual({done: false, value: ["bar"] });
      });
    });
  });

  describe('subscribing to an EventTarget', () => {
    let target: FakeEventEmitter;
    let iterator: OperationIterator<[string], void>;
    let thingEvent: FakeEvent;

    beforeEach(async () => {
      target = new FakeEventEmitter();
      iterator = on<[string]>(target, "thing").subscribe(Effection.root);
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        thingEvent = new FakeEvent("thing");
        target.dispatchEvent(thingEvent);
      });

      it('receives event', async () => {
        let { value } = await run(iterator.next());
        expect(value).toEqual([thingEvent]);
      });
    });
  });

  describe('chaining', () => {
    let emitter: EventEmitter;
    let iterator: OperationIterator<number, void>;

    beforeEach(async () => {
      emitter = new EventEmitter();
      iterator = on<[number]>(emitter, "thing").map(([value]) => value * 2).subscribe(Effection.root);
    });

    describe('emitting an event', () => {
      beforeEach(() => {
        emitter.emit("thing", 12);
      });

      it('receives event', async () => {
        let { value } = await run(iterator.next());
        expect(value).toEqual(24);
      });
    });
  });
});
