import * as expect from 'expect';
import { spawn } from './helpers';

import { createSubscription, Subscribeable, SymbolSubscribeable, forEach } from '../src/index';

interface Thing {
  name: string;
  type: string;
}

describe('subscribeable objects', () => {
  let subscribeable: Subscribeable<Thing, number>;

  beforeEach(() => {
    subscribeable = {
      [SymbolSubscribeable]: () => createSubscription(function*(publish) {
        publish({name: 'bob', type: 'person' });
        publish({name: 'alice', type: 'person' });
        publish({name: 'world', type: 'planet' });
        return 3;
      })
    }
  });

  describe('forEach', () => {
    let values: Thing[];
    let result: number;
    beforeEach(async () => {
      values = [];
      result = await spawn(forEach(subscribeable, function*(item) { values.push(item); }));
    });

    it('iterates through all members of the subscribeable', () => {
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
      let mapping = Subscribeable.from(subscribeable).map(item => `hello ${item.name}`);
      result = await spawn(forEach(mapping, function*(item) {
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
      let filtered = Subscribeable.from(subscribeable).filter(item => item.type === 'person');
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

  describe('first', () => {
    let first: string | undefined;

    describe('on a subscription with at least one element', () => {
      beforeEach(async () => {
        first = await spawn(Subscribeable.from(subscribeable).map(t => t.name).first())
      });
      it('returns the thing', () => {
        expect(first).toEqual('bob');
      });
    });

    describe('on an empty subscription', () => {
      beforeEach(async () => {
        let subscribeable = createSubscription<string, void>(function*() {});
        first = await spawn(Subscribeable.from(subscribeable).first());
      });
      it('returns undefined', () => {
        expect(first).toBeUndefined();
      });
    });
  });
});
