import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run } from '../src/index';

class ExplodeError extends Error {
  name = 'ExplodeError';
}

describe('error', () => {
  it('wraps the error in an effection error', async () => {
    let error = await run(function *root() {
      yield function *child() {
        throw new ExplodeError('boom');
      }
    }).then(null, (err) => err);

    expect(error.name).toEqual('EffectionError');
    expect(error.message).toEqual('boom');
    expect(error.source.name).toEqual('ExplodeError');
    expect(error.source.message).toEqual('boom');
    expect(error.trace.length).toEqual(2);
    expect(error.trace[0].labels.name).toEqual('child');
    expect(error.trace[1].labels.name).toEqual('root');
  });
});
