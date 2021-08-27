import { describe, beforeEach, it } from '@effection/mocha';
import expect from 'expect'

import { OperationIterator } from 'effection';
import { createDuplexChannel, DuplexChannel } from '../src/index';

describe("createDuplexChannel", () => {
  let left: DuplexChannel<number, string>;
  let right: DuplexChannel<string, number>;

  beforeEach(function*() {
    [left, right] = createDuplexChannel<number, string>();
  });

  it('can destructure channels as a record', function*(world) {
    let [{ send }, { stream }] = createDuplexChannel<number, string>();
    let subscription = stream.subscribe(world);
    send("hello");
    expect(yield subscription.next()).toEqual({ done: false, value: "hello" })
  });

  describe('sending a message to left', () => {
    let subscription: OperationIterator<string, undefined>;

    beforeEach(function*(world) {
      subscription = right.subscribe(world);
      left.send("hello");
    });

    it('is received on right', function*() {
      expect(yield subscription.next()).toEqual({ done: false, value: "hello" })
    });
  });

  describe('sending a message to right', () => {
    let subscription: OperationIterator<number, undefined>;

    beforeEach(function*(world) {
      subscription = left.subscribe(world);
      right.send(123);
    });

    it('is received on right', function*() {
      expect(yield subscription.next()).toEqual({ done: false, value: 123 })
    });
  });

  describe('closing the channel', () => {
    let txSubscription: OperationIterator<number, undefined>;
    let rxSubscription: OperationIterator<string, undefined>;

    beforeEach(function*(world) {
      txSubscription = left.subscribe(world);
      rxSubscription = right.subscribe(world);
    });

    describe('on right', () => {
      it('closes both ends', function*() {
        right.close();
        expect(yield rxSubscription.next()).toEqual({ done: true, value: undefined })
        expect(yield txSubscription.next()).toEqual({ done: true, value: undefined })
      });
    });

    describe('on left', () => {
      it('closes both ends', function*() {
        left.close();
        expect(yield rxSubscription.next()).toEqual({ done: true, value: undefined })
        expect(yield txSubscription.next()).toEqual({ done: true, value: undefined })
      });
    });
  });
});
