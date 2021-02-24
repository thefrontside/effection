import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { sleep, Context } from '@effection/core';
import { EventEmitter } from 'events';

import { World } from './helpers';

import { once } from '../src/index';

describe("once()", () => {
  let context: Context;
  let source: EventEmitter;

  beforeEach(() => {
    source = new EventEmitter();
    context = World.spawn(function*() {
      return yield once(source, 'event');
    });
  });

  it('pauses before the event is received', () => {
    expect(context.state).toEqual("running");
  });

  describe('emitting the event on which it is waiting', () => {
    beforeEach(() => {
      source.emit('event', 1,2,10);
    });

    it('returs the parameters of the event', async () => {
      await expect(context).resolves.toEqual([1,2,10]);
    });
  });

  describe('emitting an event on which it is not waiting', () => {
    beforeEach(async () => {
      source.emit('non-event', 1, 2, 10);
      await World.spawn(sleep(10));
    });

    it('remains paused', () => {
      expect(context.state).toEqual('running');
    });
  });

  describe('shutting down the context and then emitting the event on which it is waiting', () => {
    beforeEach(() => {
      context.halt();
      source.emit('event', 1, 2, 10);
    });

    it('never returns', () => {
      expect(context.result).toBeUndefined();
    });
  });
});
