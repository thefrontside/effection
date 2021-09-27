import { describe, it, beforeEach } from '@effection/mocha';
import expect from 'expect'

import { sleep } from '@effection/core';
import { Subscription } from '@effection/subscription';
import { EventEmitter } from 'events';

import { on, onEmit } from '../src/index';
import { FakeEventEmitter, FakeEvent } from './fake-event-target';

describe("on()", () => {
  describe('subscribe to an EventEmitter', () => {
    let emitter: EventEmitter;
    let iterator: Subscription<string, void>;

    beforeEach(function*(task) {
      emitter = new EventEmitter();
      iterator = on<string>(emitter, "thing").subscribe(task);
    });

    describe('emitting an event', () => {
      beforeEach(function*() {
        emitter.emit("thing", "123");
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual("123");
      });
    });

    describe('emitting an event efter subscribing', () => {
      beforeEach(function*() {
        yield sleep(5);
        emitter.emit("thing", "123");
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual("123");
      });
    });

    describe('emitting multiple events', () => {
      beforeEach(function*() {
        yield sleep(5);
        emitter.emit("thing", "foo");
        emitter.emit("thing", "bar");
      });

      it('receives all of them', function*() {
        expect(yield iterator.next()).toEqual({ done: false, value: "foo" });
        expect(yield iterator.next()).toEqual({done: false, value: "bar" });
      });
    });
  });

  describe('subscribing to an EventTarget', () => {
    let target: FakeEventEmitter;
    let iterator: Subscription<string, void>;
    let thingEvent: FakeEvent;

    beforeEach(function*(task) {
      target = new FakeEventEmitter();
      iterator = on<string>(target, "thing").subscribe(task);
    });

    describe('emitting an event', () => {
      beforeEach(function*() {
        thingEvent = new FakeEvent("thing");
        target.dispatchEvent(thingEvent);
      });

      it('receives event', function*() {
        let { value } = yield iterator.next();
        expect(value).toEqual(thingEvent);
      });
    });
  });

  describe('chaining', () => {
    let emitter: EventEmitter;
    let iterator: Subscription<number, void>;

    beforeEach(function*(task) {
      emitter = new EventEmitter();
      iterator = on<number>(emitter, "thing").map(value => value * 2).subscribe(task);
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

describe('onEmit()', () => {
  let emitter: EventEmitter;
  let iterator: Subscription<[string], void>;

  beforeEach(function*(task) {
    emitter = new EventEmitter();
    iterator = onEmit<[string]>(emitter, "things").subscribe(task);
    emitter.emit("things", "one", "two", "three");
  });

  it('receives all the arguments of the event', function*() {
    let { value } = yield iterator.next();
    expect(value).toEqual(["one", "two", "three"]);
  });
});
