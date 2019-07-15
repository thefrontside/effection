/* global describe, beforeEach, it */
import mock from 'jest-mock';
import expect from 'expect';

import Gate from '../src/gate';

describe('Gate', () => {
  let gate;
  let spy;
  beforeEach(() => {
    spy = mock.fn();
  });

  describe('.open', () => {
    beforeEach(() => {
      gate = Gate.open('hi');
    });
    it('is marked as open', () => {
      expect(gate.isOpen).toEqual(true);
    });
    it('is not makred as closed', () => {
      expect(gate.isClosed).toEqual(false);
    });

    describe('running an ifOpen block', () => {
      beforeEach(() => {
        gate.ifOpen(spy);
      });
      it('invokes the block with the value behind the gate', () => {
        expect(spy).toHaveBeenCalledWith('hi');
      });
    });
    describe('running an ifClosed block', () => {
      beforeEach(() => {
        gate.ifClosed(spy);
      });
      it('does nothing', () => {
        expect(spy).not.toHaveBeenCalled();
      });
    });
  });

  describe('.closed', () => {
    beforeEach(() => {
      gate = Gate.closed();
    });
    it('is marked as closed', () => {
      expect(gate.isClosed).toEqual(true);
    });
    it('is not makred as open', () => {
      expect(gate.isOpen).toEqual(false);
    });
    describe('running an ifOpen block', () => {
      beforeEach(() => {
        gate.ifOpen(spy);
      });
      it('does nothing', () => {
        expect(spy).not.toHaveBeenCalled();
      });
    });
    describe('running an ifClosed block', () => {
      beforeEach(() => {
        gate.ifClosed(spy);
      });
      it('invokes invokes the block', () => {
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
