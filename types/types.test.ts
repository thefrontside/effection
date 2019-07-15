import { expectType } from 'ts-expect';

import { timeout } from 'effection';

describe('api', () => {
  it('has the right type of timeout', () => {
    expectType<(number) => GeneratorFunction>(timeout);
  });

  // it('creates an raw effect right kind', () => {
  //   expectType<Effect<number>>(Effect.of((gate: Gate<number>) => gate));
  // });

  // it('has the right type when concatenating effects', () => {
  //   let empty = Effect.empty<number>();
  //   expectType<Effect<number>>(empty.concat(gate => gate));
  // });
});
