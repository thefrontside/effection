import { describe, it, beforeEach } from '@effection/mocha';
import expect from 'expect';
import { createAtom } from '../src/atom';
import { Subscription } from 'effection';
import { Slice } from '../src/types';

type Data = { data: string };

describe('@bigtest/atom Slice', () => {
  describe('with no data', () => {
    let atom: Slice<{ outer: Data }>;
    let slice: Slice<string>;

    beforeEach(function*() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      atom = createAtom(undefined as any);
      slice = atom.slice('outer', 'data');
    });

    it('should not blow up with no state and get', function*() {
       expect(slice.get()).toBeUndefined();
    });

    it('should not blow up with no state and set', function*() {
      slice.set('houston we have a problem');

      expect(slice.get()).toBeUndefined();
    });
  });

  describe('with data', () => {
    let atom: Slice<{ outer: Data }>;
    let slice: Slice<Data>;

    beforeEach(function*() {
      atom = createAtom({ outer: { data: "baz" } });
      slice = atom.slice('outer');
    });

    it('should return the slice data', function*() {
      expect(slice.get()).toEqual({ data: 'baz' });
    });

    it('should set the slice and atom', function*() {
      slice.set({ data: 'bar' });

      expect(slice.get()).toEqual({ data: 'bar' });
      expect(atom.get()).toEqual({ outer: { data: 'bar' } });
    });

    it('should update the slice', function*() {
      slice.update((prev) => ({ data: `${prev.data}-bar` }));

      expect(slice.get()).toEqual({ data: 'baz-bar' });
      expect(atom.get()).toEqual({ outer: { data: 'baz-bar' } });
    });
  });

  describe('nested slices', () => {
    let atom: Slice<{ outer: Data }>;
    let slice1: Slice<Data>;
    let slice2: Slice<string>;

    beforeEach(function*() {
      atom = createAtom({ outer: { data: "baz" } });
      slice1 = atom.slice('outer');
      slice2 = slice1.slice('data');
    });

    it('further slices the slice', function*() {
      expect(slice2.get()).toEqual('baz');
    });

    describe('updating the returned slice', () => {
      beforeEach(function*() {
        slice2.update(() => {
          return 'blah';
        });
      });

      it('updates the current state', function*() {
        expect(slice2.get()).toEqual('blah');
      });

      it('updates the parent slice state', function*() {
        expect(slice1.get()).toEqual({ data: 'blah' });
      });

      it('updates the atom state', function*() {
        expect(atom.get()).toEqual({ outer: { data: 'blah' } });
      });
    });
  });

  describe('subscribe', () => {
    let atom: Slice<Data>;
    let slice: Slice<string>;
    let subscription: Subscription<string, undefined>;

    beforeEach(function*(world) {
      atom = createAtom({ data: 'foo' });
      slice = atom.slice('data');
      subscription = slice.subscribe(world);

      slice.update(() => 'bar');
      slice.update(() => 'baz');
      slice.update(() => 'quox');
    });

    it('iterates over initial and emitted states', function*() {
      expect(yield subscription.next()).toEqual({ done: false, value: 'foo' });
      expect(yield subscription.next()).toEqual({ done: false, value: 'bar' });
      expect(yield subscription.next()).toEqual({ done: false, value: 'baz' });
      expect(yield subscription.next()).toEqual({ done: false, value: 'quox' });
    });
  });

  describe('subscribe - unique state publish', () => {
    let atom: Slice<Data>;
    let slice: Slice<string>;
    let iterator: Subscription<string>;

    beforeEach(function*(world) {
      atom = createAtom({ data: 'foo' });
      slice = atom.slice('data');

      iterator = slice.subscribe(world);

      // foo is the initial value, it should only appear once
      // as the first result
      slice.update(() => 'foo');
      slice.update(() => 'bar');
      slice.update(() => 'bar');
      slice.update(() => 'baz');
      slice.update(() => 'baz');
      // back to foo, should exist in the result
      slice.update(() => 'foo');
    });

    it('should only publish the initial state and unique state changes', function*() {
      expect(yield iterator.next()).toEqual({ done: false, value: 'foo' });
      expect(yield iterator.next()).toEqual({ done: false, value: 'bar' });
      expect(yield iterator.next()).toEqual({ done: false, value: 'baz' });
      expect(yield iterator.next()).toEqual({ done: false, value: 'foo' });
    });
  });

  describe('deep slices', () => {
    it('should resolve deeply nested properties', function*() {
      let atom = createAtom({
        some: {
          very: {
            deep: [
              { nested: 'structure' },
              { nested: 'data' },
            ]
          }
        }
      });
      expect(atom.slice('some').slice('very').slice('deep').slice(0).slice('nested').get()).toBe('structure');
      expect(atom.slice('some', 'very', 'deep', 1, 'nested').get()).toBe('data');
    });
  });

  describe('removal', () => {
    it('should remove a slice from a record', function*() {
      let atom = createAtom<Record<string, number>>({ foo: 1, bar: 2 });
      let slice = atom.slice('foo');

      expect(atom.get()).toEqual({ foo: 1, bar: 2 });
      slice.remove();
      expect(atom.get()).toEqual({ bar: 2 });
    });

    it('should remove a slice from an array', function*() {
      let atom = createAtom<string[]>(['foo', 'bar']);
      let slice = atom.slice(0);

      expect(atom.get()).toEqual(['foo', 'bar']);
      slice.remove();
      expect(atom.get()).toEqual([undefined, 'bar']); // TODO: shouldn't this remove the item entirely?!
    });
  });
});
