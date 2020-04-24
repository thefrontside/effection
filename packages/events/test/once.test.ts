import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { Context } from 'effection';
import { EventEmitter } from 'events';

import { World } from './helpers';

import { once } from '../src/index';

describe("once()", () => {
  let context: Context;
  let source: EventEmitter;
  let params: unknown[] | undefined;

  beforeEach(() => {
    params = undefined;
    source = new EventEmitter();
    context = World.spawn(function*() {
      params = yield once(source, 'event');
    });
  });

  it('pauses before the event is received', () => {
    expect(params).toBeUndefined();
  });

  describe('emitting the event on which it is waiting', () => {
    beforeEach(() => {
      source.emit('event', 1,2,10);
    });

    it('returs the parameters of the event', () => {
      expect(params).toEqual([1,2,10]);
    });
  });

  describe('emitting an event on which it is not waiting', () => {
    beforeEach(() => {
      source.emit('non-event', 1, 2, 10);
    });
    it('remains paused', () => {
      expect(params).toBeUndefined();
    });
  });

  describe('shutting down the context and then emitting the event on which it is waiting', () => {
    beforeEach(() => {
      context.halt();
      source.emit('event', 1,2, 10);
    });

    it('never returns', () => {
      expect(params).toBeUndefined();
    });
  });
});
