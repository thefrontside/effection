import { createInspectServer, Options } from './server';
import { spawn, createTask } from '@effection/core';
import { once } from '@effection/events';

export function runInspectServer(options: Options = {}): void {
  // create a task for the inspector, which lives outside of the Effection root
  // so the inspector does not end up inspecting itself
  let task = createTask(function*(scope) {
    yield spawn(function*() {
      yield once(process, 'SIGINT');
      scope.halt();
    });
    yield spawn(function*() {
      yield once(process, 'SIGTERM');
      scope.halt();
    });
    yield spawn(function*() {
      yield once(process, 'exit');
      scope.halt();
    });
    let server = yield createInspectServer(options);
    console.debug(`[effection] inspector available on http://localhost:${server.port}/ui/`);
    yield;
  }, { labels: { name: 'inspector' } });
  task.start();
  task.catchHalt().catch((err: Error) => {
    console.error("*** EFFECTION INSPECTOR ENCOUNTERED UNEXPECTED ERROR");
    console.error(err);
  });
}
