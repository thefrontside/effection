/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-non-null-assertion */
import { describe, beforeEach, it } from '@effection/mocha';
import { Operation, run, sleep, createFuture } from 'effection';
import expect from 'expect';

import { createSupervisor, Supervisor } from '../src/index';

function *crash() {
  throw new Error('boom');
}

const Live: Map<string, boolean> = new Map();
const Wait: Map<string, Promise<unknown>> = new Map();
const Complete: Map<string, (value: any) => void> = new Map();

function* track(name: string): Operation<void> {
  let semaphore = run();
  let { future, resolve } = createFuture();
  Live.set(name, true);
  Wait.set(name, semaphore);
  Complete.set(name, resolve);
  try {
    return yield future;
  } finally {
    Live.set(name, false);
    yield semaphore.halt();
  }
}

describe('createSupervisor', () => {
  it('starts given children', function*() {
    let supervisor = yield createSupervisor([
      { name: 'foo', run: track, args: ['foo'] },
      { name: 'bar', run: track, args: ['bar'] }
    ]);

    expect(Live.get('foo')).toEqual(true);
    expect(Live.get('bar')).toEqual(true);

    yield supervisor.halt();

    expect(Live.get('foo')).toEqual(false);
    expect(Live.get('bar')).toEqual(false);
  });

  describe('addChild', () => {
    it('can dynamically start a child', function*() {
      let supervisor = yield createSupervisor([]);

      supervisor.addChild({ name: 'foo', run: track, args: ['foo'] });

      expect(Live.get('foo')).toEqual(true);

      yield supervisor.halt();

      expect(Live.get('foo')).toEqual(false);
    });
  });

  describe('startChild', () => {
    it('starts a halted child', function*() {
      let supervisor = yield createSupervisor([
        { name: 'foo', run: track, args: ['foo'] },
        { name: 'bar', run: track, args: ['bar'] },
      ]);

      expect(Live.get('foo')).toEqual(true);
      expect(Live.get('bar')).toEqual(true);

      yield supervisor.haltChild('foo');

      expect(Live.get('foo')).toEqual(false);
      expect(Live.get('bar')).toEqual(true);

      supervisor.startChild('foo');

      expect(Live.get('foo')).toEqual(true);
      expect(Live.get('bar')).toEqual(true);
    });
  });

  describe('haltChild', () => {
    it('stops child', function*() {
      let supervisor = yield createSupervisor([
        { name: 'foo', run: track, args: ['foo'] },
        { name: 'bar', run: track, args: ['bar'] }
      ]);

      expect(Live.get('foo')).toEqual(true);
      expect(Live.get('bar')).toEqual(true);

      yield supervisor.haltChild('foo');

      expect(Live.get('foo')).toEqual(false);
      expect(Live.get('bar')).toEqual(true);
    });
  });

  describe('restartChild', () => {
    it('stops child', function*() {
      let supervisor = yield createSupervisor([]);

      let original = supervisor.addChild({ name: 'foo', run: track, args: ['foo'] });

      expect(Live.get('foo')).toEqual(true);

      let restarted = yield supervisor.restartChild('foo');

      expect(Live.get('foo')).toEqual(true);

      expect(original.id).not.toEqual(restarted.id);
    });
  });

  describe('haltAndRemoveChild', () => {
    it('stops child and removes specification', function*() {
      let supervisor = yield createSupervisor([{
        name: 'foo',
        run: track, args: ['foo'],
      }]);

      expect(Live.get('foo')).toEqual(true);

      yield supervisor.haltAndRemoveChild('foo');

      expect(Live.get('foo')).toEqual(false);

      expect(supervisor.specs).toEqual([]);
    });
  });

  describe('restart: oneForOne', () => {
    let supervisor: Supervisor;

    describe('with permanent child', () => {
      beforeEach(function*() {
        supervisor = yield createSupervisor([
          { name: 'child1', run: track, args: ['child1'] },
          { name: 'child2', run: track, args: ['child2'] },
        ]);
      });

      it('restarts crashed child when it crashes', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        child2.run(crash);

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(true);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
        expect(supervisor.getChild('child2')!.id).not.toEqual(child2.id);
      });

      it('restarts halted child when it halts', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        child2.halt();

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(true);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
        expect(supervisor.getChild('child2')!.id).not.toEqual(child2.id);
      });

      it('restarts completed child when it completes', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        Complete.get('child2')!('done');

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(true);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
        expect(supervisor.getChild('child2')!.id).not.toEqual(child2.id);
      });
    });

    describe('with transient child', () => {
      beforeEach(function*() {
        supervisor = yield createSupervisor([
          { name: 'child1', run: track, args: ['child1'] },
          { name: 'child2', run: track, args: ['child2'], type: 'transient' },
        ]);
      });

      it('restarts crashed child when it crashes', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        child2.run(crash);

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(true);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
        expect(supervisor.getChild('child2')!.id).not.toEqual(child2.id);
      });

      it('does not restart halted child when it halts', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        child2.halt();

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(false);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
      });

      it('does not restart completed child when it completes', function*() {
        let child1 = supervisor.getChild('child1')!;

        Complete.get('child2')!('done');

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(false);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
      });
    });

    describe('with temporary child', () => {
      beforeEach(function*() {
        supervisor = yield createSupervisor([
          { name: 'child1', run: track, args: ['child1'] },
          { name: 'child2', run: track, args: ['child2'], type: 'temporary' },
        ]);
      });

      it('does not restart crashed child when it crashes', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        child2.run(crash);

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(false);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
      });

      it('does not restart halted child when it halts', function*() {
        let child1 = supervisor.getChild('child1')!;
        let child2 = supervisor.getChild('child2')!;

        child2.halt();

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(false);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
      });

      it('does not restart halted child when it halts', function*() {
        let child1 = supervisor.getChild('child1')!;

        Complete.get('child2')!('done');

        yield sleep(5);

        expect(Live.get('child1')).toEqual(true);
        expect(Live.get('child2')).toEqual(false);

        expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
      });
    });
  });

  describe('restart: oneForAll', () => {
    let supervisor: Supervisor;

    beforeEach(function*() {
      supervisor = yield createSupervisor([
        { name: 'child1', run: track, args: ['child1'] },
        { name: 'child2', run: track, args: ['child2'] },
        { name: 'child3', run: track, args: ['child3'] },
        { name: 'child4', run: track, args: ['child4'], type: 'temporary' },
      ], { strategy: 'oneForAll' });
    });

    it('restarts all permanent children when it crashes', function*() {
      let child1 = supervisor.getChild('child1')!;
      let child2 = supervisor.getChild('child2')!;
      let child3 = supervisor.getChild('child3')!;

      child2.run(crash);

      yield sleep(5);

      expect(Live.get('child1')).toEqual(true);
      expect(Live.get('child2')).toEqual(true);
      expect(Live.get('child3')).toEqual(true);
      expect(Live.get('child4')).toEqual(false);

      expect(supervisor.getChild('child1')!.id).not.toEqual(child1.id);
      expect(supervisor.getChild('child2')!.id).not.toEqual(child2.id);
      expect(supervisor.getChild('child3')!.id).not.toEqual(child3.id);
    });
  });

  describe('restart: restForOne', () => {
    let supervisor: Supervisor;

    beforeEach(function*() {
      supervisor = yield createSupervisor([
        { name: 'child1', run: track, args: ['child1'] },
        { name: 'child2', run: track, args: ['child2'] },
        { name: 'child3', run: track, args: ['child3'] },
        { name: 'child4', run: track, args: ['child4'], type: 'temporary' },
      ], { strategy: 'restForOne' });
    });

    it('restarts children that come after crashed child', function*() {
      let child1 = supervisor.getChild('child1')!;
      let child2 = supervisor.getChild('child2')!;
      let child3 = supervisor.getChild('child3')!;

      child2.run(crash);

      yield sleep(5);

      expect(Live.get('child1')).toEqual(true);
      expect(Live.get('child2')).toEqual(true);
      expect(Live.get('child3')).toEqual(true);
      expect(Live.get('child4')).toEqual(false);

      expect(supervisor.getChild('child1')!.id).toEqual(child1.id);
      expect(supervisor.getChild('child2')!.id).not.toEqual(child2.id);
      expect(supervisor.getChild('child3')!.id).not.toEqual(child3.id);
    });
  });

  describe('autoShutdown: never', () => {
    let supervisor: Supervisor;

    beforeEach(function*() {
      supervisor = yield createSupervisor([
        { name: 'child1', run: track, args: ['child1'], type: 'temporary', significant: true },
        { name: 'child2', run: track, args: ['child2'], type: 'temporary', significant: true },
        { name: 'child3', run: track, args: ['child3'], type: 'temporary' },
      ], { shutdown: 'never' });
    });

    it('does not shut down supervisor as children are halted', function*() {
      let child1 = supervisor.getChild('child1')!;
      let child2 = supervisor.getChild('child2')!;

      child1.halt();

      yield sleep(5);
      expect(Live.get('child3')).toEqual(true);

      child2.halt();

      yield sleep(5);
      expect(Live.get('child3')).toEqual(true);
    });
  });

  describe('autoShutdown: anySignificant', () => {
    let supervisor: Supervisor;

    beforeEach(function*() {
      supervisor = yield createSupervisor([
        { name: 'child1', run: track, args: ['child1'], type: 'temporary', significant: true },
        { name: 'child2', run: track, args: ['child2'], type: 'temporary', significant: true },
        { name: 'child3', run: track, args: ['child3'], type: 'temporary' },
      ], { shutdown: 'anySignificant' });
    });

    it('shuts down supervisor when any significant task is halted', function*() {
      let child2 = supervisor.getChild('child2')!;

      child2.halt();

      yield sleep(5);
      expect(Live.get('child3')).toEqual(false);

      yield supervisor.resourceTask;
    });
  });

  describe('autoShutdown: allSignificant', () => {
    let supervisor: Supervisor;

    beforeEach(function*() {
      supervisor = yield createSupervisor([
        { name: 'child1', run: track, args: ['child1'], type: 'temporary', significant: true },
        { name: 'child2', run: track, args: ['child2'], type: 'temporary', significant: true },
        { name: 'child3', run: track, args: ['child3'], type: 'temporary' },
      ], { shutdown: 'allSignificant' });
    });

    it('shuts down supervisor when all significant tasks are halted', function*() {
      let child1 = supervisor.getChild('child1')!;
      let child2 = supervisor.getChild('child2')!;

      child1.halt();

      yield sleep(5);
      expect(Live.get('child3')).toEqual(true);

      child2.halt();

      yield sleep(5);
      expect(Live.get('child3')).toEqual(false);

      yield supervisor.resourceTask;
    });
  });
});
