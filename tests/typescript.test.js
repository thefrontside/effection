/* global describe, it */

import expect from 'expect';
import './typescript/matcher';

describe("Typescript types", function() {
  //Typescript compilation is slow!
  this.timeout(5000);

  it("can import types from effection", () => {
    expect('imports.ts').toCompile();
  });
  it('can execute anything that is a valid operation', () => {
    expect('execute.good.ts').toCompile();
  });
  it('can treat forks as promises', () => {
    expect('promise.ts').toCompile();
  });
  it('cannot execute things that are not operations', () => {
    expect('execute.bad.ts').not.toCompile();
  });

  it('can compile sequences that yield valid operations', () => {
    expect('sequence.good.ts').toCompile();
  });

  it('cannot compile sequences that yield invalid operations', () => {
    expect('sequence.bad.ts').not.toCompile();
  });
});
