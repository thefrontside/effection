import { describe, it, beforeEach } from '@effection/mocha';
import * as expect from 'expect'

import { sleep } from '@effection/core';
import { OperationIterator } from '@effection/subscription';
import { EventEmitter } from 'events';

import { on } from '../src/index';
import { FakeEventEmitter, FakeEvent } from './fake-event-target';

describe("on", () => {
  describe('subscribe to an EventEmitter', () => {
    let emitter: EventEmitter;
    let iterator: OperationIterator<[string], void>;

    beforeEach(function*(task) {
      emitter = new EventEmitter();
      iterator = on<[string]>(emitter, "thing").subscribe(task);
    });

    describe('emitting an event', () => {
      beforeEach(function*() {
        emitter.emit("thing", 123, true);
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual([123, true]);
      });
    });

    describe('emitting an event efter subscribing', () => {
      beforeEach(function*() {
        yield sleep(5);
        emitter.emit("thing", 123, true);
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual([123, true]);
      });
    });

    describe('emitting multiple events', () => {
      beforeEach(function*() {
        yield sleep(5);
        emitter.emit("thing", "foo");
        emitter.emit("thing", "bar");
      });

      it('receives all of them', function*() {
        expect(yield iterator.next()).toEqual({ done: false, value: ["foo"]});
        expect(yield iterator.next()).toEqual({done: false, value: ["bar"] });
      });
    });
  });

  describe('subscribing to an EventTarget', () => {
    let target: FakeEventEmitter;
    let iterator: OperationIterator<[string], void>;
    let thingEvent: FakeEvent;

    beforeEach(function*(task) {
      target = new FakeEventEmitter();
      iterator = on<[string]>(target, "thing").subscribe(task);
    });

    describe('emitting an event', () => {
      beforeEach(function*() {
        thingEvent = new FakeEvent("thing");
        target.dispatchEvent(thingEvent);
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual([thingEvent]);
      });
    });
  });

  describe('chaining', () => {
    let emitter: EventEmitter;
    let iterator: OperationIterator<number, void>;

    beforeEach(function*(task) {
      emitter = new EventEmitter();
      iterator = on<[number]>(emitter, "thing").map(([value]) => value * 2).subscribe(task);
    });

    describe('emitting an event', () => {
      beforeEach(function*() {
        emitter.emit("thing", 12);
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual(24);
      });
    });
  });
});
