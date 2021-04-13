import * as expect from 'expect';
import { describe, it } from 'mocha';
import { run, sleep, Operation } from '../src/index';

describe('generators', () => {

  function *add(left: number, right: number): Operation<Record<never, never>> {
    yield sleep(10);
    let sum =
      (yield Promise.resolve(left)) + (yield Promise.resolve(right));

    return { sum };
  }

  it('can run as operations', async () => {
    expect(await run(add(2, 2))).toEqual({ sum: 4 });
  });

  it('yields the same thing when run twice in the same operation', async() => {
    let result = add(2, 2);
    await run(function*() {
      expect(yield result).toBe(yield result);
    })
  });

  it('always yields the same thing when run in completely separate scopes', async () => {
    let result = add(2, 2);
    expect(await run(result)).toBe(await run(result));
  });

  it('yields a consistent result even when another operation requests its value before it is finished evaluating', async () => {
    await run(function*(scope) {
      let result = add(2, 2);
      let task = scope.spawn(result);
      expect(yield task).toBe(yield result);
    })
  });
})
