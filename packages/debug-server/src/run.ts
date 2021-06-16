import { createDebugServer, Options } from './server';
import { spawn, createTask } from '@effection/core';
import { once } from '@effection/events';

export function runDebugServer(options: Options = {}) {
  // create a task for the debugger, which lives outside of the Effection root
  // so the debugger does not end up debugging itself
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
    let server = yield createDebugServer(options);
    console.debug(`[effection] debugger available on http://localhost:${server.port}`);
    yield
  }, { labels: { name: 'debugger' } });
  task.start();
  task.catchHalt().catch((err: Error) => {
    console.error("*** EFFECTION DEBUGGER ENCOUNTERED UNEXPECTED ERROR");
    console.error(err);
  });
};
