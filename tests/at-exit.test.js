/* global describe, beforeEach, it */
/* eslint require-yield: 0 */
/* eslint no-unreachable: 0 */

import expect from 'expect';

import { fork } from '../src/index';

describe('atExit', () => {
  let execution, thing;

  beforeEach(() => {
    execution = fork(function*() {
      return yield;
    });
    execution.atExit(() => {
      thing = "ran at exit";
    });
  });

  it('does not run before exit of exection', () => {
    expect(thing).toEqual(undefined);
  });

  it('is run if execution completes successfully', () => {
    execution.resume(123);
    expect(thing).toEqual("ran at exit");
  });

  it('is run if execution is halted', () => {
    execution.halt();
    expect(thing).toEqual("ran at exit");
  });

  it('is run if execution errors', () => {
    execution.throw(new Error("boom"));
    expect(thing).toEqual("ran at exit");
  });
});
