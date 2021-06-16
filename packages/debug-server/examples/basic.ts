import { sleep } from '@effection/core';
import { main } from '@effection/main';

import { runDebugServer } from '../src/index';

runDebugServer({ port: 47000 });

main(function *myProgram(task) {
  task.spawn(undefined, { labels: { name: 'someServer', frobs: 123, quantile: 'upper' } });
  task.spawn(undefined, { labels: { name: 'anotherTask' } });
  task.spawn(function* willComplete() {
    yield sleep(10000);
    return 123;
  });
  task.spawn(function* willBlowUp() {
    yield sleep(10000);
    throw new Error('boom!');
  }, { ignoreError: true });
  while(true) {
    yield sleep(1000);
  }
});
