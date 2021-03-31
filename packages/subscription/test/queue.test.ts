import * as expect from 'expect';
import { describe, it, beforeEach, captureError } from '@effection/mocha';

import { createQueue, Queue } from '../src/index';
import { abortAfter } from './helpers';

interface Thing {
  name: string;
  type: string;
}

describe('Queue', () => {
  let queue: Queue<Thing, number>;
  let emptyQueue: Queue<Thing, number>;

  beforeEach(function*() {
    queue = createQueue<Thing, number>();
    queue.send({name: 'bob', type: 'person' });
    queue.send({name: 'alice', type: 'person' });
    queue.send({name: 'world', type: 'planet' });
    queue.close(3);
    emptyQueue = createQueue<Thing, number>();
    emptyQueue.close(12);
  });

  describe('send', () => {
    it('sends value to an already waiting listener', function*(world) {
      let anotherQueue = createQueue<string>();
      let listener = world.spawn(anotherQueue.expect());
      anotherQueue.send('hello');
      expect(yield listener).toEqual('hello');
    });

    it('only sends value to one listener if there are multiple', function*(world) {
      let anotherQueue = createQueue<string>();
      let listener1 = world.spawn(abortAfter(anotherQueue.expect(), 10));
      let listener2 = world.spawn(abortAfter(anotherQueue.expect(), 10));
      anotherQueue.send('hello');
      expect([yield listener1, yield listener2].filter(Boolean)).toEqual(['hello']);
    });

    it('queues value if there is no listener', function*() {
      let anotherQueue = createQueue<string>();
      anotherQueue.send('hello');
      expect(yield anotherQueue.expect()).toEqual('hello');
    });
  });


  describe('first', () => {
    it('returns the first item in the queue', function*() {
      expect(yield queue.first()).toEqual({ name: 'bob', type: 'person' });
    });

    it('returns undefined if the queue is empty', function*() {
      expect(yield emptyQueue.first()).toEqual(undefined);
    });
  });

  describe('expect', () => {
    it('returns the first item in the queue', function*() {
      expect(yield queue.expect()).toEqual({ name: 'bob', type: 'person' });
    });

    it('throws an error if the queue is empty', function*() {
      expect(yield captureError(emptyQueue.expect())).toHaveProperty('message', 'expected to contain a value');
    });
  });

  describe('forEach', () => {
    let values: Thing[];
    let result: number;

    beforeEach(function*() {
      values = [];
      result = yield queue.forEach((item) => function*() { values.push(item); });
    });

    it('iterates through all members of the subscribable', function*() {
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
        {name: 'world', type: 'planet' },
      ])
    });

    it('returns the original result', function*() {
      expect(result).toEqual(3);
    });
  });

  describe('join', () => {
    let result: number;

    beforeEach(function*() {
      result = yield queue.join();
    });

    it('returns the original result', function*() {
      expect(result).toEqual(3);
    });
  });

  describe('collect', () => {
    it('collects values into a synchronous iterator', function*() {
      let iterator: Iterator<Thing, number> = yield queue.collect();
      expect(iterator.next()).toEqual({ done: false, value: { name: 'bob', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'alice', type: 'person' } });
      expect(iterator.next()).toEqual({ done: false, value: { name: 'world', type: 'planet' } });
      expect(iterator.next()).toEqual({ done: true, value: 3 });
    });
  });

  describe('toArray', () => {
    it('collects values into an array', function*() {
      let result = yield queue.toArray();
      expect(result).toEqual([
        { name: 'bob', type: 'person' },
        { name: 'alice', type: 'person' },
        { name: 'world', type: 'planet' },
      ]);
    });
  });
});
