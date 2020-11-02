/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { run, fork } from '../src/index';

describe('Root', () => {
  let execution, child, grandchild;

  beforeEach(() => {
    execution = run(function* () {
      child = yield fork(function*() {
        grandchild = yield fork();
      });
    });
  });

  it('returns root fork', () => {
    expect(execution.root).toEqual(execution);
    expect(child.root).toEqual(execution);
    expect(grandchild.root).toEqual(execution);
  });
});
