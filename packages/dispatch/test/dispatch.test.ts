import { describe, it, beforeEach } from '@effection/mocha';
import expect from 'expect';

import { sleep, spawn } from '@effection/core';
import { createDispatch, Dispatch } from '../src/index';

type Message = { text: string };

describe('Dispatch', () => {
  let dispatch: Dispatch<string, Message, number>;

  beforeEach(function*() {
    dispatch = createDispatch();
  });

  describe('subscribing to a queue', () => {
    it('receives message sent before subscribing', function*() {
      dispatch.send('foo', { text: 'hello' });
      dispatch.send('bar', { text: 'world' });

      expect(yield dispatch.get('foo').expect()).toEqual({ text: 'hello' });
      expect(yield dispatch.get('bar').expect()).toEqual({ text: 'world' });
    });

    it('receives message sent after subscribing', function*() {
      let foo = yield spawn(dispatch.get('foo').expect());
      let bar = yield spawn(dispatch.get('bar').expect());
      dispatch.send('foo', { text: 'hello' });
      dispatch.send('bar', { text: 'world' });

      expect(yield foo).toEqual({ text: 'hello' });
      expect(yield bar).toEqual({ text: 'world' });
    });

    it('closes with close value', function*() {
      let foo = yield spawn(dispatch.get('foo').join());
      let bar = yield spawn(dispatch.get('bar').join());
      dispatch.close(12);

      expect(yield foo).toEqual(12);
      expect(yield bar).toEqual(12);
    });

    it('closes specific subscription', function*() {
      let foo = yield spawn(dispatch.get('foo').next());
      let bar = yield spawn(dispatch.get('bar').next());
      dispatch.closeKey('foo', 12);
      dispatch.send('bar', { text: 'hello' });

      expect(yield foo).toEqual({ done: true, value: 12 });
      expect(yield bar).toEqual({ done: false, value: { text: 'hello' } });
    });
  });
});
