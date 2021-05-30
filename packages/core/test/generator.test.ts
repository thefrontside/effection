import * as expect from 'expect';
import { describe, it } from 'mocha';
import { run, Operation } from '../src/index';

describe('generators', () => {

  function *add(left: number, right: number): Operation<number> {
    return (yield Promise.resolve(left)) + (yield Promise.resolve(right));
  }

  it('can run as operations', async () => {
    expect(await run(add(2, 2))).toEqual(4);
  });

  it('is an error to yield to the same iterator more than once', async() => {
    await expect(run(function*() {
      let result = add(2, 2);
      yield result;
      yield result;
    })).rejects.toHaveProperty('name', 'DoubleEvalError');
  });

  it('is an error to run the same iterator more than once', async () => {
    let addition = add(2,2);
    await run(addition);
    expect(run(addition)).rejects.toHaveProperty('name', 'DoubleEvalError');
  });
})
