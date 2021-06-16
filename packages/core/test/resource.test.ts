import './setup';
import { describe, it } from 'mocha';
import expect from 'expect';

import { Task, Resource, run, sleep } from '../src/index';

export const myResource: Resource<{ status: string }> = {
  *init(scope: Task) {
    let container = { status: 'pending' }
    scope.spawn(function*() {
      yield sleep(5);
      container.status = 'active';
    });
    yield sleep(2)
    return container;
  }
}

export const metaResource: Resource<{ status: string }> = {
  *init(scope: Task) {
    return yield scope.spawn(myResource);
  }
}

export const magicMetaResource: Resource<{ status: string }> = {
  *init() {
    return yield myResource;
  }
}

describe('resource', () => {
  describe('with spawned resource', () => {
    it('runs resource in task scope', async () => {
      await run(function*(task) {
        let result = yield task.spawn(myResource);
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*(task) {
        return yield task.spawn(myResource);
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });

  describe('with yielded resource', () => {
    it('runs resource in task scope', async () => {
      await run(function*() {
        let result = yield myResource;
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*() {
        return yield myResource;
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });

  describe('with resource which spawns other resources', () => {
    it('runs resource in task scope', async () => {
      await run(function*() {
        let result = yield metaResource;
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*() {
        return yield metaResource;
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });

  describe('with resource which yields to other resources', () => {
    it('runs resource in task scope', async () => {
      await run(function*() {
        let result = yield magicMetaResource;
        expect(result.status).toEqual('pending');
        yield sleep(10);
        expect(result.status).toEqual('active');
      });
    });

    it('terminates resource when task completes', async () => {
      let result: { status: string } = await run(function*() {
        return yield magicMetaResource;
      });
      expect(result.status).toEqual('pending');
      await run(sleep(10));
      expect(result.status).toEqual('pending'); // is finished, should not switch to active
    });
  });
});
