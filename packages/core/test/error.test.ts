import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { run, sleep } from '../src/index';

class ExplodeError extends Error {
  name = 'ExplodeError';
}

describe('error', () => {
  it('wraps the error in an effection error', async () => {
    let error = await run(function *root() {
      yield function *child() {
        throw new ExplodeError('boom');
      };
    }).then(null, (err) => err);

    expect(error.name).toEqual('ExplodeError');
    expect(error.message).toEqual('boom');
    expect(error.effectionTrace.length).toEqual(2);
    expect(error.effectionTrace[0].labels.name).toEqual('child');
    expect(error.effectionTrace[1].labels.name).toEqual('root');
  });

  it('yields unwrapped error', async () => {
    await run(function *root() {
      try {
        yield function *child() {
          throw new ExplodeError('boom');
        };
      } catch(err) {
        expect(err.name).toEqual('ExplodeError');
      }
    });
  });

  it('yields unwrapped error thrown from task', async () => {
    let other = run(function *child() {
      yield sleep(1);
      throw new ExplodeError('boom');
    });
    await run(function *root() {
      try {
        yield other;
      } catch(err) {
        expect(err.name).toEqual('ExplodeError');
      }
    });
  });
});
