/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { run, fork } from '../src/index';

/**
 * Tests are performed on a tree that looks like this:
 *
 * [A,
 *   [B,
 *     [D],
 *     [E,
 *       [H]]],
 *   [C,
 *     [F, G]]]
 */

describe('Order of Shutdown Operations', () => {

  let Node, order;
  beforeEach(() => {
    order = [];

    Node = function Node(name, operations = []) {
      return ({ ensure, context, spawn }) => {
        Node[name] = context;
        ensure(() => order.push([name, context.state]));

        for (let operation of operations) {
          spawn(fork(operation));
        }
      };
    };

    run(
      Node('A', [
        Node('B', [
          Node('D'),
          Node('E', [ Node('H') ])
        ]),

        Node('C', [
          Node('F'),
          Node('G')
        ])
      ]));

    for (let name of Object.keys(Node)) {
      expect(Node[name]).toBeDefined();
    }

  });

  describe('when `H` encounters an error', () => {
    beforeEach(() => {
      Node.H.fail(new Error('H failed'));
    });

    it('tears down the tree in reverse upwards order', () => {
      expect(order).toEqual([
        ['H', 'errored'],
        ['E', 'errored'],
        ['D', 'halted'],
        ['B', 'errored'],
        ['G', 'halted'],
        ['F', 'halted'],
        ['C', 'halted'],
        ['A', 'errored']
      ]);
    });
  });


  describe('when the top of the tree is halted', () => {
    beforeEach(() => {
      Node.A.halt();
    });

    it('tears down the tree in reverse upwards order', () => {
      expect(order).toEqual([
        ['G', 'halted'],
        ['F', 'halted'],
        ['C', 'halted'],
        ['H', 'halted'],
        ['E', 'halted'],
        ['D', 'halted'],
        ['B', 'halted'],
        ['A', 'halted']
      ]);
    });
  });

  describe('when an error occurs in the middle of the tree', () => {
    beforeEach(() => {
      Node.C.fail(new Error('`C` failed'));
    });

    it('tears down the tree in reverse upwards order', () => {
      expect(order).toEqual([
        ['G', 'halted'],
        ['F', 'halted'],
        ['C', 'errored'],
        ['H', 'halted'],
        ['E', 'halted'],
        ['D', 'halted'],
        ['B', 'halted'],
        ['A', 'errored']
      ]);
    });
  });
});
