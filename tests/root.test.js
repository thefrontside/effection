/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { fork } from '../src/index';

describe('Root', () => {
  let execution, child, grandchild;

  beforeEach((done) => {
    execution = fork(function() {
      child = fork(function*() {
        grandchild = fork(function*() {
          done();
          yield;
        });
      });
    });
  });

  it('returns root fork', () => {
    expect(execution.root).toEqual(execution);
    expect(child.root).toEqual(execution);
    expect(grandchild.root).toEqual(execution);
  });
});
