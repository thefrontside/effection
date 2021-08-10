import { sleep } from '@effection/core';
import { main } from '@effection/main';

import { runInspectServer } from '../src/index';

runInspectServer({ port: 47000 });

main(function *myProgram(task) {
  task.run(undefined, { labels: { name: 'someServer', frobs: 123, quantile: 'upper' } });
  task.run(undefined, { labels: { name: 'anotherTask' } });
  task.run(function* willComplete() {
    yield sleep(10000);
    return 123;
  });
  task.run(function* willBlowUp() {
    yield sleep(10000);
    throw new Error('boom!');
  }, { ignoreError: true });
  while(true) {
    yield sleep(1000);
  }
});
