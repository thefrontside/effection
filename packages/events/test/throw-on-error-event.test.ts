import { describe, it, beforeEach } from 'mocha';
import * as expect from 'expect'

import { Context } from 'effection';
import { EventEmitter } from 'events';

import { World } from './helpers';

import { throwOnErrorEvent } from '../src/index';

describe("throwOnErrorEvent", () => {
  let emitter: EventEmitter;
  let context: Context;
  let error = new Error("moo");

  beforeEach(async () => {
    emitter = new EventEmitter();
    context = World.spawn(function*() {
      yield throwOnErrorEvent(emitter);
      yield;
    });
  });

  describe('throws an erro when the event occurs', () => {
    beforeEach(() => {
      emitter.emit("error", error);
    });

    it('throws error', async () => {
      await expect(context).rejects.toEqual(error);
    });
  });
});

