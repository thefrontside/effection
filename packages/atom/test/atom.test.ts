import { describe, beforeEach, it } from '@effection/mocha';
import * as expect from 'expect';
import { createAtom } from '../src/atom';
import { Stream, OperationIterator } from '@effection/subscription';
import { Slice } from '../src/types';

type TestRunAgentState = {
  status: "pending" | "running" | "finished" | "errored";
  platform?: {
    type: string;
    vendor: string;
  };
};

export type TestRunState = {
  status: "on" | "off";
  agents: Record<string, TestRunAgentState>;
};

const state: TestRunState = {
  status: "on",
  agents: {
    "agent-1": {
      status: "pending",
      platform: {
        type: "desktop",
        vendor: "Apple"
      }
    },
    "agent-2": {
      status: "running",
      platform: {
        type: "desktop",
        vendor: "Microsoft"
      }
    }
  }
};

describe('@bigtest/atom createAtom', () => {
  describe('Atom with none', () => {
    let subject: Slice<undefined>;
    beforeEach(function*() {
      subject = createAtom(undefined);
    });

    describe('.get()', () => {
      it('gets the current state', function*() {
        expect(subject.get()).toBeUndefined();
      });
    });
  });

  let subject: Slice<TestRunState>;

  describe('Atom with some', () => {
    beforeEach(function*() {
      subject = createAtom(state);
    });

    describe('.get()', () => {
      it('gets the current state', function*() {
        expect(subject.get()).toEqual(state);
      });
    });
  });

  describe('.set()', () => {
    beforeEach(function*() {
      subject = createAtom(state);
    });

    beforeEach(function*() {
      subject.set({...state, status: "off"});
    });

    it('updates the current state', function*() {
      expect(subject.get()?.status).toEqual("off");
    });
  });

  describe('.update()', () => {
    beforeEach(function*() {
      subject = createAtom(state);
    });

    beforeEach(function*() {
      subject.update(previous => {
        expect(previous).toEqual(state);
        return {...previous, status: "off"}
      });
    });

    it('updates the current state', function*() {
      expect(subject.get()?.status).toEqual("off");
    });
  });

  describe('.slice()', () => {
    let subject: Slice<TestRunState>;

    beforeEach(function*() {
      subject = createAtom(state);
    });

    it('returns one level deep', function*() {
      let result = subject.slice('agents');

      expect(result.get()).toEqual(state.agents);
    });

    it('returns a slice of the Atom with the given path', function*() {
      let result = subject.slice('agents', "agent-2", 'status');

      expect(result.get()).toEqual("running");
    });

    it('set', function*() {
      let result = subject.slice('agents', "agent-2", "status");

      result.set('errored');

      expect(result.get()).toBe('errored');
    })
  });


  type State = { foo: string};
  describe('subscribe', () => {
    let subject: Slice<State>;
    let iterator: OperationIterator<State, undefined>;

    beforeEach(function*(world) {
      subject = createAtom({foo: 'bar'});
      iterator = subject.subscribe(world);

      subject.update(() => ({ foo: 'bar' }));
      subject.update(() => ({ foo: 'baz' }));
      subject.update(() => ({ foo: 'quox' }));
    });

    it('iterates over emitted states', function*() {
      expect(yield iterator.next()).toEqual({ done: false, value: { foo: 'bar' } });
      expect(yield iterator.next()).toEqual({ done: false, value: { foo: 'baz' } });
      expect(yield iterator.next()).toEqual({ done: false, value: { foo: 'quox' } });
    });
  });

  describe('.once()', () => {
    let result: Promise<State>;
    let subject: Slice<State>;

    describe('when initial state matches', () => {
      beforeEach(function*(world) {
        subject = createAtom({foo: 'bar'});
        result = world.spawn(subject.once((state) => state.foo === 'bar'));

        subject.update(() => ({ foo: 'baz' }));
      });

      it('gets the first state that passes the given predicate', function*() {
        expect(yield result).toEqual({ foo: 'bar' });
        expect(subject.get()).toEqual({ foo: 'baz' });
      });
    });

    describe('when initial state does not match', () => {
      beforeEach(function*(world) {
        result = world.spawn(subject.once((state) => state.foo === 'baz'));

        subject.update(() => ({ foo: 'bar' }));
        subject.update(() => ({ foo: 'baz' }));
        subject.update(() => ({ foo: 'quox' }));
      });

      it('gets the first state that passes the given predicate', function*() {
        expect(yield result).toEqual({ foo: 'baz' });
        expect(subject.get()).toEqual({ foo: 'quox' });
      });
    });
  });

  type Subject = {
    foo: string;
  }

  describe('subscribe - unique state publish', () => {
    let iterator: OperationIterator<Subject>;

    beforeEach(function*(world) {
      let bar = { foo: 'bar' };
      let baz = { foo: 'baz' };
      let qux = { foo: 'qux' };

      let subject = createAtom(bar);
      iterator = subject.subscribe(world);

      subject.update(() => bar);
      subject.update(() => bar);
      subject.update(() => baz);
      subject.update(() => baz);
      subject.update(() => qux);
      subject.update(() => bar);
    });

    it('should only publish unique state changes', function*() {
      expect(yield iterator.next()).toEqual({ done: false, value: { foo: 'baz' } });
      expect(yield iterator.next()).toEqual({ done: false, value: { foo: 'qux' } });
      expect(yield iterator.next()).toEqual({ done: false, value: { foo: 'bar' } });
    });
  });
});
