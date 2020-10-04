import * as expect from 'expect';
import { describe, it, beforeEach } from 'mocha';
import { spawn } from './helpers';

import { createSubscription, Subscribable, SymbolSubscribable, subscribe } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

describe('subscribable objects', () => {
  let source: Subscribable<Thing, number>;

  beforeEach(() => {
    source = {
      *[SymbolSubscribable]() {
        return yield createSubscription(function*(publish) {
          publish({name: 'bob', type: 'person' });
          publish({name: 'alice', type: 'person' });
          publish({name: 'world', type: 'planet' });
          return 3;
        })
      }
    }
  });

  describe('forEach', () => {
    let values: Thing[];
    let result: number;
    beforeEach(async () => {
      values = [];
      result = await spawn(subscribe(source).forEach(function*(item) { values.push(item); }));
    });

    it('iterates through all members of the subscribable', () => {
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
        {name: 'world', type: 'planet' },
      ])
    });

    it('returns the original result', () => {
      expect(result).toEqual(3);
    });

  });

  describe('map', () => {
    let values: string[];
    let result: number;

    beforeEach(async () => {
      values = [];
      let mapping = subscribe(source).map(item => `hello ${item.name}`);
      result = await spawn(subscribe(mapping).forEach(function*(item) {
        values.push(item);
      }));
    });

    it('maps the values', () => {
      expect(values).toEqual([
        'hello bob',
        'hello alice',
        'hello world'
      ]);
    });

    it('preserves the return type', () => {
      expect(result).toEqual(3);
    });
  });

  describe('filter', () => {
    let values: Thing[];
    let result: number;

    beforeEach(async () => {
      values = [];
      let filtered = subscribe(source).filter(item => item.type === 'person');
      result = await spawn(filtered.forEach(function*(item) { values.push(item) }));
    });

    it('filters the items', () => {
      expect(values).toEqual([
        {name: 'bob', type: 'person' },
        {name: 'alice', type: 'person' },
      ])
    });

    it('preserves the return type', () => {
      expect(result).toEqual(3);
    });
  });

  describe('match', () => {
    describe('with simple filter', () => {
      let values: Thing[];
      let result: number;

      beforeEach(async () => {
        values = [];
        let filtered = subscribe(source).match({ type: 'person' });
        result = await spawn(filtered.forEach(function*(item) { values.push(item) }));
      });

      it('filters the items', () => {
        expect(values).toEqual([
          {name: 'bob', type: 'person' },
          {name: 'alice', type: 'person' },
        ]);
      });

      it('preserves the return type', () => {
        expect(result).toEqual(3);
      });
    });

    describe('with deep filter', () => {
      let values: Array<{ thing: Thing }>;
      let result: number;

      beforeEach(async () => {
        values = [];
        let filtered = subscribe(source).map((t) => ({ thing: t })).match({ thing: { type: 'person' } });
        result = await spawn(filtered.forEach(function*(item) { values.push(item) }));
      });

      it('filters the items', () => {
        expect(values).toEqual([
          { thing: {name: 'bob', type: 'person' } },
          { thing: {name: 'alice', type: 'person' } }
        ]);
      });

      it('preserves the return type', () => {
        expect(result).toEqual(3);
      });
    });
  });

  describe('first', () => {
    let first: string | undefined;

    describe('on a subscription with at least one element', () => {
      beforeEach(async () => {
        first = await spawn(subscribe(source).map(t => t.name).first())
      });
      it('returns the thing', () => {
        expect(first).toEqual('bob');
      });
    });

    describe('on an empty subscription', () => {
      beforeEach(async () => {
        let empty = createSubscription<string, void>(function*() {});
        first = await spawn(subscribe(empty).first());
      });
      it('returns undefined', () => {
        expect(first).toBeUndefined();
      });
    });
  });
});
