import './setup';
import { describe, it } from 'mocha';
import * as expect from 'expect';

import { run, sleep, Task, Resource } from '../src/index';

const myResource: Resource<{ status: string }> = {
  use(scope: Task) {
    return function*() {
      let container = { status: 'pending' }
      scope.spawn(function*() {
        yield sleep(5);
        container.status = 'active';
      });
      yield sleep(2)
      return container;
    }
  }
}

describe('use', () => {
  it('runs resource in task scope', async () => {
    await run(function*(task) {
      let result = yield task.use(myResource);
      expect(result.status).toEqual('pending');
      yield sleep(10);
      expect(result.status).toEqual('active');
    });
  });

  it('terminates resource when task completes', async () => {
    let result: { status: string } = await run(function*(task) {
      return yield task.use(myResource);
    });
    expect(result.status).toEqual('pending');
    await run(sleep(10));
    expect(result.status).toEqual('pending'); // is finished, should not switch to active
  });

  it('can terminate resource', async () => {
    await run(function*(task) {
      let resource = task.use(myResource);
      let result = yield resource;
      expect(result.status).toEqual('pending');
      yield resource.halt();
      yield sleep(10);
      expect(result.status).toEqual('pending'); // resource has been halted
    });
  });
});
