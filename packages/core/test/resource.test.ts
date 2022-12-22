import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { Task, Resource, run, sleep, spawn } from '../src/index';

export const myResource: Resource<{ status: string }> = {
  name: 'myResource',
  *init(scope: Task) {
    let container = { status: 'pending' };
    scope.run(function*() {
      yield sleep(5);
      container.status = 'active';
    });
    yield sleep(2);
    return container;
  }
};

export const metaResource: Resource<{ status: string }> = {
  name: 'metaResource',
  *init(scope: Task) {
    return yield scope.run(myResource);
  }
};

export const magicMetaResource: Resource<{ status: string }> = {
  name: 'magicMetaResource',
  *init() {
    return yield myResource;
  }
};

describe('resource', () => {
  describe('with spawned resource', () => {
    it('runs resource in task scope', async () => {
      await run(function*(task) {
        let result: { status: string } = yield task.run(myResource);
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('throws init error', async () => {
      let task = run(function*(inner) {
        inner.run({
          *init() {
            throw new Error('moo');
          }
        });
        yield;
      });

      await expect(task).rejects.toHaveProperty('message', 'moo');
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*(task) {
        return yield task.run(myResource);
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });

    it('enables access to resource task', async () => {
      await run(function*(task) {
        let initTask = task.run(myResource);
        let result: { status: string } = yield initTask;

        expect(initTask.resourceTask?.state).toEqual('running');
        expect(initTask.resourceTask?.labels.name).toEqual('myResource');

        yield initTask.resourceTask?.halt();
        yield sleep(10);
        expect(result.status).toEqual('pending');
      });
    });

    it('can halt resource task', async () => {
      let result = { status: 'pending' };
      await run(function*(task) {
        let resourceConstructor = task.run({
          *init() {
            yield spawn(function*() {
              yield sleep(5);
              result.status = 'active';
            });
            return "123";
          }
        });
        resourceConstructor.halt();
        yield sleep(10);
      });
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });

  describe('with yielded resource', () => {
    it('runs resource in task scope', async () => {
      await run(function*() {
        let result: { status: string } = yield myResource;
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('can catch init error', async () => {
      await run(function*() {
        let error: Error | undefined = undefined;
        try {
          yield {
            *init() {
              throw new Error('moo');
            }
          };
        } catch(err) {
          error = err as Error;
        }
        expect(error?.message).toEqual('moo');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*() {
        let r: { status: string } = yield myResource;
        return r;
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });

  describe('with resource which spawns other resources', () => {
    it('runs resource in task scope', async () => {
      await run(function*() {
        let result: { status: string } = yield metaResource;
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*() {
        let r: { status: string } = yield metaResource;
        return r;
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });

  describe('with resource which yields to other resources', () => {
    it('runs resource in task scope', async () => {
      await run(function*() {
        let result: { status: string } = yield magicMetaResource;
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*() {
        let r: { status: string } = yield magicMetaResource;
        return r;
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });
});
